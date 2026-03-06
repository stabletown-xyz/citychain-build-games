# Avalanche Build Games Submission Manifest

- Last updated: 2026-03-05
- Track: Avalanche Build Games (Infrastructure)
- Scope: CityChain Kit demoability upgrade (strict proof + 3 quest loops + validator/embed + explorer-link/hash evidence)
- Primary demo surface: `/citychain/smallville` with proof-authoritative handoff to `/citychain/judge`

## Package artifacts
- Description: `00-description-100-words.md`
- Demo script: `demo-script.md`
- Deck outline: `deck-outline.md`
- Runbook: `runbook.md`
- Checklist: `submission-checklist.md`

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

## Latest closure run (America/Denver)

- 2026-03-05 14:27:20 MST: deterministic command passed.
  - Command: `./scripts/challenges/smoke_avalanche_build_games.sh`
- 2026-03-05 14:53:25 MST: strict command passed with Fuji on-chain proof.
  - Command: `CITYCHAIN_STRICT=1 ./scripts/challenges/smoke_avalanche_build_games.sh`
  - Summary file: `chainkit/out/citychain-bootstrap-summary.json`
  - Observed: `proof_mode=fuji_onchain`, `proof_validated=true`, `competition_grade=true`
  - Explorer base: `https://testnet.snowtrace.io`
- Pending refresh for this closure slice:
  - strict recording-ready command with required proof slots attached.
  - unified judge bundle command output.

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
- Contract (`redemption`):
  - `https://testnet.snowtrace.io/address/0x4cA700338DC3df676c59D0102aF805Fc84E35b34`
- Flow tx (`quest_claim`):
  - `https://testnet.snowtrace.io/tx/0xca29b3cbda2d7f88cc974e0c8876aafa0559ea9fb0860fced9ce68164de90d02`
- Flow tx (`redemption_chain_settlement`):
  - `https://testnet.snowtrace.io/tx/0x7386bc4146a709e0107d52f356b9dd80939e6e2fa27f72710b99588d532e07d5`

## Platform integrity checks
- Tenant-scoped API writes
- Idempotent replay semantics
- Audit logs present
- Outbox events present
- Canonical redemption/ledger behavior unchanged

## Remaining winner-grade closure action

Attach required proof slots with explorer links + hash/address references:
- `contract_page` (`reference.contract_address`)
- `quest_claim_tx` (`reference.tx_hash`)
- `redemption_chain_settlement_tx` (`reference.tx_hash`)

Attach via:
- `POST /api/v1/chains/:id/evidence` or `/citychain/judge`
- optional `screenshot_uri` metadata for deck/video packaging
