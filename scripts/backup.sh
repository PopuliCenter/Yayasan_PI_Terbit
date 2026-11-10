#!/usr/bin/env bash
# Backup DB + volume berkas (sampul & berkas privat) stack TEMPAT skrip ini berada.
# Pakai di VPS:  bash scripts/backup.sh
#
# Diadaptasi dari panduan deploy Lampiran B.4:
# - kunci publik age dicek di AWAL (gagal sebelum ada dump plaintext tanpa salinan terenkripsi),
# - dump ditulis ke .partial dulu, dicek ukuran + header, baru di-rename,
# - retensi lewat trap EXIT + flock (run tidak tumpang tindih, gagal di tengah tidak menumpuk),
# - offsite lewat rclone, heartbeat setelah sukses, ALERT_URL saat gagal.
# Semua path bisa ditimpa env (dipakai uji CI); bawaan = tata letak VPS panduan §6.1.
set -euo pipefail
umask 077

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"; cd "$APP_DIR"
NAMA="$(basename "$APP_DIR")"                                   # toko-buku / toko-buku-staging
CONF="${BACKUP_CONF:-/root/.config/toko-backup/$NAMA.env}"; [ -f "$CONF" ] && . "$CONF"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/$NAMA}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
AGE_RECIPIENTS="${AGE_RECIPIENTS:-/root/.config/toko-backup/recipients.txt}"   # kunci PUBLIK saja
LOCK_DIR="${LOCK_DIR:-/var/lock}"
ALPINE_IMAGE="alpine:3.24.4"
ENV_FILE="${ENV_FILE:-.env}"
COMPOSE=(docker compose --env-file "$ENV_FILE")
FILES_VOLUME="$(grep -E '^FILES_VOLUME=' "$ENV_FILE" | cut -d= -f2 | sed 's/[[:space:]]*#.*$//')"
TS="$(date -u +%Y%m%d-%H%M%S)"                                   # UTC; nama berkas terurut

exec 9>"$LOCK_DIR/$NAMA-backup.lock"; flock -n 9 || { echo "Backup lain masih jalan"; exit 0; }

retensi() {
  [ -d "$BACKUP_DIR" ] || return 0
  find "$BACKUP_DIR" -maxdepth 1 \( -name 'db-*.dump*' -o -name 'files-*.tar.gz*' -o -name 'pre-restore-*' \) \
    -mtime +"$RETENTION_DAYS" -delete
  find "$BACKUP_DIR" -maxdepth 1 -name '*.partial' -mmin +60 -delete
}

# Satu trap EXIT untuk SEMUA jalur keluar: `exit 1` eksplisit tidak memicu trap ERR,
# jadi alarm dipasang di sini agar kegagalan apa pun (termasuk age belum siap atau
# dump terlalu kecil) memanggil ALERT_URL. Heartbeat hanya dikirim saat sukses.
selesai() {
  local kode=$?
  retensi || true
  if [ "$kode" -ne 0 ]; then
    echo "[$(date '+%F %T')] BACKUP GAGAL $NAMA (exit $kode)" >&2
    [ -n "${ALERT_URL:-}" ] && curl -fsS -m 10 -X POST --data "backup $NAMA GAGAL (exit $kode)" "$ALERT_URL" >/dev/null || true
  fi
}
trap selesai EXIT

command -v age >/dev/null && [ -s "$AGE_RECIPIENTS" ] || { echo "GAGAL: age/recipients belum siap ($AGE_RECIPIENTS)" >&2; exit 1; }
mkdir -p "$BACKUP_DIR"
echo "[$(date '+%F %T')] Mulai backup $NAMA → $BACKUP_DIR"

# 1) Database
TMP="$BACKUP_DIR/db-$TS.dump.partial"
"${COMPOSE[@]}" exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -F c' > "$TMP"
[ "$(stat -c%s "$TMP")" -gt 1024 ] || { echo "GAGAL: dump terlalu kecil" >&2; exit 1; }
"${COMPOSE[@]}" exec -T db pg_restore -l < "$TMP" > /dev/null   # hanya header/TOC; bukti isi = uji restore
mv "$TMP" "$BACKUP_DIR/db-$TS.dump"
OUT=("$BACKUP_DIR/db-$TS.dump")

# 2) Berkas (sampul + bukti transfer). Volume dibaca read-only.
if [ -n "$FILES_VOLUME" ] && docker volume inspect "$FILES_VOLUME" >/dev/null 2>&1; then
  docker run --rm -v "$FILES_VOLUME":/data:ro "$ALPINE_IMAGE" tar czf - -C /data . > "$BACKUP_DIR/files-$TS.tar.gz.partial"
  mv "$BACKUP_DIR/files-$TS.tar.gz.partial" "$BACKUP_DIR/files-$TS.tar.gz"
  OUT+=("$BACKUP_DIR/files-$TS.tar.gz")
fi

# 3) Enkripsi (kunci publik) lalu kirim offsite
for f in "${OUT[@]}"; do age -R "$AGE_RECIPIENTS" -o "$f.age" "$f"; done
if [ -n "${RCLONE_DEST:-}" ]; then
  rclone copy "$BACKUP_DIR" "$RCLONE_DEST" --include "*-$TS.*.age"
else
  echo "PERINGATAN: RCLONE_DEST kosong — backup hanya di VPS ini (jangan untuk produksi)" >&2
fi

[ -n "${HEARTBEAT_URL:-}" ] && curl -fsS -m 10 "$HEARTBEAT_URL" > /dev/null || true
echo "[$(date '+%F %T')] Selesai: ${OUT[*]}"
