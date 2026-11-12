import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook, PayloadRequest } from "payload";

/** Koleksi yang tidak dicatat, agar log audit tidak mencatat dirinya sendiri. */
const SKIP = new Set([
  "audit-logs",
  "order-clicks",
  "payload-locked-documents",
  "payload-preferences",
  "payload-migrations",
  "exports",
  "payload-jobs",
]);

/**
 * Koleksi yang diisi pengunjung lewat formulir publik. Kiriman tanpa pengguna admin
 * tidak dicatat — log audit untuk aksi admin, dan mencatatnya hanya menggandakan
 * data pribadi pengirim ke tabel lain. Perubahan oleh admin tetap dicatat.
 */
const PUBLIC_INTAKE = new Set(["inquiries", "subscribers", "form-submissions"]);

/** Koleksi yang judulnya memuat data pribadi; log memakai ID saja. */
const TITLE_BY_ID = new Set(["inquiries", "subscribers", "orders", "private-files", "users", "form-submissions"]);

const shouldSkip = (slug: string, hasUser: boolean) =>
  SKIP.has(slug) || (!hasUser && PUBLIC_INTAKE.has(slug));

const queryOf = (req: PayloadRequest) => (req.query ?? {}) as Record<string, unknown>;

/** Entitas (koleksi/global) dengan `versions.drafts.autosave` aktif. */
const hasAutosave = (versions: unknown): boolean => {
  if (!versions || typeof versions !== "object") return false;
  const drafts = (versions as { drafts?: unknown }).drafts;
  return Boolean(drafts && typeof drafts === "object" && (drafts as { autosave?: unknown }).autosave);
};

/**
 * Simpan otomatis draf dari panel admin (komponen Autosave mengirim
 * `?autosave=true&draft=true`): terlalu sering untuk dicatat satu per satu.
 * Hanya dilewati bila entitasnya memang berautosave dan hasilnya bukan tayang; saat
 * itu Payload hanya menulis baris versi, baris utama tidak berubah. Parameter
 * `autosave` saja (mis. pada pesanan atau Tampilan Situs) TIDAK membebaskan dari log.
 * Nilai bisa string ("true", global) atau boolean (setelah parseParams, koleksi).
 */
/**
 * Nilai query persis `true` / "true". Sengaja bukan String(v): qs mengubah ?draft[]=true
 * menjadi ["true"] (String → "true"), padahal handler global Payload membaca
 * searchParams.get("draft") yang lalu null dan menulis baris utama.
 */
const isTrueParam = (v: unknown): boolean => v === true || v === "true";

const isDraftAutosave = (req: PayloadRequest, versions: unknown, doc: unknown): boolean => {
  const q = queryOf(req);
  // Pemulihan versi selalu menulis baris utama (bahkan bisa menurunkan dari situs), jadi selalu dicatat.
  if ((req.pathname ?? "").includes("/versions/")) return false;
  return (
    isTrueParam(q.autosave) &&
    isTrueParam(q.draft) &&
    hasAutosave(versions) &&
    (doc as { _status?: unknown } | null | undefined)?._status !== "published"
  );
};

const titleOf = (doc: Record<string, unknown>, slug?: string): string => {
  if (slug && TITLE_BY_ID.has(slug)) {
    const ref = typeof doc?.orderNumber === "string" ? doc.orderNumber : `#${doc?.id ?? ""}`;
    return ref;
  }
  for (const key of ["title", "name", "slug"]) {
    const value = doc?.[key];
    if (typeof value === "string" && value) return value;
  }
  return String(doc?.id ?? "");
};

const changedFieldNames = (
  doc: Record<string, unknown>,
  previous?: Record<string, unknown>,
): string => {
  if (!previous) return "";
  const names = Object.keys(doc).filter((key) => {
    if (["updatedAt", "createdAt", "id"].includes(key)) return false;
    return JSON.stringify(doc[key]) !== JSON.stringify(previous[key]);
  });
  return names.join(", ").slice(0, 900);
};

export const auditAfterChange: CollectionAfterChangeHook = async ({
  collection,
  doc,
  operation,
  previousDoc,
  req,
}) => {
  if (shouldSkip(collection.slug, Boolean(req.user))) return doc;
  // Pembuatan dokumen selalu menulis baris utama, jadi hanya update yang bisa dilewati.
  if (operation === "update" && isDraftAutosave(req, collection.versions, doc)) return doc;
  // Perubahan dari seed atau job tanpa pengguna tetap dicatat, pelakunya kosong.
  try {
    await req.payload.create({
      collection: "audit-logs",
      overrideAccess: true,
      // `req` WAJIB diteruskan: insert ikut transaksi operasi utama. Tanpa ini Payload
      // membuka transaksi kedua; saat pengguna mengubah email-nya sendiri (kolom unik),
      // cek FK audit_logs.user_id menunggu kunci baris users milik transaksi pertama,
      // yang sendiri menunggu hook ini selesai → macet.
      req,
      data: {
        summary: `${operation === "create" ? "Buat" : "Ubah"} ${collection.labels?.singular ?? collection.slug}: ${titleOf(doc, collection.slug)}`,
        user: req.user?.id ?? null,
        userEmail: req.user?.email ?? null,
        collectionSlug: collection.slug,
        documentId: String(doc?.id ?? ""),
        documentTitle: titleOf(doc, collection.slug),
        operation,
        changedFields: operation === "update" ? changedFieldNames(doc, previousDoc) : "",
      },
    });
  } catch (error) {
    // Log audit tidak boleh menggagalkan penyimpanan dokumen.
    req.payload.logger.error({ err: error }, "Gagal menulis log audit");
  }
  return doc;
};

export const auditAfterDelete: CollectionAfterDeleteHook = async ({
  collection,
  doc,
  id,
  req,
}) => {
  if (shouldSkip(collection.slug, Boolean(req.user))) return doc;
  // Pengguna yang menghapus akunnya sendiri: barisnya sudah hilang di transaksi ini,
  // jadi FK ke users akan gagal. Pelaku dicatat lewat email saja.
  const selfDelete = collection.slug === "users" && String(id) === String(req.user?.id);
  try {
    await req.payload.create({
      collection: "audit-logs",
      overrideAccess: true,
      req,
      data: {
        summary: `Hapus ${collection.labels?.singular ?? collection.slug}: ${titleOf(doc, collection.slug)}`,
        user: selfDelete ? null : (req.user?.id ?? null),
        userEmail: req.user?.email ?? null,
        collectionSlug: collection.slug,
        documentId: String(id ?? ""),
        documentTitle: titleOf(doc, collection.slug),
        operation: "delete",
      },
    });
  } catch (error) {
    req.payload.logger.error({ err: error }, "Gagal menulis log audit");
  }
  return doc;
};

/** Log audit untuk global (Pengaturan, Tampilan Situs, Beranda). */
export const auditGlobalAfterChange: GlobalAfterChangeHook = async ({ global, doc, previousDoc, req }) => {
  if (isDraftAutosave(req, global.versions, doc)) return doc;
  const title = typeof global.label === "string" ? global.label : global.slug;
  const status = (doc as { _status?: string } | undefined)?._status === "draft" ? "draf" : "tayang";
  try {
    await req.payload.create({
      collection: "audit-logs",
      overrideAccess: true,
      // Ikut transaksi operasi utama (lihat catatan di auditAfterChange).
      req,
      data: {
        summary: `Ubah ${title} (${status})`,
        user: req.user?.id ?? null,
        userEmail: req.user?.email ?? null,
        collectionSlug: `global:${global.slug}`,
        documentId: global.slug,
        documentTitle: title,
        operation: "update",
        changedFields: changedFieldNames(doc as Record<string, unknown>, previousDoc as Record<string, unknown> | undefined),
      },
    });
  } catch (error) {
    req.payload.logger.error({ err: error }, "Gagal menulis log audit");
  }
  return doc;
};
