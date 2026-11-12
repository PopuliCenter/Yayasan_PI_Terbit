/**
 * Terjemahan bahasa Indonesia untuk panel admin, di atas paket `id` bawaan Payload.
 * Diimpor payload.config, jadi tanpa impor '@/'.
 *
 * - Kosakata terbit memakai "tayang" (Tayangkan, Tayang, Belum tayang, Turunkan dari situs),
 *   sama dengan istilah di field situs ("Tanggal tayang").
 * - richtext-lexical 3.93.0 tidak punya string `id`; kunci yang hilang tampil mentah
 *   (mis. "lexical:paragraph:label"), jadi semuanya disediakan di sini. Daftar kuncinya
 *   diuji di src/lib/admin/i18n.test.ts.
 * - plugin-seo dan plugin-redirects tidak punya `id`; form-builder punya, tetapi banyak
 *   terjemahannya keliru (mis. "Kirim Label Tombol", "Pilih" untuk jenis daftar pilihan,
 *   "Penampung"). Kunci yang ditimpa diuji terhadap paket `en` plugin di i18n.test.ts.
 * - plugin-import-export 3.93.0 punya berkas `id`, tetapi lupa memasukkannya ke indeks
 *   terjemahannya, sehingga layar Impor tampil dengan kunci mentah. Berkas itu diimpor
 *   langsung di sini lalu ditimpa beberapa istilah kita.
 */
import { idTranslations as importExportId } from "@payloadcms/plugin-import-export/translations/languages/id";

export const adminTranslationsId = {
  general: {
    edit: "Ubah",
    editLabel: "Ubah {{label}}",
    payloadSettings: "Pengaturan tampilan panel",
    true: "Ya",
    false: "Tidak",
    updatedAt: "Diperbarui",
    createdAt: "Dibuat",
    noResults: "Belum ada {{label}} yang cocok. Ubah pencarian atau filter, atau buat yang baru.",
    restoreAsPublished: "Pulihkan sebagai versi tayang",
    schedulePublishFor: "Jadwalkan tayang untuk {{title}}",
  },
  version: {
    published: "Tayang",
    draftHasPublishedVersion: "Tayang · ada draf",
    unpublished: "Belum tayang",
    publish: "Tayangkan",
    publishChanges: "Tayangkan perubahan",
    publishing: "Menayangkan…",
    unpublish: "Turunkan dari situs",
    unpublishing: "Menurunkan…",
    unpublishedSuccessfully: "Berhasil diturunkan dari situs.",
    schedulePublish: "Jadwalkan tayang",
    confirmPublish: "Konfirmasi penayangan",
    confirmUnpublish: "Konfirmasi penurunan",
    aboutToUnpublish: "Dokumen ini akan diturunkan dari situs. Lanjutkan?",
    aboutToPublishSelection: "Semua {{label}} terpilih akan ditayangkan. Lanjutkan?",
    aboutToUnpublishSelection: "Semua {{label}} terpilih akan diturunkan dari situs. Lanjutkan?",
    aboutToRevertToPublished: "Perubahan akan dikembalikan ke versi yang tayang. Lanjutkan?",
    currentlyPublished: "Sedang tayang",
    currentPublishedVersion: "Versi tayang saat ini",
    previouslyPublished: "Pernah tayang",
    revertToPublished: "Kembalikan ke versi tayang",
  },
  error: {
    unPublishingDocument: "Terjadi masalah saat menurunkan dokumen ini dari situs.",
  },
  dashboard: {
    editingDashboard: "Mengedit dasbor",
    noItems: "Dasbor masih kosong. Tambahkan widget lewat menu Dasbor di bilah atas.",
    discardMessage: "Ada perubahan tata letak dasbor yang belum disimpan. Buang perubahan?",
  },
  lexical: {
    general: {
      placeholder: "Mulai menulis, atau ketik '/' untuk perintah…",
      slashMenuBasicGroupLabel: "Dasar",
      slashMenuListGroupLabel: "Daftar",
      toolbarItemsActive: "{{count}} aktif",
    },
    align: {
      alignLeftLabel: "Rata kiri",
      alignCenterLabel: "Rata tengah",
      alignRightLabel: "Rata kanan",
      alignJustifyLabel: "Rata kiri-kanan",
    },
    blockquote: { label: "Kutipan" },
    blocks: {
      label: "Blok",
      inlineBlocks: {
        label: "Blok sebaris",
        create: "Buat {{label}}",
        edit: "Ubah {{label}}",
        remove: "Hapus {{label}}",
      },
    },
    checklist: { label: "Daftar centang" },
    orderedList: { label: "Daftar bernomor" },
    unorderedList: { label: "Daftar berbutir" },
    heading: { label: "Judul {{headingLevel}}" },
    horizontalRule: { label: "Garis pemisah" },
    indent: { increaseLabel: "Tambah indentasi", decreaseLabel: "Kurangi indentasi" },
    link: { label: "Tautan", loadingWithEllipsis: "Memuat…" },
    paragraph: { label: "Paragraf", label2: "Teks biasa" },
    relationship: { label: "Tautan ke dokumen" },
    upload: { label: "Gambar" },
    textState: { defaultStyle: "Gaya bawaan" },
  },
  "plugin-seo": {
    almostThere: "Hampir",
    autoGenerate: "Isi otomatis",
    bestPractices: "panduan Google",
    characterCount: "{{current}}/{{minLength}}–{{maxLength}} karakter, ",
    charactersLeftOver: "sisa {{characters}}",
    charactersToGo: "kurang {{characters}}",
    charactersTooMany: "kelebihan {{characters}}",
    checksPassing: "{{current}}/{{max}} pemeriksaan lolos",
    good: "Baik",
    imageAutoGenerationTip: "Isi otomatis memakai sampul atau gambar utama dokumen ini.",
    lengthTipDescription: "Sebaiknya {{minLength}}–{{maxLength}} karakter. Cara menulis deskripsi yang baik: ",
    lengthTipTitle: "Sebaiknya {{minLength}}–{{maxLength}} karakter. Cara menulis judul yang baik: ",
    missing: "Belum diisi",
    noImage: "Belum ada gambar",
    preview: "Pratinjau",
    previewDescription: "Tampilan di hasil pencarian bisa berbeda, tergantung isi halaman dan kata kunci.",
    tooLong: "Terlalu panjang",
    tooShort: "Terlalu pendek",
  },
  "plugin-redirects": {
    customUrl: "Alamat khusus",
    documentToRedirect: "Halaman tujuan",
    fromUrl: "Alamat lama",
    internalLink: "Halaman di situs ini",
    redirectType: "Jenis pengalihan",
    toUrlType: "Arahkan ke",
  },
  "plugin-import-export": {
    ...importExportId["plugin-import-export"],
    "field-matchField-label": "Cocokkan berdasarkan kolom",
    "field-matchField-description": "Kolom untuk mencari data yang sudah ada (disarankan: slug)",
  },
  "plugin-form-builder": {
    // Istilah seragam "kolom" (sama dengan deskripsi "Maksimal 15 kolom" di plugins/formBuilder.ts).
    name: "Nama kolom (huruf kecil, tanpa spasi)",
    checkedByDefault: "Tercentang sejak awal",
    fieldWidth: "Lebar kolom (%)",
    fields: "Kolom formulir",
    field: "Kolom",
    submitButton: "Teks tombol kirim",
    // Hanya dipakai blok daftar pilihan: menjadi <option> kosong di situs.
    placeholder: "Teks pilihan kosong",
    required: "Wajib diisi",
    textSingular: "Teks pendek",
    textPlural: "Kolom teks pendek",
    textareaSingular: "Teks panjang",
    textareaPlural: "Kolom teks panjang",
    emailSingular: "Email",
    emailPlural: "Kolom email",
    numberSingular: "Angka",
    numberPlural: "Kolom angka",
    selectSingular: "Daftar pilihan",
    selectPlural: "Kolom daftar pilihan",
    selectOptions: "Pilihan",
    radioOptions: "Pilihan",
    radioPlural: "Kolom radio",
    checkboxSingular: "Kotak centang",
    checkboxPlural: "Kolom kotak centang",
    datePlural: "Kolom tanggal",
    messagePlural: "Blok pesan",
  },
} as const;
