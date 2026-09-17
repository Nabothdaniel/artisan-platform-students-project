#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cleanup() {
  trap - SIGINT SIGTERM EXIT
  kill 0 2>/dev/null || true
}

trap cleanup SIGINT SIGTERM EXIT

(
  cd "$ROOT_DIR/backend"
  if [[ -x "venv/bin/uvicorn" ]]; then
    exec venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
  fi
  exec python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
) &

(
  cd "$ROOT_DIR/mobile"
  exec npm start
) &

wait