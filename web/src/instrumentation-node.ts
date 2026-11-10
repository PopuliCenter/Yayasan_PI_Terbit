/**
 * Pemeriksaan konfigurasi saat server start (panduan deploy, Lampiran C).
 *
 * Bila gagal, proses DIHENTIKAN (exit 1). Melempar galat saja tidak cukup: Next.js
 * mencatat "Failed to prepare server" lalu tetap hidup dalam keadaan rusak — terbukti
 * di uji smoke. Dengan exit, container masuk siklus restart yang terlihat jelas di
 * `docker compose ps`, dan rantai deploy berhenti di `up -d --wait`.
 */
const periksa = (): string[] => {
  const masalah: string[] = [];
  const stack = process.env.STACK_NAME ?? "";

  // Staging tidak boleh pernah bisa diindeks mesin pencari.
  if (/staging/i.test(stack) && process.env.SITE_INDEXABLE === "true") {
    masalah.push("STACK_NAME memuat 'staging' tetapi SITE_INDEXABLE=true");
  }

  const secret = process.env.PAYLOAD_SECRET ?? "";
  if (secret.length < 32) masalah.push("PAYLOAD_SECRET kosong atau kurang dari 32 karakter");

  if (process.env.DATABASE_ADAPTER !== "postgres") masalah.push("DATABASE_ADAPTER harus postgres di produksi");
  if (!process.env.DATABASE_URL) masalah.push("DATABASE_URL kosong");

  for (const key of ["SITE_URL", "ADMIN_BASE_URL"] as const) {
    const value = process.env[key];
    if (!value || !/^https:\/\/[a-z0-9.-]+$/i.test(value.replace(/\/+$/, ""))) {
      masalah.push(`${key} harus berupa https://host tanpa path`);
    }
  }
  return masalah;
};

if (process.env.NODE_ENV === "production") {
  const masalah = periksa();

  // Bukan galat: gerbang admin gagal tertutup. Diberi peringatan agar mudah didiagnosis.
  if (!process.env.CF_ACCESS_TEAM_DOMAIN || !process.env.CF_ACCESS_AUD) {
    console.warn("[startup] CF_ACCESS_TEAM_DOMAIN/CF_ACCESS_AUD kosong: semua akses ke host admin akan ditolak.");
  }

  if (masalah.length > 0) {
    console.error(`[startup] Konfigurasi tidak valid, server dihentikan:\n- ${masalah.join("\n- ")}`);
    process.exit(1);
  }
}

export {};
