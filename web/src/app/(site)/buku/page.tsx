import type { Metadata } from "next";
import Link from "next/link";
import { BookGrid } from "@/components/BookCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CatalogFilters } from "@/components/CatalogFilters";
import { WhatsAppIcon } from "@/components/Icons";
import { Pagination } from "@/components/Pagination";
import { getAuthors, getCatalog, getCategories, getHomeBooks, getSettings, type CatalogParams } from "@/lib/data";
import { waUrl } from "@/lib/wa";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

const readParams = async (searchParams: Props["searchParams"]): Promise<CatalogParams> => {
  const sp = await searchParams;
  return {
    q: one(sp.q),
    kategori: one(sp.kategori),
    penulis: one(sp.penulis),
    ketersediaan: one(sp.ketersediaan),
    urut: one(sp.urut),
    halaman: one(sp.halaman),
  };
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await readParams(searchParams);
  const filtered = Boolean(params.q || params.kategori || params.penulis || params.ketersediaan || params.urut);
  return {
    title: params.q ? `Hasil pencarian “${params.q}”` : "Katalog buku",
    description: "Semua buku terbitan Penerbit Yayasan Populi Indonesia. Cari menurut judul, penulis, ISBN, atau topik.",
    alternates: { canonical: "/buku" },
    // Halaman hasil filter tidak diindeks agar tidak menjadi duplikat halaman katalog.
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function CatalogPage({ searchParams }: Props) {
  const params = await readParams(searchParams);
  const [result, categories, authors, settings] = await Promise.all([
    getCatalog(params),
    getCategories(),
    getAuthors(),
    getSettings(),
  ]);

  const keepParams = {
    q: params.q,
    kategori: params.kategori,
    penulis: params.penulis,
    ketersediaan: params.ketersediaan,
    urut: params.urut,
  };

  return (
    <div className="page-container py-10">
      <Breadcrumbs items={[{ label: "Katalog" }]} />
      <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">
        {result.query ? (
          <>
            Hasil pencarian <span className="text-primary-700">“{result.query}”</span>
          </>
        ) : (
          "Katalog buku"
        )}
      </h1>

      <div className="mt-6">
        <CatalogFilters params={params} categories={categories} authors={authors} />
      </div>

      <p className="mt-6 text-sm text-muted" role="status" aria-live="polite">
        {result.totalDocs > 0
          ? `${result.totalDocs} buku${result.totalPages > 1 ? ` · halaman ${result.page} dari ${result.totalPages}` : ""}`
          : "Tidak ada buku yang cocok."}
      </p>

      {result.docs.length > 0 ? (
        <div className="mt-6">
          <BookGrid books={result.docs} priorityCount={4} headingLevel="h2" />
          <Pagination page={result.page} totalPages={result.totalPages} basePath="/buku" params={keepParams} />
        </div>
      ) : (
        <EmptyCatalog query={result.query} waNumber={settings.waNumber} categories={categories} />
      )}
    </div>
  );
}

/** Saran saat hasil kosong (F-CARI-03): kategori, buku terbaru, dan tanya lewat WA. */
async function EmptyCatalog({
  query,
  waNumber,
  categories,
}: {
  query: string;
  waNumber: string | null;
  categories: Awaited<ReturnType<typeof getCategories>>;
}) {
  const { latest } = await getHomeBooks();
  return (
    <div className="mt-6 space-y-12">
      <div className="card p-6 sm:p-8">
        <h2 className="text-xl font-semibold">Belum menemukan yang dicari?</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          <li>Periksa ejaan, atau coba kata yang lebih umum.</li>
          <li>Cari dengan nama belakang penulis, atau 13 angka ISBN.</li>
          <li>Hapus filter kategori atau ketersediaan.</li>
        </ul>
        {waNumber ? (
          <a
            href={waUrl(
              waNumber,
              query
                ? `Halo, saya mencari buku "${query}" tapi tidak menemukannya di katalog. Apakah tersedia?`
                : "Halo, saya mencari sebuah buku. Bisa dibantu?",
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-wa mt-5"
          >
            <WhatsAppIcon />
            Tanyakan lewat WhatsApp
            <span className="sr-only"> (membuka WhatsApp di tab baru)</span>
          </a>
        ) : null}
      </div>

      {categories.length > 0 ? (
        <section aria-labelledby="saran-kategori">
          <h2 id="saran-kategori" className="text-xl font-semibold">
            Topik populer
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {categories.slice(0, 10).map((c) => (
              <li key={c.id}>
                <Link
                  href={`/kategori/${c.slug}`}
                  className="inline-flex min-h-11 items-center rounded-full border border-line bg-white px-4 text-sm font-medium text-ink hover:bg-primary-50"
                >
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {latest.length > 0 ? (
        <section aria-labelledby="saran-terbaru">
          <h2 id="saran-terbaru" className="text-xl font-semibold">
            Terbitan terbaru
          </h2>
          <div className="mt-6">
            <BookGrid books={latest.slice(0, 4)} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
