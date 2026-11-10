#!/usr/bin/env bash
# Pulihkan DB stack TEMPAT skrip ini berada ke database BARU; DB lama disimpan sebagai <db>_pre_<TS>.
# Pakai: bash scripts/restore.sh <db-TS.dump> [--files <files-TS.tar.gz>]
#
# Diadaptasi dari panduan deploy Lampiran B.5. `pg_restore --clean` tidak menghapus objek
# yang dibuat setelah dump, jadi restore selalu ke database baru.
# Dump terenkripsi dibuka dulu di mesin pemegang kunci privat:
#   age -d -i toko-backup.key db-<TS>.dump.age > db-<TS>.dump
set -euo pipefail
umask 077

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"; cd "$APP_DIR"
ENV_FILE="${ENV_FILE:-.env}"
COMPOSE=(docker compose --env-file "$ENV_FILE")
val() { grep -E "^$1=" "$ENV_FILE" | cut -d= -f2 | sed 's/[[:space:]]*#.*$//'; }
STACK="$(val STACK_NAME)"
DBN="$(val DB_NAME)"
FILES_VOLUME="$(val FILES_VOLUME)"
ALPINE_IMAGE="alpine:3.24.4"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/$(basename "$APP_DIR")}"

FILE="${1:?Pakai: restore.sh <db-TS.dump> [--files <files-TS.tar.gz>]}"; shift
FILES_TAR=""; [ "${1:-}" = "--files" ] && FILES_TAR="${2:?berkas --files}"
[ -f "$FILE" ] || { echo "Tidak ada: $FILE" >&2; exit 1; }
[ -z "$FILES_TAR" ] || [ -f "$FILES_TAR" ] || { echo "Tidak ada: $FILES_TAR" >&2; exit 1; }
case "$FILE" in *.age) echo "Dump masih terenkripsi. Buka dulu dengan age -d (lihat kepala skrip)." >&2; exit 1;; esac
"${COMPOSE[@]}" exec -T db pg_restore -l < "$FILE" > /dev/null    # dump bisa dibaca?

# Arsip berkas divalidasi SEBELUM konfirmasi dan sebelum apa pun dihapus.
if [ -n "$FILES_TAR" ]; then
  case "$FILES_TAR" in *.age) echo "Arsip berkas masih terenkripsi. Buka dulu: age -d -i toko-backup.key files-TS.tar.gz.age > files-TS.tar.gz" >&2; exit 1;; esac
  gzip -t "$FILES_TAR" || { echo "Arsip berkas rusak (gzip): $FILES_TAR" >&2; exit 1; }
  tar tzf "$FILES_TAR" > /dev/null || { echo "Arsip berkas rusak (tar): $FILES_TAR" >&2; exit 1; }
  [ -n "$FILES_VOLUME" ] && docker volume inspect "$FILES_VOLUME" > /dev/null || { echo "Volume berkas tidak ada: $FILES_VOLUME" >&2; exit 1; }
fi

printf 'Stack %s (%s) akan DIGANTI datanya. Ketik nama stack untuk lanjut: ' "$STACK" "$APP_DIR"; read -r ans
[ "$ans" = "$STACK" ] || { echo "Dibatalkan"; exit 1; }

TS="$(date -u +%Y%m%d%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "Menghentikan app (penulis data). toko-proxy menampilkan halaman pemeliharaan."
"${COMPOSE[@]}" stop app
"${COMPOSE[@]}" exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -F c' > "$BACKUP_DIR/pre-restore-$TS.dump"
echo "Dump pengaman: $BACKUP_DIR/pre-restore-$TS.dump"

"${COMPOSE[@]}" exec -T -e TS="$TS" db sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d postgres \
  -c "ALTER DATABASE \"$POSTGRES_DB\" RENAME TO \"${POSTGRES_DB}_pre_$TS\"" \
  -c "CREATE DATABASE \"$POSTGRES_DB\" OWNER \"$POSTGRES_USER\""'
"${COMPOSE[@]}" exec -T db sh -c \
  'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --single-transaction --exit-on-error' < "$FILE"

if [ -n "$FILES_TAR" ]; then
  # Salinan pengaman isi volume saat ini (berkas yang diunggah setelah backup tidak hilang permanen).
  docker run --rm -v "$FILES_VOLUME":/data:ro "$ALPINE_IMAGE" tar czf - -C /data . > "$BACKUP_DIR/pre-restore-files-$TS.tar.gz"
  echo "Salinan pengaman berkas: $BACKUP_DIR/pre-restore-files-$TS.tar.gz"
  # find -delete, bukan rm -rf /data/*: yang terakhir melewatkan dotfile.
  docker run --rm -i -v "$FILES_VOLUME":/data "$ALPINE_IMAGE" \
    sh -c 'find /data -mindepth 1 -delete && tar xzf - -C /data && chown -R 1001:1001 /data' < "$FILES_TAR"
fi
echo "Selesai. DB lama: ${DBN}_pre_$TS (hapus manual setelah yakin; cek disk dulu)."
echo "Naikkan lagi: docker compose up -d"
