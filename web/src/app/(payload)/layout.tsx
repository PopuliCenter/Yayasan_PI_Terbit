/* Rute panel admin Payload. Mengikuti struktur bawaan Payload 3; jangan menambahkan konten situs di sini. */
import config from "@payload-config";
import "@payloadcms/next/css";
import "./custom.css";
import type { ServerFunctionClient } from "payload";
import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts";
import { headers } from "next/headers";
import React from "react";
import { ALL_FONT_VARIABLE_CLASSES } from "@/app/fonts";
import { isAdminRequest } from "@/lib/admin-host";
import { importMap } from "./admin/importMap.js";

type Args = {
  children: React.ReactNode;
};

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
    // Huruf di-host sendiri oleh next/font (app/fonts.ts). Panel admin tetap Inter / Source Serif 4
    // (--font-body/--font-serif di custom.css); semua kelas variabel dipasang agar contoh huruf
    // di Tampilan Situs (ThemePreview) memakai huruf yang sebenarnya.
    htmlProps={{ className: ALL_FONT_VARIABLE_CLASSES }}
  >
    {children}
  </RootLayout>
);

export default Layout;
