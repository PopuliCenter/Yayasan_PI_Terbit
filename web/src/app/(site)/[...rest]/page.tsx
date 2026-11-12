import { redirectOrNotFound } from "@/lib/redirects";

/**
 * Alamat bertingkat yang tidak cocok dengan rute mana pun (mis. /koleksi/lama/buku-x):
 * alihkan bila ada di tabel Pengalihan URL, selain itu 404 sungguhan dengan halaman
 * not-found situs. Alamat satu segmen tetap ditangani [slug]; /admin dan /api tetap ke
 * rute (payload) yang lebih spesifik; berkas statis selalu menang.
 */
export default async function CatchAll({ params }: { params: Promise<{ rest: string[] }> }) {
  const { rest } = await params;
  return redirectOrNotFound("/" + rest.join("/"));
}
