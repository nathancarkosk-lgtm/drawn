import { create } from "zustand";
import { clearKitHash } from "./share";
import { blazeFor } from "./blaze";
import { recoupleAmmo, defaultWhy } from "./kit";
import { fuelFor } from "./fuel";
import { derive } from "./profile";
import { attachReleaseVerdicts } from "./release";
import { asHuntInput, emptyDraft, type HuntDraft, type HuntPlan } from "./types";
import { attachWeaponVerdicts, weaponWhy } from "./weapon";
import { pickExperts } from "./experts";

const SAVED_KEY = "drawn.plans.v1";

const EMPTY_FUEL: HuntPlan["fuel"] = {
  kcalPerHour: 300,
  hoursPerDay: 7,
  kcalPerDay: 2500,
  days: 1,
  snackKcal: 900,
  mealCount: 0,
  note: "",
};

function migratePlan(plan: HuntPlan): HuntPlan {
  const input = asHuntInput(plan.input);
  let rows = plan.rows.map((r) => ({
    ...r,
    verdicts: Array.isArray(r.verdicts) ? r.verdicts : [],
    tradeoffs: Array.isArray(r.tradeoffs) ? r.tradeoffs : [],
  }));
  if (input) {
    const d = derive(input);
    rows = rows.map((r) => {
      const p = r.options.find((o) => o.id === r.selectedId);
      if (r.slot === "weapon") return attachWeaponVerdicts({ ...r, verdicts: [] }, input, d);
      if (r.slot === "release") return attachReleaseVerdicts({ ...r, verdicts: [] }, input, d);
      if (!p) return r;
      return { ...r, why: defaultWhy(p, d, input) };
    });
    rows = recoupleAmmo(rows, input, d);
    const experts =
      input.experience === "experienced" ? [] : pickExperts(input, input.experience === "beginner" ? 5 : 7);
    const blaze = blazeFor(input.state, input.weapon);
    const fuel = fuelFor(input, d, plan.weather?.packForF ?? 40);
    return { ...plan, input, rows, skipped: Array.isArray(plan.skipped) ? plan.skipped : [], experts, blaze, fuel };
  }
  return { ...plan, rows, skipped: Array.isArray(plan.skipped) ? plan.skipped : [], fuel: plan.fuel ?? EMPTY_FUEL };
}

function readSaved(): HuntPlan[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HuntPlan[];
    return Array.isArray(parsed) ? parsed.map(migratePlan) : [];
  } catch {
    return [];
  }
}

function writeSaved(plans: HuntPlan[]) {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(plans.slice(0, 20)));
  } catch {
    /* preview iframes may block storage */
  }
}

type DraftPatch = Partial<HuntDraft> | ((draft: HuntDraft) => Partial<HuntDraft>);

type HuntStore = {
  draft: HuntDraft;
  step: number;
  plan: HuntPlan | null;
  saved: HuntPlan[];
  generating: boolean;
  error: string | null;
  setDraft: (patch: DraftPatch, step?: number) => void;
  resetDraft: () => void;
  setStep: (n: number) => void;
  setPlan: (plan: HuntPlan | null) => void;
  setGenerating: (v: boolean) => void;
  setError: (e: string | null) => void;
  selectInRow: (slot: string, productId: string) => void;
  savePlan: () => void;
  loadSaved: (id: string) => void;
  deleteSaved: (id: string) => void;
  hydrate: () => void;
};

export const useHunt = create<HuntStore>((set, get) => ({
  draft: emptyDraft(),
  step: 0,
  plan: null,
  saved: [],
  generating: false,
  error: null,
  setDraft: (patch, step) =>
    set((s) => ({
      draft: { ...s.draft, ...(typeof patch === "function" ? patch(s.draft) : patch) },
      ...(step !== undefined ? { step } : {}),
    })),
  resetDraft: () => {
    clearKitHash();
    set({ draft: emptyDraft(), step: 0, plan: null, error: null });
  },
  setStep: (n) => set({ step: n }),
  setPlan: (plan) => set({ plan }),
  setGenerating: (generating) => set({ generating }),
  setError: (error) => set({ error }),
  selectInRow: (slot, productId) => {
    const plan = get().plan;
    if (!plan) return;
    const input = asHuntInput(plan.input);
    const d = input ? derive(input) : null;
    let rows = plan.rows.map((r) => {
      if (r.slot !== slot) return r;
      const next = r.options.find((o) => o.id === productId);
      const verdict = (r.verdicts ?? []).find((v) => v.productId === productId);
      const why = verdict
        ? weaponWhy(verdict)
        : next && input && d
          ? defaultWhy(next, d, input)
          : r.why;
      return {
        ...r,
        selectedId: productId,
        why,
      };
    });
    if (slot === "weapon" && input && d) rows = recoupleAmmo(rows, input, d);
    set({ plan: { ...plan, rows } });
  },
  savePlan: () => {
    const plan = get().plan;
    if (!plan) return;
    const next = [plan, ...get().saved.filter((p) => p.id !== plan.id)].slice(0, 20);
    writeSaved(next);
    set({ saved: next });
  },
  loadSaved: (id) => {
    const plan = get().saved.find((p) => p.id === id);
    if (plan) {
      const migrated = migratePlan(plan);
      set({ plan: migrated, draft: migrated.input, step: 5 });
    }
  },
  deleteSaved: (id) => {
    const next = get().saved.filter((p) => p.id !== id);
    writeSaved(next);
    set({ saved: next });
  },
  hydrate: () => set({ saved: readSaved() }),
}));
