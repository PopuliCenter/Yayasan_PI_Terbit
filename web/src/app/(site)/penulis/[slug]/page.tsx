import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookGrid } from "@/components/BookCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CoverImage } from "@/components/CoverImage";
import { JsonLd } from "@/components/JsonLd";
import { RichTextContent } from "@/components/RichTextContent";
import type { Media } from "@/payload-types";
import { getAuthorBySlug, getBooksByAuthor } from "@/lib/data";
import { hasRichText, lexicalToPlainText } from "@/lib/richtext";
import { absoluteUrl } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);
  if (!author) return { title: "Penulis tidak ditemukan" };
  return {
    title: author.name,
    description:
      author.shortBio || lexicalToPlainText(author.bio, 158) || `Buku karya ${author.name} di Penerbit Yayasan Populi Indonesia.`,
    alternates: { canonical: `/penulis/${author.slug}` },
    openGraph: { type: "profile", title: author.name },
  };
}

export default async function AuthorPage({ params }: Props) {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);
  if (!author) notFound();

  const books = await getBooksByAuthor(author.id);
  const photo = author.photo && typeof author.photo === "object" ? (author.photo as Media) : null;

  return (
    <div className="page-container py-10">
      <Breadcrumbs items={[{ label: "Penulis", href: "/penulis" }, { label: author.name }]} />

      <header className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
        {photo ? (
          <CoverImage media={photo} sizes="128px" className="size-32 shrink-0 rounded-full object-cover" alt="" priority />
        ) : null}
        <div className="max-w-3xl">
          <p className="eyebrow">Penulis</p>
          <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">{author.name}</h1>
          {author.shortBio ? <p className="mt-3 text-lg">{author.shortBio}</p> : null}
        </div>
      </header>

      {hasRichText(author.bio) ? (
        <section aria-labelledby="profil" className="mt-10 max-w-3xl">
          <h2 id="profil" className="sr-only">
            Profil
          </h2>
          <RichTextContent data={author.bio} />
        </section>
      ) : null}

      <section aria-labelledby="buku-penulis" className="mt-14">
        <h2 id="buku-penulis" className="text-2xl font-semibold">
          Buku karya {author.name} <span className="font-sans text-base font-normal text-muted">({books.length})</span>
        </h2>
        <div className="mt-6">
          {books.length > 0 ? (
            <BookGrid books={books} priorityCount={4} />
          ) : (
            <p className="card p-6 text-muted">Belum ada buku yang tayang.</p>
          )}
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: author.name,
          url: absoluteUrl(`/penulis/${author.slug}`),
          description: author.shortBio || undefined,
        }}
      />
    </div>
  );
}
