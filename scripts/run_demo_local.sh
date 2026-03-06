#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

FRONTEND_DIR="$ROOT_DIR/frontend/citychain-judge-console"
PUBLIC_ARTIFACTS_DIR="$FRONTEND_DIR/public/artifacts"

if [[ ! -d "$ROOT_DIR/artifacts" ]]; then
  echo "[demo] missing artifacts directory at $ROOT_DIR/artifacts" >&2
  exit 1
fi

mkdir -p "$PUBLIC_ARTIFACTS_DIR"
rsync -a --delete "$ROOT_DIR/artifacts/" "$PUBLIC_ARTIFACTS_DIR/"

echo "[demo] installing frontend dependencies"
npm --prefix "$FRONTEND_DIR" ci

echo "[demo] starting citychain judge console (artifacts mounted from frontend/citychain-judge-console/public/artifacts)"
npm --prefix "$FRONTEND_DIR" run dev
