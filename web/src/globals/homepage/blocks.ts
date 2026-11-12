/**
 * Jenis bagian Beranda. Nama field berbahasa Inggris (sama dengan koleksi lain), label
 * dan bantuan berbahasa Indonesia. Teks bawaan diambil dari defaults.ts.
 */
import {
  BlockquoteFeature,
  BoldFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  UnderlineFeature,
  UnorderedListFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical";
import type { Block, Field } from "payload";
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
  IDENTITY_SENTENCE,
} from "./defaults";
import { anchorField, heroIntro, hrefField, safeRichText, safeText, safeTextarea } from "./validation";

const ROW_LABEL = "@/components/admin/HomeBlockLabel#HomeBlockLabel";

type Sibling = Record<string, unknown> | undefined;
const siblingIs =
  (name: string, value: unknown) =>
  (_data: unknown, siblingData: Sibling): boolean =>
    siblingData?.[name] === value;
const siblingIsNot =
  (name: string, value: unknown) =>
  (_data: unknown, siblingData: Sibling): boolean =>
    siblingData?.[name] !== value;

const blockAdmin = (group: string): Block["admin"] => ({
  disableBlockName: true,
  group,
  components: { Label: ROW_LABEL },
});

const heading = (overrides: { label?: string; defaultValue?: string; required?: boolean } = {}): Field => ({
  name: "heading",
  type: "text",
  label: overrides.label ?? "Judul bagian",
  required: overrides.required ?? true,
  maxLength: 100,
  ...(overrides.defaultValue ? { defaultValue: overrides.defaultValue } : {}),
  validate: safeText,
});

/** Field bersama semua bagian selain Pembuka: sembunyikan, pita kertas, jangkar. */
const sectionFields = (): Field[] => [
  {
    name: "hideSection",
    type: "checkbox",
    label: "Sembunyikan bagian ini dari situs",
    defaultValue: false,
    admin: { description: "Bagian tetap tersimpan dan bisa ditampilkan lagi kapan saja." },
  },
  {
    type: "collapsible",
    label: "Tampilan bagian",
    admin: { initCollapsed: true },
    fields: [
      {
        type: "row",
        fields: [
          {
            name: "paperBand",
            type: "checkbox",
            label: "Latar pita kertas",
            defaultValue: false,
            admin: {
              description:
                "Bagian diberi latar kertas sedikit lebih gelap selebar layar. Warna diambil dari palet situs sehingga kontras tetap terjaga.",
            },
          },
          {
            name: "anchor",
            type: "text",
            label: "ID jangkar (opsional)",
            maxLength: 40,
            validate: anchorField,
            admin: {
              description:
                "Untuk tautan langsung ke bagian ini, mis. /#cara-pesan. Huruf kecil, angka, dan tanda hubung; diawali huruf.",
            },
          },
        ],
      },
    ],
  },
];

export const heroBlock: Block = {
  slug: "hero",
  interfaceName: "HomeHeroBlock",
  labels: { singular: BLOCK_LABELS.hero, plural: BLOCK_LABELS.hero },
  admin: blockAdmin("Wajib"),
  fields: [
    {
      name: "heading",
      type: "text",
      label: "Judul utama",
      required: true,
      maxLength: 120,
      defaultValue: DEFAULT_HERO_HEADING,
      validate: safeText,
    },
    {
      name: "intro",
      type: "textarea",
      label: "Pengantar",
      required: true,
      maxLength: 400,
      defaultValue: DEFAULT_HERO_INTRO,
      validate: heroIntro,
      admin: {
        description: `Kalimat pertama wajib tetap “${IDENTITY_SENTENCE}”: penanda {penerbit} diganti otomatis dengan nama penerbit resmi dari Pengaturan Situs, dan verifikator ISBN membaca kalimat ini di layar pertama. Kalimat sesudahnya bebas. Tautan "Tentang kami" selalu ditambahkan di akhir.`,
      },
    },
    {
      type: "row",
      fields: [
        {
          name: "showSearch",
          type: "checkbox",
          label: "Tampilkan kotak pencarian",
          defaultValue: true,
        },
        {
          name: "searchPlaceholder",
          type: "text",
          label: "Teks contoh di kotak pencarian",
          defaultValue: DEFAULT_SEARCH_PLACEHOLDER,
          maxLength: 60,
          validate: safeText,
          admin: { condition: siblingIsNot("showSearch", false) },
        },
      ],
    },
    {
      name: "spotlightMode",
      type: "radio",
      label: "Sorotan buku",
      defaultValue: "auto",
      options: [
        { label: "Otomatis (buku unggulan, lalu terbaru)", value: "auto" },
        { label: "Pilih sendiri", value: "manual" },
        { label: "Tanpa sorotan", value: "none" },
      ],
      admin: { layout: "horizontal" },
    },
    {
      name: "spotlightBook",
      type: "relationship",
      relationTo: "books",
      label: "Buku sorotan",
      required: true,
      admin: {
        condition: siblingIs("spotlightMode", "manual"),
        allowCreate: false,
        description: "Bila buku ini belum tayang atau dihapus, sorotan kembali otomatis.",
      },
    },
    {
      name: "spotlightLabel",
      type: "text",
      label: "Label sorotan",
      maxLength: 40,
      validate: safeText,
      admin: {
        condition: siblingIsNot("spotlightMode", "none"),
        placeholder: "Pilihan kami",
        description: 'Kosongkan untuk label otomatis: "Pilihan kami" atau "Baru terbit".',
      },
    },
  ],
};

export const latestBooksBlock: Block = {
  slug: "latestBooks",
  interfaceName: "HomeLatestBooksBlock",
  labels: { singular: BLOCK_LABELS.latestBooks, plural: BLOCK_LABELS.latestBooks },
  admin: blockAdmin("Buku"),
  fields: [
    heading({ defaultValue: DEFAULT_LATEST.heading }),
    {
      name: "limit",
      type: "number",
      label: "Jumlah buku",
      required: true,
      min: 2,
      max: 12,
      defaultValue: DEFAULT_LATEST.limit,
      admin: { step: 1, description: "Kelipatan 4 paling rapi di layar lebar." },
    },
    {
      type: "row",
      fields: [
        {
          name: "showAllLink",
          type: "checkbox",
          label: "Tampilkan tautan ke katalog",
          defaultValue: true,
        },
        {
          name: "allLinkLabel",
          type: "text",
          label: "Teks tautan",
          defaultValue: DEFAULT_LATEST.allLinkLabel,
          maxLength: 40,
          validate: safeText,
          admin: { condition: siblingIsNot("showAllLink", false) },
        },
      ],
    },
    {
      name: "emptyText",
      type: "text",
      label: "Teks bila katalog kosong",
      defaultValue: DEFAULT_LATEST.emptyText,
      maxLength: 200,
      validate: safeText,
    },
    ...sectionFields(),
  ],
};

export const bookShelfBlock: Block = {
  slug: "bookShelf",
  interfaceName: "HomeBookShelfBlock",
  labels: { singular: BLOCK_LABELS.bookShelf, plural: BLOCK_LABELS.bookShelf },
  admin: blockAdmin("Buku"),
  fields: [
    heading(),
    {
      name: "intro",
      type: "textarea",
      label: "Pengantar (opsional)",
      maxLength: 300,
      validate: safeTextarea,
    },
    {
      name: "source",
      type: "radio",
      label: "Sumber buku",
      defaultValue: "manual",
      options: [
        { label: "Pilih buku sendiri", value: "manual" },
        { label: "Dari satu kategori", value: "category" },
        { label: "Buku unggulan", value: "featured" },
      ],
      admin: { layout: "horizontal" },
    },
    {
      name: "books",
      type: "relationship",
      relationTo: "books",
      hasMany: true,
      label: "Buku",
      required: true,
      minRows: 1,
      maxRows: 12,
      admin: {
        condition: siblingIs("source", "manual"),
        isSortable: true,
        allowCreate: false,
        description: "Urutan di sini = urutan di situs. Buku yang belum tayang tidak ditampilkan.",
      },
    },
    {
      name: "category",
      type: "relationship",
      relationTo: "categories",
      label: "Kategori",
      required: true,
      admin: { condition: siblingIs("source", "category"), allowCreate: false },
    },
    {
      name: "limit",
      type: "number",
      label: "Jumlah buku",
      min: 2,
      max: 12,
      defaultValue: DEFAULT_SHELF_LIMIT,
      admin: { step: 1, condition: siblingIsNot("source", "manual") },
    },
    {
      name: "showAllLink",
      type: "checkbox",
      label: "Tautan ke halaman kategori",
      defaultValue: true,
      admin: { condition: siblingIs("source", "category") },
    },
    ...sectionFields(),
  ],
};

export const topicsBlock: Block = {
  slug: "topics",
  interfaceName: "HomeTopicsBlock",
  labels: { singular: BLOCK_LABELS.topics, plural: BLOCK_LABELS.topics },
  admin: blockAdmin("Buku"),
  fields: [
    heading({ defaultValue: DEFAULT_TOPICS_HEADING }),
    {
      name: "categories",
      type: "relationship",
      relationTo: "categories",
      hasMany: true,
      label: "Topik yang ditampilkan",
      admin: {
        isSortable: true,
        allowCreate: false,
        description: "Kosongkan untuk menampilkan semua kategori menurut urutan tampil.",
      },
    },
    ...sectionFields(),
  ],
};

export const orderStepsBlock: Block = {
  slug: "orderSteps",
  interfaceName: "HomeOrderStepsBlock",
  labels: { singular: BLOCK_LABELS.orderSteps, plural: BLOCK_LABELS.orderSteps },
  admin: blockAdmin("Informasi"),
  fields: [
    heading({ defaultValue: DEFAULT_ORDER.heading }),
    {
      name: "intro",
      type: "textarea",
      label: "Pengantar (opsional)",
      maxLength: 300,
      defaultValue: DEFAULT_ORDER.intro,
      validate: safeTextarea,
    },
    {
      name: "steps",
      type: "array",
      label: "Langkah",
      labels: { singular: "Langkah", plural: "Langkah" },
      minRows: 1,
      maxRows: 5,
      defaultValue: () => DEFAULT_ORDER_STEPS.map((s) => ({ ...s })),
      fields: [
        {
          name: "title",
          type: "text",
          label: "Judul langkah",
          required: true,
          maxLength: 60,
          validate: safeText,
        },
        {
          name: "body",
          type: "textarea",
          label: "Penjelasan",
          required: true,
          maxLength: 240,
          validate: safeTextarea,
        },
      ],
    },
    {
      name: "note",
      type: "textarea",
      label: "Catatan di bawah langkah (opsional)",
      maxLength: 300,
      defaultValue: DEFAULT_ORDER.note,
      validate: safeTextarea,
    },
    {
      type: "row",
      fields: [
        {
          name: "linkLabel",
          type: "text",
          label: "Teks tautan",
          defaultValue: DEFAULT_ORDER.linkLabel,
          maxLength: 40,
          validate: safeText,
        },
        {
          name: "linkUrl",
          type: "text",
          label: "Alamat tautan",
          defaultValue: DEFAULT_ORDER.linkUrl,
          maxLength: 300,
          validate: hrefField,
          admin: { description: "Kosongkan bila tanpa tautan. Diawali /, mis. /cara-pesan, atau https://…" },
        },
      ],
    },
    ...sectionFields(),
  ],
};

export const callToActionBlock: Block = {
  slug: "callToAction",
  interfaceName: "HomeCallToActionBlock",
  labels: { singular: BLOCK_LABELS.callToAction, plural: BLOCK_LABELS.callToAction },
  admin: blockAdmin("Informasi"),
  fields: [
    heading(),
    {
      name: "body",
      type: "textarea",
      label: "Isi",
      required: true,
      maxLength: 500,
      validate: safeTextarea,
      admin: { description: "Pisahkan paragraf dengan baris kosong." },
    },
    {
      type: "row",
      fields: [
        {
          name: "buttonLabel",
          type: "text",
          label: "Teks tombol",
          required: true,
          maxLength: 40,
          validate: safeText,
        },
        {
          name: "buttonUrl",
          type: "text",
          label: "Alamat tombol",
          required: true,
          maxLength: 300,
          validate: hrefField,
          admin: { description: "Diawali / untuk halaman di situs ini, mis. /institusi, atau alamat lengkap https://…" },
        },
      ],
    },
    {
      name: "buttonStyle",
      type: "radio",
      label: "Gaya tombol",
      defaultValue: "outline",
      options: [
        { label: "Garis (tenang)", value: "outline" },
        { label: "Tinta (menonjol)", value: "solid" },
      ],
      admin: { layout: "horizontal" },
    },
    ...sectionFields(),
  ],
};

export const newsBlock: Block = {
  slug: "news",
  interfaceName: "HomeNewsBlock",
  labels: { singular: BLOCK_LABELS.news, plural: BLOCK_LABELS.news },
  admin: blockAdmin("Informasi"),
  fields: [
    heading({ defaultValue: DEFAULT_NEWS.heading }),
    {
      name: "limit",
      type: "number",
      label: "Jumlah kabar",
      required: true,
      min: 1,
      max: 6,
      defaultValue: DEFAULT_NEWS.limit,
      admin: { step: 1 },
    },
    {
      name: "allLinkLabel",
      type: "text",
      label: "Teks tautan ke semua kabar",
      defaultValue: DEFAULT_NEWS.allLinkLabel,
      maxLength: 40,
      validate: safeText,
    },
    ...sectionFields(),
  ],
};

export const textSectionBlock: Block = {
  slug: "textSection",
  interfaceName: "HomeTextBlock",
  labels: { singular: BLOCK_LABELS.textSection, plural: BLOCK_LABELS.textSection },
  admin: blockAdmin("Informasi"),
  fields: [
    heading({
      label: "Judul bagian (disarankan)",
      required: false,
    }),
    {
      name: "content",
      type: "richText",
      label: "Isi",
      required: true,
      validate: safeRichText,
      // Tanpa unggahan/relasi: global dibaca pada depth 0, jadi node itu tidak akan terisi.
      editor: lexicalEditor({
        features: [
          ParagraphFeature(),
          BoldFeature(),
          ItalicFeature(),
          UnderlineFeature(),
          HeadingFeature({ enabledHeadingSizes: ["h2", "h3"] }),
          UnorderedListFeature(),
          OrderedListFeature(),
          LinkFeature({ enabledCollections: [] }),
          BlockquoteFeature(),
          HorizontalRuleFeature(),
          InlineToolbarFeature(),
          FixedToolbarFeature(),
        ],
      }),
    },
    {
      name: "columns",
      type: "radio",
      label: "Tata letak",
      defaultValue: "split",
      options: [
        { label: "Judul di kiri, isi di kanan", value: "split" },
        { label: "Satu kolom", value: "single" },
      ],
      admin: { layout: "horizontal" },
    },
    ...sectionFields(),
  ],
};

/** Urutan di laci "Tambah bagian". */
export const HOMEPAGE_BLOCKS: Block[] = [
  heroBlock,
  latestBooksBlock,
  bookShelfBlock,
  topicsBlock,
  orderStepsBlock,
  callToActionBlock,
  newsBlock,
  textSectionBlock,
];
