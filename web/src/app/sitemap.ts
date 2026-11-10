import type { MetadataRoute } from "next";
import { getPayloadClient } from "@/lib/payload";
import { absoluteUrl } from "@/lib/site";

/** sitemap.xml diperbarui otomatis dari isi CMS (NFR SEO). */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayloadClient();
  const opts = { overrideAccess: false, depth: 0, limit: 5000, pagination: false } as const;

  const [books, authors, categories, series, pages, posts] = await Promise.all([
    payload.find({ collection: "books", ...opts, select: { slug: true, updatedAt: true } }),
    payload.find({ collection: "authors", ...opts, select: { slug: true, updatedAt: true } }),
    payload.find({ collection: "categories", ...opts, select: { slug: true, updatedAt: true } }),
    payload.find({ collection: "series", ...opts, select: { slug: true, updatedAt: true } }),
    payload.find({ collection: "pages", ...opts, select: { slug: true, updatedAt: true } }),
    payload.find({ collection: "posts", ...opts, select: { slug: true, updatedAt: true } }),
  ]);

  const entry = (path: string, updatedAt?: string, priority = 0.5): MetadataRoute.Sitemap[number] => ({
    url: absoluteUrl(path),
    lastModified: updatedAt ? new Date(updatedAt) : undefined,
    priority,
  });

  return [
    entry("/", undefined, 1),
    entry("/buku", undefined, 0.9),
    entry("/penulis", undefined, 0.6),
    entry("/kabar", undefined, 0.5),
    entry("/institusi", undefined, 0.5),
    entry("/kontak", undefined, 0.4),
    ...books.docs.map((d) => entry(`/buku/${d.slug}`, d.updatedAt, 0.8)),
    ...authors.docs.map((d) => entry(`/penulis/${d.slug}`, d.updatedAt, 0.6)),
    ...categories.docs.map((d) => entry(`/kategori/${d.slug}`, d.updatedAt, 0.6)),
    ...series.docs.map((d) => entry(`/seri/${d.slug}`, d.updatedAt, 0.6)),
    ...pages.docs.map((d) => entry(`/${d.slug}`, d.updatedAt, 0.3)),
    ...posts.docs.map((d) => entry(`/kabar/${d.slug}`, d.updatedAt, 0.4)),
  ];
}
