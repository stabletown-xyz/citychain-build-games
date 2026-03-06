#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/out"
ARTIFACT_PATH="$OUT_DIR/local_l1_bootstrap.json"
TRANSCRIPT_PATH="$OUT_DIR/local_l1_bootstrap.log"

L1_REQUIRED="${CITYCHAIN_L1_REQUIRED:-0}"
L1_NAME="${CITYCHAIN_L1_NAME:-citychain-judge-local-l1}"
L1_NUM_NODES="${CITYCHAIN_L1_NUM_NODES:-2}"
GENERATED_AT="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

mkdir -p "$OUT_DIR"
: >"$TRANSCRIPT_PATH"

status="skipped"
error_reason=""
blockchain_name=""
blockchain_id=""
subnet_id=""
rpc_url=""

append_log() {
  printf '%s\n' "$1" >>"$TRANSCRIPT_PATH"
}

run_and_log() {
  append_log "\$ $*"
  local output=""
  if ! output="$("$@" 2>&1)"; then
    append_log "$output"
    return 1
  fi

  append_log "$output"
  return 0
}

parse_id_from_log() {
  local label="$1"
  local value=""
  value="$(grep -Eo "${label}[[:space:]:=]+[a-zA-Z0-9]+" "$TRANSCRIPT_PATH" | tail -n 1 | awk '{print $NF}' || true)"
  printf '%s' "$value"
}

emit_artifact() {
  cat >"$ARTIFACT_PATH" <<JSON
{
  "generated_at": "$GENERATED_AT",
  "status": "$status",
  "blockchain_name": "$blockchain_name",
  "blockchain_id": "$blockchain_id",
  "subnet_id": "$subnet_id",
  "rpc_url": "$rpc_url",
  "local_rpc_endpoints": {
    "evm_c_chain": "http://127.0.0.1:9650/ext/bc/C/rpc",
    "p_chain": "http://127.0.0.1:9650/ext/P"
  },
  "transcript_path": "$TRANSCRIPT_PATH",
  "error_reason": "$error_reason"
}
JSON
}

if ! command -v avalanche >/dev/null 2>&1; then
  status="skipped"
  error_reason="avalanche_cli_missing"
  emit_artifact
  if [[ "$L1_REQUIRED" == "1" ]]; then
    echo "CITYCHAIN_L1_REQUIRED=1 but avalanche CLI is missing." >&2
    exit 1
  fi
  exit 0
fi

if ! run_and_log avalanche network status; then
  append_log "network status command failed, attempting to start local network"
fi

if ! run_and_log avalanche network start --num-nodes "$L1_NUM_NODES"; then
  if grep -qi "already running" "$TRANSCRIPT_PATH"; then
    append_log "local network already running; continuing"
  else
    status="failed"
    error_reason="local_network_start_failed"
    emit_artifact
    if [[ "$L1_REQUIRED" == "1" ]]; then
      echo "Local L1 bootstrap failed: $error_reason" >&2
      exit 1
    fi
    exit 0
  fi
fi

if ! run_and_log avalanche blockchain create "$L1_NAME" --evm --test-defaults --force; then
  status="failed"
  error_reason="blockchain_create_failed"
  emit_artifact
  if [[ "$L1_REQUIRED" == "1" ]]; then
    echo "Local L1 bootstrap failed: $error_reason" >&2
    exit 1
  fi
  exit 0
fi

if ! run_and_log avalanche blockchain deploy "$L1_NAME" --local --ewoq --use-local-machine --num-nodes "$L1_NUM_NODES"; then
  if grep -qi "already deployed" "$TRANSCRIPT_PATH"; then
    status="reused"
  else
    status="failed"
    error_reason="blockchain_deploy_failed"
    emit_artifact
    if [[ "$L1_REQUIRED" == "1" ]]; then
      echo "Local L1 bootstrap failed: $error_reason" >&2
      exit 1
    fi
    exit 0
  fi
else
  status="created"
fi

blockchain_name="$L1_NAME"
blockchain_id="$(parse_id_from_log "BlockchainID")"
subnet_id="$(parse_id_from_log "SubnetID")"
rpc_url="http://127.0.0.1:9650/ext/bc/C/rpc"

emit_artifact

echo "local_l1_bootstrap_status=$status"
echo "local_l1_bootstrap_artifact=$ARTIFACT_PATH"

if [[ "$L1_REQUIRED" == "1" && "$status" == "failed" ]]; then
  exit 1
fi
