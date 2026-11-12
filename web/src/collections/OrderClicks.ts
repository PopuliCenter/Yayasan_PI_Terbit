import type { CollectionConfig } from "payload";
import { isAdmin, isSuperAdmin } from "../access";

/**
 * Event klik order (F-ORD-06).
 *
 * Satu baris per klik tombol WhatsApp atau marketplace. Inilah satu-satunya
 * ukuran minat yang kita punya sebelum pesanan dicatat manual, dan jadi dasar
 * pemicu naik ke toko penuh (bagian 14 PRD).
 *
 * Privasi: TIDAK menyimpan alamat IP, user agent, cookie, atau pengenal
 * pengunjung apa pun. Hanya buku, sasaran klik, halaman asal, dan waktu.
 */
export const OrderClicks: CollectionConfig = {
  slug: "order-clicks",
  labels: { singular: "Klik Order", plural: "Klik Order" },
  admin: {
    useAsTitle: "id",
    defaultColumns: ["createdAt", "book", "target", "platform", "path"],
    group: "Laporan",
    description:
      "Tanpa data pribadi: hanya buku, sasaran klik, halaman asal, dan waktu.",
  },
  defaultSort: "-createdAt",
  access: {
    read: isAdmin,
    create: () => false,
    update: () => false,
    delete: isSuperAdmin,
  },
  fields: [
    {
      name: "book",
      type: "relationship",
      relationTo: "books",
      label: "Buku",
      index: true,
    },
    {
      name: "target",
      type: "select",
      label: "Sasaran",
      required: true,
      index: true,
      options: [
        { label: "WhatsApp", value: "wa" },
        { label: "Marketplace", value: "marketplace" },
      ],
    },
    {
      name: "platform",
      type: "text",
      label: "Marketplace",
      admin: { description: "Hanya terisi bila sasarannya marketplace." },
    },
    {
      name: "path",
      type: "text",
      label: "Halaman asal",
      index: true,
    },
  ],
  timestamps: true,
};
