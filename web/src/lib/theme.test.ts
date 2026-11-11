import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runInNewContext } from "node:vm";
import { THEME_INIT_SCRIPT, THEME_STORAGE_KEY } from "./theme";

type Env = { stored?: string | null; storageThrows?: boolean; deviceDark?: boolean; matchMediaThrows?: boolean };

/** Jalankan skrip tema awal di sandbox dengan document/localStorage/matchMedia tiruan. */
const runInitScript = ({ stored = null, storageThrows = false, deviceDark = false, matchMediaThrows = false }: Env) => {
  const attrs: Record<string, string> = {};
  const document = { documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) } };
  const storage = {
    getItem: (k: string) => (k === THEME_STORAGE_KEY ? stored : null),
  };
  const window = {
    matchMedia: (q: string) => {
      if (matchMediaThrows) throw new Error("matchMedia tidak tersedia");
      return { matches: q.includes("dark") && deviceDark };
    },
  };
  const sandbox: Record<string, unknown> = { document, window };
  Object.defineProperty(sandbox, "localStorage", {
    get() {
      if (storageThrows) throw new Error("SecurityError: akses penyimpanan ditolak");
      return storage;
    },
  });
  runInNewContext(THEME_INIT_SCRIPT, sandbox);
  return attrs["data-theme"];
};

describe("skrip tema awal", () => {
  it("memakai pilihan tersimpan", () => {
    assert.equal(runInitScript({ stored: "dark", deviceDark: false }), "dark");
    assert.equal(runInitScript({ stored: "light", deviceDark: true }), "light");
  });

  it("mengikuti perangkat bila belum memilih atau nilai tersimpan tidak dikenal", () => {
    assert.equal(runInitScript({ stored: null, deviceDark: true }), "dark");
    assert.equal(runInitScript({ stored: "ungu", deviceDark: false }), "light");
  });

  it("tetap mengikuti perangkat bila penyimpanan diblokir", () => {
    assert.equal(runInitScript({ storageThrows: true, deviceDark: true }), "dark");
    assert.equal(runInitScript({ storageThrows: true, deviceDark: false }), "light");
  });

  it("jatuh ke terang bila matchMedia tidak tersedia", () => {
    assert.equal(runInitScript({ storageThrows: true, matchMediaThrows: true }), "light");
  });
});
