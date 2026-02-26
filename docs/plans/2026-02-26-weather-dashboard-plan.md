# Weather Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a personal weather dashboard that displays midday ECMWF and GFS temperature charts scraped from meteociel.fr.

**Architecture:** Vite + React + TypeScript frontend with Tailwind CSS. A Vite dev server plugin intercepts `/api/*` requests to scrape meteociel.fr model pages, parse chart image arrays, filter for midday forecast hours, and proxy images. The frontend shows a model selector (ECMWF/GFS) and a grid of chart cards with lightbox.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS v4, Vitest, node-fetch (for proxy)

---

### Task 1: Scaffold Vite + React + TypeScript project

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `tailwind.config.ts`, `postcss.config.js`

**Step 1: Create project with Vite**

Run: `npm create vite@latest . -- --template react-ts`
Expected: Project files created in current directory

**Step 2: Install dependencies**

Run: `npm install`
Expected: node_modules created, lockfile generated

**Step 3: Install Tailwind CSS v4**

Run: `npm install -D tailwindcss @tailwindcss/vite`

**Step 4: Configure Tailwind**

Replace `src/index.css` with:
```css
@import "tailwindcss";
```

Update `vite.config.ts`:
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

**Step 5: Install Vitest**

Run: `npm install -D vitest`

Add to `vite.config.ts`:
```ts
/// <reference types="vitest/config" />
```
And add to the config object:
```ts
test: {
  environment: "node",
},
```

**Step 6: Clean up boilerplate**

Replace `src/App.tsx` with:
```tsx
export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <h1 className="text-2xl font-bold">Weather Dashboard</h1>
    </div>
  );
}
```

Delete `src/App.css`. Remove the `import './App.css'` if present in App.tsx.

**Step 7: Verify it runs**

Run: `npm run dev`
Expected: Vite dev server starts, page shows "Weather Dashboard" on dark background

**Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TypeScript + Tailwind + Vitest"
```

---

### Task 2: imgArray parser — TDD

Parse the JavaScript `imgArray` from meteociel.fr HTML pages. This is the core scraping logic.

**Files:**
- Create: `src/server/parse-img-array.ts`
- Test: `src/server/parse-img-array.test.ts`

**Step 1: Write the failing test**

Create `src/server/parse-img-array.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { parseImgArray } from "./parse-img-array";

describe("parseImgArray", () => {
  it("parses ECMWF imgArray from HTML", () => {
    const html = `
      <script>
      var imgArray = new Array();
      imgArray[0] = "/modeles/ecmwf/runs/2026022600/ECM1-0.GIF?26-12";
      imgArray[1] = "/modeles/ecmwf/runs/2026022600/ECM1-24.GIF?26-12";
      imgArray[2] = "/modeles/ecmwf/runs/2026022600/ECM1-48.GIF?26-12";
      </script>
    `;
    const result = parseImgArray(html);
    expect(result).toEqual([
      "/modeles/ecmwf/runs/2026022600/ECM1-0.GIF?26-12",
      "/modeles/ecmwf/runs/2026022600/ECM1-24.GIF?26-12",
      "/modeles/ecmwf/runs/2026022600/ECM1-48.GIF?26-12",
    ]);
  });

  it("parses GFS imgArray from HTML", () => {
    const html = `
      <script>
      var imgArray = new Array();
      imgArray[0] = "https://modeles2.meteociel.fr/modeles_gfs/runs/2026022606/3-778.GIF?26-6";
      imgArray[1] = "https://modeles2.meteociel.fr/modeles_gfs/runs/2026022606/6-778.GIF?26-6";
      imgArray[2] = "https://modeles2.meteociel.fr/modeles_gfs/runs/2026022606/9-778.GIF?26-6";
      </script>
    `;
    const result = parseImgArray(html);
    expect(result).toEqual([
      "https://modeles2.meteociel.fr/modeles_gfs/runs/2026022606/3-778.GIF?26-6",
      "https://modeles2.meteociel.fr/modeles_gfs/runs/2026022606/6-778.GIF?26-6",
      "https://modeles2.meteociel.fr/modeles_gfs/runs/2026022606/9-778.GIF?26-6",
    ]);
  });

  it("returns empty array when no imgArray found", () => {
    const html = "<html><body>No charts here</body></html>";
    const result = parseImgArray(html);
    expect(result).toEqual([]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/server/parse-img-array.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

Create `src/server/parse-img-array.ts`:
```ts
export function parseImgArray(html: string): string[] {
  const regex = /imgArray\[\d+\]\s*=\s*"([^"]+)"/g;
  const urls: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/server/parse-img-array.test.ts`
Expected: 3 tests PASS

**Step 5: Commit**

```bash
git add src/server/parse-img-array.ts src/server/parse-img-array.test.ts
git commit -m "feat: add imgArray parser for meteociel.fr HTML pages"
```

---

### Task 3: Midday hour calculation — TDD

Given a model type and run hour, calculate which forecast hours correspond to midday (~12:00 UTC).

**Files:**
- Create: `src/server/midday-hours.ts`
- Test: `src/server/midday-hours.test.ts`

**Step 1: Write the failing test**

Create `src/server/midday-hours.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { getMiddayForecastHours } from "./midday-hours";

describe("getMiddayForecastHours", () => {
  describe("GFS", () => {
    it("returns midday hours for 00Z run", () => {
      const hours = getMiddayForecastHours("gfs", 0);
      // 00Z + 12h = 12Z (midday), then every 24h
      expect(hours).toEqual([12, 36, 60, 84, 108, 132, 156, 180, 204, 228]);
    });

    it("returns midday hours for 06Z run", () => {
      const hours = getMiddayForecastHours("gfs", 6);
      // 06Z + 6h = 12Z (midday), then every 24h
      expect(hours).toEqual([6, 30, 54, 78, 102, 126, 150, 174, 198, 222]);
    });

    it("returns midday hours for 12Z run", () => {
      const hours = getMiddayForecastHours("gfs", 12);
      // 12Z + 0h = 12Z (midday), then every 24h
      expect(hours).toEqual([0, 24, 48, 72, 96, 120, 144, 168, 192, 216, 240]);
    });

    it("returns midday hours for 18Z run", () => {
      const hours = getMiddayForecastHours("gfs", 18);
      // 18Z + 18h = 12Z next day, then every 24h
      expect(hours).toEqual([18, 42, 66, 90, 114, 138, 162, 186, 210, 234]);
    });
  });

  describe("ECMWF", () => {
    it("returns all available steps for 00Z run (24h interval)", () => {
      const hours = getMiddayForecastHours("ecmwf", 0);
      // ECMWF has 24h steps: 0, 24, 48, ... 240
      // From 00Z, 12Z midday is at +12h — but only 24h steps available
      // We return all steps since each represents a day
      expect(hours).toEqual([0, 24, 48, 72, 96, 120, 144, 168, 192, 216, 240]);
    });

    it("returns all available steps for 12Z run", () => {
      const hours = getMiddayForecastHours("ecmwf", 12);
      expect(hours).toEqual([0, 24, 48, 72, 96, 120, 144, 168, 192, 216, 240]);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/server/midday-hours.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

Create `src/server/midday-hours.ts`:
```ts
type Model = "gfs" | "ecmwf";

const GFS_MAX_HOUR = 240;
const ECMWF_STEPS = [0, 24, 48, 72, 96, 120, 144, 168, 192, 216, 240];

export function getMiddayForecastHours(model: Model, runHourUtc: number): number[] {
  if (model === "ecmwf") {
    // ECMWF only has 24h-step charts on meteociel.fr — return all steps
    return ECMWF_STEPS;
  }

  // GFS: find the first forecast hour that lands at 12Z
  const firstMiddayOffset = (12 - runHourUtc + 24) % 24;
  const hours: number[] = [];
  for (let h = firstMiddayOffset; h <= GFS_MAX_HOUR; h += 24) {
    hours.push(h);
  }
  return hours;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/server/midday-hours.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/server/midday-hours.ts src/server/midday-hours.test.ts
git commit -m "feat: add midday forecast hour calculation for GFS and ECMWF"
```

---

### Task 4: Chart metadata builder — TDD

Combine the parsed imgArray with midday hours to produce the chart metadata JSON response.

**Files:**
- Create: `src/server/build-chart-metadata.ts`
- Test: `src/server/build-chart-metadata.test.ts`

**Step 1: Write the failing test**

Create `src/server/build-chart-metadata.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { buildChartMetadata } from "./build-chart-metadata";

describe("buildChartMetadata", () => {
  it("builds GFS chart metadata from imgArray URLs", () => {
    // Simulate a 00Z GFS run with 3h steps, chart code 778
    const imgUrls = [
      "https://modeles2.meteociel.fr/modeles_gfs/runs/2026022600/3-778.GIF?26-6",
      "https://modeles2.meteociel.fr/modeles_gfs/runs/2026022600/6-778.GIF?26-6",
      "https://modeles2.meteociel.fr/modeles_gfs/runs/2026022600/9-778.GIF?26-6",
      "https://modeles2.meteociel.fr/modeles_gfs/runs/2026022600/12-778.GIF?26-6",
      "https://modeles2.meteociel.fr/modeles_gfs/runs/2026022600/15-778.GIF?26-6",
    ];

    const result = buildChartMetadata("gfs", imgUrls);

    expect(result.model).toBe("gfs");
    expect(result.run).toBe("2026022600");
    // Only hour 12 is a midday hour from 00Z run (first midday in this short set)
    expect(result.charts).toEqual([
      {
        hour: 12,
        date: "2026-02-26",
        imageUrl: "/api/image?url=https%3A%2F%2Fmodeles2.meteociel.fr%2Fmodeles_gfs%2Fruns%2F2026022600%2F12-778.GIF%3F26-6",
      },
    ]);
  });

  it("builds ECMWF chart metadata from imgArray URLs", () => {
    const imgUrls = [
      "/modeles/ecmwf/runs/2026022600/ECM1-0.GIF?26-12",
      "/modeles/ecmwf/runs/2026022600/ECM1-24.GIF?26-12",
      "/modeles/ecmwf/runs/2026022600/ECM1-48.GIF?26-12",
    ];

    const result = buildChartMetadata("ecmwf", imgUrls);

    expect(result.model).toBe("ecmwf");
    expect(result.run).toBe("2026022600");
    expect(result.charts).toHaveLength(3);
    expect(result.charts[0].hour).toBe(0);
    expect(result.charts[0].date).toBe("2026-02-26");
    expect(result.charts[1].hour).toBe(24);
    expect(result.charts[1].date).toBe("2026-02-27");
    expect(result.charts[2].hour).toBe(48);
    expect(result.charts[2].date).toBe("2026-02-28");
  });

  it("returns empty charts when imgArray is empty", () => {
    const result = buildChartMetadata("gfs", []);
    expect(result.charts).toEqual([]);
    expect(result.run).toBe("");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/server/build-chart-metadata.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

Create `src/server/build-chart-metadata.ts`:
```ts
import { getMiddayForecastHours } from "./midday-hours";

type Model = "gfs" | "ecmwf";

interface ChartEntry {
  hour: number;
  date: string;
  imageUrl: string;
}

interface ChartMetadata {
  model: string;
  run: string;
  charts: ChartEntry[];
}

function extractRunId(model: Model, urls: string[]): string {
  if (urls.length === 0) return "";
  const url = urls[0];
  if (model === "gfs") {
    const match = url.match(/runs\/(\d{10})\//);
    return match ? match[1] : "";
  }
  // ECMWF
  const match = url.match(/runs\/(\d{10})\//);
  return match ? match[1] : "";
}

function extractForecastHour(model: Model, url: string): number {
  if (model === "gfs") {
    // Pattern: /runs/YYYYMMDDHH/HOUR-778.GIF
    const match = url.match(/\/(\d+)-\d+\.GIF/);
    return match ? parseInt(match[1], 10) : -1;
  }
  // ECMWF pattern: ECM1-HOUR.GIF
  const match = url.match(/ECM1-(\d+)\.GIF/);
  return match ? parseInt(match[1], 10) : -1;
}

function forecastDate(runId: string, forecastHour: number): string {
  if (!runId) return "";
  const year = parseInt(runId.slice(0, 4), 10);
  const month = parseInt(runId.slice(4, 6), 10) - 1;
  const day = parseInt(runId.slice(6, 8), 10);
  const hour = parseInt(runId.slice(8, 10), 10);

  const runDate = new Date(Date.UTC(year, month, day, hour));
  runDate.setUTCHours(runDate.getUTCHours() + forecastHour);

  const y = runDate.getUTCFullYear();
  const m = String(runDate.getUTCMonth() + 1).padStart(2, "0");
  const d = String(runDate.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function makeProxyUrl(model: Model, originalUrl: string): string {
  const fullUrl =
    model === "ecmwf" && !originalUrl.startsWith("http")
      ? `https://www.meteociel.fr${originalUrl}`
      : originalUrl;
  return `/api/image?url=${encodeURIComponent(fullUrl)}`;
}

export function buildChartMetadata(model: Model, imgUrls: string[]): ChartMetadata {
  const runId = extractRunId(model, imgUrls);
  const runHour = runId ? parseInt(runId.slice(8, 10), 10) : 0;
  const middayHours = new Set(getMiddayForecastHours(model, runHour));

  // Build a map of forecast hour -> URL
  const hourToUrl = new Map<number, string>();
  for (const url of imgUrls) {
    const h = extractForecastHour(model, url);
    if (h >= 0) {
      hourToUrl.set(h, url);
    }
  }

  const charts: ChartEntry[] = [];
  for (const [hour, url] of hourToUrl) {
    if (middayHours.has(hour)) {
      charts.push({
        hour,
        date: forecastDate(runId, hour),
        imageUrl: makeProxyUrl(model, url),
      });
    }
  }

  // Sort by forecast hour
  charts.sort((a, b) => a.hour - b.hour);

  return { model, run: runId, charts };
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/server/build-chart-metadata.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/server/build-chart-metadata.ts src/server/build-chart-metadata.test.ts
git commit -m "feat: add chart metadata builder combining parser + midday filter"
```

---

### Task 5: Vite proxy plugin — /api/image and /api/charts endpoints

Wire the server logic into a Vite plugin that handles `/api/*` requests during development.

**Files:**
- Create: `src/server/vite-plugin-api.ts`
- Modify: `vite.config.ts`

**Step 1: Create the Vite plugin**

Create `src/server/vite-plugin-api.ts`:
```ts
import type { Plugin } from "vite";
import { parseImgArray } from "./parse-img-array";
import { buildChartMetadata } from "./build-chart-metadata";

type Model = "gfs" | "ecmwf";

const MODEL_PAGES: Record<Model, string> = {
  gfs: "https://www.meteociel.fr/modeles/index.php?carte=778",
  ecmwf: "https://www.meteociel.fr/modeles/ecmwf.php?mode=0&map=0&type=0",
};

export function apiPlugin(): Plugin {
  return {
    name: "weather-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url!, `http://${req.headers.host}`);

        if (url.pathname === "/api/image") {
          const imageUrl = url.searchParams.get("url");
          if (!imageUrl) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Missing url parameter" }));
            return;
          }
          try {
            const response = await fetch(imageUrl, {
              headers: { Referer: "https://www.meteociel.fr/" },
            });
            if (!response.ok) {
              res.writeHead(response.status);
              res.end(`Upstream error: ${response.status}`);
              return;
            }
            res.writeHead(200, {
              "Content-Type": response.headers.get("content-type") || "image/gif",
              "Cache-Control": "public, max-age=3600",
            });
            const buffer = Buffer.from(await response.arrayBuffer());
            res.end(buffer);
          } catch (err) {
            res.writeHead(502, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Failed to fetch image" }));
          }
          return;
        }

        const chartsMatch = url.pathname.match(/^\/api\/charts\/(gfs|ecmwf)$/);
        if (chartsMatch) {
          const model = chartsMatch[1] as Model;
          try {
            const pageUrl = MODEL_PAGES[model];
            const response = await fetch(pageUrl, {
              headers: { Referer: "https://www.meteociel.fr/" },
            });
            if (!response.ok) {
              res.writeHead(502, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: `Meteociel returned ${response.status}` }));
              return;
            }
            const html = await response.text();
            const imgUrls = parseImgArray(html);
            const metadata = buildChartMetadata(model, imgUrls);

            res.writeHead(200, {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=1800",
            });
            res.end(JSON.stringify(metadata));
          } catch (err) {
            res.writeHead(502, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Failed to fetch chart data" }));
          }
          return;
        }

        next();
      });
    },
  };
}
```

**Step 2: Register the plugin in vite.config.ts**

Update `vite.config.ts`:
```ts
/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { apiPlugin } from "./src/server/vite-plugin-api";

export default defineConfig({
  plugins: [react(), tailwindcss(), apiPlugin()],
  test: {
    environment: "node",
  },
});
```

**Step 3: Test manually**

Run: `npm run dev`
Then open: `http://localhost:5173/api/charts/gfs` — should return JSON with chart metadata.
Then open: `http://localhost:5173/api/charts/ecmwf` — should return JSON with ECMWF metadata.
Pick one `imageUrl` from the JSON and open it — should show a GIF chart image.

**Step 4: Commit**

```bash
git add src/server/vite-plugin-api.ts vite.config.ts
git commit -m "feat: add Vite API plugin with /api/charts and /api/image proxy"
```

---

### Task 6: Frontend — ModelSelector component

**Files:**
- Create: `src/components/ModelSelector.tsx`

**Step 1: Create the component**

Create `src/components/ModelSelector.tsx`:
```tsx
type Model = "ecmwf" | "gfs";

interface ModelSelectorProps {
  selected: Model;
  onChange: (model: Model) => void;
}

const MODELS: { value: Model; label: string }[] = [
  { value: "ecmwf", label: "ECMWF" },
  { value: "gfs", label: "GFS" },
];

export default function ModelSelector({ selected, onChange }: ModelSelectorProps) {
  return (
    <div className="flex gap-2">
      {MODELS.map((m) => (
        <button
          key={m.value}
          onClick={() => onChange(m.value)}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            selected === m.value
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/ModelSelector.tsx
git commit -m "feat: add ModelSelector toggle component"
```

---

### Task 7: Frontend — ChartCard component

**Files:**
- Create: `src/components/ChartCard.tsx`

**Step 1: Create the component**

Create `src/components/ChartCard.tsx`:
```tsx
interface ChartCardProps {
  date: string;
  hour: number;
  imageUrl: string;
  onClick: () => void;
}

export default function ChartCard({ date, hour, imageUrl, onClick }: ChartCardProps) {
  const dayLabel = new Date(date + "T12:00:00Z").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <button
      onClick={onClick}
      className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-blue-500 transition-colors cursor-pointer"
    >
      <div className="p-2 text-sm text-gray-300 flex justify-between">
        <span className="font-medium">{dayLabel}</span>
        <span className="text-gray-500">+{hour}h</span>
      </div>
      <img
        src={imageUrl}
        alt={`Forecast for ${date}`}
        className="w-full"
        loading="lazy"
      />
    </button>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/ChartCard.tsx
git commit -m "feat: add ChartCard component for forecast day display"
```

---

### Task 8: Frontend — Lightbox component

**Files:**
- Create: `src/components/Lightbox.tsx`

**Step 1: Create the component**

Create `src/components/Lightbox.tsx`:
```tsx
import { useEffect } from "react";

interface LightboxProps {
  imageUrl: string;
  onClose: () => void;
}

export default function Lightbox({ imageUrl, onClose }: LightboxProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <img
        src={imageUrl}
        alt="Full-size chart"
        className="max-w-full max-h-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/Lightbox.tsx
git commit -m "feat: add Lightbox overlay for full-size chart viewing"
```

---

### Task 9: Frontend — ChartGrid component with data fetching

**Files:**
- Create: `src/components/ChartGrid.tsx`
- Create: `src/hooks/useCharts.ts`

**Step 1: Create the data-fetching hook**

Create `src/hooks/useCharts.ts`:
```ts
import { useState, useEffect } from "react";

interface ChartEntry {
  hour: number;
  date: string;
  imageUrl: string;
}

interface ChartData {
  model: string;
  run: string;
  charts: ChartEntry[];
}

interface UseChartsResult {
  data: ChartData | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function useCharts(model: "gfs" | "ecmwf"): UseChartsResult {
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/charts/${model}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [model, retryCount]);

  return { data, loading, error, retry: () => setRetryCount((c) => c + 1) };
}
```

**Step 2: Create ChartGrid component**

Create `src/components/ChartGrid.tsx`:
```tsx
import { useState } from "react";
import { useCharts } from "../hooks/useCharts";
import ChartCard from "./ChartCard";
import Lightbox from "./Lightbox";

interface ChartGridProps {
  model: "gfs" | "ecmwf";
}

export default function ChartGrid({ model }: ChartGridProps) {
  const { data, loading, error, retry } = useCharts(model);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="text-gray-400 text-center py-12">Loading charts...</div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">Charts unavailable: {error}</p>
        <button
          onClick={retry}
          className="px-4 py-2 bg-gray-800 rounded hover:bg-gray-700 text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data || data.charts.length === 0) {
    return (
      <div className="text-gray-400 text-center py-12">No charts available</div>
    );
  }

  return (
    <>
      <p className="text-gray-500 text-sm mb-4">
        Run: {data.run} — {data.charts.length} forecast days
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data.charts.map((chart) => (
          <ChartCard
            key={chart.hour}
            date={chart.date}
            hour={chart.hour}
            imageUrl={chart.imageUrl}
            onClick={() => setLightboxUrl(chart.imageUrl)}
          />
        ))}
      </div>
      {lightboxUrl && (
        <Lightbox imageUrl={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}
    </>
  );
}
```

**Step 3: Commit**

```bash
git add src/hooks/useCharts.ts src/components/ChartGrid.tsx
git commit -m "feat: add ChartGrid component with data fetching and lightbox"
```

---

### Task 10: Wire up App — complete dashboard

**Files:**
- Modify: `src/App.tsx`

**Step 1: Update App.tsx**

Replace `src/App.tsx` with:
```tsx
import { useState } from "react";
import ModelSelector from "./components/ModelSelector";
import ChartGrid from "./components/ChartGrid";

type Model = "ecmwf" | "gfs";

export default function App() {
  const [model, setModel] = useState<Model>("ecmwf");

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 max-w-7xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Weather Dashboard</h1>
        <ModelSelector selected={model} onChange={setModel} />
      </header>
      <ChartGrid model={model} />
    </div>
  );
}
```

**Step 2: Verify the full app works**

Run: `npm run dev`
Expected: Dashboard loads, shows ECMWF charts by default, toggle switches to GFS, clicking a chart opens lightbox, Escape closes it.

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire up App with model selector and chart grid"
```

---

### Task 11: Final smoke test and cleanup

**Step 1: Run all tests**

Run: `npx vitest run`
Expected: All unit tests pass

**Step 2: Run the dev server and verify end-to-end**

Run: `npm run dev`
Verify:
- `/api/charts/ecmwf` returns JSON
- `/api/charts/gfs` returns JSON
- Dashboard displays charts for both models
- Lightbox opens/closes
- Model toggle works

**Step 3: Clean up unused files**

Delete any remaining Vite boilerplate files (e.g., `src/assets/react.svg`, `public/vite.svg`) if they exist.

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: clean up boilerplate and verify full dashboard"
```
