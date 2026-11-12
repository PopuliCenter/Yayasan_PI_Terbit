/**
 * Isi bawaan global Tampilan = tampilan situs sebelum fitur ini ada.
 * Dipakai dua kali: sebagai defaultValue field (form admin langsung terisi menu yang
 * berlaku sekarang) dan sebagai cadangan resolver bila global kosong/rusak/tabel belum ada.
 */
import type { RouteKey } from "../links";

export type NavVisibility = "all" | "mobile";

type RouteRow = { label: string; link: { type: "route"; route: RouteKey }; visibility?: NavVisibility };

export const DEFAULT_HEADER_NAV: RouteRow[] = [
  { label: "Katalog", link: { type: "route", route: "katalog" }, visibility: "all" },
  { label: "Penulis", link: { type: "route", route: "penulis" }, visibility: "all" },
  { label: "Kabar", link: { type: "route", route: "kabar" }, visibility: "all" },
  { label: "Cara Pesan", link: { type: "route", route: "caraPesan" }, visibility: "all" },
  // Halaman CMS slug "tentang": profil + identitas badan hukum (dicek verifikator ISBN). Wajib (lihat validasi).
  { label: "Tentang Kami", link: { type: "route", route: "tentang" }, visibility: "all" },
  { label: "Kontak", link: { type: "route", route: "kontak" }, visibility: "mobile" },
];

export const DEFAULT_FOOTER_LINKS: RouteRow[] = [
  { label: "Pembelian institusi", link: { type: "route", route: "institusi" } },
];

export const DEFAULT_FOOTER_INFO_TITLE = "Informasi";

/** Batas menu layar lebar: header dirancang untuk 5 item di antara lg dan xl (tombol WA jadi ikon). */
export const MAX_DESKTOP_NAV = 5;
/** Total huruf teks menu layar lebar; perkiraan untuk lg (1024 px), cek ulang di peramban. */
export const MAX_DESKTOP_NAV_CHARS = 48;
