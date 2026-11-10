import type { CollectionConfig } from "payload";
import { anyone, isKatalog } from "../access";
import { slugField } from "../fields/slug";

export const Series: CollectionConfig = {
  slug: "series",
  labels: { singular: "Seri", plural: "Seri" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug"],
    group: "Katalog",
  },
  access: {
    read: anyone,
    create: isKatalog,
    update: isKatalog,
    delete: isKatalog,
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
    },
  ],
};
