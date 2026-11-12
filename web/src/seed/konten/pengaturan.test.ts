import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EMAIL_PENERBIT, PENGATURAN_PASTI, isPlaceholder, susunPengaturan, teleponDariWa } from "./pengaturan";

describe("pengaturan situs", () => {
  it("placeholder seed dikenali", () => {
    assert.equal(isPlaceholder(""), true);
    assert.equal(isPlaceholder(null), true);
    assert.equal(isPlaceholder("[Alamat kantor — isi dari Pengaturan Situs]"), true);
    assert.equal(isPlaceholder("penerbit@contoh.test"), true);
    assert.equal(isPlaceholder("Jalan Mampang Prapatan VIII No.38"), false);
  });

  it("telepon dari nomor WhatsApp", () => {
    assert.equal(teleponDariWa("6281234567890"), "0812-3456-7890");
    assert.equal(teleponDariWa("62215551234"), "0215-5512-34");
    assert.equal(teleponDariWa("620000000000"), null);
    assert.equal(teleponDariWa("08123"), null);
  });

  it("isian seed diganti, isian admin dibiarkan", () => {
    const { patch, tertunda } = susunPengaturan({
      email: "penerbit@contoh.test",
      address: "[Alamat kantor — isi dari Pengaturan Situs]",
      legalEntityName: "Yayasan Populi Indonesia",
      legalBasis: PENGATURAN_PASTI.legalBasis,
      nib: "",
      pktnContact: "[Isi kontak resmi Ditjen PKTN]",
      waNumber: "620000000000",
      phone: "",
      publisherResponsible: "[Nama, jabatan]",
      serviceHours: "Senin–Jumat, 09.00–17.00 WIB",
      marketplaceStores: [{ platform: "tokopedia", url: "https://www.tokopedia.com/" }],
    });
    assert.deepEqual(Object.keys(patch).sort(), [
      "address",
      "editorialEmail",
      "email",
      "marketplaceStores",
      "nib",
      "pktnContact",
    ]);
    assert.equal(patch.email, EMAIL_PENERBIT);
    assert.deepEqual(patch.marketplaceStores, []);
    assert.ok(tertunda.some((t) => t.startsWith("Nomor WhatsApp")));
    assert.ok(tertunda.some((t) => t.startsWith("Penanggung jawab")));
    assert.ok(!tertunda.some((t) => t.startsWith("Jam layanan")));
  });

  it("toko contoh dibuang, toko yang diisi admin dibiarkan; tanpa toko tidak ada perubahan", () => {
    const tokoAdmin = { id: "a1", platform: "shopee", url: "https://shopee.co.id/yayasanpopuli" };
    const { patch } = susunPengaturan({
      marketplaceStores: [{ id: "x", platform: "tokopedia", url: "https://www.tokopedia.com/" }, tokoAdmin],
    });
    assert.deepEqual(patch.marketplaceStores, [tokoAdmin]);
    assert.equal(susunPengaturan({ marketplaceStores: [tokoAdmin] }).patch.marketplaceStores, undefined);
    assert.equal(susunPengaturan({ marketplaceStores: [] }).patch.marketplaceStores, undefined);
  });

  it("telepon diisi dari WA hanya bila telepon kosong", () => {
    assert.equal(susunPengaturan({ waNumber: "6281234567890", phone: "" }).patch.phone, "0812-3456-7890");
    assert.equal(susunPengaturan({ waNumber: "6281234567890", phone: "021-555" }).patch.phone, undefined);
  });

  it("email yang sudah diisi admin tidak ditimpa", () => {
    assert.equal(susunPengaturan({ email: "redaksi@yayasanpopuliindonesia.org" }).patch.email, undefined);
  });
});
