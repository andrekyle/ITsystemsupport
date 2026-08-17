/**
 * Client wrapper for /api/mark-answer — the LLM semantic-meaning fallback.
 * Never throws; falls back to an empty result whenever anything goes wrong
 * so the deterministic marker's verdict stands on any failure.
 */

export interface ConceptForReview {
  /** stable id used by the client to map credit back to concept indexes */
  id: string;
  label: string;
  lessonLine: string;
}

export interface SemanticReview {
  credited: string[];
  reason: string;
}

const REVIEW_TIMEOUT_MS = 7000;

export async function requestSemanticReview(
  answer: string,
  concepts: ConceptForReview[]
): Promise<SemanticReview> {
  if (!answer.trim() || concepts.length === 0) return { credited: [], reason: "" };
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), REVIEW_TIMEOUT_MS);
  try {
    const r = await fetch("/api/mark-answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer, concepts }),
      signal: controller.signal,
    });
    if (!r.ok) return { credited: [], reason: "" };
    const data = (await r.json()) as SemanticReview;
    return {
      credited: Array.isArray(data.credited) ? data.credited.filter((v) => typeof v === "string") : [],
      reason: typeof data.reason === "string" ? data.reason : "",
    };
  } catch {
    return { credited: [], reason: "" };
  } finally {
    clearTimeout(t);
  }
}
