import Link from "next/link";
import { BookGrid } from "@/components/BookCard";
import { ArrowRightIcon, BuildingIcon, ChatIcon, SearchIcon, TruckIcon } from "@/components/Icons";
import { formatDate } from "@/lib/format";
import { getCategories, getHomeBooks, getPosts, getSettings } from "@/lib/data";

export default async function HomePage() {
  const [settings, { latest, featured }, categories, posts] = await Promise.all([
    getSettings(),
    getHomeBooks(),
    getCategories(),
    getPosts(1, 3),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line bg-primary-950 text-primary-100">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:repeating-linear-gradient(90deg,#fff_0_1px,transparent_1px_72px)]"
        />
        <div className="page-container relative grid gap-10 py-16 sm:py-20 lg:py-24 xl:grid-cols-12">
          <div className="xl:col-span-7">
            <p className="eyebrow text-accent-300">Penerbit Yayasan Populi Indonesia</p>
            <h1 className="mt-4 font-serif text-4xl font-semibold leading-[1.1] text-white sm:text-5xl">
              Buku yang lahir dari riset, untuk pembaca yang ingin memahami Indonesia.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-primary-200">
              {settings.tagline ||
                "Jelajahi katalog terbitan kami, lalu pesan langsung lewat WhatsApp atau toko resmi di marketplace."}
            </p>
            <form action="/buku" method="get" role="search" className="mt-8 max-w-xl">
              <label htmlFor="cari-hero" className="sr-only">
                Cari judul, penulis, atau ISBN
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    id="cari-hero"
                    name="q"
                    type="search"
                    placeholder="Cari judul, penulis, atau ISBN"
                    className="field-input h-12 pl-10 text-base"
                    autoComplete="off"
                  />
                </div>
                <button type="submit" className="btn h-12 bg-accent-500 px-6 text-primary-950 hover:bg-accent-400">
                  Cari
                </button>
              </div>
            </form>
          </div>

          {featured.length > 0 ? (
            <div className="hidden min-h-80 xl:col-span-5 xl:block" aria-hidden>
              <div className="relative mx-auto h-full max-w-sm">
                {featured.slice(0, 3).map((book, i) => {
                  const cover = typeof book.cover === "object" ? book.cover : null;
                  const src = cover?.sizes?.card?.url || cover?.url;
                  if (!src) return null;
                  const pos = [
                    "left-0 top-6 -rotate-6",
                    "left-1/2 top-0 z-10 -translate-x-1/2",
                    "right-0 top-8 rotate-6",
                  ][i];
                  return (
                    // eslint-disable-next-line @next/next/no-img-element -- dekoratif, lihat CoverImage
                    <img
                      key={book.id}
                      src={src.replace(/^https?:\/\/[^/]+/, "")}
                      alt=""
                      width={180}
                      height={270}
                      className={`absolute w-40 rounded shadow-2xl ring-1 ring-white/10 ${pos}`}
                    />
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* Terbaru */}
      <section aria-labelledby="terbaru" className="page-container pt-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Katalog</p>
            <h2 id="terbaru" className="mt-1 text-3xl font-semibold">
              Terbitan terbaru
            </h2>
          </div>
          <Link href="/buku" className="link hidden items-center gap-1 text-sm font-semibold sm:inline-flex">
            Lihat semua buku <ArrowRightIcon />
          </Link>
        </div>
        <div className="mt-8">
          {latest.length > 0 ? (
            <BookGrid books={latest} priorityCount={4} />
          ) : (
            <p className="card p-6 text-muted">Katalog sedang disiapkan. Silakan kembali lagi nanti.</p>
          )}
        </div>
        <Link href="/buku" className="btn-outline mt-8 w-full sm:hidden">
          Lihat semua buku
        </Link>
      </section>

      {/* Kategori */}
      {categories.length > 0 ? (
        <section aria-labelledby="kategori" className="page-container pt-16">
          <h2 id="kategori" className="text-2xl font-semibold">
            Jelajahi menurut topik
          </h2>
          <ul className="mt-5 flex flex-wrap gap-2">
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/kategori/${c.slug}`}
                  className="inline-flex min-h-11 items-center rounded-full border border-line bg-white px-4 text-sm font-medium text-ink hover:border-primary-300 hover:bg-primary-50"
                >
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Cara memesan (F-ORD-02) */}
      <section aria-labelledby="cara-pesan" className="page-container pt-20">
        <div className="rounded-xl border border-line bg-paper-2 p-6 sm:p-10">
          <h2 id="cara-pesan" className="text-2xl font-semibold">
            Cara memesan
          </h2>
          <ol className="mt-6 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: <SearchIcon />,
                title: "Pilih buku",
                body: "Temukan judul di katalog, lalu tekan tombol Pesan via WhatsApp di halaman buku.",
              },
              {
                icon: <ChatIcon />,
                title: "Konfirmasi lewat WhatsApp",
                body: "Admin mengirim total harga dan ongkir ke kota Anda, lalu Anda membayar lewat transfer.",
              },
              {
                icon: <TruckIcon />,
                title: "Buku dikirim",
                body: "Setelah pembayaran diterima, buku dikemas dan nomor resi dikirim ke WhatsApp Anda.",
              },
            ].map((step, i) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-primary-700 ring-1 ring-line">
                  {step.icon}
                </span>
                <div>
                  <h3 className="font-sans text-base font-semibold">
                    <span className="sr-only">Langkah {i + 1}: </span>
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-sm">
            Lebih suka marketplace? Setiap halaman buku juga menautkan ke toko resmi kami.{" "}
            <Link href="/cara-pesan" className="link">
              Baca selengkapnya
            </Link>
          </p>
        </div>
      </section>

      {/* Institusi */}
      <section aria-labelledby="institusi" className="page-container pt-16">
        <div className="flex flex-col items-start gap-6 rounded-xl bg-primary-900 p-6 text-primary-100 sm:p-10 md:flex-row md:items-center">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary-800 text-accent-300">
            <BuildingIcon width={28} height={28} />
          </span>
          <div className="flex-1">
            <h2 id="institusi" className="text-2xl font-semibold text-white">
              Pengadaan untuk perpustakaan, kampus, dan sekolah
            </h2>
            <p className="mt-2 max-w-2xl">
              Butuh banyak eksemplar atau kuitansi atas nama lembaga? Kirim daftar judul, kami balas dengan penawaran
              harga.
            </p>
          </div>
          <Link href="/institusi" className="btn bg-white text-primary-900 hover:bg-primary-50">
            Minta penawaran
          </Link>
        </div>
      </section>

      {/* Kabar */}
      {posts.docs.length > 0 ? (
        <section aria-labelledby="kabar" className="page-container pt-16">
          <div className="flex items-end justify-between gap-4">
            <h2 id="kabar" className="text-2xl font-semibold">
              Kabar penerbit
            </h2>
            <Link href="/kabar" className="link text-sm font-semibold">
              Semua kabar
            </Link>
          </div>
          <ul className="mt-6 grid gap-6 md:grid-cols-3">
            {posts.docs.map((post) => (
              <li key={post.id} className="card relative p-5">
                <p className="text-xs text-muted">
                  <time dateTime={post.publishedAt ?? undefined}>{formatDate(post.publishedAt)}</time>
                </p>
                <h3 className="mt-2 text-lg font-semibold leading-snug">
                  <Link href={`/kabar/${post.slug}`} className="after:absolute after:inset-0 hover:text-primary-700">
                    {post.title}
                  </Link>
                </h3>
                <p className="mt-2 line-clamp-3 text-sm">{post.excerpt}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
