import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomePageContent } from "@/components/homepage/HomePageContent";
import { getPreviewUser } from "@/lib/preview";

/**
 * Beranda untuk pratinjau admin. Di host admin, "/" dialihkan ke /admin, jadi iframe Live
 * Preview memuat alamat ini. Tanpa pratinjau yang sah: 404 biasa, tanpa pengalihan
 * otomatis ke mana pun (mencegah putaran pengalihan).
 */
export const metadata: Metadata = {
  title: "Pratinjau Beranda",
  robots: { index: false, follow: false },
};

export default async function PreviewHomePage() {
  if (!(await getPreviewUser())) notFound();
  return <HomePageContent />;
}
