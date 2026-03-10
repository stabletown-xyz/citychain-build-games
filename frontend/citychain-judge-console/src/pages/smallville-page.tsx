import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { loadBootstrapSummary, loadJudgeBundle, loadThreeLoopEvidence, normalizeTxHash } from "../lib/artifacts";
import type { CitychainBootstrapSummary, JudgeBundle, ThreeLoopEvidence } from "../types/citychain";

function missionLabel(questType: string): string {
  switch (questType) {
    case "onboarding":
      return "School onboarding";
    case "merchant_spend":
      return "Main Street purchase";
    case "community_event":
      return "Community volunteer";
    default:
      return questType;
  }
}

function missionOutcome(questType: string): string {
  switch (questType) {
    case "onboarding":
      return "Families activated for school access.";
    case "merchant_spend":
      return "Local merchant demand reinforced.";
    case "community_event":
      return "Civic participation increased.";
    default:
      return "Civic outcome recorded.";
  }
}

export function SmallvillePage() {
  const [summary, setSummary] = useState<CitychainBootstrapSummary | null>(null);
  const [threeLoop, setThreeLoop] = useState<ThreeLoopEvidence | null>(null);
  const [bundle, setBundle] = useState<JudgeBundle | null>(null);

  useEffect(() => {
    void loadBootstrapSummary().then(setSummary);
    void loadThreeLoopEvidence().then(setThreeLoop);
    void loadJudgeBundle().then(setBundle);
  }, []);

  const questLoops = threeLoop?.quest_loops || [];
  const claims = bundle?.flow_tx_intents?.claims || [];
  const settlement = bundle?.flow_tx_intents?.settlement || null;
  const strictMode = summary?.proof_mode || bundle?.strict_summary?.proof_mode || "unknown";
  const strictValidated = summary?.proof_validated ?? bundle?.strict_summary?.proof_validated ?? false;
  const competitionGrade = summary?.competition_grade ?? bundle?.strict_summary?.competition_grade ?? false;
  const explorerBase = summary?.explorer_base_url || bundle?.strict_summary?.explorer_base_url || "https://testnet.snowtrace.io";
  const flowLinks = summary?.explorer_links?.txs?.flow || bundle?.contract_and_flow?.explorer_links?.txs?.flow || {};

  const confirmedClaims = claims.filter((entry) => entry.status === "confirmed").length;
  const confirmedSettlement = settlement?.status === "confirmed";
  const confirmedIntents = confirmedClaims + (confirmedSettlement ? 1 : 0);

  return (
    <section className="panel">
      <h2>Smallville resident storyboard</h2>
      <p>
        Narrative-first lane for judges: resident missions, merchant settlement, and a direct handoff to winner-grade
        proof checks.
      </p>

      <h3>Run controls (artifact-backed mirror)</h3>
      <ul>
        <li>Chain ID: {threeLoop?.chain_id || "11111111-1111-4111-8111-11111111111a"}</li>
        <li>Program ID: {threeLoop?.program_id || "11111111-1111-4111-8111-111111111112"}</li>
        <li>Resident participant ID: {threeLoop?.participant_id || "11111111-1111-4111-8111-111111111113"}</li>
        <li>Mode: live proof replay (artifact-backed)</li>
      </ul>

      <h3>Resident missions</h3>
      {questLoops.length ? (
        <ul>
          {questLoops.map((loop) => (
            <li key={`${loop.quest_type}-${loop.quest_id || loop.claim_tx_intent_id}`}>
              <strong>{missionLabel(loop.quest_type)}</strong>: quest={loop.quest_id || "n/a"}, attestation=
              {loop.quest_attestation_id || "n/a"}, claim_intent={loop.claim_tx_intent_id || "n/a"}, outcome=
              {missionOutcome(loop.quest_type)}
            </li>
          ))}
        </ul>
      ) : (
        <p>No mission loops found in `artifacts/citychain_three_loop_evidence.json`.</p>
      )}

      <h3>Transaction theater</h3>
      <ul>
        {claims.length ? (
          claims.map((claim, index) => (
            <li key={claim.tx_intent_id}>
              claim:{questLoops[index]?.quest_type || index + 1} intent={claim.tx_intent_id} status={claim.status} tx=
              {normalizeTxHash(claim.tx_hash) || "n/a"}
            </li>
          ))
        ) : (
          <li>
            claim fallback tx={normalizeTxHash(summary?.flow_tx_hashes?.quest_claim) || "n/a"}{" "}
            {flowLinks.quest_claim ? (
              <a href={flowLinks.quest_claim} target="_blank" rel="noreferrer">
                explorer
              </a>
            ) : null}
          </li>
        )}
        <li>
          settlement intent={settlement?.tx_intent_id || threeLoop?.redemption_settlement?.tx_intent_id || "n/a"} status=
          {settlement?.status || threeLoop?.redemption_settlement?.status || "n/a"} tx=
          {normalizeTxHash(settlement?.tx_hash || summary?.flow_tx_hashes?.redemption_chain_settlement) || "n/a"}{" "}
          {flowLinks.redemption_chain_settlement ? (
            <a href={flowLinks.redemption_chain_settlement} target="_blank" rel="noreferrer">
              explorer
            </a>
          ) : null}
        </li>
      </ul>

      <h3>City outcomes</h3>
      <ul>
        <li>Missions completed: {questLoops.length}/3</li>
        <li>Confirmed chain intents: {confirmedIntents}</li>
        <li>Merchant paid: {confirmedSettlement ? "yes" : "pending"}</li>
      </ul>

      <h3>Guided judge handoff</h3>
      <p>
        Record Smallville first, then open <Link to="/citychain/judge">Judge mode</Link> to run guided proof checks
        and finish in <Link to="/citychain/proof">Proof lane</Link>.
      </p>
      <p>
        Captured mission loops: <strong>{threeLoop?.quest_loops?.length || 0}</strong>. Settlement intent:{" "}
        <strong>{threeLoop?.redemption_settlement?.tx_intent_id || "missing"}</strong>.
      </p>

      <h3>Strict context</h3>
      {summary || bundle?.strict_summary ? (
        <dl className="kv">
          <div>
            <dt>proof_mode</dt>
            <dd>{strictMode}</dd>
          </div>
          <div>
            <dt>proof_validated</dt>
            <dd>{String(strictValidated)}</dd>
          </div>
          <div>
            <dt>competition_grade</dt>
            <dd>{String(competitionGrade)}</dd>
          </div>
          <div>
            <dt>explorer_base</dt>
            <dd>{explorerBase}</dd>
          </div>
        </dl>
      ) : (
        <p>Unable to load `/artifacts/citychain-bootstrap-summary.json`.</p>
      )}
    </section>
  );
}
