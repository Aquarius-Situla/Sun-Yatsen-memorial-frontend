#!/bin/sh
# ============================================================================
# Private Sun Yat-sen Memorial Hall — Cloudflare Pages Build Script
# ============================================================================
# Assembles a clean static deployment bundle into ./dist, strips container
# and tooling files, and generates dist/api/env.js from WORKER_API.
# ============================================================================

set -eu

OUT_DIR="dist"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

for item in index.html _headers _redirects api captcha css events js main pages webapp; do
    if [ -e "$item" ]; then
        cp -R "$item" "$OUT_DIR/"
    fi
done

rm -f "$OUT_DIR/api/prohibited_words/private.json"

ENV_FILE="$OUT_DIR/api/env.js"
if [ -n "${WORKER_API:-}" ]; then
    ESCAPED_API=$(printf '%s' "$WORKER_API" | sed 's/\\/\\\\/g; s/"/\\"/g')
    printf 'window.ENV = { WORKER_API: "%s" };\n' "$ESCAPED_API" > "$ENV_FILE"
elif [ ! -f "$ENV_FILE" ]; then
    printf 'window.ENV = { WORKER_API: "" };\n' > "$ENV_FILE"
fi

echo "Cloudflare Pages bundle built in ./$OUT_DIR"
