import { APIError, type CollectionBeforeValidateHook } from "payload";
import { ISSUES_KEY } from "../lib/import/parse";

/**
 * Menolak baris impor yang ditandai bermasalah oleh lib/import/catalog-hooks.ts.
 *
 * Hook koleksi beforeValidate tetap berjalan untuk draf (Payload hanya melewati
 * validasi field untuk draf), jadi baris dengan harga/ISBN/slug rusak tidak ikut
 * tersimpan sebagai draf. Pesannya muncul per baris di Ringkasan Impor. Untuk
 * simpan biasa dari panel admin kunci ini tidak pernah ada.
 */
export const rejectImportIssues: CollectionBeforeValidateHook = ({ data }) => {
  if (!data) return data;
  const issues: unknown = data[ISSUES_KEY];
  if (Array.isArray(issues) && issues.length > 0) {
    throw new APIError(`Baris ditolak: ${issues.map(String).join(" ")}`, 400, null, true);
  }
  delete data[ISSUES_KEY];
  return data;
};
