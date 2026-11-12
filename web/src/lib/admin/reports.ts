import type { PayloadRequest } from "payload";

/**
 * Laporan per judul untuk admin: minat (klik tombol order, F-LAP-01) dan rekap pesanan
 * (F-LAP-02). Agregat saja: tidak pernah memuat nama atau kontak pembeli.
 * Impor relatif saja (dipakai endpoint yang terdaftar di payload.config).
 */

export const MAX_ROWS = 50_000;
export const MAX_RANGE_DAYS = 366;
const DAY_MS = 86_400_000;
const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Awal hari WIB (UTC+7, tanpa musim panas) untuk tanggal YYYY-MM-DD. */
export const wibDayStart = (ymd: string): Date => new Date(`${ymd}T00:00:00+07:00`);

const ymdFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" });

/** Tanggal WIB dalam format YYYY-MM-DD. */
export const ymdWib = (d: Date): string => ymdFormatter.format(d);

export type ReportRange = { dari: string; sampai: string; from: Date; to: Date; days: number };
export type RangeResult = { ok: true; range: ReportRange } | { ok: false; error: string };

const isRealDate = (ymd: string) => {
  if (!YMD_RE.test(ymd)) return false;
  const d = wibDayStart(ymd);
  return !Number.isNaN(d.getTime()) && ymdWib(d) === ymd;
};

/**
 * Rentang tanggal WIB, inklusif kedua ujung. Bawaan: 30 hari terakhir termasuk hari ini.
 * `to` eksklusif (awal hari setelah `sampai`).
 */
export const resolveRange = (
  input: { dari?: string | null; sampai?: string | null; days?: number | null },
  now: Date = new Date(),
): RangeResult => {
  const today = ymdWib(now);
  const sampai = input.sampai?.trim() || today;
  const days = input.days && Number.isFinite(input.days) && input.days > 0 ? Math.min(Math.floor(input.days), MAX_RANGE_DAYS) : 30;
  const invalid = { ok: false as const, error: "Format tanggal harus TTTT-BB-HH dan tanggalnya harus ada." };
  if (!isRealDate(sampai)) return invalid;
  const dari = input.dari?.trim() || ymdWib(new Date(wibDayStart(sampai).getTime() - (days - 1) * DAY_MS));
  if (!isRealDate(dari)) return invalid;
  const from = wibDayStart(dari);
  const to = new Date(wibDayStart(sampai).getTime() + DAY_MS);
  if (from >= to) return { ok: false, error: "Tanggal awal tidak boleh setelah tanggal akhir." };
  const span = Math.round((to.getTime() - from.getTime()) / DAY_MS);
  if (span > MAX_RANGE_DAYS) return { ok: false, error: `Rentang paling panjang ${MAX_RANGE_DAYS} hari.` };
  return { ok: true, range: { dari, sampai, from, to, days: span } };
};

const idOf = (v: unknown): number | null => {
  if (typeof v === "number") return v;
  if (v && typeof v === "object" && typeof (v as { id?: unknown }).id === "number") return (v as { id: number }).id;
  return null;
};

export type ClickRow = { bookId: number; wa: number; marketplace: number; byPlatform: Record<string, number> };

/**
 * `bookId` sintetis untuk klik pada buku yang sudah dihapus (order_clicks.book_id menjadi
 * NULL saat buku dihapus). ID buku asli mulai dari 1, jadi 0 tidak bentrok.
 */
export const DELETED_BOOK_ID = 0;

/**
 * Klik per buku (target wa/marketplace, rincian per platform), urut total terbanyak.
 * Klik pada buku terhapus digabung dalam satu baris `DELETED_BOOK_ID` di urutan terakhir,
 * agar jumlah baris tetap sama dengan total klik.
 */
export const aggregateClicks = (docs: Array<{ book?: unknown; target?: unknown; platform?: unknown }>): ClickRow[] => {
  const map = new Map<number, ClickRow>();
  for (const d of docs) {
    const bookId = idOf(d.book) ?? DELETED_BOOK_ID;
    const row = map.get(bookId) ?? { bookId, wa: 0, marketplace: 0, byPlatform: {} };
    if (d.target === "wa") row.wa += 1;
    else if (d.target === "marketplace") {
      row.marketplace += 1;
      const p = typeof d.platform === "string" && d.platform ? d.platform : "lainnya";
      row.byPlatform[p] = (row.byPlatform[p] ?? 0) + 1;
    }
    map.set(bookId, row);
  }
  const isDeleted = (r: ClickRow) => Number(r.bookId === DELETED_BOOK_ID);
  return [...map.values()].sort((a, b) => isDeleted(a) - isDeleted(b) || b.wa + b.marketplace - (a.wa + a.marketplace));
};

export type OrderRow = { bookId: number; orders: number; units: number; value: number };

/** Pesanan per buku: jumlah pesanan berbeda, unit, dan nilai (harga satuan × jumlah). */
export const aggregateOrders = (
  docs: Array<{ id?: unknown; items?: Array<{ book?: unknown; quantity?: unknown; unitPrice?: unknown }> | null }>,
): OrderRow[] => {
  const map = new Map<number, OrderRow & { orderIds: Set<unknown> }>();
  for (const order of docs) {
    for (const item of order.items ?? []) {
      const bookId = idOf(item.book);
      if (bookId == null) continue;
      const qty = typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 0;
      const price = typeof item.unitPrice === "number" && item.unitPrice > 0 ? item.unitPrice : 0;
      const row = map.get(bookId) ?? { bookId, orders: 0, units: 0, value: 0, orderIds: new Set() };
      row.orderIds.add(order.id);
      row.units += qty;
      row.value += qty * price;
      map.set(bookId, row);
    }
  }
  return [...map.values()]
    .map(({ orderIds, ...r }) => ({ ...r, orders: orderIds.size }))
    .sort((a, b) => b.value - a.value || b.units - a.units);
};

export type Fetched<T> = { rows: T[]; total: number; truncated: boolean };

export const fetchClicks = async (req: PayloadRequest, range: ReportRange): Promise<Fetched<ClickRow>> => {
  const res = await req.payload.find({
    collection: "order-clicks",
    where: { and: [{ createdAt: { greater_than_equal: range.from.toISOString() } }, { createdAt: { less_than: range.to.toISOString() } }] },
    select: { book: true, target: true, platform: true },
    depth: 0,
    limit: MAX_ROWS,
    pagination: true,
    overrideAccess: false,
    req,
  });
  return { rows: aggregateClicks(res.docs), total: res.totalDocs, truncated: res.totalDocs > res.docs.length };
};

/** Pesanan dalam rentang, kecuali yang batal. Melempar Forbidden untuk peran tanpa akses baca pesanan. */
export const fetchOrders = async (req: PayloadRequest, range: ReportRange): Promise<Fetched<OrderRow>> => {
  const res = await req.payload.find({
    collection: "orders",
    where: {
      and: [
        { orderDate: { greater_than_equal: range.from.toISOString() } },
        { orderDate: { less_than: range.to.toISOString() } },
        { status: { not_equals: "batal" } },
      ],
    },
    select: { items: true },
    depth: 0,
    limit: MAX_ROWS,
    pagination: true,
    overrideAccess: false,
    req,
  });
  return { rows: aggregateOrders(res.docs), total: res.totalDocs, truncated: res.totalDocs > res.docs.length };
};

/**
 * Judul buku (termasuk draf) untuk daftar ID. ID yang tidak ada lagi: "Judul terhapus (#id)";
 * baris gabungan `DELETED_BOOK_ID`: "Judul terhapus".
 */
export const fetchBookTitles = async (req: PayloadRequest, ids: number[]): Promise<Map<number, { title: string; slug: string | null }>> => {
  const out = new Map<number, { title: string; slug: string | null }>();
  const realIds = ids.filter((id) => id !== DELETED_BOOK_ID);
  if (realIds.length) {
    const res = await req.payload.find({
      collection: "books",
      where: { id: { in: realIds } },
      select: { title: true, slug: true },
      depth: 0,
      draft: true,
      pagination: false,
      overrideAccess: false,
      req,
    });
    for (const b of res.docs) out.set(b.id, { title: b.title, slug: b.slug ?? null });
  }
  if (realIds.length !== ids.length) out.set(DELETED_BOOK_ID, { title: "Judul terhapus", slug: null });
  for (const id of realIds) if (!out.has(id)) out.set(id, { title: `Judul terhapus (#${id})`, slug: null });
  return out;
};

const FORMULA_START = /^[=+\-@\t\r]/;

/**
 * CSV untuk Excel berbahasa Indonesia: BOM, pemisah ";", CRLF; aman dari injeksi rumus.
 * Sel teks SELALU dikutip: Excel dengan pemisah daftar lain (mis. "," pada region
 * English (US)) tetap membaca satu sel utuh, sehingga "Judul,=RUMUS()" tidak terpecah
 * menjadi sel baru yang diawali "=". Awalan rumus di depan sel tetap dinetralkan dengan "'".
 */
export const toCsv = (header: string[], rows: Array<Array<string | number>>): string => {
  const cell = (v: string | number): string => {
    if (typeof v === "number") return Number.isFinite(v) ? String(v) : "";
    let s = String(v ?? "");
    if (FORMULA_START.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  return `﻿${[header, ...rows].map((r) => r.map(cell).join(";")).join("\r\n")}\r\n`;
};
