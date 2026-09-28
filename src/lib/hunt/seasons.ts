import type { HuntState, SeasonRule, Species, Weapon } from "./types";

/**
 * Typical legal months by state × species × weapon.
 * Day-level dates change every year — windows are labeled as typical and
 * must be verified with the agency. Only months that are actually open
 * (for a general hunt of that species/weapon) are listed, so the form
 * cannot offer e.g. July Nebraska whitetail.
 */
const RULES: SeasonRule[] = [
  // —— Nebraska ——
  {
    state: "NE",
    species: "whitetail",
    weapon: "archery",
    months: [9, 10, 11, 12],
    window: "Sept 1 – Dec 31 (typical)",
    bag: "Permit-specific; often 1 antlered on a regular deer permit. Confirm current bag.",
    licenses: ["Nebraska hunting permit", "Habitat stamp", "Deer permit (season-choice / firearm / archery as issued)"],
  },
  {
    state: "NE",
    species: "whitetail",
    weapon: "firearm",
    months: [11],
    window: "Nine-day November firearm (typically the Saturday nearest Nov 13)",
    bag: "Permit-specific. Late antlerless firearm in January is a separate permit.",
    licenses: ["Nebraska hunting permit", "Habitat stamp", "November firearm deer permit"],
    notes: "January 1–15 late antlerless firearm and October river antlerless are separate, limited seasons — not shown as general buck months.",
  },
  {
    state: "NE",
    species: "whitetail",
    weapon: "muzzleloader",
    months: [12],
    window: "Dec 1–31 (typical)",
    bag: "Permit-specific.",
    licenses: ["Nebraska hunting permit", "Habitat stamp", "Muzzleloader deer permit"],
  },
  {
    state: "NE",
    species: "mule-deer",
    weapon: "archery",
    months: [9, 10, 11, 12],
    window: "Sept 1 – Dec 31 (typical)",
    bag: "Permit-specific; mule deer opportunity is tighter in some units.",
    licenses: ["Nebraska hunting permit", "Habitat stamp", "Deer permit"],
  },
  {
    state: "NE",
    species: "mule-deer",
    weapon: "firearm",
    months: [11],
    window: "Nine-day November firearm",
    bag: "Permit-specific; some units restrict mule deer harvest.",
    licenses: ["Nebraska hunting permit", "Habitat stamp", "November firearm deer permit"],
  },
  {
    state: "NE",
    species: "mule-deer",
    weapon: "muzzleloader",
    months: [12],
    window: "Dec 1–31 (typical)",
    bag: "Permit-specific.",
    licenses: ["Nebraska hunting permit", "Habitat stamp", "Muzzleloader deer permit"],
  },
  {
    state: "NE",
    species: "pronghorn",
    weapon: "archery",
    months: [8, 9, 10, 11, 12],
    window: "Aug 20 – Dec 31 (typical)",
    bag: "Draw / limited. Usually 1.",
    licenses: ["Nebraska hunting permit", "Habitat stamp", "Antelope permit"],
  },
  {
    state: "NE",
    species: "pronghorn",
    weapon: "firearm",
    months: [10],
    window: "Mid-October firearm (typical ~Oct 10–25)",
    bag: "Draw / limited. Usually 1.",
    licenses: ["Nebraska hunting permit", "Habitat stamp", "Antelope firearm permit"],
  },
  {
    state: "NE",
    species: "pronghorn",
    weapon: "muzzleloader",
    months: [9, 10],
    window: "Late Sept – early Oct (typical)",
    bag: "Draw / limited.",
    licenses: ["Nebraska hunting permit", "Habitat stamp", "Antelope muzzleloader permit"],
  },
  {
    state: "NE",
    species: "elk",
    weapon: "archery",
    months: [9, 10],
    window: "Bull archery typically Sept 1 – Oct 31; limited units",
    bag: "Draw only. Very limited.",
    licenses: ["Nebraska hunting permit", "Habitat stamp", "Elk permit (draw)"],
  },
  {
    state: "NE",
    species: "elk",
    weapon: "firearm",
    months: [9, 10],
    window: "Bull firearm typically late Sept – Oct 31; limited units",
    bag: "Draw only. Very limited.",
    licenses: ["Nebraska hunting permit", "Habitat stamp", "Elk permit (draw)"],
  },
  {
    state: "NE",
    species: "elk",
    weapon: "muzzleloader",
    months: [9, 10],
    window: "Follows firearm/muzzle windows in unit proclamations",
    bag: "Draw only.",
    licenses: ["Nebraska hunting permit", "Habitat stamp", "Elk permit (draw)"],
  },

  // —— Colorado ——
  {
    state: "CO",
    species: "elk",
    weapon: "archery",
    months: [9],
    window: "Sept 2–30 west of I-25 (fixed in 2025–2029 structure)",
    bag: "OTC either-sex or antlered in listed units; limited elsewhere. Typically 1.",
    licenses: ["Colorado hunting license", "Habitat stamp", "Elk license for the hunt code"],
  },
  {
    state: "CO",
    species: "elk",
    weapon: "muzzleloader",
    months: [9],
    window: "Mid-September (~Sept 12–20 typical)",
    bag: "Limited draw. Typically 1.",
    licenses: ["Colorado hunting license", "Habitat stamp", "Muzzleloader elk license"],
  },
  {
    state: "CO",
    species: "elk",
    weapon: "firearm",
    months: [10, 11],
    window: "1st–4th rifle, mid-Oct through late Nov; some late hunts into winter by unit",
    bag: "OTC or limited by hunt code. Typically 1.",
    licenses: ["Colorado hunting license", "Habitat stamp", "Rifle elk license"],
  },
  {
    state: "CO",
    species: "mule-deer",
    weapon: "archery",
    months: [9],
    window: "Sept 2–30 west of I-25; plains seasons differ",
    bag: "Almost entirely limited draw. Typically 1.",
    licenses: ["Colorado hunting license", "Habitat stamp", "Deer license"],
  },
  {
    state: "CO",
    species: "mule-deer",
    weapon: "muzzleloader",
    months: [9],
    window: "Mid-September (draw)",
    bag: "Limited. Typically 1.",
    licenses: ["Colorado hunting license", "Habitat stamp", "Muzzleloader deer license"],
  },
  {
    state: "CO",
    species: "mule-deer",
    weapon: "firearm",
    months: [10, 11],
    window: "Combined 2nd–4th rifle, late Oct–late Nov (limited)",
    bag: "Limited. Typically 1.",
    licenses: ["Colorado hunting license", "Habitat stamp", "Rifle deer license"],
  },
  {
    state: "CO",
    species: "whitetail",
    weapon: "archery",
    months: [9, 10, 11, 12],
    window: "Mountain archery in Sept; plains / whitetail-only windows Oct–Dec",
    bag: "Limited. Typically 1.",
    licenses: ["Colorado hunting license", "Habitat stamp", "Deer license"],
  },
  {
    state: "CO",
    species: "whitetail",
    weapon: "firearm",
    months: [10, 11, 12],
    window: "Plains and whitetail-only rifle windows Oct–Dec",
    bag: "Limited. Typically 1.",
    licenses: ["Colorado hunting license", "Habitat stamp", "Deer license"],
  },
  {
    state: "CO",
    species: "whitetail",
    weapon: "muzzleloader",
    months: [9, 10],
    window: "Mountain mid-Sept; plains mid-Oct",
    bag: "Limited.",
    licenses: ["Colorado hunting license", "Habitat stamp", "Muzzleloader deer license"],
  },
  {
    state: "CO",
    species: "pronghorn",
    weapon: "archery",
    months: [8, 9],
    window: "Mid-Aug through mid/late Sept (typical)",
    bag: "OTC or limited by unit. Typically 1.",
    licenses: ["Colorado hunting license", "Habitat stamp", "Pronghorn license"],
  },
  {
    state: "CO",
    species: "pronghorn",
    weapon: "firearm",
    months: [9, 10],
    window: "Late Sept – early Oct rifle (typical)",
    bag: "Mostly limited. Typically 1.",
    licenses: ["Colorado hunting license", "Habitat stamp", "Pronghorn rifle license"],
  },
  {
    state: "CO",
    species: "pronghorn",
    weapon: "muzzleloader",
    months: [9],
    window: "Late September (typical)",
    bag: "Limited.",
    licenses: ["Colorado hunting license", "Habitat stamp", "Pronghorn muzzleloader license"],
  },
  {
    state: "CO",
    species: "moose",
    weapon: "archery",
    months: [9],
    window: "September archery (draw)",
    bag: "Once-in-a-lifetime style limited draw. 1.",
    licenses: ["Colorado hunting license", "Habitat stamp", "Moose license (draw)"],
  },
  {
    state: "CO",
    species: "moose",
    weapon: "firearm",
    months: [10],
    window: "Early October rifle (draw)",
    bag: "1. Draw only.",
    licenses: ["Colorado hunting license", "Habitat stamp", "Moose license (draw)"],
  },
  {
    state: "CO",
    species: "moose",
    weapon: "muzzleloader",
    months: [9],
    window: "Mid-September (draw)",
    bag: "1. Draw only.",
    licenses: ["Colorado hunting license", "Habitat stamp", "Moose license (draw)"],
  },
  {
    state: "CO",
    species: "black-bear",
    weapon: "archery",
    months: [9],
    window: "Sept 2–30 concurrent with archery elk in most units",
    bag: "OTC or limited. Typically 1.",
    licenses: ["Colorado hunting license", "Habitat stamp", "Bear license"],
  },
  {
    state: "CO",
    species: "black-bear",
    weapon: "firearm",
    months: [9, 10, 11],
    window: "September limited + concurrent with rifle deer/elk 2–4",
    bag: "Typically 1.",
    licenses: ["Colorado hunting license", "Habitat stamp", "Bear license"],
  },
  {
    state: "CO",
    species: "black-bear",
    weapon: "muzzleloader",
    months: [9],
    window: "Mid-September",
    bag: "Typically 1.",
    licenses: ["Colorado hunting license", "Habitat stamp", "Bear license"],
  },
  {
    state: "CO",
    species: "mountain-goat",
    weapon: "archery",
    months: [9],
    window: "September (draw)",
    bag: "1. Draw only.",
    licenses: ["Colorado hunting license", "Habitat stamp", "Goat license (draw)"],
  },
  {
    state: "CO",
    species: "mountain-goat",
    weapon: "firearm",
    months: [9, 10],
    window: "Sept–Oct (draw)",
    bag: "1. Draw only.",
    licenses: ["Colorado hunting license", "Habitat stamp", "Goat license (draw)"],
  },
  {
    state: "CO",
    species: "mountain-goat",
    weapon: "muzzleloader",
    months: [9],
    window: "September (draw)",
    bag: "1.",
    licenses: ["Colorado hunting license", "Habitat stamp", "Goat license (draw)"],
  },
  {
    state: "CO",
    species: "bighorn",
    weapon: "archery",
    months: [8, 9],
    window: "Unit-specific, often Aug–Sept (draw)",
    bag: "1. Draw only.",
    licenses: ["Colorado hunting license", "Habitat stamp", "Ram/ewe license (draw)"],
  },
  {
    state: "CO",
    species: "bighorn",
    weapon: "firearm",
    months: [8, 9, 10],
    window: "Unit-specific late summer through fall (draw)",
    bag: "1. Draw only.",
    licenses: ["Colorado hunting license", "Habitat stamp", "Ram/ewe license (draw)"],
  },
  {
    state: "CO",
    species: "bighorn",
    weapon: "muzzleloader",
    months: [9],
    window: "Unit-specific (draw)",
    bag: "1.",
    licenses: ["Colorado hunting license", "Habitat stamp", "Ram/ewe license (draw)"],
  },
  {
    state: "CO",
    species: "bison",
    weapon: "firearm",
    months: [9, 10, 11],
    window: "Unit-specific (draw)",
    bag: "1. Draw only.",
    licenses: ["Colorado hunting license", "Habitat stamp", "Bison license (draw)"],
  },
  {
    state: "CO",
    species: "bison",
    weapon: "archery",
    months: [9, 10],
    window: "Unit-specific (draw)",
    bag: "1.",
    licenses: ["Colorado hunting license", "Habitat stamp", "Bison license (draw)"],
  },
  {
    state: "CO",
    species: "bison",
    weapon: "muzzleloader",
    months: [9, 10],
    window: "Unit-specific (draw)",
    bag: "1.",
    licenses: ["Colorado hunting license", "Habitat stamp", "Bison license (draw)"],
  },

  // —— Wyoming (typical) ——
  ...westMountain("WY", {
    elkArch: [9],
    elkMuz: [9, 10],
    elkRifle: [10, 11],
    mdArch: [9],
    mdMuz: [9, 10],
    mdRifle: [10, 11],
    wtArch: [9, 10, 11],
    wtRifle: [11],
    wtMuz: [11],
    prongArch: [8, 9],
    prongRifle: [9, 10],
    prongMuz: [9],
    moose: [9, 10],
    bear: [9, 10, 11],
    goat: [9, 10],
    sheep: [9, 10],
    bison: [8, 9, 10, 11],
  }),

  ...westMountain("MT", {
    elkArch: [9, 10],
    elkMuz: [10],
    elkRifle: [10, 11],
    mdArch: [9],
    mdMuz: [10],
    mdRifle: [10, 11],
    wtArch: [9, 10, 11, 12],
    wtRifle: [10, 11],
    wtMuz: [10, 11],
    prongArch: [9],
    prongRifle: [10],
    prongMuz: [10],
    moose: [9, 10, 11],
    bear: [9, 10, 11],
    goat: [9, 10, 11],
    sheep: [9, 10, 11],
    bison: [8, 9, 10, 11],
  }),

  ...westMountain("ID", {
    elkArch: [8, 9],
    elkMuz: [9, 10],
    elkRifle: [10, 11],
    mdArch: [8, 9],
    mdMuz: [9, 10],
    mdRifle: [10, 11],
    wtArch: [8, 9, 10, 11, 12],
    wtRifle: [10, 11],
    wtMuz: [10, 11],
    prongArch: [8, 9],
    prongRifle: [9, 10],
    prongMuz: [9],
    moose: [8, 9, 10, 11],
    bear: [8, 9, 10, 11],
    goat: [8, 9, 10],
    sheep: [8, 9, 10],
    bison: [],
  }),

  ...westMountain("UT", {
    elkArch: [8, 9],
    elkMuz: [9],
    elkRifle: [10, 11],
    mdArch: [8, 9],
    mdMuz: [9],
    mdRifle: [10, 11],
    wtArch: [8, 9, 10, 11],
    wtRifle: [10, 11],
    wtMuz: [10],
    prongArch: [8, 9],
    prongRifle: [9, 10],
    prongMuz: [9],
    moose: [9, 10],
    bear: [8, 9, 10, 11],
    goat: [9, 10],
    sheep: [9, 10],
    bison: [11, 12],
  }),

  ...westMountain("NM", {
    elkArch: [9],
    elkMuz: [9],
    elkRifle: [10, 11, 12],
    mdArch: [9],
    mdMuz: [9, 10],
    mdRifle: [10, 11],
    wtArch: [9, 10, 11, 12, 1],
    wtRifle: [10, 11, 12],
    wtMuz: [10, 11],
    prongArch: [8, 9],
    prongRifle: [9, 10],
    prongMuz: [9],
    moose: [],
    bear: [8, 9, 10, 11],
    goat: [],
    sheep: [8, 9, 10, 1],
    bison: [12, 1],
  }),

  // —— Alaska ——
  {
    state: "AK",
    species: "moose",
    weapon: "archery",
    months: [8, 9],
    window: "Unit-specific; Interior often late Aug–Sept",
    bag: "Unit-specific, often 1 bull with antler restrictions.",
    licenses: ["Alaska hunting license", "Harvest ticket or drawing permit", "Bear/harvest lock as required"],
  },
  {
    state: "AK",
    species: "moose",
    weapon: "firearm",
    months: [8, 9],
    window: "Unit-specific; many Interior GMUs late Aug–Sept",
    bag: "Unit-specific, often 1 bull with antler restrictions.",
    licenses: ["Alaska hunting license", "Harvest ticket or drawing permit"],
  },
  {
    state: "AK",
    species: "moose",
    weapon: "muzzleloader",
    months: [8, 9],
    window: "Follows general moose season unless a muzzleloader-only hunt is listed",
    bag: "Unit-specific.",
    licenses: ["Alaska hunting license", "Harvest ticket or drawing permit"],
  },
  {
    state: "AK",
    species: "caribou",
    weapon: "archery",
    months: [8, 9, 10],
    window: "Herd and unit specific; many August–October",
    bag: "Varies widely by herd. Check the current emergency orders.",
    licenses: ["Alaska hunting license", "Harvest ticket or drawing permit"],
  },
  {
    state: "AK",
    species: "caribou",
    weapon: "firearm",
    months: [8, 9, 10, 3, 4],
    window: "Fall Aug–Oct; some winter/spring hunts by herd",
    bag: "Herd-specific and frequently changed by emergency order.",
    licenses: ["Alaska hunting license", "Harvest ticket or drawing permit"],
  },
  {
    state: "AK",
    species: "caribou",
    weapon: "muzzleloader",
    months: [8, 9, 10],
    window: "Follows general season unless listed separately",
    bag: "Herd-specific.",
    licenses: ["Alaska hunting license", "Harvest ticket or drawing permit"],
  },
  {
    state: "AK",
    species: "sitka-blacktail",
    weapon: "archery",
    months: [8, 9, 10, 11, 12],
    window: "Southeast units often Aug–Dec; Kodiak similar",
    bag: "Unit-specific, often multiple deer.",
    licenses: ["Alaska hunting license", "Harvest ticket"],
  },
  {
    state: "AK",
    species: "sitka-blacktail",
    weapon: "firearm",
    months: [8, 9, 10, 11, 12],
    window: "August through December in many SE / Kodiak units",
    bag: "Unit-specific.",
    licenses: ["Alaska hunting license", "Harvest ticket"],
  },
  {
    state: "AK",
    species: "sitka-blacktail",
    weapon: "muzzleloader",
    months: [8, 9, 10, 11, 12],
    window: "Follows general deer season",
    bag: "Unit-specific.",
    licenses: ["Alaska hunting license", "Harvest ticket"],
  },
  {
    state: "AK",
    species: "black-bear",
    weapon: "archery",
    months: [4, 5, 6, 8, 9, 10],
    window: "Spring and fall; many units have long seasons",
    bag: "Unit-specific (1–3 common).",
    licenses: ["Alaska hunting license", "Harvest ticket or sealing"],
  },
  {
    state: "AK",
    species: "black-bear",
    weapon: "firearm",
    months: [4, 5, 6, 8, 9, 10],
    window: "Spring and fall; confirm unit",
    bag: "Unit-specific.",
    licenses: ["Alaska hunting license", "Harvest ticket or sealing"],
  },
  {
    state: "AK",
    species: "black-bear",
    weapon: "muzzleloader",
    months: [4, 5, 6, 8, 9, 10],
    window: "Follows general bear season",
    bag: "Unit-specific.",
    licenses: ["Alaska hunting license", "Harvest ticket or sealing"],
  },
  {
    state: "AK",
    species: "brown-bear",
    weapon: "archery",
    months: [4, 5, 9, 10],
    window: "Spring (Apr–May) and fall (Sept–Oct) by unit; some closed",
    bag: "Often 1 every 1–4 years. Drawing or registration.",
    licenses: ["Alaska hunting license", "Brown bear tag / drawing / registration as required"],
  },
  {
    state: "AK",
    species: "brown-bear",
    weapon: "firearm",
    months: [4, 5, 9, 10],
    window: "Spring and fall by unit",
    bag: "Often 1 every 1–4 years.",
    licenses: ["Alaska hunting license", "Brown bear tag / drawing / registration as required"],
  },
  {
    state: "AK",
    species: "brown-bear",
    weapon: "muzzleloader",
    months: [4, 5, 9, 10],
    window: "Follows general season",
    bag: "Unit-specific.",
    licenses: ["Alaska hunting license", "Brown bear tag / drawing / registration as required"],
  },
  {
    state: "AK",
    species: "mountain-goat",
    weapon: "archery",
    months: [8, 9, 10, 11],
    window: "Late Aug–Nov by unit (draw / registration)",
    bag: "Typically 1.",
    licenses: ["Alaska hunting license", "Goat permit"],
  },
  {
    state: "AK",
    species: "mountain-goat",
    weapon: "firearm",
    months: [8, 9, 10, 11],
    window: "Late Aug–Nov by unit",
    bag: "Typically 1.",
    licenses: ["Alaska hunting license", "Goat permit"],
  },
  {
    state: "AK",
    species: "mountain-goat",
    weapon: "muzzleloader",
    months: [8, 9, 10, 11],
    window: "Follows general goat season",
    bag: "Typically 1.",
    licenses: ["Alaska hunting license", "Goat permit"],
  },
  {
    state: "AK",
    species: "bighorn",
    weapon: "archery",
    months: [8, 9, 10],
    window: "Dall sheep: most units Aug 10–Sept 20 (check current)",
    bag: "Typically 1 full-curl ram. Draw or harvest ticket by unit.",
    licenses: ["Alaska hunting license", "Sheep harvest ticket or drawing"],
  },
  {
    state: "AK",
    species: "bighorn",
    weapon: "firearm",
    months: [8, 9],
    window: "Dall sheep typically Aug 10 – Sept 20",
    bag: "Typically 1 full-curl ram.",
    licenses: ["Alaska hunting license", "Sheep harvest ticket or drawing"],
  },
  {
    state: "AK",
    species: "bighorn",
    weapon: "muzzleloader",
    months: [8, 9],
    window: "Follows general sheep season",
    bag: "Typically 1.",
    licenses: ["Alaska hunting license", "Sheep harvest ticket or drawing"],
  },
  {
    state: "AK",
    species: "bison",
    weapon: "firearm",
    months: [9, 10, 3],
    window: "Drawing hunts, unit-specific (Delta, Farewell, etc.)",
    bag: "1. Draw only.",
    licenses: ["Alaska hunting license", "Bison drawing permit"],
  },
  {
    state: "AK",
    species: "bison",
    weapon: "archery",
    months: [9, 10],
    window: "If listed in the drawing hunt",
    bag: "1.",
    licenses: ["Alaska hunting license", "Bison drawing permit"],
  },
  {
    state: "AK",
    species: "bison",
    weapon: "muzzleloader",
    months: [9, 10],
    window: "If listed",
    bag: "1.",
    licenses: ["Alaska hunting license", "Bison drawing permit"],
  },

  // —— Iowa ——
  {
    state: "IA",
    species: "whitetail",
    weapon: "archery",
    months: [10, 11, 12, 1],
    window: "Oct 1 through early Dec, then late Dec–Jan (typical)",
    bag: "License/tag specific. Combination licenses common.",
    licenses: ["Iowa hunting license", "Habitat fee", "Deer license(s)"],
  },
  {
    state: "IA",
    species: "whitetail",
    weapon: "firearm",
    months: [12],
    window: "Shotgun / straight-wall seasons in December (two typical weekends/blocks)",
    bag: "License-specific. Iowa does not allow centerfire rifles for deer.",
    licenses: ["Iowa hunting license", "Habitat fee", "Firearm deer license"],
    notes: "Iowa deer firearm means shotgun or legal straight-wall cartridge — not a centerfire rifle.",
  },
  {
    state: "IA",
    species: "whitetail",
    weapon: "muzzleloader",
    months: [10, 1],
    window: "Early muzzleloader mid-Oct; late muzzleloader in January (typical)",
    bag: "License-specific.",
    licenses: ["Iowa hunting license", "Habitat fee", "Muzzleloader deer license"],
  },

  // —— Kansas ——
  {
    state: "KS",
    species: "whitetail",
    weapon: "archery",
    months: [9, 10, 11, 12],
    window: "Mid-Sept through December (typical)",
    bag: "Permit-specific; either-sex vs antlerless by draw/over-counter.",
    licenses: ["Kansas hunting license", "Deer permit"],
  },
  {
    state: "KS",
    species: "whitetail",
    weapon: "firearm",
    months: [12],
    window: "Early December firearm (typical ~2 weeks)",
    bag: "Permit-specific.",
    licenses: ["Kansas hunting license", "Firearm deer permit"],
  },
  {
    state: "KS",
    species: "whitetail",
    weapon: "muzzleloader",
    months: [9, 1],
    window: "September muzzleloader and January extended (typical)",
    bag: "Permit-specific.",
    licenses: ["Kansas hunting license", "Muzzleloader deer permit"],
  },
  {
    state: "KS",
    species: "mule-deer",
    weapon: "archery",
    months: [9, 10, 11, 12],
    window: "Mid-Sept through December; mule deer mostly west",
    bag: "Mule deer either-sex is limited. Confirm unit.",
    licenses: ["Kansas hunting license", "Deer permit valid for mule deer in unit"],
  },
  {
    state: "KS",
    species: "mule-deer",
    weapon: "firearm",
    months: [12],
    window: "December firearm; mule deer either-sex often restricted",
    bag: "Confirm whether the unit allows mule deer bucks on that permit.",
    licenses: ["Kansas hunting license", "Firearm deer permit"],
  },
  {
    state: "KS",
    species: "mule-deer",
    weapon: "muzzleloader",
    months: [9],
    window: "September muzzleloader (typical)",
    bag: "Confirm mule deer validity.",
    licenses: ["Kansas hunting license", "Muzzleloader deer permit"],
  },
  {
    state: "KS",
    species: "pronghorn",
    weapon: "archery",
    months: [9, 10],
    window: "September archery (typical)",
    bag: "Draw. 1.",
    licenses: ["Kansas hunting license", "Pronghorn permit (draw)"],
  },
  {
    state: "KS",
    species: "pronghorn",
    weapon: "firearm",
    months: [10],
    window: "October firearm (draw)",
    bag: "Draw. 1.",
    licenses: ["Kansas hunting license", "Pronghorn firearm permit"],
  },
  {
    state: "KS",
    species: "pronghorn",
    weapon: "muzzleloader",
    months: [10],
    window: "Often included with firearm/muzzle windows in the draw",
    bag: "Draw. 1.",
    licenses: ["Kansas hunting license", "Pronghorn permit"],
  },

  // —— South Dakota ——
  {
    state: "SD",
    species: "whitetail",
    weapon: "archery",
    months: [9, 10, 11, 12, 1],
    window: "Late Sept through Dec, plus late season into January (typical)",
    bag: "License-specific.",
    licenses: ["South Dakota hunting license", "Deer license"],
  },
  {
    state: "SD",
    species: "whitetail",
    weapon: "firearm",
    months: [11],
    window: "November firearm (East River / West River / Black Hills differ)",
    bag: "License-specific.",
    licenses: ["South Dakota hunting license", "Firearm deer license"],
  },
  {
    state: "SD",
    species: "whitetail",
    weapon: "muzzleloader",
    months: [12],
    window: "December muzzleloader (typical)",
    bag: "License-specific.",
    licenses: ["South Dakota hunting license", "Muzzleloader deer license"],
  },
  {
    state: "SD",
    species: "mule-deer",
    weapon: "archery",
    months: [9, 10, 11, 12, 1],
    window: "Late Sept through winter archery; west river / hills",
    bag: "License-specific; mule deer tags can be limited.",
    licenses: ["South Dakota hunting license", "Deer license valid for mule deer"],
  },
  {
    state: "SD",
    species: "mule-deer",
    weapon: "firearm",
    months: [11],
    window: "November firearm",
    bag: "License-specific.",
    licenses: ["South Dakota hunting license", "Firearm deer license"],
  },
  {
    state: "SD",
    species: "mule-deer",
    weapon: "muzzleloader",
    months: [12],
    window: "December muzzleloader",
    bag: "License-specific.",
    licenses: ["South Dakota hunting license", "Muzzleloader deer license"],
  },
  {
    state: "SD",
    species: "pronghorn",
    weapon: "archery",
    months: [8, 9, 10],
    window: "August–October archery (typical)",
    bag: "License-specific. 1.",
    licenses: ["South Dakota hunting license", "Pronghorn license"],
  },
  {
    state: "SD",
    species: "pronghorn",
    weapon: "firearm",
    months: [10],
    window: "October firearm (typical)",
    bag: "1.",
    licenses: ["South Dakota hunting license", "Pronghorn firearm license"],
  },
  {
    state: "SD",
    species: "pronghorn",
    weapon: "muzzleloader",
    months: [10],
    window: "Often overlaps firearm",
    bag: "1.",
    licenses: ["South Dakota hunting license", "Pronghorn license"],
  },
  {
    state: "SD",
    species: "elk",
    weapon: "archery",
    months: [9],
    window: "Black Hills / prairie elk, September archery (draw)",
    bag: "Draw. 1.",
    licenses: ["South Dakota hunting license", "Elk tag (draw)"],
  },
  {
    state: "SD",
    species: "elk",
    weapon: "firearm",
    months: [10, 11],
    window: "October–November rifle (draw)",
    bag: "Draw. 1.",
    licenses: ["South Dakota hunting license", "Elk tag (draw)"],
  },
  {
    state: "SD",
    species: "elk",
    weapon: "muzzleloader",
    months: [10],
    window: "Unit-specific (draw)",
    bag: "Draw. 1.",
    licenses: ["South Dakota hunting license", "Elk tag (draw)"],
  },
  {
    state: "SD",
    species: "bighorn",
    weapon: "firearm",
    months: [9, 10, 11],
    window: "Draw, unit-specific",
    bag: "1. Draw only.",
    licenses: ["South Dakota hunting license", "Bighorn license (draw)"],
  },
  {
    state: "SD",
    species: "bighorn",
    weapon: "archery",
    months: [9, 10],
    window: "If listed in the draw",
    bag: "1.",
    licenses: ["South Dakota hunting license", "Bighorn license (draw)"],
  },
  {
    state: "SD",
    species: "bighorn",
    weapon: "muzzleloader",
    months: [9, 10],
    window: "If listed",
    bag: "1.",
    licenses: ["South Dakota hunting license", "Bighorn license (draw)"],
  },
  {
    state: "SD",
    species: "bison",
    weapon: "firearm",
    months: [9, 10, 11, 12],
    window: "Custer / other drawing hunts, fall into winter",
    bag: "1. Draw.",
    licenses: ["South Dakota hunting license", "Bison license (draw)"],
  },
  {
    state: "SD",
    species: "bison",
    weapon: "archery",
    months: [9, 10, 11],
    window: "If listed",
    bag: "1.",
    licenses: ["South Dakota hunting license", "Bison license (draw)"],
  },
  {
    state: "SD",
    species: "bison",
    weapon: "muzzleloader",
    months: [9, 10, 11],
    window: "If listed",
    bag: "1.",
    licenses: ["South Dakota hunting license", "Bison license (draw)"],
  },
];

type WestSpec = {
  elkArch: number[];
  elkMuz: number[];
  elkRifle: number[];
  mdArch: number[];
  mdMuz: number[];
  mdRifle: number[];
  wtArch: number[];
  wtRifle: number[];
  wtMuz: number[];
  prongArch: number[];
  prongRifle: number[];
  prongMuz: number[];
  moose: number[];
  bear: number[];
  goat: number[];
  sheep: number[];
  bison: number[];
};

function rule(
  state: HuntState,
  species: Species,
  weapon: Weapon,
  months: number[],
  window: string,
  bag: string,
  licenses: string[],
  notes?: string,
): SeasonRule {
  return { state, species, weapon, months, window, bag, licenses, notes };
}

function westMountain(state: HuntState, s: WestSpec): SeasonRule[] {
  const hunt = `${stateLabelName(state)} hunting license`;
  const out: SeasonRule[] = [];
  const add = (species: Species, weapon: Weapon, months: number[], window: string, bag: string, extra: string) => {
    if (!months.length) return;
    out.push(rule(state, species, weapon, months, window, bag, [hunt, extra]));
  };
  add("elk", "archery", s.elkArch, "Archery elk typically late Aug/Sept (unit-specific)", "Usually 1. OTC or draw by unit.", "Elk license / general elk tag");
  add("elk", "muzzleloader", s.elkMuz, "Muzzleloader elk, unit-specific", "Usually 1.", "Elk muzzleloader / general tag as required");
  add("elk", "firearm", s.elkRifle, "Rifle elk typically Oct–Nov; some late hunts", "Usually 1. OTC or draw.", "Elk rifle / general tag");
  add("mule-deer", "archery", s.mdArch, "Archery mule deer typically Sept (some Aug)", "Usually 1. Often limited.", "Deer license");
  add("mule-deer", "muzzleloader", s.mdMuz, "Muzzleloader mule deer, unit-specific", "Usually 1.", "Deer license");
  add("mule-deer", "firearm", s.mdRifle, "Rifle mule deer typically Oct–Nov", "Usually 1. Often limited.", "Deer license");
  add("whitetail", "archery", s.wtArch, "Archery whitetail — longer than mule deer in many units", "Usually 1.", "Deer license");
  add("whitetail", "firearm", s.wtRifle, "Rifle whitetail, unit-specific", "Usually 1.", "Deer license");
  add("whitetail", "muzzleloader", s.wtMuz, "Muzzleloader whitetail, unit-specific", "Usually 1.", "Deer license");
  add("pronghorn", "archery", s.prongArch, "Archery pronghorn typically Aug–Sept", "Usually 1.", "Pronghorn license");
  add("pronghorn", "firearm", s.prongRifle, "Rifle pronghorn typically Sept–Oct", "Usually 1. Often limited.", "Pronghorn license");
  add("pronghorn", "muzzleloader", s.prongMuz, "Muzzleloader pronghorn, unit-specific", "Usually 1.", "Pronghorn license");
  add("moose", "archery", s.moose, "Moose archery, draw, early fall", "1. Draw.", "Moose license (draw)");
  add("moose", "firearm", s.moose, "Moose rifle, draw, early fall", "1. Draw.", "Moose license (draw)");
  add("moose", "muzzleloader", s.moose, "Moose muzzleloader if listed", "1. Draw.", "Moose license (draw)");
  add("black-bear", "archery", s.bear, "Fall bear concurrent with archery / general", "Typically 1.", "Bear license");
  add("black-bear", "firearm", s.bear, "Fall bear concurrent with rifle seasons in many units", "Typically 1.", "Bear license");
  add("black-bear", "muzzleloader", s.bear, "Follows general bear season", "Typically 1.", "Bear license");
  add("mountain-goat", "archery", s.goat, "Goat, draw, early fall", "1. Draw.", "Goat license (draw)");
  add("mountain-goat", "firearm", s.goat, "Goat, draw, early fall", "1. Draw.", "Goat license (draw)");
  add("mountain-goat", "muzzleloader", s.goat, "Goat if listed", "1. Draw.", "Goat license (draw)");
  add("bighorn", "archery", s.sheep, "Sheep, draw, late summer–fall", "1. Draw.", "Sheep license (draw)");
  add("bighorn", "firearm", s.sheep, "Sheep, draw, late summer–fall", "1. Draw.", "Sheep license (draw)");
  add("bighorn", "muzzleloader", s.sheep, "Sheep if listed", "1. Draw.", "Sheep license (draw)");
  add("bison", "archery", s.bison, "Bison if listed, draw", "1. Draw.", "Bison license (draw)");
  add("bison", "firearm", s.bison, "Bison, draw, unit-specific", "1. Draw.", "Bison license (draw)");
  add("bison", "muzzleloader", s.bison, "Bison if listed", "1. Draw.", "Bison license (draw)");
  return out;
}

function stateLabelName(state: HuntState): string {
  const names: Record<HuntState, string> = {
    CO: "Colorado",
    WY: "Wyoming",
    MT: "Montana",
    ID: "Idaho",
    UT: "Utah",
    NM: "New Mexico",
    AK: "Alaska",
    NE: "Nebraska",
    IA: "Iowa",
    KS: "Kansas",
    SD: "South Dakota",
  };
  return names[state];
}

export function findSeason(state: HuntState, species: Species, weapon: Weapon): SeasonRule | undefined {
  return RULES.find((r) => r.state === state && r.species === species && r.weapon === weapon);
}

export function legalMonths(state: HuntState, species: Species, weapon: Weapon): number[] {
  return findSeason(state, species, weapon)?.months ?? [];
}

export function weaponsFor(state: HuntState, species: Species): Weapon[] {
  const set = new Set<Weapon>();
  for (const r of RULES) {
    if (r.state === state && r.species === species && r.months.length) set.add(r.weapon);
  }
  return (["archery", "firearm", "muzzleloader"] as Weapon[]).filter((w) => set.has(w));
}

/** Species-specific rut — never shown for a different species. */
export function rutNote(species: Species, month: number): string | null {
  const table: Partial<Record<Species, { months: number[]; note: string }>> = {
    elk: { months: [9], note: "Elk rut is September. Calling and satellite-bull movement peak this month; bulls are still vocal on warm afternoons." },
    "mule-deer": { months: [11, 12], note: "Mule deer rut typically peaks mid-November, with chasing into early December at higher elevations." },
    whitetail: { months: [11], note: "Midwest whitetail peak rut is typically the middle two weeks of November. Seeking starts late October." },
    pronghorn: { months: [9], note: "Pronghorn rut is September. Bucks hold harems on open flats; mornings are the window." },
    moose: { months: [9, 10], note: "Moose rut runs late September into October. Bulls cruise and respond to cow calls." },
    caribou: { months: [10], note: "Caribou rut is October. Bulls are grouped and moving; antlers still velvet-free and hard." },
    "sitka-blacktail": { months: [11], note: "Sitka blacktail rut is November in most island units. Mid-day movement increases." },
    bison: { months: [7, 8], note: "Bison rut is mid-summer. Fall hunts are not rut hunts — treat them as location and weather problems." },
  };
  const row = table[species];
  if (!row || !row.months.includes(month)) return null;
  return row.note;
}
