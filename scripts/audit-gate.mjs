#!/usr/bin/env node
// Gerbang audit dependensi (panduan deploy §5.5).
// Gagal bila ada advisory high/critical pada dependensi produksi yang tidak ada di allowlist,
// atau bila entri allowlist sudah kedaluwarsa. Jangan turunkan --audit-level global saat CI merah;
// tambahkan entri allowlist dengan alasan dan tanggal kedaluwarsa.
//
// Pakai: node scripts/audit-gate.mjs            (dari root repo; audit dijalankan di web/)
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const allowlist = JSON.parse(readFileSync(join(root, "audit-allowlist.json"), "utf8"));
const today = new Date().toISOString().slice(0, 10);

let raw;
try {
  raw = execFileSync("npm", ["audit", "--omit=dev", "--json"], {
    cwd: join(root, "web"),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
    shell: process.platform === "win32",
    maxBuffer: 64 * 1024 * 1024,
  });
} catch (error) {
  // npm audit keluar non-zero bila ada temuan; JSON tetap ada di stdout.
  raw = error.stdout;
  if (!raw) throw error;
}

const report = JSON.parse(raw);

// Gagal tertutup: bila endpoint audit npm galat, npm tetap menulis JSON (objek galat)
// ke stdout. Tanpa cek bentuk laporan, gerbang akan mencetak "OK".
if (
  report.error ||
  report.statusCode ||
  report.auditReportVersion !== 2 ||
  typeof report.vulnerabilities !== "object" ||
  report.vulnerabilities === null ||
  !report.metadata?.vulnerabilities
) {
  console.error("Gerbang audit GAGAL: laporan npm audit tidak sah atau endpoint audit galat.");
  console.error(JSON.stringify(report.error ?? report).slice(0, 500));
  process.exit(1);
}

const kedaluwarsa = allowlist.filter((e) => e.kedaluwarsa < today);
const izinkan = new Set(allowlist.filter((e) => e.kedaluwarsa >= today).map((e) => String(e.id)));

const temuan = [];
for (const [pkg, v] of Object.entries(report.vulnerabilities ?? {})) {
  if (!["high", "critical"].includes(v.severity)) continue;
  const advisories = (v.via ?? []).filter((x) => typeof x === "object");
  // Paket yang hanya rentan lewat dependensi lain dinilai di paket sumbernya.
  for (const a of advisories) {
    if (!["high", "critical"].includes(a.severity)) continue;
    const id = String(a.source ?? a.url ?? a.title);
    if (!izinkan.has(id)) temuan.push({ pkg, id, severity: a.severity, title: a.title, url: a.url });
  }
}

for (const e of kedaluwarsa) console.error(`ALLOWLIST KEDALUWARSA: ${e.id} (${e.kedaluwarsa}) — ${e.alasan}`);
for (const t of temuan) console.error(`${t.severity.toUpperCase()}: ${t.pkg} — ${t.title} [${t.id}] ${t.url ?? ""}`);

if (temuan.length > 0 || kedaluwarsa.length > 0) {
  console.error(`\nGerbang audit GAGAL: ${temuan.length} temuan di luar allowlist, ${kedaluwarsa.length} entri kedaluwarsa.`);
  process.exit(1);
}
const total = report.metadata?.vulnerabilities ?? {};
console.log(`Gerbang audit OK. Ringkasan npm audit (prod): ${JSON.stringify(total)}`);
