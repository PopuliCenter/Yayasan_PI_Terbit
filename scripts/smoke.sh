#!/usr/bin/env bash
# Uji integrasi stack lengkap (CI dan laptop). JANGAN dijalankan di VPS.
#
#   IMAGE_REPO=toko-lokal IMAGE_TAG=uji bash scripts/smoke.sh
#   SMOKE_KEEP=1 ...  → stack dibiarkan hidup (untuk scripts/uji-backup-restore.sh), bersihkan
#                       dengan: bash scripts/smoke.sh --bersihkan
#
# Yang dibuktikan: migrasi berjalan di Postgres kosong; aturan akses toko-proxy per host;
# gerbang admin gagal tertutup; realip dari network web; header keamanan; varian staging
# (basic auth + noindex); pemeriksaan konfigurasi saat start; compose tanpa port host.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
IMAGE_REPO="${IMAGE_REPO:-toko-lokal}"
IMAGE_TAG="${IMAGE_TAG:-uji}"
STACK=toko-uji
PROXY=toko-uji-proxy
CURL_IMAGE=curlimages/curl:8.23.0
HTTPD_IMAGE=httpd:2.4.69-alpine3.24
PUB=toko.test
ADM=admin.toko.test
UJI="$ROOT/.uji"
ENVF="$UJI/uji.env"
COMPOSE=(docker compose --env-file "$ENVF")

bersihkan() ( # subshell: "set +e" di sini tidak mematikan errexit skrip pemanggil
  set +e
  docker rm -f toko-uji-curl toko-uji-guard >/dev/null 2>&1
  [ -f "$ENVF" ] && "${COMPOSE[@]}" --profile tools down --remove-orphans >/dev/null 2>&1
  docker volume rm "$STACK"_db_data "$STACK"_files >/dev/null 2>&1
  if [ -f "$UJI/web-dibuat" ]; then docker network rm web >/dev/null 2>&1; fi
  [ -f "$UJI/htpasswd-dibuat" ] && rm -rf "$ROOT/staging"
  rm -rf "$UJI"
  echo "Stack uji dibersihkan."
)
if [ "${1:-}" = "--bersihkan" ]; then bersihkan; exit 0; fi

# Pengaman: VPS punya edge app lama. Uji ini membuat/menghapus network & volume.
if docker inspect survey-populicenter-nginx-1 >/dev/null 2>&1; then
  echo "DITOLAK: edge VPS terdeteksi. smoke.sh hanya untuk CI dan laptop." >&2; exit 1
fi

# Sisa uji sebelumnya (mis. SMOKE_KEEP=1 yang belum dibersihkan) dibersihkan dulu.
[ -f "$ENVF" ] && bersihkan >/dev/null
[ "${SMOKE_KEEP:-0}" = 1 ] || trap bersihkan EXIT
mkdir -p "$UJI"

if ! docker network inspect web >/dev/null 2>&1; then
  docker network create web >/dev/null && touch "$UJI/web-dibuat"
fi
SUBNET="$(docker network inspect web --format '{{range .IPAM.Config}}{{.Subnet}}{{end}}')"

rnd() { openssl rand -hex 32; }
cat > "$ENVF" <<EOF
STACK_NAME=$STACK
PROXY_CONTAINER_NAME=$PROXY
ADMIN_HOST=$ADM
IMAGE_REPO=$IMAGE_REPO
IMAGE_TAG=$IMAGE_TAG
WEB_SUBNET=$SUBNET
DB_VOLUME=${STACK}_db_data
FILES_VOLUME=${STACK}_files
DB_NAME=toko
DB_USER=toko
DB_PASSWORD=$(rnd)
PAYLOAD_SECRET=$(rnd)
PUBLIC_BASE_URL=https://$PUB
ADMIN_BASE_URL=https://$ADM
SITE_INDEXABLE=false
CF_ACCESS_TEAM_DOMAIN=
CF_ACCESS_AUD=
EOF

echo "== Compose: validasi aturan panduan (N1, N2, W12)"
cfg="$("${COMPOSE[@]}" config)"
if grep -q 'published:' <<<"$cfg"; then echo "GAGAL: ada port host di compose" >&2; exit 1; fi
[ "$(grep -c 'container_name:' <<<"$cfg")" = 1 ] || { echo "GAGAL: container_name selain proxy" >&2; exit 1; }
echo "  OK   tanpa port host; hanya proxy ber-container_name"

echo "== Naikkan stack"
docker volume create "${STACK}_db_data" >/dev/null
docker volume create "${STACK}_files" >/dev/null
"${COMPOSE[@]}" up -d db
"${COMPOSE[@]}" run --rm migrate
"${COMPOSE[@]}" run --rm migrate npx --no-install payload migrate:status | tail -n 4
"${COMPOSE[@]}" run --rm migrate npm run --silent seed 2>&1 | grep '\[seed\]' | tail -n 3
"${COMPOSE[@]}" up -d --wait --wait-timeout 180
"${COMPOSE[@]}" ps --format 'table {{.Service}}\t{{.Status}}'

docker run -d --name toko-uji-curl --network web --entrypoint sleep "$CURL_IMAGE" 900 >/dev/null
kurl() { docker exec toko-uji-curl curl -s --max-time 30 "$@"; }
# Output selalu ditampung dulu, baru di-grep: `cmd | grep -q` di bawah pipefail bisa
# gagal palsu karena cmd mati SIGPIPE setelah grep keluar di kecocokan pertama.
cocok() { grep -qiE -- "$1" <<<"$2"; }

gagal=0
cek() { # deskripsi kode_harapan metode host path [argumen curl tambahan...]
  local desc="$1" exp="$2" method="$3" host="$4" path="$5"; shift 5
  local m=(-X "$method"); [ "$method" = HEAD ] && m=(-I)   # -X HEAD membuat curl menunggu body
  local got; got="$(kurl -o /dev/null -w '%{http_code}' "${m[@]}" -H "Host: $host" "$@" "http://$PROXY$path")" || true
  if [ "$got" = "$exp" ]; then printf '  OK   %-58s %s\n' "$desc" "$got"
  else printf '  GAGAL %-57s harap %s, dapat %s\n' "$desc" "$exp" "$got"; gagal=$((gagal + 1)); fi
}
isi() { # deskripsi pola host path
  local desc="$1" pola="$2" host="$3" path="$4"
  local body; body="$(kurl -H "Host: $host" "http://$PROXY$path")" || true
  if cocok "$pola" "$body"; then printf '  OK   %s\n' "$desc"
  else printf '  GAGAL %s (pola: %s)\n' "$desc" "$pola"; gagal=$((gagal + 1)); fi
}
header() { # deskripsi pola host path
  local desc="$1" pola="$2" host="$3" path="$4"
  local hdr; hdr="$(kurl -o /dev/null -D - -H "Host: $host" "http://$PROXY$path")" || true
  if cocok "$pola" "$hdr"; then printf '  OK   %s\n' "$desc"
  else printf '  GAGAL %s (pola: %s)\n' "$desc" "$pola"; gagal=$((gagal + 1)); fi
}

COVER="$("${COMPOSE[@]}" exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "select filename from media order by id limit 1"' | tr -d '\r')"
BOOK_ID="$("${COMPOSE[@]}" exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "select id from books order by id limit 1"' | tr -d '\r')"

echo "== Host publik ($PUB)"
cek "/nginx-health"                                    200 GET  "$PUB" /nginx-health
cek "/healthz (app + DB)"                              200 GET  "$PUB" /healthz
cek "beranda"                                          200 GET  "$PUB" /
cek "katalog + pencarian salah ketik"                  200 GET  "$PUB" "/buku?q=pemlih"
cek "detail buku"                                      200 GET  "$PUB" /buku/membaca-suara-pemilih
cek "buku tidak ada → 404 asli"                        404 GET  "$PUB" /buku/tidak-ada
cek "/admin ditutup di apex"                           404 GET  "$PUB" /admin
cek "/admin/login ditutup di apex"                     404 GET  "$PUB" /admin/login
cek "/api/users ditutup di apex"                       404 GET  "$PUB" /api/users
cek "/api/globals/settings ditutup di apex"            404 GET  "$PUB" /api/globals/settings
cek "/api/private-files ditutup di apex"               404 GET  "$PUB" /api/private-files/file/x.png
cek "/internal/access-check ditutup di apex"           404 GET  "$PUB" /internal/access-check
cek "/pratinjau ditutup di apex"                       404 GET  "$PUB" /pratinjau
cek "/pratinjau/mulai ditutup di apex"                 404 GET  "$PUB" /pratinjau/mulai
# Aplikasi juga menjawab 404, jadi kode saja tidak membuktikan aturan toko-proxy. Halaman 404
# bawaan nginx (template tanpa error_page 404) hanya bisa datang dari proxy; pola cocok
# dengan atau tanpa server_tokens (<center>nginx/x.y</center> atau <center>nginx</center>).
isi "/pratinjau diblokir proxy (bukan app)"            '<center>nginx'                "$PUB" /pratinjau
isi "/pratinjau/mulai diblokir proxy (bukan app)"      '<center>nginx'                "$PUB" /pratinjau/mulai
cek "/api/laporan ditutup di apex"                     404 GET  "$PUB" /api/laporan/minat-per-judul
cek "/api/redirects ditutup di apex"                   404 GET  "$PUB" /api/redirects
cek "/api/form-submissions ditutup di apex"            404 POST "$PUB" /api/form-submissions
cek "favicon admin"                                    200 GET  "$PUB" /brand/ypi-mark.svg
cek "templat impor"                                    200 GET  "$PUB" /templat/impor-buku.csv
cek "sampul publik GET"                                200 GET  "$PUB" "/api/media/file/$COVER"
cek "sampul publik HEAD"                               200 HEAD "$PUB" "/api/media/file/$COVER"
cek "sampul publik POST ditolak"                       403 POST "$PUB" "/api/media/file/$COVER"
cek "/klik mencatat klik order"                        204 POST "$PUB" /klik -H 'Content-Type: application/json' --data "{\"b\":$BOOK_ID,\"t\":\"wa\",\"path\":\"/buku/x\"}"
isi "beranda memuat nama penerbit"                     "Penerbit"                     "$PUB" /
# Slug yang hanya diawali kata "pratinjau" bukan alamat sistem: harus sampai ke aplikasi
# (halaman 404 aplikasi), bukan diblokir proxy (404 bawaan nginx).
isi "/pratinjau-x sampai ke aplikasi"                  "Halaman tidak ditemukan"      "$PUB" /pratinjau-x
isi "detail buku memuat JSON-LD Book"                  '"@type":\["Book","Product"\]' "$PUB" /buku/membaca-suara-pemilih
isi "canonical memakai SITE_URL runtime"               "https://$PUB/buku/membaca-suara-pemilih" "$PUB" /buku/membaca-suara-pemilih
isi "non-produksi: meta noindex"                       'name="robots" content="noindex' "$PUB" /
isi "non-produksi: robots.txt Disallow semua"          '^Disallow: /$'               "$PUB" /robots.txt
header "header X-Content-Type-Options"                 '^x-content-type-options: nosniff' "$PUB" /
hdr="$(kurl -o /dev/null -D - -H "Host: $PUB" "http://$PROXY/")" || true
if cocok '^x-powered-by' "$hdr"; then echo "  GAGAL header X-Powered-By masih ada"; gagal=$((gagal + 1))
else echo "  OK   tanpa header X-Powered-By"; fi

echo "== Host admin ($ADM) — CF_ACCESS kosong: harus gagal tertutup"
cek "/ dialihkan ke /admin"                            302 GET "$ADM" /
cek "/admin tanpa JWT"                                 401 GET "$ADM" /admin
cek "/api/users tanpa JWT"                             401 GET "$ADM" /api/users
cek "/api/laporan tanpa JWT"                           401 GET "$ADM" /api/laporan/pesanan-per-judul
cek "/admin dengan JWT palsu"                          401 GET "$ADM" /admin -H 'Cf-Access-Jwt-Assertion: eyJhbGciOiJub25lIn0.e30.'
cek "/internal/ tetap 404 di host admin"               404 GET "$ADM" /internal/access-check
# Permintaan data Next.js (router.refresh di pratinjau, navigasi admin) membawa header RSC.
# Header itu tidak boleh ikut ke subrequest auth: Next membalas 307 di sana, auth_request
# menjadikannya 500, dan iframe pratinjau dimuat ulang tanpa henti.
RSC_HDR=(-H 'RSC: 1' -H 'Next-Router-State-Tree: %5B%22%22%2C%7B%7D%5D')
cek "/admin data RSC: tetap 401, bukan 500"            401 GET "$ADM" "/admin?_rsc=uji" "${RSC_HDR[@]}"
cek "/pratinjau data RSC: tetap 401, bukan 500"        401 GET "$ADM" "/pratinjau/beranda?_rsc=uji" "${RSC_HDR[@]}"
cek "/nginx-health host admin"                         200 GET "$ADM" /nginx-health
header "redirect admin relatif (bukan http://)"        '^location: /admin' "$ADM" /
header "host admin: CDN-Cache-Control no-store"        '^cdn-cache-control: no-store' "$ADM" /admin
header "host admin: X-Robots-Tag noindex"              '^x-robots-tag: noindex' "$ADM" /admin

echo "== Rantai IP klien (realip dari network web)"
kurl -o /dev/null -H "Host: $PUB" -H 'X-Forwarded-For: 203.0.113.77' "http://$PROXY/kontak"
sleep 1
log_proxy="$(docker logs --since 30s "$PROXY" 2>&1)"
if grep -q '^203\.0\.113\.77 ' <<<"$log_proxy"; then echo "  OK   proxy mencatat IP klien dari X-Forwarded-For edge"
else echo "  GAGAL proxy tidak mencatat IP klien asli"; gagal=$((gagal + 1)); fi
kurl -o /dev/null -H "Host: $PUB" "http://$PROXY/berhenti-langganan?token=rahasia123abc"
sleep 1
log_proxy="$(docker logs --since 30s "$PROXY" 2>&1)"
if grep -q 'rahasia123abc' <<<"$log_proxy"; then echo "  GAGAL token query tercatat di log proxy"; gagal=$((gagal + 1))
else echo "  OK   token ?token= disamarkan di log proxy"; fi

echo "== Pemeriksaan konfigurasi saat start"
set +e
timeout 60 docker run --name toko-uji-guard --rm --network none \
  -e NODE_ENV=production -e STACK_NAME=toko-staging -e SITE_INDEXABLE=true \
  -e PAYLOAD_SECRET="$(rnd)" -e DATABASE_ADAPTER=postgres -e DATABASE_URL=postgres://x:y@db:5432/z \
  -e SITE_URL=https://staging.toko.test -e ADMIN_BASE_URL=https://staging-admin.toko.test \
  "$IMAGE_REPO/toko-app:$IMAGE_TAG" > "$UJI/guard.log" 2>&1
kode=$?
set -e
docker rm -f toko-uji-guard >/dev/null 2>&1 || true
if [ "$kode" != 0 ] && [ "$kode" != 124 ] && grep -q "SITE_INDEXABLE=true" "$UJI/guard.log"; then
  echo "  OK   app menolak start: staging + SITE_INDEXABLE=true (exit $kode)"
else echo "  GAGAL app tidak menolak konfigurasi staging yang bisa diindeks (exit $kode)"; gagal=$((gagal + 1)); fi

echo "== Varian staging (basic auth + noindex di toko-proxy)"
if [ ! -f "$ROOT/staging/htpasswd" ]; then
  mkdir -p "$ROOT/staging" && touch "$UJI/htpasswd-dibuat"
  printf '%s\n' "uji-rahasia" | docker run --rm -i "$HTTPD_IMAGE" htpasswd -niB penguji > "$ROOT/staging/htpasswd"
fi
STAGING=(docker compose --env-file "$ENVF" -f docker-compose.yml -f docker-compose.staging.yml)
"${STAGING[@]}" up -d --wait --wait-timeout 180 toko_proxy app >/dev/null
cek "staging: / tanpa auth"                            401 GET "$PUB" /
cek "staging: /healthz tetap terbuka (monitor)"       200 GET "$PUB" /healthz
cek "staging: / dengan basic auth"                     200 GET "$PUB" / -u penguji:uji-rahasia
header "staging: header X-Robots-Tag noindex"          '^x-robots-tag: noindex' "$PUB" /healthz
cek "staging: host admin tetap wajib JWT"              401 GET "$ADM" /admin
"${COMPOSE[@]}" -f docker-compose.yml up -d --wait --wait-timeout 180 toko_proxy app >/dev/null

echo
if [ "$gagal" -gt 0 ]; then echo "SMOKE GAGAL: $gagal pemeriksaan gagal"; exit 1; fi
echo "SMOKE LULUS"
if [ "${SMOKE_KEEP:-0}" = 1 ]; then echo "Stack dibiarkan hidup (env: $ENVF). Bersihkan: bash scripts/smoke.sh --bersihkan"; fi
