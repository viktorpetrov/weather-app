import { getMiddayForecastHours } from "./midday-hours.js";

type Model = "gfs" | "ecmwf";

interface ChartEntry {
  hour: number;
  date: string;
  imageUrl: string;
}

interface ChartMetadata {
  model: string;
  run: string;
  sourceUrl: string;
  charts: ChartEntry[];
}

function extractRunId(urls: string[]): string {
  if (urls.length === 0) return "";
  const url = urls[0];
  const match = url.match(/runs\/(\d{10})\//);
  return match ? match[1] : "";
}

function extractForecastHour(model: Model, url: string): number {
  if (model === "gfs") {
    // Pattern: /runs/YYYYMMDDHH/HOUR-778.GIF
    const match = url.match(/\/(\d+)-\d+\.GIF/);
    return match ? parseInt(match[1], 10) : -1;
  }
  // ECMWF HRES pattern: ecmwffr-{mode}-HOUR.png
  const match = url.match(/ecmwffr-\d+-(\d+)\.png/);
  if (match) return parseInt(match[1], 10);
  // Legacy ECMWF pattern: ECM{mode}-HOUR.GIF
  const legacyMatch = url.match(/ECM\d+-(\d+)\.GIF/);
  return legacyMatch ? parseInt(legacyMatch[1], 10) : -1;
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

function makeProxyUrl(originalUrl: string): string {
  const fullUrl = originalUrl.startsWith("http")
    ? originalUrl
    : `https://www.meteociel.fr${originalUrl}`;
  return `/api/image?url=${encodeURIComponent(fullUrl)}`;
}

export function buildChartMetadata(model: Model, imgUrls: string[], sourceUrl = ""): ChartMetadata {
  const runId = extractRunId(imgUrls);
  const runHour = runId ? parseInt(runId.slice(8, 10), 10) : 0;
  const middayHours = new Set(getMiddayForecastHours(model, runHour));

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
        imageUrl: makeProxyUrl(url),
      });
    }
  }

  charts.sort((a, b) => a.hour - b.hour);

  return { model, run: runId, sourceUrl, charts };
}
