import { speciesLabel } from "./options";
import type { Derived } from "./profile";
import type { HuntInput, KitRow, Product, Species } from "./types";

export type WeaponVerdict = {
  productId: string;
  angle: string;
  pros: string[];
  cons: string[];
};

export const loadLabel: Record<NonNullable<Product["load"]>, string> = {
  "308": ".308 Win",
  "65cm": "6.5 Creedmoor",
  "3006": ".30-06",
  "300wm": ".300 Win Mag",
  "7prc": "7mm PRC",
  "338": ".338 Win Mag",
  "350leg": ".350 Legend",
  arrow: "arrows",
  ml50: ".50 cal",
};

const DEER: Species[] = ["whitetail", "mule-deer", "pronghorn", "sitka-blacktail"];
const BIG: Species[] = ["elk", "moose", "caribou", "mountain-goat", "bighorn"];
const HEAVY: Species[] = ["brown-bear", "bison"];

function animal(species: Species) {
  return speciesLabel[species].toLowerCase();
}

function sitHunt(d: Derived) {
  return d.activity === "static" || d.quietHard;
}

function openCountry(input: HuntInput) {
  return input.terrains.some((t) => t === "prairie" || t === "plains" || t === "desert" || t === "foothills");
}

function timberCountry(input: HuntInput) {
  return input.terrains.some((t) => t === "timber" || t === "river-bottom");
}

function mountainHunt(input: HuntInput, d: Derived) {
  return (
    input.terrains.includes("steep-alpine") ||
    d.theater === "alaska" ||
    d.weightBias === "carry" ||
    d.weightBias === "payload"
  );
}

function longShots(input: HuntInput) {
  return input.tactics.includes("glassing") || input.tactics.includes("spot-and-stalk") || openCountry(input);
}

function leverGun(p: Product) {
  return /henry|lever|side gate/i.test(`${p.name} ${p.brand}`);
}

export function roleKey(p: Product): string {
  if (p.slot !== "weapon") return p.id;
  if (leverGun(p)) return "lever";
  if (p.load === "arrow") {
    if (/infinite edge|diamond/i.test(p.name)) return "first-bow";
    if (/mathews|lift/i.test(p.name)) return "long-ata";
    if (/hoyt|alpha/i.test(p.name)) return "short-ata";
    return "mid-bow";
  }
  if (p.load === "ml50") {
    if (/nitrofire|firestick/i.test(p.name)) return "firestick";
    if (/pursuit/i.test(p.name)) return "budget-ml";
    return "bergara-ml";
  }
  if ((p.weightOz ?? 99) <= 90 && p.price >= 1800) return `carbon-${p.load ?? "x"}`;
  return p.load ?? p.id;
}

/** Several distinct rifles/bows, not one-per-price-tier clones of the same idea. */
export function pickDiverseWeapons(ranked: Product[], limit = 4): Product[] {
  const out: Product[] = [];
  const roles = new Set<string>();
  const take = (p: Product) => {
    if (out.some((o) => o.id === p.id)) return;
    out.push(p);
    roles.add(roleKey(p));
  };

  if (ranked[0]) take(ranked[0]);

  const cheapestOfRole = new Map<string, Product>();
  for (const p of ranked) {
    const k = roleKey(p);
    const prev = cheapestOfRole.get(k);
    if (!prev || p.price < prev.price) cheapestOfRole.set(k, p);
  }
  for (const p of ranked) {
    if (out.length >= limit) break;
    const k = roleKey(p);
    if (roles.has(k)) continue;
    const cheap = cheapestOfRole.get(k);
    if (cheap) take(cheap);
  }

  for (const p of ranked) {
    if (out.length >= Math.min(3, ranked.length, limit)) break;
    take(p);
  }
  return out.slice(0, limit);
}

function loadAngle(p: Product, input: HuntInput, d: Derived): string {
  const load = p.load;
  const sit = sitHunt(d);
  const mountain = mountainHunt(input, d);
  const a = animal(input.species);

  if (leverGun(p)) return timberCountry(input) ? "The timber lever" : "The handy lever";
  if (load === "65cm") {
    if (DEER.includes(input.species)) {
      if (longShots(input)) return "The easy deer rifle";
      return "The mild deer rifle";
    }
    return longShots(input) ? "The easy 6.5" : "The mild 6.5";
  }
  if (load === "308") {
    if (sit) return p.tier === "value" ? "The truck .308" : "The stand .308";
    if (mountain) return "The walking .308";
    return p.tier === "value" ? "The working .308" : "The refined .308";
  }
  if (load === "3006") {
    if (BIG.includes(input.species)) return "One rifle for this hunt";
    return "The extra-gun .30-06";
  }
  if (load === "300wm") {
    if (p.price < 800) return "A magnum on a working budget";
    if (mountain) return "The mountain magnum";
    return `The ${a} magnum`;
  }
  if (load === "7prc") return "The light 7";
  if (load === "338") return `The ${a} magnum`;
  if (load === "350leg") {
    if (leverGun(p)) return "Straight-wall lever";
    if (p.tier === "value") return "Straight-wall legal";
    return "The AccuTrigger .350";
  }
  if (load === "arrow") {
    if (/infinite edge|diamond/i.test(p.name)) return "The first hunting bow";
    if (/mathews|lift/i.test(p.name)) return sit ? "The stand bow" : "The long-riser bow";
    if (/hoyt|alpha/i.test(p.name)) return "The short hunting bow";
    return "Dealer-set carbon";
  }
  if (load === "ml50") {
    if (/nitrofire/i.test(p.name)) return "The wet-weather in-line";
    if (/pursuit/i.test(p.name)) return "The budget in-line";
    return "The Bergara-barrel in-line";
  }
  return p.builtFor.split(".")[0] ?? p.name;
}

function loadProsCons(p: Product, input: HuntInput, d: Derived): { pros: string[]; cons: string[] } {
  const a = animal(input.species);
  const sit = sitHunt(d);
  const mountain = mountainHunt(input, d);
  const open = longShots(input);
  const beginner = input.experience === "beginner";
  const load = p.load;
  const lbs = typeof p.weightOz === "number" ? (p.weightOz / 16).toFixed(1) : null;
  const pros: string[] = [];
  const cons: string[] = [];

  if (load === "65cm") {
    pros.push("Mild recoil, so you actually practice. Ammo is cheap and everywhere.");
    if (open) pros.push(`Flat enough for a longer shot on ${a} without a magnum.`);
    else pros.push(`Plenty of ${a} for a sit or a timber shot. Recoil is not the story.`);
    if (BIG.includes(input.species) || HEAVY.includes(input.species)) {
      cons.push(`Light for ${a} at a bad angle. A heavier bullet is the more honest tool.`);
    } else {
      cons.push(`Some hunters want a heavier bullet on a quartering ${a}. That is taste, not a requirement.`);
    }
    if (mountain) cons.push(`${lbs ?? "This"} lb before glass — not the lightest mountain rifle.`);
    else cons.push("Mild is the point. Some hunters just want more rifle in the hands.");
  } else if (load === "308") {
    pros.push("Ammo is on every shelf. Recoil is civil. Enough gun for this animal at real hunting range.");
    if (sit) pros.push("A .308 does not care that the shot is 40 yards from a stand.");
    else if (mountain) pros.push("A known quantity you can shoot well after a climb.");
    else pros.push("The boring American hunting cartridge. That is a feature.");
    if (open) cons.push("Not as flat as a 6.5 on a long prairie shot. Inside 250 yards that rarely matters.");
    else cons.push("Nothing exotic. If you want a specialist rifle, this is not it.");
    if (BIG.includes(input.species)) cons.push(`Adequate for ${a} up close. Thin on a steep quartering shot at range.`);
    else if (beginner) cons.push("Still a rifle — dry-fire and a range trip matter more than the stamp on the barrel.");
  } else if (load === "3006") {
    pros.push(`One rifle that does ${a} without looking undergunned.`);
    if (!BIG.includes(input.species) && !HEAVY.includes(input.species))
      pros.push("Ammo everywhere. A cartridge you can find in any town.");
    else pros.push("Soft points in the 180s are the default American big-game load for a reason.");
    if (sit && DEER.includes(input.species)) cons.push(`More rifle than a sit ${a} needs. Recoil is the tax.`);
    else cons.push("More recoil than a .308. You will shoot it less if you do not pad the stock.");
    if (mountain) cons.push(`${lbs ?? "This"} lb class — not the carbon mountain toy.`);
    else cons.push("Heavier than a 6.5. From a truck hunt that does not matter.");
  } else if (load === "300wm") {
    pros.push(`The cartridge people actually take to ${a} country.`);
    if (p.price < 800) pros.push("Magnum performance without a custom-rifle bill.");
    else if (mountain) pros.push(`${lbs ?? "About 5.5"} lb class. The ounces stay in the hunt.`);
    else pros.push("Reach and bullet weight for a longer or uglier shot.");
    cons.push("Recoil is real. A rifle you flinch is worse than a milder gun you shoot.");
    if (DEER.includes(input.species)) cons.push(`Overkill on ${a}. Ammo costs more, and you will practice less.`);
    else cons.push("Ammo costs more than .30-06. Buy the box you will zero, then another to hunt.");
  } else if (load === "7prc") {
    pros.push(`Modern 7mm for ${a} in open or steep country. Flat, efficient, light rifle.`);
    if (mountain) pros.push(`${lbs ?? "About 5.3"} lb before glass. That is the point of this rifle.`);
    else pros.push("Soft enough recoil to stay in the scope.");
    cons.push("Ammo is not at every gas station. Buy it before you leave.");
    cons.push(`A $2,400 answer. A Tikka in .300 Win Mag does the same ${a} for less money.`);
  } else if (load === "338") {
    pros.push(`The cartridge this animal deserves. Penetration on a quartering ${a}.`);
    pros.push("A short, serious mountain magnum — not a bench gun.");
    cons.push("Recoil will invent a flinch if you do not practice.");
    if (DEER.includes(input.species)) cons.push("The wrong rifle for this tag. This is a bear and bison tool.");
    else cons.push("Ammo is expensive and not on every shelf. Buy it before you fly.");
  } else if (load === "350leg") {
    pros.push("Straight-wall legal for Iowa firearm deer. Hits like a deer cartridge inside 150 yards.");
    if (leverGun(p)) pros.push("A lever is fast in a stand and short in the brush.");
    else pros.push("A bolt .350 is easy to mount a scope on and cheap to shoot.");
    cons.push("This is not a 300-yard prairie cartridge. Pick a lane, not a ridge.");
    if (leverGun(p)) cons.push("A lever is slower to mount glass on and louder to cycle than a bolt.");
    else cons.push("A bolt in a straight-wall world is the accurate choice, not the handy one.");
  } else if (load === "arrow") {
    if (/infinite edge|diamond/i.test(p.name)) {
      pros.push(`13–70 lb draw. One bow that fits a new hunter and still kills ${a}.`);
      pros.push("Ready-to-hunt package. You are not buying a baren bow and a second shopping list.");
      cons.push("Heavier and slower than a flagship. You will outgrow it if you stay in the sport.");
      cons.push(`Not the bow you take on a once-in-a-decade ${a} hunt. It is a first bow.`);
    } else if (/bowtech|carbon one/i.test(p.name)) {
      pros.push("DeadLock cams. A shop can time it without a fight. Carbon, ready to hunt.");
      pros.push("Mid-price hunting bow that is not a toy and not a status piece.");
      cons.push("Still a dealer-set bow — get it drawn, cycled, and flown before opening day.");
      if (sit) cons.push("Not as stable at full draw as a 33-inch axle-to-axle on a long sit.");
      else cons.push("Not as compact in the brush as a 30-inch hunting bow.");
    } else if (/mathews|lift/i.test(p.name)) {
      pros.push("33-inch axle-to-axle. Holds at full draw. That matters when the animal stalls.");
      if (sit) pros.push("A stand bow. Long enough to aim, not a brush gun.");
      else pros.push("Forgiving when you are breathing hard.");
      cons.push("Longer riser is clumsier in a saddle, a ground blind, or thick alder.");
      cons.push("Flagship money. A $1,200 bow with a good tune kills the same animal.");
    } else if (/hoyt|alpha/i.test(p.name)) {
      pros.push("30-inch axle-to-axle. Carries in timber, a saddle, and steep country.");
      if (mountain) pros.push("Short enough that the pack and the bow are not a fight.");
      else pros.push("Handy when the shot is through a hole in the cover.");
      cons.push("Shorter bows are less stable at longer yardage. Stay inside a distance you have practiced.");
      cons.push("Flagship money for a compact geometry — not a requirement.");
    }
  } else if (load === "ml50") {
    if (/nitrofire/i.test(p.name)) {
      pros.push("Federal Firestick. Faster to load, easier to keep dry, simpler at the bench.");
      if (input.month >= 10 || input.month <= 2) pros.push("Wet late-season sits are why this exists.");
      else pros.push("Less of the traditional muzzleloader fuss.");
      cons.push("Proprietary Firesticks. You are buying Federal's system, not any powder you find.");
      cons.push("A $750 muzzleloader. The Accura shoots just as well if you keep it clean.");
    } else if (/pursuit/i.test(p.name)) {
      pros.push("A .50 in-line that costs less than a mid-tier scope. Fine if you clean it.");
      pros.push("No proprietary load. Powder, primer, and bullets you can find.");
      cons.push("Keep it clean or it will not fire. That is the whole review.");
      cons.push("Heavier trigger and less barrel than the Accura. Practice until it is boring.");
    } else {
      pros.push("Bergara barrel on a hunting in-line. The mid-pack muzzleloader people actually shoot well.");
      pros.push("Nitride metal. Less rust after a wet sit.");
      cons.push(`${lbs ?? "7"} lb class — not a mountain wand.`);
      cons.push("Still a muzzleloader. One shot, then a reload, in weather.");
    }
  }

  if (pros.length < 2) pros.push(p.builtFor);
  if (cons.length < 2) {
    if (p.tier === "premium") cons.push("You are paying for fit and finish. The animal does not care.");
    else if (p.tier === "value") cons.push("A working tool. Expect to spend the difference on a better trigger job or glass.");
    else cons.push("A middle path. Not the cheapest, not the lightest, not a statement.");
  }

  return { pros: pros.slice(0, 2), cons: cons.slice(0, 2) };
}

export function verdictFor(p: Product, input: HuntInput, d: Derived): WeaponVerdict {
  const { pros, cons } = loadProsCons(p, input, d);
  return {
    productId: p.id,
    angle: loadAngle(p, input, d),
    pros,
    cons,
  };
}

export function weaponWhy(verdict: WeaponVerdict): string {
  const first = verdict.pros[0] ?? "";
  return `${verdict.angle}. ${first}`.trim();
}

export function weaponBoardCopy(input: HuntInput, lean: WeaponVerdict | undefined): { kicker: string; lead: string } {
  const kind = input.weapon === "archery" ? "bow" : input.weapon === "muzzleloader" ? "muzzleloader" : "rifle";
  const a = animal(input.species);
  return {
    kicker: `Weapon · ${kind === "rifle" ? "Rifle" : kind === "bow" ? "Bow" : "Muzzleloader"}`,
    lead: lean
      ? `There is no single right ${kind} for ${a}. We lean ${lean.angle.toLowerCase()} — switch if you shoot something else better.`
      : `There is no single right ${kind} for ${a}. Pick the one you will actually shoot.`,
  };
}

export function attachWeaponVerdicts(row: KitRow, input: HuntInput, d: Derived): KitRow {
  const verdicts = row.options.map((o) => verdictFor(o, input, d));
  const selected = verdicts.find((v) => v.productId === row.selectedId) ?? verdicts[0];
  return {
    ...row,
    verdicts,
    why: selected ? weaponWhy(selected) : row.why,
  };
}
