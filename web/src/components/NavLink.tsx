import Link from "next/link";
import type { ReactNode } from "react";
import type { ResolvedLink } from "@/lib/links";

/** Tautan hasil resolveLink: internal lewat next/link, luar lewat <a> dengan rel aman. */
export function NavLink({ link, className, children }: { link: ResolvedLink; className?: string; children: ReactNode }) {
  if (!link.external) {
    return (
      <Link href={link.href} className={className} {...(link.newTab ? { target: "_blank" } : {})}>
        {children}
        {link.newTab ? <span className="sr-only"> (membuka tab baru)</span> : null}
      </Link>
    );
  }
  return (
    <a
      href={link.href}
      className={className}
      rel={link.newTab ? "noopener noreferrer" : "noopener"}
      {...(link.newTab ? { target: "_blank" } : {})}
    >
      {children}
      {link.newTab ? <span className="sr-only"> (membuka tab baru)</span> : null}
    </a>
  );
}
