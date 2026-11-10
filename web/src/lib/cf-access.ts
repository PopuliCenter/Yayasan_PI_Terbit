import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

/**
 * Validasi JWT Cloudflare Access (panduan deploy W15, Lampiran C).
 *
 * toko-proxy memanggil /internal/access-check lewat `auth_request` untuk SETIAP
 * permintaan ke admin.<domain>. Token di header `Cf-Access-Jwt-Assertion` harus:
 * - ditandatangani salah satu kunci di https://<tim>.cloudflareaccess.com/cdn-cgi/access/certs,
 * - punya `aud` = CF_ACCESS_AUD dan `iss` = https://<tim>.cloudflareaccess.com,
 * - belum kedaluwarsa.
 *
 * Gagal tertutup: bila env belum diisi, semua permintaan admin ditolak.
 * Ini mencegah jalan pintas lewat IP origin atau dari container lain di network `web`.
 */

const TEAM_DOMAIN_RE = /^[a-z0-9-]+\.cloudflareaccess\.com$/;

export type AccessConfig = {
  teamDomain: string | undefined;
  audience: string | undefined;
};

export type AccessResult = { ok: true; email: string | null } | { ok: false; reason: string };

const jwksCache = new Map<string, JWTVerifyGetKey>();

const remoteJwks = (teamDomain: string): JWTVerifyGetKey => {
  let jwks = jwksCache.get(teamDomain);
  if (!jwks) {
    // jose menyimpan kunci di memori dan mengambil ulang saat kid tidak dikenal (rotasi kunci).
    jwks = createRemoteJWKSet(new URL(`https://${teamDomain}/cdn-cgi/access/certs`), {
      timeoutDuration: 5_000,
      cooldownDuration: 30_000,
    });
    jwksCache.set(teamDomain, jwks);
  }
  return jwks;
};

export const verifyAccessJwt = async (
  token: string | null | undefined,
  config: AccessConfig,
  /** Hanya untuk uji: ganti sumber kunci. */
  getKey?: JWTVerifyGetKey,
): Promise<AccessResult> => {
  const { teamDomain, audience } = config;
  if (!teamDomain || !audience) return { ok: false, reason: "belum-dikonfigurasi" };
  if (!TEAM_DOMAIN_RE.test(teamDomain)) return { ok: false, reason: "team-domain-tidak-valid" };
  if (!token) return { ok: false, reason: "tanpa-token" };

  try {
    const { payload } = await jwtVerify(token, getKey ?? remoteJwks(teamDomain), {
      issuer: `https://${teamDomain}`,
      audience,
      algorithms: ["RS256"],
      clockTolerance: 30,
    });
    return { ok: true, email: typeof payload.email === "string" ? payload.email : null };
  } catch {
    return { ok: false, reason: "token-tidak-sah" };
  }
};

export const accessConfigFromEnv = (): AccessConfig => ({
  teamDomain: process.env.CF_ACCESS_TEAM_DOMAIN?.trim().toLowerCase(),
  audience: process.env.CF_ACCESS_AUD?.trim(),
});
