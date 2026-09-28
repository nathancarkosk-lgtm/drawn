import type {
  Access,
  Duration,
  Experience,
  HuntDraft,
  HuntState,
  Land,
  Lodging,
  Region,
  Species,
  StandSetup,
  Tactic,
  Terrain,
  Travel,
  Weapon,
  BlindType,
} from "./types";
import { ACCESSES, BLINDS, LANDS, LODGINGS, STANDS, TACTICS, TERRAINS, TRAVELS } from "./types";

export const speciesLabel: Record<Species, string> = {
  elk: "Elk",
  "mule-deer": "Mule deer",
  whitetail: "Whitetail",
  pronghorn: "Pronghorn",
  moose: "Moose",
  "black-bear": "Black bear",
  "brown-bear": "Brown bear",
  caribou: "Caribou",
  "sitka-blacktail": "Sitka blacktail",
  "mountain-goat": "Mountain goat",
  bighorn: "Bighorn sheep",
  bison: "Bison",
};

export const stateLabel: Record<HuntState, { name: string; agency: string; url: string }> = {
  CO: { name: "Colorado", agency: "Colorado Parks & Wildlife", url: "https://cpw.state.co.us" },
  WY: { name: "Wyoming", agency: "Wyoming Game & Fish", url: "https://wgfd.wyo.gov" },
  MT: { name: "Montana", agency: "Montana FWP", url: "https://fwp.mt.gov" },
  ID: { name: "Idaho", agency: "Idaho Fish & Game", url: "https://idfg.idaho.gov" },
  UT: { name: "Utah", agency: "Utah DWR", url: "https://wildlife.utah.gov" },
  NM: { name: "New Mexico", agency: "NM Game & Fish", url: "https://wildlife.nm.gov" },
  AK: { name: "Alaska", agency: "Alaska Dept. of Fish & Game", url: "https://www.adfg.alaska.gov" },
  NE: { name: "Nebraska", agency: "Nebraska Game & Parks", url: "https://outdoornebraska.gov" },
  IA: { name: "Iowa", agency: "Iowa DNR", url: "https://www.iowadnr.gov" },
  KS: { name: "Kansas", agency: "Kansas Dept. of Wildlife & Parks", url: "https://ksoutdoors.com" },
  SD: { name: "South Dakota", agency: "South Dakota GFP", url: "https://gfp.sd.gov" },
};

export const weaponLabel: Record<Weapon, string> = {
  archery: "Archery",
  firearm: "Firearm",
  muzzleloader: "Muzzleloader",
};

export const experienceLabel: Record<Experience, { title: string; hint: string }> = {
  beginner: {
    title: "Beginning",
    hint: "More why, terms, and common mistakes",
  },
  intermediate: {
    title: "Some seasons in",
    hint: "Practical picks with enough context to decide",
  },
  experienced: {
    title: "Seasoned",
    hint: "Short list, tradeoffs, and the open calls",
  },
};

export const tacticLabel: Record<Tactic, string> = {
  "spot-and-stalk": "Spot-and-stalk",
  "still-hunting": "Still-hunting",
  glassing: "Glassing",
  calling: "Calling",
  ambush: "Ambush / stand",
  tracking: "Tracking",
  safari: "Guided pursuit",
};

export const lodgingLabel: Record<Lodging, string> = {
  home: "Home each night",
  hotel: "Hotel / lodge",
  "truck-camp": "Truck camp",
  "wall-tent": "Wall tent / base camp",
  "pack-in-base": "Pack-in base camp",
  backpack: "Backpack hunt",
};

export function lodgingLabelFor(l: Lodging, accesses: Access[]): string {
  if (l === "truck-camp") {
    if (accesses.includes("atv") && !accesses.includes("truck")) return "ATV camp";
    if (accesses.includes("boat") && !accesses.includes("truck")) return "Boat camp";
    return "Truck camp";
  }
  return lodgingLabel[l];
}

export const durationLabel: Record<Duration, string> = {
  day: "Day hunt",
  overnight: "Overnight",
  "2-4": "2–4 days",
  "5-7": "5–7 days",
  expedition: "Extended expedition",
};

export const travelLabel: Record<Travel, string> = {
  "short-walks": "Short walks",
  "long-hikes": "Long day hikes",
  "repeated-climbs": "Repeated climbs",
  "all-day-glassing": "All-day glassing",
  "packing-camp-daily": "Moving camp each day",
  "fixed-camp": "Hunting around one camp",
};

export function kitOrigin(accesses: Access[], lodgings: Lodging[]): string {
  const fieldCamp = lodgings.some((l) => l === "backpack" || l === "pack-in-base" || l === "wall-tent");
  if (fieldCamp) return "camp";

  const bits: string[] = [];
  if (accesses.includes("atv")) bits.push("the ATV");
  if (accesses.includes("boat")) bits.push("the boat");
  if (accesses.includes("trailhead")) bits.push("the trailhead");
  if (accesses.includes("pack-stock")) bits.push("the pack string");
  if (accesses.includes("float-plane") || accesses.includes("bush-plane")) bits.push("the strip");
  if (accesses.includes("truck")) bits.push("the truck");

  if (bits.length === 1) return bits[0];
  if (bits.length === 2) return `${bits[0]} or ${bits[1]}`;
  if (bits.length > 2) return `${bits.slice(0, -1).join(", ")}, or ${bits[bits.length - 1]}`;

  if (lodgings.some((l) => l === "home" || l === "hotel" || l === "truck-camp")) return "the truck";
  return "camp";
}

export function travelLabelFor(t: Travel, lodgings: Lodging[], accesses: Access[] = [], tactics: Tactic[] = []): string {
  const origin = kitOrigin(accesses, lodgings);
  const toStand = tactics.includes("ambush");
  if (t === "short-walks") return toStand ? `Short walk to the stand from ${origin}` : `Short walks from ${origin}`;
  if (t === "long-hikes") return toStand ? `Long walk to the stand from ${origin}` : `Long walks from ${origin}`;
  return travelLabel[t];
}

export const terrainLabel: Record<Terrain, string> = {
  plains: "Plains",
  foothills: "Foothills",
  "steep-alpine": "Steep alpine",
  timber: "Timber",
  desert: "Desert",
  prairie: "Prairie / sage",
  "river-bottom": "River bottom",
};

export const accessLabel: Record<Access, string> = {
  truck: "Drive in / truck",
  trailhead: "Trailhead walk-in",
  atv: "ATV / UTV",
  "pack-stock": "Pack string",
  "float-plane": "Float plane",
  "bush-plane": "Bush plane",
  boat: "Boat",
};

export const accessHint: Record<Access, string> = {
  truck: "Weight is not the limiter. Weather and quiet still are.",
  trailhead: "You carry the hunt in. Cut ounces that do not kill or keep you alive.",
  atv: "The machine gets you close. The pack still has to hunt.",
  "pack-stock": "Stock haul camp. Your day kit still walks.",
  "float-plane": "Payload is the kit. Ounces on the plane cost animals later.",
  "bush-plane": "Strip weight is real. If it does not fit the cub, it does not hunt.",
  boat: "The boat hauls camp. What you climb in still needs to be light.",
};

export const landLabel: Record<Land, string> = {
  public: "Public land",
  private: "Private land",
};

export const landHint: Record<Land, string> = {
  public: "You carry what you hunt from. Stands usually come in with you.",
  private: "Permission first. Fixed stands may already be hung.",
};

export const blindLabel: Record<BlindType, string> = {
  "hang-on": "Hang-on / lock-on",
  ladder: "Ladder stand",
  climber: "Climber",
  saddle: "Saddle",
  box: "Box / shooting house",
  hub: "Hub / pop-up blind",
  natural: "Natural cover",
};

export const blindHint: Record<BlindType, string> = {
  "hang-on": "Light enough to carry. You need a tree.",
  ladder: "Heavy. Usually left on private ground.",
  climber: "You wear it up the tree. Public-land classic.",
  saddle: "You wear the stand. Light for a long walk in.",
  box: "Enclosed house. Almost always already on private.",
  hub: "Pop-up you carry in. Works without a tree.",
  natural: "Brush, bale, or the ground. Pad only.",
};

export function treeBlind(blinds: readonly BlindType[]): boolean {
  return blinds.some((b) => b === "hang-on" || b === "ladder" || b === "climber");
}

export function blindsFor(
  tactics: Tactic[],
  terrains: Terrain[],
  lands: Land[] = [],
  regionId: string | null = null,
): BlindType[] {
  if (!tactics.includes("ambush")) return [];
  const trees = treeCountry(terrains);
  const inferred = lands.length ? lands : landsFor(regionId, []);
  const priv = inferred.includes("private");
  const pubOnly = inferred.length > 0 && inferred.every((l) => l === "public");
  const out: BlindType[] = ["hub", "natural"];
  if (priv) out.unshift("box");
  if (trees) {
    out.unshift("hang-on", "climber", "saddle");
    if (priv) out.splice(1, 0, "ladder");
  }
  if (pubOnly) return BLINDS.filter((b) => out.includes(b) && b !== "box" && b !== "ladder");
  return BLINDS.filter((b) => out.includes(b));
}

export const monthLabel = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const monthShort = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function joinLabeled<T extends string>(ids: readonly T[], labels: Record<T, string>, sep = " · "): string {
  return ids.map((id) => labels[id]).filter(Boolean).join(sep);
}

export function toggleItem<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

/** Species legally (and practically) hunted in each covered state. */
export const speciesByState: Record<HuntState, Species[]> = {
  CO: ["elk", "mule-deer", "whitetail", "pronghorn", "moose", "black-bear", "mountain-goat", "bighorn", "bison"],
  WY: ["elk", "mule-deer", "whitetail", "pronghorn", "moose", "black-bear", "mountain-goat", "bighorn", "bison"],
  MT: ["elk", "mule-deer", "whitetail", "pronghorn", "moose", "black-bear", "mountain-goat", "bighorn", "bison"],
  ID: ["elk", "mule-deer", "whitetail", "pronghorn", "moose", "black-bear", "mountain-goat", "bighorn"],
  UT: ["elk", "mule-deer", "whitetail", "pronghorn", "moose", "black-bear", "mountain-goat", "bighorn", "bison"],
  NM: ["elk", "mule-deer", "whitetail", "pronghorn", "black-bear", "bighorn", "bison"],
  AK: ["moose", "black-bear", "brown-bear", "caribou", "sitka-blacktail", "mountain-goat", "bighorn", "bison"],
  NE: ["whitetail", "mule-deer", "pronghorn", "elk"],
  IA: ["whitetail"],
  KS: ["whitetail", "mule-deer", "pronghorn"],
  SD: ["whitetail", "mule-deer", "pronghorn", "elk", "bighorn", "bison"],
};

export function statesForSpecies(species: Species): HuntState[] {
  return (Object.keys(speciesByState) as HuntState[]).filter((s) => speciesByState[s].includes(species));
}

export const REGIONS: Region[] = [
  { id: "co-flat-tops", state: "CO", name: "Flat Tops / northwest", theater: "west", lat: 40.05, lon: -107.35, elevFt: 8500, blurb: "Big timber, parks, and steep drainages.", terrains: ["timber", "foothills", "steep-alpine"] },
  { id: "co-san-juans", state: "CO", name: "San Juans", theater: "west", lat: 37.8, lon: -107.7, elevFt: 10500, blurb: "High basins, cliffs, and long approaches.", terrains: ["steep-alpine", "timber", "foothills"] },
  { id: "co-west-slope", state: "CO", name: "West Slope / Uncompahgre", theater: "west", lat: 38.9, lon: -108.05, elevFt: 7800, blurb: "Oak, aspen, and broken mesas.", terrains: ["foothills", "timber", "desert"] },
  { id: "co-high-country", state: "CO", name: "Central high country", theater: "west", lat: 39.15, lon: -106.45, elevFt: 10500, blurb: "Alpine bowls above timberline.", terrains: ["steep-alpine", "timber"] },
  { id: "co-plains", state: "CO", name: "Eastern plains", theater: "west", lat: 39.6, lon: -103.2, elevFt: 4500, blurb: "CRP, creek bottoms, and private ground.", terrains: ["plains", "prairie", "river-bottom"] },
  { id: "wy-gye", state: "WY", name: "Greater Yellowstone", theater: "west", lat: 43.75, lon: -110.55, elevFt: 7500, blurb: "Timbered ridges and big wilderness.", terrains: ["timber", "foothills", "steep-alpine"] },
  { id: "wy-red-desert", state: "WY", name: "Red Desert / sage", theater: "west", lat: 42.05, lon: -108.5, elevFt: 6800, blurb: "Open sage, wind, and long glassing.", terrains: ["desert", "prairie", "plains"] },
  { id: "wy-bighorns", state: "WY", name: "Bighorns", theater: "west", lat: 44.4, lon: -107.2, elevFt: 8500, blurb: "Steep east face, high parks.", terrains: ["steep-alpine", "timber", "foothills"] },
  { id: "wy-snowy", state: "WY", name: "Snowy Range / southeast", theater: "west", lat: 41.35, lon: -106.35, elevFt: 9500, blurb: "High lakes, spruce, and wind.", terrains: ["steep-alpine", "timber", "foothills"] },
  { id: "mt-bob", state: "MT", name: "Bob Marshall country", theater: "west", lat: 47.8, lon: -113.3, elevFt: 5500, blurb: "True wilderness, river corridors, walls of timber.", terrains: ["timber", "river-bottom", "foothills"] },
  { id: "mt-madison", state: "MT", name: "Madison / Gallatin", theater: "west", lat: 45.25, lon: -111.35, elevFt: 7500, blurb: "Steep timber and alpine.", terrains: ["steep-alpine", "timber", "foothills"] },
  { id: "mt-breaks", state: "MT", name: "Missouri Breaks", theater: "west", lat: 47.75, lon: -108.55, elevFt: 2800, blurb: "Badlands, coulees, and mule deer country.", terrains: ["prairie", "plains", "foothills", "desert"] },
  { id: "mt-prairie", state: "MT", name: "Southeast prairie", theater: "west", lat: 46.4, lon: -105.8, elevFt: 3000, blurb: "Open prairie and river breaks.", terrains: ["prairie", "plains", "river-bottom"] },
  { id: "id-frank", state: "ID", name: "Frank Church / backcountry", theater: "west", lat: 45.0, lon: -115.0, elevFt: 5500, blurb: "Deep wilderness, river canyons.", terrains: ["timber", "river-bottom", "foothills"] },
  { id: "id-panhandle", state: "ID", name: "Panhandle", theater: "west", lat: 47.95, lon: -116.5, elevFt: 3500, blurb: "Wet timber, steep cedar draws.", terrains: ["timber", "foothills", "river-bottom"] },
  { id: "id-island", state: "ID", name: "Island Park / southeast", theater: "west", lat: 44.42, lon: -111.4, elevFt: 6500, blurb: "Lodgepole, lava, and frost.", terrains: ["timber", "prairie", "foothills"] },
  { id: "ut-uintas", state: "UT", name: "High Uintas", theater: "west", lat: 40.72, lon: -110.8, elevFt: 10000, blurb: "Alpine lakes and long ridges.", terrains: ["steep-alpine", "timber", "foothills"] },
  { id: "ut-bookcliffs", state: "UT", name: "Book Cliffs", theater: "west", lat: 39.55, lon: -109.5, elevFt: 7500, blurb: "Remote mesa country.", terrains: ["desert", "foothills", "timber"] },
  { id: "ut-south", state: "UT", name: "Southern desert / plateau", theater: "west", lat: 38.15, lon: -111.5, elevFt: 6500, blurb: "Canyon, sage, and timber pockets.", terrains: ["desert", "prairie", "timber", "foothills"] },
  { id: "nm-sangre", state: "NM", name: "Sangre de Cristo", theater: "west", lat: 36.5, lon: -105.45, elevFt: 9500, blurb: "High timber and alpine.", terrains: ["steep-alpine", "timber", "foothills"] },
  { id: "nm-gila", state: "NM", name: "Gila", theater: "west", lat: 33.3, lon: -108.35, elevFt: 7500, blurb: "Remote mountains, piñon-juniper.", terrains: ["foothills", "timber", "desert"] },
  { id: "nm-plains", state: "NM", name: "Southeast plains", theater: "west", lat: 33.4, lon: -104.5, elevFt: 3800, blurb: "Open country and mesquite.", terrains: ["plains", "prairie", "desert"] },
  { id: "ak-interior", state: "AK", name: "Interior / Denali side", theater: "alaska", lat: 64.0, lon: -148.0, elevFt: 1500, blurb: "Taiga, rivers, and huge country.", terrains: ["timber", "river-bottom", "plains", "foothills"] },
  { id: "ak-southcentral", state: "AK", name: "Southcentral / Kenai", theater: "alaska", lat: 60.5, lon: -150.4, elevFt: 800, blurb: "Coastal mountains, alder, rain.", terrains: ["timber", "foothills", "steep-alpine"] },
  { id: "ak-southeast", state: "AK", name: "Southeast islands", theater: "alaska", lat: 57.5, lon: -135.0, elevFt: 400, blurb: "Muskeg, timber, and salt chuck.", terrains: ["timber", "river-bottom"] },
  { id: "ak-brooks", state: "AK", name: "Brooks Range", theater: "alaska", lat: 68.1, lon: -152.0, elevFt: 2500, blurb: "Arctic mountains, no trees, serious weather.", terrains: ["steep-alpine", "plains", "foothills"] },
  { id: "ak-kodiak", state: "AK", name: "Kodiak", theater: "alaska", lat: 57.45, lon: -153.2, elevFt: 500, blurb: "Alder, grass, and coastal storms.", terrains: ["foothills", "timber", "plains"] },
  { id: "ak-peninsula", state: "AK", name: "Alaska Peninsula", theater: "alaska", lat: 57.1, lon: -158.0, elevFt: 400, blurb: "Tundra, wind, and brown bear country.", terrains: ["plains", "foothills"] },
  { id: "ne-loup", state: "NE", name: "Loup / Sandhills", theater: "midwest", lat: 41.55, lon: -99.15, elevFt: 2400, blurb: "Grass dunes, river timber, and isolated pockets.", terrains: ["prairie", "river-bottom", "plains"] },
  { id: "ne-pine-ridge", state: "NE", name: "Pine Ridge", theater: "midwest", lat: 42.7, lon: -103.3, elevFt: 3900, blurb: "Ponderosa breaks and mule deer ridges.", terrains: ["timber", "foothills", "prairie"] },
  { id: "ne-east", state: "NE", name: "Missouri / eastern timber", theater: "midwest", lat: 41.05, lon: -96.05, elevFt: 1100, blurb: "Ag, creek bottoms, and pressured whitetails.", terrains: ["river-bottom", "timber", "plains"] },
  { id: "ne-southwest", state: "NE", name: "Republican / southwest", theater: "midwest", lat: 40.3, lon: -101.0, elevFt: 3200, blurb: "CRP, canyons, and mixed deer.", terrains: ["prairie", "plains", "river-bottom"] },
  { id: "ia-loess", state: "IA", name: "Loess Hills / west", theater: "midwest", lat: 41.85, lon: -95.9, elevFt: 1200, blurb: "Steep timber over farm country.", terrains: ["timber", "foothills", "plains"] },
  { id: "ia-northeast", state: "IA", name: "Northeast timber", theater: "midwest", lat: 43.25, lon: -91.55, elevFt: 900, blurb: "Driftless hollows and big woods.", terrains: ["timber", "river-bottom", "foothills"] },
  { id: "ia-south", state: "IA", name: "Southern timber", theater: "midwest", lat: 40.75, lon: -93.5, elevFt: 1000, blurb: "Oak ridges and CRP edges.", terrains: ["timber", "prairie", "plains"] },
  { id: "ks-flint", state: "KS", name: "Flint Hills", theater: "midwest", lat: 38.45, lon: -96.55, elevFt: 1400, blurb: "Tallgrass, draws, and wind.", terrains: ["prairie", "plains", "river-bottom"] },
  { id: "ks-west", state: "KS", name: "High plains west", theater: "midwest", lat: 38.5, lon: -100.9, elevFt: 2900, blurb: "Mule deer, CRP, and shelterbelts.", terrains: ["plains", "prairie"] },
  { id: "ks-east", state: "KS", name: "Eastern timber", theater: "midwest", lat: 38.0, lon: -95.3, elevFt: 1000, blurb: "Hardwoods and ag edges.", terrains: ["timber", "river-bottom", "plains"] },
  { id: "sd-black-hills", state: "SD", name: "Black Hills", theater: "midwest", lat: 44.05, lon: -103.75, elevFt: 5500, blurb: "Ponderosa, canyons, elk and mule deer.", terrains: ["timber", "foothills", "prairie"] },
  { id: "sd-prairie", state: "SD", name: "Prairie / west river", theater: "midwest", lat: 44.35, lon: -101.2, elevFt: 2200, blurb: "Open grass and breaks.", terrains: ["prairie", "plains"] },
  { id: "sd-missouri", state: "SD", name: "Missouri River breaks", theater: "midwest", lat: 44.0, lon: -99.4, elevFt: 1600, blurb: "Timbered breaks over the river.", terrains: ["river-bottom", "timber", "prairie"] },
];

export function regionsFor(state: HuntState): Region[] {
  return REGIONS.filter((r) => r.state === state);
}

export function regionById(id: string | null): Region | undefined {
  return REGIONS.find((r) => r.id === id);
}

/** Terrains that actually exist in a region, in catalog order. */
export function terrainsForRegion(regionId: string | null): Terrain[] {
  const region = regionById(regionId);
  if (!region) return [];
  return TERRAINS.filter((t) => region.terrains.includes(t));
}

const PLAINS_ACCESS: Access[] = ["truck", "atv", "trailhead"];
const RIVER_ACCESS: Access[] = ["truck", "atv", "trailhead", "boat"];
const MOUNTAIN_ACCESS: Access[] = ["truck", "trailhead", "pack-stock", "atv"];
const OPEN_WEST_ACCESS: Access[] = ["truck", "atv", "trailhead"];
const WILD_ACCESS: Access[] = ["trailhead", "pack-stock", "boat"];
const FRANK_ACCESS: Access[] = ["trailhead", "pack-stock", "bush-plane", "boat"];
const BREAKS_ACCESS: Access[] = ["truck", "boat", "atv", "trailhead"];
const AK_ROAD_ACCESS: Access[] = ["truck", "trailhead", "bush-plane", "float-plane", "boat", "atv"];
const AK_BROOKS_ACCESS: Access[] = ["float-plane", "bush-plane", "boat"];
const AK_SE_ACCESS: Access[] = ["boat", "float-plane", "trailhead"];
const AK_ISLAND_ACCESS: Access[] = ["float-plane", "boat", "bush-plane"];

const ACCESS_BY_REGION: Record<string, Access[]> = {
  "co-flat-tops": MOUNTAIN_ACCESS,
  "co-san-juans": MOUNTAIN_ACCESS,
  "co-west-slope": MOUNTAIN_ACCESS,
  "co-high-country": MOUNTAIN_ACCESS,
  "co-plains": PLAINS_ACCESS,
  "wy-gye": MOUNTAIN_ACCESS,
  "wy-red-desert": OPEN_WEST_ACCESS,
  "wy-bighorns": MOUNTAIN_ACCESS,
  "wy-snowy": MOUNTAIN_ACCESS,
  "mt-bob": WILD_ACCESS,
  "mt-madison": MOUNTAIN_ACCESS,
  "mt-breaks": BREAKS_ACCESS,
  "mt-prairie": OPEN_WEST_ACCESS,
  "id-frank": FRANK_ACCESS,
  "id-panhandle": MOUNTAIN_ACCESS,
  "id-island": MOUNTAIN_ACCESS,
  "ut-uintas": MOUNTAIN_ACCESS,
  "ut-bookcliffs": OPEN_WEST_ACCESS,
  "ut-south": OPEN_WEST_ACCESS,
  "nm-sangre": MOUNTAIN_ACCESS,
  "nm-gila": MOUNTAIN_ACCESS,
  "nm-plains": OPEN_WEST_ACCESS,
  "ak-interior": AK_ROAD_ACCESS,
  "ak-southcentral": AK_ROAD_ACCESS,
  "ak-southeast": AK_SE_ACCESS,
  "ak-brooks": AK_BROOKS_ACCESS,
  "ak-kodiak": AK_ISLAND_ACCESS,
  "ak-peninsula": AK_ISLAND_ACCESS,
  "ne-loup": RIVER_ACCESS,
  "ne-pine-ridge": PLAINS_ACCESS,
  "ne-east": RIVER_ACCESS,
  "ne-southwest": PLAINS_ACCESS,
  "ia-loess": PLAINS_ACCESS,
  "ia-northeast": RIVER_ACCESS,
  "ia-south": PLAINS_ACCESS,
  "ks-flint": PLAINS_ACCESS,
  "ks-west": PLAINS_ACCESS,
  "ks-east": RIVER_ACCESS,
  "sd-black-hills": MOUNTAIN_ACCESS,
  "sd-prairie": OPEN_WEST_ACCESS,
  "sd-missouri": RIVER_ACCESS,
};

/** Access methods that are actually realistic for this region, in catalog order. */
export function accessesForRegion(regionId: string | null): Access[] {
  if (!regionId) return [];
  const allowed = ACCESS_BY_REGION[regionId];
  if (!allowed) return [];
  return ACCESSES.filter((a) => allowed.includes(a));
}

const PUBLIC_ONLY = new Set(["mt-bob", "id-frank", "ak-brooks", "ak-peninsula"]);

/** Land tenure that is actually on the table for this country. */
export function landsFor(regionId: string | null, _accesses: Access[] = []): Land[] {
  if (!regionId) return [];
  if (PUBLIC_ONLY.has(regionId)) return ["public"];
  return ["public", "private"];
}

export function lodgingsFor(regionId: string | null, selected: Access[]): Lodging[] {
  const possible = accessesForRegion(regionId);
  const canDrive = possible.some((a) => a === "truck" || a === "atv");
  let list: Lodging[] = [...LODGINGS];
  if (!canDrive) list = list.filter((l) => l !== "home" && l !== "truck-camp");
  const flyOnly =
    selected.length > 0 && selected.every((a) => a === "float-plane" || a === "bush-plane");
  if (flyOnly) {
    list = list.filter((l) => l !== "home" && l !== "truck-camp");
    const lodgeCountry = regionId === "ak-kodiak" || regionId === "ak-southeast" || regionId === "ak-southcentral";
    if (!lodgeCountry) list = list.filter((l) => l !== "hotel");
  }
  return list;
}

const SPECIES_TACTICS: Record<Species, Tactic[]> = {
  whitetail: ["ambush", "still-hunting", "calling", "tracking", "glassing", "spot-and-stalk", "safari"],
  "mule-deer": ["glassing", "spot-and-stalk", "still-hunting", "ambush", "tracking", "safari"],
  elk: ["glassing", "calling", "spot-and-stalk", "still-hunting", "tracking", "ambush", "safari"],
  pronghorn: ["glassing", "spot-and-stalk", "ambush", "safari"],
  moose: ["calling", "glassing", "spot-and-stalk", "still-hunting", "tracking", "ambush", "safari"],
  "black-bear": ["spot-and-stalk", "still-hunting", "ambush", "glassing", "tracking", "safari"],
  "brown-bear": ["spot-and-stalk", "glassing", "still-hunting", "tracking", "safari"],
  caribou: ["glassing", "spot-and-stalk", "tracking", "safari"],
  "sitka-blacktail": ["still-hunting", "glassing", "spot-and-stalk", "ambush", "calling", "safari"],
  "mountain-goat": ["glassing", "spot-and-stalk", "safari"],
  bighorn: ["glassing", "spot-and-stalk", "safari"],
  bison: ["spot-and-stalk", "glassing", "safari"],
};

export function tacticsFor(species: Species | null, terrains: Terrain[] = []): Tactic[] {
  if (!species) return [];
  let list = SPECIES_TACTICS[species] ?? [...TACTICS];
  const open = terrains.some((t) => t === "plains" || t === "prairie" || t === "desert" || t === "steep-alpine" || t === "foothills");
  const trees = terrains.some((t) => t === "timber" || t === "river-bottom" || t === "foothills");
  if (terrains.length && !open && species === "whitetail") {
    list = list.filter((t) => t !== "glassing");
  }
  if (terrains.length && !trees && (species === "whitetail" || species === "elk" || species === "sitka-blacktail")) {
    // Ground-blind ambush still counts on prairie. Keep ambush.
  }
  return TACTICS.filter((t) => list.includes(t));
}

export function treeCountry(terrains: readonly Terrain[]): boolean {
  return terrains.some((t) => t === "timber" || t === "river-bottom" || t === "foothills");
}

export const standLabel: Record<StandSetup, string> = {
  fixed: "Already in place",
  mobile: "I'll bring it in",
  saddle: "Saddle",
  ground: "Ground / blind",
};

export const standHint: Record<StandSetup, string> = {
  fixed: "Do not pack a stand. Harness still goes on in a tree.",
  mobile: "Hang-on, climber, or sticks walk in with you.",
  saddle: "You wear the stand.",
  ground: "Pad or hub only.",
};

export function standsFor(tactics: Tactic[], terrains: Terrain[], lands: Land[], blinds: BlindType[] = []): StandSetup[] {
  if (!tactics.includes("ambush")) return [];
  const hang = blinds.includes("hang-on");
  const climb = blinds.includes("climber");
  const ladder = blinds.includes("ladder");
  if (!hang && !climb && !ladder) return [];
  const trees = treeCountry(terrains);
  if (!trees) return [];
  const out: StandSetup[] = [];
  if (hang || climb) out.push("mobile");
  if (lands.includes("private") && (hang || ladder)) out.unshift("fixed");
  if (!out.length && ladder) out.push("fixed");
  return STANDS.filter((s) => out.includes(s));
}

/** Hunt length that can actually follow the camp you named. */
export function durationsFor(lodgings: Lodging[]): Duration[] {
  if (!lodgings.length) return [];
  if (lodgings.every((l) => l === "home")) return ["day"];
  const onlyCommute = lodgings.every((l) => l === "home" || l === "hotel");
  const onlyField = lodgings.every((l) => l === "backpack" || l === "pack-in-base" || l === "wall-tent");
  if (onlyCommute) return ["day", "2-4", "5-7"];
  if (onlyField) return ["overnight", "2-4", "5-7", "expedition"];
  return ["day", "overnight", "2-4", "5-7", "expedition"];
}

/** Daily travel that matches camp, trip length, ground, and tactics. */
export function travelsFor(args: {
  lodgings: Lodging[];
  duration: Duration | null;
  terrains: Terrain[];
  tactics: Tactic[];
}): Travel[] {
  const { lodgings, duration, terrains, tactics } = args;
  if (!lodgings.length) return [];

  const hasBackpack = lodgings.includes("backpack");
  const hasFixedCamp = lodgings.some((l) => l === "wall-tent" || l === "pack-in-base" || l === "truck-camp");
  const mountain = terrains.some((t) => t === "steep-alpine" || t === "foothills" || t === "timber");
  const openCountry = terrains.some(
    (t) => t === "plains" || t === "prairie" || t === "desert" || t === "foothills" || t === "steep-alpine",
  );

  const allowed: Travel[] = ["short-walks", "long-hikes"];
  if (mountain) allowed.push("repeated-climbs");
  if (tactics.includes("glassing") || openCountry) allowed.push("all-day-glassing");
  if (hasBackpack && duration !== "day") allowed.push("packing-camp-daily");
  if (hasFixedCamp) allowed.push("fixed-camp");

  return TRAVELS.filter((t) => allowed.includes(t));
}

/** Drop camp / length / travel / stand / land picks that the earlier answers made illegal. */
export function pruneAccessFields(
  d: HuntDraft,
): Pick<HuntDraft, "lodgings" | "duration" | "travels" | "stands" | "lands" | "blinds"> {
  const lodgings = d.lodgings.filter((l) => lodgingsFor(d.regionId, d.accesses).includes(l));
  const allowedDur = durationsFor(lodgings);
  let duration = d.duration && allowedDur.includes(d.duration) ? d.duration : null;
  if (!duration && allowedDur.length === 1) duration = allowedDur[0];
  const allowedTravel = travelsFor({
    lodgings,
    duration,
    terrains: d.terrains,
    tactics: d.tactics,
  });
  let travels = d.travels.filter((t) => allowedTravel.includes(t));
  if (travels.length === 0 && allowedTravel.length === 1) travels = [...allowedTravel];
  const allowedLands = landsFor(d.regionId, d.accesses);
  let lands = d.lands.filter((l) => allowedLands.includes(l));
  if (lands.length === 0 && allowedLands.length === 1) lands = [...allowedLands];
  const allowedBlinds = blindsFor(d.tactics, d.terrains, lands, d.regionId);
  let blinds = d.blinds.filter((b) => allowedBlinds.includes(b));
  if (blinds.length === 0 && allowedBlinds.length === 1) blinds = [...allowedBlinds];
  const allowedStands = standsFor(d.tactics, d.terrains, lands, blinds);
  let stands = d.stands.filter((s) => allowedStands.includes(s));
  if (stands.length === 0 && allowedStands.length === 1) stands = [...allowedStands];
  return {
    lodgings,
    duration,
    travels,
    stands,
    lands,
    blinds,
  };
}

export const slotLabel: Record<string, string> = {
  "base-top": "Base layer top",
  "base-bottom": "Base layer bottom",
  "midlayer-active": "Active insulation",
  "insulation-static": "Static insulation",
  "shell-wind": "Wind shell",
  "shell-rain": "Rain shell",
  "pant-active": "Hunting pants",
  "pant-insulated": "Insulated pants / bib",
  "glove-active": "Active gloves",
  "glove-static": "Static gloves",
  headwear: "Headwear",
  socks: "Socks",
  boots: "Boots",
  pack: "Pack",
  bino: "Binoculars",
  "bino-harness": "Bino harness",
  rangefinder: "Rangefinder",
  "spotting-scope": "Spotting scope",
  tripod: "Tripod",
  nav: "Maps / GPS",
  comm: "Communicator",
  headlamp: "Headlamp",
  harness: "Fall-arrest harness",
  saddle: "Saddle",
  "blaze-vest": "Blaze orange vest",
  "blaze-hat": "Blaze orange cap",
  "first-aid": "First aid",
  knife: "Knife / kill kit",
  saw: "Bone saw",
  "game-bags": "Game bags",
  calls: "Calls",
  release: "Release",
  weapon: "Weapon",
  ammo: "Ammunition",
  broadhead: "Broadheads",
  scope: "Scope",
  seat: "Seat / stand",
  blind: "Ground blind",
  "hand-muff": "Hand muff",
  water: "Water storage",
  filter: "Water treatment",
  stove: "Stove",
  snacks: "Field snacks",
  food: "Trail meals",
  shelter: "Shelter",
  "sleep-bag": "Sleep system",
  "sleep-pad": "Sleep pad",
  "bear-spray": "Bear spray",
  "food-storage": "Bear food storage",
  poles: "Trekking poles",
  sticks: "Climbing sticks",
  lifeline: "Lifeline",
  "rain-pant": "Rain pants",
};

export function weaponSlotLabel(weapon: Weapon): string {
  if (weapon === "archery") return "Bow";
  if (weapon === "muzzleloader") return "Muzzleloader";
  return "Rifle";
}

export function ammoSlotLabel(weapon: Weapon): string {
  if (weapon === "archery") return "Arrows";
  if (weapon === "muzzleloader") return "Muzzleloader loads";
  return "Ammunition";
}

export const slotCategory: Record<string, string> = {
  "base-top": "Clothing",
  "base-bottom": "Clothing",
  "midlayer-active": "Clothing",
  "insulation-static": "Clothing",
  "shell-wind": "Clothing",
  "shell-rain": "Clothing",
  "pant-active": "Clothing",
  "pant-insulated": "Clothing",
  "glove-active": "Clothing",
  "glove-static": "Clothing",
  headwear: "Clothing",
  socks: "Clothing",
  boots: "Footwear",
  pack: "Carry",
  bino: "Optics",
  "bino-harness": "Optics",
  rangefinder: "Optics",
  "spotting-scope": "Optics",
  tripod: "Optics",
  nav: "Navigation",
  comm: "Navigation",
  headlamp: "Navigation",
  harness: "Safety",
  saddle: "Stand extras",
  "blaze-vest": "Safety",
  "blaze-hat": "Safety",
  "first-aid": "Safety",
  knife: "Kill kit",
  saw: "Kill kit",
  "game-bags": "Kill kit",
  calls: "Hunting tools",
  release: "Weapon",
  weapon: "Weapon",
  ammo: "Weapon",
  broadhead: "Weapon",
  scope: "Weapon",
  seat: "Stand extras",
  blind: "Stand extras",
  "hand-muff": "Stand extras",
  water: "Camp",
  filter: "Camp",
  stove: "Camp",
  snacks: "Food",
  food: "Food",
  shelter: "Camp",
  "sleep-bag": "Camp",
  "sleep-pad": "Camp",
  "bear-spray": "Safety",
  "food-storage": "Camp",
  poles: "Carry",
  sticks: "Stand extras",
  lifeline: "Safety",
  "rain-pant": "Clothing",
};
