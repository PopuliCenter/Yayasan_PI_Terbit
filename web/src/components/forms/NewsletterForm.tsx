"use client";

import { usePathname } from "next/navigation";
import { useActionState } from "react";
import { subscribe, type FormState } from "@/app/(site)/actions";
import { HONEYPOT_FIELD, TOKEN_FIELD } from "@/lib/antibot-fields";
import { FormStatus } from "./Field";

const initial: FormState = { status: "idle" };

type Props = { consentText: string; consentVersion: string; issuedAt: string };

/** Langganan kabar terbitan (F-FRM-03). Kotak persetujuan terpisah dan tidak tercentang otomatis. */
export function NewsletterForm({ consentText, consentVersion, issuedAt }: Props) {
  const [state, action, pending] = useActionState(subscribe, initial);
  const pathname = usePathname();

  if (state.status === "ok") {
    return (
      <div className="mt-4">
        <FormStatus status="ok" message={state.message} />
      </div>
    );
  }

  const emailError = state.fieldErrors?.email;
  const consentError = state.fieldErrors?.consent;

  return (
    <form action={action} className="mt-4 space-y-3" noValidate>
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="nl-website">Jangan isi kolom ini</label>
        <input id="nl-website" type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" />
      </div>
      <input type="hidden" name={TOKEN_FIELD} value={issuedAt} />
      <input type="hidden" name="source" value={pathname} />
      <input type="hidden" name="consentVersion" value={consentVersion} />

      <div>
        <label htmlFor="nl-email" className="sr-only">
          Alamat email
        </label>
        <input
          id="nl-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="nama@contoh.id"
          defaultValue={state.values?.email}
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? "nl-email-error" : undefined}
          className="field-input border-primary-700 bg-primary-900 text-white placeholder:text-primary-300"
        />
        {emailError ? (
          <p id="nl-email-error" className="mt-1.5 text-sm font-medium text-accent-200">
            {emailError}
          </p>
        ) : null}
      </div>

      <div className="flex items-start gap-2.5">
        <input
          id="nl-consent"
          name="consent"
          type="checkbox"
          required
          aria-invalid={consentError ? true : undefined}
          aria-describedby={consentError ? "nl-consent-error" : undefined}
          className="mt-1 size-5 shrink-0 accent-accent-500"
        />
        <label htmlFor="nl-consent" className="text-xs leading-relaxed text-primary-200">
          {consentText}
        </label>
      </div>
      {consentError ? (
        <p id="nl-consent-error" className="text-sm font-medium text-accent-200">
          {consentError}
        </p>
      ) : null}

      {state.status === "error" && state.message ? (
        <p role="alert" className="text-sm font-medium text-accent-200">
          {state.message}
        </p>
      ) : null}

      <button type="submit" className="btn w-full bg-accent-500 text-primary-950 hover:bg-accent-400" disabled={pending}>
        {pending ? "Menyimpan…" : "Kabari saya"}
      </button>
    </form>
  );
}
