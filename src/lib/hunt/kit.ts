import { attachReleaseVerdicts } from "./release";
import { CATALOG } from "./catalog";
import { fuelFor } from "./fuel";
import { attachWeaponVerdicts, pickDiverseWeapons } from "./weapon";
import { ammoSlotLabel, kitOrigin, slotLabel, speciesLabel, weaponSlotLabel } from "./options";
import type { Derived } from "./profile";
import type { HuntInput, HuntState, KitRow, Product, SlotId, Species, Tier, WeatherNormals } from "./types";

/** Load-hauling frames for multi-day / meat-out backpack hunts. */
const HAUL_PACK_IDS = new Set(["exo-k4-5000", "mystery-ranch-metcalf"]);
/** Day / overnight-capacity packs — fine for stands & day hunts, wrong as primary multi-day pack. */
const DAY_PACK_IDS = new Set([
  "kuiu-pro-2300",
  "alps-escape",
  "badlands-superday",
  "mystery-ranch-pop-up-28",
  "badlands-2200",
]);

function multiDayBackpack(input: HuntInput) {
  return input.lodgings.includes("backpack") && input.duration !== "day";
}

function theaterOk(p: Product, theater: Derived["theater"]) {
  return p.theaters.includes("any") || p.theaters.includes(theater);
}

function weaponOk(p: Product, weapon: HuntInput["weapon"]) {
  return p.weapons.includes("any") || p.weapons.includes(weapon);
}

const QUIET_CLOTHING: SlotId[] = [
  "insulation-static",
  "pant-insulated",
  "glove-static",
  "shell-wind",
  "shell-rain",
  "pant-active",
  "midlayer-active",
];

function activityOk(
  p: Product,
  activity: Derived["activity"],
  quietHard: boolean,
  insulation: Derived["insulation"],
  month: number,
  theater: Derived["theater"],
  input?: HuntInput,
) {
  if (quietHard && !p.quiet && QUIET_CLOTHING.includes(p.slot)) return false;
  // Fall-arrest / climb kit is activity-agnostic once derive selected the slot.
  if (p.slot === "harness" || p.slot === "lifeline" || p.slot === "sticks") return true;
  if (p.slot === "boots") {
    if (activity === "static" && theater === "midwest") return p.activity === "static" || p.activity === "any";
    if (activity === "static") return p.activity === "active" || p.activity === "mixed" || p.activity === "any";
    if (p.activity === "any") return true;
    if (activity === "active") return p.activity === "active" || p.activity === "mixed";
    if (p.activity === "static") return theater === "midwest" && (insulation === "high" || month <= 2 || month >= 11);
    return true;
  }
  if (p.slot === "pack") {
    // Haul frames stay eligible on multi-day backpack hunts even when activity is static (ambush).
    if (input && HAUL_PACK_IDS.has(p.id) && multiDayBackpack(input)) return true;
    if (p.activity === "any") return true;
    if (activity === "static") return p.activity === "static" || p.activity === "mixed";
    if (activity === "active") return p.activity === "active" || p.activity === "mixed";
    if (p.activity === "static") return insulation === "high" || month <= 2 || month >= 11;
    return true;
  }
  if (p.activity === "any") return true;
  if (activity === "static") return p.activity === "static";
  if (activity === "active") return p.activity === "active" || p.activity === "mixed";
  if (p.activity === "static") return insulation === "high" || month <= 2 || month >= 11;
  return true;
}

function productFitsHunt(p: Product, input: HuntInput, d: Derived) {
  const tree = input.blinds.some((b) => b === "hang-on" || b === "ladder" || b === "climber");
  const hangOn = /hang-on|hawk helium/i.test(p.name);
  const climber = /climber/i.test(p.name);
  const ladder = /ladder/i.test(p.name);
  const cushion = /cushion|\bz seat\b|sit pad/i.test(p.name);
  if (p.slot === "seat") {
    if (hangOn) return input.blinds.includes("hang-on") && input.stands.includes("mobile");
    if (climber) return input.blinds.includes("climber") && input.stands.includes("mobile");
    if (ladder) return input.blinds.includes("ladder");
    if (cushion) return input.blinds.some((b) => b === "box" || b === "natural" || b === "hub") || input.stands.includes("fixed");
  }
  if (p.slot === "harness") return tree;
  if (p.slot === "saddle") return input.blinds.includes("saddle");
  if (p.slot === "blind") return input.blinds.includes("hub");
  if (
    p.slot === "pack" &&
    d.activity === "static" &&
    d.weightBias === "none" &&
    (p.weightOz ?? 0) >= 70 &&
    !multiDayBackpack(input)
  )
    return false;
  return true;
}

function warmthOk(p: Product, insulation: Derived["insulation"], month: number) {
  if (
    [
      "boots",
      "insulation-static",
      "pant-insulated",
      "glove-static",
      "sleep-bag",
      "socks",
      "base-top",
      "base-bottom",
      "headwear",
    ].includes(p.slot)
  ) {
    if (insulation === "high" && p.warmth <= 2) return false;
    if (insulation === "low" && p.warmth >= 5) return false;
    if (month >= 8 && month <= 9 && p.warmth >= 5 && p.slot === "boots") return false;
  }
  return true;
}

function speciesCallOk(p: Product, species: Species) {
  if (p.slot !== "calls") return true;
  const n = `${p.name} ${p.amazonQuery}`.toLowerCase();
  if (species === "elk") return n.includes("elk") || n.includes("bugle");
  if (species === "whitetail")
    return (n.includes("deer") || n.includes("grunt") || n.includes("bleat") || n.includes("snort")) && !n.includes("turkey");
  if (species === "moose") return n.includes("moose");
  return false;
}

function score(p: Product, input: HuntInput, d: Derived, w: WeatherNormals) {
  let s = 10;
  if (p.activity === d.activity) s += 8;
  if (d.activity === "mixed" && p.activity === "mixed") s += 6;
  if (d.quietHard && p.quiet) s += 10;
  if (d.quietHard && !p.quiet && QUIET_CLOTHING.includes(p.slot)) s -= 20;
  if (d.quietTie && p.quiet) s += 3;
  if (d.quietTie && !p.quiet && (p.slot === "midlayer-active" || p.slot === "shell-wind" || p.slot === "pant-active")) s += 2;
  const wantWarmth = d.insulation === "high" ? 5 : d.insulation === "low" ? 2 : 3;
  s += 4 - Math.abs(p.warmth - wantWarmth);
  if (w.packForF <= 15 && p.warmth >= 4) s += 3;
  if (w.highF >= 70 && p.warmth >= 4 && p.slot !== "insulation-static") s -= 4;
  if (p.theaters.includes(d.theater)) s += 3;
  const oz = p.weightOz;
  if (p.slot === "weapon" || p.slot === "scope") {
    if (d.weightBias === "payload" || d.weightBias === "carry") {
      if (typeof oz === "number") {
        if (oz <= 90) s += 10;
        else if (oz <= 100) s += 5;
        else if (oz >= 110) s -= 4;
      }
    } else if (typeof p.durability === "number") s += p.durability >= 4 ? 2 : 0;
  } else if (d.weightBias === "payload") {
    if (typeof oz === "number") {
      if (oz <= 12) s += 8;
      else if (oz <= 20) s += 4;
      else if (oz <= 32) s += 0;
      else s -= 7;
    }
    if (p.slot === "pack" && typeof oz === "number" && oz <= 64) s += 3;
  } else if (d.weightBias === "carry") {
    if (typeof oz === "number") {
      if (oz <= 20) s += 3;
      else if (oz >= 40) s -= 2;
    }
  } else if (typeof p.durability === "number" && p.slot !== "headwear" && p.slot !== "nav" && p.slot !== "snacks") {
    s += p.durability >= 4 ? 2 : 0;
  }
  if (input.lodgings.includes("backpack") && (oz ?? 99) < 20) s += 2;
  if (input.weapon === "archery" && p.quiet) s += 1;
  if (p.slot === "pack") {
    const needsFrame = HIDE_AND_QUARTERS.includes(input.species) || QUARTER_GAME.includes(input.species);
    if (needsFrame && loadHauler(p)) s += 18;
    if (needsFrame && !loadHauler(p) && (d.weightBias !== "none" || input.lodgings.includes("backpack"))) s -= 10;
    // P0: multi-day backpack always prefers haul frames over day packs (static or active).
    if (multiDayBackpack(input)) {
      if (HAUL_PACK_IDS.has(p.id) || loadHauler(p)) s += 20;
      if (DAY_PACK_IDS.has(p.id)) s -= 25;
    } else if (input.lodgings.includes("backpack") && input.duration === "day") {
      if (DAY_PACK_IDS.has(p.id)) s += 4;
      if (HAUL_PACK_IDS.has(p.id)) s -= 6;
    }
  }
  if (p.slot === "seat" && input.travels.includes("long-hikes") && typeof oz === "number") {
    if (oz <= 90) s += 6;
    else if (oz >= 120) s -= 5;
  }
  if (p.slot === "snacks") {
    if (d.activity === "active" && (p.weightOz ?? 0) >= 30) s += 4;
  }
  if (p.slot === "food" && input.lodgings.includes("backpack") && p.price >= 14) s += 6;
  const remote = d.theater === "alaska" || d.weightBias !== "none" || input.lodgings.includes("backpack");
  if (p.slot === "first-aid") {
    if (remote && p.id === "surviveware-small") s -= 20;
    if (remote && p.id === "myfak-basic") s += 10;
    if (!remote && p.id === "adventure-medical-hunter") s += 4;
  }
  if (p.slot === "comm") {
    if (remote && /inreach/i.test(p.name)) s += 12;
    if (remote && /somewear/i.test(p.name)) s -= 16;
  }
  if (p.slot === "nav") {
    const truck = d.weightBias === "none";
    if (truck && p.id === "onx-hunt") s += 12;
    if (truck && p.id === "garmin-instinct-2") s -= 10;
    if (!truck && p.id === "garmin-instinct-2") s += 8;
    if (!truck && p.id === "onx-hunt") s += 4;
  }
  if (p.slot === "knife" && (HIDE_AND_QUARTERS.includes(input.species) || QUARTER_GAME.includes(input.species))) {
    if (/havalon/i.test(p.name)) s += 8;
  }
  if (p.slot === "saw" && /bahco/i.test(p.name)) s += 4;
  if (p.slot === "rangefinder") {
    const close = d.activity === "static" && d.theater === "midwest";
    if (close && p.price <= 200) s += 8;
    if (close && p.price >= 400) s -= 4;
  }
  if (p.slot === "water") {
    if (d.activity === "static" && /nalgene|yeti/i.test(p.name)) s += 6;
    if (d.activity === "static" && /hydrapak|seeker/i.test(p.name)) s -= 4;
    if (d.weightBias !== "none" && /hydrapak|seeker/i.test(p.name)) s += 8;
  }
  return s;
}

const SLOT_ORDER: SlotId[] = [
  "weapon",
  "release",
  "ammo",
  "broadhead",
  "scope",
  "base-top",
  "base-bottom",
  "midlayer-active",
  "insulation-static",
  "shell-wind",
  "shell-rain",
  "rain-pant",
  "pant-active",
  "pant-insulated",
  "glove-active",
  "glove-static",
  "headwear",
  "socks",
  "boots",
  "pack",
  "bino",
  "bino-harness",
  "rangefinder",
  "spotting-scope",
  "tripod",
  "nav",
  "comm",
  "headlamp",
  "harness",
  "lifeline",
  "saddle",
  "blind",
  "blaze-vest",
  "blaze-hat",
  "first-aid",
  "bear-spray",
  "knife",
  "saw",
  "game-bags",
  "calls",
  "seat",
  "sticks",
  "hand-muff",
  "water",
  "filter",
  "stove",
  "snacks",
  "food",
  "food-storage",
  "shelter",
  "sleep-bag",
  "sleep-pad",
  "poles",
];

const ELK_CHAMBERS = ["7prc", "300wm", "3006"] as const;
const DEER_CHAMBERS = ["65cm", "308", "3006"] as const;
const MAGNUM_CHAMBERS = ["338", "300wm"] as const;
const BEAR_CHAMBERS = ["3006", "308", "300wm"] as const;

function chambersFor(species: Species, weapon: HuntInput["weapon"], state: HuntState): NonNullable<Product["load"]>[] {
  if (weapon === "archery") return ["arrow"];
  if (weapon === "muzzleloader") return ["ml50"];
  if (weapon === "firearm" && state === "IA") return ["350leg"];
  if (species === "brown-bear" || species === "bison") return [...MAGNUM_CHAMBERS];
  if (
    species === "elk" ||
    species === "moose" ||
    species === "caribou" ||
    species === "mountain-goat" ||
    species === "bighorn"
  )
    return [...ELK_CHAMBERS];
  if (species === "black-bear") return [...BEAR_CHAMBERS];
  return [...DEER_CHAMBERS];
}

function labelFor(slot: SlotId, input: HuntInput) {
  if (slot === "weapon") return weaponSlotLabel(input.weapon);
  if (slot === "ammo") return ammoSlotLabel(input.weapon);
  return slotLabel[slot] ?? slot;
}

function pickByTier(cands: Product[], tiers: Tier[]) {
  const out: Product[] = [];
  for (const t of ["value", "mid", "premium"] as const) {
    if (!tiers.includes(t)) continue;
    const hit = cands.find((c) => c.tier === t);
    if (hit) out.push(hit);
  }
  if (out.length === 0) {
    const step: Tier[] = tiers.includes("premium")
      ? ["premium", "mid", "value"]
      : tiers.includes("mid")
        ? ["mid", "premium", "value"]
        : ["value", "mid", "premium"];
    for (const t of step) {
      const hit = cands.find((c) => c.tier === t);
      if (hit) {
        out.push(hit);
        break;
      }
    }
  }
  return out;
}

const SAFETY_SLOTS: SlotId[] = [
  "harness",
  "lifeline",
  "first-aid",
  "comm",
  "bear-spray",
  "food-storage",
  "boots",
  "sleep-bag",
  "shelter",
];

/** Copy leftover that marks an intentional cheap pick — never the selected item if a real option exists. */
function looksBudget(p: Product) {
  return /budget|cheap field|cheap packable|entry glass|dump layer|intentional budget/i.test(`${p.builtFor} ${p.name}`);
}

function pickSelected(
  options: Product[],
  slot: SlotId,
  input: HuntInput,
  d: Derived,
  w: WeatherNormals,
  warmthSlots: SlotId[],
): Product | undefined {
  if (!options.length) return undefined;
  if (slot === "release") {
    const index = options.filter((o) => o.style === "index");
    return index.find((o) => o.tier === "mid") ?? index[0] ?? options[0];
  }
  if (slot === "ammo" || slot === "scope") return options.find((o) => o.tier === "mid") ?? options[0];

  const scored = [...options].sort((a, b) => {
    const ds = score(b, input, d, w) - score(a, input, d, w);
    if (ds !== 0) return ds;
    const rank = (t: Tier) => (t === "mid" ? 0 : t === "premium" ? 1 : 2);
    const tr = rank(a.tier) - rank(b.tier);
    if (tr !== 0) return tr;
    return a.price - b.price;
  });

  const notBudget = scored.filter((p) => !looksBudget(p));
  let pool = notBudget.length ? notBudget : scored;

  if (SAFETY_SLOTS.includes(slot)) {
    const solid = pool.filter((p) => (p.durability ?? 3) >= 3 && !looksBudget(p));
    if (solid.length) pool = solid;
  }

  if (d.insulation === "high" && warmthSlots.includes(slot)) {
    return [...pool].sort((a, b) => b.warmth - a.warmth || a.price - b.price)[0];
  }

  if (input.tiers.length === 1) {
    const hit = pool.find((o) => o.tier === input.tiers[0]);
    if (hit) {
      const best = pool[0];
      const gap = score(best, input, d, w) - score(hit, input, d, w);
      if (gap <= 5) return hit;
    }
  }

  const mid = pool.find((o) => o.tier === "mid");
  if (mid && input.tiers.length !== 1) {
    const best = pool[0];
    const gap = score(best, input, d, w) - score(mid, input, d, w);
    if (gap <= 5 && (!SAFETY_SLOTS.includes(slot) || (mid.durability ?? 3) >= 3)) return mid;
  }

  return pool[0];
}

/** At least one index and one thumb so the board is Trigger vs Thumb, not price tiers. */
function pickReleases(cands: Product[], tiers: Tier[]) {
  const wanted = tiers.length ? tiers : (["value", "mid", "premium"] as Tier[]);
  const take = (style: "index" | "thumb") => {
    const pool = cands.filter((c) => c.style === style);
    const out: Product[] = [];
    for (const t of ["value", "mid", "premium"] as const) {
      if (!wanted.includes(t)) continue;
      const hit = pool.find((c) => c.tier === t);
      if (hit) out.push(hit);
    }
    if (!out.length && pool[0]) out.push(pool[0]);
    return out.slice(0, 2);
  };
  const merged = [...take("index"), ...take("thumb")];
  return merged.length ? merged : pickByTier(cands, wanted);
}

function tradeoffs(options: Product[]) {
  if (options.length < 2) return [];
  const axes: KitRow["tradeoffs"] = [];
  const cheapest = [...options].sort((a, b) => a.price - b.price)[0];
  axes.push({
    axis: "Best value",
    productId: cheapest.id,
    reason: `${cheapest.name} is the lowest price that still fits this slot.`,
  });
  const withWeight = options.filter((o) => typeof o.weightOz === "number");
  if (withWeight.length >= 2) {
    const lightest = [...withWeight].sort((a, b) => (a.weightOz ?? 99) - (b.weightOz ?? 99))[0];
    if (lightest.id !== cheapest.id)
      axes.push({
        axis: "Lightest",
        productId: lightest.id,
        reason: `${lightest.name} is ${lightest.weightOz} oz.`,
      });
  }
  const warmest = [...options].sort((a, b) => b.warmth - a.warmth)[0];
  if (warmest.warmth > Math.min(...options.map((o) => o.warmth)))
    axes.push({
      axis: "Warmest",
      productId: warmest.id,
      reason: `${warmest.name} carries the highest warmth rank in this row.`,
    });
  const withDur = options.filter((o) => typeof o.durability === "number");
  if (withDur.length >= 2) {
    const tough = [...withDur].sort((a, b) => (b.durability ?? 0) - (a.durability ?? 0))[0];
    axes.push({
      axis: "Most durable",
      productId: tough.id,
      reason: `${tough.name} is the most durable option we have sourced.`,
    });
  }
  const seen = new Set<string>();
  return axes.filter((a) => {
    if (seen.has(a.productId + a.axis)) return false;
    seen.add(a.productId + a.axis);
    return true;
  });
}

function sentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function alpineCountry(input: HuntInput, d: Derived) {
  return (
    input.terrains.includes("steep-alpine") ||
    d.theater === "alaska" ||
    (d.theater === "west" && input.terrains.some((t) => t === "foothills" || t === "timber"))
  );
}

function thisHuntIsMountain(input: HuntInput, d: Derived) {
  return (
    alpineCountry(input, d) &&
    (d.activity === "active" || input.lodgings.includes("backpack") || input.terrains.includes("steep-alpine"))
  );
}

function thisHuntIsSit(d: Derived) {
  return d.activity === "static" || d.quietHard;
}

const DEERISH: Species[] = ["whitetail", "mule-deer", "sitka-blacktail"];
const QUARTER_GAME: Species[] = ["elk", "caribou", "mountain-goat", "bighorn", "moose"];
const HIDE_AND_QUARTERS: Species[] = ["brown-bear", "bison", "moose"];

function animal(species: Species) {
  return speciesLabel[species].toLowerCase();
}

function an(species: Species) {
  const a = animal(species);
  return /^[aeiou]/i.test(a) ? `an ${a}` : `a ${a}`;
}

/** Swap leftover quarry names in catalog/LLM copy so a brown bear kit never talks about a deer. */
export function retargetSpecies(text: string, species: Species): string {
  const a = animal(species);
  const swaps: Array<{ keep: boolean; re: RegExp }> = [
    { keep: species === "mule-deer", re: /\bmule deer\b|\bmuleys?\b/gi },
    { keep: species === "whitetail", re: /\bwhitetails?\b/gi },
    { keep: species === "sitka-blacktail", re: /\bsitka blacktails?\b|\bblacktails?\b/gi },
    { keep: species === "pronghorn", re: /\bpronghorns?\b|\bantelopes?\b/gi },
    { keep: species === "elk", re: /\belk\b|\bwapiti\b/gi },
    { keep: species === "moose", re: /\bmoose\b/gi },
    { keep: species === "caribou", re: /\bcaribou\b|\breindeer\b/gi },
    { keep: species === "mountain-goat", re: /\bmountain goats?\b/gi },
    { keep: species === "bighorn", re: /\bbighorn(?: sheep)?\b|\bsheep hunt\b|\bsheep country\b/gi },
    { keep: species === "bison", re: /\bbison\b|\bbuffalo\b/gi },
    { keep: species === "black-bear", re: /\bblack bears?\b/gi },
    { keep: species === "brown-bear", re: /\bbrown bears?\b|\bgrizzl(?:y|ies)\b/gi },
    { keep: DEERISH.includes(species), re: /\bdeers?\b/gi },
  ];
  let out = text;
  for (const { keep, re } of swaps) {
    if (keep) continue;
    out = out.replace(re, a);
  }
  const esc = a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  out = out.replace(new RegExp(`(?:${esc}\\s*,\\s*)+(?:and\\s+)?${esc}`, "gi"), a);
  out = out.replace(new RegExp(`${esc}\\s+and\\s+${esc}`, "gi"), a);
  return out;
}

function loadHauler(p: Product) {
  return (p.weightOz ?? 0) >= 70 || /metcalf|k4|5000|exodus/i.test(p.name);
}

function slotWhy(p: Product, input: HuntInput): string | null {
  const a = animal(input.species);
  const anA = an(input.species);
  const hide = HIDE_AND_QUARTERS.includes(input.species);
  const quarters = QUARTER_GAME.includes(input.species);

  if (p.slot === "pack") {
    if (hide) {
      return loadHauler(p)
        ? `Load-hauling frame for ${anA}. Hide, skull, and quarters are the job.`
        : `Day pack for glassing and the stalk. Hide and quarters from ${anA} do not ride out in this — you want a frame, a boat, or multiple trips.`;
    }
    if (quarters) {
      return loadHauler(p)
        ? `Meat-hauling pack for ${a} quarters.`
        : `Expandable day pack. Fine close to the truck; ${a} quarters want a frame if you fill a tag in the backcountry.`;
    }
    if (input.species === "black-bear") {
      return loadHauler(p)
        ? `Load-hauling pack for a black bear hide and quarters.`
        : /pop-up|superday/i.test(p.name)
          ? `Expandable day pack that can take a boned black bear if you are close to the truck.`
          : null;
    }
    if (loadHauler(p)) return `Load-hauler. Right if you are packing camp and ${anA}; overkill for a short walk to the truck.`;
    if (/pop-up|superday/i.test(p.name)) return `Expandable day pack that can take a boned ${a}.`;
    return null;
  }

  if (p.slot === "game-bags") {
    if (hide) return `Heavy bags for ${a} hide and quarters. Buy the large set.`;
    if (quarters) return `Breathable quarter bags sized for ${a}.`;
    if (input.species === "black-bear") return `Bags for a black bear hide and boned meat.`;
    return `Breathable bags for a boned ${a}.`;
  }

  if (p.slot === "knife") {
    return hide || quarters
      ? `Field knife for ${anA}. Carry extra blades — this is a long skinning job.`
      : `Field knife for ${anA}. Carry extra blades.`;
  }

  if (p.slot === "ammo") {
    const first = sentences(retargetSpecies(p.builtFor, input.species))[0] ?? p.builtFor;
    if (new RegExp(a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(first)) return first;
    return `${first.replace(/\.$/, "")} for this ${a}.`;
  }

  if (p.slot === "broadhead") {
    return `Hunting head for ${a}. Fly these with the arrows in the kit. Confirm they are legal in the unit.`;
  }

  return null;
}

/** Drop contrast that is about a hunt this person is not on. */
export function fitCopy(text: string, input: HuntInput, d: Derived) {
  const mountain = thisHuntIsMountain(input, d);
  const sit = thisHuntIsSit(d);
  const origin = kitOrigin(input.accesses, input.lodgings);
  const hikes =
    input.travels.some((t) => t === "long-hikes" || t === "repeated-climbs" || t === "packing-camp-daily") ||
    input.lodgings.includes("backpack");
  let out = sentences(retargetSpecies(text, input.species))
    .filter((s) => {
      const l = s.toLowerCase();
      if (
        !alpineCountry(input, d) &&
        /\balpine\b|mountain (piece|boot|shell|pant|hunt|softshell|miles)|alpine miles|cover miles|not a mountain|last bowl|9,000|basin\b|mountain hunts/i.test(
          l,
        )
      )
        return false;
      if (!hikes && /not for hik|do not hike|hike in these|for a climb|on the climb/i.test(l)) return false;
      if (
        !sit &&
        /\btreestand\b|hang-on|stand bib|stand hunt|stand muff|whitetail sit|rubber knee|field edge|from a stand/i.test(l)
      )
        return false;
      if (sit && !mountain && /overkill for a treestand|not a backpack-hunt|not a mountain item/i.test(l)) return false;
      if (!mountain && /fanatic replacement|not a fanatic|jetstream|basin shot|mountain miles/i.test(l)) return false;
      if (d.theater !== "alaska" && /\balaska\b|\bcub\b|\bbush plane\b|coastal brown/i.test(l)) return false;
      if (!input.lodgings.includes("backpack") && /backpack elk|backpack-hunt pack|7-day haul/i.test(l)) return false;
      if (input.state !== "IA" && /straight-wall|iowa firearm/i.test(l)) return false;
      if (!(input.month >= 8 && input.month <= 9) && /september hunt/i.test(l)) return false;
      if (!(input.month <= 2 || input.month >= 11) && /late-season stand/i.test(l)) return false;
      if (d.activity === "active" && !sit && /\bsit coat\b|\bsit jacket\b|\bsit bib\b|\bsit beanie\b|\bstand sit\b/i.test(l))
        return false;
      if (/bigger animal|ever on the card/i.test(l)) return false;
      return true;
    })
    .join(" ")
    .trim();
  if (!out) out = sentences(retargetSpecies(text, input.species))[0] || retargetSpecies(text, input.species);
  if (origin !== "the truck") out = out.replace(/\bthe truck\b/gi, origin).replace(/\btailgate\b/gi, origin);
  return out;
}


/** Plain-language role of each slot — for beginners, not brand claims. */
const SLOT_PLAIN: Partial<Record<SlotId, string>> = {
  "base-top": "Shirt against your skin. Moves sweat so you stay warmer when you stop.",
  "base-bottom": "Bottoms against your skin. Same job as the top base — manage sweat.",
  "midlayer-active": "Warmth you hike in. Light enough to climb without soaking yourself.",
  "insulation-static": "The warm layer you put on when you stop or sit. Keep it in the pack until then.",
  "shell-wind": "Blocks wind so your layers keep working. Not the same as a rain jacket.",
  "shell-rain": "Keeps you dry in squalls. Pack it even on clear mornings.",
  "pant-active": "Pants built for walking and brush. Quiet and tough matter more than looks.",
  "pant-insulated": "Warm pants or bibs for long sits in cold. Too hot for most climbs.",
  "glove-active": "Gloves you can hike and shoot in. Dexterity over max warmth.",
  "glove-static": "Warmer gloves for the sit. Swap them on when you stop moving.",
  headwear: "Hat or beanie for sun, cold, or quiet. Match the weather, not the catalog photo.",
  socks: "Hunting socks — spare pair in the pack. Blisters end hunts.",
  boots: "Boots that fit this terrain and month. Break them in before opening day.",
  pack: "Carries layers, water, and (on multi-day hunts) meat. Size to the hunt, not the store.",
  bino: "Binoculars to find animals before they find you.",
  "bino-harness": "Keeps binos on your chest so they do not swing or slap.",
  rangefinder: "Tells you the distance. Critical for ethical shots.",
  "spotting-scope": "High-power glass for long basins. Pair with a tripod when you sit and look.",
  tripod: "Holds the spotting scope steady for long glassing sessions.",
  nav: "Map and GPS so you know where you are when cell service dies.",
  comm: "Satellite or radio link when you are out of cell range.",
  headlamp: "Hands-free light for dark walks in and out.",
  harness: "Fall-arrest tether for tree stands. Connect it before you leave the ground.",
  "blaze-vest": "Hunter orange vest when the law (or safety) calls for it. Confirm the agency rule.",
  "blaze-hat": "Hunter orange cap when required. Confirm the agency rule.",
  "first-aid": "Trauma basics for the field. Know what is in it before you need it.",
  knife: "Knife and field-care tools for after the shot.",
  "game-bags": "Breathable bags for packing meat clean.",
  calls: "Calls matched to this species and tactic.",
  release: "Archery release aid — how you fire the bow.",
  seat: "Cushion for long sits so you stay still.",
  "hand-muff": "Warm pocket for hands on cold stands.",
  water: "Water you can carry. Plan liters for the day and heat.",
  filter: "Treats backcountry water so you do not drink untreated sources.",
  stove: "Cook and melt snow or heat water in camp.",
  shelter: "Tent or tarp for overnight pack-in nights.",
  "sleep-bag": "Sleep bag rated for the night lows you pack for.",
  "sleep-pad": "Insulation under you — the ground steals more heat than air.",
  "bear-spray": "Deterrent in bear country. Know how to fire it; do not invent local rules.",
  poles: "Trekking poles for steep climbs and heavy packs.",
  weapon: "The rifle, bow, or muzzleloader you will hunt with on this trip.",
  ammo: "Ammunition or arrows matched to the weapon in this kit.",
  broadhead: "Hunting heads for archery. Confirm they are legal in the unit.",
  scope: "Optic for the rifle or muzzleloader in this kit.",
  snacks: "Day food you can eat without a stove.",
  food: "Trail meals for overnight nights.",
  saw: "Bone saw for quartering when you cannot drag whole.",
  lifeline: "Lifeline from the ground to the stand. Clip in before you climb.",
  sticks: "Climbing sticks to get into the hang-on or saddle.",
  "rain-pant": "Rain pants over the hunting pant. A jacket alone still soaks your legs.",
  saddle: "Tree saddle for mobile timber sits.",
  blind: "Ground blind when you hunt from cover on the ground.",
  "food-storage": "Bear-country food storage — not the tent.",
};

export function defaultWhy(p: Product, d: Derived, input: HuntInput) {
  if (d.quietHard && p.slot === "shell-rain" && p.quiet) return "Quiet rain face for a close-range sit.";
  if (p.slot === "food-storage") return "Bear country. Food, toothpaste, and trash stay in this — not where you sleep.";
  if (p.slot === "snacks" || p.slot === "food") {
    const fuel = fuelFor(input, d);
    if (p.slot === "snacks") {
      const packSnacks = input.duration === "day" ? fuel.kcalPerDay : fuel.snackKcal;
      const bars = Math.max(1, Math.round(packSnacks / 250));
      return `About ${fuel.kcalPerHour} kcal an hour on this hunt. Pack roughly ${bars} bars a day — not one granola bar.`;
    }
    return `About ${fuel.kcalPerDay.toLocaleString()} kcal a day for ${fuel.days} days. Buy ${fuel.mealCount} pouches, not one dinner.`;
  }
  if (p.slot === "saw") {
    const anA = an(input.species);
    return HIDE_AND_QUARTERS.includes(input.species) || QUARTER_GAME.includes(input.species)
      ? `Bone saw for ${anA}. Split the pelvis and take the quarters apart in the field.`
      : `Bone saw for ${anA}. Remote country — you may need to cut bone to pack meat.`;
  }
  if (p.slot === "lifeline") return "Lifeline from the ground to the stand. Clip in before you climb.";
  if (p.slot === "sticks") return "Climbing sticks to get into the hang-on or saddle. The stand is not a climb.";
  if (p.slot === "rain-pant") return "Rain pants over the hunting pant. A jacket alone still soaks your legs.";
  if (p.slot === "water") {
    return d.activity === "static"
      ? "Water on the stand. A sit still takes a bottle."
      : "Water on you. Do not count on a creek.";
  }
  const slotted = slotWhy(p, input);
  let built = slotted ? fitCopy(slotted, input, d) : fitCopy(p.builtFor, input, d);
  if (input.experience !== "beginner") return built;
  const plain = SLOT_PLAIN[p.slot];
  if (!plain) return built;
  if (built.toLowerCase().startsWith(plain.slice(0, 18).toLowerCase())) return built;
  return `${plain} Why this pick: ${built}`;
}

export function whyConflictsQuiet(why: string, p: Product, quietHard: boolean) {
  if (!quietHard) return false;
  if (!p.quiet) return /quiet|silent|fleece|tricot/i.test(why) && QUIET_CLOTHING.includes(p.slot);
  if (/stays in|leave|do not wear|not this|dump jacket/i.test(why)) return false;
  return /\bis loud\b|this .* noisy|sounds like a tarp when you draw this/i.test(why);
}

export function recoupleAmmo(rows: KitRow[], input: HuntInput, d: Derived) {
  const weaponRow = rows.find((r) => r.slot === "weapon");
  const ammoRow = rows.find((r) => r.slot === "ammo");
  if (!weaponRow || !ammoRow) return rows;
  const weapon = weaponRow.options.find((o) => o.id === weaponRow.selectedId);
  if (!weapon?.load) return rows;
  const cands = CATALOG.filter((p) => p.slot === "ammo" && p.load === weapon.load);
  if (!cands.length) return rows;
  const options = pickByTier(cands, input.tiers.length ? input.tiers : (["value", "mid", "premium"] as Tier[]));
  const prev = ammoRow.options.find((o) => o.id === ammoRow.selectedId);
  const selected = options.find((o) => o.tier === prev?.tier) ?? options[0];
  if (!selected) return rows;
  return rows.map((r) =>
    r.slot === "ammo"
      ? {
          ...r,
          options,
          selectedId: selected.id,
          why: defaultWhy(selected, d, input),
          tradeoffs: tradeoffs(options),
          verdicts: ammoRow.verdicts ?? [],
        }
      : r,
  );
}

export function buildRows(input: HuntInput, d: Derived, w: WeatherNormals) {
  const tiers = input.tiers.length ? input.tiers : (["value", "mid", "premium"] as Tier[]);
  const rows: KitRow[] = [];
  const allowedChambers = chambersFor(input.species, input.weapon, input.state);
  let selectedWeapon: Product | undefined;
  for (const slot of SLOT_ORDER) {
    if (!d.slots.includes(slot)) continue;
    let cands = CATALOG.filter(
      (p) =>
        p.slot === slot &&
        theaterOk(p, d.theater) &&
        weaponOk(p, input.weapon) &&
        activityOk(p, d.activity, d.quietHard, d.insulation, input.month, d.theater, input) &&
        warmthOk(p, d.insulation, input.month) &&
        speciesCallOk(p, input.species) &&
        productFitsHunt(p, input, d),
    );
    if (slot === "weapon") cands = cands.filter((p) => !p.load || allowedChambers.includes(p.load));
    if (slot === "ammo") {
      const chamber = selectedWeapon?.load;
      cands = chamber
        ? cands.filter((p) => p.load === chamber)
        : cands.filter((p) => p.load && allowedChambers.includes(p.load));
    }
    if (cands.length === 0) continue;
    cands = [...cands].sort((a, b) => score(b, input, d, w) - score(a, input, d, w));
    const warmthSlots: SlotId[] = [
      "base-top",
      "base-bottom",
      "insulation-static",
      "pant-insulated",
      "glove-static",
      "headwear",
      "socks",
      "boots",
      "sleep-bag",
      "hand-muff",
    ];
    let options: Product[];
    if (slot === "weapon") {
      const pool = cands.filter((p) => tiers.includes(p.tier));
      options = pickDiverseWeapons(pool.length ? pool : cands, 4);
    } else if (slot === "release") {
      options = pickReleases(cands, tiers);
    } else {
      const best: Product[] = [];
      for (const t of ["value", "mid", "premium"] as const) {
        const hit = cands.find((c) => c.tier === t);
        if (hit) best.push(hit);
      }
      options = pickByTier(best.length ? best : cands, tiers);
    }
    if (slot === "nav" && d.weightBias === "none") {
      const onx = cands.find((p) => p.id === "onx-hunt");
      if (onx && !options.some((o) => o.id === onx.id)) options = [...options, onx];
    }
    if (slot === "rangefinder" && d.activity === "static" && d.theater === "midwest") {
      const close = cands.find((p) => p.id === "leupold-rx-1400i") ?? cands.find((p) => p.id === "sig-kilo-1000");
      if (close && !options.some((o) => o.id === close.id)) options = [...options, close];
    }
    if (!options.length) continue;
    const selected = pickSelected(options, slot, input, d, w, warmthSlots);
    if (!selected) continue;
    if (slot === "weapon") selectedWeapon = selected;
    let row: KitRow = {
      slot,
      label: labelFor(slot, input),
      why: defaultWhy(selected, d, input),
      options,
      selectedId: selected.id,
      tradeoffs: slot === "weapon" || slot === "release" ? [] : tradeoffs(options),
      verdicts: [],
    };
    if (slot === "weapon") row = attachWeaponVerdicts(row, input, d);
    if (slot === "release") row = attachReleaseVerdicts(row, input, d);

    // Multi-day backpack: never lead with a day pack — prefer a haul frame even if premium.
    if (slot === "pack" && multiDayBackpack(input)) {
      const haulPool = [...options, ...cands].filter((p) => HAUL_PACK_IDS.has(p.id) || loadHauler(p));
      const haul = haulPool.sort((a, b) => score(b, input, d, w) - score(a, input, d, w))[0];
      if (haul) {
        if (!row.options.some((o) => o.id === haul.id)) row.options = [...row.options, haul];
        row.selectedId = haul.id;
        row.why = defaultWhy(haul, d, input);
        if (!/multi-day backpack/i.test(row.why)) {
          row.why = `${row.why} Multi-day backpack hunts need a load-hauling frame for camp plus meat — not a Pro 2300-class day pack.`;
        }
      }
    }

    rows.push(row);
  }

  // Brand cap: if one brand is > 28% of selected, swap later rows to next option.
  // Never demote a selected haul frame back to a day pack.
  const selectedProducts = () =>
    rows.map((r) => r.options.find((o) => o.id === r.selectedId)).filter((x): x is Product => Boolean(x));
  const brandShare = (brand: string) => {
    const sel = selectedProducts();
    if (!sel.length) return 0;
    return sel.filter((p) => p.brand === brand).length / sel.length;
  };
  for (const row of rows) {
    const cur = row.options.find((o) => o.id === row.selectedId);
    if (!cur) continue;
    if (row.slot === "pack" && multiDayBackpack(input) && (HAUL_PACK_IDS.has(cur.id) || loadHauler(cur))) {
      continue;
    }
    if (brandShare(cur.brand) > 0.28) {
      const alt = row.options.find((o) => o.brand !== cur.brand);
      if (!alt) continue;
      if (row.slot === "pack" && multiDayBackpack(input) && DAY_PACK_IDS.has(alt.id)) continue;
      row.selectedId = alt.id;
      row.why = defaultWhy(alt, d, input);
    }
  }

  return recoupleAmmo(rows, input, d);
}

export function kitTotal(rows: KitRow[]) {
  return rows.reduce((sum, r) => {
    return sum + (r.options.find((o) => o.id === r.selectedId)?.price ?? 0);
  }, 0);
}

/** Plain Amazon search link (no tag= params). */
export function amazonUrl(p: Product) {
  return `https://www.amazon.com/s?k=${encodeURIComponent(p.amazonQuery)}`;
}

function shopifySearch(host: string) {
  return (q: string) => `https://${host}/search?q=${encodeURIComponent(q)}`;
}

function paramSearch(base: string, param = "q") {
  const join = base.includes("?") ? "&" : "?";
  return (q: string) => `${base}${join}${param}=${encodeURIComponent(q)}`;
}

function wpSearch(host: string) {
  return (q: string) => `https://${host}/?s=${encodeURIComponent(q)}`;
}

function magentoSearch(host: string) {
  return (q: string) => `https://${host}/catalogsearch/result/?q=${encodeURIComponent(q)}`;
}

function bigcSearch(host: string) {
  return (q: string) => `https://${host}/search.php?search_query=${encodeURIComponent(q)}`;
}

type BrandShop = {
  label: string;
  /** Retailers need the brand in the query. Brand sites search better without it. */
  fullQuery?: boolean;
  search: (q: string) => string;
};

const SPORTSMANS: BrandShop = {
  label: "Sportsman's",
  fullQuery: true,
  search: paramSearch("https://www.sportsmans.com/search"),
};

const LANCASTER: BrandShop = {
  label: "Lancaster",
  fullQuery: true,
  search: shopifySearch("lancasterarchery.com"),
};

const MIDWAY: BrandShop = {
  label: "MidwayUSA",
  fullQuery: true,
  search: paramSearch("https://www.midwayusa.com/s", "searchTerm"),
};

const BRAND_SHOP: Record<string, BrandShop> = {
  Sitka: { label: "Sitka", search: shopifySearch("www.sitkagear.com") },
  "First Lite": { label: "First Lite", search: shopifySearch("www.firstlite.com") },
  KUIU: { label: "KUIU", search: shopifySearch("www.kuiu.com") },
  "Stone Glacier": { label: "Stone Glacier", search: shopifySearch("www.stoneglacier.com") },
  Pnuma: { label: "Pnuma", search: shopifySearch("www.pnumaoutdoors.com") },
  Huntworth: { label: "Huntworth", search: bigcSearch("www.huntworthgear.com") },
  "Outdoor Research": { label: "OR", search: shopifySearch("www.outdoorresearch.com") },
  Smartwool: { label: "Smartwool", search: shopifySearch("www.smartwool.com") },
  "Darn Tough": { label: "Darn Tough", search: shopifySearch("www.darntough.com") },
  "Farm to Feet": { label: "Farm to Feet", search: shopifySearch("www.farmtofeet.com") },
  Carhartt: { label: "Carhartt", search: paramSearch("https://www.carhartt.com/search") },
  Wrangler: { label: "Wrangler", search: paramSearch("https://www.wrangler.com/search") },
  Mechanix: { label: "Mechanix", search: shopifySearch("www.mechanix.com") },
  "Frogg Toggs": { label: "Frogg Toggs", search: shopifySearch("www.froggtoggs.com") },
  Decathlon: { label: "Decathlon", search: paramSearch("https://www.decathlon.com/search", "Ntt") },
  Kenetrek: { label: "Kenetrek", search: shopifySearch("www.kenetrek.com") },
  Danner: { label: "Danner", search: magentoSearch("www.danner.com") },
  LaCrosse: { label: "LaCrosse", search: magentoSearch("www.lacrossefootwear.com") },
  Muck: { label: "Muck", search: shopifySearch("www.muckbootcompany.com") },
  "Irish Setter": { label: "Irish Setter", search: paramSearch("https://www.irishsetterboots.com/search") },
  Exo: { label: "Exo", search: shopifySearch("exomtngear.com") },
  "Mystery Ranch": { label: "Mystery Ranch", search: shopifySearch("www.mysteryranch.com") },
  Badlands: { label: "Badlands", search: shopifySearch("www.badlandsgear.com") },
  Vortex: SPORTSMANS,
  Maven: { label: "Maven", search: shopifySearch("mavenbuilt.com") },
  Swarovski: { label: "Swarovski", search: paramSearch("https://www.swarovskioptik.com/us/en/hunting/search") },
  Leupold: { label: "Leupold", search: paramSearch("https://www.leupold.com/search") },
  "Sig Sauer": SPORTSMANS,
  Leofoto: { label: "Leofoto", search: wpSearch("www.leofoto.com") },
  Garmin: { label: "Garmin", search: paramSearch("https://www.garmin.com/en-US/search/", "q") },
  ACR: { label: "ACR", search: wpSearch("www.acrartex.com") },
  Somewear: { label: "Somewear", search: wpSearch("somewearlabs.com") },
  "Black Diamond": { label: "Black Diamond", search: paramSearch("https://www.blackdiamondequipment.com/search") },
  HSS: { label: "HSS", search: shopifySearch("www.huntersafetysystem.com") },
  "Tree Spider": { label: "Tree Spider", search: shopifySearch("www.huntersafetysystem.com") },
  Summit: { label: "Summit", search: wpSearch("www.summitstands.com") },
  Muddy: { label: "Muddy", search: paramSearch("https://www.gomuddy.com/search") },
  "Hunter's Specialties": { label: "HS", search: paramSearch("https://www.hunterspec.com/search") },
  Duel: { label: "Duel", search: shopifySearch("www.duelgamecalls.com") },
  "Rocky Mountain": { label: "Rocky Mountain", search: shopifySearch("www.buglingbull.com") },
  "Adventure Medical": { label: "Adventure Medical", search: shopifySearch("www.adventuremedicalkits.com") },
  "My Medic": { label: "My Medic", search: shopifySearch("mymedic.com") },
  "Counter Assault": { label: "Counter Assault", search: shopifySearch("www.counterassault.com") },
  UDAP: { label: "UDAP", search: wpSearch("www.udap.com") },
  Havalon: { label: "Havalon", search: shopifySearch("www.havalon.com") },
  "Outdoor Edge": { label: "Outdoor Edge", search: shopifySearch("www.outdooredge.com") },
  Benchmade: { label: "Benchmade", search: paramSearch("https://www.benchmade.com/search") },
  "Caribou Gear": { label: "Caribou Gear", search: shopifySearch("caribougear.com") },
  Phelps: { label: "Phelps", search: shopifySearch("phelpsgamecalls.com") },
  Primos: { label: "Primos", search: paramSearch("https://www.primos.com/search") },
  Stan: { label: "Stan", search: shopifySearch("www.truball.com") },
  "Tru-Fire": LANCASTER,
  "T.R.U. Ball": LANCASTER,
  Scott: { label: "Scott", search: shopifySearch("www.scottarchery.com") },
  Bahco: MIDWAY,
  Silky: MIDWAY,
  "Mountain House": { label: "Mountain House", search: shopifySearch("www.mountainhouse.com") },
  "Peak Refuel": { label: "Peak Refuel", search: shopifySearch("www.peakrefuel.com") },
  "Therm-a-Rest": { label: "Therm-a-Rest", search: shopifySearch("www.thermarest.com") },
  Millennium: { label: "Millennium", search: wpSearch("www.millenniumstands.com") },
  Hawk: { label: "Hawk", search: wpSearch("www.hawkhunting.com") },
  "Rivers Edge": { label: "Rivers Edge", search: shopifySearch("www.huntriversedge.com") },
  Tethrd: { label: "Tethrd", search: shopifySearch("www.tethrd.com") },
  Trophyline: { label: "Trophyline", search: shopifySearch("www.trophyline.com") },
  Ameristep: { label: "Ameristep", search: bigcSearch("www.ameristep.com") },
  NEMO: { label: "NEMO", search: shopifySearch("www.nemoequipment.com") },
  Kelty: { label: "Kelty", search: shopifySearch("www.kelty.com") },
  Durston: { label: "Durston", search: shopifySearch("www.durstongear.com") },
  REI: { label: "REI", search: paramSearch("https://www.rei.com/search") },
  MSR: { label: "MSR", search: shopifySearch("www.msrgear.com") },
  Jetboil: { label: "Jetboil", search: shopifySearch("www.jetboil.com") },
  Sawyer: { label: "Sawyer", search: shopifySearch("sawyer.com") },
  Grayl: { label: "Grayl", search: shopifySearch("www.grayl.com") },
  Nalgene: { label: "Nalgene", search: wpSearch("www.nalgene.com") },
  HydraPak: { label: "HydraPak", search: shopifySearch("www.hydrapak.com") },
  Yeti: { label: "Yeti", search: paramSearch("https://www.yeti.com/search") },
  Montem: { label: "Montem", search: shopifySearch("montemlife.com") },
  onX: { label: "onX", search: () => "https://www.onxmaps.com/hunt" },
  Gaia: { label: "Gaia", search: () => "https://www.gaiagps.com/" },
  BearVault: { label: "BearVault", search: shopifySearch("www.bearvault.com") },
  Ursack: { label: "Ursack", search: shopifySearch("ursack.com") },
  Ruger: SPORTSMANS,
  Savage: SPORTSMANS,
  Tikka: SPORTSMANS,
  Browning: SPORTSMANS,
  Henry: SPORTSMANS,
  "Christensen Arms": { label: "Christensen", search: wpSearch("christensenarms.com") },
  Weatherby: { label: "Weatherby", search: wpSearch("weatherby.com") },
  Traditions: SPORTSMANS,
  CVA: SPORTSMANS,
  Diamond: LANCASTER,
  Bowtech: LANCASTER,
  Mathews: LANCASTER,
  Hoyt: LANCASTER,
  Federal: MIDWAY,
  Hornady: MIDWAY,
  Barnes: MIDWAY,
  PowerBelt: MIDWAY,
  "Gold Tip": LANCASTER,
  Easton: LANCASTER,
  Victory: LANCASTER,
  G5: LANCASTER,
  SEVR: LANCASTER,
  "Iron Will": LANCASTER,
};

const PRODUCT_SHOP: Record<string, { label: string; href: string }> = {
  "onx-hunt": { label: "onX", href: "https://www.onxmaps.com/hunt" },
  "gaia-premium": { label: "Gaia", href: "https://www.gaiagps.com/" },
};

function makerQuery(p: Product) {
  const escaped = p.brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const stripped = p.name.replace(new RegExp(`^${escaped}\\s+`, "i"), "").trim();
  return stripped || p.amazonQuery;
}

export function buyUrl(p: Product) {
  const exact = PRODUCT_SHOP[p.id];
  if (exact) return exact.href;
  const shop = BRAND_SHOP[p.brand];
  if (shop) {
    const q = shop.fullQuery ? p.amazonQuery : makerQuery(p);
    return shop.search(q);
  }
  return amazonUrl(p);
}

export function buyLabel(p: Product) {
  const exact = PRODUCT_SHOP[p.id];
  if (exact) return `Shop ${exact.label}`;
  const shop = BRAND_SHOP[p.brand];
  if (shop) return `Shop ${shop.label}`;
  return "Shop Amazon";
}

export function youtubeUrl(p: Product) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(p.reviewQuery)}`;
}
