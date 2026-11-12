import { Button } from "@payloadcms/ui";
import type { Payload, TypedUser } from "payload";
import { absoluteUrl } from "@/lib/site";
import { DRAFT_COLLECTIONS, pathFor, type RoutedCollection } from "@/lib/urls";

type Props = {
  id?: number | string;
  payload: Payload;
  user?: TypedUser;
  /** Diisi lewat serverProps di konfigurasi komponen. */
  collection?: RoutedCollection;
  global?: "homepage";
};

/**
 * Tombol "Lihat di situs" di samping kontrol dokumen (beforeDocumentControls).
 * Selalu menautkan versi yang TAYANG di apex, tanpa token: baris utama koleksi bersistem
 * draf adalah versi tayang (simpan draf tidak mengubahnya), jadi slug yang diganti di draf
 * tidak menghasilkan tautan mati. Tombol bawaan "Pratinjau" tetap dipakai untuk draf.
 */
export async function LihatDiSitus({ id, payload, user, collection, global }: Props) {
  let path: string | null = null;

  try {
    if (global === "homepage") {
      const doc = (await payload.findGlobal({
        slug: "homepage",
        depth: 0,
        overrideAccess: false,
        user,
        select: { _status: true },
      })) as { _status?: string | null };
      if (doc?._status === "published") path = "/";
    } else if (collection && id != null) {
      const doc = (await payload.findByID({
        collection,
        id,
        depth: 0,
        overrideAccess: false,
        user,
        disableErrors: true,
        select: { slug: true, ...(DRAFT_COLLECTIONS.has(collection) ? { _status: true } : {}) },
      })) as { slug?: string | null; _status?: string | null } | null;
      const live = !DRAFT_COLLECTIONS.has(collection) || doc?._status === "published";
      if (doc?.slug && live) path = pathFor(collection, doc.slug);
    }
  } catch {
    path = null;
  }

  if (!path) {
    return (
      <span className="ypi-onsite--off" title="Belum ada versi yang tayang di situs">
        Belum tayang
      </span>
    );
  }
  return (
    <Button el="anchor" url={absoluteUrl(path)} newTab buttonStyle="secondary" size="small">
      Lihat di situs ↗
    </Button>
  );
}
