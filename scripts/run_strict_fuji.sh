#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

[[ -n "${STABLETOWN_AVALANCHE_FUJI_PRIVATE_KEY:-}" ]] || {
  echo "[strict] missing STABLETOWN_AVALANCHE_FUJI_PRIVATE_KEY" >&2
  exit 1
}

export CITYCHAIN_STRICT=1
export CITYCHAIN_NETWORK=fuji

echo "[strict] running Fuji bootstrap"
chainkit/bootstrap.sh --network fuji

mkdir -p artifacts
cp chainkit/out/citychain-bootstrap-summary.json artifacts/citychain-bootstrap-summary.json
cp chainkit/out/fuji_deploy.json artifacts/fuji_deploy.json
cp chainkit/out/fuji_tx_receipts.json artifacts/fuji_tx_receipts.json
cp chainkit/out/fuji_explorer_links.json artifacts/fuji_explorer_links.json
cp chainkit/out/citychain_three_loop_evidence.json artifacts/citychain_three_loop_evidence.json 2>/dev/null || true
cp chainkit/out/citychain_validator_embed_evidence.json artifacts/citychain_validator_embed_evidence.json 2>/dev/null || true
cp chainkit/out/citychain_judge_demo_bundle.json artifacts/citychain_judge_demo_bundle.json 2>/dev/null || true

if compgen -G "contracts/deployments/avalanche_fuji/*citychain-deploy.json" >/dev/null; then
  latest_record="$(ls -1 contracts/deployments/avalanche_fuji/*citychain-deploy.json | sort | tail -n 1)"
  cp "$latest_record" artifacts/latest-contract-deploy-record.json
fi

if [[ -d "frontend/citychain-judge-console/public" ]]; then
  mkdir -p frontend/citychain-judge-console/public/artifacts
  rsync -a --delete artifacts/ frontend/citychain-judge-console/public/artifacts/
fi

scripts/verify_submission_bundle.sh "$ROOT_DIR"

echo "[strict] strict Fuji artifact refresh complete"
