# Drawn

Hunt-specific gear kits. Pick the animal, place, season, and how you hunt — get a list you can take into the field.

Drawn is free and non-commercial: no affiliates, tip jars, or paid upsells.

## Run it

Needs Node 22+.

```bash
npm install
npm run dev
```

Then open [http://localhost:8080](http://localhost:8080).

`npm run build` produces the production build. `npm run typecheck` checks types.

## Optional

- **Field-note copy** — set `XAI_API_KEY` if you want the LLM pass on kit writeups. Without it, kits still build from the catalog and scoring rules.
- **Weather** — climatology fetch is best-effort; a fallback is used if it fails.

No account or database is required. Kits save in the browser.

## Layout

- `src/lib/hunt/` — catalog, scoring, wizard rules, seasons, fuel
- `src/components/` — wizard, kit feed, packing list
- `src/routes/` — app shell
