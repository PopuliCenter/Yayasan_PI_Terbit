import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { inline, keLexical, teksPolos, type Simpul } from "./teks";

type N = { type: string; text?: string; format?: number; fields?: Record<string, unknown>; children?: N[] };

describe("teks inline", () => {
  it("tautan internal dan tebal", () => {
    const nodes = inline("Lihat [Pengiriman](/pengiriman) dan **7 hari kalender** sejak diterima.") as N[];
    assert.deepEqual(
      nodes.map((n) => n.type),
      ["text", "link", "text", "text", "text"],
    );
    assert.equal(nodes[1].fields?.url, "/pengiriman");
    assert.equal(nodes[1].fields?.newTab, false);
    assert.equal(nodes[1].children?.[0].text, "Pengiriman");
    assert.equal(nodes[3].text, "7 hari kalender");
    assert.equal(nodes[3].format, 1);
  });

  it("tautan luar yang diizinkan dibuka di tab baru", () => {
    const [, link] = inline("Situs [Ditjen PKTN](https://ditjenpktn.kemendag.go.id).") as N[];
    assert.equal(link.fields?.newTab, true);
  });

  it("menolak tautan yang tidak dikenal", () => {
    assert.throws(() => inline("[x](/tidak-ada)"), /Tautan tidak dikenal/);
    assert.throws(() => inline("[x](https://contoh.com)"), /Tautan tidak dikenal/);
  });
});

describe("keLexical", () => {
  const naskah: Simpul[] = [
    { t: "h2", text: "Ongkos kirim" },
    { t: "p", text: "Dihitung dari berat buku." },
    { t: "ol", items: ["Satu", "Dua [Kontak](/kontak)"] },
    { t: "form" },
  ];

  it("membuat dokumen dengan judul, paragraf, daftar, dan blok formulir", () => {
    const d = keLexical(naskah, { formId: 7, heading: "Ajukan penukaran" });
    const kids = d.root.children as unknown as N[];
    assert.equal(kids[0].type, "heading");
    assert.equal(kids[1].type, "paragraph");
    assert.equal(kids[2].type, "list");
    assert.equal(kids[2].children?.length, 2);
    assert.equal(kids[3].type, "block");
    assert.equal(kids[3].fields?.blockType, "formulir");
    assert.equal(kids[3].fields?.form, 7);
    assert.match(String(kids[3].fields?.id), /^[0-9a-f]{24}$/);
  });

  it("gagal bila naskah memuat formulir tetapi formulirnya belum ada", () => {
    assert.throws(() => keLexical(naskah), /formulirnya belum ada/);
  });

  it("teks polos tanpa markah", () => {
    assert.equal(teksPolos([{ t: "p", text: "Baca [Kontak](/kontak) **sekarang**." }]), "Baca Kontak sekarang.");
  });
});
