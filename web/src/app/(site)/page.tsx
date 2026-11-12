import type { Metadata } from "next";
import { HomePageContent } from "@/components/homepage/HomePageContent";
import { getSettings } from "@/lib/data";
import { getHomepageMeta } from "@/lib/homepage";
import { asMedia, ogBase, ogImageFrom, seoTitle } from "@/lib/seo";

/**
 * Meta Beranda dari tab "SEO" global Beranda. Kolom yang kosong memakai metadata bawaan
 * layout (judul "<nama situs> — Penerbit buku", deskripsi dan gambar bagikan dari
 * Pengaturan Situs).
 *
 * Kunci title/description HANYA disertakan bila terisi: Next menggabungkan dengan
 * `for...in`, jadi `title: undefined` tetap menimpa judul layout menjadi kosong (tanpa
 * <title>) dan `description: undefined` menghapus deskripsi layout.
 */
export async function generateMetadata(): Promise<Metadata> {
  const [meta, s] = await Promise.all([getHomepageMeta(), getSettings()]);
  if (!meta?.title && !meta?.description && !meta?.image) return { alternates: { canonical: "/" } };

  const image = ogImageFrom(asMedia(meta.image), s.siteName) ?? s.ogImage;
  return {
    ...(meta.title ? { title: seoTitle(meta.title, s.siteName, s.siteName) } : {}),
    ...(meta.description ? { description: meta.description } : {}),
    alternates: { canonical: "/" },
    // openGraph halaman menggantikan seluruh openGraph layout (gabungan dangkal): sertakan ogBase.
    openGraph: { ...ogBase(s), type: "website", url: "/", images: image ? [image] : [] },
  };
}

/** Susunan Beranda diatur di global Beranda; isinya dirender HomePageContent (juga dipakai pratinjau). */
export default function HomePage() {
  return <HomePageContent />;
}
