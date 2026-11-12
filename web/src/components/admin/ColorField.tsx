"use client";

import type { TextFieldClientComponent } from "payload";
import { FieldDescription, FieldError, FieldLabel, useField } from "@payloadcms/ui";
import { normalizeHex } from "@/lib/appearance/color";

/**
 * Kolom kode warna + pemilih warna bawaan peramban. Nilai disimpan sebagai "#rrggbb".
 * Validasi kontras tetap di server (validate field), pesan galatnya tampil lewat FieldError.
 */
export const ColorField: TextFieldClientComponent = ({ field, path, readOnly }) => {
  const { value, setValue, showError } = useField<string>({ potentiallyStalePath: path });
  const hex = normalizeHex(value) ?? "#000000";
  const label = typeof field.label === "string" ? field.label : field.name;
  const inputId = `field-${path.replace(/\./g, "__")}`;

  return (
    <div className="field-type text" style={{ flex: "1 1 14rem" }}>
      <FieldLabel htmlFor={inputId} label={label} required={field.required} path={path} />
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <input
          type="color"
          aria-label={`${label}: pemilih warna`}
          value={hex}
          disabled={readOnly}
          onChange={(e) => setValue(e.target.value)}
          style={{ width: 44, height: 40, padding: 0, border: "1px solid var(--theme-elevation-150)" }}
        />
        <input
          id={inputId}
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="#b34a0f"
          value={value ?? ""}
          readOnly={readOnly}
          onChange={(e) => setValue(e.target.value.trim())}
          onBlur={(e) => {
            const n = normalizeHex(e.target.value);
            if (n && n !== e.target.value) setValue(n);
          }}
          style={{ flex: 1 }}
        />
      </div>
      <FieldError path={path} showError={showError} />
      <FieldDescription path={path} description={field.admin?.description} />
    </div>
  );
};
