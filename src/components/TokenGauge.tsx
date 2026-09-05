import { useEffect, useMemo, useState } from "react";
import { Icon } from "../icons";
import { COURSE_META, MODULES, findUnit, usLabel } from "../data/course";
import {
  estimateCostUSD,
  fetchTokenRecords,
  fetchTokenSummary,
  fmtTokens,
  type TokenRecord,
  type TokenRecordsResult,
  type TokenSummaryResult,
} from "../lib/tokens";

/**
 * Super-user-only dashboard section: AI-marking token usage, styled after the
 * OpenAI platform usage page — month navigation, headline spend/usage
 * metrics, a daily stacked bar chart (input vs output tokens), a monthly
 * budget bar and a per-qualification → module → unit-standard breakdown.
 *
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

const zero = (): Totals => ({ requests: 0, prompt: 0, completion: 0, total: 0, costUSD: 0 });

function addRecord(t: Totals, r: TokenRecord): void {
  t.requests += 1;
  t.prompt += r.prompt;
  t.completion += r.completion;
  t.total += r.total;
  t.costUSD += estimateCostUSD(r.model, r.prompt, r.completion);
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

/** Round a chart maximum up to a tidy number (588 → 600, 1234 → 2000). */
function niceCeil(v: number): number {
  if (v <= 10) return 10;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  return Math.ceil(v / pow) * pow;
}

interface DayAgg {
  prompt: number;
  completion: number;
  total: number;
  requests: number;
  costUSD: number;
}

/** OpenAI-style daily stacked bar chart: input tokens (dark green) with
 *  output tokens (light green) stacked on top, gridlines and right-hand
 *  axis labels. Pure SVG — scales with the card width. */
function DailyChart({ days, monthLabel }: { days: DayAgg[]; monthLabel: string }) {
  const W = 860;
  const H = 200;
  const padL = 10;
  const padR = 52;
  const padT = 14;
  const padB = 26;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const max = niceCeil(Math.max(...days.map((d) => d.total), 1));
  const slot = plotW / days.length;
  const barW = Math.min(18, slot * 0.62);
  const y = (v: number) => padT + plotH - (v / max) * plotH;

  const grid = [0, 0.5, 1].map((f) => ({ v: max * f, py: y(max * f) }));

  return (
    <svg
      className="oa-chart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Daily token usage for ${monthLabel}`}
    >
      {grid.map((g) => (
        <g key={g.v}>
          <line className="oa-grid" x1={padL} x2={padL + plotW} y1={g.py} y2={g.py} />
          <text className="oa-axis" x={padL + plotW + 8} y={g.py + 3.5}>
            {fmtTokens(Math.round(g.v))}
          </text>
        </g>
      ))}
      {days.map((d, i) => {
        const cx = padL + slot * i + slot / 2;
        const showLabel = i === 0 || (i + 1) % 5 === 0;
        return (
          <g key={i}>
            {d.total > 0 && (
              <>
                <rect
                  className="oa-bar-in"
                  x={cx - barW / 2}
                  y={y(d.total)}
                  width={barW}
                  height={padT + plotH - y(d.total)}
                  rx={2.5}
                />
                {d.completion > 0 && (
                  <rect
                    className="oa-bar-out"
                    x={cx - barW / 2}
                    y={y(d.total)}
                    width={barW}
                    height={Math.max(1.5, (d.completion / max) * plotH)}
                    rx={2.5}
                  />
                )}
              </>
            )}
            {/* invisible hover target with a native tooltip for the whole day */}
            <rect
              x={padL + slot * i}
              y={padT}
              width={slot}
              height={plotH}
              fill="transparent"
            >
              <title>
                {`${String(i + 1).padStart(2, "0")} ${monthLabel} — ${d.total.toLocaleString(
                  "en-ZA"
                )} tokens (${d.prompt.toLocaleString("en-ZA")} in / ${d.completion.toLocaleString(
                  "en-ZA"
                )} out) · ${d.requests} request${d.requests === 1 ? "" : "s"} · ≈${usd(d.costUSD)}`}
              </title>
            </rect>
            {showLabel && (
              <text className="oa-axis" x={cx} y={H - 8} textAnchor="middle">
                {String(i + 1).padStart(2, "0")}
              </text>
            )}
          </g>
        );
      })}
      <line
        className="oa-baseline"
        x1={padL}
        x2={padL + plotW}
        y1={padT + plotH}
        y2={padT + plotH}
      />
    </svg>
  );
}

export function TokenGauge() {
  // 0 = current month, -1 = previous month, …
  const [monthOffset, setMonthOffset] = useState(0);
  const [records, setRecords] = useState<TokenRecordsResult | null>(null);
  const [allTime, setAllTime] = useState<TokenSummaryResult | null>(null);
  const [budget, setBudget] = useState<number>(loadBudget);
  const [editBudget, setEditBudget] = useState(false);
  const [closedMods, setClosedMods] = useState<Set<string>>(new Set());

  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const to = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 1);
  const monthLabel = from.toLocaleString("en-ZA", { month: "long", year: "numeric" });
  const monthName = from.toLocaleString("en-ZA", { month: "short" });
  const daysInMonth = new Date(from.getFullYear(), from.getMonth() + 1, 0).getDate();

  useEffect(() => {
    let alive = true;
    setRecords(null);
    void fetchTokenRecords(from, to).then((r) => {
      if (alive) setRecords(r);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthOffset]);

  useEffect(() => {
    let alive = true;
    void fetchTokenSummary().then((r) => {
      if (alive) setAllTime(r);
    });
    return () => {
      alive = false;
    };
  }, []);

  const rows = records?.ok ? records.rows : [];

  const monthTotals = useMemo(() => {
    const t = zero();
    for (const r of rows) addRecord(t, r);
    return t;
  }, [rows]);

  const days = useMemo(() => {
    const list: DayAgg[] = Array.from({ length: daysInMonth }, () => ({
      prompt: 0,
      completion: 0,
      total: 0,
      requests: 0,
      costUSD: 0,
    }));
    for (const r of rows) {
      const d = new Date(r.createdAt);
      const i = d.getDate() - 1;
      if (i < 0 || i >= list.length) continue;
      list[i].prompt += r.prompt;
      list[i].completion += r.completion;
      list[i].total += r.total;
      list[i].requests += 1;
      list[i].costUSD += estimateCostUSD(r.model, r.prompt, r.completion);
    }
    return list;
  }, [rows, daysInMonth]);

  // qual → module → unit standard totals for the breakdown list
  const grouped = useMemo(() => {
    const quals = new Map<string, Map<string, Map<string, Totals>>>();
    for (const r of rows) {
      const modId = r.moduleId || findUnit(r.us)?.module.id || "";
      const byModule = quals.get(r.qual) ?? new Map<string, Map<string, Totals>>();
      quals.set(r.qual, byModule);
      const byUs = byModule.get(modId) ?? new Map<string, Totals>();
      byModule.set(modId, byUs);
      const t = byUs.get(r.us) ?? zero();
      addRecord(t, r);
      byUs.set(r.us, t);
    }
    return quals;
  }, [rows]);

  const allTimeTotals = useMemo(() => {
    if (!allTime?.ok) return null;
    const t = zero();
    for (const r of allTime.rows) {
      t.requests += r.requests;
      t.prompt += r.prompt_tokens;
      t.completion += r.completion_tokens;
      t.total += r.total_tokens;
      t.costUSD += estimateCostUSD(r.model, r.prompt_tokens, r.completion_tokens);
    }
    return t;
  }, [allTime]);

  const saveBudget = (v: number) => {
    const clean = Number.isFinite(v) && v >= 1000 ? Math.round(v) : DEFAULT_BUDGET;
    setBudget(clean);
    localStorage.setItem(BUDGET_KEY, JSON.stringify(clean));
    setEditBudget(false);
  };

  const budgetShare = monthOffset === 0 ? monthTotals.total / budget : 0;
  const overBudget = monthOffset === 0 && monthTotals.total > budget;

  const err = records && !records.ok ? records.error : null;

  const sumUsMap = (m: Map<string, Totals>): Totals => {
    const t = zero();
    for (const v of m.values()) {
      t.requests += v.requests;
      t.prompt += v.prompt;
      t.completion += v.completion;
      t.total += v.total;
      t.costUSD += v.costUSD;
    }
    return t;
  };

  const breakdown = () => {
    if (rows.length === 0) return null;
    // largest module total this month — module bars are proportional to it
    let maxModule = 0;
    for (const byModule of grouped.values())
      for (const byUs of byModule.values()) maxModule = Math.max(maxModule, sumUsMap(byUs).total);

    return [...grouped.entries()].map(([qual, byModule]) => {
      const modules = [...byModule.entries()]
        .map(([modId, byUs]) => ({ modId, byUs, meta: moduleTitle(qual, modId), totals: sumUsMap(byUs) }))
        .sort((a, b) => a.meta.order - b.meta.order || b.totals.total - a.totals.total);
      const qualTotals = zero();
      for (const m of modules) {
        qualTotals.requests += m.totals.requests;
        qualTotals.prompt += m.totals.prompt;
        qualTotals.completion += m.totals.completion;
        qualTotals.total += m.totals.total;
        qualTotals.costUSD += m.totals.costUSD;
      }
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
            const open = !closedMods.has(key);
            const units = [...byUs.entries()].sort((a, b) => b[1].total - a[1].total);
            return (
              <div key={key} className="token-mod">
                <button
                  className="token-mod-row"
                  onClick={() =>
                    setClosedMods((s) => {
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
        AI marking — token usage
        <span className="token-super-pill" title="Visible only to the super user">
          <Icon name="shield" size={12} />
          Super user only
        </span>
      </h2>
      <div className="card token-gauge">
        {/* ——— month navigation, OpenAI-usage style ——— */}
        <div className="oa-head">
          <div className="oa-month-nav">
            <button
              className="oa-nav-btn"
              onClick={() => setMonthOffset((o) => o - 1)}
              title="Previous month"
              aria-label="Previous month"
            >
              <Icon name="chevronLeft" size={15} />
            </button>
            <span className="oa-month-label">{monthLabel}</span>
            <button
              className="oa-nav-btn"
              onClick={() => setMonthOffset((o) => Math.min(0, o + 1))}
              disabled={monthOffset === 0}
              title="Next month"
              aria-label="Next month"
            >
              <Icon name="chevronRight" size={15} />
            </button>
          </div>
          <div className="oa-legend">
            <span className="oa-legend-item">
              <span className="oa-dot in" />
              Input tokens
            </span>
            <span className="oa-legend-item">
              <span className="oa-dot out" />
              Output tokens
            </span>
          </div>
        </div>

        {err ? (
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
                  this page.
                </>
              )}
              {err === "failed" && "Could not load token usage — try reloading the page."}
            </span>
          </div>
        ) : (
          <>
            {/* ——— headline metrics ——— */}
            <div className="oa-metrics">
              <div className="oa-metric">
                <div className="oa-metric-lbl">Total spend</div>
                <div className="oa-metric-num">
                  {records ? `≈${usd(monthTotals.costUSD)}` : "…"}
                </div>
              </div>
              <div className="oa-metric">
                <div className="oa-metric-lbl">Total tokens</div>
                <div className="oa-metric-num">
                  {records ? monthTotals.total.toLocaleString("en-ZA") : "…"}
                </div>
              </div>
              <div className="oa-metric">
                <div className="oa-metric-lbl">Requests</div>
                <div className="oa-metric-num">{records ? monthTotals.requests : "…"}</div>
              </div>
              <div className="oa-metric">
                <div className="oa-metric-lbl">Input / output</div>
                <div className="oa-metric-num oa-metric-sm">
                  {records ? `${fmtTokens(monthTotals.prompt)} / ${fmtTokens(monthTotals.completion)}` : "…"}
                </div>
              </div>
              <div className="oa-metric">
                <div className="oa-metric-lbl">All time</div>
                <div className="oa-metric-num oa-metric-sm">
                  {allTimeTotals ? `${fmtTokens(allTimeTotals.total)} tok · ≈${usd(allTimeTotals.costUSD)}` : "—"}
                </div>
              </div>
            </div>

            {/* ——— daily usage chart ——— */}
            <DailyChart days={days} monthLabel={monthName} />
            {records && rows.length === 0 && (
              <p className="mini-note oa-empty">
                No AI marking usage recorded in {monthLabel}. Tokens are logged each time a typed
                answer is reviewed by the AI marker.
              </p>
            )}

            {/* ——— monthly budget bar ——— */}
            <div className="oa-budget">
              <div className="oa-budget-head">
                <span className="oa-budget-title">Monthly token budget</span>
                <span className="mini-note">
                  {monthOffset === 0
                    ? `${monthTotals.total.toLocaleString("en-ZA")} of `
                    : "budget applies to the current month · "}
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
                      className="token-budget-btn"
                      onClick={() => setEditBudget(true)}
                      title="Click to change the monthly token budget"
                    >
                      {budget.toLocaleString("en-ZA")} tokens
                      <Icon name="settings" size={12} />
                    </button>
                  )}
                  {monthOffset === 0 && (
                    <strong className={overBudget ? "oa-over" : ""}>
                      {" "}
                      · {Math.round(budgetShare * 100)}%
                    </strong>
                  )}
                </span>
              </div>
              <span className={`oa-budget-bar${overBudget ? " over" : ""}`}>
                <span style={{ width: `${Math.min(100, Math.round(budgetShare * 100))}%` }} />
              </span>
            </div>

            {/* ——— breakdown ——— */}
            {rows.length > 0 && (
              <div className="oa-breakdown">
                <div className="oa-sec-lbl">Usage breakdown · {monthLabel}</div>
                {breakdown()}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
