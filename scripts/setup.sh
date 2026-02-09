#!/usr/bin/env bash
set -e
TOOLKIT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
if [ ! -d "$TOOLKIT_DIR/node_modules" ]; then
  echo "Installing migration toolkit dependencies..." >&2
  cd "$TOOLKIT_DIR" && npm install --silent 2>/dev/null
fi
echo "$TOOLKIT_DIR"
