export interface CitychainBootstrapSummary {
  proof_mode: "deterministic" | "fuji_onchain" | string;
  proof_validated: boolean;
  competition_grade: boolean;
  evm_chain_id?: number;
  rpc_url?: string;
  contracts?: Record<string, string>;
  deploy_tx_hashes?: Record<string, string>;
  flow_tx_hashes?: {
    quest_claim?: string;
    redemption_chain_settlement?: string;
    [key: string]: string | undefined;
  };
  explorer_links?: {
    contracts?: Record<string, string>;
    txs?: {
      deploy?: Record<string, string>;
      flow?: Record<string, string>;
    };
  };
}

export type SmallvilleMode = "live" | "fallback";
export type SmallvilleStepStatus = "idle" | "in_progress" | "completed" | "failed";

export interface SmallvilleRunState {
  mode: SmallvilleMode;
  bootstrap_run_id: string | null;
  strict_ready: boolean;
  quest_types: string[];
  steps?: Record<string, SmallvilleStepStatus>;
}

export interface TxIntentDisplayRecord {
  tx_intent_id: string;
  status: string;
  tx_hash: string;
  block_number?: number;
  explorer_url?: string;
}

export interface ProofSlotStatus {
  slot: "contract_page" | "quest_claim_tx" | "redemption_chain_settlement_tx" | string;
  attached: boolean;
  explorer_url?: string | null;
  reference?: Record<string, unknown>;
}

export interface JudgeBundle {
  run?: {
    chain_bootstrap_run_id?: string;
    chain_id?: string;
    tenant_id?: string;
  };
  strict_summary?: {
    proof_mode?: string;
    proof_validated?: boolean;
    competition_grade?: boolean;
    explorer_base_url?: string;
  };
  flow_tx_intents?: {
    claims?: TxIntentDisplayRecord[];
    settlement?: TxIntentDisplayRecord | null;
  };
  required_slots?: ProofSlotStatus[];
}

export interface JudgeRunState {
  strict_summary: JudgeBundle["strict_summary"] | null;
  flow_tx_intents: JudgeBundle["flow_tx_intents"] | null;
  required_slots: ProofSlotStatus[];
}
