import type { Book } from "@/payload-types";
import { authorNames, formatRupiah, joinNames } from "./format";
import { getDisplayPrice } from "./pricing";

export const DEFAULT_WA_TEMPLATE =
  "Halo, saya mau pesan buku:\n• {judul} ({penulis}) — {harga}\nISBN {isbn}\nJumlah: 1\n\nMohon info ketersediaan dan ongkir ke kota saya.";

/** Isi templat pesan dari pengaturan dengan data buku. Penanda yang tidak dikenal dibiarkan. */
export const buildWaMessage = (
  template: string | null | undefined,
  book: Pick<Book, "title" | "authors" | "isbn13" | "price" | "listPrice" | "discountStart" | "discountEnd" | "slug">,
  pageUrl: string,
): string => {
  const { price } = getDisplayPrice(book);
  const values: Record<string, string> = {
    judul: book.title,
    penulis: joinNames(authorNames(book)) || "-",
    harga: formatRupiah(price),
    isbn: book.isbn13 || "-",
    url: pageUrl,
  };
  return (template || DEFAULT_WA_TEMPLATE).replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? values[key] : match,
  );
};

/** Tautan click-to-chat biasa, tanpa WhatsApp Business API (keputusan no. 34 PRD lama). */
export const waUrl = (number: string, message?: string): string => {
  const base = `https://wa.me/${number.replace(/\D/g, "")}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
};
