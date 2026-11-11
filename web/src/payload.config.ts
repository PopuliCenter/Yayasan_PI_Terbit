import path from "path";
import { fileURLToPath } from "url";
import { buildConfig, type CollectionConfig } from "payload";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { en } from "@payloadcms/translations/languages/en";
import { id } from "@payloadcms/translations/languages/id";
import sharp from "sharp";

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
import { Settings } from "./globals/Settings";
import { auditAfterChange, auditAfterDelete } from "./hooks/audit";

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

export default buildConfig({
  // serverURL sengaja TIDAK diisi: URL media menjadi relatif (/api/media/file/...),
  // sehingga satu image yang sama berlaku di apex (publik) dan admin.<domain>,
  // dan juga di staging maupun produksi. URL absolut dibentuk dari SITE_URL di lib/site.ts.
  csrf: csrfOrigins,
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: " — Admin Yayasan Populi Indonesia",
    },
  },
  collections: [
    Books,
    Authors,
    Categories,
    Series,
    Media,
    Pages,
    Posts,
    Orders,
    PrivateFiles,
    Inquiries,
    Subscribers,
    OrderClicks,
    AuditLogs,
    Users,
  ].map(withAudit),
  globals: [Settings],
  editor: lexicalEditor(),
  // Wajib diteruskan agar ukuran gambar responsif dan konversi WebP di koleksi media berjalan.
  sharp,
  db: database,
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  localization: false,
  i18n: {
    fallbackLanguage: "id",
    supportedLanguages: { id, en },
  },
  graphQL: {
    disable: true,
  },
  upload: {
    limits: { fileSize: 8_000_000 },
  },
});
