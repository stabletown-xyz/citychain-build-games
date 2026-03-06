# Build Games Pitch-Proof Matrix

Last updated: 2026-03-05

## Purpose
Map each pitch claim to a concrete, generated proof artifact or UI surface so recording and submission stay verifiable.

## Claim-to-proof map

| Pitch claim | Required proof | Source |
| --- | --- | --- |
| CityChain deploys on Avalanche Fuji | Contract addresses + deploy tx hashes + confirmed receipts | `chainkit/out/fuji_deploy.json`, `chainkit/out/fuji_tx_receipts.json`, `chainkit/out/fuji_explorer_links.json` |
| Claims and settlements are real on-chain flows | `quest_claim` and `redemption_chain_settlement` tx hashes + confirmed receipts | `chainkit/out/citychain-bootstrap-summary.json`, `chainkit/out/fuji_tx_receipts.json` |
| Three quest loops run end-to-end | 3 quest records with attestation + claim linkage | `chainkit/out/citychain_three_loop_evidence.json` |
| Merchant redemption chain settlement is linked | `redemption_chain_settlement` tx-intent linkage in same run | `chainkit/out/citychain_three_loop_evidence.json` |
| Validator/governance state is visible | Non-empty validator set + governance payload | `chainkit/out/citychain_validator_embed_evidence.json` |
| Embedded wallet flow is real API-backed | Embed client + embed session IDs + expiry | `chainkit/out/citychain_validator_embed_evidence.json`, `/citychain/proof` |
| Evidence can be attached per tenant/run | Evidence records with idempotent writes and pagination | `POST/GET /api/v1/chains/:id/evidence`, `/citychain/proof` |
| Judges can run end-to-end flow in one route | Guided step orchestration + one-click mode + tx-intent polling timeline | `/citychain/judge` |
| Demo includes transaction theater, not only artifacts | tx-intent status/hash/block/explorer rendered from live polling | `/citychain/judge`, `GET /api/v1/chains/tx-intents/:id` |
| Recording uses explicit explorer proof references | 3 required proof slots attached with links + hash/address references (`contract_page`, `quest_claim_tx`, `redemption_chain_settlement_tx`) | `citychain_chain_evidence` records via `/api/v1/chains/:id/evidence` |
| City launch is repeatable | One-command launch bundle output | `scripts/challenges/launch_citychain_city.sh`, `chainkit/out/citychain_launch_bundle.json` |
| Optional L1 signal exists without gating core proof | Local L1 bootstrap artifact with status and transcript pointer | `chainkit/l1_local_bootstrap.sh`, `chainkit/out/local_l1_bootstrap.json` |
| Single handoff artifact exists for judges/video | Unified bundle with strict + loop + validator/embed + proof-slot pointers | `scripts/challenges/run_citychain_judge_demo.sh`, `chainkit/out/citychain_judge_demo_bundle.json` |

## Recording gate

Use strict mode and enforce explorer proof-slot attachment gate:

```bash
CITYCHAIN_STRICT=1 CITYCHAIN_RECORDING_READY=1 ./scripts/challenges/smoke_avalanche_build_games.sh
```

Pass criteria:
- strict summary indicates `proof_mode=fuji_onchain`, `proof_validated=true`, `competition_grade=true`;
- three-loop and validator/embed artifacts exist;
- all three required slots are attached for latest strict bootstrap run with valid explorer links + reference hashes/contract address.
