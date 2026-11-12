import Link from "next/link";
import { PriceTag } from "@/components/BookMeta";
import { CoverImage } from "@/components/CoverImage";
import { SearchIcon } from "@/components/Icons";
import { byline, contributorNames } from "@/lib/format";
import { resolveIntro, selectSpotlight, type HeroBlock, type HomepageData } from "@/lib/homepage-plan";
import { lexicalToPlainText } from "@/lib/richtext";

type Props = { block: HeroBlock; data: HomepageData; publisherName: string };

/** Pembuka: judul, kalimat identitas penerbit (selalu ada), pencarian, dan sorotan buku. */
export function HeroSection({ block, data, publisherName }: Props) {
  const { book: spotlight, label } = selectSpotlight(block, data);
  const spotlightAuthors = spotlight ? byline(contributorNames(spotlight)) : "";
  const spotlightBlurb = spotlight ? lexicalToPlainText(spotlight.synopsis, 220) : "";

  return (
    <section className="page-container pt-10 sm:pt-14">
      {/* Dua kolom baru mulai lg: di tablet potret kolom sorotan terlalu sempit untuk judul dan sinopsis. */}
      <div className="grid gap-10 border-b border-line pb-12 sm:pb-14 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          <h1 className="max-w-[20ch] text-[2rem] font-semibold leading-[1.15] sm:text-[2.6rem]">{block.heading}</h1>
          {/* Identitas penerbit tertulis di layar pertama: verifikator ISBN membuka beranda lebih dulu. */}
          <p className="mt-5 max-w-xl text-lg leading-relaxed">
            {resolveIntro(block.intro, publisherName)}{" "}
            <Link href="/tentang" className="link">
              Tentang kami
            </Link>
          </p>
          {block.showSearch ? (
            <form action="/buku" method="get" role="search" className="mt-8 max-w-lg">
              <label htmlFor="cari-beranda" className="field-label">
                Cari buku
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    id="cari-beranda"
                    name="q"
                    type="search"
                    placeholder={block.searchPlaceholder}
                    className="field-input h-12 pl-10 text-base"
                    autoComplete="off"
                  />
                </div>
                <button type="submit" className="btn-primary h-12 px-5">
                  Cari
                </button>
              </div>
            </form>
          ) : null}
        </div>

        {spotlight ? (
          <aside
            aria-labelledby="sorotan"
            className="border-t border-line pt-8 lg:col-span-5 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0"
          >
            <p id="sorotan" className="text-sm text-muted">
              {label}
            </p>
            <div className="mt-4 flex gap-5">
              <Link href={`/buku/${spotlight.slug}`} className="w-28 shrink-0 sm:w-36" tabIndex={-1} aria-hidden>
                <CoverImage
                  media={spotlight.cover}
                  sizes="144px"
                  className="aspect-[2/3] w-full rounded-[2px] object-cover shadow-[0_1px_2px_rgba(15,35,66,0.18)] dark:ring-1 dark:ring-line"
                  priority
                  alt=""
                />
              </Link>
              <div className="min-w-0">
                <h2 className="text-xl font-semibold leading-snug">
                  <Link href={`/buku/${spotlight.slug}`} className="hover:underline">
                    {spotlight.title}
                  </Link>
                </h2>
                {spotlightAuthors ? <p className="mt-1 text-sm text-muted">{spotlightAuthors}</p> : null}
                {spotlightBlurb ? <p className="mt-3 line-clamp-4 text-sm leading-relaxed">{spotlightBlurb}</p> : null}
                <div className="mt-3">
                  <PriceTag book={spotlight} />
                </div>
              </div>
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
