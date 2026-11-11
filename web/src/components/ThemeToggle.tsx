"use client";

import { useSyncExternalStore } from "react";
import { chooseTheme } from "@/lib/theme";
import { MoonIcon, SunIcon } from "./Icons";

const subscribe = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
};
const readIsDark = () => document.documentElement.getAttribute("data-theme") === "dark";

const toggleTheme = () => chooseTheme(readIsDark() ? "light" : "dark");

type Props = {
  /** "icon": tombol ikon di header; "row": baris berlabel di menu HP. */
  variant?: "icon" | "row";
};

/**
 * Tombol ganti mode. Ikon dan label dipilih lewat CSS (varian `dark:`), jadi tampilan
 * awal sudah benar sebelum React aktif; status aria-pressed menyusul setelah hidrasi.
 */
export function ThemeToggle({ variant = "icon" }: Props) {
  const isDark = useSyncExternalStore(subscribe, readIsDark, () => false);

  if (variant === "row") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-pressed={isDark}
        className="flex min-h-11 w-full items-center gap-3 rounded px-3 font-medium text-ink hover:bg-paper-2"
      >
        <MoonIcon />
        <span>Mode gelap</span>
        <span aria-hidden className="ml-auto text-sm text-muted">
          <span className="dark:hidden">Mati</span>
          <span className="hidden dark:inline">Nyala</span>
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={isDark}
      className="btn-ghost size-11 p-0"
      title="Mode gelap"
    >
      <span className="sr-only">Mode gelap</span>
      <MoonIcon className="dark:hidden" />
      <SunIcon className="hidden dark:block" />
    </button>
  );
}
