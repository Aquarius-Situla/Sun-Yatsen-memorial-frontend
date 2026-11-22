# ============================================================================
# Private Sun Yat-sen Memorial Hall — Frontend Dockerfile
# ============================================================================
# 1. Block-style comments only (full-line `#`).
# 2. All prose is written in English.
# ============================================================================

FROM nginx:alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/40-env-config.sh /docker-entrypoint.d/40-env-config.sh
RUN sed -i 's/\r$//' /docker-entrypoint.d/40-env-config.sh && chmod +x /docker-entrypoint.d/40-env-config.sh

COPY . /usr/share/nginx/html
RUN rm -rf /usr/share/nginx/html/docker /usr/share/nginx/html/Dockerfile /usr/share/nginx/html/scripts /usr/share/nginx/html/_redirects /usr/share/nginx/html/_headers

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
