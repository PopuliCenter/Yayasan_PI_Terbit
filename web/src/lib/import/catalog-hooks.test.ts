import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ImportBeforeHook } from "@payloadcms/plugin-import-export/types";
import type { PayloadRequest } from "payload";
import { authorsImportBefore, booksImportBefore, categoriesImportBefore, seriesImportBefore } from "./catalog-hooks";
import { ISSUES_KEY } from "./parse";

type Doc = { id: number; slug?: string; filename?: string };
type Clause = Record<string, { in: (string | number)[] }>;

const DB: Record<string, Doc[]> = {
  authors: [
    { id: 1, slug: "nama-penulis-a" },
    { id: 2, slug: "nama-penulis-b" },
  ],
  categories: [
    { id: 10, slug: "politik-lokal" },
    { id: 11, slug: "demokrasi" },
  ],
  series: [{ id: 20, slug: "seri-contoh" }],
  media: [
    { id: 30, filename: "sampul-contoh-pertama.webp" },
    { id: 31, filename: "foto-penulis.webp" },
    { id: 32, filename: "9786230000010.webp" },
  ],
};

const MAX_INT4 = 2_147_483_647;

/** Stub payload.find: mendukung where { or: [{ slug|filename|id: { in } }] } seperti yang dipakai hook. */
const calls: { collection: string; overrideAccess: unknown; select: unknown; where: { or: Clause[] } }[] = [];
const find = async (args: { collection: string; where: { or: Clause[] }; overrideAccess?: boolean; select?: unknown }) => {
  calls.push({ collection: args.collection, overrideAccess: args.overrideAccess, select: args.select, where: args.where });
  // Seperti Postgres (ID serial int4): angka di luar rentang membuat kueri gagal.
  for (const clause of args.where.or) {
    for (const v of clause.id?.in ?? []) {
      if (typeof v === "number" && v > MAX_INT4) throw new Error(`value "${v}" is out of range for type integer`);
    }
  }
  const docs = (DB[args.collection] ?? []).filter((d) =>
    args.where.or.some((clause) =>
      Object.entries(clause).some(([field, cond]) => cond.in.includes((d as Record<string, string | number>)[field])),
    ),
  );
  return { docs };
};

/** Nama field tingkat atas lain yang dipakai kasus uji (kolom yang tidak ada di sini dianggap tidak dikenal). */
const plainFields = [
  "slug",
  "title",
  "authors",
  "categories",
  "series",
  "seriesOrder",
  "cover",
  "isbn13",
  "price",
  "listPrice",
  "pageCount",
  "publishedYear",
  "widthCm",
  "discountStart",
  "discountEnd",
  "featured",
  "meta",
  "createdAt",
  "updatedAt",
].map((name) => ({ name, type: "text" }));

const flattenedFields = [
  ...plainFields,
  {
    name: "availability",
    type: "select",
    options: [
      { label: "Tersedia", value: "tersedia" },
      { label: "Stok terbatas", value: "terbatas" },
      { label: "Habis", value: "habis" },
      { label: "Segera terbit", value: "segera" },
    ],
  },
  {
    name: "marketplaceLinks",
    type: "array",
    flattenedFields: [{ name: "platform", type: "select", options: ["tokopedia", "shopee"] }],
  },
  { name: "metaDescriptionTest", type: "textarea", maxLength: 10 },
];

const req = {
  payload: { find, collections: { books: { config: { flattenedFields } } } },
} as unknown as PayloadRequest;

const run = (hook: ImportBeforeHook, data: Record<string, unknown>[]) =>
  hook({ batchNumber: 1, data, format: "csv", originalData: data, req, totalBatches: 1 }) as Promise<
    Record<string, unknown>[]
  >;

const validBook = {
  slug: "contoh-judul-buku-pertama",
  title: "Contoh Judul Buku Pertama",
  authors: "nama-penulis-a|nama-penulis-b",
  categories: "politik-lokal|demokrasi",
  series: "seri-contoh",
  cover: "sampul-contoh-pertama.jpg",
  isbn13: "978-623-00-0001-0",
  price: 85000,
  listPrice: 95000,
  availability: "tersedia",
  marketplaceLinks: [{ platform: "tokopedia", url: "https://www.tokopedia.com/toko/contoh" }],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
  _status: "draft",
};

const issuesOf = (row: Record<string, unknown>): string[] => {
  const issues = row[ISSUES_KEY];
  return Array.isArray(issues) ? issues.map(String) : [];
};

describe("booksImportBefore", () => {
  it("baris valid: slug dan nama berkas menjadi ID, tanpa createdAt/updatedAt, tanpa masalah", async () => {
    const [out] = await run(booksImportBefore, [validBook]);
    assert.deepEqual(issuesOf(out), []);
    assert.equal(ISSUES_KEY in out, false);
    assert.deepEqual(out.authors, [1, 2]);
    assert.deepEqual(out.categories, [10, 11]);
    assert.equal(out.series, 20);
    assert.equal(out.cover, 30, "sampul .jpg cocok dengan .webp yang tersimpan");
    assert.equal("createdAt" in out, false);
    assert.equal("updatedAt" in out, false);
  });

  it("satu kueri per koleksi, hanya-baca dengan select sempit", async () => {
    calls.length = 0;
    await run(booksImportBefore, [validBook, { ...validBook, slug: "lain" }]);
    assert.deepEqual(calls.map((c) => c.collection).sort(), ["authors", "categories", "media", "series"]);
    for (const c of calls) {
      assert.equal(c.overrideAccess, true);
      assert.ok(c.select && Object.keys(c.select).length === 1);
    }
  });

  const cases: [string, Record<string, unknown>, RegExp][] = [
    ["harga 85 (dari 85.000)", { price: 85 }, /terlalu kecil.*85\.000/],
    ["harga pecahan (dari 125.500)", { price: 125.5 }, /rupiah bulat/],
    ["angka pemeriksa ISBN salah", { isbn13: "978-623-00-0001-1" }, /Angka pemeriksa ISBN/],
    ["ISBN terpotong Excel", { isbn13: 9786230000000 }, /terpotong Excel/],
    ["penulis tidak dikenal", { authors: "nama-penulis-a|penulis-hantu" }, /Penulis "penulis-hantu".*tidak ditemukan/],
    ["kategori tidak dikenal", { categories: "fiksi" }, /Kategori "fiksi"/],
    ["berkas sampul tidak ada", { cover: "tidak-ada.jpg" }, /Sampul "tidak-ada\.jpg".*Media/],
    ["harga normal ≤ harga jual", { listPrice: 85000 }, /lebih besar dari harga jual/],
    ["status tidak sah", { _status: "terbit" }, /_status hanya boleh draft atau published/],
    ["jumlah halaman pecahan", { pageCount: 312.5 }, /Jumlah halaman.*bilangan bulat/],
    ["tahun di luar rentang", { publishedYear: 202 }, /Tahun terbit.*antara 1900 dan 2200/],
    ["lebar tidak terbaca", { widthCm: "14,5 cm" }, /Lebar.*lebih dari 0/],
    ["tanggal diskon tidak ada", { discountStart: "2026-02-31" }, /Diskon mulai.*TTTT-BB-HH/],
    ["diskon terbalik", { discountStart: "2026-12-31", discountEnd: "2026-12-01" }, /tidak boleh lebih awal/],
    ["ya/tidak tidak dikenal", { featured: "mungkin" }, /featured hanya boleh ya atau tidak/],
    ["pilihan ketersediaan salah", { availability: "tersediaa" }, /Kolom availability.*Pilihan yang sah: tersedia/],
    ["platform marketplace salah", { marketplaceLinks: [{ platform: "bukalapak", url: "https://x.id" }] }, /marketplaceLinks_0_platform/],
    ["URL marketplace bukan http", { marketplaceLinks: [{ platform: "shopee", url: "shopee.co.id/x" }] }, /marketplaceLinks_0_url/],
    ["seri lebih dari satu", { series: "seri-contoh|seri-lain" }, /hanya boleh berisi satu nilai/],
    ["teks terlalu panjang", { metaDescriptionTest: "x".repeat(11) }, /terlalu panjang: 11 karakter, maksimal 10/],
  ];

  for (const [name, patch, pattern] of cases) {
    it(`ditandai: ${name}`, async () => {
      const [out] = await run(booksImportBefore, [{ ...validBook, ...patch }]);
      const issues = issuesOf(out);
      assert.ok(issues.length > 0, "harus ada masalah");
      assert.ok(
        issues.some((m) => pattern.test(m)),
        `pesan tidak cocok ${pattern}: ${issues.join(" | ")}`,
      );
    });
  }

  it("ISBN angka dinormalkan menjadi teks; kolom yang tidak ada dibiarkan (mode perbarui)", async () => {
    const [out] = await run(booksImportBefore, [{ slug: "x", isbn13: 9786230000003, price: 90000 }]);
    assert.deepEqual(issuesOf(out), []);
    assert.equal(out.isbn13, "9786230000003");
    assert.equal("authors" in out, false);
    assert.equal("cover" in out, false);
  });

  it("sampul/seri berupa angka panjang (ISBN tanpa ekstensi) tidak masuk kueri ID dan hanya menandai barisnya", async () => {
    calls.length = 0;
    const rows = await run(booksImportBefore, [
      { ...validBook, cover: 9786230000099 },
      { ...validBook, series: "99999999999" },
      validBook,
    ]);
    assert.ok(issuesOf(rows[0]).some((m) => /Sampul "9786230000099".*tidak ditemukan/.test(m)));
    assert.ok(issuesOf(rows[1]).some((m) => /Seri "99999999999".*tidak ditemukan/.test(m)));
    assert.deepEqual(issuesOf(rows[2]), []);
    for (const c of calls) {
      for (const clause of c.where.or) {
        for (const v of clause.id?.in ?? []) assert.ok(typeof v === "number" && v >= 1 && v <= MAX_INT4, `ID ${v}`);
      }
    }
  });

  it("sampul berupa angka saja cocok dengan nama berkas di Media (dan menang atas ID)", async () => {
    const [out] = await run(booksImportBefore, [{ ...validBook, cover: 9786230000010 }]);
    assert.deepEqual(issuesOf(out), []);
    assert.equal(out.cover, 32);
    const [byId] = await run(booksImportBefore, [{ ...validBook, cover: "31" }]);
    assert.equal(byId.cover, 31, "ID media kecil tetap dikenali");
  });

  it("CSV berpemisah titik koma: satu kolom gabungan ditolak dengan pesan bahasa Indonesia", async () => {
    const [out] = await run(booksImportBefore, [{ "slug;title;authors;price": "buku;Buku;budi;85000" }]);
    assert.ok(issuesOf(out).some((m) => /pemisah titik koma/.test(m)), issuesOf(out).join(" | "));
  });

  it("judul kolom salah eja ditandai; kolom sistem ekspor (id, _status, createdAt) diterima", async () => {
    const [bad] = await run(booksImportBefore, [{ ...validBook, harga: 85000 }]);
    assert.ok(issuesOf(bad).some((m) => /Kolom tidak dikenal: "harga"/.test(m)), issuesOf(bad).join(" | "));
    const [ok] = await run(booksImportBefore, [{ ...validBook, id: 7, meta: { title: "x" } }]);
    assert.deepEqual(issuesOf(ok), []);
  });

  it("baris lain dalam batch tidak ikut ditolak", async () => {
    const rows = await run(booksImportBefore, [{ ...validBook, price: 85 }, validBook]);
    assert.ok(issuesOf(rows[0]).length > 0);
    assert.deepEqual(issuesOf(rows[1]), []);
  });

  it("penanda masalah dari berkas tidak dipercaya", async () => {
    const [out] = await run(booksImportBefore, [{ ...validBook, [ISSUES_KEY]: ["palsu"] }]);
    assert.equal(ISSUES_KEY in out, false);
  });
});

describe("hook koleksi lain", () => {
  it("authorsImportBefore: foto dari nama berkas", async () => {
    const [ok, bad] = await run(authorsImportBefore, [
      { slug: "nama-penulis-a", name: "A", photo: "foto-penulis.png" },
      { slug: "nama-penulis-b", name: "B", photo: "tidak-ada.png" },
    ]);
    assert.equal(ok.photo, 31);
    assert.deepEqual(issuesOf(ok), []);
    assert.ok(issuesOf(bad).some((m) => /Foto "tidak-ada\.png"/.test(m)));
  });

  it("seriesImportBefore: gambar seri dari ID media", async () => {
    const [out] = await run(seriesImportBefore, [{ slug: "seri-contoh", title: "Seri", cover: 30 }]);
    assert.equal(out.cover, 30);
    assert.deepEqual(issuesOf(out), []);
  });

  it("categoriesImportBefore: urutan harus bilangan bulat", async () => {
    const [ok, bad] = await run(categoriesImportBefore, [
      { slug: "a", title: "A", order: 10, createdAt: "x" },
      { slug: "b", title: "B", order: 1.5 },
    ]);
    assert.deepEqual(issuesOf(ok), []);
    assert.equal("createdAt" in ok, false);
    assert.ok(issuesOf(bad).some((m) => /Urutan tampil/.test(m)));
  });
});
