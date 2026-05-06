# Weather Dashboard Design

Personal weather dashboard that displays midday model charts from meteociel.fr for ECMWF and GFS, showing 2m temperature for all available forecast days.

## Architecture

**Stack:** Vite + React + TypeScript + Tailwind CSS

**Proxy layer:** Vite dev server middleware (dev) / Vercel serverless functions (prod) that:
1. Scrape meteociel.fr model pages to extract the JS arrays embedded in each page (`imgArray`, and on ECMWF also `echValues` and `imgEchDate`).
2. Filter for frames whose valid time is 12:00 UTC.
3. Proxy chart images from meteociel.fr through `/api/image?url=…` (solves CORS and lets the browser load images via the same origin).

**Data flow:**
1. Frontend hits `/api/charts/{model}`.
2. Server scrapes meteociel.fr, parses arrays, filters midday, returns JSON.
3. Frontend renders chart cards; each `imageUrl` is proxied via `/api/image`.

## Meteociel.fr URL Patterns

**GFS (chart 778, T2m):**
```
https://modeles2.meteociel.fr/modeles_gfs/runs/{YYYYMMDDHH}/{HOUR}-778.GIF
```
- Runs: 00Z, 06Z, 12Z, 18Z
- Forecast steps: 3h up to 84h, 6h to 240h
- Source page: `https://www.meteociel.fr/modeles/index.php?carte=778`
- Page exposes only `imgArray` (no timestamps).

**ECMWF — currently the ENS control member, mode 19:**
```
https://modeles3.meteociel.fr/modeles/ecmwf2/runs/{YYYYMMDDHH}/ecmwffr-19-{HOUR}.png
```
- Runs: 00Z, 06Z, 12Z, 18Z (ENS schedule)
- Forecast steps: 1h early, 3h to ~144h, 6h thereafter, out to 360h
- Source page: `https://www.meteociel.fr/modeles/ecmwf_ctrl.php?ech=6&mode=19&carte=2`
- Page exposes `imgArray`, `echValues[i]` (file step number), and `imgEchDate[ech]` (Unix seconds for the valid time).

## ECMWF gotcha: a single page mixes two runs

Once a new run starts publishing, the ECMWF page populates the early hours from the latest run and falls back to the previous run for the long tail. Concretely, on a 06Z page you typically see hours 1…144 with `runs/{YYYYMMDD}06/...` and hours 150…360 with `runs/{YYYYMMDD}00/...`. URL filename hours are therefore not consistent forecast offsets from a single run — they are offsets from whatever run that file came from.

`imgEchDate[echValues[i]]` is the source of truth for valid time per frame and works regardless of which run a given image came from.

## Midday Filtering

- **GFS** (`imgEchDate` not exposed): use the legacy filename‑hour math. Compute `getMiddayForecastHours(model, runHour)` from the latest run, intersect with hours present in `imgArray`.
- **ECMWF** (`imgEchDate` exposed): for each frame, take `validTimeUtcSec = imgEchDate[echValues[i]]` and keep entries where `(validTimeUtcSec / 3600) % 24 === 12`. Per‑chart `hour` is reported as `(validTimeUtcSec − headlineRunEpochSec) / 3600` so the frontend's `(runHour + hour) % 24` math still resolves to 12 UTC even for frames pulled from the older run.

## Proxy Endpoints

**`GET /api/charts/{model}`** — model = `gfs` | `ecmwf`

Returns:
```json
{
  "model": "ecmwf",
  "run": "2026050606",
  "sourceUrl": "https://www.meteociel.fr/modeles/ecmwf_ctrl.php?ech=6&mode=19&carte=2",
  "charts": [
    { "hour": 6,   "date": "2026-05-06", "imageUrl": "/api/image?url=…" },
    { "hour": 30,  "date": "2026-05-07", "imageUrl": "/api/image?url=…" },
    { "hour": 150, "date": "2026-05-12", "imageUrl": "/api/image?url=…" }
  ]
}
```
- `run` is the headline (most recent) run id from `urls[0]`.
- `hour` is offset from the headline run (so frames from older runs may carry hours that don't match their filename).
- `date` is the YYYY‑MM‑DD of the frame's valid time in UTC.
- `Cache-Control: public, max-age=1800`.

**`GET /api/image?url=…`** — fetches the image from meteociel.fr (Referer set), validates host against an allow‑list, streams it back. `Cache-Control: public, max-age=3600`.

## Server Modules

- `src/server/parse-img-array.ts` — `parseChartImages(html)` returns `{ url, validTimeUtcSec | null }[]`.
- `src/server/midday-hours.ts` — `getMiddayForecastHours(model, runHourUtc)` (used for GFS fallback path).
- `src/server/build-chart-metadata.ts` — `buildChartMetadata(model, images, sourceUrl)` runs the timestamp path when every image has `validTimeUtcSec`, otherwise the filename‑hour fallback.
- `src/server/vite-plugin-api.ts` — Vite middleware wiring `/api/*` in dev.
- `api/charts/[model].ts`, `api/image.ts` — Vercel functions used in prod.

## UI

- `App` — layout, model selector state.
- `ModelSelector` — ECMWF / GFS toggle.
- `ChartGrid` — fetches via `useCharts`, renders cards.
- `ChartCard` — date + Brussels‑time label (computed from `(runHour + hour) % 24` and a CET/CEST helper), zoomed view of Belgium, weekend highlight.
- `Lightbox` — full‑size overlay.

Theme: light cards, dark text. Tailwind v4.

## Deployment

- Linked Vercel project `viktor-petrovs-projects/weather-app`. Pushes to `master` auto‑deploy to production via the Vercel Git integration.
- `vercel.json` is `{ "framework": "vite" }`; serverless functions live under `api/`.

## Testing

- Unit tests (Vitest, node env): parser, midday‑hour math, metadata builder.
- No E2E.

## Error Handling

- Proxy returns structured JSON errors on upstream failure or page‑shape changes.
- Frontend shows "Charts unavailable" with retry.
- `/api/image` rejects URLs whose host is not in the allow‑list.
