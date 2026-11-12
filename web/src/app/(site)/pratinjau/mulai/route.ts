import { draftMode } from "next/headers";
import { isAdminRequest } from "@/lib/admin-host";
import { getPayloadClient } from "@/lib/payload";
import { parsePreviewRequest, PREVIEW_GLOBALS, publicPathFor } from "@/lib/preview-url";

/**
 * Pintu masuk pratinjau draf (dibuka dari Live Preview / tombol pratinjau di panel admin).
 *
 * Urutan pemeriksaan: host admin + JWT Cloudflare Access (isAdminRequest), parameter dari
 * daftar putih (parsePreviewRequest), sesi login Payload, lalu hak baca dokumen/global
 * dengan pengguna itu (overrideAccess: false). Baru setelah semuanya lolos cookie draftMode
 * dipasang. Tujuan pengalihan dibangun dari slug yang dibaca dari BASIS DATA, bukan dari
 * query string, sehingga rute ini tidak bisa dipakai sebagai open redirect.
 */
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" } as const;

const plain = (status: number, body: string) =>
  new Response(body, { status, headers: { ...NO_STORE, "Content-Type": "text/plain; charset=utf-8" } });

const redirectTo = (status: 303 | 307, location: string) =>
  new Response(null, { status, headers: { ...NO_STORE, Location: location } });

export async function GET(request: Request) {
  const h = request.headers;
  if (!(await isAdminRequest(h))) return plain(404, "Tidak ditemukan");

  const target = parsePreviewRequest(new URL(request.url).searchParams);
  if (!target) return plain(400, "Permintaan pratinjau tidak valid.");

  const payload = await getPayloadClient();
  const { user } = await payload.auth({ headers: h });
  if (!user || user.collection !== "users") return redirectTo(303, "/admin/login");

  let path: string | null = null;
  try {
    if (target.kind === "global") {
      // Hanya memastikan pengguna ini boleh membaca draf global tersebut (melempar bila tidak).
      await payload.findGlobal({ slug: target.global, draft: true, overrideAccess: false, user, depth: 0 });
      path = PREVIEW_GLOBALS[target.global];
    } else {
      const doc = await payload.findByID({
        collection: target.collection,
        id: target.id,
        draft: true,
        overrideAccess: false,
        user,
        depth: 0,
        disableErrors: true,
        select: { slug: true },
      });
      const slug = doc && typeof doc.slug === "string" ? doc.slug.trim() : "";
      // encodeURIComponent: slug dari DB sudah berformat aman (fields/slug.ts); ini lapis
      // tambahan agar "/" atau "\" tidak pernah bisa membentuk alamat host lain.
      if (slug) path = publicPathFor(target.collection, encodeURIComponent(slug));
    }
  } catch (err) {
    payload.logger.warn({ err }, "Pratinjau ditolak: dokumen tidak bisa dibaca dengan akses pengguna ini");
    path = null;
  }

  if (!path) return plain(404, "Dokumen tidak ditemukan, atau belum punya slug. Isi judulnya dulu.");

  // Cookie draftMode ikut digabungkan Next ke Response yang dikembalikan
  // (finalizeResponse -> appendMutableCookies di app-route/module.js).
  (await draftMode()).enable();
  return redirectTo(307, path);
}
