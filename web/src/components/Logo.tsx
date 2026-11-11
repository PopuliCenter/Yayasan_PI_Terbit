import type { SVGProps } from "react";

/**
 * Logo sementara YPI (dibuat ulang sebagai vektor dari pilihan desain yayasan).
 * Huruf Y-P selalu oranye; batang "I" memakai currentColor sehingga mengikuti warna
 * teks (tinta di mode terang, krem di mode gelap). Ganti berkas ini saja bila logo
 * resmi sudah ditetapkan; favicon ada di app/(site)/icon.svg dan apple-icon.png.
 *
 * Dekoratif secara bawaan (aria-hidden): tautan pembungkusnya sudah memuat nama situs.
 */
export function Logo({ title, ...props }: SVGProps<SVGSVGElement> & { title?: string }) {
  const a11y = title ? { role: "img" as const, "aria-label": title } : { "aria-hidden": true as const };
  return (
    <svg viewBox="0 0 380 188" fill="none" xmlns="http://www.w3.org/2000/svg" {...a11y} {...props}>
      <path
        fill="#FE6203"
        d="M5.1 23.7L31 23.7A36.3 36.3 0 0 1 58.3 36L106.7 91.1A1.2 1.2 0 0 1 106.7 92.6L84.2 118.1A1.2 1.2 0 0 1 82.4 118.1L2.8 28.9A3.1 3.1 0 0 1 5.1 23.7ZM78.8 181.3L78.8 146.7A48.9 48.9 0 0 1 92 113.4L163.8 36.3C183.5 15.1 207.1 2 243.2 2C307.1 2 324.5 43.2 324.5 70.4C324.5 105.4 295.5 136.7 256.3 136.7L184.9 136.7L184.9 182.7A3.3 3.3 0 0 1 181.7 185.9L148.3 185.9A3.1 3.1 0 0 1 145.1 182.8L145.1 144C145.1 117.1 168.4 92.5 193.7 92.5C211.2 92.5 238.2 104.3 256.1 104.3C276.2 104.3 291.4 89.4 291.4 70.6C291.4 58.2 284.9 35.2 249.8 35.2C233.8 35.2 212.6 40 192.4 61.1L130.1 126.2A42 42 0 0 0 118.4 155.3L118.4 176.5A9.4 9.4 0 0 1 109 185.9L83.5 185.9A4.6 4.6 0 0 1 78.8 181.3Z"
      />
      <rect fill="currentColor" x="337.6" y="22.1" width="40.4" height="163.8" rx="4.5" />
    </svg>
  );
}
