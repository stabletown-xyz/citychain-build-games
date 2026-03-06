import { useEffect, useState } from "react";
import { loadJudgeBundle } from "../lib/artifacts";
import type { JudgeBundle } from "../types/citychain";

export function ProofPage() {
  const [bundle, setBundle] = useState<JudgeBundle | null>(null);

  useEffect(() => {
    void loadJudgeBundle().then(setBundle);
  }, []);

  return (
    <section className="panel">
      <h2>Proof lane</h2>
      <p>Verifier for contract/claim/settlement proof slots and export handoff pointers.</p>

      {bundle?.required_slots?.length ? (
        <table>
          <thead>
            <tr>
              <th>slot</th>
              <th>attached</th>
              <th>explorer_url</th>
            </tr>
          </thead>
          <tbody>
            {bundle.required_slots.map((slot) => (
              <tr key={slot.slot}>
                <td>{slot.slot}</td>
                <td>{slot.attached ? "yes" : "no"}</td>
                <td>
                  {slot.explorer_url ? (
                    <a href={slot.explorer_url} target="_blank" rel="noreferrer">
                      link
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No proof slot data found in `artifacts/citychain_judge_demo_bundle.json`.</p>
      )}
    </section>
  );
}
