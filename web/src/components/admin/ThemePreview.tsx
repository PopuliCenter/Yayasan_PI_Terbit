"use client";

import type { CSSProperties } from "react";
import type { UIFieldClientComponent } from "payload";
import { useFormFields } from "@payloadcms/ui";
import { contrastRatio, formatRatio, type Hex } from "@/lib/appearance/color";
import { NEUTRALS } from "@/lib/appearance/presets";
import { checkAccent, resolveTheme } from "@/lib/appearance/theme";

/** Teks badan/redup tetap (globals.css), untuk contoh saja. */
const FIXED = { light: { body: "#2f3b4f", muted: "#5a6476" }, dark: { body: "#d0d4db", muted: "#a2abb9" } } as const;

/**
 * Contoh tampilan langsung di form admin, tanpa menyimpan: dua "kertas" (terang dan gelap)
 * dengan judul, teks, tautan, tombol utama, lencana, penanda wajib isi, dan garis fokus,
 * plus angka kontras. Memakai resolveTheme yang sama dengan situs, jadi yang tampil di sini
 * adalah yang akan tampil di situs (warna tidak sah -> kembali ke aksen palet, seperti situs).
 */
export const ThemePreview: UIFieldClientComponent = () => {
  const theme = useFormFields(([fields]) => ({
    preset: fields["theme.preset"]?.value,
    customAccent: fields["theme.customAccent"]?.value,
    accentLight: fields["theme.accentLight"]?.value,
    accentDark: fields["theme.accentDark"]?.value,
  }));
  const resolved = resolveTheme(theme);
  const wanted = theme.customAccent === true;
  const lightCheck = wanted ? checkAccent(theme.accentLight, "light") : null;

  return (
    <div style={{ margin: "1rem 0 2rem" }}>
      <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Contoh tampilan</p>
      {wanted && !resolved.customAccentApplied ? (
        <p role="status" style={{ marginBottom: "0.75rem" }}>
          Warna aksen belum lolos pemeriksaan, jadi contoh di bawah masih memakai aksen palet.
          {lightCheck && !lightCheck.ok && lightCheck.reason === "contrast" ? ` Saran: ${lightCheck.suggestion}.` : ""}
        </p>
      ) : null}
      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(17rem, 1fr))" }}>
        {(["light", "dark"] as const).map((mode) => {
          const t = resolved[mode];
          const n = NEUTRALS[mode];
          const f = FIXED[mode];
          const ratio = (a: Hex, b: Hex) => `${formatRatio(contrastRatio(a, b))}:1`;
          const box: CSSProperties = { background: n.paper, color: f.body, padding: "1rem", borderRadius: 4, border: `1px solid ${mode === "light" ? "#e3ddd1" : "#2e3542"}` };
          return (
            <section key={mode} aria-label={mode === "light" ? "Mode terang" : "Mode gelap"} style={box}>
              <p style={{ color: f.muted, fontStyle: "italic", margin: 0 }}>{mode === "light" ? "Mode terang" : "Mode gelap"}</p>
              <p style={{ color: t.ink, fontFamily: "Georgia, serif", fontSize: "1.35rem", fontWeight: 600, margin: "0.25rem 0" }}>
                Judul buku terbaru
              </p>
              <p style={{ margin: "0 0 0.5rem" }}>
                Teks isi dengan <span style={{ color: t["primary-700"], textDecoration: "underline" }}>tautan</span> di dalamnya.
              </p>
              <p style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap", margin: 0 }}>
                <span style={{ background: t.ink, color: n.paper, padding: "0.4rem 0.9rem", borderRadius: 3, fontWeight: 600 }}>Cari</span>
                <span style={{ background: t["accent-100"], color: t["accent-800"], padding: "0.1rem 0.4rem", borderRadius: 3, fontSize: "0.75rem", fontWeight: 700 }}>
                  Pra-pesan
                </span>
                <span style={{ outline: `3px solid ${t.focus}`, outlineOffset: 2, padding: "0.2rem 0.5rem", background: n.surface, color: t.ink, borderRadius: 2 }}>
                  Fokus
                </span>
                <span style={{ color: t.ink }}>
                  Nama<span style={{ color: t["accent-700"] }}>*</span>
                </span>
              </p>
              <dl style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: f.muted, display: "grid", gridTemplateColumns: "auto auto", gap: "0 1rem" }}>
                <dt>Tautan di kertas</dt>
                <dd style={{ margin: 0 }}>{ratio(t["primary-700"], n["paper-2"])}</dd>
                <dt>Aksen di kertas</dt>
                <dd style={{ margin: 0 }}>{ratio(t["accent-700"], n["paper-2"])}</dd>
                <dt>Lencana</dt>
                <dd style={{ margin: 0 }}>{ratio(t["accent-800"], t["accent-100"])}</dd>
              </dl>
            </section>
          );
        })}
      </div>
    </div>
  );
};
