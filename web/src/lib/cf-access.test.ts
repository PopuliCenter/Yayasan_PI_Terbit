import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { verifyAccessJwt } from "./cf-access";

const TEAM = "populi-uji.cloudflareaccess.com";
const AUD = "aud-uji-0123456789abcdef";

const setup = async () => {
  const { privateKey, publicKey } = await generateKeyPair("RS256");
  const jwk = { ...(await exportJWK(publicKey)), kid: "k1", alg: "RS256", use: "sig" };
  const jwks = createLocalJWKSet({ keys: [jwk] });
  const sign = (claims: Record<string, unknown> = {}, opts: { iss?: string; aud?: string; exp?: string } = {}) =>
    new SignJWT({ email: "admin@contoh.test", ...claims })
      .setProtectedHeader({ alg: "RS256", kid: "k1" })
      .setIssuer(opts.iss ?? `https://${TEAM}`)
      .setAudience(opts.aud ?? AUD)
      .setIssuedAt()
      .setExpirationTime(opts.exp ?? "5m")
      .sign(privateKey);
  return { jwks, sign };
};

describe("verifyAccessJwt", () => {
  it("menerima token sah dan mengembalikan email", async () => {
    const { jwks, sign } = await setup();
    const res = await verifyAccessJwt(await sign(), { teamDomain: TEAM, audience: AUD }, jwks);
    assert.deepEqual(res, { ok: true, email: "admin@contoh.test" });
  });

  it("gagal tertutup bila env belum diisi", async () => {
    const { jwks, sign } = await setup();
    const token = await sign();
    assert.equal((await verifyAccessJwt(token, { teamDomain: undefined, audience: AUD }, jwks)).ok, false);
    assert.equal((await verifyAccessJwt(token, { teamDomain: TEAM, audience: "" }, jwks)).ok, false);
  });

  it("menolak tanpa token", async () => {
    const { jwks } = await setup();
    assert.equal((await verifyAccessJwt(null, { teamDomain: TEAM, audience: AUD }, jwks)).ok, false);
  });

  it("menolak aud lain (aplikasi Access lain, mis. staging)", async () => {
    const { jwks, sign } = await setup();
    const token = await sign({}, { aud: "aud-aplikasi-lain" });
    assert.equal((await verifyAccessJwt(token, { teamDomain: TEAM, audience: AUD }, jwks)).ok, false);
  });

  it("menolak issuer lain", async () => {
    const { jwks, sign } = await setup();
    const token = await sign({}, { iss: "https://tim-lain.cloudflareaccess.com" });
    assert.equal((await verifyAccessJwt(token, { teamDomain: TEAM, audience: AUD }, jwks)).ok, false);
  });

  it("menolak token kedaluwarsa", async () => {
    const { jwks, sign } = await setup();
    const token = await sign({}, { exp: "-10m" });
    assert.equal((await verifyAccessJwt(token, { teamDomain: TEAM, audience: AUD }, jwks)).ok, false);
  });

  it("menolak token yang ditandatangani kunci lain", async () => {
    const { jwks } = await setup();
    const other = await setup();
    const token = await other.sign();
    assert.equal((await verifyAccessJwt(token, { teamDomain: TEAM, audience: AUD }, jwks)).ok, false);
  });

  it("menolak team domain di luar cloudflareaccess.com (cegah salah konfigurasi)", async () => {
    const { jwks, sign } = await setup();
    const token = await sign();
    const res = await verifyAccessJwt(token, { teamDomain: "evil.example.com", audience: AUD }, jwks);
    assert.deepEqual(res, { ok: false, reason: "team-domain-tidak-valid" });
  });

  it("menolak alg none / token rusak", async () => {
    const { jwks } = await setup();
    const unsigned = `${Buffer.from('{"alg":"none"}').toString("base64url")}.${Buffer.from("{}").toString("base64url")}.`;
    assert.equal((await verifyAccessJwt(unsigned, { teamDomain: TEAM, audience: AUD }, jwks)).ok, false);
    assert.equal((await verifyAccessJwt("bukan.jwt", { teamDomain: TEAM, audience: AUD }, jwks)).ok, false);
  });
});
