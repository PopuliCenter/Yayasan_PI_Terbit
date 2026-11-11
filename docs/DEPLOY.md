# Runbook deploy — Situs Penerbit (mode sederhana)

Dokumen ini melengkapi **`panduan-deploy-toko-buku-vps.md`** (selanjutnya: *panduan*), yang tetap menjadi acuan utama untuk aturan VPS, edge nginx bersama, Cloudflare, backup, dan checklist. Panduan ditulis untuk toko penuh Vendure; §15.2 panduan meminta bagian stack ditulis ulang bila mesin toko berubah. Dokumen ini adalah penulisan ulang itu untuk **Next.js 16 + Payload 3 (satu aplikasi) + Postgres**, tanpa pembayaran online, ongkir, Redis, worker, maupun webhook.

> Panduan memuat peta VPS dan tidak di-commit (`.gitignore`). Simpan privat. Repo ini juga harus **privat** (panduan N21).

**Yang tetap berlaku utuh dari panduan:** §0 (cara kerja, label, aturan sesi AI), §1 (arsitektur edge), §2 (aturan emas N1–N22, W1–W16), §3 (alat bantu `/root/toko-ops.sh` dan cek baca-saja), §4 (Cloudflare), §7 (vhost edge, jam sepi, rollback edge), §13 (troubleshooting), §14 (checklist, dengan penyesuaian di bawah).

---

## 1. Apa yang berubah dari panduan

| Panduan (Vendure) | Stack ini | Bagian panduan yang terdampak |
|---|---|---|
| Image `toko-server`, `toko-storefront`, `toko-proxy` | Image `toko-app` (Next standalone, non-root), `toko-migrate` (CLI Payload), `toko-proxy` | §5, §8.2, §9.2, Lampiran B.1 |
| Postgres + Redis + server + worker + storefront | Postgres + app + toko-proxy | §6.4, §6.5, §11, §12 |
| Admin Vendure di `admin.<domain>` | Panel Payload `/admin` + REST `/api` **hanya** di `admin.<domain>`; di apex keduanya 404, kecuali `GET /api/media/file/*` (sampul publik) | §8.6, §8.7, §8.11 |
| JWT Access divalidasi `server:/internal/access-check` | Sama: route Next `/internal/access-check` (lib `jose`), dipanggil `auth_request` toko-proxy; gagal tertutup bila env kosong | §8.7, Lampiran C |
| `SUPERADMIN_USERNAME/PASSWORD` di `.env`; uji (c) kredensial bawaan Vendure | Tidak ada sandi admin di `.env`. Pengguna pertama dibuat lewat `/admin` (di balik Access+MFA) dan **otomatis super admin** | §6.6, §8.7 (c), §14 |
| `NEXT_PUBLIC_*` sebagai GitHub Variables | **Tidak ada `NEXT_PUBLIC_*`.** URL situs, indeks, Turnstile dibaca runtime → satu image untuk staging dan produksi | §5.3, §8.2 (b) |
| Webhook Midtrans/Biteship + aturan WAF/BIC | Tidak ada webhook. Aturan §4.4 untuk `/webhooks/*` **tidak perlu** | §4.4, §8.9, §8.13 |
| Volume `db_data`, `redis_data`, `files` | `db_data`, `files` (sampul + bukti transfer) | §6.6, §6.7, §8.4 |
| `MIDTRANS_IS_PRODUCTION` sebagai penjaga isolasi | `SITE_INDEXABLE`: app **menolak start** bila `STACK_NAME` memuat `staging` dan `SITE_INDEXABLE=true` | §10.2 |
| `migrate` = `node dist/migrate.js` | `migrate` = `npx payload migrate` (image `toko-migrate`, profile `tools`) | §6.4, §8.4, §9.2 |
| Storefront `/healthz` → server `/health` | `/healthz` diteruskan toko-proxy ke app (cek app + query DB) | §8.6, §12 |

Total `mem_limit` produksi: db 512 MB + app 768 MB + proxy 64 MB ≈ **1,35 GB** (+ migrate 512 MB sesaat). Staging: ≈ 0,83 GB. Jauh di bawah perkiraan panduan (±3 GB).

### Fakta VPS terbaru (dari user, 9 Nov 2026) vs panduan §1.1

Panduan §0.3 no. 7: bila VPS berbeda dari dokumen, **percayai VPS**.

| Hal | Panduan §1.1 | Hasil `free -h` / `df -h` user |
|---|---|---|
| RAM | 8 GB (KVM 2) | **31 GiB** total, 29 GiB available |
| Disk | 96 GB, 74% (Juli 2026) | **387 GB, 4%** terpakai |
| Swap | — | **0 B** (panduan §3.4: buat swap 2 GB) |
| Container | — | 18; `wa_*` **tanpa mem_limit** (tampil 31,34 GiB) |
| vCPU | ≈ 2 | belum dicek (`nproc`) |

Perbarui panduan §1.1 dengan angka ini setelah §3.3 dijalankan ulang.

### Koreksi untuk panduan (ditemukan saat menyiapkan repo ini)

1. **`.gitignore` panduan (§5.1 dan Lampiran B.7) berisi `staging/`.** Tanpa garis miring di depan, git mencocokkannya di tingkat mana pun, jadi `deploy/staging/staging-extra.conf` ikut diabaikan dan tidak pernah masuk repo. Akibatnya bind mount staging membuat direktori kosong, nginx gagal start, dan CI e2e merah. Repo ini memakai `/staging/` (hanya folder `htpasswd` di root).
2. Komentar sebaris pada contoh `.env` (§6.6) membuat perintah `grep … | cut -d= -f2` di §8.4 dan §9.2 ikut membaca komentarnya. Repo ini menaruh setiap komentar `.env.example` di baris sendiri.
3. **`render_vhost` di `/root/toko-ops.sh` (§3.2) memakai `#` sebagai pemisah `sed` sekaligus di dalam teks pengganti** (`s#.*#    &/32 1;   # gateway Docker…#`). Akibatnya sed gagal ("unknown option to `s'"), `host-gw.txt` kosong, tetapi fungsi tetap mencetak `OK … 0 gateway`. Vhost lalu tidak mengizinkan gateway Docker, dan semua uji dari host (`curl --resolve …127.0.0.1`) dibalas 403. Perbaikan: pemisah `|` (`s|.*|    &/32 1;   # gateway Docker: uji dari host|`), ditambah cek `[ -s /root/host-gw.txt ] || return 1`. Terjadi nyata di VPS 11 Nov 2026.

---

## 2. Isi repo

```
web/                         Aplikasi Next.js + Payload (lihat web/README.md)
  Dockerfile                 target app & migrate (node:24.22.2-alpine3.24)
  src/migrations/            migrasi Postgres (dibuat `npm run migrate:create`)
deploy/proxy/                image toko-proxy (nginx:1.30.6-alpine3.24)
deploy/edge/toko-edge.conf.template   vhost edge (dirender `render_vhost`, panduan §7.2)
deploy/staging/staging-extra.conf     basic auth + noindex staging
docker-compose.yml           produksi DAN staging
docker-compose.staging.yml   tambahan khusus staging (via COMPOSE_FILE)
.env.example                 nama variabel stack (tanpa nilai rahasia)
scripts/backup.sh            backup DB + volume berkas, terenkripsi age, offsite rclone
scripts/restore.sh           restore ke DB BARU, DB lama disimpan
scripts/cek-kesehatan.sh     cek berkala (cron) + dampak ke app lain
scripts/audit-gate.mjs       gerbang npm audit (high/critical) + audit-allowlist.json
scripts/smoke.sh             uji integrasi stack lengkap (CI & laptop; menolak jalan di VPS)
scripts/uji-backup-restore.sh  uji roundtrip backup → restore memakai skrip asli
.github/workflows/ci.yml     lint, test, audit, e2e, publish GHCR
```

---

## 3. Sebelum mulai: jawaban yang dibutuhkan (panduan §0.6)

Sesi AI **tidak boleh** mengubah apa pun di VPS sebelum ini dijawab dan hasil §3.3 panduan ditempel. Yang sudah diketahui diberi tanda ✓.

| # | Pertanyaan | Status |
|---|---|---|
| 1 | Domain final + registrar (PRD keputusan no. 1) | belum |
| 2 | Repo GitHub (URL, privat), pemilik GHCR, image GHCR publik/privat | belum (repo belum dibuat) |
| 3 | Cara login VPS; OS/terminal laptop | ✓ root di `root@apps`; laptop Windows (PowerShell/Git Bash) |
| 4 | Jam sepi WIB + siapa diberi tahu sebelum edge di-recreate | belum |
| 5 | Pengelola app lama boleh menimpa `docker-compose.override.yml` tanpa koordinasi? | belum |
| 6 | Snapshot Hostinger tersedia? Menimpa yang lama? | belum |
| 7 | Paket Cloudflare zona toko + akun Zero Trust | belum |
| 8 | Email admin untuk policy Access | belum |
| 9 | Penyedia email (keputusan PRD no. 5) dan mailbox `info@` | belum — situs belum mengirim email |
| 10 | Tujuan backup offsite; penyimpan kunci privat `age` (dua tempat) | belum |
| 11 | Frekuensi backup (harian / tiap jam) | belum — usul: **harian** (pesanan dicatat manual; volume tulis rendah) |
| 12 | Kanal alarm + layanan monitor uptime/heartbeat | belum |
| 13 | Staging selalu hidup atau hanya saat uji | belum — usul: selalu hidup (RAM cukup) |
| 14 | ~~Midtrans/Biteship~~ | tidak relevan (mode sederhana) |
| 15 | Apex sebelum go-live: tanpa DNS atau "segera hadir" | belum |
| 16 | Pola mount vhost edge: Opsi A per berkas (default) / Opsi B direktori | belum |
| 17 | Formulir keputusan PRD terbaru | belum — terutama no. 1, 2, 3, 4, 5, 9, 10, 11, 13 |

---

## 4. Fase deploy (urutan panduan §8.0, disesuaikan)

| Fase | Isi | Rujukan |
|---|---|---|
| 0 | Jawaban §3 di atas; `/root/toko-ops.sh`; cek baca-saja; swap 2 GB | panduan §3 |
| 1 | Repo GitHub privat, push, CI hijau, ketiga image terbit, akses package GHCR | §5 di bawah |
| 2 | Zona Cloudflare, Full (strict) manual, Origin Cert, aplikasi Access `admin.` + `staging-admin.` | panduan §4.1–§4.2, §4.4 (tanpa aturan webhook) |
| 3 | Deploy key, dua clone, `.env` staging | panduan §6.2 + §6 di bawah |
| 4 | Login GHCR terpisah, gerbang image, potret sebelum, stack STAGING naik | panduan §8.1–§8.2 + §7 di bawah |
| 5 | Vhost edge sekali (blok produksi + staging), jam sepi | panduan §7.4 (tanpa perubahan) |
| 6 | Uji origin staging, gerbang admin staging, pengguna admin pertama | §8 di bawah |
| 7 | DNS staging, uji lewat Cloudflare, bukti IP klien asli | panduan §8.8 |
| 8 | PRODUKSI: `.env`, stack, uji origin, gerbang admin | §6–§8 di bawah dengan `S="$APP_DIR"` |
| 9 | DNS apex/www/admin, uji lewat Cloudflare | panduan §8.12 (ganti `/admin-api` → `/admin`) |
| 10 | Backup, monitoring, baseline domain, checklist | §9–§11 di bawah, panduan §14 |

---

## 5. Repo dan CI (fase 1)

1. Buat repo **privat** di GitHub, lalu dari folder proyek di laptop:

   ```bash
   git init -b main
   git add -A
   git status --short          # pastikan TIDAK ada .env, panduan-deploy-*.md, web/penerbit.db, web/media/
   git ls-files --error-unmatch deploy/staging/staging-extra.conf web/src/migrations/index.ts   # WAJIB tercetak; gagal = berkas diabaikan .gitignore
   git commit -m "Situs penerbit mode sederhana + deploy"
   git remote add origin git@github.com:<OWNER>/<REPO>.git
   git push -u origin main
   ```

2. Tunggu run CI `main` hijau. Job **Publish image (GHCR)** harus *success*, bukan *skipped*.
3. GitHub → Packages → `toko-app`, `toko-migrate`, `toko-proxy` → Package settings: hubungkan ke repo; beri `<GITHUB_USER>` (akun mesin, panduan §5.6) akses **Read**.
4. Tidak ada GitHub Variables yang perlu diisi (tidak ada `NEXT_PUBLIC_*`).

Gerbang audit (`scripts/audit-gate.mjs`) membuat CI merah bila ada advisory high/critical di dependensi produksi. Perbaiki dengan menaikkan versi; bila belum ada perbaikan, tambahkan entri di `audit-allowlist.json` (`id`, `alasan`, `kedaluwarsa`). Jangan menurunkan ambang.

---

## 6. `.env` stack (fase 3 dan 8)

Mengganti panduan §6.6. Nama variabel ada di `.env.example`.

```bash
. /root/toko-ops.sh
S="$APP_DIR_STG"                          # staging dulu; produksi: S="$APP_DIR"
cd "$S" && cp .env.example .env && chmod 600 .env
for k in DB_PASSWORD PAYLOAD_SECRET; do
  sed -i "s|^$k=.*|$k=$(openssl rand -hex 32)|" .env      # hex: aman di URL koneksi
done
sed -i "s|^WEB_SUBNET=.*|WEB_SUBNET=$(docker network inspect web --format '{{range .IPAM.Config}}{{.Subnet}}{{end}}')|" .env
nano .env                                  # isi sisanya; komentar "# staging:" untuk staging
ls -l .env                                 # -rw------- root root
grep -E '^[A-Z_]+=.*<' .env | cut -d= -f1  # placeholder tersisa (nama saja); harus kosong
grep -nE '^[A-Z_]+=[^#]*[[:space:]]#' .env | cut -d= -f1   # komentar sebaris (nama saja); harus kosong
```

Komentar di `.env` **wajib** di baris sendiri. Compose membuang komentar sebaris, tetapi perintah shell runbook (`grep … | cut -d= -f2`) ikut membaca komentarnya.

Isian staging yang wajib berbeda: `STACK_NAME=toko-staging`, `PROXY_CONTAINER_NAME=toko-staging-proxy`, `ADMIN_HOST=staging-admin.$D`, `DB_VOLUME=toko-staging_db_data`, `FILES_VOLUME=toko-staging_files`, `PUBLIC_BASE_URL=https://staging.$D`, `ADMIN_BASE_URL=https://staging-admin.$D`, **`SITE_INDEXABLE=false`**, `COMPOSE_FILE=docker-compose.yml:docker-compose.staging.yml` (aktifkan barisnya), `CF_ACCESS_AUD` milik aplikasi Access staging.

Basic auth staging: panduan §8.3 (perintah `htpasswd` sama persis).

Cek isolasi staging ↔ produksi (mengganti panduan §10.2):

```bash
cd /var/www/toko-buku-staging
grep -qx 'SITE_INDEXABLE=false' .env && echo "STAGING TIDAK DIINDEKS OK"
grep -q '^COMPOSE_FILE=docker-compose.yml:docker-compose.staging.yml' .env && echo "OVERRIDE STAGING OK"
for k in DB_PASSWORD PAYLOAD_SECRET CF_ACCESS_AUD PUBLIC_BASE_URL ADMIN_BASE_URL ADMIN_HOST DB_VOLUME FILES_VOLUME STACK_NAME PROXY_CONTAINER_NAME TURNSTILE_SECRET_KEY; do
  [ "$(grep "^$k=" .env)" = "$(grep "^$k=" /var/www/toko-buku/.env)" ] && echo "SAMA DENGAN PRODUKSI: $k"
done; echo "cek selesai"
```

`TURNSTILE_SECRET_KEY` boleh sama bila keduanya kosong (Turnstile belum dipakai).

---

## 7. Menaikkan satu stack (mengganti panduan §8.2 bagian (c) dan §8.4)

Gerbang image dan potret sebelum perubahan: panduan §8.2, tetapi loop cek image-nya diganti (stack ini tidak punya `server`/`storefront`):

```bash
. /root/toko-ops.sh; SHA=<SHA>; REPO=$(grep '^IMAGE_REPO=' "$APP_DIR_STG/.env" | cut -d= -f2)
for n in app migrate proxy; do
  DOCKER_CONFIG="$TOKO_DC" docker manifest inspect "$REPO/toko-$n:sha-$SHA" >/dev/null 2>&1 && echo "$n ADA" || echo "$n TIDAK ADA"
done                                     # ketiganya harus ADA
```

Lalu naikkan stack. Rantai berhenti di langkah pertama yang gagal.

```bash
. /root/toko-ops.sh
S="$APP_DIR_STG"                        # fase produksi: S="$APP_DIR"
cd "$S" && (
  set -euo pipefail
  [ "$(stat -c %a .env)" = 600 ] || { echo ".env belum 600"; exit 1; }
  if grep -qE '^[A-Z_]+=[^#]*[[:space:]]#' .env; then echo "Ada komentar sebaris di .env (lihat §6)"; exit 1; fi
  for k in DB_VOLUME FILES_VOLUME; do
    v=$(grep "^$k=" .env | cut -d= -f2); [ -n "$v" ]
    if docker volume inspect "$v" >/dev/null 2>&1; then echo "ADA: $v"; else docker volume create "$v" >/dev/null; echo "DIBUAT: $v"; fi
  done
  docker compose config -q && echo "COMPOSE VALID"
  docker compose config | grep -E '^name:|container_name:|published:|external: true|^    name: '   # tanpa 'published'
  DOCKER_CONFIG="$TOKO_DC" docker compose --profile tools pull db migrate app toko_proxy
  docker compose up -d db
  docker compose run --rm migrate
  docker compose up -d --wait --wait-timeout 240 2>&1 | tee "/root/deploy-$(basename "$S")-$(date +%F-%H%M).log"
  docker compose ps
)
docker inspect -f '{{.Name}} {{index .Config.Labels "org.opencontainers.image.revision"}}' $(cd "$S" && docker compose ps -q)
web_members | diff /root/web-sebelum.txt -        # hanya +toko-staging-proxy (atau +toko-proxy)
docker exec "$EDGE" getent hosts toko-staging-proxy   # tepat 1 IP (produksi: toko-proxy)
```

- Label revision `toko-app` dan `toko-proxy` harus sama dengan `<SHA>`. (`db` adalah image Postgres resmi, tanpa label.)
- Staging boleh diisi data contoh fiktif: `cd "$S" && docker compose run --rm migrate npm run seed`. Seed **menolak** jalan bila `SITE_INDEXABLE=true` (produksi).
- `app` tidak sehat dan log berisi `[startup] Konfigurasi tidak valid`: baca daftar masalahnya (`docker compose logs app | grep -A8 startup`), perbaiki `.env`, lalu `docker compose up -d --force-recreate app`.

---

## 8. Uji origin dan gerbang admin (mengganti panduan §8.6, §8.7, §8.11)

### 8.1 Origin staging (tanpa Cloudflare)

```bash
. /root/toko-ops.sh; H="staging.$D"
for u in /healthz / /robots.txt /admin /api/users; do
  curl -sk --resolve "$H:443:127.0.0.1" -o /dev/null -w "$H$u: %{http_code}\n" "https://$H$u"
done            # harapan: /healthz 200, / 401, /robots.txt 401, /admin 404, /api/users 404
curl -s --resolve "$H:80:127.0.0.1" -o /dev/null -w "port80: %{http_code} -> %{redirect_url}\n" "http://$H/"   # 301 → https
```

`/admin` dan `/api/*` menjawab 404 bahkan tanpa basic auth: `return 404` nginx berjalan di fase rewrite, sebelum fase access tempat basic auth dinilai. Itu diharapkan — tidak ada isi yang terbuka.

Bila 403: gateway Docker belum cocok dengan allowlist edge (panduan §8.6).

### 8.2 Gerbang host admin (sebelum record DNS admin dibuat)

1. Zero Trust → Access → Applications → Self-hosted untuk `staging-admin.$D` (produksi: `admin.$D`). Policy: email admin + MFA. Catat `<TIM>` dan `<AUD_TAG>`.
2. Isi `CF_ACCESS_TEAM_DOMAIN` dan `CF_ACCESS_AUD` di `.env` stack itu (bukan rahasia), lalu `cd "$S" && docker compose up -d --force-recreate app`.
3. Uji negatif:

```bash
. /root/toko-ops.sh; P=toko-staging-proxy; H="staging-admin.$D"     # produksi: toko-proxy, admin.$D
# a) Dari network web tanpa JWT → 401
docker run --rm --network web alpine:3.24.4 wget -S -qO- --header "Host: $H" "http://$P/admin" 2>&1 | head -n 1
# b) Lewat edge dari host tanpa JWT → 401
curl -sk --resolve "$H:443:127.0.0.1" -o /dev/null -w "%{http_code}\n" "https://$H/admin"
# c) JWT palsu → 401
curl -sk --resolve "$H:443:127.0.0.1" -H 'Cf-Access-Jwt-Assertion: eyJhbGciOiJub25lIn0.e30.' -o /dev/null -w "%{http_code}\n" "https://$H/admin"
```

Dari laptop, di luar Cloudflare, hasilnya harus `403` (allowlist edge):

```bash
curl.exe -sk -o NUL -w "%{http_code}\n" --resolve staging-admin.<DOMAIN_TOKO>:443:<IP_VPS> https://staging-admin.<DOMAIN_TOKO>/admin
```

Uji positif (JWT sah lolos) baru bisa setelah DNS `staging-admin` dibuat: buka `https://staging-admin.$D/` di peramban, login lewat Access, harus tiba di layar Payload.

### 8.3 Pengguna admin pertama

Setelah gerbang Access terbukti, buka `https://staging-admin.<DOMAIN_TOKO>/admin`. Payload menampilkan **"Buat pengguna pertama"**. Pengguna pertama otomatis **super admin** (hook di `Users.ts`); pengguna berikutnya dibuat super admin dari menu *Pengguna Admin* dengan peran masing-masing. Tidak ada sandi admin di `.env` atau di chat.

Lakukan secepat mungkin setelah DNS admin dibuat: sampai pengguna pertama ada, siapa pun yang lolos policy Access bisa membuatnya.

**Buat minimal dua super admin** (dua orang berbeda). Situs belum punya pengirim email (keputusan PRD no. 5), jadi tombol "Lupa kata sandi" Payload tidak mengirim apa pun — sandi yang terlupa hanya bisa direset oleh super admin lain.

### 8.4 Produksi (panduan §8.11)

```bash
. /root/toko-ops.sh
for u in /healthz / /buku /admin /api/users /api/globals/settings; do
  curl -sk --resolve "$D:443:127.0.0.1" -o /dev/null -w "$D$u: %{http_code}\n" "https://$D$u"
done            # /healthz 200, / 200, /buku 200, /admin 404, /api/users 404, /api/globals/settings 404
curl -sk --resolve "www.$D:443:127.0.0.1" -o /dev/null -w "www: %{http_code} -> %{redirect_url}\n" "https://www.$D/"
curl -s  --resolve "$D:80:127.0.0.1" -o /dev/null -w "port80: %{http_code} -> %{redirect_url}\n" "http://$D/"
curl -sk --resolve "$D:443:127.0.0.1" "https://$D/robots.txt"        # produksi: Allow + Sitemap
```

Lalu §8.2 di atas untuk `admin.$D`. Di panduan §8.12, ganti setiap `/admin-api` dengan `/admin`.

---

## 9. Deploy rutin dan rollback (mengganti panduan §9.2–§9.5)

```bash
. /root/toko-ops.sh
S="$APP_DIR"; SHA=<SHA>                  # staging dulu: S="$APP_DIR_STG"
cd "$S" && (
  set -euo pipefail
  REPO=$(grep '^IMAGE_REPO=' .env | cut -d= -f2)
  for n in app migrate proxy; do DOCKER_CONFIG="$TOKO_DC" docker manifest inspect "$REPO/toko-$n:sha-$SHA" >/dev/null; done
  echo "IMAGE LENGKAP"
  for k in DB_VOLUME FILES_VOLUME; do docker volume inspect "$(grep "^$k=" .env | cut -d= -f2)" >/dev/null; done
  echo "VOLUME OK"
  git pull --ff-only
  [ -z "$(git status --porcelain)" ] || { echo "Ada perubahan lokal di repo VPS"; exit 1; }
  bash scripts/backup.sh
  echo "$(date '+%F %T') $(basename "$S") $(grep '^IMAGE_TAG=' .env)" >> /root/toko-versi.log
  export IMAGE_TAG="sha-$SHA"            # menimpa .env hanya di subshell ini
  DOCKER_CONFIG="$TOKO_DC" docker compose --profile tools pull migrate app toko_proxy
  docker compose run --rm migrate
  sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=sha-$SHA/" .env
  LOG="/root/deploy-$(basename "$S")-$(date +%F-%H%M).log"
  docker compose up -d --wait --wait-timeout 240 2>&1 | tee "$LOG"
  grep -E 'Recreat|Running|Started|Healthy' "$LOG"
)
```

Verifikasi: panduan §9.3 (label revision = `<SHA>`; `/healthz` 200; `docker compose logs --since 5m app | grep -iE 'error|exception' | redaksi`; `cek_domain`).

Rollback image (migrasi kompatibel): panduan §9.4 apa adanya. Rollback melewati migrasi tidak kompatibel: panduan §9.5, tetapi tanpa langkah Redis/BullMQ; `restore.sh` menghentikan `app` saja, dan toko-proxy menampilkan halaman pemeliharaan (503) selama app mati.

Migrasi baru dibuat di laptop dengan Postgres lokal (contoh di `web/README.md`), di-commit di `web/src/migrations/`, dan diuji CI (job e2e menerapkannya ke DB kosong).

---

## 10. Backup (panduan §11, disesuaikan)

Pemasangan sama dengan panduan §11.2–§11.3 (kunci `age` di laptop, `recipients.txt`, `rclone`, `/root/.config/toko-backup/toko-buku.env`, cron). `scripts/backup.sh` mencadangkan DB dan volume `FILES_VOLUME` (sampul + bukti transfer), mengenkripsi dengan `age`, mengirim offsite, dan mengirim heartbeat; bila gagal, `ALERT_URL` dipanggil.

Uji restore terisolasi (panduan §11.5) — tabel untuk menghitung baris: `books` (katalog) dan `orders` (buku pesanan):

```bash
docker exec toko-restore-test psql -U postgres -d toko_restore -c 'SELECT (SELECT count(*) FROM books) AS buku, (SELECT count(*) FROM orders) AS pesanan;'
```

Image uji restore: `postgres:17.11-alpine3.24` (sama dengan produksi).

---

## 11. Monitoring (panduan §12, disesuaikan)

Sama dengan panduan §12, **tanpa** baris Redis, antrean, webhook, dan Biteship. `scripts/cek-kesehatan.sh` memeriksa: disk, OOM dan health container stack, umur backup, status/restart/log edge, `cek_domain` vs baseline, dan (`--harian`) daftar IP Cloudflare serta masa berlaku origin cert.

Monitor uptime eksternal: `https://<DOMAIN_TOKO>/healthz` (200 = app hidup dan DB menjawab).

Log berguna (mengganti blok log panduan §12; selalu lewat `redaksi` sebelum ditempel):

```bash
. /root/toko-ops.sh; cd "$APP_DIR"
docker compose logs --since 10m app 2>&1 | redaksi | tail -n 50
docker logs --since 10m toko-proxy 2>&1 | redaksi | tail -n 20
docker logs --since 10m "$EDGE" 2>&1 | grep "host=$D" | redaksi | tail -n 20
```

---

## 11a. Cloudflare — tambahan untuk stack ini (melengkapi panduan §4.4)

| Area | Pengaturan |
|---|---|
| Cache Rules | **Bypass seluruh host** `admin.<DOMAIN_TOKO>` dan `staging-admin.<DOMAIN_TOKO>` (bukti transfer, data pesanan, sesi admin). Lapisan kode sudah mengirim `CDN-Cache-Control: no-store`; aturan ini lapis kedua. Apex: biarkan bawaan (HTML dinamis tidak di-cache; `/_next/static/` dan `/api/media/file/` boleh). |
| Aturan webhook | Tidak perlu (tidak ada webhook). |
| Turnstile | **Disarankan di produksi**: buat widget untuk apex + staging, isi `TURNSTILE_SITE_KEY`/`TURNSTILE_SECRET_KEY`. Hanya lapisan ini yang benar-benar menahan klien skrip di formulir kontak/institusi. Formulir langganan sengaja tanpa Turnstile. |
| Rate limiting | Bila paket mengizinkan: aturan untuk `POST` ke apex (formulir dan `/klik`), mis. 20 per menit per IP. Batas laju di aplikasi tetap aktif sebagai lapis kedua. |

---

## 12. Checklist go-live — penyesuaian panduan §14

Ganti/abaikan butir berikut; butir lain berlaku apa adanya.

- ~~Login kredensial bawaan Vendure gagal; `SUPERADMIN_PASSWORD` dirotasi~~ → **Pengguna admin pertama sudah dibuat di staging dan produksi segera setelah gerbang Access terbukti** (§8.3).
- `/admin-api` di apex = 404 → **`/admin`, `/api/users`, `/api/globals/settings` di apex = 404**.
- Dari laptop di luar Cloudflare `--resolve admin.<DOMAIN_TOKO>:443:<IP_VPS> .../admin` = 403.
- ~~Webhook Midtrans/Biteship~~, ~~token webhook tersamar~~ → **`?token=` tersamar di log edge dan toko-proxy**.
- ~~Redis noeviction/TTL~~ — tidak ada Redis.
- Tambahan: `robots.txt` produksi berisi `Sitemap:`; staging `Disallow: /` + header `X-Robots-Tag: noindex`.
- Tambahan: data contoh (seed) **tidak** pernah dijalankan di produksi; buku contoh bertanda "DATA CONTOH" sudah dihapus dari staging sebelum demo ke publik.
- Tambahan (PRD bagian 10): halaman hukum ditinjau konsultan; PSE/PMSE jelas sebelum DNS apex dibuat.

---

## 13. Uji lokal sebelum push (opsional, butuh Docker)

```bash
docker build --target app -t toko-lokal/toko-app:uji web
docker build --target migrate -t toko-lokal/toko-migrate:uji web
docker build -t toko-lokal/toko-proxy:uji deploy/proxy
SMOKE_KEEP=1 bash scripts/smoke.sh          # di Windows: dari Git Bash
bash scripts/uji-backup-restore.sh          # butuh age (Linux/CI)
bash scripts/smoke.sh --bersihkan
```

`smoke.sh` membuat network `web` dan volume `toko-uji_*` bila belum ada, dan **menolak jalan** bila mendeteksi edge VPS.
