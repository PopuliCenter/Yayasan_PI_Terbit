import path from "path";
import { fileURLToPath } from "url";
import { buildConfig, type CollectionConfig, type PayloadRequest, type Plugin } from "payload";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { id } from "@payloadcms/translations/languages/id";
import sharp from "sharp";

import { dashboard } from "./admin/dashboard";
import { Authors } from "./collections/Authors";
import { AuditLogs } from "./collections/AuditLogs";
import { Books } from "./collections/Books";
import { Categories } from "./collections/Categories";
import { Inquiries } from "./collections/Inquiries";
import { Media } from "./collections/Media";
import { OrderClicks } from "./collections/OrderClicks";
import { Orders } from "./collections/Orders";
import { Pages } from "./collections/Pages";
import { Posts } from "./collections/Posts";
import { PrivateFiles } from "./collections/PrivateFiles";
import { Series } from "./collections/Series";
import { Subscribers } from "./collections/Subscribers";
import { Users } from "./collections/Users";
import { reportEndpoints } from "./endpoints/reports";
import { Appearance } from "./globals/Appearance";
import { Homepage } from "./globals/Homepage";
import { Settings } from "./globals/Settings";
import { auditAfterChange, auditAfterDelete } from "./hooks/audit";
import { captureLivePath, createSlugRedirect, invalidateOnChange, invalidateOnDelete } from "./hooks/slugRedirect";
import { adminTranslationsId } from "./i18n/admin-id";
import { previewPath } from "./lib/preview-url";
import { isRouted } from "./lib/urls";
import { formBuilder } from "./plugins/formBuilder";
import { importExport } from "./plugins/importExport";
import { redirects } from "./plugins/redirects";
import { seo } from "./plugins/seo";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Pengembangan lokal memakai SQLite agar tidak perlu menyalakan Docker.
 * Produksi memakai Postgres (DATABASE_ADAPTER=postgres), terpisah dari basis
 * data aplikasi survei di VPS yang sama.
 */
const database =
  process.env.DATABASE_ADAPTER === "postgres"
    ? postgresAdapter({
        pool: { connectionString: process.env.DATABASE_URL },
        // Skema produksi hanya berubah lewat migrasi eksplisit (`payload migrate`,
        // service `migrate` di compose), didahului backup — panduan deploy W9.
        push: false,
        migrationDir: path.resolve(dirname, "migrations"),
      })
    : sqliteAdapter({
        client: { url: process.env.DATABASE_URI || "file:./penerbit.db" },
      });

/**
 * Origin yang boleh membawa cookie login Payload (proteksi CSRF bawaan Payload).
 * HANYA host admin. Apex sengaja tidak masuk: apex dan admin.<domain> satu situs
 * (same-site), jadi bila apex ikut dipercaya, skrip di apex bisa mengirim permintaan
 * ber-cookie admin. Situs publik tidak pernah memakai REST Payload dengan cookie.
 */
const csrfOrigins = [process.env.ADMIN_BASE_URL]
  .filter((u): u is string => Boolean(u))
  .map((u) => u.replace(/\/+$/, ""));
if (process.env.NODE_ENV !== "production") csrfOrigins.push("http://localhost:3000");

/**
 * Payload tidak punya hook koleksi di level root config (root hanya `afterError`),
 * jadi log audit (F-ADM-05) dipasang ke tiap koleksi di sini. Koleksi log sendiri
 * dan event klik dilewati di dalam hook.
 */
const withAudit = (collection: CollectionConfig): CollectionConfig => ({
  ...collection,
  hooks: {
    ...collection.hooks,
    afterChange: [...(collection.hooks?.afterChange ?? []), auditAfterChange],
    afterDelete: [...(collection.hooks?.afterDelete ?? []), auditAfterDelete],
  },
});

/** Bawaan daftar admin: tanpa tautan API mentah, 25 baris per halaman. Koleksi boleh menimpa. */
const withAdminDefaults = (c: CollectionConfig): CollectionConfig => ({
  ...c,
  admin: { hideAPIURL: true, pagination: { defaultLimit: 25, limits: [25, 50, 100] }, ...c.admin },
});

/**
 * Koleksi yang punya alamat publik: saat slug berubah, buat pengalihan dari alamat lama
 * (F-SEO) dan segarkan tabel pengalihan di memori.
 */
const withSlugRedirects = (c: CollectionConfig): CollectionConfig =>
  isRouted(c.slug)
    ? {
        ...c,
        hooks: {
          ...c.hooks,
          beforeChange: [...(c.hooks?.beforeChange ?? []), captureLivePath],
          afterChange: [...(c.hooks?.afterChange ?? []), createSlugRedirect, invalidateOnChange],
          afterDelete: [...(c.hooks?.afterDelete ?? []), invalidateOnDelete],
        },
      }
    : c;

/** Audit dipasang SETELAH plugin lain, agar koleksi tambahan plugin (redirects, forms, form-submissions, imports) ikut tercatat. */
const auditPlugin: Plugin = (config) => ({ ...config, collections: (config.collections ?? []).map(withAudit) });

/** Antrean job hanya untuk super admin (plugin impor/ekspor selalu mendaftarkan task). */
const superAdminOnly = ({ req }: { req: PayloadRequest }) =>
  (req.user as { role?: string } | null)?.role === "super-admin";

export default buildConfig({
  // serverURL sengaja TIDAK diisi: URL media menjadi relatif (/api/media/file/...),
  // sehingga satu image yang sama berlaku di apex (publik) dan admin.<domain>,
  // dan juga di staging maupun produksi. URL absolut dibentuk dari SITE_URL di lib/site.ts.
  csrf: csrfOrigins,
  admin: {
    user: Users.slug,
    avatar: "default", // bawaan 'gravatar' mengirim hash email admin ke gravatar.com
    dateFormat: "d MMM yyyy, HH.mm",
    meta: {
      titleSuffix: " — Admin Yayasan Populi Indonesia",
      description: "Panel pengelola situs penerbit Yayasan Populi Indonesia",
      defaultOGImageType: "off",
      icons: [{ rel: "icon", type: "image/svg+xml", url: "/brand/ypi-mark.svg" }],
      openGraph: {
        siteName: "Yayasan Populi Indonesia",
        title: "Panel pengelola",
        description: "Panel pengelola situs penerbit Yayasan Populi Indonesia",
      },
    },
    components: {
      graphics: {
        Logo: "@/components/admin/graphics#AdminLogo",
        Icon: "@/components/admin/graphics#AdminIcon",
      },
      beforeDashboard: ["@/components/admin/dashboard/WelcomeHeader#WelcomeHeader"],
      beforeNavLinks: ["@/components/admin/nav/NavExtras#NavExtras"],
      views: {
        laporan: {
          Component: "@/components/admin/views/ReportsView#ReportsView",
          path: "/laporan",
          exact: true,
          meta: { title: "Laporan per judul" },
        },
      },
    },
    dashboard,
    livePreview: {
      collections: ["books", "pages", "posts"],
      globals: ["homepage", "appearance"],
      breakpoints: [
        { name: "ponsel", label: "Ponsel", width: 390, height: 844 },
        { name: "tablet", label: "Tablet", width: 768, height: 1024 },
        { name: "laptop", label: "Laptop", width: 1366, height: 768 },
      ],
      // Path RELATIF: panel admin menjadikannya absolut terhadap origin admin, jadi iframe selalu same-origin di host admin.
      url: ({ collectionConfig, globalConfig, data }) =>
        previewPath({
          collection: collectionConfig?.slug,
          global: globalConfig?.slug,
          id: data?.id,
          slug: data?.slug,
        }),
    },
  },
  collections: [
    // Urutan ini juga urutan grup navigasi: Katalog, Konten, Pesanan, Laporan, Pengaturan.
    Books,
    Authors,
    Categories,
    Series,
    Media,
    Pages,
    Posts,
    Inquiries,
    Orders,
    PrivateFiles,
    OrderClicks,
    AuditLogs,
    Subscribers,
    Users,
  ]
    .map(withAdminDefaults)
    .map(withSlugRedirects),
  globals: [Settings, Appearance, Homepage],
  // Urutan penting: auditPlugin terakhir, agar koleksi dari plugin lain ikut diaudit.
  plugins: [seo, redirects, formBuilder, importExport, auditPlugin],
  endpoints: reportEndpoints,
  // Plugin impor/ekspor selalu mendaftarkan task, jadi Payload mengaktifkan job (koleksi
  // payload-jobs tersembunyi). Impor/ekspor berjalan sinkron: tanpa autoRun, tanpa worker.
  jobs: {
    access: { run: superAdminOnly, queue: superAdminOnly, cancel: superAdminOnly },
    deleteJobOnComplete: true,
  },
  editor: lexicalEditor(),
  // Wajib diteruskan agar ukuran gambar responsif dan konversi WebP di koleksi media berjalan.
  sharp,
  db: database,
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  localization: false,
  // Panel admin hanya berbahasa Indonesia; terjemahan tambahan menutup string yang
  // belum ada di paket `id` bawaan (Lexical, plugin SEO, pengalihan, impor/ekspor, formulir).
  i18n: {
    fallbackLanguage: "id",
    supportedLanguages: { id },
    translations: { id: adminTranslationsId },
  },
  graphQL: {
    disable: true,
  },
  upload: {
    limits: { fileSize: 8_000_000 },
  },
});
