#!/usr/bin/env bash

set -euo pipefail

PORT="${1:-3001}"
HOST="${HOST:-127.0.0.1}"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NODE_BIN_DEFAULT="/Users/xxiyy/Documents/badminton/.tools/node-v20.18.1-darwin-arm64/bin"

if [[ -d "$NODE_BIN_DEFAULT" ]]; then
  export PATH="$NODE_BIN_DEFAULT:$PATH"
fi

PIDS="$(lsof -ti tcp:"$PORT" || true)"

if [[ -n "$PIDS" ]]; then
  echo "Stopping processes on port $PORT: $PIDS"
  kill -9 $PIDS
fi

echo "Removing $PROJECT_ROOT/.next"
rm -rf "$PROJECT_ROOT/.next"

cd "$PROJECT_ROOT"

echo "Starting Next dev server on http://$HOST:$PORT"
exec npm run dev -- --hostname "$HOST" --port "$PORT"
