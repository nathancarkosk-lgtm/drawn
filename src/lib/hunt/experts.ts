import type { ExpertClaim, HuntInput, Species, Theater } from "./types";
import { regionById } from "./options";

/** Quarry names in copy. Habitat asides like "bear country" are handled separately. */
const QUARRY_NAME: Array<[Species, RegExp]> = [
  ["whitetail", /\bwhitetail\b|\bwhite-?tails?\b/i],
  ["mule-deer", /\bmule deer\b|\bmuleys?\b/i],
  ["elk", /\belk\b|\bwapiti\b/i],
  ["pronghorn", /\bpronghorn\b|\bantelope\b/i],
  ["moose", /\bmoose\b/i],
  ["black-bear", /\bblack bears?\b/i],
  ["brown-bear", /\bbrown bears?\b|\bgrizzl(?:y|ies)\b/i],
  ["caribou", /\bcaribou\b|\breindeer\b/i],
  ["sitka-blacktail", /\bblacktails?\b|\bsitka blacktail\b/i],
  ["mountain-goat", /\bmountain goats?\b/i],
  ["bighorn", /\bbighorn\b|\bsheep hunt\b/i],
  ["bison", /\bbison\b|\bbuffalo\b/i],
];

/** True when copy is about a different animal than this hunt. */
export function namesWrongQuarry(text: string, species: Species): boolean {
  const named = QUARRY_NAME.filter(([, re]) => re.test(text)).map(([sp]) => sp);
  const deerish = species === "whitetail" || species === "mule-deer" || species === "sitka-blacktail";
  const saysGenericDeer = /\bdeers?\b/i.test(text) && !/\bmule deer\b/i.test(text);
  if (saysGenericDeer && !deerish) return true;
  if (!named.length) return false;
  return !named.includes(species);
}

export const EXPERTS: ExpertClaim[] = [
  {
    id: "barklow-moisture",
    person: "John Barklow",
    credential: "Mountain hunter and longtime Sitka system designer",
    url: "https://www.sitkagear.com",
    claim:
      "Treat moisture as the first problem, not cold. Hunt slightly underdressed on the climb, vent early, and add insulation only when you stop.",
    species: ["elk", "mule-deer", "moose", "mountain-goat", "bighorn", "caribou"],
    tactics: ["spot-and-stalk", "still-hunting", "tracking"],
    terrains: ["steep-alpine", "timber", "foothills"],
    lodgings: ["backpack", "pack-in-base", "wall-tent"],
    theaters: ["west", "alaska"],
  },
  {
    id: "barklow-puffy",
    person: "John Barklow",
    credential: "Mountain hunter and longtime Sitka system designer",
    url: "https://www.sitkagear.com",
    claim:
      "A packable puffy is the piece that makes a wet, windy rest actually recoverable. It is a stop layer, not a hike layer.",
    tactics: ["spot-and-stalk", "glassing"],
    theaters: ["west", "alaska"],
  },
  {
    id: "brooks-insulated-pants",
    person: "Brad Brooks",
    credential: "Stone Glacier founder; long-range mountain hunter",
    url: "https://stoneglacier.com",
    claim:
      "On all-day glassing hunts the legs go cold first. A packable insulated pant you put on at the glassing knob is worth more than a heavier hiking pant.",
    tactics: ["glassing", "spot-and-stalk"],
    terrains: ["steep-alpine", "prairie", "desert", "foothills"],
    theaters: ["west", "alaska"],
  },
  {
    id: "kamp-calories",
    person: "Kyle Kamp",
    credential: "Exo Mountain Gear; backpack-hunt outfitter and athlete",
    url: "https://exomtngear.com",
    claim:
      "Most failed backpack hunts are calorie and sleep problems dressed up as gear problems. Plan real food weight, not just freeze-dried marketing servings.",
    lodgings: ["backpack", "pack-in-base"],
    theaters: ["west", "alaska"],
  },
  {
    id: "kamp-pack",
    person: "Kyle Kamp",
    credential: "Exo Mountain Gear; backpack-hunt outfitter and athlete",
    url: "https://exomtngear.com",
    claim:
      "The pack has to carry the animal, not just the camp. If you cannot haul 80–100 lb on the frame, you bought a day pack.",
    lodgings: ["backpack", "pack-in-base"],
    species: ["elk", "moose", "bison", "caribou", "brown-bear"],
    theaters: ["west", "alaska"],
  },
  {
    id: "rokslide-glass",
    person: "Rokslide (community consensus)",
    credential: "Western hunting forum; decades of trip reports",
    url: "https://www.rokslide.com",
    claim:
      "Open country is a three-optic problem: binoculars on the chest, a spotter, and a tripod. Cheap glass is more expensive than one good 10x or 12x.",
    species: ["mule-deer", "elk", "pronghorn", "bighorn", "mountain-goat"],
    tactics: ["glassing", "spot-and-stalk"],
    terrains: ["prairie", "desert", "steep-alpine", "foothills", "plains"],
    theaters: ["west"],
  },
  {
    id: "warren-glass-first",
    person: "Remi Warren",
    credential: "Western hunter and filmmaker; glassing-focused public-land hunts",
    url: "https://www.themeateater.com",
    claim:
      "Find them with glass before you burn boots. Most stalks fail because the hunter left the glass too early, not because they lacked a better jacket.",
    species: ["mule-deer", "elk", "pronghorn"],
    tactics: ["glassing", "spot-and-stalk"],
    theaters: ["west"],
  },
  {
    id: "jacobsen-mule-deer",
    person: "Corey Jacobsen",
    credential: "Mule deer specialist; Eastmans' / Drop-Tine background",
    url: "https://www.eastmans.com",
    claim:
      "Mule deer live in beds you can glass, not in the timber you want to still-hunt. Spend first light on a vantage, not in the bottom.",
    species: ["mule-deer"],
    tactics: ["glassing", "spot-and-stalk"],
    theaters: ["west"],
  },
  {
    id: "newberg-public",
    person: "Randy Newberg",
    credential: "Public-land hunter; Hunt Talk / Fresh Tracks",
    url: "https://www.randynewberg.com",
    claim:
      "On public land, hunt where other people will not walk and at hours they will not keep. Access and pressure beat a new camo pattern.",
    theaters: ["west"],
    tactics: ["spot-and-stalk", "still-hunting", "glassing"],
  },
  {
    id: "newberg-whitetail",
    person: "Randy Newberg",
    credential: "Public-land hunter; Hunt Talk / Fresh Tracks",
    url: "https://www.randynewberg.com",
    claim:
      "Western timber and creek-bottom bucks still hunt like whitetail. Wind, cover, and a quiet sit — not first light on an open face.",
    species: ["whitetail"],
    tactics: ["ambush", "still-hunting"],
    terrains: ["river-bottom", "timber", "plains", "foothills"],
    theaters: ["west"],
  },
  {
    id: "vincent-light",
    person: "Donnie Vincent",
    credential: "DIY mountain hunter and filmmaker",
    url: "https://www.donnievincent.com",
    claim:
      "Cut weight that does not kill the animal or keep you alive. Duplicate 'just in case' clothing is how packs get to 70 lb before food.",
    lodgings: ["backpack", "pack-in-base"],
    theaters: ["west", "alaska"],
  },
  {
    id: "hanes-simple",
    person: "Cam Hanes",
    credential: "Bowhunter; high-output mountain training",
    url: "https://www.cameronhanes.com",
    claim:
      "Fitness is gear. A lighter kit does not help if you cannot climb the last bowl at 9,000 ft on day five.",
    species: ["elk", "mule-deer", "mountain-goat", "bighorn"],
    lodgings: ["backpack", "pack-in-base"],
    theaters: ["west"],
    terrains: ["steep-alpine", "timber", "foothills"],
  },
  {
    id: "kenyon-wind",
    person: "Mark Kenyon",
    credential: "Wired to Hunt; Midwest whitetail communicator",
    url: "https://www.wiredtohunt.com",
    claim:
      "Whitetail sits are won on wind and entry, not on the warmest jacket in the catalog. If your scent blows into the bedding, the Fanatic does not matter.",
    species: ["whitetail"],
    tactics: ["ambush", "still-hunting", "calling"],
    terrains: ["timber", "river-bottom", "plains", "foothills"],
    theaters: ["midwest", "west"],
  },
  {
    id: "infalt-micro",
    person: "Dan Infalt",
    credential: "The Hunting Beast; public-land whitetail terrain specialist",
    url: "https://thehuntingbeast.com",
    claim:
      "Hunt the micro-terrain — the ditch, the point, the downwind edge of the bedding — not the scenic oak. Setup beats camo.",
    species: ["whitetail"],
    tactics: ["ambush", "still-hunting"],
    terrains: ["timber", "river-bottom", "plains", "foothills"],
    theaters: ["midwest", "west"],
  },
  {
    id: "winke-stand",
    person: "Bill Winke",
    credential: "Midwest Whitetail; decades of treestand hunting",
    url: "https://www.midwestwhitetail.com",
    claim:
      "A stand you can get into quietly, on the right wind, with a safe harness, kills more deer than a louder stand in a 'better' tree.",
    species: ["whitetail"],
    tactics: ["ambush"],
    terrains: ["timber", "river-bottom", "plains", "foothills"],
    theaters: ["midwest", "west"],
  },
  {
    id: "thp-pressure",
    person: "Josh Kirchner / The Hunting Public",
    credential: "Public-land whitetail hunters; pressured-deer film work",
    url: "https://www.thehuntingpublic.com",
    claim:
      "Pressured public bucks shift to night and to forgotten pockets. Hunt mid-day, hunt nasty weather, and do not educate the same tree twice.",
    species: ["whitetail"],
    tactics: ["ambush", "still-hunting", "tracking"],
    terrains: ["timber", "river-bottom", "plains", "foothills"],
    theaters: ["midwest", "west"],
  },
  {
    id: "peterson-layers",
    person: "Tony Peterson",
    credential: "Midwest DIY writer; bowhunting and gear testing",
    url: "https://www.outdoorlife.com",
    claim:
      "For a close-range sit, quiet trumps breathable. Tricot and fleece that let you draw at 18 yards beat a slick mountain softshell every time.",
    species: ["whitetail"],
    tactics: ["ambush", "still-hunting"],
    weapons: ["archery"],
    theaters: ["midwest", "west"],
  },
  {
    id: "eichler-calling",
    person: "Fred Eichler",
    credential: "Outfitter and calling-focused bowhunter",
    url: "https://www.themeateater.com",
    claim:
      "On elk, calling is a conversation, not a concert. Locate, then move, then speak as a cow or a satellite — do not bugle at a herd bull from 600 yards as a default.",
    species: ["elk"],
    tactics: ["calling", "spot-and-stalk"],
    theaters: ["west"],
  },
  {
    id: "rinella-care",
    person: "Steven Rinella",
    credential: "MeatEater; hunter and game-care educator",
    url: "https://www.themeateater.com",
    claim:
      "The hunt is not over at the shot. Game bags, a real knife, and a plan to cool meat in the actual weather you have are part of the kit, not extras.",
    theaters: ["west", "midwest", "alaska"],
  },
  {
    id: "freel-alaska",
    person: "Tyler Freel",
    credential: "Alaska hunter; Outdoor Life northern field editor",
    url: "https://www.outdoorlife.com",
    claim:
      "Alaska punishes cotton, gadgets with no spare power, and plans that assume the bush plane hits the gravel. Redundancy in navigation and shelter is the kit.",
    theaters: ["alaska"],
  },
  {
    id: "dihle-coast",
    person: "Bjorn Dihle",
    credential: "Southeast Alaska hunter and writer",
    url: "https://www.themeateater.com",
    claim:
      "Coastal Alaska is a rain-and-alder problem. Rubber or wet-boot systems, a real rain shell, and patience beat alpine dry-fit clothing.",
    theaters: ["alaska"],
    terrains: ["timber", "river-bottom"],
  },
  {
    id: "heward-research",
    person: "Colton Heward / goHUNT",
    credential: "Western research and unit breakdowns",
    url: "https://www.gohunt.com",
    claim:
      "E-scout the unit for water, north-facing beds, and access pressure before you buy another jacket. The map work is the cheapest optic you own.",
    theaters: ["west"],
    tactics: ["spot-and-stalk", "glassing"],
  },
  {
    id: "henderson-systems",
    person: "Brody Henderson",
    credential: "MeatEater; backcountry hunter and former biologist",
    url: "https://www.themeateater.com",
    claim:
      "Build a system (base, active insulation, shell, stop puffy) and stop mixing random heavy coats. The system is what keeps you moving another day.",
    theaters: ["west", "alaska"],
    lodgings: ["backpack", "pack-in-base", "wall-tent"],
  },
  {
    id: "derby-desert",
    person: "Wade Derby",
    credential: "Desert and open-country mule deer hunter",
    url: "https://www.eastmans.com",
    claim:
      "Desert and sage country are a glassing and water hunt. Pale country, huge views, and wind — tripod time beats still-hunting mesquite.",
    species: ["mule-deer", "pronghorn"],
    terrains: ["desert", "prairie", "plains"],
    tactics: ["glassing", "spot-and-stalk"],
    theaters: ["west"],
  },
  {
    id: "adfg-bear",
    person: "Alaska DFG biologists (public guidance)",
    credential: "State wildlife agency; bear safety and hunt reports",
    url: "https://www.adfg.alaska.gov",
    claim:
      "In brown-bear country, bear spray belongs on the belt, food hangs or lives in a bear-resistant system, and shooting a bear is not a gear shortcut for poor camp habits.",
    theaters: ["alaska"],
    species: ["brown-bear", "black-bear", "moose", "sitka-blacktail", "caribou"],
  },
  {
    id: "cpw-verify",
    person: "Colorado Parks & Wildlife",
    credential: "State wildlife agency",
    url: "https://cpw.state.co.us",
    claim:
      "Season dates, hunt codes, and OTC-vs-draw status are unit-specific and change with the five-year season structure. Confirm the brochure for your GMU before you pack.",
    theaters: ["west"],
    states: ["CO"],
  },
  {
    id: "ngpc-deer",
    person: "Nebraska Game & Parks",
    credential: "State wildlife agency",
    url: "https://outdoornebraska.gov",
    claim:
      "Nebraska deer is permit-and-season specific. Archery is the long season; November firearm is nine days; muzzleloader is December. Do not assume a rifle month you were not issued.",
    theaters: ["midwest"],
    species: ["whitetail", "mule-deer"],
    states: ["NE"],
  },
];

function theaterOf(input: HuntInput): Theater {
  return regionById(input.regionId)?.theater ?? "west";
}

export function expertFitsHunt(e: ExpertClaim, input: HuntInput): boolean {
  if (e.species && !e.species.includes(input.species)) return false;
  if (e.states && !e.states.includes(input.state)) return false;
  if (e.weapons && !e.weapons.includes(input.weapon)) return false;
  if (!e.species && namesWrongQuarry(e.claim, input.species)) return false;
  return true;
}

export function pickExperts(input: HuntInput, limit = 8): ExpertClaim[] {
  const theater = theaterOf(input);
  const scored = EXPERTS.filter((e) => expertFitsHunt(e, input))
    .map((e) => {
      let score = 1;
      if (e.species?.includes(input.species)) score += 8;
      if (e.theaters?.includes(theater)) score += 3;
      else if (e.theaters) score -= 2;
      if (e.tactics?.some((t) => input.tactics.includes(t))) score += 4;
      else if (e.tactics) score -= 3;
      if (e.terrains?.some((t) => input.terrains.includes(t))) score += 2;
      if (e.lodgings?.some((l) => input.lodgings.includes(l))) score += 2;
      if (e.weapons?.includes(input.weapon)) score += 2;
      if (e.states?.includes(input.state)) score += 6;
      return { e, score };
    })
    .filter((x) => x.score > 2)
    .sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const out: ExpertClaim[] = [];
  for (const { e } of scored) {
    if (seen.has(e.person)) continue;
    seen.add(e.person);
    out.push(e);
    if (out.length >= limit) break;
  }
  return out;
}
