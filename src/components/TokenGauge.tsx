import { useEffect, useMemo, useState } from "react";
import { Icon } from "../icons";
import { COURSE_META, MODULES, findUnit, usLabel } from "../data/course";
import {
  estimateCostUSD,
  fetchTokenSummary,
  fmtTokens,
  monthStart,
  type TokenSummaryResult,
  type TokenSummaryRow,
} from "../lib/tokens";
import { Ring } from "./Ring";

/**
 * Super-user-only dashboard section: AI-marking token gauge.
 *
 * Shows total OpenAI tokens consumed by /api/mark-answer against a monthly
 * budget, with a drill-down per qualification → module → unit standard.
 * Data comes from the `token_usage` table (see supabase/schema.sql), which
 * only the admin account can read.
 */

const BUDGET_KEY = "itss.tokenBudget";
const DEFAULT_BUDGET = 2_000_000;

function loadBudget(): number {
  try {
    const v = Number(JSON.parse(localStorage.getItem(BUDGET_KEY) ?? "null"));
    return Number.isFinite(v) && v > 0 ? v : DEFAULT_BUDGET;
  } catch {
    return DEFAULT_BUDGET;
  }
}

interface Totals {
  requests: number;
  prompt: number;
  completion: number;
  total: number;
  costUSD: number;
}

function totalsOf(rows: TokenSummaryRow[]): Totals {
  const t: Totals = { requests: 0, prompt: 0, completion: 0, total: 0, costUSD: 0 };
  for (const r of rows) {
    t.requests += r.requests;
    t.prompt += r.prompt_tokens;
    t.completion += r.completion_tokens;
    t.total += r.total_tokens;
    t.costUSD += estimateCostUSD(r.model, r.prompt_tokens, r.completion_tokens);
  }
  return t;
}

/** Group rows one level down: qual → module → unit standard. */
function groupRows(rows: TokenSummaryRow[]) {
  const quals = new Map<string, Map<string, Map<string, Totals>>>();
  for (const r of rows) {
    const modId = r.module_id || findUnit(r.us)?.module.id || "";
    const byModule = quals.get(r.qual) ?? new Map<string, Map<string, Totals>>();
    quals.set(r.qual, byModule);
    const byUs = byModule.get(modId) ?? new Map<string, Totals>();
    byModule.set(modId, byUs);
    const t = byUs.get(r.us) ?? { requests: 0, prompt: 0, completion: 0, total: 0, costUSD: 0 };
    t.requests += r.requests;
    t.prompt += r.prompt_tokens;
    t.completion += r.completion_tokens;
    t.total += r.total_tokens;
    t.costUSD += estimateCostUSD(r.model, r.prompt_tokens, r.completion_tokens);
    byUs.set(r.us, t);
  }
  return quals;
}

function sumMap(m: Map<string, Totals>): Totals {
  const t: Totals = { requests: 0, prompt: 0, completion: 0, total: 0, costUSD: 0 };
  for (const v of m.values()) {
    t.requests += v.requests;
    t.prompt += v.prompt;
    t.completion += v.completion;
    t.total += v.total;
    t.costUSD += v.costUSD;
  }
  return t;
}

function sumTotals(list: Totals[]): Totals {
  const t: Totals = { requests: 0, prompt: 0, completion: 0, total: 0, costUSD: 0 };
  for (const v of list) {
    t.requests += v.requests;
    t.prompt += v.prompt;
    t.completion += v.completion;
    t.total += v.total;
    t.costUSD += v.costUSD;
  }
  return t;
}

function qualTitle(qual: string): string {
  return qual === COURSE_META.saqaId
    ? `${COURSE_META.title} (SAQA ${qual})`
    : `Qualification SAQA ${qual}`;
}

function moduleTitle(qual: string, modId: string): { order: number; label: string } {
  if (qual === COURSE_META.saqaId) {
    const i = MODULES.findIndex((m) => m.id === modId);
    if (i >= 0) return { order: i, label: `Module ${i + 1}: ${MODULES[i].name}` };
  }
  return { order: 999, label: modId ? `Module ${modId}` : "Other lessons" };
}

function usTitle(us: string): string {
  const hit = findUnit(us);
  return hit ? `${usLabel(us)} — ${hit.unit.title}` : usLabel(us);
}

const usd = (v: number) =>
  v >= 0.995 ? `$${v.toFixed(2)}` : v > 0 ? `$${v.toFixed(3)}` : "$0.00";

export function TokenGauge() {
  const [range, setRange] = useState<"month" | "all">("month");
  const [month, setMonth] = useState<TokenSummaryResult | null>(null);
  const [all, setAll] = useState<TokenSummaryResult | null>(null);
  const [budget, setBudget] = useState<number>(loadBudget);
  const [editBudget, setEditBudget] = useState(false);
  const [openMods, setOpenMods] = useState<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;
    void Promise.all([fetchTokenSummary(monthStart()), fetchTokenSummary()]).then(
      ([m, a]) => {
        if (!alive) return;
        setMonth(m);
        setAll(a);
      }
    );
    return () => {
      alive = false;
    };
  }, []);

  const active = range === "month" ? month : all;
  const rows = active?.ok ? active.rows : [];
  const monthTotals = useMemo(() => (month?.ok ? totalsOf(month.rows) : null), [month]);
  const activeTotals = useMemo(() => totalsOf(rows), [rows]);
  const grouped = useMemo(() => groupRows(rows), [rows]);

  const saveBudget = (v: number) => {
    const clean = Number.isFinite(v) && v >= 1000 ? Math.round(v) : DEFAULT_BUDGET;
    setBudget(clean);
    localStorage.setItem(BUDGET_KEY, JSON.stringify(clean));
    setEditBudget(false);
  };

  const gaugeValue = monthTotals ? Math.min(1, monthTotals.total / budget) : 0;
  const overBudget = (monthTotals?.total ?? 0) > budget;

  const body = () => {
    if (!month || !all) return <p className="mini-note">Loading token usage…</p>;
    if (!active?.ok) {
      const err = active?.error ?? "failed";
      return (
        <div className="callout" style={{ margin: 0 }}>
          <span className="ico">
            <Icon name="info" size={18} />
          </span>
          <span>
            {err === "no-cloud" &&
              "Cloud sync is not configured on this deployment, so token usage cannot be recorded or read."}
            {err === "not-signed-in" &&
              "Sign in with your cloud account to read the token usage records."}
            {err === "missing-table" && (
              <>
                The token-usage table has not been created yet. Run the updated{" "}
                <strong>supabase/schema.sql</strong> in Supabase → SQL Editor once, then reload
                this page. New marking calls start recording immediately after that.
              </>
            )}
            {err === "failed" && "Could not load token usage — try reloading the page."}
          </span>
        </div>
      );
    }
    if (rows.length === 0) {
      return (
        <p className="mini-note" style={{ margin: 0 }}>
          No AI marking calls recorded {range === "month" ? "this month" : "yet"}. Tokens are
          logged each time a learner's typed answer is reviewed by the AI marker.
        </p>
      );
    }

    // largest module total in view — bars are proportional to it
    let maxModule = 0;
    for (const byModule of grouped.values())
      for (const byUs of byModule.values()) maxModule = Math.max(maxModule, sumMap(byUs).total);

    return [...grouped.entries()].map(([qual, byModule]) => {
      const modules = [...byModule.entries()]
        .map(([modId, byUs]) => ({ modId, byUs, meta: moduleTitle(qual, modId), totals: sumMap(byUs) }))
        .sort((a, b) => a.meta.order - b.meta.order || b.totals.total - a.totals.total);
      const qualTotals = sumTotals(modules.map((m) => m.totals));
      return (
        <div key={qual} className="token-qual">
          <div className="token-qual-head">
            <Icon name="gradcap" size={16} />
            <strong>{qualTitle(qual)}</strong>
            <span className="mini-note">
              {fmtTokens(qualTotals.total)} tokens · {qualTotals.requests} request
              {qualTotals.requests === 1 ? "" : "s"} · ≈{usd(qualTotals.costUSD)}
            </span>
          </div>
          {modules.map(({ modId, byUs, meta, totals }) => {
            const key = `${qual}/${modId}`;
            const open = openMods.has(key);
            const units = [...byUs.entries()].sort((a, b) => b[1].total - a[1].total);
            return (
              <div key={key} className="token-mod">
                <button
                  className="token-mod-row"
                  onClick={() =>
                    setOpenMods((s) => {
                      const n = new Set(s);
                      if (n.has(key)) n.delete(key);
                      else n.add(key);
                      return n;
                    })
                  }
                  aria-expanded={open}
                  title={`${meta.label} — click to ${open ? "hide" : "show"} unit standards`}
                >
                  <span className="chev" style={{ transform: open ? "rotate(90deg)" : "none" }}>
                    <Icon name="chevronRight" size={14} />
                  </span>
                  <span className="token-mod-name">{meta.label}</span>
                  <span className="token-bar bar">
                    <span style={{ width: `${maxModule ? Math.max(2, Math.round((totals.total / maxModule) * 100)) : 0}%` }} />
                  </span>
                  <span className="token-num">{fmtTokens(totals.total)}</span>
                  <span className="token-sub">
                    {totals.requests} req · ≈{usd(totals.costUSD)}
                  </span>
                </button>
                {open && (
                  <div className="token-units">
                    {units.map(([us, t]) => (
                      <div key={us || "?"} className="token-unit-row">
                        <span className="token-unit-name">{us ? usTitle(us) : "Unknown unit"}</span>
                        <span className="token-bar bar">
                          <span style={{ width: `${totals.total ? Math.max(2, Math.round((t.total / totals.total) * 100)) : 0}%` }} />
                        </span>
                        <span className="token-num">{fmtTokens(t.total)}</span>
                        <span className="token-sub">
                          {t.requests} req · {fmtTokens(t.prompt)} in / {fmtTokens(t.completion)} out
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    });
  };

  return (
    <>
      <h2 className="section-title">
        <span className="ico">
          <Icon name="chip" size={20} />
        </span>
        AI marking — token gauge
        <span className="token-super-pill" title="Visible only to the super user">
          <Icon name="shield" size={12} />
          Super user only
        </span>
      </h2>
      <div className="card token-gauge">
        <div className="token-top">
          <div className={`token-ring${overBudget ? " over" : ""}`} title={`This month: ${(monthTotals?.total ?? 0).toLocaleString("en-ZA")} of ${budget.toLocaleString("en-ZA")} tokens`}>
            <Ring
              value={gaugeValue}
              size={116}
              stroke={11}
              label={monthTotals ? `${Math.round((monthTotals.total / budget) * 100)}%` : "…"}
            />
            <div className="token-ring-cap mini-note">
              {overBudget ? "Over monthly budget" : "of monthly budget"}
            </div>
          </div>
          <div className="token-stats">
            <div className="token-stat">
              <div className="num">{monthTotals ? fmtTokens(monthTotals.total) : "—"}</div>
              <div className="lbl">Tokens this month</div>
            </div>
            <div className="token-stat">
              <div className="num">{monthTotals ? monthTotals.requests : "—"}</div>
              <div className="lbl">Marking calls this month</div>
            </div>
            <div className="token-stat">
              <div className="num">{monthTotals ? `≈${usd(monthTotals.costUSD)}` : "—"}</div>
              <div className="lbl">Est. cost this month</div>
            </div>
            <div className="token-stat">
              <div className="num">{all?.ok ? fmtTokens(totalsOf(all.rows).total) : "—"}</div>
              <div className="lbl">Tokens all time</div>
            </div>
            <div className="token-stat">
              {editBudget ? (
                <input
                  className="token-budget-input"
                  type="number"
                  min={1000}
                  step={100000}
                  defaultValue={budget}
                  autoFocus
                  onBlur={(e) => saveBudget(Number(e.target.value))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveBudget(Number((e.target as HTMLInputElement).value));
                    if (e.key === "Escape") setEditBudget(false);
                  }}
                />
              ) : (
                <button
                  className="num token-budget-btn"
                  onClick={() => setEditBudget(true)}
                  title="Click to change the monthly token budget"
                >
                  {fmtTokens(budget)}
                  <Icon name="settings" size={13} />
                </button>
              )}
              <div className="lbl">Monthly budget</div>
            </div>
          </div>
        </div>

        <div className="token-range-row">
          <span className="mini-note">Breakdown:</span>
          {(["month", "all"] as const).map((k) => (
            <button
              key={k}
              className={`sort-chip${range === k ? " active" : ""}`}
              aria-pressed={range === k}
              onClick={() => setRange(k)}
            >
              {k === "month" ? "This month" : "All time"}
            </button>
          ))}
          {activeTotals.total > 0 && (
            <span className="mini-note">
              {fmtTokens(activeTotals.prompt)} prompt + {fmtTokens(activeTotals.completion)}{" "}
              completion tokens
            </span>
          )}
        </div>

        {body()}
      </div>
    </>
  );
}
