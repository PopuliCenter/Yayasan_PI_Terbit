/**
 * Pemeriksaan murni untuk global Beranda (tanpa impor payload), sehingga bisa diuji
 * dengan `tsx --test` dan dipakai ulang oleh normalisasi saat render.
 */
import { safeHref } from "../../lib/links";

/** Penanda di Pengantar Pembuka; diganti nama penerbit resmi dari Pengaturan Situs. */
export const PUBLISHER_TOKEN = "{penerbit}";

/**
 * Kalimat identitas penerbit. Pengantar Pembuka wajib diawali kalimat ini (verifikator
 * ISBN membaca beranda dan harus melihat yayasan disebut sebagai penerbit).
 */
export const IDENTITY_SENTENCE = `${PUBLISHER_TOKEN} menerbitkan buku untuk pembaca umum.`;

/** ID jangkar: huruf kecil, angka, tanda hubung; diawali huruf; 2–40 karakter. */
export const ANCHOR_RE = /^[a-z][a-z0-9-]{1,39}$/;

/**
 * ID yang sudah dipakai tata letak situs (tautan lompat ke konten, sorotan dan kotak
 * pencarian Pembuka, header, footer, formulir kabar di footer). Jangkar admin tidak
 * boleh menabraknya: judul bagian muncul lebih dulu di DOM sehingga label dan
 * aria-describedby milik footer akan menunjuk ke judul itu.
 */
export const RESERVED_ANCHORS: ReadonlySet<string> = new Set([
  "konten",
  "sorotan",
  "cari-beranda",
  "cari-menu",
  "footer-identitas",
  "footer-kontak",
  "footer-info",
  "footer-kabar",
  "nl-website",
  "nl-email",
  "nl-email-error",
  "nl-consent",
  "nl-consent-error",
]);

/** Awalan ID milik komponen situs (formulir kabar, footer); seluruh awalan dicadangkan. */
export const RESERVED_ANCHOR_PREFIXES: readonly string[] = ["nl-", "footer-"];

/** True bila ID dipakai (atau mungkin kelak dipakai) komponen tata letak situs. */
export const isReservedAnchor = (value: string): boolean =>
  RESERVED_ANCHORS.has(value) || RESERVED_ANCHOR_PREFIXES.some((p) => value.startsWith(p));

/**
 * Nama lama yang dilarang, termasuk varian dengan pemisah apa pun di antara dua katanya
 * (spasi, tanda hubung, titik, garis bawah, karakter lebar-nol). Jangkar tidak boleh
 * memuat spasi, jadi varian bertanda hubung juga harus tertangkap.
 */
const FORBIDDEN_NAME = /populi[^\p{L}\p{N}]*cent(?:er|re)/iu;

/** Pesan galat sengaja tidak mengeja nama lama. */
export const FORBIDDEN_NAME_MESSAGE =
  "Teks ini memuat nama lama yang tidak boleh dipakai. Gunakan nama penerbit resmi: Yayasan Populi Indonesia.";

export const HREF_MESSAGE =
  "Tulis alamat di situs ini yang diawali /, mis. /institusi, atau alamat lengkap https://…";

export const checkForbiddenName = (value: unknown): true | string =>
  typeof value === "string" && FORBIDDEN_NAME.test(value) ? FORBIDDEN_NAME_MESSAGE : true;

/**
 * Pengantar Pembuka wajib diawali kalimat identitas penerbit (verifikasi ISBN di layar
 * pertama). Kalimat sesudahnya bebas.
 */
export const checkIntro = (value: unknown): true | string =>
  typeof value === "string" && value.trimStart().startsWith(IDENTITY_SENTENCE)
    ? true
    : `Kalimat pertama Pengantar harus tetap “${IDENTITY_SENTENCE}”. Penanda ${PUBLISHER_TOKEN} diganti nama penerbit resmi dari Pengaturan Situs; kalimat ini wajib tampil untuk verifikasi ISBN. Kalimat sesudahnya bebas.`;

export const checkAnchor = (value: unknown): true | string => {
  if (value === null || value === undefined || value === "") return true;
  if (typeof value !== "string" || !ANCHOR_RE.test(value)) {
    return "Pakai huruf kecil, angka, dan tanda hubung; diawali huruf; 2–40 karakter. Contoh: cara-pesan.";
  }
  if (RESERVED_ANCHORS.has(value)) return `“${value}” sudah dipakai situs. Pilih nama lain.`;
  const prefix = RESERVED_ANCHOR_PREFIXES.find((p) => value.startsWith(p));
  if (prefix) return `Awalan “${prefix}” sudah dipakai situs. Pilih nama lain.`;
  return true;
};

/** Kosong boleh (wajib-isi diurus validator bawaan); selain itu harus lolos safeHref. */
export const checkHref = (value: unknown): true | string => {
  if (value === null || value === undefined || value === "") return true;
  return safeHref(value, { allowMailto: true }) ? true : HREF_MESSAGE;
};

type LexicalLinkNode = { type?: unknown; fields?: { url?: unknown; linkType?: unknown }; children?: unknown };

/** Semua alamat tautan (link/autolink) di dokumen Lexical, berikut jenisnya. */
export const lexicalLinks = (value: unknown): { url: string; internal: boolean }[] => {
  const found: { url: string; internal: boolean }[] = [];
  const walk = (node: unknown, depth: number) => {
    if (!node || typeof node !== "object" || depth > 50) return;
    const n = node as LexicalLinkNode;
    if (n.type === "link" || n.type === "autolink") {
      found.push({
        url: typeof n.fields?.url === "string" ? n.fields.url : "",
        internal: n.fields?.linkType === "internal",
      });
    }
    if (Array.isArray(n.children)) n.children.forEach((c) => walk(c, depth + 1));
  };
  walk((value as { root?: unknown } | null)?.root, 0);
  return found;
};

/** Tautan di teks bebas hanya boleh ke path situs, https, atau mailto. */
export const checkRichTextLinks = (value: unknown): true | string => {
  const bad = lexicalLinks(value).find((l) => l.internal || !safeHref(l.url, { allowMailto: true }));
  if (!bad) return true;
  const shown = bad.url.length > 60 ? `${bad.url.slice(0, 59)}…` : bad.url;
  return `Tautan “${shown || "(kosong)"}” tidak bisa dipakai. ${HREF_MESSAGE}`;
};

type LayoutRow = { blockType?: unknown; anchor?: unknown };

/**
 * Aturan susunan saat Tayangkan: Pembuka tepat satu dan paling atas, jangkar unik.
 * Nilai bukan larik (form-state admin kadang mengirim jumlah baris) dianggap lolos;
 * validator bawaan dan validasi server tetap menilai larik sebenarnya.
 */
export const checkLayout = (rows: unknown): true | string => {
  if (!Array.isArray(rows)) return true;
  const list = rows.map((r) => (r && typeof r === "object" ? (r as LayoutRow) : {}));
  if (list[0]?.blockType !== "hero") {
    return "Bagian pertama harus “Pembuka”. Bagian ini memuat nama penerbit yang diperiksa verifikator ISBN; tarik ke paling atas.";
  }
  if (list.filter((r) => r.blockType === "hero").length > 1) return "Hanya boleh ada satu bagian “Pembuka”.";
  const anchors = list.map((r) => r.anchor).filter((a): a is string => typeof a === "string" && a !== "");
  const dup = anchors.find((a, i) => anchors.indexOf(a) !== i);
  return dup ? `ID jangkar “${dup}” dipakai lebih dari satu bagian. Setiap jangkar harus unik.` : true;
};
