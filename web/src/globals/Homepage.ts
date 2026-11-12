import type { BlocksField, GlobalConfig } from "payload";
import { isKatalog, publishedOrAdmin } from "../access";
import { auditGlobalAfterChange } from "../hooks/audit";
import { previewPath } from "../lib/preview-url";
import { HOMEPAGE_BLOCKS } from "./homepage/blocks";
import { HOMEPAGE_DEFAULT_LAYOUT } from "./homepage/defaults";
import { layoutValidate } from "./homepage/validation";

/*
 * Tanpa filterOptions: menyembunyikan "Pembuka" dari laci justru membuat Pembuka yang
 * sudah ada gagal validasi. Aturan Pembuka diurus layoutValidate (saat Tayangkan) dan
 * normalizeLayout (saat render, juga untuk draf).
 */
const layoutField: BlocksField = {
  name: "layout",
  type: "blocks",
  label: "Susunan halaman",
  labels: { singular: "Bagian", plural: "Bagian" },
  required: true,
  minRows: 1,
  maxRows: 12,
  validate: layoutValidate,
  defaultValue: () => structuredClone(HOMEPAGE_DEFAULT_LAYOUT),
  admin: {
    initCollapsed: true,
    description:
      "Bagian Pembuka wajib ada dan harus paling atas. Tarik bagian lain untuk mengubah urutan. Bagian yang disembunyikan tidak tampil di situs.",
  },
  blocks: HOMEPAGE_BLOCKS,
};

/**
 * Beranda yang disusun admin dari bagian-bagian. Bila belum pernah tayang (atau
 * diturunkan), situs memakai susunan bawaan yang sama dengan beranda sebelumnya.
 */
export const Homepage: GlobalConfig = {
  slug: "homepage",
  label: "Beranda",
  typescript: { interface: "Homepage" },
  admin: {
    group: "Tampilan situs",
    hideAPIURL: true,
    // Admin order tidak mengurus tampilan; global disembunyikan dari menunya.
    hidden: ({ user }) => (user as { role?: string } | null)?.role === "admin-order",
    description:
      "Susun bagian halaman depan. Perubahan tersimpan otomatis sebagai draf; pengunjung baru melihatnya setelah Anda menekan Tayangkan. Bila Beranda diturunkan dari situs, situs memakai susunan bawaan.",
    // Alamat (/pratinjau/mulai?global=homepage) dan ukuran layar diberikan config akar.
    livePreview: { openByDefault: true },
    preview: () => previewPath({ global: "homepage" }),
    components: {
      elements: {
        beforeDocumentControls: [
          { path: "@/components/admin/LihatDiSitus#LihatDiSitus", serverProps: { global: "homepage" } },
        ],
      },
    },
  },
  access: {
    // Publik hanya versi tayang; draf hanya untuk admin yang masuk (pratinjau).
    read: publishedOrAdmin,
    readVersions: isKatalog,
    update: isKatalog,
  },
  versions: {
    // Validasi hanya saat Tayangkan (drafts.validate bawaan false): draf boleh setengah jadi.
    drafts: { autosave: { interval: 1500 } },
    max: 50,
  },
  hooks: { afterChange: [auditGlobalAfterChange] },
  fields: [
    {
      // Field pertama WAJIB tabs tanpa nama: plugin SEO (tabbedUI) menambahkan tab "SEO".
      type: "tabs",
      tabs: [{ label: "Susunan halaman", fields: [layoutField] }],
    },
  ],
};
