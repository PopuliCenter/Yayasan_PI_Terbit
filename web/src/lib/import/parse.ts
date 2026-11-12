import type { FieldBeforeExportHook, FieldBeforeImportHook } from "@payloadcms/plugin-import-export/types";

/**
 * Pengubah nilai untuk impor/ekspor CSV katalog (plugin import-export).
 *
 * Parser CSV plugin mengubah teks sebelum hook ini berjalan, dan hasilnya terukur:
 *   "85.000"        → 85        (titik dibaca sebagai desimal)
 *   "9786230000010" → angka     (ISBN tanpa tanda hubung)
 *   "14,5"          → 14        (parseFloat bawaan untuk field number)
 *   "ya"            → false     (checkbox bawaan hanya mengenal "true"/"1")
 * Hook field di sini menggantikan perilaku bawaan itu. Plugin memanggilnya SINKRON,
 * jadi semuanya fungsi murni tanpa akses basis data. Pemeriksaan yang butuh basis
 * data (slug → ID, nama berkas sampul) ada di catalog-hooks.ts.
 */

/** Kunci penanda baris bermasalah; ditolak oleh hooks/rejectImportIssues. */
export const ISSUES_KEY = "__importIssues";

const isEmpty = (value: unknown) => value === undefined || value === "";

/** ISBN, slug, dan teks lain yang tidak boleh berubah menjadi angka. */
export const asText: FieldBeforeImportHook = ({ value }) => {
  if (value === undefined || value === null) return value;
  // ISBN 13 digit masih di bawah Number.MAX_SAFE_INTEGER, jadi String() tidak kehilangan digit.
  return String(value).trim();
};

/**
 * Rupiah bulat. "Rp 85.000", "85.000,00", "85,000", dan "85000" menjadi 85000.
 * Nilai yang sudah dibaca parser sebagai angka (mis. "85.000" → 85) dibiarkan;
 * pemeriksaan batch menolak harga 1–999 sebagai kemungkinan salah tulis.
 * Teks yang tidak bisa dibaca dikembalikan apa adanya agar ditolak dengan pesan jelas.
 */
export const rupiah: FieldBeforeImportHook = ({ value }) => {
  if (value === "") return undefined;
  if (typeof value !== "string") return value;
  const s = value.replace(/^\s*rp\.?/i, "").replace(/\s/g, "");
  const dotThousands = s.match(/^(\d{1,3}(?:\.\d{3})+)(?:,(\d{1,2}))?$/);
  const commaThousands = s.match(/^(\d{1,3}(?:,\d{3})+)(?:\.(\d{1,2}))?$/);
  const plain = s.match(/^(\d+)(?:[.,](\d{1,2}))?$/);
  const m = dotThousands ?? commaThousands ?? plain;
  if (!m) return value;
  // Sen bukan nol (mis. 85.000,50) tidak dibulatkan diam-diam.
  if (m[2] && Number(m[2]) !== 0) return value;
  return Number(m[1].replace(/[.,]/g, ""));
};

/** Desimal dengan koma atau titik: "14,5" dan "14.5" menjadi 14.5. */
export const decimalId: FieldBeforeImportHook = ({ value }) => {
  if (value === "") return undefined;
  if (typeof value !== "string") return value;
  const s = value.trim().replace(/\s/g, "");
  if (/^-?\d+([.,]\d+)?$/.test(s)) return Number(s.replace(",", "."));
  return value;
};

/** true bila teks berformat TTTT-BB-HH dan tanggalnya ada di kalender. */
export const isIsoDate = (value: unknown): boolean => {
  if (typeof value !== "string") return false;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
};

/**
 * Tanggal tanpa jam ("01/12/2026" HH/BB/TTTT, juga dengan - atau ., atau "2026-12-01")
 * menjadi "2026-12-01T12:00:00.000Z": pukul 12.00 UTC, sama dengan pemilih tanggal admin
 * (dayOnly). Tanpa itu tanggal tersimpan 00.00 UTC (07.00 WIB), sehingga diskon impor
 * berakhir 12 jam lebih awal daripada tanggal yang sama yang dipilih di admin.
 * Stempel waktu lengkap (mis. hasil ekspor) dan teks lain dibiarkan.
 */
export const dateId: FieldBeforeImportHook = ({ value }) => {
  if (value === "") return undefined;
  if (typeof value !== "string") return value;
  const s = value.trim();
  const m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  const iso = m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : s;
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00.000Z` : iso;
};

const TRUE_WORDS = new Set(["ya", "y", "yes", "true", "1", "benar"]);
const FALSE_WORDS = new Set(["tidak", "t", "n", "no", "false", "0", "salah"]);

/** Kotak centang: ya/tidak, benar/salah, true/false, 1/0. Lainnya dibiarkan agar ditolak. */
export const yaTidak: FieldBeforeImportHook = ({ value }) => {
  if (isEmpty(value)) return undefined;
  if (typeof value === "boolean" || value === null) return value;
  const s = String(value).trim().toLowerCase();
  if (TRUE_WORDS.has(s)) return true;
  if (FALSE_WORDS.has(s)) return false;
  return value;
};

/**
 * Pilihan (select) boleh ditulis dengan label, mis. "Stok terbatas" → "terbatas".
 * Kunci peta ditulis huruf kecil. Nilai yang tidak dikenal dikembalikan dalam huruf
 * kecil dan diperiksa terhadap daftar pilihan oleh hook batch.
 */
export const selectByLabel =
  (map: Record<string, string>): FieldBeforeImportHook =>
  ({ value }) => {
    if (value === "") return undefined;
    if (typeof value !== "string") return value;
    const key = value.trim().toLowerCase();
    return map[key] ?? key;
  };

type LexicalText = {
  type: "text";
  text: string;
  format: number;
  detail: number;
  mode: "normal";
  style: string;
  version: 1;
};
type LexicalParagraph = {
  type: "paragraph";
  children: LexicalText[];
  direction: "ltr";
  format: "";
  indent: 0;
  version: 1;
  textFormat: 0;
  textStyle: "";
};
export type LexicalDoc = {
  root: {
    type: "root";
    format: "";
    indent: 0;
    version: 1;
    direction: "ltr";
    children: LexicalParagraph[];
  };
};

/** Teks polos menjadi dokumen Lexical; baris kosong memisahkan paragraf (bentuk sama dengan seed/lexical.ts). */
export const plainTextToLexical = (text: string): LexicalDoc => ({
  root: {
    type: "root",
    format: "",
    indent: 0,
    version: 1,
    direction: "ltr",
    children: text
      .replace(/\r\n?/g, "\n")
      .split(/\n[ \t]*\n/)
      .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
      .filter(Boolean)
      .map((p) => ({
        type: "paragraph",
        children: [{ type: "text", text: p, format: 0, detail: 0, mode: "normal", style: "", version: 1 }],
        direction: "ltr",
        format: "",
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: "",
      })),
  },
});

const isLexical = (value: unknown): boolean =>
  typeof value === "object" && value !== null && "root" in value && typeof value.root === "object";

/**
 * Teks kaya: JSON Lexical (hasil ekspor) diteruskan apa adanya agar format tetap utuh
 * saat ekspor → impor ulang; teks polos diubah menjadi paragraf.
 */
export const richText: FieldBeforeImportHook = ({ value }) => {
  if (value === undefined || value === null) return value;
  if (typeof value === "object") return value;
  const s = String(value);
  if (!s.trim()) return undefined;
  if (s.trimStart().startsWith("{")) {
    try {
      const parsed: unknown = JSON.parse(s);
      if (isLexical(parsed)) return parsed;
    } catch {
      // Bukan JSON: perlakukan sebagai teks polos.
    }
  }
  return plainTextToLexical(s);
};

const refKey = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  if (typeof v === "object") {
    if ("slug" in v && typeof v.slug === "string" && v.slug) return v.slug;
    if ("id" in v && (typeof v.id === "number" || typeof v.id === "string")) return String(v.id);
    return null;
  }
  return String(v);
};

/** Ekspor CSV: relasi ditulis sebagai slug dipisah "|" (mis. "penulis-a|penulis-b"), sama dengan format impor. */
export const exportSlugs: FieldBeforeExportHook = ({ value, format }) => {
  if (format !== "csv") return undefined;
  const items = Array.isArray(value) ? value : value === null || value === undefined ? [] : [value];
  return items
    .map(refKey)
    .filter((k): k is string => Boolean(k))
    .join("|");
};

/** Ekspor CSV: sampul/foto ditulis sebagai nama berkas Media, sama dengan format impor. */
export const exportFilename: FieldBeforeExportHook = ({ value, format }) => {
  if (format !== "csv") return undefined;
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    if ("filename" in value && typeof value.filename === "string" && value.filename) return value.filename;
    if ("id" in value && (typeof value.id === "number" || typeof value.id === "string")) return String(value.id);
    return "";
  }
  return String(value);
};

/**
 * Kunci relasi dari sel CSV atau JSON: "a|b", "a,b", "a;b", ["a|b"], [{ id: 5 }], 5.
 * Selalu mengembalikan teks yang sudah dipangkas, tanpa entri kosong.
 */
export const splitKeys = (v: unknown): string[] => {
  const items = Array.isArray(v) ? v : v === null || v === undefined ? [] : [v];
  return items
    .flatMap((x): string[] => {
      if (x === null || x === undefined) return [];
      if (typeof x === "object") {
        if ("id" in x && (typeof x.id === "number" || typeof x.id === "string")) return [String(x.id)];
        if ("value" in x && (typeof x.value === "number" || typeof x.value === "string")) return [String(x.value)];
        return [];
      }
      return String(x).split(/[|,;]/);
    })
    .map((s) => s.trim())
    .filter(Boolean);
};

/** Pesan untuk CSV berpemisah titik koma (bawaan Excel dengan pengaturan wilayah Indonesia). */
export const SEMICOLON_CSV_MESSAGE =
  "Berkas memakai pemisah titik koma (;). Simpan ulang sebagai CSV UTF-8 (dipisah koma) lalu impor lagi.";

/**
 * true bila baris judul CSV dipisah titik koma, bukan koma. Parser plugin selalu memakai
 * koma, sehingga berkas seperti ini terbaca sebagai satu kolom panjang: baris buku tersimpan
 * sebagai draf kosong, atau impor gagal dengan pesan parser berbahasa Inggris bila ada sel
 * yang berisi koma. Hanya beberapa KB pertama yang dibaca.
 */
export const isSemicolonCsv = (data: Uint8Array | string): boolean => {
  const head = typeof data === "string" ? data.slice(0, 8192) : new TextDecoder().decode(data.subarray(0, 8192));
  const header = head
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .find((line) => line.trim() !== "");
  return header !== undefined && header.includes(";") && !header.includes(",");
};
