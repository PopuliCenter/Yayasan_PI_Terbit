/**
 * Palet warna siap pakai untuk global Tampilan. DIHASILKAN dan DIVERIFIKASI oleh uji
 * theme.test.ts: setiap pasangan teks/latar >= 4,5:1 dan garis fokus/batas kontrol >= 3:1
 * (WCAG 2.1 AA) di mode terang dan gelap. Kunci tiap mode HARUS sama (lihat theme.ts).
 *
 * Kertas, permukaan, garis, teks badan, dan warna status TIDAK termasuk palet: semuanya
 * tetap dari globals.css agar identitas "kertas" situs tidak berubah dan meta theme-color
 * tetap benar. "navy" sama persis dengan globals.css (diuji), jadi tidak menyuntikkan CSS.
 */
import type { Hex } from "./color";

export const THEMABLE_KEYS = [
  "primary-50", "primary-100", "primary-200", "primary-300", "primary-400", "primary-500", "primary-600", "primary-700", "primary-800", "primary-900", "primary-950",
  "accent-50", "accent-100", "accent-200", "accent-300", "accent-400", "accent-500", "accent-600", "accent-700", "accent-800",
  "ink", "focus",
] as const;
export type ThemableKey = (typeof THEMABLE_KEYS)[number];
export type TokenMap = Record<ThemableKey, Hex>;
export type Preset = { label: string; description: string; light: TokenMap; dark: TokenMap };

export const DEFAULT_PRESET = "navy";

export const PRESETS = {
  navy: {
    label: "Navy & jingga (bawaan)",
    description: "Biru tua dengan aksen jingga, sama dengan logo.",
    light: { "primary-50": "#eef4fb", "primary-100": "#d6e4f5", "primary-200": "#aecae9", "primary-300": "#7ba6d8", "primary-400": "#4d80c4", "primary-500": "#2f63ab", "primary-600": "#234e8c", "primary-700": "#1c3f72", "primary-800": "#16315a", "primary-900": "#0f2342", "primary-950": "#08172e", "accent-50": "#fff8ed", "accent-100": "#feefd0", "accent-200": "#fcdca0", "accent-300": "#f9c265", "accent-400": "#f6a23a", "accent-500": "#f08519", "accent-600": "#e16a0f", "accent-700": "#b34a0f", "accent-800": "#953f15", "ink": "#0f2342", "focus": "#b34a0f" },
    dark: { "primary-50": "#16233a", "primary-100": "#1c2c47", "primary-200": "#34507a", "primary-300": "#4b6c9c", "primary-400": "#6a8ec4", "primary-500": "#80a3d6", "primary-600": "#95b5e2", "primary-700": "#abc6ee", "primary-800": "#c6d9f5", "primary-900": "#dde8f8", "primary-950": "#eef4fb", "accent-50": "#2a1a0c", "accent-100": "#3a240f", "accent-200": "#5c3a14", "accent-300": "#f9c265", "accent-400": "#f6a23a", "accent-500": "#f08519", "accent-600": "#e16a0f", "accent-700": "#f6a54c", "accent-800": "#fcd49a", "ink": "#efebe3", "focus": "#f6a54c" },
  },
  hijau: {
    label: "Hijau hutan & jingga",
    description: "Hijau tua yang tenang, aksen jingga.",
    light: { "primary-50": "#eff5f1", "primary-100": "#d8e7dc", "primary-200": "#b3cfbc", "primary-300": "#82af91", "primary-400": "#508e67", "primary-500": "#2e744b", "primary-600": "#205d3a", "primary-700": "#1a4b2e", "primary-800": "#143b24", "primary-900": "#0d2a19", "primary-950": "#071c10", "accent-50": "#fff8ed", "accent-100": "#feefd0", "accent-200": "#fcdca0", "accent-300": "#f9c265", "accent-400": "#f6a23a", "accent-500": "#f08519", "accent-600": "#e16a0f", "accent-700": "#b34a0f", "accent-800": "#953f15", "ink": "#0d2a19", "focus": "#b34a0f" },
    dark: { "primary-50": "#13291b", "primary-100": "#193323", "primary-200": "#325a40", "primary-300": "#4a775a", "primary-400": "#689a79", "primary-500": "#7fae8f", "primary-600": "#96bea3", "primary-700": "#abceb6", "primary-800": "#c6dfce", "primary-900": "#ddebe1", "primary-950": "#eff5f1", "accent-50": "#2a1a0c", "accent-100": "#3a240f", "accent-200": "#5c3a14", "accent-300": "#f9c265", "accent-400": "#f6a23a", "accent-500": "#f08519", "accent-600": "#e16a0f", "accent-700": "#f6a54c", "accent-800": "#fcd49a", "ink": "#efebe3", "focus": "#f6a54c" },
  },
  petrol: {
    label: "Biru petrol & jingga",
    description: "Biru kehijauan, aksen jingga.",
    light: { "primary-50": "#edf5f7", "primary-100": "#d4e6ec", "primary-200": "#abced9", "primary-300": "#73adbf", "primary-400": "#358ba3", "primary-500": "#006f88", "primary-600": "#00596d", "primary-700": "#004858", "primary-800": "#003846", "primary-900": "#002933", "primary-950": "#001b23", "accent-50": "#fff8ed", "accent-100": "#feefd0", "accent-200": "#fcdca0", "accent-300": "#f9c265", "accent-400": "#f6a23a", "accent-500": "#f08519", "accent-600": "#e16a0f", "accent-700": "#b34a0f", "accent-800": "#953f15", "ink": "#002933", "focus": "#b34a0f" },
    dark: { "primary-50": "#0a2730", "primary-100": "#0e313b", "primary-200": "#215767", "primary-300": "#387486", "primary-400": "#5697ab", "primary-500": "#70acbf", "primary-600": "#89bccd", "primary-700": "#a0cddb", "primary-800": "#bfdde8", "primary-900": "#d9eaf0", "primary-950": "#edf5f8", "accent-50": "#2a1a0c", "accent-100": "#3a240f", "accent-200": "#5c3a14", "accent-300": "#f9c265", "accent-400": "#f6a23a", "accent-500": "#f08519", "accent-600": "#e16a0f", "accent-700": "#f6a54c", "accent-800": "#fcd49a", "ink": "#efebe3", "focus": "#f6a54c" },
  },
  marun: {
    label: "Marun & oker",
    description: "Merah tua dengan aksen kuning tanah.",
    light: { "primary-50": "#faf1f1", "primary-100": "#f3dcdc", "primary-200": "#e5bbbb", "primary-300": "#cf8f90", "primary-400": "#b56366", "primary-500": "#9a444a", "primary-600": "#7d3439", "primary-700": "#662a2e", "primary-800": "#502024", "primary-900": "#3b1619", "primary-950": "#290e0f", "accent-50": "#fff8f0", "accent-100": "#ffeddb", "accent-200": "#ffd9b1", "accent-300": "#ffbe75", "accent-400": "#f2a443", "accent-500": "#e48e00", "accent-600": "#ca7d00", "accent-700": "#9b5f00", "accent-800": "#834f00", "ink": "#3b1619", "focus": "#9b5f00" },
    dark: { "primary-50": "#331c1c", "primary-100": "#3f2324", "primary-200": "#6e4143", "primary-300": "#8e5b5c", "primary-400": "#b57b7c", "primary-500": "#c89091", "primary-600": "#d6a4a5", "primary-700": "#e4b8b8", "primary-800": "#eecfcf", "primary-900": "#f4e2e2", "primary-950": "#f9f1f1", "accent-50": "#281b0c", "accent-100": "#38250f", "accent-200": "#5a3b16", "accent-300": "#ffbe75", "accent-400": "#f2a443", "accent-500": "#e48e00", "accent-600": "#ca7d00", "accent-700": "#f1a851", "accent-800": "#ffd2a2", "ink": "#efebe3", "focus": "#f1a851" },
  },
  grafit: {
    label: "Grafit & jingga",
    description: "Abu-abu gelap nyaris netral, aksen jingga.",
    light: { "primary-50": "#f2f3f5", "primary-100": "#e0e3e6", "primary-200": "#c2c7ce", "primary-300": "#9ba3af", "primary-400": "#75808e", "primary-500": "#596574", "primary-600": "#46505d", "primary-700": "#38414b", "primary-800": "#2c323b", "primary-900": "#1f242a", "primary-950": "#14181c", "accent-50": "#fff8ed", "accent-100": "#feefd0", "accent-200": "#fcdca0", "accent-300": "#f9c265", "accent-400": "#f6a23a", "accent-500": "#f08519", "accent-600": "#e16a0f", "accent-700": "#b34a0f", "accent-800": "#953f15", "ink": "#1f242a", "focus": "#b34a0f" },
    dark: { "primary-50": "#1f242a", "primary-100": "#272d34", "primary-200": "#47505d", "primary-300": "#616c7a", "primary-400": "#828e9e", "primary-500": "#97a2b1", "primary-600": "#aab4c1", "primary-700": "#bcc5d1", "primary-800": "#d2d8e0", "primary-900": "#e4e7ec", "primary-950": "#f2f3f6", "accent-50": "#2a1a0c", "accent-100": "#3a240f", "accent-200": "#5c3a14", "accent-300": "#f9c265", "accent-400": "#f6a23a", "accent-500": "#f08519", "accent-600": "#e16a0f", "accent-700": "#f6a54c", "accent-800": "#fcd49a", "ink": "#efebe3", "focus": "#f6a54c" },
  },
} satisfies Record<string, Preset>;

export type PresetKey = keyof typeof PRESETS;
export const isPresetKey = (v: unknown): v is PresetKey => typeof v === "string" && Object.hasOwn(PRESETS, v);

/** Latar netral (tetap, dari globals.css) yang dipakai untuk validasi kontras. */
export const NEUTRALS = {
  light: { paper: "#faf8f4", "paper-2": "#f2eee6", surface: "#ffffff" },
  dark: { paper: "#13171e", "paper-2": "#1a1f28", surface: "#1d232d" },
} as const satisfies Record<"light" | "dark", Record<string, Hex>>;
export const LIGHT_BACKGROUNDS: readonly Hex[] = Object.values(NEUTRALS.light);
export const DARK_BACKGROUNDS: readonly Hex[] = Object.values(NEUTRALS.dark);
