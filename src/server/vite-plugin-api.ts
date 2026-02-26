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
