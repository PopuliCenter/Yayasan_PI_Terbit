import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PREVIEW_HOME, previewHref, previewLink } from "./preview-url";

describe("previewHref", () => {
  it("mengarahkan tautan beranda ke beranda pratinjau", () => {
    assert.equal(PREVIEW_HOME, "/pratinjau/beranda");
    assert.equal(previewHref("/"), "/pratinjau/beranda");
    assert.equal(previewHref("/#cara-pesan"), "/pratinjau/beranda#cara-pesan");
    assert.equal(previewHref("/?q=sejarah"), "/pratinjau/beranda?q=sejarah");
  });
  it("membiarkan path lain dan alamat luar", () => {
    for (const href of [
      "/buku",
      "/buku/judul#ulasan",
      "/tentang?x=1",
      "/pratinjau/beranda",
      "https://contoh.id/",
      "mailto:redaksi@contoh.id",
      "",
    ]) {
      assert.equal(previewHref(href), href, href);
    }
  });
});

describe("previewLink", () => {
  it("menulis ulang tautan internal, bidang lain tetap", () => {
    assert.deepEqual(previewLink({ href: "/#cara-pesan", external: false, newTab: true, label: "Cara pesan" }), {
      href: "/pratinjau/beranda#cara-pesan",
      external: false,
      newTab: true,
      label: "Cara pesan",
    });
  });
  it("tautan luar dikembalikan apa adanya", () => {
    const link = { href: "https://contoh.id/", external: true, newTab: false };
    assert.equal(previewLink(link), link);
  });
});
