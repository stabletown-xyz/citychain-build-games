# CityChain City Launch Playbook

Last updated: 2026-03-05

## Objective
Launch a new city profile in days with repeatable commands and generated proof artifacts.

## Day 0 - Environment and credentials
- Ensure app prerequisites are installed (Elixir/Postgres/node).
- Set CityChain flags:
  - `STABLETOWN_CITYCHAIN_CHAINKIT_ENABLED=1`
  - `STABLETOWN_CITYCHAIN_QUESTS_ENABLED=1`
  - `STABLETOWN_CITYCHAIN_GASLESS_ENABLED=1`
- For strict Fuji evidence, export:
  - `STABLETOWN_AVALANCHE_FUJI_PRIVATE_KEY`
  - optional: `STABLETOWN_AVALANCHE_FUJI_RPC_URL`, `STABLETOWN_AVALANCHE_FUJI_CHAIN_ID`, `STABLETOWN_AVALANCHE_FUJI_EXPLORER_BASE_URL`

## Day 1 - Configure city IDs and run deterministic launch

```bash
scripts/challenges/launch_citychain_city.sh \
  --city "Denver Pilot 2" \
  --tenant-id 22222222-2222-4222-8222-222222222221 \
  --program-id 22222222-2222-4222-8222-222222222222 \
  --participant-id 22222222-2222-4222-8222-222222222223 \
  --merchant-id 22222222-2222-4222-8222-222222222224 \
  --redemption-id 22222222-2222-4222-8222-222222222227 \
  --chain-id 22222222-2222-4222-8222-22222222222a \
  --network local
```

Expected outputs:
- `chainkit/out/citychain-bootstrap-summary.json`
- `chainkit/out/citychain_three_loop_evidence.json`
- `chainkit/out/citychain_validator_embed_evidence.json`
- `chainkit/out/citychain_launch_bundle.json`

## Day 2 - Run strict Fuji proof

```bash
scripts/challenges/launch_citychain_city.sh \
  --city "Denver Pilot 2" \
  --tenant-id 22222222-2222-4222-8222-222222222221 \
  --program-id 22222222-2222-4222-8222-222222222222 \
  --participant-id 22222222-2222-4222-8222-222222222223 \
  --merchant-id 22222222-2222-4222-8222-222222222224 \
  --redemption-id 22222222-2222-4222-8222-222222222227 \
  --chain-id 22222222-2222-4222-8222-22222222222a \
  --network fuji \
  --strict
```

Strict pass criteria:
- summary has `proof_mode=fuji_onchain`, `proof_validated=true`, `competition_grade=true`;
- strict artifacts present:
  - `chainkit/out/fuji_deploy.json`
  - `chainkit/out/fuji_tx_receipts.json`
  - `chainkit/out/fuji_explorer_links.json`;
- flow tx hashes include `quest_claim` and `redemption_chain_settlement`.

## Day 3 - Recording-ready proof attachments

1. Open `/citychain/proof` in Operator Console.
2. Load proof data and confirm strict summary + validator/governance.
3. Attach required proof slots with explorer links + references:
   - `contract_page`
   - `quest_claim_tx`
   - `redemption_chain_settlement_tx`
4. Optional: include `screenshot_uri` metadata for deck/video collateral.
5. Re-run strict smoke with recording gate:

```bash
CITYCHAIN_STRICT=1 CITYCHAIN_RECORDING_READY=1 ./scripts/challenges/smoke_avalanche_build_games.sh
```

Pass criteria:
- recording gate confirms all required slots are attached for latest strict run with valid explorer links + hash/address references.

## Submission bundle checklist
- `chainkit/out/citychain-bootstrap-summary.json`
- `chainkit/out/citychain_three_loop_evidence.json`
- `chainkit/out/citychain_validator_embed_evidence.json`
- `chainkit/out/fuji_deploy.json`
- `chainkit/out/fuji_tx_receipts.json`
- `chainkit/out/fuji_explorer_links.json`
- `chainkit/out/citychain_launch_bundle.json`
- optional explorer screenshots (contract, claim tx, settlement tx)
