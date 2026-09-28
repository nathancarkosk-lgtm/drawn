import type { Derived } from "./profile";
import type { HuntInput } from "./types";

export type FuelPlan = {
  kcalPerHour: number;
  hoursPerDay: number;
  kcalPerDay: number;
  days: number;
  snackKcal: number;
  mealCount: number;
  note: string;
};

function daysFor(duration: HuntInput["duration"]) {
  if (duration === "day") return 1;
  if (duration === "overnight") return 2;
  if (duration === "2-4") return 3;
  if (duration === "5-7") return 6;
  return 8;
}

/** Rough field burn — not a lab number. Sit, mixed, and mountain days are different hunts. */
export function fuelFor(input: HuntInput, d: Derived, packForF = 40): FuelPlan {
  let kcalPerHour = d.activity === "static" ? 190 : d.activity === "mixed" ? 300 : 420;
  if (d.insulation === "high" || packForF <= 20) kcalPerHour += 40;
  if (input.travels.includes("repeated-climbs")) kcalPerHour += 70;
  if (input.lodgings.includes("backpack")) kcalPerHour += 50;
  if (input.travels.includes("packing-camp-daily")) kcalPerHour += 40;
  kcalPerHour = Math.min(560, Math.round(kcalPerHour / 10) * 10);

  let hours = 7;
  if (input.travels.includes("short-walks") && d.activity === "static") hours = 6;
  if (input.travels.includes("all-day-glassing")) hours = 9;
  if (input.travels.includes("long-hikes") || input.travels.includes("repeated-climbs")) hours = 9;
  if (input.lodgings.includes("backpack")) hours = 10;

  const days = daysFor(input.duration);
  const camp = input.duration === "day" ? 400 : 900;
  const kcalPerDay = Math.round((kcalPerHour * hours + camp) / 50) * 50;
  const snackKcal = Math.round(kcalPerHour * hours * 0.45);
  const mealCount = input.duration === "day" ? 0 : days * 2;

  const note =
    input.duration === "day"
      ? `About ${kcalPerHour} kcal per hour in the field, ~${hours} hours. Pack roughly ${kcalPerDay.toLocaleString()} kcal of snacks — bars, mix, jerky — not one granola bar.`
      : `About ${kcalPerHour} kcal per hour while hunting. Plan ~${kcalPerDay.toLocaleString()} kcal per day for ${days} days. That is snacks plus ${mealCount} freeze-dried meals, not one pouch.`;

  return { kcalPerHour, hoursPerDay: hours, kcalPerDay, days, snackKcal, mealCount, note };
}

export function needsSaw(input: HuntInput): boolean {
  if (["elk", "moose", "bison", "brown-bear", "caribou"].includes(input.species)) return true;
  const remote =
    input.lodgings.some((l) => l === "backpack" || l === "pack-in-base") ||
    input.accesses.some((a) => a === "float-plane" || a === "bush-plane" || a === "pack-stock");
  if (remote && input.species !== "pronghorn") return true;
  return false;
}
