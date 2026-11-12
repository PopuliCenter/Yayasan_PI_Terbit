import { draftMode } from "next/headers";
import { isAdminRequest } from "@/lib/admin-host";

/**
 * Keluar dari pratinjau: hapus cookie draftMode lalu kembali ke panel admin.
 * Hanya POST (formulir di PreviewBar). GET sengaja tidak diekspor (405), agar prefetch
 * atau tautan biasa tidak pernah mematikan pratinjau tanpa sengaja.
 */
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" } as const;

export async function POST(request: Request) {
  if (!(await isAdminRequest(request.headers))) {
    return new Response("Tidak ditemukan", {
      status: 404,
      headers: { ...NO_STORE, "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  (await draftMode()).disable();
  return new Response(null, { status: 303, headers: { ...NO_STORE, Location: "/admin" } });
}
