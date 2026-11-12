import type { CollectionConfig } from "payload";
import { isOrder, isSuperAdmin } from "../access";

/**
 * Berkas yang memuat data pribadi: bukti transfer, foto barang rusak, dokumen lembaga.
 *
 * Berbeda dari `media` (publik), berkas di sini:
 * - disimpan di luar folder `public/`, jadi tidak pernah tersaji sebagai berkas statis;
 * - hanya bisa diunduh lewat /api/private-files/file/... oleh admin yang masuk;
 * - ikut masa retensi data transaksi (10 tahun) dan tidak boleh disebar.
 */
export const PrivateFiles: CollectionConfig = {
  slug: "private-files",
  labels: { singular: "Berkas Privat", plural: "Berkas Privat" },
  admin: {
    group: "Pesanan",
    useAsTitle: "filename",
    defaultColumns: ["filename", "note", "createdAt"],
    description:
      "Bukti transfer dan berkas lain yang berisi data pribadi. Hanya admin order dan super admin.",
  },
  defaultSort: "-createdAt",
  access: {
    read: isOrder,
    create: isOrder,
    update: isOrder,
    delete: isSuperAdmin,
  },
  upload: {
    // Di container: PRIVATE_FILES_DIR=/app/files/private (volume FILES_VOLUME, ikut backup).
    staticDir: process.env.PRIVATE_FILES_DIR || "uploads-private",
    mimeTypes: ["image/*", "application/pdf"],
    // Jangan pernah di-cache: tanpa header ini Cloudflare meng-cache berkas berekstensi
    // statis (jpg/png/pdf) ±2 jam, sehingga salinan cache bisa dilayani tanpa cek peran Payload.
    modifyResponseHeaders: ({ headers }) => {
      headers.set("Cache-Control", "private, no-store, max-age=0");
      headers.set("CDN-Cache-Control", "no-store");
      headers.set("Cloudflare-CDN-Cache-Control", "no-store");
      headers.set("X-Robots-Tag", "noindex, nofollow");
      return headers;
    },
    // Tanpa ukuran turunan: berkas privat tidak perlu thumbnail publik.
  },
  fields: [
    {
      name: "note",
      type: "text",
      label: "Keterangan",
    },
  ],
};
