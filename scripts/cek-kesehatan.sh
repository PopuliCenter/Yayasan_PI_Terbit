#!/usr/bin/env bash
# Cek berkala stack situs penerbit + dampak ke app lain di VPS.
# Pakai: bash scripts/cek-kesehatan.sh [--harian]
# Diadaptasi dari panduan deploy Lampiran B.6 (tanpa Redis: stack ini tidak memakainya).
set -uo pipefail
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"; cd "$APP_DIR" || exit 1
NAMA="$(basename "$APP_DIR")"
CONF="/root/.config/toko-backup/$NAMA.env"; [ -f "$CONF" ] && . "$CONF"
[ -f /root/toko-ops.sh ] && . /root/toko-ops.sh > /dev/null
BACKUP_DIR="/var/backups/$NAMA"
EDGE_NAME="${EDGE:-survey-populicenter-nginx-1}"
masalah=()

# Disk
pakai=$(df --output=pcent / | tail -1 | tr -dc '0-9'); [ "$pakai" -ge 85 ] && masalah+=("disk ${pakai}%")

# Container stack ini: OOM dan health
for c in $(docker compose ps -q); do
  n=$(docker inspect -f '{{.Name}}' "$c")
  [ "$(docker inspect -f '{{.State.OOMKilled}}' "$c")" = "true" ] && masalah+=("OOM $n")
  h=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{end}}' "$c")
  [ -n "$h" ] && [ "$h" != "healthy" ] && masalah+=("$n $h")
done

# Umur backup terakhir
[ -z "$(find "$BACKUP_DIR" -maxdepth 1 -name 'db-*.dump' -mmin -"${BACKUP_MAX_MENIT:-1500}" 2>/dev/null | head -1)" ] \
  && masalah+=("backup terakhir > ${BACKUP_MAX_MENIT:-1500} menit")

# Dampak ke app lain: edge dan domain lain
e=$(docker inspect -f '{{.State.Status}} {{.RestartCount}}' "$EDGE_NAME" 2>/dev/null)
[ "${e%% *}" = running ] || masalah+=("edge: ${e:-tidak ada}")
[ "${e##* }" != "$(cat /root/edge-restart.txt 2>/dev/null || echo "${e##* }")" ] && masalah+=("edge restart ${e##* }")
[ -n "$e" ] && echo "${e##* }" > /root/edge-restart.txt
lp=$(docker inspect -f '{{.LogPath}}' "$EDGE_NAME" 2>/dev/null)
[ -n "$lp" ] && [ -f "$lp" ] && [ "$(du -m "$lp" | cut -f1)" -gt 500 ] && masalah+=("log edge > 500 MB")
if command -v cek_domain >/dev/null && [ -f /root/cek-domain-baseline.txt ]; then
  cek_domain | diff -q /root/cek-domain-baseline.txt - >/dev/null || masalah+=("domain lain berubah (bandingkan cek_domain)")
fi

# Harian: daftar IP Cloudflare dan masa berlaku origin cert
if [ "${1:-}" = "--harian" ]; then
  { curl -fsS https://www.cloudflare.com/ips-v4; echo; curl -fsS https://www.cloudflare.com/ips-v6; echo; } \
    | sed '/^$/d' | sort | diff -q - /root/cf-ips.txt >/dev/null || masalah+=("daftar IP Cloudflare berubah: render_vhost + panduan §7.6")
  if [ -n "${D:-}" ] && [ -f "/etc/toko-buku/edge/$D.pem" ]; then
    openssl x509 -checkend $((30 * 24 * 3600)) -noout -in "/etc/toko-buku/edge/$D.pem" >/dev/null \
      || masalah+=("origin cert habis < 30 hari")
  fi
fi

if [ ${#masalah[@]} -gt 0 ]; then
  echo "[$(date '+%F %T')] MASALAH: ${masalah[*]}"
  [ -n "${ALERT_URL:-}" ] && curl -fsS -m 10 -X POST --data "$NAMA: ${masalah[*]}" "$ALERT_URL" > /dev/null || true
else
  echo "[$(date '+%F %T')] OK"
fi
