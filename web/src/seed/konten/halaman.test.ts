import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { checkForbiddenName } from "../../globals/homepage/checks";
import { MAX_FIELDS, RETENTION_MAX_DAYS, RETENTION_MIN_DAYS, toFieldName } from "../../lib/form-builder";
import { FORMULIR_RETUR, HALAMAN } from "./halaman";
import { EMAIL_PENERBIT } from "./pengaturan";
import { keLexical, teksPolos } from "./teks";

const semuaTeks = HALAMAN.map((h) => [h.title, h.summary, teksPolos(h.naskah)].join("\n")).join("\n");

describe("konten halaman resmi", () => {
  it("setiap halaman bisa diubah ke Lexical (tautan dikenal, tidak ada simpul kosong)", () => {
    for (const h of HALAMAN) {
      assert.doesNotThrow(() => keLexical(h.naskah, { formId: 1 }), `halaman ${h.slug}`);
    }
  });

  it("slug dan urutan footer unik; ringkasan muat di kolom (≤ 320)", () => {
    assert.equal(new Set(HALAMAN.map((h) => h.slug)).size, HALAMAN.length);
    assert.equal(new Set(HALAMAN.map((h) => h.footerOrder)).size, HALAMAN.length);
    for (const h of HALAMAN) assert.ok(h.summary.length <= 320, h.slug);
  });

  it("Kebijakan Privasi tetap di /kebijakan-privasi (ditautkan dari setiap formulir)", () => {
    assert.ok(HALAMAN.some((h) => h.slug === "kebijakan-privasi"));
  });

  it("tidak menyebut nama terlarang dan tidak menyisakan placeholder", () => {
    assert.equal(checkForbiddenName(semuaTeks), true);
    assert.doesNotMatch(semuaTeks, /\[[^\]]*\]/, "placeholder [..] tersisa");
    assert.doesNotMatch(semuaTeks, /@contoh\.|populicenter/i);
  });

  it("tidak mengaku punya toko marketplace (toko resmi belum ada)", () => {
    assert.doesNotMatch(semuaTeks, /tokopedia|shopee|dua jalur/i);
    const formulir = FORMULIR_RETUR.fields
      .flatMap((f) => [f.label, ...(f.options ?? []).map((o) => o.label)])
      .join("\n");
    assert.doesNotMatch(formulir, /marketplace/i, "formulir retur menyebut toko marketplace");
    // Halaman pemeliharaan toko-proxy (tampil saat app mati, termasuk saat deploy).
    const here = path.dirname(fileURLToPath(import.meta.url));
    const pemeliharaan = readFileSync(path.resolve(here, "../../../../deploy/proxy/pemeliharaan/pemeliharaan.html"), "utf8");
    assert.doesNotMatch(pemeliharaan, /marketplace|populi ?center/i);
  });

  it("tidak memuat klausul penolakan pengembalian (UU 8/1999 Pasal 18)", () => {
    assert.doesNotMatch(semuaTeks, /tidak dapat (dikembalikan|ditukar)/i);
  });

  it("email penerbit dipakai, nomor telepon tidak ditulis di teks", () => {
    assert.ok(semuaTeks.includes(EMAIL_PENERBIT));
    assert.doesNotMatch(semuaTeks.replace(/0853-1111-1010|\(021\) 3441839/g, ""), /\b08\d{2}[- ]?\d{3,4}[- ]?\d{3,4}\b/);
  });

  it("formulir hanya di halaman Pengembalian & Penukaran, tepat satu kali", () => {
    for (const h of HALAMAN) {
      const n = h.naskah.filter((s) => s.t === "form").length;
      assert.equal(n, h.slug === "pengembalian" ? 1 : 0, h.slug);
    }
  });
});

describe("formulir pengajuan penukaran atau pengembalian", () => {
  const f = FORMULIR_RETUR;
  it("sesuai batas plugin formulir", () => {
    assert.ok(f.fields.length >= 1 && f.fields.length <= MAX_FIELDS);
    assert.ok(f.purpose.length <= 400);
    assert.ok(f.consentLabel.length >= 10 && f.consentLabel.length <= 600);
    assert.ok(f.retentionDays >= RETENTION_MIN_DAYS && f.retentionDays <= RETENTION_MAX_DAYS);
  });
  it("nama kolom unik dan sudah dalam bentuk akhir", () => {
    const names = f.fields.map((x) => x.name);
    assert.equal(new Set(names).size, names.length);
    for (const n of names) assert.equal(toFieldName(n), n);
  });
  it("pilihan tersedia untuk select dan radio; tidak meminta data sensitif", () => {
    for (const x of f.fields) {
      if (x.blockType === "select" || x.blockType === "radio") assert.ok((x.options?.length ?? 0) >= 2, x.name);
    }
    assert.doesNotMatch(f.fields.map((x) => `${x.name} ${x.label}`).join(" "), /nik|rekening|ktp|kata sandi/i);
  });
  it("label tidak menulis “opsional” sendiri (penanda opsional ditambahkan saat render)", () => {
    for (const x of f.fields) assert.doesNotMatch(x.label, /opsional/i, x.name);
  });
});
