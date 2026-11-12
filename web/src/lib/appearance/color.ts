/**
 * Matematika warna untuk tema situs: kontras WCAG 2.x dan ruang warna OKLCH.
 * Murni (tanpa dependensi, tanpa akses server) sehingga dipakai bersama oleh
 * validasi Payload (server), resolver tema (server), panel pratinjau admin (klien),
 * dan jembatan Live Preview (klien).
 */

export type Hex = `#${string}`;

const HEX_RE = /^#[0-9a-f]{6}$/;

/** Normalkan masukan admin: huruf kecil, boleh tanpa "#", boleh 3 digit. Selain itu null. */
export const normalizeHex = (value: unknown): Hex | null => {
  if (typeof value !== "string") return null;
  let s = value.trim().toLowerCase();
  if (s.startsWith("#")) s = s.slice(1);
  if (/^[0-9a-f]{3}$/.test(s)) s = s.split("").map((c) => c + c).join("");
  s = `#${s}`;
  return HEX_RE.test(s) ? (s as Hex) : null;
};

export const isHex = (value: unknown): value is Hex => typeof value === "string" && HEX_RE.test(value);

type Rgb = [number, number, number];

const hexToRgb = (hex: Hex): Rgb => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as Rgb;
const rgbToHex = (rgb: number[]): Hex =>
  `#${rgb.map((c) => Math.round(Math.min(1, Math.max(0, c)) * 255).toString(16).padStart(2, "0")).join("")}` as Hex;

/** sRGB (0..1, gamma) -> linear, ambang 0.04045 sesuai IEC 61966-2-1 (WCAG 2.2 memakai nilai ini). */
const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

/** Luminans relatif WCAG: L = 0.2126 R + 0.7152 G + 0.0722 B (kanal linear). */
export const relativeLuminance = (hex: Hex): number => {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** Rasio kontras WCAG: (L terang + 0.05) / (L gelap + 0.05), rentang 1..21. */
export const contrastRatio = (a: Hex, b: Hex): number => {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

export const minContrast = (fg: Hex, backgrounds: readonly Hex[]): number =>
  Math.min(...backgrounds.map((bg) => contrastRatio(fg, bg)));

/* ------------------------------ OKLab / OKLCH ------------------------------ */
/* Matriks dari Björn Ottosson, "A perceptual color space for image processing" (2020). */

const linearToOklab = ([r, g, b]: Rgb): Rgb => {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
};

const oklabToLinear = ([L, a, b]: Rgb): Rgb => {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
};

export type Oklch = { l: number; c: number; h: number };

export const hexToOklch = (hex: Hex): Oklch => {
  const [L, a, b] = linearToOklab(hexToRgb(hex).map(toLinear) as Rgb);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: L, c: Math.hypot(a, b), h };
};

const inGamut = (rgb: Rgb) => rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4);

/** OKLCH -> hex. Bila di luar gamut sRGB, kroma diturunkan (pencarian biner) dengan L dan h tetap. */
export const oklchToHex = ({ l, c, h }: Oklch): Hex => {
  const rad = (h * Math.PI) / 180;
  const lab = (chroma: number): Rgb => [l, chroma * Math.cos(rad), chroma * Math.sin(rad)];
  let chroma = c;
  if (!inGamut(oklabToLinear(lab(chroma)))) {
    let lo = 0;
    let hi = c;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklabToLinear(lab(mid)))) lo = mid;
      else hi = mid;
    }
    chroma = lo;
  }
  return rgbToHex(oklabToLinear(lab(chroma)).map(fromLinear));
};

/**
 * Warna terdekat yang lolos kontras: hue dan kroma dipertahankan, lightness OKLCH digeser
 * 0,005 per langkah ke arah gelap (untuk teks di latar terang) atau terang (latar gelap)
 * sampai kontras >= target terhadap SEMUA latar. Selalu berhenti: hitam/putih pasti lolos 4,5:1
 * terhadap latar situs (kertas terang >= 0,95 L, kertas gelap <= 0,26 L).
 */
export const nearestPassing = (
  hex: Hex,
  backgrounds: readonly Hex[],
  target: number,
  direction: "darker" | "lighter",
): Hex => {
  if (minContrast(hex, backgrounds) >= target) return hex;
  const { l, c, h } = hexToOklch(hex);
  const step = direction === "darker" ? -0.005 : 0.005;
  for (let next = l + step; next >= 0 && next <= 1; next += step) {
    const candidate = oklchToHex({ l: next, c, h });
    if (minContrast(candidate, backgrounds) >= target) return candidate;
  }
  return direction === "darker" ? "#000000" : "#ffffff";
};

/** Format rasio untuk pesan admin: 4.28 -> "4,28". */
export const formatRatio = (ratio: number) => (Math.floor(ratio * 100) / 100).toFixed(2).replace(".", ",");
