import type { WidgetServerProps } from "payload";
import { formatAdminURL } from "payload/shared";
import { fetchBookTitles, fetchClicks, fetchOrders, resolveRange } from "@/lib/admin/reports";
import { formatRupiah } from "@/lib/format";

/**
 * Widget dasbor admin. Komponen server; semua kueri lewat req.payload dengan hak akses
 * pengguna (overrideAccess: false). Tidak pernah menampilkan email/telepon pengirim.
 */

type Props = WidgetServerProps;

const adminUrl = (props: Props, path: `/${string}`) =>
  formatAdminURL({ adminRoute: props.req.payload.config.routes.admin, path });

const canRead = (props: Props, slug: string) =>
  Boolean((props.permissions?.collections as Record<string, { read?: boolean } | undefined> | undefined)?.[slug]?.read);

function Widget({ title, href, linkLabel = "Lihat semua →", children }: { title: string; href?: string; linkLabel?: string; children: React.ReactNode }) {
  return (
    <section className="ypi-widget">
      <header className="ypi-widget__header">
        <h2 className="ypi-widget__title">{title}</h2>
        {href ? (
          <a className="ypi-widget__more" href={href}>
            {linkLabel}
          </a>
        ) : null}
      </header>
      <div className="ypi-widget__body">{children}</div>
    </section>
  );
}

const Muted = ({ children }: { children: React.ReactNode }) => <p className="ypi-muted">{children}</p>;

const relTime = new Intl.RelativeTimeFormat("id-ID", { numeric: "auto" });
const ago = (iso: string | null | undefined) => {
  if (!iso) return "";
  const diffMin = Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
  if (Math.abs(diffMin) < 60) return relTime.format(diffMin, "minute");
  const diffH = Math.round(diffMin / 60);
  if (Math.abs(diffH) < 24) return relTime.format(diffH, "hour");
  return relTime.format(Math.round(diffH / 24), "day");
};
const dateWib = (iso: string | null | undefined) =>
  iso ? new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "short" }).format(new Date(iso)) : "";

/* ------------------------------------------------------------------ */

export async function CatalogSummaryWidget(props: Props) {
  if (!canRead(props, "books")) return null;
  const { req } = props;
  // Sama dengan kueri daftar Buku (find dengan draft: true = versi terbaru tiap buku), supaya
  // angka cocok dengan daftar yang dibuka tautannya. payload.count tidak punya opsi draft.
  const count = (where: Record<string, unknown>) =>
    req.payload
      .find({
        collection: "books",
        where: where as never,
        draft: true,
        limit: 1,
        depth: 0,
        select: { title: true },
        overrideAccess: false,
        req,
      })
      .then((r) => r.totalDocs);
  const published = { _status: { equals: "published" } };
  const [tayang, segera, terbatas, habis, draf] = await Promise.all([
    count(published),
    count({ and: [published, { availability: { equals: "segera" } }] }),
    count({ and: [published, { availability: { equals: "terbatas" } }] }),
    count({ and: [published, { availability: { equals: "habis" } }] }),
    count({ _status: { equals: "draft" } }),
  ]);
  const list = adminUrl(props, "/collections/books");
  const tayangDan = (availability: string) =>
    `${list}?where[and][0][_status][equals]=published&where[and][1][availability][equals]=${availability}`;
  const figures = [
    { label: "Judul tayang", value: tayang, href: `${list}?where[_status][equals]=published` },
    { label: "Segera terbit", value: segera, href: tayangDan("segera") },
    { label: "Stok terbatas", value: terbatas, href: tayangDan("terbatas") },
    { label: "Habis", value: habis, href: tayangDan("habis") },
    { label: "Draf", value: draf, href: `${list}?where[_status][equals]=draft` },
  ];
  return (
    <Widget title="Ringkasan katalog" href={list}>
      <dl className="ypi-figures">
        {figures.map((f) => (
          <div key={f.label}>
            <dt>{f.label}</dt>
            <dd>
              <a href={f.href} className="ypi-num">
                {f.value}
              </a>
            </dd>
          </div>
        ))}
      </dl>
      <Muted>Buku tayang yang punya perubahan belum ditayangkan dihitung sebagai Draf, sama seperti daftar Buku.</Muted>
    </Widget>
  );
}

const INQUIRY_TYPE: Record<string, string> = {
  institusi: "Penawaran institusi",
  kontak: "Pertanyaan umum",
  pengaduan: "Pengaduan",
  naskah: "Kirim naskah",
  stok: "Kabari bila tersedia",
};
const INQUIRY_STATUS: Record<string, string> = { baru: "Baru", diproses: "Sedang ditangani" };

export async function LatestInquiriesWidget(props: Props) {
  if (!canRead(props, "inquiries")) return null;
  const { req } = props;
  const res = await req.payload.find({
    collection: "inquiries",
    where: { status: { in: ["baru", "diproses"] } },
    sort: "-createdAt",
    limit: 5,
    depth: 0,
    select: { subjectLine: true, type: true, status: true, createdAt: true },
    overrideAccess: false,
    req,
  });
  const list = adminUrl(props, "/collections/inquiries");
  return (
    <Widget title="Pesan masuk terbaru" href={`${list}?where[status][in][0]=baru&where[status][in][1]=diproses`}>
      {res.docs.length === 0 ? (
        <Muted>Tidak ada pesan yang menunggu.</Muted>
      ) : (
        <ul className="ypi-list">
          {res.docs.map((d) => (
            <li key={d.id}>
              <a href={adminUrl(props, `/collections/inquiries/${d.id}`)}>{d.subjectLine || INQUIRY_TYPE[d.type ?? ""] || "Pesan"}</a>
              <span className="ypi-muted">
                {INQUIRY_TYPE[d.type ?? ""] ?? ""} · {INQUIRY_STATUS[d.status ?? ""] ?? d.status} · {ago(d.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Widget>
  );
}

const ACTIVE_ORDER_STATUS = [
  { value: "baru", label: "Baru" },
  { value: "menunggu-bayar", label: "Menunggu pembayaran" },
  { value: "dibayar", label: "Dibayar" },
  { value: "dikemas", label: "Dikemas" },
];

export async function OrdersQueueWidget(props: Props) {
  if (!canRead(props, "orders")) return null;
  const { req } = props;
  const counts = await Promise.all(
    ACTIVE_ORDER_STATUS.map((s) =>
      req.payload
        .count({ collection: "orders", where: { status: { equals: s.value } }, overrideAccess: false, req })
        .then((r) => ({ ...s, n: r.totalDocs })),
    ),
  );
  const latest = await req.payload.find({
    collection: "orders",
    where: { status: { in: ACTIVE_ORDER_STATUS.map((s) => s.value) } },
    sort: "-orderDate",
    limit: 5,
    depth: 0,
    select: { orderNumber: true, customerName: true, total: true, orderDate: true, status: true },
    overrideAccess: false,
    req,
  });
  const list = adminUrl(props, "/collections/orders");
  return (
    <Widget title="Pesanan perlu tindakan" href={list}>
      <dl className="ypi-figures">
        {counts.map((c) => (
          <div key={c.value}>
            <dt>{c.label}</dt>
            <dd>
              <a href={`${list}?where[status][equals]=${c.value}`} className="ypi-num">
                {c.n}
              </a>
            </dd>
          </div>
        ))}
      </dl>
      {latest.docs.length ? (
        <ul className="ypi-list">
          {latest.docs.map((o) => (
            <li key={o.id}>
              <a href={adminUrl(props, `/collections/orders/${o.id}`)}>{o.orderNumber || `#${o.id}`}</a>
              <span className="ypi-muted">
                {o.customerName} · <span className="ypi-num">{formatRupiah(o.total)}</span> · {dateWib(o.orderDate)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </Widget>
  );
}

const Bar = ({ value, max }: { value: number; max: number }) => (
  <span className="ypi-bar" aria-hidden>
    <span style={{ width: `${max ? Math.round((value / max) * 100) : 0}%` }} />
  </span>
);

export async function InterestWidget(props: Props) {
  if (!canRead(props, "order-clicks")) return null;
  const { req } = props;
  const days = Number((props.widgetData as { hari?: unknown } | undefined)?.hari) || 30;
  const r = resolveRange({ days });
  if (!r.ok) return <Widget title="Minat per judul (klik order)">{r.error}</Widget>;
  const { rows, truncated } = await fetchClicks(req, r.range);
  const top = rows.slice(0, 10);
  const titles = await fetchBookTitles(req, top.map((x) => x.bookId));
  const max = top.reduce((m, x) => Math.max(m, x.wa + x.marketplace), 0);
  return (
    <Widget title={`Minat per judul · ${r.range.days} hari`} href={adminUrl(props, "/laporan")} linkLabel="Laporan lengkap →">
      {top.length === 0 ? (
        <Muted>Belum ada klik tombol pesan dalam rentang ini.</Muted>
      ) : (
        <table className="ypi-table">
          <thead>
            <tr>
              <th scope="col">Judul</th>
              <th scope="col" className="ypi-num">WA</th>
              <th scope="col" className="ypi-num">Marketplace</th>
              <th scope="col" className="ypi-num">Total</th>
            </tr>
          </thead>
          <tbody>
            {top.map((x) => (
              <tr key={x.bookId}>
                <td>
                  {titles.get(x.bookId)?.title}
                  <Bar value={x.wa + x.marketplace} max={max} />
                </td>
                <td className="ypi-num">{x.wa}</td>
                <td className="ypi-num">{x.marketplace}</td>
                <td className="ypi-num">{x.wa + x.marketplace}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {truncated ? <Muted>Data terlalu banyak; sebagian tidak dihitung. Persempit rentang di halaman Laporan.</Muted> : null}
    </Widget>
  );
}

export async function OrdersRecapWidget(props: Props) {
  if (!canRead(props, "orders")) return null;
  const { req } = props;
  const r = resolveRange({ days: 30 });
  if (!r.ok) return null;
  const { rows, truncated } = await fetchOrders(req, r.range);
  const top = rows.slice(0, 10);
  const titles = await fetchBookTitles(req, top.map((x) => x.bookId));
  return (
    <Widget title="Rekap pesanan per judul · 30 hari" href={adminUrl(props, "/laporan")} linkLabel="Laporan lengkap →">
      {top.length === 0 ? (
        <Muted>Belum ada pesanan dalam 30 hari terakhir.</Muted>
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
            {top.map((x) => (
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
      <Muted>Nilai = harga satuan × jumlah, sebelum potongan dan ongkir; pesanan batal tidak dihitung.</Muted>
      {truncated ? <Muted>Data terlalu banyak; sebagian tidak dihitung.</Muted> : null}
    </Widget>
  );
}
