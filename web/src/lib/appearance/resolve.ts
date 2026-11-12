/**
 * Global Tampilan (data mentah, boleh kosong/rusak) -> nilai siap render.
 * Murni dan tidak pernah melempar, supaya situs produksi tidak pernah kosong:
 * setiap bagian yang tidak sah jatuh ke isi bawaan (defaults.ts), yang sama dengan
 * tampilan sebelum fitur ini ada.
 */
import { resolveLink, type LinkInput, type ResolvedLink } from "../links";
import { DEFAULT_FOOTER_INFO_TITLE, DEFAULT_FOOTER_LINKS, DEFAULT_HEADER_NAV, MAX_DESKTOP_NAV } from "./defaults";
import { resolveTheme, type ResolvedTheme, type ThemeInput } from "./theme";

export type NavItem = ResolvedLink & { label: string; mobileOnly: boolean };
export type FooterLink = ResolvedLink & { label: string };
export type Announcement = {
  text: string;
  tone: "info" | "important";
  link: (ResolvedLink & { label: string }) | null;
};

export type ResolvedAppearance = {
  theme: ResolvedTheme;
  headerNav: NavItem[];
  showWhatsAppButton: boolean;
  footer: {
    infoTitle: string;
    links: FooterLink[];
    note: string | null;
    showNewsletter: boolean;
    showSocialLinks: boolean;
  };
  /** null bila mati, kosong, atau di luar rentang tanggal pada `now`. */
  announcement: Announcement | null;
};

/** Bentuk longgar data global (sebelum payload-types diperbarui, dan untuk data Live Preview). */
export type AppearanceInput = {
  theme?: ThemeInput;
  headerNav?: { label?: string | null; visibility?: string | null; link?: LinkInput }[] | null;
  showWhatsAppButton?: boolean | null;
  footerInfoTitle?: string | null;
  footerLinks?: { label?: string | null; link?: LinkInput }[] | null;
  footerNote?: string | null;
  showNewsletter?: boolean | null;
  showSocialLinks?: boolean | null;
  announcement?: {
    enabled?: boolean | null;
    text?: string | null;
    tone?: string | null;
    startsAt?: string | null;
    endsAt?: string | null;
    linkLabel?: string | null;
    link?: LinkInput;
  } | null;
} | null | undefined;

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/**
 * resolveLink berasumsi bentuk datanya benar (mis. `url` berupa teks). Data rusak dari Live
 * Preview, impor, atau pemanggil lain dibuang di sini agar satu baris tidak menjatuhkan layout.
 */
const safeLink = (link: unknown): ResolvedLink | null => {
  try {
    return resolveLink(link as LinkInput);
  } catch {
    return null;
  }
};

type NavRows = NonNullable<NonNullable<AppearanceInput>["headerNav"]>;
type FooterRows = NonNullable<NonNullable<AppearanceInput>["footerLinks"]>;

const resolveNav = (rows: NavRows | null | undefined): NavItem[] => {
  const items: NavItem[] = [];
  // Data rusak (bukan array) diperlakukan kosong: resolver tidak boleh melempar.
  for (const row of Array.isArray(rows) ? rows : []) {
    const label = clean(row?.label, 24);
    const link = safeLink(row?.link);
    if (label && link) items.push({ ...link, label, mobileOnly: row?.visibility === "mobile" });
  }
  return items;
};

const resolveFooterLinks = (rows: FooterRows): FooterLink[] => {
  const links: FooterLink[] = [];
  for (const row of rows) {
    const label = clean(row?.label, 40);
    const link = safeLink(row?.link);
    if (label && link) links.push({ ...link, label });
  }
  return links;
};

/** Menu header bawaan (= header sebelum fitur ini). Juga nilai bawaan prop `nav` SiteHeader. */
export const DEFAULT_NAV: NavItem[] = resolveNav(DEFAULT_HEADER_NAV);

/** Footer bawaan (= footer sebelum fitur ini). Juga nilai bawaan prop `footer` SiteFooter. */
export const DEFAULT_FOOTER: ResolvedAppearance["footer"] = {
  infoTitle: DEFAULT_FOOTER_INFO_TITLE,
  links: resolveFooterLinks(DEFAULT_FOOTER_LINKS),
  note: null,
  showNewsletter: true,
  showSocialLinks: true,
};

const inWindow = (now: Date, start?: string | null, end?: string | null) => {
  const t = now.getTime();
  const s = start ? Date.parse(start) : NaN;
  const e = end ? Date.parse(end) : NaN;
  if (!Number.isNaN(s) && t < s) return false;
  if (!Number.isNaN(e) && t >= e) return false;
  return true;
};

export const resolveAppearance = (raw: AppearanceInput, now: Date): ResolvedAppearance => {
  let headerNav = resolveNav(raw?.headerNav);
  // Cadangan: tanpa item layar lebar (mis. semua halaman relasinya belum terbit) -> menu bawaan.
  if (!headerNav.some((i) => !i.mobileOnly)) headerNav = DEFAULT_NAV;
  // Jaga batas tata letak walau data lama/impor melewati validasi.
  let desktop = 0;
  headerNav = headerNav.filter((i) => i.mobileOnly || ++desktop <= MAX_DESKTOP_NAV);

  // Array kosong = admin sengaja menghapus semua tautan tambahan; kosong/rusak = isi bawaan.
  const rawFooterLinks = raw?.footerLinks;
  const footerLinks = resolveFooterLinks(Array.isArray(rawFooterLinks) ? rawFooterLinks : DEFAULT_FOOTER_LINKS);

  const a = raw?.announcement;
  const text = clean(a?.text, 160);
  let announcement: Announcement | null = null;
  if (a?.enabled && text && inWindow(now, a.startsAt, a.endsAt)) {
    const link = a.link?.type && a.link.type !== "none" ? safeLink(a.link) : null;
    announcement = {
      text,
      tone: a.tone === "important" ? "important" : "info",
      link: link ? { ...link, label: clean(a.linkLabel, 30) || "Selengkapnya" } : null,
    };
  }

  return {
    theme: resolveTheme(raw?.theme),
    headerNav,
    showWhatsAppButton: raw?.showWhatsAppButton !== false,
    footer: {
      infoTitle: clean(raw?.footerInfoTitle, 40) || DEFAULT_FOOTER_INFO_TITLE,
      links: footerLinks,
      note: clean(raw?.footerNote, 280) || null,
      showNewsletter: raw?.showNewsletter !== false,
      showSocialLinks: raw?.showSocialLinks !== false,
    },
    announcement,
  };
};
