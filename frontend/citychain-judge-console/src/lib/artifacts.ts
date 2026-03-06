import type { CitychainBootstrapSummary, JudgeBundle } from "../types/citychain";

const artifactsBase = (import.meta.env.VITE_ARTIFACTS_BASE as string | undefined)?.replace(/\/+$/, "") || "/artifacts";

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
