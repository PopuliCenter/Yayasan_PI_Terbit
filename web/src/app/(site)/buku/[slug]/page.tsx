import type { Metadata } from "next";
import Link from "next/link";
import { BookGrid } from "@/components/BookCard";
import { AvailabilityBadge, PriceTag } from "@/components/BookMeta";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CoverImage } from "@/components/CoverImage";
import { JsonLd } from "@/components/JsonLd";
import { MobileOrderBar, OrderPanel } from "@/components/OrderPanel";
import { RichTextContent } from "@/components/RichTextContent";
import type { Author, Book, Category, Media, Series } from "@/payload-types";
import { getBookBySlug, getRelatedBooks, getSettings } from "@/lib/data";
import {
  AVAILABILITY,
  byline,
  CONTRIBUTOR_ROLES,
  contributorEntries,
  contributorNames,
  contributorPhrase,
  contributorsOf,
  formatDimensions,
  formatRupiah,
  joinNames,
  LANGUAGE_LABEL,
  listSeparator,
  MARKETPLACE_LABEL,
  ROLE_LABEL,
} from "@/lib/format";
import { getDisplayPrice } from "@/lib/pricing";
import { redirectOrNotFound } from "@/lib/redirects";
import { hasRichText, lexicalToPlainText } from "@/lib/richtext";
import { asMedia, ogBase, ogImageFrom, seoTitle } from "@/lib/seo";
import { absoluteUrl, mediaPath } from "@/lib/site";
import { buildWaMessage, waUrl } from "@/lib/wa";

type Props = { params: Promise<{ slug: string }> };

const asObj = <T,>(v: number | T | null | undefined): T | null => (v && typeof v === "object" ? v : null);

/** Orang untuk JSON-LD; larik kosong menjadi undefined karena JSON.stringify hanya membuang undefined. */
const persons = (list: Author[]) =>
  list.length
    ? list.map((a) => ({ "@type": "Person", name: a.name, url: absoluteUrl(`/penulis/${a.slug}`) }))
    : undefined;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [book, s] = await Promise.all([getBookBySlug(slug), getSettings()]);
  if (!book) return { title: "Buku tidak ditemukan" };

  const names = contributorNames(book);
  const phrase = contributorPhrase(names);
  const line = byline(names);
  const description =
    book.meta?.description ||
    lexicalToPlainText(book.synopsis, 158) ||
    `${book.title}${phrase ? ` ${phrase}` : ""}. Terbitan ${s.publisherName}.`;
  // Gambar bagikan: tab SEO → sampul (ukuran og 1200×630) → gambar bawaan situs.
  const image =
    ogImageFrom(asMedia(book.meta?.image), book.title) ?? ogImageFrom(asObj<Media>(book.cover), book.title) ?? s.ogImage;

  return {
    title: seoTitle(book.meta?.title, s.siteName, line ? `${book.title} — ${line}` : book.title),
    description,
    alternates: { canonical: `/buku/${book.slug}` },
    openGraph: {
      ...ogBase(s),
      type: "book",
      title: book.meta?.title || book.title,
      description,
      url: `/buku/${book.slug}`,
      images: image ? [image] : undefined,
      // Buku suntingan tanpa penulis: penyunting yang dicantumkan.
      authors: names.authors.length ? names.authors : names.editors,
      isbn: book.isbn13 ?? undefined,
    },
  };
}

const SCHEMA_AVAILABILITY: Record<Book["availability"], string> = {
  tersedia: "https://schema.org/InStock",
  terbatas: "https://schema.org/LimitedAvailability",
  habis: "https://schema.org/OutOfStock",
  segera: "https://schema.org/PreOrder",
};

export default async function BookPage({ params }: Props) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book) return redirectOrNotFound(`/buku/${slug}`);

  const [settings, related] = await Promise.all([getSettings(), getRelatedBooks(book)]);

  const people = contributorsOf(book);
  const roleLines = CONTRIBUTOR_ROLES.map((r) => ({ ...r, people: people[r.key] })).filter((r) => r.people.length > 0);
  // Profil singkat: tiap orang sekali, beserta semua perannya pada buku ini.
  const bios = contributorEntries(people).filter((e) => e.person.shortBio);
  const onlyAuthors = bios.every((e) => e.roles.length === 1 && e.roles[0] === "authors");
  const categories = (book.categories ?? [])
    .map((c) => asObj<Category>(c))
    .filter((c): c is Category => Boolean(c));
  const series = asObj<Series>(book.series);
  const cover = asObj<Media>(book.cover);
  const availability = AVAILABILITY[book.availability];
  const pageUrl = absoluteUrl(`/buku/${book.slug}`);

  const waHref =
    settings.waNumber && book.waOrderEnabled !== false
      ? waUrl(
          settings.waNumber,
          availability.orderable
            ? buildWaMessage(settings.waMessageTemplate, book, pageUrl)
            : `Halo, apakah buku "${book.title}"${book.isbn13 ? ` (ISBN ${book.isbn13})` : ""} akan tersedia lagi? Mohon kabari saya.`,
        )
      : null;

  const marketplaceLinks = availability.orderable
    ? (book.marketplaceLinks ?? []).map((m) => ({
        platform: m.platform,
        url: m.url,
        label: m.label || MARKETPLACE_LABEL[m.platform] || "Marketplace",
      }))
    : [];

  const { price } = getDisplayPrice(book);
  const dimensions = formatDimensions(book);

  const details: { label: string; value: React.ReactNode }[] = [
    ...CONTRIBUTOR_ROLES.map(({ key, label }) => ({ label, value: joinNames(people[key].map((a) => a.name)) })),
    // Penerbit dan ISBN selalu tampil: verifikator ISBN Perpusnas memeriksa halaman buku ini
    // (FAQ ISBN: katalog memuat sampul, judul, penulis, ISBN — boleh "dalam proses" — dan sinopsis).
    { label: "Penerbit", value: settings.publisherName },
    { label: "ISBN", value: book.isbn13 || "Dalam proses" },
    { label: "Tahun terbit", value: book.publishedYear },
    { label: "Cetakan", value: book.edition },
    { label: "Jumlah halaman", value: book.pageCount ? `${book.pageCount} halaman` : null },
    { label: "Ukuran", value: dimensions },
    { label: "Berat", value: book.weightGram ? `${book.weightGram} gram` : null },
    { label: "Bahasa", value: book.language ? LANGUAGE_LABEL[book.language] : null },
    {
      label: "Seri",
      value: series ? (
        <Link href={`/seri/${series.slug}`} className="link">
          {series.title}
          {book.seriesOrder ? `, jilid ${book.seriesOrder}` : ""}
        </Link>
      ) : null,
    },
    {
      label: "Kategori",
      value: categories.length ? (
        <span className="flex flex-wrap gap-x-2 gap-y-1">
          {categories.map((c, i) => (
            <span key={c.id}>
              <Link href={`/kategori/${c.slug}`} className="link">
                {c.title}
              </Link>
              {i < categories.length - 1 ? "," : ""}
            </span>
          ))}
        </span>
      ) : null,
    },
  ].filter((d) => d.value !== null && d.value !== undefined && d.value !== "");

  const previews = (book.previewPages ?? [])
    .map((p) => asObj<Media>(p.image))
    .filter((m): m is Media => Boolean(m));

  return (
    // pb-28 di HP agar konten terbawah tidak tertutup bilah pesan tetap.
    <article className="page-container pb-28 pt-10 lg:pb-10">
      <Breadcrumbs
        items={[
          { label: "Katalog", href: "/buku" },
          ...(categories[0] ? [{ label: categories[0].title, href: `/kategori/${categories[0].slug}` }] : []),
          { label: book.title },
        ]}
      />

      <div className="mt-6 grid gap-10 lg:grid-cols-12">
        {/* Sampul */}
        <div className="lg:col-span-4">
          <div className="mx-auto max-w-[12rem] overflow-hidden rounded-[2px] shadow-[0_1px_3px_rgba(15,35,66,0.22)] dark:ring-1 dark:ring-line sm:max-w-xs lg:sticky lg:top-24 lg:max-w-none">
            <CoverImage
              media={cover}
              sizes="(min-width: 1024px) 360px, 320px"
              className="aspect-[2/3] w-full object-cover"
              priority
              alt={cover?.alt || `Sampul buku ${book.title}`}
            />
          </div>
        </div>

        {/* Judul, harga, order */}
        <div className="lg:col-span-8">
          <div className="flex flex-wrap items-center gap-2">
            <AvailabilityBadge value={book.availability} />
            {series ? (
              <Link
                href={`/seri/${series.slug}`}
                className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-ink"
              >
                Seri {series.title}
                {book.seriesOrder ? ` · Jilid ${book.seriesOrder}` : ""}
              </Link>
            ) : null}
          </div>

          <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">{book.title}</h1>
          {book.subtitle ? <p className="mt-2 font-serif text-xl text-body">{book.subtitle}</p> : null}

          {roleLines.length > 0 ? (
            <div className="mt-4 space-y-1 text-base">
              {roleLines.map(({ key, label, people: list }) => (
                <p key={key}>
                  <span className="text-muted">{label}: </span>
                  {list.map((a, i) => (
                    <span key={a.id}>
                      <Link href={`/penulis/${a.slug}`} className="link font-semibold">
                        {a.name}
                      </Link>
                      {listSeparator(i, list.length)}
                    </span>
                  ))}
                </p>
              ))}
            </div>
          ) : null}

          <div className="mt-6">
            <PriceTag book={book} size="lg" />
          </div>

          <div className="mt-6 grid gap-8 xl:grid-cols-[1fr_20rem]">
            <div className="order-2 space-y-10 xl:order-1">
              {hasRichText(book.synopsis) ? (
                <section aria-labelledby="sinopsis">
                  <h2 id="sinopsis" className="text-xl font-semibold">
                    Sinopsis
                  </h2>
                  <RichTextContent data={book.synopsis} className="mt-3" />
                </section>
              ) : null}

              <section aria-labelledby="detail">
                <h2 id="detail" className="text-xl font-semibold">
                  Detail buku
                </h2>
                <dl className="mt-3 divide-y divide-line rounded-lg border border-line bg-surface">
                  {details.map((d) => (
                    <div key={d.label} className="grid grid-cols-[9rem_1fr] gap-3 px-4 py-2.5 text-sm sm:grid-cols-[11rem_1fr]">
                      <dt className="text-muted">{d.label}</dt>
                      <dd className="text-ink">{d.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              {hasRichText(book.tableOfContents) ? (
                <section aria-labelledby="daftar-isi">
                  <details className="group rounded-lg border border-line bg-surface">
                    <summary className="flex min-h-12 cursor-pointer items-center justify-between px-4 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                      <h2 id="daftar-isi" className="font-sans text-base">
                        Daftar isi
                      </h2>
                      <span aria-hidden className="text-muted transition-transform group-open:rotate-180">
                        ▾
                      </span>
                    </summary>
                    <RichTextContent data={book.tableOfContents} className="border-t border-line px-4 py-4 text-[0.95rem]" />
                  </details>
                </section>
              ) : null}

              {previews.length > 0 ? (
                <section aria-labelledby="pratinjau">
                  <h2 id="pratinjau" className="text-xl font-semibold">
                    Pratinjau halaman
                  </h2>
                  <ul className="mt-3 flex snap-x gap-3 overflow-x-auto pb-2">
                    {previews.map((m, i) => (
                      <li key={m.id} className="w-44 shrink-0 snap-start">
                        <a href={mediaPath(m.url) ?? "#"} target="_blank" rel="noopener" className="block">
                          <CoverImage
                            media={m}
                            sizes="176px"
                            className="aspect-[2/3] w-full rounded border border-line object-cover"
                            alt={m.alt || `Pratinjau halaman ${i + 1}`}
                          />
                          <span className="sr-only"> (buka ukuran penuh di tab baru)</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {bios.length > 0 ? (
                <section aria-labelledby="tentang-penulis">
                  <h2 id="tentang-penulis" className="text-xl font-semibold">
                    {onlyAuthors ? "Tentang penulis" : "Tentang kontributor"}
                  </h2>
                  <ul className="mt-3 space-y-4">
                    {bios.map(({ person: a, roles }) => (
                      <li key={a.id} className="flex gap-4">
                        {asObj<Media>(a.photo) ? (
                          <CoverImage
                            media={a.photo}
                            sizes="64px"
                            className="size-16 shrink-0 rounded-full object-cover"
                            alt=""
                          />
                        ) : null}
                        <div>
                          <h3 className="font-sans text-base font-semibold">
                            <Link href={`/penulis/${a.slug}`} className="link inline-flex min-h-11 items-center">
                              {a.name}
                            </Link>
                          </h3>
                          {onlyAuthors ? null : (
                            <p className="text-sm text-muted">{roles.map((r) => ROLE_LABEL[r]).join(" · ")}</p>
                          )}
                          <p className="mt-1 text-sm leading-relaxed">{a.shortBio}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>

            <div className="order-1 xl:order-2">
              <div className="xl:sticky xl:top-24">
                <OrderPanel
                  bookId={book.id}
                  waHref={waHref}
                  orderable={availability.orderable}
                  marketplaceLinks={marketplaceLinks}
                  note={settings.orderStepsNote}
                  serviceHours={settings.serviceHours}
                  responseTarget={settings.waResponseTarget}
                  institutionHref={`/institusi?buku=${encodeURIComponent(book.slug)}`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 ? (
        <section aria-labelledby="terkait" className="mt-20">
          <h2 id="terkait" className="text-2xl font-semibold">
            {series ? "Dari seri dan topik yang sama" : "Buku dengan topik serupa"}
          </h2>
          <div className="mt-6">
            <BookGrid books={related} />
          </div>
        </section>
      ) : null}

      <MobileOrderBar
        bookId={book.id}
        waHref={waHref}
        orderable={availability.orderable}
        priceLabel={formatRupiah(price)}
      />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": ["Book", "Product"],
          "@id": `${pageUrl}#buku`,
          name: book.title,
          alternateName: book.subtitle || undefined,
          url: pageUrl,
          image: cover?.url ? absoluteUrl(mediaPath(cover.url) ?? "") : undefined,
          description: lexicalToPlainText(book.synopsis, 500) || undefined,
          isbn: book.isbn13 || undefined,
          gtin13: book.isbn13 ? book.isbn13.replace(/\D/g, "") : undefined,
          sku: book.isbn13 ? book.isbn13.replace(/\D/g, "") : `BUKU-${book.id}`,
          numberOfPages: book.pageCount || undefined,
          inLanguage: book.language === "en" ? "en" : book.language === "id" ? "id" : undefined,
          datePublished: book.publishedYear ? String(book.publishedYear) : undefined,
          bookEdition: book.edition || undefined,
          author: persons(people.authors),
          editor: persons(people.editors),
          translator: persons(people.translators),
          brand: { "@type": "Brand", name: settings.siteName },
          publisher: { "@type": "Organization", name: settings.publisherName, url: absoluteUrl("/tentang") },
          weight: book.weightGram ? { "@type": "QuantitativeValue", value: book.weightGram, unitCode: "GRM" } : undefined,
          isPartOf: series ? { "@type": "BookSeries", name: series.title, url: absoluteUrl(`/seri/${series.slug}`) } : undefined,
          offers: {
            "@type": "Offer",
            url: pageUrl,
            price,
            priceCurrency: "IDR",
            availability: SCHEMA_AVAILABILITY[book.availability],
            itemCondition: "https://schema.org/NewCondition",
            seller: { "@type": "Organization", name: settings.sellerEntityName || settings.siteName },
          },
        }}
      />
    </article>
  );
}
