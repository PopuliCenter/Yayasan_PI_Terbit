/**
 * Isian Pengaturan Situs yang sudah pasti untuk Yayasan Populi Indonesia.
 *
 * Hanya mengisi kolom yang masih kosong atau berisi placeholder seed ("[…]", alamat
 * @contoh.test). Isian yang sudah diubah admin tidak pernah ditimpa. Murni, agar bisa
 * diuji tanpa basis data.
 */

export const EMAIL_PENERBIT = "penerbit@yayasanpopuliindonesia.org";

export const PENGATURAN_PASTI = {
  email: EMAIL_PENERBIT,
  // Aktif di Cloudflare Email Routing sejak 12 Nov 2026 (diteruskan ke Gmail yayasan).
  editorialEmail: "redaksi@yayasanpopuliindonesia.org",
  legalEntityName: "Yayasan Populi Indonesia",
  legalBasis:
    "Keputusan Menteri Hukum dan Hak Asasi Manusia Republik Indonesia Nomor AHU-5475.AH.01.04.Tahun 2012",
  address: "Jalan Mampang Prapatan VIII No.38, Tegal Parang, Mampang Prapatan, Jakarta Selatan DKI Jakarta 12790",
  nib: "0702230061964",
  // Halaman Kontak sudah menampilkan nama Ditjen PKTN sebagai judul; ini isi di bawahnya.
  // Sumber: siaran pers Kemendag 15 Juli 2026 dan ditjenpktn.kemendag.go.id.
  pktnContact:
    "Kementerian Perdagangan Republik Indonesia\nWhatsApp: 0853-1111-1010\nEmail: pengaduan.konsumen@kemendag.go.id\nTelepon: (021) 3441839",
} as const;

type Kolom = keyof typeof PENGATURAN_PASTI | "phone";

/** Kosong, bukan teks, memuat penanda "[…]", atau alamat contoh. */
export const isPlaceholder = (v: unknown): boolean =>
  typeof v !== "string" || !v.trim() || /\[[^\]]*\]/.test(v) || /@contoh\.|\.test$/i.test(v.trim());

/** Nomor WA seed yang sengaja tidak valid (62 diikuti nol). */
export const isWaPlaceholder = (wa: unknown): boolean => typeof wa !== "string" || !/^62\d{8,13}$/.test(wa) || /^620+$/.test(wa);

/**
 * Nomor WA internasional (62812…) → tampilan telepon lokal "0812-3456-7890".
 * null bila nomornya masih placeholder.
 */
export const teleponDariWa = (wa: unknown): string | null => {
  if (isWaPlaceholder(wa)) return null;
  const lokal = `0${(wa as string).slice(2)}`;
  return lokal.replace(/^(\d{4})(\d{4})(\d+)$/, "$1-$2-$3");
};

/** Toko marketplace seed yang hanya menautkan beranda marketplace, bukan toko yayasan. */
const TOKO_UMUM = new Set(["https://www.tokopedia.com/", "https://shopee.co.id/", "https://tokopedia.com/"]);

export type PengaturanSaatIni = Partial<Record<string, unknown>> & {
  marketplaceStores?: Array<{ platform?: unknown; url?: unknown; id?: unknown }> | null;
};

type Toko = { platform?: unknown; url?: unknown };

export type HasilPengaturan = {
  /** Kolom yang akan diisi (hanya yang kosong/placeholder). */
  patch: Partial<Record<Kolom, string>> & { marketplaceStores?: Toko[] };
  /** Isian yang masih perlu diisi admin sendiri. */
  tertunda: string[];
};

export const susunPengaturan = (s: PengaturanSaatIni): HasilPengaturan => {
  const patch: HasilPengaturan["patch"] = {};
  for (const [kolom, nilai] of Object.entries(PENGATURAN_PASTI) as [keyof typeof PENGATURAN_PASTI, string][]) {
    if (isPlaceholder(s[kolom])) patch[kolom] = nilai;
  }
  // Telepon kantor = nomor WhatsApp resmi.
  const telepon = teleponDariWa(s.waNumber);
  if (telepon && isPlaceholder(s.phone)) patch.phone = telepon;

  const tertunda: string[] = [];
  if (isWaPlaceholder(s.waNumber)) tertunda.push("Nomor WhatsApp resmi (telepon ikut terisi dari nomor ini)");
  if (isPlaceholder(s.publisherResponsible)) tertunda.push("Penanggung jawab penerbitan (nama, jabatan)");
  if (isPlaceholder(s.serviceHours)) tertunda.push("Jam layanan");
  if (isPlaceholder(s.bankTransferNote)) tertunda.push("Rekening penerima transfer atas nama yayasan (catatan internal)");
  // Toko contoh dari seed (beranda Tokopedia/Shopee) menyesatkan: toko resmi belum ada.
  // Dibuang; toko yang diisi admin dibiarkan. Toko resmi ditambahkan admin kelak.
  const toko = s.marketplaceStores ?? [];
  const umum = (t: Toko) => typeof t.url === "string" && TOKO_UMUM.has(t.url);
  if (toko.some(umum)) patch.marketplaceStores = toko.filter((t) => !umum(t));
  return { patch, tertunda };
};
