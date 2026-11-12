import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildRedirectTable,
  classifyRedirectTarget,
  REDIRECT_MAX_HOPS,
  type RedirectRow,
  type SlugResolver,
} from "./redirect-table";

const OPTS = { siteUrl: "https://contoh.test", adminUrl: "https://admin.contoh.test" };

const ref = (from: string, relationTo: string, value: number | { id: number }, type: string | null = "308"): RedirectRow => ({
  from,
  type,
  to: { type: "reference", reference: { relationTo, value } },
});

const custom = (from: string, url: string, extra: Partial<RedirectRow> = {}): RedirectRow => ({
  from,
  type: "308",
  to: { type: "custom", url },
  ...extra,
});

const slugs: SlugResolver = (c, id) => (c === "books" && String(id) === "7" ? "judul-baru" : null);

describe("buildRedirectTable", () => {
  it("menyelesaikan rujukan dokumen ke slug terbarunya", () => {
    const t = buildRedirectTable([ref("/buku/judul-lama", "books", 7)], slugs, OPTS);
    assert.deepEqual(t.get("/buku/judul-lama"), { to: "/buku/judul-baru", permanent: true });
  });

  it("menerima nilai rujukan berbentuk objek dan menormalkan alamat asal", () => {
    const t = buildRedirectTable([ref("https://lama.test/Buku/Judul-Lama/?utm=1", "books", { id: 7 })], slugs, OPTS);
    assert.deepEqual(t.get("/buku/judul-lama"), { to: "/buku/judul-baru", permanent: true });
  });

  it("melewati rujukan yang belum tayang atau terhapus (slugOf null)", () => {
    const t = buildRedirectTable([ref("/buku/lama", "books", 99)], slugs, OPTS);
    assert.equal(t.has("/buku/lama"), false);
  });

  it("melewati rujukan ke koleksi yang tidak punya rute", () => {
    const t = buildRedirectTable([ref("/x-lama", "media", 7)], () => "apa-saja", OPTS);
    assert.equal(t.size, 0);
  });

  it("tujuan luar hanya berlaku untuk alamat persis yang disetujui", () => {
    const approved = custom("/toko", "https://shopee.co.id/a", {
      allowExternal: true,
      approvedExternalUrl: "https://shopee.co.id/a",
    });
    const changed = custom("/toko-lain", "https://shopee.co.id/a", {
      allowExternal: true,
      approvedExternalUrl: "https://shopee.co.id/b",
    });
    const t = buildRedirectTable([approved, changed], slugs, OPTS);
    assert.deepEqual(t.get("/toko"), { to: "https://shopee.co.id/a", permanent: true });
    assert.equal(t.has("/toko-lain"), false);
  });

  it("tujuan luar tanpa centang persetujuan diabaikan", () => {
    const row = custom("/toko", "https://shopee.co.id/a", {
      allowExternal: false,
      approvedExternalUrl: "https://shopee.co.id/a",
    });
    assert.equal(buildRedirectTable([row], slugs, OPTS).size, 0);
  });

  it("alamat situs sendiri menjadi path internal; tujuan berbahaya diabaikan", () => {
    const t = buildRedirectTable(
      [
        custom("/lama-1", "https://contoh.test/kabar/baru?x=1"),
        custom("/lama-2", "//evil.test"),
        custom("/lama-3", "javascript:alert(1)"),
        custom("/lama-4", "/admin"),
      ],
      slugs,
      OPTS,
    );
    assert.deepEqual(t.get("/lama-1"), { to: "/kabar/baru?x=1", permanent: true });
    assert.equal(t.size, 1);
  });

  it("membuang pengalihan ke dirinya sendiri", () => {
    const t = buildRedirectTable(
      [custom("/kabar/sama", "/kabar/sama/"), ref("/buku/judul-baru", "books", 7)],
      slugs,
      OPTS,
    );
    assert.equal(t.size, 0);
  });

  it("307 tidak permanen, selain itu permanen", () => {
    const t = buildRedirectTable([custom("/sementara", "/kabar/x"), custom("/tetap", "/kabar/y")].map((r, i) => ({ ...r, type: i === 0 ? "307" : null })), slugs, OPTS);
    assert.deepEqual(t.get("/sementara"), { to: "/kabar/x", permanent: false });
    assert.deepEqual(t.get("/tetap"), { to: "/kabar/y", permanent: true });
  });

  it("melewati alamat asal sistem, beranda, dan halaman tetap", () => {
    const t = buildRedirectTable(
      [custom("/admin/x", "/kabar/x"), custom("/", "/kabar/x"), custom("/buku", "/kabar/x"), custom("/api/users", "/kabar/x")],
      slugs,
      OPTS,
    );
    assert.equal(t.size, 0);
  });

  it("tujuan internal yang setelah diselesaikan mengarah ke alamat sistem diabaikan", () => {
    const bad = [
      "/kabar/../admin",
      "/./admin",
      "/x/%2e%2e/admin",
      "/x/%2E%2e/api/users/me",
      "/api/media/file/../../users/me",
      "/api/media/file/..%2f..%2fusers/me",
      "/x\\..\\admin",
      "/%61dmin",
      "/kabar/../internal/x",
    ];
    const t = buildRedirectTable(
      bad.map((url, i) => custom(`/lama-${i}`, url)),
      slugs,
      OPTS,
    );
    assert.deepEqual([...t.keys()], []);
  });

  it("tujuan internal disimpan dalam bentuk yang sudah diselesaikan", () => {
    const t = buildRedirectTable(
      [custom("/lama-a", "/kabar/./x/../baru?y=1"), custom("/lama-b", "/api/media/file/sampul.png")],
      slugs,
      OPTS,
    );
    assert.deepEqual(t.get("/lama-a"), { to: "/kabar/baru?y=1", permanent: true });
    assert.deepEqual(t.get("/lama-b"), { to: "/api/media/file/sampul.png", permanent: true });
  });

  it("membuang pengalihan yang berputar", () => {
    const t = buildRedirectTable(
      [custom("/p", "/q"), custom("/q", "/p"), custom("/r", "/s"), custom("/s", "/t"), custom("/t", "/s")],
      slugs,
      OPTS,
    );
    assert.equal(t.size, 0);
  });

  it("meratakan rantai ke tujuan akhir; 307 di tengah membuatnya sementara", () => {
    const t = buildRedirectTable(
      [
        custom("/promo", "/buku/a?utm=x"),
        ref("/buku/a", "books", 7),
        custom("/lama", "/kabar/sementara"),
        { ...custom("/kabar/sementara", "/kabar/tetap"), type: "307" },
      ],
      slugs,
      OPTS,
    );
    assert.deepEqual(t.get("/promo"), { to: "/buku/judul-baru", permanent: true });
    assert.deepEqual(t.get("/buku/a"), { to: "/buku/judul-baru", permanent: true });
    assert.deepEqual(t.get("/lama"), { to: "/kabar/tetap", permanent: false });
  });

  it("rantai ke tujuan luar yang disetujui ikut diratakan", () => {
    const t = buildRedirectTable(
      [
        custom("/beli", "/toko"),
        custom("/toko", "https://shopee.co.id/a", { allowExternal: true, approvedExternalUrl: "https://shopee.co.id/a" }),
      ],
      slugs,
      OPTS,
    );
    assert.deepEqual(t.get("/beli"), { to: "https://shopee.co.id/a", permanent: true });
  });

  it("rantai yang lebih panjang dari batas lompatan dibuang", () => {
    const rows = Array.from({ length: REDIRECT_MAX_HOPS + 2 }, (_, i) => custom(`/r${i}`, `/r${i + 1}`));
    const t = buildRedirectTable(rows, slugs, OPTS);
    assert.equal(t.has("/r0"), false);
    assert.deepEqual(t.get("/r1"), { to: `/r${REDIRECT_MAX_HOPS + 2}`, permanent: true });
  });
});

describe("classifyRedirectTarget", () => {
  it("menolak titik, %2e%2e, dan garis miring terbalik yang berakhir di alamat sistem", () => {
    assert.deepEqual(classifyRedirectTarget("/kabar/../admin", OPTS), {
      kind: "invalid",
      reason: "Tidak boleh mengarah ke panel admin.",
    });
    assert.equal(classifyRedirectTarget("/x/%2e%2e/api/users/me", OPTS).kind, "invalid");
    assert.equal(classifyRedirectTarget("/x\\..\\admin", OPTS).kind, "invalid");
    assert.equal(classifyRedirectTarget("/x/..//evil.test", OPTS).kind, "invalid");
  });

  it("mengembalikan path yang sudah diselesaikan dan meneruskan tujuan luar apa adanya", () => {
    assert.deepEqual(classifyRedirectTarget("/kabar/x/../y#bagian", OPTS), { kind: "internal", path: "/kabar/y#bagian" });
    assert.deepEqual(classifyRedirectTarget("https://contoh.test/kabar/../buku/z", OPTS), {
      kind: "internal",
      path: "/buku/z",
    });
    assert.deepEqual(classifyRedirectTarget("https://shopee.co.id/a", OPTS), {
      kind: "external",
      url: "https://shopee.co.id/a",
    });
  });
});
