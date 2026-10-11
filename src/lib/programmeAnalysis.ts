import type { LearnerRow } from "../pages/Analytics";

/** Snapshot charts use recorded cohort data, never AI-generated numbers or inferred history. */
interface AnalysisUnit { us: string; title: string; module: string }
interface AnalysisOutcome { unitStandard: string; competent: number; notYetCompetent: number; noDecisionYet: number }
interface Point { label: string; value: number | null }
interface Chart {
  title: string;
  note: string;
  unit: string;
  points: Point[];
  max?: number;
}

const esc = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const percent = (value: number | null) => value === null ? null : Math.round(value * 100);
const fmt = (value: number | null, unit: string) => value === null ? "Not recorded" : `${value}${unit}`;
const count = (rows: LearnerRow[], predicate: (row: LearnerRow) => boolean) => rows.filter(predicate).length;

export function programmeAnalysisData(rows: LearnerRow[], units: AnalysisUnit[], outcomes: AnalysisOutcome[], poeTotal: number, credits: number) {
  const learners = (pick: (row: LearnerRow) => number | null): Point[] => rows.map(row => ({ label: row.profile.name, value: pick(row) }));
  const bands = ["0-24%", "25-49%", "50-74%", "75-99%", "100%"].map((label, index) => ({
    label, value: count(rows, row => index === 4 ? row.completion >= 1 : row.completion >= index / 4 && row.completion < (index + 1) / 4),
  }));
  const dates = [...new Set(rows.flatMap(row => row.signedDates))].filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date)).sort();
  const sessions = dates.map(date => ({
    label: date,
    value: count(rows, row => row.signedDates.includes(date)),
  }));
  const riskFactors = [
    { label: "Low completion (<25%)", value: count(rows, row => row.completion < 0.25) },
    { label: "Low attendance (<50%)", value: count(rows, row => row.attendanceRate !== null && row.attendanceRate < 0.5) },
    { label: "Inactive (>14 days)", value: count(rows, row => row.daysSinceSeen !== null && row.daysSinceSeen > 14) },
    { label: "Never signed in", value: count(rows, row => row.daysSinceSeen === null) },
    { label: "Low quiz average (<50%)", value: count(rows, row => row.quizAvg !== null && row.quizAvg < 0.5) },
  ];
  const status = units.map(unit => ({
    label: `US ${unit.us}`,
    title: unit.title,
    values: ["C", "SA", "IP", "NYS"].map(code => count(rows, row => (row.unitStatus[unit.us] ?? "NYS") === code)),
  }));
  const modules = [...new Set(units.map(unit => unit.module))].map(label => {
    const selected = units.filter(unit => unit.module === label);
    const decisions = rows.length * selected.length;
    const competent = selected.reduce((sum, unit) => sum + count(rows, row => row.unitStatus[unit.us] === "C"), 0);
    return { label, value: decisions ? Math.round(competent / decisions * 100) : null };
  });
  const charts: Chart[] = [
    { title: "Completion by learner", note: "Current recorded whole-programme learning completion, not an assessor decision.", unit: "%", max: 100, points: learners(row => percent(row.completion)) },
    { title: "Completion distribution", note: "Number of learners in each whole-programme completion band.", unit: " learners", points: bands },
    { title: "Attendance by learner", note: "Signed registers divided by expected registers since each learner's first signed session. Missing attendance is not zero.", unit: "%", max: 100, points: learners(row => percent(row.attendanceRate)) },
    { title: "Quiz performance", note: "Average best quiz result per learner; learners without valid attempts are marked not recorded.", unit: "%", max: 100, points: learners(row => percent(row.quizAvg)) },
    { title: "Exercise performance", note: "Average best exercise result per learner; no recorded results are not treated as failures.", unit: "%", max: 100, points: learners(row => percent(row.exerciseAvg)) },
    { title: "Portfolio evidence coverage", note: `Recorded evidence items as a proportion of the ${poeTotal} required items; coverage does not certify evidence quality.`, unit: "%", max: 100, points: learners(row => poeTotal > 0 ? Math.round(row.poeDone / poeTotal * 100) : null) },
    { title: "Assessor-confirmed credits", note: `Credits earned from Competent outcomes only, against ${credits} programme credits.`, unit: " credits", max: credits, points: learners(row => row.creditsEarned) },
    { title: "Competence by module", note: "Competent learner-unit records divided by all learner-unit records in the selected unit scope.", unit: "%", max: 100, points: modules },
    { title: "Risk indicators", note: "Learners can appear in more than one indicator. At-risk classification requires at least two indicators.", unit: " learners", points: riskFactors },
    { title: "Formal assessment decisions", note: "Assessor decisions across scoped learner-unit records. No decision is not a Not Yet Competent result.", unit: " decisions", points: [
      { label: "Competent", value: outcomes.reduce((sum, unit) => sum + unit.competent, 0) },
      { label: "Not Yet Competent", value: outcomes.reduce((sum, unit) => sum + unit.notYetCompetent, 0) },
      { label: "No decision recorded", value: outcomes.reduce((sum, unit) => sum + unit.noDecisionYet, 0) },
    ] },
  ];
  const scatter = rows.filter(row => row.attendanceRate !== null).map(row => ({
    label: row.profile.name, attendance: percent(row.attendanceRate)!, completion: percent(row.completion)!,
  }));
  return { charts, sessions, status, scatter, learners: rows.length, atRisk: count(rows, row => row.atRisk) };
}

export const PROGRAMME_ANALYSIS_CSS = `
body { font:13px/1.5 "Segoe UI",Arial,sans-serif; color:#323130; background:#fff; }
h1 { color:#323130; font-size:24px; font-weight:600; border-bottom:3px solid #00a4ef; padding-bottom:12px; margin-bottom:8px; }
h2 { color:#323130; font-size:16px; font-weight:600; margin-top:28px; }
h2::after { border-color:#edebe9; }
.sub,.small { color:#605e5c; }
.banner { background:#faf9f8; border:1px solid #edebe9; border-radius:0; padding:12px 16px; }
th { background:#f3f2f1; font-weight:600; }
th,td { border-color:#edebe9; font-size:12px; }
.analysis-kpis { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin:16px 0; }
.analysis-kpi { background:#fff; border:1px solid #edebe9; border-left:3px solid #00a4ef; padding:12px 16px; border-radius:0; font-size:12px; color:#605e5c; }
.analysis-kpi strong { display:block; color:#323130; font-size:32px; font-weight:600; line-height:1.2; margin-bottom:4px; }
.analysis-kpi:nth-child(2) { border-left-color:#f25022; }
.analysis-kpi:nth-child(3) { border-left-color:#7fba00; }
.analysis-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; }
.analysis-chart { --series:#00a4ef; margin:0; padding:16px; border:1px solid #edebe9; border-radius:0; background:#fff; min-width:0; break-inside:avoid; }
.analysis-chart.wide { grid-column:1/-1; }
.analysis-chart h3 { color:#323130; font-size:14px; font-weight:600; margin:0 0 6px; }
.analysis-chart:nth-child(2),.analysis-chart:nth-child(6),.analysis-chart:nth-child(7),.analysis-chart:nth-child(8) { --series:#7fba00; }
.analysis-chart:nth-child(5) { --series:#ffb900; }
.analysis-chart:nth-child(9) { --series:#f25022; }
.analysis-chart p { font-size:11px; color:#605e5c; line-height:1.45; }
.analysis-row { display:grid; grid-template-columns:minmax(90px,1fr) minmax(70px,1.5fr) 85px; align-items:center; gap:8px; margin:9px 0; font-size:12px; }
.analysis-row > span:first-child { overflow-wrap:anywhere; }
.analysis-track { background:#f3f2f1; height:10px; border-radius:0; overflow:hidden; }
.analysis-fill { display:block; background:var(--series); height:100%; }
.analysis-chart:nth-child(10) .analysis-row:nth-of-type(1) .analysis-fill { background:#7fba00; }
.analysis-chart:nth-child(10) .analysis-row:nth-of-type(2) .analysis-fill { background:#f25022; }
.analysis-chart:nth-child(10) .analysis-row:nth-of-type(3) .analysis-fill { background:#a6a6a6; }
.analysis-value { text-align:right; font-variant-numeric:tabular-nums; }
.analysis-chart svg { display:block; width:100%; height:auto; }
.analysis-chart svg polyline { stroke:#00a4ef; }
.analysis-chart svg circle { fill-opacity:.85; stroke:#fff; stroke-width:1; }
.analysis-chart svg circle { fill:#00a4ef; }
.analysis-legend { display:flex; flex-wrap:wrap; gap:12px; font-size:12px; margin:10px 0; }
.analysis-legend i { display:inline-block; width:12px; height:12px; margin-right:5px; }
.analysis-stack { display:flex; height:14px; background:#eef4ff; overflow:hidden; }
.analysis-chart details { font-size:12px; margin-top:12px; }
.analysis-chart summary { cursor:pointer; color:#0078d4; }
.analysis-appendix { max-width:100%; overflow-x:auto; }
.analysis-chart table { table-layout:fixed; }
.analysis-chart td, .analysis-chart th { overflow-wrap:anywhere; font-size:11px; }
@media(max-width:700px) { body { padding:20px 16px; } .analysis-grid { grid-template-columns:1fr; } .analysis-kpis { grid-template-columns:1fr; } .analysis-row { grid-template-columns:minmax(70px,1fr) minmax(40px,1fr) 75px; } }
@media print { body { padding:10mm 12mm; } .analysis-grid { display:block; } .analysis-chart { margin-bottom:16px; } .analysis-chart details { display:none; } .analysis-appendix { overflow:visible; } .analysis-chart,.analysis-track,.analysis-fill,.analysis-stack,.analysis-kpi { print-color-adjust:exact; -webkit-print-color-adjust:exact; } }
`;

export function programmeAnalysisHtml(data: ReturnType<typeof programmeAnalysisData>): string {
  const table = (headers: string[], rows: string[][]) => `<details><summary>View chart data</summary><table><thead><tr>${headers.map(text => `<th>${esc(text)}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(text => `<td>${esc(text)}</td>`).join("")}</tr>`).join("")}</tbody></table></details>`;
  const card = (title: string, note: string, body: string, wide = false) => `<figure class="analysis-chart${wide ? " wide" : ""}"><figcaption><h3>${esc(title)}</h3><p>${esc(note)}</p></figcaption>${body}</figure>`;
  const bars = data.charts.map(chart => {
    const max = Math.max(chart.max ?? 0, ...chart.points.map(point => point.value ?? 0), 1);
    return card(chart.title, chart.note, chart.points.length ? chart.points.map(point => `<div class="analysis-row"><span>${esc(point.label)}</span><span class="analysis-track" aria-hidden="true"><span class="analysis-fill" style="width:${(point.value ?? 0) / max * 100}%"></span></span><span class="analysis-value">${esc(fmt(point.value, chart.unit))}</span></div>`).join("") : "<p>No learners recorded.</p>");
  }).join("");
  const colours = ["#7fba00", "#00a4ef", "#ffb900", "#a6a6a6"];
  const statusLabels = ["Competent", "Submitted", "In process", "Not yet started"];
  const status = card("Unit-standard status", "Counts per scoped unit. Submitted means learning activities are complete; only an assessor decision establishes Competent.",
    `<div class="analysis-legend">${statusLabels.map((text, i) => `<span><i style="background:${colours[i]}"></i>${text}</span>`).join("")}</div>` +
    data.status.map(unit => `<div class="analysis-row" title="${esc(unit.title)}"><span>${esc(unit.label)}</span><span class="analysis-stack" role="img" aria-label="${esc(statusLabels.map((label, i) => `${label}: ${unit.values[i]}`).join(", "))}">${unit.values.map((value, i) => `<span style="width:${data.learners ? value / data.learners * 100 : 0}%;background:${colours[i]}"></span>`).join("")}</span><span class="analysis-value">${unit.values.join(" / ")}</span></div>`).join("") +
    table(["Unit", ...statusLabels], data.status.map(unit => [unit.label, ...unit.values.map(String)])), true);
  const timelinePoints = data.sessions.map((point, i) => `${60 + (data.sessions.length > 1 ? i / (data.sessions.length - 1) * 620 : 310)},${220 - (point.value ?? 0) / Math.max(data.learners, 1) * 180}`).join(" ");
  const timeline = card("Attendance across recorded sessions", "Distinct cohort learners with a recorded signature per session, in date order. Only dates represented in learner signatures are plotted; unrecorded sessions are not invented.",
    data.sessions.length ? `<svg viewBox="0 0 740 280" role="img" aria-label="Session signatures over time"><path d="M60 40V220H700" fill="none" stroke="#ccd7ea"/><text x="10" y="45" font-size="12" fill="#5f6368">${data.learners}</text><text x="35" y="225" font-size="12" fill="#5f6368">0</text><polyline points="${timelinePoints}" fill="none" stroke="#479ef5" stroke-width="3"/>${data.sessions.map((point, i) => `<circle cx="${60 + (data.sessions.length > 1 ? i / (data.sessions.length - 1) * 620 : 310)}" cy="${220 - (point.value ?? 0) / Math.max(data.learners, 1) * 180}" r="4" fill="#479ef5"><title>${esc(point.label)}: ${point.value} signatures</title></circle>`).join("")}<text x="60" y="250" font-size="12" fill="#5f6368">${esc(data.sessions[0].label)}</text><text x="700" y="250" text-anchor="end" font-size="12" fill="#5f6368">${esc(data.sessions[data.sessions.length - 1].label)}</text></svg>${table(["Session", "Signed learners"], data.sessions.map(point => [point.label, String(point.value)]))}` : "<p>No session signatures recorded.</p>", true);
  const scatter = card("Attendance and completion", "Each point is one learner with recorded attendance. Both axes are percentages. This snapshot shows association, not causation or change over time.",
    data.scatter.length ? `<svg viewBox="0 0 740 300" role="img" aria-label="Attendance percentage compared with completion percentage"><path d="M60 30V240H700" stroke="#ccd7ea" fill="none"/>${[0,25,50,75,100].map(value => `<text x="${60 + value * 6.4}" y="260" text-anchor="middle" font-size="12" fill="#5f6368">${value}</text><text x="48" y="${244 - value * 2.1}" text-anchor="end" font-size="12" fill="#5f6368">${value}</text>`).join("")}<text x="380" y="288" text-anchor="middle" font-size="12" fill="#5f6368">Attendance (%)</text><text x="12" y="140" transform="rotate(-90 12 140)" text-anchor="middle" font-size="12" fill="#5f6368">Completion (%)</text>${data.scatter.map(point => `<circle cx="${60 + Math.min(100,Math.max(0,point.attendance)) * 6.4}" cy="${240 - Math.min(100,Math.max(0,point.completion)) * 2.1}" r="5" fill="#479ef5" fill-opacity=".65" stroke="#2b6fb4"><title>${esc(point.label)}: attendance ${point.attendance}%, completion ${point.completion}%</title></circle>`).join("")}</svg>${table(["Learner", "Attendance", "Completion"], data.scatter.map(point => [point.label, `${point.attendance}%`, `${point.completion}%`]))}` : "<p>No paired attendance and completion records available.</p>", true);
  return `<section class="report-section"><h2>Programme data analysis · Visual dashboard</h2><div class="analysis-kpis"><div class="analysis-kpi"><strong>${data.learners}</strong>Learners analysed</div><div class="analysis-kpi"><strong>${data.atRisk}</strong>Learners flagged at risk</div><div class="analysis-kpi"><strong>${data.status.length}</strong>Unit standards in scope</div></div><p class="small">Snapshot of recorded programme data. Learner-level measures cover the whole programme; unit and module charts follow the selected unit scope. Missing results are shown explicitly, not replaced with zero. Charts are calculated by the platform, independently of the AI narrative.</p><div class="analysis-grid">${bars}${status}${timeline}${scatter}</div></section>`;
}
