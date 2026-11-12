import type { Field, FieldHook, TextField } from "payload";
import { asText } from "../lib/import/parse";

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

export type SlugFieldOptions = {
  /** Akses per field, mis. `{ update: fieldIsKatalog }` agar admin order tidak bisa mengubah alamat. */
  access?: TextField["access"];
};

export const slugField = (sourceField = "title", opts: SlugFieldOptions = {}): Field => ({
  name: "slug",
  type: "text",
  label: "Slug URL",
  required: true,
  unique: true,
  index: true,
  ...(opts.access ? { access: opts.access } : {}),
  admin: {
    position: "sidebar",
    description:
      "Bagian akhir alamat halaman. Dibuat otomatis dari judul bila dibiarkan kosong. Bila diubah setelah tayang, alamat lama otomatis dialihkan ke alamat baru (Pengaturan → Pengalihan URL).",
  },
  hooks: {
    beforeValidate: [formatSlug(sourceField)],
  },
  // Impor CSV: slug berupa angka (mis. "1998") tidak boleh berubah menjadi number.
  custom: { "plugin-import-export": { hooks: { beforeImport: asText } } },
});
