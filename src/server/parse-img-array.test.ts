import { describe, it, expect } from "vitest";
import { parseChartImages } from "./parse-img-array";

describe("parseChartImages", () => {
  it("parses GFS imgArray with no timestamps", () => {
    const html = `
      <script>
      var imgArray = new Array();
      imgArray[0] = "https://modeles2.meteociel.fr/modeles_gfs/runs/2026022606/3-778.GIF?26-6";
      imgArray[1] = "https://modeles2.meteociel.fr/modeles_gfs/runs/2026022606/6-778.GIF?26-6";
      </script>
    `;
    const result = parseChartImages(html);
    expect(result).toEqual([
      { url: "https://modeles2.meteociel.fr/modeles_gfs/runs/2026022606/3-778.GIF?26-6", validTimeUtcSec: null },
      { url: "https://modeles2.meteociel.fr/modeles_gfs/runs/2026022606/6-778.GIF?26-6", validTimeUtcSec: null },
    ]);
  });

  it("parses ECMWF imgArray with echValues + imgEchDate timestamps", () => {
    const html = `
      <script>
      imgArray[0] = "https://modeles3.meteociel.fr/modeles/ecmwf2/runs/2026050606/ecmwffr-19-1.png?6";
      echValues[0] = 1;
      imgEchDate[1]= 1778050800;
      imgArray[1] = "https://modeles3.meteociel.fr/modeles/ecmwf2/runs/2026050600/ecmwffr-19-150.png?0";
      echValues[1] = 150;
      imgEchDate[150]= 1778565600;
      </script>
    `;
    const result = parseChartImages(html);
    expect(result).toEqual([
      { url: "https://modeles3.meteociel.fr/modeles/ecmwf2/runs/2026050606/ecmwffr-19-1.png?6", validTimeUtcSec: 1778050800 },
      { url: "https://modeles3.meteociel.fr/modeles/ecmwf2/runs/2026050600/ecmwffr-19-150.png?0", validTimeUtcSec: 1778565600 },
    ]);
  });

  it("returns empty array when no imgArray found", () => {
    const html = "<html><body>No charts here</body></html>";
    const result = parseChartImages(html);
    expect(result).toEqual([]);
  });
});
