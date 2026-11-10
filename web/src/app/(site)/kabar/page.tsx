import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CoverImage } from "@/components/CoverImage";
import { Pagination } from "@/components/Pagination";
import type { Media } from "@/payload-types";
import { getPosts } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Kabar penerbit",
  description: "Rilis buku baru, peluncuran, liputan, dan pengumuman dari Penerbit Yayasan Populi Indonesia.",
  alternates: { canonical: "/kabar" },
};

type Props = { searchParams: Promise<{ halaman?: string }> };

export default async function PostsPage({ searchParams }: Props) {
  const { halaman } = await searchParams;
  const page = Math.max(1, Number.parseInt(halaman ?? "1", 10) || 1);
  const posts = await getPosts(page, 12);

  return (
    <div className="page-container py-10">
      <Breadcrumbs items={[{ label: "Kabar" }]} />
      <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Kabar penerbit</h1>

      {posts.docs.length === 0 ? (
        <p className="card mt-8 p-6 text-muted">Belum ada kabar.</p>
      ) : (
        <ul className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.docs.map((post, i) => {
            const image = post.coverImage && typeof post.coverImage === "object" ? (post.coverImage as Media) : null;
            return (
              <li key={post.id} className="card relative flex flex-col overflow-hidden">
                {image ? (
                  <CoverImage
                    media={image}
                    sizes="(min-width: 1024px) 360px, (min-width: 768px) 45vw, 100vw"
                    className="aspect-[16/9] w-full object-cover"
                    priority={i < 2}
                    alt=""
                  />
                ) : null}
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-xs text-muted">
                    <time dateTime={post.publishedAt ?? undefined}>{formatDate(post.publishedAt)}</time>
                  </p>
                  <h2 className="mt-2 text-xl font-semibold leading-snug">
                    <Link href={`/kabar/${post.slug}`} className="after:absolute after:inset-0 hover:text-primary-700">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="mt-2 line-clamp-3 text-sm">{post.excerpt}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Pagination page={posts.page ?? 1} totalPages={posts.totalPages} basePath="/kabar" />
    </div>
  );
}
