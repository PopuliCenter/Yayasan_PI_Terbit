"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { checkSubmission } from "@/lib/antibot";
import {
  computeExpiry,
  echoValues,
  errorSummary,
  isFormOpen,
  isInternalPath,
  safeRedirectPath,
  toPublicForm,
  validateBuilderSubmission,
} from "@/lib/form-builder";
import { purgeExpiredSubmissionsThrottled } from "@/lib/form-retention";
import { getPublicForm } from "@/lib/forms";
import { getPayloadClient } from "@/lib/payload";
import type { FormState } from "./actions";

/*
 * Kiriman formulir khusus (plugin form-builder). Situs publik tidak memakai REST
 * Payload (/api/* di apex mengembalikan 404), jadi kiriman masuk lewat aksi server ini
 * dan ditulis dengan Local API. Tidak ada email yang dikirim.
 */

/** Kunci persetujuan di fieldErrors/values. Diawali "_" sehingga tidak bisa bentrok dengan nama kolom. */
const CONSENT_KEY = "_consent";

const botMessage: Record<"bot" | "expired" | "rate", string> = {
  bot: "Kiriman tidak dapat diverifikasi. Muat ulang halaman lalu coba lagi.",
  expired: "Formulir kedaluwarsa atau dikirim terlalu cepat. Muat ulang halaman lalu coba lagi.",
  rate: "Terlalu banyak kiriman dari jaringan Anda. Coba lagi dalam beberapa menit, atau hubungi kami lewat WhatsApp.",
};

const wibStamp = (date: Date) =>
  new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(date);

export async function submitBuilderForm(_prev: FormState, fd: FormData): Promise<FormState> {
  // 1. ID formulir (belum menyentuh basis data).
  const rawId = String(fd.get("_form") ?? "");
  const formId = /^\d{1,9}$/.test(rawId) ? Number(rawId) : 0;
  if (formId <= 0) {
    return { status: "error", message: "Formulir tidak dikenali. Muat ulang halaman lalu coba lagi." };
  }

  // 2. Anti-bot SEBELUM akses basis data: honeypot, token waktu, batas laju, Turnstile.
  const bot = await checkSubmission(fd, "formulir", { max: 5, windowMs: 10 * 60 * 1000 });
  if (!bot.ok) return { status: "error", message: botMessage[bot.reason], values: echoValues(fd) };

  // 3. Definisi formulir dari server; isian hanya divalidasi terhadap definisi ini.
  const form = await getPublicForm(formId);
  if (!form) return { status: "error", message: "Formulir tidak ditemukan. Muat ulang halaman lalu coba lagi." };
  if (!isFormOpen(form)) {
    return { status: "error", message: form.closedMessage || "Formulir ini sudah ditutup. Terima kasih atas minat Anda." };
  }

  const publicForm = toPublicForm(form);
  const result = validateBuilderSubmission(publicForm.fields, fd);
  const consentGiven = fd.get("consent") === "on";
  const values = { ...result.values, [CONSENT_KEY]: consentGiven ? "on" : "" };
  const fieldErrors = { ...result.fieldErrors };
  if (publicForm.requireConsent && !consentGiven) fieldErrors[CONSENT_KEY] = "Centang persetujuan untuk melanjutkan.";

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Ada isian yang perlu diperbaiki. Lihat keterangan di bawah setiap kolom.",
      fieldErrors,
      values,
    };
  }
  if (result.data.length === 0) {
    return { status: "error", message: "Isi minimal satu kolom sebelum mengirim.", values };
  }

  // 4. Simpan. Bukti persetujuan disalin dari dokumen formulir di server, bukan dari klien.
  const now = new Date();
  const source = String(fd.get("_source") ?? "");
  const payload = await getPayloadClient();
  try {
    await payload.create({
      collection: "form-submissions",
      overrideAccess: true,
      data: {
        form: form.id,
        title: `${form.title} — ${wibStamp(now)}`.slice(0, 200),
        submissionData: result.data,
        status: "baru",
        consent: {
          given: publicForm.requireConsent && consentGiven,
          at: now.toISOString(),
          version: form.consentVersion || "1.0",
          text: publicForm.requireConsent ? (form.consentLabel ?? null) : null,
          purpose: form.purpose ?? null,
        },
        sourcePath: isInternalPath(source) ? source.slice(0, 200) : null,
        expiresAt: computeExpiry(now, form.retentionDays).toISOString(),
      },
    });
  } catch (err) {
    // Hanya ringkasan galat dan ID formulir; isian pengunjung tidak pernah dicatat.
    payload.logger.error({ err: errorSummary(err), formId }, "Gagal menyimpan kiriman formulir");
    return {
      status: "error",
      message: "Kiriman belum tersimpan karena gangguan di server. Coba lagi, atau hubungi kami lewat WhatsApp.",
      values,
    };
  }

  // 5. Hapus kiriman yang melewati masa simpan setelah respons terkirim (berbatas 6 jam).
  after(() => purgeExpiredSubmissionsThrottled(payload));

  // 6. Pengalihan hanya ke halaman di situs ini. redirect() melempar, jadi di luar try.
  const target = safeRedirectPath(form);
  if (target) redirect(target);

  return { status: "ok" };
}
