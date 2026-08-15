import type { Profile, ProgressState } from "../types";
import type { OutcomeMap } from "../store";
import { COURSE_META, MODULES } from "../data/course";
import { unitCompletion } from "../store";

/**
 * Certification documents: statement of results and certificate of
 * completion, generated as printable HTML (print → save as PDF).
 */

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const BASE_STYLE = `
  * { box-sizing: border-box; }
  body { font: 14px/1.5 "Segoe UI", system-ui, sans-serif; color: #17233b; margin: 0; padding: 34px 44px; }
  h1 { font-size: 25px; margin: 0 0 2px; color: #0b3f8a; }
  .sub { color: #5a6b8c; margin: 0 0 16px; }
  table { border-collapse: collapse; width: 100%; margin: 10px 0; }
  th, td { border: 1px solid #ccd7ea; padding: 6px 9px; text-align: left; font-size: 12.5px; }
  th { background: #f2f6fd; }
  .module-row td { background: #f2f6fd; font-weight: 600; }
  .c { text-align: center; white-space: nowrap; }
  .chip { display: inline-block; border-radius: 20px; padding: 1px 10px; font-size: 11.5px; font-weight: 600; }
  .chip.ok { background: #e3f5e9; color: #157347; }
  .chip.nyc { background: #fdeaea; color: #b02a37; }
  .chip.pend { background: #eef1f6; color: #5a6b8c; }
  .sign { display: flex; gap: 60px; margin-top: 42px; }
  .sign div { flex: 1; border-top: 1.5px solid #17233b; padding-top: 5px; font-size: 12.5px; color: #444; }
  .small { color: #5a6b8c; font-size: 12px; }
  @media print { body { padding: 10mm 12mm; } tr { break-inside: avoid; } }
`;

function bestQuizPct(progress: ProgressState, us: string): string {
  const p = progress.units[us];
  if (!p) return "—";
  const results = [...(p.quiz ? [p.quiz] : []), ...Object.values(p.quizzes ?? {})];
  if (!results.length) return "—";
  let best = 0;
  for (const r of results) if (r.total) best = Math.max(best, r.best / r.total);
  return `${Math.round(best * 100)}%`;
}

function exerciseSummary(progress: ProgressState, us: string): string {
  const ex = progress.units[us]?.exercises ?? {};
  const entries = Object.values(ex).filter((r) => r.total > 0);
  if (!entries.length) return "—";
  const marks = entries.reduce((n, r) => n + r.best, 0);
  const total = entries.reduce((n, r) => n + r.total, 0);
  return `${marks}/${total}`;
}

/** Printable statement of results for a learner. */
export function openStatementOfResults(
  profile: Profile,
  progress: ProgressState,
  outcomes: OutcomeMap
) {
  const learnerOutcomes = outcomes[profile.id] ?? {};
  let creditsAchieved = 0;

  const rows = MODULES.map((m, i) => {
    const unitRows = m.units
      .map((u) => {
        const outcome = learnerOutcomes[u.us];
        const complete = unitCompletion(progress, u.us) === 1;
        const status = outcome
          ? outcome.status
          : complete
            ? "C*"
            : "";
        if (outcome?.status === "C" || (!outcome && complete)) creditsAchieved += u.credits;
        const chip =
          status === "C" || status === "C*"
            ? `<span class="chip ok">${status === "C" ? "Competent" : "Complete*"}</span>`
            : status === "NYC"
              ? `<span class="chip nyc">Not Yet Competent</span>`
              : `<span class="chip pend">In progress</span>`;
        return `<tr>
          <td>US ${esc(u.us)}</td>
          <td>${esc(u.title)}</td>
          <td class="c">NQF ${u.nqf}</td>
          <td class="c">${u.credits}</td>
          <td class="c">${bestQuizPct(progress, u.us)}</td>
          <td class="c">${exerciseSummary(progress, u.us)}</td>
          <td class="c">${chip}${outcome ? `<div class="small">${esc(outcome.by)} · ${new Date(outcome.at).toLocaleDateString()}</div>` : ""}</td>
        </tr>`;
      })
      .join("");
    return `<tr class="module-row"><td colspan="7">Module ${i + 1}: ${esc(m.name)}</td></tr>${unitRows}`;
  }).join("");

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<title>Statement of Results — ${esc(profile.name)}</title>
<style>${BASE_STYLE}</style></head>
<body>
  <h1>Statement of Results</h1>
  <p class="sub">${esc(COURSE_META.title)} · SAQA ID ${esc(COURSE_META.saqaId)} · NQF Level ${COURSE_META.nqfLevel} · Quality assured by ${esc(COURSE_META.qualityAssurance)}</p>
  <table>
    <tr><th style="width:190px">Learner</th><td>${esc(profile.name)}</td></tr>
    ${profile.enrolment?.idNumber ? `<tr><th>ID number</th><td>${esc(profile.enrolment.idNumber)}</td></tr>` : ""}
    <tr><th>Credits achieved</th><td><strong>${creditsAchieved}</strong> of ${COURSE_META.credits}</td></tr>
    <tr><th>Issued</th><td>${new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}</td></tr>
  </table>
  <table>
    <tr><th>Unit standard</th><th>Title</th><th class="c">Level</th><th class="c">Credits</th><th class="c">Best quiz</th><th class="c">Exercises</th><th class="c">Outcome</th></tr>
    ${rows}
  </table>
  <p class="small">* Complete: all learning activities finished; formal assessor outcome pending.
  Outcomes marked Competent / Not Yet Competent were recorded by a registered assessor in ITSS Learn.</p>
  <div class="sign">
    <div>Assessor signature &amp; date</div>
    <div>Moderator signature &amp; date</div>
  </div>
  <script>window.addEventListener('load', function () { setTimeout(function () { window.print(); }, 250); });</script>
</body></html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

/** Printable certificate of completion (all units competent/complete). */
export function openCertificate(profile: Profile, creditsEarned: number) {
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<title>Certificate — ${esc(profile.name)}</title>
<style>
  body { margin: 0; font-family: Georgia, "Times New Roman", serif; color: #17233b; }
  .page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 30px; }
  .cert { border: 10px double #0b3f8a; border-radius: 6px; padding: 60px 70px; text-align: center; max-width: 820px; }
  .brand { letter-spacing: 5px; font-size: 13px; color: #0b3f8a; text-transform: uppercase; }
  h1 { font-size: 40px; margin: 16px 0 4px; color: #0b3f8a; }
  .name { font-size: 32px; margin: 26px 0 6px; border-bottom: 1.5px solid #17233b; display: inline-block; padding: 0 34px 6px; }
  p { font-size: 15px; line-height: 1.6; }
  .meta { color: #5a6b8c; font-size: 13px; margin-top: 26px; }
  .sign { display: flex; gap: 80px; margin-top: 52px; }
  .sign div { flex: 1; border-top: 1.5px solid #17233b; padding-top: 6px; font-size: 12.5px; }
  @media print { .page { min-height: auto; } }
</style></head>
<body>
  <div class="page"><div class="cert">
    <div class="brand">ITSS Learn · Investec Group</div>
    <h1>Certificate of Completion</h1>
    <p>This certifies that</p>
    <div class="name">${esc(profile.name)}</div>
    <p>has successfully completed all learning activities of the<br/>
    <strong>${esc(COURSE_META.title)}</strong><br/>
    SAQA ID ${esc(COURSE_META.saqaId)} · NQF Level ${COURSE_META.nqfLevel} · ${creditsEarned} credits achieved</p>
    <p class="meta">Quality assured by ${esc(COURSE_META.qualityAssurance)} ·
    Issued ${new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}<br/>
    Formal certification is issued by the SETA on verification of the Portfolio of Evidence.</p>
    <div class="sign"><div>Facilitator</div><div>Assessor</div><div>Moderator</div></div>
  </div></div>
  <script>window.addEventListener('load', function () { setTimeout(function () { window.print(); }, 250); });</script>
</body></html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}
