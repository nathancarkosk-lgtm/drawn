import type { Derived } from "./profile";
import type { HuntInput, KitRow, Product } from "./types";
import type { WeaponVerdict } from "./weapon";
import { weaponWhy } from "./weapon";

function sitHunt(d: Derived) {
  return d.activity === "static" || d.quietHard;
}

export function releaseVerdict(p: Product, d: Derived): WeaponVerdict {
  const sit = sitHunt(d);
  if (p.style === "thumb") {
    return {
      productId: p.id,
      angle: "Thumb",
      pros: [
        "The shot surprises you. A lot of hunters shoot a hunting bow better this way.",
        sit
          ? "Works in a stand if you have practiced with the glove you will hunt."
          : "Clean on a stalk. Less punching when you are breathing hard.",
      ],
      cons: [
        "A learning curve if you have only shot a trigger.",
        "Cold thumbs are slower. Practice with the glove you will actually wear.",
      ],
    };
  }
  return {
    productId: p.id,
    angle: "Trigger",
    pros: [
      "Index trigger. Most hunters already know this motion.",
      sit
        ? "Easy in a stand with a muff. The finger finds it."
        : "Simple on a stalk. Less to think about when the animal steps.",
    ],
    cons: [
      "Punching the trigger is the usual miss. A thumb shot is the other school.",
      "Not the only right answer — switch if you shoot a thumb better.",
    ],
  };
}

export function attachReleaseVerdicts(row: KitRow, _input: HuntInput, d: Derived): KitRow {
  const verdicts = row.options.map((o) => releaseVerdict(o, d));
  const selected = verdicts.find((v) => v.productId === row.selectedId) ?? verdicts[0];
  return {
    ...row,
    verdicts,
    why: selected ? weaponWhy(selected) : row.why,
    tradeoffs: [],
  };
}

export function releaseBoardCopy(): { kicker: string; lead: string; title: string } {
  return {
    kicker: "Weapon · Release",
    title: "Trigger and thumb.",
    lead: "Both belong in a complete archery kit. Shoot the one you have practiced. Carry a spare of that style.",
  };
}
