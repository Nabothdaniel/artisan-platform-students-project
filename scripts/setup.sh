#!/usr/bin/env bash
# ArtisanHub one-shot setup. Works on Windows (Git Bash), macOS and Linux.
# Usage:  bash scripts/setup.sh          (setup + seed)
#         bash scripts/setup.sh --no-seed
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MOBILE="$ROOT/mobile"

echo "==> ArtisanHub setup"

# 1. Check Node.js (18+)
if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js is not installed. Install Node 18+ from https://nodejs.org and re-run." >&2
  exit 1
fi
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "ERROR: Node 18+ required (found $(node -v))." >&2
  exit 1
fi
echo "    Node $(node -v), npm $(npm -v)"

# 2. Environment file
if [ ! -f "$MOBILE/.env" ]; then
  cp "$MOBILE/.env.example" "$MOBILE/.env"
  echo "==> Created mobile/.env from .env.example (edit it to use your own Firebase project)"
else
  echo "==> mobile/.env already exists, leaving it untouched"
fi

# 3. Dependencies
echo "==> Installing dependencies"
(cd "$MOBILE" && npm install)

# 4. Typecheck
echo "==> Typechecking"
(cd "$MOBILE" && npm run typecheck)

# 5. Seed Firebase (idempotent). Prefer IPv4: Node can time out on IPv6-only
#    routes to Google on some networks/Windows setups.
if [ "${1:-}" != "--no-seed" ]; then
  echo "==> Seeding Firebase (skips if data already exists)"
  (cd "$MOBILE" && NODE_OPTIONS="--dns-result-order=ipv4first" npm run seed)
fi

cat <<MSG

Setup complete.

  Start the app:   npm start            (from the repo root)
                   or: cd mobile && npm start     (then press w / a / i)
  Re-seed:         npm run seed:force
  Demo login:      amina@gmail.com / password123   (customer)
                   tunde@plumbing.ng / password123 (artisan)
                   admin@artisanhub.ng / password123 (admin)

If seeding fails with "network-request-failed" / "client is offline":
  export NODE_OPTIONS=--dns-result-order=ipv4first   then re-run.
MSG
