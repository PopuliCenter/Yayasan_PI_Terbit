import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookGrid } from "@/components/BookCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Pagination } from "@/components/Pagination";
import { getCatalog, getCategoryBySlug } from "@/lib/data";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ halaman?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Kategori tidak ditemukan" };
  return {
    title: `Buku ${category.title}`,
    description: category.description || `Buku bertopik ${category.title} terbitan Penerbit Yayasan Populi Indonesia.`,
    alternates: { canonical: `/kategori/${category.slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { halaman } = await searchParams;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const result = await getCatalog({ kategori: slug, halaman });

  return (
    <div className="page-container py-10">
      <Breadcrumbs items={[{ label: "Katalog", href: "/buku" }, { label: category.title }]} />
      <p className="eyebrow mt-6">Kategori</p>
      <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">{category.title}</h1>
      {category.description ? <p className="mt-3 max-w-3xl text-lg">{category.description}</p> : null}
      <p className="mt-4 text-sm text-muted">
        {result.totalDocs} buku ·{" "}
        <Link href={`/buku?kategori=${category.slug}`} className="link">
          Cari dan saring di kategori ini
        </Link>
      </p>

      <div className="mt-8">
        {result.docs.length > 0 ? (
          <>
            <BookGrid books={result.docs} priorityCount={4} headingLevel="h2" />
            <Pagination page={result.page} totalPages={result.totalPages} basePath={`/kategori/${category.slug}`} />
          </>
        ) : (
          <p className="card p-6 text-muted">Belum ada buku di kategori ini.</p>
        )}
      </div>
    </div>
  );
}
