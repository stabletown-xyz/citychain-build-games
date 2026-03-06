# Avalanche Build Games Demo Script

## 1) Initialize deterministic app state
1. `MIX_HOME=$PWD/.mix HEX_HOME=$PWD/.hex mix run scripts/challenges/seed_avalanche_build_games_demo.exs`
2. `chainkit/bootstrap.sh --network local`
3. `MIX_HOME=$PWD/.mix HEX_HOME=$PWD/.hex mix run scripts/challenges/capture_citychain_validator_embed_evidence.exs`

## 2) Prove API loop in one console
1. `POST /api/v1/chains/:id/bootstrap` with `Idempotency-Key`
2. `GET /api/v1/chains/:id/bootstrap`
3. Smallville resident route (`/citychain/smallville`) live run:
   - strict context load
   - quest create (`school_onboarding`, `main_street_purchase`, `community_volunteer`)
   - resident attestation + claim loops
   - merchant settlement submit
   - tx-intent finality theater (`GET /api/v1/chains/tx-intents/:id`)
   - city outcomes + proof handoff
4. Judge route handoff (`/citychain/judge`) one-click run for proof-authoritative export and slot attach.
5. Fallback/manual lanes:
   - `/citychain/admin`
   - `/citychain/resident`
   - `/citychain/merchant`
   - `/citychain/proof`

## Judge 5-minute script
1. Open `/citychain/smallville` and run the resident storyboard.
2. Narrate civic timeline:
   - school onboarding mission
   - Main Street purchase mission
   - community volunteer mission
   - merchant redemption settled
   - chain confirmations shown in transaction theater
3. Open `/citychain/judge` and run one-click guided mode for proof-authoritative handoff.
4. Narrate timeline events:
   - mission created
   - resident completed mission
   - claim submitted
   - chain intent confirmed
   - merchant settled
5. Show tx-intent cards with status, tx hash, block, and explorer links.
6. Show required proof-slot statuses as attached.
7. Export judge evidence pointers payload.

## 3) Strict winner-proof pass (mandatory for final judging evidence)
1. `CITYCHAIN_STRICT=1 chainkit/bootstrap.sh --network fuji`
2. `CITYCHAIN_STRICT=1 ./scripts/challenges/smoke_avalanche_build_games.sh`
3. Confirm strict summary:
   - `proof_mode=fuji_onchain`
   - `proof_validated=true`
   - `competition_grade=true`

## 4) On-chain moment (show this live)
1. Open explorer link for one deployed contract from `chainkit/out/fuji_explorer_links.json`.
2. Open explorer link for `quest_claim` tx.
3. Open explorer link for `redemption_chain_settlement` tx.
4. Show matching hashes and receipt statuses in:
   - `chainkit/out/fuji_deploy.json`
   - `chainkit/out/fuji_tx_receipts.json`
5. Show three-loop proof artifact:
   - `chainkit/out/citychain_three_loop_evidence.json`
6. Show validator/embed artifact:
   - `chainkit/out/citychain_validator_embed_evidence.json`
7. Attach required explorer links + reference hashes/contract address in `/citychain/judge` (`screenshot_uri` optional in manual lane).
8. Run recording gate:
   - `CITYCHAIN_STRICT=1 CITYCHAIN_RECORDING_READY=1 ./scripts/challenges/smoke_avalanche_build_games.sh`

## 5) Unified judge bundle artifact
Run:

```bash
scripts/challenges/run_citychain_judge_demo.sh
```

Show:
- `chainkit/out/citychain_judge_demo_bundle.json`
- optional local L1 signal: `chainkit/out/local_l1_bootstrap.json`

## Judge fallback script (if live writes fail)
1. Switch to step-through mode in `/citychain/judge`.
2. Reload strict context only.
3. Show strict summary and strict artifacts from latest successful run.
4. Show tx hashes/explorer links from:
   - `chainkit/out/fuji_deploy.json`
   - `chainkit/out/fuji_tx_receipts.json`
   - `chainkit/out/fuji_explorer_links.json`
5. Show previously attached proof slots and exported pointer payload.
