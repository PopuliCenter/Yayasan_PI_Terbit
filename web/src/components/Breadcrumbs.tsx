import Link from "next/link";
import { getHomeHref } from "@/lib/preview";
import { absoluteUrl } from "@/lib/site";
import { JsonLd } from "./JsonLd";

export type Crumb = { label: string; href?: string };

/** Remah roti + JSON-LD. "Beranda" menuju /pratinjau/beranda bila admin sedang mempratinjau. */
export async function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ label: "Beranda", href: await getHomeHref() }, ...items];
  return (
    <>
      <nav aria-label="Remah roti" className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          {all.map((item, i) => {
            const last = i === all.length - 1;
            return (
              <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
                {item.href && !last ? (
                  <Link href={item.href} className="hover:text-ink hover:underline">
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current={last ? "page" : undefined} className={last ? "text-ink" : undefined}>
                    {item.label}
                  </span>
                )}
                {!last ? <span aria-hidden>/</span> : null}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((item, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: item.label,
            ...(item.href ? { item: absoluteUrl(item.href) } : {}),
          })),
        }}
      />
    </>
  );
}
