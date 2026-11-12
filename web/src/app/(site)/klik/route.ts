import { draftMode } from "next/headers";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/antibot";
import { getPayloadClient } from "@/lib/payload";

/**
 * Penerima event klik order (F-ORD-06), dipanggil lewat navigator.sendBeacon.
 *
 * Validasi ketat agar angka laporan tidak bisa digelembungkan: buku harus ada
 * dan terbit, sasaran dan marketplace dari daftar tetap, dan ada batas laju per IP.
 * IP hanya dipakai untuk batas laju di memori, tidak disimpan.
 */
const TARGETS = new Set(["wa", "marketplace"]);
const PLATFORMS = new Set(["tokopedia", "shopee", "tiktok", "blibli", "lazada", "lainnya"]);

export async function POST(request: Request) {
  // 204 juga untuk kiriman yang ditolak: klien tidak perlu tahu, dan tidak ada yang bisa dipelajari bot.
  const noContent = () => new NextResponse(null, { status: 204 });

  // Klik admin yang sedang mempratinjau draf tidak dicatat, agar laporan klik tetap murni pengunjung.
  if ((await draftMode()).isEnabled) return noContent();

  if (!(await rateLimit("klik", 60, 60_000))) return noContent();

  let body: { b?: unknown; t?: unknown; p?: unknown; path?: unknown };
  try {
    const text = await request.text();
    if (text.length > 1_000) return noContent();
    body = JSON.parse(text);
  } catch {
    return noContent();
  }

  const bookId = Number(body.b);
  const target = typeof body.t === "string" ? body.t : "";
  const platform = typeof body.p === "string" ? body.p : null;
  const path = typeof body.path === "string" && body.path.startsWith("/") ? body.path.slice(0, 200) : null;

  if (!Number.isInteger(bookId) || bookId <= 0 || !TARGETS.has(target)) return noContent();
  if (target === "marketplace" && (!platform || !PLATFORMS.has(platform))) return noContent();

  try {
    const payload = await getPayloadClient();
    const book = await payload.find({
      collection: "books",
      overrideAccess: false,
      where: { id: { equals: bookId } },
      limit: 1,
      depth: 0,
      select: { slug: true },
    });
    if (book.docs.length === 0) return noContent();

    await payload.create({
      collection: "order-clicks",
      overrideAccess: true,
      data: {
        book: bookId,
        target: target as "wa" | "marketplace",
        platform: target === "marketplace" ? platform : null,
        path,
      },
    });
  } catch (error) {
    const payload = await getPayloadClient();
    payload.logger.error({ err: error }, "Gagal mencatat klik order");
  }

  return noContent();
}
