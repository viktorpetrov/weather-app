import { describe, it, expect } from "vitest";
import { buildChartMetadata } from "./build-chart-metadata";
import type { ChartImage } from "./parse-img-array";

function noTs(urls: string[]): ChartImage[] {
  return urls.map((url) => ({ url, validTimeUtcSec: null }));
}

describe("buildChartMetadata", () => {
  it("builds GFS chart metadata from imgArray URLs (no timestamps)", () => {
    const images = noTs([
      "https://modeles2.meteociel.fr/modeles_gfs/runs/2026022600/3-778.GIF?26-6",
      "https://modeles2.meteociel.fr/modeles_gfs/runs/2026022600/6-778.GIF?26-6",
      "https://modeles2.meteociel.fr/modeles_gfs/runs/2026022600/9-778.GIF?26-6",
      "https://modeles2.meteociel.fr/modeles_gfs/runs/2026022600/12-778.GIF?26-6",
      "https://modeles2.meteociel.fr/modeles_gfs/runs/2026022600/15-778.GIF?26-6",
    ]);

    const result = buildChartMetadata("gfs", images);

    expect(result.model).toBe("gfs");
    expect(result.run).toBe("2026022600");
    expect(result.charts).toEqual([
      {
        hour: 12,
        date: "2026-02-26",
        imageUrl: "/api/image?url=https%3A%2F%2Fmodeles2.meteociel.fr%2Fmodeles_gfs%2Fruns%2F2026022600%2F12-778.GIF%3F26-6",
      },
    ]);
  });

  it("uses imgEchDate timestamps to pick midday-12-UTC frames (ECMWF)", () => {
    // 06Z run for 2026-05-06. Frames mix 06Z (hours <=144) and 00Z fallback (hours >=150).
    // Run epoch 06Z = 1778050800. Hour 6 valid 12 UTC = 1778072400.
    const images: ChartImage[] = [
      // 06Z + 1h = 07 UTC (skip)
      { url: "https://modeles3.meteociel.fr/modeles/ecmwf2/runs/2026050606/ecmwffr-19-1.png?6", validTimeUtcSec: 1778050800 },
      // 06Z + 6h = 12 UTC 2026-05-06 — KEEP, hour=6
      { url: "https://modeles3.meteociel.fr/modeles/ecmwf2/runs/2026050606/ecmwffr-19-6.png?6", validTimeUtcSec: 1778068800 },
      // 06Z + 30h = 12 UTC 2026-05-07 — KEEP, hour=30
      { url: "https://modeles3.meteociel.fr/modeles/ecmwf2/runs/2026050606/ecmwffr-19-30.png?6", validTimeUtcSec: 1778155200 },
      // 00Z fallback, file hour 150, valid 06 UTC 2026-05-12 (08:00 Brussels) — SKIP
      { url: "https://modeles3.meteociel.fr/modeles/ecmwf2/runs/2026050600/ecmwffr-19-150.png?0", validTimeUtcSec: 1778565600 },
      // 00Z fallback, file hour 156, valid 12 UTC 2026-05-12 — KEEP, hour relative to 06Z = 150
      { url: "https://modeles3.meteociel.fr/modeles/ecmwf2/runs/2026050600/ecmwffr-19-156.png?0", validTimeUtcSec: 1778587200 },
    ];

    const result = buildChartMetadata("ecmwf", images);

    expect(result.model).toBe("ecmwf");
    expect(result.run).toBe("2026050606");
    expect(result.charts).toEqual([
      {
        hour: 6,
        date: "2026-05-06",
        imageUrl: "/api/image?url=https%3A%2F%2Fmodeles3.meteociel.fr%2Fmodeles%2Fecmwf2%2Fruns%2F2026050606%2Fecmwffr-19-6.png%3F6",
      },
      {
        hour: 30,
        date: "2026-05-07",
        imageUrl: "/api/image?url=https%3A%2F%2Fmodeles3.meteociel.fr%2Fmodeles%2Fecmwf2%2Fruns%2F2026050606%2Fecmwffr-19-30.png%3F6",
      },
      {
        hour: 150,
        date: "2026-05-12",
        imageUrl: "/api/image?url=https%3A%2F%2Fmodeles3.meteociel.fr%2Fmodeles%2Fecmwf2%2Fruns%2F2026050600%2Fecmwffr-19-156.png%3F0",
      },
    ]);
  });

  it("returns empty charts when input is empty", () => {
    const result = buildChartMetadata("gfs", []);
    expect(result.charts).toEqual([]);
    expect(result.run).toBe("");
  });
});
