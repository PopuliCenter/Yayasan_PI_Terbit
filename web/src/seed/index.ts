/**
 * Data contoh untuk pengembangan lokal.
 *
 *   npm run seed            # isi bila masih kosong
 *   SEED_RESET=1 npm run seed   # hapus isi katalog lalu isi ulang
 *
 * SEMUA DATA DI SINI FIKTIF. Nama penulis, judul, dan ISBN dibuat untuk pengujian
 * dan wajib diganti data asli Yayasan sebelum situs dibuka untuk publik.
 * Teks halaman hukum adalah draf kerja yang harus ditinjau konsultan (PRD bagian 10).
 */
import { getPayload } from "payload";
import config from "../payload.config";
import { makeCover } from "./cover";
import { doc, ol, p } from "./lexical";
import { terapkanKonten } from "./konten/terapkan";

/** ISBN contoh fiktif dengan angka pemeriksa yang benar: 978-623-9999-NN-C. */
const sampleIsbn = (n: number): string => {
  const base = `9786239999${String(n).padStart(2, "0")}`;
  const sum = base.split("").reduce((acc, d, i) => acc + Number(d) * (i % 2 === 0 ? 1 : 3), 0);
  const check = (10 - (sum % 10)) % 10;
  return `978-623-9999-${String(n).padStart(2, "0")}-${check}`;
};

// Data contoh fiktif tidak boleh masuk lingkungan yang diindeks (produksi). Panduan N20.
if (process.env.SITE_INDEXABLE === "true" && process.env.SEED_FORCE !== "1") {
  console.error("[seed] DITOLAK: SITE_INDEXABLE=true (produksi). Seed hanya untuk lokal dan staging.");
  process.exit(1);
}

const payload = await getPayload({ config });
const log = (msg: string) => payload.logger.info(`[seed] ${msg}`);
const SAMPLE_NOTE = "DATA CONTOH — hapus sebelum tayang.";

const RESET = process.env.SEED_RESET === "1";
const CONTENT_COLLECTIONS = [
  "order-clicks",
  "orders",
  "posts",
  "books",
  "series",
  "authors",
  "categories",
  "pages",
  "media",
] as const;

if (RESET) {
  for (const collection of CONTENT_COLLECTIONS) {
    await payload.delete({ collection, where: { id: { exists: true } }, overrideAccess: true });
    log(`kosongkan ${collection}`);
  }
}

const existingBooks = await payload.count({ collection: "books", overrideAccess: true });
if (existingBooks.totalDocs > 0 && !RESET) {
  log(`katalog sudah berisi ${existingBooks.totalDocs} buku; lewati. Pakai SEED_RESET=1 untuk mengisi ulang.`);
  process.exit(0);
}

/* ------------------------------- admin ---------------------------------- */

const adminEmail = process.env.SEED_ADMIN_EMAIL;
const adminPassword = process.env.SEED_ADMIN_PASSWORD;
if (adminEmail && adminPassword) {
  const found = await payload.find({
    collection: "users",
    where: { email: { equals: adminEmail } },
    overrideAccess: true,
    limit: 1,
  });
  if (found.docs.length === 0) {
    await payload.create({
      collection: "users",
      overrideAccess: true,
      data: {
        email: adminEmail,
        password: adminPassword,
        name: "Super Admin (lokal)",
        role: "super-admin",
        isPdpOfficer: true,
      },
    });
    log(`akun super admin dibuat: ${adminEmail} (kata sandi ada di .env)`);
  }
}

/* ------------------------------ pengaturan ------------------------------ */

await payload.updateGlobal({
  slug: "settings",
  overrideAccess: true,
  data: {
    siteName: "Yayasan Populi Indonesia",
    tagline: "Menerbitkan buku kajian sosial, politik, dan kebijakan publik untuk pembaca umum.",
    legalEntityName: "Yayasan Populi Indonesia",
    legalBasis:
      "Keputusan Menteri Hukum dan Hak Asasi Manusia Republik Indonesia Nomor AHU-5475.AH.01.04.Tahun 2012",
    publisherResponsible: "[Nama, jabatan — isi dari Pengaturan Situs]",
    address: "[Alamat kantor — isi dari Pengaturan Situs]",
    // Placeholder yang sengaja tidak valid sebagai nomor HP, agar uji klik tidak mengirim pesan ke siapa pun.
    waNumber: "620000000000",
    email: "penerbit@contoh.test",
    serviceHours: "Senin–Jumat, 09.00–17.00 WIB",
    waResponseTarget: "maksimal 4 jam pada jam layanan",
    complaintResponseTarget: "maksimal 2 hari kerja",
    orderStepsNote:
      "Admin membalas pada jam layanan, lalu mengirim total harga dan ongkir ke kota Anda. Pembayaran lewat transfer ke rekening atas nama badan.",
    pktnContact: "[Isi kontak resmi Ditjen PKTN setelah teks dikonfirmasi — PRD bagian 10]",
    marketplaceStores: [
      { platform: "tokopedia", url: "https://www.tokopedia.com/" },
      { platform: "shopee", url: "https://shopee.co.id/" },
    ],
    defaultMetaDescription:
      "Katalog resmi buku terbitan Yayasan Populi Indonesia: kajian politik, demokrasi, dan kebijakan publik. Pesan lewat WhatsApp.",
  },
});
log("pengaturan situs diisi");

/* ------------------------------ taksonomi ------------------------------- */

const categoryData = [
  { title: "Politik & Demokrasi", description: "Kajian partai, pemilu, perilaku pemilih, dan kualitas demokrasi di Indonesia." },
  { title: "Kebijakan Publik", description: "Analisis dan evaluasi kebijakan di tingkat pusat dan daerah." },
  { title: "Metodologi Survei", description: "Panduan merancang, menjalankan, dan membaca survei opini publik." },
  { title: "Sosial & Budaya", description: "Dinamika masyarakat, identitas, dan perubahan sosial." },
  { title: "Ekonomi Politik", description: "Hubungan antara kekuasaan, pasar, dan kesejahteraan." },
];
const categories: Record<string, number> = {};
for (const [i, c] of categoryData.entries()) {
  const created = await payload.create({
    collection: "categories",
    overrideAccess: true,
    data: { ...c, slug: "", order: (i + 1) * 10 },
  });
  categories[c.title] = created.id;
}
log(`${categoryData.length} kategori`);

const series = await payload.create({
  collection: "series",
  overrideAccess: true,
  data: {
    title: "Demokrasi Lokal",
    slug: "",
    description: "Seri kajian tentang pilkada, birokrasi daerah, dan partisipasi warga di tingkat lokal.",
  },
});

const authorData = [
  {
    name: "Ratna Wulandari",
    shortBio: "Peneliti kebijakan publik dengan fokus tata kelola pemerintahan daerah dan desentralisasi.",
  },
  {
    name: "Bima Prasetyo",
    shortBio: "Peneliti survei dan statistik terapan; menulis tentang metode pengambilan sampel dan kualitas data opini publik.",
  },
  {
    name: "Sekar Ayuningtyas",
    shortBio: "Sosiolog yang meneliti identitas, media sosial, dan polarisasi politik di kalangan pemilih muda.",
  },
  {
    name: "Hendra Gunawan",
    shortBio: "Ekonom politik; meneliti hubungan anggaran daerah, kemiskinan, dan pelayanan publik.",
  },
  {
    name: "Dimas Hartono",
    shortBio: "Penerjemah naskah ilmu sosial dari bahasa Inggris dan Belanda.",
  },
];
const authors: Record<string, number> = {};
for (const a of authorData) {
  const created = await payload.create({
    collection: "authors",
    overrideAccess: true,
    draft: false,
    data: {
      ...a,
      slug: "",
      _status: "published",
      bio: doc(
        p(a.shortBio),
        p("Profil ini adalah data contoh untuk pengembangan situs dan akan diganti dengan profil penulis yang sebenarnya."),
      ),
    },
  });
  authors[a.name] = created.id;
}
log(`${authorData.length} penulis`);

/* --------------------------------- buku --------------------------------- */

type BookSeed = {
  title: string;
  subtitle?: string;
  /** Boleh kosong untuk buku suntingan; isi `editors`. */
  authors: string[];
  editors?: string[];
  translators?: string[];
  categories: string[];
  isbn: string;
  year: number;
  pages: number;
  price: number;
  listPrice?: number;
  availability: "tersedia" | "terbatas" | "habis" | "segera";
  bg: string;
  accent: string;
  synopsis: string[];
  toc: string[];
  series?: number;
  featured?: boolean;
  marketplace?: boolean;
  daysAgo: number;
};

const books: BookSeed[] = [
  {
    title: "Membaca Suara Pemilih",
    subtitle: "Perilaku Memilih di Indonesia Pasca-Reformasi",
    authors: ["Sekar Ayuningtyas"],
    categories: ["Politik & Demokrasi"],
    isbn: sampleIsbn(1),
    year: 2026,
    pages: 312,
    price: 98000,
    listPrice: 120000,
    availability: "tersedia",
    bg: "#16315a",
    accent: "#f6a23a",
    synopsis: [
      "Mengapa pemilih Indonesia memilih seperti yang mereka pilih? Buku ini menelusuri dua dekade data survei untuk memahami peran identitas, figur, dan program dalam keputusan memilih.",
      "Ditulis untuk pembaca umum, mahasiswa, dan pegiat pemilu, buku ini menyajikan temuan dengan bahasa yang jernih tanpa kehilangan ketelitian metodologis.",
    ],
    toc: ["Pendahuluan", "Identitas dan Pilihan Politik", "Efek Figur", "Program dan Janji", "Pemilih Muda", "Penutup"],
    featured: true,
    marketplace: true,
    daysAgo: 5,
  },
  {
    title: "Pilkada dan Birokrasi",
    subtitle: "Netralitas Aparatur dalam Kontestasi Lokal",
    authors: ["Ratna Wulandari"],
    categories: ["Politik & Demokrasi", "Kebijakan Publik"],
    isbn: sampleIsbn(2),
    year: 2025,
    pages: 248,
    price: 85000,
    availability: "tersedia",
    bg: "#1c3f72",
    accent: "#f9c265",
    synopsis: [
      "Setiap pilkada menyisakan pertanyaan yang sama: sejauh mana birokrasi daerah ikut terseret dalam kontestasi? Buku ini membandingkan pengalaman sejumlah daerah dan menawarkan rekomendasi kebijakan.",
    ],
    toc: ["Birokrasi dan Kekuasaan Lokal", "Pola Mobilisasi Aparatur", "Pengawasan dan Sanksi", "Rekomendasi"],
    series: series.id,
    featured: true,
    marketplace: true,
    daysAgo: 40,
  },
  {
    title: "Partisipasi Warga di Desa",
    subtitle: "Musyawarah, Anggaran, dan Akuntabilitas",
    authors: ["Ratna Wulandari", "Hendra Gunawan"],
    categories: ["Kebijakan Publik", "Sosial & Budaya"],
    isbn: sampleIsbn(3),
    year: 2025,
    pages: 276,
    price: 92000,
    availability: "terbatas",
    bg: "#234e8c",
    accent: "#fcdca0",
    synopsis: [
      "Dana desa membuka ruang partisipasi yang belum pernah ada. Buku ini memeriksa apakah ruang itu benar-benar dipakai warga, dan apa yang membuat musyawarah desa bermakna.",
    ],
    toc: ["Dana Desa dalam Angka", "Musyawarah yang Hidup", "Akuntabilitas dari Bawah", "Pelajaran untuk Kebijakan"],
    series: series.id,
    marketplace: true,
    daysAgo: 70,
  },
  {
    title: "Dasar-Dasar Survei Opini Publik",
    subtitle: "Panduan Praktis dari Rancangan sampai Laporan",
    authors: ["Bima Prasetyo"],
    categories: ["Metodologi Survei"],
    isbn: sampleIsbn(4),
    year: 2024,
    pages: 356,
    price: 115000,
    availability: "tersedia",
    bg: "#0f2342",
    accent: "#f08519",
    synopsis: [
      "Panduan langkah demi langkah untuk merancang dan menjalankan survei opini publik yang dapat dipertanggungjawabkan: kerangka sampel, penyusunan kuesioner, pelatihan pewawancara, sampai pelaporan margin of error.",
      "Dilengkapi contoh kasus dan latihan, buku ini cocok untuk mahasiswa, jurnalis data, dan peneliti pemula.",
    ],
    toc: ["Mengapa Survei", "Populasi dan Kerangka Sampel", "Menyusun Kuesioner", "Kerja Lapangan", "Pembobotan", "Melaporkan Hasil"],
    featured: true,
    marketplace: true,
    daysAgo: 120,
  },
  {
    title: "Polarisasi di Linimasa",
    subtitle: "Media Sosial dan Pemilih Muda",
    authors: ["Sekar Ayuningtyas"],
    categories: ["Sosial & Budaya", "Politik & Demokrasi"],
    isbn: sampleIsbn(5),
    year: 2026,
    pages: 224,
    price: 89000,
    availability: "segera",
    bg: "#953f15",
    accent: "#fcdca0",
    synopsis: [
      "Apakah media sosial membuat kita makin terbelah? Berdasarkan survei panel dan analisis percakapan daring, buku ini memetakan kapan polarisasi menguat dan kapan ia mereda.",
    ],
    toc: ["Linimasa sebagai Arena", "Mengukur Polarisasi", "Gema dan Gelembung", "Jalan Keluar"],
    daysAgo: 1,
  },
  {
    title: "Anggaran untuk Siapa?",
    subtitle: "Ekonomi Politik Belanja Daerah",
    authors: ["Hendra Gunawan"],
    categories: ["Ekonomi Politik", "Kebijakan Publik"],
    isbn: sampleIsbn(6),
    year: 2023,
    pages: 290,
    price: 95000,
    availability: "habis",
    bg: "#57534e",
    accent: "#f9c265",
    synopsis: [
      "Belanja daerah terus naik, tetapi layanan dasar tidak selalu membaik. Buku ini mengurai siapa yang paling diuntungkan oleh pola anggaran daerah dan bagaimana warga bisa ikut mengawasinya.",
    ],
    toc: ["Membaca APBD", "Belanja Pegawai dan Belanja Publik", "Kemiskinan dan Layanan", "Pengawasan Warga"],
    daysAgo: 300,
  },
  {
    title: "Sampel yang Baik",
    subtitle: "Teknik Penarikan Sampel untuk Peneliti Sosial",
    authors: ["Bima Prasetyo"],
    categories: ["Metodologi Survei"],
    isbn: sampleIsbn(7),
    year: 2025,
    pages: 198,
    price: 78000,
    availability: "tersedia",
    bg: "#2f63ab",
    accent: "#fff8ed",
    synopsis: [
      "Kualitas survei ditentukan sejak sampel ditarik. Buku ringkas ini menjelaskan sampling acak bertingkat, klaster, dan pembobotan dengan contoh dari survei nasional.",
    ],
    toc: ["Prinsip Peluang", "Sampel Bertingkat", "Sampel Klaster", "Pembobotan dan Galat"],
    marketplace: true,
    daysAgo: 160,
  },
  {
    title: "Kota yang Mendengar",
    subtitle: "Inovasi Pelayanan Publik di Perkotaan",
    authors: ["Ratna Wulandari"],
    categories: ["Kebijakan Publik"],
    isbn: sampleIsbn(8),
    year: 2024,
    pages: 232,
    price: 87000,
    availability: "tersedia",
    bg: "#1c3f72",
    accent: "#f6a23a",
    synopsis: [
      "Kanal pengaduan daring, anggaran partisipatif, dan data terbuka: buku ini menilai inovasi pelayanan publik di sejumlah kota, mana yang bertahan dan mana yang hanya seremonial.",
    ],
    toc: ["Kota dan Warga", "Kanal Pengaduan", "Anggaran Partisipatif", "Data Terbuka", "Menilai Inovasi"],
    daysAgo: 220,
  },
  {
    // Contoh buku suntingan (bunga rampai): tanpa penulis, dengan penyunting dan penerjemah.
    title: "Desentralisasi dari Bawah",
    subtitle: "Bunga Rampai Kajian Pemerintahan Daerah",
    authors: [],
    editors: ["Ratna Wulandari", "Hendra Gunawan"],
    translators: ["Dimas Hartono"],
    categories: ["Kebijakan Publik", "Politik & Demokrasi"],
    isbn: sampleIsbn(9),
    year: 2026,
    pages: 384,
    price: 125000,
    availability: "tersedia",
    bg: "#2c4a3e",
    accent: "#f9c265",
    synopsis: [
      "Dua belas peneliti dari dalam dan luar negeri menulis tentang pemerintahan daerah dua dekade setelah otonomi: kewenangan, anggaran, dan partisipasi warga. Bab dari penulis luar negeri diterjemahkan ke bahasa Indonesia.",
    ],
    toc: ["Pengantar Penyunting", "Bagian I: Kewenangan", "Bagian II: Anggaran", "Bagian III: Warga", "Penutup"],
    daysAgo: 12,
  },
];

const createdBooks: { id: number; title: string }[] = [];
let seriesOrder = 0;
for (const b of books) {
  const png = await makeCover({
    title: b.title,
    author: b.authors.length ? b.authors.join(" & ") : `${(b.editors ?? []).join(" & ")} (ed.)`,
    bg: b.bg,
    accent: b.accent,
    seriesLabel: b.series ? "Seri Demokrasi Lokal" : undefined,
  });
  const cover = await payload.create({
    collection: "media",
    overrideAccess: true,
    data: { alt: `Sampul buku ${b.title}` },
    file: {
      data: png,
      mimetype: "image/png",
      name: `${b.isbn.replace(/\D/g, "")}.png`,
      size: png.length,
    },
  });

  const publishedAt = new Date(Date.now() - b.daysAgo * 24 * 60 * 60 * 1000).toISOString();
  const discount =
    b.listPrice !== undefined
      ? {
          listPrice: b.listPrice,
          discountStart: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          discountEnd: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        }
      : {};

  const book = await payload.create({
    collection: "books",
    overrideAccess: true,
    draft: false,
    data: {
      title: b.title,
      subtitle: b.subtitle,
      slug: "",
      authors: b.authors.map((name) => authors[name]),
      editors: (b.editors ?? []).map((name) => authors[name]),
      translators: (b.translators ?? []).map((name) => authors[name]),
      categories: b.categories.map((name) => categories[name]),
      isbn13: b.isbn,
      publishedYear: b.year,
      pageCount: b.pages,
      language: "id",
      edition: "Cetakan pertama",
      widthCm: 15,
      heightCm: 23,
      thicknessCm: Math.round((b.pages / 200) * 10) / 10 + 0.4,
      weightGram: Math.round(b.pages * 1.25 + 60),
      price: b.price,
      ...discount,
      availability: b.availability,
      cover: cover.id,
      synopsis: doc(...b.synopsis.map(p)),
      tableOfContents: doc(ol(b.toc)),
      waOrderEnabled: true,
      marketplaceLinks: b.marketplace
        ? [
            { platform: "tokopedia", url: "https://www.tokopedia.com/" },
            { platform: "shopee", url: "https://shopee.co.id/" },
          ]
        : [],
      series: b.series,
      seriesOrder: b.series ? ++seriesOrder : undefined,
      featured: b.featured ?? false,
      publishedAt,
      internalNotes: SAMPLE_NOTE,
      _status: "published",
    },
  });
  createdBooks.push({ id: book.id, title: book.title });
}
log(`${createdBooks.length} buku dengan sampul`);

/* ------------------------------ halaman --------------------------------- */

// Teks halaman resmi dan formulir retur (sumber yang sama dengan `npm run isi-konten`), di sini langsung tayang.
const konten = await terapkanKonten(payload, { tayang: true, timpa: false, pengaturan: false, log });
log(`${konten.dibuat.length} halaman`);

/* -------------------------------- kabar --------------------------------- */

await payload.create({
  collection: "posts",
  overrideAccess: true,
  draft: false,
  data: {
    title: "Segera terbit: Polarisasi di Linimasa",
    slug: "",
    excerpt: "Buku terbaru tentang media sosial dan pemilih muda akan segera hadir. Tanyakan ketersediaannya lewat WhatsApp.",
    content: doc(
      p(
        "Yayasan Populi Indonesia akan segera menerbitkan Polarisasi di Linimasa, kajian tentang bagaimana media sosial membentuk sikap politik pemilih muda.",
      ),
      p("Ini adalah kabar contoh untuk pengembangan situs."),
    ),
    relatedBooks: createdBooks.filter((b) => b.title === "Polarisasi di Linimasa").map((b) => b.id),
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    _status: "published",
  },
});
await payload.create({
  collection: "posts",
  overrideAccess: true,
  draft: false,
  data: {
    title: "Diskusi buku Membaca Suara Pemilih",
    slug: "",
    excerpt: "Catatan dari diskusi peluncuran buku tentang perilaku memilih di Indonesia.",
    content: doc(p("Ini adalah kabar contoh untuk pengembangan situs.")),
    relatedBooks: createdBooks.filter((b) => b.title === "Membaca Suara Pemilih").map((b) => b.id),
    publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    _status: "published",
  },
});
log("2 kabar");

log("selesai.");
process.exit(0);
