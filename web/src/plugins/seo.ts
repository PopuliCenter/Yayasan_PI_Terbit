import { seoPlugin } from "@payloadcms/plugin-seo";
import type { GenerateDescription, GenerateImage, GenerateTitle, GenerateURL } from "@payloadcms/plugin-seo/types";
import type { CollectionConfig, GlobalConfig, PayloadRequest } from "payload";
import { seoFields } from "../fields/seo";
import { lexicalToPlainText } from "../lib/richtext";
import { SITE_URL } from "../lib/site";
import { isRouted, pathFor } from "../lib/urls";

/*
 * Konfigurasi plugin-seo dan fungsi "isi otomatis". Berkas ini dimuat payload.config,
 * jadi hanya memakai req.payload (tidak boleh mengimpor lib/payload atau @payload-config).
 */

const FALLBACK_SITE = "Yayasan Populi Indonesia";
const TITLE_MAX = 60;
const DESCRIPTION_MAX = 155;

/** Data formulir dari panel admin (belum tersimpan, bentuknya bebas). */
type GenDoc = Record<string, unknown> | null | undefined;

type Target = { collectionConfig?: CollectionConfig; globalConfig?: GlobalConfig };

/** Slug target yang SUDAH diotorisasi plugin (bukan collectionSlug kiriman klien). */
const targetOf = (a: Target): string | undefined => a.collectionConfig?.slug ?? a.globalConfig?.slug;

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

const idOf = (v: unknown): number | string | null => {
  if (typeof v === "number" || (typeof v === "string" && v)) return v;
  if (v && typeof v === "object" && "id" in v) {
    const id = (v as { id: unknown }).id;
    if (typeof id === "number" || (typeof id === "string" && id)) return id;
  }
  return null;
};

/**
 * Hanya field publik dari Pengaturan Situs. Jangan menambah field internal
 * (mis. bankTransferNote) ke `select` ini.
 */
const settings = (req: PayloadRequest) =>
  req.payload.findGlobal({
    slug: "settings",
    depth: 0,
    overrideAccess: true,
    req,
    select: {
      siteName: true,
      legalEntityName: true,
      tagline: true,
      defaultMetaDescription: true,
      ogImage: true,
    },
  });

/** Kandidat pertama yang muat dalam `max` karakter; bila tidak ada, kandidat terakhir. */
const fit = (candidates: string[], max = TITLE_MAX): string => {
  const list = candidates.filter(Boolean);
  return list.find((c) => c.length <= max) ?? list[list.length - 1] ?? "";
};

/** Potong di batas kata dan akhiri dengan '…' bila lebih dari `n` karakter. */
const clip = (input: string, n = DESCRIPTION_MAX): string => {
  const s = input.replace(/\s+/g, " ").trim();
  if (s.length <= n) return s;
  const cut = s.slice(0, n - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > 0 ? cut.slice(0, space) : cut).replace(/[\s,.;:–—-]+$/, "")}…`;
};

/** Nama penulis sesuai urutan di buku. Akses biasa (overrideAccess:false) atas nama pengguna. */
const authorNames = async (value: unknown, req: PayloadRequest): Promise<string> => {
  const ids = (Array.isArray(value) ? value : []).map(idOf).filter((id): id is number | string => id !== null);
  if (ids.length === 0) return "";
  const { docs } = await req.payload.find({
    collection: "authors",
    where: { id: { in: ids } },
    depth: 0,
    pagination: false,
    select: { name: true },
    overrideAccess: false,
    req,
  });
  const byId = new Map(docs.map((d) => [String(d.id), d.name]));
  return ids
    .map((id) => byId.get(String(id)))
    .filter((name): name is string => Boolean(name))
    .join(", ");
};

const generateTitle: GenerateTitle<GenDoc> = async (args) => {
  const target = targetOf(args);
  const s = await settings(args.req);
  const site = str(s.siteName) || FALLBACK_SITE;
  if (target === "homepage") return `${site} — Penerbit buku`;

  const title = str(args.doc?.title);
  if (!title) return "";

  if (target === "books") {
    const authors = await authorNames(args.doc?.authors, args.req);
    return fit(
      authors
        ? [`${title} — ${authors} — ${site}`, `${title} — ${site}`, `${title} — ${authors}`, title]
        : [`${title} — ${site}`, title],
    );
  }
  return fit([`${title} — ${site}`, title]);
};

const generateDescription: GenerateDescription<GenDoc> = async (args) => {
  const target = targetOf(args);
  const doc = args.doc ?? {};

  if (target === "books") {
    const fromSynopsis = lexicalToPlainText(doc.synopsis, DESCRIPTION_MAX);
    if (fromSynopsis) return fromSynopsis;
    const title = str(doc.title);
    if (!title) return "";
    const [s, authors] = await Promise.all([settings(args.req), authorNames(doc.authors, args.req)]);
    const publisher = str(s.legalEntityName) || str(s.siteName) || FALLBACK_SITE;
    return clip(`${title}${authors ? ` karya ${authors}` : ""}. Terbitan ${publisher}.`);
  }
  if (target === "pages") {
    const summary = str(doc.summary);
    return summary ? clip(summary) : lexicalToPlainText(doc.content, DESCRIPTION_MAX);
  }
  if (target === "posts") return clip(str(doc.excerpt));

  const s = await settings(args.req);
  return clip(str(s.defaultMetaDescription) || str(s.tagline));
};

const generateImage: GenerateImage<GenDoc> = async (args) => {
  const target = targetOf(args);
  const doc = args.doc ?? {};
  const own = target === "books" ? idOf(doc.cover) : target === "posts" ? idOf(doc.coverImage) : null;
  if (own !== null) return own;
  const s = await settings(args.req);
  return idOf(s.ogImage) ?? "";
};

const generateURL: GenerateURL<GenDoc> = (args) => {
  const target = targetOf(args);
  const slug = str(args.doc?.slug);
  if (target && isRouted(target) && slug) return `${SITE_URL}${pathFor(target, slug)}`;
  return `${SITE_URL}/`;
};

/**
 * `collections` sengaja kosong: Buku, Halaman, dan Kabar memasang `seoMetaGroup()` sendiri.
 * Plugin tetap mengaktifkan endpoint isi otomatis untuk koleksi itu karena mengenali
 * komponen klien SEO di pohon field-nya. Global Beranda memakai tab SEO dari plugin.
 */
export const seo = seoPlugin({
  collections: [],
  globals: ["homepage"],
  uploadsCollection: "media",
  tabbedUI: true,
  interfaceName: "SeoMeta",
  fields: () => seoFields(),
  generateTitle,
  generateDescription,
  generateImage,
  generateURL,
});
