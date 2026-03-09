import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { loadBootstrapSummary, loadThreeLoopEvidence } from "../lib/artifacts";
import type { CitychainBootstrapSummary, ThreeLoopEvidence } from "../types/citychain";

const QUESTS = ["school_onboarding", "main_street_purchase", "community_volunteer"];

export function SmallvillePage() {
  const [summary, setSummary] = useState<CitychainBootstrapSummary | null>(null);
  const [threeLoop, setThreeLoop] = useState<ThreeLoopEvidence | null>(null);

  useEffect(() => {
    void loadBootstrapSummary().then(setSummary);
    void loadThreeLoopEvidence().then(setThreeLoop);
  }, []);

  return (
    <section className="panel">
      <h2>Smallville resident storyboard</h2>
      <p>
        Narrative-first lane: school onboarding, Main Street purchase, and community volunteer. Then hand off to
        Judge lane for proof-authoritative export.
      </p>

      <h3>Mission pack</h3>
      <ul>
        {QUESTS.map((quest) => (
          <li key={quest}>{quest}</li>
        ))}
      </ul>

      <h3>Guided judge handoff</h3>
      <p>
        Judges should start here for narrative context, then run the full guided checks in{" "}
        <Link to="/citychain/judge">Judge mode</Link>.
      </p>
      <p>
        Captured mission loops: <strong>{threeLoop?.quest_loops?.length || 0}</strong>. Settlement intent:{" "}
        <strong>{threeLoop?.redemption_settlement?.tx_intent_id || "missing"}</strong>.
      </p>

      <h3>Strict context</h3>
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
        <p>Unable to load `/artifacts/citychain-bootstrap-summary.json`.</p>
      )}
    </section>
  );
}
