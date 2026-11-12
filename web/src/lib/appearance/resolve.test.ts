import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveLink, validateLinkUrl } from "../links";
import { DEFAULT_FOOTER, DEFAULT_NAV, resolveAppearance } from "./resolve";

const NOW = new Date("2026-11-11T05:00:00Z");

describe("tautan", () => {
  it("menolak skema berbahaya dan path ganjil", () => {
    for (const url of ["javascript:alert(1)", "data:text/html,x", "http://contoh.id", "//evil.example", "/\\evil", "/a b", "mailto:x@y.id", ""]) {
      assert.equal(resolveLink({ type: "custom", url }), null, url);
      assert.notEqual(validateLinkUrl(url), true, url);
    }
  });
  it("menerima path internal dan https", () => {
    assert.deepEqual(resolveLink({ type: "custom", url: "/kategori/politik" }), { href: "/kategori/politik", external: false, newTab: false });
    assert.deepEqual(resolveLink({ type: "custom", url: "https://shopee.co.id/x", newTab: true }), { href: "https://shopee.co.id/x", external: true, newTab: true });
    assert.deepEqual(resolveLink({ type: "route", route: "katalog" }), { href: "/buku", external: false, newTab: false });
  });
  it("halaman statis yang tidak terisi (draf/terhapus) dibuang", () => {
    assert.equal(resolveLink({ type: "page", page: 12 }), null);
    assert.equal(resolveLink({ type: "page", page: null }), null);
    assert.deepEqual(resolveLink({ type: "page", page: { id: 3, slug: "kirim-naskah" } }), { href: "/kirim-naskah", external: false, newTab: false });
  });
});

describe("resolveAppearance", () => {
  it("global kosong = tampilan sebelum fitur ini", () => {
    for (const raw of [null, undefined, {}]) {
      const r = resolveAppearance(raw, NOW);
      assert.deepEqual(
        r.headerNav.map((i) => [i.label, i.href, i.mobileOnly]),
        [
          ["Katalog", "/buku", false],
          ["Penulis", "/penulis", false],
          ["Kabar", "/kabar", false],
          ["Cara Pesan", "/cara-pesan", false],
          ["Tentang Kami", "/tentang", false],
          ["Kontak", "/kontak", true],
        ],
      );
      assert.deepEqual(r.footer.links.map((l) => [l.label, l.href]), [["Pembelian institusi", "/institusi"]]);
      assert.equal(r.footer.infoTitle, "Informasi");
      assert.equal(r.theme.css, "");
      assert.equal(r.announcement, null);
      assert.equal(r.showWhatsAppButton, true);
    }
  });

  it("nilai bawaan prop header/footer sama dengan global kosong", () => {
    const r = resolveAppearance(null, NOW);
    assert.deepEqual(DEFAULT_NAV, r.headerNav);
    assert.deepEqual(DEFAULT_FOOTER, r.footer);
    assert.deepEqual(DEFAULT_FOOTER, { infoTitle: "Informasi", links: [{ href: "/institusi", external: false, newTab: false, label: "Pembelian institusi" }], note: null, showNewsletter: true, showSocialLinks: true });
  });

  it("data rusak tidak membuat resolver melempar", () => {
    const junk = [{ headerNav: 5, footerLinks: "x", announcement: { enabled: true, text: 7, link: "y" }, theme: "z" }, "teks", 42];
    for (const raw of junk) {
      const r = resolveAppearance(raw as unknown as Parameters<typeof resolveAppearance>[0], NOW);
      assert.equal(r.headerNav[0].href, "/buku");
      assert.equal(r.footer.links[0]?.href, "/institusi");
      assert.equal(r.announcement, null);
      assert.equal(r.theme.css, "");
    }
  });

  it("url tautan yang bukan teks dibuang, resolver tidak melempar", () => {
    const bad = [5, { trim: 1 }, [1], true];
    for (const url of bad) {
      const link = { type: "custom", url };
      const raw = {
        headerNav: [{ label: "Rusak", visibility: "all", link }],
        footerLinks: [{ label: "Rusak", link }],
        announcement: { enabled: true, text: "Libur", link },
      } as unknown as Parameters<typeof resolveAppearance>[0];
      const r = resolveAppearance(raw, NOW);
      assert.equal(r.headerNav[0].href, "/buku", JSON.stringify(url));
      assert.deepEqual(r.footer.links, [], JSON.stringify(url));
      assert.equal(r.announcement?.text, "Libur");
      assert.equal(r.announcement?.link, null);
    }
  });

  it("footer tanpa tautan tambahan bila admin mengosongkannya", () => {
    assert.deepEqual(resolveAppearance({ footerLinks: [] }, NOW).footer.links, []);
  });

  it("menu yang seluruhnya tidak sah jatuh ke menu bawaan", () => {
    const r = resolveAppearance({ headerNav: [{ label: "X", link: { type: "page", page: 99 } }] }, NOW);
    assert.equal(r.headerNav[0].href, "/buku");
  });

  it("membatasi menu layar lebar ke 5 item", () => {
    const row = (label: string) => ({ label, visibility: "all", link: { type: "custom" as const, url: `/${label}` } });
    const r = resolveAppearance({ headerNav: ["a", "b", "c", "d", "e", "f", "g"].map(row) }, NOW);
    assert.equal(r.headerNav.filter((i) => !i.mobileOnly).length, 5);
  });

  it("pengumuman mengikuti rentang tanggal", () => {
    const a = (startsAt: string | null, endsAt: string | null) =>
      resolveAppearance({ announcement: { enabled: true, text: "Libur", startsAt, endsAt } }, NOW).announcement;
    assert.ok(a(null, null));
    assert.ok(a("2026-11-01T00:00:00Z", "2026-11-12T00:00:00Z"));
    assert.equal(a("2026-11-12T00:00:00Z", null), null);
    assert.equal(a(null, "2026-11-11T05:00:00Z"), null); // batas akhir eksklusif
    assert.equal(resolveAppearance({ announcement: { enabled: true, text: "   " } }, NOW).announcement, null);
    assert.equal(resolveAppearance({ announcement: { enabled: false, text: "Libur" } }, NOW).announcement, null);
  });
});
