import type { CollectionConfig } from "payload";
import { isKatalog, publishedOrAdmin } from "../access";
import { slugField } from "../fields/slug";

export const Authors: CollectionConfig = {
  slug: "authors",
  labels: { singular: "Penulis", plural: "Penulis" },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "_status", "updatedAt"],
    group: "Katalog",
  },
  versions: { drafts: true },
  access: {
    read: publishedOrAdmin,
    create: isKatalog,
    update: isKatalog,
    delete: isKatalog,
  },
  fields: [
    { name: "name", type: "text", label: "Nama", required: true, index: true },
    slugField("name"),
    {
      name: "photo",
      type: "upload",
      relationTo: "media",
      label: "Foto",
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
    },
  ],
};
