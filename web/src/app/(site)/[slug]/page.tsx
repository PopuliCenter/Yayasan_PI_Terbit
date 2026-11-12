import type { DefaultNodeTypes, SerializedBlockNode } from "@payloadcms/richtext-lexical";
import type { JSXConvertersFunction } from "@payloadcms/richtext-lexical/react";
import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FormulirSection } from "@/components/forms/FormulirSection";
import { WhatsAppIcon } from "@/components/Icons";
import { RichTextContent } from "@/components/RichTextContent";
import type { FormulirBlock } from "@/payload-types";
import { getPageBySlug, getSettings, type PublicSettings } from "@/lib/data";
import { SITE_URL } from "@/lib/site";
import { formatDate, MARKETPLACE_LABEL } from "@/lib/format";
import { getPreviewUser } from "@/lib/preview";
import { redirectOrNotFound } from "@/lib/redirects";
import { lexicalToPlainText } from "@/lib/richtext";
import { asMedia, ogBase, ogImageFrom, seoTitle } from "@/lib/seo";
import { waUrl } from "@/lib/wa";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [page, s] = await Promise.all([getPageBySlug(slug), getSettings()]);
  if (!page) return { title: "Halaman tidak ditemukan" };
  const description = page.meta?.description || page.summary || lexicalToPlainText(page.content, 158) || undefined;
  const image = ogImageFrom(asMedia(page.meta?.image), page.title) ?? s.ogImage;
  return {
    title: seoTitle(page.meta?.title, s.siteName, page.title),
    description,
    alternates: { canonical: `/${page.slug}` },
    openGraph: {
      ...ogBase(s),
      type: "website",
      title: page.meta?.title || page.title,
      description,
      url: `/${page.slug}`,
      images: image ? [image] : undefined,
    },
  };
}

/**
 * Identitas penerbit dari Pengaturan, selalu tampil di halaman Tentang Kami (F-KON-01).
 * Isinya mengikuti yang diperiksa verifikator ISBN Perpusnas (Perpusnas No. 11/2025 Pasal 5
 * ayat 2 huruf c: situs menjelaskan identitas pemohon) dan isian surat pernyataan ISBN.
 */
function IdentityBlock({ s }: { s: PublicSettings }) {
  const rows = [
    { label: "Nama penerbit", value: s.publisherName },
    { label: "Pengesahan badan hukum", value: s.legalBasis },
    { label: "NIB", value: s.nib },
    { label: "Penanggung jawab", value: s.publisherResponsible },
    { label: "Alamat", value: s.address },
    { label: "Telepon", value: s.phone },
    { label: "Email", value: s.email },
    { label: "Situs web", value: SITE_URL.replace(/^https?:\/\//, "") },
    { label: "WhatsApp", value: s.waNumber ? `+${s.waNumber}` : null },
    { label: "Jam layanan", value: s.serviceHours },
    // Penjual hanya tampil bila berbeda dari penerbit.
    { label: "Penjual", value: s.sellerEntityName && s.sellerEntityName !== s.publisherName ? s.sellerEntityName : null },
  ].filter((r) => r.value);

  return (
    <section aria-labelledby="identitas" className="mt-12">
      <h2 id="identitas" className="text-2xl font-semibold">
        Identitas penerbit
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

/**
 * Alamat pengiriman naskah di halaman Kirim Naskah, dari Pengaturan: email redaksi bila
 * diisi, selain itu email layanan pelanggan.
 */
function ManuscriptContactBlock({ s }: { s: PublicSettings }) {
  const email = s.editorialEmail || s.email;
  return (
    <section aria-labelledby="kirim-naskah-alamat" className="mt-12 rounded-lg border border-line bg-paper-2 p-5 sm:p-6">
      <h2 id="kirim-naskah-alamat" className="text-xl font-semibold">
        Alamat pengiriman naskah
      </h2>
      <ul className="mt-3 space-y-2 text-[0.95rem]">
        {email ? (
          <li>
            Email:{" "}
            <a href={`mailto:${email}`} className="link">
              {email}
            </a>
          </li>
        ) : null}
        <li>
          Formulir:{" "}
          <Link href="/kontak?jenis=naskah" className="link">
            Kontak, jenis pesan Kirim naskah
          </Link>
        </li>
      </ul>
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
        {s.marketplaceStores.length === 0
          ? "Hanya nomor di atas yang resmi."
          : s.waNumber
            ? "Hanya nomor dan toko di atas yang resmi."
            : "Hanya toko di atas yang resmi."}{" "}
        Kami tidak pernah meminta pembayaran ke rekening atas nama pribadi.
      </p>
    </section>
  );
}

export default async function StaticPage({ params }: Props) {
  const { slug } = await params;
  const [page, settings, previewUser] = await Promise.all([getPageBySlug(slug), getSettings(), getPreviewUser()]);
  if (!page) return redirectOrNotFound(`/${slug}`);

  // Pratinjau admin: formulir tampil nonaktif agar tidak membuat kiriman sungguhan.
  const preview = Boolean(previewUser);
  const converters: JSXConvertersFunction<DefaultNodeTypes | SerializedBlockNode<FormulirBlock>> = ({
    defaultConverters,
  }) => ({
    ...defaultConverters,
    blocks: {
      ...defaultConverters.blocks,
      formulir: ({ node }) => (
        <FormulirSection block={node.fields} sourcePath={`/${page.slug}`} preview={preview} />
      ),
    },
  });

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
        <RichTextContent data={page.content} className="mt-8" converters={converters} />

        {page.slug === "tentang" ? <IdentityBlock s={settings} /> : null}
        {page.slug === "cara-pesan" ? <OrderChannelsBlock s={settings} /> : null}
        {page.slug === "kirim-naskah" ? <ManuscriptContactBlock s={settings} /> : null}
      </div>
    </article>
  );
}
