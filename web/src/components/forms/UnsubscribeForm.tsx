"use client";

import { useActionState } from "react";
import { unsubscribe, type FormState } from "@/app/(site)/actions";
import { FormStatus } from "./Field";

const initial: FormState = { status: "idle" };

export function UnsubscribeForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(unsubscribe, initial);

  if (state.status === "ok") {
    return (
      <div className="mt-6">
        <FormStatus status="ok" message={state.message} />
      </div>
    );
  }

  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="token" value={token} />
      <FormStatus status={state.status} message={state.message} />
      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? "Memproses…" : "Ya, berhenti berlangganan"}
      </button>
    </form>
  );
}
