/**
 * Semua pemanggilan next/font situs dan panel admin (dipakai kedua root layout).
 *
 * next/font hanya menerima pemanggilan dengan opsi literal yang langsung disimpan ke const di
 * tingkat modul (tanpa spread, tanpa nilai hasil hitung). Karena itu daftar ini ditulis tangan
 * dan tidak bisa dibuat dari registri lib/appearance/fonts.ts; fonts.test.ts memeriksa keduanya
 * tetap sinkron (variabel CSS, nama keluarga, preload, peta BY_KEY).
 *
 * - Inter dan Source Serif 4 (bawaan) memakai opsi yang sama persis dengan sebelum fitur huruf:
 *   subset latin dipreload.
 * - Huruf lain `preload: false`: @font-face-nya ada di CSS, tetapi berkasnya baru diunduh saat
 *   ada teks yang memakai huruf itu. Bila suatu saat pasangan tetap yayasan bukan bawaan, pindahkan
 *   preload ke huruf tersebut.
 * - Kelas variabel WAJIB dipasang di <html> (lihat lib/appearance/fonts.ts).
 */
import {
  IBM_Plex_Sans,
  Inter,
  Literata,
  Lora,
  Merriweather,
  Noto_Serif,
  Plus_Jakarta_Sans,
  Public_Sans,
  Source_Serif_4,
  Work_Sans,
} from "next/font/google";
import { FONT_KEYS, type FontKey } from "@/lib/appearance/fonts";

export const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const plusJakartaSans = Plus_Jakarta_Sans({ variable: "--font-plus-jakarta-sans", display: "swap", preload: false });
const ibmPlexSans = IBM_Plex_Sans({ variable: "--font-ibm-plex-sans", display: "swap", preload: false });
const workSans = Work_Sans({ variable: "--font-work-sans", display: "swap", preload: false });
const publicSans = Public_Sans({ variable: "--font-public-sans", display: "swap", preload: false });
export const sourceSerif = Source_Serif_4({ subsets: ["latin"], variable: "--font-source-serif", display: "swap" });
const lora = Lora({ variable: "--font-lora", display: "swap", preload: false });
const merriweather = Merriweather({ variable: "--font-merriweather", display: "swap", preload: false });
const literata = Literata({ variable: "--font-literata", display: "swap", preload: false });
const notoSerif = Noto_Serif({ variable: "--font-noto-serif", display: "swap", preload: false });

const BY_KEY: Record<FontKey, { variable: string }> = {
  inter: inter,
  "plus-jakarta-sans": plusJakartaSans,
  "ibm-plex-sans": ibmPlexSans,
  "work-sans": workSans,
  "public-sans": publicSans,
  "source-serif-4": sourceSerif,
  lora: lora,
  merriweather: merriweather,
  literata: literata,
  "noto-serif": notoSerif,
};

/** Kelas variabel untuk huruf yang dipakai (urutan mengikuti masukan, mis. ResolvedFonts.used). */
export const fontVariableClasses = (keys: readonly FontKey[]): string => keys.map((key) => BY_KEY[key].variable).join(" ");

/** Semua huruf: untuk pratinjau langsung dan panel admin (contoh huruf di Tampilan Situs). */
export const ALL_FONT_VARIABLE_CLASSES = fontVariableClasses(FONT_KEYS);
