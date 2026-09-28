# Drawn ship notes — SoT rebase + P0/polish

**When:** 2026-09-18 evening MT (box ~2026-09-19 01:50 UTC)  
**Live root:** `/workspace/drawn-gear` (= Nathan’s fresh export)  
**Reference tree:** `/workspace/drawn-gear-pre-export-202609190145`  
**Preview:** `http://127.0.0.1:8080/` (vite `--host 0.0.0.0 --port 8080`)

## What shipped

1. Swapped live app root to fresh SoT export.
2. Ported P0 accuracy onto plural-input SoT:
   - Haul frames on multi-day backpack regardless of static/active
   - Brand-cap cannot demote haul → day pack
   - inReach/comm + harness (+ haul packs, lifeline) theaters `any`
   - `standLikeAmbush` derive gate + buildSkipped coverage (“No sourced option…”)
3. Polish: beginner why (SLOT_PLAIN), skip list in feed + packing export, `#kit=` share, analytics events, mobile overflow, safety notice.
4. Amazon links are plain search (no affiliate tags); ranking by score/fit only.
5. Brand stays **Drawn**.
6. 5k audit seed 42 → **0% P0 flags**.

## Preview link

Until Nathan republishes pearl-civic / production:
- Use **local preview** `http://127.0.0.1:8080/` (or the Cursor/box preview URL that tunnels 8080).
- Share links are `#kit=<base64url(JSON)>` on **whatever origin** the browser is on — do not invent a public domain.

## Remaining / iterate next

- Plausible/GTM domain TBD (analytics already push `dataLayer` + `console.debug`).
- Catalog coverage gaps still surface as skipped “No sourced option…” (intentional).
- Do not invent regulations or fake moose-call SKUs.
