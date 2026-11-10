"use server";

import { randomBytes } from "crypto";
import { checkSubmission } from "@/lib/antibot";
import { getSettings } from "@/lib/data";
import { getPayloadClient } from "@/lib/payload";

export type FormState = {
  status: "idle" | "ok" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Nilai yang diketik pengguna dikembalikan saat galat agar tidak hilang. */
  values?: Record<string, string>;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const str = (formData: FormData, key: string, max = 4000): string =>
  String(formData.get(key) ?? "")
    .trim()
    .slice(0, max);

const botMessage: Record<string, string> = {
  bot: "Kiriman tidak dapat diverifikasi. Muat ulang halaman lalu coba lagi.",
  expired: "Formulir kedaluwarsa atau dikirim terlalu cepat. Muat ulang halaman lalu coba lagi.",
  rate: "Terlalu banyak kiriman dari jaringan Anda. Coba lagi dalam beberapa menit, atau hubungi kami lewat WhatsApp.",
};

/* -------------------------------------------------------------------------- */
/* Pesan masuk: penawaran institusi, pertanyaan, pengaduan, naskah             */
/* -------------------------------------------------------------------------- */

const INQUIRY_TYPES = new Set(["institusi", "kontak", "pengaduan", "naskah"]);

export async function submitInquiry(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = {
    type: str(formData, "type", 20),
    name: str(formData, "name", 120),
    email: str(formData, "email", 160),
    phone: str(formData, "phone", 30),
    institutionName: str(formData, "institutionName", 200),
    role: str(formData, "role", 120),
    requestedItems: str(formData, "requestedItems", 3000),
    shippingAddress: str(formData, "shippingAddress", 1000),
    message: str(formData, "message", 4000),
  };

  const bot = await checkSubmission(formData, "inquiry");
  if (!bot.ok) return { status: "error", message: botMessage[bot.reason], values };

  const fieldErrors: Record<string, string> = {};
  if (!INQUIRY_TYPES.has(values.type)) fieldErrors.type = "Pilih jenis pesan.";
  if (values.name.length < 2) fieldErrors.name = "Tulis nama Anda.";
  if (!EMAIL.test(values.email)) fieldErrors.email = "Tulis alamat email yang valid, mis. nama@contoh.id.";
  if (values.phone && !/^[\d\s+()-]{6,30}$/.test(values.phone)) {
    fieldErrors.phone = "Nomor telepon hanya boleh berisi angka, spasi, +, atau tanda hubung.";
  }
  if (values.type === "institusi") {
    if (values.institutionName.length < 2) fieldErrors.institutionName = "Tulis nama lembaga.";
    if (values.requestedItems.length < 3) fieldErrors.requestedItems = "Tulis judul dan jumlah yang diminta.";
  }
  const minMessage = values.type === "institusi" ? 0 : 10;
  if (values.message.length < minMessage) fieldErrors.message = "Tulis pesan minimal 10 karakter.";

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Ada isian yang perlu diperbaiki. Lihat keterangan di bawah setiap kolom.",
      fieldErrors,
      values,
    };
  }

  try {
    const payload = await getPayloadClient();
    await payload.create({
      collection: "inquiries",
      // Koleksi ini tertutup untuk publik; pembuatan hanya lewat aksi server yang sudah divalidasi.
      overrideAccess: true,
      data: {
        type: values.type as "institusi" | "kontak" | "pengaduan" | "naskah",
        name: values.name,
        email: values.email,
        phone: values.phone || undefined,
        institutionName: values.institutionName || undefined,
        role: values.role || undefined,
        requestedItems: values.requestedItems || undefined,
        shippingAddress: values.shippingAddress || undefined,
        message: values.message || "(lihat daftar judul)",
        status: "baru",
      },
    });
  } catch (error) {
    const payload = await getPayloadClient();
    payload.logger.error({ err: error }, "Gagal menyimpan pesan formulir");
    return {
      status: "error",
      message: "Pesan belum terkirim karena gangguan di server. Coba lagi, atau hubungi kami lewat WhatsApp.",
      values,
    };
  }

  const settings = await getSettings();
  const target =
    values.type === "pengaduan"
      ? settings.complaintResponseTarget
      : values.type === "institusi"
        ? "maksimal 2 hari kerja"
        : null;

  return {
    status: "ok",
    message: target
      ? `Terima kasih, pesan Anda sudah kami terima. Kami akan menanggapi ${target} lewat email atau telepon yang Anda tulis.`
      : "Terima kasih, pesan Anda sudah kami terima. Kami akan menanggapi lewat email atau telepon yang Anda tulis.",
  };
}

/* -------------------------------------------------------------------------- */
/* Langganan kabar terbitan (F-FRM-03)                                         */
/* -------------------------------------------------------------------------- */

export async function subscribe(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = str(formData, "email", 160).toLowerCase();
  const values = { email };

  // Formulir langganan di footer tidak memuat widget Turnstile; lapisan lain tetap berlaku.
  const bot = await checkSubmission(formData, "subscribe", { turnstile: false });
  if (!bot.ok) return { status: "error", message: botMessage[bot.reason], values };

  if (!EMAIL.test(email)) {
    return { status: "error", fieldErrors: { email: "Tulis alamat email yang valid." }, values };
  }
  // Persetujuan harus aktif dicentang; kotaknya tidak pernah tercentang otomatis.
  if (formData.get("consent") !== "on") {
    return {
      status: "error",
      fieldErrors: { consent: "Centang persetujuan bila Anda ingin menerima kabar terbitan." },
      values,
    };
  }

  // Teks persetujuan diambil dari server, bukan dari isian klien, agar bukti persetujuan tidak bisa dipalsukan.
  const settings = await getSettings();
  const source = str(formData, "source", 200);

  try {
    const payload = await getPayloadClient();
    const existing = await payload.find({
      collection: "subscribers",
      overrideAccess: true,
      where: { email: { equals: email } },
      limit: 1,
    });

    // Email yang sudah terdaftar — aktif ATAU sudah berhenti — tidak diubah dari formulir
    // anonim. Formulir ini tidak membuktikan kepemilikan email, jadi siapa pun bisa
    // mengetik email orang lain; mengaktifkan ulang baris yang dicabut akan menimpa bukti
    // pencabutan persetujuan (UU 27/2022). Berlangganan ulang menunggu konfirmasi lewat
    // email (double opt-in) setelah penyedia email dipilih, atau ditangani admin atas permintaan.
    if (!existing.docs[0]) {
      await payload.create({
        collection: "subscribers",
        overrideAccess: true,
        data: {
          email,
          active: true,
          consentAt: new Date().toISOString(),
          consentVersion: settings.consentVersion,
          consentText: settings.consentText,
          source: source.startsWith("/") ? source : "/",
          unsubscribeToken: randomBytes(24).toString("hex"),
        },
      });
    }
  } catch (error) {
    const payload = await getPayloadClient();
    payload.logger.error({ err: error }, "Gagal menyimpan langganan");
    return { status: "error", message: "Pendaftaran belum tersimpan. Coba lagi sebentar lagi.", values };
  }

  // Jawaban sama untuk email baru maupun lama, agar keberadaan email tidak bocor.
  return { status: "ok", message: "Terima kasih. Kami akan mengabari Anda saat ada terbitan baru." };
}

/**
 * Berhenti berlangganan lewat token di tautan email. Pencabutan dicatat (active=false
 * + waktu), bukan menghapus baris, agar riwayat persetujuan tetap bisa dibuktikan.
 */
export async function unsubscribe(_prev: FormState, formData: FormData): Promise<FormState> {
  const token = str(formData, "token", 100);
  if (!/^[a-f0-9]{48}$/.test(token)) {
    return { status: "error", message: "Tautan berhenti berlangganan tidak valid atau sudah kedaluwarsa." };
  }

  const payload = await getPayloadClient();
  const found = await payload.find({
    collection: "subscribers",
    overrideAccess: true,
    where: { unsubscribeToken: { equals: token } },
    limit: 1,
  });
  const sub = found.docs[0];
  if (sub?.active) {
    await payload.update({
      collection: "subscribers",
      id: sub.id,
      overrideAccess: true,
      data: { active: false, unsubscribedAt: new Date().toISOString() },
    });
  }
  // Pesan sama walau token tidak ditemukan, agar token tidak bisa ditebak-tebak.
  return { status: "ok", message: "Anda sudah berhenti berlangganan. Kami tidak akan mengirim kabar terbitan lagi." };
}
