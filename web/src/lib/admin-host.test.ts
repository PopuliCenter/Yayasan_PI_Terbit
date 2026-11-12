import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { adminHost, isAdminRequest, requestHost } from "./admin-host";

const TEAM = "populi-uji.cloudflareaccess.com";
const AUD = "aud-uji-0123456789abcdef";
const ADMIN = "https://admin.contoh.test";

// process.env.NODE_ENV bertipe readonly di Next; ubah lewat objek biasa.
const env = process.env as Record<string, string | undefined>;
const KEYS = ["NODE_ENV", "ADMIN_BASE_URL", "CF_ACCESS_TEAM_DOMAIN", "CF_ACCESS_AUD"] as const;
let saved: Record<string, string | undefined> = {};

const setup = async () => {
  const { privateKey, publicKey } = await generateKeyPair("RS256");
  const jwk = { ...(await exportJWK(publicKey)), kid: "k1", alg: "RS256", use: "sig" };
  const jwks = createLocalJWKSet({ keys: [jwk] });
  const token = await new SignJWT({ email: "admin@contoh.test" })
    .setProtectedHeader({ alg: "RS256", kid: "k1" })
    .setIssuer(`https://${TEAM}`)
    .setAudience(AUD)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(privateKey);
  return { jwks, token };
};

const headersOf = (init: Record<string, string>) => new Headers(init);

describe("admin-host", () => {
  beforeEach(() => {
    saved = Object.fromEntries(KEYS.map((k) => [k, env[k]]));
    env.NODE_ENV = "production";
    env.ADMIN_BASE_URL = ADMIN;
    env.CF_ACCESS_TEAM_DOMAIN = TEAM;
    env.CF_ACCESS_AUD = AUD;
  });
  afterEach(() => {
    for (const k of KEYS) {
      if (saved[k] === undefined) delete env[k];
      else env[k] = saved[k];
    }
  });

  it("membaca host admin dan host permintaan dalam huruf kecil", () => {
    assert.equal(adminHost(), "admin.contoh.test");
    assert.equal(requestHost(headersOf({ "x-forwarded-host": "Admin.Contoh.Test", host: "lain" })), "admin.contoh.test");
    assert.equal(requestHost(headersOf({ host: "toko-proxy" })), "toko-proxy");
  });

  it("menolak host lain walau JWT sah", async () => {
    const { jwks, token } = await setup();
    const h = headersOf({ "x-forwarded-host": "contoh.test", "cf-access-jwt-assertion": token });
    assert.equal(await isAdminRequest(h, jwks), false);
  });

  it("menolak host admin tanpa JWT", async () => {
    const { jwks } = await setup();
    assert.equal(await isAdminRequest(headersOf({ "x-forwarded-host": "admin.contoh.test" }), jwks), false);
  });

  it("menerima host admin dengan JWT sah", async () => {
    const { jwks, token } = await setup();
    const h = headersOf({ "x-forwarded-host": "admin.contoh.test", "cf-access-jwt-assertion": token });
    assert.equal(await isAdminRequest(h, jwks), true);
  });

  it("gagal tertutup bila ADMIN_BASE_URL kosong", async () => {
    const { jwks, token } = await setup();
    delete env.ADMIN_BASE_URL;
    assert.equal(adminHost(), null);
    const h = headersOf({ "x-forwarded-host": "admin.contoh.test", "cf-access-jwt-assertion": token });
    assert.equal(await isAdminRequest(h, jwks), false);
  });

  it("selalu mengizinkan di luar produksi", async () => {
    env.NODE_ENV = "development";
    assert.equal(await isAdminRequest(headersOf({})), true);
  });
});
