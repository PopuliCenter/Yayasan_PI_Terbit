"use client";

import Link from "next/link";
import { ExternalIcon, WhatsAppIcon } from "./Icons";

type MarketplaceLink = { platform: string; label: string; url: string };

type Props = {
  bookId: number;
  waHref: string | null;
  orderable: boolean;
  marketplaceLinks: MarketplaceLink[];
  note: string | null;
  serviceHours: string | null;
  responseTarget: string | null;
  institutionHref: string;
};

/**
 * Catat klik order tanpa menahan navigasi (F-ORD-06).
 * sendBeacon tetap terkirim walau tab berpindah ke WhatsApp atau marketplace.
 * Tidak ada pengenal pengunjung yang dikirim.
 */
const track = (bookId: number, target: "wa" | "marketplace", platform?: string) => {
  try {
    const body = JSON.stringify({ b: bookId, t: target, p: platform ?? null, path: window.location.pathname });
    const blob = new Blob([body], { type: "application/json" });
    if (!navigator.sendBeacon?.("/klik", blob)) {
      void fetch("/klik", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } });
    }
  } catch {
    // Pencatatan tidak boleh mengganggu pemesanan.
  }
};

/**
 * Bilah pesan tetap di bawah layar, hanya untuk layar kecil. Di HP, panel order
 * berada di bawah sampul dan judul; bilah ini menjaga tombol WhatsApp selalu
 * terjangkau jempol (NFR mobile-first, area sentuh ≥ 44 px).
 */
export function MobileOrderBar({
  bookId,
  waHref,
  orderable,
  priceLabel,
}: {
  bookId: number;
  waHref: string | null;
  orderable: boolean;
  priceLabel: string;
}) {
  if (!waHref) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 py-3 shadow-[0_-8px_24px_-12px_rgba(15,35,66,0.25)] backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-xl items-center gap-3">
        <p className="min-w-0 flex-1">
          <span className="sr-only">Harga: </span>
          <span className="block truncate text-lg font-bold text-ink">{priceLabel}</span>
        </p>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-wa shrink-0"
          onClick={() => track(bookId, "wa")}
        >
          <WhatsAppIcon />
          {orderable ? "Pesan via WA" : "Tanya via WA"}
          <span className="sr-only"> (membuka WhatsApp di tab baru)</span>
        </a>
      </div>
    </div>
  );
}

export function OrderPanel({
  bookId,
  waHref,
  orderable,
  marketplaceLinks,
  note,
  serviceHours,
  responseTarget,
  institutionHref,
}: Props) {
  const hasAnyChannel = Boolean(waHref) || marketplaceLinks.length > 0;

  return (
    <section aria-labelledby="pesan-heading" className="card p-5 sm:p-6">
      <h2 id="pesan-heading" className="font-sans text-base font-semibold text-ink">
        {orderable ? "Pesan buku ini" : "Tanya ketersediaan"}
      </h2>

      {!hasAnyChannel ? (
        <p className="mt-3 text-sm text-muted">
          Kanal pemesanan sedang disiapkan. Silakan hubungi kami lewat halaman Kontak.
        </p>
      ) : null}

      <div className="mt-4 flex flex-col gap-3">
        {waHref ? (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-wa w-full text-base"
            onClick={() => track(bookId, "wa")}
          >
            <WhatsAppIcon />
            {orderable ? "Pesan via WhatsApp" : "Tanya via WhatsApp"}
            <span className="sr-only"> (membuka WhatsApp di tab baru)</span>
          </a>
        ) : null}

        {marketplaceLinks.length > 0 ? (
          <div>
            {waHref ? (
              <p className="mb-2 mt-1 text-center text-sm text-muted">
                Atau beli di
              </p>
            ) : null}
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {marketplaceLinks.map((m) => (
                <li key={`${m.platform}-${m.url}`}>
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="btn-outline w-full"
                    onClick={() => track(bookId, "marketplace", m.platform)}
                  >
                    {m.label}
                    <ExternalIcon />
                    <span className="sr-only"> (membuka situs marketplace di tab baru)</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted">Harga di marketplace dapat berbeda dari harga penerbit.</p>
          </div>
        ) : null}
      </div>

      {waHref ? (
        <div className="mt-5 border-t border-line pt-4 text-sm leading-relaxed text-body">
          {note ? <p>{note}</p> : null}
          {serviceHours || responseTarget ? (
            <p className="mt-2 text-muted">
              {serviceHours ? <>Jam layanan: {serviceHours}. </> : null}
              {responseTarget ? <>Kami membalas {responseTarget}.</> : null}
            </p>
          ) : null}
        </div>
      ) : null}

      <p className="mt-4 text-sm">
        Membeli untuk perpustakaan, kampus, atau sekolah?{" "}
        <Link href={institutionHref} className="link">
          Minta penawaran
        </Link>
      </p>
    </section>
  );
}
