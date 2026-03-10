# Judge Quick Proof (2 Minutes)

Use this page for fast technical validation during review.

## 1) Verify the bundle

```bash
./scripts/verify_submission_bundle.sh
```

Expected result:
- `[verify] submission bundle passed`

## 2) Confirm strict proof flags

From `artifacts/citychain-bootstrap-summary.json` confirm:
- `proof_mode = fuji_onchain`
- `proof_validated = true`
- `competition_grade = true`
- `evm_chain_id = 43113`

From `artifacts/citychain_judge_demo_bundle.json` confirm:
- `required_slots.contract_page.attached = true`
- `required_slots.quest_claim_tx.attached = true`
- `required_slots.redemption_chain_settlement_tx.attached = true`

## 3) Open the three required Snowtrace proofs

- Contract page:
  - `https://testnet.snowtrace.io/address/0xAB6b6C90cfAfA081E8c2F62a6Eb09B87cba6aDFA`
- Quest claim tx:
  - `https://testnet.snowtrace.io/tx/0x505635491c67230b72d5b8e30ca944345b98009d81414ea7a08bac012fe37bf7`
- Redemption settlement tx:
  - `https://testnet.snowtrace.io/tx/0xfc00fba038ed552c9f8def37b6ca9e203a161e9a82c89ebc3f2e6bd9240ad7ea`

## 4) Optional UX context

- Live MVP root:
  - `https://stabletown-xyz.github.io/citychain-build-games/`
- Story lane:
  - `https://stabletown-xyz.github.io/citychain-build-games/#/citychain/smallville`
- Proof lane:
  - `https://stabletown-xyz.github.io/citychain-build-games/#/citychain/judge`
