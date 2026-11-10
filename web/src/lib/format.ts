import type { Book } from "@/payload-types";

const numberId = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

/** Rp85.000 — tanpa spasi, sesuai NFR lokalisasi di PRD. */
export const formatRupiah = (value: number | null | undefined): string =>
  typeof value === "number" ? `Rp${numberId.format(value)}` : "";

const dateWib = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

/** Tanggal ditampilkan dalam WIB; disimpan UTC oleh Payload. */
export const formatDate = (value: string | null | undefined): string =>
  value ? dateWib.format(new Date(value)) : "";

export const LANGUAGE_LABEL: Record<NonNullable<Book["language"]>, string> = {
  id: "Indonesia",
  en: "Inggris",
  other: "Lainnya",
};

export const AVAILABILITY: Record<
  Book["availability"],
  { label: string; tone: "ok" | "warn" | "off" | "info"; orderable: boolean }
> = {
  tersedia: { label: "Tersedia", tone: "ok", orderable: true },
  terbatas: { label: "Stok terbatas", tone: "warn", orderable: true },
  habis: { label: "Habis", tone: "off", orderable: false },
  segera: { label: "Segera terbit", tone: "info", orderable: false },
};

export const MARKETPLACE_LABEL: Record<string, string> = {
  tokopedia: "Tokopedia",
  shopee: "Shopee",
  tiktok: "TikTok Shop",
  blibli: "Blibli",
  lazada: "Lazada",
  lainnya: "Marketplace",
};

/** Nama penulis dari relasi yang sudah ter-populate. */
export const authorNames = (book: Pick<Book, "authors">): string[] =>
  (book.authors ?? [])
    .map((a) => (typeof a === "object" && a ? a.name : null))
    .filter((n): n is string => Boolean(n));

export const joinNames = (names: string[]): string => {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} dan ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, dan ${names[names.length - 1]}`;
};

/** Ukuran buku, mis. "14 × 21 cm". */
export const formatDimensions = (book: Pick<Book, "widthCm" | "heightCm">): string =>
  book.widthCm && book.heightCm ? `${book.widthCm} × ${book.heightCm} cm` : "";
