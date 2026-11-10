import type { CollectionConfig } from "payload";
import { fieldIsAdmin, fieldIsKatalog, isKatalog, isOrder, publishedOrAdmin } from "../access";
import { slugField } from "../fields/slug";

/**
 * Validasi ISBN-13 lengkap, termasuk angka pemeriksa. Salah ketik satu angka atau
 * dua angka tertukar hampir selalu tertangkap di sini, sebelum tayang di situs
 * dan di data terstruktur yang dibaca mesin pencari.
 */
export const validateIsbn13 = (value: unknown): true | string => {
  if (!value) return true;
  if (typeof value !== "string" || !/^[\d-]+$/.test(value)) {
    return "ISBN-13 hanya boleh berisi angka dan tanda hubung.";
  }
  const digits = value.replace(/-/g, "");
  if (digits.length !== 13) return `ISBN-13 harus 13 angka (sekarang ${digits.length}).`;
  if (!/^97[89]/.test(digits)) return "ISBN-13 diawali 978 atau 979.";
  const sum = digits
    .slice(0, 12)
    .split("")
    .reduce((acc, d, i) => acc + Number(d) * (i % 2 === 0 ? 1 : 3), 0);
  const check = (10 - (sum % 10)) % 10;
  if (check !== Number(digits[12])) {
    return "Angka pemeriksa ISBN tidak cocok. Periksa kembali, mungkin ada angka yang salah atau tertukar.";
  }
  return true;
};

export const Books: CollectionConfig = {
  slug: "books",
  labels: { singular: "Buku", plural: "Buku" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "availability", "price", "publishedAt", "_status"],
    group: "Katalog",
    description:
      "Satu entri per judul. Berat dan dimensi dipakai admin untuk menghitung ongkir manual, dan akan dipakai otomatis bila toko penuh dibuka.",
    listSearchableFields: ["title", "subtitle", "isbn13"],
  },
  versions: { drafts: true },
  access: {
    read: publishedOrAdmin,
    create: isKatalog,
    // Admin order boleh mengubah ketersediaan (F-ADM-02); field editorial
    // tetap dikunci lewat access per field di bawah.
    update: ({ req }) => isKatalog({ req }) || isOrder({ req }),
    delete: isKatalog,
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Identitas",
          fields: [
            {
              name: "title",
              type: "text",
              label: "Judul",
              required: true,
              index: true,
              access: { update: fieldIsKatalog },
            },
            {
              name: "subtitle",
              type: "text",
              label: "Subjudul",
              access: { update: fieldIsKatalog },
            },
            {
              name: "authors",
              type: "relationship",
              relationTo: "authors",
              hasMany: true,
              label: "Penulis",
              required: true,
              access: { update: fieldIsKatalog },
            },
            {
              type: "row",
              fields: [
                {
                  name: "isbn13",
                  type: "text",
                  label: "ISBN-13",
                  unique: true,
                  index: true,
                  access: { update: fieldIsKatalog },
                  validate: validateIsbn13,
                  admin: {
                    description: "Boleh dengan atau tanpa tanda hubung. Pencarian menemukan keduanya.",
                  },
                },
                {
                  name: "publishedYear",
                  type: "number",
                  label: "Tahun terbit",
                  min: 1900,
                  max: 2200,
                  access: { update: fieldIsKatalog },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "pageCount",
                  type: "number",
                  label: "Jumlah halaman",
                  min: 1,
                  access: { update: fieldIsKatalog },
                },
                {
                  name: "language",
                  type: "select",
                  label: "Bahasa",
                  defaultValue: "id",
                  access: { update: fieldIsKatalog },
                  options: [
                    { label: "Indonesia", value: "id" },
                    { label: "Inggris", value: "en" },
                    { label: "Lainnya", value: "other" },
                  ],
                },
                {
                  name: "edition",
                  type: "text",
                  label: "Cetakan / edisi",
                  access: { update: fieldIsKatalog },
                },
              ],
            },
            {
              type: "collapsible",
              label: "Ukuran & berat (untuk hitung ongkir)",
              admin: {
                description:
                  "Isi dari hasil timbang dan ukur, bukan perkiraan. Selisih berat membuat ongkir salah.",
              },
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "widthCm",
                      type: "number",
                      label: "Lebar (cm)",
                      access: { update: fieldIsKatalog },
                    },
                    {
                      name: "heightCm",
                      type: "number",
                      label: "Tinggi (cm)",
                      access: { update: fieldIsKatalog },
                    },
                    {
                      name: "thicknessCm",
                      type: "number",
                      label: "Ketebalan (cm)",
                      access: { update: fieldIsKatalog },
                    },
                    {
                      name: "weightGram",
                      type: "number",
                      label: "Berat (gram)",
                      min: 1,
                      access: { update: fieldIsKatalog },
                    },
                  ],
                },
              ],
            },
            {
              name: "categories",
              type: "relationship",
              relationTo: "categories",
              hasMany: true,
              label: "Kategori",
              access: { update: fieldIsKatalog },
              admin: { description: "Satu buku boleh masuk beberapa kategori." },
            },
            {
              type: "row",
              fields: [
                {
                  name: "series",
                  type: "relationship",
                  relationTo: "series",
                  label: "Seri",
                  access: { update: fieldIsKatalog },
                },
                {
                  name: "seriesOrder",
                  type: "number",
                  label: "Jilid ke-",
                  access: {
                    update: fieldIsKatalog,
                  },
                  admin: {
                    condition: (data) => Boolean(data?.series),
                    description: "Menentukan urutan pada halaman seri.",
                  },
                },
              ],
            },
          ],
        },
        {
          label: "Harga & ketersediaan",
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "price",
                  type: "number",
                  label: "Harga jual (Rp)",
                  required: true,
                  min: 0,
                  access: { update: fieldIsKatalog },
                  admin: {
                    description: "Harga penerbit. Harga di marketplace bisa berbeda.",
                  },
                },
                {
                  name: "listPrice",
                  type: "number",
                  label: "Harga normal (Rp)",
                  min: 0,
                  access: { update: fieldIsKatalog },
                  admin: {
                    description:
                      "Isi HANYA bila harga ini benar pernah berlaku. Harga coret yang tidak pernah berlaku menyesatkan dan dilarang UU 8/1999.",
                  },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "discountStart",
                  type: "date",
                  label: "Diskon mulai",
                  access: { update: fieldIsKatalog },
                  admin: { condition: (data) => Boolean(data?.listPrice) },
                },
                {
                  name: "discountEnd",
                  type: "date",
                  label: "Diskon selesai",
                  access: { update: fieldIsKatalog },
                  admin: {
                    condition: (data) => Boolean(data?.listPrice),
                    description: "Setelah tanggal ini, harga coret berhenti tampil otomatis.",
                  },
                },
              ],
            },
            {
              name: "availability",
              type: "select",
              label: "Ketersediaan",
              required: true,
              defaultValue: "tersedia",
              index: true,
              // Tidak dikunci: admin order perlu mengubah ini dengan cepat (F-ADM-02).
              options: [
                { label: "Tersedia", value: "tersedia" },
                { label: "Stok terbatas", value: "terbatas" },
                { label: "Habis", value: "habis" },
                { label: "Segera terbit", value: "segera" },
              ],
              admin: {
                description:
                  "Tanpa angka stok, sesuai keputusan no. 8. Admin order boleh mengubah ini.",
              },
            },
          ],
        },
        {
          label: "Konten",
          fields: [
            {
              name: "cover",
              type: "upload",
              relationTo: "media",
              label: "Sampul",
              required: true,
              access: { update: fieldIsKatalog },
            },
            {
              name: "synopsis",
              type: "richText",
              label: "Sinopsis",
              access: { update: fieldIsKatalog },
            },
            {
              name: "tableOfContents",
              type: "richText",
              label: "Daftar isi",
              access: { update: fieldIsKatalog },
            },
            {
              name: "previewPages",
              type: "array",
              label: "Pratinjau halaman",
              maxRows: 12,
              access: { update: fieldIsKatalog },
              admin: {
                description:
                  "Gambar halaman, bukan berkas utuh (keputusan no. 7). Jumlah halaman yang boleh dipratinjau ditentukan Yayasan.",
              },
              fields: [
                {
                  name: "image",
                  type: "upload",
                  relationTo: "media",
                  required: true,
                  label: "Gambar halaman",
                },
              ],
            },
          ],
        },
        {
          label: "Order",
          fields: [
            {
              name: "waOrderEnabled",
              type: "checkbox",
              label: "Tampilkan tombol pesan via WhatsApp",
              defaultValue: true,
            },
            {
              name: "marketplaceLinks",
              type: "array",
              label: "Tautan marketplace",
              labels: { singular: "Tautan", plural: "Tautan" },
              admin: {
                description:
                  "Hanya tautan yang diisi akan tampil. Jangan tautkan toko yang belum memuat judul ini.",
              },
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "platform",
                      type: "select",
                      label: "Marketplace",
                      required: true,
                      options: [
                        { label: "Tokopedia", value: "tokopedia" },
                        { label: "Shopee", value: "shopee" },
                        { label: "TikTok Shop", value: "tiktok" },
                        { label: "Blibli", value: "blibli" },
                        { label: "Lazada", value: "lazada" },
                        { label: "Lainnya", value: "lainnya" },
                      ],
                    },
                    {
                      name: "url",
                      type: "text",
                      label: "URL produk",
                      required: true,
                      validate: (value: unknown) => {
                        if (typeof value !== "string") return "URL wajib diisi.";
                        try {
                          const parsed = new URL(value);
                          if (!["http:", "https:"].includes(parsed.protocol)) {
                            return "URL harus memakai http atau https.";
                          }
                          return true;
                        } catch {
                          return "Format URL tidak valid. Contoh: https://tokopedia.com/...";
                        }
                      },
                    },
                  ],
                },
                {
                  name: "label",
                  type: "text",
                  label: "Label tombol (opsional)",
                  admin: { description: "Kosongkan untuk memakai nama marketplace." },
                },
              ],
            },
          ],
        },
        {
          label: "SEO",
          fields: [
            {
              name: "metaTitle",
              type: "text",
              label: "Judul untuk mesin pencari",
              access: { update: fieldIsKatalog },
              admin: { description: "Kosongkan untuk memakai judul buku. Ideal di bawah 60 karakter." },
            },
            {
              name: "metaDescription",
              type: "textarea",
              label: "Deskripsi untuk mesin pencari",
              maxLength: 320,
              access: { update: fieldIsKatalog },
              admin: {
                description:
                  "Satu sampai dua kalimat, 120–160 karakter. Kosongkan untuk memakai awal sinopsis.",
              },
            },
          ],
        },
      ],
    },
    slugField(),
    {
      name: "publishedAt",
      type: "date",
      label: "Tanggal tayang",
      index: true,
      access: { update: fieldIsKatalog },
      admin: {
        position: "sidebar",
        description: "Dipakai untuk urutan Terbaru.",
      },
      hooks: {
        beforeChange: [
          ({ value, data }) => {
            if (!value && data?._status === "published") return new Date().toISOString();
            return value;
          },
        ],
      },
    },
    {
      name: "featured",
      type: "checkbox",
      label: "Tampilkan di halaman depan",
      defaultValue: false,
      access: { update: fieldIsKatalog },
      admin: { position: "sidebar" },
    },
    {
      name: "internalNotes",
      type: "textarea",
      label: "Catatan internal",
      access: { read: fieldIsAdmin },
      admin: {
        position: "sidebar",
        description: "Tidak pernah tampil di situs publik.",
      },
    },
  ],
};
