# Avalanche Build Games Deck Outline

1. Problem: civic programs need operator-grade systems, not one-off quest demos.
2. Product framing: Stabletown core + CityChain Kit winner package.
3. Invariants slide: tenant scope, idempotency, canonical ledger, audit, outbox.
4. Architecture: API + runtime + contracts + proof artifacts.
5. Strict mode design: Fuji-only hard fail, no simulated winner path.
6. On-chain proof: deployed addresses + deploy receipts + claim + settlement receipts.
7. Three-loop execution: Smallville narrative pack (`school_onboarding`, `main_street_purchase`, `community_volunteer`) mapped to strict evidence artifact loop types (`onboarding`, `merchant_spend`, `community_event`).
8. Smallville storyboard demo: `/citychain/smallville` shows resident journey (school onboarding -> Main Street purchase -> community volunteer).
9. Judge Mode handoff: `/citychain/judge` runs preflight -> 3 loops -> settlement -> tx finality -> proof attach.
10. Transaction theater: tx-intent polling surface with status, tx hash, block, and explorer links.
11. Explorer moment: live contract page + claim tx + settlement tx from strict links file.
12. Reliability: deterministic non-strict CI path + strict recording gate + live/fallback narrative continuity.
13. Optional L1 signal: local L1 bootstrap artifact (`local_l1_bootstrap.json`) with non-blocking default.
14. Long-term intent: reusable city/BID launch playbook and one-command judge bundle handoff.
