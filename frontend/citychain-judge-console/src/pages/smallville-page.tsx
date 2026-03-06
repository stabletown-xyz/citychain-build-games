import { useEffect, useState } from "react";
import { loadBootstrapSummary } from "../lib/artifacts";
import type { CitychainBootstrapSummary } from "../types/citychain";

const QUESTS = ["school_onboarding", "main_street_purchase", "community_volunteer"];

export function SmallvillePage() {
  const [summary, setSummary] = useState<CitychainBootstrapSummary | null>(null);

  useEffect(() => {
    void loadBootstrapSummary().then(setSummary);
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
