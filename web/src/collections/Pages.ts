import { BlocksFeature, lexicalEditor } from "@payloadcms/richtext-lexical";
import type { CollectionBeforeChangeHook, CollectionConfig, Field, FieldHook, TextField } from "payload";
import { isKatalog, publishedOrAdmin } from "../access";
import { FormulirBlock } from "../blocks/Formulir";
import { seoMetaGroup } from "../fields/seo";
import { slugField, slugify } from "../fields/slug";
import { previewPath } from "../lib/preview-url";

/**
 * Slug mengikuti judul selama dokumen BELUM TAYANG (koleksi berautosave).
 *
 * Autosave menyimpan draf saat judul baru setengah diketik ("Kebijakan"). formatSlug lalu
 * mengisi slug dari judul parsial itu, dan form admin mengadopsinya karena field slug belum
 * disentuh, sehingga slug parsial terbawa sampai terbit. Maka selama belum tayang, slug yang
 * masih sama dengan slug otomatis dari judul SEBELUMNYA dibuat ulang dari judul terbaru.
 * Slug yang diketik sendiri (beda dari slug otomatis) dan slug dokumen tayang tidak diubah;
 * perubahan slug saat tayang tetap lewat pengalihan otomatis (hooks/slugRedirect).
 */
const followTitleUntilLive: FieldHook = async ({ collection, data, operation, originalDoc, req, value }) => {
  if (operation !== "update" || !collection || originalDoc?.id == null) return value;
  const title: unknown = data?.title;
  const previousTitle: unknown = originalDoc.title;
  if (typeof value !== "string" || typeof title !== "string" || typeof previousTitle !== "string") return value;

  const previousAuto = slugify(previousTitle);
  const nextAuto = slugify(title);
  if (!previousAuto || !nextAuto || nextAuto === previousAuto || slugify(value) !== previousAuto) {
    return value;
  }

  // Simpan draf tidak menyentuh baris utama: baris utama (draft:false) berstatus
  // "published" tepat bila alamat ini sedang dilihat pengunjung.
  const live = await req.payload.findByID({
    collection: collection.slug,
    id: originalDoc.id,
    draft: false,
    depth: 0,
    overrideAccess: true,
    disableErrors: true,
    req,
    select: { _status: true },
  });
  return live && "_status" in live && live._status === "published" ? value : nextAuto;
};

/**
 * Halaman kebijakan (punya versi dokumen) yang ditayangkan tanpa tanggal "Berlaku sejak"
 * mendapat tanggal hari itu, agar tanggal berlaku tidak mendahului tanggal tayang.
 * Tanggal yang diisi admin tidak diubah.
 */
export const isiTanggalBerlaku: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  if (data?._status !== "published") return data;
  // Data parsial (Local API) tidak membawa semua kolom: ambil dari versi terakhir.
  const versi = data.policyVersion ?? originalDoc?.policyVersion;
  const tanggal = "policyEffectiveDate" in data ? data.policyEffectiveDate : originalDoc?.policyEffectiveDate;
  if (versi && !tanggal) return { ...data, policyEffectiveDate: new Date().toISOString() };
  return data;
};

/** slugField() untuk koleksi berautosave (Pages, Posts): slug ikut judul sampai tayang pertama. */
export const autosaveSlugField = (): Field => {
  const field = slugField() as TextField;
  return {
    ...field,
    hooks: {
      ...field.hooks,
      beforeValidate: [followTitleUntilLive, ...(field.hooks?.beforeValidate ?? [])],
    },
  };
};

export const Pages: CollectionConfig = {
  slug: "pages",
  labels: { singular: "Halaman", plural: "Halaman" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "_status", "showInFooter", "updatedAt"],
    listSearchableFields: ["title", "slug", "summary"],
    group: "Konten",
    description:
      "Halaman statis: Tentang Kami, Cara Pesan, Pengiriman, Pengembalian & Penukaran, Kebijakan Privasi, Syarat & Ketentuan, Kirim Naskah.",
    preview: ({ id, slug }) =>
      previewPath({
        collection: "pages",
        id: typeof id === "number" || typeof id === "string" ? id : null,
        slug: typeof slug === "string" ? slug : null,
      }),
    components: {
      edit: {
        beforeDocumentControls: [
          { path: "@/components/admin/LihatDiSitus#LihatDiSitus", serverProps: { collection: "pages" } },
        ],
      },
    },
  },
  defaultSort: "footerOrder",
  versions: { drafts: { autosave: { interval: 1500 } }, maxPerDoc: 50 },
  hooks: { beforeChange: [isiTanggalBerlaku] },
  access: {
    read: publishedOrAdmin,
    create: isKatalog,
    update: isKatalog,
    delete: isKatalog,
  },
  fields: [
    { name: "title", type: "text", label: "Judul halaman", required: true },
    {
      // Tab TANPA nama: hanya tata letak, kolom DB tetap sama. Field sidebar sengaja
      // di tingkat atas (di luar tab) karena Payload hanya mengangkat field sidebar teratas.
      type: "tabs",
      tabs: [
        {
          label: "Isi",
          fields: [
            {
              name: "summary",
              type: "textarea",
              label: "Ringkasan",
              maxLength: 320,
              admin: {
                description:
                  "Ringkasan halaman. Juga dipakai sebagai deskripsi mesin pencari bila tab SEO kosong.",
              },
            },
            {
              name: "content",
              type: "richText",
              label: "Isi halaman",
              required: true,
              editor: lexicalEditor({
                features: ({ defaultFeatures }) => [
                  ...defaultFeatures,
                  BlocksFeature({ blocks: [FormulirBlock] }),
                ],
              }),
              admin: {
                description: "Formulir khusus bisa disisipkan lewat menu + (blok Formulir).",
              },
            },
            {
              type: "collapsible",
              label: "Penandaan versi (untuk halaman hukum)",
              admin: {
                description:
                  "Halaman hukum wajib bertanggal versi (F-KON-02). Isi hanya untuk Privasi, Ketentuan, dan Cara Pesan.",
              },
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "policyVersion",
                      type: "text",
                      label: "Versi dokumen",
                      admin: { description: "Contoh: 1.0" },
                    },
                    {
                      name: "policyEffectiveDate",
                      type: "date",
                      label: "Berlaku sejak",
                      admin: { date: { displayFormat: "d MMMM yyyy" } },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: "SEO",
          fields: [seoMetaGroup()],
        },
      ],
    },
    autosaveSlugField(),
    {
      name: "showInFooter",
      type: "checkbox",
      label: "Tampilkan di footer",
      defaultValue: true,
      admin: { position: "sidebar" },
    },
    {
      name: "footerOrder",
      type: "number",
      label: "Urutan di footer",
      defaultValue: 100,
      admin: { position: "sidebar" },
    },
  ],
};
