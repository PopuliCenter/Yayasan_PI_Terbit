import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PayloadRequest, SanitizedCollectionConfig } from "payload";
import { isiTanggalBerlaku } from "../collections/Pages";
import { captureLivePath, createSlugRedirect } from "./slugRedirect";

type BeforeArgs = Parameters<typeof captureLivePath>[0];
type AfterArgs = Parameters<typeof createSlugRedirect>[0];

/**
 * `req` tiruan yang berperilaku seperti Local API Payload: setiap panggilan bersarang yang
 * meneruskan `req` mengganti req.context dengan SALINAN baru (createLocalReq →
 * getRequestContext). Hook yang menulis ke objek context lama akan kehilangan datanya.
 */
const makeReq = (live: { slug: string; _status: string }) => {
  const created: Array<{ collection: string; data: Record<string, unknown> }> = [];
  const req = {
    context: { internal: true } as Record<string, unknown>,
    query: {},
    payload: {
      findByID: async (args: { req?: PayloadRequest }) => {
        if (args.req) args.req.context = { ...args.req.context };
        return live;
      },
      find: async (args: { req?: PayloadRequest }) => {
        if (args.req) args.req.context = { ...args.req.context };
        return { docs: [] };
      },
      create: async (args: { collection: string; data: Record<string, unknown>; req?: PayloadRequest }) => {
        created.push({ collection: args.collection, data: args.data });
        return { id: created.length };
      },
      update: async () => ({}),
      delete: async () => ({}),
    },
  } as unknown as PayloadRequest;
  return { req, created };
};

const pages = { slug: "pages" } as unknown as SanitizedCollectionConfig;

const run = async (live: { slug: string; _status: string }, newSlug: string, status: string | null = "published") => {
  const { req, created } = makeReq(live);
  // status null: data tanpa _status (Local API/impor CSV); Payload menulis baris utama dan
  // status dokumen tetap seperti versi terakhir.
  const data = status === null ? { slug: newSlug } : { slug: newSlug, _status: status };
  await captureLivePath({
    collection: pages,
    context: req.context,
    data,
    operation: "update",
    originalDoc: { id: 5, slug: newSlug, _status: "draft" },
    req,
  } as unknown as BeforeArgs);
  // Payload memberi hook afterChange req.context yang berlaku saat itu.
  await createSlugRedirect({
    collection: pages,
    context: req.context,
    doc: { id: 5, slug: newSlug, _status: status ?? live._status },
    operation: "update",
    previousDoc: {},
    req,
  } as unknown as AfterArgs);
  return created.filter((c) => c.collection === "redirects");
};

describe("pengalihan otomatis saat slug tayang berubah", () => {
  it("dibuat walau Local API bersarang mengganti req.context", async () => {
    const r = await run({ slug: "ketentuan-penggunaan", _status: "published" }, "syarat-ketentuan");
    assert.equal(r.length, 1);
    assert.equal(r[0].data.from, "/ketentuan-penggunaan");
    assert.equal(r[0].data.type, "308");
    assert.equal(r[0].data.source, "otomatis");
  });

  it("tidak dibuat bila slug tidak berubah", async () => {
    assert.equal((await run({ slug: "pengiriman", _status: "published" }, "pengiriman")).length, 0);
  });

  it("tidak dibuat bila dokumen belum pernah tayang", async () => {
    assert.equal((await run({ slug: "draf-lama", _status: "draft" }, "draf-baru")).length, 0);
  });

  it("simpan draf tidak membuat pengalihan", async () => {
    assert.equal((await run({ slug: "a", _status: "published" }, "b", "draft")).length, 0);
  });

  it("dibuat juga untuk pembaruan tanpa _status pada dokumen tayang (mis. impor CSV)", async () => {
    const r = await run({ slug: "judul-lama", _status: "published" }, "judul-baru", null);
    assert.equal(r.length, 1);
    assert.equal(r[0].data.from, "/judul-lama");
  });
});

describe("tanggal berlaku halaman kebijakan saat tayang", () => {
  const panggil = (data: Record<string, unknown>, originalDoc: Record<string, unknown> = {}) =>
    isiTanggalBerlaku({ data, originalDoc } as unknown as Parameters<typeof isiTanggalBerlaku>[0]) as Record<
      string,
      unknown
    >;

  it("diisi saat tayang bila kosong", () => {
    const out = panggil({ _status: "published", policyVersion: "1.0", policyEffectiveDate: null });
    assert.match(String(out.policyEffectiveDate), /^\d{4}-\d{2}-\d{2}T/);
  });
  it("data parsial: versi dari dokumen terakhir", () => {
    const out = panggil({ _status: "published" }, { policyVersion: "1.0", policyEffectiveDate: null });
    assert.ok(out.policyEffectiveDate);
  });
  it("tanggal dari admin tidak diubah; draf dan halaman tanpa versi dibiarkan", () => {
    assert.equal(
      panggil({ _status: "published", policyVersion: "1.0", policyEffectiveDate: "2026-12-01T00:00:00.000Z" })
        .policyEffectiveDate,
      "2026-12-01T00:00:00.000Z",
    );
    assert.equal(panggil({ _status: "draft", policyVersion: "1.0" }).policyEffectiveDate, undefined);
    assert.equal(panggil({ _status: "published" }).policyEffectiveDate, undefined);
  });
});
