# CityChain Build Games Submission Mirror

## What This Repo Is
This repository is the Avalanche Build Games submission package for CityChain Kit.
It contains the Avalanche smart contracts, chain bootstrap/deploy tooling, CityChain-only judge demo UI, and strict Fuji proof artifacts.
It is optimized for judge review speed and reproducible verification.

## What Is Open vs Closed
Open in this repo: Avalanche contracts, chainkit scripts, CityChain judge demo UI, challenge docs, and proof artifacts.
Closed in private Stabletown: multi-tenant system-of-record backend and broader product modules not required for Build Games judging.
Rationale: judges need focused proof and reproducibility without proprietary platform internals.

## Judge Quickstart (2 minutes)
```bash
./scripts/verify_submission_bundle.sh
```
Then open:
- `artifacts/fuji_explorer_links.json`
- `frontend/citychain-judge-console` demo route `/citychain/smallville`

## Demo Quickstart (5 minutes)
```bash
npm --prefix frontend/citychain-judge-console ci
npm --prefix frontend/citychain-judge-console run dev
```
Narrative route order:
1. `/citychain/smallville`
2. `/citychain/judge`
3. `/citychain/proof`

## Live MVP Site (GitHub Pages)
- URL: `https://stabletown-xyz.github.io/citychain-build-games/`
- Primary lane: `https://stabletown-xyz.github.io/citychain-build-games/citychain/smallville`
- Proof lane: `https://stabletown-xyz.github.io/citychain-build-games/citychain/judge`
- Notes:
  - Artifacts are baked from `artifacts/*` during deploy.
  - Snowtrace/Fuji verification remains canonical for on-chain proof.

## Optional Strict Fuji Rerun
Required:
- `STABLETOWN_AVALANCHE_FUJI_PRIVATE_KEY`

Optional overrides:
- `STABLETOWN_AVALANCHE_FUJI_RPC_URL`
- `STABLETOWN_AVALANCHE_FUJI_CHAIN_ID`
- `STABLETOWN_AVALANCHE_FUJI_EXPLORER_BASE_URL`

Run:
```bash
./scripts/run_strict_fuji.sh
```
Expected outputs refresh in `artifacts/`.

## Evidence Table
| File | Meaning | Judge verification |
| --- | --- | --- |
| `artifacts/citychain-bootstrap-summary.json` | Strict summary and proof flags | Check `proof_mode`, `proof_validated`, `competition_grade` |
| `artifacts/fuji_deploy.json` | Contract deploy addresses + tx hashes | Confirm addresses and tx hashes are present |
| `artifacts/fuji_tx_receipts.json` | Deploy + flow receipt confirmations | Confirm required tx receipt statuses |
| `artifacts/fuji_explorer_links.json` | Explorer links for contracts and txs | Open links directly during review |
| `artifacts/citychain_three_loop_evidence.json` | 3 quest loops + settlement linkage | Confirm quest loop count/types and settlement linkage |
| `artifacts/citychain_validator_embed_evidence.json` | Validator/governance + embed proof | Confirm validator count and embed session IDs |
| `artifacts/citychain_judge_demo_bundle.json` | Unified judge handoff payload | Confirm required proof slots are attached |

## Pitch-Proof Mapping
See: `docs/challenges/avalanche-build-games/pitch-proof-matrix.md`

## Security & Integrity
- No live secrets are committed.
- Artifact checksums are in `submission/checksums.sha256`.
- Export provenance is in `submission/export-manifest.json`.

## Known Limits
- Stabletown backend APIs are intentionally not executable in this mirror.
- Validator/embed artifacts are captured outputs from private runtime execution.

## Submission Metadata
- Source repo: `https://github.com/stabletown-xyz/stabletown`
- Source ref: `1440bc2`
- Source sha: `1440bc206ddadd30ad56ec975b2c22fd05562da8`
- Exported at (UTC): `2026-03-09T20:29:25Z`
- Track: Avalanche Build Games (Infrastructure)
- Submission mirror: `https://github.com/stabletown-xyz/citychain-build-games`
- Walkthrough video (required): `REPLACE_WITH_WALKTHROUGH_VIDEO_URL`
- Judge quick proof: `https://github.com/stabletown-xyz/citychain-build-games/blob/main/docs/challenges/avalanche-build-games/judge-quick-proof.md`
- Demo walkthrough script: `https://github.com/stabletown-xyz/citychain-build-games/blob/main/docs/challenges/avalanche-build-games/demo-script.md`
- Runbook: `https://github.com/stabletown-xyz/citychain-build-games/blob/main/docs/challenges/avalanche-build-games/runbook.md`
- Submission manifest: `https://github.com/stabletown-xyz/citychain-build-games/blob/main/docs/challenges/avalanche-build-games/submission-manifest.md`
- Optional live MVP URL: `NOT_DEPLOYED_IN_THIS_CUT`
