import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Media } from "@/payload-types";
import { asMedia, ogBase, ogImageFrom, seoTitle } from "./seo";

const SITE = "Yayasan Populi Indonesia";

const media = (m: Partial<Media>): Media => ({
  id: 1,
  alt: "",
  updatedAt: "2026-01-01T00:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
  ...m,
});

describe("seoTitle", () => {
  it("judul yang memuat nama situs menjadi absolut (tanpa membedakan huruf)", () => {
    assert.deepEqual(seoTitle(`Judul — ${SITE}`, SITE, "x"), { absolute: `Judul — ${SITE}` });
    assert.deepEqual(seoTitle("Judul — yayasan populi indonesia", SITE, "x"), {
      absolute: "Judul — yayasan populi indonesia",
    });
  });

  it("judul tanpa nama situs dikembalikan apa adanya untuk template layout", () => {
    assert.equal(seoTitle("  Judul Buku  ", SITE, "x"), "Judul Buku");
  });

  it("kosong memakai fallback", () => {
    assert.equal(seoTitle("", SITE, "fallback"), "fallback");
    assert.equal(seoTitle("   ", SITE, "fallback"), "fallback");
    assert.equal(seoTitle(null, SITE, "fallback"), "fallback");
    assert.equal(seoTitle(undefined, SITE, "fallback"), "fallback");
  });

  it("nama situs kosong tidak membuat semua judul absolut", () => {
    assert.equal(seoTitle("Judul", "", "x"), "Judul");
  });
});

describe("ogImageFrom", () => {
  it("mengutamakan ukuran og 1200×630", () => {
    const m = media({
      url: "/api/media/file/a.webp",
      width: 800,
      height: 1200,
      alt: "Sampul buku A",
      sizes: { og: { url: "/api/media/file/a-1200x630.jpg", width: 1200, height: 630 } },
    });
    assert.deepEqual(ogImageFrom(m, "Sampul"), {
      url: "/api/media/file/a-1200x630.jpg",
      width: 1200,
      height: 630,
      alt: "Sampul buku A",
    });
  });

  it("memakai berkas asli bila ukuran og belum ada", () => {
    const m = media({ url: "/api/media/file/a.webp", width: 800, height: 1200, alt: "Sampul buku A", sizes: {} });
    assert.deepEqual(ogImageFrom(m, "Sampul"), { url: "/api/media/file/a.webp", width: 800, height: 1200, alt: "Sampul buku A" });
  });

  it("memakai alt cadangan bila alt kosong", () => {
    const m = media({ url: "/api/media/file/a.webp", alt: "  ", sizes: { og: { url: "/api/media/file/a-og.jpg" } } });
    assert.deepEqual(ogImageFrom(m, "Sampul"), { url: "/api/media/file/a-og.jpg", width: 1200, height: 630, alt: "Sampul" });
  });

  it("null bila tidak ada media atau URL", () => {
    assert.equal(ogImageFrom(null, "Sampul"), null);
    assert.equal(ogImageFrom(media({ url: null }), "Sampul"), null);
  });
});

describe("asMedia dan ogBase", () => {
  it("asMedia hanya menerima objek", () => {
    assert.equal(asMedia(5), null);
    assert.equal(asMedia(null), null);
    const m = media({ alt: "x" });
    assert.equal(asMedia(m), m);
  });

  it("ogBase menyertakan siteName dan locale", () => {
    assert.deepEqual(ogBase({ siteName: SITE }), { siteName: SITE, locale: "id_ID" });
  });
});
