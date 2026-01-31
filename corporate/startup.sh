#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

"${APP_DIR}/setup.sh"

cd "${APP_DIR}"

PORT="${PORT:-3002}"
npm run dev -- -p "${PORT}"

