import type { Field, FieldHook } from "payload";

export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);

/** Isi slug otomatis dari field sumber bila admin membiarkannya kosong. */
const formatSlug =
  (sourceField: string): FieldHook =>
  ({ data, operation, value }) => {
    if (typeof value === "string" && value.length > 0) return slugify(value);

    const source = data?.[sourceField];
    if (operation === "create" || operation === "update") {
      if (typeof source === "string" && source.length > 0) return slugify(source);
    }
    return value;
  };

export const slugField = (sourceField = "title"): Field => ({
  name: "slug",
  type: "text",
  label: "Slug URL",
  required: true,
  unique: true,
  index: true,
  admin: {
    position: "sidebar",
    description:
      "Bagian akhir alamat halaman. Dibuat otomatis dari judul bila dibiarkan kosong. Mengubahnya setelah terbit akan memutus tautan lama.",
  },
  hooks: {
    beforeValidate: [formatSlug(sourceField)],
  },
});
