import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseParams,
  type CollectionConfig,
  type GlobalConfig,
  type PayloadRequest,
  type SanitizedCollectionConfig,
  type SanitizedGlobalConfig,
} from "payload";
import { Orders } from "../collections/Orders";
import { Pages } from "../collections/Pages";
import { Appearance } from "../globals/Appearance";
import { Homepage } from "../globals/Homepage";
import { auditAfterChange, auditGlobalAfterChange } from "./audit";

type CreateArgs = { collection: string; data: Record<string, unknown> };
type CollectionArgs = Parameters<typeof auditAfterChange>[0];
type GlobalArgs = Parameters<typeof auditGlobalAfterChange>[0];

/**
 * `req` tiruan dengan `payload.create` sebagai mata-mata. Query diurai seperti
 * createPayloadRequest (nilai string); handler REST koleksi lalu menjalankan
 * parseParams Payload yang mengubah `req.query` di tempat (string -> boolean),
 * sedangkan handler REST global tidak (tetap string).
 */
const makeReq = (search: string, kind: "collection" | "global") => {
  const calls: CreateArgs[] = [];
  const query: Record<string, unknown> = Object.fromEntries(new URLSearchParams(search));
  if (kind === "collection") parseParams(query);
  const req = {
    query,
    context: {},
    user: { id: 1, email: "admin@contoh.test", collection: "users" },
    payload: {
      create: async (args: CreateArgs) => {
        calls.push(args);
        return { id: calls.length };
      },
      logger: { error: () => undefined },
    },
  } as unknown as PayloadRequest;
  return { req, calls, query };
};

const runCollection = async (
  config: CollectionConfig,
  search: string,
  doc: Record<string, unknown>,
  operation: "create" | "update" = "update",
) => {
  const { req, calls, query } = makeReq(search, "collection");
  await auditAfterChange({
    collection: config as unknown as SanitizedCollectionConfig,
    context: {},
    data: doc,
    doc,
    operation,
    previousDoc: operation === "update" ? { ...doc, _status: "draft", status: "baru" } : {},
    req,
  } as unknown as CollectionArgs);
  return { calls, query };
};

const runGlobal = async (config: GlobalConfig, search: string, doc: Record<string, unknown>) => {
  const { req, calls } = makeReq(search, "global");
  await auditGlobalAfterChange({
    context: {},
    data: doc,
    doc,
    global: config as unknown as SanitizedGlobalConfig,
    previousDoc: {},
    req,
  } as unknown as GlobalArgs);
  return calls;
};

describe("prasyarat konfigurasi", () => {
  it("pesanan dan Tampilan Situs tanpa autosave; halaman dan Beranda berautosave", () => {
    const autosaveOf = (v: unknown) =>
      Boolean((v as { drafts?: { autosave?: unknown } } | undefined)?.drafts?.autosave);
    assert.equal(autosaveOf(Orders.versions), false);
    assert.equal(autosaveOf(Appearance.versions), false);
    assert.equal(autosaveOf(Pages.versions), true);
    assert.equal(autosaveOf(Homepage.versions), true);
  });
  it("parseParams Payload mengubah req.query di tempat menjadi boolean", async () => {
    const { query } = await runCollection(Orders, "?autosave=true&draft=true", { id: 1 });
    assert.equal(query.autosave, true);
    assert.equal(query.draft, true);
  });
});

describe("log audit dan ?autosave=true", () => {
  it("pesanan: update dengan ?autosave=true tetap dicatat", async () => {
    const { calls } = await runCollection(Orders, "?autosave=true", { id: 42, orderNumber: "PO-42", status: "dibayar" });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].collection, "audit-logs");
    assert.equal(calls[0].data.collectionSlug, "orders");
    assert.equal(calls[0].data.documentId, "42");
    assert.equal(calls[0].data.operation, "update");
  });

  it("pesanan: ?autosave=true&draft=true juga tetap dicatat (koleksi tanpa autosave)", async () => {
    const { calls } = await runCollection(Orders, "?autosave=true&draft=true", { id: 42, status: "dibayar" });
    assert.equal(calls.length, 1);
  });

  it("Tampilan Situs: update dengan ?autosave=true tetap dicatat", async () => {
    const calls = await runGlobal(Appearance, "?autosave=true", { _status: "published", announcement: "Baru" });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].collection, "audit-logs");
    assert.equal(calls[0].data.collectionSlug, "global:appearance");
  });

  it("Tampilan Situs: ?autosave=true&draft=true dengan hasil draf tetap dicatat (global tanpa autosave)", async () => {
    const calls = await runGlobal(Appearance, "?autosave=true&draft=true", { _status: "draft" });
    assert.equal(calls.length, 1);
  });

  it("halaman: autosave draf dari panel (?autosave=true&draft=true, hasil draf) tidak dicatat", async () => {
    const { calls } = await runCollection(Pages, "?autosave=true&draft=true&depth=0", { id: 7, title: "Tentang", _status: "draft" });
    assert.equal(calls.length, 0);
  });

  it("halaman: ?autosave=true tanpa draft=true tetap dicatat", async () => {
    const { calls } = await runCollection(Pages, "?autosave=true", { id: 7, title: "Tentang", _status: "draft" });
    assert.equal(calls.length, 1);
  });

  it("halaman: ?autosave=true&draft=true yang hasilnya tayang tetap dicatat", async () => {
    const { calls } = await runCollection(Pages, "?autosave=true&draft=true", { id: 7, title: "Tentang", _status: "published" });
    assert.equal(calls.length, 1);
  });

  it("halaman: pembuatan dokumen dengan ?autosave=true&draft=true tetap dicatat", async () => {
    const { calls } = await runCollection(Pages, "?autosave=true&draft=true", { id: 8, title: "Baru", _status: "draft" }, "create");
    assert.equal(calls.length, 1);
    assert.equal(calls[0].data.operation, "create");
  });

  it("Beranda: autosave draf global berautosave tidak dicatat, simpan biasa dicatat", async () => {
    assert.equal((await runGlobal(Homepage, "?autosave=true&draft=true", { _status: "draft" })).length, 0);
    assert.equal((await runGlobal(Homepage, "?draft=true", { _status: "draft" })).length, 1);
    assert.equal((await runGlobal(Homepage, "", { _status: "published" })).length, 1);
  });

  /** Panggil hook global dengan query hasil qs dan pathname tertentu. */
  const runGlobalRaw = async (query: Record<string, unknown>, pathname: string) => {
    const calls: CreateArgs[] = [];
    const req = {
      query,
      pathname,
      context: {},
      user: { id: 1, email: "admin@contoh.test", collection: "users" },
      payload: {
        create: async (args: CreateArgs) => {
          calls.push(args);
          return { id: calls.length };
        },
        logger: { error: () => undefined },
      },
    } as unknown as PayloadRequest;
    await auditGlobalAfterChange({
      context: {},
      data: { _status: "draft" },
      doc: { _status: "draft" },
      global: Homepage as unknown as SanitizedGlobalConfig,
      previousDoc: {},
      req,
    } as unknown as GlobalArgs);
    return calls.length;
  };

  it("Beranda: ?draft[]=true (qs → ['true']) bukan autosave draf, tetap dicatat", async () => {
    // Handler global Payload membaca searchParams.get("draft") = null, jadi baris utama ditulis.
    assert.equal(await runGlobalRaw({ autosave: "true", draft: ["true"] }, "/api/globals/homepage"), 1);
  });

  it("Beranda: pemulihan versi dengan ?autosave=true&draft=true tetap dicatat", async () => {
    assert.equal(await runGlobalRaw({ autosave: "true", draft: "true" }, "/api/globals/homepage/versions/1"), 1);
    // Kontrol: autosave draf sungguhan di path biasa tetap dilewati.
    assert.equal(await runGlobalRaw({ autosave: "true", draft: "true" }, "/api/globals/homepage"), 0);
  });
});
