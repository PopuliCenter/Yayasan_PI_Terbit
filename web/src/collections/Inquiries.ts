import type { CollectionConfig } from "payload";
import { isAdmin, isOrder, isSuperAdmin } from "../access";

/**
 * Pesan yang masuk dari formulir (F-FRM-01 penawaran institusi, F-FRM-02 kontak/pengaduan,
 * F-KON-05 kirim naskah).
 *
 * Dibuat lewat server action dengan `overrideAccess`, bukan oleh pengunjung lewat REST API:
 * `create` ditutup untuk publik agar endpoint Payload tidak bisa dibanjiri langsung.
 */
export const Inquiries: CollectionConfig = {
  slug: "inquiries",
  labels: { singular: "Pesan Masuk", plural: "Pesan Masuk" },
  admin: {
    useAsTitle: "subjectLine",
    defaultColumns: ["subjectLine", "type", "name", "status", "createdAt"],
    group: "Pesanan",
    description:
      "Permintaan penawaran institusi, pertanyaan, pengaduan, dan pengiriman naskah.",
    listSearchableFields: ["name", "email", "institutionName", "message"],
  },
  access: {
    read: isAdmin,
    create: () => false,
    update: isOrder,
    delete: isSuperAdmin,
  },
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        // Update parsial (mis. ubah status massal) bisa tidak membawa field ini; pakai nilai lama.
        const v = (k: string) => (data?.[k] ?? originalDoc?.[k]) as string | undefined;
        const labels: Record<string, string> = {
          institusi: "Penawaran institusi",
          kontak: "Pertanyaan",
          pengaduan: "Pengaduan",
          naskah: "Kirim naskah",
          stok: "Kabari bila tersedia",
        };
        const who = v("institutionName") || v("name") || "Tanpa nama";
        data.subjectLine = `${labels[v("type") ?? ""] ?? "Pesan"} — ${who}`;
        return data;
      },
    ],
  },
  fields: [
    {
      name: "subjectLine",
      type: "text",
      label: "Ringkas",
      admin: { readOnly: true, position: "sidebar" },
    },
    {
      name: "type",
      type: "select",
      label: "Jenis",
      required: true,
      index: true,
      options: [
        { label: "Penawaran institusi", value: "institusi" },
        { label: "Pertanyaan umum", value: "kontak" },
        { label: "Pengaduan", value: "pengaduan" },
        { label: "Kirim naskah", value: "naskah" },
        { label: "Kabari bila tersedia", value: "stok" },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "name", type: "text", label: "Nama", required: true },
        { name: "email", type: "email", label: "Email", required: true },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "phone", type: "text", label: "Telepon / WhatsApp" },
        { name: "institutionName", type: "text", label: "Nama lembaga" },
        { name: "role", type: "text", label: "Jabatan" },
      ],
    },
    {
      name: "message",
      type: "textarea",
      label: "Pesan",
      required: true,
    },
    {
      name: "requestedItems",
      type: "textarea",
      label: "Judul dan jumlah yang diminta",
      admin: { description: "Diisi pembeli institusi pada formulir penawaran." },
    },
    {
      name: "shippingAddress",
      type: "textarea",
      label: "Alamat kirim",
    },
    {
      name: "relatedBook",
      type: "relationship",
      relationTo: "books",
      label: "Buku terkait",
      admin: { description: "Terisi otomatis bila pesan dikirim dari halaman buku." },
    },
    {
      name: "status",
      type: "select",
      label: "Status penanganan",
      required: true,
      defaultValue: "baru",
      index: true,
      options: [
        { label: "Baru", value: "baru" },
        { label: "Sedang ditangani", value: "diproses" },
        { label: "Selesai", value: "selesai" },
        { label: "Spam", value: "spam" },
      ],
    },
    {
      name: "handledBy",
      type: "relationship",
      relationTo: "users",
      label: "Ditangani oleh",
      admin: { position: "sidebar" },
    },
    {
      name: "respondedAt",
      type: "date",
      label: "Waktu dijawab",
      admin: {
        position: "sidebar",
        date: { pickerAppearance: "dayAndTime" },
        description: "Dipakai mengukur tenggat tanggapan (usulan ≤ 2 hari kerja).",
      },
    },
    {
      name: "internalNotes",
      type: "textarea",
      label: "Catatan internal",
    },
  ],
};
