import type { CollectionConfig } from "payload";
import { isKatalog, publishedOrAdmin } from "../access";
import { slugField } from "../fields/slug";

export const Pages: CollectionConfig = {
  slug: "pages",
  labels: { singular: "Halaman", plural: "Halaman" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "policyVersion", "_status", "updatedAt"],
    group: "Konten",
    description:
      "Halaman statis: Tentang, Cara Pesan, Kebijakan Privasi, Ketentuan Penggunaan, Kirim Naskah.",
  },
  versions: { drafts: true },
  access: {
    read: publishedOrAdmin,
    create: isKatalog,
    update: isKatalog,
    delete: isKatalog,
  },
  fields: [
    { name: "title", type: "text", label: "Judul halaman", required: true },
    slugField(),
    {
      name: "summary",
      type: "textarea",
      label: "Ringkasan",
      maxLength: 320,
      admin: { description: "Dipakai sebagai deskripsi mesin pencari." },
    },
    {
      name: "content",
      type: "richText",
      label: "Isi halaman",
      required: true,
    },
    {
      type: "collapsible",
      label: "Penandaan versi (untuk halaman hukum)",
      admin: {
        description:
          "Halaman hukum wajib bertanggal versi (F-KON-02). Isi hanya untuk Privasi, Ketentuan, dan Cara Pesan.",
      },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "policyVersion",
              type: "text",
              label: "Versi dokumen",
              admin: { description: "Contoh: 1.0" },
            },
            {
              name: "policyEffectiveDate",
              type: "date",
              label: "Berlaku sejak",
            },
          ],
        },
      ],
    },
    {
      name: "showInFooter",
      type: "checkbox",
      label: "Tampilkan di footer",
      defaultValue: true,
      admin: { position: "sidebar" },
    },
    {
      name: "footerOrder",
      type: "number",
      label: "Urutan di footer",
      defaultValue: 100,
      admin: { position: "sidebar" },
    },
  ],
};
