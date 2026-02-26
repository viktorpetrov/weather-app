import { describe, it, expect } from "vitest";
import { getMiddayForecastHours } from "./midday-hours";

describe("getMiddayForecastHours", () => {
  describe("GFS", () => {
    it("returns midday hours for 00Z run", () => {
      const hours = getMiddayForecastHours("gfs", 0);
      expect(hours).toEqual([12, 36, 60, 84, 108, 132, 156, 180, 204, 228]);
    });

    it("returns midday hours for 06Z run", () => {
      const hours = getMiddayForecastHours("gfs", 6);
      expect(hours).toEqual([6, 30, 54, 78, 102, 126, 150, 174, 198, 222]);
    });

    it("returns midday hours for 12Z run", () => {
      const hours = getMiddayForecastHours("gfs", 12);
      expect(hours).toEqual([0, 24, 48, 72, 96, 120, 144, 168, 192, 216, 240]);
    });

    it("returns midday hours for 18Z run", () => {
      const hours = getMiddayForecastHours("gfs", 18);
      expect(hours).toEqual([18, 42, 66, 90, 114, 138, 162, 186, 210, 234]);
    });
  });

  describe("ECMWF", () => {
    it("returns all available steps for 00Z run (24h interval)", () => {
      const hours = getMiddayForecastHours("ecmwf", 0);
      expect(hours).toEqual([0, 24, 48, 72, 96, 120, 144, 168, 192, 216, 240]);
    });

    it("returns all available steps for 12Z run", () => {
      const hours = getMiddayForecastHours("ecmwf", 12);
      expect(hours).toEqual([0, 24, 48, 72, 96, 120, 144, 168, 192, 216, 240]);
    });
  });
});
