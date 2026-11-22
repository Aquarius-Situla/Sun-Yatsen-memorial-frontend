#!/bin/sh
# ============================================================================
# Private Sun Yat-sen Memorial Hall — Runtime ENV Generator (40-env-config.sh)
# ============================================================================
# Generates /usr/share/nginx/html/api/env.js at container startup when
# WORKER_API is provided via environment variable, or creates an empty
# fallback config to prevent 404 errors when no env.js is mounted.
# ============================================================================

set -eu

ENV_FILE="/usr/share/nginx/html/api/env.js"

if [ -n "${WORKER_API:-}" ]; then
    ESCAPED_API=$(printf '%s' "$WORKER_API" | sed 's/\\/\\\\/g; s/"/\\"/g')
    printf 'window.ENV = { WORKER_API: "%s" };\n' "$ESCAPED_API" > "$ENV_FILE"
elif [ ! -f "$ENV_FILE" ]; then
    printf 'window.ENV = { WORKER_API: "" };\n' > "$ENV_FILE"
fi
