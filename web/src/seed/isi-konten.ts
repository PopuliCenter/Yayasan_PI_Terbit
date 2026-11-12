/**
 * Mengisi konten resmi Yayasan Populi Indonesia ke staging/produksi:
 * halaman (Tentang Kami, Cara Pesan, Pengiriman, Pengembalian & Penukaran, Kebijakan
 * Privasi, Syarat & Ketentuan, Kirim Naskah), formulir pengajuan retur, dan isian
 * Pengaturan yang masih kosong/placeholder.
 *
 *   docker compose run --rm migrate npm run --silent isi-konten
 *   docker compose run --rm -e ISI_KONTEN_TIMPA=1 migrate npm run --silent isi-konten
 *
 * - Halaman yang belum ada dibuat sebagai DRAF; yang sudah ada dilewati, kecuali
 *   ISI_KONTEN_TIMPA=1 (ditimpa sebagai draf baru; versi lama tetap di riwayat Versi).
 * - Tidak ada yang langsung tayang: tinjau di panel admin (Pratinjau), lalu Tayangkan.
 * - Aman dijalankan ulang.
 */
import { getPayload } from "payload";
import config from "../payload.config";
import { terapkanKonten } from "./konten/terapkan";

const payload = await getPayload({ config });
const log = (msg: string) => payload.logger.info(`[isi-konten] ${msg}`);
const timpa = process.env.ISI_KONTEN_TIMPA === "1";

const r = await terapkanKonten(payload, { tayang: false, timpa, pengaturan: true, log });

const namaKolom = (k: string) => (k === "marketplaceStores" ? "toko marketplace contoh dihapus" : k);
log(
  `pengaturan diisi: ${r.pengaturanDiisi.length ? r.pengaturanDiisi.map(namaKolom).join(", ") : "tidak ada (sudah terisi)"}`,
);
log(`halaman dibuat (draf): ${r.dibuat.length ? r.dibuat.join(", ") : "-"}`);
log(`halaman ditimpa (draf baru): ${r.ditimpa.length ? r.ditimpa.join(", ") : "-"}`);
if (r.dilewati.length) {
  log(`halaman sudah ada, dilewati: ${r.dilewati.join(", ")} (pakai ISI_KONTEN_TIMPA=1 untuk menimpa sebagai draf)`);
}
for (const t of r.tertunda) log(`masih perlu diisi di Pengaturan Situs: ${t}`);
log("selesai. Tinjau draf di admin (Konten → Halaman), lalu tekan Tayangkan per halaman.");
process.exit(0);
