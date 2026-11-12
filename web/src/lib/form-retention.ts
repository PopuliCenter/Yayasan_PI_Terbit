import type { Payload } from "payload";
import { RETENTION_MAX_DAYS, errorSummary } from "./form-builder";

/**
 * Penghapusan otomatis kiriman formulir yang melewati masa simpan (expiresAt).
 * Tidak butuh cron. Pemicu utama: health check /healthz (healthcheck Docker tiap 30 dtk,
 * juga toko-proxy dan monitor uptime) menjadwalkannya dengan next/server after(), jadi
 * selalu berjalan walau formulir sudah ditutup dan tidak ada admin yang membuka daftar
 * kiriman. Pemicu tambahan: setelah kiriman baru (after()) dan saat admin membuka daftar
 * kiriman. Semuanya dibatasi sekali per 6 jam per proses, sehingga kiriman terhapus paling
 * lambat sekitar 6 jam setelah expiresAt. Jalur manual: src/scripts/purge-form-submissions.ts.
 * Log hanya berisi jumlah, TIDAK PERNAH isi kiriman.
 */

const THROTTLE_MS = 6 * 60 * 60 * 1000;
const MAX_ROUNDS = 50;
const DAY_MS = 24 * 60 * 60 * 1000;

let lastRun = 0;
/** Penghapusan yang sedang berjalan; pemanggil yang menunggu ikut menunggu sampai selesai. */
let running: Promise<void> | null = null;

/**
 * Hapus semua kiriman kedaluwarsa. Bulk delete Payload mengambil satu halaman per panggilan, jadi diulang.
 * Jaring pengaman: kiriman tanpa expiresAt (seharusnya tidak ada; field-nya dikunci) dihapus
 * setelah masa simpan maksimum sejak dibuat.
 */
export async function purgeExpiredSubmissions(payload: Payload, now: Date = new Date()): Promise<number> {
  const maxAgeCutoff = new Date(now.getTime() - RETENTION_MAX_DAYS * DAY_MS).toISOString();
  let total = 0;
  for (let round = 0; round < MAX_ROUNDS; round++) {
    const res = await payload.delete({
      collection: "form-submissions",
      overrideAccess: true,
      where: {
        or: [
          { expiresAt: { less_than: now.toISOString() } },
          { and: [{ expiresAt: { exists: false } }, { createdAt: { less_than: maxAgeCutoff } }] },
        ],
      },
    });
    total += res.docs.length;
    if (res.docs.length === 0) break;
  }
  return total;
}

/**
 * Versi berbatas: paling sering sekali per 6 jam per proses. Tidak pernah menolak (reject):
 * galat hanya dicatat, jadi aman dipanggil dari health check. Bila penghapusan sedang
 * berjalan (mis. dipicu /healthz), pemanggil mendapat janji yang sama, sehingga yang
 * menunggu (daftar kiriman admin) baru lanjut setelah baris kedaluwarsa terhapus.
 */
export function purgeExpiredSubmissionsThrottled(payload: Payload): Promise<void> {
  if (running) return running;
  const now = Date.now();
  if (now - lastRun < THROTTLE_MS) return Promise.resolve();
  lastRun = now;
  running = (async () => {
    try {
      const deleted = await purgeExpiredSubmissions(payload, new Date(now));
      if (deleted > 0) payload.logger.info({ deleted }, "Kiriman formulir yang melewati masa simpan dihapus");
    } catch (err) {
      try {
        payload.logger.error({ err: errorSummary(err) }, "Gagal menghapus kiriman formulir yang kedaluwarsa");
      } catch {
        // Pencatatan pun gagal: tetap jangan menolak.
      }
    } finally {
      running = null;
    }
  })();
  return running;
}
