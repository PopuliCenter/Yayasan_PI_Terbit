"use client";

import { useRowLabel } from "@payloadcms/ui";
import { ROUTES, type LinkInput } from "@/lib/links";

/** Label baris array menu/footer: "Katalog → /buku" alih-alih "Item menu 01". */
export const LinkRowLabel = () => {
  const { data, rowNumber } = useRowLabel<{ label?: string; visibility?: string; link?: LinkInput }>();
  const link = data?.link;
  const target =
    link?.type === "route" && link.route && Object.hasOwn(ROUTES, link.route)
      ? ROUTES[link.route as keyof typeof ROUTES].path
      : link?.type === "custom"
        ? link.url
        : link?.type === "page"
          ? "halaman statis"
          : "";
  const mobile = data?.visibility === "mobile" ? " (hanya HP)" : "";
  return (
    <span>
      {data?.label || `Tautan ${String((rowNumber ?? 0) + 1).padStart(2, "0")}`}
      {target ? ` → ${target}` : ""}
      {mobile}
    </span>
  );
};
