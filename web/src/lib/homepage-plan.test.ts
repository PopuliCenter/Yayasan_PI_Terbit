import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HOMEPAGE_DEFAULT_LAYOUT } from "../globals/homepage/defaults";
import {
  dataWarnings,
  EMPTY_HOMEPAGE_DATA,
  idOf,
  normalizeLayout,
  planQueries,
  resolveIntro,
  sanitizeRichText,
  selectShelf,
  selectSpotlight,
  type BookShelfBlock,
  type HeroBlock,
  type HomepageData,
} from "./homepage-plan";

const DEFAULT_TYPES = ["hero", "latestBooks", "topics", "orderSteps", "callToAction", "news"];
const types = (raw: unknown) => normalizeLayout(raw).blocks.map((b) => b.blockType);
const book = (id: number) => ({ id, title: `Buku ${id}`, slug: `buku-${id}` }) as unknown as HomepageData["latest"][number];

describe("idOf", () => {
  it("angka, dokumen terisi, atau string angka", () => {
    assert.equal(idOf(5), 5);
    assert.equal(idOf({ id: 7, title: "x" }), 7);
    assert.equal(idOf("12"), 12);
    assert.equal(idOf("12a"), null);
    assert.equal(idOf(0), null);
    assert.equal(idOf(null), null);
  });
});

describe("normalizeLayout", () => {
  it("null dan [] memakai susunan bawaan", () => {
    for (const raw of [null, undefined, [], "x"]) {
      const r = normalizeLayout(raw);
      assert.equal(r.usedDefault, true);
      assert.deepEqual(
        r.blocks.map((b) => b.blockType),
        DEFAULT_TYPES,
      );
    }
    assert.equal(normalizeLayout([...HOMEPAGE_DEFAULT_LAYOUT]).usedDefault, false);
  });

  it("susunan bawaan: ID, garis, dan prioritas sampul sama dengan beranda lama", () => {
    const { blocks, warnings } = normalizeLayout([...HOMEPAGE_DEFAULT_LAYOUT]);
    assert.deepEqual(warnings, []);
    assert.deepEqual(
      blocks.map((b) => b.headingId),
      ["", "terbaru", "kategori", "cara-pesan", "institusi", "kabar"],
    );
    assert.deepEqual(
      blocks.map((b) => b.rule),
      [false, false, true, true, true, true],
    );
    assert.deepEqual(
      blocks.map((b) => b.priorityCount),
      [0, 4, 0, 0, 0, 0],
    );
    assert.deepEqual(
      blocks.map((b) => b.paperBand),
      [false, false, false, false, false, false],
    );
    const cta = blocks.find((b) => b.blockType === "callToAction");
    assert.equal(cta?.blockType === "callToAction" && cta.buttonHref, "/institusi");
    const steps = blocks.find((b) => b.blockType === "orderSteps");
    assert.equal(steps?.blockType === "orderSteps" && steps.steps.length, 3);
    assert.equal(steps?.blockType === "orderSteps" && steps.linkHref, "/cara-pesan");
  });

  it("Pembuka yang hilang disisipkan di atas", () => {
    const r = normalizeLayout([{ blockType: "news" }, { blockType: "topics" }]);
    assert.deepEqual(
      r.blocks.map((b) => b.blockType),
      ["hero", "news", "topics"],
    );
    assert.equal(r.usedDefault, false);
    assert.ok(r.warnings.some((w) => w.includes("tidak ada")));
  });

  it("Pembuka di urutan ketiga dipindah ke atas; Pembuka kedua dibuang", () => {
    const raw = [
      { blockType: "news" },
      { blockType: "topics" },
      { blockType: "hero", heading: "Judul A" },
      { blockType: "hero", heading: "Judul B" },
    ];
    const r = normalizeLayout(raw);
    assert.deepEqual(
      r.blocks.map((b) => b.blockType),
      ["hero", "news", "topics"],
    );
    assert.equal(r.blocks[0].blockType === "hero" && r.blocks[0].heading, "Judul A");
    assert.equal(r.warnings.length, 2);
  });

  it("bagian tersembunyi dibuang; Pembuka tidak bisa disembunyikan", () => {
    assert.deepEqual(
      types([
        { blockType: "hero", hideSection: true },
        { blockType: "news", hideSection: true },
        { blockType: "topics" },
      ]),
      ["hero", "topics"],
    );
  });

  it("jenis tidak dikenal diabaikan", () => {
    assert.deepEqual(types([{ blockType: "hero" }, { blockType: "iklan" }, { blockType: "news" }]), ["hero", "news"]);
  });

  it("jangkar ganda, tidak sah, atau milik situs diganti bagian-N yang unik", () => {
    const { blocks } = normalizeLayout([
      { blockType: "hero" },
      { blockType: "news", anchor: "kabar" },
      { blockType: "topics", anchor: "kabar" },
      { blockType: "textSection", anchor: "konten" },
      { blockType: "orderSteps", anchor: "Bukan Sah" },
      { blockType: "latestBooks", anchor: "bagian-2" },
    ]);
    const ids = blocks.map((b) => b.headingId);
    assert.deepEqual(ids, ["", "kabar", "bagian-2", "bagian-3", "bagian-4", "bagian-5"]);
    assert.equal(new Set(ids).size, ids.length);
  });

  it("jangkar yang menabrak ID formulir kabar di footer diganti", () => {
    const { blocks, warnings } = normalizeLayout([
      { blockType: "hero" },
      { blockType: "news", anchor: "nl-email" },
      { blockType: "topics", anchor: "nl-consent" },
      { blockType: "orderSteps", anchor: "footer-kabar" },
    ]);
    assert.deepEqual(
      blocks.map((b) => b.headingId),
      ["", "bagian-1", "bagian-2", "bagian-3"],
    );
    assert.equal(warnings.filter((w) => w.includes("ID jangkar")).length, 3);
  });

  it("jangkar Teks bebas tanpa judul tetap dipakai (dipasang di <section>)", () => {
    const content = { root: { type: "root", children: [{ type: "paragraph", children: [{ type: "text", text: "Visi" }] }] } };
    const { blocks } = normalizeLayout([{ blockType: "hero" }, { blockType: "textSection", anchor: "visi", content }]);
    assert.equal(blocks[1].blockType === "textSection" && blocks[1].heading, "");
    assert.equal(blocks[1].headingId, "visi");
  });

  it("Pengantar tanpa kalimat identitas diberi peringatan pratinjau", () => {
    const { warnings } = normalizeLayout([{ blockType: "hero", intro: "Mitra distribusi {penerbit}." }]);
    assert.ok(warnings.some((w) => w.includes("harus diawali")));
    assert.deepEqual(normalizeLayout([{ blockType: "hero", intro: "{penerbit} menerbitkan buku untuk pembaca umum. Lain." }]).warnings, []);
  });

  it("pita kertas menghapus garis bagian itu dan bagian sesudahnya", () => {
    const { blocks } = normalizeLayout([
      { blockType: "hero" },
      { blockType: "news" },
      { blockType: "topics", paperBand: true },
      { blockType: "orderSteps" },
      { blockType: "callToAction", buttonLabel: "x", buttonUrl: "/x" },
    ]);
    assert.deepEqual(
      blocks.map((b) => b.rule),
      [false, false, false, false, true],
    );
  });

  it("draf tanpa nilai: skalar terisi bawaan dan dibatasi", () => {
    const { blocks } = normalizeLayout([
      { blockType: "hero", heading: "  ", spotlightMode: "aneh" },
      { blockType: "latestBooks", limit: 99, allLinkLabel: "" },
      { blockType: "news", limit: 0 },
    ]);
    const [h, l, n] = blocks;
    assert.equal(h.blockType === "hero" && h.heading, "Buku kajian politik, demokrasi, dan kebijakan publik.");
    assert.equal(h.blockType === "hero" && h.spotlightMode, "auto");
    assert.equal(l.blockType === "latestBooks" && l.limit, 12);
    assert.equal(l.blockType === "latestBooks" && l.allLinkLabel, "Lihat semua buku");
    assert.equal(n.blockType === "news" && n.limit, 1);
  });

  it("alamat tombol berbahaya tidak menghasilkan href", () => {
    const { blocks, warnings } = normalizeLayout([
      { blockType: "hero" },
      { blockType: "callToAction", heading: "A", body: "b", buttonLabel: "Klik", buttonUrl: "javascript:alert(1)" },
      { blockType: "orderSteps", linkUrl: "//evil.com" },
    ]);
    assert.equal(blocks[1].blockType === "callToAction" && blocks[1].buttonHref, null);
    assert.equal(blocks[2].blockType === "orderSteps" && blocks[2].linkHref, null);
    assert.equal(warnings.length, 2);
  });
});

describe("resolveIntro", () => {
  const NAME = "Yayasan Populi Indonesia";
  const IDENTITY = `${NAME} menerbitkan buku untuk pembaca umum.`;
  it("selalu diawali kalimat identitas dengan nama penerbit", () => {
    const intros = [undefined, null, "", "   ", "Kami menerbitkan buku.", "{penerbit} menerbitkan buku.", "{penerbit}", 42];
    for (const intro of intros) {
      const out = resolveIntro(intro, NAME);
      assert.ok(out.startsWith(IDENTITY), String(intro));
      assert.ok(!out.includes("{penerbit}"), String(intro));
    }
  });
  it("penanda diganti; kalimat identitas didahulukan bila Pengantar tidak diawali kalimat itu", () => {
    assert.equal(resolveIntro("{penerbit} menerbitkan buku untuk pembaca umum. Tentang {penerbit}.", NAME), `${IDENTITY} Tentang ${NAME}.`);
    assert.equal(resolveIntro("Tentang {penerbit}.", NAME), `${IDENTITY} Tentang ${NAME}.`);
    assert.equal(resolveIntro("Mitra distribusi {penerbit}.", NAME), `${IDENTITY} Mitra distribusi ${NAME}.`);
    assert.equal(resolveIntro("{penerbit}", NAME), `${IDENTITY} ${NAME}`);
    assert.equal(resolveIntro("Kami menerbitkan buku.", NAME), `${IDENTITY} Kami menerbitkan buku.`);
    assert.ok(resolveIntro(null, "  ").includes(NAME));
  });
  it("pola pengganti ($&, $`, $', $$) di nama penerbit tidak ditafsirkan", () => {
    for (const name of ["A $& B", "A $` B", "A $' B", "A $$ B"]) {
      const out = resolveIntro(null, name);
      assert.ok(out.startsWith(`${name} menerbitkan buku`), name);
      assert.ok(!out.includes("{penerbit}"), name);
    }
  });
  it("bawaan sama dengan teks beranda lama", () => {
    assert.equal(
      resolveIntro(null, NAME),
      `${NAME} menerbitkan buku untuk pembaca umum. Situs ini adalah katalog resmi terbitan kami: pilih judul, lalu pesan lewat WhatsApp.`,
    );
  });
});

describe("planQueries", () => {
  it("susunan bawaan = kueri beranda lama", () => {
    const plan = planQueries(normalizeLayout(null).blocks);
    assert.equal(plan.latest, 8);
    assert.equal(plan.featured, 1);
    assert.equal(plan.posts, 3);
    assert.equal(plan.needCategoryList, true);
    assert.deepEqual(plan.bookIds, []);
    assert.equal(plan.categories.size, 0);
  });
  it("menggabungkan kebutuhan semua bagian tanpa duplikat", () => {
    const plan = planQueries(
      normalizeLayout([
        { blockType: "hero", spotlightMode: "manual", spotlightBook: 9 },
        { blockType: "bookShelf", source: "manual", books: [3, { id: 9 }, 3, "4"] },
        { blockType: "bookShelf", source: "category", category: 2, limit: 6 },
        { blockType: "bookShelf", source: "category", category: 2, limit: 3 },
        { blockType: "bookShelf", source: "featured", limit: 5 },
        { blockType: "news", limit: 6 },
      ]).blocks,
    );
    assert.deepEqual(plan.bookIds, [9, 3, 4]);
    assert.deepEqual([...plan.categories], [[2, 6]]);
    assert.equal(plan.featured, 5);
    assert.equal(plan.latest, 1);
    assert.equal(plan.posts, 6);
    assert.equal(plan.needCategoryList, true);
  });
  it("tanpa sorotan dan tanpa bagian buku: tidak ada kueri buku", () => {
    const plan = planQueries(normalizeLayout([{ blockType: "hero", spotlightMode: "none" }]).blocks);
    assert.equal(plan.latest, 0);
    assert.equal(plan.featured, 0);
    assert.equal(plan.posts, 0);
  });
});

describe("pemilihan data", () => {
  const data: HomepageData = { ...EMPTY_HOMEPAGE_DATA, byId: new Map([[3, book(3)]]), latest: [book(1)], featured: [] };
  it("sorotan manual yang belum tayang jatuh ke otomatis", () => {
    const hero = normalizeLayout([{ blockType: "hero", spotlightMode: "manual", spotlightBook: 99 }]).blocks[0] as HeroBlock;
    const s = selectSpotlight(hero, data);
    assert.equal(s.book?.id, 1);
    assert.equal(s.label, "Baru terbit");
    assert.equal(s.manualMissing, true);
  });
  it("rak manual menjaga urutan admin dan membuang yang belum tayang", () => {
    const shelf = normalizeLayout([{ blockType: "hero" }, { blockType: "bookShelf", source: "manual", books: [5, 3] }])
      .blocks[1] as BookShelfBlock;
    const s = selectShelf(shelf, data);
    assert.deepEqual(
      s.books.map((b) => b.id),
      [3],
    );
    assert.equal(s.missing, 1);
    assert.ok(dataWarnings([shelf], data).some((w) => w.includes("1 buku")));
  });
});

describe("sanitizeRichText", () => {
  it("melepas tautan berbahaya, membuang node asing, membatasi judul", () => {
    const { value, removedLinks } = sanitizeRichText({
      root: {
        type: "root",
        children: [
          { type: "heading", tag: "h1", children: [{ type: "text", text: "Judul" }] },
          {
            type: "paragraph",
            children: [
              { type: "link", fields: { url: "javascript:alert(1)" }, children: [{ type: "text", text: "a" }] },
              { type: "link", fields: { url: "https://x.id" }, children: [{ type: "text", text: "b" }] },
            ],
          },
          { type: "upload", value: 1 },
        ],
      },
    });
    assert.equal(removedLinks, 1);
    const root = value?.root as { children: { type: string; tag?: string; children?: { type: string }[] }[] };
    assert.equal(root.children.length, 2);
    assert.equal(root.children[0].tag, "h2");
    assert.deepEqual(
      root.children[1].children?.map((c) => c.type),
      ["text", "link"],
    );
    assert.equal(sanitizeRichText(null).value, null);
  });

  it("node teks dengan `text` bukan teks/angka dibuang; angka diubah ke teks", () => {
    const { value } = sanitizeRichText({
      root: {
        type: "root",
        children: [
          {
            type: "paragraph",
            children: [
              { type: "text", text: "ok " },
              { type: "text", text: { a: 1 } },
              { type: "text", text: [{ a: 1 }] },
              { type: "text", text: null },
              { type: "text", text: 7, format: "bold" },
            ],
          },
        ],
      },
    });
    const root = value?.root as { children: { children: { text: unknown; format: unknown }[] }[] };
    assert.deepEqual(
      root.children[0].children.map((c) => [c.text, c.format]),
      [
        ["ok ", 0],
        ["7", 0],
      ],
    );
  });
});
