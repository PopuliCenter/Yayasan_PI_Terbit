import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { classifyTarget, fromPathProblem, normalizePath, parseContentPath, RESERVED, STATIC_PATHS } from "./urls";

const SITE = "https://contoh.test";
const ADMIN = "https://admin.contoh.test";
const cls = (raw: string) => classifyTarget(raw, { siteUrl: SITE, adminUrl: ADMIN });

describe("normalizePath", () => {
  it("membuang host, query, hash, garis miring akhir, dan menurunkan huruf", () => {
    assert.equal(normalizePath("https://old.example/Buku/Judul-Lama/?utm=1#x"), "/buku/judul-lama");
    assert.equal(normalizePath("//a//b/"), "/a/b");
    assert.equal(normalizePath("buku%20lama"), "/buku lama");
    assert.equal(normalizePath("/"), "/");
    assert.equal(normalizePath(`/${"a".repeat(400)}`), null);
  });
});

describe("classifyTarget", () => {
  it("menolak tujuan berbahaya", () => {
    for (const bad of ["//evil.com", "/\\evil.com", "javascript:alert(1)", "http://evil.com", "/admin", "/api/users", `${ADMIN}/admin`, " /x"]) {
      assert.equal(cls(bad).kind, "invalid", bad);
    }
  });
  it("mengubah URL situs sendiri menjadi path internal", () => {
    assert.deepEqual(cls(`${SITE}/kabar/x?y=1`), { kind: "internal", path: "/kabar/x?y=1" });
    assert.deepEqual(cls("/api/media/file/a.jpg"), { kind: "internal", path: "/api/media/file/a.jpg" });
  });
  it("menerima situs luar https", () => {
    assert.deepEqual(cls("https://shopee.co.id/x"), { kind: "external", url: "https://shopee.co.id/x" });
  });
});

describe("fromPathProblem dan parseContentPath", () => {
  it("menolak beranda, rute tetap, dan alamat sistem sebagai asal pengalihan", () => {
    assert.notEqual(fromPathProblem("/"), null);
    assert.notEqual(fromPathProblem("/buku"), null);
    assert.notEqual(fromPathProblem("/pratinjau/x"), null);
    assert.equal(fromPathProblem("/buku/judul-lama"), null);
  });
  it("memetakan alamat konten ke koleksi", () => {
    assert.deepEqual(parseContentPath("/buku/x"), { collection: "books", slug: "x" });
    assert.deepEqual(parseContentPath("/tentang"), { collection: "pages", slug: "tentang" });
    assert.equal(parseContentPath("/buku"), null);
    assert.equal(parseContentPath("/a/b/c"), null);
  });
});

describe("STATIC_PATHS mengikuti folder src/app/(site)", () => {
  it("setiap folder tingkat atas dengan page.tsx/route.ts tercatat", () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const site = path.resolve(here, "../app/(site)");
    for (const entry of readdirSync(site, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith("[") || entry.name.startsWith("(")) continue;
      const dir = path.join(site, entry.name);
      if (!existsSync(path.join(dir, "page.tsx")) && !existsSync(path.join(dir, "route.ts"))) continue;
      const p = `/${entry.name}`;
      const reserved = RESERVED.some((r) => p === r || p.startsWith(`${r}/`));
      assert.ok(STATIC_PATHS.has(p) || reserved, `${p} belum ada di STATIC_PATHS`);
    }
  });
});
