import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateIsbn13 } from "../collections/Books";
import { formatRupiah } from "./format";
import { normalize, tokenize, withinEditDistance } from "./fuzzy";
import { rateKey } from "./ip";
import { getDisplayPrice } from "./pricing";
import { buildWaMessage, waUrl } from "./wa";

const NOW = new Date("2026-11-10T05:00:00Z");
const day = 24 * 60 * 60 * 1000;

describe("getDisplayPrice (harga coret berperiode, UU 8/1999 Pasal 10)", () => {
  it("tanpa harga normal: tidak ada coret", () => {
    assert.deepEqual(getDisplayPrice({ price: 85000 }, NOW), { price: 85000, compareAt: null, percentOff: null });
  });
  it("di dalam periode diskon: coret tampil", () => {
    const r = getDisplayPrice(
      {
        price: 98000,
        listPrice: 120000,
        discountStart: new Date(NOW.getTime() - day).toISOString(),
        discountEnd: new Date(NOW.getTime() + day).toISOString(),
      },
      NOW,
    );
    assert.deepEqual(r, { price: 98000, compareAt: 120000, percentOff: 18 });
  });
  it("setelah periode berakhir: harga kembali normal, tanpa coret", () => {
    const r = getDisplayPrice(
      { price: 98000, listPrice: 120000, discountEnd: new Date(NOW.getTime() - day).toISOString() },
      NOW,
    );
    assert.deepEqual(r, { price: 120000, compareAt: null, percentOff: null });
  });
  it("sebelum periode mulai: harga normal", () => {
    const r = getDisplayPrice(
      { price: 98000, listPrice: 120000, discountStart: new Date(NOW.getTime() + day).toISOString() },
      NOW,
    );
    assert.equal(r.compareAt, null);
    assert.equal(r.price, 120000);
  });
  it("harga normal lebih rendah dari harga jual diabaikan", () => {
    assert.equal(getDisplayPrice({ price: 100000, listPrice: 90000 }, NOW).compareAt, null);
  });
});

describe("validateIsbn13", () => {
  it("menerima ISBN sah dengan dan tanpa tanda hubung", () => {
    assert.equal(validateIsbn13("978-623-9999-01-8"), true);
    assert.equal(validateIsbn13("9786239999018"), true);
    assert.equal(validateIsbn13(""), true);
  });
  it("menolak angka pemeriksa salah dan angka tertukar", () => {
    assert.equal(typeof validateIsbn13("978-623-9999-01-9"), "string");
    assert.equal(typeof validateIsbn13("978-623-9999-10-8"), "string");
  });
  it("menolak panjang salah, awalan salah, dan karakter lain", () => {
    assert.equal(typeof validateIsbn13("978-623-99999-01-1"), "string");
    assert.equal(typeof validateIsbn13("123-4-5678-9012-3"), "string");
    assert.equal(typeof validateIsbn13("978 623 9999 01 8"), "string");
  });
});

describe("pesan WhatsApp", () => {
  const book = {
    title: "Membaca Suara Pemilih",
    authors: [{ name: "Sekar Ayuningtyas" }],
    isbn13: "978-623-9999-01-8",
    price: 98000,
    slug: "membaca-suara-pemilih",
  } as unknown as Parameters<typeof buildWaMessage>[1];

  it("mengisi penanda dan membiarkan penanda tak dikenal", () => {
    const msg = buildWaMessage("{judul} | {penulis} | {harga} | {isbn} | {url} | {lain}", book, "https://contoh.test/buku/x");
    assert.equal(msg, "Membaca Suara Pemilih | Sekar Ayuningtyas | Rp98.000 | 978-623-9999-01-8 | https://contoh.test/buku/x | {lain}");
  });
  it("waUrl membuang karakter non-angka dan meng-encode pesan", () => {
    assert.equal(waUrl("+62 812-3456", "a b&c"), "https://wa.me/628123456?text=a%20b%26c");
  });
  it("format Rupiah tanpa spasi", () => {
    assert.equal(formatRupiah(1250000), "Rp1.250.000");
  });
});

describe("rateKey (kunci batas laju)", () => {
  it("IPv4 tetap alamat utuh", () => {
    assert.equal(rateKey("203.0.113.77"), "203.0.113.77");
    assert.equal(rateKey("::ffff:203.0.113.77"), "203.0.113.77");
  });
  it("IPv6 dinormalkan ke /64, sehingga rotasi alamat dalam satu /64 memakai bucket yang sama", () => {
    const a = rateKey("2001:db8:abcd:12:1111:2222:3333:4444");
    const b = rateKey("2001:db8:abcd:12::dead:beef");
    assert.equal(a, "2001:db8:abcd:12::/64");
    assert.equal(a, b);
  });
  it("IPv6 bentuk pendek, nol di depan, huruf besar, dan kurung siku", () => {
    assert.equal(rateKey("2001:DB8::1"), "2001:db8:0:0::/64");
    assert.equal(rateKey("[2001:0db8:0000:0042::1]"), "2001:db8:0:42::/64");
  });
  it("/64 yang berbeda memakai bucket berbeda", () => {
    assert.notEqual(rateKey("2001:db8:0:1::1"), rateKey("2001:db8:0:2::1"));
  });
});

describe("fuzzy (F-CARI-01)", () => {
  it("normalize membuang diakritik dan tanda baca", () => {
    assert.equal(normalize("  Kebijakan Publik: Édisi-2! "), "kebijakan publik edisi 2");
    assert.deepEqual(tokenize("a Ekonomi & Politik"), ["ekonomi", "politik"]);
  });
  it("satu huruf salah, hilang, atau tertukar tetap cocok", () => {
    assert.equal(withinEditDistance("pemlih", "pemilih", 1), true);
    assert.equal(withinEditDistance("birokrsi", "birokrasi", 1), true);
    assert.equal(withinEditDistance("polirik", "politik", 1), true);
    assert.equal(withinEditDistance("piltiik", "politik", 2), true);
  });
  it("kata berbeda jauh tidak cocok", () => {
    assert.equal(withinEditDistance("ekonomi", "politik", 2), false);
    assert.equal(withinEditDistance("abc", "abcdef", 1), false);
  });
});
