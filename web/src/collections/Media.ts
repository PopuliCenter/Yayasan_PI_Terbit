import type { CollectionConfig } from "payload";
import { anyone, isAdmin, isKatalog } from "../access";

export const Media: CollectionConfig = {
  slug: "media",
  labels: { singular: "Berkas", plural: "Berkas" },
  admin: { group: "Katalog", useAsTitle: "alt" },
  access: {
    read: anyone,
    create: isAdmin,
    update: isKatalog,
    delete: isKatalog,
  },
  upload: {
    // Di container: MEDIA_DIR=/app/files/media (volume FILES_VOLUME, ikut backup).
    staticDir: process.env.MEDIA_DIR || "media",
    mimeTypes: ["image/*"],
    focalPoint: true,
    // Ukuran responsif untuk sampul buku. Format modern dipilih agar halaman
    // tetap ringan di jaringan 4G (target LCP < 2 dtk).
    formatOptions: {
      format: "webp",
      options: { quality: 82 },
    },
    // formatOptions di atas hanya berlaku untuk berkas asli; tiap ukuran diatur sendiri.
    imageSizes: [
      { name: "thumbnail", width: 200, formatOptions: { format: "webp", options: { quality: 80 } } },
      { name: "card", width: 420, formatOptions: { format: "webp", options: { quality: 80 } } },
      { name: "detail", width: 800, formatOptions: { format: "webp", options: { quality: 82 } } },
      // Gambar bagikan: sampul utuh di tengah latar navy (bukan dipotong), JPEG agar
      // pratinjau tautan di WhatsApp dan media sosial tampil konsisten.
      {
        name: "og",
        width: 1200,
        height: 630,
        fit: "contain",
        background: { r: 15, g: 35, b: 66, alpha: 1 },
        formatOptions: { format: "jpeg", options: { quality: 82 } },
      },
    ],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      label: "Teks alternatif",
      required: true,
      admin: {
        description:
          "Penjelasan singkat isi gambar untuk pembaca layar. Untuk sampul, tulis misalnya: Sampul buku Judul Buku.",
      },
    },
    {
      name: "credit",
      type: "text",
      label: "Kredit / sumber",
    },
  ],
};
