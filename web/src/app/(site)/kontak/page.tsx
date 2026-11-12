import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BotFields } from "@/components/forms/BotFields";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { WhatsAppIcon } from "@/components/Icons";
import { issueFormToken } from "@/lib/antibot";
import { getSettings } from "@/lib/data";
import { waUrl } from "@/lib/wa";

export const metadata: Metadata = {
  title: "Kontak & pengaduan",
  description: "Hubungi Yayasan Populi Indonesia untuk pertanyaan, pengaduan, atau pengiriman naskah.",
  alternates: { canonical: "/kontak" },
};

type Props = { searchParams: Promise<{ jenis?: string }> };

const TYPES = new Set(["kontak", "pengaduan", "naskah", "institusi"]);

/** Halaman Kontak (F-KON-03, F-FRM-02): kontak, prosedur, tenggat, dan kontak Ditjen PKTN. */
export default async function ContactPage({ searchParams }: Props) {
  const { jenis } = await searchParams;
  const settings = await getSettings();
  const defaultType = (jenis && TYPES.has(jenis) ? jenis : "kontak") as "kontak" | "pengaduan" | "naskah" | "institusi";

  return (
    <div className="page-container py-10">
      <Breadcrumbs items={[{ label: "Kontak & pengaduan" }]} />

      <div className="mt-6 grid gap-12 lg:grid-cols-12">
        <div className="space-y-10 lg:col-span-5">
          <div>
            <h1 className="text-3xl font-semibold sm:text-4xl">Kontak &amp; pengaduan</h1>
            <p className="mt-4 text-lg">
              Untuk pemesanan, jalur tercepat adalah WhatsApp. Untuk pertanyaan lain, pengaduan, atau naskah, gunakan
              formulir di halaman ini.
            </p>
          </div>

          <section aria-labelledby="kontak-langsung">
            <h2 id="kontak-langsung" className="font-sans text-base font-semibold">
              Kontak langsung
            </h2>
            <dl className="mt-3 space-y-3 text-[0.95rem]">
              {settings.waNumber ? (
                <div>
                  <dt className="text-sm text-muted">WhatsApp</dt>
                  <dd>
                    <a href={waUrl(settings.waNumber)} target="_blank" rel="noopener noreferrer" className="btn-wa mt-1">
                      <WhatsAppIcon /> +{settings.waNumber}
                      <span className="sr-only"> (membuka WhatsApp di tab baru)</span>
                    </a>
                  </dd>
                </div>
              ) : null}
              {settings.email ? (
                <div>
                  <dt className="text-sm text-muted">Email</dt>
                  <dd>
                    <a href={`mailto:${settings.email}`} className="link">
                      {settings.email}
                    </a>
                  </dd>
                </div>
              ) : null}
              {settings.editorialEmail && settings.editorialEmail !== settings.email ? (
                <div>
                  <dt className="text-sm text-muted">Email redaksi (naskah)</dt>
                  <dd>
                    <a href={`mailto:${settings.editorialEmail}`} className="link">
                      {settings.editorialEmail}
                    </a>
                  </dd>
                </div>
              ) : null}
              {settings.phone ? (
                <div>
                  <dt className="text-sm text-muted">Telepon</dt>
                  <dd>{settings.phone}</dd>
                </div>
              ) : null}
              {settings.serviceHours ? (
                <div>
                  <dt className="text-sm text-muted">Jam layanan</dt>
                  <dd>{settings.serviceHours}</dd>
                </div>
              ) : null}
              {settings.address ? (
                <div>
                  <dt className="text-sm text-muted">Alamat</dt>
                  <dd className="whitespace-pre-line">{settings.address}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section aria-labelledby="prosedur" className="rounded-lg border border-line bg-paper-2 p-5">
            <h2 id="prosedur" className="font-sans text-base font-semibold">
              Prosedur pengaduan
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-[0.95rem]">
              <li>Kirim pengaduan lewat formulir ini (pilih “Pengaduan”), WhatsApp, atau email.</li>
              <li>
                Sertakan nomor pesanan atau tanggal pembelian, serta foto bila ada kerusakan. Untuk buku rusak, cacat,
                atau salah kirim, lihat juga{" "}
                <Link href="/pengembalian" className="link">
                  ketentuan pengembalian dan penukaran
                </Link>
                .
              </li>
              <li>
                Kami menanggapi <strong>{settings.complaintResponseTarget || "maksimal 2 hari kerja"}</strong> dan
                menyampaikan penyelesaiannya: penggantian barang atau pengembalian dana.
              </li>
              <li>Bila belum puas dengan penyelesaian kami, Anda dapat mengadu ke Ditjen PKTN Kementerian Perdagangan.</li>
            </ol>
            {settings.pktnContact ? (
              <div className="mt-4 border-t border-line pt-4 text-sm">
                <p className="font-semibold text-ink">Direktorat Jenderal Perlindungan Konsumen dan Tertib Niaga</p>
                <p className="mt-1 whitespace-pre-line">{settings.pktnContact}</p>
              </div>
            ) : null}
          </section>
        </div>

        <div className="lg:col-span-7">
          <div className="card p-5 sm:p-8">
            <h2 className="mb-6 text-xl font-semibold">Kirim pesan</h2>
            <InquiryForm defaultType={defaultType} botFields={<BotFields issuedAt={issueFormToken()} />} />
          </div>
        </div>
      </div>
    </div>
  );
}
