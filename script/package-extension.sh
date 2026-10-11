#!/bin/sh
# Builds dist/streamratings-<version>.zip for the Chrome Web Store.
# Never includes extension/config.local.json (your .env key).
set -e
cd "$(dirname "$0")/.."
if grep -q 'streamratings-cache.workers.dev' extension/background/service_worker.js; then
  echo "Set SHARED_CACHE_URL to the deployed Worker URL first (see worker/README.md)" >&2
  exit 1
fi
VERSION=$(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' extension/manifest.json)
OUT="dist/streamratings-$VERSION.zip"
mkdir -p dist
rm -f "$OUT"
(cd extension && zip -qr "../$OUT" . -x 'config.local.json' -x '*.DS_Store')
if unzip -l "$OUT" | grep -q config.local.json; then echo "config.local.json leaked into zip" >&2; exit 1; fi
echo "Built $OUT"
