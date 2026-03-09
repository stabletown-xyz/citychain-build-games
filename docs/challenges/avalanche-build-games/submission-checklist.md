# Avalanche Build Games Submission Checklist

- [x] 100-word description finalized (`00-description-100-words.md`)
- [x] Demo script includes strict explorer moment + three-loop + proof route sequence (`demo-script.md`)
- [x] Judge Mode route exists and is primary demo surface (`/citychain/judge`)
- [x] Judge Mode includes one-click and step-through execution paths
- [x] Judge Mode polls tx-intent finality and renders hash/block/explorer pointers
- [x] Deck outline includes strict proof + validator/embed + explorer evidence story (`deck-outline.md`)
- [x] Judge quick-proof page exists for <2 minute review path (`judge-quick-proof.md`)
- [x] Smoke script validates strict proof schema, confirmed receipts, and three-loop/validator artifacts (`scripts/challenges/smoke_avalanche_build_games.sh`)
- [x] Strict summary includes `proof_mode=fuji_onchain`, `proof_validated=true`, `competition_grade=true` for latest strict run
- [x] Strict artifacts emitted for the latest closure run:
  - `chainkit/out/fuji_deploy.json`
  - `chainkit/out/fuji_tx_receipts.json`
  - `chainkit/out/fuji_explorer_links.json`
- [x] Three-loop artifact emitted:
  - `chainkit/out/citychain_three_loop_evidence.json`
- [x] Validator/governance + embed artifact emitted:
  - `chainkit/out/citychain_validator_embed_evidence.json`
- [x] City launch bundle emitted:
  - `chainkit/out/citychain_launch_bundle.json`
- [x] Unified judge bundle runner exists:
  - `scripts/challenges/run_citychain_judge_demo.sh`
- [x] Unified judge bundle emitted from latest strict run:
  - `chainkit/out/citychain_judge_demo_bundle.json`
- [x] Optional local L1 bootstrap signal script exists:
  - `chainkit/l1_local_bootstrap.sh`
- [ ] Optional local L1 artifact captured for latest demo run:
  - `chainkit/out/local_l1_bootstrap.json`
- [x] API docs updated for bootstrap summary proof fields (`docs/api/v1.md`)
- [x] Evidence API docs present for attach/list endpoints (`docs/api/v1.md`)
- [x] Events docs include `chain.evidence_attached` (`docs/events.md`)
- [x] Submission manifest references strict artifact files (`submission-manifest.md`)
- [x] Troubleshooting log documented for strict Fuji path (`troubleshooting-2026-03-05.md`)
- [x] Pitch-proof matrix maps claims to generated artifacts (`pitch-proof-matrix.md`)
- [x] City launch playbook documents day-by-day workflow (`city-launch-playbook.md`)
- [x] Fresh strict run captured for final submission package (latest command transcript + artifacts + explorer links)
- [x] Required proof slots attached with explorer links + reference hashes/contract address (`contract_page`, `quest_claim_tx`, `redemption_chain_settlement_tx`)
- [ ] Recording-ready strict gate passes with required proof slots attached (`CITYCHAIN_RECORDING_READY=1`)
- [x] Judge bundle command passes end-to-end (`scripts/challenges/run_citychain_judge_demo.sh`)

## Closure run status (2026-03-06)

- [x] Deterministic smoke passes: `./scripts/challenges/smoke_avalanche_build_games.sh`
- [x] Strict success-mode gate passes with funded Fuji credentials and emits winner-grade proof artifacts
- [ ] Strict recording-ready gate pass captured after explorer proof evidence attachment

Finalized: 2026-03-06
Evidence target: `submission-manifest.md`
