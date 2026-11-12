import type { CollectionConfig } from "payload";
import { isAdmin, isKatalog, isSuperAdmin } from "../access";

/**
 * Langganan kabar terbitan baru (F-FRM-03).
 *
 * UU 27/2022 menuntut persetujuan yang dapat dibuktikan, jadi waktu dan
 * teks persetujuan yang disetujui ikut disimpan — bukan hanya tanda centang.
 */
export const Subscribers: CollectionConfig = {
  slug: "subscribers",
  labels: { singular: "Pelanggan Kabar", plural: "Pelanggan Kabar" },
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "active", "consentAt", "source"],
    group: "Pengaturan",
    description:
      "Daftar email yang menyetujui menerima kabar terbitan. Pencabutan persetujuan dicatat, bukan dihapus diam-diam.",
  },
  defaultSort: "-consentAt",
  access: {
    read: isAdmin,
    create: () => false,
    update: isKatalog,
    delete: isSuperAdmin,
  },
  fields: [
    {
      name: "email",
      type: "email",
      label: "Email",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "name",
      type: "text",
      label: "Nama",
    },
    {
      name: "active",
      type: "checkbox",
      label: "Masih berlangganan",
      defaultValue: true,
      index: true,
    },
    {
      type: "row",
      fields: [
        {
          name: "consentAt",
          type: "date",
          label: "Waktu persetujuan",
          required: true,
          admin: { date: { pickerAppearance: "dayAndTime" }, readOnly: true },
        },
        {
          name: "consentVersion",
          type: "text",
          label: "Versi teks persetujuan",
          required: true,
          admin: { readOnly: true },
        },
      ],
    },
    {
      name: "consentText",
      type: "textarea",
      label: "Teks persetujuan yang disetujui",
      required: true,
      admin: {
        readOnly: true,
        description: "Disimpan apa adanya sebagai bukti persetujuan.",
      },
    },
    {
      name: "source",
      type: "text",
      label: "Halaman asal",
      admin: { readOnly: true },
    },
    {
      name: "unsubscribeToken",
      type: "text",
      label: "Token berhenti berlangganan",
      index: true,
      admin: { readOnly: true, position: "sidebar" },
    },
    {
      name: "unsubscribedAt",
      type: "date",
      label: "Waktu berhenti",
      admin: { date: { pickerAppearance: "dayAndTime" }, position: "sidebar" },
    },
  ],
};
