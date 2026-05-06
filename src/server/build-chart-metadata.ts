import { getMiddayForecastHours } from "./midday-hours.js";
import type { ChartImage } from "./parse-img-array.js";

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

function runEpochSec(runId: string): number {
  const y = parseInt(runId.slice(0, 4), 10);
  const mo = parseInt(runId.slice(4, 6), 10) - 1;
  const d = parseInt(runId.slice(6, 8), 10);
  const h = parseInt(runId.slice(8, 10), 10);
  return Date.UTC(y, mo, d, h) / 1000;
}

function extractForecastHour(model: Model, url: string): number {
  if (model === "gfs") {
    const match = url.match(/\/(\d+)-\d+\.GIF/);
    return match ? parseInt(match[1], 10) : -1;
  }
  const match = url.match(/ecmwffr-\d+-(\d+)\.png/);
  if (match) return parseInt(match[1], 10);
  const legacyMatch = url.match(/ECM\d+-(\d+)\.GIF/);
  return legacyMatch ? parseInt(legacyMatch[1], 10) : -1;
}

function formatDateUtc(secondsSinceEpoch: number): string {
  const d = new Date(secondsSinceEpoch * 1000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function forecastDate(runId: string, forecastHour: number): string {
  if (!runId) return "";
  return formatDateUtc(runEpochSec(runId) + forecastHour * 3600);
}

function makeProxyUrl(originalUrl: string): string {
  const fullUrl = originalUrl.startsWith("http")
    ? originalUrl
    : `https://www.meteociel.fr${originalUrl}`;
  return `/api/image?url=${encodeURIComponent(fullUrl)}`;
}

export function buildChartMetadata(
  model: Model,
  images: ChartImage[],
  sourceUrl = "",
): ChartMetadata {
  const runId = extractRunId(images.map((i) => i.url));
  const runHour = runId ? parseInt(runId.slice(8, 10), 10) : 0;
  const runEpoch = runId ? runEpochSec(runId) : 0;

  const hasTimestamps =
    images.length > 0 && images.every((i) => i.validTimeUtcSec !== null);

  const charts: ChartEntry[] = [];

  if (hasTimestamps) {
    for (const img of images) {
      const validSec = img.validTimeUtcSec!;
      const validHourUtc = Math.floor(validSec / 3600) % 24;
      if (validHourUtc !== 12) continue;
      const hour = Math.round((validSec - runEpoch) / 3600);
      charts.push({
        hour,
        date: formatDateUtc(validSec),
        imageUrl: makeProxyUrl(img.url),
      });
    }
  } else {
    const middayHours = new Set(getMiddayForecastHours(model, runHour));
    const hourToUrl = new Map<number, string>();
    for (const img of images) {
      const h = extractForecastHour(model, img.url);
      if (h >= 0) hourToUrl.set(h, img.url);
    }
    for (const [hour, url] of hourToUrl) {
      if (middayHours.has(hour)) {
        charts.push({
          hour,
          date: forecastDate(runId, hour),
          imageUrl: makeProxyUrl(url),
        });
      }
    }
  }

  charts.sort((a, b) => a.hour - b.hour);

  return { model, run: runId, sourceUrl, charts };
}
