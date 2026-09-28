import type { Access, Activity, HuntInput, Lodging, SkippedItem, SlotId, Tactic, Terrain, Travel, WeightBias } from "./types";
import { blazeFor } from "./blaze";
import { needsSaw } from "./fuel";
import { regionById, slotLabel, treeCountry } from "./options";

export type Derived = {
  activity: Activity;
  insulation: "low" | "moderate" | "high";
  quietHard: boolean;
  quietTie: boolean;
  slots: SlotId[];
  theater: "west" | "midwest" | "alaska";
  weightBias: WeightBias;
};

function hasAny<T>(list: readonly T[], ...items: T[]): boolean {
  return items.some((item) => list.includes(item));
}


/** Tree-stand / timber ambush — not open-country or alpine goat-style "ambush" sits. */
export function standLikeAmbush(
  input: HuntInput,
  theater: Derived["theater"] | "west" | "midwest" | "alaska",
): boolean {
  if (!input.tactics.includes("ambush")) return false;
  // Explicit tree / saddle blinds always count as stand-like.
  if (input.blinds.some((b) => b === "hang-on" || b === "ladder" || b === "climber" || b === "saddle")) {
    return true;
  }
  if (theater === "midwest") return true;
  if (input.terrains.some((t) => t === "timber" || t === "river-bottom")) return true;
  if (
    input.terrains.includes("foothills") &&
    (input.species === "whitetail" ||
      input.species === "mule-deer" ||
      input.species === "black-bear" ||
      input.species === "elk" ||
      input.species === "moose")
  ) {
    return true;
  }
  return false;
}

export function weightBiasFor(accesses: readonly Access[], lodgings: readonly Lodging[]): WeightBias {
  if (hasAny(accesses, "float-plane", "bush-plane")) return "payload";
  if (hasAny(accesses, "trailhead", "pack-stock", "boat") || hasAny(lodgings, "backpack", "pack-in-base")) return "carry";
  return "none";
}

/** Grizzly states, Alaska, hunting a bear, or mountain cover in CO/UT/NM. */
export function isBearCountry(
  input: { species: HuntInput["species"]; state: HuntInput["state"]; terrains: readonly Terrain[] },
  theater: Derived["theater"],
): boolean {
  if (theater === "alaska") return true;
  if (input.species === "brown-bear" || input.species === "black-bear") return true;
  if (input.state === "MT" || input.state === "WY" || input.state === "ID" || input.state === "AK") return true;
  if (input.state === "CO" || input.state === "UT" || input.state === "NM") {
    return input.terrains.some((t) => t === "steep-alpine" || t === "timber" || t === "foothills" || t === "river-bottom");
  }
  return false;
}

/** Sleeping in the field with food, not commuting home or to a hotel. */
export function sleepsInTheField(input: { duration: HuntInput["duration"]; lodgings: readonly Lodging[] }): boolean {
  if (input.duration === "day") return false;
  return hasAny(input.lodgings, "backpack", "pack-in-base", "wall-tent", "truck-camp");
}

export function derive(input: HuntInput): Derived {
  const region = regionById(input.regionId);
  const theater = region?.theater ?? "west";
  const blaze = blazeFor(input.state, input.weapon);
  const tactics: readonly Tactic[] = input.tactics;
  const lodgings: readonly Lodging[] = input.lodgings;
  const travels: readonly Travel[] = input.travels;
  const terrains: readonly Terrain[] = input.terrains;
  const accesses: readonly Access[] = input.accesses;
  const weightBias = weightBiasFor(accesses, lodgings);

  const hasStatic = hasAny(tactics, "ambush", "still-hunting");
  const hasMoving = hasAny(tactics, "spot-and-stalk", "tracking", "safari");
  const hasGlassCall = hasAny(tactics, "glassing", "calling");
  const hasGlassTravel = travels.includes("all-day-glassing");

  let activity: Activity = "active";
  if (hasStatic && !hasMoving && !hasGlassCall && !hasGlassTravel) activity = "static";
  else if (hasStatic || hasGlassCall || hasGlassTravel) activity = "mixed";
  else activity = "active";

  const late = input.month <= 2 || input.month >= 11;
  const early = input.month >= 8 && input.month <= 9;
  const alpine = terrains.includes("steep-alpine") || (region?.elevFt ?? 0) >= 8500;
  let insulation: Derived["insulation"] = "moderate";
  if (activity === "static" && (late || input.month === 10)) insulation = "high";
  else if (activity === "mixed" && late) insulation = "high";
  else if (early && activity === "active" && !alpine) insulation = "low";
  else if (input.month >= 4 && input.month <= 6) insulation = "low";
  else if (theater === "alaska" && (input.month >= 9 || input.month <= 4)) insulation = "high";

  const quietHard = input.weapon === "archery" && hasStatic;
  const quietTie = input.weapon === "archery" && hasAny(tactics, "calling", "spot-and-stalk");

  const slots = new Set<SlotId>([
    "weapon",
    "ammo",
    "base-top",
    "base-bottom",
    "headwear",
    "socks",
    "boots",
    "pack",
    "bino",
    "bino-harness",
    "headlamp",
    "first-aid",
    "knife",
    "nav",
    "snacks",
  ]);

  if (activity === "active" || activity === "mixed") slots.add("midlayer-active");
  if (activity === "static" || activity === "mixed" || insulation === "high") slots.add("insulation-static");
  if (activity === "active" || activity === "mixed") slots.add("shell-wind");
  slots.add("shell-rain");
  if (activity === "static") slots.add("pant-insulated");
  else slots.add("pant-active");
  if (activity === "mixed" && (hasGlassTravel || late || alpine)) {
    slots.add("pant-insulated");
    slots.add("pant-active");
  }
  if (insulation === "high" && activity === "static") slots.add("pant-insulated");

  if (activity === "static") slots.add("glove-static");
  else slots.add("glove-active");
  if (activity === "mixed") {
    slots.add("glove-active");
    if (late || insulation === "high") slots.add("glove-static");
  }

  const glassCountry =
    tactics.includes("glassing") ||
    hasGlassTravel ||
    hasAny(terrains, "prairie", "desert", "plains", "steep-alpine", "foothills");

  if (tactics.includes("glassing") || hasGlassTravel) {
    slots.add("spotting-scope");
    slots.add("tripod");
  }

  if (input.weapon === "archery" || glassCountry) slots.add("rangefinder");
  if (input.weapon === "archery") {
    slots.add("release");
    slots.add("broadhead");
  }
  if (input.weapon === "firearm" || input.weapon === "muzzleloader") {
    slots.add("scope");
  }

  const trees = treeCountry(terrains);
  const blinds = input.blinds;
  const treeStand = blinds.some((b) => b === "hang-on" || b === "ladder" || b === "climber");
  const onSaddle = blinds.includes("saddle");
  const groundBlind = blinds.some((b) => b === "hub" || b === "box" || b === "natural") || (tactics.includes("ambush") && !trees && !blinds.length);
  const bringStand = input.stands.includes("mobile") || (treeStand && !input.stands.includes("fixed"));
  if (tactics.includes("ambush") && standLikeAmbush(input, theater)) {
    if (treeStand && (input.stands.includes("fixed") || bringStand)) slots.add("harness");
    if (onSaddle) slots.add("saddle");
    if (treeStand && bringStand) slots.add("seat");
    if (blinds.includes("hub")) slots.add("blind");
    if (groundBlind) slots.add("seat");
    if (insulation === "high" || late) slots.add("hand-muff");
    if (treeStand) slots.add("lifeline");
    if (onSaddle || (blinds.includes("hang-on") && input.stands.includes("mobile"))) slots.add("sticks");
  } else if (tactics.includes("ambush")) {
    // Non-stand ambush (open country / alpine): ground blind or natural sit only.
    if (blinds.includes("hub")) slots.add("blind");
    if (groundBlind) slots.add("seat");
  }

  if (blaze.required) {
    slots.add("blaze-vest");
    slots.add("blaze-hat");
  }

  const overnight = input.duration !== "day";
  const flyIn = hasAny(accesses, "float-plane", "bush-plane");
  const walkIn = hasAny(accesses, "trailhead", "pack-stock");
  const backcountry =
    hasAny(lodgings, "backpack", "pack-in-base", "wall-tent") || flyIn || walkIn;

  if (overnight && hasAny(lodgings, "backpack", "pack-in-base", "truck-camp", "wall-tent")) {
    slots.add("sleep-bag");
    slots.add("sleep-pad");
  }
  if (hasAny(lodgings, "backpack", "pack-in-base") || flyIn) {
    slots.add("shelter");
    slots.add("stove");
    slots.add("filter");
  }
  if (lodgings.includes("wall-tent")) {
    slots.add("stove");
  }
  if (lodgings.includes("truck-camp") && overnight) {
    slots.add("stove");
  }
  slots.add("water");
  if (lodgings.includes("backpack") || theater === "alaska" || flyIn) {
    slots.add("rain-pant");
  }
  if (backcountry || lodgings.includes("backpack") || theater === "alaska" || flyIn) {
    if (flyIn || lodgings.includes("backpack") || lodgings.includes("pack-in-base") || theater === "alaska") {
      slots.add("comm");
    } else if (overnight && (walkIn || lodgings.includes("wall-tent"))) {
      slots.add("comm");
    }
  }

  const deerish =
    input.species === "whitetail" ||
    input.species === "mule-deer" ||
    input.species === "sitka-blacktail" ||
    input.species === "pronghorn";
  const wholeToTruck =
    input.duration === "day" &&
    accesses.includes("truck") &&
    travels.includes("short-walks") &&
    deerish &&
    !lodgings.includes("backpack");
  if (!wholeToTruck) slots.add("game-bags");

  const callingSpecies = input.species === "elk" || input.species === "whitetail" || input.species === "moose";
  if (tactics.includes("calling") || (callingSpecies && hasGlassCall)) slots.add("calls");
  if (input.species === "elk" && hasAny(tactics, "spot-and-stalk", "calling", "glassing", "tracking")) {
    slots.add("calls");
  }
  if (input.species === "whitetail" && hasAny(tactics, "ambush", "calling")) {
    slots.add("calls");
  }

  const privateOnly = input.lands.length > 0 && input.lands.every((l) => l === "private");
  const bearCountry = isBearCountry(input, theater);
  if (bearCountry && !(privateOnly && theater === "midwest")) slots.add("bear-spray");
  if (bearCountry && sleepsInTheField(input)) slots.add("food-storage");

  const needPoles =
    travels.includes("repeated-climbs") ||
    terrains.includes("steep-alpine") ||
    (lodgings.includes("backpack") && alpine);
  if (needPoles) slots.add("poles");

  slots.add("snacks");
  if (input.duration !== "day") slots.add("food");
  if (needsSaw(input)) slots.add("saw");

  return { activity, insulation, quietHard, quietTie, slots: [...slots], theater, weightBias };
}

/** Common gear people often expect — surface intentional omissions with reasons from derive rules. */
export function buildSkipped(
  input: HuntInput,
  d: Derived,
  /** Kit rows already built — derived slots with no surviving product become visible skips. */
  rows?: { slot: SlotId }[],
): SkippedItem[] {
  const have = new Set(d.slots);
  const out: SkippedItem[] = [];
  const add = (id: SlotId, reason: string) => {
    if (have.has(id)) return;
    out.push({ id, label: slotLabel[id] ?? id, reason });
  };

  if (!standLikeAmbush(input, d.theater)) {
    add("harness", "Fall-arrest gear is for timber/stand-like ambush — this tactic or terrain stays on the ground.");
    add("seat", "Stand cushion is for timber/stand-like ambush sits, not this hunt style.");
    add("hand-muff", "Hand muffs are a cold stand add-on; not packing one for this hunt style.");
    add("lifeline", "Lifeline is for tree-stand climbs — not this hunt style.");
    add("sticks", "Climbing sticks are for hang-on / saddle setups — not this hunt style.");
  } else if (d.insulation !== "high" && !(input.month <= 2 || input.month >= 11)) {
    add("hand-muff", "Cold late-season stand add-on — mild conditions do not need one.");
  }

  const blaze = blazeFor(input.state, input.weapon);
  if (!blaze.required) {
    add("blaze-vest", "Blaze orange is not required for this weapon/state combo in our snapshot — confirm the agency.");
    add("blaze-hat", "Blaze orange is not required for this weapon/state combo in our snapshot — confirm the agency.");
  }

  if (input.weapon !== "archery") {
    add("release", "Release aids are archery-only.");
    add("broadhead", "Broadheads are archery-only.");
  }

  if (!(input.tactics.includes("glassing") || input.travels.includes("all-day-glassing"))) {
    add("spotting-scope", "Long-range glassing kit was not selected for this terrain/tactic.");
    add("tripod", "Tripod rides with spotting-scope glassing kits — not needed here.");
  }

  const overnight = input.duration !== "day";
  const campLodging = hasAny(input.lodgings, "backpack", "pack-in-base", "truck-camp", "wall-tent");
  if (!(overnight && campLodging)) {
    add("sleep-bag", "Sleep system is for overnight camp lodging — day or home/hotel nights skip it.");
    add("sleep-pad", "Sleep pad is for overnight camp lodging — day or home/hotel nights skip it.");
  }
  if (!hasAny(input.lodgings, "backpack", "pack-in-base") && !hasAny(input.accesses, "float-plane", "bush-plane")) {
    add("shelter", "Shelter is for pack-in / backpack / fly-in lodging, not home, hotel, or truck camp.");
    add("filter", "Water treatment is for pack-in / backpack water sources.");
  }
  if (
    !hasAny(input.lodgings, "backpack", "pack-in-base", "wall-tent") &&
    !(input.lodgings.includes("truck-camp") && overnight)
  ) {
    add("stove", "Cook stove is for camp lodging, not day hunts that end at home or a hotel.");
  }

  if (!have.has("calls")) {
    add("calls", "Species/tactic combo does not call for a dedicated call kit.");
  }

  const privateOnly = input.lands.length > 0 && input.lands.every((l) => l === "private");
  const bearCountry = isBearCountry(input, d.theater);
  if (!(bearCountry && !(privateOnly && d.theater === "midwest"))) {
    add(
      "bear-spray",
      privateOnly
        ? "Private-land hunts in this kit skip bear spray by default — pack it if your ground has bears."
        : "Not flagged as bear country for this state/species/lodging combo.",
    );
  }

  const needPoles =
    input.travels.includes("repeated-climbs") ||
    input.terrains.includes("steep-alpine") ||
    (input.lodgings.includes("backpack") && input.terrains.includes("steep-alpine"));
  if (!needPoles) {
    add("poles", "Trekking poles are for steep climbs or backpack moves — short/easy travel skips them.");
  }

  if (d.activity === "static") {
    add("midlayer-active", "Active midlayer is for moving hunts — this sit/ambush kit leans on static insulation.");
  }
  if (d.activity === "active" && d.insulation !== "high") {
    add(
      "insulation-static",
      "Stop-puffy / sit coat is for static or high-cold hunts — active kit keeps warmth in the pack only if weather demands it.",
    );
  }

  // Policy: never silently omit a derived slot — coverage gaps always surface.
  const coverage: SkippedItem[] = [];
  if (rows) {
    const filled = new Set(rows.map((r) => r.slot));
    for (const slot of d.slots) {
      if (filled.has(slot)) continue;
      coverage.push({
        id: slot,
        label: slotLabel[slot] ?? slot,
        reason: "No sourced option for this theater/style in the current catalog.",
      });
    }
  }

  const seen = new Set<string>();
  const intentional = out.filter((s) => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
  const coverageDedup = coverage.filter((s) => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
  const room = Math.max(0, 16 - coverageDedup.length);
  return [...coverageDedup, ...intentional.slice(0, room)];
}
