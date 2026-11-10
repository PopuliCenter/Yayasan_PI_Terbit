import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BotFields } from "@/components/forms/BotFields";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { issueFormToken } from "@/lib/antibot";
import { getBookBySlug, getSettings } from "@/lib/data";

export const metadata: Metadata = {
  title: "Pembelian untuk institusi",
  description:
    "Penawaran harga pembelian jumlah besar untuk perpustakaan, kampus, sekolah, dan lembaga. Kuitansi atas nama lembaga tersedia.",
  alternates: { canonical: "/institusi" },
};

type Props = { searchParams: Promise<{ buku?: string }> };

/** Formulir permintaan penawaran (F-FRM-01). Bisa diprefill dari halaman buku lewat ?buku=slug. */
export default async function InstitutionPage({ searchParams }: Props) {
  const { buku } = await searchParams;
  const [settings, book] = await Promise.all([getSettings(), buku ? getBookBySlug(buku) : Promise.resolve(null)]);

  return (
    <div className="page-container py-10">
      <Breadcrumbs items={[{ label: "Pembelian institusi" }]} />

      <div className="mt-6 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="eyebrow">Untuk institusi</p>
          <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">Minta penawaran pembelian jumlah besar</h1>
          <p className="mt-4 text-lg">
            Untuk perpustakaan, kampus, sekolah, dan lembaga yang membutuhkan banyak eksemplar atau dokumen pengadaan.
          </p>

          <h2 className="mt-10 font-sans text-base font-semibold">Yang kami kirimkan</h2>
          <ul className="mt-3 space-y-2 text-[0.95rem]">
            <li className="flex gap-2">
              <span aria-hidden className="text-accent-700">—</span> Penawaran harga per judul dan total, termasuk ongkir.
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="text-accent-700">—</span> Kuitansi atas nama lembaga setelah pembayaran.
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="text-accent-700">—</span> Perkiraan waktu kirim untuk setiap judul.
            </li>
          </ul>

          <div className="mt-8 rounded-lg border border-line bg-paper-2 p-5 text-sm">
            <p>
              Kami menanggapi <strong>maksimal 2 hari kerja</strong>
              {settings.serviceHours ? <> pada jam layanan ({settings.serviceHours})</> : null}.
            </p>
            {settings.email ? (
              <p className="mt-2">
                Lebih suka email? Kirim ke{" "}
                <a href={`mailto:${settings.email}`} className="link">
                  {settings.email}
                </a>
                .
              </p>
            ) : null}
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="card p-5 sm:p-8">
            <InquiryForm
              fixedType="institusi"
              defaultItems={book ? `${book.title}${book.isbn13 ? ` (ISBN ${book.isbn13})` : ""} — ... eksemplar` : undefined}
              botFields={<BotFields issuedAt={issueFormToken()} />}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
