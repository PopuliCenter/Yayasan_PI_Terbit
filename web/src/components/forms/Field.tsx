import type { ReactNode } from "react";

type Base = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
};

const describedBy = (id: string, error?: string, hint?: string) =>
  [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;

const Wrapper = ({ id, label, error, hint, required, children }: Base & { children: ReactNode }) => (
  <div>
    <label htmlFor={id} className="field-label">
      {label}
      {required ? (
        <span className="ml-0.5 text-accent-700" aria-hidden>
          *
        </span>
      ) : (
        <span className="ml-1.5 text-xs font-normal text-muted">(opsional)</span>
      )}
    </label>
    {children}
    {hint ? (
      <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted">
        {hint}
      </p>
    ) : null}
    {error ? (
      <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-danger">
        {error}
      </p>
    ) : null}
  </div>
);

type InputProps = Base & {
  name: string;
  type?: "text" | "email" | "tel";
  defaultValue?: string;
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel";
};

export function TextField({ name, type = "text", defaultValue, autoComplete, inputMode, ...base }: InputProps) {
  return (
    <Wrapper {...base}>
      <input
        id={base.id}
        name={name}
        type={type}
        required={base.required}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={base.error ? true : undefined}
        aria-describedby={describedBy(base.id, base.error, base.hint)}
        className={`field-input ${base.error ? "border-danger-strong" : ""}`}
      />
    </Wrapper>
  );
}

type AreaProps = Base & { name: string; rows?: number; defaultValue?: string; autoComplete?: string };

export function TextArea({ name, rows = 5, defaultValue, autoComplete, ...base }: AreaProps) {
  return (
    <Wrapper {...base}>
      <textarea
        id={base.id}
        name={name}
        rows={rows}
        required={base.required}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        aria-invalid={base.error ? true : undefined}
        aria-describedby={describedBy(base.id, base.error, base.hint)}
        className={`field-input py-2.5 ${base.error ? "border-danger-strong" : ""}`}
      />
    </Wrapper>
  );
}

/** Ringkasan status kiriman; diumumkan pembaca layar lewat role status/alert. */
export function FormStatus({ status, message }: { status: "idle" | "ok" | "error"; message?: string }) {
  if (!message || status === "idle") return null;
  const ok = status === "ok";
  return (
    <div
      role={ok ? "status" : "alert"}
      className={`rounded-md border px-4 py-3 text-sm ${
        ok ? "border-ok-line bg-ok-soft text-ok" : "border-danger-line bg-danger-soft text-danger"
      }`}
    >
      {message}
    </div>
  );
}
