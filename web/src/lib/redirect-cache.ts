import type { RedirectEntry } from "./redirect-table";

/*
 * Status cache tabel pengalihan, satu per proses (globalThis + Symbol.for), sehingga
 * hook Payload dan halaman Next berbagi cache yang sama walau modulnya dimuat dua kali.
 *
 * Berkas ini SENGAJA tanpa impor Payload/@payload-config: hook yang dimuat
 * payload.config mengimpornya, dan impor lib/payload di sini akan membuat siklus.
 */

export type RedirectTable = Map<string, RedirectEntry>;

export type RedirectCacheState = {
  table: RedirectTable | null;
  expiresAt: number;
  loading: Promise<RedirectTable> | null;
  generation: number;
  shortTtlUntil: number;
};

const KEY = Symbol.for("penerbit.redirects.v1");

/** Umur tabel normal. */
export const TTL_MS = 60_000;
/** Umur tabel yang dibangun tak lama setelah invalidasi (lihat invalidateRedirectTable). */
export const SHORT_TTL_MS = 2_000;
/** Lama jendela "mungkin basi" setelah invalidasi. */
const STALE_WINDOW_MS = 5_000;

export const redirectState = (): RedirectCacheState => {
  const g = globalThis as typeof globalThis & { [KEY]?: RedirectCacheState };
  g[KEY] ??= { table: null, expiresAt: 0, loading: null, generation: 0, shortTtlUntil: 0 };
  return g[KEY];
};

/**
 * Kosongkan cache. Hook Payload berjalan SEBELUM transaksi di-commit, jadi tabel yang
 * dibangun beberapa detik setelah ini bisa saja masih membaca data lama: tabel itu
 * hanya diberi umur pendek (SHORT_TTL_MS) agar segera dibangun ulang.
 */
export const invalidateRedirectTable = (): void => {
  const s = redirectState();
  s.table = null;
  s.expiresAt = 0;
  s.loading = null;
  s.generation += 1;
  s.shortTtlUntil = Date.now() + STALE_WINDOW_MS;
};
