import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

/**
 * Header keamanan statis. Sengaja di sini, bukan di nginx: `add_header` nginx tidak
 * diwarisi ke `location` yang punya `add_header` sendiri (gotcha di panduan deploy B.3).
 * Isinya tidak bergantung env, jadi aman dihitung saat build.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

const nextConfig: NextConfig = {
  // cacheComponents / partialPrefetching dimatikan: panel admin dan REST API Payload
  // butuh render dinamis, sementara kedua fitur itu mewajibkan setiap akses dinamis
  // dibungkus cache atau Suspense.
  //
  // Tailwind diproses lewat PostCSS (postcss.config.mjs), bukan loader Turbopack
  // untuk semua *.css, agar CSS panel admin Payload tidak ikut diproses Tailwind.
  //
  // standalone: image produksi hanya berisi server.js + dependensi yang ditelusuri.
  output: "standalone",
  poweredByHeader: false,
  // JANGAN memakai variabel NEXT_PUBLIC_*: nilainya ditanam saat build, padahal satu
  // image yang sama dipakai staging dan produksi. Semua konfigurasi dibaca saat runtime.
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
