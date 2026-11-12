"use client";

import { useRowLabel } from "@payloadcms/ui";
import { BLOCK_LABELS } from "@/globals/homepage/defaults";

const isKind = (v: unknown): v is keyof typeof BLOCK_LABELS =>
  typeof v === "string" && Object.hasOwn(BLOCK_LABELS, v);

const kindOf = (blockType: unknown): string => (isKind(blockType) ? BLOCK_LABELS[blockType] : "Bagian");

/** Label baris bagian Beranda, mis. "03 · Pilihan buku — Rekomendasi Ramadan (disembunyikan)". */
export const HomeBlockLabel = () => {
  const { data, rowNumber } = useRowLabel<{ blockType?: string; heading?: string | null; hideSection?: boolean | null }>();
  const heading = typeof data?.heading === "string" ? data.heading.trim() : "";
  return (
    <span>
      {String((rowNumber ?? 0) + 1).padStart(2, "0")} · {kindOf(data?.blockType)}
      {heading ? ` — ${heading}` : ""}
      {data?.hideSection ? " (disembunyikan)" : ""}
    </span>
  );
};
