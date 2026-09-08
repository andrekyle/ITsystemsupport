import type { Profile } from "../types";
import { COURSE_META, MODULES } from "../data/course";
import { loadOutcomes } from "../store";
import { docToolbar } from "./certificates";
import { loadMarkingModel, recordTokenUsage } from "./tokens";
import type { LearnerRow } from "../pages/Analytics";

/**
 * AI report generation (super user only): builds a compact statistics bundle
 * from the same per-learner analysis the Analytics page uses, asks
 * /api/generate-report to write the narrative, and renders the result into a
 * printable document with the onboarding-pack styling.
 */

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export interface ReportKind {
  id: string;
  name: string;
  desc: string;
  icon: string;
}

export const REPORT_KINDS: ReportKind[] = [
  {
    id: "progress",
    name: "Cohort progress report",
    desc: "Completion, credits, quiz and exercise performance for every learner, with cohort averages.",
    icon: "trend",
  },
  {
    id: "attendance",
    name: "Attendance report",
    desc: "Session attendance per learner against the registers issued, with participation patterns.",
    icon: "clipboard",
  },
  {
    id: "risk",
    name: "At-risk learners report",
    desc: "Learners flagged for low completion, poor attendance or inactivity — with intervention advice.",
    icon: "shield",
  },
  {
    id: "outcomes",
    name: "Assessment outcomes report",
    desc: "Formal assessor decisions per unit standard and how the cohort is tracking to certification.",
    icon: "award",
  },
  {
    id: "executive",
    name: "Executive summary",
    desc: "One-page programme overview for management: headline numbers, wins, risks and next steps.",
    icon: "briefcase",
  },
];

const pctStr = (v: number | null) => (v === null ? null : Math.round(v * 100));

function learnerStat(r: LearnerRow) {
  return {
    name: r.profile.name,
    completionPct: Math.round(r.completion * 100),
    unitsCompleted: r.unitsCompleted,
    creditsEarned: r.creditsEarned,
    quizAvgPct: pctStr(r.quizAvg),
    quizzesTaken: r.quizzesTaken,
    exerciseAvgPct: pctStr(r.exerciseAvg),
    poeItems: r.poeDone,
    sessionsAttended: r.attendance,
    attendanceRatePct: pctStr(r.attendanceRate),
    lastSeen: r.lastLogin ? new Date(r.lastLogin).toLocaleDateString() : "never signed in",
    atRisk: r.atRisk,
    riskReasons: r.riskReasons,
  };
}

function cohort(rows: LearnerRow[], registers: number) {
  const avg = (vals: number[]) =>
    vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  return {
    learners: rows.length,
    registersIssued: registers,
    avgCompletionPct: avg(rows.map((r) => Math.round(r.completion * 100))),
    avgQuizPct: avg(rows.filter((r) => r.quizAvg !== null).map((r) => Math.round(r.quizAvg! * 100))),
    avgAttendancePct: avg(
      rows.filter((r) => r.attendanceRate !== null).map((r) => Math.round(r.attendanceRate! * 100))
    ),
    totalCreditsEarned: rows.reduce((a, r) => a + r.creditsEarned, 0),
    atRiskCount: rows.filter((r) => r.atRisk).length,
  };
}

function outcomesData(rows: LearnerRow[]) {
  const outcomes = loadOutcomes();
  const units = MODULES.flatMap((m) => m.units);
  return units.map((u) => {
    let competent = 0;
    let notYet = 0;
    for (const r of rows) {
      const o = outcomes[r.profile.id]?.[u.us];
      if (o?.status === "C") competent++;
      else if (o?.status === "NYC") notYet++;
    }
    return {
      unitStandard: `US ${u.us}`,
      title: u.title,
      credits: u.credits,
      competent,
      notYetCompetent: notYet,
      noDecisionYet: rows.length - competent - notYet,
    };
  });
}

/** Compact JSON bundle the AI writes the report from. */
export function buildReportData(kind: string, rows: LearnerRow[], registers: number): unknown {
  const base = {
    programme: `${COURSE_META.title} (SAQA ${COURSE_META.saqaId}, NQF ${COURSE_META.nqfLevel}, ${COURSE_META.credits} credits)`,
    cohort: cohort(rows, registers),
  };
  switch (kind) {
    case "attendance":
      return {
        ...base,
        learners: rows.map((r) => ({
          name: r.profile.name,
          sessionsAttended: r.attendance,
          registersIssued: registers,
          attendanceRatePct: pctStr(r.attendanceRate),
          lastSeen: r.lastLogin ? new Date(r.lastLogin).toLocaleDateString() : "never signed in",
        })),
      };
    case "risk":
      return {
        ...base,
        atRiskLearners: rows.filter((r) => r.atRisk).map(learnerStat),
        healthyLearnerCount: rows.filter((r) => !r.atRisk).length,
      };
    case "outcomes":
      return { ...base, unitOutcomes: outcomesData(rows) };
    case "executive":
      return {
        ...base,
        topLearners: [...rows]
          .sort((a, b) => b.completion - a.completion)
          .slice(0, 3)
          .map((r) => ({ name: r.profile.name, completionPct: Math.round(r.completion * 100) })),
        atRiskLearners: rows
          .filter((r) => r.atRisk)
          .map((r) => ({ name: r.profile.name, reasons: r.riskReasons })),
      };
    default:
      return { ...base, learners: rows.map(learnerStat) };
  }
}

export interface AiReport {
  intro: string;
  sections: { heading: string; paragraphs: string[]; bullets?: string[] }[];
  recommendations: string[];
}

export type ReportResult =
  | { ok: true; report: AiReport }
  | { ok: false; error: string };

/** Ask the API to write the report. Records token usage under "REPORTS". */
export async function requestReport(kind: ReportKind, data: unknown): Promise<ReportResult> {
  try {
    const r = await fetch("/api/generate-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: kind.id, title: kind.name, data, model: loadMarkingModel() }),
    });
    if (!r.ok) return { ok: false, error: `http_${r.status}` };
    const payload = (await r.json()) as Partial<AiReport> & {
      error?: string;
      model?: string;
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    };
    if (payload.usage) {
      void recordTokenUsage({
        us: "REPORTS",
        model: typeof payload.model === "string" ? payload.model : "",
        promptTokens: Number(payload.usage.prompt_tokens ?? 0),
        completionTokens: Number(payload.usage.completion_tokens ?? 0),
        totalTokens: Number(payload.usage.total_tokens ?? 0),
      });
    }
    if (payload.error || !Array.isArray(payload.sections) || payload.sections.length === 0) {
      return { ok: false, error: payload.error ?? "empty_report" };
    }
    return {
      ok: true,
      report: {
        intro: typeof payload.intro === "string" ? payload.intro : "",
        sections: payload.sections,
        recommendations: Array.isArray(payload.recommendations) ? payload.recommendations : [],
      },
    };
  } catch {
    return { ok: false, error: "network" };
  }
}

/** Deterministic data appendix table per report kind. */
function appendixTable(kind: string, rows: LearnerRow[], registers: number): string {
  const th = (cells: string[]) =>
    `<tr>${cells.map((c) => `<th style="width:auto">${esc(c)}</th>`).join("")}</tr>`;
  const td = (cells: (string | number)[]) =>
    `<tr>${cells.map((c) => `<td>${esc(String(c))}</td>`).join("")}</tr>`;
  const pctCell = (v: number | null) => (v === null ? "—" : `${v}%`);

  if (kind === "attendance") {
    return `<table>${th(["Learner", "Sessions signed", "Registers issued", "Attendance", "Last seen"])}${rows
      .map((r) =>
        td([
          r.profile.name,
          r.attendance,
          registers,
          pctCell(pctStr(r.attendanceRate)),
          r.lastLogin ? new Date(r.lastLogin).toLocaleDateString() : "never",
        ])
      )
      .join("")}</table>`;
  }
  if (kind === "outcomes") {
    return `<table>${th(["Unit standard", "Title", "Credits", "Competent", "Not yet competent", "No decision"])}${outcomesData(
      rows
    )
      .map((u) =>
        td([u.unitStandard, u.title, u.credits, u.competent, u.notYetCompetent, u.noDecisionYet])
      )
      .join("")}</table>`;
  }
  if (kind === "risk") {
    const flagged = rows.filter((r) => r.atRisk);
    if (flagged.length === 0) return `<p class="small">No learners are currently flagged at risk.</p>`;
    return `<table>${th(["Learner", "Completion", "Attendance", "Last seen", "Risk reasons"])}${flagged
      .map((r) =>
        td([
          r.profile.name,
          `${Math.round(r.completion * 100)}%`,
          pctCell(pctStr(r.attendanceRate)),
          r.lastLogin ? new Date(r.lastLogin).toLocaleDateString() : "never",
          r.riskReasons.join("; "),
        ])
      )
      .join("")}</table>`;
  }
  return `<table>${th(["Learner", "Completion", "Units done", "Credits", "Quiz avg", "Exercise avg", "POE items", "Attendance"])}${rows
    .map((r) =>
      td([
        r.profile.name,
        `${Math.round(r.completion * 100)}%`,
        r.unitsCompleted,
        r.creditsEarned,
        pctCell(pctStr(r.quizAvg)),
        pctCell(pctStr(r.exerciseAvg)),
        r.poeDone,
        pctCell(pctStr(r.attendanceRate)),
      ])
    )
    .join("")}</table>`;
}

/** Printable report document — same look as the learner onboarding pack. */
export function reportDocumentHtml(
  kind: ReportKind,
  report: AiReport,
  rows: LearnerRow[],
  registers: number,
  author: Profile
): string {
  const today = new Date().toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const sections = report.sections
    .map(
      (s, i) => `
  <h2>${i + 1} · ${esc(s.heading)}</h2>
  ${s.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}
  ${s.bullets && s.bullets.length ? `<ul>${s.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}`
    )
    .join("");
  const recs = report.recommendations.length
    ? `
  <h2>${report.sections.length + 1} · Recommendations</h2>
  <ol>${report.recommendations.map((r) => `<li>${esc(r)}</li>`).join("")}</ol>`
    : "";

  const slug = kind.name.replace(/\s+/g, "-").toLowerCase();
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${esc(kind.name)} — ${esc(COURSE_META.title)}</title>
<style>
  * { box-sizing: border-box; }
  body { font: 14px/1.55 "Segoe UI", system-ui, sans-serif; color: #17233b; margin: 0; padding: 34px 44px; }
  h1 { font-size: 27px; margin: 0 0 2px; color: #0b3f8a; }
  h2 { font-size: 18px; margin: 30px 0 8px; color: #0b3f8a; border-bottom: 2px solid #dbe6f7; padding-bottom: 5px; }
  .sub { color: #5a6b8c; margin: 0 0 18px; }
  .banner { background: #eef4ff; border: 1px solid #c9dbf7; border-radius: 10px; padding: 14px 18px; margin: 18px 0; }
  table { border-collapse: collapse; width: 100%; margin: 8px 0 4px; }
  th, td { border: 1px solid #ccd7ea; padding: 6px 9px; text-align: left; vertical-align: top; font-size: 12.5px; }
  th { background: #f2f6fd; }
  ol li, ul li { margin: 4px 0; }
  .sign { display: flex; gap: 60px; margin-top: 36px; }
  .sign div { flex: 1; border-top: 1.5px solid #17233b; padding-top: 5px; font-size: 12.5px; color: #444; }
  .small { color: #5a6b8c; font-size: 12px; }
  @media print { body { padding: 10mm 12mm; } h2 { break-after: avoid; } tr { break-inside: avoid; } }
</style>
</head>
<body>
  ${docToolbar(`${slug}-${new Date().toISOString().slice(0, 10)}.html`)}
  <h1>${esc(kind.name)}</h1>
  <p class="sub">${esc(COURSE_META.title)} · SAQA ID ${esc(COURSE_META.saqaId)} · NQF Level ${COURSE_META.nqfLevel} · ${COURSE_META.credits} Credits · Quality assured by ${esc(COURSE_META.qualityAssurance)}</p>

  <div class="banner">
    <strong>${esc(kind.name)} — generated ${esc(today)}.</strong><br/>
    ${esc(report.intro)}
    <span class="small">Written by the ITSS Learn AI reporting assistant from live platform data; reviewed by ${esc(author.name)}.</span>
  </div>
  ${sections}
  ${recs}

  <h2>Appendix · Data snapshot</h2>
  <p class="small">Figures as recorded on ITSS Learn at the time of generation (${esc(today)}).</p>
  ${appendixTable(kind.id, rows, registers)}

  <div class="sign">
    <div>Compiled by (name &amp; signature)</div>
    <div>Reviewed by (name &amp; signature)</div>
  </div>
</body>
</html>`;
}

/** Open the finished report in a new window, ready to print / save as PDF. */
export function openReportDocument(
  kind: ReportKind,
  report: AiReport,
  rows: LearnerRow[],
  registers: number,
  author: Profile
) {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(reportDocumentHtml(kind, report, rows, registers, author));
  win.document.close();
}
