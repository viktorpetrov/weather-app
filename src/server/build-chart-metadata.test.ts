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
      "/modeles/ecmwf/runs/2026022600/ECM0-0.GIF?26-12",
      "/modeles/ecmwf/runs/2026022600/ECM0-24.GIF?26-12",
      "/modeles/ecmwf/runs/2026022600/ECM0-48.GIF?26-12",
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
