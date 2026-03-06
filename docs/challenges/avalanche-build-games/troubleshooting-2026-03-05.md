# CityChain Strict Fuji Troubleshooting (2026-03-05)

## Scope
Troubleshooting record for getting `CITYCHAIN_STRICT=1 ./scripts/challenges/smoke_avalanche_build_games.sh` from failing to passing with real Fuji proof artifacts.

## Final outcome
- Strict smoke passed with:
  - `proof_mode=fuji_onchain`
  - `proof_validated=true`
  - `competition_grade=true`
- Proof artifacts generated:
  - `chainkit/out/fuji_deploy.json`
  - `chainkit/out/fuji_tx_receipts.json`
  - `chainkit/out/fuji_explorer_links.json`

## Failure modes and fixes

### 1) Hardhat HH8 private key format error
- Symptom: `Invalid account ... private key too short, expected 32 bytes`.
- Root cause: placeholder/invalid `STABLETOWN_AVALANCHE_FUJI_PRIVATE_KEY`.
- Resolution: supply a real 32-byte hex private key (64 hex chars, with or without `0x`).

### 2) Deploy nonce race (`nonce too low`)
- Symptom: strict deploy failed with `nonce too low: next nonce N, tx nonce N-1`.
- Root cause: multiple contract deploy transactions were submitted back-to-back from one signer.
- Resolution:
  - serialize deployments in [deploy_citychain.ts](/Users/patrickdunstone-grounded/Desktop/stabletown%20experimental%20repo/contracts/scripts/deploy_citychain.ts)
  - wait for each deployment before submitting the next.

### 3) Seed signer mismatch / admin revert
- Symptom: strict seed failed with `execution reverted: citychain_access:not_admin`.
- Root cause: seed script assumed extra `ethers.getSigners()` accounts and did not guarantee the same admin signer as deploy on Fuji.
- Resolution:
  - pin deploy and seed writes to explicit env-backed wallet signer in:
    - [deploy_citychain.ts](/Users/patrickdunstone-grounded/Desktop/stabletown%20experimental%20repo/contracts/scripts/deploy_citychain.ts)
    - [seed_citychain.ts](/Users/patrickdunstone-grounded/Desktop/stabletown%20experimental%20repo/contracts/scripts/seed_citychain.ts)
  - derive demo actor addresses deterministically from admin address in seed script (no dependency on extra funded signers).

### 4) Redemption flow admin boundary
- Symptom: seed failed at redemption path with `citychain_access:not_admin`.
- Root cause: `Redemption.redeem()` calls `RewardsToken.burnFrom()`; `RewardsToken` admin remained deployer, not redemption contract.
- Resolution:
  - transfer `RewardsToken` admin to `Redemption` during seed setup before settlement call in [seed_citychain.ts](/Users/patrickdunstone-grounded/Desktop/stabletown%20experimental%20repo/contracts/scripts/seed_citychain.ts).

### 5) Launch wrapper failed with `feature_disabled`
- Symptom: `scripts/challenges/launch_citychain_city.sh` failed during verification with `{:error, :feature_disabled}`.
- Root cause: launch wrapper did not export CityChain feature flags before running seed/bootstrap/verify scripts.
- Resolution:
  - export defaults in [launch_citychain_city.sh](/Users/patrickdunstone-grounded/Desktop/stabletown%20experimental%20repo/scripts/challenges/launch_citychain_city.sh):
    - `STABLETOWN_CITYCHAIN_CHAINKIT_ENABLED=1`
    - `STABLETOWN_CITYCHAIN_QUESTS_ENABLED=1`
    - `STABLETOWN_CITYCHAIN_GASLESS_ENABLED=1`

### 6) Proof page `not_found: chain not found` despite valid chain ID
- Symptom: `/citychain/proof` `Load proof data` fails with `not_found: chain not found`.
- Root cause: frontend runtime overrides in browser `localStorage` had a different `tenantId` than `.env.local`; API call was tenant-scoped to the wrong tenant.
- Resolution:
  - clear frontend overrides in browser console:
    - `localStorage.removeItem("stabletown:operator-console:runtime-overrides"); location.reload();`
  - optionally set explicit override for demo tenant/actor:
    - `tenantId=11111111-1111-4111-8111-111111111111`
    - `actorRole=tenant_admin`
    - `actorId=11111111-1111-4111-8111-1111111111ff`

### 7) `Autofill links + hashes` appears empty
- Symptom: proof page loads but autofill does not populate explorer URLs/hashes.
- Root cause: latest bootstrap run is deterministic (`proof_mode=deterministic`) which intentionally has no strict proof fields (`explorer_links`, `flow_tx_hashes`).
- Resolution:
  - run a strict Fuji proof pass:
    - `set -a; source ./.env.testnet; set +a`
    - `PORT=4001 CITYCHAIN_STRICT=1 ./scripts/challenges/smoke_avalanche_build_games.sh`
  - reload `/citychain/proof` and run:
    - `Load proof data`
    - `Autofill links + hashes`

### 8) Proof slot value confusion (admin wallet vs contract/tx refs)
- Symptom: operator uses `seeded_roles.admin` address for `contract_page`.
- Root cause: `seeded_roles.admin` is a wallet address, not a deployed contract.
- Resolution:
  - `contract_page.reference.contract_address` must be a contract address from `contracts.*` in strict summary.
  - tx slots must use `flow_tx_hashes.quest_claim` and `flow_tx_hashes.redemption_chain_settlement`.
  - `screenshot_uri` is optional metadata; recording gate requires explorer URLs + hash/address references.

## Commands used for closure
- Deterministic regression:
  - `./scripts/challenges/smoke_avalanche_build_games.sh`
- Deterministic city launch bundle:
  - `scripts/challenges/launch_citychain_city.sh --city Stabletown --network local`
- Strict winner-grade verification:
  - `set -a; source ./.env.testnet; set +a`
  - `CITYCHAIN_STRICT=1 ./scripts/challenges/smoke_avalanche_build_games.sh`

## Notes
- Hardhat warns that Node v18 is unsupported; strict run still passed. Upgrade to Node >=20 to remove tooling risk before final demo recording.
