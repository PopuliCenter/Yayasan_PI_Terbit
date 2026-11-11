"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { submitInquiry, type FormState } from "@/app/(site)/actions";
import { FormStatus, TextArea, TextField } from "./Field";

const initial: FormState = { status: "idle" };

type InquiryType = "institusi" | "kontak" | "pengaduan" | "naskah";

const TYPE_OPTIONS: { value: InquiryType; label: string }[] = [
  { value: "kontak", label: "Pertanyaan umum" },
  { value: "pengaduan", label: "Pengaduan" },
  { value: "institusi", label: "Penawaran pembelian institusi" },
  { value: "naskah", label: "Kirim naskah" },
];

type Props = {
  /** Jenis tetap (halaman institusi) atau bisa dipilih (halaman kontak). */
  fixedType?: InquiryType;
  defaultType?: InquiryType;
  defaultItems?: string;
  /** Field anti-bot yang dirender server (honeypot + token). */
  botFields: React.ReactNode;
};

export function InquiryForm({ fixedType, defaultType = "kontak", defaultItems, botFields }: Props) {
  const [state, action, pending] = useActionState(submitInquiry, initial);
  const [type, setType] = useState<InquiryType>(fixedType ?? (state.values?.type as InquiryType) ?? defaultType);
  const err = state.fieldErrors ?? {};
  const v = state.values ?? {};
  const institutional = type === "institusi";

  if (state.status === "ok") {
    return <FormStatus status="ok" message={state.message} />;
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      {botFields}
      <FormStatus status={state.status} message={state.message} />

      {fixedType ? (
        <input type="hidden" name="type" value={fixedType} />
      ) : (
        <fieldset>
          <legend className="field-label">Jenis pesan</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {TYPE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-md border border-line bg-surface px-3 py-2 text-sm has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50"
              >
                <input
                  type="radio"
                  name="type"
                  value={opt.value}
                  checked={type === opt.value}
                  onChange={() => setType(opt.value)}
                  className="size-4 accent-primary-700"
                />
                {opt.label}
              </label>
            ))}
          </div>
          {err.type ? <p className="mt-1.5 text-sm font-medium text-danger">{err.type}</p> : null}
        </fieldset>
      )}

      {institutional ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            id="f-institution"
            name="institutionName"
            label="Nama lembaga"
            required
            autoComplete="organization"
            defaultValue={v.institutionName}
            error={err.institutionName}
          />
          <TextField
            id="f-role"
            name="role"
            label="Jabatan"
            autoComplete="organization-title"
            defaultValue={v.role}
            error={err.role}
          />
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="f-name"
          name="name"
          label={institutional ? "Nama kontak" : "Nama"}
          required
          autoComplete="name"
          defaultValue={v.name}
          error={err.name}
        />
        <TextField
          id="f-email"
          name="email"
          type="email"
          inputMode="email"
          label="Email"
          required
          autoComplete="email"
          defaultValue={v.email}
          error={err.email}
        />
      </div>

      <TextField
        id="f-phone"
        name="phone"
        type="tel"
        inputMode="tel"
        label="Telepon / WhatsApp"
        autoComplete="tel"
        defaultValue={v.phone}
        error={err.phone}
        hint={institutional ? "Memudahkan kami mengonfirmasi penawaran." : undefined}
      />

      {institutional ? (
        <>
          <TextArea
            id="f-items"
            name="requestedItems"
            label="Judul dan jumlah"
            required
            rows={5}
            defaultValue={v.requestedItems ?? defaultItems}
            error={err.requestedItems}
            hint="Satu judul per baris, mis. “Judul Buku — 30 eksemplar”."
          />
          <TextArea
            id="f-address"
            name="shippingAddress"
            label="Alamat kirim"
            rows={3}
            autoComplete="street-address"
            defaultValue={v.shippingAddress}
            error={err.shippingAddress}
          />
          <TextArea
            id="f-message"
            name="message"
            label="Catatan tambahan"
            rows={3}
            defaultValue={v.message}
            error={err.message}
            hint="Mis. kebutuhan kuitansi atas nama lembaga, tenggat pengadaan, atau anggaran."
          />
        </>
      ) : (
        <TextArea
          id="f-message"
          name="message"
          label={type === "pengaduan" ? "Isi pengaduan" : type === "naskah" ? "Ringkasan naskah" : "Pesan"}
          required
          rows={6}
          defaultValue={v.message}
          error={err.message}
          hint={
            type === "pengaduan"
              ? "Sertakan nomor pesanan atau tanggal pembelian bila ada."
              : type === "naskah"
                ? "Judul, ringkasan isi, dan perkiraan jumlah halaman. Kami akan membalas dengan cara mengirim naskah lengkap."
                : undefined
          }
        />
      )}

      <p className="text-sm text-muted">
        Data ini hanya dipakai untuk menanggapi pesan Anda, sesuai{" "}
        <Link href="/kebijakan-privasi" className="link">
          Kebijakan Privasi
        </Link>
        .
      </p>

      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={pending}>
        {pending ? "Mengirim…" : institutional ? "Kirim permintaan penawaran" : "Kirim pesan"}
      </button>
    </form>
  );
}
