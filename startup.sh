#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

"${ROOT_DIR}/setup.sh"

cd "${ROOT_DIR}/investors_pwa"
npm run dev

