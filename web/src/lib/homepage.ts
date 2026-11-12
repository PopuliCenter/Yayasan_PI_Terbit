import type { Where } from "payload";
import { cache } from "react";
import type { Book, Media } from "@/payload-types";
import { getCategories, getPosts } from "./data";
import type { HomepageData, QueryPlan } from "./homepage-plan";
import { getPayloadClient } from "./payload";
import { getPreviewUser } from "./preview";

export { dataWarnings } from "./homepage-plan";

/** Baca publik: aturan access koleksi/global ditegakkan Payload (hanya yang tayang). */
const PUBLIC = { overrideAccess: false } as const;

export type HomepageDoc = { layout: unknown; status: "draft" | "published" | null };

/** Field `meta` dari plugin SEO (tab "SEO" di global Beranda). */
export type HomepageMeta = {
  title?: string | null;
  description?: string | null;
  image?: number | Media | null;
};

type HomepageRead = { layout?: unknown; _status?: "draft" | "published" | null } | null | undefined;
type HomepageMetaRead = { meta?: HomepageMeta | null } | null | undefined;

/**
 * Susunan Beranda: versi tayang untuk pengunjung, draf terakhir untuk admin yang sedang
 * mempratinjau. Gagal baca (mis. image baru sebelum migrasi) → null, situs memakai
 * susunan bawaan.
 */
export const getHomepage = cache(async (): Promise<HomepageDoc> => {
  // Di luar try: API dinamis Next (headers/draftMode) tidak boleh tertelan catch.
  const user = await getPreviewUser();
  const payload = await getPayloadClient();
  try {
    const doc: HomepageRead = await payload.findGlobal({
      slug: "homepage",
      depth: 0,
      overrideAccess: false,
      ...(user ? { draft: true, user } : {}),
    });
    return { layout: doc?.layout ?? null, status: doc?._status ?? null };
  } catch (err) {
    payload.logger.error({ err }, "Gagal membaca global Beranda; memakai susunan bawaan");
    return { layout: null, status: null };
  }
});

/** Meta SEO Beranda (judul, deskripsi, gambar), atau null bila belum diisi/gagal dibaca. */
export const getHomepageMeta = cache(async (): Promise<HomepageMeta | null> => {
  const user = await getPreviewUser();
  const payload = await getPayloadClient();
  try {
    const doc: HomepageMetaRead = await payload.findGlobal({
      slug: "homepage",
      depth: 1,
      overrideAccess: false,
      select: { meta: true },
      ...(user ? { draft: true, user } : {}),
    });
    const meta = doc?.meta;
    return meta && typeof meta === "object" ? meta : null;
  } catch (err) {
    payload.logger.error({ err }, "Gagal membaca meta Beranda; memakai meta bawaan");
    return null;
  }
});

const findBooks = async (args: { where?: Where; limit: number; sort?: string }): Promise<Book[]> => {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "books",
    ...PUBLIC,
    depth: 1,
    ...(args.where ? { where: args.where } : {}),
    limit: args.limit,
    ...(args.sort ? { sort: args.sort } : { pagination: false }),
  });
  return result.docs;
};

/**
 * Semua data Beranda dalam SATU putaran paralel. Renderer bagian hanya memotong hasil
 * ini, jadi jumlah kueri tidak bertambah per buku (tanpa N+1):
 * pilihan manual (satu kueri `id in`), terbaru, unggulan, satu kueri per rak kategori,
 * daftar kategori (cache), dan kabar (cache).
 */
export async function loadHomepageData(plan: QueryPlan): Promise<HomepageData> {
  const [picked, latest, featured, shelves, categories, posts] = await Promise.all([
    plan.bookIds.length ? findBooks({ where: { id: { in: plan.bookIds } }, limit: plan.bookIds.length }) : [],
    plan.latest ? findBooks({ limit: plan.latest, sort: "-publishedAt" }) : [],
    plan.featured ? findBooks({ where: { featured: { equals: true } }, limit: plan.featured, sort: "-publishedAt" }) : [],
    Promise.all(
      [...plan.categories].map(async ([id, limit]) => {
        const books = await findBooks({ where: { categories: { in: [id] } }, limit, sort: "-publishedAt" });
        return [id, books] as const;
      }),
    ),
    plan.needCategoryList ? getCategories() : [],
    plan.posts ? getPosts(1, plan.posts).then((r) => r.docs) : [],
  ]);

  return {
    // Urutan pilihan admin dijaga oleh selectShelf (lewat ID), bukan urutan hasil kueri.
    byId: new Map(picked.map((b) => [b.id, b])),
    latest,
    featured,
    byCategory: new Map(shelves),
    categories,
    posts,
  };
}
