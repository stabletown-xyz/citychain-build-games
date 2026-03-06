# Stabletown Events (CityChain Mirror Extract)

This mirror copy includes outbox envelope rules and CityChain-relevant event types.

# Stabletown Events (Outbox)

Stabletown uses the **outbox pattern**:

* domain change + outbox insert happen inside the same DB transaction
* a background worker publishes pending outbox events
* consumers should assume at-least-once delivery (idempotent handling required)

## Envelope (all events)

All events must follow this envelope:

```json
{
  "event_id": "uuid",
  "type": "noun.verb",
  "tenant_id": "uuid",
  "program_id": "uuid-or-null",
  "actor": {"id": "uuid", "role": "program_admin"},
  "occurred_at": "2026-02-14T18:22:00Z",
  "idempotency_key": "string-or-null",
  "data": {}
}
```

### Envelope rules

* `tenant_id` always present
* `program_id` present when the event pertains to a specific program
* `actor` required for admin/system-triggered actions (nullable for pure connector events if truly unknown)
* `idempotency_key` required for money-adjacent events
* `data` contains only event-specific fields (no giant raw provider payloads)

### Refactor contract note

Phase C workflow dispatcher extraction does not change outbox event names or envelope fields.
Legacy/V2 path selection is tracked via internal telemetry only and does not introduce new public outbox event types.

---

## Outbox delivery lifecycle (M3 baseline)

Outbox rows are persisted with delivery metadata and transition through:

* `pending` -> initial queued state
* `failed` -> publish attempt failed; row includes `attempt_count`, `last_attempt_at`, `next_retry_at`, and error summary
* `dead_lettered` -> max retry threshold reached; row includes `dead_lettered_at`
* `published` -> publish succeeded; row includes `published_at`

Retry behavior:

* Retry timing uses exponential backoff bounded by configured max backoff.
* Delivery state changes are written transactionally to `event_outbox`.
* Per-attempt telemetry is persisted to `event_outbox_attempts` with status, attempt count, error, and latency metadata.
* Events remain at-least-once semantics for downstream consumers.
* Operator replay controls (`POST /api/v1/ops/outbox/:id/requeue`,
  `POST /api/v1/ops/outbox/requeue-dead-lettered`) reset dead-lettered rows to
  `pending` as control-plane actions and do not emit extra domain events.

---

## Event catalog

### chain.tx_submitted

Emitted when a chain transaction intent is submitted.

**data**

* `tx_intent_id`
* `chain_id`
* `operation_type`
* `status` (`submitted`)

Notes:

* Submit path no longer emits terminal outcomes.
* `chain.tx_confirmed` and `chain.tx_failed` are emitted asynchronously by the finality worker.
* Hedera CLI mode preserves normalized adapter metadata (`provider`, `operation_type`, `network`, `tx_hash`) so tx-intent, submission, and receipt records are traceable across deploy/control flows.

### chain.tx_dispatch_failed

Emitted when async dispatch reaches a terminal submit failure before finality polling.

**data**

* `tx_intent_id`
* `operation_type`
* `failure_reason`
* `status` (`failed`)

### chain.tx_confirmed

Emitted when chain transaction intent finalizes as confirmed.

**data**

* `tx_intent_id`
* `chain_id`
* `tx_hash`
* `status` (`confirmed`)

### chain.tx_failed

Emitted when chain transaction intent finalizes as failed.

**data**

* `tx_intent_id`
* `chain_id`
* `tx_hash`
* `status` (`failed`)
* `failure_reason`

### chain.bootstrap_completed

Emitted when a CityChain bootstrap run completes and summary output is persisted.

**data**

* `chain_id`
* `network`
* `status` (`completed`)
* `rpc_url`
* `evm_chain_id`
* `manifest_path`

### chain.evidence_attached

Emitted when a CityChain evidence record is attached for a bootstrap run.

**data**

* `chain_evidence_id`
* `chain_id`
* `chain_bootstrap_run_id`
* `slot`
* `explorer_url` (nullable)
* `screenshot_uri` (nullable)
* `reference`

### quest.created

Emitted when a CityChain quest is created.

**data**

* `quest_id`
* `program_id`
* `chain_id`
* `quest_type`
* `status`

### quest.attestation_issued

Emitted when quest evidence verification issues an attestation.

**data**

* `quest_id`
* `attestation_id`
* `participant_id`
* `status` (`issued`)

### quest.claim_submitted

Emitted when quest claim request is submitted and linked to a tx-intent.

**data**

* `quest_id`
* `claim_id`
* `participant_id`
* `tx_intent_id`
* `status` (`submitted|confirmed|failed`)

### quest.claim_confirmed

Emitted when a quest claim reaches confirmed finality.

**data**

* `quest_id`
* `claim_id`
* `participant_id`
* `tx_intent_id`
* `status` (`confirmed`)

### quest.claim_failed

Emitted when a quest claim reaches failed finality.

**data**

* `quest_id`
* `claim_id`
* `participant_id`
* `tx_intent_id`
* `status` (`failed`)
* `failure_reason`

### redemption.chain_settlement_submitted

Emitted when redemption chain settlement request is submitted and linked to a tx-intent.

**data**

* `redemption_id`
* `redemption_chain_settlement_id`
* `chain_id`
* `tx_intent_id`
* `status` (`submitted|confirmed|failed`)

### redemption.chain_settlement_confirmed

Emitted when redemption chain settlement reaches confirmed finality.

**data**

* `redemption_id`
* `redemption_chain_settlement_id`
* `chain_id`
* `tx_intent_id`
* `status` (`confirmed`)

### redemption.chain_settlement_failed

Emitted when redemption chain settlement reaches failed finality.

**data**

* `redemption_id`
* `redemption_chain_settlement_id`
* `chain_id`
* `tx_intent_id`
* `status` (`failed`)
* `failure_reason`

### chain.indexer_cursor_advanced

Emitted when a chain indexer cursor is advanced, optionally with indexed event inserts.

**data**

* `chain_id`
* `cursor_id`
* `cursor_name`
* `block_number` (nullable)
* `indexed_events_count`

