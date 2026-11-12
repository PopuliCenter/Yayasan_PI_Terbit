import { SITE_URL } from "./site";

/**
 * Peta rute situs publik dan aturan alamat untuk pengalih URL (redirects) dan tautan.
 * Murni: tanpa impor Payload/Next, sehingga aman dipakai payload.config, koleksi, dan uji.
 */

export const ROUTED = {
  books: (s: string) => `/buku/${s}`,
  pages: (s: string) => `/${s}`,
  posts: (s: string) => `/kabar/${s}`,
  authors: (s: string) => `/penulis/${s}`,
  categories: (s: string) => `/kategori/${s}`,
  series: (s: string) => `/seri/${s}`,
} as const;

export type RoutedCollection = keyof typeof ROUTED;

/** Koleksi bersistem draf: alamat tayang dibaca dari dokumen yang sudah tayang. */
export const DRAFT_COLLECTIONS: ReadonlySet<string> = new Set(["books", "pages", "posts", "authors"]);

export const isRouted = (c: string): c is RoutedCollection => Object.hasOwn(ROUTED, c);

export const pathFor = (c: RoutedCollection, slug: string): string => ROUTED[c](slug);

/**
 * Rute tetap: folder tingkat atas di src/app/(site) yang punya page.tsx/route.ts, plus
 * berkas metadata dan pemeriksaan kesehatan. Uji urls.test.ts memastikan daftar ini
 * mengikuti struktur folder.
 */
export const STATIC_PATHS: ReadonlySet<string> = new Set([
  "/",
  "/buku",
  "/penulis",
  "/kabar",
  "/institusi",
  "/kontak",
  "/berhenti-langganan",
  "/klik",
  "/robots.txt",
  "/sitemap.xml",
  "/icon.svg",
  "/apple-icon.png",
  "/healthz",
]);

/** Awalan alamat sistem yang tidak boleh dialihkan maupun dijadikan tujuan tautan konten. */
export const RESERVED = ["/admin", "/api", "/_next", "/internal", "/nginx-health", "/pratinjau", "/brand", "/templat"] as const;

const hasReservedPrefix = (p: string) => RESERVED.some((r) => p === r || p.startsWith(`${r}/`));

/**
 * Normalisasi alamat lama untuk pencocokan pengalihan: buang skema+host, query, dan hash;
 * garis miring ganda dan di akhir; dekode tiap segmen; huruf kecil. null bila > 300 karakter.
 */
export const normalizePath = (input: string): string | null => {
  let s = String(input ?? "").trim();
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) {
    try {
      s = new URL(s).pathname;
    } catch {
      return null;
    }
  }
  s = s.replace(/[?#].*$/, "").replace(/\\/g, "/");
  if (!s.startsWith("/")) s = `/${s}`;
  s = s.replace(/\/{2,}/g, "/");
  s = s
    .split("/")
    .map((seg) => {
      try {
        return decodeURIComponent(seg);
      } catch {
        return seg;
      }
    })
    .join("/")
    .toLowerCase();
  if (s.length > 1) s = s.replace(/\/+$/, "");
  if (s.length > 300) return null;
  return s || "/";
};

/** Alasan (bahasa Indonesia) sebuah alamat asal tidak boleh dialihkan, atau null bila boleh. */
export const fromPathProblem = (p: string): string | null => {
  if (p === "/") return "Beranda tidak bisa dialihkan.";
  if (hasReservedPrefix(p)) return "Alamat sistem tidak bisa dialihkan.";
  if (STATIC_PATHS.has(p)) return "Alamat ini halaman tetap situs, jadi pengalihan tidak akan pernah dipakai.";
  return null;
};

/** Koleksi + slug yang dilayani suatu alamat konten, atau null. */
export const parseContentPath = (p: string): { collection: RoutedCollection; slug: string } | null => {
  const segs = p.split("/").filter(Boolean);
  if (segs.length === 2) {
    const [head, slug] = segs;
    const map: Record<string, RoutedCollection> = {
      buku: "books",
      kabar: "posts",
      penulis: "authors",
      kategori: "categories",
      seri: "series",
    };
    const collection = map[head];
    return collection ? { collection, slug } : null;
  }
  if (segs.length === 1) {
    const path = `/${segs[0]}`;
    if (STATIC_PATHS.has(path) || hasReservedPrefix(path)) return null;
    return { collection: "pages", slug: segs[0] };
  }
  return null;
};

export type TargetClass =
  | { kind: "internal"; path: string }
  | { kind: "external"; url: string }
  | { kind: "invalid"; reason: string };

 
const BAD_CHARS = /[\s\u0000-\u001f\u007f]/;

const internalProblem = (path: string): string | null => {
  if (path.startsWith("//") || path.startsWith("/\\")) return "Alamat tidak valid.";
  const p = path.toLowerCase();
  if (p === "/admin" || p.startsWith("/admin/") || p.startsWith("/admin?")) return "Tidak boleh mengarah ke panel admin.";
  if (p === "/internal" || p.startsWith("/internal/")) return "Tidak boleh mengarah ke alamat sistem.";
  if ((p === "/api" || p.startsWith("/api/")) && !p.startsWith("/api/media/file/")) return "Tidak boleh mengarah ke alamat sistem.";
  return null;
};

/**
 * Klasifikasi tujuan pengalihan/tautan. Internal: path situs ini. Eksternal: https ke host
 * lain. Selain itu tidak valid (mencegah open redirect, javascript:, //host, dll.).
 */
export const classifyTarget = (
  raw: string,
  o: { siteUrl?: string; adminUrl?: string } = {},
): TargetClass => {
  const siteUrl = o.siteUrl ?? SITE_URL;
  const adminUrl = o.adminUrl ?? process.env.ADMIN_BASE_URL ?? "";
  const s = String(raw ?? "");
  if (!s || BAD_CHARS.test(s)) return { kind: "invalid", reason: "Alamat tidak boleh kosong atau berisi spasi." };

  if (s.startsWith("/")) {
    const problem = internalProblem(s);
    return problem ? { kind: "invalid", reason: problem } : { kind: "internal", path: s };
  }

  let url: URL;
  try {
    url = new URL(s);
  } catch {
    return { kind: "invalid", reason: "Awali dengan / (alamat situs ini) atau https://" };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { kind: "invalid", reason: "Awali dengan / (alamat situs ini) atau https://" };
  }
  if (url.username || url.password) return { kind: "invalid", reason: "Alamat tidak valid." };

  const host = url.host.toLowerCase();
  const hostOf = (u: string) => {
    try {
      return new URL(u).host.toLowerCase();
    } catch {
      return null;
    }
  };
  if (adminUrl && host === hostOf(adminUrl)) return { kind: "invalid", reason: "Tidak boleh mengarah ke panel admin." };
  if (host === hostOf(siteUrl)) {
    const path = `${url.pathname}${url.search}${url.hash}`;
    const problem = internalProblem(path);
    return problem ? { kind: "invalid", reason: problem } : { kind: "internal", path };
  }
  if (url.protocol !== "https:") return { kind: "invalid", reason: "Situs luar wajib https." };
  return { kind: "external", url: url.toString() };
};
