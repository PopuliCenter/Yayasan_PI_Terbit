import { importExportPlugin } from "@payloadcms/plugin-import-export";
import type { ImportBeforeHook, ImportExportPluginConfig } from "@payloadcms/plugin-import-export/types";
import {
  APIError,
  addDataAndFileToRequest,
  type CollectionBeforeOperationHook,
  type CollectionConfig,
  type Endpoint,
  type Field,
  type PayloadRequest,
} from "payload";
import {
  authorsImportBefore,
  booksImportBefore,
  categoriesImportBefore,
  seriesImportBefore,
} from "../lib/import/catalog-hooks";
import { SEMICOLON_CSV_MESSAGE, isSemicolonCsv } from "../lib/import/parse";

/**
 * Impor/ekspor CSV katalog (plugin import-export), dikunci untuk situs ini.
 *
 * Mode SINKRON: impor berjalan di dalam permintaan unggah berkas, ekspor lewat
 * /download tanpa menyimpan berkas. Tidak ada antrean job, cron, atau worker.
 * Batas 500 baris per berkas menjaga satu impor jauh di bawah batas waktu proxy.
 *
 * Bawaan plugin yang diubah:
 * - koleksi imports/exports bawaan boleh dipakai SEMUA pengguna yang masuk; di sini
 *   hanya super admin dan admin katalog;
 * - endpoint plugin (/download, /export-preview, /preview-data) tidak memeriksa akses
 *   sendiri; di sini dibungkus pemeriksaan peran;
 * - validasi collectionSlug plugin hanya memastikan koleksinya ada (mis. "users" lolos);
 *   di sini dibatasi ke koleksi katalog;
 * - parser CSV plugin selalu memakai koma; berkas berpemisah titik koma (bawaan Excel
 *   wilayah Indonesia) ditolak sebelum diurai, di impor maupun pratinjau.
 */

export const IMPORTABLE = ["books", "authors", "categories", "series"] as const;
const IMPORTABLE_SET = new Set<string>(IMPORTABLE);

const DENIED = "Anda tidak diizinkan melakukan impor atau ekspor data ini.";
const NOT_IMPORTABLE = "Koleksi ini tidak bisa diimpor atau diekspor.";

const canCatalog = (req: PayloadRequest): boolean =>
  req.user?.role === "super-admin" || req.user?.role === "admin-katalog";

const katalogOnly = ({ req }: { req: PayloadRequest }) => canCatalog(req);

const isImportable = (slug: unknown): boolean => typeof slug === "string" && IMPORTABLE_SET.has(slug);

const collectionSlugOf = (data: unknown): unknown =>
  typeof data === "object" && data !== null && "collectionSlug" in data ? data.collectionSlug : undefined;

const deny = () => Response.json({ errors: [{ message: DENIED }] }, { status: 403 });

/** Berkas impor/ekspor berisi data katalog internal: jangan disimpan cache atau diindeks. */
const noStore = ({ headers }: { headers: Headers }) => {
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("CDN-Cache-Control", "no-store");
  headers.set("Cloudflare-CDN-Cache-Control", "no-store");
  headers.set("X-Robots-Tag", "noindex, nofollow");
  return headers;
};

/**
 * Dipasang PALING DEPAN, sebelum hook ekspor sinkron milik plugin (yang berjalan di
 * beforeOperation, sebelum pemeriksaan akses koleksi).
 */
const guard: CollectionBeforeOperationHook = ({ args, operation, overrideAccess, req }) => {
  if (operation !== "create") return;
  if (!overrideAccess && !canCatalog(req)) throw new APIError(DENIED, 403, null, true);
  if (!isImportable(collectionSlugOf(args.data))) throw new APIError(NOT_IMPORTABLE, 400, null, true);

  // Plugin memilih parser hanya dari mimetype. Chrome/Edge di Windows sering mengirim
  // .csv sebagai application/vnd.ms-excel sehingga berkas diurai sebagai JSON dan gagal.
  const file = req.file;
  if (file?.name) {
    if (/\.csv$/i.test(file.name)) file.mimetype = "text/csv";
    else if (/\.json$/i.test(file.name)) file.mimetype = "application/json";
  }
  if (file?.data && file.mimetype === "text/csv" && isSemicolonCsv(file.data)) {
    throw new APIError(SEMICOLON_CSV_MESSAGE, 400, null, true);
  }
  return args;
};

const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);

/**
 * Membaca body JSON dari salinan permintaan. Handler pratinjau plugin memanggil
 * addDataAndFileToRequest sendiri, dan body asli hanya bisa dibaca sekali.
 */
const peekJson = async (req: PayloadRequest): Promise<unknown> => {
  if (typeof req.clone !== "function") return undefined;
  try {
    return await req.clone().json();
  } catch {
    return undefined;
  }
};

/** Pratinjau impor: berkas base64 di body JSON ({ fileData, format }). */
const previewRejection = async (req: PayloadRequest): Promise<Response | null> => {
  const body = await peekJson(req);
  if (!isRecord(body) || body.format !== "csv" || typeof body.fileData !== "string") return null;
  // 8192 karakter base64 (kelipatan 4) = 6 KB pertama berkas.
  if (!isSemicolonCsv(Buffer.from(body.fileData.slice(0, 8192), "base64"))) return null;
  return Response.json({ error: SEMICOLON_CSV_MESSAGE, errors: [{ message: SEMICOLON_CSV_MESSAGE }] }, { status: 400 });
};

type CollectionEndpoint = Omit<Endpoint, "root">;

const guardEndpoint = (endpoint: CollectionEndpoint): CollectionEndpoint => ({
  ...endpoint,
  handler: async (req) => {
    if (!canCatalog(req)) return deny();
    if (endpoint.path === "/download") {
      // Membaca body JSON sekali; addDataAndFileToRequest menyimpan hasilnya sehingga
      // req.json() di handler plugin tetap bisa dipakai.
      await addDataAndFileToRequest(req);
      const body: unknown = req.data;
      const data = typeof body === "object" && body !== null && "data" in body ? body.data : undefined;
      if (!isImportable(collectionSlugOf(data))) return deny();
    }
    if (endpoint.path === "/preview-data") {
      const rejected = await previewRejection(req);
      if (rejected) return rejected;
    }
    return endpoint.handler(req);
  },
});

const harden = (
  collection: CollectionConfig,
  staticDir: string,
  extra: Pick<CollectionConfig, "labels" | "admin">,
): CollectionConfig => ({
  ...collection,
  labels: extra.labels ?? collection.labels,
  access: {
    ...collection.access,
    read: katalogOnly,
    create: katalogOnly,
    delete: katalogOnly,
    update: () => false,
  },
  admin: { ...collection.admin, ...extra.admin },
  endpoints: collection.endpoints === false ? false : (collection.endpoints ?? []).map(guardEndpoint),
  hooks: {
    ...collection.hooks,
    beforeOperation: [guard, ...(collection.hooks?.beforeOperation ?? [])],
  },
  upload: {
    ...(typeof collection.upload === "object" ? collection.upload : {}),
    staticDir,
    modifyResponseHeaders: noStore,
  },
});

const STATUS_OPTIONS = [
  { label: "Menunggu", value: "pending" },
  { label: "Selesai", value: "completed" },
  { label: "Sebagian berhasil", value: "partial" },
  { label: "Gagal", value: "failed" },
];

const SUMMARY_LABELS: Record<string, string> = {
  imported: "Data baru",
  updated: "Data diperbarui",
  total: "Jumlah baris",
  issues: "Baris bermasalah",
  issueDetails: "Rincian baris bermasalah",
};

/** Label dan nilai bawaan formulir impor dalam bahasa Indonesia. */
const relabelImportFields = (fields: Field[]): Field[] =>
  fields.map((f): Field => {
    if (f.type === "text" && f.name === "matchField") {
      return {
        ...f,
        defaultValue: "slug",
        label: "Cocokkan berdasarkan kolom",
        admin: {
          ...f.admin,
          description:
            "Untuk mode Perbarui/Buat atau perbarui. Pakai slug (disarankan) atau isbn13; kolom itu wajib ada di berkas.",
        },
      };
    }
    if (f.type === "select" && f.name === "importMode") return { ...f, defaultValue: "create" };
    if (f.type === "select" && f.name === "status") return { ...f, options: STATUS_OPTIONS };
    if (f.type === "group" && "name" in f && f.name === "summary") {
      return {
        ...f,
        fields: f.fields.map((sub): Field => {
          if (sub.type === "number" && SUMMARY_LABELS[sub.name]) return { ...sub, label: SUMMARY_LABELS[sub.name] };
          if (sub.type === "json" && SUMMARY_LABELS[sub.name]) return { ...sub, label: SUMMARY_LABELS[sub.name] };
          return sub;
        }),
      };
    }
    return f;
  });

type CollectionEntry = ImportExportPluginConfig["collections"][number];

const catalog = (
  slug: (typeof IMPORTABLE)[number],
  before: ImportBeforeHook,
  defaultVersionStatus: "draft" | "published",
): CollectionEntry => ({
  slug,
  import: { disableJobsQueue: true, batchSize: 50, limit: 500, defaultVersionStatus, hooks: { before } },
  export: { disableJobsQueue: true, disableSave: true, batchSize: 100 },
});

export const importExport = importExportPlugin({
  collections: [
    // Buku masuk sebagai draf untuk ditinjau; data pendukung langsung terbit.
    catalog("books", booksImportBefore, "draft"),
    catalog("authors", authorsImportBefore, "published"),
    catalog("categories", categoriesImportBefore, "published"),
    catalog("series", seriesImportBefore, "published"),
  ],
  overrideImportCollection: ({ collection }) =>
    harden({ ...collection, fields: relabelImportFields(collection.fields) }, process.env.IMPORTS_DIR || "imports", {
      labels: { singular: "Impor Data", plural: "Riwayat Impor" },
      admin: {
        group: "Pengaturan",
        description:
          "Hasil impor CSV/JSON katalog. Baris yang gagal tercantum di Ringkasan Impor beserta alasannya. Templat kolom: /templat/impor-buku.csv, impor-penulis.csv, impor-kategori.csv, impor-seri.csv.",
      },
    }),
  overrideExportCollection: ({ collection }) =>
    harden(collection, process.env.EXPORTS_DIR || "exports", {
      labels: { singular: "Ekspor Data", plural: "Ekspor Data" },
      admin: { group: false },
    }),
});
