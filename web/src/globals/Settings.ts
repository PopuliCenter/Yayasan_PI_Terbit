import type { GlobalConfig } from "payload";
import { isAdmin, isSuperAdmin } from "../access";
import { auditGlobalAfterChange } from "../hooks/audit";

/**
 * Identitas penyelenggara, kontak layanan, dan teks wajib (bagian 10 PRD).
 *
 * `read` sengaja ditutup untuk publik karena berisi rekening penerima transfer.
 * Halaman publik membacanya lewat Local API dengan overrideAccess, lalu hanya
 * menampilkan field yang memang untuk publik.
 */
export const Settings: GlobalConfig = {
  slug: "settings",
  label: "Pengaturan Situs",
  admin: { group: "Pengaturan", hideAPIURL: true },
  access: {
    read: isAdmin,
    update: isSuperAdmin,
  },
  hooks: { afterChange: [auditGlobalAfterChange] },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Identitas",
          fields: [
            {
              name: "siteName",
              type: "text",
              label: "Nama situs",
              required: true,
              defaultValue: "Yayasan Populi Indonesia",
              admin: {
                description:
                  "Tampil di judul tab, header, dan footer. Untuk verifikasi ISBN, samakan persis dengan nama badan hukum di SK (tanpa awalan \"Penerbit\").",
              },
            },
            {
              name: "tagline",
              type: "text",
              label: "Tagline singkat",
            },
            {
              name: "legalEntityName",
              type: "text",
              label: "Nama badan hukum penerbit",
              admin: {
                description:
                  "Persis seperti di SK pengesahan badan hukum dan akun ISBN Perpusnas. Tampil sebagai \"Penerbit\" di setiap halaman buku dan di halaman Tentang Kami.",
              },
            },
            {
              name: "legalBasis",
              type: "text",
              label: "Pengesahan badan hukum",
              admin: {
                description:
                  "Mis. Keputusan Menteri Hukum dan HAM RI Nomor AHU-….AH.01.04.Tahun …. Tampil di halaman Tentang Kami dan footer.",
              },
            },
            {
              name: "publisherResponsible",
              type: "text",
              label: "Penanggung jawab penerbitan",
              admin: { description: "Nama dan jabatan, sama dengan surat pernyataan ISBN. Tampil di halaman Tentang Kami." },
            },
            {
              name: "sellerEntityName",
              type: "text",
              label: "Nama badan penjual",
              admin: {
                description:
                  "Isi bila penjual berbeda dari penyelenggara situs. Tampil di halaman Tentang dan footer (keputusan no. 13).",
              },
            },
            {
              name: "address",
              type: "textarea",
              label: "Alamat",
            },
            {
              type: "row",
              fields: [
                { name: "nib", type: "text", label: "NIB" },
                { name: "npwp", type: "text", label: "NPWP" },
              ],
            },
            {
              name: "registeredInfo",
              type: "textarea",
              label: "Keterangan terdaftar",
              admin: {
                description:
                  "Teks status terdaftar (PSE/Kemendag) yang wajib tampil. Kosongkan sampai tanda daftar terbit.",
              },
            },
          ],
        },
        {
          label: "Kontak & layanan",
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "waNumber",
                  type: "text",
                  label: "Nomor WhatsApp resmi",
                  admin: {
                    description:
                      "Format internasional tanpa tanda plus, contoh 6281234567890 (keputusan no. 3).",
                  },
                  validate: (value: unknown) => {
                    if (!value) return true;
                    if (typeof value !== "string") return "Nomor tidak valid.";
                    if (!/^\d{9,15}$/.test(value)) {
                      return "Tulis hanya angka, diawali kode negara. Contoh: 6281234567890.";
                    }
                    return true;
                  },
                },
                {
                  name: "email",
                  type: "email",
                  label: "Email layanan pelanggan",
                },
                {
                  name: "phone",
                  type: "text",
                  label: "Telepon",
                },
              ],
            },
            {
              name: "editorialEmail",
              type: "email",
              label: "Email redaksi (naskah)",
              admin: {
                description:
                  "Opsional. Tampil di halaman Kontak dan Kirim Naskah sebagai alamat pengiriman naskah. Kosong: dipakai email layanan pelanggan. Isi hanya setelah alamatnya aktif menerima email (mis. sudah dibuat di Cloudflare Email Routing).",
              },
            },
            {
              type: "row",
              fields: [
                {
                  name: "serviceHours",
                  type: "text",
                  label: "Jam layanan",
                  admin: { description: "Contoh: Senin–Jumat, 09.00–17.00 WIB." },
                },
                {
                  name: "waResponseTarget",
                  type: "text",
                  label: "Tenggat balas WhatsApp",
                  defaultValue: "maksimal 4 jam pada jam layanan",
                },
                {
                  name: "complaintResponseTarget",
                  type: "text",
                  label: "Tenggat tanggapan pengaduan",
                  defaultValue: "maksimal 2 hari kerja",
                },
              ],
            },
            {
              name: "waMessageTemplate",
              type: "textarea",
              label: "Templat pesan WhatsApp",
              required: true,
              defaultValue:
                "Halo, saya mau pesan buku:\n• {judul} ({penulis}) — {harga}\nISBN {isbn}\nJumlah: 1\n\nMohon info ketersediaan dan ongkir ke kota saya.",
              admin: {
                description:
                  "Penanda yang tersedia: {judul} {penulis} {harga} {isbn} {url}. Pesan ini terisi otomatis di WhatsApp pembeli, dan masih bisa dia ubah sebelum mengirim.",
              },
            },
            {
              name: "orderStepsNote",
              type: "textarea",
              label: "Keterangan alur pesan (tampil di dekat tombol)",
              defaultValue:
                "Admin membalas pada jam layanan, lalu mengirim total dan ongkir. Pembayaran lewat transfer bank.",
              admin: { description: "F-ORD-02. Satu sampai dua kalimat." },
            },
            {
              name: "pktnContact",
              type: "textarea",
              label: "Kontak Ditjen PKTN",
              admin: {
                description:
                  "Wajib tampil di halaman pengaduan. Isi setelah teks resmi dikonfirmasi.",
              },
            },
          ],
        },
        {
          label: "Marketplace & media sosial",
          fields: [
            {
              name: "marketplaceStores",
              type: "array",
              label: "Toko marketplace penerbit",
              admin: {
                description:
                  "Tautan toko, bukan tautan produk. Tampil di footer dan halaman Cara Pesan (keputusan no. 4).",
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
                    { name: "url", type: "text", label: "URL toko", required: true },
                  ],
                },
              ],
            },
            {
              name: "socialLinks",
              type: "array",
              label: "Media sosial",
              fields: [
                {
                  type: "row",
                  fields: [
                    { name: "label", type: "text", label: "Nama", required: true },
                    { name: "url", type: "text", label: "URL", required: true },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: "Pembayaran (internal)",
          fields: [
            {
              name: "bankTransferNote",
              type: "textarea",
              label: "Rekening penerima transfer",
              admin: {
                description:
                  "CATATAN INTERNAL — tidak pernah ditampilkan di situs. Admin menyampaikannya lewat WhatsApp setelah total disepakati. Rekening harus atas nama badan, bukan pribadi.",
              },
            },
          ],
        },
        {
          label: "Persetujuan & SEO",
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "consentVersion",
                  type: "text",
                  label: "Versi teks persetujuan kabar terbitan",
                  required: true,
                  defaultValue: "1.0",
                },
              ],
            },
            {
              name: "consentText",
              type: "textarea",
              label: "Teks persetujuan kabar terbitan",
              required: true,
              defaultValue:
                "Saya setuju menerima email kabar terbitan baru dari Yayasan Populi Indonesia, dan saya boleh berhenti kapan saja lewat tautan di setiap email.",
              admin: {
                description:
                  "Disimpan apa adanya bersama setiap pendaftaran sebagai bukti persetujuan. Ubah versinya bila teks ini diubah.",
              },
            },
            {
              name: "defaultMetaDescription",
              type: "textarea",
              label: "Deskripsi bawaan untuk mesin pencari",
              maxLength: 320,
              admin: { description: "Dipakai di halaman yang tidak punya deskripsi SEO sendiri." },
            },
            {
              name: "ogImage",
              type: "upload",
              relationTo: "media",
              label: "Gambar bagikan bawaan",
              admin: {
                description: "Gambar bagikan bawaan untuk halaman tanpa gambar sendiri. Ideal 1200×630.",
              },
            },
          ],
        },
      ],
    },
  ],
};
