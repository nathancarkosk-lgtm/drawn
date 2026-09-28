import type { BlazeRule, HuntState, Weapon } from "./types";

/**
 * Deterministic blaze-orange logic. Not LLM-guessed.
 * Big-game firearm / muzzleloader rules for the 11 covered states.
 * Archery is not required in these states (firearm-overlap exceptions exist
 * in some jurisdictions — we flag that in the detail, not by stuffing a vest
 * into an early-season archery kit).
 *
 * Sources: Hunter-ed state table; onX Hunt blaze-orange guide; state regs.
 * States with no statewide big-game mandate: AK, ID, NM (plus AZ/CA/NV/NH/OR/VT outside this app).
 */
const FIREARM: Record<
  HuntState,
  { required: boolean; summary: string; detail: string }
> = {
  CO: {
    required: true,
    summary: "Wear orange — required",
    detail:
      "Colorado: 500 square inches of solid daylight fluorescent orange on the head, chest, and back during firearm big-game seasons. Camo-orange typically does not count. Archery: not required.",
  },
  WY: {
    required: true,
    summary: "Wear orange — required",
    detail:
      "Wyoming: fluorescent orange on the head, back, and chest during firearm big-game seasons (commonly cited as 400 sq in). Archery: not required.",
  },
  MT: {
    required: true,
    summary: "Wear orange — required",
    detail:
      "Montana: 400 or more square inches of hunter orange above the waist, visible from all sides, during firearm big-game seasons. Archery: not required.",
  },
  ID: {
    required: false,
    summary: "Orange not required by law",
    detail:
      "Idaho has no statewide blaze-orange mandate for big game. Orange is required on some stocked upland hunts (36 sq in). Strongly recommended anytime firearms are in the field.",
  },
  UT: {
    required: true,
    summary: "Wear orange — required",
    detail:
      "Utah: 400 square inches of hunter orange on the head, chest, and back during any firearm big-game hunt. Archery: not required.",
  },
  NM: {
    required: false,
    summary: "Orange not required by law",
    detail:
      "New Mexico has no statewide mandate. Orange is required on some military properties (e.g. White Sands 244 sq in). Recommended on public firearm hunts.",
  },
  AK: {
    required: false,
    summary: "Orange not required by law",
    detail:
      "Alaska does not require hunter orange. It is still smart around other hunters, especially on road-system hunts. No orange is packed into the kit unless you want it.",
  },
  NE: {
    required: true,
    summary: "Wear orange — required",
    detail:
      "Nebraska: at least 400 square inches of hunter orange on the head, back, and chest during firearm deer, antelope, and elk seasons. Archery: not required.",
  },
  IA: {
    required: true,
    summary: "Wear orange — required",
    detail:
      "Iowa: hunter orange (or pink) on an article covering the chest and back — at least 50% of that garment — during firearm deer seasons. Archery: not required.",
  },
  KS: {
    required: true,
    summary: "Wear orange — required for firearm deer",
    detail:
      "Kansas: 200 or more square inches of hunter orange during firearm deer seasons. Archery: not required.",
  },
  SD: {
    required: true,
    summary: "Wear orange — required",
    detail:
      "South Dakota: 200 or more square inches of hunter orange above the waist during firearm big-game seasons. Archery: not required.",
  },
};

export function blazeFor(state: HuntState, weapon: Weapon): BlazeRule {
  if (weapon === "archery") {
    return {
      required: false,
      summary: "Orange not required to wear",
      detail: `${FIREARM[state].detail} This is an archery hunt, so blaze orange is not packed.`,
    };
  }
  const row = FIREARM[state];
  if (!row.required) {
    return {
      required: false,
      summary: "Orange not required by law",
      detail: row.detail,
    };
  }
  const muz =
    weapon === "muzzleloader"
      ? " Muzzleloader is treated as a firearm season for orange in these states."
      : "";
  return {
    required: true,
    summary: row.summary,
    detail: row.detail + muz,
  };
}
