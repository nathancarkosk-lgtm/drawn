# Batch kit audit

Generated: 2026-09-19T01:51:31.361Z (box-local / America/Denver context)
Pipeline: `derive + buildRows + buildSkipped + fallbackWeather (no LLM, no NASA weather)`
Seed: 42 · Target: 5000

## Totals

| Metric | Value |
| --- | ---: |
| Inputs sampled | 5000 |
| Kits generated | 5000 |
| Errors | 0 |
| Avg rows / kit | 33.38 |
| Kits with ≥1 flag | 0 (0%) |
| Clean kits | 5000 |
| Elapsed | 2.3s |

## Top flags (ranked)

| Flag | Count | Rate % |
| --- | ---: | ---: |
| _(none)_ | 0 | 0 |

## Representative failing cases

## Usefulness notes

- Generated 5000 kits from 5000 stratified season-valid inputs in 2.3s (seed 42).
- No heuristic red flags fired across the sample — kit derive/buildRows look consistent with coded rules.
- Multi-day backpack hunts did not select Pro 2300 / ALPS / Superday / Pop-Up day packs as the primary pack in this sample (haul preference held).
- Ambush tactics consistently included a fall-arrest harness slot when derived.
- When blazeFor().required was true, blaze vest/hat rows were present in kits.
- Beginner why-text generally includes plain role language (SLOT_PLAIN path), not jargon-only builtFor.
- Skipped lists were checked for non-ambush tactics (expect harness/seat omissions explained). Catalog gaps (derived slot, no product) are product-coverage issues, not regulations.
- This audit does not invent legal regulations; blaze/season checks only mirror blaze.ts and seasons.ts snapshots already in the app.

## How to re-run

```bash
node scripts/batch-kit-audit.mjs --count 5000 --seed 42
```

Flags mirror local kit rules (derive/buildRows/blaze/skipped). They are not legal advice and do not invent regulations or brand claims.
