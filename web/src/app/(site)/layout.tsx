import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import { JsonLd } from "@/components/JsonLd";
import { PreviewBar } from "@/components/PreviewBar";
import { SiteAnnouncement } from "@/components/SiteAnnouncement";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ThemeSync } from "@/components/ThemeSync";
import { issueFormToken } from "@/lib/antibot";
import { THEME_STYLE_ID } from "@/lib/appearance/theme";
import { getAppearance, getFooterPages, getSettings } from "@/lib/data";
import { PREVIEW_HOME, previewLink } from "@/lib/preview";
import { SITE_INDEXABLE, SITE_URL } from "@/lib/site";
import { THEME_INIT_SCRIPT, THEME_PAPER } from "@/lib/theme";
import "./globals.css";

/**
 * Semua halaman publik dirender per permintaan agar perubahan admin (mis. status
 * ketersediaan) langsung tampil, dan agar `next build` tidak butuh basis data.
 * Lapisan cache dipasang di Cloudflare saat deploy bila trafik membutuhkannya.
 */
export const dynamic = "force-dynamic";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-source-serif", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const description =
    s.defaultMetaDescription ||
    s.tagline ||
    "Katalog resmi buku terbitan Yayasan Populi Indonesia. Pesan langsung lewat WhatsApp.";
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `${s.siteName} — Penerbit buku`, template: `%s — ${s.siteName}` },
    description,
    applicationName: s.siteName,
    openGraph: {
      siteName: s.siteName,
      locale: "id_ID",
      type: "website",
      description,
      images: s.ogImage ? [s.ogImage] : undefined,
    },
    twitter: { card: "summary_large_image" },
    formatDetection: { telephone: false },
    // Staging dan lingkungan lain selain produksi: noindex di setiap halaman,
    // selain robots.txt Disallow dan basic auth di toko-staging-proxy.
    robots: SITE_INDEXABLE ? undefined : { index: false, follow: false },
  };
}

export const viewport: Viewport = {
  // Bawaan tanpa JavaScript (mengikuti mode perangkat); ThemeSync menyamakannya dengan pilihan pengunjung.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_PAPER.light },
    { media: "(prefers-color-scheme: dark)", color: THEME_PAPER.dark },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, footerPages, appearance] = await Promise.all([getSettings(), getFooterPages(), getAppearance()]);

  // Pratinjau di host admin: "/" dan "/#jangkar" dialihkan nginx ke /admin, jadi tautan
  // internal ke beranda diarahkan ke /pratinjau/beranda. Di luar pratinjau objeknya
  // dipakai apa adanya, sehingga HTML publik tidak berubah.
  const preview = appearance.preview;
  const headerNav = preview ? appearance.headerNav.map(previewLink) : appearance.headerNav;
  const footer = preview ? { ...appearance.footer, links: appearance.footer.links.map(previewLink) } : appearance.footer;
  const announcement =
    preview && appearance.announcement?.link
      ? { ...appearance.announcement, link: previewLink(appearance.announcement.link) }
      : appearance.announcement;

  return (
    // suppressHydrationWarning: skrip tema mengubah data-theme pada <html> sebelum React aktif.
    <html lang="id" className={`${inter.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        {/*
          Skrip sinkron biasa, bukan next/script: beforeInteractive di App Router hanya
          diantrekan (self.__next_s) dan baru jalan setelah halaman tergambar, sehingga
          mode gelap sempat berkedip terang. Isinya konstanta dari lib/theme.ts, bukan
          masukan pengguna. Di halaman yang layout-nya dirender ulang di browser (404),
          React dev mencatat peringatan soal tag script; ThemeSync menjaga temanya.
        */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {/*
          Tema warna dari global Tampilan. CSS-nya hanya dari pembuat yang menyaring
          (lib/appearance/theme.ts: kunci tetap + hex tervalidasi), bukan teks admin. Palet
          navy bawaan menghasilkan "" sehingga tag ini tidak dirender dan HTML tetap sama.
          Saat pratinjau tag selalu ada, agar PreviewBar bisa menukar isinya seketika.
        */}
        {appearance.theme.css !== "" || appearance.preview ? (
          <style id={THEME_STYLE_ID} dangerouslySetInnerHTML={{ __html: appearance.theme.css }} />
        ) : null}
      </head>
      <body className="flex min-h-dvh flex-col">
        <ThemeSync />
        <a href="#konten" className="skip-link">
          Langsung ke konten
        </a>
        {appearance.preview ? <PreviewBar /> : null}
        {announcement ? <SiteAnnouncement announcement={announcement} /> : null}
        <SiteHeader
          waNumber={settings.waNumber}
          nav={headerNav}
          showWhatsAppButton={appearance.showWhatsAppButton}
          homeHref={appearance.preview ? PREVIEW_HOME : "/"}
        />
        <main id="konten" className="flex-1">
          {children}
        </main>
        <SiteFooter
          settings={settings}
          footerPages={footerPages}
          formIssuedAt={issueFormToken()}
          footer={footer}
        />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            name: settings.publisherName,
            legalName: settings.sellerEntityName || settings.legalEntityName || undefined,
            url: SITE_URL,
            email: settings.email || undefined,
            telephone: settings.waNumber ? `+${settings.waNumber}` : undefined,
            address: settings.address || undefined,
            sameAs: [...settings.marketplaceStores.map((m) => m.url), ...settings.socialLinks.map((s) => s.url)],
          }}
        />
      </body>
    </html>
  );
}
