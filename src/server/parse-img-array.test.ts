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
