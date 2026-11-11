import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { WhatsAppIcon } from "@/components/Icons";
import { RichTextContent } from "@/components/RichTextContent";
import { getPageBySlug, getSettings, type PublicSettings } from "@/lib/data";
import { formatDate, MARKETPLACE_LABEL } from "@/lib/format";
import { lexicalToPlainText } from "@/lib/richtext";
import { waUrl } from "@/lib/wa";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) return { title: "Halaman tidak ditemukan" };
  return {
    title: page.title,
    description: page.summary || lexicalToPlainText(page.content, 158) || undefined,
    alternates: { canonical: `/${page.slug}` },
  };
}

/** Identitas penyelenggara dari Pengaturan, selalu tampil di halaman Tentang (F-KON-01). */
function IdentityBlock({ s }: { s: PublicSettings }) {
  const rows = [
    { label: "Nama penerbit", value: s.siteName },
    { label: "Penyelenggara situs", value: s.legalEntityName },
    { label: "Penjual", value: s.sellerEntityName },
    { label: "Alamat", value: s.address },
    { label: "NIB", value: s.nib },
    { label: "Email", value: s.email },
    { label: "WhatsApp", value: s.waNumber ? `+${s.waNumber}` : null },
    { label: "Jam layanan", value: s.serviceHours },
  ].filter((r) => r.value);

  return (
    <section aria-labelledby="identitas" className="mt-12">
      <h2 id="identitas" className="text-2xl font-semibold">
        Identitas penyelenggara
      </h2>
      <dl className="mt-4 divide-y divide-line rounded-lg border border-line bg-surface">
        {rows.map((r) => (
          <div key={r.label} className="grid grid-cols-[10rem_1fr] gap-3 px-4 py-2.5 text-sm sm:grid-cols-[12rem_1fr]">
            <dt className="text-muted">{r.label}</dt>
            <dd className="whitespace-pre-line text-ink">{r.value}</dd>
          </div>
        ))}
      </dl>
      {s.registeredInfo ? <p className="mt-3 whitespace-pre-line text-sm text-muted">{s.registeredInfo}</p> : null}
    </section>
  );
}

/** Kanal pemesanan aktif, selalu sinkron dengan Pengaturan di halaman Cara Pesan. */
function OrderChannelsBlock({ s }: { s: PublicSettings }) {
  if (!s.waNumber && s.marketplaceStores.length === 0) return null;
  return (
    <section aria-labelledby="kanal" className="mt-12 rounded-lg border border-line bg-paper-2 p-5 sm:p-6">
      <h2 id="kanal" className="text-xl font-semibold">
        Kanal pemesanan resmi
      </h2>
      <div className="mt-4 flex flex-wrap gap-3">
        {s.waNumber ? (
          <a href={waUrl(s.waNumber)} target="_blank" rel="noopener noreferrer" className="btn-wa">
            <WhatsAppIcon /> WhatsApp +{s.waNumber}
            <span className="sr-only"> (membuka WhatsApp di tab baru)</span>
          </a>
        ) : null}
        {s.marketplaceStores.map((m) => (
          <a key={m.url} href={m.url} target="_blank" rel="noopener noreferrer" className="btn-outline">
            Toko {MARKETPLACE_LABEL[m.platform] ?? m.platform}
          </a>
        ))}
      </div>
      {s.serviceHours ? <p className="mt-4 text-sm">Jam layanan WhatsApp: {s.serviceHours}.</p> : null}
      <p className="mt-2 text-sm text-muted">
        Hanya nomor dan toko di atas yang resmi. Kami tidak pernah meminta pembayaran ke rekening atas nama pribadi.
      </p>
    </section>
  );
}

export default async function StaticPage({ params }: Props) {
  const { slug } = await params;
  const [page, settings] = await Promise.all([getPageBySlug(slug), getSettings()]);
  if (!page) notFound();

  return (
    <article className="page-container py-10">
      <Breadcrumbs items={[{ label: page.title }]} />
      <div className="mx-auto mt-8 max-w-3xl">
        <h1 className="text-3xl font-semibold sm:text-4xl">{page.title}</h1>
        {page.policyVersion || page.policyEffectiveDate ? (
          <p className="mt-3 text-sm text-muted">
            {page.policyVersion ? <>Versi {page.policyVersion}</> : null}
            {page.policyVersion && page.policyEffectiveDate ? " · " : null}
            {page.policyEffectiveDate ? <>Berlaku sejak {formatDate(page.policyEffectiveDate)}</> : null}
          </p>
        ) : null}
        <RichTextContent data={page.content} className="mt-8" />

        {page.slug === "tentang" ? <IdentityBlock s={settings} /> : null}
        {page.slug === "cara-pesan" ? <OrderChannelsBlock s={settings} /> : null}
      </div>
    </article>
  );
}
