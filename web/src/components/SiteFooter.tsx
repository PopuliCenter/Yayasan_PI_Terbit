import Link from "next/link";
import { DEFAULT_FOOTER, type ResolvedAppearance } from "@/lib/appearance/resolve";
import type { PublicSettings } from "@/lib/data";
import { MARKETPLACE_LABEL } from "@/lib/format";
import { waUrl } from "@/lib/wa";
import { NewsletterForm } from "./forms/NewsletterForm";
import { Logo } from "./Logo";
import { NavLink } from "./NavLink";

type Props = {
  settings: PublicSettings;
  footerPages: { id: number; title: string; slug: string }[];
  /**
   * Bagian footer yang diatur di global Tampilan: judul kolom tautan, tautan tambahan,
   * catatan kaki, dan sakelar kabar terbitan/media sosial. Bawaan = footer sebelum fitur ini.
   * Identitas penerbit, "Layanan pembaca", dan "Kontak & pengaduan" tetap dari Pengaturan Situs.
   */
  footer?: ResolvedAppearance["footer"];
  formIssuedAt: string;
};

export function SiteFooter({ settings, footerPages, footer = DEFAULT_FOOTER, formIssuedAt }: Props) {
  const seller = settings.sellerEntityName || settings.publisherName;
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-line bg-paper-2">
      <div className="page-container grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-12">
        <section className="lg:col-span-4" aria-labelledby="footer-identitas">
          <Logo className="h-9 w-auto text-ink" />
          <h2 id="footer-identitas" className="mt-4 font-serif text-xl font-semibold text-ink">
            {settings.siteName}
          </h2>
          {settings.tagline ? <p className="mt-2 text-sm text-muted">{settings.tagline}</p> : null}
          {/* Identitas penjual wajib jelas (F-KON-01). */}
          <dl className="mt-5 space-y-2 text-sm">
            <div>
              <dt className="sr-only">Penerbit</dt>
              <dd className="text-ink">Penerbit: {settings.publisherName}</dd>
            </div>
            {settings.legalBasis ? (
              <div>
                <dt className="sr-only">Pengesahan badan hukum</dt>
                <dd>{settings.legalBasis}</dd>
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
          <h2 id="footer-kontak" className="font-sans text-sm font-semibold text-ink">
            Layanan pembaca
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {settings.waNumber ? (
              <li>
                <a
                  href={waUrl(settings.waNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link"
                >
                  WhatsApp +{settings.waNumber}
                </a>
              </li>
            ) : null}
            {settings.email ? (
              <li>
                <a href={`mailto:${settings.email}`} className="link">
                  {settings.email}
                </a>
              </li>
            ) : null}
            {settings.serviceHours ? <li>{settings.serviceHours}</li> : null}
            <li>
              <Link href="/kontak" className="link">
                Kontak &amp; pengaduan
              </Link>
            </li>
          </ul>

          {settings.marketplaceStores.length > 0 ? (
            <>
              <h3 className="mt-8 font-sans text-sm font-semibold text-ink">Toko resmi</h3>
              <ul className="mt-2 flex flex-wrap gap-x-5 text-sm">
                {settings.marketplaceStores.map((m) => (
                  <li key={m.url}>
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link inline-flex min-h-9 items-center"
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
          <h2 id="footer-info" className="font-sans text-sm font-semibold text-ink">
            {footer.infoTitle}
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {footerPages.map((p) => (
              <li key={p.id}>
                <Link href={`/${p.slug}`} className="hover:text-ink hover:underline">
                  {p.title}
                </Link>
              </li>
            ))}
            {footer.links.map((l) => (
              <li key={`${l.href}-${l.label}`}>
                <NavLink link={l} className="hover:text-ink hover:underline">
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {footer.showNewsletter ? (
          <section className="lg:col-span-3" aria-labelledby="footer-kabar">
            <h2 id="footer-kabar" className="font-sans text-sm font-semibold text-ink">
              Kabar terbitan baru
            </h2>
            <p className="mt-3 text-sm">Satu email saat ada buku baru. Tanpa promosi berlebihan.</p>
            <NewsletterForm
              consentText={settings.consentText}
              consentVersion={settings.consentVersion}
              issuedAt={formIssuedAt}
            />
          </section>
        ) : null}
      </div>

      <div className="border-t border-line">
        <div className="page-container flex flex-col gap-2 py-6 text-xs text-muted md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {seller || settings.siteName}. Hak cipta dilindungi undang-undang.
          </p>
          {settings.registeredInfo ? <p className="whitespace-pre-line">{settings.registeredInfo}</p> : null}
          {/* Catatan kaki dari global Tampilan: teks biasa (React meng-escape), baris baru dipertahankan. */}
          {footer.note ? <p className="whitespace-pre-line">{footer.note}</p> : null}
          {footer.showSocialLinks && settings.socialLinks.length > 0 ? (
            <ul className="flex gap-4">
              {settings.socialLinks.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:text-ink hover:underline">
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
