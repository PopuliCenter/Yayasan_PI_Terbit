import type { CollectionConfig } from "payload";
import { isKatalog, publishedOrAdmin } from "../access";
import { seoMetaGroup } from "../fields/seo";
import { previewPath } from "../lib/preview-url";
import { autosaveSlugField } from "./Pages";

export const Posts: CollectionConfig = {
  slug: "posts",
  labels: { singular: "Kabar", plural: "Kabar" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["coverImage", "title", "publishedAt", "_status", "updatedAt"],
    listSearchableFields: ["title", "excerpt"],
    group: "Konten",
    description: "Rilis buku baru, liputan, agenda, dan pengumuman penerbit.",
    preview: ({ id, slug }) =>
      previewPath({
        collection: "posts",
        id: typeof id === "number" || typeof id === "string" ? id : null,
        slug: typeof slug === "string" ? slug : null,
      }),
    components: {
      edit: {
        beforeDocumentControls: [
          { path: "@/components/admin/LihatDiSitus#LihatDiSitus", serverProps: { collection: "posts" } },
        ],
      },
    },
  },
  defaultSort: "-publishedAt",
  versions: { drafts: { autosave: { interval: 1500 } }, maxPerDoc: 50 },
  access: {
    read: publishedOrAdmin,
    create: isKatalog,
    update: isKatalog,
    delete: isKatalog,
  },
  fields: [
    { name: "title", type: "text", label: "Judul", required: true },
    {
      // Tab TANPA nama: hanya tata letak, kolom DB tetap sama. Field sidebar sengaja
      // di tingkat atas (di luar tab) karena Payload hanya mengangkat field sidebar teratas.
      type: "tabs",
      tabs: [
        {
          label: "Isi",
          fields: [
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
          ],
        },
        {
          label: "SEO",
          fields: [seoMetaGroup()],
        },
      ],
    },
    autosaveSlugField(),
    {
      name: "publishedAt",
      type: "date",
      label: "Tanggal tayang",
      index: true,
      admin: { position: "sidebar", date: { displayFormat: "d MMMM yyyy" } },
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
