import { accessConfigFromEnv, verifyAccessJwt } from "@/lib/cf-access";

/**
 * Dipanggil toko-proxy (nginx `auth_request`) untuk setiap permintaan ke admin.<domain>.
 * 204 = boleh lewat, 401 = tolak. Tidak pernah terjangkau dari host publik: toko-proxy
 * membalas 404 untuk /internal/ di semua host selain subrequest auth.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const result = await verifyAccessJwt(request.headers.get("cf-access-jwt-assertion"), accessConfigFromEnv());
  if (result.ok) return new Response(null, { status: 204 });
  return new Response(null, { status: 401, headers: { "x-access-reason": result.reason } });
}
