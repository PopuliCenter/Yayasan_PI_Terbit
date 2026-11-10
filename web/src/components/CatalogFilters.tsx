import Link from "next/link";
import type { Author, Category } from "@/payload-types";
import { SORTS, type CatalogParams } from "@/lib/data";

type Props = {
  params: CatalogParams;
  categories: Category[];
  authors: Author[];
};

/**
 * Filter katalog sebagai form GET biasa: berfungsi tanpa JavaScript, URL hasil
 * bisa dibagikan, dan tombol kembali peramban bekerja apa adanya (F-CARI-02).
 */
export function CatalogFilters({ params, categories, authors }: Props) {
  return (
    <form action="/buku" method="get" role="search" aria-label="Cari dan saring katalog" className="card p-4 sm:p-5">
      <div className="grid gap-4 md:grid-cols-12">
        <div className="md:col-span-12 lg:col-span-4">
          <label htmlFor="f-q" className="field-label">
            Kata kunci
          </label>
          <input
            id="f-q"
            name="q"
            type="search"
            defaultValue={params.q}
            placeholder="Judul, penulis, atau ISBN"
            className="field-input"
            autoComplete="off"
          />
        </div>
        <div className="md:col-span-4 lg:col-span-2">
          <label htmlFor="f-kategori" className="field-label">
            Kategori
          </label>
          <select id="f-kategori" name="kategori" defaultValue={params.kategori ?? ""} className="field-input">
            <option value="">Semua</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-4 lg:col-span-2">
          <label htmlFor="f-penulis" className="field-label">
            Penulis
          </label>
          <select id="f-penulis" name="penulis" defaultValue={params.penulis ?? ""} className="field-input">
            <option value="">Semua</option>
            {authors.map((a) => (
              <option key={a.id} value={a.slug}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-4 lg:col-span-2">
          <label htmlFor="f-ketersediaan" className="field-label">
            Ketersediaan
          </label>
          <select id="f-ketersediaan" name="ketersediaan" defaultValue={params.ketersediaan ?? ""} className="field-input">
            <option value="">Semua</option>
            <option value="tersedia">Tersedia</option>
            <option value="terbatas">Stok terbatas</option>
            <option value="segera">Segera terbit</option>
            <option value="habis">Habis</option>
          </select>
        </div>
        <div className="md:col-span-4 lg:col-span-2">
          <label htmlFor="f-urut" className="field-label">
            Urutkan
          </label>
          <select id="f-urut" name="urut" defaultValue={params.urut ?? ""} className="field-input">
            <option value="">{params.q ? "Paling relevan" : "Terbaru"}</option>
            {Object.entries(SORTS)
              .filter(([key]) => params.q || key !== "terbaru")
              .map(([key, s]) => (
                <option key={key} value={key}>
                  {s.label}
                </option>
              ))}
          </select>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-primary">
          Terapkan
        </button>
        {params.q || params.kategori || params.penulis || params.ketersediaan || params.urut ? (
          <Link href="/buku" className="link text-sm">
            Hapus semua filter
          </Link>
        ) : null}
      </div>
    </form>
  );
}
