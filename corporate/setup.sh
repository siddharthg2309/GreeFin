#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js is not installed (node not found in PATH)."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is not installed (npm not found in PATH)."
  exit 1
fi

cd "${APP_DIR}"

if [[ ! -f package.json ]]; then
  echo "Error: package.json not found in ${APP_DIR}"
  exit 1
fi

if [[ ! -f .env.local && -f .env.example ]]; then
  cp .env.example .env.local
  echo "Created corporate/.env.local from .env.example (fill DATABASE_URL)."
fi

if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

echo "Setup complete."

