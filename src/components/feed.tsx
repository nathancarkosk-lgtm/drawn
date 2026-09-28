import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/hunt/analytics";
import { Dock } from "@/components/dock";
import { PackingSheet, packingMarkdown } from "@/components/packing-list";
import { buyLabel, buyUrl, kitTotal, youtubeUrl } from "@/lib/hunt/kit";
import { kitShareUrl, writeKitHash } from "@/lib/hunt/share";
import { expertFitsHunt } from "@/lib/hunt/experts";
import { releaseBoardCopy } from "@/lib/hunt/release";
import { loadLabel, weaponBoardCopy } from "@/lib/hunt/weapon";
import {
  accessLabel,
  joinLabeled,
  blindLabel,
  landLabel,
  lodgingLabelFor,
  monthLabel,
  regionById,
  slotCategory,
  speciesLabel,
  standLabel,
  tacticLabel,
  terrainLabel,
  weaponLabel,
} from "@/lib/hunt/options";
import { useHunt } from "@/lib/hunt/store";
import type { HuntInput, HuntPlan, KitRow, Product } from "@/lib/hunt/types";
import { cn, formatUsd } from "@/lib/utils";
import {
  ArrowLeft,
  Bookmark,
  ChevronDown,
  ClipboardCopy,
  ExternalLink,
  Play,
  Printer,
  RotateCcw,
  Link2,
  ShoppingBag,
} from "lucide-react";
import { useEffect, useState } from "react";

function selectedOf(row: KitRow): Product | undefined {
  return row.options.find((o) => o.id === row.selectedId);
}

function Post({ children, delay }: { children: ReactNode; delay: number }) {
  return (
    <article
      className="feed-enter rounded-xl border border-border bg-surface p-5 shadow-soft"
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </article>
  );
}

function weightLabel(p: Product) {
  if (typeof p.weightOz !== "number") return null;
  return `${(p.weightOz / 16).toFixed(1)} lb`;
}

function WeaponPost({
  row,
  delay,
  input,
  onSelect,
  board,
}: {
  row: KitRow;
  delay: number;
  input: HuntInput;
  onSelect: (id: string) => void;
  board?: { kicker: string; title: string; lead: string };
}) {
  const p = selectedOf(row);
  if (!p) return null;
  const verdicts = row.verdicts ?? [];
  const lean = verdicts.find((v) => v.productId === row.selectedId) ?? verdicts[0];
  const weaponCopy = weaponBoardCopy(input, lean);
  const copy = board ?? { kicker: weaponCopy.kicker, title: "No single right answer.", lead: weaponCopy.lead };
  return (
    <article
      className="feed-enter rounded-xl border border-border bg-surface p-5 shadow-soft"
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">{copy.kicker}</p>
      <h3 className="mt-1 font-display text-2xl leading-tight tracking-tight">{copy.title}</h3>
      <p className="mt-2 text-sm leading-snug text-fg/90">{copy.lead}</p>

      <div role="radiogroup" aria-label="Weapon recommendations" className="mt-4 flex flex-col gap-3">
        {row.options.map((o) => {
          const v = verdicts.find((x) => x.productId === o.id);
          const selected = o.id === row.selectedId;
          const chamber = o.load ? loadLabel[o.load] : null;
          const wt = weightLabel(o);
          return (
            <div
              key={o.id}
              className={cn(
                "rounded-lg border p-4 transition-[border-color,background-color] duration-150",
                selected ? "border-primary bg-surface-2" : "border-border hover:border-border-strong",
              )}
            >
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onSelect(o.id)}
                className="w-full text-left"
              >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-primary">
                    {v?.angle ?? o.tier}
                  </p>
                  <p className="mt-1 font-display text-xl leading-tight tracking-tight">{o.name}</p>
                  <p className="mt-1 text-xs text-muted">
                    {o.brand}
                    {chamber ? ` · ${chamber}` : ""}
                    {wt ? ` · ${wt}` : ""}
                    {` · ${o.tier === "value" ? "Value" : o.tier === "mid" ? "Mid" : "Premium"}`}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-sm tabular-nums">{formatUsd(o.price)}</span>
              </div>
              {v && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">For</p>
                    <ul className="mt-1.5 space-y-1">
                      {v.pros.map((pro) => (
                        <li key={pro} className="flex gap-2 text-sm leading-snug">
                          <span className="mt-0.5 w-3 shrink-0 text-primary" aria-hidden>
                            +
                          </span>
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">Against</p>
                    <ul className="mt-1.5 space-y-1">
                      {v.cons.map((con) => (
                        <li key={con} className="flex gap-2 text-sm leading-snug text-muted">
                          <span className="mt-0.5 w-3 shrink-0" aria-hidden>
                            −
                          </span>
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              </button>
              {selected ? (
                <div className="mt-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-primary">
                    {input.weapon === "archery" ? "In the kit" : "In the kit · ammo follows this chamber"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="primary">
                      <a
                        href={buyUrl(o)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => track("shop_click", { slot: row.slot, surface: "shop" })}
                      >
                        <ShoppingBag className="size-3.5" />
                        {buyLabel(o)}
                      </a>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <a href={youtubeUrl(o)} target="_blank" rel="noopener noreferrer">
                        <Play className="size-3.5" />
                        Watch reviews
                      </a>
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </article>
  );
}

function GearPost({ row, delay, onSelect }: { row: KitRow; delay: number; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const p = selectedOf(row);
  if (!p) return null;
  return (
    <article
      className="feed-enter rounded-xl border border-border bg-surface shadow-soft"
      style={{ animationDelay: `${delay}ms` }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 p-5 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
            {slotCategory[row.slot]} · {row.label}
          </p>
          <h3 className="mt-1 break-words font-display text-xl leading-tight tracking-tight sm:text-2xl">{p.name}</h3>
          <p className="mt-1 text-sm text-muted">{p.brand}</p>
          <p className="mt-3 text-sm leading-snug text-fg/90">{row.why}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="font-mono text-sm tabular-nums">{formatUsd(p.price)}</span>
          <ChevronDown className={cn("size-4 text-muted transition-transform duration-150", open && "rotate-180")} />
        </div>
      </button>
      {open && (
        <div className="border-t border-border px-5 py-4">
          {row.options.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {row.options.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => onSelect(o.id)}
                  className={cn(
                    "min-h-11 rounded-md border px-3 text-xs font-medium",
                    o.id === row.selectedId
                      ? "border-primary bg-primary text-primary-fg"
                      : "border-border text-muted hover:border-border-strong",
                  )}
                >
                  {o.tier === "value" ? "Value" : o.tier === "mid" ? "Mid" : "Premium"} · {formatUsd(o.price)}
                </button>
              ))}
            </div>
          )}
          {row.tradeoffs.length > 0 && (
            <ul className="mt-4 space-y-1.5">
              {row.tradeoffs.map((t) => {
                const prod = row.options.find((o) => o.id === t.productId) ?? row.options[0];
                return (
                  <li key={t.axis} className="text-xs text-muted">
                    <span className="font-medium text-fg">{t.axis}.</span> {prod?.name}. {t.reason}
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="primary">
              <a
                href={buyUrl(p)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("shop_click", { slot: row.slot, surface: "shop" })}
              >
                <ShoppingBag className="size-3.5" />
                {buyLabel(p)}
              </a>
            </Button>
            <Button asChild size="sm" variant="outline">
              <a href={youtubeUrl(p)} target="_blank" rel="noopener noreferrer">
                <Play className="size-3.5" />
                Watch reviews
              </a>
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}

export function Feed() {
  const { plan, resetDraft, selectInRow, savePlan, saved } = useHunt();
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [view, setView] = useState<"feed" | "pack">("feed");

  useEffect(() => {
    if (!plan) return;
    writeKitHash(plan.input);
  }, [plan]);

  if (!plan) return null;
  const beginner = plan.input.experience === "beginner";
  const region = regionById(plan.input.regionId);
  const total = kitTotal(plan.rows);
  const isSaved = saved.some((p) => p.id === plan.id);
  const rows = plan.rows;

  const grouped: { cat: string; rows: KitRow[] }[] = [];
  for (const row of rows) {
    const cat = slotCategory[row.slot] ?? "Kit";
    const last = grouped[grouped.length - 1];
    if (last && last.cat === cat) last.rows.push(row);
    else grouped.push({ cat, rows: [row] });
  }

  let delay = 0;
  const nextDelay = () => {
    delay += 40;
    return delay;
  };

  const shopAll = () => {
    const urls = rows.map((r) => selectedOf(r)).filter((p): p is Product => Boolean(p)).map(buyUrl);
    let opened = 0;
    for (const u of urls.slice(0, 6)) {
      const w = window.open(u, "_blank");
      if (w) opened += 1;
    }
    if (opened < urls.length) {
      void navigator.clipboard.writeText(urls.join("\n"));
    }
  };

  const copyMd = async () => {
    track("export_copy", { format: "markdown" });
    await navigator.clipboard.writeText(packingMarkdown(plan, rows));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const openPack = () => setView("pack");
  const printList = () => {
    track("export_print", { rows: rows.length });
    setView("pack");
    window.setTimeout(() => window.print(), 80);
  };

  const copyShareLink = async () => {
    track("share_attempt", { method: "copy_link" });
    await navigator.clipboard.writeText(kitShareUrl(plan.input));
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 1500);
  };

  return (
    <div className="print-root mx-auto flex min-h-dvh w-full max-w-xl flex-col overflow-x-hidden px-4 sm:px-0">
      <div className="flex-1 pt-6 pb-6">
      {view === "feed" ? (
        <>
      <header className="no-print mb-6 flex items-center justify-between px-1">
        <button type="button" onClick={resetDraft} className="flex h-11 items-center gap-2 text-sm text-muted">
          <RotateCcw className="size-4" />
          New hunt
        </button>
        <p className="font-display text-xl tracking-tight">Drawn</p>
        <span className="w-20" />
      </header>

      <div className="flex flex-col gap-4">
        <Post delay={nextDelay()}>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-primary">
            {speciesLabel[plan.input.species]} · {plan.input.state} · {weaponLabel[plan.input.weapon]}
          </p>
          <h1 className="mt-2 break-words font-display text-3xl leading-[1.05] tracking-tight sm:text-4xl">{plan.title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">{plan.summary}</p>
          <p className="mt-4 text-xs text-subtle">
            {joinLabeled(plan.input.tactics, tacticLabel)}
            {plan.input.blinds.length ? ` · ${joinLabeled(plan.input.blinds, blindLabel)}` : ""} ·{" "}
            {joinLabeled(plan.input.lands, landLabel)} · {joinLabeled(plan.input.accesses, accessLabel)}
            {plan.input.stands.length ? ` · ${joinLabeled(plan.input.stands, standLabel)}` : ""} ·{" "}
            {plan.input.lodgings.map((l) => lodgingLabelFor(l, plan.input.accesses)).join(" · ")} · {joinLabeled(plan.input.terrains, terrainLabel)}
            {region ? ` · ${region.name}` : ""}
          </p>
          {plan.weightBias === "payload" && (
            <p className="mt-3 rounded-md bg-surface-2 px-3 py-2 text-xs text-fg/90">
              Weight-limited access. The kit prefers ounces — the airplane is the gate.
            </p>
          )}
          {plan.weightBias === "none" && (
            <p className="mt-3 rounded-md bg-surface-2 px-3 py-2 text-xs text-fg/90">
              Vehicle access. Weight is not the limiter — quiet, weather, and durability are.
            </p>
          )}
        </Post>


        <Post delay={nextDelay()}>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-danger">Safety & legal notice</p>
          <p className="mt-2 text-sm leading-relaxed text-fg/90">
            Always verify current regulations with the agency linked below. Season windows and blaze rules in this kit are
            snapshots — not gospel. Confirm licenses, weapon rules, and bag limits before you hunt.
          </p>
          {beginner ? (
            <p className="mt-2 text-xs text-muted">
              Beginner tip: open each gear row for price tiers and tradeoffs.
            </p>
          ) : null}
        </Post>

        <Post delay={nextDelay()}>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Real feel</p>
          <p className="mt-2 font-display text-2xl leading-snug tracking-tight">{plan.realFeel}</p>
          <div className="mt-5 grid grid-cols-4 gap-2 text-center">
            {[
              [plan.weather.highF, "High"],
              [plan.weather.lowF, "Low"],
              [plan.weather.feelLowF, "Feels"],
              [plan.weather.packForF, "Pack for"],
            ].map(([n, l]) => (
              <div key={String(l)} className="rounded-md bg-surface-2 py-3">
                <p className="font-mono text-lg tabular-nums">{n}°</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted">{l}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-subtle">
            Wind {plan.weather.windMph} mph · {plan.weather.precipIn}" precip ·{" "}
            {plan.weather.source === "nasa-power" ? "NASA POWER normals" : "regional normals"} — not a forecast
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {plan.weather.hazards.map((h) => (
              <span key={h} className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted">
                {h}
              </span>
            ))}
          </div>
          <details className="mt-3">
            <summary className="cursor-pointer text-xs text-muted">What this means for gear</summary>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-fg/90">
              {plan.weatherGear.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </details>
        </Post>

        {plan.fuel ? (
          <Post delay={nextDelay()}>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Field calories</p>
            <h3 className="mt-2 font-display text-2xl leading-tight tracking-tight">
              {plan.fuel.kcalPerHour} kcal an hour
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-fg/90">{plan.fuel.note}</p>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              {[
                [plan.fuel.hoursPerDay, "Hours / day"],
                [plan.fuel.kcalPerDay.toLocaleString(), "Kcal / day"],
                [plan.fuel.days, plan.fuel.days === 1 ? "Day" : "Days"],
              ].map(([n, l]) => (
                <div key={String(l)} className="rounded-md bg-surface-2 py-3">
                  <p className="font-mono text-lg tabular-nums">{n}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted">{l}</p>
                </div>
              ))}
            </div>
          </Post>
        ) : null}

        <Post delay={nextDelay()}>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Legal snapshot</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-surface-2 px-3 py-1.5 text-xs">
              Hunter orange · {plan.blaze.required ? "wear it" : "not required to wear"}
            </span>
            <span className="rounded-full bg-surface-2 px-3 py-1.5 text-xs">{monthLabel[plan.input.month]} window</span>
          </div>
          <p className="mt-3 text-sm leading-snug">{plan.season.window}</p>
          <details className="mt-3">
            <summary className="cursor-pointer text-xs text-muted">Licenses, bag, agency</summary>
            <div className="mt-2 space-y-2 text-sm">
              <p>{plan.season.bag}</p>
              <ul className="list-disc pl-4 text-muted">
                {plan.season.licenses.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
              {plan.season.notes && <p className="text-xs text-muted">{plan.season.notes}</p>}
              <p className="text-xs">{plan.blaze.detail}</p>
              <a className="inline-flex items-center gap-1 text-primary" href={plan.agency.url} target="_blank" rel="noreferrer">
                {plan.agency.name} <ExternalLink className="size-3" />
              </a>
              <p className="text-xs text-muted">{plan.agency.phoneNote}</p>
              <p className="text-xs text-muted">Emergency: {plan.emergency.items.join(" · ")}</p>
            </div>
          </details>
        </Post>

        {plan.rutNote && (
          <Post delay={nextDelay()}>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
              {speciesLabel[plan.input.species]} timing
            </p>
            <p className="mt-2 text-sm leading-relaxed">{plan.rutNote}</p>
          </Post>
        )}

        {plan.primers.map((pr) => (
          <Post key={pr.title} delay={nextDelay()}>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-primary">Start here</p>
            <h3 className="mt-2 font-display text-2xl leading-tight">{pr.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-fg/90">{pr.body}</p>
          </Post>
        ))}

        {grouped.map((g, i) => (
          <div key={`${g.cat}-${i}`} className="flex flex-col gap-3">
            <p className="px-1 pt-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">{g.cat}</p>
            {g.rows.map((row) =>
              row.slot === "weapon" || row.slot === "release" ? (
                <WeaponPost
                  key={row.slot}
                  row={row}
                  delay={nextDelay()}
                  input={plan.input}
                  onSelect={(id) => selectInRow(row.slot, id)}
                  board={row.slot === "release" ? releaseBoardCopy() : undefined}
                />
              ) : (
                <GearPost key={row.slot} row={row} delay={nextDelay()} onSelect={(id) => selectInRow(row.slot, id)} />
              ),
            )}
          </div>
        ))}


        {(() => {
          const fieldNotes = plan.experts
            .filter((e) => expertFitsHunt(e, plan.input))
            .slice(0, 5);
          const leftOut = plan.skipped ?? [];
          if (fieldNotes.length === 0 && leftOut.length === 0) return null;
          return (
            <Post delay={nextDelay()}>
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[11px] font-medium uppercase tracking-[0.16em] text-muted [&::-webkit-details-marker]:hidden">
                  <span>Field notes</span>
                  <ChevronDown className="size-4 shrink-0 transition-transform duration-150 group-open:rotate-180" />
                </summary>
                {fieldNotes.length > 0 ? (
                  <ul className="mt-4 space-y-4">
                    {fieldNotes.map((e) => (
                      <li key={e.id}>
                        <p className="font-display text-xl leading-snug tracking-tight">“{e.claim}”</p>
                        <a
                          href={e.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block text-xs text-muted hover:text-fg"
                        >
                          {e.person} · {e.credential}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {leftOut.length > 0 ? (
                  <div className={fieldNotes.length > 0 ? "mt-5 border-t border-border pt-4" : "mt-4"}>
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Left out / why</p>
                    <ul className="mt-3 space-y-2">
                      {leftOut.map((s) => (
                        <li key={s.id} className="text-sm leading-snug">
                          <span className="font-medium text-fg">{s.label}.</span>{" "}
                          <span className="text-muted">{s.reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </details>
            </Post>
          );
        })()}

        {plan.openQuestions.length > 0 && (
          <Post delay={nextDelay()}>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Open calls</p>
            <ul className="mt-3 space-y-2">
              {plan.openQuestions.map((m) => (
                <li key={m} className="text-sm leading-snug">
                  {m}
                </li>
              ))}
            </ul>
          </Post>
        )}

        <Post delay={nextDelay()}>
          <p className="text-xs leading-relaxed text-muted">{plan.disclaimer}</p>
        </Post>
      </div>
        </>
      ) : (
        <header className="no-print mb-6 flex items-center justify-between px-1">
          <button type="button" onClick={() => setView("feed")} className="flex h-11 items-center gap-2 text-sm text-muted">
            <ArrowLeft className="size-4" />
            Back to kit
          </button>
          <p className="font-display text-xl tracking-tight">Pack</p>
          <span className="w-24" />
        </header>
      )}

      <PackingSheet
        plan={plan}
        rows={rows}
        className={view === "pack" ? "feed-enter" : "print-only hidden"}
      />
      </div>

      <Dock className="-mx-4 sm:mx-0">
          {view === "feed" ? (
            <>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-wider text-muted">Kit total</p>
                <p className="truncate font-mono text-lg tabular-nums">{formatUsd(total)}</p>
              </div>
              <Button
                size="icon"
                variant="outline"
                className="shrink-0"
                aria-label="Save kit"
                onClick={() => {
                  savePlan();
                  setSavedFlash(true);
                  setTimeout(() => setSavedFlash(false), 1200);
                }}
              >
                <Bookmark className={cn("size-4", (isSaved || savedFlash) && "fill-current")} />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="shrink-0"
                aria-label={linkCopied ? "Link copied" : "Copy share link"}
                onClick={() => void copyShareLink()}
              >
                <Link2 className="size-4" />
              </Button>
              <Button size="icon" variant="outline" className="shrink-0" aria-label="Copy packing list" onClick={copyMd}>
                <ClipboardCopy className="size-4" />
              </Button>
              <Button variant="outline" className="shrink-0" onClick={openPack}>
                <Printer className="size-4" />
                <span className="hidden sm:inline">Pack</span>
              </Button>
              <Button variant="primary" className="min-w-0 shrink grow basis-[5.5rem] sm:grow-0" onClick={shopAll}>
                <ShoppingBag className="size-4 shrink-0" />
                <span className="truncate hidden sm:inline">{copied ? "Copied" : "Shop"}</span>
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" className="shrink-0" onClick={() => setView("feed")}>
                <ArrowLeft className="size-4" />
                Kit
              </Button>
              <Button variant="outline" onClick={copyMd}>
                <ClipboardCopy className="size-4" />
                <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
              </Button>
              <Button variant="primary" className="flex-1" onClick={printList}>
                <Printer className="size-4" />
                Print packing list
              </Button>
            </>
          )}
      </Dock>
    </div>
  );
}
