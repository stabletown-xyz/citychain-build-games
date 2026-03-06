#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
[[ -d "$TARGET_DIR" ]] || {
  echo "[secrets] Target directory does not exist: $TARGET_DIR" >&2
  exit 1
}

echo "[secrets] scanning: $TARGET_DIR"

# Fast pattern scan for obvious cloud keys.
if rg -n --hidden --glob '!.git/**' --glob '!node_modules/**' --glob '!dist/**' \
  '(AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16})' "$TARGET_DIR" >/tmp/citychain_secret_scan_aws_keys.txt 2>/dev/null; then
  echo "[secrets] potential AWS key IDs detected:" >&2
  cat /tmp/citychain_secret_scan_aws_keys.txt >&2
  exit 1
fi

# Detect non-placeholder assignments for sensitive env vars.
if find "$TARGET_DIR" -type f -not -path '*/.git/*' -not -path '*/node_modules/*' -not -path '*/dist/*' -print0 \
  | xargs -0 awk '
  function is_placeholder(v,   lower) {
    lower = tolower(v)
    return v == "" || v ~ /^<.*>$/ || v ~ /^\$\{?[A-Za-z_][A-Za-z0-9_]*\}?$/ || lower ~ /^(redacted|placeholder|changeme|null|none)$/
  }
  {
    line = $0
    gsub(/^[[:space:]]+|[[:space:]]+$/, "", line)
    if (line ~ /^#/) next
    if (line ~ /^(export[[:space:]]+)?(AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY|AWS_SESSION_TOKEN|STABLETOWN_AVALANCHE_FUJI_PRIVATE_KEY)[[:space:]]*=/) {
      assignment = line
      sub(/^[[:space:]]*export[[:space:]]+/, "", assignment)

      key = assignment
      sub(/[[:space:]]*=.*/, "", key)
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", key)

      value = assignment
      sub(/^[^=]*=/, "", value)
      sub(/[[:space:]]+#.*$/, "", value)
      gsub(/^["\047]|["\047]$/, "", value)
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", value)

      if (!is_placeholder(value)) {
        printf "%s:%d: %s has non-placeholder value\n", FILENAME, NR, key
        bad = 1
      }
    }
  }
  END { exit bad ? 1 : 0 }
' >/tmp/citychain_secret_scan_assignments.txt 2>&1; then
  :
else
  echo "[secrets] sensitive assignment(s) detected:" >&2
  cat /tmp/citychain_secret_scan_assignments.txt >&2
  exit 1
fi

# Detect likely private key literals in assignment context.
if rg -n --hidden --glob '!.git/**' --glob '!node_modules/**' --glob '!dist/**' -i \
  'private[_-]?key.{0,40}=[[:space:]]*["\047]?0x?[0-9a-f]{64}["\047]?' "$TARGET_DIR" >/tmp/citychain_secret_scan_private_keys.txt 2>/dev/null; then
  echo "[secrets] potential private key literals detected:" >&2
  cat /tmp/citychain_secret_scan_private_keys.txt >&2
  exit 1
fi

echo "[secrets] passed"
