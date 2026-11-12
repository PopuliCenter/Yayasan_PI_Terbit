# Impor dan ekspor katalog (CSV)

Panduan untuk admin katalog Yayasan Populi Indonesia. Fitur ini memasukkan banyak buku, penulis, kategori, dan seri sekaligus dari berkas CSV, lalu mengekspornya kembali untuk diperbarui.

- **Siapa:** hanya **super admin** dan **admin katalog**. Admin order tidak bisa mengimpor atau mengekspor.
- **Di mana:** buka daftar koleksi (mis. **Katalog → Buku**), klik menu **⋯** di kanan atas daftar, lalu pilih **Impor** atau **Ekspor**. Riwayat semua impor ada di **Pengaturan → Riwayat Impor**.
- **Batas:** maksimal **500 baris per berkas**. Katalog yang lebih besar dipecah menjadi beberapa berkas.
- **Templat** (bisa diunduh dari situs):
  - `/templat/impor-buku.csv` (berisi dua baris contoh; hapus sebelum dipakai)
  - `/templat/impor-penulis.csv`
  - `/templat/impor-kategori.csv`
  - `/templat/impor-seri.csv`

---

## 1. Urutan kerja

Urutan ini penting: buku merujuk penulis (juga penyunting dan penerjemah), kategori, seri, dan sampul. Rujukan yang belum ada membuat barisnya ditolak.

1. **Unggah sampul lebih dulu.** Buka **Media → Unggah banyak** dan pilih semua berkas sampul sekaligus. Beri nama berkas yang jelas sebelum diunggah, mis. `sampul-membaca-suara-pemilih.jpg`. Nama inilah yang nanti ditulis di kolom `cover`.
   - Media menyimpan gambar sebagai WebP. Nama `.jpg` atau `.png` di CSV tetap cocok dengan berkas `.webp` yang tersimpan.
   - Bila nama berkas sudah dipakai, Media menambahkan akhiran (mis. `sampul-x-1.webp`). Salin nama yang tertera di Media.
2. **Impor kategori, seri, lalu penulis.** Gunakan templat masing-masing dengan mode **Buat dokumen baru**. Data ini langsung tayang. Penyunting dan penerjemah juga diimpor lewat templat penulis: satu entri per orang, perannya ditentukan di setiap buku.
3. **Impor buku.** Gunakan mode **Buat dokumen baru**. Buku masuk sebagai **draf** (kecuali kolom `_status` diisi `published`), jadi belum tampil di situs.
4. **Tinjau lalu tayangkan.** Di **Katalog → Buku**, saring status Draf, periksa setiap judul (sampul, sinopsis, harga), lalu centang beberapa judul sekaligus dan pilih **Terbitkan**. Buku yang ditayangkan wajib punya sampul, penulis atau penyunting, dan harga.
5. **Perbarui harga atau ketersediaan.** Buat CSV yang hanya berisi kolom `slug` dan kolom yang berubah, mis. `slug,price,availability`. Impor dengan mode **Perbarui dokumen yang ada** dan **Cocokkan berdasarkan kolom** = `slug`. Sel kosong berarti "jangan diubah", jadi sinopsis, relasi, dan kolom lain tetap utuh.
   - Hindari memperbarui massal buku yang sedang punya perubahan draf yang belum ditayangkan. Selesaikan atau buang dulu draf itu di panel admin.

## 2. Langkah impor di panel

1. Buka daftar koleksi tujuan, klik **⋯ → Impor**.
2. Pilih berkas CSV (atau JSON hasil ekspor).
3. Pilih **Mode Impor**:
   - **Buat dokumen baru** untuk data baru;
   - **Perbarui dokumen yang ada** untuk mengubah data yang sudah ada;
   - **Buat atau perbarui dokumen** untuk campuran keduanya.
   Untuk dua mode terakhir, isi **Cocokkan berdasarkan kolom** dengan `slug` (disarankan) atau `isbn13`. Kolom itu wajib ada di berkas.
4. Periksa **pratinjau**. Baris bermasalah sudah terlihat di sini, dengan kolom `__importIssues` berisi alasannya, sebelum apa pun disimpan.
5. Klik **Mulai Impor**, lalu baca **Ringkasan Impor** (bagian 5).

## 3. Aturan kolom

Baris pertama adalah nama kolom dan harus persis seperti di templat. Urutan kolom bebas, dan kolom yang tidak dipakai boleh dihapus.

### Buku (`impor-buku.csv`)

| Kolom | Isi | Contoh |
| --- | --- | --- |
| `slug` | Wajib. Huruf kecil dan tanda hubung, menjadi alamat halaman. Jangan diubah setelah tayang. | `membaca-suara-pemilih` |
| `title` | Wajib. Judul buku. | `Membaca Suara Pemilih` |
| `subtitle` | Subjudul, boleh kosong. | |
| `authors` | Wajib bila `editors` kosong. **Slug** penulis dipisah `\|`; urutan = urutan tampil. Penulis harus sudah diimpor. | `budi-santoso\|siti-rahma` |
| `editors` | Penyunting, untuk buku suntingan (bunga rampai). Slug dipisah `\|`, diambil dari daftar penulis. | `ratna-wulandari` |
| `translators` | Penerjemah, boleh kosong. Slug dipisah `\|`, diambil dari daftar penulis. | `dimas-hartono` |
| `isbn13` | Tulis **dengan tanda hubung**, atau format kolomnya sebagai Teks di Excel. Angka pemeriksa ikut diperiksa. | `978-623-00-0001-0` |
| `publishedYear` | Tahun, bilangan bulat 1900–2200. | `2026` |
| `pageCount`, `weightGram` | Bilangan bulat tanpa pemisah ribuan. | `312`, `420` |
| `widthCm`, `heightCm`, `thicknessCm` | Desimal dengan koma atau titik. | `14,5` |
| `language` | `id`, `en`, atau `other` (label Indonesia/Inggris/Lainnya juga diterima). | `id` |
| `edition` | Cetakan/edisi. | `Cetakan pertama` |
| `categories` | Slug kategori dipisah `\|`. | `politik-lokal\|demokrasi` |
| `series`, `seriesOrder` | Satu slug seri dan jilid ke- (bilangan bulat). | `seri-kajian`, `1` |
| `price` | Wajib. Rupiah bulat **tanpa "Rp" dan tanpa titik**. Nilai 1–999 ditolak karena hampir pasti salah tulis (85.000 terbaca 85). | `85000` |
| `listPrice` | Harga normal untuk harga coret. Isi **hanya** bila harga itu benar pernah berlaku (UU 8/1999), dan harus lebih besar dari `price`. | `95000` |
| `discountStart`, `discountEnd` | Tanggal `TTTT-BB-HH` (`HH/BB/TTTT` juga diterima). | `2026-12-01` |
| `availability` | `tersedia`, `terbatas`, `habis`, atau `segera` (label "Stok terbatas"/"Segera terbit" juga diterima). | `tersedia` |
| `cover` | Nama berkas sampul di Media (atau ID media). | `sampul-membaca-suara-pemilih.jpg` |
| `synopsis` | Teks biasa. Baris kosong = paragraf baru. | |
| `waOrderEnabled`, `featured` | `ya` atau `tidak` (juga `true`/`false`, `1`/`0`). | `ya` |
| `marketplaceLinks_0_platform`, `marketplaceLinks_0_url`, `marketplaceLinks_0_label` | Tautan marketplace pertama: platform `tokopedia`, `shopee`, `tiktok`, `blibli`, `lazada`, atau `lainnya`, dan URL lengkap `https://…`. Tautan kedua memakai `marketplaceLinks_1_…`, dan seterusnya. | `tokopedia`, `https://www.tokopedia.com/…` |
| `meta_title`, `meta_description` | Judul dan deskripsi untuk mesin pencari, boleh kosong. | |
| `_status` | `draft` (bawaan bila kosong) atau `published`. | `draft` |

### Penulis (`impor-penulis.csv`)

`slug`, `name` (wajib), `shortBio` (maks. 320 karakter), `bio` (teks biasa; baris kosong = paragraf baru), `photo` (nama berkas di Media), `_status`.

### Kategori (`impor-kategori.csv`)

`slug`, `title` (wajib), `description`, `order` (bilangan bulat; angka kecil tampil lebih dulu).

### Seri (`impor-seri.csv`)

`slug`, `title` (wajib), `description`, `cover` (nama berkas gambar seri di Media).

## 4. Jebakan Excel dan spreadsheet

- **Pemisah titik koma.** Excel dengan pengaturan wilayah Indonesia menyimpan CSV dengan `;`, padahal impor hanya membaca CSV yang dipisah koma. Berkas seperti itu langsung ditolak (juga di pratinjau) dengan pesan "Berkas memakai pemisah titik koma (;). Simpan ulang sebagai CSV UTF-8 (dipisah koma) lalu impor lagi." dan tidak ada data yang tersimpan. Simpan berkas dengan salah satu cara berikut:
  - Google Sheets: **File → Download → Comma-separated values (.csv)**;
  - LibreOffice: **Simpan sebagai → CSV**, set karakter `UTF-8` dan pemisah `,`;
  - Excel: **Save As → CSV UTF-8 (Comma delimited)**, dan pastikan *List separator* Windows berupa `,`.
- **ISBN menjadi `9,78623E+12`.** Excel menganggap ISBN tanpa tanda hubung sebagai angka dan memotongnya. Tulis ISBN dengan tanda hubung, atau format kolom ISBN sebagai **Teks** sebelum mengetik. ISBN yang terpotong ditolak dengan pesan yang menyebut Excel.
- **Harga `85.000`.** Titik dibaca sebagai desimal, jadi tertulis 85. Tulis `85000`. Format sel "Mata uang" atau "Akuntansi" juga bisa menambahkan titik; pakai format **Umum/Angka tanpa pemisah ribuan**.
- **Tanggal.** Excel bisa mengubah tanggal menjadi angka seri atau format lain. Format kolom tanggal sebagai Teks dan tulis `2026-12-01`.
- **Huruf beraksen dan tanda kutip** aman bila berkas disimpan sebagai UTF-8.
- **Sel berisi koma atau baris baru** (mis. sinopsis) harus diapit tanda kutip ganda. Spreadsheet melakukannya otomatis saat menyimpan CSV.
- Jangan menghapus baris judul kolom, dan jangan menambahkan baris keterangan di atasnya.

## 5. Membaca Ringkasan Impor

Setelah impor selesai, dokumen impor menampilkan **Status** dan **Ringkasan Impor**:

- **Status**:
  - **Selesai**: semua baris masuk;
  - **Sebagian berhasil**: sebagian baris ditolak;
  - **Gagal**: tidak ada baris yang masuk, atau berkas tidak terbaca.
- **Data baru** dan **Data diperbarui**: jumlah dokumen yang dibuat dan diubah.
- **Jumlah baris** dan **Baris bermasalah**.
- **Rincian baris bermasalah**: satu entri per baris yang ditolak, berisi:
  - `row`: nomor baris **data**. Baris judul tidak dihitung, jadi baris 1 = baris ke-2 di spreadsheet;
  - `error`: alasannya. Pesan yang diawali "Baris ditolak:" berasal dari pemeriksaan katalog dan menyebut kolom yang perlu diperbaiki;
  - `data`: isi baris setelah dibaca.

Pesan lain yang mungkin muncul:

- "Kolom tidak dikenal: …" berarti judul kolom salah eja (huruf besar/kecil berpengaruh, mis. `isbn13`, bukan `ISBN`) atau tidak ada di koleksi itu. Baris ditolak agar nilainya tidak hilang diam-diam. Samakan judul kolom dengan templat.

- Pesan berbahasa Inggris seperti "The following field is invalid: cover" datang dari validasi bawaan Payload. Biasanya kolom wajib untuk buku yang ditayangkan masih kosong; isi kolom itu atau impor sebagai draf.
- Pada mode Buat, pesan bahwa `slug` atau `isbn13` tidak valid biasanya berarti nilai itu sudah dipakai data lain (keduanya harus unik). Gunakan mode Perbarui bila memang ingin mengubah data itu.

Baris yang berhasil tetap tersimpan. Perbaiki hanya baris yang ditolak di spreadsheet, simpan sebagai berkas baru yang berisi baris itu saja, lalu impor lagi.

## 6. Ekspor

**⋯ → Ekspor** di daftar koleksi menghasilkan CSV atau JSON yang langsung diunduh. Berkas ekspor tidak disimpan di server.

- Di CSV, penulis, penyunting, penerjemah, kategori, dan seri ditulis sebagai **slug**, dan sampul sebagai **nama berkas**. Hasil ekspor bisa diubah lalu diimpor ulang dengan mode Perbarui, dicocokkan dengan `slug`.
- Sinopsis dan teks kaya lain diekspor sebagai JSON (diawali `{"root":…`) agar format tebal, miring, dan daftar tetap utuh saat diimpor ulang. Jangan menyunting JSON itu dengan tangan. Untuk mengganti sinopsis, timpa selnya dengan teks biasa.
- Hanya data yang boleh Anda lihat yang ikut terekspor.

## 7. Keamanan data

- Berkas impor tersimpan di server sebagai riwayat dan hanya bisa dibuka super admin dan admin katalog. Jangan memasukkan data pribadi selain yang memang tampil di situs (mis. biografi penulis).
- Hanya koleksi katalog (buku, penulis, kategori, seri) yang bisa diimpor atau diekspor lewat fitur ini.
