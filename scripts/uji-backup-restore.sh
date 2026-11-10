#!/usr/bin/env bash
# Uji roundtrip backup → ubah data → restore → cek, memakai skrip ASLI (panduan §5.2 job backup-restore).
# JANGAN dijalankan di VPS. Butuh: stack uji hidup (SMOKE_KEEP=1 bash scripts/smoke.sh), `age`, `age-keygen`, `flock`.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
UJI="$ROOT/.uji"
ENVF="$UJI/uji.env"
[ -f "$ENVF" ] || { echo "Stack uji belum ada. Jalankan dulu: SMOKE_KEEP=1 bash scripts/smoke.sh" >&2; exit 1; }
if docker inspect survey-populicenter-nginx-1 >/dev/null 2>&1; then
  echo "DITOLAK: edge VPS terdeteksi. Uji ini hanya untuk CI dan laptop." >&2; exit 1
fi
command -v age >/dev/null && command -v age-keygen >/dev/null || { echo "Butuh age dan age-keygen" >&2; exit 1; }

COMPOSE=(docker compose --env-file "$ENVF")
STACK="$(grep '^STACK_NAME=' "$ENVF" | cut -d= -f2)"
FILES_VOLUME="$(grep '^FILES_VOLUME=' "$ENVF" | cut -d= -f2)"
sql() { "${COMPOSE[@]}" exec -T -e Q="$1" db sh -c 'psql -U "$POSTGRES_USER" -d "${DB:-$POSTGRES_DB}" -tAc "$Q"' | tr -d '\r'; }
sql_pg() { "${COMPOSE[@]}" exec -T -e Q="$1" db sh -c 'psql -U "$POSTGRES_USER" -d postgres -tAc "$Q"' | tr -d '\r'; }
jumlah_berkas() { docker run --rm -v "$FILES_VOLUME":/data:ro alpine:3.24.4 sh -c 'find /data -type f | wc -l' | tr -d ' \r'; }

gagal=0
pastikan() { # deskripsi kondisi
  if eval "$2"; then echo "  OK   $1"; else echo "  GAGAL $1"; gagal=$((gagal + 1)); fi
}

echo "== Siapkan kunci age uji (kunci privat hanya di .uji/, dibuang setelah uji)"
rm -rf "$UJI/backups" "$UJI/kunci.txt" "$UJI/recipients.txt"
age-keygen -o "$UJI/kunci.txt" 2>/dev/null
grep -o 'age1[0-9a-z]*' "$UJI/kunci.txt" > "$UJI/recipients.txt"

kategori_awal="$(sql 'select count(*) from categories')"
berkas_awal="$(jumlah_berkas)"
echo "  kondisi awal: $kategori_awal kategori, $berkas_awal berkas di volume"

echo "== Backup (scripts/backup.sh asli)"
ENV_FILE="$ENVF" BACKUP_DIR="$UJI/backups" AGE_RECIPIENTS="$UJI/recipients.txt" LOCK_DIR="$UJI" \
  BACKUP_CONF=/nonexistent RCLONE_DEST= HEARTBEAT_URL= ALERT_URL= bash scripts/backup.sh 2>&1 | sed 's/^/  /'
DUMP="$(ls "$UJI"/backups/db-*.dump | tail -n 1)"
TAR="$(ls "$UJI"/backups/files-*.tar.gz | tail -n 1)"
pastikan "dump DB dan arsip berkas terbentuk" '[ -s "$DUMP" ] && [ -s "$TAR" ]'
pastikan "salinan terenkripsi .age terbentuk" '[ -s "$DUMP.age" ] && [ -s "$TAR.age" ]'
pastikan "tidak ada sisa .partial" '[ -z "$(ls "$UJI"/backups/*.partial 2>/dev/null)" ]'
pastikan "dump .age bisa dibuka dengan kunci privat dan identik" 'age -d -i "$UJI/kunci.txt" "$DUMP.age" | cmp -s - "$DUMP"'

echo "== Ubah data setelah backup (harus hilang setelah restore)"
sql "insert into categories (title, slug, \"order\", updated_at, created_at) values ('Penanda Uji', 'penanda-uji', 999, now(), now())" >/dev/null
docker run --rm -v "$FILES_VOLUME":/data alpine:3.24.4 sh -c 'f=$(find /data -type f | head -n 1); rm -f "$f"'
pastikan "data berubah sebelum restore" '[ "$(sql "select count(*) from categories")" = "$((kategori_awal + 1))" ] && [ "$(jumlah_berkas)" = "$((berkas_awal - 1))" ]'

echo "== Restore (scripts/restore.sh asli; konfirmasi nama stack lewat stdin)"
printf '%s\n' "$STACK" | ENV_FILE="$ENVF" BACKUP_DIR="$UJI/backups" bash scripts/restore.sh "$DUMP" --files "$TAR" 2>&1 | sed 's/^/  /'
"${COMPOSE[@]}" up -d --wait --wait-timeout 180 >/dev/null

echo "== Periksa hasil"
pastikan "jumlah kategori kembali ke kondisi backup" '[ "$(sql "select count(*) from categories")" = "$kategori_awal" ]'
pastikan "penanda uji tidak ada lagi" '[ "$(sql "select count(*) from categories where slug = '"'"'penanda-uji'"'"'")" = 0 ]'
pastikan "berkas di volume kembali lengkap" '[ "$(jumlah_berkas)" = "$berkas_awal" ]'
PRE_DB="$(sql_pg "select datname from pg_database where datname like '%_pre_%' order by datname desc limit 1")"
pastikan "DB lama disimpan ($PRE_DB) dan masih memuat penanda" '[ -n "$PRE_DB" ] && [ "$("${COMPOSE[@]}" exec -T -e DB="$PRE_DB" -e Q="select count(*) from categories where slug = '"'"'penanda-uji'"'"'" db sh -c '"'"'psql -U "$POSTGRES_USER" -d "$DB" -tAc "$Q"'"'"' | tr -d "\r")" = 1 ]'
pastikan "dump pengaman pre-restore terbentuk" '[ -n "$(ls "$UJI"/backups/pre-restore-*.dump 2>/dev/null)" ]'
pastikan "salinan pengaman berkas pre-restore terbentuk" '[ -s "$(ls "$UJI"/backups/pre-restore-files-*.tar.gz 2>/dev/null | head -n 1)" ]'
pastikan "app sehat lagi setelah restore" '[ "$(docker exec toko-uji-curl curl -s -o /dev/null -w "%{http_code}" -H "Host: toko.test" http://toko-uji-proxy/healthz)" = 200 ]'

rm -f "$UJI/kunci.txt"
echo
if [ "$gagal" -gt 0 ]; then echo "UJI BACKUP-RESTORE GAGAL: $gagal pemeriksaan"; exit 1; fi
echo "UJI BACKUP-RESTORE LULUS"
