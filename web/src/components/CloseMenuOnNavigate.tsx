"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Ditaruh di dalam <details> menu HP. Header tidak dimuat ulang saat navigasi klien,
 * jadi menu akan tetap terbuka menutupi halaman baru; komponen ini menutupnya saat
 * sebuah tautan di dalam menu diklik dan setiap kali alamat halaman berubah.
 */
export function CloseMenuOnNavigate() {
  const ref = useRef<HTMLSpanElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const details = ref.current?.closest("details");
    if (!details) return;
    const onClick = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest("a")) details.open = false;
    };
    details.addEventListener("click", onClick);
    return () => details.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    const details = ref.current?.closest("details");
    if (details) details.open = false;
  }, [pathname]);

  return <span ref={ref} hidden />;
}
