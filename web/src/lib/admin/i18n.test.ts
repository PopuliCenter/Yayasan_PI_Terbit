import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { adminTranslationsId } from "../../i18n/admin-id";

/** Kunci `lexical:` yang dipakai richtext-lexical 3.93.0 (grep dist, termasuk kunci dinamis create/edit). */
const LEXICAL_KEYS = [
  "align:alignCenterLabel",
  "align:alignJustifyLabel",
  "align:alignLeftLabel",
  "align:alignRightLabel",
  "blockquote:label",
  "blocks:inlineBlocks:create",
  "blocks:inlineBlocks:edit",
  "blocks:inlineBlocks:label",
  "blocks:inlineBlocks:remove",
  "blocks:label",
  "checklist:label",
  "general:placeholder",
  "general:slashMenuBasicGroupLabel",
  "general:slashMenuListGroupLabel",
  "general:toolbarItemsActive",
  "heading:label",
  "horizontalRule:label",
  "indent:decreaseLabel",
  "indent:increaseLabel",
  "link:label",
  "link:loadingWithEllipsis",
  "orderedList:label",
  "paragraph:label",
  "paragraph:label2",
  "relationship:label",
  "textState:defaultStyle",
  "unorderedList:label",
  "upload:label",
];

const get = (obj: unknown, path: string): unknown =>
  path.split(":").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), obj);

const allStrings = (obj: unknown): string[] =>
  typeof obj === "string" ? [obj] : obj && typeof obj === "object" ? Object.values(obj).flatMap(allStrings) : [];

describe("terjemahan admin", () => {
  it("setiap kunci lexical punya teks Indonesia", () => {
    for (const key of LEXICAL_KEYS) {
      assert.equal(typeof get(adminTranslationsId.lexical, key), "string", `lexical:${key}`);
    }
  });

  it("setiap kunci plugin-seo terisi", async () => {
    // Paket membatasi subpath lewat "exports", jadi berkas dibaca lewat path-nya.
    const file = fileURLToPath(new URL("../../../node_modules/@payloadcms/plugin-seo/dist/translations/en.js", import.meta.url));
    const mod = (await import(pathToFileURL(file).href)) as Record<string, unknown>;
    const exported = Object.values(mod)[0] as {
      "plugin-seo"?: Record<string, string>;
      translations?: { "plugin-seo": Record<string, string> };
    };
    const en = exported["plugin-seo"] ?? exported.translations?.["plugin-seo"] ?? {};
    assert.ok(Object.keys(en).length > 10, "kunci plugin-seo tidak terbaca");
    for (const key of Object.keys(en)) {
      assert.equal(typeof adminTranslationsId["plugin-seo"][key as keyof (typeof adminTranslationsId)["plugin-seo"]], "string", key);
    }
  });

  it("terjemahan form-builder yang ditimpa memakai kunci plugin dan istilah \"kolom\"", async () => {
    const file = fileURLToPath(
      new URL("../../../node_modules/@payloadcms/plugin-form-builder/dist/translations/languages/en.js", import.meta.url),
    );
    const mod = (await import(pathToFileURL(file).href)) as {
      enTranslations?: { "plugin-form-builder"?: Record<string, string> };
      en?: { translations?: { "plugin-form-builder"?: Record<string, string> } };
    };
    const en = mod.enTranslations?.["plugin-form-builder"] ?? mod.en?.translations?.["plugin-form-builder"] ?? {};
    assert.ok(Object.keys(en).length > 50, "kunci plugin-form-builder tidak terbaca");

    const ours = adminTranslationsId["plugin-form-builder"] as Record<string, string>;
    // Kunci yang tidak dikenal plugin tidak pernah tampil (salah ketik atau field yang dihapus, mis. bcc).
    for (const key of Object.keys(ours)) assert.ok(Object.hasOwn(en, key), `kunci tidak dipakai plugin: ${key}`);

    const expected: Record<string, string> = {
      fields: "Kolom formulir",
      field: "Kolom",
      submitButton: "Teks tombol kirim",
      placeholder: "Teks pilihan kosong",
      required: "Wajib diisi",
      textSingular: "Teks pendek",
      textPlural: "Kolom teks pendek",
      textareaSingular: "Teks panjang",
      textareaPlural: "Kolom teks panjang",
      emailSingular: "Email",
      emailPlural: "Kolom email",
      numberSingular: "Angka",
      numberPlural: "Kolom angka",
      selectSingular: "Daftar pilihan",
      selectPlural: "Kolom daftar pilihan",
      selectOptions: "Pilihan",
      radioOptions: "Pilihan",
      radioPlural: "Kolom radio",
      checkboxSingular: "Kotak centang",
      checkboxPlural: "Kolom kotak centang",
      datePlural: "Kolom tanggal",
      messagePlural: "Blok pesan",
    };
    for (const [key, value] of Object.entries(expected)) assert.equal(ours[key], value, key);
    for (const s of Object.values(ours)) assert.ok(!/\bbidang\b/i.test(s), `istilah "bidang" tersisa: ${s}`);
  });

  it("paket Indonesia plugin-import-export ikut (indeks plugin melewatkannya)", () => {
    const ns = adminTranslationsId["plugin-import-export"] as Record<string, string>;
    for (const key of ["startImport", "field-collectionSlug-label", "field-importMode-label", "uploadFileToSeePreview"]) {
      assert.equal(typeof ns[key], "string", key);
    }
  });

  it("tidak menyebut nama lembaga lain atau nama perangkat lunak", () => {
    for (const s of allStrings(adminTranslationsId)) {
      assert.ok(!/populi center/i.test(s), s);
      assert.ok(!/payload/i.test(s), s);
    }
  });
});
