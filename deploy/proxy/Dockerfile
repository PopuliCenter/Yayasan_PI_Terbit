# toko-proxy: satu-satunya container stack toko di network `web` (panduan deploy W1, N2).
# Context build = folder deploy/proxy/. Dibangun di CI saja (N11).
FROM nginx:1.30.6-alpine3.24

# Buang server bawaan image agar tidak ada default server lain.
RUN rm -f /etc/nginx/conf.d/default.conf

# Entrypoint image nginx me-render /etc/nginx/templates/*.template ke /etc/nginx/conf.d/
# saat start. Hanya dua env ini yang di-substitusi; variabel nginx ($host, dst.) aman.
ENV NGINX_ENVSUBST_FILTER="^(WEB_SUBNET|ADMIN_HOST)$"

COPY nginx/templates/ /etc/nginx/templates/
COPY nginx/toko-headers.conf /etc/nginx/toko-headers.conf
COPY pemeliharaan/ /usr/share/nginx/pemeliharaan/
# toko-extra: staging me-mount staging.conf (basic auth + noindex). Produksi: kosong.
RUN mkdir -p /etc/nginx/toko-extra /etc/nginx/toko-auth

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/nginx-health >/dev/null || exit 1
