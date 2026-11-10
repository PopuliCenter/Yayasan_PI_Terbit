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
  payload.config.ts        Konfigurasi Payload (koleksi, adapter DB, log audit, bahasa Indonesia)
  collections/             Model data: Books, Authors, Categories, Series, Media, Pages, Posts,
                           Orders (buku pesanan), PrivateFiles, Inquiries, Subscribers,
                           OrderClicks, AuditLogs, Users
  globals/Settings.ts      Identitas penyelenggara, nomor WA, jam layanan, marketplace, teks persetujuan
  access/                  Aturan peran: super-admin, admin-katalog, admin-order
  hooks/audit.ts           Log audit semua aksi tulis admin (F-ADM-05)
  app/(site)/              Situs publik
  app/(payload)/           Panel admin dan REST API Payload (jangan diubah manual)
  app/sitemap.ts, robots.ts
  components/              Komponen UI; forms/ untuk formulir publik
  lib/                     Kueri data, pencarian fuzzy, harga, pesan WA, anti-bot
  seed/                    Data contoh
```

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
| Impor CSV katalog (F-ADM-03, Should) | Increment berikutnya |
| Daftar pesan banyak judul → satu pesan WA (F-ORD-04, Should) | Increment berikutnya |
| Laporan klik & rekap pesanan per judul di dasbor (F-LAP-01/02) | Data sudah tercatat; tampilan laporan belum dibuat |
| 2FA wajib super admin (F-ADM-05) | Dipenuhi di lapisan Cloudflare Access (policy email + MFA) untuk `admin.<domain>`, ditambah validasi JWT di toko-proxy. Payload sendiri belum punya 2FA bawaan. |
