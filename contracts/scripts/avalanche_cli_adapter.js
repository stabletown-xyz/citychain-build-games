#!/usr/bin/env node

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const CONTRACTS_ROOT = path.resolve(__dirname, "..");
const CACHE_DIR = path.join(CONTRACTS_ROOT, "deployments", "avalanche-adapter-cache");

const FAILURE_REASONS = new Set([
  "rpc_unavailable",
  "submission_rejected",
  "signature_failed",
  "unsupported_operation",
  "finality_timeout",
  "unknown_runtime_error"
]);

function print(payload) {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

function asObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value;
}

function normalizeReason(value) {
  if (typeof value !== "string") {
    return "unknown_runtime_error";
  }

  const normalized = value.trim().toLowerCase();
  return FAILURE_REASONS.has(normalized) ? normalized : "unknown_runtime_error";
}

function readPayload(raw) {
  if (!raw || raw.trim() === "") {
    return {};
  }

  try {
    const decoded = JSON.parse(raw);
    return decoded && typeof decoded === "object" && !Array.isArray(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

function firstNonEmptyString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }

  return null;
}

function sha256Hex(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function cachePath(txHash) {
  const hash = txHash.startsWith("0x") ? txHash.slice(2) : txHash;
  return path.join(CACHE_DIR, `${hash.toLowerCase()}.json`);
}

function writeCache(record) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cachePath(record.tx_hash), JSON.stringify(record, null, 2));
}

function readCache(txHash) {
  try {
    const raw = fs.readFileSync(cachePath(txHash), "utf8");
    const decoded = JSON.parse(raw);
    return decoded && typeof decoded === "object" ? decoded : null;
  } catch {
    return null;
  }
}

function resolveMode() {
  const value = process.env.STABLETOWN_AVALANCHE_ADAPTER_MODE;
  if (!value) {
    return "mock";
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "cli" ? "cli" : "mock";
}

function deterministicTxHash(profile, intent) {
  const profileNetwork = firstNonEmptyString(profile.network, profile.profile_slug, "avalanche");
  const idempotencyKey = firstNonEmptyString(intent.idempotency_key, intent.idempotencyKey, "no-idempotency");
  const requestHash = firstNonEmptyString(intent.request_hash, intent.requestHash, "no-request-hash");
  return `0x${sha256Hex(`${profileNetwork}:${idempotencyKey}:${requestHash}`)}`;
}

function normalizeReceiptStatus(value) {
  if (typeof value !== "string") {
    return "confirmed";
  }

  const normalized = value.trim().toLowerCase();

  switch (normalized) {
    case "pending":
      return "pending";
    case "failed":
    case "error":
      return "failed";
    case "confirmed":
    case "success":
      return "confirmed";
    default:
      return "confirmed";
  }
}

function handleSubmit(rawPayload) {
  const payload = readPayload(rawPayload);

  if (!payload) {
    print({ ok: false, failure_reason: "submission_rejected", error: "invalid_json" });
    process.exit(1);
  }

  const profile = asObject(payload.profile);
  const intent = asObject(payload.intent);
  const metadata = asObject(intent.metadata);

  const txHash =
    firstNonEmptyString(metadata.tx_hash, metadata.txHash, intent.tx_hash, intent.txHash) ||
    deterministicTxHash(profile, intent);

  const record = {
    tx_hash: txHash,
    status: "submitted",
    network: firstNonEmptyString(profile.network, profile.profile_slug, "avalanche"),
    operation_type: firstNonEmptyString(intent.operation_type, intent.operationType, "unknown"),
    created_at: new Date().toISOString(),
    metadata
  };

  writeCache(record);

  print({
    ok: true,
    tx_hash: txHash,
    status: "submitted",
    provider_reference: `avalanche:${txHash.slice(2, 14)}`,
    metadata: {
      provider: "avalanche_cli_adapter",
      adapter_mode: resolveMode(),
      network: record.network,
      operation_type: record.operation_type
    }
  });
}

function handleReceipt(rawPayload) {
  const payload = readPayload(rawPayload);

  if (!payload) {
    print({ ok: false, failure_reason: "submission_rejected", error: "invalid_json" });
    process.exit(1);
  }

  const submission = asObject(payload.submission);
  const intentMetadata = asObject(submission.intent_metadata);

  const txHash = firstNonEmptyString(submission.tx_hash, submission.txHash);

  if (!txHash) {
    print({ ok: false, failure_reason: "submission_rejected", error: "missing_tx_hash" });
    process.exit(1);
  }

  const cached = readCache(txHash) || { tx_hash: txHash, network: "avalanche", metadata: {} };
  const receiptMode = firstNonEmptyString(intentMetadata.receipt_mode, intentMetadata.receiptMode);

  if (receiptMode) {
    const status = normalizeReceiptStatus(receiptMode);

    if (status === "failed") {
      const reason = normalizeReason(firstNonEmptyString(intentMetadata.failure_reason, intentMetadata.failureReason));
      print({
        ok: true,
        status: "failed",
        tx_hash: txHash,
        failure_reason: reason,
        metadata: {
          provider: "avalanche_cli_adapter",
          adapter_mode: resolveMode(),
          network: cached.network
        }
      });
      return;
    }

    if (status === "pending") {
      print({
        ok: true,
        status: "pending",
        tx_hash: txHash,
        metadata: {
          provider: "avalanche_cli_adapter",
          adapter_mode: resolveMode(),
          network: cached.network
        }
      });
      return;
    }
  }

  const blockNumber =
    Number.parseInt(firstNonEmptyString(intentMetadata.block_number, intentMetadata.blockNumber, "12345"), 10) ||
    12345;

  print({
    ok: true,
    status: "confirmed",
    tx_hash: txHash,
    block_number: blockNumber,
    block_hash: `0x${sha256Hex(`block:${blockNumber}`)}`,
    confirmations: 1,
    metadata: {
      provider: "avalanche_cli_adapter",
      adapter_mode: resolveMode(),
      network: cached.network
    }
  });
}

function main() {
  const [, , command, rawPayload] = process.argv;

  if (command === "submit") {
    handleSubmit(rawPayload);
    return;
  }

  if (command === "receipt") {
    handleReceipt(rawPayload);
    return;
  }

  print({ ok: false, failure_reason: "unsupported_operation", error: "unsupported_command" });
  process.exit(1);
}

main();
