export function parseImgArray(html: string): string[] {
  const regex = /imgArray\[\d+\]\s*=\s*"([^"]+)"/g;
  const urls: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}
