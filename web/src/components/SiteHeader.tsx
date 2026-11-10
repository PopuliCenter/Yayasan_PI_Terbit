import Link from "next/link";
import { waUrl } from "@/lib/wa";
import { MenuIcon, SearchIcon, WhatsAppIcon } from "./Icons";

const NAV = [
  { href: "/buku", label: "Katalog" },
  { href: "/penulis", label: "Penulis" },
  { href: "/kabar", label: "Kabar" },
  { href: "/cara-pesan", label: "Cara Pesan" },
  { href: "/institusi", label: "Untuk Institusi" },
];

type Props = { siteName: string; waNumber: string | null };

/**
 * Header tanpa JavaScript klien: menu HP memakai <details>, pencarian memakai form GET.
 */
export function SiteHeader({ siteName, waNumber }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/85">
      <div className="page-container flex h-16 items-center gap-4">
        <Link href="/" className="mr-auto flex min-h-11 items-center gap-2.5" aria-label={`${siteName} — beranda`}>
          <span
            aria-hidden
            className="flex size-9 items-center justify-center rounded bg-primary-900 font-serif text-lg font-bold text-accent-300"
          >
            P
          </span>
          <span className="leading-tight">
            <span className="block font-serif text-[1.05rem] font-semibold text-ink">Penerbit Populi</span>
            <span className="hidden text-[0.7rem] font-medium uppercase tracking-[0.12em] text-muted sm:block">
              Yayasan Populi Indonesia
            </span>
          </span>
        </Link>

        <nav aria-label="Utama" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="btn-ghost whitespace-nowrap px-3 text-sm font-medium">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Di antara lg dan xl ruang header sempit: kolom cari diganti ikon menuju katalog. */}
        <Link href="/buku" className="btn-ghost hidden size-11 p-0 lg:inline-flex xl:hidden" aria-label="Cari buku">
          <SearchIcon />
        </Link>

        <form action="/buku" method="get" role="search" className="hidden md:block lg:hidden xl:block">
          <label htmlFor="cari-header" className="sr-only">
            Cari judul, penulis, atau ISBN
          </label>
          <div className="relative">
            <input
              id="cari-header"
              name="q"
              type="search"
              placeholder="Cari judul, penulis, ISBN"
              className="field-input w-56 pl-9 text-sm"
              autoComplete="off"
            />
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          </div>
        </form>

        {waNumber ? (
          <a
            href={waUrl(waNumber, "Halo, saya ingin bertanya tentang buku terbitan Penerbit Populi.")}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-wa hidden whitespace-nowrap px-4 text-sm sm:inline-flex"
          >
            <WhatsAppIcon />
            Tanya via WA
            <span className="sr-only"> (membuka WhatsApp di tab baru)</span>
          </a>
        ) : null}

        <details className="group relative lg:hidden">
          <summary
            className="btn-ghost size-11 cursor-pointer list-none p-0 [&::-webkit-details-marker]:hidden"
            aria-label="Buka menu"
          >
            <MenuIcon />
          </summary>
          <div className="absolute right-0 top-[calc(100%+0.5rem)] w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-line bg-white p-3 shadow-xl">
            <form action="/buku" method="get" role="search" className="mb-2 md:hidden">
              <label htmlFor="cari-menu" className="sr-only">
                Cari judul, penulis, atau ISBN
              </label>
              <input
                id="cari-menu"
                name="q"
                type="search"
                placeholder="Cari judul, penulis, ISBN"
                className="field-input text-sm"
              />
            </form>
            <nav aria-label="Menu HP">
              <ul>
                {NAV.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="flex min-h-11 items-center rounded px-3 font-medium text-ink hover:bg-paper-2">
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/kontak" className="flex min-h-11 items-center rounded px-3 font-medium text-ink hover:bg-paper-2">
                    Kontak
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </details>
      </div>
    </header>
  );
}
