import { createHmac, timingSafeEqual } from "crypto";
import { headers } from "next/headers";

/**
 * Perlindungan formulir berlapis (NFR keamanan: "anti-bot dan batas laju pada formulir").
 *
 * 1. Honeypot: field tersembunyi yang hanya diisi bot.
 * 2. Token waktu bertanda HMAC: menolak kiriman terlalu cepat (< 3 dtk) atau token palsu/kedaluwarsa.
 * 3. Batas laju per IP di memori. IP hanya dipegang sementara di memori proses,
 *    tidak pernah ditulis ke basis data atau log.
 * 4. Cloudflare Turnstile, aktif otomatis bila TURNSTILE_SECRET_KEY diisi.
 */

import { HONEYPOT_FIELD, TOKEN_FIELD } from "./antibot-fields";
import { rateKey } from "./ip";

export { HONEYPOT_FIELD, TOKEN_FIELD };

const MIN_FILL_MS = 3_000;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

const secret = () => process.env.PAYLOAD_SECRET || "dev-only-secret";

const sign = (value: string) => createHmac("sha256", secret()).update(`form:${value}`).digest("hex");

/** Dipanggil saat formulir dirender di server. */
export const issueFormToken = (): string => {
  const issuedAt = String(Date.now());
  return `${issuedAt}.${sign(issuedAt)}`;
};

const verifyFormToken = (token: unknown): boolean => {
  if (typeof token !== "string") return false;
  const [issuedAt, mac] = token.split(".");
  if (!issuedAt || !mac) return false;

  const expected = sign(issuedAt);
  const a = Buffer.from(mac, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  const age = Date.now() - Number(issuedAt);
  return age >= MIN_FILL_MS && age <= MAX_AGE_MS;
};

/* ------------------------------ batas laju ------------------------------- */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

const clientIp = async (): Promise<string> => {
  const h = await headers();
  // x-real-ip diisi toko-proxy dari IP klien yang sudah diverifikasi rantai realip
  // (Cloudflare → edge → toko-proxy). Header lain hanya fallback untuk dev lokal.
  return (
    h.get("x-real-ip") ||
    h.get("cf-connecting-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
};

const MAX_BUCKETS = 20_000;
const SWEEP_EVERY_MS = 60_000;
let lastSweep = 0;

/** Buang entri kedaluwarsa paling sering sekali per menit; jaga ukuran peta tetap terbatas. */
const sweep = (now: number) => {
  if (now - lastSweep >= SWEEP_EVERY_MS) {
    lastSweep = now;
    for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
  }
  // Map menyimpan urutan sisip: entri pertama = paling lama. O(kelebihan), bukan O(n).
  if (buckets.size > MAX_BUCKETS) {
    let excess = buckets.size - MAX_BUCKETS;
    for (const k of buckets.keys()) {
      if (excess-- <= 0) break;
      buckets.delete(k);
    }
  }
};

/** true bila masih di bawah batas. */
export const rateLimit = async (scope: string, max: number, windowMs: number): Promise<boolean> => {
  const key = `${scope}:${rateKey(await clientIp())}`;
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= max;
};

/* ------------------------------- Turnstile -------------------------------- */

const verifyTurnstile = async (token: unknown): Promise<boolean> => {
  const key = process.env.TURNSTILE_SECRET_KEY;
  if (!key) return true; // Belum dikonfigurasi: lapisan lain tetap berjalan.
  if (typeof token !== "string" || !token) return false;

  try {
    const body = new URLSearchParams({ secret: key, response: token, remoteip: await clientIp() });
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(5_000),
    });
    const data = (await res.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch {
    return false;
  }
};

export type BotCheck = { ok: true } | { ok: false; reason: "bot" | "rate" | "expired" };

export const checkSubmission = async (
  formData: FormData,
  scope: string,
  options: { max?: number; windowMs?: number; turnstile?: boolean } = {},
): Promise<BotCheck> => {
  const { max = 5, windowMs = 10 * 60 * 1000, turnstile = true } = options;
  if (formData.get(HONEYPOT_FIELD)) return { ok: false, reason: "bot" };
  if (!verifyFormToken(formData.get(TOKEN_FIELD))) return { ok: false, reason: "expired" };
  if (!(await rateLimit(scope, max, windowMs))) return { ok: false, reason: "rate" };
  // Formulir tanpa widget Turnstile (mis. langganan di footer) melewati lapisan ini;
  // bila tidak, mengaktifkan Turnstile akan menolak setiap kirimannya.
  if (turnstile && !(await verifyTurnstile(formData.get("cf-turnstile-response")))) {
    return { ok: false, reason: "bot" };
  }
  return { ok: true };
};
