import type { MetadataRoute } from "next";
import { absoluteUrl, SITE_INDEXABLE } from "@/lib/site";

// Dibaca per permintaan: image yang sama dipakai staging (noindex) dan produksi.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  // Situs pratinjau/staging tidak boleh diindeks.
  const isProduction = SITE_INDEXABLE;
  return {
    rules: isProduction
      ? [
          {
            userAgent: "*",
            // Sampul di /api/media/file/ harus bisa dirayapi (gambar OG, data terstruktur, Google Images).
            allow: ["/", "/api/media/file/"],
            disallow: ["/admin", "/api/", "/klik", "/internal/", "/berhenti-langganan"],
          },
        ]
      : [{ userAgent: "*", disallow: "/" }],
    sitemap: isProduction ? absoluteUrl("/sitemap.xml") : undefined,
  };
}
