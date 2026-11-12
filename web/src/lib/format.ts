import type { Author, Book } from "@/payload-types";

const numberId = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

/** Rp85.000 — tanpa spasi, sesuai NFR lokalisasi di PRD. */
export const formatRupiah = (value: number | null | undefined): string =>
  typeof value === "number" ? `Rp${numberId.format(value)}` : "";

const dateWib = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

/** Tanggal ditampilkan dalam WIB; disimpan UTC oleh Payload. */
export const formatDate = (value: string | null | undefined): string =>
  value ? dateWib.format(new Date(value)) : "";

export const LANGUAGE_LABEL: Record<NonNullable<Book["language"]>, string> = {
  id: "Indonesia",
  en: "Inggris",
  other: "Lainnya",
};

export const AVAILABILITY: Record<
  Book["availability"],
  { label: string; tone: "ok" | "warn" | "off" | "info"; orderable: boolean }
> = {
  tersedia: { label: "Tersedia", tone: "ok", orderable: true },
  terbatas: { label: "Stok terbatas", tone: "warn", orderable: true },
  habis: { label: "Habis", tone: "off", orderable: false },
  segera: { label: "Segera terbit", tone: "info", orderable: false },
};

export const MARKETPLACE_LABEL: Record<string, string> = {
  tokopedia: "Tokopedia",
  shopee: "Shopee",
  tiktok: "TikTok Shop",
  blibli: "Blibli",
  lazada: "Lazada",
  lainnya: "Marketplace",
};

/* ------------------------------ kontributor ------------------------------ */

/**
 * Peran orang pada buku, dalam urutan tampil. Semua peran merujuk koleksi `authors`
 * (satu entri per orang); perannya ditentukan di setiap buku.
 */
export const CONTRIBUTOR_ROLES = [
  { key: "authors", label: "Penulis" },
  { key: "editors", label: "Penyunting" },
  { key: "translators", label: "Penerjemah" },
] as const;

export type ContributorRole = (typeof CONTRIBUTOR_ROLES)[number]["key"];

/** Nama kontributor per peran, sesuai urutan di buku. */
export type Contributors = Record<ContributorRole, string[]>;

export const ROLE_LABEL = Object.fromEntries(CONTRIBUTOR_ROLES.map((r) => [r.key, r.label])) as Record<
  ContributorRole,
  string
>;

type ContributorSource = Partial<Pick<Book, ContributorRole>>;
type Related = number | Author | null | undefined;

/** Hanya relasi yang sudah ter-populate; ID mentah (mis. orang yang belum tayang) dilewati. */
const populated = (list: readonly Related[] | null | undefined): Author[] =>
  (list ?? []).filter((a): a is Author => typeof a === "object" && a !== null);

/** Data orang per peran, sesuai urutan di buku. */
export const contributorsOf = (book: ContributorSource): Record<ContributorRole, Author[]> => ({
  authors: populated(book.authors),
  editors: populated(book.editors),
  translators: populated(book.translators),
});

const namesOf = (people: Author[]): string[] => people.map((a) => a.name).filter((n): n is string => Boolean(n));

export const contributorNames = (book: ContributorSource): Contributors => {
  const people = contributorsOf(book);
  return {
    authors: namesOf(people.authors),
    editors: namesOf(people.editors),
    translators: namesOf(people.translators),
  };
};

/**
 * Pemisah setelah nama ke-i dari n nama: "A dan B", "A, B, dan C" (koma serial sesuai
 * EYD). Dipakai joinNames dan daftar nama bertaut di halaman buku agar keduanya sama.
 */
export const listSeparator = (i: number, n: number): "" | ", " | " dan " | ", dan " => {
  if (i >= n - 1) return "";
  if (n === 2) return " dan ";
  return i === n - 2 ? ", dan " : ", ";
};

export const joinNames = (names: string[]): string =>
  names.map((name, i) => name + listSeparator(i, names.length)).join("");

/** Lebih dari `max` nama disingkat "A, B, dkk.". */
const shortList = (names: string[], max: number): string =>
  names.length <= max ? joinNames(names) : `${names.slice(0, Math.max(1, max - 1)).join(", ")}, dkk.`;

/**
 * Baris nama singkat untuk kartu dan judul SEO: penulis; bila tidak ada penulis,
 * penyunting dengan "(ed.)" (sama untuk satu atau beberapa penyunting). Penerjemah tidak ikut.
 */
export const byline = (c: Contributors, max = 3): string => {
  if (c.authors.length) return shortList(c.authors, max);
  if (c.editors.length) return `${shortList(c.editors, max)} (ed.)`;
  return "";
};

/** Frasa untuk deskripsi: "karya A dan B", "suntingan X, diterjemahkan oleh Y", atau "". */
export const contributorPhrase = (c: Contributors): string => {
  const base = c.authors.length
    ? `karya ${joinNames(c.authors)}`
    : c.editors.length
      ? `suntingan ${joinNames(c.editors)}`
      : "";
  if (!c.translators.length) return base;
  const translated = `diterjemahkan oleh ${joinNames(c.translators)}`;
  return base ? `${base}, ${translated}` : translated;
};

const idOf = (v: Related): number | null => (typeof v === "number" ? v : v && typeof v === "object" ? v.id : null);

/** Peran seseorang pada satu buku; relasi boleh berupa objek ter-populate atau ID mentah. */
export const rolesOf = (book: ContributorSource, personId: number): ContributorRole[] =>
  CONTRIBUTOR_ROLES.filter(({ key }) => (book[key] ?? []).some((v) => idOf(v) === personId)).map(({ key }) => key);

/**
 * Daftar orang tanpa duplikat, dalam urutan penulis, penyunting, penerjemah, beserta
 * semua perannya pada buku ini (satu orang bisa menulis sekaligus menyunting).
 */
export const contributorEntries = (
  people: Record<ContributorRole, Author[]>,
): { person: Author; roles: ContributorRole[] }[] => {
  const entries: { person: Author; roles: ContributorRole[] }[] = [];
  for (const { key } of CONTRIBUTOR_ROLES) {
    for (const person of people[key]) {
      const found = entries.find((e) => e.person.id === person.id);
      if (!found) entries.push({ person, roles: [key] });
      else if (!found.roles.includes(key)) found.roles.push(key);
    }
  }
  return entries;
};

/** Ukuran buku, mis. "14 × 21 cm". */
export const formatDimensions = (book: Pick<Book, "widthCm" | "heightCm">): string =>
  book.widthCm && book.heightCm ? `${book.widthCm} × ${book.heightCm} cm` : "";
