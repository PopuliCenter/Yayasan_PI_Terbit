# syntax=docker/dockerfile:1.7
#
# Image situs penerbit (Next.js 16 + Payload 3). Satu Dockerfile, dua target:
#   --target app      → ghcr.io/<owner>/toko-app      (server Next standalone, non-root)
#   --target migrate  → ghcr.io/<owner>/toko-migrate  (CLI Payload: migrasi & seed staging)
#
# Dibangun HANYA di CI (panduan deploy N11: jangan build di VPS). Context build = folder web/.
# Tidak ada NEXT_PUBLIC_*: semua konfigurasi dibaca saat runtime, jadi image yang sama
# dipakai staging dan produksi (W16).

ARG NODE_IMAGE=node:24.22.2-alpine3.24

FROM ${NODE_IMAGE} AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---- dependensi lengkap (untuk build) -------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---- dependensi produksi saja (untuk migrate) ------------------------------
FROM base AS prod-deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

# ---- build Next standalone -------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build tidak menyentuh basis data (semua halaman force-dynamic). Secret dummy hanya
# agar konfigurasi Payload bisa dimuat saat build; tidak pernah dipakai saat runtime.
RUN PAYLOAD_SECRET=build-only-tidak-dipakai npm run build

# ---- target: app ------------------------------------------------------------
FROM base AS app
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    MEDIA_DIR=/app/files/media \
    PRIVATE_FILES_DIR=/app/files/private \
    IMPORTS_DIR=/app/files/imports \
    EXPORTS_DIR=/app/files/exports
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# Titik mount volume FILES_VOLUME. Dibuat di image dengan pemilik nextjs agar volume
# bernama yang masih kosong mewarisi kepemilikan ini saat pertama di-mount.
RUN mkdir -p /app/files/media /app/files/private /app/files/imports /app/files/exports && chown -R nextjs:nodejs /app/files
USER nextjs
EXPOSE 3000
# 127.0.0.1, bukan localhost: di Alpine localhost bisa resolve ke ::1 (panduan W11).
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/healthz >/dev/null || exit 1
CMD ["node", "server.js"]

# ---- target: migrate --------------------------------------------------------
FROM base AS migrate
ENV NODE_ENV=production \
    MEDIA_DIR=/app/files/media \
    PRIVATE_FILES_DIR=/app/files/private \
    IMPORTS_DIR=/app/files/imports \
    EXPORTS_DIR=/app/files/exports
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs package.json package-lock.json tsconfig.json ./
COPY --chown=nextjs:nodejs src ./src
RUN mkdir -p /app/files/media /app/files/private /app/files/imports /app/files/exports && chown -R nextjs:nodejs /app/files
USER nextjs
# Default: terapkan migrasi yang belum jalan. Seed staging: `docker compose run --rm migrate npm run seed`.
CMD ["npx", "--no-install", "payload", "migrate"]
