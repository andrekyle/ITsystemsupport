import type { Profile } from "../types";
import {
  COURSE_META,
  MODULES,
  POE_SECTIONS,
  PROGRAMME_MILESTONES,
  TOTAL_UNITS,
} from "../data/course";

/**
 * Onboarding pack generator: builds a complete, printable welcome document
 * for a learner (programme overview, training calendar, required documents,
 * POE guide, LMS how-to and support contacts). Opens in a new window ready
 * to print or save as PDF — no server needed.
 */

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export interface OnboardingContacts {
  supportEmail?: string;
  teamsUrl?: string;
}

export function onboardingPackHtml(profile: Profile, contacts: OnboardingContacts = {}): string {
  const e = profile.enrolment;
  const today = new Date().toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const moduleRows = MODULES.map(
    (m, i) => `
      <tr class="module-row"><td colspan="4"><strong>Module ${i + 1}: ${esc(m.name)}</strong></td></tr>
      ${m.units
        .map(
          (u) => `
        <tr>
          <td>US ${esc(u.us)}</td>
          <td>${esc(u.title)}</td>
          <td class="c">NQF ${u.nqf} · ${u.credits} cr</td>
          <td>${esc(u.dates)} · ${esc(u.time)}</td>
        </tr>`
        )
        .join("")}`
  ).join("");

  const milestoneRows = PROGRAMME_MILESTONES.map(
    (m) => `<tr><td><strong>${esc(m.name)}</strong></td><td>${esc(m.dates)}</td><td>${esc(m.time)}</td></tr>`
  ).join("");

  const poeRows = POE_SECTIONS.map(
    (s) => `
      <tr class="module-row"><td colspan="2"><strong>${esc(s.heading)}</strong></td></tr>
      ${s.items.map((it) => `<tr><td class="tick">☐</td><td>${esc(it.label)}</td></tr>`).join("")}`
  ).join("");

  const detailRow = (label: string, value?: string) =>
    value ? `<tr><th>${esc(label)}</th><td>${esc(value)}</td></tr>` : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Onboarding Pack — ${esc(profile.name)}</title>
<style>
  * { box-sizing: border-box; }
  body { font: 14px/1.55 "Segoe UI", system-ui, sans-serif; color: #17233b; margin: 0; padding: 34px 44px; }
  h1 { font-size: 27px; margin: 0 0 2px; color: #0b3f8a; }
  h2 { font-size: 18px; margin: 30px 0 8px; color: #0b3f8a; border-bottom: 2px solid #dbe6f7; padding-bottom: 5px; }
  .sub { color: #5a6b8c; margin: 0 0 18px; }
  .banner { background: #eef4ff; border: 1px solid #c9dbf7; border-radius: 10px; padding: 14px 18px; margin: 18px 0; }
  table { border-collapse: collapse; width: 100%; margin: 8px 0 4px; }
  th, td { border: 1px solid #ccd7ea; padding: 6px 9px; text-align: left; vertical-align: top; font-size: 12.5px; }
  th { background: #f2f6fd; width: 200px; }
  .c { white-space: nowrap; }
  .tick { width: 26px; text-align: center; font-size: 15px; }
  .module-row td { background: #f2f6fd; }
  ol li, ul li { margin: 4px 0; }
  .sign { display: flex; gap: 60px; margin-top: 36px; }
  .sign div { flex: 1; border-top: 1.5px solid #17233b; padding-top: 5px; font-size: 12.5px; color: #444; }
  .small { color: #5a6b8c; font-size: 12px; }
  @media print { body { padding: 10mm 12mm; } h2 { break-after: avoid; } tr { break-inside: avoid; } }
</style>
</head>
<body>
  <h1>Welcome to ${esc(COURSE_META.title)}</h1>
  <p class="sub">Learner Onboarding Pack · SAQA ID ${esc(COURSE_META.saqaId)} · NQF Level ${COURSE_META.nqfLevel} · ${COURSE_META.credits} Credits · Quality assured by ${esc(COURSE_META.qualityAssurance)}</p>

  <div class="banner">
    <strong>Dear ${esc(e?.firstNames || profile.name)},</strong><br/>
    Welcome to the System Support learnership. This pack tells you everything you need for a strong start:
    your programme calendar, the documents you must supply, how your Portfolio of Evidence works, and where
    to get help. Keep it with your learner file. <span class="small">Issued ${esc(today)}.</span>
  </div>

  <h2>1 · Your details on record</h2>
  <table>
    ${detailRow("Full name", profile.name)}
    ${detailRow("ID number", e?.idNumber)}
    ${detailRow("Email", e?.email)}
    ${detailRow("Cellphone", e?.cellphone)}
    ${detailRow("Employer", e?.employer)}
    ${detailRow("Highest qualification", e?.highestQualification)}
    ${detailRow("Enrolment signed", e?.signedDate ? new Date(e.signedDate).toLocaleDateString() : undefined)}
  </table>
  <p class="small">Anything wrong or missing? Update it under <em>Profile → Enrolment information</em> in ITSS Learn, or tell your facilitator.</p>

  <h2>2 · Programme &amp; training calendar</h2>
  <p>${TOTAL_UNITS} unit standards across ${MODULES.length} modules. Sessions run ${esc(COURSE_META.time)}.</p>
  <table>
    <tr><th style="width:auto">Unit standard</th><th style="width:auto">Title</th><th style="width:auto">Level · Credits</th><th style="width:auto">Session dates</th></tr>
    ${moduleRows}
  </table>

  <h2>3 · Key programme milestones</h2>
  <table>
    <tr><th style="width:auto">Milestone</th><th style="width:auto">Dates</th><th style="width:auto">Time</th></tr>
    ${milestoneRows}
  </table>

  <h2>4 · Documents you must supply (Appendix C)</h2>
  <ul>
    <li>Certified copy of your ID</li>
    <li>Certified copy of Matric / Senior Certificate (and any other certificates)</li>
    <li>Curriculum vitae (CV)</li>
    <li>Signed learnership agreement</li>
  </ul>
  <p class="small">Tick these off in ITSS Learn under <em>Appendix C Checklist</em> as you hand them in.</p>

  <h2>5 · Your Portfolio of Evidence (POE)</h2>
  <p>Your POE is the file of proof that you are competent. Upload every item below in ITSS Learn under
  <em>Portfolio of Evidence</em> — your assessor reviews each one and marks it Competent or Not Yet Competent.</p>
  <table>${poeRows}</table>

  <h2>6 · How to use ITSS Learn</h2>
  <ol>
    <li><strong>Sign in</strong> with your name${e?.email ? ` (${esc(e.email)})` : ""} — set a password to protect your profile.</li>
    <li><strong>Work through each unit standard</strong>: lesson → exercises (auto-marked, best of 3 attempts) → quiz (80%+ = competent).</li>
    <li><strong>Sign the attendance register</strong> every session day — it feeds your participation record.</li>
    <li><strong>Upload POE evidence</strong> as you produce it; watch for your assessor's review outcome.</li>
    <li><strong>Track yourself</strong> on the Dashboard: completion, credits, XP and badges.</li>
    <li><strong>Ask for help</strong> on the Community page — your facilitator answers questions there.</li>
  </ol>

  <h2>7 · Support</h2>
  <ul>
    ${contacts.supportEmail ? `<li>Email support: <strong>${esc(contacts.supportEmail)}</strong></li>` : ""}
    ${contacts.teamsUrl ? `<li>Microsoft Teams: <strong>${esc(contacts.teamsUrl)}</strong></li>` : ""}
    <li>Your facilitator — in class or via the Community page in ITSS Learn.</li>
    <li>Assessment appeals follow the institutional appeals process (see Assessments page).</li>
  </ul>

  <div class="sign">
    <div>Learner signature &amp; date</div>
    <div>Facilitator signature &amp; date</div>
  </div>

  <script>window.addEventListener('load', function () { setTimeout(function () { window.print(); }, 250); });</script>
</body>
</html>`;
}

/** Open the onboarding pack in a new window, ready to print / save as PDF. */
export function openOnboardingPack(profile: Profile, contacts: OnboardingContacts = {}) {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(onboardingPackHtml(profile, contacts));
  win.document.close();
}
