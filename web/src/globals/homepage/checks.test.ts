import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  checkAnchor,
  checkForbiddenName,
  checkHref,
  checkIntro,
  checkLayout,
  checkRichTextLinks,
  FORBIDDEN_NAME_MESSAGE,
  IDENTITY_SENTENCE,
  isReservedAnchor,
  PUBLISHER_TOKEN,
} from "./checks";
import { DEFAULT_HERO_INTRO, HOMEPAGE_DEFAULT_LAYOUT } from "./defaults";

const hero = { blockType: "hero" };
const news = (anchor?: string) => ({ blockType: "news", anchor });
/** Nama lama dirakit dari potongan agar tidak tertulis utuh di kode sumber. */
const OLD = ["Populi", "Center"] as const;
const oldName = (sep: string, second: string = OLD[1]) => `${OLD[0]}${sep}${second}`;

describe("checkLayout", () => {
  it("menerima susunan bawaan", () => {
    assert.equal(checkLayout([...HOMEPAGE_DEFAULT_LAYOUT]), true);
  });
  it("menolak susunan kosong dan Pembuka yang bukan paling atas", () => {
    assert.match(String(checkLayout([])), /Bagian pertama harus “Pembuka”/);
    assert.match(String(checkLayout([news(), hero])), /Bagian pertama harus “Pembuka”/);
  });
  it("menolak dua Pembuka", () => {
    assert.match(String(checkLayout([hero, news(), hero])), /Hanya boleh ada satu bagian “Pembuka”/);
  });
  it("menolak jangkar ganda, kosong tidak dihitung", () => {
    assert.match(String(checkLayout([hero, news("kabar"), news("kabar")])), /“kabar” dipakai lebih dari satu/);
    assert.equal(checkLayout([hero, news(""), news("")]), true);
  });
  it("bukan larik (jumlah baris dari form-state) dianggap lolos", () => {
    assert.equal(checkLayout(3), true);
    assert.equal(checkLayout(undefined), true);
  });
});

describe("checkIntro", () => {
  it("wajib diawali kalimat identitas penerbit", () => {
    assert.equal(checkIntro(DEFAULT_HERO_INTRO), true);
    assert.equal(checkIntro(IDENTITY_SENTENCE), true);
    assert.equal(checkIntro(`  ${IDENTITY_SENTENCE} Kalimat lain bebas.`), true);
    assert.notEqual(checkIntro("Kami menerbitkan buku."), true);
    assert.notEqual(checkIntro(""), true);
    assert.notEqual(checkIntro(null), true);
  });
  it("penanda saja tidak cukup: yayasan harus disebut sebagai penerbit", () => {
    assert.notEqual(checkIntro(PUBLISHER_TOKEN), true);
    assert.notEqual(checkIntro(`Mitra distribusi ${PUBLISHER_TOKEN}.`), true);
    assert.notEqual(checkIntro(`${PUBLISHER_TOKEN} menerbitkan buku.`), true);
  });
});

describe("checkAnchor", () => {
  it("kosong boleh; huruf kecil, angka, tanda hubung", () => {
    assert.equal(checkAnchor(""), true);
    assert.equal(checkAnchor(null), true);
    assert.equal(checkAnchor("cara-pesan"), true);
    assert.equal(checkAnchor("rak-2"), true);
    assert.equal(checkAnchor("nlx"), true);
  });
  it("menolak bentuk yang salah dan ID yang dipakai situs", () => {
    for (const bad of ["Cara", "1abc", "a", "a b", "a_b", "-x", "x".repeat(41)]) assert.notEqual(checkAnchor(bad), true, bad);
    for (const reserved of ["konten", "sorotan", "cari-beranda", "cari-menu", "footer-kabar"]) {
      assert.match(String(checkAnchor(reserved)), /sudah dipakai situs/, reserved);
    }
  });
  it("menolak ID formulir kabar di footer dan seluruh awalan nl-/footer-", () => {
    for (const reserved of ["nl-website", "nl-email", "nl-email-error", "nl-consent", "nl-consent-error", "nl-baru", "footer-x"]) {
      assert.match(String(checkAnchor(reserved)), /sudah dipakai situs/, reserved);
      assert.equal(isReservedAnchor(reserved), true, reserved);
    }
    assert.equal(isReservedAnchor("kabar"), false);
  });
});

describe("checkForbiddenName", () => {
  it("menangkap variasi penulisan", () => {
    const variants = [
      oldName(" "),
      oldName("  ", "centre").toLowerCase(),
      oldName("").toUpperCase(),
      `Penerbit ${oldName("\n").toLowerCase()}`,
      oldName("-"),
      oldName("-").toLowerCase(),
      oldName("."),
      oldName("_"),
      oldName("​"),
      `https://${oldName("").toLowerCase()}.org`,
    ];
    for (const bad of variants) assert.notEqual(checkForbiddenName(bad), true, JSON.stringify(bad));
  });
  it("meloloskan nama resmi dan nilai bukan teks", () => {
    assert.equal(checkForbiddenName("Yayasan Populi Indonesia"), true);
    assert.equal(checkForbiddenName("populi-indonesia"), true);
    assert.equal(checkForbiddenName(undefined), true);
    assert.equal(checkForbiddenName(12), true);
  });
  it("pesan galat tidak mengeja nama lama", () => {
    assert.equal(checkForbiddenName(FORBIDDEN_NAME_MESSAGE), true);
    assert.ok(!/populi[^\p{L}\p{N}]*cent/iu.test(FORBIDDEN_NAME_MESSAGE));
  });
});

describe("checkHref", () => {
  it("menolak alamat berbahaya", () => {
    for (const bad of ["//evil.com", "javascript:alert(1)", "/\\evil", " /x y", "http://x.id", "data:text/html,x"]) {
      assert.notEqual(checkHref(bad), true, bad);
    }
  });
  it("menerima path situs, https, dan mailto", () => {
    for (const ok of ["/institusi", "https://x", "mailto:a@b.id", "", null]) assert.equal(checkHref(ok), true, String(ok));
  });
});

describe("checkRichTextLinks", () => {
  const doc = (url: string, linkType = "custom") => ({
    root: {
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [{ type: "link", fields: { url, linkType }, children: [{ type: "text", text: "tautan" }] }],
        },
      ],
    },
  });
  it("hanya path situs, https, mailto", () => {
    assert.equal(checkRichTextLinks(doc("/buku")), true);
    assert.equal(checkRichTextLinks(doc("https://x.id")), true);
    assert.notEqual(checkRichTextLinks(doc("javascript:alert(1)")), true);
    assert.notEqual(checkRichTextLinks(doc("/buku", "internal")), true);
    assert.equal(checkRichTextLinks(null), true);
  });
});
