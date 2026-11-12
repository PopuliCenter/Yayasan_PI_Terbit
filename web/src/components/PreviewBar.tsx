"use client";

import { isDocumentEvent, ready } from "@payloadcms/live-preview";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useSyncExternalStore, useTransition } from "react";
import { resolveTheme, THEME_STYLE_ID, type ThemeInput } from "@/lib/appearance/theme";

// Nilai jendela yang tidak berubah selama halaman hidup: tanpa langganan. Snapshot server
// null, jadi HTML server dan render hidrasi pertama sama (tanpa setState di efek).
const subscribeNever = () => () => {};
const readOrigin = () => window.location.origin;
const readInFrame = () => window.self !== window.top;
const serverSnapshot = () => null;

/**
 * Isian `theme` dari pesan Live Preview Payload untuk global Tampilan, hanya dari origin
 * yang sama. null bila pesannya bukan itu. Bagian pesan lain tidak pernah dibaca.
 */
const appearanceThemeFrom = (event: MessageEvent): { theme: ThemeInput } | null => {
  if (event.origin !== window.location.origin) return null;
  const data: unknown = event.data;
  if (!data || typeof data !== "object") return null;
  const msg = data as { type?: unknown; globalSlug?: unknown; data?: unknown };
  if (msg.type !== "payload-live-preview" || msg.globalSlug !== "appearance") return null;
  const theme = msg.data && typeof msg.data === "object" ? (msg.data as { theme?: unknown }).theme : null;
  return { theme: theme && typeof theme === "object" ? (theme as ThemeInput) : null };
};

/**
 * Bilah tipis "Pratinjau draf" di atas situs, hanya untuk admin yang sedang mempratinjau
 * (layout merendernya bila getAppearance().preview). Kontras AA: teks ink 13,5:1 / 13,9:1
 * dan muted 5,16:1 / 7,13:1 di atas paper-2 (terang / gelap).
 *
 * - Simpan di panel admin -> pesan `payload-document-event` -> data server dimuat ulang
 *   (router.refresh). Sengaja TIDAK memakai RefreshRouteOnSave: komponen itu juga
 *   me-refresh setiap kali terpasang. Bila refresh gagal dan Next jatuh ke muat ulang
 *   halaman penuh (mis. respons ?_rsc= bukan 200), muat ulang -> pasang -> refresh ->
 *   muat ulang berputar tanpa henti. Refresh saat terpasang juga tidak perlu: halaman baru
 *   dirender server dengan draf terbaru, dan panel admin sendiri mengirim satu
 *   document-event saat menerima `ready` pertama.
 * - Mengubah warna atau huruf di global Tampilan -> CSS tema ditukar seketika tanpa menyimpan.
 *   Hanya `theme` dari pesan origin yang sama yang dipakai, dan CSS-nya dibuat ulang oleh
 *   resolveTheme (kunci tetap + hex tervalidasi + huruf dari registri), jadi data pesan tidak
 *   pernah masuk mentah. Huruf langsung berganti karena saat pratinjau layout memasang kelas
 *   variabel SEMUA huruf di <html> (app/fonts.ts); berkas hurufnya baru diunduh saat dipakai.
 * - Di luar iframe (tab biasa): tautan kembali ke panel admin dan tombol keluar pratinjau.
 */
export function PreviewBar() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const origin = useSyncExternalStore(subscribeNever, readOrigin, serverSnapshot);
  const inFrame = useSyncExternalStore(subscribeNever, readInFrame, serverSnapshot);
  const refresh = useCallback(() => startTransition(() => router.refresh()), [router]);

  // Jabat tangan Live Preview: `ready` ke panel admin (iframe -> parent, popup -> opener),
  // lalu refresh hanya pada document-event dari origin yang sama.
  useEffect(() => {
    if (!origin) return;
    const onMessage = (event: MessageEvent) => {
      if (isDocumentEvent(event, origin)) refresh();
    };
    window.addEventListener("message", onMessage);
    ready({ serverURL: origin });
    return () => window.removeEventListener("message", onMessage);
  }, [origin, refresh]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const message = appearanceThemeFrom(event);
      if (!message) return;
      const style = document.getElementById(THEME_STYLE_ID);
      if (style) style.textContent = resolveTheme(message.theme).css;
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <aside aria-label="Mode pratinjau" className="border-b border-line bg-paper-2 text-sm text-ink">
      <div className="page-container flex flex-wrap items-center gap-x-4 gap-y-1 py-2">
        <p>
          <strong>Pratinjau draf.</strong>{" "}
          <span className="text-muted">Perubahan di sini belum tayang untuk pengunjung.</span>
        </p>
        <p aria-live="polite" className="text-muted">
          {pending ? "Memperbarui…" : ""}
        </p>
        {inFrame === false ? (
          <div className="flex flex-wrap items-center gap-x-4 sm:ml-auto">
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- panel admin Payload punya root layout sendiri: muat dokumen penuh, tanpa prefetch. */}
            <a href="/admin" className="link inline-flex min-h-6 items-center">
              Kembali ke panel admin
            </a>
            <form method="post" action="/pratinjau/keluar">
              <button type="submit" className="link inline-flex min-h-6 cursor-pointer items-center">
                Keluar dari pratinjau
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
