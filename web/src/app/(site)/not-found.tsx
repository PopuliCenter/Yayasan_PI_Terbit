import Link from "next/link";

/** Status 404 asli (NFR SEO), dengan jalan keluar yang berguna. */
export default function NotFound() {
  return (
    <div className="page-container py-24 text-center">
      <p className="eyebrow">Galat 404</p>
      <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Halaman tidak ditemukan</h1>
      <p className="mx-auto mt-4 max-w-lg text-lg">
        Mungkin tautannya sudah berubah atau bukunya tidak lagi ditayangkan. Coba cari judulnya di katalog.
      </p>
      <form action="/buku" method="get" role="search" className="mx-auto mt-8 flex max-w-md gap-2">
        <label htmlFor="cari-404" className="sr-only">
          Cari judul, penulis, atau ISBN
        </label>
        <input id="cari-404" name="q" type="search" placeholder="Cari judul, penulis, ISBN" className="field-input flex-1" />
        <button type="submit" className="btn-primary">
          Cari
        </button>
      </form>
      <p className="mt-6">
        <Link href="/" className="link">
          Kembali ke beranda
        </Link>
      </p>
    </div>
  );
}
