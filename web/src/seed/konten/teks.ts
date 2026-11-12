/**
 * Naskah halaman dalam bentuk sederhana → dokumen Lexical (format yang disimpan Payload).
 *
 * Simpul: judul bagian (h2/h3), paragraf, daftar butir/bernomor, dan penanda tempat
 * formulir. Teks boleh memuat tautan [label](/alamat) dan **tebal**; tautan dibatasi ke
 * alamat yang dikenal agar naskah tidak menautkan halaman yang tidak ada.
 * Murni (tanpa impor payload) agar bisa diuji tanpa basis data.
 */
import { randomBytes } from "node:crypto";

export type Simpul =
  | { t: "h2" | "h3" | "p"; text: string }
  | { t: "ul" | "ol"; items: string[] }
  | { t: "form" };

/** Alamat internal yang boleh ditautkan dari naskah. */
export const TAUTAN_INTERNAL = new Set([
  "/cara-pesan",
  "/pengiriman",
  "/pengembalian",
  "/kebijakan-privasi",
  "/syarat-ketentuan",
  "/kontak",
  "/kontak?jenis=pengaduan",
  "/tentang",
  "/buku",
  "/institusi",
  "/kirim-naskah",
]);

/** Tautan luar yang boleh dipakai (dibuka di tab baru). */
export const TAUTAN_LUAR = new Set(["https://ditjenpktn.kemendag.go.id"]);

type Node = { type: string; version: number; [k: string]: unknown };

const FORMAT_TEBAL = 1;

const teks = (value: string, format = 0): Node => ({
  type: "text",
  text: value,
  format,
  detail: 0,
  mode: "normal",
  style: "",
  version: 1,
});

const elemen = (type: string, children: Node[], extra: Record<string, unknown> = {}): Node => ({
  type,
  children,
  direction: "ltr",
  format: "",
  indent: 0,
  version: 1,
  ...extra,
});

const tautan = (label: string, url: string): Node => {
  const luar = TAUTAN_LUAR.has(url);
  if (!luar && !TAUTAN_INTERNAL.has(url)) throw new Error(`Tautan tidak dikenal di naskah: ${url}`);
  return {
    ...elemen("link", [teks(label)]),
    version: 3,
    fields: { linkType: "custom", newTab: luar, url },
  };
};

const INLINE = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;

/** Uraikan satu baris teks menjadi simpul teks, tebal, dan tautan. */
export const inline = (value: string): Node[] => {
  const out: Node[] = [];
  let last = 0;
  for (const m of value.matchAll(INLINE)) {
    const at = m.index ?? 0;
    if (at > last) out.push(teks(value.slice(last, at)));
    if (m[1] !== undefined && m[2] !== undefined) out.push(tautan(m[1], m[2]));
    else if (m[3] !== undefined) out.push(teks(m[3], FORMAT_TEBAL));
    last = at + m[0].length;
  }
  if (last < value.length) out.push(teks(value.slice(last)));
  if (out.length === 0) throw new Error("Teks kosong di naskah.");
  return out;
};

const daftar = (items: string[], bernomor: boolean): Node => {
  if (items.length === 0) throw new Error("Daftar kosong di naskah.");
  return elemen(
    "list",
    items.map((item, i) => elemen("listitem", inline(item), { value: i + 1 })),
    bernomor ? { listType: "number", tag: "ol", start: 1 } : { listType: "bullet", tag: "ul", start: 1 },
  );
};

/** ID 24 karakter heksadesimal, seperti yang dibuat editor Payload untuk blok. */
const idBlok = () => randomBytes(12).toString("hex");

export type OpsiFormulir = { formId: number | string; heading?: string; intro?: string };

/**
 * Dokumen Lexical dari naskah. `formulir` wajib ada bila naskah memuat simpul form; tanpa
 * itu pemanggil harus membuang simpul form lebih dulu.
 */
export const keLexical = (naskah: readonly Simpul[], formulir?: OpsiFormulir) => {
  const children = naskah.map((s): Node => {
    switch (s.t) {
      case "h2":
      case "h3":
        return elemen("heading", inline(s.text), { tag: s.t });
      case "p":
        return elemen("paragraph", inline(s.text), { textFormat: 0, textStyle: "" });
      case "ul":
        return daftar(s.items, false);
      case "ol":
        return daftar(s.items, true);
      case "form": {
        if (!formulir) throw new Error("Naskah memuat formulir, tetapi formulirnya belum ada.");
        return {
          type: "block",
          version: 2,
          format: "",
          fields: {
            id: idBlok(),
            blockName: "",
            blockType: "formulir",
            form: formulir.formId,
            ...(formulir.heading ? { heading: formulir.heading } : {}),
            ...(formulir.intro ? { intro: formulir.intro } : {}),
          },
        };
      }
    }
  });
  return {
    root: { type: "root", format: "" as const, indent: 0, version: 1, direction: "ltr" as const, children },
  };
};

/** Teks polos dari naskah (untuk pemeriksaan: nama terlarang, panjang, dst.). */
const teksSimpul = (s: Simpul): string => {
  switch (s.t) {
    case "ul":
    case "ol":
      return s.items.join("\n");
    case "form":
      return "";
    default:
      return s.text;
  }
};

export const teksPolos = (naskah: readonly Simpul[]): string =>
  naskah
    .map(teksSimpul)
    .join("\n")
    .replace(INLINE, (_m, label?: string, _url?: string, tebal?: string) => label ?? tebal ?? "");
