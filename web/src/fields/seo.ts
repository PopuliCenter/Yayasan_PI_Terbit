import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from "@payloadcms/plugin-seo/fields";
import type { Field, GroupField } from "payload";

/**
 * Ambang indikator panjang (LengthIndicator) di panel admin. Bukan batas keras:
 * `validate` di bawah menggantikan validasi bawaan Payload, jadi min/max ini hanya
 * mewarnai indikator. Batas keras ada di `cap()`.
 */
export const SEO_TITLE = { minLength: 40, maxLength: 60 } as const;
export const SEO_DESCRIPTION = { minLength: 110, maxLength: 160 } as const;

/** Batas keras: kosong boleh, nama lama dilarang, panjang maksimal `max`. */
export const cap =
  (max: number) =>
  (value: unknown): true | string => {
    if (value === null || value === undefined || value === "") return true;
    if (typeof value !== "string") return "Teks tidak valid.";
    if (/populi\s*center/i.test(value)) return "Gunakan nama penerbit resmi: Yayasan Populi Indonesia.";
    const n = value.length;
    return n <= max ? true : `Maksimal ${max} karakter (sekarang ${n}).`;
  };

/**
 * Ganti label dan deskripsi tanpa membuang isi `admin` lain (terutama `components`).
 * Generik agar tipe gabungan field (mis. UploadField tunggal/polimorfik) tetap utuh.
 */
const relabel = <F extends { admin?: object }>(field: F, label: string, description: string) => ({
  ...field,
  label,
  admin: { ...field.admin, description },
});

/**
 * Field ui plugin (pemeriksaan & pratinjau): label Indonesia dan tidak muncul di pemilih kolom
 * daftar (kolomnya selalu kosong). Jangan pakai parameter `overrides` pabrik: spread dangkal
 * di sana akan mengganti seluruh `admin`, termasuk `admin.components`.
 */
const uiOnly = <F extends { admin?: object }>(field: F, label: string) => ({
  ...field,
  label,
  admin: { ...field.admin, disableListColumn: true },
});

/**
 * Kolom SEO berbahasa Indonesia dari pabrik field plugin-seo. Hasil pabrik selalu
 * di-spread (bukan ditimpa) agar `admin.components` milik plugin tetap ada; plugin
 * mengenali komponen itu untuk mengaktifkan endpoint isi otomatis.
 */
export const seoFields = (): Field[] => {
  const title = MetaTitleField({ hasGenerateFn: true });
  const description = MetaDescriptionField({ hasGenerateFn: true });
  const image = MetaImageField({ hasGenerateFn: true, relationTo: "media" });

  return [
    uiOnly(OverviewField({ titleOverrides: SEO_TITLE, descriptionOverrides: SEO_DESCRIPTION }), "Pemeriksaan SEO"),
    { ...title, label: "Judul di hasil pencarian", ...SEO_TITLE, validate: cap(90) },
    { ...description, label: "Deskripsi di hasil pencarian", ...SEO_DESCRIPTION, validate: cap(320) },
    relabel(
      image,
      "Gambar bagikan",
      "Gambar untuk pratinjau tautan (WhatsApp, media sosial). Ideal 1200×630; situs otomatis membuat versi 1200×630.",
    ),
    uiOnly(PreviewField({ hasGenerateFn: true }), "Pratinjau hasil pencarian"),
  ];
};

/**
 * Grup `meta` yang dipasang langsung di koleksi (Buku, Halaman, Kabar).
 * meta.title/meta.description memakai kolom DB meta_title/meta_description, sama dengan
 * kolom metaTitle/metaDescription lama di Buku, jadi tidak perlu migrasi data.
 */
export const seoMetaGroup = (access?: GroupField["access"]): GroupField => ({
  name: "meta",
  type: "group",
  interfaceName: "SeoMeta",
  label: "Tampilan di mesin pencari & media sosial",
  access,
  admin: {
    description:
      "Semua kolom boleh kosong. Bila kosong, situs memakai judul, ringkasan atau sinopsis, dan sampul secara otomatis. Judul yang tidak memuat nama situs akan diberi akhiran nama situs.",
  },
  fields: seoFields(),
});
