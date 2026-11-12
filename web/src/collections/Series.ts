import type { CollectionConfig } from "payload";
import { anyone, isKatalog } from "../access";
import { slugField } from "../fields/slug";
import { rejectImportIssues } from "../hooks/rejectImportIssues";
import { exportFilename } from "../lib/import/parse";

export const Series: CollectionConfig = {
  slug: "series",
  labels: { singular: "Seri", plural: "Seri" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "updatedAt"],
    group: "Katalog",
    components: {
      edit: {
        beforeDocumentControls: [
          { path: "@/components/admin/LihatDiSitus#LihatDiSitus", serverProps: { collection: "series" } },
        ],
      },
    },
  },
  defaultSort: "title",
  access: {
    read: anyone,
    create: isKatalog,
    update: isKatalog,
    delete: isKatalog,
  },
  hooks: {
    beforeValidate: [rejectImportIssues],
  },
  fields: [
    { name: "title", type: "text", label: "Nama seri", required: true },
    slugField(),
    {
      name: "description",
      type: "textarea",
      label: "Deskripsi seri",
    },
    {
      name: "cover",
      type: "upload",
      relationTo: "media",
      label: "Gambar seri",
      custom: { "plugin-import-export": { hooks: { beforeExport: exportFilename } } },
    },
  ],
};
