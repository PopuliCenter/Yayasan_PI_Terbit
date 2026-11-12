import { after } from "next/server";
import type { Payload } from "payload";
import { purgeExpiredSubmissionsThrottled } from "@/lib/form-retention";
import { getPayloadClient } from "@/lib/payload";

/**
 * Health check untuk healthcheck Docker, toko-proxy (/healthz), dan monitor uptime.
 * Memastikan aplikasi hidup DAN basis data menjawab. Tidak membocorkan detail galat.
 *
 * Healthcheck Docker memanggilnya tiap 30 dtk, jadi di sini pula penghapusan kiriman
 * formulir yang melewati masa simpan dipicu (lib/form-retention.ts, berbatas 6 jam per
 * proses). after() baru berjalan setelah respons terkirim, sehingga waktu jawab health
 * check tidak berubah, dan galat penghapusan tidak pernah membuat health check gagal.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payload = await getPayloadClient();
    await payload.count({ collection: "categories", overrideAccess: true });
    schedulePurge(payload);
    return Response.json({ status: "ok" }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("[healthz] gagal", error instanceof Error ? error.message : error);
    return Response.json({ status: "error" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}

/** Menjadwalkan penghapusan berbatas; galat di sini hanya dicatat, status health check tetap 200. */
function schedulePurge(payload: Payload) {
  try {
    after(() => purgeExpiredSubmissionsThrottled(payload));
  } catch (error) {
    console.error("[healthz] penghapusan kiriman tidak terjadwal", error instanceof Error ? error.message : error);
  }
}
