# Avalanche Build Games Submission Manifest

- Last updated: 2026-03-06
- Track: Avalanche Build Games (Infrastructure)
- Scope: CityChain Kit demoability upgrade (strict proof + 3 quest loops + validator/embed + explorer-link/hash evidence)
- Primary demo surface: `/citychain/smallville` with proof-authoritative handoff to `/citychain/judge`

## Package artifacts
- Description: `00-description-100-words.md`
- Demo script: `demo-script.md`
- Deck outline: `deck-outline.md`
- Runbook: `runbook.md`
- Checklist: `submission-checklist.md`
- Judge quick proof: `judge-quick-proof.md`

## Verification commands

Deterministic baseline:

```bash
./scripts/challenges/smoke_avalanche_build_games.sh
```

Winner-grade strict:

```bash
CITYCHAIN_STRICT=1 ./scripts/challenges/smoke_avalanche_build_games.sh
```

Recording-ready strict gate:

```bash
CITYCHAIN_STRICT=1 CITYCHAIN_RECORDING_READY=1 ./scripts/challenges/smoke_avalanche_build_games.sh
```

Unified judge bundle:

```bash
scripts/challenges/run_citychain_judge_demo.sh
```

## Public links
- Submission mirror repo:
  - `https://github.com/stabletown-xyz/citychain-build-games`
- Walkthrough video (required by Stage 2):
  - `REPLACE_WITH_WALKTHROUGH_VIDEO_URL`
- Demo walkthrough script:
  - `https://github.com/stabletown-xyz/citychain-build-games/blob/main/docs/challenges/avalanche-build-games/demo-script.md`
- Judge quick proof:
  - `https://github.com/stabletown-xyz/citychain-build-games/blob/main/docs/challenges/avalanche-build-games/judge-quick-proof.md`
- Runbook:
  - `https://github.com/stabletown-xyz/citychain-build-games/blob/main/docs/challenges/avalanche-build-games/runbook.md`
- Submission checklist:
  - `https://github.com/stabletown-xyz/citychain-build-games/blob/main/docs/challenges/avalanche-build-games/submission-checklist.md`
- Submission manifest:
  - `https://github.com/stabletown-xyz/citychain-build-games/blob/main/docs/challenges/avalanche-build-games/submission-manifest.md`
- Optional live MVP URL:
  - `NOT_DEPLOYED_IN_THIS_CUT`

## Latest closure run (America/Denver)

- 2026-03-05 14:27:20 MST: deterministic command passed.
  - Command: `./scripts/challenges/smoke_avalanche_build_games.sh`
- 2026-03-05 14:53:25 MST: strict command passed with Fuji on-chain proof.
  - Command: `CITYCHAIN_STRICT=1 ./scripts/challenges/smoke_avalanche_build_games.sh`
  - Summary file: `chainkit/out/citychain-bootstrap-summary.json`
  - Observed: `proof_mode=fuji_onchain`, `proof_validated=true`, `competition_grade=true`
  - Explorer base: `https://testnet.snowtrace.io`
- 2026-03-05 20:49:15 MST: strict judge bundle command passed with required proof slots attached.
  - Command: `PORT=4001 CITYCHAIN_RUN_LOCAL_L1=0 CITYCHAIN_RECORDING_READY=0 CITYCHAIN_STRICT=1 CITYCHAIN_NETWORK=fuji ./scripts/challenges/run_citychain_judge_demo.sh`
  - Bundle file: `chainkit/out/citychain_judge_demo_bundle.json`
  - Observed: `required_slots.contract_page|quest_claim_tx|redemption_chain_settlement_tx all attached=true`

## Current strict artifact status

- Present:
  - `chainkit/out/citychain-bootstrap-summary.json`
  - `chainkit/out/fuji_deploy.json`
  - `chainkit/out/fuji_tx_receipts.json`
  - `chainkit/out/fuji_explorer_links.json`
  - `chainkit/out/citychain_three_loop_evidence.json`
  - `chainkit/out/citychain_validator_embed_evidence.json`
  - `chainkit/out/citychain_launch_bundle.json`
  - `chainkit/l1_local_bootstrap.sh` (script)
  - `scripts/challenges/run_citychain_judge_demo.sh` (script)

## Required strict outputs

`chainkit/out/citychain-bootstrap-summary.json` must include:
- `proof_mode = fuji_onchain`
- `proof_validated = true`
- `competition_grade = true`
- `deploy_tx_hashes`
- `flow_tx_hashes`
- `explorer_links`

Artifact files:
- `chainkit/out/fuji_deploy.json`
- `chainkit/out/fuji_tx_receipts.json`
- `chainkit/out/fuji_explorer_links.json`

## Judge-facing proof points
1. Smallville resident storyline in `/citychain/smallville` (school onboarding, Main Street purchase, community volunteer).
2. Handoff to `/citychain/judge` for proof-authoritative run export.
3. One deployed contract explorer page from strict artifact links.
4. `quest_claim` tx explorer page and confirmed receipt.
5. `redemption_chain_settlement` tx explorer page and confirmed receipt.
6. Three-loop quest evidence artifact shows `onboarding`, `merchant_spend`, `community_event` (Smallville narrative labels map to `school_onboarding`, `main_street_purchase`, `community_volunteer`).
7. Validator/governance and embed session evidence artifact.
8. Matching tx hashes across summary + deploy/receipt artifacts.

### Latest strict explorer links
- Contract (`quest_manager`):
  - `https://testnet.snowtrace.io/address/0xBBBFF8451a548a6A75CaCb8e26eFfCA03374DD6A`
- Flow tx (`quest_claim`):
  - `https://testnet.snowtrace.io/tx/0x9020b70bf46ec089af66626b758fe077c0bb521232af6dac805b2ace95cdb356`
- Flow tx (`redemption_chain_settlement`):
  - `https://testnet.snowtrace.io/tx/0xdc39b181232e0502d94db1c95d9b05898f2ef4625738122ac7102b730de28231`

## Platform integrity checks
- Tenant-scoped API writes
- Idempotent replay semantics
- Audit logs present
- Outbox events present
- Canonical redemption/ledger behavior unchanged

## Winner-grade closure status

Closed:
- required proof slots attached in strict judge bundle
- strict Fuji artifacts validated by mirror verifier
- submission mirror published with verifier + checksums
