import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter, SetStepNav } from "@payloadcms/ui";
import type { AdminViewServerProps } from "payload";
import { formatAdminURL } from "payload/shared";
import {
  fetchBookTitles,
  fetchClicks,
  fetchOrders,
  resolveRange,
  ymdWib,
  type ReportRange,
} from "@/lib/admin/reports";
import { formatRupiah } from "@/lib/format";

/**
 * Halaman /admin/laporan: minat per judul (klik tombol order, F-LAP-01) dan rekap pesanan
 * per judul (F-LAP-02) dalam rentang tanggal WIB, dengan unduhan CSV. Agregat saja.
 */

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;

const presets = (now = new Date()) => {
  const today = ymdWib(now);
  const [y, m] = today.split("-").map(Number);
  const pad = (n: number) => String(n).padStart(2, "0");
  const lastDay = (yy: number, mm: number) => new Date(Date.UTC(yy, mm, 0)).getUTCDate();
  const prevY = m === 1 ? y - 1 : y;
  const prevM = m === 1 ? 12 : m - 1;
  const daysBack = (n: number) => {
    const r = resolveRange({ days: n }, now);
    return r.ok ? { dari: r.range.dari, sampai: r.range.sampai } : { dari: today, sampai: today };
  };
  return [
    { label: "7 hari", ...daysBack(7) },
    { label: "30 hari", ...daysBack(30) },
    { label: "90 hari", ...daysBack(90) },
    { label: "Bulan ini", dari: `${y}-${pad(m)}-01`, sampai: today },
    { label: "Bulan lalu", dari: `${prevY}-${pad(prevM)}-01`, sampai: `${prevY}-${pad(prevM)}-${pad(lastDay(prevY, prevM))}` },
  ];
};

async function InterestSection({ req, range, csvHref }: { req: AdminViewServerProps["initPageResult"]["req"]; range: ReportRange; csvHref: string }) {
  const { rows, total, truncated } = await fetchClicks(req, range);
  const titles = await fetchBookTitles(req, rows.map((x) => x.bookId));
  return (
    <section className="ypi-report__section" aria-labelledby="minat">
      <div className="ypi-report__head">
        <h2 id="minat">Minat per judul</h2>
        <a className="ypi-widget__more" href={csvHref}>
          Unduh CSV
        </a>
      </div>
      <p className="ypi-muted">Klik tombol WhatsApp dan marketplace, tanggal WIB. Kunjungan halaman belum dicatat. Total klik: {total}.</p>
      {rows.length === 0 ? (
        <p className="ypi-muted">Belum ada klik dalam rentang ini.</p>
      ) : (
        <table className="ypi-table">
          <thead>
            <tr>
              <th scope="col">Judul</th>
              <th scope="col" className="ypi-num">Klik WhatsApp</th>
              <th scope="col" className="ypi-num">Klik marketplace</th>
              <th scope="col" className="ypi-num">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.bookId}>
                <td>{titles.get(x.bookId)?.title}</td>
                <td className="ypi-num">{x.wa}</td>
                <td className="ypi-num">{x.marketplace}</td>
                <td className="ypi-num">{x.wa + x.marketplace}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {truncated ? <p className="ypi-muted">Data terlalu banyak; sebagian tidak dihitung. Persempit rentang tanggal.</p> : null}
    </section>
  );
}

async function OrdersSection({ req, range, csvHref }: { req: AdminViewServerProps["initPageResult"]["req"]; range: ReportRange; csvHref: string }) {
  const { rows, truncated } = await fetchOrders(req, range);
  const titles = await fetchBookTitles(req, rows.map((x) => x.bookId));
  return (
    <section className="ypi-report__section" aria-labelledby="pesanan">
      <div className="ypi-report__head">
        <h2 id="pesanan">Rekap pesanan per judul</h2>
        <a className="ypi-widget__more" href={csvHref}>
          Unduh CSV
        </a>
      </div>
      <p className="ypi-muted">Menurut tanggal pesanan (WIB). Nilai = harga satuan × jumlah, sebelum potongan dan ongkir; pesanan batal tidak dihitung.</p>
      {rows.length === 0 ? (
        <p className="ypi-muted">Belum ada pesanan dalam rentang ini.</p>
      ) : (
        <table className="ypi-table">
          <thead>
            <tr>
              <th scope="col">Judul</th>
              <th scope="col" className="ypi-num">Pesanan</th>
              <th scope="col" className="ypi-num">Unit</th>
              <th scope="col" className="ypi-num">Nilai</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.bookId}>
                <td>{titles.get(x.bookId)?.title}</td>
                <td className="ypi-num">{x.orders}</td>
                <td className="ypi-num">{x.units}</td>
                <td className="ypi-num">{formatRupiah(x.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {truncated ? <p className="ypi-muted">Data terlalu banyak; sebagian tidak dihitung. Persempit rentang tanggal.</p> : null}
    </section>
  );
}

export async function ReportsView(props: AdminViewServerProps) {
  const { initPageResult, params, searchParams } = props;
  const { req, permissions, visibleEntities, locale } = initPageResult;
  const { payload, user, i18n } = req;
  const config = payload.config;

  const result = resolveRange({ dari: first(searchParams?.dari), sampai: first(searchParams?.sampai) });
  const range = result.ok ? result.range : null;
  const query = range ? `?dari=${range.dari}&sampai=${range.sampai}` : "";
  const api = (path: `/${string}`) => `${formatAdminURL({ apiRoute: config.routes.api, path })}${query}`;
  const here = formatAdminURL({ adminRoute: config.routes.admin, path: "/laporan" });
  const canSeeOrders = Boolean((permissions?.collections as Record<string, { read?: boolean }> | undefined)?.orders?.read);

  return (
    <DefaultTemplate
      i18n={i18n}
      locale={locale}
      params={params}
      payload={payload}
      permissions={permissions}
      req={req}
      searchParams={searchParams}
      user={user ?? undefined}
      visibleEntities={visibleEntities}
    >
      <SetStepNav nav={[{ label: "Laporan per judul" }]} />
      <Gutter className="ypi-report">
        <h1>Laporan per judul</h1>
        <form method="get" action={here} className="ypi-report__filter">
          <label>
            Dari
            <input type="date" name="dari" defaultValue={range?.dari} required />
          </label>
          <label>
            Sampai
            <input type="date" name="sampai" defaultValue={range?.sampai} required />
          </label>
          <button type="submit" className="btn btn--style-primary btn--size-small">
            Tampilkan
          </button>
        </form>
        <p className="ypi-report__presets">
          {presets().map((p) => (
            <a key={p.label} href={`${here}?dari=${p.dari}&sampai=${p.sampai}`}>
              {p.label}
            </a>
          ))}
        </p>
        {!result.ok ? (
          <p role="alert" className="ypi-report__error">
            {result.error}
          </p>
        ) : null}
        {range ? (
          <>
            <InterestSection req={req} range={range} csvHref={api("/laporan/minat-per-judul")} />
            {canSeeOrders ? <OrdersSection req={req} range={range} csvHref={api("/laporan/pesanan-per-judul")} /> : null}
          </>
        ) : null}
      </Gutter>
    </DefaultTemplate>
  );
}
