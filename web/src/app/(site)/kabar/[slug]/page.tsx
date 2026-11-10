import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookGrid } from "@/components/BookCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CoverImage } from "@/components/CoverImage";
import { JsonLd } from "@/components/JsonLd";
import { RichTextContent } from "@/components/RichTextContent";
import type { Book, Media } from "@/payload-types";
import { getPostBySlug, getSettings } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { absoluteUrl, mediaPath } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Kabar tidak ditemukan" };
  const image = post.coverImage && typeof post.coverImage === "object" ? (post.coverImage as Media) : null;
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/kabar/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.publishedAt ?? undefined,
      images: image ? [{ url: mediaPath(image.sizes?.og?.url || image.url) ?? "" }] : undefined,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const settings = await getSettings();
  const image = post.coverImage && typeof post.coverImage === "object" ? (post.coverImage as Media) : null;
  const related = (post.relatedBooks ?? []).filter((b): b is Book => typeof b === "object" && b !== null);

  return (
    <article className="page-container py-10">
      <Breadcrumbs items={[{ label: "Kabar", href: "/kabar" }, { label: post.title }]} />
      <header className="mx-auto mt-8 max-w-3xl">
        <p className="text-sm text-muted">
          <time dateTime={post.publishedAt ?? undefined}>{formatDate(post.publishedAt)}</time>
        </p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight sm:text-4xl">{post.title}</h1>
        <p className="mt-4 text-lg">{post.excerpt}</p>
      </header>

      {image ? (
        <div className="mx-auto mt-8 max-w-4xl overflow-hidden rounded-lg">
          <CoverImage media={image} sizes="(min-width: 1024px) 896px, 100vw" className="w-full object-cover" priority />
        </div>
      ) : null}

      <RichTextContent data={post.content} className="mx-auto mt-10 max-w-3xl" />

      {related.length > 0 ? (
        <section aria-labelledby="buku-terkait" className="mt-16">
          <h2 id="buku-terkait" className="text-2xl font-semibold">
            Buku yang disebut
          </h2>
          <div className="mt-6">
            <BookGrid books={related} />
          </div>
        </section>
      ) : null}

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          headline: post.title,
          description: post.excerpt,
          datePublished: post.publishedAt ?? undefined,
          dateModified: post.updatedAt,
          url: absoluteUrl(`/kabar/${post.slug}`),
          image: image?.url ? absoluteUrl(mediaPath(image.url) ?? "") : undefined,
          publisher: { "@type": "Organization", name: settings.siteName },
        }}
      />
    </article>
  );
}
