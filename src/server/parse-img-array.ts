export interface ChartImage {
  url: string;
  validTimeUtcSec: number | null;
}

export function parseChartImages(html: string): ChartImage[] {
  const urls = new Map<number, string>();
  const imgRe = /imgArray\[(\d+)\]\s*=\s*"([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = imgRe.exec(html)) !== null) {
    urls.set(parseInt(m[1], 10), m[2]);
  }

  const echValues = new Map<number, number>();
  const echRe = /echValues\[(\d+)\]\s*=\s*(\d+)/g;
  while ((m = echRe.exec(html)) !== null) {
    echValues.set(parseInt(m[1], 10), parseInt(m[2], 10));
  }

  const echDates = new Map<number, number>();
  const dateRe = /imgEchDate\[(\d+)\]\s*=\s*(\d+)/g;
  while ((m = dateRe.exec(html)) !== null) {
    echDates.set(parseInt(m[1], 10), parseInt(m[2], 10));
  }

  const indexes = Array.from(urls.keys()).sort((a, b) => a - b);
  return indexes.map((i) => {
    const url = urls.get(i)!;
    const ech = echValues.get(i);
    const validTimeUtcSec = ech !== undefined ? echDates.get(ech) ?? null : null;
    return { url, validTimeUtcSec };
  });
}
