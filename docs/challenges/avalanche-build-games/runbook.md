# Avalanche Build Games Runbook

## Context
This package targets an evergreen Build Games judging path after the historical sprint window (January 20, 2026 to February 13, 2026).  
Winner-grade evidence is strict Fuji on-chain proof plus recording-ready demo artifacts.
Primary demo route: `/citychain/smallville` (narrative lane) with proof-authoritative handoff to `/citychain/judge`.

## Prerequisites
- PostgreSQL + Elixir environment ready
- `mix deps.get`
- `mix ecto.create && mix ecto.migrate`
- Contracts deps available (`cd contracts && npm ci`)

## Strict prerequisites (winner-grade)
- `avalanche` CLI in `PATH`
- `STABLETOWN_AVALANCHE_FUJI_PRIVATE_KEY` set and funded
- Optional overrides:
  - `STABLETOWN_AVALANCHE_FUJI_RPC_URL` (default: Avalanche Fuji public RPC)
  - `STABLETOWN_AVALANCHE_FUJI_CHAIN_ID` (default: `43113`)
  - `STABLETOWN_AVALANCHE_FUJI_EXPLORER_BASE_URL` (default: `https://testnet.snowtrace.io`)

## Enable CityChain feature flags
```bash
export STABLETOWN_CITYCHAIN_CHAINKIT_ENABLED=1
export STABLETOWN_CITYCHAIN_QUESTS_ENABLED=1
export STABLETOWN_CITYCHAIN_GASLESS_ENABLED=1
```

## Non-strict deterministic flow (CI-safe)
1. Seed demo tenant/program/merchant/chain:
   - `MIX_HOME=$PWD/.mix HEX_HOME=$PWD/.hex mix run scripts/challenges/seed_avalanche_build_games_demo.exs`
2. Bootstrap deterministic output:
   - `chainkit/bootstrap.sh --network local`
3. Capture validator/embed evidence:
   - `MIX_HOME=$PWD/.mix HEX_HOME=$PWD/.hex mix run scripts/challenges/capture_citychain_validator_embed_evidence.exs`
4. Validate API + domain loop:
   - `./scripts/challenges/smoke_avalanche_build_games.sh`

## Strict winner-grade flow (Fuji on-chain)
1. Bootstrap strict proof:
   - `CITYCHAIN_STRICT=1 chainkit/bootstrap.sh --network fuji`
2. Run strict smoke gate:
   - `CITYCHAIN_STRICT=1 ./scripts/challenges/smoke_avalanche_build_games.sh`
3. Confirm strict summary fields:
   - `proof_mode = fuji_onchain`
   - `proof_validated = true`
   - `competition_grade = true`
4. Confirm three-loop + validator/embed artifacts:
   - `chainkit/out/citychain_three_loop_evidence.json`
   - `chainkit/out/citychain_validator_embed_evidence.json`
5. Optional recording gate:
   - `CITYCHAIN_STRICT=1 CITYCHAIN_RECORDING_READY=1 ./scripts/challenges/smoke_avalanche_build_games.sh`

## Unified judge package command
Run strict smoke + recording gate + optional local L1 signal and emit one judge bundle:

```bash
scripts/challenges/run_citychain_judge_demo.sh
```

Optional local L1 behavior:
- `CITYCHAIN_RUN_LOCAL_L1=1` (default): attempt local L1 bootstrap artifact.
- `CITYCHAIN_L1_REQUIRED=1`: fail bundle run if local L1 step fails.

## Required artifact outputs
- `chainkit/out/citychain-bootstrap-summary.json`
- `chainkit/out/citychain-bootstrap-manifest.json`
- `chainkit/out/fuji_deploy.json`
- `chainkit/out/fuji_tx_receipts.json`
- `chainkit/out/fuji_explorer_links.json`
- `chainkit/out/citychain_three_loop_evidence.json`
- `chainkit/out/citychain_validator_embed_evidence.json`
- `chainkit/out/citychain_launch_bundle.json` (launch script path)
- `chainkit/out/local_l1_bootstrap.json` (optional L1 signal)
- `chainkit/out/citychain_judge_demo_bundle.json` (single handoff artifact)

## Demo evidence checklist
1. Run Smallville resident storyboard in `/citychain/smallville`.
2. Show one deployed contract on explorer.
3. Show `quest_claim` tx receipt on explorer.
4. Show `redemption_chain_settlement` tx receipt on explorer.
5. Show three quest loops in `citychain_three_loop_evidence.json`.
6. Show validator/governance + embed session in `citychain_validator_embed_evidence.json`.
7. Attach explorer-link + hash evidence through `/citychain/judge` and verify 3 required slots.
8. Optional: attach `screenshot_uri` metadata for deck/video packaging.
9. Show strict artifact JSON references in `submission-manifest.md`.

## Troubleshooting reference
- Post-refactor strict Fuji troubleshooting log:
  - `docs/challenges/avalanche-build-games/troubleshooting-2026-03-05.md`
- Pitch-proof matrix:
  - `docs/challenges/avalanche-build-games/pitch-proof-matrix.md`
- City launch playbook:
  - `docs/challenges/avalanche-build-games/city-launch-playbook.md`
