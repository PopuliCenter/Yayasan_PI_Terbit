import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parsePreviewRequest, previewPath, publicPathFor } from "./preview-url";

describe("previewPath", () => {
  it("null untuk data tidak lengkap atau tidak dikenal", () => {
    assert.equal(previewPath({ collection: "books", id: 1 }), null);
    assert.equal(previewPath({ collection: "books", slug: "x" }), null);
    assert.equal(previewPath({ collection: "users", id: 1, slug: "x" }), null);
    assert.equal(previewPath({ collection: "books", id: "1a", slug: "x" }), null);
    assert.equal(previewPath({ collection: "books", id: 1, slug: "  " }), null);
    assert.equal(previewPath({ global: "settings" }), null);
  });
  it("membentuk path relatif", () => {
    assert.equal(previewPath({ global: "homepage" }), "/pratinjau/mulai?global=homepage");
    assert.equal(previewPath({ collection: "books", id: 7, slug: "judul" }), "/pratinjau/mulai?koleksi=books&id=7&slug=judul");
  });
});

describe("parsePreviewRequest", () => {
  it("menolak masukan di luar daftar putih", () => {
    for (const q of ["koleksi=users&id=1", "global=settings", "koleksi=books&id=1;drop", "koleksi=books&id=1234567890123", "koleksi=books"]) {
      assert.equal(parsePreviewRequest(new URLSearchParams(q)), null, q);
    }
  });
  it("menerima masukan sah", () => {
    assert.deepEqual(parsePreviewRequest(new URLSearchParams("koleksi=pages&id=12&slug=x")), { kind: "collection", collection: "pages", id: 12 });
    assert.deepEqual(parsePreviewRequest(new URLSearchParams("global=appearance")), { kind: "global", global: "appearance" });
  });
  it("publicPathFor", () => {
    assert.equal(publicPathFor("pages", "tentang"), "/tentang");
    assert.equal(publicPathFor("books", "x"), "/buku/x");
  });
});
