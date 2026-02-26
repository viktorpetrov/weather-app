# Weather Dashboard Design

Personal weather dashboard that displays midday model charts from meteociel.fr for ECMWF and GFS models, showing temperature at 2m for all available forecast days.

## Architecture

**Stack:** Vite + React + TypeScript + Tailwind CSS

**Proxy layer:** Vite dev server middleware (dev) / serverless function (prod) that:
1. Scrapes meteociel.fr model pages to extract `imgArray` JavaScript arrays, determining the latest available run and all forecast hour image paths
2. Proxies chart GIF images from meteociel.fr to the browser (solves CORS)

**Data flow:**
1. Frontend requests chart metadata from proxy
2. Proxy scrapes meteociel.fr, parses image arrays, filters for midday hours, returns JSON
3. Frontend displays charts via proxy image URLs

## Meteociel.fr URL Patterns

**GFS Temperature 2m (chart code 778):**
```
https://modeles2.meteociel.fr/modeles_gfs/runs/{YYYYMMDDHH}/{HOUR}-778.GIF
```
- Runs: 00Z, 06Z, 12Z, 18Z
- Forecast steps: 3h intervals to 84h, 6h intervals to 240h
- Source page: `/modeles/index.php`

**ECMWF (mode 0 = temperature):**
```
https://www.meteociel.fr/modeles/ecmwf/runs/{YYYYMMDDHH}/ECM1-{HOUR}.GIF
```
- Runs: 00Z, 12Z
- Forecast steps: 0, 24, 48, 72, 96, 120, 144, 168, 192, 216, 240
- Source page: `/modeles/ecmwf.php`

## Midday Filtering Logic

For each model, given the latest run time (e.g., 00Z), calculate which forecast hours correspond to ~12:00 UTC:
- **GFS from 00Z run:** hours 12, 36, 60, 84, 108, 132, 156, 180, 204, 228
- **GFS from 06Z run:** hours 6, 30, 54, 78, 102, 126, 150, 174, 198, 222
- **ECMWF from 00Z run:** hours 12, 36, 60, 84, 108, 132, 156, 180, 204, 228 (but only 24h-step available, so: 24 is closest for day 1, etc.)

Since ECMWF only has 24h steps from meteociel.fr, each image represents a full day. We display all available steps.

## Proxy Endpoints

**`GET /api/charts/:model`** (model = "gfs" | "ecmwf")

Scrapes the corresponding meteociel.fr page, parses `imgArray`, filters for midday hours, returns:
```json
{
  "model": "gfs",
  "run": "2026022606",
  "charts": [
    { "hour": 12, "date": "2026-02-26", "imageUrl": "/api/image?url=..." },
    { "hour": 36, "date": "2026-02-27", "imageUrl": "/api/image?url=..." }
  ]
}
```

**`GET /api/image?url=...`**

Fetches the GIF image from meteociel.fr and streams it to the client. Sets `Cache-Control: max-age=3600`.

## UI Components

- **`App`** — layout, model selector state
- **`ModelSelector`** — toggle ECMWF / GFS
- **`ChartGrid`** — grid of chart cards for selected model
- **`ChartCard`** — date label + chart image
- **`Lightbox`** — full-size image overlay on click

**Theme:** Dark background for better chart contrast. Tailwind CSS.

**Layout:** Model selector at top, then a responsive grid of chart cards. Each card shows the date, forecast hour offset, and chart image. Click to open full-size.

## Testing

- Unit tests: midday-hour calculation, HTML imgArray parsing
- Integration test: proxy endpoint returns valid JSON
- No E2E tests for v1

## Error Handling

- Proxy returns structured error if meteociel.fr is down or page structure changes
- Frontend shows "charts unavailable" with retry button
- Proxy logs parsing failures for debugging
