import type {
  CitychainBootstrapSummary,
  JudgeBundle,
  ThreeLoopEvidence,
  ValidatorEmbedEvidence,
} from "../types/citychain";

function normalizeBasePath(value: string | undefined): string {
  if (!value || value.trim() === "") {
    return "";
  }

  const trimmed = value.trim().replace(/\/+$/, "");
  return trimmed === "/" ? "" : trimmed;
}

const configuredArtifactsBase = normalizeBasePath(import.meta.env.VITE_ARTIFACTS_BASE as string | undefined);
const routerBase = normalizeBasePath(import.meta.env.BASE_URL as string | undefined);
const artifactsBase = configuredArtifactsBase || `${routerBase}/artifacts`;

export function normalizeTxHash(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  const noPrefix = trimmed.replace(/^0x/i, "");
  if (!/^[0-9a-fA-F]{64}$/.test(noPrefix)) {
    return trimmed;
  }

  return `0x${noPrefix.toLowerCase()}`;
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function loadBootstrapSummary(): Promise<CitychainBootstrapSummary | null> {
  return fetchJson<CitychainBootstrapSummary>(`${artifactsBase}/citychain-bootstrap-summary.json`);
}

export async function loadJudgeBundle(): Promise<JudgeBundle | null> {
  return fetchJson<JudgeBundle>(`${artifactsBase}/citychain_judge_demo_bundle.json`);
}

export async function loadThreeLoopEvidence(): Promise<ThreeLoopEvidence | null> {
  return fetchJson<ThreeLoopEvidence>(`${artifactsBase}/citychain_three_loop_evidence.json`);
}

export async function loadValidatorEmbedEvidence(): Promise<ValidatorEmbedEvidence | null> {
  return fetchJson<ValidatorEmbedEvidence>(`${artifactsBase}/citychain_validator_embed_evidence.json`);
}
