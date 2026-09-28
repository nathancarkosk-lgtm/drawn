import { blazeFor } from "./blaze";
import { pickExperts, namesWrongQuarry } from "./experts";
import { fuelFor } from "./fuel";
import { buildRows, fitCopy, whyConflictsQuiet } from "./kit";
import { kitOrigin, regionById, speciesLabel, stateLabel, terrainsForRegion, accessesForRegion, weaponLabel } from "./options";
import { buildSkipped, derive, type Derived } from "./profile";
import { findSeason, rutNote } from "./seasons";
import { asHuntInput, type HuntInput, type HuntPlan, type KitRow } from "./types";
import { fetchWeather, realFeelFallback } from "./weather";

const DISCLAIMER =
  "Regulations, dates, and bag limits change by year and unit. Confirm licenses, legal weapons, blaze orange, and season dates with the state agency before you hunt. Weather is a climatology estimate, not a forecast. Phone numbers for local SAR and the county sheriff must be verified for the unit you hunt — we do not invent them.";

function titleFor(input: HuntInput) {
  const region = regionById(input.regionId);
  const months = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${speciesLabel[input.species]} · ${region?.name ?? input.state} · ${weaponLabel[input.weapon]} · ${months[input.month]}`;
}

function extractJson(text: string): Record<string, unknown> | null {
  const fence = text.match(/```json\s*([\s\S]*?)```/i);
  const raw = fence ? fence[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function enhanceWithLlm(args: {
  input: HuntInput;
  rows: KitRow[];
  weatherText: string;
  experts: { id: string; person: string; claim: string }[];
}): Promise<{
  realFeel?: string;
  weatherGear?: string[];
  summary?: string;
  primers?: Array<{ title: string; body: string }>;
  mistakes?: string[];
  openQuestions?: string[];
  itemWhy?: Record<string, string>;
} | null> {
  const apiKey =
    (typeof process !== "undefined" ? process.env.XAI_API_KEY : undefined) ||
    (typeof import.meta !== "undefined"
      ? (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_XAI_API_KEY
      : undefined);
  if (!apiKey) return null;

  const compactRows = args.rows.map((r) => ({
    slot: r.slot,
    selected: r.options.find((o) => o.id === r.selectedId)?.name,
    why: r.why,
    ...(r.slot === "weapon" || r.slot === "release"
      ? {
          alternatives: r.options.map((o) => {
            const v = r.verdicts.find((x) => x.productId === o.id);
            return {
              name: o.name,
              selected: o.id === r.selectedId,
              angle: v?.angle,
              pros: v?.pros,
              cons: v?.cons,
            };
          }),
        }
      : {}),
  }));

  const exp = args.input.experience;
  const primerN = exp === "beginner" ? 5 : exp === "intermediate" ? 1 : 0;
  const mistakeN = exp === "beginner" ? 6 : exp === "intermediate" ? 3 : 2;
  const openN = exp === "experienced" ? 5 : exp === "intermediate" ? 2 : 0;
  const whyStyle =
    exp === "beginner"
      ? "Two short sentences. Explain the term if a new hunter would not know it."
      : exp === "intermediate"
        ? "One sentence. No beginner lecture."
        : "A fragment. Assume they already hunt. No brand ads.";

  const huntAnimal = speciesLabel[args.input.species];
  const sys = `You write copy for Drawn, a hunting gear kit tool. Return JSON only.
Never invent products, dates, phone numbers, or expert names. Only cite expert ids from the list.
This hunt is ${huntAnimal} only. Never mention any other big-game animal by name (no mule deer, muley, elk, whitetail, pronghorn, antelope, moose, goat, sheep, bison, caribou, blacktail, black bear, brown bear, or generic "deer") unless that animal IS ${huntAnimal}. Do not mix mule deer advice onto a whitetail hunt or the reverse. Pack, game-bag, knife, and ammo why-copy must name ${huntAnimal} — never a boned-out deer on a bear or moose hunt.
Do not mention the ${huntAnimal === "Whitetail" ? "mule deer" : "whitetail"} rut, or any other species' rut that does not match.
Blaze orange: follow the provided legal summary; do not add orange items in copy for archery hunts where it is not required. Orange copy is about wearing hunter orange, not a generic "not needed" chip.
Weather copy: MAX 220 characters for realFeel. weatherGear is 3 short fragments, not sentences.
Do not write brand ads. Do not swap a better-fitting piece for a different brand for variety. Copy explains why the selected item fits this hunt.
Do not mention alpine, mountain hiking, treestands, Iowa straight-wall, a bigger animal, or any other hunt type this hunter did not select. Why-copy only describes this hunt.
Quiet clothing is a hard rule for close-range archery sits. Never write why-copy that calls a selected clothing item loud, noisy, or a crinkle shell. If rain is in the kit, it must be a quiet hunting face.
Never invent product features. Keep why-copy to one short sentence about this hunt.
The Sitka Fanatic Glove is a stretch half-finger stand glove for a muff — not insulated, not a flip mitt. The Sitka Incinerator Flip Mitt is the flip-over mitt.
Weapon, ammunition, and (for rifles and muzzleloaders) a scope are part of the kit. Do not tell the hunter to bring their own. Ammo must match the selected chamber. For archery, the ammo row is arrows; broadheads are a separate row.
Weapon choice is subjective. The kit already lists several rifles or bows with honest for/against copy. Do not write why-copy that presents the selected weapon as the only correct answer. Skip itemWhy.weapon — the verdicts stay.
Archery kits list both a trigger (index) and a thumb release. Skip itemWhy.release — the verdicts stay.
Snacks and trail meals already encode calorie counts for this hunt. Skip itemWhy.snacks and itemWhy.food.
A bone saw is only packed when this animal or access needs one. Skip itemWhy.saw.`;

  const user = JSON.stringify({
    hunt: args.input,
    weather: args.weatherText,
    experts: args.experts,
    kit: compactRows,
    needs: {
      realFeel: "string, <=220 chars, sensory, specific to this place and month",
      weatherGear: ["3 fragments like 'vent on the climb'", "not full sentences"],
      summary: "1 sentence on what this kit is for",
      primers: primerN ? `array length ${primerN} of {title, body}` : "[]",
      mistakes: `array length ${mistakeN} of short strings`,
      openQuestions: openN ? `array length ${openN}` : "[]",
      itemWhy: "object slotId -> why string. " + whyStyle,
    },
  });

  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(18000),
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.4,
        max_tokens: 2200,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content ?? "";
    const json = extractJson(text);
    if (!json) return null;
    const species = args.input.species;
    const keepText = (s: string) => !namesWrongQuarry(s, species);
    return {
      realFeel: typeof json.realFeel === "string" && keepText(json.realFeel) ? json.realFeel.slice(0, 240) : undefined,
      weatherGear: Array.isArray(json.weatherGear)
        ? (json.weatherGear as unknown[]).map(String).filter(keepText).slice(0, 5)
        : undefined,
      summary: typeof json.summary === "string" && keepText(json.summary) ? json.summary : undefined,
      primers: Array.isArray(json.primers)
        ? (json.primers as Array<{ title?: string; body?: string }>)
            .filter((x) => x && x.title && x.body && keepText(`${x.title} ${x.body}`))
            .slice(0, 6)
            .map((x) => ({ title: String(x.title), body: String(x.body) }))
        : undefined,
      mistakes: Array.isArray(json.mistakes)
        ? (json.mistakes as unknown[]).map(String).filter(keepText).slice(0, 8)
        : undefined,
      openQuestions: Array.isArray(json.openQuestions)
        ? (json.openQuestions as unknown[]).map(String).filter(keepText).slice(0, 8)
        : undefined,
      itemWhy:
        json.itemWhy && typeof json.itemWhy === "object"
          ? Object.fromEntries(
              Object.entries(json.itemWhy as Record<string, unknown>)
                .map(([k, v]) => [k, String(v)] as const)
                .filter(([, v]) => keepText(v)),
            )
          : undefined,
    };
  } catch {
    return null;
  }
}

function beginnerPrimers(input: HuntInput, d: Derived): Array<{ title: string; body: string }> {
  if (input.experience !== "beginner") return [];
  const out: Array<{ title: string; body: string }> = [
    {
      title: "Layering",
      body: d.activity === "static"
        ? "Walk in light. Put the warm piece on when you stop. Sweat on the walk is what makes you cold on the sit."
        : "Wear a thin base, add a midlayer for the walk, and keep the warmest piece in the pack until you stop.",
    },
    {
      title: "Verify the tag",
      body: "Buy the license the agency lists for this species, weapon, and unit. A general hunting license is not always a tag.",
    },
    {
      title: input.weapon === "archery" ? "Tune the arrows" : "Zero the load",
      body:
        input.weapon === "archery"
          ? "Cut arrows to this bow and fly the same broadheads you will hunt. Field points and these heads are not the same arrow."
          : "Sight the rifle with this ammunition. A different box will not hit the same hole.",
    },
  ];
  if (input.tactics.includes("ambush") && d.slots.includes("harness")) {
    out.push({
      title: "Harness before height",
      body: "Attach the tether at ground level and keep it connected while you climb. A stand hunt without a harness is not a gear list, it is a risk.",
    });
  }
  if (d.quietHard) {
    out.push({
      title: "Quiet over slick",
      body: "At 20 yards a noisy sleeve costs more animals than a missing feature. Fleece and tricot beat a loud shell for close shots.",
    });
  }
  if (input.lodgings.includes("backpack")) {
    out.push({
      title: "The pack carries the animal",
      body: "Food, shelter, and a frame that can haul meat are the hunt. Fashion layers are not.",
    });
  }
  if (d.slots.includes("food-storage")) {
    out.push({
      title: "Bears and food",
      body: "Food, toothpaste, trash, and a kill do not sleep with you. Cook, store, and sleep in three different places. Confirm whether this unit requires a hard canister.",
    });
  }
  if (input.accesses.some((a) => a === "float-plane" || a === "bush-plane")) {
    out.push({
      title: "The airplane is the gate",
      body: "If it does not fit the cub, it does not hunt. Weigh the kit. Leave the extras at home.",
    });
  }
  if (d.slots.includes("snacks")) {
    out.push({
      title: "Calories in the pack",
      body: fuelFor(input, d).note,
    });
  }
  return out.slice(0, 5);
}

function defaultMistakes(input: HuntInput, d: Derived): string[] {
  const m: string[] = [];
  const origin = kitOrigin(input.accesses, input.lodgings);
  if (input.weapon === "archery") {
    m.push("Hunting arrows you have not cut, fletched, and flown with these heads.");
  } else if (input.weapon === "muzzleloader") {
    m.push("Opening day with a load you have not shot from this barrel.");
  } else {
    m.push("Hunting a box of ammo you have never put on paper in this rifle.");
  }
  if (d.quietHard) {
    m.push("Wearing a noisy wind shell on a close-range sit — it sounds like a tarp when you draw.");
    m.push("Pulling a crinkle rain suit over a quiet jacket. Waterproof is not the same as huntable.");
  }
  const mountainMove =
    d.activity !== "static" &&
    (input.terrains.includes("steep-alpine") || input.lodgings.includes("backpack"));
  if (input.month >= 8 && input.month <= 9 && mountainMove) {
    m.push("Starting the climb in the puffy. You will be soaked by the first hour.");
  }
  if (input.lodgings.includes("backpack")) {
    m.push(`Packing a 40 L day pack for a multi-day ${speciesLabel[input.species].toLowerCase()} hunt, then discovering it cannot haul meat.`);
  }
  if (d.slots.includes("food-storage")) {
    m.push("Keeping food, toothpaste, or a kill in the tent in bear country.");
  }
  if (input.accesses.some((a) => a === "float-plane" || a === "bush-plane")) {
    m.push("Bringing the vehicle-camp kit on a Cub. The pilot will leave the extra boots on the gravel.");
  } else if (d.weightBias === "none" && (input.lodgings.includes("home") || input.lodgings.includes("hotel") || input.lodgings.includes("truck-camp"))) {
    m.push(`Building an ultralight kit for a hunt you will hunt from ${origin}. Spend the ounces on quiet and weather.`);
  }
  if (input.tactics.includes("glassing")) {
    m.push(`Leaving the tripod in ${origin} because the bino harness 'should be enough'.`);
  }
  m.push("Trusting memory for the unit's orange law and season dates instead of the current brochure.");
  if (d.slots.includes("snacks")) {
    const fuel = fuelFor(input, d);
    m.push(`Under-eating this hunt. Plan about ${fuel.kcalPerHour} kcal an hour in the field, not one granola bar.`);
  }
  if (input.experience === "beginner") m.push("Buying a full matching camo set before a map, a tag, and boots that fit.");
  return m.slice(0, input.experience === "beginner" ? 6 : input.experience === "intermediate" ? 3 : 2);
}

/** Client-safe kit builder (no server required). Call as generatePlan({ data: input }). */
export async function generatePlan({
  data: inputRaw,
}: {
  data: unknown;
}): Promise<{ ok: true; plan: HuntPlan } | { ok: false; error: string }> {
    const input = asHuntInput(inputRaw);
    if (!input) throw new Error("Complete every hunt field before generating.");
    const region = regionById(input.regionId);
    if (!region || region.state !== input.state) {
      return { ok: false, error: "Pick a region that belongs to that state." };
    }
    const allowedTerrains = terrainsForRegion(input.regionId);
    if (input.terrains.some((t) => !allowedTerrains.includes(t))) {
      return { ok: false, error: "Pick terrain that actually exists in that region." };
    }
    const allowedAccess = accessesForRegion(input.regionId);
    if (input.accesses.some((a) => !allowedAccess.includes(a))) {
      return { ok: false, error: "Pick access that is realistic for that region." };
    }
    const season = findSeason(input.state, input.species, input.weapon);
    if (!season || !season.months.includes(input.month)) {
      return { ok: false, error: "That month is not a typical legal window for this species, state, and weapon." };
    }

    const d = derive(input);
    const weather = await fetchWeather(region, input.month);
    const rows = buildRows(input, d, weather);
    const skipped = buildSkipped(input, d, rows);
    const fuel = fuelFor(input, d, weather.packForF);
    const experts =
      input.experience === "experienced" ? [] : pickExperts(input, input.experience === "beginner" ? 5 : 7);
    const blaze = blazeFor(input.state, input.weapon);
    const agency = stateLabel[input.state];

    const enhanced = await enhanceWithLlm({
      input,
      rows,
      weatherText: `${region.name} ${weather.highF}/${weather.lowF}F wind ${weather.windMph} precip ${weather.precipIn}in packFor ${weather.packForF}F source=${weather.source}`,
      experts: experts.map((e) => ({ id: e.id, person: e.person, claim: e.claim })),
    });

    if (enhanced?.itemWhy) {
      for (const row of rows) {
        const w = enhanced.itemWhy[row.slot];
        const p = row.options.find((o) => o.id === row.selectedId);
        if (
          row.slot === "weapon" ||
          row.slot === "release" ||
          row.slot === "snacks" ||
          row.slot === "food" ||
          row.slot === "saw" ||
          row.slot === "lifeline" ||
          row.slot === "sticks" ||
          row.slot === "rain-pant" ||
          row.slot === "water"
        )
          continue;
        if (w && w.length > 8 && p && !whyConflictsQuiet(w, p, d.quietHard)) {
          row.why = fitCopy(w, input, d).slice(0, 420);
        }
      }
    }

    const primers =
      input.experience === "experienced" ? [] : (enhanced?.primers?.length ? enhanced.primers : beginnerPrimers(input, d));
    const mistakes = enhanced?.mistakes?.length ? enhanced.mistakes : defaultMistakes(input, d);
    const openQuestions =
      input.experience === "beginner" ? [] : (enhanced?.openQuestions ?? []);

    const plan: HuntPlan = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      input,
      title: titleFor(input),
      summary:
        enhanced?.summary ??
        `A ${d.activity} kit for ${speciesLabel[input.species]} in ${region.name}, built around ${weaponLabel[input.weapon]} in month ${input.month}. Weight ${d.weightBias === "payload" ? "is limited by the airplane" : d.weightBias === "carry" ? "rides on your back" : "is not the limiter"}.`,
      realFeel: (enhanced?.realFeel ?? realFeelFallback(weather, region)).slice(0, 240),
      weather,
      weatherGear: enhanced?.weatherGear?.length
        ? enhanced.weatherGear
        : d.quietHard
          ? ["Quiet face at full draw", "Sit coat goes on when you stop", `Loud rain stays in ${kitOrigin(input.accesses, input.lodgings)}`]
          : weather.packForF <= 20
            ? ["Pack for the wind chill, not the afternoon high", "Stop-puffy goes on when you stop", "Vent the climb"]
            : d.activity === "static"
              ? ["Wide day/night swing", "Sit coat goes on when you stop", "Do not walk in wearing the warmest layer"]
              : ["Wide day/night swing", "Shell for wind and squalls", "Do not hike in the sit coat"],
      blaze,
      season,
      agency: {
        name: agency.agency,
        url: agency.url,
        phoneNote: "Verify county sheriff and local SAR before the trip. We do not invent those numbers.",
      },
      emergency: {
        items: [
          "911",
          "County sheriff — look up the county you will hunt, do not guess",
          "Local search and rescue — verify before you leave cell service",
          `${agency.agency} — ${agency.url}`,
        ],
      },
      rutNote: rutNote(input.species, input.month),
      primers,
      mistakes,
      openQuestions,
      experts,
      rows,
      skipped,
      activity: d.activity,
      insulation: d.insulation,
      weightBias: d.weightBias,
      fuel,
      disclaimer: DISCLAIMER,
    };

    return { ok: true, plan };
}
