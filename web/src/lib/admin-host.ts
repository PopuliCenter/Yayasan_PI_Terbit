import type { JWTVerifyGetKey } from "jose";
import { accessConfigFromEnv, verifyAccessJwt } from "./cf-access";

/**
 * Gerbang host admin yang dipakai bersama: server function Payload, endpoint laporan CSV,
 * dan rute pratinjau. Gagal tertutup di produksi.
 *
 * nginx sudah menolak /admin dan /api di apex dan meminta JWT Cloudflare Access di host
 * admin, tetapi Next.js bisa menerima permintaan yang tidak melewati toko-proxy (fetch
 * internal, POST Server Action dengan ID halaman lain). Karena itu kode yang memberi akses
 * admin memeriksa ulang di sini: host harus host admin DAN JWT Access harus sah.
 */

/** Host admin dari ADMIN_BASE_URL (huruf kecil), atau null bila tidak diisi/tidak valid. */
export const adminHost = (): string | null => {
  try {
    return new URL(process.env.ADMIN_BASE_URL ?? "").host.toLowerCase();
  } catch {
    return null;
  }
};

/** Host permintaan seperti yang dilihat toko-proxy (X-Forwarded-Host lebih dulu). */
export const requestHost = (h: Headers): string => (h.get("x-forwarded-host") ?? h.get("host") ?? "").toLowerCase();

/**
 * true bila permintaan boleh mendapat akses admin.
 * - Di luar produksi selalu true (pengembangan lokal tanpa Cloudflare).
 * - Di produksi: host = host admin DAN JWT Cloudflare Access sah.
 */
export const isAdminRequest = async (
  h: Headers,
  /** Hanya untuk uji: ganti sumber kunci JWT. */
  getKey?: JWTVerifyGetKey,
): Promise<boolean> => {
  if (process.env.NODE_ENV !== "production") return true;
  const expected = adminHost();
  if (!expected || requestHost(h) !== expected) return false;
  const access = await verifyAccessJwt(h.get("cf-access-jwt-assertion"), accessConfigFromEnv(), getKey);
  return access.ok;
};
