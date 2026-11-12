import { classifyTarget, fromPathProblem, isRouted, normalizePath, pathFor, type TargetClass } from "./urls";

/*
 * Pembangun tabel pengalihan yang murni (tanpa Payload/Next), sehingga bisa diuji.
 * Aturan open-redirect dari urls.ts diterapkan sekali lagi saat runtime: baris yang
 * lolos validasi admin tetapi kemudian tidak lagi aman tetap diabaikan.
 */

export type RedirectEntry = { to: string; permanent: boolean };

type IdLike = number | string;

export type RedirectRow = {
  from?: string | null;
  type?: string | null;
  allowExternal?: boolean | null;
  approvedExternalUrl?: string | null;
  to?: {
    type?: "reference" | "custom" | null;
    url?: string | null;
    reference?: { relationTo: string; value: IdLike | { id: IdLike } | null } | null;
  } | null;
};

/** Slug dokumen TAYANG untuk koleksi + id, atau null bila belum tayang/terhapus. */
export type SlugResolver = (collection: string, id: IdLike) => string | null | undefined;

export type BuildOptions = { siteUrl?: string; adminUrl?: string };

/** Batas lompatan saat meratakan rantai pengalihan; rantai yang lebih panjang dibuang. */
export const REDIRECT_MAX_HOPS = 5;

/* ---------- Tujuan internal: bentuk akhir seperti yang dibuka peramban ---------- */

const RESOLVE_BASE = "http://pengalihan.invalid";

const invalid = (reason: string): TargetClass => ({ kind: "invalid", reason });

/** Dekode %XX satu kali, seperti nginx dan Next sebelum mencocokkan rute. */
const decodeOnce = (p: string): string => {
  try {
    return decodeURIComponent(p);
  } catch {
    return p
      .split("/")
      .map((seg) => {
        try {
          return decodeURIComponent(seg);
        } catch {
          return seg;
        }
      })
      .join("/");
  }
};

const under = (p: string, prefix: string) => p === prefix || p.startsWith(`${prefix}/`);

/** Alasan path (sudah didekode dan diselesaikan) termasuk alamat sistem, atau null. */
const systemProblem = (p: string): string | null => {
  if (under(p, "/admin")) return "Tidak boleh mengarah ke panel admin.";
  if (under(p, "/internal")) return "Tidak boleh mengarah ke alamat sistem.";
  if (under(p, "/api") && !p.startsWith("/api/media/file/")) return "Tidak boleh mengarah ke alamat sistem.";
  return null;
};

/**
 * classifyTarget, ditambah penyelesaian path internal ke bentuk akhirnya sebelum diperiksa.
 * classifyTarget memeriksa awalan path apa adanya, padahal peramban menyelesaikan `.`/`..`
 * (juga `%2e%2e`) dan garis miring terbalik, dan nginx/Next mendekode %XX sebelum
 * mencocokkan rute. Tanpa langkah ini `/kabar/../admin` atau `/x/%2e%2e/api/users/me`
 * lolos sebagai alamat internal. Path internal yang dikembalikan adalah bentuk yang sudah
 * diselesaikan; simpan dan pakai bentuk itu. Tujuan luar dikembalikan tanpa perubahan.
 */
export const classifyRedirectTarget = (raw: string, opts?: BuildOptions): TargetClass => {
  const first = classifyTarget(raw, opts);
  if (first.kind !== "internal") return first;
  if (first.path.includes("\\")) return invalid("Alamat tidak boleh berisi garis miring terbalik (\\).");

  let url: URL;
  try {
    url = new URL(first.path, RESOLVE_BASE);
  } catch {
    return invalid("Alamat tidak valid.");
  }
  if (url.origin !== RESOLVE_BASE) return invalid("Alamat tidak valid.");

  const path = `${url.pathname}${url.search}${url.hash}`;
  const again = classifyTarget(path, opts);
  if (again.kind !== "internal") return again.kind === "invalid" ? again : invalid("Alamat tidak valid.");

  // Bentuk yang dicocokkan server: dekode sekali, \ → /, rapatkan //, lalu selesaikan ./..
  const decoded = decodeOnce(url.pathname).replace(/\\/g, "/").replace(/\/{2,}/g, "/");
  let routed: string;
  try {
    routed = new URL(decoded, RESOLVE_BASE).pathname.toLowerCase();
  } catch {
    return invalid("Alamat tidak valid.");
  }
  const problem = systemProblem(routed);
  return problem ? invalid(problem) : { kind: "internal", path };
};

/* ---------- Tabel ---------- */

const idOf = (v: IdLike | { id: IdLike } | null | undefined): IdLike | null => {
  if (typeof v === "number" || typeof v === "string") return v;
  if (v && typeof v === "object" && (typeof v.id === "number" || typeof v.id === "string")) return v.id;
  return null;
};

const targetOf = (row: RedirectRow, slugOf: SlugResolver, opts?: BuildOptions): string | null => {
  const to = row.to;
  if (!to) return null;

  if (to.type === "custom") {
    if (!to.url) return null;
    const t = classifyRedirectTarget(to.url, opts);
    if (t.kind === "internal") return t.path;
    // Persetujuan super admin terikat pada alamat persis yang disetujui.
    if (t.kind === "external" && row.allowExternal === true && row.approvedExternalUrl === to.url) return t.url;
    return null;
  }

  const ref = to.reference;
  if (!ref || !isRouted(ref.relationTo)) return null;
  const id = idOf(ref.value);
  if (id === null) return null;
  const slug = slugOf(ref.relationTo, id);
  return slug ? pathFor(ref.relationTo, slug) : null;
};

/**
 * Ratakan rantai: setiap entri langsung menunjuk tujuan akhirnya, sehingga pengunjung
 * hanya mengalami satu lompatan. Entri yang berputar (A → B → A) atau rantainya lebih
 * dari REDIRECT_MAX_HOPS dibuang; tanpa ini peramban berhenti dengan ERR_TOO_MANY_REDIRECTS.
 * Rantai bisa terbentuk mis. dari pengalihan manual /promo → /buku/a lalu slug buku diubah
 * a → b (pengalihan otomatis /buku/a → /buku/b).
 *
 * Mengikuti tabel aman karena alamat asal pengalihan bukan halaman tayang: validasi admin
 * menolaknya dan hook slug menghapus pengalihan yang alamat asalnya kini berisi dokumen.
 * Gabungan bersifat permanen hanya bila semua lompatan permanen.
 */
const flatten = (direct: ReadonlyMap<string, RedirectEntry>): Map<string, RedirectEntry> => {
  const table = new Map<string, RedirectEntry>();
  for (const [from, first] of direct) {
    let entry = first;
    let permanent = first.permanent;
    const seen = new Set([from]);
    let usable = true;
    for (let hops = 0; entry.to.startsWith("/"); hops++) {
      const key = normalizePath(entry.to);
      const next = key ? direct.get(key) : undefined;
      if (!key || !next) break;
      if (seen.has(key) || hops >= REDIRECT_MAX_HOPS) {
        usable = false;
        break;
      }
      seen.add(key);
      entry = next;
      permanent = permanent && next.permanent;
    }
    if (usable) table.set(from, { to: entry.to, permanent });
  }
  return table;
};

/**
 * Peta alamat lama (ternormalisasi) → tujuan akhir. Baris dilewati bila: alamat asal tidak
 * valid/sistem/halaman tetap; tujuan dokumen belum tayang atau terhapus; tujuan sama
 * dengan asal; tujuan luar tanpa persetujuan untuk alamat persis itu; tujuan internal yang
 * setelah diselesaikan mengarah ke alamat sistem; rantai yang berputar atau terlalu panjang.
 */
export const buildRedirectTable = (
  rows: readonly RedirectRow[],
  slugOf: SlugResolver,
  opts?: BuildOptions,
): Map<string, RedirectEntry> => {
  const direct = new Map<string, RedirectEntry>();
  for (const row of rows) {
    const from = normalizePath(row.from ?? "");
    if (!from || fromPathProblem(from)) continue;
    const to = targetOf(row, slugOf, opts);
    if (!to) continue;
    if (to.startsWith("/") && normalizePath(to) === from) continue;
    direct.set(from, { to, permanent: row.type !== "307" });
  }
  return flatten(direct);
};
