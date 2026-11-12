import type { Metadata } from "next";
import { BookGrid } from "@/components/BookCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { getBooksInSeries, getSeriesBySlug } from "@/lib/data";
import { redirectOrNotFound } from "@/lib/redirects";
import { absoluteUrl } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const series = await getSeriesBySlug(slug);
  if (!series) return { title: "Seri tidak ditemukan" };
  return {
    title: `Seri ${series.title}`,
    description: series.description || `Semua jilid seri ${series.title}, diurutkan dari jilid pertama.`,
    alternates: { canonical: `/seri/${series.slug}` },
  };
}

export default async function SeriesPage({ params }: Props) {
  const { slug } = await params;
  const series = await getSeriesBySlug(slug);
  if (!series) return redirectOrNotFound(`/seri/${slug}`);

  // Diurutkan menurut nomor jilid (F-KAT-02).
  const books = await getBooksInSeries(series.id);

  return (
    <div className="page-container py-10">
      <Breadcrumbs items={[{ label: "Katalog", href: "/buku" }, { label: `Seri ${series.title}` }]} />
      <p className="eyebrow mt-6">Seri</p>
      <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">{series.title}</h1>
      {series.description ? <p className="mt-3 max-w-3xl text-lg">{series.description}</p> : null}
      <p className="mt-4 text-sm text-muted">{books.length} jilid</p>

      <div className="mt-8">
        {books.length > 0 ? (
          <BookGrid books={books} priorityCount={4} headingLevel="h2" />
        ) : (
          <p className="card p-6 text-muted">Belum ada jilid yang tayang.</p>
        )}
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BookSeries",
          name: series.title,
          url: absoluteUrl(`/seri/${series.slug}`),
          hasPart: books.map((b) => ({ "@type": "Book", name: b.title, url: absoluteUrl(`/buku/${b.slug}`) })),
        }}
      />
    </div>
  );
}
