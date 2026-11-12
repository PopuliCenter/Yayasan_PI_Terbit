import {
  APIError,
  type CollectionBeforeChangeHook,
  type CollectionBeforeDeleteHook,
  type CollectionBeforeOperationHook,
  type CollectionBeforeValidateHook,
  type PayloadRequest,
} from "payload";
import { computeExpiry, isInternalPath, toFieldName, uniqueName } from "../../lib/form-builder";
import { purgeExpiredSubmissionsThrottled } from "../../lib/form-retention";

/** Masa simpan kiriman yang ditandai spam. */
const SPAM_RETENTION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);

/**
 * Forms beforeValidate: nama kolom teknis dibuat dari label (huruf kecil, unik),
 * pilihan select/radio wajib ada, dan pengalihan kustom hanya ke halaman situs ini.
 */
export const normalizeFormDefinition: CollectionBeforeValidateHook = ({ data }) => {
  if (!data) return data;
  const blocks: unknown = data.fields;
  if (Array.isArray(blocks)) {
    const seen = new Set<string>();
    for (const block of blocks) {
      if (!isRecord(block) || block.blockType === "message") continue;
      const source = [block.name, block.label, block.blockType].find((v) => typeof v === "string" && v.trim());
      const name = uniqueName(toFieldName(String(source ?? "kolom")), seen);
      block.name = name;

      if (block.blockType === "select" || block.blockType === "radio") {
        const options = Array.isArray(block.options) ? block.options.filter(isRecord) : [];
        for (const option of options) {
          const value = String(option.value ?? option.label ?? "").trim().slice(0, 200);
          option.value = value;
          if (typeof option.label !== "string" || !option.label.trim()) option.label = value;
        }
        if (!options.some((o) => o.value !== "")) {
          const label = typeof block.label === "string" && block.label.trim() ? block.label : name;
          throw new APIError(`Kolom "${label}" butuh minimal satu pilihan.`, 400, null, true);
        }
      }
    }
  }

  const redirect = data.redirect;
  if (data.confirmationType === "redirect" && isRecord(redirect) && redirect.type !== "reference") {
    const url = typeof redirect.url === "string" ? redirect.url.trim() : "";
    if (url && !isInternalPath(url)) {
      throw new APIError(
        "Alamat tujuan pengalihan harus halaman di situs ini, diawali satu garis miring, mis. /terima-kasih.",
        400,
        null,
        true,
      );
    }
    if (url) redirect.url = url;
  }
  return data;
};

/** Forms beforeDelete: formulir yang masih punya kiriman tidak boleh dihapus (bukti persetujuan ikut hilang). */
export const preventDeleteWithSubmissions: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const { totalDocs } = await req.payload.count({
    collection: "form-submissions",
    where: { form: { equals: id } },
    overrideAccess: true,
    req,
  });
  if (totalDocs > 0) {
    throw new APIError(
      `Formulir ini masih punya ${totalDocs} kiriman, jadi tidak bisa dihapus. Matikan "Menerima kiriman" untuk menutupnya; kiriman terhapus otomatis setelah masa simpan.`,
      400,
      null,
      true,
    );
  }
};

const toDate = (v: unknown): Date | null => {
  if (typeof v !== "string" && !(v instanceof Date)) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** Masa simpan dari formulir asal kiriman (retentionDays), dihitung dari waktu kiriman dibuat. */
async function formExpiry(originalDoc: Record<string, unknown>, req: PayloadRequest, now: Date): Promise<Date> {
  const formId = isRecord(originalDoc.form) ? originalDoc.form.id : originalDoc.form;
  let retentionDays: number | null = null;
  if (typeof formId === "number") {
    try {
      const form = await req.payload.findByID({ collection: "forms", id: formId, depth: 0, overrideAccess: true, req });
      retentionDays = form.retentionDays ?? null;
    } catch {
      retentionDays = null;
    }
  }
  return computeExpiry(toDate(originalDoc.createdAt) ?? now, retentionDays);
}

/**
 * Submissions beforeChange: masa simpan (expiresAt) HANYA diatur di sini.
 * - Nilai expiresAt dari isian pembaruan selalu diabaikan (juga lewat Local API dengan
 *   overrideAccess), jadi masa simpan UU PDP tidak bisa diperpanjang atau dikosongkan.
 * - Menandai spam memperpendek masa simpan menjadi 30 hari (tidak pernah memperpanjang).
 * - Membatalkan tanda spam mengembalikan masa simpan formulir.
 */
export const spamShortRetention: CollectionBeforeChangeHook = async ({ data, originalDoc, operation, req }) => {
  if (operation !== "update" || !data || !originalDoc) return data;
  const wasSpam = originalDoc.status === "spam";
  const isSpam = (data.status ?? originalDoc.status) === "spam";
  const now = new Date();

  // Kiriman lama tanpa expiresAt mendapat masa simpan formulirnya.
  let expiresAt = toDate(originalDoc.expiresAt) ?? (await formExpiry(originalDoc, req, now));

  if (isSpam && !wasSpam) {
    const spamExpiry = new Date(now.getTime() + SPAM_RETENTION_DAYS * DAY_MS);
    if (spamExpiry < expiresAt) expiresAt = spamExpiry;
  }
  if (wasSpam && !isSpam) expiresAt = await formExpiry(originalDoc, req, now);

  data.expiresAt = expiresAt.toISOString();
  return data;
};

/** Submissions beforeOperation: admin membuka daftar/dokumen → hapus kiriman kedaluwarsa (berbatas, tidak menunggu). */
export const purgeOnAdminRead: CollectionBeforeOperationHook = ({ operation, req }) => {
  if (operation === "read" && req.user) void purgeExpiredSubmissionsThrottled(req.payload);
};
