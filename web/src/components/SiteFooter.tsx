import Link from "next/link";
import type { PublicSettings } from "@/lib/data";
import { MARKETPLACE_LABEL } from "@/lib/format";
import { waUrl } from "@/lib/wa";
import { NewsletterForm } from "./forms/NewsletterForm";

type Props = {
  settings: PublicSettings;
  footerPages: { id: number; title: string; slug: string }[];
  formIssuedAt: string;
};

export function SiteFooter({ settings, footerPages, formIssuedAt }: Props) {
  const seller = settings.sellerEntityName || settings.legalEntityName;
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-line bg-primary-950 text-primary-100">
      <div className="page-container grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-12">
        <section className="lg:col-span-4" aria-labelledby="footer-identitas">
          <h2 id="footer-identitas" className="font-serif text-xl text-white">
            {settings.siteName}
          </h2>
          {settings.tagline ? <p className="mt-2 text-sm text-primary-200">{settings.tagline}</p> : null}
          {/* Identitas penjual wajib jelas (F-KON-01). */}
          <dl className="mt-5 space-y-2 text-sm">
            {seller ? (
              <div>
                <dt className="sr-only">Penyelenggara</dt>
                <dd className="text-white">{seller}</dd>
              </div>
            ) : null}
            {settings.address ? (
              <div>
                <dt className="sr-only">Alamat</dt>
                <dd className="whitespace-pre-line">{settings.address}</dd>
              </div>
            ) : null}
            {settings.nib ? (
              <div>
                <dt className="inline">NIB: </dt>
                <dd className="inline">{settings.nib}</dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section className="lg:col-span-3" aria-labelledby="footer-kontak">
          <h2 id="footer-kontak" className="eyebrow text-primary-300">
            Layanan pembaca
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {settings.waNumber ? (
              <li>
                <a
                  href={waUrl(settings.waNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white underline decoration-primary-500 underline-offset-4 hover:decoration-white"
                >
                  WhatsApp +{settings.waNumber}
                </a>
              </li>
            ) : null}
            {settings.email ? (
              <li>
                <a href={`mailto:${settings.email}`} className="text-white underline decoration-primary-500 underline-offset-4 hover:decoration-white">
                  {settings.email}
                </a>
              </li>
            ) : null}
            {settings.serviceHours ? <li>{settings.serviceHours}</li> : null}
            <li>
              <Link href="/kontak" className="text-white underline decoration-primary-500 underline-offset-4 hover:decoration-white">
                Kontak &amp; pengaduan
              </Link>
            </li>
          </ul>

          {settings.marketplaceStores.length > 0 ? (
            <>
              <h3 className="eyebrow mt-8 text-primary-300">Toko resmi</h3>
              <ul className="mt-3 flex flex-wrap gap-2 text-sm">
                {settings.marketplaceStores.map((m) => (
                  <li key={m.url}>
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-9 items-center rounded border border-primary-700 px-3 text-white hover:border-primary-400"
                    >
                      {MARKETPLACE_LABEL[m.platform] ?? m.platform}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>

        <nav className="lg:col-span-2" aria-labelledby="footer-info">
          <h2 id="footer-info" className="eyebrow text-primary-300">
            Informasi
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {footerPages.map((p) => (
              <li key={p.id}>
                <Link href={`/${p.slug}`} className="hover:text-white hover:underline">
                  {p.title}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/institusi" className="hover:text-white hover:underline">
                Pembelian institusi
              </Link>
            </li>
          </ul>
        </nav>

        <section className="lg:col-span-3" aria-labelledby="footer-kabar">
          <h2 id="footer-kabar" className="eyebrow text-primary-300">
            Kabar terbitan baru
          </h2>
          <p className="mt-3 text-sm">Satu email saat ada buku baru. Tanpa promosi berlebihan.</p>
          <NewsletterForm
            consentText={settings.consentText}
            consentVersion={settings.consentVersion}
            issuedAt={formIssuedAt}
          />
        </section>
      </div>

      <div className="border-t border-primary-800">
        <div className="page-container flex flex-col gap-2 py-6 text-xs text-primary-300 md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {seller || settings.siteName}. Hak cipta dilindungi undang-undang.
          </p>
          {settings.registeredInfo ? <p className="whitespace-pre-line">{settings.registeredInfo}</p> : null}
          {settings.socialLinks.length > 0 ? (
            <ul className="flex gap-4">
              {settings.socialLinks.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
