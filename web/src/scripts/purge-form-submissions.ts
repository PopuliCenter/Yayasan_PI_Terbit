/**
 * Hapus manual kiriman formulir yang melewati masa simpan (mis. saat go-live atau audit).
 *
 *   npx payload run ./src/scripts/purge-form-submissions.ts
 *
 * Jalur utama tetap otomatis di dalam aplikasi (setelah kiriman baru dan saat admin
 * membuka daftar kiriman). Log hanya berisi jumlah, bukan isi kiriman.
 */
import { getPayload } from "payload";
import config from "../payload.config";
import { purgeExpiredSubmissions } from "../lib/form-retention";

const payload = await getPayload({ config });
const deleted = await purgeExpiredSubmissions(payload);
payload.logger.info({ deleted }, "Penghapusan kiriman formulir kedaluwarsa selesai");
process.exit(0);
