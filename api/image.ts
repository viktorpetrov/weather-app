import type { VercelRequest, VercelResponse } from "@vercel/node";

const ALLOWED_HOSTS = [
  "www.meteociel.fr",
  "modeles2.meteociel.fr",
  "modeles3.meteociel.fr",
  "meteociel.fr",
];

function isAllowedUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    return ALLOWED_HOSTS.includes(parsed.hostname) && parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const imageUrl = req.query.url;

  if (typeof imageUrl !== "string" || !imageUrl) {
    return res.status(400).json({ error: "Missing url parameter" });
  }

  if (!isAllowedUrl(imageUrl)) {
    return res.status(403).json({ error: "URL not allowed" });
  }

  try {
    const response = await fetch(imageUrl, {
      headers: { Referer: "https://www.meteociel.fr/" },
    });

    if (!response.ok) {
      return res.status(response.status).end(`Upstream error: ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    res.setHeader("Content-Type", response.headers.get("content-type") || "image/gif");
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.status(200).send(buffer);
  } catch {
    return res.status(502).json({ error: "Failed to fetch image" });
  }
}
