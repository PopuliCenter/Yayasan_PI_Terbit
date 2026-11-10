import { getPayloadClient } from "@/lib/payload";

/**
 * Health check untuk healthcheck Docker, toko-proxy (/healthz), dan monitor uptime.
 * Memastikan aplikasi hidup DAN basis data menjawab. Tidak membocorkan detail galat.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payload = await getPayloadClient();
    await payload.count({ collection: "categories", overrideAccess: true });
    return Response.json({ status: "ok" }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("[healthz] gagal", error instanceof Error ? error.message : error);
    return Response.json({ status: "error" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
