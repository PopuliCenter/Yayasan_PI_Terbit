import { cache } from "react";
import { getPayloadClient } from "./payload";

/**
 * Formulir khusus untuk situs publik. Dibaca dengan aturan akses publik
 * (`overrideAccess: false`, tanpa pengguna); field `emails` sudah dihapus dari koleksi.
 * depth 1 mengisi redirect.reference agar slug halaman tujuan tersedia; halaman yang
 * belum terbit tetap tidak terbaca pengunjung. null bila formulir tidak ada.
 */
export const getPublicForm = cache(async (id: number) => {
  const payload = await getPayloadClient();
  try {
    return await payload.findByID({ collection: "forms", id, overrideAccess: false, depth: 1 });
  } catch {
    return null;
  }
});
