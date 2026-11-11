import { cache } from "react";
import type { Where } from "payload";
import type { Author, Book, Category, Page, Post, Series, Setting } from "@/payload-types";
import { getPayloadClient } from "./payload";
import { searchBookIds } from "./search";
import { DEFAULT_WA_TEMPLATE } from "./wa";

/**
 * Semua baca publik memakai `overrideAccess: false` tanpa pengguna, sehingga aturan
 * access koleksi (mis. hanya dokumen terbit) ditegakkan Payload, bukan oleh tiap kueri.
 */
const PUBLIC = { overrideAccess: false } as const;

export const PAGE_SIZE = 24;

/* -------------------------------------------------------------------------- */
/* Pengaturan                                                                  */
/* -------------------------------------------------------------------------- */

/** Hanya field yang boleh tampil di situs. Rekening transfer sengaja tidak ikut. */
export type PublicSettings = {
  siteName: string;
  tagline: string | null;
  legalEntityName: string | null;
  sellerEntityName: string | null;
  /** Nama penerbit resmi (badan hukum), dipakai di halaman buku dan identitas penerbit. */
  publisherName: string;
  legalBasis: string | null;
  publisherResponsible: string | null;
  address: string | null;
  nib: string | null;
  registeredInfo: string | null;
  waNumber: string | null;
  email: string | null;
  phone: string | null;
  serviceHours: string | null;
  waResponseTarget: string | null;
  complaintResponseTarget: string | null;
  waMessageTemplate: string;
  orderStepsNote: string | null;
  pktnContact: string | null;
  marketplaceStores: { platform: string; url: string }[];
  socialLinks: { label: string; url: string }[];
  consentVersion: string;
  consentText: string;
  defaultMetaDescription: string | null;
};

export const getSettings = cache(async (): Promise<PublicSettings> => {
  const payload = await getPayloadClient();
  // overrideAccess: global ini tertutup untuk publik karena memuat rekening transfer.
  const s = (await payload.findGlobal({
    slug: "settings",
    overrideAccess: true,
    depth: 0,
  })) as Partial<Setting>;

  return {
    siteName: s.siteName || "Yayasan Populi Indonesia",
    tagline: s.tagline ?? null,
    legalEntityName: s.legalEntityName ?? null,
    sellerEntityName: s.sellerEntityName ?? null,
    publisherName: s.legalEntityName || s.siteName || "Yayasan Populi Indonesia",
    legalBasis: s.legalBasis ?? null,
    publisherResponsible: s.publisherResponsible ?? null,
    address: s.address ?? null,
    nib: s.nib ?? null,
    registeredInfo: s.registeredInfo ?? null,
    waNumber: s.waNumber ?? null,
    email: s.email ?? null,
    phone: s.phone ?? null,
    serviceHours: s.serviceHours ?? null,
    waResponseTarget: s.waResponseTarget ?? null,
    complaintResponseTarget: s.complaintResponseTarget ?? null,
    waMessageTemplate: s.waMessageTemplate || DEFAULT_WA_TEMPLATE,
    orderStepsNote: s.orderStepsNote ?? null,
    pktnContact: s.pktnContact ?? null,
    marketplaceStores: (s.marketplaceStores ?? []).map((m) => ({ platform: m.platform, url: m.url })),
    socialLinks: (s.socialLinks ?? []).map((l) => ({ label: l.label, url: l.url })),
    consentVersion: s.consentVersion || "1.0",
    consentText:
      s.consentText ||
      "Saya setuju menerima email kabar terbitan baru, dan saya boleh berhenti kapan saja.",
    defaultMetaDescription: s.defaultMetaDescription ?? null,
  };
});

/* -------------------------------------------------------------------------- */
/* Buku                                                                        */
/* -------------------------------------------------------------------------- */

export type CatalogSort = "terbaru" | "judul" | "termurah" | "termahal";

export const SORTS: Record<CatalogSort, { label: string; sort: string }> = {
  terbaru: { label: "Terbaru", sort: "-publishedAt" },
  judul: { label: "Judul A–Z", sort: "title" },
  termurah: { label: "Harga terendah", sort: "price" },
  termahal: { label: "Harga tertinggi", sort: "-price" },
};

export type CatalogParams = {
  q?: string;
  kategori?: string;
  penulis?: string;
  ketersediaan?: string;
  urut?: string;
  halaman?: string;
};

export type CatalogResult = {
  docs: Book[];
  totalDocs: number;
  page: number;
  totalPages: number;
  query: string;
  sort: CatalogSort;
};

const AVAILABILITY_VALUES = new Set(["tersedia", "terbatas", "habis", "segera"]);

export const getCatalog = cache(async (params: CatalogParams): Promise<CatalogResult> => {
  const payload = await getPayloadClient();
  const query = (params.q ?? "").trim().slice(0, 120);
  const sortKey: CatalogSort = params.urut && params.urut in SORTS ? (params.urut as CatalogSort) : "terbaru";
  const page = Math.max(1, Number.parseInt(params.halaman ?? "1", 10) || 1);

  const and: Where[] = [];

  if (params.kategori) {
    const cat = await getCategoryBySlug(params.kategori);
    if (!cat) return { docs: [], totalDocs: 0, page: 1, totalPages: 0, query, sort: sortKey };
    and.push({ categories: { in: [cat.id] } });
  }
  if (params.penulis) {
    const author = await getAuthorBySlug(params.penulis);
    if (!author) return { docs: [], totalDocs: 0, page: 1, totalPages: 0, query, sort: sortKey };
    and.push({ authors: { in: [author.id] } });
  }
  if (params.ketersediaan && AVAILABILITY_VALUES.has(params.ketersediaan)) {
    and.push({ availability: { equals: params.ketersediaan } });
  }

  // Dengan kata kunci: urutan mengikuti relevansi, kecuali pengguna memilih urutan lain.
  if (query) {
    const ids = await searchBookIds(query);
    if (ids.length === 0) return { docs: [], totalDocs: 0, page: 1, totalPages: 0, query, sort: sortKey };

    const all = await payload.find({
      collection: "books",
      ...PUBLIC,
      where: { and: [...and, { id: { in: ids } }] },
      depth: 1,
      limit: ids.length,
      pagination: false,
      sort: params.urut ? SORTS[sortKey].sort : undefined,
    });

    const docs = params.urut
      ? all.docs
      : [...all.docs].sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
    const totalPages = Math.ceil(docs.length / PAGE_SIZE);
    return {
      docs: docs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
      totalDocs: docs.length,
      page: Math.min(page, Math.max(totalPages, 1)),
      totalPages,
      query,
      sort: sortKey,
    };
  }

  const result = await payload.find({
    collection: "books",
    ...PUBLIC,
    where: and.length ? { and } : undefined,
    depth: 1,
    limit: PAGE_SIZE,
    page,
    sort: SORTS[sortKey].sort,
  });

  return {
    docs: result.docs,
    totalDocs: result.totalDocs,
    page: result.page ?? 1,
    totalPages: result.totalPages,
    query,
    sort: sortKey,
  };
});

export const getBookBySlug = cache(async (slug: string): Promise<Book | null> => {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "books",
    ...PUBLIC,
    where: { slug: { equals: slug } },
    depth: 2,
    limit: 1,
  });
  return result.docs[0] ?? null;
});

export const getRelatedBooks = cache(async (book: Book, limit = 4): Promise<Book[]> => {
  const payload = await getPayloadClient();
  const seriesId = typeof book.series === "object" && book.series ? book.series.id : book.series;
  const categoryIds = (book.categories ?? []).map((c) => (typeof c === "object" ? c.id : c));

  const or: Where[] = [];
  if (seriesId) or.push({ series: { equals: seriesId } });
  if (categoryIds.length) or.push({ categories: { in: categoryIds } });
  if (or.length === 0) return [];

  const result = await payload.find({
    collection: "books",
    ...PUBLIC,
    where: { and: [{ id: { not_equals: book.id } }, { or }] },
    depth: 1,
    limit,
    sort: "-publishedAt",
  });
  return result.docs;
});

export const getHomeBooks = cache(async () => {
  const payload = await getPayloadClient();
  const [latest, featured] = await Promise.all([
    payload.find({ collection: "books", ...PUBLIC, depth: 1, limit: 8, sort: "-publishedAt" }),
    payload.find({
      collection: "books",
      ...PUBLIC,
      where: { featured: { equals: true } },
      depth: 1,
      limit: 4,
      sort: "-publishedAt",
    }),
  ]);
  return { latest: latest.docs, featured: featured.docs };
});

/* -------------------------------------------------------------------------- */
/* Penulis, kategori, seri                                                     */
/* -------------------------------------------------------------------------- */

export const getAuthors = cache(async (): Promise<Author[]> => {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "authors",
    ...PUBLIC,
    depth: 1,
    limit: 500,
    pagination: false,
    sort: "name",
  });
  return result.docs;
});

export const getAuthorBySlug = cache(async (slug: string): Promise<Author | null> => {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "authors",
    ...PUBLIC,
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
  });
  return result.docs[0] ?? null;
});

export const getBooksByAuthor = cache(async (authorId: number): Promise<Book[]> => {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "books",
    ...PUBLIC,
    where: { authors: { in: [authorId] } },
    depth: 1,
    limit: 200,
    pagination: false,
    sort: "-publishedAt",
  });
  return result.docs;
});

export const getCategories = cache(async (): Promise<Category[]> => {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "categories",
    ...PUBLIC,
    depth: 0,
    limit: 200,
    pagination: false,
    sort: "order",
  });
  return result.docs;
});

export const getCategoryBySlug = cache(async (slug: string): Promise<Category | null> => {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "categories",
    ...PUBLIC,
    where: { slug: { equals: slug } },
    depth: 0,
    limit: 1,
  });
  return result.docs[0] ?? null;
});

export const getSeriesBySlug = cache(async (slug: string): Promise<Series | null> => {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "series",
    ...PUBLIC,
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
  });
  return result.docs[0] ?? null;
});

export const getBooksInSeries = cache(async (seriesId: number): Promise<Book[]> => {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "books",
    ...PUBLIC,
    where: { series: { equals: seriesId } },
    depth: 1,
    limit: 200,
    pagination: false,
    sort: "seriesOrder",
  });
  return result.docs;
});

/* -------------------------------------------------------------------------- */
/* Halaman & kabar                                                             */
/* -------------------------------------------------------------------------- */

export const getPageBySlug = cache(async (slug: string): Promise<Page | null> => {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "pages",
    ...PUBLIC,
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
  });
  return result.docs[0] ?? null;
});

export const getFooterPages = cache(async (): Promise<Pick<Page, "id" | "title" | "slug">[]> => {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "pages",
    ...PUBLIC,
    where: { showInFooter: { equals: true } },
    depth: 0,
    limit: 20,
    pagination: false,
    sort: "footerOrder",
    select: { title: true, slug: true },
  });
  return result.docs;
});

export const getPosts = cache(async (page = 1, limit = 12) => {
  const payload = await getPayloadClient();
  return payload.find({
    collection: "posts",
    ...PUBLIC,
    depth: 1,
    limit,
    page,
    sort: "-publishedAt",
  });
});

export const getPostBySlug = cache(async (slug: string): Promise<Post | null> => {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "posts",
    ...PUBLIC,
    where: { slug: { equals: slug } },
    depth: 2,
    limit: 1,
  });
  return result.docs[0] ?? null;
});
