/**
 * Logika murni Beranda (tanpa payload/next): normalisasi susunan, jaminan baris identitas
 * penerbit, rencana kueri, dan pemilihan data per bagian. Dipakai render situs dan
 * pratinjau; diuji lewat `tsx --test`.
 *
 * Tipe blok didefinisikan di sini (bukan dari payload-types) agar renderer tidak
 * bergantung pada tipe hasil generate. Draf tidak divalidasi, jadi setiap field masukan
 * dianggap tidak tepercaya dan boleh kosong.
 */
import type { Book, Category, Post } from "../payload-types";
import { ANCHOR_RE, checkForbiddenName, isReservedAnchor, PUBLISHER_TOKEN } from "../globals/homepage/checks";
import {
  BLOCK_LABELS,
  DEFAULT_HERO_HEADING,
  DEFAULT_HERO_INTRO,
  DEFAULT_LATEST,
  DEFAULT_NEWS,
  DEFAULT_ORDER,
  DEFAULT_ORDER_STEPS,
  DEFAULT_SEARCH_PLACEHOLDER,
  DEFAULT_SHELF_LIMIT,
  DEFAULT_TOPICS_HEADING,
  HOMEPAGE_DEFAULT_LAYOUT,
  IDENTITY_SENTENCE,
} from "../globals/homepage/defaults";
import { safeHref } from "./links";
import { hasRichText } from "./richtext";

/* -------------------------------------------------------------------------- */
/* Tipe masukan (baris mentah dari global, depth 0)                            */
/* -------------------------------------------------------------------------- */

export type HomeBlockType = keyof typeof BLOCK_LABELS;
export type SpotlightMode = "auto" | "manual" | "none";
export type ShelfSource = "manual" | "category" | "featured";
export type ButtonStyle = "outline" | "solid";
export type TextColumns = "split" | "single";

type Str = string | null | undefined;
type Bool = boolean | null | undefined;
type Num = number | null | undefined;
/** Relasi: ID (depth 0), dokumen terisi, atau string angka. */
type Rel = number | string | { id?: unknown } | null | undefined;

type RowInput = { id?: Str; blockName?: Str };
type SectionInput = RowInput & { hideSection?: Bool; paperBand?: Bool; anchor?: Str };

export type HeroBlockInput = RowInput & {
  blockType: "hero";
  heading?: Str;
  intro?: Str;
  showSearch?: Bool;
  searchPlaceholder?: Str;
  spotlightMode?: SpotlightMode | null;
  spotlightBook?: Rel;
  spotlightLabel?: Str;
};
export type LatestBooksBlockInput = SectionInput & {
  blockType: "latestBooks";
  heading?: Str;
  limit?: Num;
  showAllLink?: Bool;
  allLinkLabel?: Str;
  emptyText?: Str;
};
export type BookShelfBlockInput = SectionInput & {
  blockType: "bookShelf";
  heading?: Str;
  intro?: Str;
  source?: ShelfSource | null;
  books?: Rel[] | null;
  category?: Rel;
  limit?: Num;
  showAllLink?: Bool;
};
export type TopicsBlockInput = SectionInput & { blockType: "topics"; heading?: Str; categories?: Rel[] | null };
export type OrderStepsBlockInput = SectionInput & {
  blockType: "orderSteps";
  heading?: Str;
  intro?: Str;
  steps?: { id?: Str; title?: Str; body?: Str }[] | null;
  note?: Str;
  linkLabel?: Str;
  linkUrl?: Str;
};
export type CallToActionBlockInput = SectionInput & {
  blockType: "callToAction";
  heading?: Str;
  body?: Str;
  buttonLabel?: Str;
  buttonUrl?: Str;
  buttonStyle?: ButtonStyle | null;
};
export type NewsBlockInput = SectionInput & { blockType: "news"; heading?: Str; limit?: Num; allLinkLabel?: Str };
export type TextSectionBlockInput = SectionInput & {
  blockType: "textSection";
  heading?: Str;
  content?: unknown;
  columns?: TextColumns | null;
};

export type HomeBlockInput =
  | HeroBlockInput
  | LatestBooksBlockInput
  | BookShelfBlockInput
  | TopicsBlockInput
  | OrderStepsBlockInput
  | CallToActionBlockInput
  | NewsBlockInput
  | TextSectionBlockInput;

/* -------------------------------------------------------------------------- */
/* Tipe hasil normalisasi (semua field terisi, siap render)                    */
/* -------------------------------------------------------------------------- */

type Placement = {
  /** Kunci React yang unik dalam susunan. */
  key: string;
  /** ID judul bagian (aria-labelledby dan target #jangkar). Kosong untuk Pembuka. */
  headingId: string;
  /** Garis pemisah di atas bagian (bukan bagian kedua, dan tidak di sebelah pita kertas). */
  rule: boolean;
  /** Jumlah sampul yang dimuat segera (bagian buku tepat di bawah Pembuka). */
  priorityCount: number;
};
type Common = { paperBand: boolean };

export type HeroBlock = Placement &
  Common & {
    blockType: "hero";
    heading: string;
    /** Pengantar mentah; ganti penanda lewat resolveIntro() saat render. */
    intro: string;
    showSearch: boolean;
    searchPlaceholder: string;
    spotlightMode: SpotlightMode;
    spotlightBook: number | null;
    spotlightLabel: string;
  };
export type LatestBooksBlock = Placement &
  Common & {
    blockType: "latestBooks";
    heading: string;
    limit: number;
    showAllLink: boolean;
    allLinkLabel: string;
    emptyText: string;
  };
export type BookShelfBlock = Placement &
  Common & {
    blockType: "bookShelf";
    heading: string;
    intro: string;
    source: ShelfSource;
    books: number[];
    category: number | null;
    limit: number;
    showAllLink: boolean;
  };
export type TopicsBlock = Placement & Common & { blockType: "topics"; heading: string; categories: number[] };
export type OrderStepsBlock = Placement &
  Common & {
    blockType: "orderSteps";
    heading: string;
    intro: string;
    steps: { title: string; body: string }[];
    note: string;
    linkLabel: string;
    /** Sudah lolos safeHref; null = tanpa tautan. */
    linkHref: string | null;
  };
export type CallToActionBlock = Placement &
  Common & {
    blockType: "callToAction";
    heading: string;
    body: string;
    buttonLabel: string;
    /** Sudah lolos safeHref; null = tombol tidak dirender. */
    buttonHref: string | null;
    buttonStyle: ButtonStyle;
  };
export type NewsBlock = Placement & Common & { blockType: "news"; heading: string; limit: number; allLinkLabel: string };
export type TextSectionBlock = Placement &
  Common & {
    blockType: "textSection";
    heading: string;
    /** Dokumen Lexical yang sudah disaring (sanitizeRichText), atau null. */
    content: unknown;
    columns: TextColumns;
  };

export type NormalizedBlock =
  | HeroBlock
  | LatestBooksBlock
  | BookShelfBlock
  | TopicsBlock
  | OrderStepsBlock
  | CallToActionBlock
  | NewsBlock
  | TextSectionBlock;

export type NormalizeResult = { blocks: NormalizedBlock[]; warnings: string[]; usedDefault: boolean };

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type Pending = DistributiveOmit<NormalizedBlock, keyof Placement>;

/* -------------------------------------------------------------------------- */
/* Pembantu nilai                                                              */
/* -------------------------------------------------------------------------- */

/** ID relasi dari angka, dokumen terisi ({id}), atau string angka. */
export const idOf = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isSafeInteger(value) && value > 0 ? value : null;
  if (typeof value === "string") return /^\d{1,12}$/.test(value) && Number(value) > 0 ? Number(value) : null;
  if (value && typeof value === "object" && "id" in value) {
    const inner = (value as { id: unknown }).id;
    return typeof inner === "number" || typeof inner === "string" ? idOf(inner) : null;
  }
  return null;
};

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const strOr = (v: unknown, fallback: string): string => str(v) || fallback;
const bool = (v: unknown, fallback: boolean): boolean => (typeof v === "boolean" ? v : fallback);
const int = (v: unknown, min: number, max: number, fallback: number): number => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : Number.NaN;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
};
const oneOf = <T extends string>(v: unknown, options: readonly T[], fallback: T): T =>
  options.find((o) => o === v) ?? fallback;
const idList = (v: unknown, max: number): number[] => {
  if (!Array.isArray(v)) return [];
  const out: number[] = [];
  for (const item of v) {
    const id = idOf(item);
    if (id !== null && !out.includes(id)) out.push(id);
    if (out.length >= max) break;
  }
  return out;
};

const isRecord = (v: unknown): v is Record<string, unknown> => Boolean(v) && typeof v === "object" && !Array.isArray(v);

/** Nama bagian untuk pesan pratinjau, mis. “Pilihan buku — Rekomendasi Ramadan”. */
export const blockTitle = (block: { blockType: HomeBlockType; heading?: string }): string => {
  const label = BLOCK_LABELS[block.blockType];
  const heading = block.heading?.trim();
  return `“${label}${heading && heading !== label ? ` — ${heading}` : ""}”`;
};

/* -------------------------------------------------------------------------- */
/* Teks kaya: hanya node yang diizinkan editor Teks bebas, tautan lewat safeHref */
/* -------------------------------------------------------------------------- */

const RICH_NODES = new Set([
  "root",
  "paragraph",
  "text",
  "heading",
  "list",
  "listitem",
  "quote",
  "horizontalrule",
  "linebreak",
  "tab",
  "link",
  "autolink",
]);

/**
 * Salinan dokumen Lexical yang aman dirender: node di luar fitur editor dibuang,
 * judul dibatasi h2/h3, dan tautan yang tidak lolos safeHref dilepas (teksnya tetap).
 * Node teks hanya dipertahankan bila `text` berupa teks/angka: konverter teks Lexical
 * mengembalikan `text` apa adanya sebagai anak React, sehingga objek akan menggagalkan
 * render di luar try/catch konverter. Konverter JSX Lexical juga tidak menyaring URL,
 * validasi Lexical tidak memeriksa bentuk node, dan draf tidak divalidasi.
 */
export const sanitizeRichText = (value: unknown): { value: { root: Record<string, unknown> } | null; removedLinks: number } => {
  let removedLinks = 0;
  const clean = (node: unknown, depth: number): Record<string, unknown>[] => {
    if (!isRecord(node) || depth > 40) return [];
    const type = node.type;
    if (typeof type !== "string" || !RICH_NODES.has(type)) return [];
    if (type === "text") {
      const text = node.text;
      if (typeof text !== "string" && !(typeof text === "number" && Number.isFinite(text))) return [];
      const format = typeof node.format === "number" && Number.isSafeInteger(node.format) ? node.format : 0;
      return [{ ...node, text: String(text), format }];
    }
    const children = Array.isArray(node.children) ? node.children.flatMap((c) => clean(c, depth + 1)) : null;
    if (type === "link" || type === "autolink") {
      const fields = isRecord(node.fields) ? node.fields : {};
      const href = fields.linkType === "internal" ? null : safeHref(fields.url, { allowMailto: true });
      if (!href) {
        removedLinks += 1;
        return children ?? [];
      }
      return [{ ...node, fields: { ...fields, url: href, linkType: "custom", doc: null }, children: children ?? [] }];
    }
    if (type === "heading") {
      const tag = node.tag === "h2" || node.tag === "h3" ? node.tag : node.tag === "h1" ? "h2" : "h3";
      return [{ ...node, tag, children: children ?? [] }];
    }
    return [children ? { ...node, children } : { ...node }];
  };
  const root = isRecord(value) ? value.root : null;
  if (!isRecord(root) || root.type !== "root") return { value: null, removedLinks: 0 };
  const [cleanRoot] = clean(root, 0);
  return { value: cleanRoot ? { root: cleanRoot } : null, removedLinks };
};

/* -------------------------------------------------------------------------- */
/* Normalisasi susunan                                                         */
/* -------------------------------------------------------------------------- */

/** Semua teks (termasuk langkah) dalam baris mentah, untuk peringatan nama terlarang. */
const rowStrings = (row: Record<string, unknown>): string[] => {
  const out: string[] = [];
  for (const v of Object.values(row)) {
    if (typeof v === "string") out.push(v);
    else if (Array.isArray(v)) for (const item of v) if (isRecord(item)) out.push(...rowStrings(item));
  }
  return out;
};

type Resolved = { block: Pending; hidden: boolean; anchor: string };

/**
 * Pembuka tidak bisa disembunyikan dan tidak memakai pita kertas atau jangkar.
 * Pengantar yang tidak diawali kalimat identitas diberi peringatan pratinjau;
 * resolveIntro() tetap mendahulukan kalimat itu saat render.
 */
const resolveHero = (r: Record<string, unknown>, warn?: (message: string) => void): Resolved => {
  const intro = str(r.intro);
  if (intro && !intro.startsWith(IDENTITY_SENTENCE)) {
    warn?.(
      `Pengantar “Pembuka” harus diawali “${IDENTITY_SENTENCE}”; di situs kalimat itu ditambahkan otomatis di depan. Perbaiki sebelum menayangkan.`,
    );
  }
  return {
    block: {
      blockType: "hero",
      paperBand: false,
      heading: strOr(r.heading, DEFAULT_HERO_HEADING),
      intro,
      showSearch: bool(r.showSearch, true),
      searchPlaceholder: strOr(r.searchPlaceholder, DEFAULT_SEARCH_PLACEHOLDER),
      spotlightMode: oneOf<SpotlightMode>(r.spotlightMode, ["auto", "manual", "none"], "auto"),
      spotlightBook: idOf(r.spotlightBook),
      spotlightLabel: str(r.spotlightLabel),
    },
    hidden: false,
    anchor: "",
  };
};

function resolveRow(raw: unknown, warn: (message: string) => void): Resolved | null {
  if (!isRecord(raw)) return null;
  const r = raw;
  const paperBand = bool(r.paperBand, false);
  const hidden = bool(r.hideSection, false);
  const anchor = str(r.anchor);
  const section = (block: Pending): Resolved => ({ block, hidden, anchor });

  switch (r.blockType) {
    case "hero":
      return resolveHero(r, warn);
    case "latestBooks":
      return section({
        blockType: "latestBooks",
        paperBand,
        heading: strOr(r.heading, DEFAULT_LATEST.heading),
        limit: int(r.limit, 2, 12, DEFAULT_LATEST.limit),
        showAllLink: bool(r.showAllLink, true),
        allLinkLabel: strOr(r.allLinkLabel, DEFAULT_LATEST.allLinkLabel),
        emptyText: strOr(r.emptyText, DEFAULT_LATEST.emptyText),
      });
    case "bookShelf":
      return section({
        blockType: "bookShelf",
        paperBand,
        heading: strOr(r.heading, BLOCK_LABELS.bookShelf),
        intro: str(r.intro),
        source: oneOf<ShelfSource>(r.source, ["manual", "category", "featured"], "manual"),
        books: idList(r.books, 12),
        category: idOf(r.category),
        limit: int(r.limit, 2, 12, DEFAULT_SHELF_LIMIT),
        showAllLink: bool(r.showAllLink, true),
      });
    case "topics":
      return section({
        blockType: "topics",
        paperBand,
        heading: strOr(r.heading, DEFAULT_TOPICS_HEADING),
        categories: idList(r.categories, 200),
      });
    case "orderSteps": {
      const steps = Array.isArray(r.steps)
        ? r.steps
            .filter(isRecord)
            .map((s) => ({ title: str(s.title), body: str(s.body) }))
            .filter((s) => s.title)
            .slice(0, 5)
        : DEFAULT_ORDER_STEPS.map((s) => ({ ...s }));
      const linkUrl = str(r.linkUrl);
      const linkHref = safeHref(linkUrl, { allowMailto: true });
      const heading = strOr(r.heading, DEFAULT_ORDER.heading);
      if (linkUrl && !linkHref) {
        warn(`${blockTitle({ blockType: "orderSteps", heading })}: alamat tautan “${linkUrl}” tidak sah sehingga tautan tidak ditampilkan.`);
      }
      return section({
        blockType: "orderSteps",
        paperBand,
        heading,
        intro: str(r.intro),
        steps,
        note: str(r.note),
        linkLabel: strOr(r.linkLabel, DEFAULT_ORDER.linkLabel),
        linkHref,
      });
    }
    case "callToAction": {
      const heading = strOr(r.heading, BLOCK_LABELS.callToAction);
      const buttonUrl = str(r.buttonUrl);
      const buttonLabel = str(r.buttonLabel);
      const buttonHref = safeHref(buttonUrl, { allowMailto: true });
      if (buttonUrl && !buttonHref) {
        warn(`${blockTitle({ blockType: "callToAction", heading })}: alamat tombol “${buttonUrl}” tidak sah sehingga tombol tidak ditampilkan.`);
      } else if (!buttonUrl || !buttonLabel) {
        warn(`${blockTitle({ blockType: "callToAction", heading })}: teks atau alamat tombol masih kosong sehingga tombol tidak ditampilkan.`);
      }
      return section({
        blockType: "callToAction",
        paperBand,
        heading,
        body: str(r.body),
        buttonLabel,
        buttonHref,
        buttonStyle: oneOf<ButtonStyle>(r.buttonStyle, ["outline", "solid"], "outline"),
      });
    }
    case "news":
      return section({
        blockType: "news",
        paperBand,
        heading: strOr(r.heading, DEFAULT_NEWS.heading),
        limit: int(r.limit, 1, 6, DEFAULT_NEWS.limit),
        allLinkLabel: strOr(r.allLinkLabel, DEFAULT_NEWS.allLinkLabel),
      });
    case "textSection": {
      const heading = str(r.heading);
      const { value, removedLinks } = sanitizeRichText(r.content);
      if (removedLinks > 0) {
        warn(`${blockTitle({ blockType: "textSection", heading })}: ${removedLinks} tautan tidak sah (bukan /… atau https://…) ditampilkan sebagai teks biasa.`);
      }
      return section({
        blockType: "textSection",
        paperBand,
        heading,
        content: value,
        columns: oneOf<TextColumns>(r.columns, ["split", "single"], "split"),
      });
    }
    default:
      return null;
  }
}

/**
 * Susunan siap render. Menjamin Pembuka (baris identitas penerbit) selalu ada dan paling
 * atas, apa pun isi draf; bagian tersembunyi dibuang; ID judul unik.
 */
export function normalizeLayout(raw: unknown): NormalizeResult {
  const warnings: string[] = [];
  const warn = (message: string) => warnings.push(message);

  const rows = Array.isArray(raw) ? raw : [];
  const parsed: Resolved[] = [];
  for (const row of rows) {
    const resolved = resolveRow(row, warn);
    if (resolved) {
      parsed.push(resolved);
      if (isRecord(row) && rowStrings(row).some((s) => checkForbiddenName(s) !== true)) {
        warn(`${blockTitle(resolved.block)} menyebut nama yang salah. Nama penerbit resmi: Yayasan Populi Indonesia; ganti sebelum menayangkan.`);
      }
    } else if (row !== null && row !== undefined) {
      warn("Ada bagian dengan jenis yang tidak dikenal; bagian itu diabaikan.");
    }
  }

  const usedDefault = parsed.length === 0;
  const source: Resolved[] = usedDefault
    ? HOMEPAGE_DEFAULT_LAYOUT.map((row) => resolveRow(row, warn)).filter((r): r is Resolved => r !== null)
    : parsed;
  if (usedDefault) warn("Susunan Beranda masih kosong; yang tampil adalah susunan bawaan.");

  // Bagian tersembunyi tidak dirender (Pembuka tidak bisa disembunyikan).
  const visible = source.filter((r) => {
    if (r.block.blockType !== "hero" && r.hidden) {
      warn(`${blockTitle(r.block)} disembunyikan dan tidak tampil di situs.`);
      return false;
    }
    return true;
  });

  // Tepat satu Pembuka, paling atas.
  const heroIndex = visible.findIndex((r) => r.block.blockType === "hero");
  let hero: Resolved;
  if (heroIndex === -1) {
    hero = resolveHero(HOMEPAGE_DEFAULT_LAYOUT.find((row) => row.blockType === "hero") ?? {});
    warn("Bagian “Pembuka” tidak ada; situs memakai Pembuka bawaan. Tambahkan Pembuka di urutan pertama sebelum menayangkan.");
  } else {
    hero = visible[heroIndex];
    if (heroIndex > 0) warn("Bagian “Pembuka” harus paling atas; di situs bagian ini tetap ditampilkan pertama.");
  }
  const others = visible.filter((r, i) => {
    if (r.block.blockType !== "hero") return true;
    if (i !== heroIndex) warn("Ada lebih dari satu “Pembuka”; hanya yang pertama ditampilkan.");
    return false;
  });
  const ordered = [hero, ...others];

  // ID judul unik: jangkar admin bila sah, bukan milik situs, dan belum terpakai; selain itu bagian-N.
  const used = new Set<string>();
  const blocks: NormalizedBlock[] = ordered.map(({ block, anchor }, i) => {
    const key = `${i}-${block.blockType}`;
    if (block.blockType === "hero") return { ...block, key, headingId: "", rule: false, priorityCount: 0 };

    let headingId = "";
    if (anchor && ANCHOR_RE.test(anchor) && !isReservedAnchor(anchor) && !used.has(anchor)) {
      headingId = anchor;
    } else {
      if (anchor) warn(`${blockTitle(block)}: ID jangkar “${anchor}” tidak sah atau sudah dipakai; diganti otomatis.`);
      const base = `bagian-${i}`;
      headingId = base;
      for (let n = 2; used.has(headingId); n += 1) headingId = `${base}-${n}`;
    }
    used.add(headingId);

    const prev = ordered[i - 1]?.block;
    const rule = i !== 1 && !block.paperBand && !prev?.paperBand;
    const priorityCount = i === 1 && (block.blockType === "latestBooks" || block.blockType === "bookShelf") ? 4 : 0;
    return { ...block, key, headingId, rule, priorityCount };
  });

  return { blocks, warnings, usedDefault };
}

/* -------------------------------------------------------------------------- */
/* Identitas penerbit                                                          */
/* -------------------------------------------------------------------------- */

const PUBLISHER_FALLBACK = "Yayasan Populi Indonesia";

/**
 * Pengantar Pembuka dengan nama penerbit resmi. Hasilnya SELALU diawali kalimat
 * identitas (“<nama> menerbitkan buku untuk pembaca umum.”): bila draf tidak diawali
 * kalimat itu, kalimat identitas didahulukan. Penggantian memakai split/join agar pola
 * `$&`, `$'`, dan sejenisnya di nama penerbit tidak ditafsirkan.
 */
export const resolveIntro = (intro: unknown, publisherName: string): string => {
  const name = publisherName.trim() || PUBLISHER_FALLBACK;
  const base = str(intro) || DEFAULT_HERO_INTRO;
  const withIdentity = base.startsWith(IDENTITY_SENTENCE) ? base : `${IDENTITY_SENTENCE} ${base}`;
  return withIdentity.split(PUBLISHER_TOKEN).join(name);
};

/* -------------------------------------------------------------------------- */
/* Rencana kueri (satu putaran, tanpa N+1)                                     */
/* -------------------------------------------------------------------------- */

export type QueryPlan = {
  /** Buku pilihan manual (sorotan + rak manual), urutan pertama muncul. */
  bookIds: number[];
  /** Jumlah buku terbaru terbesar yang diminta (0 = tidak perlu). */
  latest: number;
  /** Jumlah buku unggulan terbesar yang diminta. */
  featured: number;
  /** ID kategori → jumlah buku terbesar untuk rak kategori itu. */
  categories: Map<number, number>;
  needCategoryList: boolean;
  posts: number;
};

export function planQueries(blocks: readonly NormalizedBlock[]): QueryPlan {
  const bookIds: number[] = [];
  const addBook = (id: number | null) => {
    if (id !== null && !bookIds.includes(id)) bookIds.push(id);
  };
  const plan: QueryPlan = { bookIds, latest: 0, featured: 0, categories: new Map(), needCategoryList: false, posts: 0 };

  for (const b of blocks) {
    switch (b.blockType) {
      case "hero":
        if (b.spotlightMode === "none") break;
        // Pilihan manual yang belum tayang jatuh ke sorotan otomatis.
        plan.featured = Math.max(plan.featured, 1);
        plan.latest = Math.max(plan.latest, 1);
        if (b.spotlightMode === "manual") addBook(b.spotlightBook);
        break;
      case "latestBooks":
        plan.latest = Math.max(plan.latest, b.limit);
        break;
      case "bookShelf":
        if (b.source === "manual") b.books.forEach(addBook);
        else if (b.source === "featured") plan.featured = Math.max(plan.featured, b.limit);
        else if (b.category !== null) {
          plan.categories.set(b.category, Math.max(plan.categories.get(b.category) ?? 0, b.limit));
          plan.needCategoryList = true;
        }
        break;
      case "topics":
        plan.needCategoryList = true;
        break;
      case "news":
        plan.posts = Math.max(plan.posts, b.limit);
        break;
      default:
        break;
    }
  }
  return plan;
}

/* -------------------------------------------------------------------------- */
/* Pemilihan data per bagian (renderer hanya memotong hasil loadHomepageData)  */
/* -------------------------------------------------------------------------- */

export type HomepageData = {
  byId: Map<number, Book>;
  latest: Book[];
  featured: Book[];
  byCategory: Map<number, Book[]>;
  categories: Category[];
  posts: Post[];
};

export const EMPTY_HOMEPAGE_DATA: HomepageData = {
  byId: new Map(),
  latest: [],
  featured: [],
  byCategory: new Map(),
  categories: [],
  posts: [],
};

export function selectSpotlight(
  block: HeroBlock,
  data: HomepageData,
): { book: Book | null; label: string; manualMissing: boolean } {
  if (block.spotlightMode === "none") return { book: null, label: "", manualMissing: false };
  const manual =
    block.spotlightMode === "manual" && block.spotlightBook !== null ? (data.byId.get(block.spotlightBook) ?? null) : null;
  const book = manual ?? data.featured[0] ?? data.latest[0] ?? null;
  const label = block.spotlightLabel || (manual || data.featured.length > 0 ? "Pilihan kami" : "Baru terbit");
  return { book, label, manualMissing: block.spotlightMode === "manual" && !manual };
}

export function selectShelf(
  block: BookShelfBlock,
  data: HomepageData,
): { books: Book[]; category: Category | null; missing: number } {
  switch (block.source) {
    case "manual": {
      const books = block.books.map((id) => data.byId.get(id)).filter((b): b is Book => Boolean(b));
      return { books, category: null, missing: block.books.length - books.length };
    }
    case "category": {
      if (block.category === null) return { books: [], category: null, missing: 0 };
      const category = data.categories.find((c) => c.id === block.category) ?? null;
      return { books: (data.byCategory.get(block.category) ?? []).slice(0, block.limit), category, missing: 0 };
    }
    case "featured":
      return { books: data.featured.slice(0, block.limit), category: null, missing: 0 };
    default:
      return { books: [], category: null, missing: 0 };
  }
}

export function selectTopics(block: TopicsBlock, data: HomepageData): { categories: Category[]; missing: number } {
  if (block.categories.length === 0) return { categories: data.categories, missing: 0 };
  const byId = new Map(data.categories.map((c) => [c.id, c]));
  const categories = block.categories.map((id) => byId.get(id)).filter((c): c is Category => Boolean(c));
  return { categories, missing: block.categories.length - categories.length };
}

/** Catatan untuk pratinjau admin: pilihan yang belum tayang, bagian yang kosong. */
export function dataWarnings(blocks: readonly NormalizedBlock[], data: HomepageData): string[] {
  const out: string[] = [];
  for (const b of blocks) {
    const name = blockTitle(b);
    switch (b.blockType) {
      case "hero": {
        const s = selectSpotlight(b, data);
        if (s.manualMissing) {
          out.push("Buku sorotan Pembuka belum dipilih, belum tayang, atau sudah dihapus; sorotan memakai pilihan otomatis.");
        }
        if (b.spotlightMode !== "none" && !s.book) out.push("Belum ada buku tayang untuk sorotan Pembuka.");
        break;
      }
      case "latestBooks":
        if (data.latest.length === 0) out.push(`${name}: belum ada buku tayang; pengunjung melihat teks pengganti.`);
        break;
      case "bookShelf": {
        const s = selectShelf(b, data);
        if (s.missing > 0) out.push(`${name}: ${s.missing} buku belum tayang atau sudah dihapus dan tidak ditampilkan.`);
        if (b.source === "category" && b.category === null) out.push(`${name}: kategori belum dipilih.`);
        else if (b.source === "category" && !s.category) out.push(`${name}: kategori tidak ditemukan atau belum tayang.`);
        if (s.books.length === 0) out.push(`${name}: tidak ada buku tayang sehingga bagian ini tidak tampil.`);
        break;
      }
      case "topics": {
        const s = selectTopics(b, data);
        if (s.missing > 0) out.push(`${name}: ${s.missing} kategori tidak ditemukan dan tidak ditampilkan.`);
        if (s.categories.length === 0) out.push(`${name}: tidak ada kategori sehingga bagian ini tidak tampil.`);
        break;
      }
      case "orderSteps":
        if (b.steps.length === 0) out.push(`${name}: belum ada langkah.`);
        break;
      case "news":
        if (data.posts.length === 0) out.push(`${name}: belum ada kabar yang tayang sehingga bagian ini tidak tampil.`);
        break;
      case "textSection":
        if (!hasRichText(b.content)) out.push(`${name}: isi masih kosong sehingga bagian ini tidak tampil.`);
        break;
      default:
        break;
    }
  }
  return out;
}
