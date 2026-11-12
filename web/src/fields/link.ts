import type { Field, GroupField } from "payload";
import { ROUTE_OPTIONS, validateLinkUrl } from "../lib/links";

type Options = {
  name?: string;
  label?: string;
  /** Tambahkan pilihan "Tanpa tautan" (mis. untuk pengumuman). */
  optional?: boolean;
};

const when = (type: string) => (_: unknown, siblingData: { type?: string } | undefined) => siblingData?.type === type;

/**
 * Field tautan yang dipakai ulang: halaman situs bawaan, halaman statis (koleksi pages),
 * atau alamat lain (path internal atau https). Area Beranda memakai field yang sama.
 * Nama field pendek agar nama tabel/enum Postgres di versi draf tetap < 63 karakter.
 */
export const linkGroup = ({ name = "link", label = "Tujuan", optional = false }: Options = {}): GroupField => ({
  name,
  type: "group",
  label,
  fields: [
    {
      name: "type",
      type: "radio",
      label: "Jenis tujuan",
      required: true,
      defaultValue: optional ? "none" : "route",
      admin: { layout: "horizontal" },
      options: [
        ...(optional ? [{ label: "Tanpa tautan", value: "none" }] : []),
        { label: "Halaman situs", value: "route" },
        { label: "Halaman statis", value: "page" },
        { label: "Alamat lain", value: "custom" },
      ],
    },
    {
      name: "route",
      type: "select",
      label: "Halaman situs",
      options: ROUTE_OPTIONS,
      admin: { condition: when("route") },
      validate: (value: unknown, { siblingData }: { siblingData: { type?: string } }) =>
        siblingData?.type !== "route" || value ? true : "Pilih halaman.",
    },
    {
      name: "page",
      type: "relationship",
      relationTo: "pages",
      label: "Halaman statis",
      admin: {
        condition: when("page"),
        description: "Halaman yang belum terbit tidak tampil di situs sampai diterbitkan.",
      },
      validate: (value: unknown, { siblingData }: { siblingData: { type?: string } }) =>
        siblingData?.type !== "page" || value ? true : "Pilih halaman statis.",
    },
    {
      name: "url",
      type: "text",
      label: "Alamat",
      admin: {
        condition: when("custom"),
        placeholder: "/kategori/politik atau https://…",
        description: "Alamat di situs ini diawali /. Alamat luar harus diawali https://.",
      },
      validate: (value: unknown, { siblingData }: { siblingData: { type?: string } }) =>
        siblingData?.type !== "custom" ? true : validateLinkUrl(value),
    },
    {
      name: "newTab",
      type: "checkbox",
      label: "Buka di tab baru",
      admin: { condition: when("custom") },
    },
  ] satisfies Field[],
});
