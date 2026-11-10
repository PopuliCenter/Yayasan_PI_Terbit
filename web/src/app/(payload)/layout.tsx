/* Rute panel admin Payload. Mengikuti struktur bawaan Payload 3; jangan menambahkan konten situs di sini. */
import config from "@payload-config";
import "@payloadcms/next/css";
import type { ServerFunctionClient } from "payload";
import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts";
import { headers } from "next/headers";
import React from "react";
import { accessConfigFromEnv, verifyAccessJwt } from "@/lib/cf-access";
import { importMap } from "./admin/importMap.js";

type Args = {
  children: React.ReactNode;
};

const adminHost = (): string | null => {
  try {
    return new URL(process.env.ADMIN_BASE_URL ?? "").host.toLowerCase();
  } catch {
    return null;
  }
};

/**
 * Server function admin Payload (dipakai panel untuk form state, render field, dsb.).
 *
 * Gerbang nginx (404 /admin di apex, auth_request JWT di host admin) bekerja per path
 * dan host. Next.js bisa meneruskan POST Server Action yang membawa ID milik halaman lain
 * lewat fetch internal yang TIDAK melewati toko-proxy. Karena itu di produksi fungsi ini
 * memverifikasi ulang sendiri, gagal tertutup: host harus host admin DAN JWT Cloudflare
 * Access harus sah.
 */
const serverFunction: ServerFunctionClient = async function (args) {
  "use server";
  if (process.env.NODE_ENV === "production") {
    const h = await headers();
    const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").toLowerCase();
    const expected = adminHost();
    const access = await verifyAccessJwt(h.get("cf-access-jwt-assertion"), accessConfigFromEnv());
    if (!expected || host !== expected || !access.ok) {
      throw new Error("Tidak diizinkan");
    }
  }
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  });
};

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
);

export default Layout;
