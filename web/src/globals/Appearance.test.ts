import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { GlobalBeforeOperationHook, PayloadRequest, SanitizedGlobalConfig } from "payload";
import { DEFAULT_FONTS } from "../lib/appearance/fonts";
import { Appearance, themeKey } from "./Appearance";

const navy = { preset: "navy", customAccent: false, accentLight: null, accentDark: null };

describe("themeKey (penjaga Pulihkan versi)", () => {
  it("versi yang hanya berbeda huruf judul punya kunci berbeda", () => {
    assert.notEqual(themeKey({ theme: { ...navy, headingFont: "lora" } }), themeKey({ theme: { ...navy, headingFont: "literata" } }));
    assert.notEqual(themeKey({ theme: { ...navy, headingFont: "lora" } }), themeKey({ theme: navy }));
  });

  it("setiap peran huruf ikut dibandingkan", () => {
    const base = themeKey({ theme: { ...navy, ...DEFAULT_FONTS } });
    for (const change of [{ bodyFont: "work-sans" }, { headerFont: "lora" }, { footerFont: "noto-serif" }]) {
      assert.notEqual(themeKey({ theme: { ...navy, ...DEFAULT_FONTS, ...change } }), base, JSON.stringify(change));
    }
  });

  it("huruf kosong/null (versi lama) sama dengan huruf bawaan yang ditulis lengkap", () => {
    const explicit = themeKey({ theme: { ...navy, ...DEFAULT_FONTS } });
    assert.equal(themeKey({ theme: navy }), explicit);
    assert.equal(themeKey({ theme: { ...navy, headingFont: null, bodyFont: null, headerFont: null, footerFont: null } }), explicit);
    assert.equal(themeKey({ theme: { ...navy, headingFont: "tidak-dikenal" } }), explicit);
  });

  it('"ikut isi" dibedakan dari memilih huruf yang sama dengan isi', () => {
    assert.notEqual(themeKey({ theme: { ...navy, headerFont: "ikut-isi" } }), themeKey({ theme: { ...navy, headerFont: "inter" } }));
  });

  it("dokumen kosong atau rusak tidak membuat kunci melempar", () => {
    for (const doc of [null, undefined, {}, { theme: null }, { theme: "x" }, 42]) {
      assert.equal(typeof themeKey(doc), "string");
    }
  });
});

describe("Pulihkan versi oleh admin katalog", () => {
  const hook = Appearance.hooks?.beforeOperation?.[0] as GlobalBeforeOperationHook;

  const run = (role: string, target: Record<string, unknown>, current: Record<string, unknown>) => {
    const req = {
      user: { id: 1, role },
      payload: {
        findGlobalVersionByID: async () => ({ id: "v1", version: target }),
        findGlobal: async () => current,
      },
    } as unknown as PayloadRequest;
    return hook({
      args: { id: "v1" },
      context: {},
      global: { slug: "appearance" } as SanitizedGlobalConfig,
      operation: "restoreVersion",
      overrideAccess: false,
      req,
    } as unknown as Parameters<GlobalBeforeOperationHook>[0]);
  };

  it("ditolak 403 bila huruf versi lama berbeda", async () => {
    await assert.rejects(
      run("admin-katalog", { theme: { ...navy, bodyFont: "lora" } }, { theme: { ...navy, bodyFont: "inter" } }),
      (err: unknown) => (err as { status?: number }).status === 403 && /huruf/.test(String((err as Error).message)),
    );
  });

  it("diizinkan bila warna dan huruf sama (huruf kosong = bawaan)", async () => {
    const args = await run("admin-katalog", { theme: navy, headerNav: [] }, { theme: { ...navy, ...DEFAULT_FONTS } });
    assert.deepEqual(args, { id: "v1" });
  });

  it("super admin boleh memulihkan huruf berbeda", async () => {
    const args = await run("super-admin", { theme: { ...navy, bodyFont: "lora" } }, { theme: navy });
    assert.deepEqual(args, { id: "v1" });
  });
});
