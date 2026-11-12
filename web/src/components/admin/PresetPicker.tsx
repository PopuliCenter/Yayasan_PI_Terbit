"use client";

import type { RadioFieldClientComponent } from "payload";
import { FieldDescription, FieldError, FieldLabel, useField } from "@payloadcms/ui";
import { NEUTRALS, PRESETS, type PresetKey } from "@/lib/appearance/presets";

/**
 * Pengganti tampilan field radio "Palet warna": kartu dengan contoh warna mode terang dan gelap.
 * Tetap radio asli (bisa dengan keyboard, terbaca pembaca layar); nilainya disimpan seperti radio biasa.
 */
export const PresetPicker: RadioFieldClientComponent = ({ field, path, readOnly }) => {
  const { value, setValue, showError } = useField<string>({ potentiallyStalePath: path });
  const label = typeof field.label === "string" ? field.label : "Palet warna";

  return (
    <fieldset className="field-type" style={{ border: 0, padding: 0, margin: "0 0 var(--base)" }} disabled={readOnly}>
      <legend>
        <FieldLabel as="span" label={label} required={field.required} path={path} />
      </legend>
      <FieldError path={path} showError={showError} />
      <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fill, minmax(15rem, 1fr))" }}>
        {(Object.keys(PRESETS) as PresetKey[]).map((key) => {
          const p = PRESETS[key];
          const checked = (value ?? "navy") === key;
          return (
            <label
              key={key}
              style={{
                display: "block",
                cursor: readOnly ? "default" : "pointer",
                border: `2px solid ${checked ? "var(--theme-elevation-800)" : "var(--theme-elevation-150)"}`,
                borderRadius: 4,
                padding: "0.75rem",
              }}
            >
              <input
                type="radio"
                name={path}
                value={key}
                checked={checked}
                onChange={() => setValue(key)}
                style={{ marginRight: "0.5rem" }}
              />
              <strong>{p.label}</strong>
              <span style={{ display: "block", fontSize: "0.85em", opacity: 0.8, margin: "0.25rem 0 0.5rem" }}>{p.description}</span>
              <span aria-hidden style={{ display: "flex", borderRadius: 3, overflow: "hidden" }}>
                {(
                  [
                    [NEUTRALS.light.paper, p.light.ink],
                    [NEUTRALS.light.paper, p.light["primary-700"]],
                    [p.light["primary-100"], p.light["primary-800"]],
                    [NEUTRALS.light.paper, p.light["accent-700"]],
                    [NEUTRALS.dark.paper, p.dark["primary-700"]],
                    [NEUTRALS.dark.paper, p.dark["accent-700"]],
                  ] as const
                ).map(([bg, fg], i) => (
                  <span key={i} style={{ flex: 1, height: 28, background: bg, display: "grid", placeItems: "center" }}>
                    <span style={{ width: 12, height: 12, borderRadius: "50%", background: fg }} />
                  </span>
                ))}
              </span>
            </label>
          );
        })}
      </div>
      <FieldDescription path={path} description={field.admin?.description} />
    </fieldset>
  );
};
