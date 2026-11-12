"use client";

import Link from "next/link";
import { useActionState, type ReactNode } from "react";
import type { FormState } from "@/app/(site)/actions";
import { submitBuilderForm } from "@/app/(site)/form-actions";
import { INPUT_PREFIX, type PublicField, type PublicForm } from "@/lib/form-builder";
import {
  CheckboxField,
  DateField,
  FormStatus,
  NumberField,
  RadioGroup,
  SelectField,
  TextArea,
  TextField,
} from "./Field";

const initial: FormState = { status: "idle" };

/** Sama dengan CONSENT_KEY di form-actions.ts. */
const CONSENT_KEY = "_consent";

type Props = {
  form: PublicForm;
  /** Path halaman tempat formulir tampil, disimpan sebagai "Halaman asal". */
  sourcePath: string;
  /** Field anti-bot yang dirender server (honeypot + token + Turnstile). */
  botFields: ReactNode;
  /** Pesan konfirmasi (teks kaya) yang sudah dirender server. */
  success?: ReactNode;
  /** Blok "pesan" yang sudah dirender server, per ID blok. */
  messages?: Record<string, ReactNode>;
  /** Pratinjau admin: formulir tampil tetapi tidak bisa dikirim. */
  disabled?: boolean;
};

export function BuilderForm({ form, sourcePath, botFields, success, messages = {}, disabled = false }: Props) {
  const [state, action, pending] = useActionState(submitBuilderForm, initial);
  const errors = state.fieldErrors ?? {};
  const values = state.values;

  if (state.status === "ok") {
    // Pesan konfirmasi dari formulir (bila diisi admin) menggantikan pesan umum, agar tidak ada dua ucapan terima kasih.
    if (success) {
      return (
        <div role="status" className="rounded-md border border-ok-line bg-ok-soft px-4 py-3 text-ok">
          {success}
        </div>
      );
    }
    return <FormStatus status="ok" message="Terima kasih, kiriman Anda sudah kami terima." />;
  }

  const idFor = (name: string) => `fb-${form.id}-${name}`;
  const textValue = (f: PublicField) =>
    values ? values[f.name] : typeof f.defaultValue === "string" ? f.defaultValue : undefined;

  const renderField = (f: PublicField): ReactNode => {
    if (f.type === "message") return messages[f.id] ?? null;
    const common = {
      id: idFor(f.name),
      name: INPUT_PREFIX + f.name,
      label: f.label,
      required: f.required,
      error: errors[f.name],
    };
    switch (f.type) {
      case "text":
        return <TextField {...common} defaultValue={textValue(f)} />;
      case "email":
        return <TextField {...common} type="email" inputMode="email" autoComplete="email" defaultValue={textValue(f)} />;
      case "number":
        return <NumberField {...common} defaultValue={textValue(f)} />;
      case "textarea":
        return <TextArea {...common} rows={5} defaultValue={textValue(f)} />;
      case "select":
        return (
          <SelectField {...common} options={f.options ?? []} placeholder={f.placeholder} defaultValue={textValue(f)} />
        );
      case "radio":
        return <RadioGroup {...common} options={f.options ?? []} defaultValue={textValue(f)} />;
      case "checkbox":
        return (
          <CheckboxField {...common} defaultChecked={values ? values[f.name] === "on" : f.defaultValue === true} />
        );
      case "date":
        return <DateField {...common} defaultValue={textValue(f)} />;
    }
  };

  return (
    <form action={action} noValidate className="space-y-5">
      <fieldset disabled={disabled} className="min-w-0 space-y-5">
        {disabled ? (
          <p className="rounded-md border border-info-line bg-info-soft px-4 py-3 text-sm text-info">
            Pratinjau: formulir tidak bisa dikirim dari mode pratinjau.
          </p>
        ) : null}
        {botFields}
        <input type="hidden" name="_form" value={form.id} />
        <input type="hidden" name="_source" value={sourcePath} />
        <FormStatus status={state.status} message={state.message} />

        <div className="grid gap-5 sm:grid-cols-2">
          {form.fields.map((f) => (
            <div key={f.id} className={f.type !== "message" && f.width !== null && f.width <= 50 ? "" : "sm:col-span-2"}>
              {renderField(f)}
            </div>
          ))}
        </div>

        <p className="text-sm text-muted">
          {form.purpose ? `${form.purpose} ` : null}
          Rincian pengelolaan data ada di{" "}
          <Link href="/kebijakan-privasi" className="link">
            Kebijakan Privasi
          </Link>
          .
        </p>

        {form.requireConsent ? (
          <CheckboxField
            id={idFor("_persetujuan")}
            name="consent"
            label={form.consentLabel || "Saya menyetujui pemrosesan data saya untuk tujuan di atas sesuai Kebijakan Privasi."}
            required
            defaultChecked={values?.[CONSENT_KEY] === "on"}
            error={errors[CONSENT_KEY]}
          />
        ) : null}

        <button type="submit" className="btn-primary w-full sm:w-auto" disabled={pending || disabled}>
          {pending ? "Mengirim…" : form.submitButtonLabel || "Kirim"}
        </button>
      </fieldset>
    </form>
  );
}
