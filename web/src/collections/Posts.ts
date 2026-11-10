import type { CollectionConfig } from "payload";
import { isKatalog, publishedOrAdmin } from "../access";
import { slugField } from "../fields/slug";

export const Posts: CollectionConfig = {
  slug: "posts",
  labels: { singular: "Kabar", plural: "Kabar" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "publishedAt", "_status"],
    group: "Konten",
    description: "Rilis buku baru, liputan, agenda, dan pengumuman penerbit.",
  },
  versions: { drafts: true },
  access: {
    read: publishedOrAdmin,
    create: isKatalog,
    update: isKatalog,
    delete: isKatalog,
  },
  fields: [
    { name: "title", type: "text", label: "Judul", required: true },
    slugField(),
    {
      name: "excerpt",
      type: "textarea",
      label: "Ringkasan",
      maxLength: 320,
      required: true,
    },
    {
      name: "coverImage",
      type: "upload",
      relationTo: "media",
      label: "Gambar utama",
    },
    {
      name: "content",
      type: "richText",
      label: "Isi",
      required: true,
    },
    {
      name: "relatedBooks",
      type: "relationship",
      relationTo: "books",
      hasMany: true,
      label: "Buku terkait",
    },
    {
      name: "publishedAt",
      type: "date",
      label: "Tanggal tayang",
      index: true,
      admin: { position: "sidebar" },
      hooks: {
        beforeChange: [
          ({ value, data }) => {
            if (!value && data?._status === "published") return new Date().toISOString();
            return value;
          },
        ],
      },
    },
  ],
};
