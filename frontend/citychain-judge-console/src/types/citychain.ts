export interface CitychainBootstrapSummary {
  proof_mode: "deterministic" | "fuji_onchain" | string;
  proof_validated: boolean;
  competition_grade: boolean;
  evm_chain_id?: number;
  rpc_url?: string;
  explorer_base_url?: string;
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

export interface QuestLoopRecord {
  quest_type: string;
  quest_id?: string;
  quest_attestation_id?: string;
  claim_id?: string;
  claim_status?: string;
  claim_tx_intent_id?: string;
}

export interface ThreeLoopEvidence {
  chain_bootstrap_run_id?: string;
  chain_id?: string;
  generated_at?: string;
  network?: string;
  participant_id?: string;
  program_id?: string;
  tenant_id?: string;
  quest_loops?: QuestLoopRecord[];
  redemption_settlement?: {
    chain_id?: string;
    redemption_id?: string;
    status?: string;
    tx_intent_id?: string;
  };
  strict?: boolean;
}

export interface ValidatorEmbedEvidence {
  captured_at?: string;
  chain_id?: string;
  tenant_id?: string;
  program_id?: string;
  participant_id?: string;
  validator?: {
    validator_count?: number;
    validators?: Array<{
      name?: string;
      role?: string;
      status?: string;
    }>;
    governance?: Record<string, string>;
  };
  embed?: {
    embedded_client_id?: string;
    embed_session_id?: string;
    status?: string;
    expires_at?: string;
    partner_organization_id?: string;
    partner_api_key_id?: string;
  };
}

export interface ProofSlotStatus {
  slot: "contract_page" | "quest_claim_tx" | "redemption_chain_settlement_tx" | string;
  attached: boolean;
  explorer_url?: string | null;
  reference?: Record<string, unknown>;
}

export interface JudgeBundle {
  generated_at?: string;
  bootstrap_run_id?: string;
  network?: string;
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
  contract_and_flow?: {
    contracts?: Record<string, string>;
    flow_tx_hashes?: {
      quest_claim?: string;
      redemption_chain_settlement?: string;
      [key: string]: string | undefined;
    };
    explorer_links?: {
      contracts?: Record<string, string>;
      txs?: {
        flow?: Record<string, string>;
      };
    };
  };
  artifacts?: {
    summary_path?: string;
    three_loop_path?: string;
    validator_embed_path?: string;
    strict_deploy_path?: string;
    strict_receipts_path?: string;
    strict_links_path?: string;
    local_l1_path?: string | null;
  };
  proof_slots_required?: string[];
  required_slots?: ProofSlotStatus[];
}

export interface JudgeRunState {
  strict_summary: JudgeBundle["strict_summary"] | null;
  flow_tx_intents: JudgeBundle["flow_tx_intents"] | null;
  required_slots: ProofSlotStatus[];
}
