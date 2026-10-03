import { supabase } from "./supabase";
import { COURSE_META, findUnit } from "../data/course";
import {
  CONTENT_MODELS,
  MARKING_MODELS,
  PRESENTATION_MODELS,
  type AiModelInfo,
} from "./aiModels";

export { CONTENT_MODELS, MARKING_MODELS, PRESENTATION_MODELS };

/**
 * AI-marking token accounting.
 *
 * Every successful /api/mark-answer call reports the OpenAI token usage it
 * consumed; the client records one row per call in the `token_usage` table,
 * tagged qualification → module → unit standard, so the super user's
 * dashboard gauge can aggregate spend at every level. Recording is
 * fire-and-forget: marking never waits for (or fails because of) accounting.
 */

export interface TokenUsageEvent {
  /** unit standard code the learner was working in (e.g. "114047") */
  us: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/** One grouped row from the `token_usage_summary` RPC. */
export interface TokenSummaryRow {
  qual: string;
  module_id: string;
  us: string;
  model: string;
  requests: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export type TokenSummaryResult =
  | { ok: true; rows: TokenSummaryRow[] }
  | { ok: false; error: "no-cloud" | "not-signed-in" | "missing-table" | "failed" };

/** Record one marking call's token usage. Never throws; no-ops when cloud
 *  sync is off, the visitor is not signed in, or the table is missing. */
export async function recordTokenUsage(ev: TokenUsageEvent): Promise<void> {
  if (!supabase) return;
  if (ev.totalTokens <= 0 && ev.promptTokens <= 0 && ev.completionTokens <= 0) return;
  try {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user.id;
    if (!uid) return;
    const moduleId = findUnit(ev.us)?.module.id ?? "";
    await supabase.from("token_usage").insert({
      user_id: uid,
      qual: COURSE_META.saqaId,
      module_id: moduleId,
      us: ev.us,
      model: ev.model.slice(0, 60),
      prompt_tokens: Math.max(0, Math.round(ev.promptTokens)),
      completion_tokens: Math.max(0, Math.round(ev.completionTokens)),
      total_tokens: Math.max(0, Math.round(ev.totalTokens)),
    });
  } catch {
    /* accounting must never disturb marking */
  }
}

/** Grouped token sums (per qual/module/us/model), optionally since a date.
 *  RLS means only the admin (super user) account gets rows back. */
export async function fetchTokenSummary(since?: Date): Promise<TokenSummaryResult> {
  if (!supabase) return { ok: false, error: "no-cloud" };
  const { data: sess } = await supabase.auth.getSession();
  if (!sess.session) return { ok: false, error: "not-signed-in" };
  const { data, error } = await supabase.rpc("token_usage_summary", {
    since: since ? since.toISOString() : null,
  });
  if (error) {
    // 42P01 = table missing, 42883/PGRST202 = function missing — both mean
    // the updated supabase/schema.sql has not been run yet.
    const missing =
      error.code === "42P01" ||
      error.code === "42883" ||
      error.code === "PGRST202" ||
      /token_usage/.test(error.message ?? "");
    return { ok: false, error: missing ? "missing-table" : "failed" };
  }
  const rows = (Array.isArray(data) ? data : []).map((r) => ({
    qual: String(r.qual ?? ""),
    module_id: String(r.module_id ?? ""),
    us: String(r.us ?? ""),
    model: String(r.model ?? ""),
    requests: Number(r.requests ?? 0),
    prompt_tokens: Number(r.prompt_tokens ?? 0),
    completion_tokens: Number(r.completion_tokens ?? 0),
    total_tokens: Number(r.total_tokens ?? 0),
  }));
  return { ok: true, rows };
}

/** One raw usage record (admin-only read — used for the daily usage chart). */
export interface TokenRecord {
  createdAt: string;
  qual: string;
  moduleId: string;
  us: string;
  model: string;
  prompt: number;
  completion: number;
  total: number;
}

export type TokenRecordsResult =
  | { ok: true; rows: TokenRecord[] }
  | { ok: false; error: "no-cloud" | "not-signed-in" | "missing-table" | "failed" };

/** Raw usage rows in [from, to), paginated. RLS: only the admin gets rows. */
export async function fetchTokenRecords(from: Date, to: Date): Promise<TokenRecordsResult> {
  if (!supabase) return { ok: false, error: "no-cloud" };
  const { data: sess } = await supabase.auth.getSession();
  if (!sess.session) return { ok: false, error: "not-signed-in" };
  const rows: TokenRecord[] = [];
  const PAGE = 1000;
  for (let page = 0; page < 20; page++) {
    const { data, error } = await supabase
      .from("token_usage")
      .select("created_at,qual,module_id,us,model,prompt_tokens,completion_tokens,total_tokens")
      .gte("created_at", from.toISOString())
      .lt("created_at", to.toISOString())
      .order("created_at", { ascending: true })
      .range(page * PAGE, page * PAGE + PAGE - 1);
    if (error) {
      const missing = error.code === "42P01" || /token_usage/.test(error.message ?? "");
      return { ok: false, error: missing ? "missing-table" : "failed" };
    }
    for (const r of data ?? []) {
      rows.push({
        createdAt: String(r.created_at ?? ""),
        qual: String(r.qual ?? ""),
        moduleId: String(r.module_id ?? ""),
        us: String(r.us ?? ""),
        model: String(r.model ?? ""),
        prompt: Number(r.prompt_tokens ?? 0),
        completion: Number(r.completion_tokens ?? 0),
        total: Number(r.total_tokens ?? 0),
      });
    }
    if (!data || data.length < PAGE) break;
  }
  return { ok: true, rows };
}

/** OpenAI list prices in USD per 1M tokens (input, output) for the models
 *  the marking endpoint may use. Unknown models fall back to gpt-4o-mini. */
const PRICES_PER_MTOK: Record<string, { in: number; out: number }> = {
  "gpt-4o-mini": { in: 0.15, out: 0.6 },
  "gpt-4.1-nano": { in: 0.1, out: 0.4 },
  "gpt-4.1-mini": { in: 0.4, out: 1.6 },
  "gpt-4.1": { in: 2, out: 8 },
  "gpt-4o": { in: 2.5, out: 10 },
  "gpt-5.6-luna": { in: 0.2, out: 1.2 },
};

/* ---------- super-user marking-model setting ---------- */

export type MarkingModelInfo = AiModelInfo;

export const DEFAULT_MARKING_MODEL = "gpt-4.1-mini";
export const DEFAULT_CONTENT_MODEL = "gpt-4.1-mini";
export const DEFAULT_PRESENTATION_MODEL = "gpt-4.1-mini";

/** Shared key (`.shared` suffix → synced via shared_state to every account)
 *  so all learners' marking calls use the model the super user picked. */
const MODEL_KEY = "itss.aimodel.shared";
const CONTENT_MODEL_KEY = "itss.aicontentmodel.shared";
const PRESENTATION_MODEL_KEY = "itss.aipresentationmodel.shared";

function loadModel(key: string, models: readonly AiModelInfo[], defaultModel: string): string {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "null");
    if (typeof value === "string" && models.some((model) => model.id === value)) return value;
  } catch {
    /* fall through to default */
  }
  return defaultModel;
}

function saveModel(key: string, id: string, models: readonly AiModelInfo[]): void {
  if (models.some((model) => model.id === id)) localStorage.setItem(key, JSON.stringify(id));
}

export const loadMarkingModel = () => loadModel(MODEL_KEY, MARKING_MODELS, DEFAULT_MARKING_MODEL);
export const saveMarkingModel = (id: string) => saveModel(MODEL_KEY, id, MARKING_MODELS);
export const loadContentModel = () => loadModel(CONTENT_MODEL_KEY, CONTENT_MODELS, DEFAULT_CONTENT_MODEL);
export const saveContentModel = (id: string) => saveModel(CONTENT_MODEL_KEY, id, CONTENT_MODELS);
export const loadPresentationModel = () => loadModel(PRESENTATION_MODEL_KEY, PRESENTATION_MODELS, DEFAULT_PRESENTATION_MODEL);
export const savePresentationModel = (id: string) => saveModel(PRESENTATION_MODEL_KEY, id, PRESENTATION_MODELS);

function priceFor(model: string): { in: number; out: number } {
  const hit = Object.keys(PRICES_PER_MTOK).find((k) => model.startsWith(k));
  return hit ? PRICES_PER_MTOK[hit] : PRICES_PER_MTOK["gpt-4o-mini"];
}

/** Estimated USD cost of the given prompt/completion token counts. */
export function estimateCostUSD(model: string, promptTokens: number, completionTokens: number): number {
  const p = priceFor(model);
  return (promptTokens / 1_000_000) * p.in + (completionTokens / 1_000_000) * p.out;
}

/** First moment of the current calendar month (local time). */
export function monthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/** Compact display for token counts: 1234 → "1 234", 56789 → "56.8k", 1.2M. */
export function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString("en-ZA");
}
