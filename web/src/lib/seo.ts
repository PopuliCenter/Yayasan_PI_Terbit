import type { Media } from "@/payload-types";
import { mediaPath } from "./site";

/*
 * Bantuan metadata Next (judul, og:image, dasar openGraph). Murni dan diuji di seo.test.ts.
 */

export type OgImage = { url: string; width?: number; height?: number; alt: string };

/** Relasi upload yang sudah terisi (depth ≥ 1) sebagai Media, atau null bila hanya id/kosong. */
export const asMedia = (value: unknown): Media | null =>
  value && typeof value === "object" ? (value as Media) : null;

/**
 * Gambar bagikan dari Media. Utamakan ukuran `og` (1200×630, sampul utuh di latar navy,
 * lihat collections/Media.ts); bila belum ada, pakai berkas asli.
 */
export const ogImageFrom = (media: Media | null | undefined, fallbackAlt: string): OgImage | null => {
  if (!media) return null;
  const alt = media.alt?.trim() || fallbackAlt;
  const og = media.sizes?.og;
  const ogUrl = mediaPath(og?.url);
  if (ogUrl) return { url: ogUrl, width: og?.width ?? 1200, height: og?.height ?? 630, alt };
  const url = mediaPath(media.url);
  if (!url) return null;
  return { url, width: media.width ?? undefined, height: media.height ?? undefined, alt };
};

/**
 * Judul halaman dari meta.title. Kosong → `fallback` (layout menambahkan nama situs).
 * Sudah memuat nama situs (tanpa membedakan huruf besar/kecil) → judul absolut, agar
 * nama situs tidak muncul dua kali. Selain itu dikembalikan apa adanya sehingga template
 * layout menambahkan " — nama situs". Nilai metaTitle lama di Buku tetap benar.
 */
export const seoTitle = (
  metaTitle: string | null | undefined,
  siteName: string,
  fallback: string,
): string | { absolute: string } => {
  const t = metaTitle?.trim();
  if (!t) return fallback;
  const site = siteName.trim().toLowerCase();
  return site && t.toLowerCase().includes(site) ? { absolute: t } : t;
};

/**
 * Next menggabungkan metadata secara DANGKAL: openGraph milik halaman menggantikan
 * seluruh openGraph layout. Sertakan dasar ini di setiap openGraph halaman.
 */
export const ogBase = (s: { siteName: string }) => ({ siteName: s.siteName, locale: "id_ID" });
