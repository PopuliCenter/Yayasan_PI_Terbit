import type { SVGProps } from "react";

/**
 * Tanda persegi YPI (huruf Y-P tanpa batang I), sama dengan favicon app/(site)/icon.svg.
 * Dipakai di tempat sempit seperti ikon panel admin. Selalu dekoratif.
 */
export function LogoMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 331 331" xmlns="http://www.w3.org/2000/svg" aria-hidden focusable="false" {...props}>
      <path fill="#FE6203" d="M7.3 95.2L33.2 95.2A36.3 36.3 0 0 1 60.5 107.5L108.9 162.6A1.2 1.2 0 0 1 108.9 164.1L86.4 189.6A1.2 1.2 0 0 1 84.6 189.6L5 100.4A3.1 3.1 0 0 1 7.3 95.2ZM81 252.8L81 218.2A48.9 48.9 0 0 1 94.2 184.9L166 107.8C185.7 86.6 209.3 73.5 245.4 73.5C309.3 73.5 326.7 114.7 326.7 141.9C326.7 176.9 297.7 208.2 258.5 208.2L187.1 208.2L187.1 254.2A3.3 3.3 0 0 1 183.9 257.4L150.5 257.4A3.1 3.1 0 0 1 147.3 254.3L147.3 215.5C147.3 188.6 170.6 164 195.9 164C213.4 164 240.4 175.8 258.3 175.8C278.4 175.8 293.6 160.9 293.6 142.1C293.6 129.7 287.1 106.7 252 106.7C236 106.7 214.8 111.5 194.6 132.6L132.3 197.7A42 42 0 0 0 120.6 226.8L120.6 248A9.4 9.4 0 0 1 111.2 257.4L85.7 257.4A4.6 4.6 0 0 1 81 252.8Z" />
    </svg>
  );
}
