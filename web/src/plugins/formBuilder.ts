import { formBuilderPlugin } from "@payloadcms/plugin-form-builder";
import type { ArrayField, DateField, Field, GroupField, RelationshipField, TextField } from "payload";
import { anyone, isKatalog, isOrder, isSuperAdmin } from "../access";
import {
  normalizeFormDefinition,
  preventDeleteWithSubmissions,
  purgeOnAdminRead,
  spamShortRetention,
} from "../collections/forms/hooks";
import { MAX_FIELDS, RETENTION_DEFAULT_DAYS, RETENTION_MAX_DAYS, RETENTION_MIN_DAYS } from "../lib/form-builder";

/**
 * Formulir khusus (plugin form-builder), dikunci untuk situs ini.
 *
 * Bawaan plugin yang diubah:
 * - `form-submissions` bisa DIBUAT SIAPA PUN lewat REST; di sini create ditutup.
 *   Kiriman publik hanya lewat aksi server (app/(site)/form-actions.ts) yang menjalankan
 *   anti-bot dan memvalidasi isian terhadap definisi formulir tersimpan.
 * - Field `emails` dihapus seluruhnya: isian pengunjung bisa disisipkan ke penerima
 *   dan subjek ({{kolom}}), jadi bisa disalahgunakan untuk relai spam. Situs ini juga
 *   belum punya SMTP; tidak ada email yang dikirim.
 * - Blok negara/provinsi (country/state), pembayaran, dan unggah berkas dimatikan.
 */

type LockableField = ArrayField | DateField | GroupField | RelationshipField | TextField;

/** Tidak bisa diubah setelah tersimpan: bukti kiriman, persetujuan, dan masa simpan. */
const locked = <T extends LockableField>(field: T): T => ({
  ...field,
  access: { ...field.access, update: () => false },
  admin: { ...field.admin, readOnly: true },
});

const formPrivacyFields: Field[] = [
  {
    name: "acceptingResponses",
    type: "checkbox",
    label: "Menerima kiriman",
    defaultValue: true,
    admin: {
      position: "sidebar",
      description: "Matikan untuk menutup formulir tanpa menghapusnya. Pengunjung melihat pesan penutup.",
    },
  },
  {
    name: "closesAt",
    type: "date",
    label: "Tutup otomatis pada",
    admin: {
      position: "sidebar",
      date: { pickerAppearance: "dayAndTime" },
      description: "Opsional. Mis. batas pendaftaran acara (WIB).",
    },
  },
  {
    name: "closedMessage",
    type: "textarea",
    label: "Pesan saat formulir ditutup",
    defaultValue: "Formulir ini sudah ditutup. Terima kasih atas minat Anda.",
    maxLength: 300,
  },
  {
    type: "collapsible",
    label: "Privasi & penyimpanan data",
    admin: {
      description:
        "Wajib diisi sesuai UU 27/2022 tentang Pelindungan Data Pribadi. Jangan meminta data sensitif seperti NIK, nomor rekening, data kesehatan, atau agama.",
    },
    fields: [
      {
        name: "purpose",
        type: "textarea",
        label: "Tujuan pengumpulan data",
        required: true,
        maxLength: 400,
        admin: {
          description:
            "Tampil di atas tombol kirim. Contoh: Data dipakai untuk mendaftarkan Anda ke peluncuran buku dan tidak dibagikan ke pihak lain.",
        },
      },
      {
        name: "requireConsent",
        type: "checkbox",
        label: "Wajib centang persetujuan",
        defaultValue: true,
      },
      {
        name: "consentLabel",
        type: "textarea",
        label: "Teks persetujuan",
        defaultValue: "Saya menyetujui pemrosesan data saya untuk tujuan di atas sesuai Kebijakan Privasi.",
        admin: {
          condition: (_, siblingData) => Boolean(siblingData?.requireConsent),
          description: "Kotak persetujuan tampil tidak tercentang; pengunjung harus mencentangnya sendiri.",
        },
        validate: (value: unknown, { siblingData }: { siblingData: Partial<Record<string, unknown>> }) => {
          if (!siblingData?.requireConsent) return true;
          if (typeof value !== "string" || value.trim().length < 10) return "Tulis teks persetujuan minimal 10 karakter.";
          if (value.length > 600) return "Teks persetujuan maksimal 600 karakter.";
          return true;
        },
      },
      {
        name: "consentVersion",
        type: "text",
        label: "Versi teks persetujuan",
        defaultValue: "1.0",
        maxLength: 20,
        admin: { description: "Naikkan versinya setiap kali teks persetujuan atau tujuan diubah, mis. 1.1." },
      },
      {
        name: "retentionDays",
        type: "number",
        label: "Simpan kiriman selama (hari)",
        required: true,
        defaultValue: RETENTION_DEFAULT_DAYS,
        min: RETENTION_MIN_DAYS,
        max: RETENTION_MAX_DAYS,
        admin: {
          description:
            "Kiriman dihapus otomatis setelah masa ini (30–1095 hari). Kiriman yang ditandai spam dihapus setelah 30 hari.",
        },
      },
    ],
  },
];

const STATUS_OPTIONS = [
  { label: "Baru", value: "baru" },
  { label: "Sedang ditangani", value: "diproses" },
  { label: "Selesai", value: "selesai" },
  { label: "Spam", value: "spam" },
];

export const formBuilder = formBuilderPlugin({
  fields: {
    text: true,
    textarea: true,
    email: true,
    number: true,
    select: true,
    radio: true,
    checkbox: true,
    date: true,
    message: true,
    country: false,
    state: false,
    payment: false,
    upload: false,
  },
  redirectRelationships: ["pages"],

  formOverrides: {
    labels: { singular: "Formulir", plural: "Formulir" },
    admin: {
      group: "Konten",
      useAsTitle: "title",
      defaultColumns: ["title", "acceptingResponses", "updatedAt"],
      description:
        "Formulir khusus (mis. pendaftaran acara, survei pembaca). Pertanyaan, pengaduan, dan penawaran institusi tetap lewat formulir Kontak dan Institusi.",
    },
    access: { read: anyone, create: isKatalog, update: isKatalog, delete: isKatalog },
    hooks: {
      beforeValidate: [normalizeFormDefinition],
      beforeDelete: [preventDeleteWithSubmissions],
    },
    fields: ({ defaultFields }) => [
      ...defaultFields
        .filter((f) => !("name" in f && f.name === "emails"))
        .map((f): Field =>
          f.type === "blocks" && f.name === "fields"
            ? {
                ...f,
                minRows: 1,
                maxRows: MAX_FIELDS,
                admin: {
                  ...f.admin,
                  description: `Maksimal ${MAX_FIELDS} kolom. Nama kolom dibuat otomatis dari label bila dikosongkan.`,
                },
              }
            : f,
        ),
      ...formPrivacyFields,
    ],
  },

  formSubmissionOverrides: {
    labels: { singular: "Kiriman Formulir", plural: "Kiriman Formulir" },
    admin: {
      group: "Pesanan",
      useAsTitle: "title",
      defaultColumns: ["title", "form", "status", "createdAt"],
      listSearchableFields: ["title"],
      description:
        "Isian pengunjung dari formulir khusus. Tidak ada email otomatis; periksa daftar ini secara berkala. Kiriman dihapus otomatis setelah masa simpan.",
    },
    access: { create: () => false, read: isOrder, update: isOrder, delete: isSuperAdmin },
    hooks: {
      beforeChange: [spamShortRetention],
      beforeOperation: [purgeOnAdminRead],
    },
    fields: ({ defaultFields }) => [
      locked({ name: "title", type: "text", label: "Ringkasan" }),
      ...defaultFields.map((f): Field => {
        if (f.type === "relationship" && f.name === "form") return locked({ ...f, label: "Formulir" });
        if (f.type === "array" && f.name === "submissionData") {
          const [fieldName, value, ...rest] = f.fields;
          return locked({
            ...f,
            label: "Isian",
            labels: { singular: "Isian", plural: "Isian" },
            fields: [
              fieldName.type === "text" ? { ...fieldName, label: "Nama kolom" } : fieldName,
              { name: "label", type: "text", label: "Label saat dikirim" },
              value.type === "textarea" ? { ...value, label: "Jawaban" } : value,
              ...rest,
            ],
          });
        }
        return f;
      }),
      {
        name: "status",
        type: "select",
        label: "Status penanganan",
        required: true,
        defaultValue: "baru",
        index: true,
        options: STATUS_OPTIONS,
        admin: { description: "Menandai Spam memperpendek masa simpan menjadi 30 hari." },
      },
      {
        name: "handledBy",
        type: "relationship",
        relationTo: "users",
        label: "Ditangani oleh",
        admin: { position: "sidebar" },
      },
      { name: "internalNotes", type: "textarea", label: "Catatan internal" },
      locked({
        name: "consent",
        type: "group",
        label: "Bukti persetujuan",
        admin: { description: "Disalin dari formulir saat dikirim, bukan dari isian pengunjung." },
        fields: [
          { name: "given", type: "checkbox", label: "Persetujuan dicentang" },
          { name: "at", type: "date", label: "Waktu", admin: { date: { pickerAppearance: "dayAndTime" } } },
          { name: "version", type: "text", label: "Versi teks" },
          { name: "text", type: "textarea", label: "Teks yang disetujui" },
          { name: "purpose", type: "textarea", label: "Tujuan yang ditampilkan" },
        ],
      }),
      locked({ name: "sourcePath", type: "text", label: "Halaman asal" }),
      // Dikunci di level field (REST/admin tidak bisa memperpanjang atau mengosongkannya).
      // Hanya aksi server (create, overrideAccess) dan hook spamShortRetention yang mengisinya.
      locked({
        name: "expiresAt",
        type: "date",
        label: "Dihapus otomatis setelah",
        index: true,
        admin: { position: "sidebar", date: { pickerAppearance: "dayAndTime" } },
      }),
    ],
  },
});
