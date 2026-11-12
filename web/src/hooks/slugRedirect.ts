import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
  PayloadRequest,
} from "payload";
import { invalidateRedirectTable } from "../lib/redirect-cache";
import { DRAFT_COLLECTIONS, fromPathProblem, isRouted, pathFor } from "../lib/urls";

/*
 * Pengalihan otomatis saat slug dokumen yang SUDAH TAYANG berubah.
 *
 * Pasang di books, pages, posts, authors, categories, series:
 *   hooks: { beforeChange: [captureLivePath], afterChange: [createSlugRedirect], afterDelete: [invalidateOnDelete] }
 *
 * Berkas ini dimuat payload.config: hanya memakai req.payload (bukan lib/payload).
 */

type LiveInfo = { wasLive: boolean; liveSlug: string | null };

const contextKey = (collection: string, id: unknown) => `slugRedirect:${collection}:${String(id)}`;

/** Simpan otomatis dari panel admin (draf tiap beberapa detik). */
const isAutosave = (req: PayloadRequest) =>
  String((req.query as Record<string, unknown> | undefined)?.autosave) === "true";

/**
 * Catat alamat yang SEDANG TAYANG sebelum dokumen diterbitkan ulang.
 *
 * previousDoc/originalDoc pada koleksi berdraf adalah VERSI TERBARU (bisa draf), jadi
 * tidak bisa dipercaya untuk alamat tayang. Simpan draf tidak menyentuh baris utama,
 * sehingga baris utama (draft:false) = alamat yang dilihat pengunjung saat ini.
 */
export const captureLivePath: CollectionBeforeChangeHook = async ({
  collection,
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (operation !== "update" || originalDoc?.id === undefined || !isRouted(collection.slug)) return data;
  const drafts = DRAFT_COLLECTIONS.has(collection.slug);
  // Simpan draf tidak pernah mengubah alamat publik. Payload selalu menandai simpan draf
  // dengan _status "draft" sebelum hook jalan; tanpa _status (mis. Local API atau impor CSV
  // dengan kolom _status kosong) baris utama tetap ditulis, jadi alamat tayang dicek.
  if (drafts && data?._status === "draft") return data;

  const live: { slug?: unknown; _status?: unknown } | null = drafts
    ? await req.payload.findByID({
        collection: collection.slug,
        id: originalDoc.id,
        draft: false,
        depth: 0,
        overrideAccess: true,
        disableErrors: true,
        req,
        select: { slug: true, _status: true },
      })
    : originalDoc; // koleksi tanpa draf: originalDoc ADALAH baris utama

  const liveSlug = typeof live?.slug === "string" && live.slug ? live.slug : null;
  const info: LiveInfo = {
    wasLive: Boolean(live && (!drafts || live._status === "published")),
    liveSlug,
  };
  // Tulis ke req.context SEKARANG, bukan ke argumen `context`: Local API bersarang yang
  // meneruskan `req` (findByID di atas) mengganti req.context dengan salinan baru
  // (createLocalReq → getRequestContext). Hook afterChange menerima req.context terbaru,
  // jadi kunci yang ditulis ke objek lama hilang dan pengalihan tidak pernah dibuat.
  req.context[contextKey(collection.slug, originalDoc.id)] = info;
  return data;
};

/**
 * Setelah dokumen tayang disimpan:
 * - hapus pengalihan yang alamat asalnya kini berisi dokumen ini;
 * - bila slug berubah saat tayang, buat/perbarui pengalihan RUJUKAN dari alamat lama.
 *   Rujukan selalu mengikuti slug terbaru, jadi pengalihan otomatis tidak saling berantai.
 *   Pengalihan manual yang menunjuk alamat lama (mis. /promo → /buku/a) memang menjadi
 *   rantai; buildRedirectTable meratakannya ke tujuan akhir saat tabel dibangun.
 * Galat DB TIDAK ditelan: di Postgres satu perintah gagal membatalkan seluruh transaksi.
 */
export const createSlugRedirect: CollectionAfterChangeHook = async ({ collection, doc, req }) => {
  if (!isRouted(collection.slug) || !doc?.id) return doc;
  const k = contextKey(collection.slug, doc.id);
  const info = req.context[k] as LiveInfo | undefined;
  delete req.context[k];

  const drafts = DRAFT_COLLECTIONS.has(collection.slug);
  if (drafts && doc._status !== "published") {
    // Batal tayang/simpan draf manual: rujukan ke dokumen ini mungkin tidak berlaku lagi.
    if (!isAutosave(req)) invalidateRedirectTable();
    return doc;
  }
  if (typeof doc.slug !== "string" || !doc.slug) return doc;

  const to = pathFor(collection.slug, doc.slug);
  const slugChanged = Boolean(info?.wasLive && info.liveSlug && info.liveSlug !== doc.slug);
  // Terbit ulang biasa (alamat tetap): tidak ada yang berubah untuk pengalihan.
  if (info?.wasLive && !slugChanged) return doc;

  // Konten kini tayang di `to`: pengalihan dari alamat ini tidak akan pernah dipakai lagi.
  // find lalu delete (bukan deleteMany berdasar where) agar hook koleksi redirects ikut jalan.
  const stale = await req.payload.find({
    collection: "redirects",
    where: { from: { equals: to } },
    depth: 0,
    pagination: false,
    overrideAccess: true,
    req,
    select: { from: true },
  });
  for (const r of stale.docs) {
    await req.payload.delete({ collection: "redirects", id: r.id, overrideAccess: true, req });
  }

  if (slugChanged && info?.liveSlug) {
    const from = pathFor(collection.slug, info.liveSlug);
    // Mis. slug halaman lama sama dengan rute tetap: lewati diam-diam, jangan gagalkan simpan.
    if (!fromPathProblem(from)) {
      const data = {
        from,
        to: { type: "reference" as const, reference: { relationTo: collection.slug, value: doc.id } },
        type: "308" as const,
        source: "otomatis" as const,
        note: `Slug diubah: ${from} → ${to}`,
      };
      const existing = await req.payload.find({
        collection: "redirects",
        where: { from: { equals: from } },
        depth: 0,
        limit: 1,
        overrideAccess: true,
        req,
        select: { from: true },
      });
      const current = existing.docs[0];
      if (current) {
        await req.payload.update({ collection: "redirects", id: current.id, data, overrideAccess: true, req });
      } else {
        await req.payload.create({ collection: "redirects", data, overrideAccess: true, req });
      }
    }
  }

  invalidateRedirectTable();
  return doc;
};

/**
 * Simpan otomatis draf yang sebenarnya (seperti yang dikirim panel admin): koleksi memang
 * punya autosave, kueri ?autosave=true&draft=true, dan hasilnya bukan versi tayang. Hanya
 * dalam kasus ini Payload cukup menulis baris versi; baris utama tidak tersentuh.
 */
const isDraftAutosave = (
  req: PayloadRequest,
  collection: { versions?: { drafts?: false | { autosave?: unknown } } | false },
  doc: { _status?: unknown } | undefined,
) => {
  const q = (req.query as Record<string, unknown> | undefined) ?? {};
  const drafts = collection.versions ? collection.versions.drafts : false;
  return (
    String(q.autosave) === "true" &&
    String(q.draft) === "true" &&
    Boolean(drafts && drafts.autosave) &&
    doc?._status !== "published"
  );
};

/**
 * afterChange: kosongkan cache tabel pengalihan.
 * Simpan otomatis draf dilewati: hanya menulis baris versi, bukan baris utama yang dibaca
 * tabel. Tanpa ini setiap simpan otomatis (tiap ±1,5 dtk saat menyunting) membuang cache.
 * Koleksi tanpa autosave (mis. redirects) tetap selalu dikosongkan, apa pun kuerinya.
 */
export const invalidateOnChange: CollectionAfterChangeHook = ({ collection, doc, req }) => {
  if (!isDraftAutosave(req, collection, doc)) invalidateRedirectTable();
  return doc;
};

/** afterDelete koleksi redirects dan koleksi berrute: kosongkan cache tabel pengalihan. */
export const invalidateOnDelete: CollectionAfterDeleteHook = ({ doc }) => {
  invalidateRedirectTable();
  return doc;
};
