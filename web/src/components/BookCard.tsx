import Link from "next/link";
import type { Book } from "@/payload-types";
import { byline, contributorNames } from "@/lib/format";
import { AvailabilityBadge, PriceTag } from "./BookMeta";
import { CoverImage } from "./CoverImage";

type Props = {
  book: Book;
  priority?: boolean;
  /** Tingkat judul agar struktur heading halaman tetap berurutan. */
  headingLevel?: "h2" | "h3";
};

export function BookCard({ book, priority, headingLevel = "h3" }: Props) {
  const Heading = headingLevel;
  const authors = byline(contributorNames(book));
  return (
    <article className="group relative flex flex-col">
      <div className="overflow-hidden rounded-[2px] bg-paper-2 shadow-[0_1px_2px_rgba(15,35,66,0.18)] dark:ring-1 dark:ring-line">
        <CoverImage
          media={book.cover}
          sizes="(min-width: 1024px) 220px, (min-width: 640px) 30vw, 45vw"
          className="aspect-[2/3] w-full object-cover"
          priority={priority}
          alt=""
        />
      </div>
      <div className="mt-3 flex flex-1 flex-col gap-1">
        <Heading className="font-serif text-[1.05rem] font-semibold leading-snug text-ink">
          {/* Seluruh kartu dapat diklik lewat ::after, tapi hanya satu tautan untuk pembaca layar. */}
          <Link
            href={`/buku/${book.slug}`}
            className="after:absolute after:inset-0 after:content-[''] group-hover:underline focus-visible:outline-none"
          >
            {book.title}
          </Link>
        </Heading>
        {authors ? <p className="text-sm text-muted">{authors}</p> : null}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
          <PriceTag book={book} />
          <AvailabilityBadge value={book.availability} />
        </div>
      </div>
      {/* Fokus keyboard tetap terlihat pada kartu yang seluruhnya bisa diklik. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-2 rounded-lg ring-focus group-has-[a:focus-visible]:ring-3"
      />
    </article>
  );
}

export function BookGrid({
  books,
  priorityCount = 0,
  headingLevel,
}: {
  books: Book[];
  priorityCount?: number;
  headingLevel?: "h2" | "h3";
}) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
      {books.map((book, i) => (
        <li key={book.id} className="flex">
          <BookCard book={book} priority={i < priorityCount} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  );
}
