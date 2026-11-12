/**
 * Inti formulir khusus (plugin form-builder) yang murni dan bisa diuji: bentuk publik
 * formulir untuk komponen klien, validasi kiriman terhadap definisi yang TERSIMPAN di
 * server, masa simpan, dan pengalihan aman. Tanpa akses basis data.
 */

/** Awalan nama input agar tidak bentrok dengan honeypot "website", "_t", "consent", dll. */
export const INPUT_PREFIX = "f_";

export const MAX_FIELDS = 30;
const MAX_LEN = { text: 300, textarea: 5000, email: 160, number: 30, select: 200, radio: 200, date: 10 } as const;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const RETENTION_MIN_DAYS = 30;
export const RETENTION_MAX_DAYS = 1095;
export const RETENTION_DEFAULT_DAYS = 365;
const DAY_MS = 24 * 60 * 60 * 1000;

export type PublicFieldType = "text" | "textarea" | "email" | "number" | "select" | "radio" | "checkbox" | "date" | "message";
export type PublicOption = { label: string; value: string };

/** Satu kolom formulir dalam bentuk yang aman dikirim ke komponen klien. */
export type PublicField = {
  type: PublicFieldType;
  /** ID blok; dipakai sebagai key React dan untuk mencocokkan blok pesan yang dirender server. */
  id: string;
  name: string;
  label: string;
  required: boolean;
  /** Lebar dalam persen (≤ 50 = setengah baris di layar lebar). */
  width: number | null;
  defaultValue?: string | boolean;
  placeholder?: string;
  options?: PublicOption[];
};

export type PublicForm = {
  id: number;
  title: string;
  fields: PublicField[];
  submitButtonLabel: string | null;
  purpose: string | null;
  requireConsent: boolean;
  consentLabel: string | null;
};

/** Bentuk minimum dokumen `forms` yang dibaca modul ini (cocok dengan tipe Form hasil generate). */
export type FormBlockLike = {
  id?: string | null;
  blockType: string;
  name?: string | null;
  label?: string | null;
  required?: boolean | null;
  width?: number | null;
  defaultValue?: unknown;
  placeholder?: string | null;
  options?: { label?: string | null; value?: string | null }[] | null;
};

export type FormDocLike = {
  id: number;
  title?: string | null;
  fields?: FormBlockLike[] | null;
  submitButtonLabel?: string | null;
  confirmationType?: string | null;
  redirect?: {
    type?: string | null;
    url?: string | null;
    reference?: { relationTo?: string; value?: number | { slug?: string | null } | null } | null;
  } | null;
  purpose?: string | null;
  requireConsent?: boolean | null;
  consentLabel?: string | null;
  acceptingResponses?: boolean | null;
  closesAt?: string | null;
};

const SUPPORTED = new Set<string>(["text", "textarea", "email", "number", "select", "radio", "checkbox", "date", "message"]);
const isSupported = (t: string): t is PublicFieldType => SUPPORTED.has(t);

/** "Nama Lengkap" → "nama_lengkap": huruf kecil a-z0-9_, diawali huruf, maksimal 40 karakter. */
export const toFieldName = (s: string): string => {
  const base = s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/^(\d)/, "f$1")
    .slice(0, 40)
    .replace(/_+$/g, "");
  return base || "kolom";
};

/** Nama unik per formulir: nama kedua yang sama menjadi nama_2, nama_3, dst. */
export const uniqueName = (wanted: string, seen: Set<string>): string => {
  let name = wanted;
  for (let i = 2; seen.has(name); i++) name = `${wanted.slice(0, 36)}_${i}`;
  seen.add(name);
  return name;
};

/** ID stabil untuk blok; blok tanpa ID (data lama) memakai urutannya. */
export const blockId = (block: { id?: string | null }, index: number): string => block.id || `blok-${index + 1}`;

/** Tanggal (ISO) menjadi TTTT-BB-HH menurut WIB, untuk nilai awal <input type="date">. */
const toDateInput = (value: unknown): string | undefined => {
  if (typeof value !== "string" || !value) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(d);
};

const defaultFor = (type: PublicFieldType, value: unknown): string | boolean | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  if (type === "checkbox") return value === true;
  if (type === "date") return toDateInput(value);
  if (typeof value === "number") return String(value);
  return typeof value === "string" ? value : undefined;
};

export function toPublicForm(form: FormDocLike): PublicForm {
  const seen = new Set<string>();
  const fields: PublicField[] = [];
  (form.fields ?? []).forEach((block, index) => {
    if (fields.length >= MAX_FIELDS) return;
    if (!isSupported(block.blockType)) return;
    const type = block.blockType;
    const id = blockId(block, index);
    if (type === "message") {
      fields.push({ type, id, name: "", label: "", required: false, width: null });
      return;
    }
    const label = (block.label || block.name || "").trim();
    const field: PublicField = {
      type,
      id,
      name: uniqueName(toFieldName(block.name || block.label || type), seen),
      label: label || "Isian",
      required: block.required === true,
      width: typeof block.width === "number" && block.width > 0 ? block.width : null,
    };
    const def = defaultFor(type, block.defaultValue);
    if (def !== undefined) field.defaultValue = def;
    if (block.placeholder) field.placeholder = block.placeholder;
    if (type === "select" || type === "radio") {
      field.options = (block.options ?? [])
        .map((o) => ({ label: String(o.label ?? o.value ?? "").trim(), value: String(o.value ?? o.label ?? "").trim() }))
        .filter((o) => o.value !== "")
        .map((o) => ({ label: o.label || o.value, value: o.value }));
    }
    fields.push(field);
  });
  return {
    id: form.id,
    title: form.title ?? "",
    fields,
    submitButtonLabel: form.submitButtonLabel || null,
    purpose: form.purpose || null,
    requireConsent: form.requireConsent !== false,
    consentLabel: form.consentLabel || null,
  };
}

export const isFormOpen = (
  form: { acceptingResponses?: boolean | null; closesAt?: string | null },
  now: Date = new Date(),
): boolean => {
  if (form.acceptingResponses === false) return false;
  if (!form.closesAt) return true;
  const closes = new Date(form.closesAt);
  return Number.isNaN(closes.getTime()) || closes > now;
};

/** Waktu hapus otomatis: sekarang + masa simpan formulir, dibatasi 30–1095 hari. */
export const computeExpiry = (now: Date, days?: number | null): Date => {
  const d = typeof days === "number" && Number.isFinite(days) ? days : RETENTION_DEFAULT_DAYS;
  const clamped = Math.min(Math.max(Math.round(d), RETENTION_MIN_DAYS), RETENTION_MAX_DAYS);
  return new Date(now.getTime() + clamped * DAY_MS);
};

const isCalendarDate = (s: string): boolean => {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
};

type FormDataLike = { get(name: string): unknown };

const stringOf = (raw: unknown): string => (typeof raw === "string" ? raw : "");

export type SubmissionRow = { field: string; label: string; value: string };

export type BuilderValidation = {
  ok: boolean;
  data: SubmissionRow[];
  fieldErrors: Record<string, string>;
  /** Nilai yang dikembalikan ke formulir saat galat (kotak centang: "on" atau ""). */
  values: Record<string, string>;
};

/**
 * Validasi kiriman HANYA terhadap definisi kolom yang tersimpan. Kunci kiriman lain
 * diabaikan, teks dipotong sesuai batas, pilihan harus ada di daftar.
 */
export function validateBuilderSubmission(fields: PublicField[], fd: FormDataLike): BuilderValidation {
  const data: SubmissionRow[] = [];
  const fieldErrors: Record<string, string> = {};
  const values: Record<string, string> = {};

  for (const f of fields) {
    if (f.type === "message") continue;
    const raw = fd.get(INPUT_PREFIX + f.name);
    const label = f.label.slice(0, 200);

    if (f.type === "checkbox") {
      const on = raw === "on";
      values[f.name] = on ? "on" : "";
      if (f.required && !on) fieldErrors[f.name] = "Centang kotak ini untuk melanjutkan.";
      else data.push({ field: f.name, label, value: on ? "Ya" : "Tidak" });
      continue;
    }

    const s = stringOf(raw).trim().slice(0, MAX_LEN[f.type]);
    values[f.name] = s;
    if (!s) {
      if (f.required) fieldErrors[f.name] = "Wajib diisi.";
      continue;
    }

    let error: string | null = null;
    if (f.type === "email" && !EMAIL.test(s)) error = "Tulis alamat email yang valid, mis. nama@contoh.id.";
    if (f.type === "number" && !/^-?\d+([.,]\d+)?$/.test(s.replace(/\s/g, ""))) error = "Isi dengan angka, mis. 12 atau 12,5.";
    if ((f.type === "select" || f.type === "radio") && !(f.options ?? []).some((o) => o.value === s)) {
      error = "Pilih salah satu pilihan yang tersedia.";
    }
    if (f.type === "date" && !isCalendarDate(s)) error = "Pilih tanggal yang valid.";

    if (error) fieldErrors[f.name] = error;
    else data.push({ field: f.name, label, value: s });
  }

  return { ok: Object.keys(fieldErrors).length === 0, data, fieldErrors, values };
}

/**
 * Isian mentah berawalan f_ untuk dikembalikan ke formulir bila kiriman ditolak
 * sebelum definisi formulir dibaca (mis. batas laju). Dibatasi jumlah dan panjangnya.
 */
export function echoValues(fd: Iterable<[string, unknown]>): Record<string, string> {
  const values: Record<string, string> = {};
  let count = 0;
  for (const [key, raw] of fd) {
    if (!key.startsWith(INPUT_PREFIX) || typeof raw !== "string") continue;
    if (count++ >= MAX_FIELDS) break;
    values[key.slice(INPUT_PREFIX.length, INPUT_PREFIX.length + 40)] = raw.slice(0, MAX_LEN.textarea);
  }
  return values;
}

/** Path internal saja: diawali satu "/", tanpa "//", "/\", garis miring terbalik, atau spasi. */
export const isInternalPath = (value: unknown): value is string =>
  typeof value === "string" && value.length <= 500 && /^\/(?![/\\])[^\\\s]*$/.test(value);

/** Tujuan pengalihan setelah kirim, hanya ke halaman di situs ini. null = tampilkan pesan konfirmasi. */
export function safeRedirectPath(form: Pick<FormDocLike, "confirmationType" | "redirect">): string | null {
  if (form.confirmationType !== "redirect") return null;
  const r = form.redirect;
  if (!r) return null;
  if (r.type === "reference") {
    const value = r.reference?.value;
    const slug = typeof value === "object" && value !== null ? value.slug : null;
    return slug && /^[a-z0-9][a-z0-9-]*$/i.test(slug) ? `/${slug}` : null;
  }
  return isInternalPath(r.url) ? r.url : null;
}

/** Ringkasan galat untuk log: tanpa parameter kueri (yang bisa berisi isian pengunjung). */
export const errorSummary = (err: unknown): { name: string; message: string } => {
  if (!(err instanceof Error)) return { name: "Error", message: "Galat tidak dikenal" };
  return { name: err.name, message: err.message.split(/\n?\s*params:/i)[0].slice(0, 300) };
};
