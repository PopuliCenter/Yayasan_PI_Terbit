import type { Announcement } from "@/lib/appearance/resolve";
import { NavLink } from "./NavLink";

/**
 * Bilah pengumuman di atas header (ikut tergulir, header tetap sticky).
 * Warna memakai token status yang sudah lolos AA di kedua mode:
 * info di info-soft 8,0:1 / 9,0:1; warn di warn-soft 6,8:1 / 9,5:1.
 * Bukan live region: isinya statis dari server, tidak perlu diumumkan ulang.
 * Tautan lewat NavLink, sama dengan menu dan footer (termasuk "Buka di tab baru").
 */
export function SiteAnnouncement({ announcement }: { announcement: Announcement }) {
  const tone =
    announcement.tone === "important"
      ? "border-warn-line bg-warn-soft text-warn"
      : "border-info-line bg-info-soft text-info";
  const { link } = announcement;
  return (
    <aside aria-label="Pengumuman" className={`border-b ${tone}`}>
      <p className="page-container py-2.5 text-sm leading-snug">
        <span>{announcement.text}</span>
        {link ? (
          <>
            {" "}
            <NavLink link={link} className="font-semibold underline underline-offset-[3px]">
              {link.label}
            </NavLink>
          </>
        ) : null}
      </p>
    </aside>
  );
}
