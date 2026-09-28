export const SPECIES = [
  "elk",
  "mule-deer",
  "whitetail",
  "pronghorn",
  "moose",
  "black-bear",
  "brown-bear",
  "caribou",
  "sitka-blacktail",
  "mountain-goat",
  "bighorn",
  "bison",
] as const;

export type Species = (typeof SPECIES)[number];

export const STATES = ["CO", "WY", "MT", "ID", "UT", "NM", "AK", "NE", "IA", "KS", "SD"] as const;
export type HuntState = (typeof STATES)[number];

export const WEAPONS = ["archery", "firearm", "muzzleloader"] as const;
export type Weapon = (typeof WEAPONS)[number];

export const EXPERIENCE = ["beginner", "intermediate", "experienced"] as const;
export type Experience = (typeof EXPERIENCE)[number];

export const TACTICS = [
  "spot-and-stalk",
  "still-hunting",
  "glassing",
  "calling",
  "ambush",
  "tracking",
  "safari",
] as const;
export type Tactic = (typeof TACTICS)[number];

export const LODGINGS = [
  "home",
  "hotel",
  "truck-camp",
  "wall-tent",
  "pack-in-base",
  "backpack",
] as const;
export type Lodging = (typeof LODGINGS)[number];

export const DURATIONS = ["day", "overnight", "2-4", "5-7", "expedition"] as const;
export type Duration = (typeof DURATIONS)[number];

export const TRAVELS = [
  "short-walks",
  "long-hikes",
  "repeated-climbs",
  "all-day-glassing",
  "packing-camp-daily",
  "fixed-camp",
] as const;
export type Travel = (typeof TRAVELS)[number];

export const TERRAINS = [
  "plains",
  "foothills",
  "steep-alpine",
  "timber",
  "desert",
  "prairie",
  "river-bottom",
] as const;
export type Terrain = (typeof TERRAINS)[number];

export const ACCESSES = [
  "truck",
  "trailhead",
  "atv",
  "pack-stock",
  "float-plane",
  "bush-plane",
  "boat",
] as const;
export type Access = (typeof ACCESSES)[number];

export const LANDS = ["public", "private"] as const;
export type Land = (typeof LANDS)[number];

export const BLINDS = ["hang-on", "ladder", "climber", "saddle", "box", "hub", "natural"] as const;
export type BlindType = (typeof BLINDS)[number];

export const STANDS = ["fixed", "mobile", "saddle", "ground"] as const;
export type StandSetup = (typeof STANDS)[number];

export const TIERS = ["value", "mid", "premium"] as const;
export type Tier = (typeof TIERS)[number];

export const ACTIVITIES = ["static", "active", "mixed", "any"] as const;
export type Activity = (typeof ACTIVITIES)[number];

export const REGIONS_THEATER = ["west", "midwest", "alaska"] as const;
export type Theater = (typeof REGIONS_THEATER)[number];

export type WeightBias = "none" | "carry" | "payload";

export type HuntDraft = {
  species: Species | null;
  state: HuntState | null;
  regionId: string | null;
  weapon: Weapon | null;
  month: number | null;
  experience: Experience | null;
  tactics: Tactic[];
  lodgings: Lodging[];
  duration: Duration | null;
  travels: Travel[];
  terrains: Terrain[];
  accesses: Access[];
  lands: Land[];
  blinds: BlindType[];
  stands: StandSetup[];
  tiers: Tier[];
};

export const emptyDraft = (): HuntDraft => ({
  species: null,
  state: null,
  regionId: null,
  weapon: null,
  month: null,
  experience: null,
  tactics: [],
  lodgings: [],
  duration: null,
  travels: [],
  terrains: [],
  accesses: [],
  lands: [],
  blinds: [],
  stands: [],
  tiers: [],
});

export type HuntInput = {
  [K in keyof HuntDraft]: NonNullable<HuntDraft[K]>;
};

function asStringList(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  if (typeof v === "string") return [v];
  return [];
}

function keep<T extends string>(raw: unknown, allowed: readonly T[]): T[] {
  const out: T[] = [];
  for (const item of asStringList(raw)) {
    if ((allowed as readonly string[]).includes(item) && !out.includes(item as T)) out.push(item as T);
  }
  return out;
}

/** Accepts current array fields or older single-value plans saved in localStorage. */
export function migrateDraft(raw: unknown): HuntDraft {
  const d = emptyDraft();
  if (!raw || typeof raw !== "object") return d;
  const o = raw as Record<string, unknown>;

  if (typeof o.species === "string" && (SPECIES as readonly string[]).includes(o.species)) d.species = o.species as Species;
  if (typeof o.state === "string" && (STATES as readonly string[]).includes(o.state)) d.state = o.state as HuntState;
  if (typeof o.regionId === "string") d.regionId = o.regionId;
  if (typeof o.weapon === "string" && (WEAPONS as readonly string[]).includes(o.weapon)) d.weapon = o.weapon as Weapon;
  if (typeof o.month === "number") d.month = o.month;
  if (typeof o.experience === "string" && (EXPERIENCE as readonly string[]).includes(o.experience)) {
    d.experience = o.experience as Experience;
  }
  if (typeof o.duration === "string" && (DURATIONS as readonly string[]).includes(o.duration)) d.duration = o.duration as Duration;
  d.tiers = keep(o.tiers, TIERS);

  const tacticRaw = o.tactics ?? o.tactic;
  const tactics = keep(tacticRaw, TACTICS);
  d.tactics = tactics.length
    ? tactics
    : asStringList(tacticRaw).includes("mixed")
      ? ["spot-and-stalk", "glassing", "calling"]
      : [];
  d.lodgings = keep(o.lodgings ?? o.lodging, LODGINGS);
  d.travels = keep(o.travels ?? o.travel, TRAVELS);
  d.terrains = keep(o.terrains ?? o.terrain, TERRAINS);
  const accessMapped = asStringList(o.accesses ?? o.access).map((a) => {
    if (a === "road-public") return "truck";
    if (a === "remote-wilderness") return "trailhead";
    if (a === "private") return "truck";
    return a;
  });
  const hadPrivateAccess = asStringList(o.accesses ?? o.access).includes("private");
  d.accesses = keep(accessMapped, ACCESSES);
  d.lands = keep(o.lands ?? o.land, LANDS);
  if (hadPrivateAccess && !d.lands.includes("private")) d.lands = [...d.lands, "private"];
  if (!d.lands.length && d.accesses.length) d.lands = ["public"];
  d.blinds = keep(o.blinds ?? o.blind, BLINDS);
  d.stands = keep(o.stands ?? o.stand, STANDS);
  if (!d.blinds.length && d.tactics.includes("ambush")) {
    if (d.stands.includes("saddle")) d.blinds.push("saddle");
    if (d.stands.includes("ground")) d.blinds.push("hub");
    if (d.stands.includes("fixed") || d.stands.includes("mobile")) d.blinds.push("hang-on");
    if (!d.blinds.length) {
      const trees = d.terrains.some((t) => t === "timber" || t === "river-bottom" || t === "foothills");
      d.blinds = trees ? ["hang-on"] : ["hub"];
    }
  }
  if (!d.stands.length && d.tactics.includes("ambush")) {
    const trees = d.terrains.some((t) => t === "timber" || t === "river-bottom" || t === "foothills");
    const treeBlind = d.blinds.some((b) => b === "hang-on" || b === "ladder" || b === "climber");
    if (treeBlind && trees) {
      if (d.lands.includes("private")) d.stands = ["fixed"];
      else d.stands = ["mobile"];
    }
  }
  return d;
}

export function isHuntInput(v: unknown): v is HuntInput {
  const d = migrateDraft(v);
  return Boolean(
    d.species &&
      d.state &&
      d.regionId &&
      d.weapon &&
      d.month &&
      d.experience &&
      d.tactics.length &&
      d.lodgings.length &&
      d.duration &&
      d.travels.length &&
      d.terrains.length &&
      d.accesses.length &&
      d.lands.length &&
      (!d.tactics.includes("ambush") || d.blinds.length) &&
      d.tiers.length,
  );
}

export function asHuntInput(v: unknown): HuntInput | null {
  if (!isHuntInput(v)) return null;
  return migrateDraft(v) as HuntInput;
}

export type SlotId =
  | "base-top"
  | "base-bottom"
  | "midlayer-active"
  | "insulation-static"
  | "shell-wind"
  | "shell-rain"
  | "pant-active"
  | "pant-insulated"
  | "glove-active"
  | "glove-static"
  | "headwear"
  | "socks"
  | "boots"
  | "pack"
  | "bino"
  | "bino-harness"
  | "rangefinder"
  | "spotting-scope"
  | "tripod"
  | "nav"
  | "comm"
  | "headlamp"
  | "harness"
  | "blaze-vest"
  | "blaze-hat"
  | "first-aid"
  | "knife"
  | "saw"
  | "game-bags"
  | "calls"
  | "release"
  | "weapon"
  | "ammo"
  | "broadhead"
  | "scope"
  | "seat"
  | "saddle"
  | "blind"
  | "hand-muff"
  | "water"
  | "filter"
  | "stove"
  | "snacks"
  | "food"
  | "shelter"
  | "sleep-bag"
  | "sleep-pad"
  | "bear-spray"
  | "food-storage"
  | "poles"
  | "sticks"
  | "lifeline"
  | "rain-pant";

export type Product = {
  id: string;
  name: string;
  brand: string;
  slot: SlotId;
  price: number;
  tier: Tier;
  amazonQuery: string;
  reviewQuery: string;
  activity: Activity;
  quiet: boolean;
  warmth: 1 | 2 | 3 | 4 | 5;
  theaters: Array<Theater | "any">;
  weapons: Array<Weapon | "any">;
  builtFor: string;
  weightOz?: number;
  durability?: 1 | 2 | 3 | 4 | 5;
  /** Chamber. Couples a weapon to matching ammo. */
  load?: "308" | "65cm" | "3006" | "300wm" | "7prc" | "338" | "350leg" | "arrow" | "ml50";
  /** Archery release style. */
  style?: "index" | "thumb";
};

export type Region = {
  id: string;
  state: HuntState;
  name: string;
  theater: Theater;
  lat: number;
  lon: number;
  elevFt: number;
  blurb: string;
  terrains: Terrain[];
};

export type SeasonRule = {
  state: HuntState;
  species: Species;
  weapon: Weapon;
  months: number[];
  window: string;
  bag: string;
  licenses: string[];
  notes?: string;
};

export type BlazeRule = {
  required: boolean;
  summary: string;
  detail: string;
};

export type WeatherNormals = {
  source: "nasa-power" | "fallback";
  month: number;
  highF: number;
  lowF: number;
  windMph: number;
  precipIn: number;
  rh: number;
  feelHighF: number;
  feelLowF: number;
  packForF: number;
  hazards: string[];
};

export type ExpertClaim = {
  id: string;
  person: string;
  credential: string;
  url: string;
  claim: string;
  species?: Species[];
  tactics?: Tactic[];
  terrains?: Terrain[];
  lodgings?: Lodging[];
  theaters?: Theater[];
  weapons?: Weapon[];
  states?: HuntState[];
};

export type SkippedItem = {
  id: SlotId;
  label: string;
  reason: string;
};

export type KitRow = {
  slot: SlotId;
  label: string;
  why: string;
  options: Product[];
  selectedId: string;
  tradeoffs: Array<{ axis: string; productId: string; reason: string }>;
  /** Hunt-specific for/against copy. Used on the weapon row, empty elsewhere. */
  verdicts: Array<{
    productId: string;
    angle: string;
    pros: string[];
    cons: string[];
  }>;
};

export type HuntPlan = {
  id: string;
  createdAt: string;
  input: HuntInput;
  title: string;
  summary: string;
  realFeel: string;
  weather: WeatherNormals;
  weatherGear: string[];
  blaze: BlazeRule;
  season: SeasonRule;
  agency: { name: string; url: string; phoneNote: string };
  emergency: { items: string[] };
  rutNote: string | null;
  primers: Array<{ title: string; body: string }>;
  mistakes: string[];
  openQuestions: string[];
  experts: ExpertClaim[];
  rows: KitRow[];
  skipped: SkippedItem[];
  activity: Activity;
  insulation: "low" | "moderate" | "high";
  weightBias: WeightBias;
  fuel: {
    kcalPerHour: number;
    hoursPerDay: number;
    kcalPerDay: number;
    days: number;
    snackKcal: number;
    mealCount: number;
    note: string;
  };
  disclaimer: string;
};
