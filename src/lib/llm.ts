/**
 * Client wrapper for /api/mark-answer — the LLM semantic-meaning fallback.
 * Never throws; falls back to an empty result whenever anything goes wrong
 * so the deterministic marker's verdict stands on any failure.
 */

import { recordTokenUsage } from "./tokens";

export interface ConceptForReview {
  /** stable id used by the client to map credit back to concept indexes */
  id: string;
  label: string;
  lessonLine: string;
}

export interface SemanticReview {
  credited: string[];
  reason: string;
  /** true when the endpoint replied at all (deployed + reachable) */
  ran: boolean;
  /** Groq/config/timeout error name if the endpoint returned one */
  error?: string;
}

const REVIEW_TIMEOUT_MS = 7000;

export async function requestSemanticReview(
  answer: string,
  concepts: ConceptForReview[],
  alreadyCredited: string[] = [],
  /** unit standard the learner is working in — used only for token accounting */
  unitUs?: string
): Promise<SemanticReview> {
  if (!answer.trim() || concepts.length === 0)
    return { credited: [], reason: "", ran: false };
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), REVIEW_TIMEOUT_MS);
  try {
    const r = await fetch("/api/mark-answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer, concepts, alreadyCredited }),
      signal: controller.signal,
    });
    if (!r.ok) return { credited: [], reason: "", ran: false, error: `http_${r.status}` };
    const data = (await r.json()) as SemanticReview & {
      error?: string;
      model?: string;
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    };
    // Fire-and-forget token accounting for the super user's usage gauge.
    if (unitUs && data.usage) {
      void recordTokenUsage({
        us: unitUs,
        model: typeof data.model === "string" ? data.model : "",
        promptTokens: Number(data.usage.prompt_tokens ?? 0),
        completionTokens: Number(data.usage.completion_tokens ?? 0),
        totalTokens: Number(data.usage.total_tokens ?? 0),
      });
    }
    return {
      credited: Array.isArray(data.credited)
        ? data.credited.filter((v) => typeof v === "string")
        : [],
      reason: typeof data.reason === "string" ? data.reason : "",
      ran: true,
      error: typeof data.error === "string" ? data.error : undefined,
    };
  } catch {
    return { credited: [], reason: "", ran: false, error: "network" };
  } finally {
    clearTimeout(t);
  }
}
