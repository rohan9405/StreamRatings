#!/bin/sh
# Writes extension/config.local.json (git-ignored) from OMDB_API_KEY or .env,
# so the unpacked extension works without typing the key into Options.
cd "$(dirname "$0")/.." || exit 1
KEY="${OMDB_API_KEY:-$(sed -n 's/^OMDB_API_KEY=//p' .env 2>/dev/null | tr -d '"'"'"'\r')}"
if [ -z "$KEY" ]; then
  echo "OMDB_API_KEY not set (env or .env)" >&2
  exit 1
fi
printf '{ "omdbApiKey": "%s" }\n' "$KEY" > extension/config.local.json
echo "Wrote extension/config.local.json"
