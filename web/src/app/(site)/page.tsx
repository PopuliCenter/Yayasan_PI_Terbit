import Link from "next/link";
import { BookGrid } from "@/components/BookCard";
import { PriceTag } from "@/components/BookMeta";
import { CoverImage } from "@/components/CoverImage";
import { SearchIcon } from "@/components/Icons";
import { authorNames, formatDate, joinNames } from "@/lib/format";
import { getCategories, getHomeBooks, getPosts, getSettings } from "@/lib/data";
import { lexicalToPlainText } from "@/lib/richtext";

const ORDER_STEPS = [
  {
    title: "Pilih buku",
    body: "Cari judulnya di katalog, lalu tekan tombol Pesan via WhatsApp di halaman buku.",
  },
  {
    title: "Konfirmasi dengan admin",
    body: "Admin membalas dengan total harga dan ongkos kirim ke kota Anda. Pembayaran lewat transfer.",
  },
  {
    title: "Buku dikirim",
    body: "Setelah pembayaran masuk, buku dikemas dan nomor resinya kami kirim lewat WhatsApp.",
  },
];

export default async function HomePage() {
  const [settings, { latest, featured }, categories, posts] = await Promise.all([
    getSettings(),
    getHomeBooks(),
    getCategories(),
    getPosts(1, 3),
  ]);

  const spotlight = featured[0] ?? latest[0] ?? null;
  const spotlightAuthors = spotlight ? joinNames(authorNames(spotlight)) : "";
  const spotlightBlurb = spotlight ? lexicalToPlainText(spotlight.synopsis, 220) : "";

  return (
    <>
      <section className="page-container pt-10 sm:pt-14">
        {/* Dua kolom baru mulai lg: di tablet potret kolom sorotan terlalu sempit untuk judul dan sinopsis. */}
        <div className="grid gap-10 border-b border-line pb-12 sm:pb-14 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <h1 className="max-w-[20ch] text-[2rem] font-semibold leading-[1.15] sm:text-[2.6rem]">
              Buku kajian politik, demokrasi, dan kebijakan publik.
            </h1>
            {/* Identitas penerbit tertulis di layar pertama: verifikator ISBN membuka beranda lebih dulu. */}
            <p className="mt-5 max-w-xl text-lg leading-relaxed">
              {settings.publisherName} menerbitkan buku untuk pembaca umum. Situs ini adalah katalog resmi
              terbitan kami: pilih judul, lalu pesan lewat WhatsApp atau toko resmi kami di marketplace.{" "}
              <Link href="/tentang" className="link">
                Tentang kami
              </Link>
            </p>
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
                    placeholder="Judul, penulis, atau ISBN"
                    className="field-input h-12 pl-10 text-base"
                    autoComplete="off"
                  />
                </div>
                <button type="submit" className="btn-primary h-12 px-5">
                  Cari
                </button>
              </div>
            </form>
          </div>

          {spotlight ? (
            <aside
              aria-labelledby="sorotan"
              className="border-t border-line pt-8 lg:col-span-5 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0"
            >
              <p id="sorotan" className="text-sm text-muted">
                {featured.length > 0 ? "Pilihan kami" : "Baru terbit"}
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

      <section aria-labelledby="terbaru" className="page-container pt-12">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="terbaru" className="text-2xl font-semibold">
            Terbitan terbaru
          </h2>
          <Link href="/buku" className="link inline-flex min-h-11 shrink-0 items-center text-sm">
            Lihat semua buku
          </Link>
        </div>
        <div className="mt-6">
          {latest.length > 0 ? (
            <BookGrid books={latest} priorityCount={4} />
          ) : (
            <p className="text-muted">Katalog sedang disiapkan. Silakan kembali lagi nanti.</p>
          )}
        </div>
      </section>

      {categories.length > 0 ? (
        <section aria-labelledby="kategori" className="page-container pt-14">
          <div className="border-t border-line pt-8">
            <h2 id="kategori" className="text-xl font-semibold">
              Menurut topik
            </h2>
            <ul className="mt-3 flex flex-wrap gap-x-6">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link href={`/kategori/${c.slug}`} className="link inline-flex min-h-11 items-center">
                    {c.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* Cara memesan (F-ORD-02) */}
      <section aria-labelledby="cara-pesan" className="page-container pt-12">
        <div className="grid gap-8 border-t border-line pt-8 md:grid-cols-12">
          <div className="md:col-span-4">
            <h2 id="cara-pesan" className="text-xl font-semibold">
              Cara memesan
            </h2>
            <p className="mt-2 text-sm text-muted">
              Situs ini tidak memakai keranjang belanja. Setiap pesanan dilayani langsung oleh admin kami.
            </p>
          </div>
          <div className="md:col-span-8">
          <ol className="space-y-6">
            {ORDER_STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-5">
                <span aria-hidden className="w-6 shrink-0 font-serif text-2xl leading-none text-accent-700">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-sans text-base font-semibold">
                    <span className="sr-only">Langkah {i + 1}: </span>
                    {step.title}
                  </h3>
                  <p className="mt-1 leading-relaxed">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-6 pl-11 text-sm">
            Lebih suka belanja di marketplace? Setiap halaman buku juga menautkan ke toko resmi kami.{" "}
            <Link href="/cara-pesan" className="link">
              Selengkapnya
            </Link>
          </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="institusi" className="page-container pt-12">
        <div className="grid gap-6 border-t border-line pt-8 md:grid-cols-12">
          <h2 id="institusi" className="text-xl font-semibold md:col-span-4">
            Untuk perpustakaan, kampus, dan sekolah
          </h2>
          <div className="md:col-span-8">
            <p className="max-w-2xl leading-relaxed">
              Perlu banyak eksemplar, atau kuitansi atas nama lembaga? Kirimkan daftar judulnya. Kami balas dengan
              penawaran harga.
            </p>
            <Link href="/institusi" className="btn-outline mt-5">
              Minta penawaran
            </Link>
          </div>
        </div>
      </section>

      {posts.docs.length > 0 ? (
        <section aria-labelledby="kabar" className="page-container pt-12">
          <div className="flex items-baseline justify-between gap-4 border-t border-line pt-8">
            <h2 id="kabar" className="text-xl font-semibold">
              Kabar penerbit
            </h2>
            <Link href="/kabar" className="link inline-flex min-h-11 shrink-0 items-center text-sm">
              Semua kabar
            </Link>
          </div>
          <ul className="mt-2 divide-y divide-line">
            {posts.docs.map((post) => (
              <li key={post.id} className="grid gap-1 py-5 sm:grid-cols-[10rem_1fr] sm:gap-6">
                <p className="text-sm text-muted">
                  <time dateTime={post.publishedAt ?? undefined}>{formatDate(post.publishedAt)}</time>
                </p>
                <div>
                  <h3 className="text-lg font-semibold leading-snug">
                    <Link href={`/kabar/${post.slug}`} className="hover:underline">
                      {post.title}
                    </Link>
                  </h3>
                  {post.excerpt ? <p className="mt-1 line-clamp-2 text-sm">{post.excerpt}</p> : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
