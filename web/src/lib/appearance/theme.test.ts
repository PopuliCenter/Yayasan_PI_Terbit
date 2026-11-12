import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { contrastRatio, isHex, type Hex } from "./color";
import { DEFAULT_PRESET, PRESETS, THEMABLE_KEYS, type TokenMap } from "./presets";
import { buildThemeCss, checkAccent, deriveAccent, resolveTheme } from "./theme";

/*
 * Token dasar dibaca langsung dari globals.css ASLI agar uji ikut gagal bila CSS berubah.
 * Akhir baris dinormalkan (salinan kerja di Windows bisa CRLF) dan komentar dibuang
 * supaya catatan berisi kode warna tidak ikut terbaca sebagai token.
 */
const GLOBALS_CSS = readFileSync(new URL("../../app/(site)/globals.css", import.meta.url), "utf8");

const parseBaseTokens = (source: string) => {
  const css = source.replace(/\r\n?/g, "\n").replace(/\/\*[\s\S]*?\*\//g, "");
  const block = (re: RegExp) => {
    const m = css.match(re);
    assert.ok(m, `blok tidak ditemukan: ${re}`);
    const tokens = Object.fromEntries(
      [...m[1].matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-f]{6})\s*;/g)].map((x) => [x[1], x[2]]),
    );
    assert.ok(Object.keys(tokens).length > 0, `blok tanpa token warna: ${re}`);
    return tokens;
  };
  const light = block(/@theme\s*\{([\s\S]*?)\n\}/);
  const dark = { ...light, ...block(/:root\[data-theme="dark"\]\s*\{([\s\S]*?)\n\s*\}/) };
  return { light, dark };
};

const { light: BASE_LIGHT, dark: BASE_DARK } = parseBaseTokens(GLOBALS_CSS);

describe("globals.css", () => {
  it("dibaca utuh dan memuat aksen yang lolos AA (#b34a0f)", () => {
    for (const key of [...THEMABLE_KEYS, "paper", "paper-2", "surface", "body", "muted"]) {
      assert.ok(isHex(BASE_LIGHT[key]), `terang ${key}`);
      assert.ok(isHex(BASE_DARK[key]), `gelap ${key}`);
    }
    assert.equal(BASE_LIGHT["accent-700"], "#b34a0f");
    assert.equal(BASE_LIGHT.focus, "#b34a0f");
  });

  it("akhir baris CRLF dan LF menghasilkan token yang sama", () => {
    const lf = GLOBALS_CSS.replace(/\r\n?/g, "\n");
    assert.deepEqual(parseBaseTokens(lf.replace(/\n/g, "\r\n")), parseBaseTokens(lf));
  });
});

const blend = (fg: Hex, bg: Hex, a: number): Hex => {
  const ch = (h: Hex, i: number) => parseInt(h.slice(i, i + 2), 16);
  return `#${[1, 3, 5].map((i) => Math.round(ch(fg, i) * a + ch(bg, i) * (1 - a)).toString(16).padStart(2, "0")).join("")}` as Hex;
};

/** [teks/indikator, latar, minimum, keterangan]. Diambil dari pemakaian kelas di komponen. */
const PAIRS: [string, string, number, string][] = [
  ["ink", "paper", 4.5, "judul"], ["ink", "paper-2", 4.5, "footer"], ["ink", "surface", 4.5, "kartu"],
  ["ink", "primary-50", 4.5, "hover:bg-primary-50"], ["ink", "accent-200", 4.5, "::selection"],
  ["body", "paper", 4.5, ""], ["body", "paper-2", 4.5, ""], ["body", "surface", 4.5, ""],
  ["muted", "paper", 4.5, ""], ["muted", "paper-2", 4.5, ""], ["muted", "surface", 4.5, ""],
  ["paper", "ink", 4.5, "btn-primary"], ["paper", "ink85", 4.5, "btn-primary:hover bg-ink/85"],
  ["primary-700", "paper", 4.5, ".link"], ["primary-700", "paper-2", 4.5, ".link footer"],
  ["primary-700", "surface", 4.5, ".link kartu"], ["primary-700", "primary-50", 4.5, "tautan di latar hover"],
  ["primary-800", "primary-100", 4.5, "inisial penulis"],
  ["accent-700", "paper", 4.5, "penanda wajib isi"], ["accent-700", "paper-2", 4.5, ""], ["accent-700", "surface", 4.5, ""],
  ["accent-800", "accent-100", 4.5, "lencana text-xs"],
  ["focus", "paper", 3, "garis fokus 1.4.11"], ["focus", "paper-2", 3, ""], ["focus", "surface", 3, ""],
  ["primary-500", "surface", 3, "batas pilihan tercentang"], ["primary-700", "surface", 3, "radio accent-color"],
  ["accent-700", "paper-2", 3, "checkbox kabar terbitan (accent-accent-700)"],
];

const failures = (tokens: Record<string, string>) => {
  const t = { ...tokens, ink85: blend(tokens.ink as Hex, tokens.paper as Hex, 0.85) } as Record<string, Hex>;
  return PAIRS.filter(([f, b, min]) => contrastRatio(t[f], t[b]) < min).map(
    ([f, b, min, note]) => `${f} di ${b} = ${contrastRatio(t[f], t[b]).toFixed(2)} (< ${min}) ${note}`,
  );
};

/** PRNG deterministik agar uji acak bisa diulang. */
const rng = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);

describe("palet siap pakai", () => {
  it("setiap mode memuat semua kunci tema, dan hanya itu", () => {
    for (const [name, p] of Object.entries(PRESETS)) {
      for (const mode of ["light", "dark"] as const) {
        assert.deepEqual(Object.keys(p[mode]).sort(), [...THEMABLE_KEYS].sort(), `${name}/${mode}`);
        assert.ok(Object.values(p[mode]).every(isHex), `${name}/${mode} hex`);
      }
    }
  });

  it("palet bawaan sama persis dengan globals.css", () => {
    const navy = PRESETS[DEFAULT_PRESET];
    for (const key of THEMABLE_KEYS) {
      assert.equal(navy.light[key], BASE_LIGHT[key], `light ${key}`);
      assert.equal(navy.dark[key], BASE_DARK[key], `dark ${key}`);
    }
  });

  it("lolos WCAG AA di mode terang dan gelap", () => {
    for (const [name, p] of Object.entries(PRESETS)) {
      assert.deepEqual(failures({ ...BASE_LIGHT, ...p.light }), [], `${name} terang`);
      assert.deepEqual(failures({ ...BASE_DARK, ...p.dark }), [], `${name} gelap`);
    }
  });
});

describe("aksen kustom", () => {
  it("menolak format yang salah", () => {
    for (const v of ["", "merah", "#12345", "#gggggg", "url(x)", "#fff;}</style>", null, 42]) {
      assert.equal(checkAccent(v, "light").ok, false, String(v));
    }
    assert.equal(checkAccent("B34A0F", "light").ok, true);
  });

  it("menolak kontras rendah dan menyarankan warna yang lolos", () => {
    const r = checkAccent("#f08519", "light");
    assert.equal(r.ok, false);
    if (r.ok || r.reason !== "contrast") throw new Error("harus kontras");
    assert.equal(checkAccent(r.suggestion, "light").ok, true);
  });

  it("setiap aksen yang lolos validasi menghasilkan tema yang lolos AA di semua palet", () => {
    const rand = rng(20261111);
    const hex = () => `#${Math.floor(rand() * 0xffffff).toString(16).padStart(6, "0")}`;
    let accepted = 0;
    for (let i = 0; i < 3000; i++) {
      const seed = hex();
      const c = checkAccent(seed, "light");
      if (!c.ok) {
        if (c.reason === "contrast") assert.equal(checkAccent(c.suggestion, "light").ok, true, `saran ${seed}`);
        continue;
      }
      accepted++;
      const darkSeed = rand() < 0.3 ? hex() : undefined;
      if (darkSeed && !checkAccent(darkSeed, "dark").ok) {
        assert.equal(deriveAccent(seed, darkSeed), null);
        continue;
      }
      const acc = deriveAccent(seed, darkSeed);
      assert.ok(acc, seed);
      for (const p of Object.values(PRESETS)) {
        assert.deepEqual(failures({ ...BASE_LIGHT, ...p.light, ...acc.light }), [], `${seed} terang`);
        assert.deepEqual(failures({ ...BASE_DARK, ...p.dark, ...acc.dark }), [], `${seed}/${darkSeed} gelap`);
      }
    }
    assert.ok(accepted > 500, `terlalu sedikit sampel lolos: ${accepted}`);
  });
});

describe("CSS tema", () => {
  it("bawaan tanpa aksen kustom tidak menyuntikkan apa pun", () => {
    assert.equal(resolveTheme(undefined).css, "");
    assert.equal(resolveTheme({}).css, "");
    assert.equal(resolveTheme({ preset: "navy", customAccent: false, accentLight: "#000000" }).css, "");
  });

  it("palet tidak dikenal jatuh ke bawaan; aksen rusak diabaikan", () => {
    assert.equal(resolveTheme({ preset: "ungu" }).preset, DEFAULT_PRESET);
    const r = resolveTheme({ preset: "hijau", customAccent: true, accentLight: "#ffff00" });
    assert.equal(r.customAccentApplied, false);
    assert.equal(r.light["accent-700"], PRESETS.hijau.light["accent-700"]);
  });

  it("blok terang dan gelap selalu memuat kunci yang sama, hanya hex", () => {
    const keysOf = (s: string) => [...s.matchAll(/--color-([a-z0-9-]+):/g)].map((m) => m[1]).sort();
    for (const name of Object.keys(PRESETS)) {
      const out = resolveTheme({ preset: name, customAccent: true, accentLight: "#1d5c8f" }).css;
      const [lightBlock, darkBlock] = out.split(':root[data-theme="dark"]');
      assert.deepEqual(keysOf(lightBlock), keysOf(darkBlock), name);
      assert.deepEqual(keysOf(lightBlock), [...THEMABLE_KEYS].sort(), name);
      assert.match(out, /^:root\{(--color-[a-z0-9-]+:#[0-9a-f]{6};?)+\}:root\[data-theme="dark"\]\{(--color-[a-z0-9-]+:#[0-9a-f]{6};?)+\}$/);
    }
  });

  it("buildThemeCss membuang nilai yang bukan hex", () => {
    const bad = { ...PRESETS.navy.light, ink: "red}</style><script>" } as unknown as TokenMap;
    assert.ok(!buildThemeCss(bad, PRESETS.navy.dark).includes("<"));
  });
});
