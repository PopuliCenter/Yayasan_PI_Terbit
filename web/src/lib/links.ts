/**
 * Tautan yang diatur admin (menu, footer, pengumuman; juga dipakai area Beranda untuk tombol).
 * Murni, aman untuk klien dan server. Field Payload-nya ada di fields/link.ts.
 */

/** Rute bawaan situs. Kunci disimpan di DB (enum), path ditentukan kode. */
export const ROUTES = {
  beranda: { label: "Beranda", path: "/" },
  katalog: { label: "Katalog buku", path: "/buku" },
  penulis: { label: "Penulis", path: "/penulis" },
  kabar: { label: "Kabar", path: "/kabar" },
  caraPesan: { label: "Cara Pesan", path: "/cara-pesan" },
  tentang: { label: "Tentang Kami", path: "/tentang" },
  institusi: { label: "Untuk Institusi", path: "/institusi" },
  kontak: { label: "Kontak & pengaduan", path: "/kontak" },
} as const;
export type RouteKey = keyof typeof ROUTES;
export const ROUTE_OPTIONS = Object.entries(ROUTES).map(([value, r]) => ({ value, label: `${r.label} (${r.path})` }));
const isRouteKey = (v: unknown): v is RouteKey => typeof v === "string" && Object.hasOwn(ROUTES, v);

export type LinkType = "none" | "route" | "page" | "custom";

/** Bentuk data field link (group) sebagaimana dibaca dari Payload. */
export type LinkInput = {
  type?: LinkType | null;
  route?: string | null;
  page?: number | { id: number; slug?: string | null; title?: string | null } | null;
  url?: string | null;
  newTab?: boolean | null;
} | null | undefined;

export type ResolvedLink = { href: string; external: boolean; newTab: boolean };

/** Path internal yang aman: diawali satu "/", tanpa "//", "\", spasi, atau karakter kendali. */
export const isSafeInternalPath = (v: string) =>
   
  v.length <= 300 && /^\/(?![/\\])[^\s\\]*$/.test(v) && !/[\u0000-\u001f\u007f]/.test(v);

/** Alamat luar hanya https. Selain itu (javascript:, data:, http:, mailto:) ditolak. */
export const isSafeExternalUrl = (v: string) => {
  if (v.length > 500) return false;
  try {
    const u = new URL(v);
    return u.protocol === "https:" && Boolean(u.hostname);
  } catch {
    return false;
  }
};

/** Pesan validasi untuk field url (dipakai fields/link.ts). */
export const validateLinkUrl = (value: unknown): true | string => {
  const v = typeof value === "string" ? value.trim() : "";
  if (!v) return "Isi alamat tujuan.";
  if (v.startsWith("/")) return isSafeInternalPath(v) ? true : "Alamat di situs ini harus diawali satu garis miring, tanpa spasi. Contoh: /kategori/politik";
  return isSafeExternalUrl(v) ? true : "Alamat luar harus lengkap dan aman, diawali https://";
};

/** Data tautan -> href yang siap dirender, atau null bila tidak sah / halaman belum terbit. */
export const resolveLink = (link: LinkInput): ResolvedLink | null => {
  if (!link) return null;
  switch (link.type) {
    case "route":
      return isRouteKey(link.route) ? { href: ROUTES[link.route].path, external: false, newTab: false } : null;
    case "page": {
      // Halaman draf/terhapus tidak terisi (Payload hanya mengembalikan ID): tautan dibuang.
      const page = link.page;
      if (!page || typeof page !== "object" || typeof page.slug !== "string" || !page.slug) return null;
      const href = `/${page.slug}`;
      return isSafeInternalPath(href) ? { href, external: false, newTab: false } : null;
    }
    case "custom": {
      const url = (link.url ?? "").trim();
      if (url.startsWith("/")) return isSafeInternalPath(url) ? { href: url, external: false, newTab: Boolean(link.newTab) } : null;
      return isSafeExternalUrl(url) ? { href: url, external: true, newTab: Boolean(link.newTab) } : null;
    }
    default:
      return null;
  }
};

/** Apakah tautan menuju path tertentu (dipakai aturan "menu Tentang Kami wajib ada"). */
export const linkTargetsPath = (link: LinkInput, path: string) =>
  (link?.type === "route" && isRouteKey(link.route) && ROUTES[link.route].path === path) ||
  (link?.type === "custom" && (link.url ?? "").trim().replace(/\/+$/, "") === path) ||
  (link?.type === "page" && typeof link.page === "object" && link.page?.slug === path.slice(1));

/**
 * href yang aman dari nilai bebas (mis. data blok Beranda): path internal, https, atau
 * mailto (bila diizinkan). Selain itu null, sehingga tautan tidak dirender.
 */
export const safeHref = (v: unknown, opts: { allowMailto?: boolean } = {}): string | null => {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;
  if (s.startsWith("/")) return isSafeInternalPath(s) ? s : null;
  if (isSafeExternalUrl(s)) return s;
  if (opts.allowMailto && /^mailto:[^\s@]+@[^\s@]+$/.test(s)) return s;
  return null;
};
