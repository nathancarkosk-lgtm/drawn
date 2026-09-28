import { accessLabel, joinLabeled, kitOrigin, lodgingLabelFor, monthLabel, regionById, slotCategory, weaponLabel } from "@/lib/hunt/options";
import { isBearCountry, sleepsInTheField } from "@/lib/hunt/profile";
import type { HuntPlan, KitRow, Product } from "@/lib/hunt/types";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

function selectedOf(row: KitRow): Product | undefined {
  return row.options.find((o) => o.id === row.selectedId);
}

function packedKey(planId: string) {
  return `drawn.packed.${planId}`;
}

function extrasFor(plan: HuntPlan): { id: string; label: string; hint: string }[] {
  const extras = [
    { id: "extra-license", label: "License, tag, and ID", hint: "Dry bag. Not a screenshot." },
    { id: "extra-dates", label: "Season dates confirmed", hint: plan.agency.name },
    { id: "extra-emergency", label: "Sheriff / SAR on paper", hint: "We do not invent those numbers." },
    { id: "extra-maps", label: "Maps downloaded offline", hint: "Cell service is not a plan." },
  ];
  if (plan.blaze.required) {
    extras.push({ id: "extra-blaze", label: "Blaze orange on the body", hint: plan.blaze.summary });
  }
  if (plan.weightBias === "payload") {
    extras.push({ id: "extra-weigh", label: "Kit weighed for the airplane", hint: "If it does not fit the cub, it stays." });
  }
  if (plan.input.duration !== "day") {
    extras.push({ id: "extra-comms", label: "InReach / comms charged", hint: `Check the battery before you leave ${kitOrigin(plan.input.accesses, plan.input.lodgings)}.` });
  }
  if (plan.input.weapon === "archery") {
    extras.push({ id: "extra-arrows", label: "Arrows cut and flown", hint: "Same heads you will hunt." });
  } else {
    extras.push({ id: "extra-zero", label: "Zeroed with this load", hint: "The same box in the kit." });
  }
  if (plan.fuel) {
    extras.push({
      id: "extra-fuel",
      label: plan.fuel.mealCount
        ? `${plan.fuel.kcalPerHour} kcal/hr · ${plan.fuel.mealCount} trail meals`
        : `${plan.fuel.kcalPerHour} kcal/hr · pack ~${plan.fuel.kcalPerDay.toLocaleString()} kcal of snacks`,
      hint: plan.fuel.note,
    });
  }
  extras.push({
    id: "extra-nitrile",
    label: "Nitrile gloves",
    hint: "A pair for the gut pile. Not the ones in the first-aid kit.",
  });
  if (plan.input.duration !== "day") {
    extras.push({
      id: "extra-fire",
      label: "Lighter that works wet",
      hint: "Two sources. One on you, one in the kit.",
    });
  }
  const tree = plan.input.blinds.some((b) => b === "hang-on" || b === "ladder" || b === "climber" || b === "saddle");
  if (tree) {
    extras.push({
      id: "extra-pullup",
      label: "Pull-up rope",
      hint: "Bow or rifle goes up after you are clipped in.",
    });
  }
  if (plan.input.tactics.includes("ambush")) {
    extras.push({
      id: "extra-wind",
      label: "Wind checker",
      hint: "Powder or a milkweed bottle. Confirm the wind before you sit.",
    });
  }
  const theater = regionById(plan.input.regionId)?.theater ?? "west";
  if (isBearCountry(plan.input, theater)) {
    const overnight = sleepsInTheField(plan.input);
    extras.push({
      id: "extra-bear-food",
      label: overnight ? "Food and smellables stored" : "Lunch and trash leave with you",
      hint: overnight
        ? "Canister or a hard-sided vehicle. Not the tent, not the vestibule."
        : "Nothing left on the tailgate. Bears use the same roads.",
    });
    if (overnight) {
      extras.push({
        id: "extra-bear-cook",
        label: "Cook away from sleep",
        hint: "A hundred yards. Different from where the food lives.",
      });
      extras.push({
        id: "extra-bear-kill",
        label: "Kill stored away from camp",
        hint: "Same rule as food. Not in the tent or the vestibule.",
      });
    }
  }
  return extras;
}

export function PackingSheet({
  plan,
  rows,
  className,
}: {
  plan: HuntPlan;
  rows: KitRow[];
  className?: string;
}) {
  const [packed, setPacked] = useState<string[]>([]);
  const region = regionById(plan.input.regionId);
  const extras = extrasFor(plan);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(packedKey(plan.id));
      if (raw) setPacked(JSON.parse(raw) as string[]);
    } catch {
      /* preview iframes may block storage */
    }
  }, [plan.id]);

  const toggle = (id: string) => {
    setPacked((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(packedKey(plan.id), JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const grouped = useMemo(() => {
    const out: { cat: string; rows: KitRow[] }[] = [];
    for (const row of rows) {
      const cat = slotCategory[row.slot] ?? "Kit";
      const last = out[out.length - 1];
      if (last && last.cat === cat) last.rows.push(row);
      else out.push({ cat, rows: [row] });
    }
    return out;
  }, [rows]);

  const totalBoxes = extras.length + rows.length;
  const done = packed.filter((id) => extras.some((e) => e.id === id) || rows.some((r) => r.slot === id)).length;

  return (
    <div className={cn("pack-sheet", className)}>
      <header className="border-b border-border pb-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">Drawn · Packing list</p>
        <h1 className="mt-2 font-display text-3xl leading-tight tracking-tight">{plan.title}</h1>
        <p className="mt-2 text-sm text-muted">
          {joinLabeled(plan.input.accesses, accessLabel)}
          {" · "}
          {plan.input.lodgings.map((l) => lodgingLabelFor(l, plan.input.accesses)).join(" · ")}
          {region ? ` · ${region.name}` : ""}
          {" · "}
          {weaponLabel[plan.input.weapon]}
          {" · "}
          {monthLabel[plan.input.month]}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md bg-surface-2 px-2 py-2">
            <p className="font-mono text-lg tabular-nums">{plan.weather.packForF}°</p>
            <p className="text-[10px] uppercase tracking-wider text-muted">Pack for</p>
          </div>
          <div className="rounded-md bg-surface-2 px-2 py-2">
            <p className="text-sm leading-tight">
              {plan.blaze.required ? "Wear it on this hunt" : "Not required to wear"}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-muted">Hunter orange</p>
          </div>
          <div className="rounded-md bg-surface-2 px-2 py-2">
            <p className="text-sm leading-tight">
              {plan.weightBias === "payload" ? "Airplane limit" : plan.weightBias === "carry" ? "On your back" : "Truck can haul it"}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-muted">Weight</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">{plan.realFeel}</p>
        <p className="no-print mt-2 text-xs text-subtle">
          {done} of {totalBoxes} packed
        </p>
      </header>

      <section className="pack-group mt-6">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Before you leave</h2>
        <ul className="mt-2">
          {extras.map((e) => (
            <PackRow
              key={e.id}
              checked={packed.includes(e.id)}
              onToggle={() => toggle(e.id)}
              title={e.label}
              detail={e.hint}
            />
          ))}
        </ul>
      </section>

      {grouped.map((g) => (
        <section key={g.cat} className="pack-group mt-6">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">{g.cat}</h2>
          <ul className="mt-2">
            {g.rows.map((row) => {
              const p = selectedOf(row);
              return (
                <PackRow
                  key={row.slot}
                  checked={packed.includes(row.slot)}
                  onToggle={() => toggle(row.slot)}
                  title={row.label}
                  detail={p?.name ?? ""}
                />
              );
            })}
          </ul>
        </section>
      ))}

      <section className="pack-group mt-6">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Also in the bag</h2>
        <ul className="mt-2">
          {["", "", "", ""].map((_, i) => (
            <li key={i} className="flex min-h-11 items-center gap-3 border-b border-border/80 py-2">
              <span className="pack-empty" aria-hidden />
              <span className="block h-px flex-1 bg-border" />
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-6 text-xs leading-relaxed text-muted">{plan.disclaimer}</p>
    </div>
  );
}

function PackRow({
  checked,
  onToggle,
  title,
  detail,
}: {
  checked: boolean;
  onToggle: () => void;
  title: string;
  detail: string;
}) {
  return (
    <li>
      <label className="flex min-h-11 cursor-pointer items-start gap-3 border-b border-border/80 py-2.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="pack-box mt-0.5"
        />
        <span className="min-w-0 flex-1">
          <span className={cn("block text-sm font-medium", checked && "text-muted line-through")}>{title}</span>
          {detail ? <span className="mt-0.5 block text-xs text-muted">{detail}</span> : null}
        </span>
      </label>
    </li>
  );
}

export function packingMarkdown(plan: HuntPlan, rows: KitRow[]) {
  const extras = extrasFor(plan);
  const lines = [
    `# Packing list — ${plan.title}`,
    "",
    plan.realFeel,
    `Pack for ${plan.weather.packForF}°. Hunter orange: ${plan.blaze.required ? "wear it" : "not required to wear"}.`,
    plan.fuel ? `Field calories: ${plan.fuel.kcalPerHour} kcal/hr · ${plan.fuel.note}` : "",
    "",
    "## Before you leave",
    ...extras.map((e) => `- [ ] ${e.label} — ${e.hint}`),
    "",
    "## Kit",
    ...rows.map((r) => {
      const p = selectedOf(r);
      return `- [ ] ${r.label}: ${p?.name ?? ""} — ${r.why}`;
    }),
    "",
    ...((plan.skipped?.length ?? 0)
      ? [
          "## Left out / why",
          ...plan.skipped!.map((s) => `- ${s.label}: ${s.reason}`),
          "",
        ]
      : []),
    plan.disclaimer,
  ];
  return lines.join("\n");
}
