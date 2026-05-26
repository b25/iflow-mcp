#!/usr/bin/env bash
# Cursor MCP stdio entry: loads gitignored ../.env then runs the built server.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/.env"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi
exec node "$ROOT/dist/index.js" "$@"
