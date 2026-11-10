/**
 * URL publik situs tanpa garis miring di akhir. Dibaca saat runtime dari SITE_URL
 * (bukan NEXT_PUBLIC_*, yang ditanam saat build), sehingga satu image yang sama
 * menghasilkan canonical, sitemap, dan data terstruktur yang benar di staging dan produksi.
 */
export const SITE_URL = (process.env.SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

/** Hanya produksi yang boleh diindeks mesin pencari (SITE_INDEXABLE=true). */
export const SITE_INDEXABLE = process.env.SITE_INDEXABLE === "true";

export const absoluteUrl = (path = "/"): string =>
  `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

/**
 * URL media dari Payload relatif (serverURL tidak diisi). Bila suatu saat berupa URL
 * absolut ke host sendiri, ubah ke path relatif agar tidak bergantung pada nama host.
 * URL eksternal (mis. Cloudflare R2) dibiarkan apa adanya.
 */
export const mediaPath = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith(SITE_URL)) return url.slice(SITE_URL.length) || "/";
  return url;
};
