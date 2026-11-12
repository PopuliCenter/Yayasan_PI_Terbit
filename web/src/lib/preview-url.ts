/**
 * Alamat pratinjau draf (live preview). Murni: dipakai payload.config dan koleksi, jadi
 * tanpa impor next/*. Hasilnya path RELATIF; Payload membuka iframe di host admin yang
 * sama (same-origin, di balik Cloudflare Access), bukan di apex.
 */

export const PREVIEW_COLLECTIONS = { books: "/buku/", pages: "/", posts: "/kabar/" } as const;
export const PREVIEW_GLOBALS = { homepage: "/pratinjau/beranda", appearance: "/pratinjau/beranda" } as const;

export type PreviewCollection = keyof typeof PREVIEW_COLLECTIONS;
export type PreviewGlobal = keyof typeof PREVIEW_GLOBALS;

const isPreviewCollection = (c: unknown): c is PreviewCollection =>
  typeof c === "string" && Object.hasOwn(PREVIEW_COLLECTIONS, c);
const isPreviewGlobal = (g: unknown): g is PreviewGlobal => typeof g === "string" && Object.hasOwn(PREVIEW_GLOBALS, g);

const ID_RE = /^\d{1,12}$/;

/** Path awal pratinjau untuk satu dokumen/global, atau null bila tidak bisa dipratinjau. */
export const previewPath = (args: {
  collection?: string | null;
  global?: string | null;
  id?: number | string | null;
  slug?: string | null;
}): string | null => {
  if (args.global) {
    return isPreviewGlobal(args.global) ? `/pratinjau/mulai?global=${args.global}` : null;
  }
  if (!isPreviewCollection(args.collection)) return null;
  const id = args.id == null ? "" : String(args.id);
  if (!ID_RE.test(id)) return null;
  if (typeof args.slug !== "string" || !args.slug.trim()) return null;
  const params = new URLSearchParams({ koleksi: args.collection, id, slug: args.slug });
  return `/pratinjau/mulai?${params.toString()}`;
};

export type PreviewRequest =
  | { kind: "collection"; collection: PreviewCollection; id: number }
  | { kind: "global"; global: PreviewGlobal };

/** Baca parameter rute /pratinjau/mulai dengan daftar putih. Slug TIDAK dipercaya (dibaca ulang dari DB). */
export const parsePreviewRequest = (sp: URLSearchParams): PreviewRequest | null => {
  const global = sp.get("global");
  if (global !== null) return isPreviewGlobal(global) ? { kind: "global", global } : null;
  const collection = sp.get("koleksi");
  const id = sp.get("id") ?? "";
  if (!isPreviewCollection(collection) || !ID_RE.test(id)) return null;
  return { kind: "collection", collection, id: Number(id) };
};

export const publicPathFor = (c: PreviewCollection, slug: string): string => `${PREVIEW_COLLECTIONS[c]}${slug}`;

/** Beranda versi pratinjau. "/" di host admin dialihkan nginx ke /admin. */
export const PREVIEW_HOME = "/pratinjau/beranda";

/**
 * Tautan beranda ("/", "/#jangkar", "/?kueri") diarahkan ke beranda pratinjau; path lain
 * tetap. Pakai HANYA saat pratinjau aktif, agar HTML publik tidak berubah.
 */
export const previewHref = (href: string): string =>
  href === "/" || href.startsWith("/#") || href.startsWith("/?") ? PREVIEW_HOME + href.slice(1) : href;

/** previewHref untuk tautan hasil resolveLink: tautan luar tidak disentuh. */
export const previewLink = <T extends { href: string; external: boolean }>(link: T): T =>
  link.external ? link : { ...link, href: previewHref(link.href) };
