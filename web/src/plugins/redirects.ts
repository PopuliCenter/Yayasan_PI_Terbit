import { redirectsPlugin } from "@payloadcms/plugin-redirects";
import { type CollectionBeforeChangeHook, type Field, type FieldHook, type PayloadRequest, ValidationError } from "payload";
import { fieldIsSuperAdmin, isKatalog } from "../access";
import { invalidateOnChange, invalidateOnDelete } from "../hooks/slugRedirect";
import { classifyRedirectTarget, REDIRECT_MAX_HOPS } from "../lib/redirect-table";
import { DRAFT_COLLECTIONS, fromPathProblem, normalizePath, parseContentPath } from "../lib/urls";

/*
 * Konfigurasi plugin-redirects: label Indonesia, akses minimum (admin katalog), normalisasi
 * dan validasi alamat, persetujuan super admin untuk tujuan di luar situs, dan invalidasi
 * cache. Audit dipasang oleh auditPlugin di payload.config untuk semua koleksi, jadi TIDAK
 * ditambahkan di sini. Berkas ini dimuat payload.config: hanya memakai req.payload.
 */

const EXTERNAL_NOT_APPROVED =
  'Tujuan di luar situs harus disetujui super admin (centang "Setujui tujuan di luar situs").';

const isSuperAdminUser = (user: unknown): boolean => (user as { role?: unknown } | null)?.role === "super-admin";

const isCustomTarget = (data: unknown): boolean =>
  (data as { to?: { type?: unknown } } | null | undefined)?.to?.type === "custom";

/* ---------- Alamat lama (from) ---------- */

const normalizeFrom: FieldHook = ({ value }) => (typeof value === "string" ? (normalizePath(value) ?? value) : value);

/** Tautan lengkap (skema://…) yang tidak bisa diurai, mis. ada spasi di nama domain. */
const isBrokenAbsoluteUrl = (s: string): boolean => {
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) return false;
  try {
    new URL(s);
    return false;
  } catch {
    return true;
  }
};

const validateFrom = async (value: unknown, { req }: { req: PayloadRequest }): Promise<true | string> => {
  if (typeof value !== "string" || !value.trim()) return "Wajib diisi.";
  const path = normalizePath(value);
  // normalizePath bernilai null untuk dua hal: tautan rusak atau alamat > 300 karakter.
  if (!path) {
    return isBrokenAbsoluteUrl(value.trim())
      ? "Alamat tidak valid. Tempel tautan lengkap yang benar atau tulis bagian setelah nama domain, mis. /buku/judul-lama."
      : "Alamat terlalu panjang (maksimal 300 karakter).";
  }
  const problem = fromPathProblem(path);
  if (problem) return problem;

  const content = parseContentPath(path);
  if (content) {
    const { totalDocs } = await req.payload.count({
      collection: content.collection,
      overrideAccess: true,
      req,
      where: DRAFT_COLLECTIONS.has(content.collection)
        ? { and: [{ slug: { equals: content.slug } }, { _status: { equals: "published" } }] }
        : { slug: { equals: content.slug } },
    });
    if (totalDocs > 0) {
      return "Alamat ini masih berisi halaman yang tayang. Ubah slug dokumennya; pengalihan akan dibuat otomatis.";
    }
  }
  return true;
};

/* ---------- Tujuan (to.url) ---------- */

/**
 * URL lengkap ke situs ini disimpan sebagai path, agar tidak bergantung pada nama host.
 * Path internal disimpan dalam bentuk akhirnya (`.`/`..` diselesaikan), sama dengan yang
 * diperiksa: `/kabar/../admin` tidak bisa lolos sebagai alamat biasa.
 */
const urlToPath: FieldHook = ({ value }) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  const t = classifyRedirectTarget(trimmed);
  return t.kind === "internal" ? t.path : trimmed;
};

/**
 * Ikuti tujuan internal melalui pengalihan manual yang sudah ada. Bila kembali ke alamat
 * lama dokumen ini, pengunjung akan berputar tanpa akhir (ERR_TOO_MANY_REDIRECTS).
 * Tujuan berupa rujukan dokumen mengakhiri rantai: alamatnya halaman yang tayang.
 * Tabel runtime tetap membuang putaran yang lolos dari sini (mis. data lama).
 */
const loopProblem = async (
  from: string,
  target: string,
  id: number | string | undefined,
  req: PayloadRequest,
): Promise<string | null> => {
  let current = normalizePath(target);
  for (let hops = 0; current && hops <= REDIRECT_MAX_HOPS; hops++) {
    if (current === from) {
      return hops === 0
        ? "Tujuan sama dengan alamat lama."
        : `Pengalihan ini akan berputar: ${target} sudah dialihkan kembali ke ${from}. Arahkan ke halaman akhirnya.`;
    }
    const { docs } = await req.payload.find({
      collection: "redirects",
      where:
        id === undefined
          ? { from: { equals: current } }
          : { and: [{ from: { equals: current } }, { id: { not_equals: id } }] },
      depth: 0,
      limit: 1,
      overrideAccess: true,
      req,
      select: { to: true },
    });
    const next: { type?: unknown; url?: unknown } | null | undefined = docs[0]?.to;
    if (next?.type !== "custom" || typeof next.url !== "string") return null;
    const t = classifyRedirectTarget(next.url);
    if (t.kind !== "internal") return null;
    current = normalizePath(t.path);
  }
  return null;
};

const validateTargetUrl = async (
  value: unknown,
  { data, id, req, siblingData }: { data: unknown; id?: number | string; req: PayloadRequest; siblingData: unknown },
): Promise<true | string> => {
  if ((siblingData as { type?: unknown } | null | undefined)?.type !== "custom") return true;
  if (typeof value !== "string" || !value) return "Wajib diisi.";
  const t = classifyRedirectTarget(value);
  if (t.kind === "invalid") return t.reason;
  if (t.kind === "external") return true;
  const fromRaw = (data as { from?: unknown } | null | undefined)?.from;
  const from = typeof fromRaw === "string" ? normalizePath(fromRaw) : null;
  // Alamat lama yang kosong/tidak valid dilaporkan oleh kolomnya sendiri.
  if (!from) return true;
  return (await loopProblem(from, t.path, id, req)) ?? true;
};

/**
 * Ganti label dan deskripsi tanpa membuang isi `admin` lain. Generik agar tipe gabungan
 * field (mis. RelationshipField tunggal/polimorfik) tetap utuh.
 */
const relabel = <F extends { admin?: object }>(field: F, label: string, description: string) => ({
  ...field,
  label,
  admin: { ...field.admin, description },
});

const mapTargetField = (field: Field): Field => {
  if (!("name" in field)) return field;
  if (field.name === "type" && field.type === "radio") {
    return {
      ...field,
      label: "Arahkan ke",
      options: [
        { label: "Halaman di situs ini", value: "reference" },
        { label: "Alamat khusus", value: "custom" },
      ],
    };
  }
  if (field.name === "reference" && field.type === "relationship") {
    return relabel(
      field,
      "Halaman tujuan",
      "Tujuan mengikuti slug terbaru dokumen ini. Bila dokumen belum tayang, pengalihan belum berlaku.",
    );
  }
  if (field.name === "url" && field.type === "text" && !field.hasMany) {
    return {
      ...field,
      label: "Alamat tujuan",
      admin: {
        ...field.admin,
        description:
          "Alamat di situs ini diawali garis miring, mis. /kabar/peluncuran. Alamat situs lain (https://…) baru berlaku setelah disetujui super admin.",
      },
      hooks: { ...field.hooks, beforeValidate: [...(field.hooks?.beforeValidate ?? []), urlToPath] },
      validate: validateTargetUrl,
    };
  }
  return field;
};

const mapDefaultField = (field: Field): Field => {
  if (!("name" in field)) return field;
  if (field.name === "from" && field.type === "text" && !field.hasMany) {
    return {
      ...field,
      label: "Alamat lama",
      admin: {
        ...field.admin,
        description:
          "Bagian setelah nama domain, mis. /buku/judul-lama. Tautan lengkap boleh ditempel: domain, ?… dan #… dibuang otomatis.",
      },
      hooks: { ...field.hooks, beforeValidate: [...(field.hooks?.beforeValidate ?? []), normalizeFrom] },
      validate: validateFrom,
    };
  }
  if (field.name === "to" && field.type === "group") {
    return { ...field, label: "Tujuan", fields: field.fields.map(mapTargetField) };
  }
  return field;
};

const extraFields: Field[] = [
  {
    name: "allowExternal",
    type: "checkbox",
    label: "Setujui tujuan di luar situs",
    defaultValue: false,
    access: { create: fieldIsSuperAdmin, update: fieldIsSuperAdmin },
    admin: {
      condition: (data) => isCustomTarget(data),
      description:
        "Khusus super admin. Hanya untuk tautan resmi yang sudah diperiksa. Bila alamat tujuan diubah, persetujuan harus diberikan lagi.",
    },
  },
  {
    name: "approvedExternalUrl",
    type: "text",
    label: "Tujuan luar yang disetujui",
    access: { create: () => false, update: () => false },
    admin: { readOnly: true, condition: (data) => isCustomTarget(data) },
  },
  {
    name: "source",
    type: "select",
    label: "Asal",
    defaultValue: "manual",
    options: [
      { label: "Manual", value: "manual" },
      { label: "Otomatis (slug berubah)", value: "otomatis" },
    ],
    access: { create: () => false, update: () => false },
    admin: { position: "sidebar", readOnly: true },
  },
  {
    name: "note",
    type: "textarea",
    label: "Catatan",
    admin: { position: "sidebar" },
  },
];

/**
 * Tujuan di luar situs hanya berlaku dengan persetujuan super admin yang terikat pada
 * alamat persis itu (approvedExternalUrl). Skrip tepercaya boleh menyetujui lewat
 * context.allowExternalRedirect === true.
 */
const approveExternal: CollectionBeforeChangeHook = ({ context, data, originalDoc, req }) => {
  const to: { type?: unknown; url?: unknown } | null | undefined = data.to ?? originalDoc?.to;
  const url = typeof to?.url === "string" ? to.url : "";
  const external = to?.type === "custom" && url !== "" && classifyRedirectTarget(url).kind === "external";

  if (!external) {
    data.allowExternal = false;
    data.approvedExternalUrl = null;
    return data;
  }

  const canApprove = isSuperAdminUser(req.user) || context?.allowExternalRedirect === true;
  if (canApprove && data.allowExternal === true) {
    data.approvedExternalUrl = url;
    return data;
  }

  // Alamat yang sudah disetujui tidak berubah: persetujuan tetap berlaku.
  if (data.allowExternal === true && originalDoc?.allowExternal === true && originalDoc?.approvedExternalUrl === url) {
    data.approvedExternalUrl = url;
    return data;
  }

  throw new ValidationError({
    collection: "redirects",
    errors: [{ path: "to.url", message: EXTERNAL_NOT_APPROVED }],
    req,
  });
};

export const redirects = redirectsPlugin({
  collections: ["books", "pages", "posts", "authors", "categories", "series"],
  // redirect()/permanentRedirect() di Next hanya bisa 307/308.
  redirectTypes: ["308", "307"],
  redirectTypeFieldOverride: {
    label: "Jenis pengalihan",
    defaultValue: "308",
    options: [
      { label: "Permanen (308): alamat lama tidak dipakai lagi", value: "308" },
      { label: "Sementara (307)", value: "307" },
    ],
    admin: {
      description: "Pilih Permanen untuk slug yang diganti, agar mesin pencari memindahkan peringkatnya ke alamat baru.",
    },
  },
  overrides: {
    labels: { singular: "Pengalihan URL", plural: "Pengalihan URL" },
    // Bawaan plugin: read: () => true. Akses yang tidak diisi = semua pengguna yang masuk.
    access: { read: isKatalog, create: isKatalog, update: isKatalog, delete: isKatalog },
    admin: {
      group: "Pengaturan",
      useAsTitle: "from",
      defaultColumns: ["from", "to.type", "type", "source", "updatedAt"],
      listSearchableFields: ["from", "to.url", "note"],
      description:
        "Mengarahkan pengunjung dari alamat lama ke halaman yang benar. Pengalihan hanya berlaku bila alamat lama tidak lagi berisi halaman. Saat slug buku, halaman, kabar, penulis, kategori, atau seri yang sudah tayang diubah, pengalihan dibuat otomatis.",
    },
    hooks: {
      beforeChange: [approveExternal],
      afterChange: [invalidateOnChange],
      afterDelete: [invalidateOnDelete],
    },
    fields: ({ defaultFields }) => [...defaultFields.map(mapDefaultField), ...extraFields],
  },
});
