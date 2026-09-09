import type { Profile } from "../types";
import { COURSE_META, MODULES } from "../data/course";
import { loadOutcomes } from "../store";
import { docToolbar } from "./certificates";
import { attendanceRegisterDates } from "./gamification";
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
    id: "tracker",
    name: "Learner tracker report",
    desc: "The submission & attendance tracker grid — status per unit standard, tick per session, and an AI comment per learner.",
    icon: "checklist",
  },
  {
    id: "executive",
    name: "Executive summary",
    desc: "One-page programme overview for management: headline numbers, wins, risks and next steps.",
    icon: "briefcase",
  },
];

export const CUSTOM_KIND: ReportKind = {
  id: "custom",
  name: "Custom report",
  desc: "Ask the AI anything about the programme — it answers with a full report grounded in the data.",
  icon: "chat",
};

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
    sessionsExpected: r.attendanceExpected,
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
        note: "sessionsExpected counts registers since each learner's first signed session; late joiners are only measured from when they started.",
        learners: rows.map((r) => ({
          name: r.profile.name,
          sessionsAttended: r.attendance,
          sessionsExpected: r.attendanceExpected,
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
    case "tracker":
      return {
        ...base,
        instruction:
          "Write one facilitator comment per learner (2-3 sentences) from their figures below.",
        learners: rows.map((r) => ({
          name: r.profile.name,
          completionPct: Math.round(r.completion * 100),
          quizAvgPct: pctStr(r.quizAvg),
          attendanceRatePct: pctStr(r.attendanceRate),
          sessionsAttended: r.attendance,
          unitStatus: r.unitStatus,
          atRisk: r.atRisk,
          riskReasons: r.riskReasons,
          lastSeen: r.lastLogin ? new Date(r.lastLogin).toLocaleDateString() : "never signed in",
        })),
      };
    case "custom":
      // the question can be about anything, so send the full picture
      return {
        ...base,
        learners: rows.map(learnerStat),
        unitOutcomes: outcomesData(rows),
      };
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
export async function requestReport(
  kind: ReportKind,
  data: unknown,
  question?: string
): Promise<ReportResult> {
  try {
    const r = await fetch("/api/generate-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: kind.id,
        title: kind.name,
        data,
        model: loadMarkingModel(),
        ...(question?.trim() ? { question: question.trim() } : {}),
      }),
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
function appendixTable(kind: string, rows: LearnerRow[]): string {
  const th = (cells: string[]) =>
    `<tr>${cells.map((c) => `<th style="width:auto">${esc(c)}</th>`).join("")}</tr>`;
  const td = (cells: (string | number)[]) =>
    `<tr>${cells.map((c) => `<td>${esc(String(c))}</td>`).join("")}</tr>`;
  const pctCell = (v: number | null) => (v === null ? "—" : `${v}%`);

  if (kind === "attendance") {
    return `<table>${th(["Learner", "Sessions signed", "Sessions expected", "Attendance", "Last seen"])}${rows
      .map((r) =>
        td([
          r.profile.name,
          r.attendance,
          r.attendanceExpected,
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

/** "17-Jul-26" style date for tracker column headers. */
function fmtRegDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return `${String(d.getDate()).padStart(2, "0")}-${d.toLocaleString("en", { month: "short" })}-${String(d.getFullYear()).slice(2)}`;
}

/** Tracker grid: legend + one row per learner with unit statuses, attendance
 *  ticks and the AI's per-learner comment — onboarding palette throughout. */
function trackerBody(rows: LearnerRow[], report: AiReport): string {
  // only modules the cohort has touched — keeps the grid the width of the
  // reference tracker instead of every unit in the qualification
  const active = MODULES.filter((m) =>
    m.units.some((u) => rows.some((r) => (r.unitStatus[u.us] ?? "NYS") !== "NYS"))
  );
  const mods = active.length ? active : MODULES.slice(0, 1);
  const units = mods.flatMap((m) => m.units);
  const dates = attendanceRegisterDates();
  const commentFor = (name: string) => {
    const hit = report.sections.find(
      (s) => s.heading.trim().toLowerCase() === name.trim().toLowerCase()
    ) ?? report.sections.find((s) => name.toLowerCase().includes(s.heading.trim().toLowerCase()));
    return hit ? hit.paragraphs.join(" ") : "";
  };
  const legend = `
  <table class="legend">
    <tr><td class="sw st-nys"></td><td><strong>NYS</strong> — Not yet submitted</td></tr>
    <tr><td class="sw st-c"></td><td><strong>C</strong> — Competent</td></tr>
    <tr><td class="sw st-sa"></td><td><strong>SA</strong> — Submitted, in assessment process</td></tr>
    <tr><td class="sw st-ip"></td><td><strong>IP</strong> — In process of submission</td></tr>
    <tr><td class="sw st-x"></td><td><strong>X</strong> — Absent</td></tr>
  </table>`;
  const head = `
    <tr>
      <th rowspan="4" class="nm">Learner name</th>
      <th rowspan="4" class="nm">Learner surname</th>
      <th rowspan="4" class="idn">ID number</th>
      ${mods.map((m) => `<th colspan="${m.units.length}">${esc(m.name)}</th>`).join("")}
      <th colspan="${Math.max(dates.length, 1)}" rowspan="2">Attendance</th>
      <th rowspan="4" class="cm">Comments</th>
    </tr>
    <tr><th colspan="${units.length}">Unit standards submissions</th></tr>
    <tr>
      ${units.map((u) => `<th class="c">${esc(u.us)}</th>`).join("")}
      ${dates.length ? dates.map((d) => `<th class="c" rowspan="2">${esc(fmtRegDate(d))}</th>`).join("") : `<th class="c" rowspan="2">—</th>`}
    </tr>
    <tr>${units.map((u) => `<th class="c">${u.credits} cr</th>`).join("")}</tr>`;
  const body = rows
    .map((r) => {
      const parts = r.profile.name.trim().split(/\s+/);
      const surname = parts.length > 1 ? parts[parts.length - 1] : "";
      const first = parts.length > 1 ? parts.slice(0, -1).join(" ") : parts[0];
      const firstSigned = r.signedDates[0];
      const att = dates.length
        ? dates
            .map((d) => {
              if (r.signedDates.includes(d)) return `<td class="c ok">✓</td>`;
              if (firstSigned && d < firstSigned) return `<td class="c">–</td>`;
              return `<td class="c st-x">X</td>`;
            })
            .join("")
        : `<td class="c">–</td>`;
      return `<tr>
        <td>${esc(first)}</td>
        <td>${esc(surname)}</td>
        <td>${esc(r.profile.enrolment?.idNumber ?? "—")}</td>
        ${units.map((u) => { const st = r.unitStatus[u.us] ?? "NYS"; return `<td class="c st-${st.toLowerCase()}"><strong>${st}</strong></td>`; }).join("")}
        ${att}
        <td class="cm">${esc(commentFor(r.profile.name))}</td>
      </tr>`;
    })
    .join("");
  return `${legend}
  <table class="tracker">${head}${body}</table>`;
}

/** Printable report document — same look as the learner onboarding pack. */
export function reportDocumentHtml(
  kind: ReportKind,
  report: AiReport,
  rows: LearnerRow[],
  registers: number,
  author: Profile,
  question?: string
): string {
  const today = new Date().toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const tracker = kind.id === "tracker";
  const sections = tracker
    ? trackerBody(rows, report)
    : report.sections
        .map(
          (s, i) => `
  <h2>${i + 1} · ${esc(s.heading)}</h2>
  ${s.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}
  ${s.bullets && s.bullets.length ? `<ul>${s.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}`
        )
        .join("");
  const recs = report.recommendations.length
    ? `
  <h2>${tracker ? "Recommendations" : `${report.sections.length + 1} · Recommendations`}</h2>
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
  /* tracker grid — onboarding palette */
  .legend { width: auto; margin: 0 0 16px; }
  .legend .sw { width: 120px; }
  .tracker th, .tracker td { font-size: 11px; padding: 5px 6px; }
  .tracker th { text-align: center; vertical-align: middle; }
  .tracker .c { text-align: center; white-space: nowrap; }
  .tracker .nm { min-width: 90px; }
  .tracker .idn { min-width: 95px; }
  .tracker .cm { min-width: 220px; text-align: left; }
  .tracker .ok { color: #0b6e3f; font-weight: 600; }
  .st-nys { background: #fdf3c8; }
  .st-c { background: #dff1df; }
  .st-sa { background: #d9e9fb; }
  .st-ip { background: #fbe3cf; }
  .st-x { background: #fadbd8; color: #8c2f28; font-weight: 600; }
  @media print { body { padding: 10mm 12mm; } h2 { break-after: avoid; } tr { break-inside: avoid; } ${tracker ? "@page { size: A3 landscape; }" : ""} }
</style>
</head>
<body>
  ${docToolbar(`${slug}-${new Date().toISOString().slice(0, 10)}.html`)}
  <h1>${esc(kind.name)}</h1>
  <p class="sub">${esc(COURSE_META.title)} · SAQA ID ${esc(COURSE_META.saqaId)} · NQF Level ${COURSE_META.nqfLevel} · ${COURSE_META.credits} Credits · Quality assured by ${esc(COURSE_META.qualityAssurance)}</p>

  <div class="banner">
    <strong>${esc(kind.name)} — generated ${esc(today)}.</strong><br/>
    ${question?.trim() ? `<em>Question asked: “${esc(question.trim())}”</em><br/>` : ""}
    ${esc(report.intro)}
    <span class="small">Written by the ITSS Learn AI reporting assistant from live platform data; reviewed by ${esc(author.name)}.</span>
  </div>
  ${sections}
  ${recs}
${tracker ? "" : `
  <h2>Appendix · Data snapshot</h2>
  <p class="small">Figures as recorded on ITSS Learn at the time of generation (${esc(today)}).</p>
  ${appendixTable(kind.id, rows)}
`}
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
  author: Profile,
  question?: string
) {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(reportDocumentHtml(kind, report, rows, registers, author, question));
  win.document.close();
}
