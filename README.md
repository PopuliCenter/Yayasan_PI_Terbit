# Yayasan_PI_Terbit

Situs katalog **Penerbit Yayasan Populi Indonesia** — mode sederhana: katalog buku, halaman penulis/seri/kabar, formulir institusi dan kontak. Tidak ada checkout; setiap pesanan diarahkan ke WhatsApp resmi atau toko marketplace, lalu dicatat admin di Buku Pesanan.

| Dokumen | Isi |
| --- | --- |
| [PRD-Web-Penerbit-Mode-Sederhana.md](PRD-Web-Penerbit-Mode-Sederhana.md) | Lingkup, kebutuhan, keputusan terbuka |
| [web/README.md](web/README.md) | Aplikasi Next.js 16 + Payload CMS 3: menjalankan lokal, migrasi, perintah |
| [docs/DEPLOY.md](docs/DEPLOY.md) | Runbook deploy ke VPS bersama (melengkapi panduan deploy privat) |

Struktur singkat: `web/` (aplikasi), `deploy/` (image toko-proxy, vhost edge, staging), `docker-compose*.yml`, `scripts/` (backup, restore, cek kesehatan, uji), `.github/workflows/ci.yml` (lint, test, audit, e2e, publish GHCR).
