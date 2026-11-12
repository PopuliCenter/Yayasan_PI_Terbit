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

/* -------- Kolom tambahan untuk formulir khusus (plugin form-builder) -------- */

/** Penanda wajib/opsional, sama dengan Wrapper. */
const RequiredMark = ({ required }: { required?: boolean }) =>
  required ? (
    <span className="ml-0.5 text-accent-700" aria-hidden>
      *
    </span>
  ) : (
    <span className="ml-1.5 text-xs font-normal text-muted">(opsional)</span>
  );

const HintAndError = ({ id, hint, error, className = "" }: { id: string; hint?: string; error?: string; className?: string }) => (
  <>
    {hint ? (
      <p id={`${id}-hint`} className={`mt-1.5 text-sm text-muted ${className}`}>
        {hint}
      </p>
    ) : null}
    {error ? (
      <p id={`${id}-error`} className={`mt-1.5 text-sm font-medium text-danger ${className}`}>
        {error}
      </p>
    ) : null}
  </>
);

type Choice = { label: string; value: string };

type NumberProps = Base & { name: string; defaultValue?: string; disabled?: boolean };

/** Angka dengan papan ketik numerik; desimal boleh memakai koma (divalidasi di server). */
export function NumberField({ name, defaultValue, disabled, ...base }: NumberProps) {
  return (
    <Wrapper {...base}>
      <input
        id={base.id}
        name={name}
        type="text"
        inputMode="decimal"
        required={base.required}
        disabled={disabled}
        defaultValue={defaultValue}
        aria-invalid={base.error ? true : undefined}
        aria-describedby={describedBy(base.id, base.error, base.hint)}
        className={`field-input ${base.error ? "border-danger-strong" : ""}`}
      />
    </Wrapper>
  );
}

type SelectProps = Base & {
  name: string;
  options: Choice[];
  defaultValue?: string;
  /** Teks pilihan kosong pertama. */
  placeholder?: string;
  disabled?: boolean;
};

export function SelectField({ name, options, defaultValue, placeholder, disabled, ...base }: SelectProps) {
  return (
    <Wrapper {...base}>
      <select
        id={base.id}
        name={name}
        required={base.required}
        disabled={disabled}
        defaultValue={defaultValue ?? ""}
        aria-invalid={base.error ? true : undefined}
        aria-describedby={describedBy(base.id, base.error, base.hint)}
        className={`field-input ${base.error ? "border-danger-strong" : ""}`}
      >
        <option value="">{placeholder || "Pilih…"}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Wrapper>
  );
}

type RadioProps = Base & { name: string; options: Choice[]; defaultValue?: string; disabled?: boolean };

/**
 * Pilihan tunggal dalam fieldset/legend; gaya kartu sama dengan pilihan jenis pesan di
 * InquiryForm. Galat dan petunjuk ditautkan ke fieldset (aria-invalid tidak berlaku untuk radio).
 */
export function RadioGroup({ id, name, label, options, defaultValue, error, hint, required, disabled }: RadioProps) {
  return (
    <fieldset aria-describedby={describedBy(id, error, hint)}>
      <legend className="field-label">
        {label}
        <RequiredMark required={required} />
      </legend>
      <div className="grid gap-2">
        {options.map((o, i) => (
          <label
            key={o.value}
            htmlFor={`${id}-${i}`}
            className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-md border border-line bg-surface px-3 py-2 text-sm has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50"
          >
            <input
              id={`${id}-${i}`}
              type="radio"
              name={name}
              value={o.value}
              required={required}
              disabled={disabled}
              defaultChecked={defaultValue === o.value}
              className="size-4 shrink-0 accent-primary-700"
            />
            {o.label}
          </label>
        ))}
      </div>
      <HintAndError id={id} hint={hint} error={error} />
    </fieldset>
  );
}

type CheckboxProps = Base & { name: string; defaultChecked?: boolean; disabled?: boolean; children?: ReactNode };

/** Satu kotak centang dengan label di sampingnya. `children` tampil di bawah label (mis. tautan). */
export function CheckboxField({ id, name, label, error, hint, required, defaultChecked, disabled, children }: CheckboxProps) {
  return (
    <div>
      <div className="flex items-start gap-2.5">
        <input
          id={id}
          name={name}
          type="checkbox"
          required={required}
          disabled={disabled}
          defaultChecked={defaultChecked}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          className="mt-0.5 size-5 shrink-0 accent-primary-700"
        />
        <div>
          <label htmlFor={id} className="text-sm leading-relaxed text-ink">
            {label}
            <RequiredMark required={required} />
          </label>
          {children}
        </div>
      </div>
      <HintAndError id={id} hint={hint} error={error} className="pl-7.5" />
    </div>
  );
}

type DateProps = Base & { name: string; defaultValue?: string; disabled?: boolean };

export function DateField({ name, defaultValue, disabled, ...base }: DateProps) {
  return (
    <Wrapper {...base}>
      <input
        id={base.id}
        name={name}
        type="date"
        required={base.required}
        disabled={disabled}
        defaultValue={defaultValue}
        aria-invalid={base.error ? true : undefined}
        aria-describedby={describedBy(base.id, base.error, base.hint)}
        className={`field-input ${base.error ? "border-danger-strong" : ""}`}
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
