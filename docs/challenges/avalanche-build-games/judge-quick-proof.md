# Judge Quick Proof (2 Minutes)

Use this page for fast technical validation during review.

## 1) Run one verifier command

```bash
./scripts/verify_submission_bundle.sh
```

Expected result:
- `[verify] submission bundle passed`

## 2) Open the three required Snowtrace proofs

- Contract page:
  - `https://testnet.snowtrace.io/address/0xBBBFF8451a548a6A75CaCb8e26eFfCA03374DD6A`
- Quest claim tx:
  - `https://testnet.snowtrace.io/tx/0x9020b70bf46ec089af66626b758fe077c0bb521232af6dac805b2ace95cdb356`
- Redemption settlement tx:
  - `https://testnet.snowtrace.io/tx/0xdc39b181232e0502d94db1c95d9b05898f2ef4625738122ac7102b730de28231`

## 3) Confirm strict fields

From `artifacts/citychain-bootstrap-summary.json`:
- `proof_mode = fuji_onchain`
- `proof_validated = true`
- `competition_grade = true`
- `evm_chain_id = 43113`

From `artifacts/citychain_judge_demo_bundle.json`:
- `required_slots.contract_page.attached = true`
- `required_slots.quest_claim_tx.attached = true`
- `required_slots.redemption_chain_settlement_tx.attached = true`
