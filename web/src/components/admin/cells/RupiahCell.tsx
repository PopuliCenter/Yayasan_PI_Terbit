"use client";

import type { DefaultCellComponentProps } from "payload";
import { formatRupiah } from "@/lib/format";

/** Sel daftar admin untuk harga: Rp85.000, rata kanan dengan angka tabular (lihat custom.css). */
export function RupiahCell({ cellData }: DefaultCellComponentProps) {
  if (typeof cellData === "number") return <span className="ypi-num">{formatRupiah(cellData)}</span>;
  return (
    <span className="ypi-muted" aria-label="kosong">
      —
    </span>
  );
}
