/* Rute panel admin Payload. Mengikuti struktur bawaan Payload 3; jangan menambahkan konten situs di sini. */
import config from "@payload-config";
import "@payloadcms/next/css";
import "./custom.css";
import type { ServerFunctionClient } from "payload";
import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts";
import { Inter, Source_Serif_4 } from "next/font/google";
import { headers } from "next/headers";
import React from "react";
import { isAdminRequest } from "@/lib/admin-host";
import { importMap } from "./admin/importMap.js";

type Args = {
  children: React.ReactNode;
};

// Huruf yang sama dengan situs (di-host sendiri oleh next/font), dipetakan ke --font-body/--font-serif di custom.css.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-source-serif", display: "swap" });

/**
 * Server function admin Payload (dipakai panel untuk form state, render field, dsb.).
 *
 * Gerbang nginx (404 /admin di apex, auth_request JWT di host admin) bekerja per path
 * dan host. Next.js bisa meneruskan POST Server Action yang membawa ID milik halaman lain
 * lewat fetch internal yang TIDAK melewati toko-proxy. Karena itu di produksi fungsi ini
 * memverifikasi ulang sendiri, gagal tertutup: host harus host admin DAN JWT Cloudflare
 * Access harus sah (lib/admin-host.ts, dipakai bersama endpoint laporan dan pratinjau).
 */
const serverFunction: ServerFunctionClient = async function (args) {
  "use server";
  if (!(await isAdminRequest(await headers()))) {
    throw new Error("Tidak diizinkan");
  }
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  });
};

const Layout = ({ children }: Args) => (
  <RootLayout
    config={config}
    importMap={importMap}
    serverFunction={serverFunction}
    htmlProps={{ className: `${inter.variable} ${serif.variable}` }}
  >
    {children}
  </RootLayout>
);

export default Layout;
