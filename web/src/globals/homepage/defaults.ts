/**
 * Satu-satunya sumber teks bawaan Beranda. Teks disalin apa adanya dari halaman depan
 * sebelum Beranda bisa disusun (src/app/(site)/page.tsx: ORDER_STEPS dan teks JSX),
 * dengan nama penerbit diganti penanda {penerbit}.
 *
 * HOMEPAGE_DEFAULT_LAYOUT dipakai dua kali: sebagai isi awal field `layout` di admin, dan
 * sebagai susunan cadangan saat render bila belum ada versi tayang (atau baca gagal).
 * Murni (tanpa impor payload) agar bisa dipakai klien, server, dan uji.
 */
import type { HomeBlockInput } from "../../lib/homepage-plan";
import { IDENTITY_SENTENCE } from "./checks";

export { IDENTITY_SENTENCE };

/** Nama jenis bagian, dipakai label admin, pesan pratinjau, dan judul cadangan. */
export const BLOCK_LABELS = {
  hero: "Pembuka",
  latestBooks: "Terbitan terbaru",
  bookShelf: "Pilihan buku",
  topics: "Daftar topik",
  orderSteps: "Cara memesan",
  callToAction: "Ajakan",
  news: "Kabar penerbit",
  textSection: "Teks bebas",
} as const;

export const DEFAULT_HERO_HEADING = "Buku kajian politik, demokrasi, dan kebijakan publik.";

export const DEFAULT_HERO_INTRO = `${IDENTITY_SENTENCE} Situs ini adalah katalog resmi terbitan kami: pilih judul, lalu pesan lewat WhatsApp atau toko resmi kami di marketplace.`;

export const DEFAULT_SEARCH_PLACEHOLDER = "Judul, penulis, atau ISBN";

export const DEFAULT_LATEST = {
  heading: "Terbitan terbaru",
  limit: 8,
  allLinkLabel: "Lihat semua buku",
  emptyText: "Katalog sedang disiapkan. Silakan kembali lagi nanti.",
} as const;

export const DEFAULT_SHELF_LIMIT = 4;

export const DEFAULT_TOPICS_HEADING = "Menurut topik";

export const DEFAULT_ORDER_STEPS: readonly { title: string; body: string }[] = [
  {
    title: "Pilih buku",
    body: "Cari judulnya di katalog, lalu tekan tombol Pesan via WhatsApp di halaman buku.",
  },
  {
    title: "Konfirmasi dengan admin",
    body: "Admin membalas dengan total harga dan ongkos kirim ke kota Anda. Pembayaran lewat transfer.",
  },
  {
    title: "Buku dikirim",
    body: "Setelah pembayaran masuk, buku dikemas dan nomor resinya kami kirim lewat WhatsApp.",
  },
];

export const DEFAULT_ORDER = {
  heading: "Cara memesan",
  intro: "Situs ini tidak memakai keranjang belanja. Setiap pesanan dilayani langsung oleh admin kami.",
  note: "Lebih suka belanja di marketplace? Setiap halaman buku juga menautkan ke toko resmi kami.",
  linkLabel: "Selengkapnya",
  linkUrl: "/cara-pesan",
} as const;

export const DEFAULT_NEWS = {
  heading: "Kabar penerbit",
  limit: 3,
  allLinkLabel: "Semua kabar",
} as const;

export const HOMEPAGE_DEFAULT_LAYOUT: readonly HomeBlockInput[] = [
  {
    blockType: "hero",
    heading: DEFAULT_HERO_HEADING,
    intro: DEFAULT_HERO_INTRO,
    showSearch: true,
    searchPlaceholder: DEFAULT_SEARCH_PLACEHOLDER,
    spotlightMode: "auto",
  },
  {
    blockType: "latestBooks",
    heading: DEFAULT_LATEST.heading,
    limit: DEFAULT_LATEST.limit,
    showAllLink: true,
    allLinkLabel: DEFAULT_LATEST.allLinkLabel,
    emptyText: DEFAULT_LATEST.emptyText,
    hideSection: false,
    paperBand: false,
    anchor: "terbaru",
  },
  {
    blockType: "topics",
    heading: DEFAULT_TOPICS_HEADING,
    hideSection: false,
    paperBand: false,
    anchor: "kategori",
  },
  {
    blockType: "orderSteps",
    heading: DEFAULT_ORDER.heading,
    intro: DEFAULT_ORDER.intro,
    steps: DEFAULT_ORDER_STEPS.map((s) => ({ ...s })),
    note: DEFAULT_ORDER.note,
    linkLabel: DEFAULT_ORDER.linkLabel,
    linkUrl: DEFAULT_ORDER.linkUrl,
    hideSection: false,
    paperBand: false,
    anchor: "cara-pesan",
  },
  {
    blockType: "callToAction",
    heading: "Untuk perpustakaan, kampus, dan sekolah",
    body: "Perlu banyak eksemplar, atau kuitansi atas nama lembaga? Kirimkan daftar judulnya. Kami balas dengan penawaran harga.",
    buttonLabel: "Minta penawaran",
    buttonUrl: "/institusi",
    buttonStyle: "outline",
    hideSection: false,
    paperBand: false,
    anchor: "institusi",
  },
  {
    blockType: "news",
    heading: DEFAULT_NEWS.heading,
    limit: DEFAULT_NEWS.limit,
    allLinkLabel: DEFAULT_NEWS.allLinkLabel,
    hideSection: false,
    paperBand: false,
    anchor: "kabar",
  },
];
