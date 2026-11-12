/**
 * Teks resmi halaman situs Yayasan Populi Indonesia (sumber tunggal untuk `npm run seed`
 * dan `npm run isi-konten`). Setelah tayang, teksnya diubah lewat panel admin; berkas ini
 * hanya isi awal.
 *
 * Aturan isi: identitas penerbit hanya Yayasan Populi Indonesia; nomor WhatsApp/telepon
 * tidak ditulis di teks (diambil dari Pengaturan dan tampil di Kontak, footer, dan halaman
 * buku); tidak ada klausul "barang tidak dapat dikembalikan" (UU 8/1999 Pasal 18).
 */
import type { Simpul } from "./teks";

export type DefHalaman = {
  slug: string;
  /** Slug lama halaman yang sama (dicari saat menimpa; slug diganti lewat draf). */
  slugLama?: string[];
  title: string;
  summary: string;
  footerOrder: number;
  /** Diisi untuk halaman kebijakan: tampil "Versi … · Berlaku sejak …". */
  policyVersion?: string;
  naskah: Simpul[];
};

export type FieldFormulir = {
  blockType: "text" | "textarea" | "email" | "number" | "select" | "radio" | "checkbox" | "date";
  name: string;
  label: string;
  required: boolean;
  width?: number;
  options?: { label: string; value: string }[];
};

export type DefFormulir = {
  title: string;
  /** Judul dan pengantar blok Formulir di halaman. */
  heading?: string;
  intro?: string;
  submitButtonLabel: string;
  purpose: string;
  consentLabel: string;
  retentionDays: number;
  confirmationMessage: string;
  fields: FieldFormulir[];
};

const TENTANG: DefHalaman = {
  slug: "tentang",
  title: "Tentang Kami",
  summary:
    "Yayasan Populi Indonesia adalah yayasan berbadan hukum di Jakarta yang menerbitkan buku kajian sosial, politik, dan kebijakan publik.",
  footerOrder: 10,
  naskah: [
    {
      t: "p",
      text: "Yayasan Populi Indonesia adalah badan hukum nirlaba berbentuk yayasan yang berkedudukan di Jakarta, disahkan dengan Keputusan Menteri Hukum dan Hak Asasi Manusia Republik Indonesia Nomor AHU-5475.AH.01.04.Tahun 2012. Yayasan Populi Indonesia menerbitkan buku di bidang sosial, politik, dan kebijakan publik. Situs ini adalah situs resmi Yayasan Populi Indonesia sekaligus katalog buku terbitannya.",
    },
    { t: "h2", text: "Kegiatan penerbitan" },
    {
      t: "p",
      text: "Yayasan Populi Indonesia menyelenggarakan kegiatan penelitian, pendidikan, pengembangan pengetahuan, dan penerbitan. Penerbitan buku dijalankan langsung oleh Yayasan Populi Indonesia sebagai penerbit. Buku yang kami terbitkan ditujukan untuk pembaca umum, yaitu:",
    },
    {
      t: "ul",
      items: [
        "buku yang dikembangkan dari hasil penelitian dan disajikan dalam bentuk buku;",
        "buku kajian sosial dan politik, antara lain tentang kepemimpinan, perilaku pemilih, pemilihan umum, dan demokrasi;",
        "buku analisis kebijakan publik;",
        "karya ilmiah lain yang sesuai dengan bidang kajian yayasan.",
      ],
    },
    { t: "h2", text: "Tanggung jawab penerbit" },
    {
      t: "p",
      text: "Yayasan Populi Indonesia bertanggung jawab atas penyuntingan, produksi, dan distribusi setiap buku terbitannya, termasuk pengajuan International Standard Book Number (ISBN). Pada sampul, halaman judul, dan halaman hak cipta setiap buku, penerbit tercantum sebagai Yayasan Populi Indonesia.",
    },
    { t: "h2", text: "Naskah" },
    {
      t: "p",
      text: "Kami menerima naskah yang sesuai dengan bidang terbitan di atas. Ketentuan dan cara pengirimannya ada di halaman [Kirim Naskah](/kirim-naskah).",
    },
    { t: "h2", text: "Katalog dan cara memperoleh buku" },
    {
      t: "p",
      text: "Semua buku terbitan Yayasan Populi Indonesia tercantum di [Katalog](/buku). Setiap judul memiliki halaman sendiri yang memuat sampul, judul, penulis, penerbit, ISBN, dan sinopsis. Buku dapat dipesan lewat WhatsApp resmi kami; tata caranya ada di halaman [Cara Pesan](/cara-pesan).",
    },
    { t: "p", text: "Identitas lengkap penerbit, termasuk alamat, kontak, dan legalitas, tercantum di bawah ini." },
  ],
};

const KIRIM_NASKAH: DefHalaman = {
  slug: "kirim-naskah",
  title: "Kirim Naskah",
  summary: "Syarat dan cara mengirim naskah ke Yayasan Populi Indonesia.",
  footerOrder: 70,
  naskah: [
    {
      t: "p",
      text: "Yayasan Populi Indonesia menerima naskah buku di bidang sosial, politik, dan kebijakan publik untuk pembaca umum. Laporan penelitian perlu lebih dulu disusun ulang menjadi buku.",
    },
    { t: "h2", text: "Yang perlu disiapkan" },
    { t: "ul", items: ["Ringkasan naskah 1–2 halaman", "Daftar isi", "Satu bab contoh", "Profil singkat penulis"] },
    {
      t: "p",
      // Alamat email naskah tidak ditulis di sini: blok "Alamat pengiriman naskah" di bawah
      // teks halaman mengambilnya dari Pengaturan (email redaksi, atau email penerbit).
      text: "Kirim ringkasan lewat halaman [Kontak](/kontak) dengan memilih jenis pesan Kirim naskah, atau lewat email yang tercantum di bawah ini. Kami akan membalas dengan cara mengirim naskah lengkap.",
    },
  ],
};

/* Halaman berikut disusun dari referensi topik (bukan teks) halaman kebijakan toko buku lain,
   disesuaikan dengan mode sederhana: pesanan lewat WhatsApp (marketplace menyusul), tanpa akun dan
   tanpa pembayaran di situs. Ditinjau dari sisi UU 8/1999, PP 80/2019, UU 27/2022. */

const CARA_PESAN: DefHalaman = {
  slug: "cara-pesan",
  title: "Cara Pesan",
  summary:
    "Cara memesan buku Yayasan Populi Indonesia lewat WhatsApp: harga, pembayaran transfer, ongkos kirim, dan buku rusak.",
  footerOrder: 20,
  policyVersion: "1.0",
  naskah: [
    {
      t: "p",
      text: "Situs ini adalah katalog buku terbitan Yayasan Populi Indonesia. Di sini tidak ada keranjang belanja, akun pengguna, atau pembayaran daring. Pemesanan dilayani lewat WhatsApp admin kami.",
    },
    {
      t: "h2",
      text: "Pesan lewat WhatsApp",
    },
    {
      t: "ol",
      items: [
        "Buka halaman buku yang Anda inginkan di [katalog](/buku), lalu ketuk tombol “Pesan via WhatsApp”. Pesan berisi judul dan harga buku akan terisi otomatis.",
        "Lengkapi pesan dengan kota tujuan dan jumlah eksemplar, lalu kirim.",
        "Admin kami membalas paling lama 4 jam pada jam layanan. Balasan berisi ketersediaan stok, ongkos kirim, total pembayaran, dan nomor rekening. Pesan yang masuk di luar jam layanan kami balas pada jam layanan berikutnya.",
        "Transfer sejumlah total tersebut ke rekening atas nama Yayasan Populi Indonesia paling lambat 2 x 24 jam setelah admin mengonfirmasi total.",
        "Kirim foto atau tangkapan layar bukti transfer melalui WhatsApp yang sama.",
        "Kami mengemas buku, menyerahkannya ke kurir, lalu mengirimkan nomor resi melalui WhatsApp. Dengan nomor itu Anda dapat melacak paket di situs atau aplikasi kurir.",
      ],
    },
    {
      t: "p",
      text: "Jam layanan serta nomor WhatsApp/telepon resmi kami tercantum di halaman [Kontak](/kontak). Anda juga dapat menghubungi nomor itu langsung tanpa melalui tombol. Sebutkan judul buku, jumlah eksemplar, dan kota tujuan.",
    },
    {
      t: "p",
      text: "Nama, nomor telepon, alamat pengiriman, rincian pesanan, dan bukti transfer Anda kami catat dalam buku pesanan internal. Cara kami menggunakan dan menyimpan data itu dijelaskan di [Kebijakan Privasi](/kebijakan-privasi).",
    },
    {
      t: "h2",
      text: "Toko resmi di marketplace",
    },
    {
      t: "p",
      text: "Bila sebagian judul kelak tersedia di toko resmi yayasan di marketplace, tautan tokonya akan tercantum di bagian bawah halaman ini dan di halaman buku. Belilah hanya di toko yang tautannya tercantum di situs ini.",
    },
    {
      t: "p",
      text: "Di marketplace, pemesanan, pembayaran, pengiriman, dan pengembalian mengikuti ketentuan marketplace tersebut. Harga di marketplace dapat berbeda dari harga penerbit di situs ini. Jika ada masalah dengan pesanan, ajukan keluhan melalui fitur komplain marketplace sebelum batas waktunya habis. Jika Anda menemui kendala, hubungi kami dan kami akan membantu.",
    },
    {
      t: "h2",
      text: "Harga",
    },
    {
      t: "p",
      text: "Harga yang tercantum di situs ini adalah harga jual penerbit dalam rupiah dan belum termasuk ongkos kirim. Ongkos kirim dihitung dari berat buku dan kemasan sesuai tarif kurir ke alamat tujuan. Kami menyampaikan ongkos kirim dan total pembayaran sebelum Anda membayar.",
    },
    {
      t: "h2",
      text: "Pembayaran",
    },
    {
      t: "ul",
      items: [
        "Pembayaran hanya melalui transfer bank ke rekening atas nama Yayasan Populi Indonesia. Nomor rekening dikirim admin bersama konfirmasi total.",
        "Kami tidak pernah meminta pembayaran ke rekening pribadi. Jika ada pihak yang meminta Anda mentransfer ke rekening atas nama perorangan, jangan lakukan dan laporkan kepada kami melalui [formulir pengaduan](/kontak?jenis=pengaduan).",
        "Batas pembayaran 2 x 24 jam sejak admin mengonfirmasi total. Setelah batas itu, pesanan dapat dibatalkan dan stok dilepas untuk pemesan lain.",
        "Pesanan kami proses setelah bukti transfer diterima dan pembayaran terkonfirmasi.",
        "Jika jumlah yang Anda transfer melebihi total, misalnya karena ongkos kirim ternyata lebih murah, kelebihannya kami kembalikan ke rekening Anda.",
      ],
    },
    {
      t: "h2",
      text: "Pengiriman",
    },
    {
      t: "p",
      text: "Kami mengirim melalui JNE, J&T Express, atau kurir lain sesuai kesepakatan dengan Anda. Jika stok tersedia, buku dikemas dan diserahkan ke kurir 1–3 hari kerja setelah pembayaran terkonfirmasi. Lama perjalanan paket mengikuti estimasi kurir untuk alamat tujuan.",
    },
    {
      t: "p",
      text: "Tuliskan alamat lengkap dan nomor telepon penerima yang aktif. Penerima dan alamat boleh berbeda dari pemesan. Ketentuan lengkap, termasuk asuransi pengiriman, ada di halaman [Pengiriman](/pengiriman).",
    },
    {
      t: "h2",
      text: "Jika buku rusak atau tidak sesuai",
    },
    {
      t: "p",
      text: "Jika buku tiba dalam keadaan rusak, cacat cetak atau jilid, tidak sesuai pesanan, atau paket tidak sampai, laporkan paling lambat 7 hari kalender setelah buku diterima. Untuk paket yang tidak sampai, hitungannya dimulai dari tanggal perkiraan tiba dari kurir. Untuk buku yang sudah diterima, sertakan foto buku dan kemasan.",
    },
    {
      t: "p",
      text: "Anda dapat memilih buku pengganti yang sama atau pengembalian dana penuh, yaitu harga buku ditambah ongkos kirim yang telah dibayar. Ongkos kirim pengembalian kami tanggung. Prosedur dan formulirnya ada di halaman [Pengembalian & Penukaran](/pengembalian).",
    },
    {
      t: "h2",
      text: "Pembelian oleh lembaga",
    },
    {
      t: "p",
      text: "Perpustakaan, sekolah, kampus, atau lembaga lain yang memerlukan penawaran harga dapat mengisi formulir di halaman [Pembelian institusi](/institusi).",
    },
    {
      t: "h2",
      text: "Pertanyaan dan keluhan",
    },
    {
      t: "p",
      text: "Pertanyaan tentang pesanan dapat Anda kirim melalui WhatsApp atau email penerbit@yayasanpopuliindonesia.org. Keluhan kami jawab paling lambat 2 hari kerja; tata caranya ada di [halaman Kontak](/kontak?jenis=pengaduan). Ketentuan jual beli selengkapnya, termasuk pembatalan pesanan, ada di [Syarat & Ketentuan](/syarat-ketentuan).",
    },
    {
      t: "p",
      text: "Tombol pemesanan lewat WhatsApp tersedia di bawah ini.",
    },
  ],
};

const PENGIRIMAN: DefHalaman = {
  slug: "pengiriman",
  title: "Pengiriman",
  summary:
    "Kurir, ongkos kirim, waktu proses, nomor resi, dan penanganan paket hilang atau rusak untuk pesanan buku Yayasan Populi Indonesia melalui WhatsApp.",
  footerOrder: 30,
  policyVersion: "1.0",
  naskah: [
    {
      t: "p",
      text: "Halaman ini menjelaskan pengiriman untuk pesanan melalui WhatsApp. Langkah memesan ada di halaman [Cara Pesan](/cara-pesan). Pembelian di toko resmi kami di marketplace, bila sudah tersedia, mengikuti aturan marketplace, seperti dijelaskan di bagian akhir halaman ini.",
    },
    {
      t: "h2",
      text: "Kurir",
    },
    {
      t: "p",
      text: "Kami mengirim buku melalui JNE atau J&T Express. Jika Anda ingin memakai kurir atau ekspedisi lain, sampaikan saat memesan. Kurir lain dapat kami gunakan atas kesepakatan bersama.",
    },
    {
      t: "h2",
      text: "Ongkos kirim",
    },
    {
      t: "p",
      text: "Harga buku di situs ini adalah harga jual penerbit dalam rupiah dan belum termasuk ongkos kirim. Ongkos kirim dihitung dari berat buku beserta kemasannya, sesuai tarif kurir ke alamat tujuan.",
    },
    {
      t: "p",
      text: "Admin menyampaikan ongkos kirim dan total pembayaran sebelum Anda membayar. Jika ongkos kirim ternyata lebih murah daripada yang sudah Anda bayar, selisihnya kami kembalikan ke rekening Anda.",
    },
    {
      t: "h2",
      text: "Waktu pemrosesan",
    },
    {
      t: "p",
      text: "Admin memastikan ketersediaan stok sebelum Anda membayar. Setelah pembayaran terkonfirmasi, pesanan kami kemas dan serahkan ke kurir dalam 1–3 hari kerja.",
    },
    {
      t: "h2",
      text: "Nomor resi",
    },
    {
      t: "p",
      text: "Setelah paket diserahkan ke kurir, admin mengirimkan nomor resi melalui WhatsApp. Gunakan nomor itu untuk melacak paket di situs web atau aplikasi kurir. Situs kami tidak menampilkan status pengiriman.",
    },
    {
      t: "h2",
      text: "Lama pengiriman",
    },
    {
      t: "p",
      text: "Lama perjalanan paket mengikuti perkiraan kurir untuk kota tujuan dan jenis layanan yang dipakai. Perkiraan itu ditetapkan kurir, sehingga kami tidak dapat menjamin tanggal tiba. Jika paket belum tiba setelah perkiraan itu lewat, hubungi kami dan kami akan menanyakannya ke kurir. Paket yang hilang tetap menjadi tanggung jawab kami, seperti dijelaskan di bagian paket hilang atau rusak.",
    },
    {
      t: "h2",
      text: "Alamat dan penerima",
    },
    {
      t: "p",
      text: "Tuliskan alamat lengkap agar paket tidak tertahan atau salah antar. Alamat yang lengkap memuat:",
    },
    {
      t: "ul",
      items: [
        "nama penerima;",
        "nama jalan, nomor rumah, serta RT/RW;",
        "kelurahan atau desa, kecamatan, kota atau kabupaten, dan provinsi;",
        "kode pos;",
        "nomor telepon penerima yang aktif dan dapat dihubungi kurir.",
      ],
    },
    {
      t: "p",
      text: "Penerima dan alamat tujuan boleh berbeda dari pemesan atau pembayar, misalnya untuk hadiah atau kiriman ke kantor. Periksa kembali alamat sebelum membayar. Jika ada perubahan, beri tahu admin sebelum paket diserahkan ke kurir.",
    },
    {
      t: "h2",
      text: "Asuransi pengiriman",
    },
    {
      t: "p",
      text: "Asuransi pengiriman bersifat pilihan. Jika Anda menginginkannya, sampaikan saat memesan. Biayanya mengikuti tarif kurir dan ditambahkan ke total pembayaran. Dengan atau tanpa asuransi, paket yang hilang atau rusak tetap kami tangani.",
    },
    {
      t: "h2",
      text: "Paket hilang atau rusak",
    },
    {
      t: "p",
      text: "Jika paket tidak tiba atau buku tiba dalam keadaan rusak, kami yang mengurus klaim ke kurir. Anda tidak perlu menghubungi kurir sendiri. Anda memilih buku pengganti yang sama atau pengembalian dana penuh, yaitu harga buku ditambah ongkos kirim yang sudah dibayar. Jika judul tersebut habis, dana Anda kami kembalikan.",
    },
    {
      t: "ol",
      items: [
        "Untuk buku yang rusak, foto buku dan kemasannya sebelum kemasan dibuang. Video saat membuka paket membantu, tetapi tidak wajib. Untuk paket yang tidak tiba, foto tidak diperlukan.",
        "Laporkan paling lambat 7 hari kalender sejak buku diterima. Untuk paket yang tidak tiba, 7 hari itu dihitung dari tanggal perkiraan tiba dari kurir.",
        "Kirim laporan, beserta foto jika ada, melalui nomor WhatsApp/telepon resmi kami di halaman [Kontak](/kontak) atau ke penerbit@yayasanpopuliindonesia.org. Formulir pengajuan juga tersedia di halaman [Pengembalian & Penukaran](/pengembalian).",
        "Admin mengonfirmasi klaim paling lambat 2 hari kerja.",
        "Buku pengganti kami kirim atau dana kami transfer paling lambat 7 hari kerja setelah klaim disetujui. Jika buku perlu dikirim kembali kepada kami, ongkos kirimnya kami tanggung.",
      ],
    },
    {
      t: "h2",
      text: "Pembelian di marketplace",
    },
    {
      t: "p",
      text: "Bila toko resmi kami di marketplace sudah tersedia, buku yang dibeli di sana dikirim menurut ketentuan marketplace tersebut, termasuk pilihan kurir, ongkos kirim, pelacakan, dan pengembalian. Jika ada masalah, gunakan fitur komplain di marketplace sebelum batas waktunya habis. Kami membantu bila diperlukan. Tautan tokonya akan tercantum di halaman [Cara Pesan](/cara-pesan).",
    },
  ],
};

const PENGEMBALIAN: DefHalaman = {
  slug: "pengembalian",
  title: "Pengembalian & Penukaran",
  summary:
    "Ketentuan dan cara mengajukan penukaran buku atau pengembalian dana untuk buku rusak, cacat cetak, salah kirim, atau paket yang tidak sampai.",
  footerOrder: 40,
  policyVersion: "1.0",
  naskah: [
    {
      t: "p",
      text: "Halaman ini menjelaskan kapan buku yang Anda beli dari Yayasan Populi Indonesia dapat ditukar atau dananya dikembalikan, serta cara mengajukannya. Ketentuan ini berlaku untuk pesanan langsung kepada kami lewat WhatsApp. Untuk pembelian di marketplace, lihat bagian “Pembelian di marketplace” di bawah.",
    },
    {
      t: "h2",
      text: "Yang dapat diajukan",
    },
    {
      t: "ul",
      items: [
        "Buku rusak saat diterima, misalnya sampul sobek, basah, atau terlipat.",
        "Cacat cetak atau jilid: halaman kosong, hilang, ganda, terbalik, atau lepas.",
        "Judul, edisi, atau jumlah buku tidak sesuai dengan pesanan.",
        "Paket tidak sampai.",
      ],
    },
    {
      t: "p",
      text: "Untuk alasan lain, misalnya Anda berubah pikiran setelah buku diterima, silakan hubungi kami. Kami akan membicarakan kemungkinan penyelesaiannya dengan Anda.",
    },
    {
      t: "h2",
      text: "Batas waktu pelaporan",
    },
    {
      t: "p",
      text: "Laporkan masalah paling lambat 7 hari kalender setelah buku Anda terima. Untuk paket yang tidak sampai, 7 hari kalender itu dihitung sejak tanggal perkiraan tiba dari kurir. Jika Anda tidak yakin kapan paket seharusnya tiba, tanyakan kepada admin.",
    },
    {
      t: "h2",
      text: "Bukti yang perlu disiapkan",
    },
    {
      t: "ul",
      items: [
        "Foto buku, termasuk bagian yang rusak atau cacat.",
        "Foto kemasan beserta label pengirimannya.",
        "Nama pemesan dan tanggal pesanan, agar catatan pesanan Anda mudah kami temukan.",
      ],
    },
    {
      t: "p",
      text: "Video saat membuka paket akan membantu, tetapi tidak wajib. Untuk paket yang tidak sampai, foto tidak diperlukan.",
    },
    {
      t: "h2",
      text: "Pilihan penyelesaian",
    },
    {
      t: "p",
      text: "Anda dapat memilih salah satu penyelesaian berikut.",
    },
    {
      t: "ul",
      items: [
        "Penggantian dengan buku yang sama.",
        "Pengembalian dana penuh, yaitu harga buku ditambah ongkos kirim yang sudah Anda bayar.",
      ],
    },
    {
      t: "p",
      text: "Jika judul tersebut sudah habis, kami mengembalikan dana. Bila kami meminta buku dikirim kembali, ongkos kirimnya kami tanggung. Dana kami transfer ke rekening yang Anda sebutkan lewat WhatsApp setelah pengajuan disetujui.",
    },
    {
      t: "p",
      text: "Untuk paket yang hilang atau rusak dalam perjalanan, klaim kepada kurir kami urus sendiri. Anda tidak perlu menghubungi kurir.",
    },
    {
      t: "h2",
      text: "Cara mengajukan",
    },
    {
      t: "ol",
      items: [
        "Isi formulir di bawah. Anda juga dapat langsung menghubungi nomor WhatsApp/telepon resmi kami di halaman [Kontak](/kontak) atau menulis ke penerbit@yayasanpopuliindonesia.org.",
        "Kirim foto buku dan kemasan lewat WhatsApp atau email. Sebutkan nama Anda dan judul buku.",
        "Admin memeriksa laporan dan mengonfirmasi pengajuan paling lambat 2 hari kerja. Jika ada data yang kurang, admin akan menanyakannya kepada Anda.",
        "Setelah pengajuan disetujui, buku pengganti kami kirim atau dana kami transfer paling lambat 7 hari kerja. Untuk buku pengganti, nomor resi kami kirim lewat WhatsApp.",
      ],
    },
    {
      t: "h2",
      text: "Formulir pengajuan",
    },
    {
      t: "p",
      text: "Formulir ini belum dapat menerima foto. Setelah mengirim formulir, kirim foto buku dan kemasan ke nomor WhatsApp resmi kami di halaman [Kontak](/kontak) atau ke penerbit@yayasanpopuliindonesia.org.",
    },
    {
      t: "form",
    },
    {
      t: "h2",
      text: "Pembelian di marketplace",
    },
    {
      t: "p",
      text: "Bila toko resmi kami di marketplace sudah tersedia dan Anda membeli di sana, gunakan fitur komplain atau pengembalian di marketplace tersebut sebelum batas waktunya habis. Prosesnya mengikuti aturan marketplace itu. Jika Anda menemui kendala, hubungi kami dan kami akan membantu.",
    },
    {
      t: "h2",
      text: "Jika penyelesaian belum memuaskan",
    },
    {
      t: "p",
      text: "Sampaikan pengaduan lewat [formulir pengaduan](/kontak?jenis=pengaduan). Pengaduan kami jawab paling lambat 2 hari kerja. Jika masalah belum juga selesai, Anda dapat menghubungi Direktorat Jenderal Perlindungan Konsumen dan Tertib Niaga (Ditjen PKTN) Kementerian Perdagangan. Kontaknya tercantum di halaman [Kontak](/kontak).",
    },
    {
      t: "p",
      text: "Ketentuan terkait ada di halaman [Cara Pesan](/cara-pesan), [Pengiriman](/pengiriman), dan [Syarat & Ketentuan](/syarat-ketentuan).",
    },
  ],
};

const KEBIJAKAN_PRIVASI: DefHalaman = {
  slug: "kebijakan-privasi",
  title: "Kebijakan Privasi",
  summary:
    "Data pribadi yang diproses Yayasan Populi Indonesia lewat situs, formulir, kabar terbitan, dan pesanan, lama penyimpanannya, serta cara memakai hak Anda.",
  footerOrder: 50,
  policyVersion: "1.0",
  naskah: [
    {
      t: "p",
      text: "Kebijakan ini menjelaskan cara Yayasan Populi Indonesia memproses data pribadi Anda saat Anda membuka situs yayasanpopuliindonesia.org, mengisi formulir, berlangganan kabar terbitan, atau memesan buku kami. Kebijakan ini mengacu pada Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi.",
    },
    {
      t: "p",
      text: "Situs ini adalah katalog buku. Di situs ini tidak ada akun pengguna, keranjang belanja, atau pembayaran daring. Pemesanan berlangsung lewat WhatsApp (dan lewat toko resmi kami di marketplace, bila kelak tersedia), seperti dijelaskan di halaman [Cara Pesan](/cara-pesan).",
    },
    {
      t: "h2",
      text: "Pengendali data",
    },
    {
      t: "p",
      text: "Pengendali data pribadi untuk situs dan layanan pemesanan ini adalah:",
    },
    {
      t: "ul",
      items: [
        "Yayasan Populi Indonesia, badan hukum yayasan berdasarkan Keputusan Menteri Hukum dan HAM RI Nomor AHU-5475.AH.01.04.Tahun 2012",
        "Alamat: Jalan Mampang Prapatan VIII No.38, Tegal Parang, Mampang Prapatan, Jakarta Selatan DKI Jakarta 12790",
        "Email: penerbit@yayasanpopuliindonesia.org",
        "Telepon kantor dan WhatsApp: tercantum di halaman [Kontak](/kontak)",
      ],
    },
    {
      t: "p",
      text: "Kami menunjuk petugas yang bertanggung jawab atas pelindungan data pribadi (PIC Pelindungan Data Pribadi). Cara menghubunginya ada di bagian akhir halaman ini. Identitas lengkap penerbit ada di halaman [Tentang Kami](/tentang).",
    },
    {
      t: "h2",
      text: "Data yang kami proses",
    },
    {
      t: "p",
      text: "Kami memproses data yang Anda berikan sendiri, data penerima yang diberikan pemesan, data pesanan yang diteruskan marketplace bila Anda membeli di toko resmi kami di sana, dan data teknis yang tercatat saat Anda membuka situs. Rinciannya per saluran sebagai berikut.",
    },
    {
      t: "h3",
      text: "Formulir Kontak, Institusi, dan email",
    },
    {
      t: "p",
      text: "Formulir pertanyaan, pengaduan, dan pengiriman naskah di halaman [Kontak](/kontak), serta formulir permintaan penawaran di halaman [pemesanan untuk institusi](/institusi), meminta data berikut:",
    },
    {
      t: "ul",
      items: [
        "nama",
        "alamat email",
        "nomor telepon atau WhatsApp (tidak wajib)",
        "nama lembaga, jabatan, daftar judul dan jumlah yang diminta, serta alamat pengiriman (khusus formulir institusi)",
        "isi pesan Anda",
      ],
    },
    {
      t: "p",
      text: "Jika Anda menulis langsung ke email kami, kami menerima nama, alamat email, isi pesan, dan lampiran yang Anda sertakan. Ringkasan naskah, contoh bab, dan profil penulis yang Anda kirim sesuai halaman [Kirim Naskah](/kirim-naskah) kami pakai hanya untuk menilai kelayakan terbit.",
    },
    {
      t: "h3",
      text: "Formulir khusus",
    },
    {
      t: "p",
      text: "Beberapa halaman memuat formulir khusus, misalnya formulir pengajuan penukaran atau pengembalian buku di halaman [Pengembalian & Penukaran](/pengembalian). Data yang diminta hanya kolom yang tampil di formulir itu, dan tujuan formulir tertulis di atas tombol kirim. Saat Anda mencentang kotak persetujuan, kami mencatat versi teks persetujuan dan waktu Anda menyetujuinya.",
    },
    {
      t: "h3",
      text: "Kabar terbitan",
    },
    {
      t: "p",
      text: "Jika Anda berlangganan kabar terbitan, kami menyimpan alamat email Anda beserta catatan persetujuan, yaitu waktu berlangganan dan versi teks persetujuan yang Anda setujui. Setiap email kabar terbitan memuat tautan untuk berhenti berlangganan.",
    },
    {
      t: "h3",
      text: "Pemesanan lewat WhatsApp",
    },
    {
      t: "p",
      text: "Saat Anda memesan lewat WhatsApp, kami mencatat data berikut di buku pesanan internal dan berkas pesanan yayasan:",
    },
    {
      t: "ul",
      items: [
        "nama dan nomor WhatsApp atau telepon",
        "alamat pengiriman, serta nama dan nomor telepon penerima jika penerimanya orang lain",
        "rincian pesanan: judul, jumlah, harga, ongkos kirim, dan nomor resi",
        "bukti transfer, termasuk nama pengirim dan jumlah yang tercantum di dalamnya",
        "foto buku dan kemasan, jika Anda mengajukan penukaran atau pengembalian",
        "nomor rekening Anda, hanya jika ada pengembalian dana",
      ],
    },
    {
      t: "p",
      text: "Jika Anda memberikan data orang lain sebagai penerima, pastikan orang tersebut tahu datanya dipakai untuk pengiriman.",
    },
    {
      t: "h3",
      text: "Pembelian di marketplace",
    },
    {
      t: "p",
      text: "Bila toko resmi kami di marketplace sudah tersedia, pembelian di sana diproses oleh marketplace tersebut sesuai kebijakan privasinya. Kami memakai data pesanan yang diteruskan marketplace hanya untuk memproses, mengirim, dan menangani keluhan atas pesanan itu.",
    },
    {
      t: "h3",
      text: "Klik tombol pesan",
    },
    {
      t: "p",
      text: "Kami menghitung klik pada tombol pesan di halaman buku. Yang dicatat hanya judul buku, saluran yang dipilih (WhatsApp atau marketplace), dan waktu klik. Kami tidak mencatat alamat IP atau penanda lain yang bisa mengenali Anda.",
    },
    {
      t: "h3",
      text: "Data teknis dan keamanan",
    },
    {
      t: "ul",
      items: [
        "Server dan proksi situs mencatat alamat IP, jenis peramban, dan halaman yang diminta. Catatan (log) ini dipakai untuk keamanan dan memperbaiki gangguan, lalu dirotasi otomatis dan hanya disimpan dalam waktu singkat.",
        "Untuk mencegah spam, formulir membatasi jumlah kiriman dari satu alamat IP. Alamat IP itu hanya ditahan sementara di memori server dan tidak disimpan.",
        "Formulir dapat memakai Cloudflare Turnstile, pemeriksaan antibot dari Cloudflare. Pemeriksaan ini membaca sinyal teknis dari peramban untuk membedakan pengunjung dari program otomatis.",
      ],
    },
    {
      t: "h2",
      text: "Tujuan dan dasar pemrosesan",
    },
    {
      t: "p",
      text: "Kami memproses data pribadi untuk tujuan berikut. Dasar pemrosesannya mengikuti UU 27/2022.",
    },
    {
      t: "ul",
      items: [
        "Menjawab pertanyaan, menilai naskah, dan menyiapkan penawaran untuk lembaga. Dasar: memenuhi permintaan Anda sebelum ada perjanjian, sesuai yang Anda minta saat mengirim pesan.",
        "Menangani pengaduan. Dasar: kewajiban hukum kami melayani pengaduan konsumen.",
        "Memproses pesanan, menerima pembayaran, mengirim buku, serta menangani penukaran dan pengembalian dana. Dasar: pelaksanaan perjanjian jual beli dengan Anda.",
        "Menyimpan catatan pesanan dan bukti pembayaran sebagai catatan keuangan yayasan. Dasar: kewajiban hukum di bidang pembukuan.",
        "Mengirim kabar terbitan. Dasar: persetujuan Anda, yang dapat Anda tarik kapan saja.",
        "Menjaga keamanan situs, mencegah spam, dan memperbaiki gangguan. Dasar: kepentingan yang sah untuk melindungi situs dan penggunanya.",
      ],
    },
    {
      t: "p",
      text: "Penghitungan klik tombol pesan tidak memakai data pribadi. Kami memakainya hanya untuk mengetahui saluran pemesanan yang paling banyak dipilih.",
    },
    {
      t: "p",
      text: "Kami tidak memakai data Anda untuk iklan atau untuk membuat profil pengunjung. Kami tidak menjual data pribadi. Jika kami ingin memakai data untuk tujuan lain, kami meminta persetujuan Anda lebih dulu.",
    },
    {
      t: "h2",
      text: "Lama penyimpanan",
    },
    {
      t: "ul",
      items: [
        "Pesan dari formulir Kontak dan Institusi, email yang Anda kirim, dan bahan naskah: selama diperlukan untuk menindaklanjuti, paling lama 5 tahun, lalu dihapus.",
        "Kiriman formulir khusus, seperti formulir pengembalian: dihapus otomatis setelah masa simpan formulir tersebut berakhir, umumnya 365 hari. Kiriman yang terdeteksi sebagai spam dihapus setelah 30 hari.",
        "Alamat email pelanggan kabar terbitan: selama Anda berlangganan. Setelah Anda berhenti berlangganan, alamat email, catatan persetujuan, dan waktu berhenti berlangganan kami simpan paling lama 5 tahun hanya sebagai bukti persetujuan dan penarikannya, dan tidak lagi dipakai untuk mengirim email.",
        "Catatan pesanan, bukti transfer, dan catatan keuangan lain: 10 tahun, sesuai kewajiban pembukuan.",
        "Log server dan proksi: dirotasi dan dihapus otomatis dalam waktu singkat.",
        "Alamat IP untuk pembatasan spam: hanya di memori sementara, tidak disimpan.",
        "Pilihan tema terang atau gelap: tersimpan di peramban Anda sampai Anda menghapusnya.",
      ],
    },
    {
      t: "p",
      text: "Setelah masa simpan berakhir, data kami hapus atau musnahkan.",
    },
    {
      t: "h2",
      text: "Pihak lain yang menerima data",
    },
    {
      t: "p",
      text: "Kami membagikan data hanya sejauh diperlukan untuk menjalankan layanan:",
    },
    {
      t: "ul",
      items: [
        "Penyedia layanan server (hosting): server awan yang disewa yayasan untuk menjalankan situs dan menyimpan kiriman formulir",
        "Penyedia penyimpanan cadangan: salinan cadangan basis data yang terenkripsi, untuk pemulihan bila terjadi kerusakan",
        "Penyedia layanan email: untuk menerima dan mengirim email ke alamat penerbit",
        "Cloudflare: jaringan pengiriman konten (CDN), perlindungan keamanan, dan Turnstile; seluruh lalu lintas ke situs, termasuk isi formulir, melewati jaringan ini",
        "WhatsApp (Meta): layanan percakapan untuk pemesanan dan tanya jawab, yang tunduk pada kebijakan privasi WhatsApp",
        "Marketplace: untuk pembelian di toko resmi kami bila sudah tersedia, sesuai kebijakan masing-masing marketplace",
        "Kurir, seperti JNE, J&T Express, atau ekspedisi lain yang disepakati: nama, alamat, dan nomor telepon penerima",
        "Bank: untuk menerima transfer dan mengembalikan dana",
      ],
    },
    {
      t: "p",
      text: "Kami membuka data kepada instansi pemerintah atau penegak hukum hanya jika diwajibkan oleh peraturan perundang-undangan.",
    },
    {
      t: "h3",
      text: "Pemrosesan di luar Indonesia",
    },
    {
      t: "p",
      text: "Cloudflare menjalankan jaringan global, sehingga data yang Anda kirim ke situs, termasuk alamat IP, informasi peramban, dan isi formulir, dapat diproses di pusat data Cloudflare di luar Indonesia. Layanan WhatsApp juga dijalankan Meta di infrastruktur global. Server, penyimpanan cadangan, dan layanan email yang kami pakai juga dapat berada di luar Indonesia. Kami hanya memakai penyedia yang menerapkan pengamanan data yang memadai, dan data yang dipindahkan tetap kami lindungi sesuai kebijakan ini.",
    },
    {
      t: "h2",
      text: "Cookie dan penyimpanan di peramban",
    },
    {
      t: "p",
      text: "Situs ini tidak memakai cookie iklan, pelacak, atau layanan analitik pihak ketiga.",
    },
    {
      t: "ul",
      items: [
        "Pilihan tema terang atau gelap disimpan di peramban Anda (localStorage). Data ini tidak dikirim ke server kami.",
        "Cloudflare dapat memasang cookie yang mutlak diperlukan untuk keamanan, misalnya untuk membedakan pengunjung dari bot. Cookie ini tidak dipakai untuk iklan.",
      ],
    },
    {
      t: "p",
      text: "Anda dapat menghapus atau memblokir penyimpanan ini lewat pengaturan peramban. Katalog tetap dapat dibuka, tetapi pemeriksaan keamanan pada formulir mungkin gagal jika cookie keamanan diblokir.",
    },
    {
      t: "h2",
      text: "Keamanan",
    },
    {
      t: "p",
      text: "Kami melindungi data dengan langkah teknis dan organisasi, antara lain:",
    },
    {
      t: "ul",
      items: [
        "koneksi terenkripsi (HTTPS) ke situs",
        "akses ke kiriman formulir dan buku pesanan dibatasi pada petugas yayasan yang menanganinya",
        "pemeriksaan antibot dan pembatasan jumlah kiriman pada formulir",
        "penghapusan otomatis kiriman formulir setelah masa simpannya berakhir",
      ],
    },
    {
      t: "p",
      text: "Kami tidak pernah meminta kata sandi, PIN, atau kode OTP Anda. Pembayaran hanya ke rekening atas nama Yayasan Populi Indonesia. Tolak permintaan transfer ke rekening pribadi yang mengatasnamakan kami, lalu laporkan melalui [formulir pengaduan](/kontak?jenis=pengaduan).",
    },
    {
      t: "h2",
      text: "Hak Anda",
    },
    {
      t: "p",
      text: "Sebagai subjek data pribadi, Anda berhak:",
    },
    {
      t: "ul",
      items: [
        "mendapat informasi tentang identitas kami, tujuan, dan dasar pemrosesan data Anda",
        "mengakses dan memperoleh salinan data pribadi Anda yang kami simpan",
        "memperbaiki data yang keliru atau tidak lengkap",
        "mengakhiri pemrosesan, serta meminta penghapusan atau pemusnahan data",
        "menarik persetujuan yang pernah Anda berikan",
        "mengajukan keberatan atau meminta pembatasan pemrosesan",
        "memperoleh dan menggunakan data pribadi Anda dalam format yang terstruktur dan umum dipakai",
        "mengajukan pengaduan atas pemrosesan data Anda",
        "menggugat dan menerima ganti rugi atas pelanggaran pemrosesan data pribadi Anda, sesuai peraturan perundang-undangan",
      ],
    },
    {
      t: "p",
      text: "Beberapa data wajib kami simpan menurut hukum, misalnya catatan keuangan pesanan selama 10 tahun. Data seperti itu tidak dapat kami hapus sebelum masa simpannya berakhir, tetapi pemakaiannya kami batasi untuk keperluan tersebut. Penarikan persetujuan tidak membatalkan pemrosesan yang sudah dilakukan sebelumnya.",
    },
    {
      t: "h3",
      text: "Cara mengajukan permintaan",
    },
    {
      t: "ol",
      items: [
        "Kirim email ke penerbit@yayasanpopuliindonesia.org dengan subjek “Data pribadi”, atau kirim pesan melalui formulir di halaman [Kontak](/kontak).",
        "Sebutkan hak yang ingin Anda gunakan dan data yang dimaksud, misalnya alamat email yang terdaftar atau nomor WhatsApp yang Anda pakai untuk memesan.",
        "Kami dapat meminta verifikasi identitas agar data tidak diberikan kepada orang yang salah, misalnya dengan meminta Anda membalas dari alamat email atau nomor WhatsApp yang sama.",
        "Kami menanggapi permintaan Anda paling lambat 3 x 24 jam sejak permintaan diterima.",
      ],
    },
    {
      t: "p",
      text: "Permintaan ini tidak dipungut biaya.",
    },
    {
      t: "p",
      text: "Untuk berhenti berlangganan kabar terbitan, pakai tautan berhenti berlangganan yang ada di setiap email.",
    },
    {
      t: "p",
      text: "Jika Anda tidak puas dengan tanggapan kami, sampaikan [pengaduan](/kontak?jenis=pengaduan) kepada kami. Anda juga berhak mengadu kepada lembaga yang berwenang mengawasi pelindungan data pribadi sesuai peraturan perundang-undangan.",
    },
    {
      t: "h2",
      text: "Jika terjadi kebocoran data",
    },
    {
      t: "p",
      text: "Jika terjadi kegagalan pelindungan data pribadi, misalnya kebocoran, kami memberi tahu Anda dan lembaga yang berwenang secara tertulis paling lambat 3 x 24 jam. Pemberitahuan itu memuat data yang terungkap, kapan dan bagaimana kejadiannya, serta langkah yang kami ambil untuk menangani dan memulihkannya.",
    },
    {
      t: "h2",
      text: "Data anak",
    },
    {
      t: "p",
      text: "Situs dan formulir kami tidak ditujukan untuk anak dan tidak menanyakan tanggal lahir. Jika Anda orang tua atau wali dan mengetahui anak Anda mengirim data kepada kami, hubungi kami dengan subjek “Data pribadi”. Kami menghapus data itu setelah memverifikasi permintaan Anda.",
    },
    {
      t: "h2",
      text: "Perubahan kebijakan",
    },
    {
      t: "p",
      text: "Kami dapat mengubah kebijakan ini jika cara kami memproses data atau peraturannya berubah. Versi terbaru selalu dimuat di halaman ini beserta tanggal berlakunya. Jika perubahan memperluas pemrosesan yang berdasar persetujuan, kami meminta persetujuan Anda lagi sebelum menerapkannya.",
    },
    {
      t: "h2",
      text: "Menghubungi kami",
    },
    {
      t: "p",
      text: "Kirim pertanyaan, permintaan, atau pengaduan tentang data pribadi ke penerbit@yayasanpopuliindonesia.org dengan subjek “Data pribadi”. Email dengan subjek ini ditangani PIC Pelindungan Data Pribadi kami. Anda juga dapat menghubungi nomor WhatsApp/telepon resmi kami di halaman [Kontak](/kontak) pada jam layanan yang tercantum di sana, atau mengirim surat ke alamat kantor di atas.",
    },
  ],
};

const SYARAT_KETENTUAN: DefHalaman = {
  slug: "syarat-ketentuan",
  slugLama: ["ketentuan-penggunaan"],
  title: "Syarat & Ketentuan",
  summary:
    "Ketentuan penggunaan situs dan pembelian buku Yayasan Populi Indonesia: pemesanan, pembayaran, pengiriman, pengembalian, hak cipta, dan pengaduan.",
  footerOrder: 60,
  policyVersion: "1.0",
  naskah: [
    {
      t: "p",
      text: "Ketentuan ini berlaku saat Anda memakai situs yayasanpopuliindonesia.org dan saat membeli buku dari Yayasan Populi Indonesia. Bacalah sebelum memesan. Bila ada bagian yang belum jelas, tanyakan kepada kami lebih dulu melalui halaman [Kontak](/kontak).",
    },
    {
      t: "h2",
      text: "Tentang situs dan pengelola",
    },
    {
      t: "p",
      text: "Situs ini dikelola oleh Yayasan Populi Indonesia, badan hukum yayasan yang berkedudukan di Jakarta. Yayasan disahkan dengan Keputusan Menteri Hukum dan HAM RI Nomor AHU-5475.AH.01.04.Tahun 2012. Yayasan memiliki NIB 0702230061964 dengan KBLI 58110 (penerbitan buku) dan berkantor di Jalan Mampang Prapatan VIII No.38, Tegal Parang, Mampang Prapatan, Jakarta Selatan DKI Jakarta 12790.",
    },
    {
      t: "p",
      text: "Situs ini berfungsi sebagai katalog buku terbitan yayasan. Tidak ada keranjang belanja, akun pengguna, atau pembayaran daring di situs ini. Pemesanan dilakukan melalui WhatsApp. Bila kelak tersedia toko resmi kami di marketplace, tautannya akan tercantum di situs ini. Identitas lengkap penerbit tercantum di halaman [Tentang Kami](/tentang).",
    },
    {
      t: "h2",
      text: "Informasi katalog",
    },
    {
      t: "ul",
      items: [
        "Keterangan buku di katalog, seperti judul, penulis, sampul, dan harga, kami susun sesuai buku yang kami jual. Jika buku yang Anda terima berbeda dari keterangannya, Anda berhak atas penukaran atau pengembalian dana sesuai bagian Pengembalian dan penukaran di bawah.",
        "Warna sampul di layar bisa sedikit berbeda dari hasil cetak.",
        "Harga tercantum dalam rupiah (Rp) dan merupakan harga jual penerbit. Harga belum termasuk ongkos kirim.",
        "Harga dan ketersediaan buku dapat berubah. Harga yang berlaku untuk pesanan Anda adalah harga yang dikonfirmasi admin. Jika harga itu berbeda dari harga di situs saat Anda memesan, admin memberitahukannya sebelum Anda membayar, dan Anda boleh membatalkan pesanan tanpa biaya.",
        "Bila sebagian judul kelak tersedia di toko resmi kami di marketplace, harga di sana dapat berbeda dari harga penerbit di situs ini.",
      ],
    },
    {
      t: "h2",
      text: "Pemesanan",
    },
    {
      t: "p",
      text: "Langkah-langkah pemesanan dijelaskan di halaman [Cara Pesan](/cara-pesan).",
    },
    {
      t: "ul",
      items: [
        "WhatsApp: tekan tombol “Pesan via WhatsApp” di halaman buku. Pesan berisi judul dan harga akan terisi otomatis. Tambahkan kota tujuan dan jumlah buku, lalu kirim.",
        "Marketplace (bila toko resmi kami sudah tersedia): pemesanan, pembayaran, pengiriman, dan pengembalian di marketplace mengikuti aturan marketplace tersebut.",
      ],
    },
    {
      t: "p",
      text: "Pesan WhatsApp pertama Anda adalah permintaan pemesanan. Pesanan kami terima setelah admin mengonfirmasi ketersediaan buku, ongkos kirim, dan total pembayaran. Sampai Anda membayar, Anda masih boleh mengubah atau membatalkan pesanan tanpa biaya.",
    },
    {
      t: "p",
      text: "Admin membalas pada jam layanan yang tercantum di halaman [Kontak](/kontak), paling lama 4 jam. Pesan yang masuk di luar jam layanan dibalas pada jam layanan berikutnya. Setiap pesanan dicatat admin dalam buku pesanan internal, jadi simpan percakapan WhatsApp Anda sebagai bukti pemesanan.",
    },
    {
      t: "p",
      text: "Lembaga yang ingin membeli dalam jumlah besar dapat meminta penawaran harga melalui halaman [Institusi](/institusi).",
    },
    {
      t: "h2",
      text: "Pembayaran",
    },
    {
      t: "ul",
      items: [
        "Pembayaran hanya melalui transfer bank ke rekening atas nama Yayasan Populi Indonesia. Nomor rekening diberikan admin bersama konfirmasi total pembayaran.",
        "**Kami tidak pernah meminta pembayaran ke rekening pribadi.** Jika ada yang meminta Anda mentransfer ke rekening atas nama perorangan, tolak permintaan itu dan laporkan kepada kami melalui nomor WhatsApp/telepon resmi kami di halaman [Kontak](/kontak) atau email penerbit@yayasanpopuliindonesia.org.",
        "Bayar paling lambat 2 x 24 jam setelah admin mengonfirmasi total. Setelah batas itu, pesanan dapat dibatalkan dan stok dilepas. Anda tetap dapat memesan ulang.",
        "Setelah membayar, kirim bukti transfer melalui WhatsApp. Pesanan diproses setelah pembayaran kami terima.",
        "Transfer antarbank kadang baru masuk beberapa waktu kemudian. Jika Anda sudah membayar dalam batas waktu dan mengirim buktinya, pesanan tidak dibatalkan karena keterlambatan dari pihak bank.",
        "Kelebihan bayar, misalnya karena ongkos kirim ternyata lebih murah, kami kembalikan ke rekening Anda.",
      ],
    },
    {
      t: "h3",
      text: "Pembatalan",
    },
    {
      t: "ul",
      items: [
        "Sebelum membayar, Anda dapat membatalkan pesanan kapan saja tanpa biaya.",
        "Setelah membayar tetapi sebelum buku diserahkan ke kurir, hubungi admin secepatnya. Pembayaran Anda kami kembalikan penuh.",
        "Kami dapat membatalkan pesanan jika buku ternyata tidak tersedia atau pembayaran tidak diterima dalam 2 x 24 jam. Jika Anda sudah membayar, seluruh pembayaran kami kembalikan.",
        "Setelah buku dikirim, ikuti ketentuan di halaman [Pengembalian & Penukaran](/pengembalian).",
      ],
    },
    {
      t: "h2",
      text: "Pengiriman",
    },
    {
      t: "p",
      text: "Buku dikirim melalui JNE, J&T Express, atau ekspedisi lain sesuai kesepakatan dengan Anda. Ongkos kirim dihitung dari berat buku dan kemasan menurut tarif kurir ke alamat tujuan. Besarnya kami sampaikan sebelum Anda membayar.",
    },
    {
      t: "p",
      text: "Buku dikemas dan diserahkan ke kurir 1–3 hari kerja setelah pembayaran terkonfirmasi, jika stok tersedia. Nomor resi kami kirim melalui WhatsApp. Lama pengiriman mengikuti estimasi kurir dan tidak dapat kami jamin.",
    },
    {
      t: "p",
      text: "Berikan alamat lengkap dan nomor telepon penerima yang aktif. Penerima dan alamat boleh berbeda dari pembayar. Asuransi pengiriman, penanganan paket hilang atau rusak, dan rincian lain dijelaskan di halaman [Pengiriman](/pengiriman).",
    },
    {
      t: "h2",
      text: "Pengembalian dan penukaran",
    },
    {
      t: "p",
      text: "Anda dapat mengajukan penukaran atau pengembalian dana jika buku rusak saat diterima, cacat cetak atau jilid, tidak sesuai pesanan, atau paket tidak sampai. Laporkan paling lambat 7 hari kalender sejak buku diterima, disertai foto buku dan kemasan. Untuk paket yang tidak sampai, hitungan dimulai dari tanggal perkiraan tiba dari kurir. Video saat membuka paket membantu, tetapi tidak wajib.",
    },
    {
      t: "p",
      text: "Anda memilih sendiri penyelesaiannya: diganti dengan buku yang sama, atau dana dikembalikan penuh termasuk ongkos kirim yang telah dibayar. Jika judul tersebut habis, dana kami kembalikan. Ongkos kirim pengembalian buku kami tanggung.",
    },
    {
      t: "p",
      text: "Admin mengonfirmasi pengajuan paling lambat 2 hari kerja. Buku pengganti kami kirim atau dana kami transfer paling lambat 7 hari kerja setelah pengajuan disetujui. Untuk alasan lain, misalnya Anda berubah pikiran, silakan hubungi kami untuk membicarakannya.",
    },
    {
      t: "p",
      text: "Ketentuan lengkap dan formulir pengajuan ada di halaman [Pengembalian & Penukaran](/pengembalian). Pembelian di marketplace diajukan melalui fitur komplain marketplace tersebut sesuai batas waktunya, dan kami membantu bila diperlukan.",
    },
    {
      t: "h2",
      text: "Hak cipta",
    },
    {
      t: "p",
      text: "Teks, foto, desain, dan logo di situs ini milik Yayasan Populi Indonesia atau dipakai dengan izin pemiliknya. Sampul dan isi buku dilindungi Undang-Undang Nomor 28 Tahun 2014 tentang Hak Cipta. Hak atas isi setiap buku diatur dalam perjanjian antara penulis dan penerbit.",
    },
    {
      t: "h3",
      text: "Yang boleh dilakukan",
    },
    {
      t: "ul",
      items: [
        "Mengutip sebagian isi buku atau situs untuk pendidikan, penelitian, karya ilmiah, laporan, kritik, atau tinjauan, dengan menyebutkan sumbernya secara lengkap dan tanpa merugikan kepentingan wajar penulis.",
        "Menampilkan gambar sampul dan keterangan buku untuk resensi, ulasan, atau promosi buku tersebut, dengan mencantumkan nama penerbit.",
      ],
    },
    {
      t: "h3",
      text: "Yang memerlukan izin tertulis",
    },
    {
      t: "ul",
      items: [
        "Menggandakan, memindai, atau menyebarkan isi buku, baik cetak maupun digital.",
        "Menerjemahkan, mengadaptasi, atau menerbitkan ulang isi buku.",
        "Memakai nama atau logo yayasan sehingga terkesan kegiatan Anda berasal dari atau didukung oleh yayasan.",
      ],
    },
    {
      t: "p",
      text: "Permintaan izin dapat dikirim ke penerbit@yayasanpopuliindonesia.org.",
    },
    {
      t: "h2",
      text: "Penggunaan situs dan formulir",
    },
    {
      t: "p",
      text: "Situs ini boleh Anda pakai untuk mencari informasi buku, memesan, bertanya, menyampaikan pengaduan, dan mengirim naskah. Saat memakai situs dan formulirnya, Anda tidak boleh:",
    },
    {
      t: "ul",
      items: [
        "mengisi data palsu atau data orang lain tanpa izin;",
        "mengirim spam, iklan, atau kiriman otomatis dalam jumlah besar;",
        "mengirim tautan atau berkas berbahaya, atau mencoba membobol, mengganggu, atau membebani situs;",
        "menyalin isi situs secara massal dengan program otomatis tanpa izin;",
        "mengirim konten yang melanggar hukum atau hak orang lain.",
      ],
    },
    {
      t: "p",
      text: "Formulir dapat memakai pemeriksaan antirobot Cloudflare Turnstile dan pembatasan jumlah kiriman. Kiriman yang jelas berupa spam atau melanggar ketentuan ini dapat kami abaikan dan hapus.",
    },
    {
      t: "p",
      text: "Naskah yang dikirim melalui halaman [Kirim Naskah](/kirim-naskah) tetap milik pengirimnya. Kami memakainya hanya untuk menilai kelayakan terbit. Pengiriman naskah tidak mewajibkan kami menerbitkannya.",
    },
    {
      t: "h2",
      text: "Layanan pihak lain",
    },
    {
      t: "p",
      text: "Sebagian proses pemesanan memakai layanan pihak lain. Penggunaannya tunduk pada syarat dan kebijakan masing-masing penyedia:",
    },
    {
      t: "ul",
      items: [
        "WhatsApp untuk percakapan pemesanan;",
        "marketplace, untuk pembelian di toko resmi kami bila sudah tersedia;",
        "kurir, seperti JNE dan J&T Express, untuk pengiriman;",
        "bank untuk transfer pembayaran;",
        "Cloudflare untuk keamanan situs dan pemeriksaan antirobot.",
      ],
    },
    {
      t: "p",
      text: "Jika gangguan pada layanan tersebut memengaruhi pesanan Anda, kami memberi tahu Anda dan membantu menyelesaikannya. Untuk paket yang hilang atau rusak, klaim ke kurir kami yang mengurus.",
    },
    {
      t: "h2",
      text: "Batas tanggung jawab",
    },
    {
      t: "p",
      text: "Kami bertanggung jawab atas buku yang kami jual sesuai ketentuan ini dan peraturan yang berlaku, termasuk Undang-Undang Nomor 8 Tahun 1999 tentang Perlindungan Konsumen. Tidak ada bagian ketentuan ini yang menghapus atau mengurangi hak Anda sebagai konsumen.",
    },
    {
      t: "p",
      text: "Kami tidak bertanggung jawab atas:",
    },
    {
      t: "ul",
      items: [
        "kerugian karena membayar ke rekening selain rekening atas nama Yayasan Populi Indonesia, atau karena bertransaksi dengan pihak yang mengaku sebagai kami di luar saluran resmi;",
        "situs yang sementara tidak dapat diakses, misalnya saat pemeliharaan atau gangguan jaringan;",
        "isi dan layanan situs pihak lain yang ditautkan dari situs ini.",
      ],
    },
    {
      t: "p",
      text: "Jika pesanan terhambat oleh keadaan di luar kendali kami, seperti bencana alam atau gangguan layanan kurir yang meluas, kami memberi tahu Anda secepatnya. Anda boleh memilih menunggu atau membatalkan pesanan dengan pengembalian dana penuh.",
    },
    {
      t: "h2",
      text: "Data pribadi",
    },
    {
      t: "p",
      text: "Kami memproses data pribadi yang Anda berikan melalui formulir, WhatsApp, atau email untuk melayani pesanan, menjawab pertanyaan dan pengaduan, serta mengirim kabar terbitan jika Anda berlangganan. Kami tidak menjual data pribadi. Jenis data, lama penyimpanan, dan hak Anda dijelaskan di [Kebijakan Privasi](/kebijakan-privasi). Permintaan terkait data pribadi, misalnya akses atau penghapusan, dapat Anda kirim ke penerbit@yayasanpopuliindonesia.org dengan subjek “Data pribadi”.",
    },
    {
      t: "h2",
      text: "Pengaduan dan sengketa",
    },
    {
      t: "ol",
      items: [
        "Sampaikan pengaduan melalui [formulir pengaduan](/kontak?jenis=pengaduan), nomor WhatsApp/telepon resmi kami di halaman [Kontak](/kontak), atau email penerbit@yayasanpopuliindonesia.org. Sebutkan nama, tanggal pesanan, judul buku, dan masalahnya.",
        "Kami menjawab paling lambat 2 hari kerja dan mengupayakan penyelesaian secara musyawarah.",
        "Jika musyawarah tidak menghasilkan kesepakatan, Anda dapat menempuh penyelesaian melalui Badan Penyelesaian Sengketa Konsumen (BPSK) atau pengadilan sesuai Undang-Undang Nomor 8 Tahun 1999.",
      ],
    },
    {
      t: "p",
      text: "Anda juga dapat mengadu kepada Direktorat Jenderal Perlindungan Konsumen dan Tertib Niaga (Ditjen PKTN) Kementerian Perdagangan. Kontak Ditjen PKTN tercantum di halaman [Kontak](/kontak).",
    },
    {
      t: "h2",
      text: "Hukum yang berlaku",
    },
    {
      t: "p",
      text: "Ketentuan ini dibuat dalam bahasa Indonesia dan tunduk pada hukum Republik Indonesia. Jika ada bagian yang dinyatakan tidak berlaku oleh peraturan atau putusan pengadilan, bagian lainnya tetap berlaku.",
    },
    {
      t: "h2",
      text: "Perubahan ketentuan",
    },
    {
      t: "p",
      text: "Kami dapat mengubah ketentuan ini bila cara pemesanan, layanan, atau peraturan berubah. Versi yang berlaku adalah versi yang dimuat di halaman ini. Pesanan yang sudah dikonfirmasi admin tetap mengikuti ketentuan yang berlaku saat konfirmasi diberikan.",
    },
  ],
};

/** Formulir di halaman Pengembalian & Penukaran. Judul dan pengantar sudah ada di naskah, jadi blok tanpa judul. */
export const FORMULIR_RETUR: DefFormulir = {
  title: "Pengajuan penukaran atau pengembalian",
  submitButtonLabel: "Kirim pengajuan",
  purpose:
    "Data di formulir ini kami gunakan hanya untuk memeriksa dan menyelesaikan pengajuan penukaran atau pengembalian Anda, termasuk menghubungi Anda lewat WhatsApp atau email. Data disimpan paling lama 365 hari, lalu dihapus otomatis. Foto belum dapat diunggah di sini. Kirim foto lewat WhatsApp atau email setelah formulir terkirim.",
  consentLabel:
    "Saya menyetujui Yayasan Populi Indonesia memproses data di formulir ini untuk menangani pengajuan saya, sesuai Kebijakan Privasi.",
  retentionDays: 365,
  confirmationMessage:
    "Pengajuan Anda sudah kami terima. Kirim foto buku dan kemasan ke nomor WhatsApp resmi kami (lihat halaman Kontak) atau ke penerbit@yayasanpopuliindonesia.org dengan menyebutkan nama dan judul buku. Admin akan mengonfirmasi pengajuan paling lambat 2 hari kerja.",
  fields: [
    {
      blockType: "text",
      name: "nama_lengkap",
      label: "Nama lengkap",
      required: true,
      width: 50,
    },
    {
      blockType: "text",
      name: "nomor_whatsapp",
      label: "Nomor WhatsApp",
      required: true,
      width: 50,
    },
    {
      blockType: "email",
      name: "email",
      label: "Email",
      required: false,
      width: 50,
    },
    {
      blockType: "select",
      name: "kanal_pembelian",
      label: "Tempat membeli",
      required: true,
      width: 50,
      options: [
        {
          label: "WhatsApp langsung ke penerbit",
          value: "whatsapp",
        },
        {
          label: "Lainnya (jelaskan di keterangan)",
          value: "lainnya",
        },
      ],
    },
    {
      blockType: "date",
      name: "tanggal_pesanan",
      label: "Tanggal pesanan",
      required: true,
      width: 50,
    },
    {
      blockType: "date",
      name: "tanggal_diterima",
      label: "Tanggal buku diterima, bila sudah sampai",
      required: false,
      width: 50,
    },
    {
      blockType: "text",
      name: "judul_buku",
      label: "Judul buku",
      required: true,
      width: 100,
    },
    {
      blockType: "number",
      name: "jumlah_bermasalah",
      label: "Jumlah buku yang bermasalah",
      required: true,
      width: 50,
    },
    {
      blockType: "select",
      name: "masalah",
      label: "Masalah",
      required: true,
      width: 50,
      options: [
        {
          label: "Rusak saat diterima",
          value: "rusak_saat_diterima",
        },
        {
          label: "Cacat cetak atau jilid",
          value: "cacat_cetak_jilid",
        },
        {
          label: "Salah judul, edisi, atau jumlah",
          value: "salah_judul_jumlah",
        },
        {
          label: "Paket tidak sampai",
          value: "paket_tidak_sampai",
        },
        {
          label: "Lainnya",
          value: "lainnya",
        },
      ],
    },
    {
      blockType: "radio",
      name: "penyelesaian",
      label: "Penyelesaian yang Anda inginkan",
      required: true,
      width: 100,
      options: [
        {
          label: "Ganti dengan buku yang sama",
          value: "ganti_buku",
        },
        {
          label: "Pengembalian dana",
          value: "pengembalian_dana",
        },
        {
          label: "Belum menentukan, ingin dibicarakan dulu",
          value: "diskusi",
        },
      ],
    },
    {
      blockType: "textarea",
      name: "keterangan",
      label: "Keterangan",
      required: false,
      width: 100,
    },
  ],
};

export const HALAMAN: DefHalaman[] = [
  TENTANG,
  CARA_PESAN,
  PENGIRIMAN,
  PENGEMBALIAN,
  KEBIJAKAN_PRIVASI,
  SYARAT_KETENTUAN,
  KIRIM_NASKAH,
];
