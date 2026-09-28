#!/usr/bin/env node
/**
 * Batch synthetic HuntPlan kit audit (local derive + buildRows, no LLM / network weather).
 * Usage: node scripts/batch-kit-audit.mjs [--count 5000] [--seed 42]
 */
import { createJiti } from "jiti";
import { fileURLToPath } from "url";
import fs from "fs";
import path from "path";

const root = path.dirname(fileURLToPath(import.meta.url)) + "/..";
const jiti = createJiti(root + "/scripts/batch-kit-audit.mjs", { interopDefault: true });

const { blazeFor } = await jiti.import("../src/lib/hunt/blaze.ts");
const { buildRows } = await jiti.import("../src/lib/hunt/kit.ts");
const {
  REGIONS,
  regionsFor,
  speciesByState,
} = await jiti.import("../src/lib/hunt/options.ts");
const { derive, buildSkipped } = await jiti.import("../src/lib/hunt/profile.ts");
const { findSeason } = await jiti.import("../src/lib/hunt/seasons.ts");
const { fallbackWeather } = await jiti.import("../src/lib/hunt/weather.ts");
const {
  WEAPONS,
  EXPERIENCE,
  TACTICS,
  LODGINGS,
  DURATIONS,
  TRAVELS,
  TERRAINS,
  ACCESSES,
  LANDS,
  BLINDS,
  STANDS,
  TIERS,
  STATES,
} = await jiti.import("../src/lib/hunt/types.ts");
const { standLikeAmbush, isBearCountry } = await jiti.import("../src/lib/hunt/profile.ts");

const args = process.argv.slice(2);
function argNum(name, def) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : def;
}
const TARGET = argNum("--count", 5000);
const SEED = argNum("--seed", 42);

/** Mulberry32 PRNG for reproducible sampling */
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(SEED);
function pick(arr) {
  return arr[Math.floor(rand() * arr.length)];
}
function pickN(arr, n) {
  const copy = [...arr];
  const out = [];
  while (out.length < n && copy.length) {
    const i = Math.floor(rand() * copy.length);
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
}

const DAY_PACK_IDS = new Set([
  "kuiu-pro-2300",
  "alps-escape",
  "badlands-superday",
  "mystery-ranch-pop-up-28",
]);
const HAUL_PACK_IDS = new Set(["exo-k4-5000", "mystery-ranch-metcalf"]);

/** Heuristic jargon tokens for beginner "why" audit (not brand claims). */
const JARGON_RE =
  /\b(merino|softshell|tricot|denier|gtx|gore-tex|dwr|cfm|primaloft|synthetic fill|hydrophobic|ventilated|load-haul|frame sheet|cf|oz\b)\b/i;
const PLAIN_ROLE_HINT =
  /\b(shirt|bottoms|warmth|layer|blocks|keeps|pants|gloves|hat|socks|boots|carries|binoculars|keeps binos|distance|glass|map|satellite|light|fall-arrest|orange|trauma|knife|bags|calls|release|cushion|water|treats|cook|tent|sleep|deterrent|poles)\b/i;

function inputKey(input) {
  return [
    input.species,
    input.state,
    input.regionId,
    input.weapon,
    input.month,
    input.experience,
    [...(input.tactics || [])].sort().join("+"),
    [...(input.lodgings || [])].sort().join("+"),
    input.duration,
    [...(input.travels || [])].sort().join("+"),
    [...(input.terrains || [])].sort().join("+"),
    [...(input.accesses || [])].sort().join("+"),
    [...(input.lands || [])].sort().join("+"),
    [...(input.blinds || [])].sort().join("+"),
    [...(input.stands || [])].sort().join("+"),
    [...input.tiers].sort().join("+"),
  ].join("|");
}

function atLeastOne(arr) {
  return arr && arr.length ? arr : null;
}

function makeInput(partial) {
  const tactics = partial.tactics || [partial.tactic].filter(Boolean);
  const lodgings = partial.lodgings || [partial.lodging].filter(Boolean);
  const travels = partial.travels || [partial.travel].filter(Boolean);
  const terrains = partial.terrains || [partial.terrain].filter(Boolean);
  let accesses = (partial.accesses || [partial.access].filter(Boolean)).map((a) => {
    if (a === "remote-wilderness" || a === "road-public") return "trailhead";
    if (a === "private") return "truck";
    return a;
  }).filter((a, i, arr) => ACCESSES.includes(a) && arr.indexOf(a) === i);
  if (!accesses.length) accesses.push("truck");
  const lands = partial.lands?.length ? partial.lands : ["public"];
  let blinds = partial.blinds || [];
  let stands = partial.stands || [];
  if (tactics.includes("ambush") && !blinds.length) {
    const trees = terrains.some((x) => x === "timber" || x === "river-bottom" || x === "foothills");
    blinds = trees ? ["hang-on"] : ["hub"];
  }
  if (tactics.includes("ambush") && !stands.length) {
    const treeBlind = blinds.some((b) => b === "hang-on" || b === "ladder" || b === "climber");
    if (treeBlind) stands = lands.includes("private") ? ["fixed"] : ["mobile"];
  }
  return {
    species: partial.species,
    state: partial.state,
    regionId: partial.regionId,
    weapon: partial.weapon,
    month: partial.month,
    experience: partial.experience,
    tactics,
    lodgings,
    duration: partial.duration,
    travels,
    terrains,
    accesses,
    lands,
    blinds,
    stands,
    tiers: partial.tiers,
  };
}

/** Build a large stratified sample of season-valid (preferred) HuntInputs. */
function sampleInputs(target) {
  const seen = new Set();
  const inputs = [];

  // Build season-valid axes: state × species × weapon → months
  const seasonCombos = [];
  for (const state of STATES) {
    const speciesList = speciesByState[state] || [];
    for (const species of speciesList) {
      for (const weapon of WEAPONS) {
        const season = findSeason(state, species, weapon);
        if (!season || !season.months?.length) continue;
        const regions = regionsFor(state);
        if (!regions.length) continue;
        seasonCombos.push({ state, species, weapon, months: season.months, regions });
      }
    }
  }

  // Stratified passes: rotate through season combos and vary other dims
  let guard = 0;
  const maxGuard = target * 40;
  while (inputs.length < target && guard < maxGuard) {
    guard++;
    const combo = seasonCombos[guard % seasonCombos.length];
    // Occasionally jump randomly for better coverage
    const c = rand() < 0.35 ? pick(seasonCombos) : combo;

    const lodging = pick(LODGINGS);
    let duration = pick(DURATIONS);
    // Bias: backpack multi-day and ambush day hunts get extra weight via re-roll
    if (rand() < 0.12) {
      // force backpack multi-day stress cases
      // (applied after lodging/duration picks below)
    }

    let tactic = pick(TACTICS);
    let travel = pick(TRAVELS);
    let terrain = pick(TERRAINS);
    let access = pick(ACCESSES);
    const experience = pick(EXPERIENCE);
    const month = pick(c.months);
    const region = pick(c.regions);
    const tierCount = 1 + Math.floor(rand() * 3);
    const tiers = pickN([...TIERS], tierCount);

    // Stress-case injection (~18% of samples)
    if (rand() < 0.18) {
      const stress = Math.floor(rand() * 5);
      if (stress === 0) {
        // backpack multi-day
        // lodging/duration forced later
      } else if (stress === 1) {
        tactic = "ambush";
        duration = "day";
      } else if (stress === 2) {
        access = "trailhead";
      } else if (stress === 3) {
        // alaska / brown-bear already covered by combos when present
      }
    }

    let finalLodging = lodging;
    let finalDuration = duration;
    if (rand() < 0.1) {
      finalLodging = "backpack";
      finalDuration = pick(["overnight", "2-4", "5-7", "expedition"]);
    }
    if (rand() < 0.08) {
      tactic = "ambush";
    }
    if (rand() < 0.05 && c.state === "AK") {
      access = "trailhead";
    }

    const input = makeInput({
      species: c.species,
      state: c.state,
      regionId: region.id,
      weapon: c.weapon,
      month,
      experience,
      tactic,
      lodging: finalLodging,
      duration: finalDuration,
      travel,
      terrain,
      access,
      tiers,
    });

    const key = inputKey(input);
    if (seen.has(key)) continue;
    seen.add(key);
    inputs.push(input);
  }

  // Fill remaining with pure random unique keys if needed
  while (inputs.length < target && guard < maxGuard + target * 10) {
    guard++;
    const state = pick(STATES);
    const speciesList = speciesByState[state];
    if (!speciesList?.length) continue;
    const species = pick(speciesList);
    const weapon = pick(WEAPONS);
    const season = findSeason(state, species, weapon);
    const months = season?.months?.length ? season.months : [9, 10, 11];
    const regions = regionsFor(state);
    if (!regions.length) continue;
    const input = makeInput({
      species,
      state,
      regionId: pick(regions).id,
      weapon,
      month: pick(months),
      experience: pick(EXPERIENCE),
      tactic: pick(TACTICS),
      lodging: pick(LODGINGS),
      duration: pick(DURATIONS),
      travel: pick(TRAVELS),
      terrain: pick(TERRAINS),
      access: pick(ACCESSES),
      tiers: pickN([...TIERS], 1 + Math.floor(rand() * 3)),
    });
    const key = inputKey(input);
    if (seen.has(key)) continue;
    seen.add(key);
    inputs.push(input);
  }

  return inputs;
}

function scoreFlags(input, d, blaze, rows, skipped) {
  const flags = [];
  const slotSet = new Set(rows.map((r) => r.slot));
  const derivedSlots = new Set(d.slots);
  const selectedBySlot = {};
  for (const r of rows) {
    const p = r.options.find((o) => o.id === r.selectedId);
    selectedBySlot[r.slot] = p ? { id: p.id, name: p.name, brand: p.brand } : null;
  }
  const pack = selectedBySlot.pack;

  // empty / very few slots
  if (rows.length === 0) flags.push("empty_kit");
  else if (rows.length < 8) flags.push("very_few_slots");

  // day-pack on multi-day backpack
  const lodgings = input.lodgings || [input.lodging].filter(Boolean);
  const terrains = input.terrains || [input.terrain].filter(Boolean);
  const tactics = input.tactics || [input.tactic].filter(Boolean);
  const accesses = input.accesses || [input.access].filter(Boolean);
  const travels = input.travels || [input.travel].filter(Boolean);
  const lands = input.lands || [];

  if (lodgings.includes("backpack") && input.duration !== "day") {
    if (pack && DAY_PACK_IDS.has(pack.id)) flags.push("day_pack_on_multiday_backpack");
    if (pack && !HAUL_PACK_IDS.has(pack.id) && !DAY_PACK_IDS.has(pack.id)) {
      flags.push("non_haul_pack_on_multiday_backpack");
    }
  }

  // ambush without harness when timber/stand-like elevated sit expected
  const standLike = standLikeAmbush(input, d.theater);
  if (standLike && (input.blinds || []).some((b) => b === "hang-on" || b === "ladder" || b === "climber")) {
    if (!derivedSlots.has("harness") || !slotSet.has("harness")) {
      flags.push("ambush_missing_harness");
    }
  }

  // blaze required but missing from kit rows
  if (blaze.required) {
    if (!slotSet.has("blaze-vest") && !slotSet.has("blaze-hat")) {
      flags.push("blaze_required_but_missing");
    } else {
      if (derivedSlots.has("blaze-vest") && !slotSet.has("blaze-vest")) flags.push("blaze_vest_slot_empty");
      if (derivedSlots.has("blaze-hat") && !slotSet.has("blaze-hat")) flags.push("blaze_hat_slot_empty");
    }
  }

  // alaska / brown-bear / remote: comm + bear-spray when rules imply (mirror derive)
  // Mirror profile.ts derive() — do not invent stricter agency rules in the audit.
  const privateOnly = lands.length > 0 && lands.every((l) => l === "private");
  const bearCountry = isBearCountry(input, d.theater);
  const expectBearSpray = bearCountry && !(privateOnly && d.theater === "midwest");
  const flyIn = accesses.some((a) => a === "float-plane" || a === "bush-plane");
  const walkIn = accesses.some((a) => a === "trailhead" || a === "pack-stock");
  const overnight = input.duration !== "day";
  const backcountry =
    lodgings.some((l) => l === "backpack" || l === "pack-in-base" || l === "wall-tent") || flyIn || walkIn;
  let expectComm = false;
  if (backcountry || lodgings.includes("backpack") || d.theater === "alaska" || flyIn) {
    if (flyIn || lodgings.includes("backpack") || lodgings.includes("pack-in-base") || d.theater === "alaska") {
      expectComm = true;
    } else if (overnight && (walkIn || lodgings.includes("wall-tent"))) {
      expectComm = true;
    }
  }

  if (expectComm && !slotSet.has("comm") && derivedSlots.has("comm")) {
    flags.push("remote_missing_comm_row");
  }
  if (expectComm && !derivedSlots.has("comm")) {
    flags.push("remote_comm_not_derived");
  }
  if (expectBearSpray && !slotSet.has("bear-spray") && derivedSlots.has("bear-spray")) {
    flags.push("bear_country_missing_spray_row");
  }
  if (expectBearSpray && !derivedSlots.has("bear-spray")) {
    flags.push("bear_country_spray_not_derived");
  }
  if (
    (input.state === "AK" || input.species === "brown-bear" || d.theater === "alaska") &&
    expectComm &&
    !slotSet.has("comm")
  ) {
    flags.push("alaska_or_remote_missing_comm");
  }
  if (
    (input.species === "brown-bear" || d.theater === "alaska") &&
    expectBearSpray &&
    !slotSet.has("bear-spray")
  ) {
    flags.push("alaska_or_brown_bear_missing_spray");
  }

  // beginner jargon-only why
  if (input.experience === "beginner") {
    let jargonOnly = 0;
    for (const r of rows) {
      const why = r.why || "";
      const hasPlain = PLAIN_ROLE_HINT.test(why) || why.toLowerCase().includes("why this pick");
      const hasJargon = JARGON_RE.test(why);
      if (!hasPlain && (hasJargon || why.length < 40)) jargonOnly++;
    }
    if (jargonOnly >= Math.max(3, Math.floor(rows.length * 0.25))) {
      flags.push("beginner_jargon_heavy_why");
    }
  }

  // skipped empty when stalk clearly omits stands
  const stalkish =
    tactics.includes("spot-and-stalk") ||
    tactics.includes("still-hunting") ||
    tactics.includes("tracking") ||
    tactics.includes("glassing");
  if (stalkish && !tactics.includes("ambush")) {
    if (!skipped || skipped.length === 0) {
      flags.push("skipped_empty_on_non_ambush");
    } else {
      const skippedIds = new Set(skipped.map((s) => s.id));
      if (!skippedIds.has("harness") && !derivedSlots.has("harness")) {
        flags.push("skipped_missing_harness_omit_reason");
      }
    }
  }

  // weapon / slot mismatches
  if (input.weapon === "archery") {
    if (derivedSlots.has("release") && !slotSet.has("release")) {
      flags.push("archery_missing_release_row");
    }
    if (!derivedSlots.has("release")) {
      flags.push("archery_release_not_derived");
    }
  } else {
    if (slotSet.has("release")) flags.push("non_archery_has_release");
  }

  // derived slots with no catalog row — silent omissions only (explained skips do not count)
  const skippedIds = new Set((skipped || []).map((s) => s.id));
  let missingRows = 0;
  for (const s of d.slots) {
    if (!slotSet.has(s) && !skippedIds.has(s)) missingRows++;
  }
  if (missingRows >= 3) flags.push("many_derived_slots_without_products");
  else if (missingRows >= 1) flags.push("some_derived_slots_without_products");

  return { flags, pack, rowCount: rows.length, skippedCount: skipped?.length ?? 0 };
}

function run() {
  const started = Date.now();
  console.error(`Sampling ${TARGET} unique-ish HuntInputs (seed=${SEED})…`);
  const inputs = sampleInputs(TARGET);
  console.error(`Got ${inputs.length} inputs. Generating kits…`);

  const flagCounts = Object.create(null);
  const failingExamples = []; // capped later
  let success = 0;
  let errors = 0;
  let kitsWithFlags = 0;
  let kitsClean = 0;
  const errorSamples = [];
  let totalRows = 0;
  const rowHist = Object.create(null);

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    try {
      const region = REGIONS.find((r) => r.id === input.regionId);
      if (!region) throw new Error("bad region");
      const d = derive(input);
      const weather = fallbackWeather(region, input.month);
      const rows = buildRows(input, d, weather);
      const skipped = buildSkipped(input, d, rows);
      const blaze = blazeFor(input.state, input.weapon);
      const { flags, pack, rowCount, skippedCount } = scoreFlags(input, d, blaze, rows, skipped);

      success++;
      totalRows += rowCount;
      rowHist[rowCount] = (rowHist[rowCount] || 0) + 1;

      for (const f of flags) {
        flagCounts[f] = (flagCounts[f] || 0) + 1;
      }
      if (flags.length) kitsWithFlags++;
      else kitsClean++;
      if (flags.length && failingExamples.length < 200) {
        failingExamples.push({
          flags,
          input,
          selectedPackId: pack?.id ?? null,
          selectedPackName: pack?.name ?? null,
          rowCount,
          skippedCount,
          activity: d.activity,
          theater: d.theater,
          blazeRequired: blaze.required,
          derivedSlotCount: d.slots.length,
        });
      }
    } catch (e) {
      errors++;
      if (errorSamples.length < 10) {
        errorSamples.push({ input, error: String(e?.message || e) });
      }
    }
    if ((i + 1) % 500 === 0) {
      console.error(`  … ${i + 1}/${inputs.length} (ok=${success} err=${errors})`);
    }
  }

  const elapsedMs = Date.now() - started;
  const rankedFlags = Object.entries(flagCounts)
    .map(([flag, count]) => ({
      flag,
      count,
      ratePct: success ? Math.round((count / success) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Representative failing cases: diversify across flag types
  const byFlag = Object.create(null);
  for (const ex of failingExamples) {
    for (const f of ex.flags) {
      if (!byFlag[f]) byFlag[f] = [];
      if (byFlag[f].length < 4) byFlag[f].push(ex);
    }
  }
  const representative = [];
  const seenRep = new Set();
  for (const { flag } of rankedFlags) {
    for (const ex of byFlag[flag] || []) {
      const k = inputKey(ex.input) + "|" + ex.flags.join(",");
      if (seenRep.has(k)) continue;
      seenRep.add(k);
      representative.push({
        primaryFlag: flag,
        flags: ex.flags,
        input: ex.input,
        selectedPackId: ex.selectedPackId,
        selectedPackName: ex.selectedPackName,
        rowCount: ex.rowCount,
        skippedCount: ex.skippedCount,
        activity: ex.activity,
        theater: ex.theater,
        blazeRequired: ex.blazeRequired,
      });
      if (representative.length >= 40) break;
    }
    if (representative.length >= 40) break;
  }
  // Pad to at least 20 if possible
  for (const ex of failingExamples) {
    if (representative.length >= 20) break;
    const k = inputKey(ex.input) + "|" + ex.flags.join(",");
    if (seenRep.has(k)) continue;
    seenRep.add(k);
    representative.push({
      primaryFlag: ex.flags[0],
      flags: ex.flags,
      input: ex.input,
      selectedPackId: ex.selectedPackId,
      selectedPackName: ex.selectedPackName,
      rowCount: ex.rowCount,
      skippedCount: ex.skippedCount,
      activity: ex.activity,
      theater: ex.theater,
      blazeRequired: ex.blazeRequired,
    });
  }

  const kitsWithAnyFlag = failingExamples.length; // underestimate if >200 — compute properly
  let withFlags = 0;
  // Recompute withFlags from counts is hard without storing all; approximate via second pass light
  // Store during main loop instead — fix: recount from a Set during loop
  // For report, use a dedicated counter — we need to re-run flag presence. Simpler: track in loop.
  // Already only stored 200 examples. Add withFlags in a note that we track separately.

  const report = {
    meta: {
      generatedAt: new Date().toISOString(),
      target: TARGET,
      seed: SEED,
      elapsedMs,
      pipeline: "derive + buildRows + buildSkipped + fallbackWeather (no LLM, no NASA weather)",
      note: "Flags are heuristic usefulness/accuracy red flags against local kit rules — not legal advice or invented regulations.",
    },
    totals: {
      sampledInputs: inputs.length,
      kitsGenerated: success,
      errors,
      avgRowCount: success ? Math.round((totalRows / success) * 100) / 100 : 0,
      uniqueFlagTypes: rankedFlags.length,
    },
    flagCounts: rankedFlags,
    representativeFailingCases: representative.slice(0, 40),
    errorSamples,
    usefulnessNotes: [],
  };

  // Usefulness notes from top flags (no invented regs / brand claims)
  const notes = [];
  notes.push(
    `Generated ${success} kits from ${inputs.length} stratified season-valid inputs in ${(elapsedMs / 1000).toFixed(1)}s (seed ${SEED}).`,
  );
  if (rankedFlags.length === 0) {
    notes.push("No heuristic red flags fired across the sample — kit derive/buildRows look consistent with coded rules.");
  } else {
    notes.push("Top issues by frequency (see JSON for full rates):");
    for (const f of rankedFlags.slice(0, 8)) {
      notes.push(`- ${f.flag}: ${f.count} (${f.ratePct}% of kits)`);
    }
  }
  const dayPack = rankedFlags.find((f) => f.flag === "day_pack_on_multiday_backpack");
  if (dayPack && dayPack.count > 0) {
    notes.push(
      "Day-pack-class selections on multi-day backpack hunts still appear — haul-frame preference in kit.ts may not cover every catalog path.",
    );
  } else {
    notes.push(
      "Multi-day backpack hunts did not select Pro 2300 / ALPS / Superday / Pop-Up day packs as the primary pack in this sample (haul preference held).",
    );
  }
  const ambush = rankedFlags.find((f) => f.flag === "ambush_missing_harness");
  if (!ambush || ambush.count === 0) {
    notes.push("Ambush tactics consistently included a fall-arrest harness slot when derived.");
  }
  const blazeMiss = rankedFlags.find((f) => f.flag === "blaze_required_but_missing");
  if (!blazeMiss || blazeMiss.count === 0) {
    notes.push("When blazeFor().required was true, blaze vest/hat rows were present in kits.");
  }
  const jargon = rankedFlags.find((f) => f.flag === "beginner_jargon_heavy_why");
  if (jargon && jargon.ratePct > 5) {
    notes.push("Beginner kits sometimes still show jargon-heavy slot copy; plain-language prefix may not cover every slot.");
  } else {
    notes.push("Beginner why-text generally includes plain role language (SLOT_PLAIN path), not jargon-only builtFor.");
  }
  notes.push(
    "Skipped lists were checked for non-ambush tactics (expect harness/seat omissions explained). Catalog gaps (derived slot, no product) are product-coverage issues, not regulations.",
  );
  notes.push(
    "This audit does not invent legal regulations; blaze/season checks only mirror blaze.ts and seasons.ts snapshots already in the app.",
  );
  report.usefulnessNotes = notes;
  report.totals.kitsWithAnyFlag = kitsWithFlags;
  report.totals.kitsClean = kitsClean;
  report.totals.anyFlagRatePct = success
    ? Math.round((kitsWithFlags / success) * 10000) / 100
    : 0;

  const outJson = path.join(root, "artifacts/batch-kit-audit.json");
  const outMd = path.join(root, "artifacts/batch-kit-audit.md");
  fs.writeFileSync(outJson, JSON.stringify(report, null, 2));

  const md = [];
  md.push("# Batch kit audit");
  md.push("");
  md.push(`Generated: ${report.meta.generatedAt} (box-local / America/Denver context)`);
  md.push(`Pipeline: \`${report.meta.pipeline}\``);
  md.push(`Seed: ${SEED} · Target: ${TARGET}`);
  md.push("");
  md.push("## Totals");
  md.push("");
  md.push(`| Metric | Value |`);
  md.push(`| --- | ---: |`);
  md.push(`| Inputs sampled | ${report.totals.sampledInputs} |`);
  md.push(`| Kits generated | ${report.totals.kitsGenerated} |`);
  md.push(`| Errors | ${report.totals.errors} |`);
  md.push(`| Avg rows / kit | ${report.totals.avgRowCount} |`);
  md.push(`| Kits with ≥1 flag | ${report.totals.kitsWithAnyFlag} (${report.totals.anyFlagRatePct}%) |`);
  md.push(`| Clean kits | ${report.totals.kitsClean} |`);
  md.push(`| Elapsed | ${(elapsedMs / 1000).toFixed(1)}s |`);
  md.push("");
  md.push("## Top flags (ranked)");
  md.push("");
  md.push("| Flag | Count | Rate % |");
  md.push("| --- | ---: | ---: |");
  for (const f of rankedFlags) {
    md.push(`| \`${f.flag}\` | ${f.count} | ${f.ratePct} |`);
  }
  if (!rankedFlags.length) md.push("| _(none)_ | 0 | 0 |");
  md.push("");
  md.push("## Representative failing cases");
  md.push("");
  let n = 0;
  for (const ex of representative.slice(0, 40)) {
    n++;
    md.push(`### ${n}. \`${ex.primaryFlag}\``);
    md.push("");
    md.push(
      `- **Input:** ${ex.input.species} / ${ex.input.state} / ${ex.input.regionId} / ${ex.input.weapon} / month ${ex.input.month}`,
    );
    md.push(
      `- **Style:** ${(ex.input.tactics||[]).join('+')}, ${(ex.input.lodgings||[]).join('+')}, ${ex.input.duration}, ${(ex.input.travels||[]).join('+')}, ${(ex.input.terrains||[]).join('+')}, ${(ex.input.accesses||[]).join('+')}, ${ex.input.experience}`,
    );
    md.push(`- **Tiers:** ${ex.input.tiers.join(", ")}`);
    md.push(
      `- **Pack:** ${ex.selectedPackId ?? "(none)"}${ex.selectedPackName ? ` (${ex.selectedPackName})` : ""}`,
    );
    md.push(
      `- **Kit:** ${ex.rowCount} rows, ${ex.skippedCount} skipped, activity=${ex.activity}, theater=${ex.theater}, blazeRequired=${ex.blazeRequired}`,
    );
    md.push(`- **Flags:** ${ex.flags.map((x) => "`" + x + "`").join(", ")}`);
    md.push("");
  }
  md.push("## Usefulness notes");
  md.push("");
  for (const note of notes) md.push(`- ${note}`);
  md.push("");
  md.push("## How to re-run");
  md.push("");
  md.push("```bash");
  md.push("node scripts/batch-kit-audit.mjs --count 5000 --seed 42");
  md.push("```");
  md.push("");
  md.push(
    "Flags mirror local kit rules (derive/buildRows/blaze/skipped). They are not legal advice and do not invent regulations or brand claims.",
  );
  md.push("");

  fs.writeFileSync(outMd, md.join("\n"));
  console.error(`Wrote ${outJson}`);
  console.error(`Wrote ${outMd}`);
  console.log(
    JSON.stringify(
      {
        kitsGenerated: success,
        errors,
        kitsWithAnyFlag: kitsWithFlags,
        topFlags: rankedFlags.slice(0, 10),
        json: outJson,
        md: outMd,
      },
      null,
      2,
    ),
  );
}

run();
