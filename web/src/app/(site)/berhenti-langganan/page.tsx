import type { Metadata } from "next";
import { UnsubscribeForm } from "@/components/forms/UnsubscribeForm";

export const metadata: Metadata = {
  title: "Berhenti berlangganan",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ token?: string }> };

/**
 * Konfirmasi dengan tombol, bukan otomatis saat tautan dibuka: pemindai tautan di
 * klien email sering membuka tautan sendiri dan bisa membatalkan langganan tanpa sengaja.
 */
export default async function UnsubscribePage({ searchParams }: Props) {
  const { token } = await searchParams;
  return (
    <div className="page-container py-20">
      <div className="card mx-auto max-w-lg p-6 sm:p-8">
        <h1 className="text-2xl font-semibold">Berhenti berlangganan kabar terbitan</h1>
        <p className="mt-3">Tekan tombol di bawah untuk berhenti menerima email kabar terbitan baru.</p>
        <UnsubscribeForm token={token ?? ""} />
      </div>
    </div>
  );
}
