# Situs Penerbit Yayasan Populi Indonesia — Mode Sederhana

Situs katalog penerbit. **Tidak memproses transaksi**: setiap pesanan diarahkan ke WhatsApp atau marketplace, lalu dicatat admin di Buku Pesanan. Acuan lingkup: [`../PRD-Web-Penerbit-Mode-Sederhana.md`](../PRD-Web-Penerbit-Mode-Sederhana.md).

| Bagian | Teknologi |
| --- | --- |
| Situs publik | Next.js 16 (App Router), Tailwind CSS 4 |
| Panel admin & API | Payload CMS 3.93 (menyatu di aplikasi Next yang sama, `/admin`) |
| Basis data | SQLite untuk pengembangan lokal, Postgres untuk produksi |
| Gambar | Sampul diproses `sharp` menjadi WebP 200/420/800 px + JPEG 1200×630 untuk pratinjau tautan |

> **Node ≥ 24.22.1 wajib** (syarat Payload 3.93). Payload sempat dipin ke 3.80 demi Node lokal 24.14, tetapi gerbang audit menemukan advisory critical/high di 3.80 yang baru diperbaiki di 3.93. Image Docker memakai `node:24.22.2-alpine3.24`; CI memakai Node 24 terbaru.

Deploy ke VPS: lihat [`../docs/DEPLOY.md`](../docs/DEPLOY.md).

## Menjalankan di lokal

```bash
cp .env.example .env      # lalu isi PAYLOAD_SECRET
npm install
npm run seed              # data contoh + akun super admin lokal
npm run dev
```

- Situs: http://localhost:3000
- Admin: http://localhost:3000/admin — email dan kata sandi super admin lokal ada di `.env` (`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`).
- Isi ulang data contoh dari nol: `SEED_RESET=1 npm run seed`.

**Semua data seed fiktif** (penulis, judul, ISBN, nomor WA `620000000000` yang sengaja tidak valid). Ganti dengan data asli sebelum tayang; setiap buku contoh bertanda "DATA CONTOH" di catatan internal.

## Perintah

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Server pengembangan |
| `npm run build` / `npm start` | Build dan jalankan produksi (`output: standalone`) |
| `npm run seed` | Isi data contoh |
| `npm run generate:types` | Tulis ulang `src/payload-types.ts` setelah koleksi diubah |
| `npm run generate:importmap` | Tulis ulang import map admin setelah menambah komponen admin kustom |
| `npm run migrate:create` / `npm run migrate` | Migrasi skema Postgres (produksi) |
| `npm test` | Unit test (validasi JWT Access, harga coret, ISBN, pesan WA, pencarian fuzzy) |
| `npm run typecheck` | Pemeriksaan TypeScript |

Setelah konfigurasi Payload berubah, jalankan `generate:types` **dan** `generate:importmap`, lalu commit `src/payload-types.ts` dan `src/app/(payload)/admin/importMap.js`. Build Docker tidak pernah membuat ulang import map; CI gagal bila keduanya tidak sesuai konfigurasi.

## Migrasi Postgres

Produksi memakai Postgres dengan `push: false`: skema hanya berubah lewat migrasi di `src/migrations/`. Setiap kali koleksi diubah, buat migrasi dengan Postgres lokal sementara:

```bash
docker run -d --name penerbit-pg -e POSTGRES_USER=penerbit -e POSTGRES_PASSWORD=lokal -e POSTGRES_DB=penerbit \
  -p 127.0.0.1:55432:5432 postgres:17.11-alpine3.24
export DATABASE_ADAPTER=postgres DATABASE_URL=postgres://penerbit:lokal@127.0.0.1:55432/penerbit
npm run migrate                      # terapkan migrasi yang sudah ada dulu
npm run migrate:create -- nama-perubahan
npm run migrate                      # uji migrasi baru
docker rm -f penerbit-pg
```

Commit berkas `.ts` dan `.json` di `src/migrations/`. Job e2e CI menerapkan semua migrasi ke database kosong. Di VPS, migrasi dijalankan oleh service `migrate` setelah backup (lihat `docs/DEPLOY.md` §9).

## Struktur

```
src/
  payload.config.ts        Konfigurasi Payload (koleksi, plugin, adapter DB, log audit, dasbor,
                           pratinjau, bahasa Indonesia). Impor runtime wajib relatif ('./...')
  collections/             Model data: Books, Authors, Categories, Series, Media, Pages, Posts,
                           Orders (buku pesanan), PrivateFiles, Inquiries, Subscribers,
                           OrderClicks, AuditLogs, Users
  globals/                 Settings (identitas, WA, marketplace, teks persetujuan),
                           Appearance (Tampilan Situs), Homepage (Beranda)
  plugins/                 SEO, Pengalihan URL, Formulir, Impor/Ekspor (plugin resmi Payload)
  admin/, components/admin/ Dasbor, widget, laporan, logo, dan komponen field admin
  endpoints/reports.ts     Unduhan CSV laporan (/api/laporan/...)
  i18n/admin-id.ts         Terjemahan tambahan panel admin
  access/                  Aturan peran: super-admin, admin-katalog, admin-order
  hooks/                   Log audit (F-ADM-05), pengalihan otomatis saat slug berubah
  app/(site)/              Situs publik
  app/(payload)/           Panel admin dan REST API Payload (jangan diubah manual)
  app/sitemap.ts, robots.ts
  components/              Komponen UI; forms/ untuk formulir publik
  lib/                     Kueri data, pencarian fuzzy, harga, pesan WA, anti-bot
  seed/                    Data contoh
```

## Panel admin

- **Hanya bahasa Indonesia.** Pilihan bahasa dihapus; string yang belum ada di paket `id` Payload (Lexical, plugin SEO, pengalihan, impor/ekspor, formulir) diisi `src/i18n/admin-id.ts`.
- **Dasbor.** Widget: Ringkasan katalog, Pesan masuk terbaru, Pesanan perlu tindakan, Minat per judul, Rekap pesanan per judul. Susunan bawaan mengikuti peran. Tiap admin bisa menata ulang lewat **Sunting Dasbor**; kembali ke susunan bawaan dengan **Atur Ulang Tata Letak**. Tata letak tersimpan per pengguna (tanpa tabel baru).
- **Laporan** (`/admin/laporan`, F-LAP-01/02): minat per judul (klik WA/marketplace) dan rekap pesanan per judul dalam rentang tanggal WIB, masing-masing dengan **Unduh CSV** (`/api/laporan/minat-per-judul`, `/api/laporan/pesanan-per-judul`). Isinya agregat, tanpa nama atau kontak pembeli. Rekap pesanan hanya untuk peran yang boleh membaca pesanan. Endpoint CSV hanya melayani host admin.
- **Tampilan Situs** (global `appearance`): palet dan warna aksen, menu atas, footer, dan pengumuman situs, dengan pratinjau.
- **Beranda** (global `homepage`): susunan blok beranda dan tab SEO-nya.
- **Pratinjau.** Buku, Halaman, Kabar, Beranda, dan Tampilan Situs bisa dipratinjau langsung dalam beberapa ukuran layar. Pratinjau memakai alamat relatif `/pratinjau/...`, jadi hanya jalan di host admin; di apex toko-proxy membalas 404.
- **SEO.** Tab SEO (judul, deskripsi, gambar) di Buku, Halaman, Kabar, dan Beranda, dengan isi otomatis.
- **Pengalihan URL** (Pengaturan → Pengalihan URL): alamat lama → halaman yang benar. Mengubah slug buku, halaman, kabar, penulis, kategori, atau seri yang sudah tayang membuat pengalihan otomatis.
- **Impor/Ekspor** katalog lewat CSV (buku, penulis, kategori, seri): menu **⋯** di daftar koleksi; riwayat di Pengaturan → Riwayat Impor. Templat di `/templat/impor-*.csv`. Panduan lengkap: [`../docs/IMPOR-KATALOG.md`](../docs/IMPOR-KATALOG.md).
- **Formulir** (Konten → Formulir): formulir buatan admin yang dipasang di halaman lewat blok Formulir. Kiriman masuk ke Pesanan → Kiriman Formulir dan dihapus otomatis setelah masa simpannya. Penghapusan berjalan di dalam app paling sering sekali per 6 jam, dipicu health check `/healthz` (healthcheck Docker tiap 30 dtk) setelah respons terkirim, jadi kiriman terhapus paling lambat sekitar 6 jam setelah kedaluwarsa tanpa cron. Jalur manual: `npx payload run ./src/scripts/purge-form-submissions.ts` (di server lewat service `migrate`, lihat [`../docs/DEPLOY.md`](../docs/DEPLOY.md) §9a).
- Avatar admin memakai gambar bawaan (bukan Gravatar, agar hash email admin tidak dikirim ke luar).

## Keputusan desain yang perlu diketahui

- **Hanya yang terbit yang tampil.** Semua kueri publik memakai `overrideAccess: false`, sehingga aturan "hanya dokumen terbit" ditegakkan oleh access control Payload, bukan oleh tiap kueri.
- **Data pribadi dipisah.** Bukti transfer masuk koleksi `private-files` (di luar `public/`, hanya admin order). Pengaturan situs tertutup untuk REST API publik karena memuat rekening; halaman membaca field publiknya saja.
- **Klik order tanpa data pengunjung.** `/klik` hanya menyimpan buku, sasaran (WA/marketplace), halaman asal, dan waktu. Tidak ada IP, cookie, atau user agent yang disimpan.
- **Anti-bot berlapis tanpa vendor.** Honeypot, token waktu bertanda HMAC (menolak kiriman < 3 dtk atau token palsu), dan batas laju per IP di memori. Cloudflare Turnstile aktif otomatis bila `TURNSTILE_SITE_KEY` dan `TURNSTILE_SECRET_KEY` diisi (formulir kontak/institusi; formulir langganan tanpa Turnstile).
- **Pencarian fuzzy di memori** (F-CARI-01): toleran satu huruf salah, ISBN dengan/tanpa tanda hubung; perilakunya sama di SQLite dan Postgres tanpa ekstensi `pg_trgm`.
- **Harga coret berperiode.** Hanya tampil bila harga normal diisi *dan* sekarang di dalam periode diskon (UU 8/1999 Pasal 10).
- **Render per permintaan.** Halaman publik `force-dynamic`: perubahan ketersediaan di admin langsung tampil, dan `next build` tidak butuh basis data. Cache bisa ditambah di Cloudflare saat trafik membutuhkan.
- **Robots.** Situs tidak bisa diindeks kecuali `SITE_INDEXABLE=true`, agar staging tidak masuk Google.
- **Konfigurasi runtime, bukan build.** Tidak ada `NEXT_PUBLIC_*`; `SITE_URL`, `SITE_INDEXABLE`, kunci Turnstile, dan Cloudflare Access dibaca saat runtime, sehingga satu image dipakai staging dan produksi. Di produksi, app berhenti saat start (`src/instrumentation-node.ts`) bila konfigurasi wajib tidak lengkap atau staging diset bisa diindeks.
- **Admin hanya di `admin.<domain>`.** Di apex, toko-proxy membalas 404 untuk `/admin` dan `/api/*` kecuali berkas sampul publik. Pengguna pertama yang dibuat lewat `/admin` otomatis super admin.

## Belum dikerjakan

| Hal | Alasan / ketergantungan |
| --- | --- |
| Email notifikasi formulir ke admin | Menunggu pilihan pengirim email (keputusan no. 5). Pesan sudah tersimpan di admin → Pesan Masuk. |
| Daftar pesan banyak judul → satu pesan WA (F-ORD-04, Should) | Increment berikutnya |
| Kunjungan per judul (bagian F-LAP-01) | Kunjungan halaman belum dicatat. Pilihan: penghitung tanpa data pribadi (koleksi + migrasi baru), Cloudflare Web Analytics, atau kolom ini dihapus. Laporan saat ini memakai klik WA/marketplace. |
| 2FA wajib super admin (F-ADM-05) | Dipenuhi di lapisan Cloudflare Access (policy email + MFA) untuk `admin.<domain>`, ditambah validasi JWT di toko-proxy. Payload sendiri belum punya 2FA bawaan. |
