import { notFound, permanentRedirect, redirect } from "next/navigation";
import { getPayloadClient } from "./payload";
import { type RedirectTable, redirectState, SHORT_TTL_MS, TTL_MS } from "./redirect-cache";
import { buildRedirectTable, type RedirectRow } from "./redirect-table";
import { isRouted, normalizePath, type RoutedCollection } from "./urls";

/*
 * Pencarian pengalihan di sisi server, hanya di jalur yang seharusnya 404.
 * Jangan diimpor dari berkas yang dimuat payload.config (berkas ini mengimpor lib/payload).
 */

type IdLike = number | string;

const refOf = (row: RedirectRow): { collection: RoutedCollection; id: IdLike } | null => {
  const ref = row.to?.type === "custom" ? null : row.to?.reference;
  if (!ref || !isRouted(ref.relationTo)) return null;
  const v = ref.value;
  const id = typeof v === "number" || typeof v === "string" ? v : v && typeof v === "object" ? v.id : null;
  return id === null || id === undefined ? null : { collection: ref.relationTo, id };
};

const loadTable = async (): Promise<RedirectTable> => {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "redirects",
    overrideAccess: true,
    depth: 0,
    pagination: false,
    select: { from: true, to: true, type: true, allowExternal: true, approvedExternalUrl: true },
  });
  const rows: RedirectRow[] = docs;

  // Kelompokkan id rujukan per koleksi: satu kueri per koleksi.
  const ids = new Map<RoutedCollection, Set<IdLike>>();
  for (const row of rows) {
    const r = refOf(row);
    if (!r) continue;
    const set = ids.get(r.collection) ?? new Set<IdLike>();
    set.add(r.id);
    ids.set(r.collection, set);
  }

  // overrideAccess:false TANPA pengguna = sudut pandang pengunjung: hanya dokumen yang
  // tayang (publishedOrAdmin) atau yang memang publik yang dihitung sebagai tujuan.
  const slugs = new Map<string, string>();
  await Promise.all(
    [...ids].map(async ([collection, set]) => {
      const { docs: found } = await payload.find({
        collection,
        overrideAccess: false,
        depth: 0,
        pagination: false,
        where: { id: { in: [...set] } },
        select: { slug: true },
      });
      for (const d of found) if (d.slug) slugs.set(`${collection}:${d.id}`, d.slug);
    }),
  );

  return buildRedirectTable(rows, (collection, id) => slugs.get(`${collection}:${id}`) ?? null);
};

/**
 * Tabel pengalihan dari cache proses (TTL 60 dtk). Pemuatan bersamaan digabung jadi satu;
 * hasil pemuatan yang dimulai sebelum invalidasi tidak disimpan. Bila gagal, tabel lama
 * dipakai (atau tabel kosong) dan dicoba lagi tak lama kemudian.
 */
export const getRedirectTable = async (): Promise<RedirectTable> => {
  const s = redirectState();
  if (s.table && Date.now() < s.expiresAt) return s.table;
  if (s.loading) return s.loading;

  const generation = s.generation;
  const loading = loadTable()
    .then((table) => {
      if (s.generation === generation) {
        s.table = table;
        s.expiresAt = Date.now() + (Date.now() < s.shortTtlUntil ? SHORT_TTL_MS : TTL_MS);
      }
      return table;
    })
    .catch((error: unknown) => {
      console.error("[redirects] gagal memuat tabel pengalihan:", error instanceof Error ? error.message : error);
      const fallback = s.table ?? new Map();
      if (s.generation === generation) {
        // Jangan membanjiri DB yang sedang bermasalah: coba lagi setelah jeda singkat.
        s.table = fallback;
        s.expiresAt = Date.now() + SHORT_TTL_MS;
      }
      return fallback;
    })
    .finally(() => {
      if (s.loading === loading) s.loading = null;
    });
  s.loading = loading;
  return loading;
};

/**
 * Untuk halaman yang seharusnya 404: alihkan bila ada pengalihan untuk `path`, selain itu
 * notFound(). permanentRedirect (308), redirect (307), dan notFound bekerja dengan
 * MELEMPAR error khusus Next, jadi pemanggil TIDAK BOLEH membungkus fungsi ini dengan
 * try/catch. Panggil sebagai `return redirectOrNotFound(path)` atau `await …`.
 */
export const redirectOrNotFound = async (path: string): Promise<never> => {
  const key = normalizePath(path);
  const hit = key ? (await getRedirectTable()).get(key) : undefined;
  if (hit) {
    if (hit.permanent) permanentRedirect(hit.to);
    redirect(hit.to);
  }
  notFound();
};
