import type { ImportBeforeHook } from "@payloadcms/plugin-import-export/types";
import type { FlattenedField, PayloadRequest, Where } from "payload";
import { validateIsbn13 } from "../../collections/Books";
import { ISSUES_KEY, SEMICOLON_CSV_MESSAGE, isIsoDate, splitKeys } from "./parse";

/**
 * Hook `import.hooks.before` per koleksi katalog. Berjalan sekali per batch, setelah
 * baris CSV/JSON diurai dan hook field (parse.ts) dijalankan.
 *
 * - Slug penulis/kategori/seri dan nama berkas Media diubah menjadi ID (satu kueri per koleksi).
 * - Nilai yang sering rusak oleh Excel atau parser (harga, ISBN, angka bulat, tanggal,
 *   pilihan) diperiksa. Baris bermasalah diberi penanda ISSUES_KEY berisi pesan
 *   berbahasa Indonesia; hooks/rejectImportIssues menolaknya saat disimpan, termasuk
 *   untuk draf yang tidak melewati validasi field.
 *
 * HANYA MEMBACA: hook ini juga dipanggil pratinjau impor sebelum apa pun disimpan.
 * Pencarian memakai overrideAccess:true, tetapi hanya mengambil id, slug, dan nama berkas.
 */

type Row = Record<string, unknown>;
type RefCollection = "authors" | "categories" | "series" | "media";
type IdMap = Map<string, number>;
type RefSpec = { field: string; collection: RefCollection; label: string; many: boolean };
type ExtraCheck = (out: Row, issues: string[]) => void;
type CatalogSlug = "books" | "authors" | "categories" | "series";

const DIGITS = /^\d+$/;
const stripExt = (s: string) => s.replace(/\.[a-z0-9]{2,5}$/i, "");
const isRow = (x: unknown): x is Row => typeof x === "object" && x !== null && !Array.isArray(x);
const show = (v: unknown): string => {
  const s = typeof v === "string" ? `"${v}"` : JSON.stringify(v) ?? String(v);
  return s.length > 60 ? `${s.slice(0, 57)}…` : s;
};

const HINT: Record<RefCollection, string> = {
  authors: "Impor penulis lebih dulu atau periksa slug-nya.",
  categories: "Impor kategori lebih dulu atau periksa slug-nya.",
  series: "Impor seri lebih dulu atau periksa slug-nya.",
  media: "Unggah gambarnya lewat Media → Unggah banyak lebih dulu, lalu tulis nama berkasnya, mis. sampul-judul.jpg.",
};

/* ------------------------------ pencarian ID ------------------------------ */

/**
 * ID Postgres memakai serial (int4). Angka di luar rentang itu tidak mungkin ID dan tidak
 * boleh masuk kueri `id in [...]`: Postgres menolaknya (22003) dan seluruh transaksi impor
 * (atau pratinjau) gagal, padahal yang salah hanya satu baris. Contoh: sampul ditulis
 * sebagai ISBN tanpa ekstensi (9786230000010).
 */
const MAX_INT4 = 2_147_483_647;
const idsOf = (keys: string[]) =>
  keys
    .filter((k) => DIGITS.test(k))
    .map(Number)
    .filter((n) => Number.isSafeInteger(n) && n >= 1 && n <= MAX_INT4);

async function lookupBySlug(
  req: PayloadRequest,
  collection: Exclude<RefCollection, "media">,
  keys: Set<string>,
): Promise<IdMap> {
  const map: IdMap = new Map();
  if (!keys.size) return map;
  const all = [...keys];
  const or: Where[] = [{ slug: { in: all } }];
  const ids = idsOf(all);
  if (ids.length) or.push({ id: { in: ids } });
  const res = await req.payload.find({
    collection,
    overrideAccess: true,
    depth: 0,
    pagination: false,
    select: { slug: true },
    where: { or },
    req,
  });
  for (const d of res.docs) map.set(String(d.id), d.id);
  // Slug menang atas ID bila keduanya sama-sama cocok (mis. slug "1998").
  for (const d of res.docs) if (d.slug) map.set(d.slug, d.id);
  return map;
}

/**
 * Nama berkas atau ID Media. "sampul-x.jpg" juga cocok dengan "sampul-x.webp" (Media menyimpan WebP).
 * Nilai yang hanya berisi angka dicari sebagai nama berkas juga (mis. "9786230000010" →
 * "9786230000010.webp"); bila keduanya cocok, nama berkas menang atas ID.
 */
async function lookupMedia(req: PayloadRequest, names: Set<string>): Promise<IdMap> {
  const map: IdMap = new Map();
  if (!names.size) return map;
  const all = [...names];
  const filenames = new Set<string>();
  for (const n of all) {
    filenames.add(n);
    filenames.add(`${stripExt(n)}.webp`);
  }
  const or: Where[] = [];
  if (filenames.size) or.push({ filename: { in: [...filenames] } });
  const ids = idsOf(all);
  if (ids.length) or.push({ id: { in: ids } });
  const res = await req.payload.find({
    collection: "media",
    overrideAccess: true,
    depth: 0,
    pagination: false,
    select: { filename: true },
    where: { or },
    req,
  });
  for (const d of res.docs) map.set(String(d.id), d.id);
  // Diisi setelah ID agar nama berkas menang bila kuncinya sama.
  for (const d of res.docs) {
    if (!d.filename) continue;
    map.set(d.filename, d.id);
    map.set(stripExt(d.filename), d.id);
  }
  return map;
}

const findId = (map: IdMap, key: string, collection: RefCollection): number | undefined =>
  map.get(key) ?? (collection === "media" && !DIGITS.test(key) ? map.get(stripExt(key)) : undefined);

/** undefined = kolom tidak ada (biarkan), null = kosongkan relasi. */
function resolveRefs(value: unknown, map: IdMap, ref: RefSpec, issues: string[]): number[] | number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const keys = splitKeys(value);
  if (!keys.length) return ref.many ? [] : null;
  if (!ref.many && keys.length > 1) {
    issues.push(`${ref.label} (kolom ${ref.field}) hanya boleh berisi satu nilai, ditemukan ${keys.length}.`);
  }
  const ids: number[] = [];
  for (const key of keys) {
    const id = findId(map, key, ref.collection);
    if (id === undefined) issues.push(`${ref.label} "${key}" (kolom ${ref.field}) tidak ditemukan. ${HINT[ref.collection]}`);
    else if (!ids.includes(id)) ids.push(id);
  }
  return ref.many ? ids : (ids[0] ?? null);
}

/* ------------------------------ pemeriksaan ------------------------------- */

const priceCheck = (v: unknown, label: string, issues: string[]) => {
  if (v === undefined || v === null) return;
  if (typeof v !== "number" || !Number.isInteger(v) || v < 0) {
    issues.push(`${label} harus angka rupiah bulat tanpa "Rp" dan tanpa pemisah ribuan, mis. 85000 (tertulis: ${show(v)}).`);
    return;
  }
  if (v > 0 && v < 1000) {
    issues.push(`${label} Rp ${v} terlalu kecil. Kemungkinan tertulis 85.000 dan terbaca 85; tulis 85000 tanpa titik.`);
  }
};

const intCheck = (v: unknown, label: string, issues: string[], min?: number, max?: number) => {
  if (v === undefined || v === null) return;
  const ok =
    typeof v === "number" &&
    Number.isInteger(v) &&
    (min === undefined || v >= min) &&
    (max === undefined || v <= max);
  if (ok) return;
  const range =
    min !== undefined && max !== undefined
      ? ` antara ${min} dan ${max}`
      : min !== undefined
        ? ` minimal ${min}`
        : "";
  issues.push(`${label} harus bilangan bulat${range}, tanpa titik/koma pemisah ribuan (tertulis: ${show(v)}).`);
};

const decimalCheck = (v: unknown, label: string, issues: string[]) => {
  if (v === undefined || v === null) return;
  if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) {
    issues.push(`${label} harus angka lebih dari 0; desimal boleh memakai koma atau titik, mis. 14,5 (tertulis: ${show(v)}).`);
  }
};

const dateCheck = (v: unknown, label: string, issues: string[]) => {
  if (v === undefined || v === null) return;
  if (!isIsoDate(v)) {
    issues.push(`${label} harus tanggal berformat TTTT-BB-HH, mis. 2026-12-01 (HH/BB/TTTT juga diterima; tertulis: ${show(v)}).`);
  }
};

const boolCheck = (v: unknown, label: string, issues: string[]) => {
  if (v === undefined || v === null || typeof v === "boolean") return;
  issues.push(`${label} hanya boleh ya atau tidak (tertulis: ${show(v)}).`);
};

const optionValues = (options: (string | { value: string })[]) =>
  options.map((o) => (typeof o === "string" ? o : o.value));

/**
 * Pilihan (select/radio) dan panjang teks diperiksa terhadap konfigurasi koleksi.
 * Draf melewati validasi field Payload, jadi tanpa ini nilai di luar daftar ikut tersimpan.
 */
function checkFieldShapes(row: Row, fields: FlattenedField[] | undefined, issues: string[], prefix = "") {
  for (const f of fields ?? []) {
    // _status diperiksa (dan dinormalkan) oleh statusCheck.
    if (!prefix && f.name === "_status") continue;
    const v = row[f.name];
    if (v === undefined || v === null) continue;
    const column = `${prefix}${f.name}`;
    if (f.type === "select" || f.type === "radio") {
      const allowed = optionValues(f.options);
      for (const x of Array.isArray(v) ? v : [v]) {
        if (typeof x !== "string" || !allowed.includes(x)) {
          issues.push(`Kolom ${column} berisi ${show(x)}. Pilihan yang sah: ${allowed.join(", ")}.`);
        }
      }
    } else if ((f.type === "text" || f.type === "textarea") && typeof f.maxLength === "number") {
      if (typeof v === "string" && v.length > f.maxLength) {
        issues.push(`Kolom ${column} terlalu panjang: ${v.length} karakter, maksimal ${f.maxLength}.`);
      }
    } else if (f.type === "array" && Array.isArray(v)) {
      v.forEach((item, i) => {
        if (isRow(item)) checkFieldShapes(item, f.flattenedFields, issues, `${column}_${i}_`);
      });
    } else if ((f.type === "group" || f.type === "tab") && isRow(v)) {
      checkFieldShapes(v, f.flattenedFields, issues, `${column}_`);
    }
  }
}

/** Kolom sistem yang ikut di berkas ekspor; boleh ada di berkas impor walau bukan field. */
const SYSTEM_KEYS = new Set(["id", "_status", "createdAt", "updatedAt", "deletedAt"]);

/**
 * Kolom yang tidak dikenal diabaikan Payload tanpa pesan. Akibatnya CSV berpemisah titik
 * koma (seluruh judul kolom terbaca sebagai satu kolom) atau judul kolom yang salah eja
 * tersimpan sebagai data kosong, dan buku draf tidak melewati validasi field wajib.
 * Hanya kolom tingkat atas yang diperiksa (meta_title → meta).
 */
function unknownColumnsCheck(row: Row, fields: FlattenedField[] | undefined, issues: string[]) {
  if (!fields?.length) return;
  const known = new Set(fields.map((f) => f.name));
  const unknown = Object.keys(row).filter((k) => k !== ISSUES_KEY && !SYSTEM_KEYS.has(k) && !known.has(k));
  if (!unknown.length) return;
  if (unknown.some((k) => k.includes(";"))) {
    issues.push(SEMICOLON_CSV_MESSAGE);
    return;
  }
  issues.push(
    `Kolom tidak dikenal: ${unknown.map(show).join(", ")}. Periksa ejaan judul kolom (huruf besar/kecil berpengaruh) dan pemisahnya (koma); contoh judul kolom ada di templat /templat/.`,
  );
}

const statusCheck = (out: Row, issues: string[]) => {
  const s = out._status;
  if (s === undefined || s === null) return;
  if (typeof s === "string" && ["draft", "published"].includes(s.trim().toLowerCase())) {
    out._status = s.trim().toLowerCase();
    return;
  }
  issues.push(`Kolom _status hanya boleh draft atau published (tertulis: ${show(s)}).`);
};

const isHttpUrl = (v: unknown) => {
  if (typeof v !== "string") return false;
  try {
    return ["http:", "https:"].includes(new URL(v).protocol);
  } catch {
    return false;
  }
};

const booksChecks: ExtraCheck = (out, issues) => {
  if (out.isbn13 !== undefined && out.isbn13 !== null) {
    const isbn = String(out.isbn13).trim();
    out.isbn13 = isbn;
    // Excel menyimpan angka 13 digit sebagai 9,78623E+12; parser membacanya 9786230000000.
    if (/^\d{7}0{6}$/.test(isbn)) {
      issues.push(
        `ISBN (kolom isbn13) ${isbn} tampaknya terpotong Excel (mis. 9,78623E+12). Format kolom ISBN sebagai Teks atau tulis dengan tanda hubung, lalu simpan ulang berkasnya.`,
      );
    } else {
      const result = validateIsbn13(isbn);
      if (result !== true) {
        issues.push(
          `ISBN (kolom isbn13): ${result} Bila memakai Excel, format kolom ISBN sebagai Teks atau tulis dengan tanda hubung.`,
        );
      }
    }
  }

  priceCheck(out.price, "Harga jual (kolom price)", issues);
  priceCheck(out.listPrice, "Harga normal (kolom listPrice)", issues);
  if (typeof out.listPrice === "number" && typeof out.price === "number" && out.listPrice <= out.price) {
    issues.push("Harga normal (kolom listPrice) harus lebih besar dari harga jual (price). Kosongkan bila tidak ada harga coret.");
  }

  intCheck(out.pageCount, "Jumlah halaman (kolom pageCount)", issues, 1);
  intCheck(out.weightGram, "Berat dalam gram (kolom weightGram)", issues, 1);
  intCheck(out.publishedYear, "Tahun terbit (kolom publishedYear)", issues, 1900, 2200);
  intCheck(out.seriesOrder, "Jilid ke- (kolom seriesOrder)", issues, 1);
  decimalCheck(out.widthCm, "Lebar (kolom widthCm)", issues);
  decimalCheck(out.heightCm, "Tinggi (kolom heightCm)", issues);
  decimalCheck(out.thicknessCm, "Ketebalan (kolom thicknessCm)", issues);

  dateCheck(out.discountStart, "Diskon mulai (kolom discountStart)", issues);
  dateCheck(out.discountEnd, "Diskon selesai (kolom discountEnd)", issues);
  if (
    isIsoDate(out.discountStart) &&
    isIsoDate(out.discountEnd) &&
    String(out.discountStart).slice(0, 10) > String(out.discountEnd).slice(0, 10)
  ) {
    issues.push("Diskon selesai (discountEnd) tidak boleh lebih awal dari diskon mulai (discountStart).");
  }

  boolCheck(out.waOrderEnabled, "Kolom waOrderEnabled", issues);
  boolCheck(out.featured, "Kolom featured", issues);

  if (Array.isArray(out.marketplaceLinks)) {
    out.marketplaceLinks.forEach((link, i) => {
      if (!isRow(link)) return;
      if (link.platform === undefined || link.platform === null) {
        issues.push(`Kolom marketplaceLinks_${i}_platform wajib diisi bila URL marketplace diisi.`);
      }
      if (!isHttpUrl(link.url)) {
        issues.push(`Kolom marketplaceLinks_${i}_url harus alamat lengkap yang diawali https:// (tertulis: ${show(link.url)}).`);
      }
    });
  }
};

const categoriesChecks: ExtraCheck = (out, issues) => {
  intCheck(out.order, "Urutan tampil (kolom order)", issues);
};

/* --------------------------------- pabrik --------------------------------- */

const makeImportBefore =
  (slug: CatalogSlug, refs: RefSpec[], extra?: ExtraCheck): ImportBeforeHook =>
  async ({ data, req }) => {
    const rows: Row[] = data.map((d) => ({ ...d }));

    const keys = new Map<RefCollection, Set<string>>();
    for (const row of rows) {
      for (const ref of refs) {
        const set = keys.get(ref.collection) ?? new Set<string>();
        for (const k of splitKeys(row[ref.field])) set.add(k);
        keys.set(ref.collection, set);
      }
    }
    // Berurutan, bukan paralel: kueri berbagi transaksi `req` impor.
    const maps = new Map<RefCollection, IdMap>();
    for (const [collection, set] of keys) {
      maps.set(collection, collection === "media" ? await lookupMedia(req, set) : await lookupBySlug(req, collection, set));
    }

    const fields = req.payload.collections?.[slug]?.config.flattenedFields;

    return rows.map((row) => {
      const issues: string[] = [];
      const out: Row = { ...row };
      delete out.createdAt;
      delete out.updatedAt;
      delete out[ISSUES_KEY];

      for (const ref of refs) {
        const resolved = resolveRefs(row[ref.field], maps.get(ref.collection) ?? new Map(), ref, issues);
        if (resolved === undefined) delete out[ref.field];
        else out[ref.field] = resolved;
      }

      unknownColumnsCheck(row, fields, issues);
      statusCheck(out, issues);
      checkFieldShapes(out, fields, issues);
      extra?.(out, issues);

      if (issues.length) out[ISSUES_KEY] = issues;
      return out;
    });
  };

export const booksImportBefore = makeImportBefore(
  "books",
  [
    { field: "authors", collection: "authors", label: "Penulis", many: true },
    { field: "categories", collection: "categories", label: "Kategori", many: true },
    { field: "series", collection: "series", label: "Seri", many: false },
    { field: "cover", collection: "media", label: "Sampul", many: false },
  ],
  booksChecks,
);

export const authorsImportBefore = makeImportBefore("authors", [
  { field: "photo", collection: "media", label: "Foto", many: false },
]);

export const categoriesImportBefore = makeImportBefore("categories", [], categoriesChecks);

export const seriesImportBefore = makeImportBefore("series", [
  { field: "cover", collection: "media", label: "Gambar seri", many: false },
]);
