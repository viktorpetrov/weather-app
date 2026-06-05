# Weather Dashboard

Personal forecast dashboard that scrapes midday 2 m temperature charts from
meteociel.fr for ECMWF and GFS and presents them as a click‑to‑zoom grid,
labelled in Brussels time and centred on Belgium.

Live: https://weather-app-seven-omega-45.vercel.app

## Stack

- Vite + React 19 + TypeScript + Tailwind v4
- Vitest for unit tests
- Vite middleware in dev / Vercel serverless functions (`api/`) in prod

## Endpoints

- `GET /api/charts/{gfs|ecmwf}` — JSON: latest run id, source URL, and one entry per midday‑12‑UTC frame.
- `GET /api/image?url=…` — proxies an allow‑listed meteociel.fr image (sets `Referer`, solves CORS).

## How it works

Both pages embed an `imgArray` of image URLs. The ECMWF page additionally
publishes `echValues` and `imgEchDate` (Unix seconds for the valid time of
each frame) — which is what the server filters on, since the same ECMWF page
mixes hours from two different runs (e.g. 06Z up to +144 h, 00Z fallback for
+150…+360 h). Filtering by Unix valid time keeps the chart series anchored
to 12:00 UTC across the run boundary; before that fix, post‑day‑6 frames
landed at 08:00 Brussels because the code assumed a single run.

GFS pages don't expose timestamps, so the server derives each frame's valid
time from `runEpoch + forecastHour`, reading the run id from **that frame's own
URL**. GFS pages hit the same multi‑run boundary (newest run for near hours, the
previous 6 h‑earlier run for the tail), so reading a single run id for every
frame would land post‑boundary days at 08:00 Brussels instead of 14:00.

See `docs/plans/2026-02-26-weather-dashboard-design.md` for the full design,
including the URL patterns, the multi‑run gotcha, and the data flow.

## Develop

```bash
npm install
npm run dev          # Vite dev server with /api/* middleware
npx vitest run       # unit tests
npx tsc --noEmit     # type check
```

## Deploy

Push to `master`. The linked Vercel project (`viktor-petrovs-projects/weather-app`)
auto‑deploys to production via its Git integration. `vercel.json` is just
`{ "framework": "vite" }`; the functions under `api/` are picked up automatically.

## Layout

```
api/                          serverless functions used in prod
  charts/[model].ts
  image.ts
src/
  App.tsx
  components/                 ModelSelector, ChartGrid, ChartCard, Lightbox
  hooks/useCharts.ts
  server/
    parse-img-array.ts        parses imgArray + echValues + imgEchDate
    build-chart-metadata.ts   timestamp path (ECMWF) + per-frame run-id path (GFS)
    vite-plugin-api.ts        /api/* middleware for dev
docs/plans/                   design + initial implementation plan
```
