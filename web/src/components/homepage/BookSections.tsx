import Link from "next/link";
import { BookGrid } from "@/components/BookCard";
import type { BookShelfBlock, LatestBooksBlock } from "@/lib/homepage-plan";
import type { Book, Category } from "@/payload-types";
import { Ruled, Section } from "./InfoSections";

const ALL_LINK = "link inline-flex min-h-11 shrink-0 items-center text-sm";

export function LatestBooksSection({ block, books }: { block: LatestBooksBlock; books: Book[] }) {
  return (
    <Section block={block} labelledBy={block.headingId}>
      <Ruled rule={block.rule}>
        <div className="flex items-baseline justify-between gap-4">
          <h2 id={block.headingId} className="text-2xl font-semibold">
            {block.heading}
          </h2>
          {block.showAllLink ? (
            <Link href="/buku" className={ALL_LINK}>
              {block.allLinkLabel}
            </Link>
          ) : null}
        </div>
        <div className="mt-6">
          {books.length > 0 ? (
            <BookGrid books={books} priorityCount={block.priorityCount} />
          ) : (
            <p className="text-muted">{block.emptyText}</p>
          )}
        </div>
      </Ruled>
    </Section>
  );
}

/** Pilihan buku (manual, satu kategori, atau unggulan). Tidak tampil bila tak ada buku tayang. */
export function BookShelfSection({
  block,
  books,
  category,
}: {
  block: BookShelfBlock;
  books: Book[];
  category: Category | null;
}) {
  if (books.length === 0) return null;
  const categoryLink = block.source === "category" && block.showAllLink && category ? category : null;
  return (
    <Section block={block} labelledBy={block.headingId}>
      <Ruled rule={block.rule}>
        <div className="flex items-baseline justify-between gap-4">
          <h2 id={block.headingId} className="text-2xl font-semibold">
            {block.heading}
          </h2>
          {categoryLink ? (
            <Link href={`/kategori/${categoryLink.slug}`} className={ALL_LINK}>
              Lihat semua<span className="sr-only"> buku {categoryLink.title}</span>
            </Link>
          ) : null}
        </div>
        {block.intro ? <p className="mt-2 max-w-2xl text-muted">{block.intro}</p> : null}
        <div className="mt-6">
          <BookGrid books={books} priorityCount={block.priorityCount} />
        </div>
      </Ruled>
    </Section>
  );
}
