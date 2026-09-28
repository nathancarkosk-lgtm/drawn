import { Feed } from "@/components/feed";
import { GeneratingOverlay, Wizard } from "@/components/wizard";
import { track, trackKitGenerate } from "@/lib/hunt/analytics";
import { generatePlan } from "@/lib/hunt/generate";
import { draftFromInput, parseKitHash, writeKitHash } from "@/lib/hunt/share";
import { useHunt } from "@/lib/hunt/store";
import { useEffect, useRef } from "react";

export function DrawnApp() {
  const {
    plan,
    generating,
    error,
    setError,
    hydrate,
    setDraft,
    setStep,
    setGenerating,
    setPlan,
  } = useHunt();
  const shareBootstrapped = useRef(false);

  useEffect(() => {
    hydrate();
    track("page_view", { surface: "drawn_app" });
  }, [hydrate]);

  // Share: `#kit=…` restores hunt inputs and regenerates.
  // Public host TBD by Nathan/Growth (Vercel OK) — never invent a domain.
  useEffect(() => {
    if (shareBootstrapped.current) return;
    if (typeof window === "undefined") return;
    const input = parseKitHash(window.location.hash);
    if (!input) {
      shareBootstrapped.current = true;
      return;
    }
    shareBootstrapped.current = true;
    setDraft(draftFromInput(input));
    setStep(5);
    setGenerating(true);
    setError(null);
    void (async () => {
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
        track("share_attempt", { method: "open_link" });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not open shared kit.");
      } finally {
        setGenerating(false);
      }
    })();
  }, [setDraft, setStep, setGenerating, setError, setPlan]);

  return (
    <div className="min-h-dvh overflow-x-hidden text-fg">
      {error && (
        <div className="no-print mx-auto max-w-2xl px-4 pt-4">
          <div className="flex items-start justify-between gap-3 rounded-lg border border-danger/40 bg-surface px-4 py-3 text-sm">
            <p className="min-w-0 break-words">{error}</p>
            <button type="button" className="shrink-0 text-muted" onClick={() => setError(null)}>
              Dismiss
            </button>
          </div>
        </div>
      )}
      {plan ? <Feed /> : <Wizard />}
      {generating && <GeneratingOverlay />}
    </div>
  );
}
