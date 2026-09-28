/**
 * Lightweight client analytics — Plausible/GTM-ready via dataLayer.
 * shop_click is a neutral interaction event (shopping convenience only).
 *
 * Event names (wire exactly):
 *   page_view | wizard_step | kit_generate | export_print | export_copy
 *   share_attempt | shop_click
 *
 * TODO(deploy): public host / Plausible domain from Nathan (Vercel OK).
 * Do not hardcode a production URL here.
 */

export type DrawnAnalyticsEvent =
  | "page_view"
  | "wizard_step"
  | "kit_generate"
  | "export_print"
  | "export_copy"
  | "share_attempt"
  | "shop_click";

type Dims = Record<string, string | number | boolean | undefined | null>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    plausible?: (event: string, options?: { props?: Record<string, string | number | boolean> }) => void;
  }
}

function scrub(dims?: Dims): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  if (!dims) return out;
  for (const [k, v] of Object.entries(dims)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v.length > 64) continue;
    out[k] = v;
  }
  return out;
}

/** Push to dataLayer + optional Plausible; always console.debug in preview. */
export function track(event: DrawnAnalyticsEvent, dims?: Dims) {
  if (typeof window === "undefined") return;
  const props = scrub(dims);
  const payload = { event, ...props };

  try {
    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push(payload);
  } catch {
    /* ignore */
  }

  try {
    if (typeof window.plausible === "function") {
      window.plausible(event, { props });
    }
  } catch {
    /* ignore */
  }

  try {
    console.debug("[drawn:analytics]", event, props);
  } catch {
    /* ignore */
  }
}

/** Primary generate event — species/state/weapon/tactic only (no PII). */
export function trackKitGenerate(input: {
  species: string;
  state: string;
  weapon: string;
  tactic?: string;
  tactics?: string[];
}) {
  const tactic =
    input.tactic ??
    (Array.isArray(input.tactics) && input.tactics.length ? input.tactics.join("+") : "unknown");
  track("kit_generate", {
    species: input.species,
    state: input.state,
    weapon: input.weapon,
    tactic: tactic.slice(0, 64),
  });
}
