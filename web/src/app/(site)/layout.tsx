import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import { JsonLd } from "@/components/JsonLd";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { issueFormToken } from "@/lib/antibot";
import { getFooterPages, getSettings } from "@/lib/data";
import { SITE_INDEXABLE, SITE_URL } from "@/lib/site";
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
    "Katalog resmi buku terbitan Yayasan Populi Indonesia. Pesan langsung lewat WhatsApp atau marketplace.";
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: s.siteName, template: `%s — ${s.siteName}` },
    description,
    applicationName: s.siteName,
    openGraph: { siteName: s.siteName, locale: "id_ID", type: "website", description },
    twitter: { card: "summary_large_image" },
    formatDetection: { telephone: false },
    // Staging dan lingkungan lain selain produksi: noindex di setiap halaman,
    // selain robots.txt Disallow dan basic auth di toko-staging-proxy.
    robots: SITE_INDEXABLE ? undefined : { index: false, follow: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#0f2342",
  width: "device-width",
  initialScale: 1,
};

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, footerPages] = await Promise.all([getSettings(), getFooterPages()]);

  return (
    <html lang="id" className={`${inter.variable} ${serif.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <a href="#konten" className="skip-link">
          Langsung ke konten
        </a>
        <SiteHeader siteName={settings.siteName} waNumber={settings.waNumber} />
        <main id="konten" className="flex-1">
          {children}
        </main>
        <SiteFooter settings={settings} footerPages={footerPages} formIssuedAt={issueFormToken()} />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            name: settings.siteName,
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
