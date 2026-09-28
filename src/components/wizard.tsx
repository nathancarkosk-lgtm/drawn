import type { ReactNode } from "react";
import { Chip } from "@/components/chip";
import { Dock } from "@/components/dock";
import { Button } from "@/components/ui/button";
import { track, trackKitGenerate } from "@/lib/hunt/analytics";
import { generatePlan } from "@/lib/hunt/generate";
import { writeKitHash } from "@/lib/hunt/share";
import {
  accessHint,
  accessLabel,
  accessesForRegion,
  blindsFor,
  durationLabel,
  durationsFor,
  experienceLabel,
  landHint,
  landLabel,
  landsFor,
  lodgingLabelFor,
  lodgingsFor,
  monthShort,
  pruneAccessFields,
  regionsFor,
  speciesLabel,
  standHint,
  standLabel,
  standsFor,
  stateLabel,
  statesForSpecies,
  tacticLabel,
  terrainLabel,
  terrainsForRegion,
  toggleItem,
  travelLabelFor,
  travelsFor,
  tacticsFor,
  weaponLabel,
  blindHint,
  blindLabel,
  treeBlind,
} from "@/lib/hunt/options";
import { legalMonths, weaponsFor } from "@/lib/hunt/seasons";
import { useHunt } from "@/lib/hunt/store";
import {
  EXPERIENCE,
  SPECIES,
  TIERS,
  asHuntInput,
  type Access,
  type BlindType,
  type Duration,
  type HuntDraft,
  type HuntState,
  type Land,
  type Lodging,
  type Terrain,
  type Tactic,
  type Species,
  type StandSetup,
  type Weapon,
} from "@/lib/hunt/types";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Bookmark } from "lucide-react";

const STEPS = ["Animal", "Place", "When", "You", "Hunt", "Access"] as const;

function isComplete(d: HuntDraft, step: number) {
  if (step === 0) return Boolean(d.species);
  if (step === 1) return Boolean(d.state && d.regionId);
  if (step === 2) return Boolean(d.weapon && d.month);
  if (step === 3) return Boolean(d.experience && d.tiers.length);
  if (step === 4) {
    const needsLand = landsFor(d.regionId).length > 1;
    const needsStand = treeBlind(d.blinds) && standsFor(d.tactics, d.terrains, d.lands, d.blinds).length > 1;
    return Boolean(
      (!needsLand || d.lands.length) &&
        d.terrains.length &&
        d.tactics.length &&
        (!d.tactics.includes("ambush") || d.blinds.length) &&
        (!needsStand || d.stands.length),
    );
  }
  if (step === 5) {
    return Boolean(d.accesses.length && d.lodgings.length && d.duration && d.travels.length);
  }
  return false;
}

function FieldBlock({
  index,
  title,
  hint,
  children,
}: {
  index: string;
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-soft">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-primary">{index}</p>
      <h2 className="mt-1 font-display text-2xl leading-tight tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted">{hint}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Wizard() {
  const { draft, setDraft, step, setStep, setGenerating, setPlan, setError, generating, saved, loadSaved } = useHunt();

  const states = draft.species ? statesForSpecies(draft.species) : [];
  const regions = draft.state ? regionsFor(draft.state) : [];
  const weapons = draft.state && draft.species ? weaponsFor(draft.state, draft.species) : [];
  const months =
    draft.state && draft.species && draft.weapon ? legalMonths(draft.state, draft.species, draft.weapon) : [];
  const terrains = terrainsForRegion(draft.regionId);
  const accesses = accessesForRegion(draft.regionId);
  const lodgings = lodgingsFor(draft.regionId, draft.accesses);
  const tacticOptions = tacticsFor(draft.species, draft.terrains);
  const durationOptions = durationsFor(draft.lodgings);
  const travelOptions = travelsFor({
    lodgings: draft.lodgings,
    duration: draft.duration,
    terrains: draft.terrains,
    tactics: draft.tactics,
  });
  const standOptions = standsFor(draft.tactics, draft.terrains, draft.lands, draft.blinds);
  const blindOptions = blindsFor(draft.tactics, draft.terrains, draft.lands, draft.regionId);
  const landOptions = landsFor(draft.regionId);
  const landShown = landOptions.length > 1;
  const standShown = standOptions.length > 1;
  const showTerrain = !landShown || draft.lands.length > 0;
  const showTactics = showTerrain && draft.terrains.length > 0;
  const showBlinds = showTactics && draft.tactics.includes("ambush");
  const showStands = showBlinds && standShown;
  const huntNo = (() => {
    const n: Record<string, string> = {};
    let i = 1;
    const take = (k: string) => {
      n[k] = String(i++).padStart(2, "0");
    };
    if (landShown) take("land");
    if (showTerrain) take("terrain");
    if (showTactics) take("tactics");
    if (showBlinds) take("blinds");
    if (showStands) take("stands");
    return n;
  })();
  const accessNo = {
    access: "01",
    camp: "02",
    duration: "03",
    travel: durationOptions.length > 1 ? "04" : "03",
  };

  const pickSpecies = (species: Species) => {
    setDraft(
      {
        species,
        state: null,
        regionId: null,
        weapon: null,
        month: null,
        terrains: [],
        accesses: [],
        tactics: [],
        lodgings: [],
        duration: null,
        travels: [],
        lands: [],
        blinds: [],
        stands: [],
      },
      1,
    );
  };
  const pickState = (state: HuntState) => {
    setDraft({ state, regionId: null, weapon: null, month: null, terrains: [], accesses: [] });
  };
  const pickWeapon = (weapon: Weapon) => {
    const nextMonths =
      draft.state && draft.species ? legalMonths(draft.state, draft.species, weapon) : [];
    setDraft({
      weapon,
      month: draft.month && nextMonths.includes(draft.month) ? draft.month : nextMonths.length === 1 ? nextMonths[0] : null,
    });
  };
  const pickRegion = (regionId: string) => {
    const allowedT = terrainsForRegion(regionId);
    const allowedA = accessesForRegion(regionId);
    setDraft((d) => {
      const next: HuntDraft = {
        ...d,
        regionId,
        terrains: d.terrains.filter((t) => allowedT.includes(t)),
        accesses: d.accesses.filter((a) => allowedA.includes(a)),
      };
      if (next.terrains.length === 0 && allowedT.length === 1) next.terrains = [...allowedT];
      if (next.accesses.length === 0 && allowedA.length === 1) next.accesses = [...allowedA];
      const allowedTac = tacticsFor(next.species, next.terrains);
      next.tactics = next.tactics.filter((t) => allowedTac.includes(t));
      return {
        regionId: next.regionId,
        terrains: next.terrains,
        accesses: next.accesses,
        tactics: next.tactics,
        ...pruneAccessFields(next),
      };
    }, 2);
  };
  const pickMonth = (month: number) => {
    setDraft({ month }, 3);
  };
  const toggleAccess = (a: Access) => {
    setDraft((d) => {
      const next: HuntDraft = { ...d, accesses: toggleItem(d.accesses, a) };
      return { accesses: next.accesses, ...pruneAccessFields(next) };
    });
  };
  const toggleLodging = (l: Lodging) => {
    setDraft((d) => {
      const next: HuntDraft = { ...d, lodgings: toggleItem(d.lodgings, l) };
      return pruneAccessFields(next);
    });
  };
  const pickDuration = (duration: Duration) => {
    setDraft((d) => pruneAccessFields({ ...d, duration }));
  };
  const toggleStand = (s: StandSetup) => {
    setDraft((d) => ({ stands: toggleItem(d.stands, s) }));
  };
  const toggleTactic = (t: Tactic) => {
    setDraft((d) => {
      const next: HuntDraft = { ...d, tactics: toggleItem(d.tactics, t) };
      if (!next.tactics.includes("ambush")) {
        next.blinds = [];
        next.stands = [];
      }
      const pruned = pruneAccessFields(next);
      return {
        tactics: next.tactics,
        ...pruned,
        blinds: next.tactics.includes("ambush") ? pruned.blinds : [],
        stands: next.tactics.includes("ambush") ? pruned.stands : [],
      };
    });
  };
  const toggleLand = (l: Land) => {
    setDraft((d) => {
      const next: HuntDraft = { ...d, lands: toggleItem(d.lands, l) };
      return pruneAccessFields(next);
    });
  };
  const toggleBlind = (b: BlindType) => {
    setDraft((d) => {
      const next: HuntDraft = { ...d, blinds: toggleItem(d.blinds, b) };
      return pruneAccessFields(next);
    });
  };
  const toggleTerrain = (t: Terrain) => {
    setDraft((d) => {
      const nextTerrains = toggleItem(d.terrains, t);
      const allowedTac = tacticsFor(d.species, nextTerrains);
      const next: HuntDraft = {
        ...d,
        terrains: nextTerrains,
        tactics: d.tactics.filter((x) => allowedTac.includes(x)),
      };
      return { terrains: next.terrains, tactics: next.tactics, ...pruneAccessFields(next) };
    });
  };

  const goGenerate = async () => {
    const input = asHuntInput(draft);
    if (!input) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await generatePlan({ data: input });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setPlan(res.plan);
      writeKitHash(input);
      trackKitGenerate({
        species: input.species,
        state: input.state,
        weapon: input.weapon,
        tactics: input.tactics,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build this kit.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col overflow-x-hidden px-4 sm:px-6">
      <div className="flex-1 pt-6 pb-6">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <p className="font-display text-2xl tracking-tight text-fg">Drawn</p>
          <p className="text-xs text-muted">Everything you need, nothing you don't.</p>
        </div>
        {saved.length > 0 && (
          <details className="relative">
            <summary className="flex h-11 list-none items-center gap-2 rounded-md border border-border px-3 text-sm text-muted [&::-webkit-details-marker]:hidden">
              <Bookmark className="size-4" />
              Saved
            </summary>
            <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg border border-border bg-surface p-2 shadow-soft">
              {saved.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => loadSaved(p.id)}
                  className="block min-h-11 w-full rounded-md px-3 py-2 text-left text-sm active:bg-surface-2"
                >
                  <span className="block text-fg">{p.title}</span>
                  <span className="text-xs text-muted">{new Date(p.createdAt).toLocaleDateString()}</span>
                </button>
              ))}
            </div>
          </details>
        )}
      </header>

      <div className="mb-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
          Step {step + 1} of {STEPS.length} · {STEPS[step]}
        </p>
        <div className="mt-3 flex gap-1.5">
          {STEPS.map((label, i) => (
            <button
              key={label}
              type="button"
              disabled={i > step}
              aria-label={label}
              aria-current={i === step ? "step" : undefined}
              onClick={() => {
                if (i < step) setStep(i);
              }}
              className="flex flex-1 flex-col items-stretch px-0 py-2"
            >
              <span className={cn("block h-1 rounded-full", i <= step ? "bg-primary" : "bg-border")} />
              <span className="mt-2 hidden text-[10px] uppercase tracking-wider text-muted sm:block">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {step === 0 && (
        <section>
          <h1 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">What are you hunting?</h1>
          <p className="mt-2 max-w-md text-sm text-muted">Nothing is assumed. Pick the animal. The rest of the form follows from that.</p>
          <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {SPECIES.map((s) => (
              <Chip key={s} selected={draft.species === s} onClick={() => pickSpecies(s)} className="h-16 w-full justify-center text-center">
                {speciesLabel[s]}
              </Chip>
            ))}
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="flex flex-col gap-6">
          <div>
            <h1 className="font-display text-4xl leading-tight tracking-tight">Where.</h1>
            <p className="mt-2 text-sm text-muted">
              {draft.species ? `States with a ${speciesLabel[draft.species].toLowerCase()} season in this kit.` : "Pick a species first."}
            </p>
          </div>
          <FieldBlock index="01" title="State" hint="Only states this animal is actually hunted in.">
            <div className="flex flex-wrap gap-2">
              {states.map((st) => (
                <Chip key={st} selected={draft.state === st} onClick={() => pickState(st)}>
                  {st} · {stateLabel[st].name}
                </Chip>
              ))}
            </div>
          </FieldBlock>
          {draft.state && (
            <FieldBlock index="02" title="Region" hint="Terrain and access will follow this country.">
              <div className="grid gap-2">
                {regions.map((r) => (
                  <Chip
                    key={r.id}
                    selected={draft.regionId === r.id}
                    onClick={() => pickRegion(r.id)}
                    className="flex flex-col items-start gap-0.5 py-3"
                  >
                    <span>{r.name}</span>
                    <span className={cn("text-xs font-normal", draft.regionId === r.id ? "text-primary-fg/80" : "text-muted")}>
                      {r.blurb}
                    </span>
                  </Chip>
                ))}
              </div>
            </FieldBlock>
          )}
        </section>
      )}

      {step === 2 && (
        <section className="flex flex-col gap-6">
          <div>
            <h1 className="font-display text-4xl leading-tight tracking-tight">Weapon and month.</h1>
            <p className="mt-2 text-sm text-muted">Only months that are typically legal for this species, state, and weapon. Confirm dates with the agency.</p>
          </div>
          <FieldBlock index="01" title="Weapon" hint="This changes orange law, calls, and quiet.">
            <div className="flex flex-wrap gap-2">
              {weapons.map((w) => (
                <Chip key={w} selected={draft.weapon === w} onClick={() => pickWeapon(w)}>
                  {weaponLabel[w]}
                  {draft.state === "IA" && w === "firearm" ? " (shotgun / straight-wall)" : ""}
                </Chip>
              ))}
            </div>
          </FieldBlock>
          {draft.weapon && (
            <FieldBlock index="02" title="Month" hint="Illegal months are not shown.">
              {months.length === 0 ? (
                <p className="text-sm text-muted">No typical season for that combination.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {months.map((m) => (
                    <Chip key={m} selected={draft.month === m} onClick={() => pickMonth(m)}>
                      {monthShort[m]}
                    </Chip>
                  ))}
                </div>
              )}
            </FieldBlock>
          )}
        </section>
      )}

      {step === 3 && (
        <section className="flex flex-col gap-6">
          <h1 className="font-display text-4xl leading-tight tracking-tight">How much help, and what will you spend?</h1>
          <FieldBlock index="01" title="Experience" hint="This changes how much why you get, not the gear rules.">
            <div className="grid gap-2">
              {EXPERIENCE.map((e) => (
                <Chip
                  key={e}
                  selected={draft.experience === e}
                  onClick={() => setDraft({ experience: e })}
                  className="flex flex-col items-start py-3"
                >
                  <span>{experienceLabel[e].title}</span>
                  <span className={cn("text-xs font-normal", draft.experience === e ? "text-primary-fg/80" : "text-muted")}>
                    {experienceLabel[e].hint}
                  </span>
                </Chip>
              ))}
            </div>
          </FieldBlock>
          <FieldBlock index="02" title="Price brackets" hint="Pick one or more. You can swap inside the kit later.">
            <div className="flex flex-wrap gap-2">
              {TIERS.map((t) => (
                <Chip key={t} selected={draft.tiers.includes(t)} onClick={() => setDraft((d) => ({ tiers: toggleItem(d.tiers, t) }))}>
                  {t === "value" ? "Value" : t === "mid" ? "Mid" : "Premium"}
                </Chip>
              ))}
            </div>
          </FieldBlock>
        </section>
      )}

      {step === 4 && (
        <section className="flex flex-col gap-6">
          <div>
            <h1 className="font-display text-4xl leading-tight tracking-tight">How you will hunt.</h1>
            <p className="mt-2 text-sm text-muted">Land first. Then the ground. Then how you hunt it.</p>
          </div>
          {landShown && (
            <FieldBlock
              index={huntNo.land}
              title="Land"
              hint="Permission and what you carry. Some units are public only."
            >
              <div className="grid gap-2">
                {landOptions.map((l) => (
                  <Chip
                    key={l}
                    selected={draft.lands.includes(l)}
                    onClick={() => toggleLand(l)}
                    className="flex flex-col items-start gap-0.5 py-3"
                  >
                    <span>{landLabel[l]}</span>
                    <span className={cn("text-xs font-normal", draft.lands.includes(l) ? "text-primary-fg/80" : "text-muted")}>
                      {landHint[l]}
                    </span>
                  </Chip>
                ))}
              </div>
            </FieldBlock>
          )}
          {showTerrain && (
            <FieldBlock index={huntNo.terrain} title="Terrain" hint="Only ground that exists in the region you named.">
              {terrains.length === 0 ? (
                <p className="text-sm text-muted">Pick a region first. Terrain follows the country.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {terrains.map((t) => (
                    <Chip
                      key={t}
                      selected={draft.terrains.includes(t)}
                      onClick={() => toggleTerrain(t)}
                    >
                      {terrainLabel[t]}
                    </Chip>
                  ))}
                </div>
              )}
            </FieldBlock>
          )}
          {showTactics && (
            <FieldBlock
              index={huntNo.tactics}
              title="Tactics"
              hint="Pick every method you will actually use. Glassing plus calling is not one label."
            >
              <div className="flex flex-wrap gap-2">
                {tacticOptions.map((t) => (
                  <Chip
                    key={t}
                    selected={draft.tactics.includes(t)}
                    onClick={() => toggleTactic(t)}
                  >
                    {tacticLabel[t]}
                  </Chip>
                ))}
              </div>
            </FieldBlock>
          )}
          {showBlinds && (
            <FieldBlock
              index={huntNo.blinds}
              title="Blind type"
              hint="What you sit in. Tree options only appear if you picked timber, river bottom, or foothills."
            >
              <div className="grid gap-2">
                {blindOptions.map((b) => (
                  <Chip
                    key={b}
                    selected={draft.blinds.includes(b)}
                    onClick={() => toggleBlind(b)}
                    className="flex flex-col items-start gap-0.5 py-3"
                  >
                    <span>{blindLabel[b]}</span>
                    <span className={cn("text-xs font-normal", draft.blinds.includes(b) ? "text-primary-fg/80" : "text-muted")}>
                      {blindHint[b]}
                    </span>
                  </Chip>
                ))}
              </div>
            </FieldBlock>
          )}
          {showStands && (
            <FieldBlock
              index={huntNo.stands}
              title="Stand"
              hint={
                draft.lands.includes("private")
                  ? "Private ground often already has stands hung. Do not pack a hang-on unless you will hang one."
                  : "On public, you usually carry the stand in."
              }
            >
              <div className="grid gap-2">
                {standOptions.map((s) => (
                  <Chip
                    key={s}
                    selected={draft.stands.includes(s)}
                    onClick={() => toggleStand(s)}
                    className="flex flex-col items-start gap-0.5 py-3"
                  >
                    <span>{standLabel[s]}</span>
                    <span className={cn("text-xs font-normal", draft.stands.includes(s) ? "text-primary-fg/80" : "text-muted")}>
                      {standHint[s]}
                    </span>
                  </Chip>
                ))}
              </div>
            </FieldBlock>
          )}
        </section>
      )}

      {step === 5 && (
        <section className="flex flex-col gap-6">
          <div>
            <h1 className="font-display text-4xl leading-tight tracking-tight">How you get there.</h1>
            <p className="mt-2 text-sm text-muted">
              Only access that is realistic here. A float-plane hunt is a different kit than a truck camp.
            </p>
          </div>
          <FieldBlock index={accessNo.access} title="Access" hint="How you actually arrive. This decides whether ounces matter.">
            {accesses.length === 0 ? (
              <p className="text-sm text-muted">Pick a region first.</p>
            ) : (
              <div className="grid gap-2">
                {accesses.map((a) => (
                  <Chip
                    key={a}
                    selected={draft.accesses.includes(a)}
                    onClick={() => toggleAccess(a)}
                    className="flex flex-col items-start gap-0.5 py-3"
                  >
                    <span>{accessLabel[a]}</span>
                    <span className={cn("text-xs font-normal", draft.accesses.includes(a) ? "text-primary-fg/80" : "text-muted")}>
                      {accessHint[a]}
                    </span>
                  </Chip>
                ))}
              </div>
            )}
          </FieldBlock>
          <FieldBlock
            index={accessNo.camp}
            title="Camp"
            hint="Where you sleep. Fly-in hunts do not list home each night."
          >
            <div className="flex flex-wrap gap-2">
              {lodgings.map((t) => (
                <Chip
                  key={t}
                  selected={draft.lodgings.includes(t)}
                  onClick={() => toggleLodging(t)}
                >
                  {lodgingLabelFor(t, draft.accesses)}
                </Chip>
              ))}
            </div>
          </FieldBlock>
          {durationOptions.length > 1 && (
          <FieldBlock
            index={accessNo.duration}
            title="Trip length"
            hint="Follows how you sleep. Home each night is a day hunt."
          >
            <div className="flex flex-wrap gap-2">
              {durationOptions.map((t) => (
                <Chip key={t} selected={draft.duration === t} onClick={() => pickDuration(t)}>
                  {durationLabel[t]}
                </Chip>
              ))}
            </div>
          </FieldBlock>
          )}
          <FieldBlock
            index={accessNo.travel}
            title="Daily travel"
            hint="ATV-in is not a short sit by default. Pick the walk you will actually make."
          >
            {travelOptions.length === 0 ? (
              <p className="text-sm text-muted">Pick camp first. Travel follows camp, length, and terrain.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {travelOptions.map((t) => (
                  <Chip
                    key={t}
                    selected={draft.travels.includes(t)}
                    onClick={() => setDraft((d) => ({ travels: toggleItem(d.travels, t) }))}
                  >
                    {travelLabelFor(t, draft.lodgings, draft.accesses, draft.tactics)}
                  </Chip>
                ))}
              </div>
            )}
          </FieldBlock>
        </section>
      )}
      </div>

      <Dock className="-mx-4 sm:-mx-6">
        <Button
          variant="outline"
          className="shrink-0"
          disabled={step === 0}
          onClick={() => setStep(Math.max(0, step - 1))}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
        {step < 5 ? (
          <Button
            variant="primary"
            className="min-h-12 flex-1"
            disabled={!isComplete(draft, step)}
            onClick={() => { track("wizard_step", { step: step + 1 }); setStep(step + 1); }}
          >
            Continue
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button
            variant="primary"
            className="min-h-12 flex-1"
            disabled={!isComplete(draft, 5) || generating}
            onClick={goGenerate}
          >
            {generating ? "Building kit…" : "Build my kit"}
          </Button>
        )}
      </Dock>
    </div>
  );
}

export function GeneratingOverlay() {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-bg/90 px-6">
      <div className="max-w-sm text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">Scouting the hunt</p>
        <p className="mt-3 font-display text-3xl leading-tight">Cutting the list to what this hunt actually needs.</p>
        <p className="mt-3 text-sm text-muted">Legal windows, weather normals, and gear built for the way you hunt — not a generic packing list.</p>
        <div className="mx-auto mt-8 h-1 w-40 overflow-hidden rounded-full bg-border">
          <div className="h-full w-1/2 animate-pulse bg-primary" />
        </div>
      </div>
    </div>
  );
}
