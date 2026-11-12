import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { FieldBeforeExportHook, FieldBeforeImportHook } from "@payloadcms/plugin-import-export/types";
import {
  asText,
  dateId,
  decimalId,
  exportFilename,
  exportSlugs,
  isIsoDate,
  isSemicolonCsv,
  plainTextToLexical,
  richText,
  rupiah,
  selectByLabel,
  splitKeys,
  yaTidak,
} from "./parse";
import { doc, p } from "../../seed/lexical";

/** Memanggil hook impor seperti plugin (unflattenObject.js): CSV, satu kolom. */
const imp = (hook: FieldBeforeImportHook, value: unknown, format: "csv" | "json" = "csv") =>
  hook({ columnName: "kolom", data: {}, format, siblingData: {}, siblingDoc: {}, value });

const exp = (hook: FieldBeforeExportHook, value: unknown, format: "csv" | "json" = "csv") =>
  hook({ columnName: "kolom", data: {}, format, siblingData: {}, siblingDoc: {}, value });

describe("jebakan parser CSV plugin (terukur di 3.93.0)", () => {
  it('"85.000" terbaca 85: rupiah tidak menebak, angka diteruskan apa adanya untuk ditolak batch', () => {
    assert.equal(imp(rupiah, 85), 85);
  });
  it("ISBN tanpa tanda hubung terbaca angka: asText mengembalikannya menjadi teks utuh", () => {
    assert.equal(imp(asText, 9786230000010), "9786230000010");
    assert.equal(imp(asText, " 978-623-00-0001-0 "), "978-623-00-0001-0");
  });
  it('"14,5" tetap teks di parser (lalu parseFloat → 14): decimalId membacanya 14.5', () => {
    assert.equal(imp(decimalId, "14,5"), 14.5);
    assert.equal(imp(decimalId, 14.5), 14.5);
    assert.equal(imp(decimalId, "21"), 21);
  });
  it('"ya" terbaca false oleh checkbox bawaan: yaTidak membacanya true', () => {
    assert.equal(imp(yaTidak, "ya"), true);
    assert.equal(imp(yaTidak, "Ya"), true);
    assert.equal(imp(yaTidak, "tidak"), false);
  });
});

describe("rupiah", () => {
  it("teks rupiah dengan Rp dan pemisah ribuan", () => {
    assert.equal(imp(rupiah, "Rp 85.000"), 85000);
    assert.equal(imp(rupiah, "Rp. 1.250.000"), 1250000);
    assert.equal(imp(rupiah, "85,000"), 85000);
    assert.equal(imp(rupiah, "85.000,00"), 85000);
    assert.equal(imp(rupiah, "85000"), 85000);
  });
  it("angka diteruskan, sen bukan nol dan teks lain tidak ditebak", () => {
    assert.equal(imp(rupiah, 85000), 85000);
    assert.equal(imp(rupiah, "85.000,50"), "85.000,50");
    assert.equal(imp(rupiah, "delapan puluh"), "delapan puluh");
    assert.equal(imp(rupiah, ""), undefined);
  });
});

describe("dateId dan isIsoDate", () => {
  it("HH/BB/TTTT dan TTTT-BB-HH menjadi tanggal pukul 12.00 UTC, sama dengan pemilih tanggal admin", () => {
    assert.equal(imp(dateId, "01/12/2026"), "2026-12-01T12:00:00.000Z");
    assert.equal(imp(dateId, "1-2-2026"), "2026-02-01T12:00:00.000Z");
    assert.equal(imp(dateId, "31.12.2026"), "2026-12-31T12:00:00.000Z");
    assert.equal(imp(dateId, " 2026-12-31 "), "2026-12-31T12:00:00.000Z");
  });
  it("diskon impor bertahan sampai 19.00 WIB di hari terakhir, bukan 07.00 WIB", () => {
    const end = new Date(String(imp(dateId, "31/12/2026")));
    assert.equal(end.getTime(), Date.UTC(2026, 11, 31, 12));
    // 19.00 WIB = 12.00 UTC pada hari yang sama.
    assert.equal(new Date(end.getTime() + 7 * 3600_000).toISOString().slice(0, 16), "2026-12-31T19:00");
  });
  it("stempel waktu lengkap, teks lain, dan kosong", () => {
    assert.equal(imp(dateId, "2026-12-31T00:00:00.000Z"), "2026-12-31T00:00:00.000Z");
    assert.equal(imp(dateId, "besok"), "besok");
    assert.equal(imp(dateId, ""), undefined);
    assert.equal(imp(dateId, 46357), 46357);
  });
  it("hasil dateId tetap lolos isIsoDate, tanggal mustahil tetap ditolak", () => {
    assert.equal(isIsoDate(imp(dateId, "01/12/2026")), true);
    assert.equal(isIsoDate(imp(dateId, "31/02/2026")), false);
  });
  it("isIsoDate menolak tanggal yang tidak ada", () => {
    assert.equal(isIsoDate("2026-12-01"), true);
    assert.equal(isIsoDate("2026-02-31"), false);
    assert.equal(isIsoDate("01/12/2026"), false);
    assert.equal(isIsoDate(46357), false);
  });
});

describe("yaTidak", () => {
  it("semua bentuk ya/tidak, termasuk hasil cast parser", () => {
    for (const v of ["benar", "Y", "true", true, 1]) assert.equal(imp(yaTidak, v), true, String(v));
    for (const v of ["salah", "T", "false", false, 0]) assert.equal(imp(yaTidak, v), false, String(v));
  });
  it("nilai lain dibiarkan agar ditolak, kosong menjadi undefined", () => {
    assert.equal(imp(yaTidak, "mungkin"), "mungkin");
    assert.equal(imp(yaTidak, ""), undefined);
  });
});

describe("selectByLabel", () => {
  const availability = selectByLabel({ "stok terbatas": "terbatas", "segera terbit": "segera" });
  it("label dipetakan ke nilai, nilai biasa menjadi huruf kecil", () => {
    assert.equal(imp(availability, "Stok terbatas"), "terbatas");
    assert.equal(imp(availability, " Segera Terbit "), "segera");
    assert.equal(imp(availability, "Tersedia"), "tersedia");
  });
});

describe("richText dan plainTextToLexical", () => {
  it("teks polos: baris kosong memisahkan paragraf (juga CRLF)", () => {
    const result = imp(richText, "Paragraf satu.\r\n\r\nParagraf dua\nlanjutan.") as ReturnType<typeof plainTextToLexical>;
    assert.equal(result.root.children.length, 2);
    assert.equal(result.root.children[1].children[0].text, "Paragraf dua lanjutan.");
  });
  it("bentuk node sama dengan seed/lexical.ts", () => {
    assert.deepEqual(plainTextToLexical("Halo."), doc(p("Halo.")));
  });
  it("JSON Lexical hasil ekspor diteruskan utuh", () => {
    const lexical = doc(p("Tebal"));
    assert.deepEqual(imp(richText, JSON.stringify(lexical)), lexical);
    assert.equal(imp(richText, lexical), lexical);
  });
  it("teks yang tampak JSON tetapi bukan Lexical tetap teks", () => {
    const result = imp(richText, '{"bukan": "lexical"}') as ReturnType<typeof plainTextToLexical>;
    assert.equal(result.root.children[0].children[0].text, '{"bukan": "lexical"}');
    assert.equal(imp(richText, "   "), undefined);
  });
});

describe("splitKeys", () => {
  it("pemisah |, koma, titik koma, larik, dan objek {id}", () => {
    assert.deepEqual(splitKeys("a|b"), ["a", "b"]);
    assert.deepEqual(splitKeys("a, b"), ["a", "b"]);
    assert.deepEqual(splitKeys(["a|b", "c"]), ["a", "b", "c"]);
    assert.deepEqual(splitKeys([{ id: 5 }, { id: "6" }]), ["5", "6"]);
    assert.deepEqual(splitKeys(7), ["7"]);
    assert.deepEqual(splitKeys(undefined), []);
    assert.deepEqual(splitKeys(" | "), []);
  });
});

describe("isSemicolonCsv", () => {
  const enc = (s: string) => new TextEncoder().encode(s);

  it("baris judul berpemisah titik koma dari Excel wilayah Indonesia (dengan BOM)", () => {
    assert.equal(isSemicolonCsv(enc("\uFEFFslug;title;authors;price\nbuku;Buku;budi;85000\n")), true);
    assert.equal(isSemicolonCsv("slug;title\r\nx;14,5\r\n"), true);
    assert.equal(isSemicolonCsv("\n\nslug;title\n"), true, "baris kosong di awal dilewati");
  });

  it("CSV koma biasa tidak ditandai, termasuk sel yang berisi titik koma", () => {
    assert.equal(isSemicolonCsv(enc("\uFEFFslug,title,authors\nbuku,Buku,a;b\n")), false);
    assert.equal(isSemicolonCsv("slug\nbuku-satu\n"), false, "satu kolom");
    assert.equal(isSemicolonCsv(""), false);
  });
});

describe("hook ekspor", () => {
  it("exportSlugs menulis slug dipisah | untuk CSV, bawaan untuk JSON", () => {
    assert.equal(exp(exportSlugs, [{ id: 1, slug: "penulis-a" }, { id: 2, slug: "penulis-b" }]), "penulis-a|penulis-b");
    assert.equal(exp(exportSlugs, { id: 3, slug: "seri-a" }), "seri-a");
    assert.equal(exp(exportSlugs, [4, 5]), "4|5");
    assert.equal(exp(exportSlugs, null), "");
    assert.equal(exp(exportSlugs, [{ id: 1, slug: "a" }], "json"), undefined);
  });
  it("exportFilename menulis nama berkas Media", () => {
    assert.equal(exp(exportFilename, { id: 9, filename: "sampul-a.webp" }), "sampul-a.webp");
    assert.equal(exp(exportFilename, 9), "9");
    assert.equal(exp(exportFilename, null), "");
    assert.equal(exp(exportFilename, { id: 9 }, "json"), undefined);
  });
});
