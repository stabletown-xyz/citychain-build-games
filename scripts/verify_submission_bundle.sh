#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
ARTIFACTS_DIR="$ROOT_DIR/artifacts"
ALLOW_MISSING="${CITYCHAIN_ALLOW_MISSING_ARTIFACTS:-0}"

[[ -d "$ARTIFACTS_DIR" ]] || {
  echo "[verify] missing artifacts directory: $ARTIFACTS_DIR" >&2
  exit 1
}

required_files=(
  "citychain-bootstrap-summary.json"
  "fuji_deploy.json"
  "fuji_tx_receipts.json"
  "fuji_explorer_links.json"
  "citychain_three_loop_evidence.json"
  "citychain_validator_embed_evidence.json"
)

for file in "${required_files[@]}"; do
  [[ -f "$ARTIFACTS_DIR/$file" ]] || {
    echo "[verify] missing required artifact: artifacts/$file" >&2
    exit 1
  }
done

JUDGE_BUNDLE_PATH="$ARTIFACTS_DIR/citychain_judge_demo_bundle.json"
if [[ ! -f "$JUDGE_BUNDLE_PATH" && "$ALLOW_MISSING" != "1" ]]; then
  echo "[verify] missing required artifact: artifacts/citychain_judge_demo_bundle.json" >&2
  exit 1
fi

node - "$ROOT_DIR" "$ARTIFACTS_DIR" <<'NODE'
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const rootDir = process.argv[2];
const artifactsDir = process.argv[3];
const allowMissing = process.env.CITYCHAIN_ALLOW_MISSING_ARTIFACTS === "1";
const requiredDeploy = [
  "institution_registry",
  "merchant_registry",
  "quest_manager",
  "attestation_verifier",
  "rewards_token",
  "redemption"
];
const requiredFlow = ["quest_claim", "redemption_chain_settlement"];
const requiredSlots = ["contract_page", "quest_claim_tx", "redemption_chain_settlement_tx"];

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(artifactsDir, name), "utf8"));
}

function ensure(cond, message) {
  if (!cond) throw new Error(message);
}

function isTxHash(value) {
  return typeof value === "string" && /^0x[0-9a-fA-F]{64}$/.test(value);
}

function isAddress(value) {
  return typeof value === "string" && /^0x[0-9a-fA-F]{40}$/.test(value);
}

function verifyChecksumsIfPresent() {
  const checksumPath = path.join(rootDir, "submission", "checksums.sha256");
  if (!fs.existsSync(checksumPath)) return;

  const lines = fs.readFileSync(checksumPath, "utf8").split(/\r?\n/).filter(Boolean);
  for (const line of lines) {
    const match = line.match(/^([0-9a-fA-F]{64})\s+(.+)$/);
    ensure(match, `invalid checksum line: ${line}`);
    const [, expected, relPath] = match;
    const normalizedRelPath = relPath.replace(/^\.\//, "");
    const fullPath = path.join(rootDir, normalizedRelPath);
    ensure(fs.existsSync(fullPath), `checksum target missing: ${normalizedRelPath}`);
    const actual = crypto.createHash("sha256").update(fs.readFileSync(fullPath)).digest("hex");
    ensure(actual === expected.toLowerCase(), `checksum mismatch: ${normalizedRelPath}`);
  }
}

const summary = readJson("citychain-bootstrap-summary.json");
const deploy = readJson("fuji_deploy.json");
const receipts = readJson("fuji_tx_receipts.json");
const linksPayload = readJson("fuji_explorer_links.json");
const bundlePath = path.join(artifactsDir, "citychain_judge_demo_bundle.json");
const bundle = fs.existsSync(bundlePath) ? readJson("citychain_judge_demo_bundle.json") : null;

ensure(summary.proof_mode === "fuji_onchain", "summary.proof_mode must equal fuji_onchain");
ensure(summary.proof_validated === true, "summary.proof_validated must equal true");
ensure(summary.competition_grade === true, "summary.competition_grade must equal true");

const deployTxHashes = summary.deploy_tx_hashes || {};
const flowTxHashes = summary.flow_tx_hashes || {};
const deployReceipts = receipts.deploy_receipts || {};
const flowReceipts = receipts.flow_receipts || {};
const links = linksPayload.links || linksPayload;
const summaryLinks = summary.explorer_links || {};
const explorerDeployLinks = (((links.txs || summaryLinks.txs || {}).deploy) || {});
const explorerFlowLinks = (((links.txs || summaryLinks.txs || {}).flow) || {});

for (const key of requiredDeploy) {
  ensure(isAddress((summary.contracts || {})[key]), `missing/invalid contract address for ${key}`);
  ensure(isTxHash(deployTxHashes[key]), `missing/invalid deploy tx hash for ${key}`);
  ensure(["confirmed", "success"].includes((deployReceipts[key] || {}).status), `deploy receipt not confirmed for ${key}`);
  ensure(
    typeof explorerDeployLinks[key] === "string" &&
      explorerDeployLinks[key].toLowerCase().includes(deployTxHashes[key].toLowerCase()),
    `deploy explorer link mismatch for ${key}`
  );
}

for (const key of requiredFlow) {
  ensure(isTxHash(flowTxHashes[key]), `missing/invalid flow tx hash for ${key}`);
  ensure(["confirmed", "success"].includes((flowReceipts[key] || {}).status), `flow receipt not confirmed for ${key}`);
  ensure(
    typeof explorerFlowLinks[key] === "string" &&
      explorerFlowLinks[key].toLowerCase().includes(flowTxHashes[key].toLowerCase()),
    `flow explorer link mismatch for ${key}`
  );
}

if (!bundle) {
  ensure(allowMissing, "judge bundle missing and allow-missing is disabled");
} else {
  ensure(Array.isArray(bundle.required_slots), "judge bundle missing required_slots");
  for (const slot of requiredSlots) {
    const found = bundle.required_slots.find((entry) => entry && entry.slot === slot);
    ensure(found, `missing required slot in judge bundle: ${slot}`);
    ensure(found.attached === true, `required slot not attached: ${slot}`);
    ensure(typeof found.explorer_url === "string" && found.explorer_url.startsWith("http"), `missing explorer URL for slot ${slot}`);

    const reference = found.reference || {};
    if (slot === "contract_page") {
      ensure(isAddress(reference.contract_address), "contract_page requires reference.contract_address");
    } else {
      ensure(isTxHash(reference.tx_hash), `${slot} requires reference.tx_hash`);
    }
  }
}

ensure((deploy.contracts || {}).redemption, "fuji_deploy.json missing contracts.redemption");
ensure((summary.explorer_links || {}).contracts, "summary.explorer_links.contracts missing");
verifyChecksumsIfPresent();

console.log("[verify] submission bundle passed");
NODE

echo "[verify] done"
