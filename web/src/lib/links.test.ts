import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isSafeExternalUrl, isSafeInternalPath, linkTargetsPath, resolveLink, safeHref, validateLinkUrl } from "./links";

describe("links: validasi alamat", () => {
  it("menolak skema dan bentuk berbahaya", () => {
    for (const bad of ["javascript:alert(1)", "data:x", "http://x", "//evil", "/\\evil", " /x y", "/x y"]) {
      assert.equal(isSafeInternalPath(bad) || isSafeExternalUrl(bad), false, bad);
      assert.equal(safeHref(bad), null, bad);
    }
  });
  it("menerima path internal dan https", () => {
    assert.equal(safeHref("/institusi"), "/institusi");
    assert.equal(safeHref("https://x.id/a"), "https://x.id/a");
    assert.equal(validateLinkUrl("/kategori/politik"), true);
    assert.notEqual(validateLinkUrl("http://x.id"), true);
  });
  it("mailto hanya bila diizinkan", () => {
    assert.equal(safeHref("mailto:a@b.id", { allowMailto: true }), "mailto:a@b.id");
    assert.equal(safeHref("mailto:a@b.id"), null);
    assert.equal(safeHref(42), null);
  });
});

describe("resolveLink", () => {
  it("rute bawaan", () => {
    assert.deepEqual(resolveLink({ type: "route", route: "tentang" }), { href: "/tentang", external: false, newTab: false });
    assert.equal(resolveLink({ type: "route", route: "tidak-ada" }), null);
  });
  it("halaman: hanya bila terisi slug (draf/terhapus = id saja)", () => {
    assert.deepEqual(resolveLink({ type: "page", page: { id: 1, slug: "tentang" } }), { href: "/tentang", external: false, newTab: false });
    assert.equal(resolveLink({ type: "page", page: 1 }), null);
  });
  it("alamat lain", () => {
    assert.deepEqual(resolveLink({ type: "custom", url: "https://shopee.co.id/x", newTab: true }), {
      href: "https://shopee.co.id/x",
      external: true,
      newTab: true,
    });
    assert.equal(resolveLink({ type: "custom", url: "javascript:alert(1)" }), null);
    assert.equal(resolveLink({ type: "none" }), null);
  });
  it("linkTargetsPath", () => {
    assert.equal(linkTargetsPath({ type: "route", route: "tentang" }, "/tentang"), true);
    assert.equal(linkTargetsPath({ type: "custom", url: "/tentang/" }, "/tentang"), true);
    assert.equal(linkTargetsPath({ type: "route", route: "kontak" }, "/tentang"), false);
  });
});
