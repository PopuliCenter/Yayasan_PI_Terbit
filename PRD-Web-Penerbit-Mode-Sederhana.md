# PRD — Situs Penerbit Yayasan Populi Indonesia (Mode Sederhana)

Versi 0.1 · 9 November 2026 · @Ningrat Kumara

Draf untuk ditinjau. Versi ini **menggantikan lingkup MVP** pada *PRD Toko Buku Online Penerbit Yayasan Populi Indonesia* (9 Nov 2026) dengan mode sederhana: situs katalog penerbit yang **tidak memproses transaksi sendiri**. Setiap pesanan diarahkan ke WhatsApp atau ke marketplace. PRD toko penuh tetap berlaku sebagai rencana Fase 2 dan tidak dibatalkan.

Kolom bertanda **Isian** menunggu keputusan Yayasan.

---

## 1. Ringkasan & alasan perubahan

Pembelian langsung di situs belum direncanakan, sehingga seluruh rantai pembayaran dan pengiriman otomatis ditunda. Situs tahap ini berfungsi sebagai **etalase dan katalog resmi penerbit**: pembaca menemukan buku lewat mesin pencari, membaca detailnya, lalu memesan lewat WhatsApp atau tombol marketplace.

### Yang hilang dari lingkup dibanding PRD toko penuh

| Dihapus dari lingkup tahap ini | Akibatnya |
| --- | --- |
| Keranjang, checkout, akun pelanggan | Tidak ada data pembayaran dan alamat yang disimpan situs |
| Payment gateway (Midtrans) dan webhook pembayaran | Tidak perlu KYB, tidak ada biaya MDR, tidak ada rekonsiliasi |
| Agregator ongkir (Biteship), resi, pickup, lacak | Tidak ada kuota API, saldo, atau tarif cadangan |
| Reservasi stok atomik, pembatalan, retur, refund otomatis | Semua ditangani manual oleh admin lewat WA/marketplace |
| Invoice PDF, kontrak elektronik, email per status pesanan | Kuitansi dan konfirmasi dikirim manual atau oleh marketplace |

### Yang tetap dikerjakan

Katalog buku, halaman buku ramah mesin pencari, halaman penulis dan seri, pencarian, halaman konten dan hukum, formulir pembelian institusi, panel admin katalog, serta pencatatan klik order sebagai dasar keputusan Fase 2.

### Keuntungan mode sederhana

- Bisa diluncurkan tanpa menunggu badan penjual, KYB payment gateway, dan verifikasi agregator ongkir selesai.
- Biaya bulanan tambahan mendekati nol: domain, ditambah kapasitas VPS yang sudah ada.
- Risiko terbesar pada PRD toko penuh (webhook, stok balapan, saldo agregator, refund) tidak ada di tahap ini.
- SEO mulai bekerja sejak sekarang, sehingga saat toko penuh dibuka, halaman buku sudah terindeks dan punya riwayat.

### Risiko yang perlu disadari

- Konversi lebih rendah daripada checkout langsung, dan setiap pesanan memakan waktu admin.
- Pesanan lewat WA tidak punya catatan terstruktur kecuali admin disiplin mengisinya.
- Penjualan lewat marketplace tetap terkena komisi marketplace.

---

## 2. Tujuan & KPI

### Tujuan

- Menyediakan katalog resmi terbitan Yayasan yang dapat ditemukan di mesin pencari.
- Mengalirkan permintaan pembelian ke satu kanal tertib: WhatsApp atau marketplace.
- Membuka jalur pembelian institusi (perpustakaan, kampus, sekolah) lewat formulir penawaran.
- Memenuhi kewajiban identitas penyelenggara dan pelindungan data pribadi sejak hari pertama, dalam lingkup yang jauh lebih kecil.
- Mengumpulkan angka nyata (klik order, judul yang dicari, pesanan manual) sebagai dasar keputusan membangun toko penuh.

### KPI

| Metrik | Definisi | Target 6 bulan (Isian) | Cara ukur |
| --- | --- | --- | --- |
| Klik order per bulan | Jumlah klik tombol WhatsApp dan tombol marketplace |  | Event di server/analitik (keputusan no. 9) |
| Pesanan tercatat per bulan | Pesanan yang benar-benar dibayar, dicatat admin di buku pesanan |  | Buku pesanan (F-ORD-05) |
| Rasio klik → pesanan (%) | Pesanan tercatat dibagi klik order |  | Buku pesanan dibagi event klik |
| Halaman buku terindeks | Jumlah halaman buku yang terindeks Google | Usulan: 100% judul aktif | Google Search Console |
| Pengunjung organik per bulan | Sesi dari hasil pencarian |  | Alat analitik (keputusan no. 9) |
| Waktu tanggap WhatsApp | Median waktu dari pesan masuk sampai dijawab | Usulan: ≤ 4 jam pada jam layanan | Catatan manual atau fitur WA Business |
| Permintaan penawaran institusi | Formulir F-FRM-01 yang masuk per bulan |  | Email admin / log formulir |
| Uptime (%) | Persentase menit situs merespons normal | Usulan: ≥ 99,5% | Monitor uptime eksternal |

---

## 3. Pengguna & peran

Tanpa transaksi di situs, peran menyusut dari tujuh menjadi tiga, dan tidak ada peran Keuangan maupun gudang di dalam sistem.

| Peran | Kebutuhan utama | Hak akses |
| --- | --- | --- |
| Pembaca umum | Menemukan buku, membaca detail, memesan | Jelajah katalog, cari, klik WA/marketplace, isi formulir; **tanpa akun** |
| Pembeli institusi | Pembelian jumlah besar dan penawaran harga | Formulir permintaan penawaran (F-FRM-01) |
| Admin katalog | Mengelola buku, penulis, kategori, halaman konten | Tulis katalog dan konten; baca pesan formulir |
| Admin order (WA/marketplace) | Menjawab WA, mencatat pesanan, mengemas, mengirim | Baca katalog, ubah status ketersediaan, tulis buku pesanan |
| Super admin | Pengguna admin dan setelan situs | Semua hak; wajib 2FA; kunci API tetap di `.env` server |

PIC pelindungan data pribadi (PDP) tetap berupa penanda pada akun admin, bukan peran terpisah. Log audit mencatat semua aksi tulis admin beserta pelaku dan waktunya.

| Hal | Isian |
| --- | --- |
| Nama dan jumlah orang per peran |  |
| Satu orang boleh merangkap | Usulan: boleh; admin katalog dan admin order bisa orang yang sama |
| Admin yang ditandai PIC PDP |  |
| Nomor WhatsApp layanan (satu nomor resmi) |  |

---

## 4. Lingkup rilis

| Fitur | Rilis 1 (Mode Sederhana) | Fase 2 (toko penuh) | Di luar lingkup |
| --- | --- | --- | --- |
| Profil penerbit dan halaman konten | Ya |  |  |
| Katalog buku cetak dan halaman buku ramah mesin pencari | Ya |  |  |
| Halaman penulis dan seri | Ya |  |  |
| Pencarian dan filter | Ya |  |  |
| Status ketersediaan per judul (tanpa angka stok) | Ya |  |  |
| Tombol order WhatsApp dengan pesan terisi otomatis | Ya |  |  |
| Tombol/tautan ke marketplace per judul | Ya |  |  |
| Formulir permintaan penawaran institusi | Ya |  |  |
| Formulir kontak dan pengaduan | Ya |  |  |
| Langganan kabar terbitan baru (opt-in) | Ya |  |  |
| Panel admin katalog, impor CSV, log audit | Ya |  |  |
| Buku pesanan manual sederhana | Ya |  |  |
| Pencatatan event klik order dan laporan ringkas | Ya |  |  |
| Halaman hukum (identitas, privasi, pengaduan, S&K ringkas) | Ya |  |  |
| Keranjang, checkout, pembayaran online |  | Ya |  |
| Ongkir real-time, resi, pickup, lacak |  | Ya |  |
| Akun pelanggan, retur dan refund dalam sistem |  | Ya |  |
| Laporan penjualan dan royalti otomatis |  | Ya |  |
| Pre-order, bundling, voucher, ulasan |  | Ya |  |
| Notifikasi WhatsApp lewat API |  | Ya |  |
| E-book (dengan atau tanpa DRM) |  | Ditinjau | DRM: Ya |
| Multi-vendor, aplikasi mobile native, kirim luar negeri |  |  | Ya |

---

## 5. Kebutuhan fungsional

Ada 29 kebutuhan dalam 7 area; 21 berprioritas Must dan menjadi syarat peluncuran. Prioritas memakai MoSCoW.

### 5.1 Katalog & halaman buku

| ID | Cerita pengguna | Kriteria terima | Prioritas |
| --- | --- | --- | --- |
| F-KAT-01 | Sebagai pembaca, saya melihat detail buku sebelum memesan. | Tampil judul, penulis, ISBN-13, tahun terbit, jumlah halaman, ukuran (cm), berat (g), bahasa, sinopsis, daftar isi, sampul, harga, dan status ketersediaan. | Must |
| F-KAT-02 | Sebagai pembaca, saya menjelajah buku per kategori dan seri. | Satu buku bisa masuk beberapa kategori; halaman seri mengurutkan jilid. | Must |
| F-KAT-03 | Sebagai pengelola, saya ingin halaman buku mudah ditemukan mesin pencari. | URL berpola `/buku/judul-buku`; data terstruktur `Book` dan `Product` ada di HTML awal; `sitemap.xml` diperbarui otomatis. | Must |
| F-KAT-04 | Sebagai pembaca, saya melihat harga yang jelas. | Harga tampil sebagai harga jual penerbit, dengan keterangan bahwa harga di marketplace dapat berbeda. Harga coret hanya bila harga normal benar pernah berlaku. | Must |
| F-KAT-05 | Sebagai pembaca, saya melihat semua buku seorang penulis. | Halaman `/penulis/nama-penulis` memuat profil singkat dan daftar bukunya. | Should |
| F-KAT-06 | Sebagai pembaca, saya membaca pratinjau beberapa halaman. | Berupa gambar halaman, bukan berkas utuh; jumlah halaman mengikuti keputusan no. 7. | Could |

Catatan: berat dan dimensi tetap dicatat walau belum dipakai menghitung ongkir, agar data siap untuk Fase 2 dan bisa dipakai admin saat menghitung ongkir manual.

### 5.2 Pencarian & filter

| ID | Cerita pengguna | Kriteria terima | Prioritas |
| --- | --- | --- | --- |
| F-CARI-01 | Sebagai pembaca, saya mencari berdasarkan judul, penulis, atau ISBN. | Satu huruf salah tetap menemukan bukunya; ISBN dengan atau tanpa tanda hubung ditemukan; hasil < 1 dtk pada katalog uji 1.000 judul. | Must |
| F-CARI-02 | Sebagai pembaca, saya menyaring dan mengurutkan hasil. | Filter kategori, penulis, dan ketersediaan; urutan terbaru dan judul. | Should |
| F-CARI-03 | Sebagai pembaca, saya tetap mendapat saran saat hasil kosong. | Tampil kategori populer dan buku terbaru, ditambah tombol tanya lewat WhatsApp. | Could |

### 5.3 Order lewat WhatsApp & marketplace

| ID | Cerita pengguna | Kriteria terima | Prioritas |
| --- | --- | --- | --- |
| F-ORD-01 | Sebagai pembaca, saya memesan lewat WhatsApp dari halaman buku. | Tombol membuka `wa.me/<nomor>?text=<pesan>` dengan pesan terisi otomatis berisi judul, ISBN, harga, dan kode halaman. Berupa tautan biasa, **tanpa WhatsApp Business API**. | Must |
| F-ORD-02 | Sebagai pembaca, saya tahu apa yang terjadi setelah menekan tombol. | Di dekat tombol ada keterangan singkat: admin membalas pada jam layanan, pembayaran lewat transfer, dan ongkir dihitung admin. Jam layanan dan tenggat balas tampil. | Must |
| F-ORD-03 | Sebagai pembaca, saya memilih beli di marketplace. | Tiap judul bisa punya tautan Tokopedia, Shopee, dan lainnya (keputusan no. 4); hanya tautan yang diisi admin yang tampil; tautan membuka tab baru dengan `rel="noopener"`. | Must |
| F-ORD-04 | Sebagai pembaca, saya memesan beberapa judul sekaligus. | Ada daftar pilihan ringan (tanpa harga total dan tanpa checkout) yang dirangkum menjadi satu pesan WhatsApp. | Should |
| F-ORD-05 | Sebagai admin order, saya mencatat pesanan yang masuk lewat WA. | Formulir admin: tanggal, nama, kontak, judul dan jumlah, harga, ongkir, total, kanal (WA/marketplace), status (Baru, Dibayar, Dikirim, Selesai, Batal), nomor resi, dan catatan. Ekspor CSV. Tidak ada otomatisasi status. | Must |
| F-ORD-06 | Sebagai pengelola, saya tahu tombol mana yang diklik. | Setiap klik WA dan marketplace tercatat sebagai event dengan judul buku dan halaman asal, tanpa menyimpan data pribadi. | Must |

Pesan WhatsApp otomatis (usulan teks):

> Halo, saya mau pesan buku:
> • *{judul}* ({penulis}) — Rp{harga}
> ISBN {isbn} · kode {kode}
> Jumlah: 1
>
> Mohon info ketersediaan dan ongkir ke {kota saya}.

### 5.4 Formulir & prospek

| ID | Cerita pengguna | Kriteria terima | Prioritas |
| --- | --- | --- | --- |
| F-FRM-01 | Sebagai pembeli institusi, saya meminta penawaran pembelian jumlah besar. | Formulir memuat nama lembaga, nama kontak, jabatan, email, telepon, judul dan jumlah, serta alamat kirim. Masuk ke email admin; tanggapan ≤ 2 hari kerja (Usulan). | Must |
| F-FRM-02 | Sebagai pembaca, saya menghubungi penerbit atau mengadu. | Formulir kontak dengan pilihan topik, termasuk pengaduan. Ada verifikasi anti-bot dan batas laju pengiriman. | Must |
| F-FRM-03 | Sebagai pembaca, saya minta dikabari saat ada terbitan baru. | Hanya email; kotak persetujuan terpisah, tidak tercentang otomatis; waktu dan versi teks persetujuan tercatat; tautan berhenti berlangganan di setiap email. | Should |
| F-FRM-04 | Sebagai pembaca, saya minta dikabari saat judul tersedia lagi. | Hanya dengan persetujuan eksplisit; satu email, lalu permintaan berakhir. | Could |

Semua formulir hanya meminta data yang benar-benar dipakai, dan data formulir tidak tercatat di log aplikasi.

### 5.5 Konten & halaman hukum

| ID | Cerita pengguna | Kriteria terima | Prioritas |
| --- | --- | --- | --- |
| F-KON-01 | Sebagai pembaca, saya mengetahui siapa penyelenggara situs. | Halaman Tentang memuat nama badan, alamat, kontak, dan (bila sudah ada) NIB penjual tercatat, dari tabel identitas di bagian Kepatuhan. | Must |
| F-KON-02 | Sebagai pembaca, saya membaca Kebijakan Privasi dan ketentuan penggunaan. | Dapat diedit admin, bertanggal versi, dan tertaut di footer. Kebijakan Privasi menyebut data yang dikumpulkan formulir, analitik, dan penyimpanan berkas. | Must |
| F-KON-03 | Sebagai pembaca, saya tahu cara memesan dan cara mengadu. | Halaman Cara Pesan menjelaskan alur WA dan marketplace, cara bayar, ongkir, dan kebijakan tukar barang rusak. Halaman Kontak memuat kontak, prosedur, dan tenggat tanggapan pengaduan. | Must |
| F-KON-04 | Sebagai pengelola, saya mengelola halaman statis dan berita. | Admin membuat dan mengubah halaman serta tulisan (mis. rilis buku baru, liputan, agenda). | Should |
| F-KON-05 | Sebagai pembaca, saya melihat profil penerbit dan cara mengirim naskah. | Halaman Tentang Penerbit dan halaman Kirim Naskah dengan syarat dan alamat tujuan. | Should |

### 5.6 Admin

| ID | Cerita pengguna | Kriteria terima | Prioritas |
| --- | --- | --- | --- |
| F-ADM-01 | Sebagai admin katalog, saya menambah, mengubah, dan mengarsipkan buku. | Buku tidak bisa terbit tanpa judul, penulis, harga, sampul, dan status ketersediaan. Berat dan dimensi wajib bila ingin dipakai Fase 2 (peringatan, bukan penghalang). | Must |
| F-ADM-02 | Sebagai admin katalog, saya mengubah status ketersediaan dengan cepat. | Tersedia, Stok terbatas, atau Habis — tanpa angka stok. Satu klik dari daftar buku. | Must |
| F-ADM-03 | Sebagai admin katalog, saya mengimpor banyak buku dari CSV. | Validasi per baris dan pratinjau galat; tidak ada perubahan bila masih ada galat. Templat CSV disertakan. | Should |
| F-ADM-04 | Sebagai admin, saya mengunggah sampul dan gambar pratinjau. | Ukuran dan format dibatasi; gambar dioptimalkan otomatis (WebP/AVIF) dengan ukuran responsif. | Must |
| F-ADM-05 | Sebagai super admin, saya mengelola pengguna admin. | Peran per pengguna, penanda PIC PDP, 2FA wajib bagi super admin, dan log audit yang dapat dicari. | Must |
| F-ADM-06 | Sebagai admin, saya menambahkan tautan marketplace per judul. | Satu kolom per marketplace aktif; tautan diperiksa formatnya; tautan rusak ditandai pada laporan bulanan. | Must |

### 5.7 Laporan

| ID | Cerita pengguna | Kriteria terima | Prioritas |
| --- | --- | --- | --- |
| F-LAP-01 | Sebagai pengelola, saya melihat judul mana yang paling diminati. | Tampil klik WA, klik marketplace, dan kunjungan per judul, per rentang tanggal WIB. | Must |
| F-LAP-02 | Sebagai pengelola, saya melihat rekap pesanan manual. | Rekap dari buku pesanan: jumlah pesanan, nilai, dan unit per judul; ekspor CSV. | Must |
| F-LAP-03 | Sebagai pengelola, saya melihat kata pencarian yang tidak menemukan hasil. | Daftar kata kunci tanpa hasil, sebagai petunjuk judul yang dicari tetapi belum ada atau salah penamaan. | Should |

---

## 6. Alur pesanan manual

Tidak ada status pesanan yang dijalankan sistem. Situs berhenti di langkah 2; sisanya dikerjakan manusia dan hanya dicatat di buku pesanan (F-ORD-05).

```
Pembaca menemukan buku (pencarian / katalog)
        │
        ├── Klik "Pesan via WhatsApp" ──► Chat WA dengan pesan terisi otomatis
        │        │
        │        ├─ Admin balas: ketersediaan + ongkir + total + rekening
        │        ├─ Pembeli transfer, kirim bukti
        │        ├─ Admin catat di buku pesanan: status Dibayar
        │        ├─ Admin kemas, kirim lewat kurir, catat resi: status Dikirim
        │        └─ Pembeli terima ──► status Selesai
        │
        └── Klik "Beli di Tokopedia/Shopee" ──► Transaksi sepenuhnya di marketplace
                 └─ Admin catat ringkasannya di buku pesanan (opsional, untuk rekap)
```

### Aturan kerja (bukan aturan sistem)

1. Satu nomor WhatsApp resmi untuk semua pesanan. Nomor pribadi tidak dipakai.
2. Admin menjawab pada jam layanan yang diumumkan di situs, dengan tenggat balas pada tabel Isian di bawah.
3. Harga di situs adalah harga jual penerbit. Bila harga marketplace berbeda, keterangan ini tampil di halaman buku.
4. Ongkir dihitung admin memakai berat buku ditambah kardus, lalu dikonfirmasi ke pembeli sebelum transfer.
5. Buku pesanan diisi paling lambat pada hari pesanan dibayar. Rekap bulanan dicetak atau diekspor untuk Keuangan.
6. Barang rusak atau salah kirim ditukar atau diganti sesuai hak pembeli menurut UU 8/1999; kebijakannya ditulis di halaman Cara Pesan.
7. Bukti transfer dan percakapan WA disimpan sesuai masa retensi; data pribadi pembeli tidak disebar di luar kebutuhan pengiriman.

### Parameter yang perlu diisi

| Parameter | Isian |
| --- | --- |
| Nomor WhatsApp resmi |  |
| Jam layanan |  |
| Tenggat balas WhatsApp | Usulan: ≤ 4 jam pada jam layanan |
| Tenggat tanggapan formulir institusi | Usulan: ≤ 2 hari kerja |
| Tenggat tanggapan pengaduan | Usulan: ≤ 2 hari kerja |
| Rekening penerima transfer (atas nama badan, bukan pribadi) |  |
| Marketplace aktif dan tautan tokonya |  |
| Kebijakan tukar barang rusak | Usulan: 7 hari kalender sejak diterima, ongkir balik ditanggung penerbit bila salah kirim atau rusak |
| Siapa yang memegang buku pesanan |  |

---

## 7. Kebutuhan non-fungsional

| Aspek | Kebutuhan | Target terukur |
| --- | --- | --- |
| Kinerja | Katalog dan halaman buku terasa cepat di HP 4G. | LCP < 2,0 dtk, INP < 200 ms, CLS < 0,1 pada persentil 75; halaman buku dirender di server atau statis. |
| SEO | Halaman buku, penulis, dan kategori dirender di server. | Data terstruktur `Book`/`Product` di HTML awal; `sitemap.xml` otomatis; URL ramah, canonical, 404 asli; Search Console tersambung. |
| Ketersediaan | Situs tetap hidup saat aplikasi lain di VPS bermasalah. | Uptime ≥ 99,5% per bulan; batas memori dan CPU per container; pemeliharaan di luar jam ramai. |
| Keamanan | HTTPS ujung ke ujung, 2FA admin, anti-bot dan batas laju pada formulir dan login. | Cloudflare Full (strict); 0 temuan High pada audit dependensi saat rilis; patch kritis ≤ 3 hari kerja. |
| Privasi data | Data pribadi minimal, tidak tercatat di log, hanya dibuka sesuai peran. | Tidak ada data kartu, alamat, atau nomor rekening pembeli yang disimpan situs. Permintaan hak subjek ≤ 3x24 jam (target internal). |
| Aksesibilitas | Memenuhi WCAG 2.1 AA. | 0 pelanggaran kritis pada pemindai otomatis; semua formulir bisa diselesaikan hanya dengan keyboard. |
| Mobile-first | Desain dimulai dari layar HP. | Tanpa gulir horizontal mulai lebar 360 px; area sentuh ≥ 44 px; tombol WA mudah dijangkau jempol. |
| Kapasitas | Tahan lonjakan saat peluncuran buku. | Halaman katalog dan buku di-cache; uji beban 10x trafik normal tanpa galat. |
| Backup | Backup harian basis data dan berkas, salinan offsite, backup sebelum deploy bermigrasi. | RPO ≤ 24 jam, RTO ≤ 4 jam; uji pulih tiap 6 bulan. |
| Retensi | Data disimpan sesuai aturan yang berlaku. | Buku pesanan dan bukti transfer: 10 tahun (data transaksi keuangan). Pesan formulir dan data langganan: 5 tahun atau sampai dicabut. |
| Lokalisasi | Rupiah, WIB, Bahasa Indonesia. | Harga tampil seperti Rp85.000; waktu tampil WIB, disimpan UTC. |
| Observabilitas | Galat cepat diketahui. | Galat frontend dan server tercatat; alarm bila situs tidak merespons atau formulir gagal terkirim. |
| Kompatibilitas | Berjalan di peramban populer. | Dua versi terakhir Chrome, Safari, Firefox, Edge, dan Chrome Android. |

---

## 8. Arsitektur & stack usulan

Mode sederhana tidak butuh mesin e-commerce. Dua opsi, dengan satu rekomendasi.

| Opsi | Isi | Kelebihan | Kekurangan |
| --- | --- | --- | --- |
| **A. Next.js + CMS berbasis Postgres** *(rekomendasi)* | Next.js (App Router, SSG + ISR) dengan CMS yang menyatu (mis. Payload) di satu container, basis data Postgres sendiri, berkas di Cloudflare R2 atau volume VPS | Admin katalog siap pakai untuk staf non-teknis; impor CSV, log audit, dan peran mudah dibuat; pola deploy sama dengan aplikasi survei; jalur naik ke Fase 2 pendek | Butuh Postgres dan sekitar 0,5–1 GB RAM |
| B. Situs statis + CMS berbasis Git | Astro/Next statis, konten di Markdown, admin lewat CMS git-based | Paling ringan dan paling murah; hampir tak mungkin tumbang | Alur kerja admin terasa teknis; log audit dan peran terbatas; impor CSV harus dibuat sendiri |

Rekomendasi: **Opsi A**, karena admin katalog akan dipakai staf penerbit, bukan pengembang, dan karena data buku yang sama akan dipakai ulang saat toko penuh dibangun.

Catatan penerapan:
- Container baru di VPS yang sudah ada, di belakang edge nginx yang melayani semua domain. Situs **tidak membuka port 80/443 sendiri**.
- Postgres sendiri untuk situs penerbit, terpisah dari basis data survei, agar backup dan pemulihan tidak saling mengganggu.
- Batas memori eksplisit per container (usulan: app 1 GB, Postgres 512 MB) agar aplikasi lain di VPS tidak terganggu.
- Sampul dan gambar pratinjau di Cloudflare R2 (kuota gratis 10 GB-bulan) atau volume lokal; bukti transfer dan data pesanan tidak disimpan di luar Indonesia sampai lokasi data dikonfirmasi.
- MinIO edisi komunitas tidak lagi dirawat, jadi jangan dipakai untuk situs ini meski sudah ada di VPS.
- Pola CI, image registry, backup, dan deploy mengikuti aplikasi survei yang sudah berjalan.

---

## 9. Batasan VPS (diperbarui dari pemeriksaan 9 Nov 2026)

Pemeriksaan langsung di server membatalkan asumsi pada PRD toko penuh (yang menyebut KVM 2, 8 GB RAM, 100 GB disk, 74% disk terpakai). Kondisi sebenarnya jauh lebih longgar:

| Hal | Hasil pemeriksaan |
| --- | --- |
| RAM | 31 GiB total; 2,2 GiB terpakai; 17 GiB bebas; 12 GiB buff/cache; **29 GiB available** |
| Swap | 0 B (tidak ada swap) |
| Disk `/` | 387 GB total; 14 GB terpakai; **373 GB bebas (4%)** |
| Container berjalan | 18, milik tiga aplikasi: `survei_*`, `survey-populicenter-*`, `wa_*` |
| Pemakaian memori terbesar | `survey-populicenter-backend` 225 MiB, `wa_backend` 208 MiB, `survey-populicenter-minio` 109 MiB |
| Total pemakaian container | sekitar 1,2 GiB |

Kesimpulan: kapasitas bukan hambatan untuk mode sederhana, dan tidak perlu naik paket VPS. Dua catatan tetap berlaku:

- **Tanpa swap**, lonjakan memori langsung memicu OOM killer, jadi batas memori per container wajib diisi dan alarm memori perlu dipasang.
- Beberapa container `wa_*` berjalan **tanpa batas memori** (limitnya tampil sebesar RAM host, 31,34 GiB). Satu kebocoran memori di sana bisa menjatuhkan container lain, termasuk situs penerbit. Sebaiknya diberi batas sebelum situs baru ikut masuk.
- Jumlah vCPU belum diperiksa; jalankan `nproc` untuk melengkapi.

---

## 10. Kepatuhan & legal (lingkup menyusut)

Bagian ini bukan nasihat hukum atau pajak dan perlu dikonfirmasi ke notaris, konsultan hukum, atau konsultan pajak. Mode sederhana memperkecil kewajiban, tetapi **tidak menghapusnya**: penjualan tetap terjadi, hanya pindah kanal.

| Kewajiban | Status di mode sederhana | Tindakan yang perlu | Isian (status/PIC) |
| --- | --- | --- | --- |
| Badan penjual tercatat (yayasan tidak berusaha langsung) | **Masih relevan, tapi tidak memblokir peluncuran situs** | Situs sebagai media informasi penerbit dapat berjalan atas nama Yayasan. Namun penjualan — lewat WA maupun marketplace — perlu badan dan rekening yang benar. Tentukan pemilik nomor WA, rekening penerima, dan akun marketplace, lalu konfirmasi ke notaris. |  |
| NIB dan KBLI | Diperlukan untuk kegiatan jual beli, bukan untuk menayangkan katalog | Terbitkan NIB atas nama badan penjual di OSS; tampilkan di halaman Tentang setelah terbit. |  |
| Perizinan Berusaha Bidang PMSE (PPMSE) | **Perlu konfirmasi** | Situs yang menawarkan barang dan mengarahkan pemesanan kemungkinan tetap tergolong penawaran secara elektronik walau transaksi diselesaikan di WA/marketplace. Konfirmasi ke konsultan sebelum situs dibuka; jangan berasumsi bebas. |  |
| Pendaftaran PSE Lingkup Privat | **Perlu konfirmasi, asumsikan wajib** | Daftar lewat OSS sebelum situs dipakai publik; laporkan perubahan domain, IP, dan lokasi data. Tanpa pendaftaran, akses situs dapat diputus. |  |
| Penawaran, konfirmasi, dan kontrak elektronik (PP 80/2019) | Beban jauh lebih kecil | Tidak ada kontrak elektronik di situs. Tetap sediakan identitas penjual, cara pemesanan, kebijakan tukar/retur, dan ketentuan penggunaan dalam Bahasa Indonesia. |  |
| Layanan pengaduan | Tetap wajib | Halaman Kontak memuat kontak, prosedur, tenggat penyelesaian, dan kontak Ditjen PKTN. |  |
| Info barang dan iklan tidak menyesatkan | Tetap wajib | Harga, ketersediaan, dan spesifikasi buku harus benar. Harga coret hanya untuk harga yang benar pernah berlaku. |  |
| Pelindungan data pribadi (UU 27/2022) | Tetap wajib, lingkup kecil | Kebijakan privasi, log persetujuan pemasaran, layanan hak subjek ≤ 3x24 jam, notifikasi insiden ≤ 3x24 jam, dan PIC PDP. Data yang diproses situs hanya isi formulir dan email langganan. |  |
| Data pribadi anak | Risiko kecil | Tidak ada checkout, jadi tidak ada pernyataan usia di situs. Formulir tidak meminta tanggal lahir. Tinjau ulang sebelum 16 Januari 2027. |  |
| Vendor dan transfer data ke luar negeri | Tetap perlu diinventarisasi | Daftar lokasi data: VPS, Cloudflare, penyimpanan berkas, pengirim email, alat analitik. Buat perjanjian pemrosesan data dan ungkapkan transfer lintas negara di Kebijakan Privasi. |  |
| Perlindungan konsumen dan retur (UU 8/1999) | Tetap berlaku pada penjualan WA | Jangan mencantumkan klausul "barang tidak dapat dikembalikan". Tulis kebijakan tukar barang rusak atau salah kirim di halaman Cara Pesan. |  |
| Retensi data dan arsip | Tetap berlaku | Buku pesanan dan bukti pembayaran: 10 tahun, arsip pembukuan disimpan di Indonesia. Data non-keuangan: 5 tahun. |  |
| PPN buku dan status PKP | Ditunda, tapi tidak hilang | Penjualan lewat WA dan marketplace tetap penghasilan badan. Konfirmasi kriteria buku bebas PPN dan ambang PKP ke konsultan pajak; marketplace punya kewajiban pemungutan sendiri. |  |
| Domain .id diutamakan | Berlaku | Pertimbangkan ekstensi .id (keputusan no. 1). |  |
| Label konten buatan AI | Berlaku bila ada | Beri label bila ada rekomendasi atau teks yang dibuat AI (mis. ringkasan sinopsis otomatis). |  |

### Identitas penyelenggara dan layanan pelanggan

| Hal | Isian |
| --- | --- |
| Nama badan penyelenggara situs |  |
| Nama badan penjual (bila berbeda) |  |
| Nama penerbit/merek di situs |  |
| Alamat |  |
| NIB (bila sudah ada) |  |
| NPWP |  |
| Email layanan pelanggan |  |
| Nomor WhatsApp resmi |  |
| Jam layanan |  |
| Tenggat tanggapan pengaduan | Usulan: ≤ 2 hari kerja |

---

## 11. Perkiraan biaya bulanan

Angka berikut tarif publik per 9 November 2026 dan perlu dikonfirmasi sebelum kontrak.

| Item | Biaya | Isian anggaran |
| --- | --- | --- |
| VPS | Rp0 tambahan — kapasitas yang ada cukup (lihat bagian 9) |  |
| Domain | Perlu konfirmasi setelah ekstensi dipilih (keputusan no. 1) |  |
| Cloudflare (CDN, WAF dasar) | Gratis |  |
| Penyimpanan berkas (Cloudflare R2) | Gratis sampai 10 GB-bulan; egress tanpa biaya |  |
| Email transaksional (formulir dan langganan) | Perlu konfirmasi setelah penyedia dipilih (keputusan no. 5); kuota gratis umumnya cukup |  |
| Monitor uptime | Gratis atau berbayar murah (keputusan no. 10) |  |
| Payment gateway | **Rp0 — tidak dipakai** |  |
| Agregator ongkir | **Rp0 — tidak dipakai** |  |
| Komisi marketplace | Hanya atas penjualan yang terjadi di marketplace, dipotong marketplace |  |
| Total tambahan per bulan | Praktis hanya domain |  |

Dibanding PRD toko penuh, yang hilang adalah langganan agregator, biaya per request tarif/tracking, biaya transaksi gateway, dan kemungkinan naik paket VPS.

---

## 12. Asumsi, batasan & risiko

### Asumsi

- Penjualan tahap ini memang ditangani manual, dan Yayasan menyediakan orang untuk menjawab WhatsApp pada jam layanan.
- Ada satu nomor WhatsApp resmi dan satu rekening penerima atas nama badan.
- Yayasan menyerahkan data katalog (judul, penulis, harga, sinopsis, sampul, ISBN, berat, dimensi) sebelum uji terima.
- Yayasan menyusun teks halaman hukum, lalu konsultan meninjaunya sebelum peluncuran.
- Pendaftaran PSE (dan PPMSE bila wajib) selesai sebelum situs dibuka untuk publik.
- Tim pengembang memakai ulang pola CI, registry image, backup, dan deploy dari aplikasi survei.

### Batasan

- Situs berjalan di VPS bersama tiga aplikasi lain, di belakang satu edge nginx; tidak boleh membuka port 80/443 sendiri.
- Tidak ada swap di VPS, sehingga batas memori per container wajib.
- Tanpa WhatsApp Business API, pesan otomatis hanya berupa tautan `wa.me`; tidak ada notifikasi status otomatis.
- Marketplace tidak menyediakan data penjualan ke situs, jadi rekap penjualan marketplace tetap manual.
- MinIO edisi komunitas tidak lagi dirawat dan tidak dipakai untuk situs ini.

### Risiko

| Risiko | Dampak | Kemungkinan | Mitigasi |
| --- | --- | --- | --- |
| Pesan WhatsApp tidak terjawab atau lambat | Tinggi | Tinggi | Satu nomor resmi, jam layanan tertulis, tenggat balas, dan pembagian giliran admin; pantau waktu tanggap tiap bulan |
| Pesanan tidak tercatat sehingga rekap keuangan bolong | Tinggi | Tinggi | Buku pesanan wajib diisi hari itu; rekap bulanan diperiksa Keuangan; ekspor CSV |
| Status PSE/PPMSE ternyata wajib dan belum diurus | Tinggi | Sedang | Mulai jalur legal pada minggu pertama; jangan buka situs ke publik sebelum status jelas |
| Harga di situs berbeda dengan harga marketplace | Sedang | Tinggi | Satu sumber harga di admin, keterangan di halaman buku, dan pemeriksaan tautan marketplace bulanan |
| Tautan marketplace mati atau produk dihapus | Sedang | Sedang | Pemeriksaan tautan otomatis dan laporan tautan rusak |
| Nomor WA pribadi dipakai lalu data pembeli tercampur | Sedang | Sedang | Hanya nomor resmi; WA Business terpisah dari perangkat pribadi |
| Container lain tanpa batas memori menjatuhkan situs | Sedang | Sedang | Pasang batas memori pada semua container dan alarm memori host |
| Konversi rendah karena tidak ada checkout | Sedang | Tinggi | Tombol WA jelas di setiap halaman buku, keterangan alur singkat, dan pantau rasio klik → pesanan sebagai dasar Fase 2 |
| Kebocoran data formulir | Sedang | Rendah | Data minimal, tanpa data pembayaran di situs, batas laju, dan prosedur notifikasi 3x24 jam |

---

## 13. Formulir keputusan terbuka

Dari 37 keputusan pada PRD toko penuh, hanya 14 yang perlu diputuskan sekarang. Sisanya ikut tertunda bersama Fase 2.

| No | Keputusan | Pilihan | Rekomendasi | Status | Keputusan akhir | PIC |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Nama domain dan ekstensi | .id, .co.id, .or.id, .com | Utamakan .id; .co.id dan .or.id butuh dokumen badan, sedangkan .id dapat dibeli lebih dulu | Belum diputuskan |  |  |
| 2 | Nama penerbit/merek di situs | Nama penerbit; nama toko tersendiri | Diisi Yayasan; identitas penyelenggara tetap tampil jelas | Belum diputuskan |  |  |
| 3 | Nomor WhatsApp resmi dan jam layanan | Nomor baru; nomor yang sudah ada | Nomor khusus dengan WhatsApp Business, terpisah dari perangkat pribadi | Belum diputuskan |  |  |
| 4 | Marketplace yang ditautkan | Tokopedia; Shopee; TikTok Shop; Blibli; tidak ada | Mulai dari yang tokonya sudah aktif; jangan tautkan toko yang belum terisi | Belum diputuskan |  |  |
| 5 | Pengirim email formulir dan langganan | SMTP hosting; Resend; penyedia lain | Resend, atau SMTP yang host-nya tidak diproksi Cloudflare | Belum diputuskan |  |  |
| 6 | Stack situs | Opsi A (Next.js + CMS Postgres); Opsi B (statis + CMS git) | Opsi A, karena admin dipakai staf non-teknis dan data dipakai ulang di Fase 2 | Belum diputuskan |  |  |
| 7 | Pratinjau halaman buku | Tidak ada; beberapa halaman berupa gambar | Beberapa halaman berupa gambar; jumlahnya diisi Yayasan | Belum diputuskan |  |  |
| 8 | Tampilan ketersediaan | Angka stok; Tersedia/Stok terbatas/Habis | Tersedia, Stok terbatas, atau Habis | Belum diputuskan |  |  |
| 9 | Alat analitik | Cloudflare Web Analytics; GA4; analitik self-hosted ringan; tanpa analitik | Analitik tanpa cookie pihak ketiga, dicatat di Kebijakan Privasi; event klik order dicatat di server | Belum diputuskan |  |  |
| 10 | Monitor uptime eksternal | Gratis; berbayar | Layanan dengan cek tiap 1–5 menit; dipilih tim IT | Belum diputuskan |  |  |
| 11 | Penyimpanan berkas | Cloudflare R2; volume lokal VPS; object storage di Indonesia | R2 untuk sampul publik; berkas yang memuat data pribadi menunggu konfirmasi lokasi data | Belum diputuskan |  |  |
| 12 | Tempat buku pesanan | Modul di panel admin; spreadsheet; software akuntansi | Modul di panel admin dengan ekspor CSV, agar rekap dan laporan judul jadi satu | Belum diputuskan |  |  |
| 13 | Badan dan rekening penerima pembayaran | Yayasan; PT milik yayasan; lainnya | Konfirmasi notaris sebelum menerima transfer; rekening atas nama badan, bukan pribadi | Belum diputuskan |  |  |
| 14 | Kebijakan tukar barang rusak atau salah kirim | Hanya cacat/rusak/salah kirim; termasuk berubah pikiran | Cacat, rusak, atau salah kirim; 7 hari kalender; ongkir balik ditanggung penerbit | Belum diputuskan |  |  |

Keputusan yang **ditunda bersama Fase 2**: payment gateway, agregator ongkir dan kurir aktif, checkout tamu, batas waktu bayar, e-book, pre-order, voucher, status PKP, lokasi gudang dan jadwal pickup, metode bayar aktif, waktu pemotongan stok, notifikasi WhatsApp lewat API, integrasi marketplace dua arah, pemicu pembuatan resi, diskon berperiode, pengadaan pemerintah, asuransi pengiriman, bundling, ambil sendiri, COD, ulasan, dasar royalti, dan software akuntansi.

---

## 14. Jalur naik ke toko penuh

Mode sederhana dirancang agar Fase 2 bukan pekerjaan dari nol.

**Yang dipertahankan utuh:** skema data buku (termasuk berat dan dimensi), penulis, kategori dan seri, URL `/buku/...` dan `/penulis/...` beserta peringkat pencariannya, halaman konten dan hukum, identitas penjual, akun admin dan peran, serta berkas sampul.

**Yang ditambahkan saat Fase 2:** mesin toko dan stok, keranjang dan checkout, payment gateway, agregator ongkir, akun pelanggan, retur dan refund, email per status pesanan, serta laporan penjualan dan royalti otomatis.

**Pemicu untuk membuka Fase 2** (usulan, diisi Yayasan):

| Pemicu | Ambang usulan | Isian |
| --- | --- | --- |
| Klik order per bulan | ≥ 150 |  |
| Pesanan manual per bulan | ≥ 60, atau beban admin > 10 jam/bulan |  |
| Badan penjual, NIB, NPWP, dan rekening badan | Lengkap |  |
| Status PSE dan izin PMSE | Terbit |  |
| Anggaran operasional bulanan toko penuh | Disetujui |  |

---

## 15. Persetujuan

Pengembangan dimulai setelah tiga peran pertama menulis Setuju atau Setuju dengan catatan. Tinjauan konsultan atas bagian Kepatuhan wajib selesai sebelum situs dibuka untuk publik.

| Hal | Isian |
| --- | --- |
| Versi dan tanggal dokumen yang disetujui |  |

| Peran | Nama | Tanggal | Keputusan | Catatan |
| --- | --- | --- | --- | --- |
| Pengurus Yayasan |  |  |  |  |
| Kepala Penerbit |  |  |  |  |
| Pengembang/IT |  |  |  |  |
| Konsultan hukum/pajak (tinjauan Kepatuhan & legal) |  |  |  |  |
