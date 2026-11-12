import type { CollectionConfig } from "payload";
import { isAdmin, isSuperAdmin } from "../access";

/**
 * Log audit aksi tulis admin (F-ADM-05: "log audit yang dapat dicari").
 * Diisi oleh hook global di payload.config.ts, bukan oleh manusia.
 */
export const AuditLogs: CollectionConfig = {
  slug: "audit-logs",
  labels: { singular: "Log Audit", plural: "Log Audit" },
  admin: {
    useAsTitle: "summary",
    defaultColumns: ["summary", "user", "collectionSlug", "operation", "createdAt"],
    group: "Laporan",
    description: "Catatan siapa mengubah apa dan kapan. Tidak bisa diubah.",
    listSearchableFields: ["summary", "collectionSlug", "documentTitle", "documentId"],
  },
  defaultSort: "-createdAt",
  access: {
    read: isAdmin,
    create: () => false,
    update: () => false,
    delete: isSuperAdmin,
  },
  fields: [
    { name: "summary", type: "text", label: "Ringkas", index: true },
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      label: "Pelaku",
      index: true,
    },
    {
      name: "userEmail",
      type: "text",
      label: "Email pelaku",
      admin: { description: "Disimpan terpisah agar jejak tetap ada bila akun dihapus." },
    },
    { name: "collectionSlug", type: "text", label: "Koleksi", index: true },
    { name: "documentId", type: "text", label: "ID dokumen", index: true },
    { name: "documentTitle", type: "text", label: "Judul dokumen" },
    {
      name: "operation",
      type: "select",
      label: "Aksi",
      index: true,
      options: [
        { label: "Buat", value: "create" },
        { label: "Ubah", value: "update" },
        { label: "Hapus", value: "delete" },
      ],
    },
    {
      name: "changedFields",
      type: "text",
      label: "Field yang berubah",
      admin: { description: "Nama field saja, bukan isinya." },
    },
  ],
  timestamps: true,
};
