import type { Endpoint, PayloadRequest } from "payload";
import { isAdminRequest } from "../lib/admin-host";
import { fetchBookTitles, fetchClicks, fetchOrders, resolveRange, toCsv } from "../lib/admin/reports";

/**
 * Unduhan CSV laporan per judul (GET /api/laporan/...). Hanya di host admin dengan JWT
 * Cloudflare Access sah dan pengguna Payload yang masuk. Isi agregat saja: tanpa nama
 * atau kontak pembeli.
 */

const NO_STORE = { "Cache-Control": "no-store" };

const text = (status: number, body: string) =>
  new Response(body, { status, headers: { ...NO_STORE, "Content-Type": "text/plain; charset=utf-8" } });

const guard = async (req: PayloadRequest): Promise<Response | null> => {
  if (!req.user) return text(401, "Silakan masuk.");
  if (!(await isAdminRequest(req.headers))) return text(403, "Tidak diizinkan.");
  return null;
};

const csvResponse = (filename: string, body: string) =>
  new Response(body, {
    status: 200,
    headers: {
      ...NO_STORE,
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });

const rangeFrom = (req: PayloadRequest) =>
  resolveRange({ dari: req.searchParams.get("dari"), sampai: req.searchParams.get("sampai") });

const isForbidden = (err: unknown) => (err as { status?: number } | null)?.status === 403;

export const reportEndpoints: Endpoint[] = [
  {
    path: "/laporan/minat-per-judul",
    method: "get",
    handler: async (req) => {
      const denied = await guard(req);
      if (denied) return denied;
      const r = rangeFrom(req);
      if (!r.ok) return text(400, r.error);
      try {
        const { rows } = await fetchClicks(req, r.range);
        const titles = await fetchBookTitles(req, rows.map((x) => x.bookId));
        const body = toCsv(
          ["Judul", "Klik WhatsApp", "Klik marketplace", "Total"],
          rows.map((x) => [titles.get(x.bookId)?.title ?? `#${x.bookId}`, x.wa, x.marketplace, x.wa + x.marketplace]),
        );
        return csvResponse(`minat-per-judul_${r.range.dari}_${r.range.sampai}.csv`, body);
      } catch (err) {
        if (isForbidden(err)) return text(403, "Tidak diizinkan.");
        throw err;
      }
    },
  },
  {
    path: "/laporan/pesanan-per-judul",
    method: "get",
    handler: async (req) => {
      const denied = await guard(req);
      if (denied) return denied;
      const r = rangeFrom(req);
      if (!r.ok) return text(400, r.error);
      try {
        const { rows } = await fetchOrders(req, r.range);
        const titles = await fetchBookTitles(req, rows.map((x) => x.bookId));
        const body = toCsv(
          ["Judul", "Pesanan", "Unit", "Nilai (Rp)"],
          rows.map((x) => [titles.get(x.bookId)?.title ?? `#${x.bookId}`, x.orders, x.units, x.value]),
        );
        return csvResponse(`pesanan-per-judul_${r.range.dari}_${r.range.sampai}.csv`, body);
      } catch (err) {
        if (isForbidden(err)) return text(403, "Rekap pesanan hanya untuk admin order dan super admin.");
        throw err;
      }
    },
  },
];
