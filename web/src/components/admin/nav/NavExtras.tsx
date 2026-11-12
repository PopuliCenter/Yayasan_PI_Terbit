import Link from "next/link";
import type { ServerProps } from "payload";
import { formatAdminURL } from "payload/shared";
import { LogoMark } from "@/components/LogoMark";
import { SITE_URL } from "@/lib/site";

/**
 * Tambahan di atas menu navigasi admin (admin.components.beforeNavLinks):
 * baris merek, tautan Laporan per judul, dan tautan ke situs publik.
 */
export function NavExtras({ payload, params }: ServerProps) {
  const reportsHref = formatAdminURL({ adminRoute: payload.config.routes.admin, path: "/laporan" });
  const segments = params?.segments;
  const active = Array.isArray(segments) ? segments[0] === "laporan" : segments === "laporan";

  return (
    <div className="ypi-nav-extras">
      <p className="ypi-nav-extras__brand">
        <LogoMark width={20} height={20} />
        <span>Yayasan Populi Indonesia</span>
      </p>
      <Link href={reportsHref} className="nav__link" aria-current={active ? "page" : undefined}>
        {active ? <span className="nav__link-indicator" /> : null}
        <span className="nav__link-label">Laporan per judul</span>
      </Link>
      <a href={SITE_URL} target="_blank" rel="noopener noreferrer" className="nav__link">
        <span className="nav__link-label">
          Lihat situs ↗<span className="sr-only"> (tab baru)</span>
        </span>
      </a>
    </div>
  );
}
