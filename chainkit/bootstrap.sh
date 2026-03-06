#!/usr/bin/env bash
set -euo pipefail

# Keep hashing tools deterministic in minimal CI images that lack C.UTF-8 locale data.
export LC_ALL=C
export LANG=C

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="$ROOT_DIR/config"
OUT_DIR="$ROOT_DIR/out"
SUMMARY_PATH="$OUT_DIR/citychain-bootstrap-summary.json"
MANIFEST_PATH="$OUT_DIR/citychain-bootstrap-manifest.json"
FUJI_DEPLOY_PATH="$OUT_DIR/fuji_deploy.json"
FUJI_TX_RECEIPTS_PATH="$OUT_DIR/fuji_tx_receipts.json"
FUJI_EXPLORER_LINKS_PATH="$OUT_DIR/fuji_explorer_links.json"
CONTRACTS_DIR="$(cd "$ROOT_DIR/../contracts" && pwd)"
FUJI_EXPLORER_BASE_DEFAULT="https://testnet.snowtrace.io"
FUJI_RPC_DEFAULT="https://api.avax-test.network/ext/bc/C/rpc"

usage() {
  cat <<USAGE
Usage: chainkit/bootstrap.sh [--network local|fuji] [--strict] [--tenant-id UUID] [--chain-id UUID]

Environment overrides:
  CITYCHAIN_NETWORK
  CITYCHAIN_STRICT=1
  CITYCHAIN_TENANT_ID
  CITYCHAIN_CHAIN_ID
  CITYCHAIN_RPC_URL
  CITYCHAIN_EVM_CHAIN_ID
  STABLETOWN_AVALANCHE_FUJI_PRIVATE_KEY
  STABLETOWN_AVALANCHE_FUJI_RPC_URL
  STABLETOWN_AVALANCHE_FUJI_CHAIN_ID
  STABLETOWN_AVALANCHE_FUJI_EXPLORER_BASE_URL
USAGE
}

json_escape() {
  local value="${1:-}"
  value=${value//\\/\\\\}
  value=${value//\"/\\\"}
  value=${value//$'\n'/\\n}
  value=${value//$'\r'/}
  printf '%s' "$value"
}

extract_last_json() {
  printf '%s\n' "${1:-}" | node -e '
    const fs = require("fs");
    const lines = fs.readFileSync(0, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    for (let i = lines.length - 1; i >= 0; i -= 1) {
      try {
        const decoded = JSON.parse(lines[i]);
        if (decoded && typeof decoded === "object" && !Array.isArray(decoded)) {
          process.stdout.write(JSON.stringify(decoded));
          process.exit(0);
        }
      } catch (_error) {
        // continue
      }
    }

    process.exit(1);
  '
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1" >&2
    exit 1
  }
}

require_env() {
  local key="$1"
  if [[ -z "${!key:-}" ]]; then
    echo "Missing required env var: $key" >&2
    exit 1
  fi
}

run_hardhat_json() {
  local script="$1"
  local network="$2"
  local input_json="$3"
  local output=""

  if ! output="$(
    cd "$CONTRACTS_DIR" &&
      STABLETOWN_SCRIPT_INPUT="$input_json" npx hardhat run "$script" --network "$network" 2>&1
  )"; then
    printf '%s\n' "$output" >&2
    return 1
  fi

  if ! extract_last_json "$output"; then
    printf 'Failed to parse JSON output for %s\n' "$script" >&2
    printf '%s\n' "$output" >&2
    return 1
  fi
}

hash_hex() {
  local input="$1"
  if command -v shasum >/dev/null 2>&1; then
    printf '%s' "$input" | shasum -a 256 | awk '{print $1}'
  elif command -v sha256sum >/dev/null 2>&1; then
    printf '%s' "$input" | sha256sum | awk '{print $1}'
  else
    printf '%s' "$input" | openssl dgst -sha256 -r | awk '{print $1}'
  fi
}

address_for() {
  local key="$1"
  local hex
  hex="$(hash_hex "$key")"
  printf '0x%s' "${hex:0:40}"
}

NETWORK="${CITYCHAIN_NETWORK:-local}"
STRICT="${CITYCHAIN_STRICT:-0}"
TENANT_ID="${CITYCHAIN_TENANT_ID:-00000000-0000-4000-8000-000000000001}"
CHAIN_ID="${CITYCHAIN_CHAIN_ID:-00000000-0000-4000-8000-00000000000a}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --network)
      NETWORK="${2:-}"
      shift 2
      ;;
    --strict)
      STRICT="1"
      shift
      ;;
    --tenant-id)
      TENANT_ID="${2:-}"
      shift 2
      ;;
    --chain-id)
      CHAIN_ID="${2:-}"
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

case "$NETWORK" in
  local|fuji) ;;
  *)
    echo "Unsupported network '$NETWORK'. Use local or fuji." >&2
    exit 1
    ;;
esac

CONFIG_FILE="$CONFIG_DIR/network-$NETWORK.json"
if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "Missing network config: $CONFIG_FILE" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

proof_mode="deterministic"
proof_validated_bool="false"
deploy_artifact_path_json="null"
tx_receipts_artifact_path_json="null"
explorer_base_url_json="null"
deploy_tx_hashes_json="{}"
flow_tx_hashes_json="{}"
explorer_links_json="{}"
contracts_json="{}"
seeded_roles_json="{}"
deploy_receipts_json="{}"
flow_receipts_json="{}"
strict_error_reason=""

STRICT_OUTPUT=""
if [[ "$STRICT" == "1" ]]; then
  if [[ "$NETWORK" != "fuji" ]]; then
    echo "CITYCHAIN_STRICT=1 is only supported with --network fuji." >&2
    exit 1
  fi

  if ! command -v avalanche >/dev/null 2>&1; then
    echo "CITYCHAIN_STRICT=1 requires Avalanche CLI ('avalanche') in PATH." >&2
    exit 1
  fi

  STRICT_OUTPUT="$(avalanche --version 2>&1 | head -n 1 || true)"
  if [[ -z "$STRICT_OUTPUT" ]]; then
    echo "Unable to read Avalanche CLI version output in strict mode." >&2
    exit 1
  fi

  require_cmd node
  require_cmd npm
  require_cmd npx
  require_env STABLETOWN_AVALANCHE_FUJI_PRIVATE_KEY
fi

if [[ "$NETWORK" == "fuji" ]]; then
  RPC_URL="${CITYCHAIN_RPC_URL:-${STABLETOWN_AVALANCHE_FUJI_RPC_URL:-$FUJI_RPC_DEFAULT}}"
  EVM_CHAIN_ID="${CITYCHAIN_EVM_CHAIN_ID:-${STABLETOWN_AVALANCHE_FUJI_CHAIN_ID:-43113}}"
else
  RPC_URL="${CITYCHAIN_RPC_URL:-http://127.0.0.1:9650/ext/bc/C/rpc}"
  EVM_CHAIN_ID="${CITYCHAIN_EVM_CHAIN_ID:-43112}"
fi

if [[ "$STRICT" == "1" ]]; then
  if [[ ! -d "$CONTRACTS_DIR/node_modules/hardhat" ]]; then
    (
      cd "$CONTRACTS_DIR"
      npm ci >/dev/null
    )
  fi

  deploy_input="$(TENANT_ID="$TENANT_ID" CHAIN_ID="$CHAIN_ID" node -e '
    process.stdout.write(JSON.stringify({
      tenant_id: process.env.TENANT_ID,
      chain_id: process.env.CHAIN_ID,
      strict: true,
      network: "fuji",
      token_name: "CityChain Rewards",
      token_symbol: "CITY"
    }));
  ')"

  if ! deploy_output_json="$(run_hardhat_json "scripts/deploy_citychain.ts" "avalanche_fuji" "$deploy_input")"; then
    echo "Strict deploy failed" >&2
    exit 1
  fi

  seed_input="$(DEPLOY_JSON="$deploy_output_json" TENANT_ID="$TENANT_ID" CHAIN_ID="$CHAIN_ID" node -e '
    const deploy = JSON.parse(process.env.DEPLOY_JSON || "{}");
    process.stdout.write(
      JSON.stringify({
        tenant_id: process.env.TENANT_ID,
        chain_id: process.env.CHAIN_ID,
        strict: true,
        network: "fuji",
        metadata: deploy.metadata || {}
      })
    );
  ')"

  if ! seed_output_json="$(run_hardhat_json "scripts/seed_citychain.ts" "avalanche_fuji" "$seed_input")"; then
    echo "Strict seed failed" >&2
    exit 1
  fi

  query_input="$(DEPLOY_JSON="$deploy_output_json" SEED_JSON="$seed_output_json" TENANT_ID="$TENANT_ID" CHAIN_ID="$CHAIN_ID" node -e '
    const deploy = JSON.parse(process.env.DEPLOY_JSON || "{}");
    const seed = JSON.parse(process.env.SEED_JSON || "{}");

    process.stdout.write(
      JSON.stringify({
        tenant_id: process.env.TENANT_ID,
        chain_id: process.env.CHAIN_ID,
        strict: true,
        network: "fuji",
        metadata: {
          ...(deploy.metadata || {}),
          ...(seed.metadata || {}),
          contracts: (deploy.metadata && deploy.metadata.contracts) || {}
        }
      })
    );
  ')"

  if ! query_output_json="$(run_hardhat_json "scripts/query_citychain.ts" "avalanche_fuji" "$query_input")"; then
    echo "Strict query failed" >&2
    exit 1
  fi

  strict_proof_json="$(
    CONTRACTS_DIR="$CONTRACTS_DIR" \
      DEPLOY_JSON="$deploy_output_json" \
      SEED_JSON="$seed_output_json" \
      QUERY_JSON="$query_output_json" \
      EXPLORER_BASE_URL="${STABLETOWN_AVALANCHE_FUJI_EXPLORER_BASE_URL:-$FUJI_EXPLORER_BASE_DEFAULT}" \
      node -e '
        const path = require("path");
        const { getAddress } = require(path.join(process.env.CONTRACTS_DIR, "node_modules", "ethers"));

        function fail(message) {
          console.error(message);
          process.exit(1);
        }

        function ensureObject(value, label) {
          if (!value || typeof value !== "object" || Array.isArray(value)) {
            fail(`${label} missing or invalid`);
          }
          return value;
        }

        function ensureString(value, label) {
          if (typeof value !== "string" || value.trim() === "") {
            fail(`${label} missing`);
          }
          return value.trim();
        }

        function ensureTxHash(value, label) {
          const txHash = ensureString(value, label);
          if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
            fail(`${label} is not a valid tx hash`);
          }
          return txHash;
        }

        function ensureReceiptConfirmed(value, label) {
          const receipt = ensureObject(value, label);
          const status = typeof receipt.status === "string" ? receipt.status.toLowerCase() : "";
          if (!["confirmed", "success"].includes(status)) {
            fail(`${label} is not confirmed`);
          }
          return receipt;
        }

        const deploy = JSON.parse(process.env.DEPLOY_JSON || "{}");
        const seed = JSON.parse(process.env.SEED_JSON || "{}");
        const query = JSON.parse(process.env.QUERY_JSON || "{}");
        const explorerBase = ensureString(process.env.EXPLORER_BASE_URL, "explorer_base_url").replace(/\/+$/, "");

        if (deploy.ok !== true) fail("deploy output not ok");
        if (seed.ok !== true) fail("seed output not ok");
        if (query.ok !== true) fail("query output not ok");

        const deployMetadata = ensureObject(deploy.metadata, "deploy metadata");
        const seedMetadata = ensureObject(seed.metadata, "seed metadata");
        const queryMetadata = ensureObject(query.metadata, "query metadata");

        const contracts = ensureObject(deployMetadata.contracts, "deploy contracts");
        const requiredContracts = [
          "institution_registry",
          "merchant_registry",
          "quest_manager",
          "attestation_verifier",
          "rewards_token",
          "redemption"
        ];

        const checksummedContracts = {};
        for (const key of requiredContracts) {
          const value = ensureString(contracts[key], `contracts.${key}`);
          const checksum = getAddress(value);
          if (checksum !== value) {
            fail(`contracts.${key} must be checksum formatted`);
          }
          checksummedContracts[key] = checksum;
        }

        const deployTxHashes = ensureObject(deployMetadata.deploy_tx_hashes, "deploy tx hashes");
        const deployReceipts = ensureObject(deployMetadata.deploy_receipts, "deploy receipts");

        for (const key of requiredContracts) {
          ensureTxHash(deployTxHashes[key], `deploy_tx_hashes.${key}`);
          ensureReceiptConfirmed(deployReceipts[key], `deploy_receipts.${key}`);
        }

        const flowTxHashes = ensureObject(seedMetadata.flow_tx_hashes, "flow tx hashes");
        const flowReceipts = ensureObject(seedMetadata.flow_receipts, "flow receipts");
        const requiredFlow = ["quest_claim", "redemption_chain_settlement"];

        for (const key of requiredFlow) {
          ensureTxHash(flowTxHashes[key], `flow_tx_hashes.${key}`);
          ensureReceiptConfirmed(flowReceipts[key], `flow_receipts.${key}`);
        }

        const verification = ensureObject(queryMetadata.verification, "query verification");
        if (verification.contracts_bound !== true) fail("query verification contracts_bound failed");
        if (verification.claim_observed !== true) fail("query verification claim_observed failed");
        if (verification.redemption_observed !== true) fail("query verification redemption_observed failed");
        if (verification.merchant_allowlisted !== true) fail("query verification merchant_allowlisted failed");

        const seededRoles = ensureObject(seedMetadata.seeded_roles, "seeded roles");
        const contractLinks = {};
        for (const key of requiredContracts) {
          contractLinks[key] = `${explorerBase}/address/${checksummedContracts[key]}`;
        }

        const deployTxLinks = {};
        for (const key of requiredContracts) {
          deployTxLinks[key] = `${explorerBase}/tx/${deployTxHashes[key]}`;
        }

        const flowTxLinks = {};
        for (const key of requiredFlow) {
          flowTxLinks[key] = `${explorerBase}/tx/${flowTxHashes[key]}`;
        }

        process.stdout.write(
          JSON.stringify({
            contracts: checksummedContracts,
            seeded_roles: seededRoles,
            deploy_tx_hashes: deployTxHashes,
            deploy_receipts: deployReceipts,
            flow_tx_hashes: flowTxHashes,
            flow_receipts: flowReceipts,
            explorer_links: {
              contracts: contractLinks,
              txs: {
                deploy: deployTxLinks,
                flow: flowTxLinks
              }
            },
            query_verification: verification,
            deploy_output: deploy,
            seed_output: seed,
            query_output: query,
            proof_validated: true
          })
        );
      '
  )" || {
    strict_error_reason="strict_proof_validation_failed"
    echo "Strict proof validation failed" >&2
    exit 1
  }

  PROOF_JSON="$strict_proof_json" \
    GENERATED_AT="$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
    NETWORK="$NETWORK" \
    EVM_CHAIN_ID="$EVM_CHAIN_ID" \
    RPC_URL="$RPC_URL" \
    TENANT_ID="$TENANT_ID" \
    CHAIN_ID="$CHAIN_ID" \
    EXPLORER_BASE_URL="${STABLETOWN_AVALANCHE_FUJI_EXPLORER_BASE_URL:-$FUJI_EXPLORER_BASE_DEFAULT}" \
    DEPLOY_PATH="$FUJI_DEPLOY_PATH" \
    TX_RECEIPTS_PATH="$FUJI_TX_RECEIPTS_PATH" \
    EXPLORER_LINKS_PATH="$FUJI_EXPLORER_LINKS_PATH" \
    node -e '
    const fs = require("fs");
    const proof = JSON.parse(process.env.PROOF_JSON || "{}");
    const generatedAt = process.env.GENERATED_AT;
    const network = process.env.NETWORK;
    const chainId = Number.parseInt(process.env.EVM_CHAIN_ID || "43113", 10);
    const rpcUrl = process.env.RPC_URL;
    const tenantId = process.env.TENANT_ID;
    const chainRef = process.env.CHAIN_ID;

    const deployArtifact = {
      generated_at: generatedAt,
      tenant_id: tenantId,
      chain_id: chainRef,
      network,
      rpc_url: rpcUrl,
      evm_chain_id: chainId,
      contracts: proof.contracts,
      deploy_tx_hashes: proof.deploy_tx_hashes,
      deploy_receipts: proof.deploy_receipts,
      seeded_roles: proof.seeded_roles,
      flow_tx_hashes: proof.flow_tx_hashes,
      flow_receipts: proof.flow_receipts,
      query_verification: proof.query_verification,
      proof_validated: true
    };

    const txReceiptsArtifact = {
      generated_at: generatedAt,
      network,
      evm_chain_id: chainId,
      deploy_receipts: proof.deploy_receipts,
      flow_receipts: proof.flow_receipts
    };

    const explorerLinksArtifact = {
      generated_at: generatedAt,
      explorer_base_url: process.env.EXPLORER_BASE_URL,
      links: proof.explorer_links
    };

    fs.writeFileSync(process.env.DEPLOY_PATH, JSON.stringify(deployArtifact, null, 2));
    fs.writeFileSync(process.env.TX_RECEIPTS_PATH, JSON.stringify(txReceiptsArtifact, null, 2));
    fs.writeFileSync(process.env.EXPLORER_LINKS_PATH, JSON.stringify(explorerLinksArtifact, null, 2));
  '

  proof_mode="fuji_onchain"
  proof_validated_bool="true"
  deploy_artifact_path_json="\"$(json_escape "$FUJI_DEPLOY_PATH")\""
  tx_receipts_artifact_path_json="\"$(json_escape "$FUJI_TX_RECEIPTS_PATH")\""
  explorer_base_url_json="\"$(json_escape "${STABLETOWN_AVALANCHE_FUJI_EXPLORER_BASE_URL:-$FUJI_EXPLORER_BASE_DEFAULT}")\""
  contracts_json="$(printf '%s' "$strict_proof_json" | node -e 'const fs=require("fs"); const v=JSON.parse(fs.readFileSync(0,"utf8")); process.stdout.write(JSON.stringify(v.contracts || {}));')"
  seeded_roles_json="$(printf '%s' "$strict_proof_json" | node -e 'const fs=require("fs"); const v=JSON.parse(fs.readFileSync(0,"utf8")); process.stdout.write(JSON.stringify(v.seeded_roles || {}));')"
  deploy_tx_hashes_json="$(printf '%s' "$strict_proof_json" | node -e 'const fs=require("fs"); const v=JSON.parse(fs.readFileSync(0,"utf8")); process.stdout.write(JSON.stringify(v.deploy_tx_hashes || {}));')"
  flow_tx_hashes_json="$(printf '%s' "$strict_proof_json" | node -e 'const fs=require("fs"); const v=JSON.parse(fs.readFileSync(0,"utf8")); process.stdout.write(JSON.stringify(v.flow_tx_hashes || {}));')"
  deploy_receipts_json="$(printf '%s' "$strict_proof_json" | node -e 'const fs=require("fs"); const v=JSON.parse(fs.readFileSync(0,"utf8")); process.stdout.write(JSON.stringify(v.deploy_receipts || {}));')"
  flow_receipts_json="$(printf '%s' "$strict_proof_json" | node -e 'const fs=require("fs"); const v=JSON.parse(fs.readFileSync(0,"utf8")); process.stdout.write(JSON.stringify(v.flow_receipts || {}));')"
  explorer_links_json="$(printf '%s' "$strict_proof_json" | node -e 'const fs=require("fs"); const v=JSON.parse(fs.readFileSync(0,"utf8")); process.stdout.write(JSON.stringify(v.explorer_links || {}));')"
else
  contracts_json="$(TENANT_ID="$TENANT_ID" CHAIN_ID="$CHAIN_ID" NETWORK="$NETWORK" node -e '
    function addressFor(key) {
      const crypto = require("crypto");
      const hex = crypto.createHash("sha256").update(key).digest("hex");
      return `0x${hex.slice(0, 40)}`;
    }
    const tenantId = process.env.TENANT_ID;
    const chainId = process.env.CHAIN_ID;
    const network = process.env.NETWORK;
    process.stdout.write(
      JSON.stringify({
        institution_registry: addressFor(`${tenantId}:${chainId}:${network}:InstitutionRegistry`),
        merchant_registry: addressFor(`${tenantId}:${chainId}:${network}:MerchantRegistry`),
        quest_manager: addressFor(`${tenantId}:${chainId}:${network}:QuestManager`),
        attestation_verifier: addressFor(`${tenantId}:${chainId}:${network}:AttestationVerifier`),
        rewards_token: addressFor(`${tenantId}:${chainId}:${network}:RewardsToken`),
        redemption: addressFor(`${tenantId}:${chainId}:${network}:Redemption`)
      })
    );
  ')"

  seeded_roles_json="$(TENANT_ID="$TENANT_ID" CHAIN_ID="$CHAIN_ID" NETWORK="$NETWORK" node -e '
    function addressFor(key) {
      const crypto = require("crypto");
      const hex = crypto.createHash("sha256").update(key).digest("hex");
      return `0x${hex.slice(0, 40)}`;
    }
    const tenantId = process.env.TENANT_ID;
    const chainId = process.env.CHAIN_ID;
    const network = process.env.NETWORK;
    process.stdout.write(
      JSON.stringify({
        admin: addressFor(`${tenantId}:${chainId}:${network}:admin`),
        institutions: {
          city: addressFor(`${tenantId}:${chainId}:${network}:institution_city`),
          university: addressFor(`${tenantId}:${chainId}:${network}:institution_university`)
        },
        merchants: {
          demo_merchant: addressFor(`${tenantId}:${chainId}:${network}:merchant_demo`)
        },
        residents: {
          demo_resident: addressFor(`${tenantId}:${chainId}:${network}:resident_demo`)
        }
      })
    );
  ')"
fi

GENERATED_AT="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
STRICT_BOOL="false"
COMPETITION_GRADE_BOOL="false"
if [[ "$STRICT" == "1" ]]; then
  STRICT_BOOL="true"
  if [[ "$NETWORK" == "fuji" && "$proof_validated_bool" == "true" ]]; then
    COMPETITION_GRADE_BOOL="true"
  fi
fi

cat > "$MANIFEST_PATH" <<JSON
{
  "version": "citychain-kit-v0.1",
  "tenant_id": "$(json_escape "$TENANT_ID")",
  "chain_id": "$(json_escape "$CHAIN_ID")",
  "network": "$(json_escape "$NETWORK")",
  "strict": $STRICT_BOOL,
  "proof_mode": "$(json_escape "$proof_mode")",
  "proof_validated": $proof_validated_bool,
  "deploy_artifact_path": $deploy_artifact_path_json,
  "tx_receipts_artifact_path": $tx_receipts_artifact_path_json,
  "explorer_base_url": $explorer_base_url_json,
  "deploy_tx_hashes": $deploy_tx_hashes_json,
  "flow_tx_hashes": $flow_tx_hashes_json,
  "explorer_links": $explorer_links_json,
  "generated_at": "$(json_escape "$GENERATED_AT")",
  "contracts": $contracts_json,
  "seeded_roles": $seeded_roles_json,
  "deploy_receipts": $deploy_receipts_json,
  "flow_receipts": $flow_receipts_json
}
JSON

cat > "$SUMMARY_PATH" <<JSON
{
  "status": "completed",
  "network": "$(json_escape "$NETWORK")",
  "rpc_url": "$(json_escape "$RPC_URL")",
  "evm_chain_id": $EVM_CHAIN_ID,
  "contracts": $contracts_json,
  "seeded_roles": $seeded_roles_json,
  "proof_mode": "$(json_escape "$proof_mode")",
  "proof_validated": $proof_validated_bool,
  "deploy_artifact_path": $deploy_artifact_path_json,
  "tx_receipts_artifact_path": $tx_receipts_artifact_path_json,
  "explorer_base_url": $explorer_base_url_json,
  "deploy_tx_hashes": $deploy_tx_hashes_json,
  "flow_tx_hashes": $flow_tx_hashes_json,
  "explorer_links": $explorer_links_json,
  "deploy_receipts": $deploy_receipts_json,
  "flow_receipts": $flow_receipts_json,
  "manifest_path": "$(json_escape "$MANIFEST_PATH")",
  "strict": $STRICT_BOOL,
  "competition_grade": $COMPETITION_GRADE_BOOL,
  "strict_error_reason": "$(json_escape "$strict_error_reason")",
  "strict_output": "$(json_escape "$STRICT_OUTPUT")",
  "generated_at": "$(json_escape "$GENERATED_AT")"
}
JSON

echo "CityChain bootstrap completed"
echo "  network: $NETWORK"
echo "  strict: $STRICT_BOOL"
echo "  summary: $SUMMARY_PATH"
