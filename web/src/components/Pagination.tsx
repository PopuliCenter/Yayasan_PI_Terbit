import Link from "next/link";

type Props = {
  page: number;
  totalPages: number;
  /** Path dasar, mis. "/buku". */
  basePath: string;
  /** Parameter kueri lain yang harus dipertahankan. */
  params?: Record<string, string | undefined>;
};

const hrefFor = (basePath: string, params: Props["params"], page: number) => {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params ?? {})) if (v) qs.set(k, v);
  if (page > 1) qs.set("halaman", String(page));
  const s = qs.toString();
  return s ? `${basePath}?${s}` : basePath;
};

/** Nomor halaman yang ditampilkan: awal, akhir, dan sekitar halaman aktif. */
const pageWindow = (page: number, total: number): (number | "…")[] => {
  const set = new Set([1, total, page - 1, page, page + 1].filter((p) => p >= 1 && p <= total));
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("…");
    out.push(p);
  });
  return out;
};

export function Pagination({ page, totalPages, basePath, params }: Props) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Halaman" className="mt-12 flex justify-center">
      <ul className="flex flex-wrap items-center gap-1.5">
        {page > 1 ? (
          <li>
            <Link href={hrefFor(basePath, params, page - 1)} className="btn-outline px-3" rel="prev">
              ‹ <span className="sr-only sm:not-sr-only">Sebelumnya</span>
            </Link>
          </li>
        ) : null}
        {pageWindow(page, totalPages).map((p, i) =>
          p === "…" ? (
            <li key={`gap-${i}`} aria-hidden className="px-1 text-muted">
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                href={hrefFor(basePath, params, p)}
                aria-current={p === page ? "page" : undefined}
                className={p === page ? "btn-primary min-w-11 px-3" : "btn-outline min-w-11 px-3"}
              >
                <span className="sr-only">Halaman </span>
                {p}
              </Link>
            </li>
          ),
        )}
        {page < totalPages ? (
          <li>
            <Link href={hrefFor(basePath, params, page + 1)} className="btn-outline px-3" rel="next">
              <span className="sr-only sm:not-sr-only">Berikutnya</span> ›
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
