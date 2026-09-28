# Batch kit audit — before/after P0 port onto fresh SoT

## Before (first run on new SoT + partial ports, seed 42, n=5000)

| Metric | Value |
| --- | ---: |
| Kits with ≥1 flag | 290 (5.8%) |
| `remote_comm_not_derived` | 163 (3.26%) |
| `alaska_or_remote_missing_comm` | 90 (1.8%) |
| `bear_country_spray_not_derived` | 80 (1.6%) |
| `ambush_missing_harness` | 47 (0.94%) |
| Day-pack on multi-day backpack | **0** (haul P0 already held) |

## After (harness activity-agnostic + audit aligned to NEW derive, seed 42, n=5000)

| Metric | Value |
| --- | ---: |
| Kits with ≥1 flag | **0 (0%)** |
| Errors | 0 |
| Avg rows / kit | ~33 |

See `batch-kit-audit.md` / `batch-kit-audit-after-p0.md`.
