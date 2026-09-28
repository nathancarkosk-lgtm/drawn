/**
 * Shareable kit links — encode HuntInput in the URL hash (no auth, no server).
 * Format: `#kit=<base64url(JSON HuntInput)>`
 *
 * Skip list + beginner why come from regenerate.
 * TODO(deploy): when Nathan/Growth set the public host (Vercel OK), share URLs
 * will use window.location.origin automatically. Do not invent a domain.
 */

import { asHuntInput, emptyDraft, type HuntDraft, type HuntInput } from "./types";

const HASH_PREFIX = "kit=";

function b64urlEncode(json: string): string {
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): string | null {
  try {
    const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

/** Compact input for the hash (no plan id / PII). Accepts current plurals. */
export function encodeKitHash(input: HuntInput): string {
  const compact = {
    species: input.species,
    state: input.state,
    regionId: input.regionId,
    weapon: input.weapon,
    month: input.month,
    experience: input.experience,
    tactics: input.tactics,
    lodgings: input.lodgings,
    duration: input.duration,
    travels: input.travels,
    terrains: input.terrains,
    accesses: input.accesses,
    lands: input.lands,
    blinds: input.blinds,
    stands: input.stands,
    tiers: input.tiers,
  };
  return `#${HASH_PREFIX}${b64urlEncode(JSON.stringify(compact))}`;
}

export function parseKitHash(hash: string): HuntInput | null {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!raw.startsWith(HASH_PREFIX)) return null;
  const decoded = b64urlDecode(raw.slice(HASH_PREFIX.length));
  if (!decoded) return null;
  try {
    const parsed = JSON.parse(decoded) as unknown;
    return asHuntInput(parsed);
  } catch {
    return null;
  }
}

/** Full share URL for the current origin — never invent a production host. */
export function kitShareUrl(input: HuntInput): string {
  if (typeof window === "undefined") return encodeKitHash(input);
  const { origin, pathname, search } = window.location;
  return `${origin}${pathname}${search}${encodeKitHash(input)}`;
}

export function writeKitHash(input: HuntInput) {
  if (typeof window === "undefined") return;
  const next = encodeKitHash(input);
  if (window.location.hash === next) return;
  const url = `${window.location.pathname}${window.location.search}${next}`;
  window.history.replaceState(null, "", url);
}

export function clearKitHash() {
  if (typeof window === "undefined") return;
  if (!window.location.hash.startsWith(`#${HASH_PREFIX}`)) return;
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
}

export function draftFromInput(input: HuntInput): HuntDraft {
  return { ...emptyDraft(), ...input };
}
