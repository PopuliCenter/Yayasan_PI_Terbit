import type { CollectionConfig } from "payload";
import { isKatalog, publishedOrAdmin } from "../access";
import { slugField } from "../fields/slug";
import { rejectImportIssues } from "../hooks/rejectImportIssues";
import { exportFilename, richText } from "../lib/import/parse";

export const Authors: CollectionConfig = {
  slug: "authors",
  labels: { singular: "Penulis", plural: "Penulis" },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["photo", "name", "_status", "updatedAt"],
    group: "Katalog",
    components: {
      edit: {
        beforeDocumentControls: [
          { path: "@/components/admin/LihatDiSitus#LihatDiSitus", serverProps: { collection: "authors" } },
        ],
      },
    },
  },
  defaultSort: "name",
  versions: { drafts: true },
  access: {
    read: publishedOrAdmin,
    create: isKatalog,
    update: isKatalog,
    delete: isKatalog,
  },
  hooks: {
    beforeValidate: [rejectImportIssues],
  },
  fields: [
    { name: "name", type: "text", label: "Nama", required: true, index: true },
    slugField("name"),
    {
      name: "photo",
      type: "upload",
      relationTo: "media",
      label: "Foto",
      custom: { "plugin-import-export": { hooks: { beforeExport: exportFilename } } },
    },
    {
      name: "shortBio",
      type: "textarea",
      label: "Biografi singkat",
      maxLength: 320,
      admin: {
        description:
          "Satu sampai tiga kalimat. Dipakai pada kartu penulis dan ringkasan mesin pencari.",
      },
    },
    {
      name: "bio",
      type: "richText",
      label: "Profil lengkap",
      custom: { "plugin-import-export": { hooks: { beforeImport: richText } } },
    },
  ],
};
