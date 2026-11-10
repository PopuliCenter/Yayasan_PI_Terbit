import type { Book } from "@/payload-types";

export type DisplayPrice = {
  /** Harga yang dibayar pembeli sekarang. */
  price: number;
  /** Harga normal untuk dicoret, hanya bila diskon sedang berlaku. */
  compareAt: number | null;
  /** Persentase potongan, dibulatkan ke bawah. */
  percentOff: number | null;
};

/**
 * Harga coret hanya tampil bila (1) harga normal diisi dan lebih tinggi dari harga
 * jual, dan (2) sekarang berada di dalam periode diskon bila periode diisi.
 * Ini menjaga agar harga coret tidak tampil terus-menerus (UU 8/1999 Pasal 10).
 */
export const getDisplayPrice = (
  book: Pick<Book, "price" | "listPrice" | "discountStart" | "discountEnd">,
  now: Date = new Date(),
): DisplayPrice => {
  const price = book.price;
  const list = book.listPrice ?? null;

  if (!list || list <= price) return { price, compareAt: null, percentOff: null };

  const start = book.discountStart ? new Date(book.discountStart) : null;
  const end = book.discountEnd ? new Date(book.discountEnd) : null;
  if (start && now < start) return { price: list, compareAt: null, percentOff: null };
  if (end && now > end) return { price: list, compareAt: null, percentOff: null };

  return {
    price,
    compareAt: list,
    percentOff: Math.floor(((list - price) / list) * 100),
  };
};
