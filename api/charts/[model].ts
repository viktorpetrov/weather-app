import type { VercelRequest, VercelResponse } from "@vercel/node";
import { parseImgArray } from "../../src/server/parse-img-array.js";
import { buildChartMetadata } from "../../src/server/build-chart-metadata.js";

type Model = "gfs" | "ecmwf";

const MODEL_PAGES: Record<Model, string> = {
  gfs: "https://www.meteociel.fr/modeles/index.php?carte=778",
  ecmwf: "https://www.meteociel.fr/modeles/ecmwf_hres.php?ech=3&mode=30&carte=2",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { model } = req.query;

  if (typeof model !== "string" || !(model in MODEL_PAGES)) {
    return res.status(400).json({ error: "Invalid model. Use gfs or ecmwf." });
  }

  const m = model as Model;

  try {
    const pageUrl = MODEL_PAGES[m];
    const response = await fetch(pageUrl, {
      headers: { Referer: "https://www.meteociel.fr/" },
    });

    if (!response.ok) {
      return res.status(502).json({ error: `Meteociel returned ${response.status}` });
    }

    const html = await response.text();
    const imgUrls = parseImgArray(html);
    const metadata = buildChartMetadata(m, imgUrls, pageUrl);

    res.setHeader("Cache-Control", "public, max-age=1800");
    return res.status(200).json(metadata);
  } catch {
    return res.status(502).json({ error: "Failed to fetch chart data" });
  }
}
