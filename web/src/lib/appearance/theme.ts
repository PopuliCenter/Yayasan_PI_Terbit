/**
 * Tema warna situs dari global Tampilan -> blok CSS variabel.
 *
 * Cara kerja penyuntikan (lihat juga app/(site)/layout.tsx):
 * - Tailwind v4 menaruh token di `@layer theme` (:root,:host) dan globals.css menimpanya untuk
 *   mode gelap di `@layer base` (:root[data-theme="dark"]).
 * - CSS dari fungsi ini dirender sebagai <style id="tema-situs"> TANPA @layer. Gaya tanpa layer
 *   selalu menang atas gaya ber-layer, apa pun urutan dan spesifisitasnya.
 * - Karena itu blok terang (:root) WAJIB berpasangan dengan blok gelap (:root[data-theme="dark"])
 *   yang memuat kunci yang SAMA. Kalau hanya blok terang yang disuntik, nilai terang ikut
 *   menimpa mode gelap (sudah dibuktikan di Chromium). Di dalam blok tanpa layer, selektor gelap
 *   (spesifisitas 0,2,0) menang atas :root (0,1,0) saat data-theme="dark".
 * - Palet bawaan tanpa aksen kustom menghasilkan string kosong: HTML identik dengan sebelum fitur ini.
 */
import { hexToOklch, isHex, normalizeHex, minContrast, nearestPassing, oklchToHex, type Hex } from "./color";
import {
  DARK_BACKGROUNDS,
  DEFAULT_PRESET,
  isPresetKey,
  LIGHT_BACKGROUNDS,
  PRESETS,
  THEMABLE_KEYS,
  type PresetKey,
  type ThemableKey,
  type TokenMap,
} from "./presets";

export const THEME_STYLE_ID = "tema-situs";

/** Teks biasa (WCAG 1.4.3). Teks aksen dipakai untuk penanda wajib isi, lencana, garis fokus. */
export const TEXT_MIN = 4.5;

export type ThemeInput = {
  preset?: unknown;
  customAccent?: unknown;
  accentLight?: unknown;
  accentDark?: unknown;
} | null | undefined;

export type AccentCheck =
  | { ok: true; hex: Hex; ratio: number }
  | { ok: false; reason: "format" }
  | { ok: false; reason: "contrast"; hex: Hex; ratio: number; suggestion: Hex };

/** Cek satu warna aksen terhadap semua latar suatu mode. Dipakai validasi Payload dan panel pratinjau. */
export const checkAccent = (value: unknown, mode: "light" | "dark"): AccentCheck => {
  const hex = normalizeHex(value);
  if (!hex) return { ok: false, reason: "format" };
  const backgrounds = mode === "light" ? LIGHT_BACKGROUNDS : DARK_BACKGROUNDS;
  const ratio = minContrast(hex, backgrounds);
  if (ratio >= TEXT_MIN) return { ok: true, hex, ratio };
  return {
    ok: false,
    reason: "contrast",
    hex,
    ratio,
    suggestion: nearestPassing(hex, backgrounds, TEXT_MIN, mode === "light" ? "darker" : "lighter"),
  };
};

// Profil lightness/kroma relatif skala aksen bawaan (OKLCH), dipakai untuk menurunkan tint.
const LIGHT_L = { 50: 0.982, 100: 0.956, 200: 0.907, 300: 0.845, 400: 0.779, 500: 0.72, 600: 0.657 } as const;
const LIGHT_C = { 50: 0.1, 100: 0.28, 200: 0.54, 300: 0.82, 400: 0.97, 500: 1.08, 600: 1.1 } as const;
const DARK_L = { 50: 0.235, 100: 0.283, 200: 0.381 } as const;
const DARK_C = { 50: 0.23, 100: 0.3, 200: 0.46 } as const;

type AccentTokens = Pick<TokenMap, Extract<ThemableKey, `accent-${string}`> | "focus">;

/**
 * Turunkan seluruh token aksen (kedua mode) dari warna aksen admin.
 * - accent-700 (teks/penanda) dan focus = warna admin (terang) / warna gelap admin atau turunannya.
 * - accent-800 digelapkan (terang) / diterangkan (gelap) sampai >= 4,5:1 terhadap accent-100 (lencana).
 * - accent-50..200 = tint pucat (terang) / gelap (mode gelap) dengan hue yang sama.
 * - accent-300..600 di mode gelap = nilai terang, sama seperti globals.css hari ini.
 * Mengembalikan null bila masukan tidak lolos; pemanggil lalu memakai aksen palet.
 */
export const deriveAccent = (accentLight: unknown, accentDark: unknown): { light: AccentTokens; dark: AccentTokens } | null => {
  const l = checkAccent(accentLight, "light");
  if (!l.ok) return null;
  const seed = hexToOklch(l.hex);
  const chroma = Math.min(seed.c, 0.17);
  const light = {} as AccentTokens;
  for (const step of [50, 100, 200, 300, 400, 500, 600] as const) {
    light[`accent-${step}`] = oklchToHex({ l: LIGHT_L[step], c: chroma * LIGHT_C[step], h: seed.h });
  }
  light["accent-700"] = l.hex;
  light["accent-800"] = nearestPassing(
    oklchToHex({ l: Math.max(0, seed.l - 0.08), c: seed.c * 0.85, h: seed.h }),
    [light["accent-100"]],
    TEXT_MIN,
    "darker",
  );
  light.focus = l.hex;

  let darkHex: Hex;
  if (accentDark !== undefined && accentDark !== null && accentDark !== "") {
    const d = checkAccent(accentDark, "dark");
    if (!d.ok) return null;
    darkHex = d.hex;
  } else {
    darkHex = nearestPassing(
      oklchToHex({ l: Math.max(seed.l, 0.78), c: seed.c * 0.9, h: seed.h }),
      DARK_BACKGROUNDS,
      TEXT_MIN,
      "lighter",
    );
  }
  const d = hexToOklch(darkHex);
  const dark = { ...light };
  for (const step of [50, 100, 200] as const) {
    dark[`accent-${step}`] = oklchToHex({ l: DARK_L[step], c: Math.min(d.c, 0.15) * DARK_C[step], h: d.h });
  }
  dark["accent-700"] = darkHex;
  dark["accent-800"] = nearestPassing(
    oklchToHex({ l: Math.min(0.95, d.l + 0.1), c: d.c * 0.6, h: d.h }),
    [dark["accent-100"]],
    TEXT_MIN,
    "lighter",
  );
  dark.focus = darkHex;
  return { light, dark };
};

export type ResolvedTheme = {
  preset: PresetKey;
  /** Aksen kustom dipakai (lolos validasi). False bila kustom dimatikan atau datanya tidak sah. */
  customAccentApplied: boolean;
  light: TokenMap;
  dark: TokenMap;
  /** Blok CSS siap suntik; "" untuk palet bawaan tanpa aksen kustom. */
  css: string;
};

const declarations = (tokens: TokenMap) =>
  THEMABLE_KEYS.filter((key) => isHex(tokens[key]))
    .map((key) => `--color-${key}:${tokens[key]}`)
    .join(";");

/**
 * Satu-satunya pembuat CSS tema. Nilainya hanya kunci dari THEMABLE_KEYS dan hex yang lolos
 * regex, jadi teks admin tidak pernah masuk ke <style> (tidak bisa menutup tag atau menyisipkan aturan).
 */
export const buildThemeCss = (light: TokenMap, dark: TokenMap): string =>
  `:root{${declarations(light)}}:root[data-theme="dark"]{${declarations(dark)}}`;

/** Masukan global (boleh kosong/rusak) -> tema yang berlaku. Tidak pernah melempar. */
export const resolveTheme = (input: ThemeInput): ResolvedTheme => {
  const preset: PresetKey = isPresetKey(input?.preset) ? input.preset : DEFAULT_PRESET;
  const base = PRESETS[preset];
  const accent = input?.customAccent === true ? deriveAccent(input.accentLight, input.accentDark) : null;
  const light: TokenMap = accent ? { ...base.light, ...accent.light } : base.light;
  const dark: TokenMap = accent ? { ...base.dark, ...accent.dark } : base.dark;
  const isDefault = preset === DEFAULT_PRESET && !accent;
  return { preset, customAccentApplied: Boolean(accent), light, dark, css: isDefault ? "" : buildThemeCss(light, dark) };
};
