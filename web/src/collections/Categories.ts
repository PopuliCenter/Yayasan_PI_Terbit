import type { CollectionConfig } from "payload";
import { anyone, isKatalog } from "../access";
import { slugField } from "../fields/slug";

export const Categories: CollectionConfig = {
  slug: "categories",
  labels: { singular: "Kategori", plural: "Kategori" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "order"],
    group: "Katalog",
  },
  access: {
    read: anyone,
    create: isKatalog,
    update: isKatalog,
    delete: isKatalog,
  },
  fields: [
    { name: "title", type: "text", label: "Nama kategori", required: true },
    slugField(),
    {
      name: "description",
      type: "textarea",
      label: "Deskripsi",
      admin: {
        description:
          "Satu paragraf. Tampil di halaman kategori dan dipakai sebagai ringkasan mesin pencari.",
      },
    },
    {
      name: "order",
      type: "number",
      label: "Urutan tampil",
      defaultValue: 100,
      admin: { position: "sidebar", description: "Angka kecil tampil lebih dulu." },
    },
  ],
};
