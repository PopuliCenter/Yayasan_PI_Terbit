import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  DEFAULT_FONTS,
  FOLLOW_BODY,
  FONT_KEYS,
  FONTS,
  fontOptionLabel,
  fontStack,
  isFontKey,
  resolveFonts,
  type FontKey,
} from "./fonts";

/** Akhir baris dinormalkan (salinan kerja di Windows bisa CRLF) dan komentar dibuang. */
const source = (path: string, comments: RegExp) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n?/g, "\n").replace(comments, "");

const GLOBALS_CSS = source("../../app/(site)/globals.css", /\/\*[\s\S]*?\*\//g);
const APP_FONTS = source("../../app/fonts.ts", /\/\*[\s\S]*?\*\/|\/\/[^\n]*/g);

const ROLE_VARS = ["--font-judul", "--font-isi", "--font-header", "--font-footer"];
const CSS_SHAPE =
  /^:root\{(--font-(judul|isi|header|footer):var\(--font-[a-z0-9-]+\), (ui-sans-serif, system-ui, sans-serif|Georgia, Cambria, serif);?)+\}$/;

/** `:root{--a:x;--b:y}` -> { "--a": "x", "--b": "y" }. Nilai tidak memuat ";" (diuji lewat CSS_SHAPE). */
const declsOf = (css: string): Record<string, string> => {
  if (css === "") return {};
  const m = css.match(/^:root\{(.*)\}$/);
  assert.ok(m, css);
  return Object.fromEntries(
    m[1].split(";").map((d) => {
      const i = d.indexOf(":");
      return [d.slice(0, i), d.slice(i + 1)];
    }),
  );
};

const DEFAULT_USED: FontKey[] = ["inter", "source-serif-4"];

describe("registri huruf", () => {
  it("kunci kebab-case dan unik; variabel CSS sah dan unik", () => {
    assert.equal(new Set(FONT_KEYS).size, FONT_KEYS.length);
    const vars = FONT_KEYS.map((k) => FONTS[k].cssVar);
    assert.equal(new Set(vars).size, vars.length);
    for (const key of FONT_KEYS) {
      assert.match(key, /^[a-z0-9]+(-[a-z0-9]+)*$/, key);
      assert.match(FONTS[key].cssVar, /^--font-[a-z0-9-]+$/, key);
      assert.ok(["sans", "serif"].includes(FONTS[key].kind), key);
      assert.ok(FONTS[key].label.trim(), key);
    }
  });

  it("tidak bentrok dengan nama peran, nama Tailwind, atau nilai ikut-isi", () => {
    const reserved = ["judul", "isi", "header", "footer", "sans", "serif", "mono"];
    for (const key of FONT_KEYS) {
      assert.ok(!reserved.includes(key), key);
      assert.ok(!reserved.map((r) => `--font-${r}`).includes(FONTS[key].cssVar), key);
    }
    assert.equal(isFontKey(FOLLOW_BODY), false);
  });

  it("bawaan ada di registri, Inter sebelum Source Serif 4", () => {
    assert.equal(FONTS.inter.cssVar, "--font-inter");
    assert.equal(FONTS["source-serif-4"].cssVar, "--font-source-serif");
    assert.ok(FONT_KEYS.indexOf("inter") < FONT_KEYS.indexOf("source-serif-4"));
    assert.ok(isFontKey(DEFAULT_FONTS.headingFont));
    assert.ok(isFontKey(DEFAULT_FONTS.bodyFont));
    assert.equal(DEFAULT_FONTS.headerFont, FOLLOW_BODY);
    assert.equal(DEFAULT_FONTS.footerFont, FOLLOW_BODY);
  });

  it("fontStack dan label pilihan", () => {
    assert.equal(fontStack("lora"), "var(--font-lora), Georgia, Cambria, serif");
    assert.equal(fontStack("work-sans"), "var(--font-work-sans), ui-sans-serif, system-ui, sans-serif");
    assert.equal(fontOptionLabel("lora"), "Lora — serif");
    assert.equal(fontOptionLabel("inter"), "Inter — sans-serif");
  });
});

describe("resolveFonts: bawaan", () => {
  it("masukan kosong = huruf sebelum fitur ini, tanpa CSS", () => {
    for (const input of [undefined, null, {}, DEFAULT_FONTS]) {
      const r = resolveFonts(input);
      assert.equal(r.css, "", JSON.stringify(input));
      assert.deepEqual(r.used, DEFAULT_USED);
      assert.equal(r.heading, "source-serif-4");
      assert.equal(r.body, "inter");
      assert.equal(r.header, "inter");
      assert.equal(r.footer, "inter");
      assert.equal(r.headerFollowsBody, true);
      assert.equal(r.footerFollowsBody, true);
    }
  });
});

describe("resolveFonts: whitelist", () => {
  const JUNK: unknown[] = ["comic-sans", "lora;}</style><script>", "Lora", " lora", 42, {}, [], ["lora"], null, true, "__proto__", "constructor", "toString", ""];

  it("nilai tidak dikenal jatuh ke bawaan dan tidak pernah masuk CSS", () => {
    for (const v of JUNK) {
      const r = resolveFonts({ headingFont: v, bodyFont: v, headerFont: v, footerFont: v });
      assert.equal(r.css, "", String(v));
      assert.deepEqual(r.used, DEFAULT_USED, String(v));
      assert.equal(r.headerFollowsBody, true);
    }
    // "ikut-isi" hanya sah untuk header/footer.
    const r = resolveFonts({ headingFont: FOLLOW_BODY, bodyFont: FOLLOW_BODY });
    assert.equal(r.heading, "source-serif-4");
    assert.equal(r.body, "inter");
    assert.equal(r.css, "");
  });

  it("masukan bukan objek tidak membuat resolver melempar", () => {
    for (const input of ["lora", 42, true, [] as unknown]) {
      assert.equal(resolveFonts(input as Parameters<typeof resolveFonts>[0]).css, "");
    }
  });

  it("semua kombinasi menghasilkan CSS berbentuk tetap yang sesuai pilihan", () => {
    const junk = "lora}</style>";
    const roleValues = [...FONT_KEYS, junk];
    const regionValues = [FOLLOW_BODY, ...FONT_KEYS, junk];
    let count = 0;
    for (const headingFont of roleValues) {
      for (const bodyFont of roleValues) {
        for (const headerFont of regionValues) {
          for (const footerFont of regionValues) {
            const r = resolveFonts({ headingFont, bodyFont, headerFont, footerFont });
            count++;
            assert.ok(!r.css.includes("<"));
            if (r.css !== "") assert.match(r.css, CSS_SHAPE);
            const d = declsOf(r.css);
            const heading = isFontKey(headingFont) ? headingFont : "source-serif-4";
            const body = isFontKey(bodyFont) ? bodyFont : "inter";
            assert.equal(r.heading, heading);
            assert.equal(r.body, body);
            assert.equal(r.header, isFontKey(headerFont) ? headerFont : body);
            assert.equal(r.footer, isFontKey(footerFont) ? footerFont : body);
            // Hanya peran yang berbeda dari bawaan yang dikeluarkan.
            assert.equal(d["--font-judul"], heading === "source-serif-4" ? undefined : fontStack(heading));
            assert.equal(d["--font-isi"], body === "inter" ? undefined : fontStack(body));
            assert.equal(d["--font-header"], isFontKey(headerFont) ? fontStack(headerFont) : undefined);
            assert.equal(d["--font-footer"], isFontKey(footerFont) ? fontStack(footerFont) : undefined);
            assert.ok(Object.keys(d).every((k) => ROLE_VARS.includes(k)));
            assert.deepEqual(r.used, FONT_KEYS.filter((k) => [r.heading, r.body, r.header, r.footer].includes(k)));
          }
        }
      }
    }
    assert.equal(count, 11 * 11 * 12 * 12);
  });
});

describe("resolveFonts: CSS", () => {
  it("huruf judul saja -> hanya --font-judul", () => {
    assert.equal(resolveFonts({ headingFont: "lora" }).css, ":root{--font-judul:var(--font-lora), Georgia, Cambria, serif}");
  });

  it("header ikut isi: --font-isi ditimpa, --font-header tidak ditulis", () => {
    const r = resolveFonts({ bodyFont: "lora", headerFont: FOLLOW_BODY });
    assert.equal(r.css, ":root{--font-isi:var(--font-lora), Georgia, Cambria, serif}");
    assert.equal(r.header, "lora");
    assert.equal(r.headerFollowsBody, true);
    assert.deepEqual(r.used, ["source-serif-4", "lora"]);
  });

  it("header dengan huruf sendiri ikut masuk `used`", () => {
    const r = resolveFonts({ headerFont: "work-sans" });
    assert.equal(r.css, ":root{--font-header:var(--font-work-sans), ui-sans-serif, system-ui, sans-serif}");
    assert.equal(r.headerFollowsBody, false);
    assert.deepEqual(r.used, ["inter", "work-sans", "source-serif-4"]);
  });

  it("memilih huruf yang sama dengan isi tetap dicatat sebagai pilihan sendiri", () => {
    const r = resolveFonts({ footerFont: "inter" });
    assert.equal(r.footerFollowsBody, false);
    assert.equal(r.css, ":root{--font-footer:var(--font-inter), ui-sans-serif, system-ui, sans-serif}");
    assert.deepEqual(r.used, DEFAULT_USED);
  });

  it("`used` unik dan urut registri, urutan peran di CSS tetap", () => {
    const r = resolveFonts({ headingFont: "noto-serif", bodyFont: "public-sans", headerFont: "noto-serif", footerFont: "inter" });
    assert.deepEqual(r.used, ["inter", "public-sans", "noto-serif"]);
    assert.deepEqual(Object.keys(declsOf(r.css)), ROLE_VARS);
  });
});

/** Isi blok `<pembuka> { ... }` tingkat atas di globals.css sebagai peta deklarasi. */
const cssBlock = (opener: string) => {
  const start = GLOBALS_CSS.indexOf(`${opener} {`);
  assert.ok(start >= 0, `blok tidak ditemukan: ${opener}`);
  const body = GLOBALS_CSS.slice(start + opener.length + 2, GLOBALS_CSS.indexOf("\n}", start));
  return Object.fromEntries(
    [...body.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]),
  );
};

describe("sinkron dengan globals.css", () => {
  it("peran bawaan di @theme static sama dengan fontStack bawaan", () => {
    assert.deepEqual(cssBlock("@theme static"), {
      "--font-judul": fontStack(DEFAULT_FONTS.headingFont),
      "--font-isi": fontStack(DEFAULT_FONTS.bodyFont),
      "--font-header": "var(--font-isi)",
      "--font-footer": "var(--font-isi)",
    });
  });

  it("font-sans/font-serif Tailwind hanya alias peran", () => {
    assert.deepEqual(cssBlock("@theme inline"), { "--font-sans": "var(--font-isi)", "--font-serif": "var(--font-judul)" });
  });

  it("body dan judul memakai variabel peran", () => {
    assert.match(GLOBALS_CSS, /\bbody \{[^}]*font-family: var\(--font-isi\);/);
    assert.match(GLOBALS_CSS, /h4 \{[^}]*font-family: var\(--font-judul\);/);
  });
});

type FontCall = { loader: string; options: string; variable: string };

/** Pemanggilan next/font di app/fonts.ts: nama const -> fungsi, opsi, dan variabel CSS. */
const fontCalls = (): Map<string, FontCall> => {
  const calls = new Map<string, FontCall>();
  for (const m of APP_FONTS.matchAll(/const (\w+) = (\w+)\(\{([^}]*)\}\);/g)) {
    const variable = m[3].match(/variable: "([^"]+)"/);
    assert.ok(variable, `tanpa variable: ${m[1]}`);
    calls.set(m[1], { loader: m[2], options: m[3], variable: variable[1] });
  }
  return calls;
};

describe("sinkron dengan app/fonts.ts", () => {
  const calls = fontCalls();
  const callOf = (key: FontKey) => [...calls.values()].find((c) => c.variable === FONTS[key].cssVar);

  it("satu pemanggilan next/font per huruf registri, dengan nama keluarga yang sama", () => {
    assert.deepEqual(
      [...calls.values()].map((c) => c.variable).sort(),
      FONT_KEYS.map((k) => FONTS[k].cssVar).sort(),
    );
    for (const key of FONT_KEYS) {
      assert.equal(callOf(key)?.loader, FONTS[key].label.replace(/ /g, "_"), key);
      assert.match(callOf(key)?.options ?? "", /display: "swap"/, key);
    }
  });

  it("hanya huruf bawaan yang dipreload, dengan opsi seperti sebelumnya", () => {
    const defaults = new Set<FontKey>([DEFAULT_FONTS.headingFont, DEFAULT_FONTS.bodyFont]);
    for (const key of FONT_KEYS) {
      const options = callOf(key)?.options ?? "";
      if (defaults.has(key)) {
        assert.match(options, /subsets: \["latin"\]/, key);
        assert.doesNotMatch(options, /preload/, key);
      } else {
        assert.match(options, /preload: false/, key);
      }
    }
  });

  it("peta BY_KEY memasangkan setiap kunci dengan pemanggilan hurufnya", () => {
    const block = APP_FONTS.match(/const BY_KEY[^=]*= \{([\s\S]*?)\n\};/);
    assert.ok(block, "BY_KEY tidak ditemukan");
    const entries = [...block[1].matchAll(/^\s*(?:"([a-z0-9-]+)"|([a-z0-9]+))(?:: (\w+))?,?$/gm)].map((m) => {
      const key = m[1] ?? m[2];
      return [key, m[3] ?? key] as const;
    });
    assert.deepEqual(entries.map(([key]) => key).sort(), [...FONT_KEYS].sort());
    for (const [key, ident] of entries) {
      assert.equal(calls.get(ident)?.variable, FONTS[key as FontKey].cssVar, key);
    }
  });
});
