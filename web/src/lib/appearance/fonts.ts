/**
 * Huruf situs dari global Tampilan -> variabel CSS per peran.
 *
 * Modul murni: TIDAK boleh mengimpor next/font. Di luar transformasi Next (Payload CLI,
 * generate:types, uji tsx) next/font/google hanya stub kosong. Pemanggilan next/font ada di
 * app/fonts.ts dan diuji sinkron dengan registri ini (fonts.test.ts).
 *
 * Cara kerja:
 * - globals.css mendeklarasikan peran di `@theme static`: --font-judul, --font-isi,
 *   --font-header, --font-footer (dua terakhir = var(--font-isi)). font-sans/font-serif
 *   Tailwind hanya alias ke --font-isi/--font-judul.
 * - Pilihan admin dibuat ulang di sini menjadi `:root{--font-judul:var(--font-lora), ...}` dan
 *   ikut disuntik bersama CSS warna di <style id="tema-situs"> (tanpa layer, jadi menang).
 * - Nilai CSS hanya diambil dari registri FONTS lewat whitelist Object.hasOwn: teks admin tidak
 *   pernah masuk ke <style>.
 * - Kelas variabel next/font WAJIB ada di <html>: peran dideklarasikan di :root dan merujuk
 *   var(--font-<kunci>). Bila kelasnya di <body>, nilai di :root tidak sah dan teks jatuh ke
 *   huruf bawaan peramban.
 */

export type FontKind = "sans" | "serif";
export type FontDef = {
  /** Nama keluarga di Google Fonts (= nama fungsi next/font dengan spasi -> garis bawah). */
  label: string;
  kind: FontKind;
  /** Variabel CSS dari opsi `variable` next/font (app/fonts.ts). */
  cssVar: string;
};

/** Urutan registri = urutan pilihan di admin dan urutan kelas di <html> (sans dulu, lalu serif). */
export const FONTS = {
  inter: { label: "Inter", kind: "sans", cssVar: "--font-inter" },
  "plus-jakarta-sans": { label: "Plus Jakarta Sans", kind: "sans", cssVar: "--font-plus-jakarta-sans" },
  "ibm-plex-sans": { label: "IBM Plex Sans", kind: "sans", cssVar: "--font-ibm-plex-sans" },
  "work-sans": { label: "Work Sans", kind: "sans", cssVar: "--font-work-sans" },
  "public-sans": { label: "Public Sans", kind: "sans", cssVar: "--font-public-sans" },
  "source-serif-4": { label: "Source Serif 4", kind: "serif", cssVar: "--font-source-serif" },
  lora: { label: "Lora", kind: "serif", cssVar: "--font-lora" },
  merriweather: { label: "Merriweather", kind: "serif", cssVar: "--font-merriweather" },
  literata: { label: "Literata", kind: "serif", cssVar: "--font-literata" },
  "noto-serif": { label: "Noto Serif", kind: "serif", cssVar: "--font-noto-serif" },
} as const satisfies Record<string, FontDef>;

export type FontKey = keyof typeof FONTS;
export const FONT_KEYS = Object.keys(FONTS) as FontKey[];

/** Nilai header/footer yang mengikuti huruf isi. */
export const FOLLOW_BODY = "ikut-isi";
export type FontChoice = FontKey | typeof FOLLOW_BODY;

/** Tampilan sebelum fitur ini: Source Serif 4 untuk judul, Inter untuk lainnya. */
export const DEFAULT_FONTS = {
  headingFont: "source-serif-4",
  bodyFont: "inter",
  headerFont: FOLLOW_BODY,
  footerFont: FOLLOW_BODY,
} as const satisfies Record<string, FontChoice>;

export const isFontKey = (v: unknown): v is FontKey => typeof v === "string" && Object.hasOwn(FONTS, v);

const FALLBACK: Record<FontKind, string> = {
  sans: "ui-sans-serif, system-ui, sans-serif",
  serif: "Georgia, Cambria, serif",
};

/** Nilai font-family satu huruf. Untuk bawaan sama persis dengan globals.css (diuji). */
export const fontStack = (key: FontKey): string => `var(${FONTS[key].cssVar}), ${FALLBACK[FONTS[key].kind]}`;

const KIND_LABEL: Record<FontKind, string> = { sans: "sans-serif", serif: "serif" };

/** Label pilihan di admin, mis. "Lora — serif". */
export const fontOptionLabel = (key: FontKey): string => `${FONTS[key].label} — ${KIND_LABEL[FONTS[key].kind]}`;

export type FontsInput = {
  headingFont?: unknown;
  bodyFont?: unknown;
  headerFont?: unknown;
  footerFont?: unknown;
} | null | undefined;

export type ResolvedFonts = {
  heading: FontKey;
  body: FontKey;
  /** Huruf yang benar-benar dipakai header/footer (huruf isi bila mengikuti isi). */
  header: FontKey;
  footer: FontKey;
  headerFollowsBody: boolean;
  footerFollowsBody: boolean;
  /** Huruf yang dipakai, unik, urut registri. Bawaan: ["inter", "source-serif-4"]. */
  used: FontKey[];
  /** Blok CSS siap suntik; "" bila semua peran bawaan. */
  css: string;
};

/** Masukan global (boleh kosong/rusak) -> huruf yang berlaku. Tidak pernah melempar. */
export const resolveFonts = (input: FontsInput): ResolvedFonts => {
  const pick = (v: unknown, fallback: FontKey): FontKey => (isFontKey(v) ? v : fallback);
  const heading = pick(input?.headingFont, DEFAULT_FONTS.headingFont);
  const body = pick(input?.bodyFont, DEFAULT_FONTS.bodyFont);
  // Selain kunci registri (termasuk "ikut-isi" dan data rusak) = ikut huruf isi, sama dengan bawaan.
  const headerFollowsBody = !isFontKey(input?.headerFont);
  const footerFollowsBody = !isFontKey(input?.footerFont);
  const header = headerFollowsBody ? body : (input?.headerFont as FontKey);
  const footer = footerFollowsBody ? body : (input?.footerFont as FontKey);

  // Hanya peran yang berbeda dari bawaan; header/footer yang ikut isi tetap var(--font-isi)
  // dari globals.css sehingga otomatis mengikuti --font-isi yang ditimpa.
  const decls: string[] = [];
  if (heading !== DEFAULT_FONTS.headingFont) decls.push(`--font-judul:${fontStack(heading)}`);
  if (body !== DEFAULT_FONTS.bodyFont) decls.push(`--font-isi:${fontStack(body)}`);
  if (!headerFollowsBody) decls.push(`--font-header:${fontStack(header)}`);
  if (!footerFollowsBody) decls.push(`--font-footer:${fontStack(footer)}`);

  const active = new Set<FontKey>([heading, body, header, footer]);
  return {
    heading,
    body,
    header,
    footer,
    headerFollowsBody,
    footerFollowsBody,
    used: FONT_KEYS.filter((key) => active.has(key)),
    css: decls.length ? `:root{${decls.join(";")}}` : "",
  };
};
