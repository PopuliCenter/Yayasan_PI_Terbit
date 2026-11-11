import Link from "next/link";
import { waUrl } from "@/lib/wa";
import { CloseMenuOnNavigate } from "./CloseMenuOnNavigate";
import { MenuIcon, SearchIcon, WhatsAppIcon } from "./Icons";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "/buku", label: "Katalog" },
  { href: "/penulis", label: "Penulis" },
  { href: "/kabar", label: "Kabar" },
  { href: "/cara-pesan", label: "Cara Pesan" },
  // Halaman CMS slug "tentang": profil penerbit + blok identitas badan hukum (dicek verifikator ISBN).
  // "Untuk Institusi" sengaja dikeluarkan dari header; halamannya tetap ada lewat footer dan beranda.
  { href: "/tentang", label: "Tentang Kami" },
];

type Props = { waNumber: string | null };

/**
 * Header nyaris tanpa JavaScript klien: menu HP memakai <details>, pencarian memakai form GET.
 * Bagian klien hanya tombol mode gelap (ThemeToggle) dan penutup menu saat pindah halaman.
 */
export function SiteHeader({ waNumber }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper">
      <div className="page-container flex h-16 items-center gap-4">
        {/* Nama tautan = teks yang terlihat + "beranda" (WCAG 2.5.3 label in name). */}
        <Link
          href="/"
          className="mr-auto flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap text-ink min-[360px]:gap-2.5"
        >
          {/* HP sangat sempit (< 360 px): logo dan nama sedikit diperkecil agar tetap satu baris. */}
          <Logo className="h-5 w-auto shrink-0 min-[360px]:h-6 sm:h-7" />
          <span className="flex flex-col leading-tight">
            <span className="font-serif text-[0.9rem] font-semibold min-[360px]:text-[1.05rem] sm:text-[1.1rem]">
              Yayasan Populi Indonesia
            </span>
            <span className="hidden font-serif text-sm italic text-muted sm:block">Penerbit</span>
          </span>
          <span className="sr-only">, beranda</span>
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

        {/*
          Header tidak memuat kolom cari: logo + nama + menu sudah memenuhi lebar.
          Layar lebar memakai ikon menuju katalog (yang punya kolom cari); layar kecil
          mencari dari menu. Beranda juga punya kolom cari sendiri.
        */}
        <Link href="/buku" className="btn-ghost hidden size-11 p-0 lg:inline-flex" aria-label="Cari buku">
          <SearchIcon />
        </Link>

        <div className="hidden lg:block">
          <ThemeToggle />
        </div>

        {waNumber ? (
          <a
            href={waUrl(waNumber, "Halo, saya ingin bertanya tentang buku terbitan Yayasan Populi Indonesia.")}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline hidden whitespace-nowrap px-4 text-sm sm:inline-flex lg:max-xl:size-11 lg:max-xl:px-0"
            title="Tanya via WhatsApp"
          >
            <WhatsAppIcon className="text-wa-ink" />
            {/* Di antara lg dan xl header penuh menu: tombol menjadi ikon saja, labelnya tetap terbaca pembaca layar. */}
            <span className="lg:max-xl:sr-only">Tanya via WA</span>
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
          {/* Tinggi dibatasi layar dan bisa digulir, agar baris terakhir (mode gelap) tetap terjangkau di HP pendek/landscape. */}
          <div className="absolute right-0 top-[calc(100%+0.5rem)] max-h-[calc(100dvh-5rem)] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-lg border border-line bg-surface p-3 shadow-xl">
            <CloseMenuOnNavigate />
            <form action="/buku" method="get" role="search" className="mb-2">
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
            <div className="mt-2 border-t border-line pt-2">
              <ThemeToggle variant="row" />
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
