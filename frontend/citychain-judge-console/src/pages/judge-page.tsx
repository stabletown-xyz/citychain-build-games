import { useEffect, useState } from "react";
import { loadBootstrapSummary, loadJudgeBundle, normalizeTxHash } from "../lib/artifacts";
import type { CitychainBootstrapSummary, JudgeBundle } from "../types/citychain";

export function JudgePage() {
  const [summary, setSummary] = useState<CitychainBootstrapSummary | null>(null);
  const [bundle, setBundle] = useState<JudgeBundle | null>(null);

  useEffect(() => {
    void loadBootstrapSummary().then(setSummary);
    void loadJudgeBundle().then(setBundle);
  }, []);

  const flowLinks = summary?.explorer_links?.txs?.flow || {};
  const flowHashes = summary?.flow_tx_hashes || {};

  return (
    <section className="panel">
      <h2>Judge mode</h2>
      <p>Proof-authoritative lane for tx hashes, explorer links, and required slot status.</p>

      <h3>Strict summary</h3>
      {summary ? (
        <dl className="kv">
          <div>
            <dt>proof_mode</dt>
            <dd>{summary.proof_mode}</dd>
          </div>
          <div>
            <dt>proof_validated</dt>
            <dd>{String(summary.proof_validated)}</dd>
          </div>
          <div>
            <dt>competition_grade</dt>
            <dd>{String(summary.competition_grade)}</dd>
          </div>
        </dl>
      ) : (
        <p>Missing bootstrap summary artifact.</p>
      )}

      <h3>Flow proofs</h3>
      <ul>
        <li>
          <strong>quest_claim</strong>: {normalizeTxHash(flowHashes.quest_claim) || "n/a"}
          {flowLinks.quest_claim ? (
            <>
              {" "}
              <a href={flowLinks.quest_claim} target="_blank" rel="noreferrer">
                explorer
              </a>
            </>
          ) : null}
        </li>
        <li>
          <strong>redemption_chain_settlement</strong>: {normalizeTxHash(flowHashes.redemption_chain_settlement) || "n/a"}
          {flowLinks.redemption_chain_settlement ? (
            <>
              {" "}
              <a href={flowLinks.redemption_chain_settlement} target="_blank" rel="noreferrer">
                explorer
              </a>
            </>
          ) : null}
        </li>
      </ul>

      <h3>Required slots</h3>
      {bundle?.required_slots?.length ? (
        <ul>
          {bundle.required_slots.map((slot) => (
            <li key={slot.slot}>
              {slot.slot}: {slot.attached ? "attached" : "missing"}
            </li>
          ))}
        </ul>
      ) : (
        <p>Missing `artifacts/citychain_judge_demo_bundle.json` or required_slots section.</p>
      )}
    </section>
  );
}
