import {
  APIError,
  type ArrayFieldValidation,
  type DateFieldValidation,
  type GlobalBeforeOperationHook,
  type GlobalConfig,
  type PayloadRequest,
  type TextFieldSingleValidation,
} from "payload";
import { array, date as dateValidation, text } from "payload/shared";
import { fieldIsSuperAdmin, isKatalog, isSuperAdmin, publishedOrAdmin } from "../access";
import { linkGroup } from "../fields/link";
import { auditGlobalAfterChange } from "../hooks/audit";
import { formatRatio } from "../lib/appearance/color";
import {
  DEFAULT_FOOTER_INFO_TITLE,
  DEFAULT_FOOTER_LINKS,
  DEFAULT_HEADER_NAV,
  MAX_DESKTOP_NAV,
  MAX_DESKTOP_NAV_CHARS,
} from "../lib/appearance/defaults";
import { PRESETS } from "../lib/appearance/presets";
import { checkAccent } from "../lib/appearance/theme";
import { linkTargetsPath, type LinkInput } from "../lib/links";

type ThemeSibling = { customAccent?: boolean };

/** Validasi kontras di server (form-state admin saat mengetik DAN saat simpan/terbit). */
const accentValidator =
  (mode: "light" | "dark", optional: boolean): TextFieldSingleValidation =>
  (value, { siblingData }) => {
    if (!(siblingData as ThemeSibling)?.customAccent) return true;
    if (optional && (value === null || value === undefined || value === "")) return true;
    const r = checkAccent(value, mode);
    if (r.ok) return true;
    if (r.reason === "format") return "Tulis kode warna 6 digit, contoh #b34a0f.";
    const where = mode === "light" ? "latar terang (kertas, kartu)" : "latar gelap";
    const how = mode === "light" ? "lebih gelap" : "lebih terang";
    return `Kontras ${formatRatio(r.ratio)}:1 terhadap ${where} terlalu rendah; minimal 4,5:1 agar teks tetap terbaca. Coba ${r.suggestion}, warna yang sama tetapi ${how}.`;
  };

type NavRow = { label?: string; link?: LinkInput; visibility?: string };

const TENTANG_REQUIRED =
  'Menu "Tentang Kami" (/tentang) wajib ada dan tampil di semua layar: halaman ini dicek verifikator ISBN.';

/** ID halaman dari tautan "Halaman statis": angka saat validasi (depth 0), objek bila sudah di-populate. */
const pageIdOf = (link: LinkInput): number | null => {
  if (link?.type !== "page") return null;
  const page: unknown = link.page;
  if (typeof page === "number") return page;
  if (typeof page === "string" && /^\d+$/.test(page)) return Number(page);
  if (page && typeof page === "object" && typeof (page as { id?: unknown }).id === "number") return (page as { id: number }).id;
  return null;
};

/**
 * Status halaman ber-slug "tentang" yang dipilih lewat "Halaman statis". Saat validasi relasi
 * hanya berisi ID, jadi linkTargetsPath tidak bisa membaca slug-nya. Baris utama koleksi pages
 * hanya berubah saat tayang (draf disimpan di tabel versi), jadi slug dan _status di sini adalah
 * milik versi tayang, sama dengan yang dipakai resolveLink di situs.
 */
const tentangPageStatus = async (rows: NavRow[], req: PayloadRequest): Promise<"published" | "draft" | null> => {
  const ids = [...new Set(rows.map((r) => pageIdOf(r?.link)).filter((id): id is number => id !== null))];
  if (!ids.length) return null;
  const res = await req.payload.find({
    collection: "pages",
    where: { and: [{ id: { in: ids } }, { slug: { equals: "tentang" } }] },
    select: { _status: true },
    depth: 0,
    limit: ids.length,
    overrideAccess: true,
    req,
  });
  if (!res.docs.length) return null;
  return res.docs.some((d) => d._status === "published") ? "published" : "draft";
};

const validateHeaderNav: ArrayFieldValidation = async (value, options) => {
  const base = await array(value, options);
  if (base !== true) return base;
  const rows = (Array.isArray(value) ? value : []) as NavRow[];
  const desktop = rows.filter((r) => r?.visibility !== "mobile");
  if (desktop.length > MAX_DESKTOP_NAV) {
    return `Menu layar lebar maksimal ${MAX_DESKTOP_NAV} item agar header tetap satu baris. Tandai sisanya "Hanya menu HP".`;
  }
  // Lebar lg (1024 px) menyisakan ~48 huruf text-sm untuk menu (bawaan sekarang: 41).
  const chars = desktop.reduce((n, r) => n + (r?.label?.trim().length ?? 0), 0);
  if (chars > MAX_DESKTOP_NAV_CHARS) {
    return `Teks menu layar lebar terlalu panjang (${chars} huruf, maksimal ${MAX_DESKTOP_NAV_CHARS}). Persingkat teks atau tandai sebagian "Hanya menu HP".`;
  }
  // Identitas penerbit harus terjangkau dari header (verifikasi ISBN Perpusnas No. 11/2025).
  if (desktop.some((r) => linkTargetsPath(r?.link, "/tentang"))) return true;
  // Tautan "Halaman statis" ke halaman ber-slug tentang juga sah, asalkan halamannya sudah tayang
  // (halaman draf dibuang resolveLink, jadi menunya tidak akan tampil).
  const status = options.req?.payload ? await tentangPageStatus(desktop, options.req) : null;
  if (status === "published") return true;
  if (status === "draft") {
    return 'Halaman statis "Tentang Kami" yang dipilih belum tayang. Tayangkan halaman itu dulu, atau pilih Halaman situs → Tentang Kami (/tentang).';
  }
  return TENTANG_REQUIRED;
};

const announcementText: TextFieldSingleValidation = (value, options) => {
  const enabled = (options.siblingData as { enabled?: boolean })?.enabled;
  if (enabled && !(typeof value === "string" && value.trim())) return "Tulis isi pengumuman, atau matikan pengumuman.";
  return text(value, options);
};

const endsAfterStart: DateFieldValidation = (value, options) => {
  const start = (options.siblingData as { startsAt?: string | null })?.startsAt;
  if (value && start && new Date(value).getTime() <= new Date(start).getTime()) {
    return "Waktu berhenti harus setelah waktu mulai.";
  }
  return dateValidation(value, options);
};

const DATE_ADMIN = { pickerAppearance: "dayAndTime", displayFormat: "d MMM yyyy HH.mm" } as const;

type StoredTheme = { preset?: unknown; customAccent?: unknown; accentLight?: unknown; accentDark?: unknown };

/** Kunci pembanding grup `theme` yang tersimpan. Penulisan hex beda huruf/spasi dianggap sama. */
const themeKey = (doc: unknown): string => {
  const t = (doc as { theme?: StoredTheme | null } | null | undefined)?.theme;
  const hex = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().toLowerCase() : null);
  return JSON.stringify([
    typeof t?.preset === "string" ? t.preset : null,
    t?.customAccent === true,
    hex(t?.accentLight),
    hex(t?.accentDark),
  ]);
};

/**
 * "Pulihkan versi" menulis versi lama apa adanya ke DB tanpa menjalankan access level field
 * (payload/dist/globals/operations/restoreVersion.js), sehingga `theme.access.update` tidak
 * berlaku di sana. Selain super admin, pemulihan hanya diizinkan bila warnanya sama persis dengan
 * versi terbaru. Jadi admin katalog tetap bisa memulihkan menu, footer, dan pengumuman, tetapi
 * tidak bisa mengganti warna situs lewat riwayat versi.
 */
const guardThemeOnRestore: GlobalBeforeOperationHook = async ({ args, global, operation, overrideAccess, req }) => {
  if (operation !== "restoreVersion" || overrideAccess === true) return args;
  if ((await isSuperAdmin({ req })) === true) return args;
  // Tanpa hak ubah sama sekali: Payload sendiri menolak (readVersions/update) setelah hook ini.
  if ((await isKatalog({ req })) !== true) return args;
  const id = (args as { id?: unknown } | undefined)?.id;
  if (typeof id !== "string" && typeof id !== "number") return args;
  const target = await req.payload.findGlobalVersionByID({
    slug: global.slug,
    id,
    depth: 0,
    disableErrors: true,
    overrideAccess: true,
    req,
  });
  if (!target) return args; // Versi tidak ada: Payload sendiri yang melempar NotFound.
  const current = await req.payload.findGlobal({ slug: global.slug, depth: 0, draft: true, overrideAccess: true, req });
  if (themeKey(target.version) !== themeKey(current)) {
    throw new APIError(
      "Versi ini memakai warna situs yang berbeda dari versi terbaru. Hanya super admin yang dapat memulihkannya.",
      403,
      null,
      true,
    );
  }
  return args;
};

export const Appearance: GlobalConfig = {
  slug: "appearance",
  label: "Tampilan Situs",
  admin: {
    group: "Tampilan situs",
    description:
      "Warna, menu atas, footer, dan pengumuman situs. Perubahan tersimpan sebagai draf; pengunjung melihatnya setelah Anda menekan Tayangkan.",
    hideAPIURL: true,
    // Admin order tidak mengurus tampilan; global disembunyikan dari menunya.
    hidden: ({ user }) => (user as { role?: string } | null)?.role === "admin-order",
    livePreview: {
      // Sengaja tanpa `url`: alamat pratinjau (/pratinjau/mulai?global=appearance) diberikan
      // config akar (payload.config.ts) dan digabung oleh Payload. Di sini hanya ukuran layar.
      breakpoints: [
        { label: "HP", name: "hp", width: 375, height: 812 },
        { label: "Tablet", name: "tablet", width: 768, height: 1024 },
        { label: "Desktop", name: "desktop", width: 1280, height: 800 },
      ],
    },
  },
  access: {
    // Publik hanya versi yang sudah tayang; draf hanya untuk admin yang masuk (pratinjau).
    read: publishedOrAdmin,
    readVersions: isKatalog,
    update: isKatalog,
  },
  versions: {
    max: 30,
    // Draf ikut divalidasi: warna yang tidak lolos kontras tidak bisa tersimpan sama sekali.
    // Tanpa autosave: perubahan hanya tersimpan saat admin menekan Simpan draf / Tayangkan.
    drafts: { validate: true },
  },
  hooks: { beforeOperation: [guardThemeOnRestore], afterChange: [auditGlobalAfterChange] },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Warna",
          description:
            "Palet di sini sudah diuji keterbacaannya di mode terang dan gelap. Hanya super admin yang dapat mengubah warna.",
          fields: [
            {
              name: "theme",
              type: "group",
              label: false,
              access: { update: fieldIsSuperAdmin },
              fields: [
                {
                  name: "preset",
                  type: "radio",
                  label: "Palet warna",
                  required: true,
                  defaultValue: "navy",
                  options: Object.entries(PRESETS).map(([value, p]) => ({ value, label: p.label })),
                  admin: { components: { Field: "@/components/admin/PresetPicker#PresetPicker" } },
                },
                {
                  name: "customAccent",
                  type: "checkbox",
                  label: "Pakai warna aksen sendiri",
                  defaultValue: false,
                  admin: {
                    description:
                      "Aksen dipakai untuk penanda wajib isi, lencana, garis fokus keyboard, dan sorotan teks. Warna tautan tetap mengikuti palet.",
                  },
                },
                {
                  type: "row",
                  fields: [
                    {
                      name: "accentLight",
                      type: "text",
                      label: "Aksen untuk mode terang",
                      admin: {
                        condition: (_, s) => Boolean((s as ThemeSibling)?.customAccent),
                        components: { Field: "@/components/admin/ColorField#ColorField" },
                        description: "Harus kontras minimal 4,5:1 terhadap kertas dan kartu.",
                      },
                      validate: accentValidator("light", false),
                    },
                    {
                      name: "accentDark",
                      type: "text",
                      label: "Aksen untuk mode gelap (opsional)",
                      admin: {
                        condition: (_, s) => Boolean((s as ThemeSibling)?.customAccent),
                        components: { Field: "@/components/admin/ColorField#ColorField" },
                        description: "Kosongkan agar dihitung otomatis dari warna mode terang.",
                      },
                      validate: accentValidator("dark", true),
                    },
                  ],
                },
                {
                  name: "themePreview",
                  type: "ui",
                  admin: { components: { Field: "@/components/admin/ThemePreview#ThemePreview" } },
                },
              ],
            },
          ],
        },
        {
          label: "Menu atas",
          fields: [
            {
              name: "headerNav",
              type: "array",
              label: "Menu utama",
              labels: { singular: "Item menu", plural: "Item menu" },
              minRows: 1,
              maxRows: 8,
              defaultValue: DEFAULT_HEADER_NAV,
              validate: validateHeaderNav,
              admin: {
                initCollapsed: true,
                description: `Seret untuk mengubah urutan. Layar lebar menampilkan paling banyak ${MAX_DESKTOP_NAV} item; "Hanya menu HP" tampil di menu lipat saja.`,
                components: { RowLabel: "@/components/admin/LinkRowLabel#LinkRowLabel" },
              },
              fields: [
                {
                  type: "row",
                  fields: [
                    { name: "label", type: "text", label: "Teks menu", required: true, maxLength: 20 },
                    {
                      name: "visibility",
                      type: "select",
                      label: "Tampil di",
                      required: true,
                      defaultValue: "all",
                      options: [
                        { label: "Semua layar", value: "all" },
                        { label: "Hanya menu HP", value: "mobile" },
                      ],
                    },
                  ],
                },
                linkGroup(),
              ],
            },
            {
              name: "showWhatsAppButton",
              type: "checkbox",
              label: 'Tampilkan tombol "Tanya via WA" di header',
              defaultValue: true,
              admin: { description: "Tombol hanya muncul bila nomor WhatsApp diisi di Pengaturan Situs." },
            },
          ],
        },
        {
          label: "Footer",
          description:
            "Identitas penerbit, layanan pembaca, dan tautan Kontak & pengaduan selalu tampil (wajib) dan diambil dari Pengaturan Situs.",
          fields: [
            {
              name: "footerInfoTitle",
              type: "text",
              label: "Judul kolom tautan",
              defaultValue: DEFAULT_FOOTER_INFO_TITLE,
              maxLength: 40,
              admin: {
                description: 'Kolom ini berisi halaman yang dicentang "Tampilkan di footer", lalu tautan tambahan di bawah.',
              },
            },
            {
              name: "footerLinks",
              type: "array",
              label: "Tautan tambahan",
              labels: { singular: "Tautan", plural: "Tautan" },
              maxRows: 8,
              defaultValue: DEFAULT_FOOTER_LINKS,
              admin: { initCollapsed: true, components: { RowLabel: "@/components/admin/LinkRowLabel#LinkRowLabel" } },
              fields: [{ name: "label", type: "text", label: "Teks tautan", required: true, maxLength: 40 }, linkGroup()],
            },
            {
              name: "footerNote",
              type: "textarea",
              label: "Catatan kaki",
              maxLength: 280,
              admin: { description: 'Teks biasa satu-dua kalimat di baris paling bawah, mis. "Harga dapat berubah sewaktu-waktu."' },
            },
            {
              type: "row",
              fields: [
                { name: "showNewsletter", type: "checkbox", label: "Tampilkan formulir kabar terbitan", defaultValue: true },
                {
                  name: "showSocialLinks",
                  type: "checkbox",
                  label: "Tampilkan media sosial",
                  defaultValue: true,
                  admin: { description: "Daftar akun diatur di Pengaturan Situs, tab Marketplace & media sosial." },
                },
              ],
            },
          ],
        },
        {
          label: "Pengumuman",
          description: "Bilah tipis di atas header pada semua halaman. Bukan untuk isi beranda.",
          fields: [
            {
              name: "announcement",
              type: "group",
              label: false,
              fields: [
                { name: "enabled", type: "checkbox", label: "Tampilkan pengumuman", defaultValue: false },
                { name: "text", type: "text", label: "Isi pengumuman", maxLength: 160, validate: announcementText },
                {
                  name: "tone",
                  type: "radio",
                  label: "Nada",
                  defaultValue: "info",
                  admin: { layout: "horizontal" },
                  options: [
                    { label: "Biasa (biru)", value: "info" },
                    { label: "Penting (cokelat kekuningan)", value: "important" },
                  ],
                },
                {
                  type: "row",
                  fields: [
                    {
                      name: "startsAt",
                      type: "date",
                      label: "Mulai tampil",
                      admin: { date: DATE_ADMIN, description: "Kosongkan agar langsung tampil." },
                    },
                    {
                      name: "endsAt",
                      type: "date",
                      label: "Berhenti tampil",
                      admin: { date: DATE_ADMIN, description: "Kosongkan agar tampil terus." },
                      validate: endsAfterStart,
                    },
                  ],
                },
                { name: "linkLabel", type: "text", label: "Teks tautan", defaultValue: "Selengkapnya", maxLength: 30 },
                linkGroup({ optional: true, label: "Tautan (opsional)" }),
              ],
            },
          ],
        },
      ],
    },
  ],
};
