import sharp from "sharp";

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Bungkus judul menjadi beberapa baris berdasarkan perkiraan lebar karakter. */
const wrap = (value: string, maxChars: number): string[] => {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = (line + " " + word).trim();
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 5);
};

type CoverOpts = { title: string; author: string; bg: string; accent: string; seriesLabel?: string };

/**
 * Sampul contoh 600×900 dibuat dari SVG lewat sharp. Hanya untuk data contoh lokal;
 * sampul asli diunggah admin lewat panel.
 */
export const makeCover = async ({ title, author, bg, accent, seriesLabel }: CoverOpts): Promise<Buffer> => {
  const lines = wrap(title, 16);
  const titleSvg = lines
    .map(
      (l, i) =>
        `<text x="56" y="${300 + i * 62}" font-family="Georgia, 'Times New Roman', serif" font-size="52" font-weight="700" fill="#ffffff">${escapeXml(l)}</text>`,
    )
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
  <rect width="600" height="900" fill="${bg}"/>
  <rect x="56" y="150" width="96" height="10" fill="${accent}"/>
  ${seriesLabel ? `<text x="56" y="130" font-family="Arial, Helvetica, sans-serif" font-size="20" letter-spacing="3" fill="${accent}">${escapeXml(seriesLabel.toUpperCase())}</text>` : ""}
  ${titleSvg}
  <text x="56" y="${320 + lines.length * 62 + 30}" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="#e5e7eb">${escapeXml(author)}</text>
  <rect x="56" y="812" width="488" height="1.5" fill="#ffffff" fill-opacity="0.35"/>
  <text x="56" y="852" font-family="Arial, Helvetica, sans-serif" font-size="18" letter-spacing="4" fill="#ffffff" fill-opacity="0.85">YAYASAN POPULI INDONESIA</text>
</svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
};
