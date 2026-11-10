import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";

/** Koleksi yang tidak dicatat, agar log audit tidak mencatat dirinya sendiri. */
const SKIP = new Set(["audit-logs", "order-clicks", "payload-locked-documents", "payload-preferences", "payload-migrations"]);

/**
 * Koleksi yang diisi pengunjung lewat formulir publik. Kiriman tanpa pengguna admin
 * tidak dicatat — log audit untuk aksi admin, dan mencatatnya hanya menggandakan
 * data pribadi pengirim ke tabel lain. Perubahan oleh admin tetap dicatat.
 */
const PUBLIC_INTAKE = new Set(["inquiries", "subscribers"]);

/** Koleksi yang judulnya memuat data pribadi; log memakai ID saja. */
const TITLE_BY_ID = new Set(["inquiries", "subscribers", "orders", "private-files", "users"]);

const shouldSkip = (slug: string, hasUser: boolean) =>
  SKIP.has(slug) || (!hasUser && PUBLIC_INTAKE.has(slug));

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
