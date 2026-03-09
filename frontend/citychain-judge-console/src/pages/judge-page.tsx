import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  loadBootstrapSummary,
  loadJudgeBundle,
  loadThreeLoopEvidence,
  loadValidatorEmbedEvidence,
  normalizeTxHash,
} from "../lib/artifacts";
import type {
  CitychainBootstrapSummary,
  JudgeBundle,
  ThreeLoopEvidence,
  ValidatorEmbedEvidence,
} from "../types/citychain";

const REQUIRED_SLOTS = ["contract_page", "quest_claim_tx", "redemption_chain_settlement_tx"] as const;
const GUIDE_PROGRESS_KEY = "stabletown:citychain-judge-guide-progress:v1";

type GuideStep = {
  id: string;
  title: string;
  description: string;
  ready: boolean;
  detail: string;
};

function questLabel(questType: string): string {
  switch (questType) {
    case "onboarding":
      return "School onboarding mission";
    case "merchant_spend":
      return "Main Street purchase mission";
    case "community_event":
      return "Community volunteer mission";
    default:
      return questType;
  }
}

function asTxExplorerUrl(baseUrl: string | undefined, txHash: string | null): string | undefined {
  if (!baseUrl || !txHash) {
    return undefined;
  }
  return `${baseUrl.replace(/\/+$/, "")}/tx/${txHash}`;
}

function asAddressExplorerUrl(baseUrl: string | undefined, address: string | undefined): string | undefined {
  if (!baseUrl || !address) {
    return undefined;
  }
  return `${baseUrl.replace(/\/+$/, "")}/address/${address}`;
}

export function JudgePage() {
  const [summary, setSummary] = useState<CitychainBootstrapSummary | null>(null);
  const [bundle, setBundle] = useState<JudgeBundle | null>(null);
  const [threeLoop, setThreeLoop] = useState<ThreeLoopEvidence | null>(null);
  const [validatorEmbed, setValidatorEmbed] = useState<ValidatorEmbedEvidence | null>(null);
  const [completedStepIds, setCompletedStepIds] = useState<string[]>([]);
  const [statusLine, setStatusLine] = useState<string>("Run the guided steps top-to-bottom.");

  useEffect(() => {
    void loadBootstrapSummary().then(setSummary);
    void loadJudgeBundle().then(setBundle);
    void loadThreeLoopEvidence().then(setThreeLoop);
    void loadValidatorEmbedEvidence().then(setValidatorEmbed);
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(GUIDE_PROGRESS_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as { completedStepIds?: string[] };
      if (Array.isArray(parsed.completedStepIds)) {
        setCompletedStepIds(parsed.completedStepIds);
      }
    } catch {
      window.localStorage.removeItem(GUIDE_PROGRESS_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      GUIDE_PROGRESS_KEY,
      JSON.stringify({
        completedStepIds,
        updated_at: new Date().toISOString(),
      }),
    );
  }, [completedStepIds]);

  const strict = bundle?.strict_summary || {};
  const explorerBaseUrl = strict.explorer_base_url || summary?.explorer_base_url;
  const flowHashes = bundle?.contract_and_flow?.flow_tx_hashes || summary?.flow_tx_hashes || {};
  const flowLinks = bundle?.contract_and_flow?.explorer_links?.txs?.flow || summary?.explorer_links?.txs?.flow || {};
  const contractLinks = bundle?.contract_and_flow?.explorer_links?.contracts || summary?.explorer_links?.contracts || {};
  const claims = bundle?.flow_tx_intents?.claims || [];
  const settlement = bundle?.flow_tx_intents?.settlement || null;
  const questLoops = threeLoop?.quest_loops || [];
  const flowReceipts = summary?.flow_receipts || {};

  const contractSlot = bundle?.required_slots?.find((slot) => slot.slot === "contract_page");
  const claimSlot = bundle?.required_slots?.find((slot) => slot.slot === "quest_claim_tx");
  const settlementSlot = bundle?.required_slots?.find((slot) => slot.slot === "redemption_chain_settlement_tx");

  const claimHash = normalizeTxHash(
    (claimSlot?.reference?.tx_hash as string | undefined) || flowHashes.quest_claim || claims[0]?.tx_hash,
  );
  const settlementHash = normalizeTxHash(
    (settlementSlot?.reference?.tx_hash as string | undefined) || flowHashes.redemption_chain_settlement || settlement?.tx_hash,
  );
  const contractAddress =
    (contractSlot?.reference?.contract_address as string | undefined) || bundle?.contract_and_flow?.contracts?.quest_manager;

  const contractUrl = contractSlot?.explorer_url || contractLinks.quest_manager || asAddressExplorerUrl(explorerBaseUrl, contractAddress);
  const claimUrl = claimSlot?.explorer_url || flowLinks.quest_claim || asTxExplorerUrl(explorerBaseUrl, claimHash);
  const settlementUrl =
    settlementSlot?.explorer_url || flowLinks.redemption_chain_settlement || asTxExplorerUrl(explorerBaseUrl, settlementHash);

  const claimsConfirmedCount = claims.filter((item) => item.status === "confirmed").length;
  const settlementConfirmed = settlement?.status === "confirmed";
  const strictClaimReceiptConfirmed = flowReceipts.quest_claim?.status === "confirmed";
  const strictSettlementReceiptConfirmed = flowReceipts.redemption_chain_settlement?.status === "confirmed";
  const hasTxIntentRecords = claims.length > 0 || !!settlement;
  const txFinalityReady = hasTxIntentRecords
    ? claimsConfirmedCount >= 3 && settlementConfirmed
    : strictClaimReceiptConfirmed && strictSettlementReceiptConfirmed;
  const txFinalityDetail = hasTxIntentRecords
    ? `claims_confirmed=${claimsConfirmedCount}/3, settlement=${settlement?.status || "missing"}`
    : `tx-intent records unavailable in mirror; strict receipts claim=${flowReceipts.quest_claim?.status || "missing"}, settlement=${
        flowReceipts.redemption_chain_settlement?.status || "missing"
      }`;
  const attachedSlots = useMemo(
    () => new Set((bundle?.required_slots || []).filter((slot) => slot.attached).map((slot) => slot.slot)),
    [bundle?.required_slots],
  );

  const steps: GuideStep[] = useMemo(
    () => [
      {
        id: "strict_context",
        title: "Load strict Fuji context",
        description: "Confirm winner-grade strict status is present before continuing.",
        ready:
          !!summary &&
          (strict.proof_mode || summary.proof_mode) === "fuji_onchain" &&
          (strict.proof_validated ?? summary.proof_validated) === true &&
          (strict.competition_grade ?? summary.competition_grade) === true,
        detail: summary
          ? `mode=${strict.proof_mode || summary.proof_mode}, validated=${String(
              strict.proof_validated ?? summary.proof_validated,
            )}, competition_grade=${String(strict.competition_grade ?? summary.competition_grade)}`
          : "Missing artifacts/citychain-bootstrap-summary.json",
      },
      {
        id: "three_quest_loops",
        title: "Validate 3 quest loops + merchant settlement",
        description: "Ensure onboarding, merchant spend, and community missions are present.",
        ready: questLoops.length >= 3 && !!threeLoop?.redemption_settlement?.tx_intent_id,
        detail: `${questLoops.length} loop(s) captured, settlement intent=${threeLoop?.redemption_settlement?.tx_intent_id || "missing"}`,
      },
      {
        id: "validator_embed",
        title: "Confirm validator + embedded wallet evidence",
        description: "Show governance and embed session evidence in the same run package.",
        ready: (validatorEmbed?.validator?.validator_count || 0) > 0 && !!validatorEmbed?.embed?.embed_session_id,
        detail: `validators=${validatorEmbed?.validator?.validator_count || 0}, embed_session=${
          validatorEmbed?.embed?.embed_session_id || "missing"
        }`,
      },
      {
        id: "tx_finality",
        title: "Confirm tx-intent finality",
        description: "All claim intents and merchant settlement must be confirmed.",
        ready: txFinalityReady,
        detail: txFinalityDetail,
      },
      {
        id: "proof_triplet",
        title: "Verify proof triplet links + hashes",
        description: "Contract, claim tx, and settlement tx must have explorer links and canonical hashes.",
        ready: !!contractUrl && !!claimUrl && !!settlementUrl && !!claimHash && !!settlementHash,
        detail: `contract=${contractAddress || "missing"}, claim=${claimHash || "missing"}, settlement=${settlementHash || "missing"}`,
      },
      {
        id: "required_slots",
        title: "Check required proof slots",
        description: "All required slots must be attached for submission evidence.",
        ready: REQUIRED_SLOTS.every((slot) => attachedSlots.has(slot)),
        detail: `${REQUIRED_SLOTS.filter((slot) => attachedSlots.has(slot)).length}/${REQUIRED_SLOTS.length} slots attached`,
      },
      {
        id: "export_ready",
        title: "Export-ready judge package",
        description: "Bundle must include generated timestamp and artifact pointers for judges.",
        ready: !!bundle?.generated_at && !!bundle?.artifacts?.summary_path && !!bundle?.artifacts?.strict_links_path,
        detail: `generated_at=${bundle?.generated_at || "missing"}, summary_path=${
          bundle?.artifacts?.summary_path || "missing"
        }`,
      },
    ],
    [
      attachedSlots,
      bundle?.artifacts?.strict_links_path,
      bundle?.artifacts?.summary_path,
      bundle?.generated_at,
      claimHash,
      claimUrl,
      contractAddress,
      contractUrl,
      questLoops.length,
      settlementHash,
      settlementUrl,
      strict.competition_grade,
      strict.proof_mode,
      strict.proof_validated,
      summary,
      txFinalityDetail,
      txFinalityReady,
      threeLoop?.redemption_settlement?.tx_intent_id,
      validatorEmbed?.embed?.embed_session_id,
      validatorEmbed?.validator?.validator_count,
    ],
  );

  const completedSet = new Set(completedStepIds);
  const completedCount = steps.filter((step) => completedSet.has(step.id)).length;
  const allComplete = completedCount === steps.length;

  const isUnlocked = (index: number) => steps.slice(0, index).every((step) => completedSet.has(step.id));

  const completeStep = (index: number) => {
    const step = steps[index];
    if (!isUnlocked(index)) {
      setStatusLine(`Step blocked: complete previous steps first (${step.title}).`);
      return;
    }
    if (!step.ready) {
      setStatusLine(`Step blocked: ${step.detail}`);
      return;
    }
    if (completedSet.has(step.id)) {
      setStatusLine(`Step already complete: ${step.title}`);
      return;
    }
    const next = [...completedStepIds, step.id];
    setCompletedStepIds(next);
    setStatusLine(`Step complete: ${step.title}`);
  };

  const autoRun = () => {
    const nextCompleted = [...completedStepIds];
    const nextSet = new Set(nextCompleted);

    for (let index = 0; index < steps.length; index += 1) {
      const step = steps[index];
      const unlocked = steps.slice(0, index).every((value) => nextSet.has(value.id));
      if (!unlocked) {
        setStatusLine(`Auto-run blocked at "${step.title}" (previous step incomplete).`);
        setCompletedStepIds(nextCompleted);
        return;
      }
      if (!step.ready) {
        setStatusLine(`Auto-run blocked at "${step.title}": ${step.detail}`);
        setCompletedStepIds(nextCompleted);
        return;
      }
      if (!nextSet.has(step.id)) {
        nextSet.add(step.id);
        nextCompleted.push(step.id);
      }
    }

    setCompletedStepIds(nextCompleted);
    setStatusLine("Guided walkthrough complete. Evidence package is judge-ready.");
  };

  const resetGuide = () => {
    setCompletedStepIds([]);
    setStatusLine("Guide reset. Start from step 1.");
  };

  return (
    <section className="panel">
      <h2>Judge mode (guided walkthrough)</h2>
      <p>
        Run this lane live with judges: complete each step in order, inspect tx finality, and confirm proof triplet
        evidence before submission.
      </p>

      <div className="guide-toolbar">
        <button className="guide-button" type="button" onClick={autoRun}>
          Auto-run guided checks
        </button>
        <button className="guide-button guide-button-secondary" type="button" onClick={resetGuide}>
          Reset guide
        </button>
        <span className="guide-progress">
          Progress: {completedCount}/{steps.length}
        </span>
      </div>
      <p className="guide-status">{statusLine}</p>

      <ol className="guide-list">
        {steps.map((step, index) => {
          const completed = completedSet.has(step.id);
          const unlocked = isUnlocked(index);
          const ready = step.ready;
          const status = completed ? "completed" : unlocked ? (ready ? "ready" : "blocked") : "locked";

          return (
            <li key={step.id} className={`guide-step guide-step-${status}`}>
              <div className="guide-step-header">
                <h3>{step.title}</h3>
                <span className={`guide-badge guide-badge-${status}`}>{status}</span>
              </div>
              <p>{step.description}</p>
              <p className="guide-detail">{step.detail}</p>
              {!completed ? (
                <button
                  type="button"
                  className="guide-button"
                  disabled={!unlocked || !ready}
                  onClick={() => completeStep(index)}
                >
                  Mark step complete
                </button>
              ) : null}
            </li>
          );
        })}
      </ol>

      <h3>Civic transaction timeline</h3>
      <ul>
        {questLoops.map((loop, index) => {
          const claimIntent = claims[index];
          const strictFallbackReceipt = index === 0 ? flowReceipts.quest_claim : undefined;
          const txHash = normalizeTxHash(claimIntent?.tx_hash || strictFallbackReceipt?.tx_hash);
          const txUrl = claimIntent?.explorer_url || asTxExplorerUrl(explorerBaseUrl, txHash);
          const status = claimIntent?.status || strictFallbackReceipt?.status || loop.claim_status || "n/a";

          return (
            <li key={`${loop.quest_type}-${loop.claim_tx_intent_id || index}`}>
              <strong>{questLabel(loop.quest_type)}</strong>: attestation={loop.quest_attestation_id || "n/a"}, claim_intent=
              {loop.claim_tx_intent_id || "n/a"}, tx_hash={txHash || "n/a"}, status={status}
              {txUrl ? (
                <>
                  {" "}
                  <a href={txUrl} target="_blank" rel="noreferrer">
                    explorer
                  </a>
                </>
              ) : null}
            </li>
          );
        })}
        <li>
          <strong>Merchant settlement</strong>: intent={settlement?.tx_intent_id || threeLoop?.redemption_settlement?.tx_intent_id || "n/a"},
          tx_hash={settlementHash || "n/a"}, status=
          {settlement?.status || flowReceipts.redemption_chain_settlement?.status || threeLoop?.redemption_settlement?.status || "n/a"}
          {(settlement?.explorer_url || settlementUrl) ? (
            <>
              {" "}
              <a href={settlement?.explorer_url || settlementUrl} target="_blank" rel="noreferrer">
                explorer
              </a>
            </>
          ) : null}
        </li>
      </ul>

      <h3>Proof triplet</h3>
      <ul>
        <li>
          <strong>Contract page:</strong>{" "}
          {contractUrl ? (
            <a href={contractUrl} target="_blank" rel="noreferrer">
              {contractUrl}
            </a>
          ) : (
            "missing"
          )}
        </li>
        <li>
          <strong>Claim tx:</strong>{" "}
          {claimUrl ? (
            <a href={claimUrl} target="_blank" rel="noreferrer">
              {claimHash || claimUrl}
            </a>
          ) : (
            "missing"
          )}
        </li>
        <li>
          <strong>Settlement tx:</strong>{" "}
          {settlementUrl ? (
            <a href={settlementUrl} target="_blank" rel="noreferrer">
              {settlementHash || settlementUrl}
            </a>
          ) : (
            "missing"
          )}
        </li>
      </ul>

      <h3>Judge handoff</h3>
      <p>
        Use this guided lane live, then show final slot details in <Link to="/citychain/proof">Proof lane</Link>. For
        narrative context, begin in <Link to="/citychain/smallville">Smallville lane</Link>.
      </p>

      {allComplete ? <p className="guide-success">Walkthrough complete: all guided checks passed.</p> : null}
    </section>
  );
}
