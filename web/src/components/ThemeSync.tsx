"use client";

import { useLayoutEffect } from "react";
import { applyTheme, readStoredTheme, resolveTheme, THEME_STORAGE_KEY } from "@/lib/theme";

/**
 * Penjaga tema saat halaman berjalan (skrip di <head> hanya memasang tema awal):
 * - memasang ulang data-theme bila atribut itu hilang, mis. saat React merender ulang
 *   layout di browser (halaman 404) dan skrip awal tidak ikut dijalankan;
 * - menyamakan warna bilah peramban (meta theme-color) dengan tema yang berlaku;
 * - mengikuti perubahan mode perangkat selama pengunjung belum memilih sendiri;
 * - mengikuti pilihan yang dibuat di tab lain (event storage).
 */
export function ThemeSync() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    applyTheme(resolveTheme());

    const ensure = () => {
      if (!root.hasAttribute("data-theme")) applyTheme(resolveTheme());
    };
    const observer = new MutationObserver(ensure);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = (event: MediaQueryListEvent) => {
      if (readStoredTheme() === null) applyTheme(event.matches ? "dark" : "light");
    };
    media.addEventListener("change", onSystemChange);

    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY || event.key === null) applyTheme(resolveTheme());
    };
    window.addEventListener("storage", onStorage);

    return () => {
      observer.disconnect();
      media.removeEventListener("change", onSystemChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return null;
}
