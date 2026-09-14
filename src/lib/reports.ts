import type { Profile } from "../types";
import { COURSE_META, MODULES } from "../data/course";
import { loadOutcomes } from "../store";
import { docToolbar } from "./certificates";
import { attendanceFilledRegisterDates } from "./gamification";
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
    name: "Learnership progress report",
    desc: "The monthly sponsor deck — cover, headline numbers, signed attendance, delivery, assessment results, evidence readiness, cohort position and recommendations.",
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

/** Gender exactly as captured on the enrolment form. */
const genderOf = (r: LearnerRow): "Male" | "Female" | "unspecified" => {
  const g = r.profile.enrolment?.gender?.trim().toLowerCase();
  if (g === "male") return "Male";
  if (g === "female") return "Female";
  return "unspecified";
};

const pronounsOf = (r: LearnerRow): string => {
  const g = genderOf(r);
  if (g === "Male") return "he/him/his";
  if (g === "Female") return "she/her/hers";
  return "no pronouns — repeat the name";
};

function learnerStat(r: LearnerRow) {
  return {
    name: r.profile.name,
    gender: genderOf(r),
    pronouns: pronounsOf(r),
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
    firstSession: r.signedDates[0] ?? null,
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

/** Report scope: only unit standards the cohort has worked on (default), or
 *  every unit in the qualification. */
export type ReportScope = "worked" | "all";

/** Unit codes at least one learner has started (status other than NYS). */
export function workedUnitCodes(rows: LearnerRow[]): Set<string> {
  const set = new Set<string>();
  for (const m of MODULES)
    for (const u of m.units)
      if (rows.some((r) => (r.unitStatus[u.us] ?? "NYS") !== "NYS")) set.add(u.us);
  return set;
}

function scopedUnits(rows: LearnerRow[], scope: ReportScope) {
  if (scope === "all") return MODULES.flatMap((m) => m.units);
  const worked = workedUnitCodes(rows);
  const units = MODULES.flatMap((m) => m.units).filter((u) => worked.has(u.us));
  return units.length ? units : MODULES[0].units;
}

function outcomesData(rows: LearnerRow[], scope: ReportScope = "worked") {
  const outcomes = loadOutcomes();
  const units = scopedUnits(rows, scope);
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
export function buildReportData(
  kind: string,
  rows: LearnerRow[],
  registers: number,
  scope: ReportScope = "worked"
): unknown {
  const workedCount = workedUnitCodes(rows).size;
  const base = {
    programme: `${COURSE_META.title} (SAQA ${COURSE_META.saqaId}, NQF ${COURSE_META.nqfLevel}, ${COURSE_META.credits} credits)`,
    scope:
      scope === "all"
        ? "whole programme — every unit standard in the qualification"
        : `only the ${workedCount} unit standard${workedCount === 1 ? "" : "s"} the cohort has worked on so far; unstarted units are excluded`,
    today: new Date().toDateString(),
    schedule: MODULES.flatMap((m, mi) =>
      m.units.map(
        (u) => `US ${u.us} | ${u.title} | Module ${mi + 1}: ${m.name} | sessions: ${u.dates} | ${u.time}`
      )
    ),
    scheduleNote:
      "schedule is the full programme timetable, one line per unit: 'US code | title | module | sessions: dates | time'. Compare the session dates with today to answer what has been trained, what is next or what happens on a given date.",
    cohort: cohort(rows, registers),
    // per-register signed counts so session-by-session slides carry real figures
    sessionAttendance: attendanceFilledRegisterDates().map((d) => ({
      date: d,
      signed: rows.filter((r) => r.signedDates.includes(d)).length,
      expected: rows.filter((r) => !r.signedDates[0] || r.signedDates[0] <= d).length,
    })),
  };
  switch (kind) {
    case "attendance":
      return {
        ...base,
        note: "Figures come straight from the filled attendance registers. sessionsExpected counts registers dated on/after the learner's firstSession — learners who joined later are only measured from when they started, so attending every session since firstSession is a 100% attendance rate, not a shortfall.",
        registerDates: attendanceFilledRegisterDates(),
        learners: rows.map((r) => ({
          name: r.profile.name,
          gender: genderOf(r),
          pronouns: pronounsOf(r),
          sessionsAttended: r.attendance,
          sessionsExpected: r.attendanceExpected,
          attendanceRatePct: pctStr(r.attendanceRate),
          firstSession: r.signedDates[0] ?? null,
          signedDates: r.signedDates,
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
      return { ...base, unitOutcomes: outcomesData(rows, scope) };
    case "tracker": {
      const units = new Set(scopedUnits(rows, scope).map((u) => u.us));
      return {
        ...base,
        instruction:
          "Write one facilitator comment per learner (2-3 sentences) from their figures below. Attendance comes from the filled registers: sessionsExpected only counts sessions from the learner's firstSession onwards, so a learner who joined later but attended every session since is at 100% — never describe that as missing classes.",
        registerDates: attendanceFilledRegisterDates(),
        learners: rows.map((r) => ({
          name: r.profile.name,
          gender: genderOf(r),
          pronouns: pronounsOf(r),
          completionPct: Math.round(r.completion * 100),
          quizAvgPct: pctStr(r.quizAvg),
          attendanceRatePct: pctStr(r.attendanceRate),
          sessionsAttended: r.attendance,
          sessionsExpected: r.attendanceExpected,
          firstSession: r.signedDates[0] ?? null,
          unitStatus: Object.fromEntries(
            Object.entries(r.unitStatus).filter(([us]) => units.has(us))
          ),
          atRisk: r.atRisk,
          riskReasons: r.riskReasons,
          lastSeen: r.lastLogin ? new Date(r.lastLogin).toLocaleDateString() : "never signed in",
        })),
      };
    }
    case "custom":
      // the question can be about anything, so send the full picture
      return {
        ...base,
        learners: rows.map(learnerStat),
        unitOutcomes: outcomesData(rows, scope),
      };
    case "executive":
      return {
        ...base,
        topLearners: [...rows]
          .sort((a, b) => b.completion - a.completion)
          .slice(0, 3)
          .map((r) => ({
            name: r.profile.name,
            gender: genderOf(r),
            pronouns: pronounsOf(r),
            completionPct: Math.round(r.completion * 100),
          })),
        atRiskLearners: rows
          .filter((r) => r.atRisk)
          .map((r) => ({
            name: r.profile.name,
            gender: genderOf(r),
            pronouns: pronounsOf(r),
            reasons: r.riskReasons,
          })),
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

/** Slide-deck report following the approved Eruditio/Investec monthly template. */
export interface DeckKpi {
  value?: string;
  label?: string;
  sub?: string;
  tone?: string;
}
export interface DeckSlide {
  layout: string;
  headline: string;
  kicker?: string;
  kpis?: DeckKpi[];
  callout?: { tag?: string; statement?: string; body?: string };
  rows?: { label?: string; value?: string; ratio?: number }[];
  panel?: {
    stat?: string;
    statLabel?: string;
    tag?: string;
    note?: string;
    stats?: { value?: string; label?: string }[];
  };
  lead?: { left?: string; right?: string; caption?: string };
  columns?: string[];
  cells?: string[][];
  highlight?: { row?: number; col?: number };
  measures?: { measure?: string; indicator?: string; value?: string }[];
  strip?: { text?: string; value?: string };
  cards?: { title?: string; text?: string }[];
  items?: { title?: string; text?: string }[];
  note?: string;
}
export interface AiDeck {
  cover: {
    title?: string;
    period?: string;
    subtitle?: string;
    card?: { tag?: string; heading?: string; body?: string };
  };
  slides: DeckSlide[];
}

export type ReportResult =
  | { ok: true; report?: AiReport; deck?: AiDeck }
  | { ok: false; error: string; answer?: string };

/** Ask the API to write the report. Records token usage under "REPORTS". */
export async function requestReport(
  kind: ReportKind,
  data: unknown,
  question?: string,
  mode: "answer" | "report" = "report",
  history?: { role: "user" | "assistant"; text: string }[]
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
        mode,
        ...(question?.trim() ? { question: question.trim() } : {}),
        ...(history && history.length ? { history } : {}),
      }),
    });
    if (!r.ok) return { ok: false, error: `http_${r.status}` };
    const payload = (await r.json()) as Partial<AiReport> &
      Partial<AiDeck> & {
        error?: string;
        answer?: string;
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
    if (payload.error) {
      return { ok: false, error: payload.error, answer: payload.answer };
    }
    if (Array.isArray(payload.slides) && payload.slides.length > 0) {
      return {
        ok: true,
        deck: {
          cover: payload.cover && typeof payload.cover === "object" ? payload.cover : {},
          slides: payload.slides.filter(
            (s): s is DeckSlide =>
              !!s && typeof s === "object" && typeof s.layout === "string" && typeof s.headline === "string"
          ),
        },
      };
    }
    if (!Array.isArray(payload.sections) || payload.sections.length === 0) {
      return { ok: false, error: "empty_report", answer: payload.answer };
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
function appendixTable(kind: string, rows: LearnerRow[], scope: ReportScope = "worked"): string {
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
      rows,
      scope
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

function fmtRegDay(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleString("en", { weekday: "long" });
}

/** Tracker grid: legend + one row per learner with unit statuses, attendance
 *  ticks and the AI's per-learner comment — onboarding palette throughout. */
function trackerBody(rows: LearnerRow[], report: AiReport, scope: ReportScope): string {
  // scope "worked": only unit standards someone has started — grouped per
  // module so the grid stays the width of the real tracker
  const worked = workedUnitCodes(rows);
  let mods = MODULES.map((m) => ({
    name: m.name,
    units: scope === "all" ? m.units : m.units.filter((u) => worked.has(u.us)),
  })).filter((m) => m.units.length > 0);
  if (mods.length === 0) mods = [{ name: MODULES[0].name, units: MODULES[0].units }];
  const units = mods.flatMap((m) => m.units);
  const dates = attendanceFilledRegisterDates();
  const commentFor = (name: string) => {
    const hit = report.sections.find(
      (s) => s.heading.trim().toLowerCase() === name.trim().toLowerCase()
    ) ?? report.sections.find((s) => name.toLowerCase().includes(s.heading.trim().toLowerCase()));
    return hit ? hit.paragraphs.join(" ") : "";
  };
  const legend = `
  <div class="legend">
    <span class="item"><span class="sw st-nys"></span><strong>NYS</strong> Not yet submitted</span>
    <span class="item"><span class="sw st-c"></span><strong>C</strong> Competent</span>
    <span class="item"><span class="sw st-sa"></span><strong>SA</strong> Submitted, in assessment</span>
    <span class="item"><span class="sw st-ip"></span><strong>IP</strong> In process of submission</span>
    <span class="item"><span class="sw st-x"></span><strong>X</strong> Absent</span>
  </div>`;
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
      ${dates.length ? dates.map((d) => `<th class="c">${esc(fmtRegDay(d))}</th>`).join("") : `<th class="c" rowspan="2">—</th>`}
    </tr>
    <tr>
      ${units.map((u) => `<th class="c">${u.credits} credits</th>`).join("")}
      ${dates.map((d) => `<th class="c">${esc(fmtRegDate(d))}</th>`).join("")}
    </tr>
    <tr class="flt">
      ${[0, 1, 2]
        .map((i) => `<th><input data-col="${i}" type="text" placeholder="Filter" aria-label="Filter column" /></th>`)
        .join("")}
      <th colspan="${units.length + Math.max(dates.length, 1) + 1}"></th>
    </tr>`;
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
  question?: string,
  scope: ReportScope = "worked"
): string {
  const today = new Date().toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const tracker = kind.id === "tracker";
  const sections = tracker
    ? trackerBody(rows, report, scope)
    : report.sections
        .map(
          (s, i) => `
  <h2><span class="sec-num">${String(i + 1).padStart(2, "0")}</span>${esc(s.heading)}</h2>
  ${s.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}
  ${s.bullets && s.bullets.length ? `<ul>${s.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}`
        )
        .join("");
  const recs = report.recommendations.length
    ? `
  <h2>${tracker ? "Recommendations" : `<span class="sec-num">${String(report.sections.length + 1).padStart(2, "0")}</span>Recommendations`}</h2>
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
  body { font: 15px/1.7 "Segoe UI", "Helvetica Neue", Helvetica, "Lucida Grande", Arial, Ubuntu, Cantarell, "Fira Sans", sans-serif; color: #24324d; margin: 0; padding: 34px 44px; }
  h1 { font-size: 26px; margin: 0 0 3px; color: #0b3f8a; letter-spacing: -0.01em; }
  h2 { display: flex; align-items: center; gap: 12px; font-size: 17.5px; font-weight: 650; margin: 36px 0 12px; color: #0b3f8a; }
  h2::after { content: ""; flex: 1; border-top: 1px solid #e1e9f6; }
  h2 .sec-num { color: inherit; }
  p { margin: 0 0 12px; }
  .sub { color: #5a6b8c; margin: 0 0 18px; }
  .banner { background: #eef4ff; border: 1px solid #c9dbf7; border-radius: 10px; padding: 14px 18px; margin: 18px 0; }
  table { border-collapse: collapse; width: 100%; margin: 8px 0 4px; }
  th, td { border: 1px solid #ccd7ea; padding: 6px 9px; text-align: left; vertical-align: top; font-size: 13.5px; }
  th { background: #f2f6fd; }
  ol li, ul li { margin: 6px 0; line-height: 1.65; }
  .sign { display: flex; gap: 60px; margin-top: 36px; align-items: flex-end; }
  .sign div { flex: 1; padding-top: 0; font-size: 12.5px; color: #444; }
  .sign .sign-img { display: block; max-height: 58px; max-width: 220px; margin-bottom: 2px; }
  .sign .sign-line { display: block; border-top: 1.5px solid #17233b; margin-bottom: 5px; }
  .sign .sign-line-tall { margin-top: 60px; }
  .small { color: #5a6b8c; font-size: 12px; }
  /* tracker grid — same table styling as the data-snapshot appendix */
  .legend { display: flex; flex-wrap: wrap; gap: 10px 26px; margin: 4px 0 18px; }
  .legend .item { display: inline-flex; align-items: center; gap: 9px; font-size: 14px; color: #17233b; }
  .legend .sw { width: 16px; height: 16px; border-radius: 4px; display: inline-block; box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08); }
  .tracker .flt input { width: 100%; min-width: 46px; padding: 3px 5px; border: 1px solid #ccd7ea; border-radius: 4px; font: inherit; font-size: 11.5px; color: #17233b; background: #fff; }
  .tracker .flt input:focus { outline: none; border-color: #0F6CBD; }
  .tracker .flt th { padding: 4px; }
  @media print { .tracker .flt { display: none !important; } }
  .tracker th, .tracker td { font-size: 13.5px; padding: 6px 9px; border: 0.5px solid rgba(0, 0, 0, 0.94); }
  .tracker th { font-weight: 600; vertical-align: middle; text-align: left; }
  .tracker th.c, .tracker th[colspan] { text-align: center; }
  .tracker .c { text-align: center; white-space: nowrap; }
  .tracker .nm { min-width: 90px; }
  .tracker .idn { min-width: 95px; }
  .tracker .cm { min-width: 220px; text-align: left; }
  .tracker .ok { color: #0b6e3f; font-weight: 600; }
  .st-nys { background: #ffdd33; }
  .st-c { background: #3ecf6a; }
  .st-sa { background: #45b6ff; }
  .st-ip { background: #ffb266; }
  .st-x { background: #ff5a52; }
  .tracker td.st-x { color: #fff; font-weight: 600; }
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
    <span class="small">${scope === "all" ? "Covers the whole programme." : "Covers only the unit standards worked on so far."} Written by the ITSS Learn AI reporting assistant from live platform data; reviewed by ${esc(author.name)}.</span>
  </div>
  ${sections}
  ${recs}
${tracker ? "" : `
  <h2>Appendix · Data snapshot</h2>
  <p class="small">Figures as recorded on ITSS Learn at the time of generation (${esc(today)}).</p>
  ${appendixTable(kind.id, rows, scope)}
`}
  <div class="sign">
    <div>
      ${author.signatureImage ? `<img class="sign-img" src="${author.signatureImage}" alt="Signature of ${esc(author.name)}" />` : ""}
      <span class="sign-line"></span>
      Compiled by <strong>${esc(author.name)}</strong> · ${esc(today)}
    </div>
    <div>
      <span class="sign-line sign-line-tall"></span>
      Reviewed by (name &amp; signature)
    </div>
  </div>

  <style>
    .edit-toolbar { position: fixed; bottom: 14px; right: 12px; z-index: 999; font-family: "Segoe UI", system-ui, sans-serif; }
    .edit-toolbar button { display: inline-flex; align-items: center; gap: 7px; padding: 9px 15px; border: 1px solid #c9d4e4; border-radius: 8px; background: #ffffff; color: #1f2b3d; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 10px rgba(15, 35, 70, 0.14); }
    .edit-toolbar button:hover { background: #f0f5fb; }
    .edit-toolbar button.on { border-color: #0F6CBD; color: #0F6CBD; }
    body[contenteditable="true"] { caret-color: #0F6CBD; }
    body[contenteditable="true"]:focus { outline: none; }
    @media print { .edit-toolbar { display: none !important; } }
  </style>
  <div class="edit-toolbar">
    <button type="button" id="__editBtn" onclick="__toggleEdit()" title="Click any text to change it before printing or downloading">✎ Editing: off</button>
  </div>
  <script>
    // toggle whole-document editing — every character becomes editable
    var __editing = false;
    function __toggleEdit() {
      __editing = !__editing;
      document.body.contentEditable = __editing ? "true" : "false";
      var b = document.getElementById("__editBtn");
      b.textContent = "\\u270E Editing: " + (__editing ? "on" : "off");
      b.className = __editing ? "on" : "";
    }
    // per-column filters on the tracker grid
    (function () {
      var t = document.querySelector("table.tracker");
      if (!t) return;
      var inputs = Array.prototype.slice.call(t.querySelectorAll(".flt input"));
      function apply() {
        var rows = Array.prototype.filter.call(t.rows, function (r) {
          return r.cells.length && r.cells[0].tagName === "TD";
        });
        rows.forEach(function (r) {
          var show = true;
          inputs.forEach(function (inp) {
            var v = inp.value.trim().toLowerCase();
            if (!v || !show) return;
            var cell = r.cells[Number(inp.getAttribute("data-col"))];
            if (!cell || cell.innerText.toLowerCase().indexOf(v) === -1) show = false;
          });
          r.style.display = show ? "" : "none";
        });
      }
      inputs.forEach(function (inp) {
        inp.addEventListener("input", apply);
        // typing in a filter must never trigger document editing side-effects
        inp.setAttribute("contenteditable", "false");
      });
    })();
    // download includes any edits, minus the toolbars and editing state
    function __downloadDoc() {
      var clone = document.documentElement.cloneNode(true);
      clone.querySelectorAll(".doc-toolbar, .edit-toolbar").forEach(function (el) { el.remove(); });
      var body = clone.querySelector("body");
      if (body) body.removeAttribute("contenteditable");
      var blob = new Blob(["<!doctype html>" + clone.outerHTML], { type: "text/html" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = ${JSON.stringify(`${slug}-${new Date().toISOString().slice(0, 10)}.html`)};
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  </script>
</body>
</html>`;
}

/** Open the finished report in a new window, ready to print / save as PDF. */
export function openReportDocument(
  kind: ReportKind,
  result: { report?: AiReport; deck?: AiDeck },
  rows: LearnerRow[],
  registers: number,
  author: Profile,
  question?: string,
  scope: ReportScope = "worked"
) {
  const win = window.open("", "_blank");
  if (!win) return;
  void (async () => {
    let html = "";
    if (result.deck) {
      html = deckDocumentHtml(kind, result.deck, rows, author, await eruditioLogoDataUrl());
    } else if (result.report) {
      html = reportDocumentHtml(kind, result.report, rows, registers, author, question, scope);
    } else {
      win.close();
      return;
    }
    win.document.write(html);
    win.document.close();
  })();
}

/* ------------------------------------------------------------------ */
/* Deck-template report — 1:1 replica of the approved Eruditio deck    */
/* (16:9 pages, orange/green strips, warm panels, numbered furniture). */
/* ------------------------------------------------------------------ */

let logoCache: string | null = null;

/** Eruditio logo as a data URL so downloaded reports stay self-contained. */
async function eruditioLogoDataUrl(): Promise<string> {
  if (logoCache !== null) return logoCache;
  try {
    const blob = await (await fetch("/logos/eruditio.svg")).blob();
    logoCache = await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = () => reject(fr.error);
      fr.readAsDataURL(blob);
    });
  } catch {
    logoCache = "";
  }
  return logoCache;
}

const DECK = {
  o: "#F0872B", // orange
  g: "#2E9B7A", // green
  y: "#F5D24C", // yellow
  t: "#DCC0A0", // tan
  ink: "#171717",
  grey: "#62676B",
  paper: "#F7F5F1",
  mint: "#EDF7F3",
  line: "#DED9D1",
  cell: "#363636",
  hl: "#B7E3A5",
};

const ACC_CYCLE = [DECK.o, DECK.g, DECK.y, DECK.t];

const toneColor = (tone: string | undefined, i: number): string => {
  const t = (tone ?? "").trim().toLowerCase();
  if (t === "green") return DECK.g;
  if (t === "orange") return DECK.o;
  if (t === "yellow") return DECK.y;
  if (t === "tan") return DECK.t;
  return [DECK.g, DECK.o, DECK.y, DECK.g][i % 4];
};

const clamp01 = (v: unknown): number => {
  const n = Number(v);
  if (!Number.isFinite(n)) return 1;
  return Math.max(0, Math.min(1, n));
};

function deckSlideBody(s: DeckSlide): string {
  const layout = s.layout.trim().toLowerCase();

  if (layout === "kpi") {
    const kpis = (s.kpis ?? []).slice(0, 4);
    const cards = kpis
      .map((k, i) => {
        const acc = toneColor(k.tone, i);
        return `<div class="kpi" style="--acc:${acc}"><i></i><div class="kv">${esc(k.value ?? "")}</div><div class="kl">${esc(k.label ?? "")}</div>${k.sub ? `<div class="ks">${esc(k.sub)}</div>` : ""}</div>`;
      })
      .join("");
    const co = s.callout;
    return `<div class="kpis" style="grid-template-columns:repeat(${Math.max(kpis.length, 1)},1fr)">${cards}</div>${
      co
        ? `<div class="callout">${co.tag ? `<div class="co-tag">${esc(co.tag)}</div>` : ""}${co.statement ? `<div class="co-stat">${esc(co.statement)}</div>` : ""}${co.body ? `<div class="co-body">${esc(co.body)}</div>` : ""}</div>`
        : ""
    }`;
  }

  if (layout === "sessions") {
    const rows = (s.rows ?? []).slice(0, 6);
    const bars = rows
      .map(
        (r) =>
          `<div class="srow"><span class="lb">${esc(r.label ?? "")}</span><span class="bar"><i style="width:${Math.round(clamp01(r.ratio ?? 1) * 100)}%"></i></span><span class="vl">${esc(r.value ?? "")}</span></div>`
      )
      .join("");
    const p = s.panel;
    const panel = p
      ? `<div class="spanel">${p.stat ? `<div class="sp-v">${esc(p.stat)}</div>` : ""}${p.statLabel ? `<div class="sp-l">${esc(p.statLabel)}</div>` : ""}<div class="sp-hr"></div>${p.tag ? `<div class="sp-t">${esc(p.tag)}</div>` : ""}${p.note ? `<div class="sp-n">${esc(p.note)}</div>` : ""}</div>`
      : "";
    return `${s.kicker ? `<div class="kicker">${esc(s.kicker)}</div>` : ""}<div class="sess"><div class="srows">${bars}</div>${panel}</div>${
      s.note ? `<div class="ban-o">${esc(s.note)}</div>` : ""
    }`;
  }

  if (layout === "table") {
    const columns = (s.columns ?? []).slice(0, 5);
    const nCols = Math.max(columns.length, 1);
    const rows = (s.cells ?? []).slice(0, 6);
    const hr = Number(s.highlight?.row);
    const hc = Number(s.highlight?.col);
    const lead = s.lead;
    const head = `<tr>${columns.map((c) => `<th>${esc(c)}</th>`).join("")}</tr>`;
    const body = rows
      .map(
        (r, ri) =>
          `<tr>${(Array.isArray(r) ? r : []).slice(0, nCols).map((c, ci) => `<td${ri === hr && ci === hc ? ` class="hl"` : ""}>${esc(String(c ?? ""))}</td>`).join("")}</tr>`
      )
      .join("");
    return `${s.kicker ? `<div class="kicker">${esc(s.kicker)}</div>` : ""}${
      lead
        ? `<div class="lead"><i></i><span class="ll">${esc(lead.left ?? "")}</span><span class="lr">${esc(lead.right ?? "")}</span></div>${lead.caption ? `<div class="lead-cap">${esc(lead.caption)}</div>` : ""}`
        : ""
    }<table class="grid">${head}${body}</table>${s.note ? `<div class="ban-m">${esc(s.note)}</div>` : ""}`;
  }

  if (layout === "measures") {
    const ms = (s.measures ?? []).slice(0, 12);
    const half = Math.ceil(ms.length / 2);
    const tbl = (list: typeof ms) =>
      list.length
        ? `<table class="mt"><tr><th>Measure</th><th>Performance indicator</th><th>Value</th></tr>${list
            .map(
              (m) =>
                `<tr><td class="mm">${esc(m.measure ?? "")}</td><td class="mi">${esc(m.indicator ?? "")}</td><td class="mv">${esc(m.value ?? "")}</td></tr>`
            )
            .join("")}</table>`
        : "";
    return `${s.kicker ? `<div class="kicker">${esc(s.kicker)}</div>` : ""}<div class="mgrid">${tbl(ms.slice(0, half))}${tbl(ms.slice(half))}</div>${
      s.strip?.text
        ? `<div class="ban-g"><span class="tx">${esc(s.strip.text)}</span>${s.strip.value ? `<span class="vv">${esc(s.strip.value)}</span>` : ""}</div>`
        : ""
    }`;
  }

  if (layout === "cards") {
    const cards = (s.cards ?? []).slice(0, 4);
    return `${s.kicker ? `<div class="kicker">${esc(s.kicker)}</div>` : ""}<div class="cgrid">${cards
      .map((c, i) => {
        const acc = ACC_CYCLE[i % 4];
        return `<div class="ccard"><span class="chip${acc === DECK.y ? " dk" : ""}" style="--acc:${acc}">${String(i + 1).padStart(2, "0")}</span><div><div class="cc-t">${esc(c.title ?? "")}</div><div class="cc-b">${esc(c.text ?? "")}</div></div></div>`;
      })
      .join("")}</div>${s.strip?.text ? `<div class="ban-g"><span class="tx">${esc(s.strip.text)}</span></div>` : ""}`;
  }

  // recommendations (default for any unknown layout so nothing is lost)
  const items = (s.items ?? s.cards ?? []).slice(0, 4);
  const list = items
    .map((c, i) => {
      const acc = ACC_CYCLE[i % 4];
      return `<div class="rec"><span class="chip big${acc === DECK.y ? " dk" : ""}" style="--acc:${acc}">${String(i + 1).padStart(2, "0")}</span><div><div class="cc-t">${esc(c.title ?? "")}</div><div class="cc-b">${esc(c.text ?? "")}</div></div></div>`;
    })
    .join("");
  const stats = (s.panel?.stats ?? []).slice(0, 4);
  const panel = `<div class="rbox">${s.panel?.tag ? `<div class="co-tag">${esc(s.panel.tag)}</div>` : ""}${stats
    .map(
      (st, i) =>
        `<div class="rstat"><span class="v" style="--acc:${[DECK.g, DECK.o, DECK.y, DECK.g][i % 4]}">${esc(st.value ?? "")}</span><span class="l">${esc(st.label ?? "")}</span></div>`
    )
    .join("")}</div>`;
  return `<div class="recwrap"><div class="recs">${list}</div><div class="rpanel">${panel}${
    s.strip?.text ? `<div class="ban-o">${esc(s.strip.text)}</div>` : ""
  }</div></div>`;
}

/** Printable deck document — pixel replica of the approved PPTX template. */
export function deckDocumentHtml(
  kind: ReportKind,
  deck: AiDeck,
  rows: LearnerRow[],
  author: Profile,
  logo: string
): string {
  const now = new Date();
  const cover = deck.cover ?? {};
  const period =
    cover.period?.trim() ||
    `1–${now.getDate()} ${now.toLocaleString("en-GB", { month: "long" })} ${now.getFullYear()}`;
  // the deck reports a period — all month furniture follows it, not today's date
  const monthMatch = period.match(
    /January|February|March|April|May|June|July|August|September|October|November|December/gi
  );
  const month = monthMatch?.[monthMatch.length - 1] ?? now.toLocaleString("en-GB", { month: "long" });
  const sponsor = (COURSE_META as { sponsor?: string }).sponsor ?? "";
  const sponsorWord = (sponsor.trim().split(/\s+/)[0] || "Learnership").toUpperCase();
  const eyebrow = `${sponsorWord} • ${month.toUpperCase()} LEARNERSHIP REPORT`;
  const title = cover.title?.trim() || `${month} ${kind.name}`;
  const subtitle = cover.subtitle?.trim() || `${COURSE_META.title} • ${month} ${now.getFullYear()}`;
  const card = cover.card ?? {};
  const slides = deck.slides.slice(0, 7);
  const slug = kind.name.replace(/\s+/g, "-").toLowerCase();
  const filename = `${slug}-${now.toISOString().slice(0, 10)}.html`;
  const logoCss = logo
    ? `.slogo{background-image:url("${logo}")}.clogo{background-image:url("${logo}")}`
    : "";

  const metaRows: [string, string][] = [
    ["SAQA ID", COURSE_META.saqaId],
    ...(sponsor ? ([["Sponsor", sponsor]] as [string, string][]) : []),
    ["NQF level", `Level ${COURSE_META.nqfLevel} • ${COURSE_META.credits} credits`],
    ["Reporting period", period],
    ["Facilitator", author.name],
    ["Cohort", `${rows.length} learner${rows.length === 1 ? "" : "s"}`],
  ];

  const coverHtml = `
  <section class="slide cover">
    <div class="so"></div><div class="sg"></div>
    <div class="clogo"></div>
    <div class="c-sp">${esc(sponsorWord)}</div>
    <div class="c-title${title.length > 46 ? " long" : ""}">${esc(title)}</div>
    <div class="c-sub">${esc(subtitle)}</div>
    <table class="c-meta">${metaRows
      .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`)
      .join("")}</table>
    <div class="c-card">
      <div class="tag">${esc(card.tag || "HR MANAGEMENT VIEW")}</div>
      <div class="h">${esc(card.heading || "Attendance, delivery, assessment progress and learner engagement")}</div>
      <div class="s">${esc(card.body || `Compiled from the ITSS Learn platform records by ${author.name}.`)}</div>
    </div>
    <div class="fline"></div>
    <div class="ftext">Eruditio • Empower · Develop · Transform</div>
    <div class="fpage">01</div>
  </section>`;

  const slideHtml = slides
    .map(
      (s, i) => `
  <section class="slide">
    <div class="so"></div><div class="sg"></div>
    <div class="eyeb">${esc(eyebrow)}</div>
    <div class="hline${s.headline.length > 58 ? " long" : ""}">${esc(s.headline)}</div>
    <div class="slogo"></div>
    <div class="rule"></div>
    <div class="content">${deckSlideBody(s)}</div>
    <div class="fline"></div>
    <div class="ftext">Eruditio • Empower · Develop · Transform</div>
    <div class="fpage">${String(i + 2).padStart(2, "0")}</div>
  </section>`
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${esc(title)} — ${esc(COURSE_META.title)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#4a4a50;font-family:Calibri,"Segoe UI",Arial,sans-serif;color:${DECK.ink};-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .slide{position:relative;width:13.333in;height:7.5in;background:#fff;margin:20px auto;box-shadow:0 6px 26px rgba(0,0,0,.4);overflow:hidden}
  @media print{body{background:#fff}.slide{margin:0;box-shadow:none;break-after:page}.slide:last-child{break-after:auto}@page{size:13.333in 7.5in;margin:0}}
  .so{position:absolute;top:0;left:0;width:100%;height:.146in;background:${DECK.o}}
  .sg{position:absolute;top:.146in;left:0;width:100%;height:.073in;background:${DECK.g}}
  .eyeb{position:absolute;left:.646in;top:.36in;font-size:9.75pt;font-weight:700;color:${DECK.g};letter-spacing:.1em;text-transform:uppercase}
  .hline{position:absolute;left:.646in;top:.66in;width:9.7in;font-size:25.5pt;font-weight:700;line-height:1.06;color:${DECK.ink}}
  .hline.long{font-size:21pt;top:.72in}
  .slogo{position:absolute;left:10.421in;top:.295in;width:2.288in;height:.9in;background-repeat:no-repeat;background-position:right center;background-size:contain}
  .rule{position:absolute;left:.646in;top:1.479in;width:12.042in;height:.031in;background:${DECK.o}}
  .content{position:absolute;left:.646in;top:1.71in;width:12.042in;height:5.3in;display:flex;flex-direction:column;overflow:hidden}
  .fline{position:absolute;left:.646in;top:7.083in;width:12.042in;border-top:1px solid ${DECK.t}}
  .ftext{position:absolute;left:.646in;top:7.13in;font-size:8.25pt;color:${DECK.grey}}
  .fpage{position:absolute;right:.646in;top:7.11in;font-size:9pt;font-weight:700;color:${DECK.o}}
  .kicker{font-size:10.5pt;font-weight:700;color:${DECK.g};letter-spacing:.08em;text-transform:uppercase}
  /* kpi */
  .kpis{display:grid;gap:.26in;margin-top:.16in}
  .kpi{position:relative;background:#fff;border:1px solid ${DECK.line};border-radius:.09in;padding:.29in .25in .18in;overflow:hidden}
  .kpi i{position:absolute;top:0;left:0;width:100%;height:.094in;background:var(--acc)}
  .kv{font-size:31.5pt;font-weight:700;line-height:1.02;color:var(--acc)}
  .kl{font-size:12.75pt;font-weight:700;margin-top:.07in;line-height:1.15}
  .ks{font-size:9.75pt;color:${DECK.grey};margin-top:.05in;line-height:1.25}
  .callout{background:${DECK.paper};border-radius:.1in;padding:.27in .3in;margin-top:.38in}
  .co-tag{font-size:10.5pt;font-weight:700;color:${DECK.g};letter-spacing:.09em;text-transform:uppercase}
  .co-stat{font-size:21pt;font-weight:700;line-height:1.12;margin-top:.13in}
  .co-body{font-size:12.75pt;color:${DECK.grey};line-height:1.4;margin-top:.12in}
  /* sessions */
  .sess{display:flex;gap:.28in;margin-top:.2in;flex:1;min-height:0}
  .srows{flex:1;display:flex;flex-direction:column;gap:.24in}
  .srow{display:flex;align-items:center;gap:.2in}
  .srow .lb{width:2.2in;flex:none;font-size:12pt}
  .srow:first-child .lb{font-weight:700}
  .bar{flex:1;height:.26in;border-radius:.13in;background:${DECK.paper};position:relative;overflow:hidden}
  .bar i{position:absolute;top:0;left:0;bottom:0;background:${DECK.g};border-radius:.13in}
  .srow .vl{width:1in;flex:none;text-align:right;font-size:12.75pt;font-weight:700;color:${DECK.grey}}
  .srow:first-child .vl{color:${DECK.g}}
  .spanel{width:2.167in;flex:none;background:${DECK.mint};border-radius:.1in;padding:.3in .24in;text-align:center;align-self:flex-start}
  .sp-v{font-size:36pt;font-weight:700;color:${DECK.g};line-height:1}
  .sp-l{font-size:13.5pt;font-weight:700;line-height:1.2;margin-top:.09in}
  .sp-hr{border-top:2px solid ${DECK.o};margin:.2in .1in}
  .sp-t{font-size:10.5pt;font-weight:700;color:${DECK.o};letter-spacing:.06em;text-transform:uppercase}
  .sp-n{font-size:12pt;font-weight:700;line-height:1.25;margin-top:.09in}
  .ban-o{margin-top:auto;background:${DECK.o};color:#fff;font-size:12pt;font-weight:700;line-height:1.3;padding:.14in .23in}
  /* table */
  .lead{position:relative;height:.458in;border-radius:.1in;background:${DECK.paper};margin-top:.16in;overflow:hidden}
  .lead i{position:absolute;left:0;top:0;bottom:0;width:47.1%;background:${DECK.g};border-radius:.1in}
  .lead .ll{position:absolute;left:.17in;top:0;bottom:0;display:flex;align-items:center;color:#fff;font-size:12pt;font-weight:700}
  .lead .lr{position:absolute;right:.38in;top:0;bottom:0;display:flex;align-items:center;font-size:12pt;font-weight:700}
  .lead-cap{font-size:11.25pt;color:${DECK.grey};margin-top:.09in}
  table.grid{border-collapse:collapse;width:100%;margin-top:.24in}
  .grid th{background:${DECK.g};color:#fff;text-align:left;font-size:10.5pt;font-weight:700;padding:.1in .11in;border:1px solid ${DECK.cell}}
  .grid td{background:#fff;font-size:10.5pt;line-height:1.25;padding:.11in;border:1px solid ${DECK.cell}}
  .grid td.hl{background:${DECK.hl};font-weight:700}
  .ban-m{margin-top:auto;background:${DECK.mint};border-radius:.09in;font-size:12pt;font-weight:700;line-height:1.3;padding:.13in .23in}
  /* measures */
  .mgrid{display:grid;grid-template-columns:1fr 1fr;gap:0 .37in;margin-top:.18in;align-items:start}
  table.mt{border-collapse:collapse;width:100%}
  .mt th{background:${DECK.g};color:#fff;text-align:left;font-size:9.75pt;font-weight:700;padding:.07in .09in;border:1px solid ${DECK.cell}}
  .mt td{border:1px solid ${DECK.cell};padding:.09in;line-height:1.2;background:#fff}
  .mt td.mm{background:${DECK.paper};color:${DECK.o};font-weight:700;font-size:9.75pt;width:1.15in}
  .mt td.mi{font-size:9.5pt}
  .mt td.mv{font-size:9.75pt;width:.9in}
  .ban-g{margin-top:auto;background:${DECK.g};color:#fff;display:flex;align-items:center;gap:.3in;padding:.12in .21in}
  .ban-g .tx{font-size:12pt;font-weight:700;letter-spacing:.02em;text-transform:uppercase;flex:1;line-height:1.3}
  .ban-g .vv{font-size:18pt;font-weight:700}
  /* cards */
  .cgrid{display:grid;grid-template-columns:1fr 1fr;gap:.31in .37in;margin-top:.22in}
  .ccard{background:${DECK.paper};border-radius:.1in;padding:.22in;display:flex;gap:.2in;min-height:1.708in}
  .chip{width:.625in;height:.625in;flex:none;border-radius:.15in;background:var(--acc);color:#fff;display:flex;align-items:center;justify-content:center;font-size:15pt;font-weight:700}
  .chip.big{width:.75in;height:.75in;font-size:15.75pt;border-radius:.16in}
  .chip.dk{color:${DECK.ink}}
  .cc-t{font-size:14.25pt;font-weight:700;line-height:1.15}
  .cc-b{font-size:11.25pt;color:${DECK.grey};line-height:1.38;margin-top:.08in}
  /* recommendations */
  .recwrap{display:flex;gap:.5in;margin-top:.18in;flex:1;min-height:0}
  .recs{flex:1;display:flex;flex-direction:column;gap:.28in}
  .rec{display:flex;gap:.27in}
  .rpanel{width:5.396in;flex:none;display:flex;flex-direction:column;gap:.26in}
  .rbox{background:${DECK.paper};border-radius:.1in;padding:.28in .31in;flex:1}
  .rstat{display:flex;align-items:baseline;gap:.25in;margin-top:.2in}
  .rstat .v{min-width:1.15in;font-size:22.5pt;font-weight:700;line-height:1;color:var(--acc)}
  .rstat .l{font-size:12.75pt;font-weight:700}
  .rpanel .ban-o{margin-top:0}
  /* cover */
  .cover .so{height:.229in}
  .cover .sg{top:.229in;height:.083in}
  .clogo{position:absolute;left:.729in;top:.529in;width:3.438in;height:1.35in;background-repeat:no-repeat;background-position:left center;background-size:contain}
  .c-sp{position:absolute;left:.75in;top:2.104in;font-size:13.5pt;font-weight:700;color:${DECK.g};letter-spacing:.18em;text-transform:uppercase}
  .c-title{position:absolute;left:.75in;top:2.42in;width:11in;font-size:34.5pt;font-weight:700;line-height:1.04;color:${DECK.ink}}
  .c-title.long{font-size:28pt;top:2.5in}
  .c-sub{position:absolute;left:.75in;top:3.365in;width:11.25in;font-size:14.25pt;color:${DECK.grey}}
  table.c-meta{position:absolute;left:.75in;top:4.094in;width:8.646in;border-collapse:collapse}
  .c-meta th{background:${DECK.g};color:#fff;width:2.708in;text-align:left;font-size:10.5pt;font-weight:700;padding:.088in .17in;border:1px solid ${DECK.cell}}
  .c-meta td{background:#fff;font-size:10.5pt;padding:.088in .17in;border:1px solid ${DECK.cell}}
  .c-card{position:absolute;left:9.875in;top:4.094in;width:2.708in;height:2.375in;background:${DECK.paper};border-radius:.1in;padding:.26in .27in}
  .c-card .tag{font-size:9.75pt;font-weight:700;color:${DECK.o};letter-spacing:.08em;text-transform:uppercase}
  .c-card .h{font-size:13.5pt;font-weight:700;line-height:1.28;margin-top:.14in}
  .c-card .s{font-size:9.38pt;color:${DECK.grey};line-height:1.42;margin-top:.15in}
  ${logoCss}
</style>
</head>
<body>
  ${docToolbar(filename)}
  ${coverHtml}
  ${slideHtml}
  <style>
    .edit-toolbar { position: fixed; bottom: 14px; right: 12px; z-index: 999; font-family: "Segoe UI", system-ui, sans-serif; }
    .edit-toolbar button { display: inline-flex; align-items: center; gap: 7px; padding: 9px 15px; border: 1px solid #c9d4e4; border-radius: 8px; background: #ffffff; color: #1f2b3d; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 10px rgba(15, 35, 70, 0.14); }
    .edit-toolbar button:hover { background: #f0f5fb; }
    .edit-toolbar button.on { border-color: #0F6CBD; color: #0F6CBD; }
    body[contenteditable="true"] { caret-color: #0F6CBD; }
    body[contenteditable="true"]:focus { outline: none; }
    @media print { .edit-toolbar { display: none !important; } }
  </style>
  <div class="edit-toolbar">
    <button type="button" id="__editBtn" onclick="__toggleEdit()" title="Click any text to change it before printing or downloading">✎ Editing: off</button>
  </div>
  <script>
    var __editing = false;
    function __toggleEdit() {
      __editing = !__editing;
      document.body.contentEditable = __editing ? "true" : "false";
      var b = document.getElementById("__editBtn");
      b.textContent = "\\u270E Editing: " + (__editing ? "on" : "off");
      b.className = __editing ? "on" : "";
    }
    function __downloadDoc() {
      var clone = document.documentElement.cloneNode(true);
      clone.querySelectorAll(".doc-toolbar, .edit-toolbar").forEach(function (el) { el.remove(); });
      var body = clone.querySelector("body");
      if (body) body.removeAttribute("contenteditable");
      var blob = new Blob(["<!doctype html>" + clone.outerHTML], { type: "text/html" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = ${JSON.stringify(filename)};
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  </script>
</body>
</html>`;
}
