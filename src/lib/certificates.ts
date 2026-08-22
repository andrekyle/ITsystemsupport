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

/** Floating Print / Download toolbar injected into generated documents —
 *  nothing prints automatically; the reader chooses. Hidden on paper. */
export function docToolbar(filename: string): string {
  return `
  <style>
    .doc-toolbar { position: fixed; top: 12px; right: 12px; display: flex; gap: 8px; z-index: 999; font-family: "Segoe UI", system-ui, sans-serif; }
    .doc-toolbar button { display: inline-flex; align-items: center; gap: 7px; padding: 9px 15px; border: 1px solid #c9d4e4; border-radius: 8px; background: #ffffff; color: #1f2b3d; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 10px rgba(15, 35, 70, 0.14); }
    .doc-toolbar button:hover { background: #f0f5fb; }
    .doc-toolbar svg { flex: none; }
    @media print { .doc-toolbar { display: none !important; } }
  </style>
  <div class="doc-toolbar">
    <button type="button" onclick="window.print()" title="Print (or save as PDF)">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 8V3.5h11V8M6.5 17H4a1.5 1.5 0 0 1-1.5-1.5v-6A1.5 1.5 0 0 1 4 8h16a1.5 1.5 0 0 1 1.5 1.5v6A1.5 1.5 0 0 1 20 17h-2.5"/><rect x="6.5" y="13.5" width="11" height="7"/></svg>
      Print
    </button>
    <button type="button" onclick="__downloadDoc()" title="Download this document">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5v12M7 11l5 5 5-5M4 20.5h16"/></svg>
      Download
    </button>
  </div>
  <script>
    function __downloadDoc() {
      var clone = document.documentElement.cloneNode(true);
      var tb = clone.querySelector(".doc-toolbar");
      if (tb) tb.remove();
      var blob = new Blob(["<!doctype html>" + clone.outerHTML], { type: "text/html" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = ${JSON.stringify(filename)};
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  </script>`;
}

const BASE_STYLE = `
  * { box-sizing: border-box; }
  body { font: 14px/1.5 "Segoe UI", system-ui, sans-serif; color: #17233b; margin: 0; padding: 34px 44px; }
  h1 { font-size: 25px; margin: 0 0 2px; color: #0b3f8a; }
  .sub { color: #5a6b8c; margin: 0 0 16px; }
  table { border-collapse: collapse; width: 100%; margin: 10px 0; }
  th, td { border: 1px solid #e9eef7; padding: 6px 9px; text-align: left; font-size: 12.5px; }
  th { background: #f2f6fd; }
  .module-row td { background: #f2f6fd; font-weight: 600; }
  .c { text-align: center; white-space: nowrap; }
  .chip { display: inline-block; font-size: 11.5px; font-weight: 600; }
  .chip.ok { color: #157347; }
  .chip.nyc { color: #b02a37; }
  .chip.pend { color: #5a6b8c; }
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
        if (outcome?.status === "C") creditsAchieved += u.credits;
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
  <p class="small">* Complete: all learning activities finished; formal assessor outcome pending —
  credits accrue only once a registered assessor records Competent.
  Outcomes marked Competent / Not Yet Competent were recorded by a registered assessor in ITSS Learn.</p>
  <div class="sign">
    <div>Assessor signature &amp; date</div>
    <div>Moderator signature &amp; date</div>
  </div>
  ${docToolbar(`Statement-of-Results-${profile.name.replace(/[^\w]+/g, "-")}.html`)}
</body></html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

/** Stable certificate serial: derived from the profile id so reprints match. */
function certificateNo(profileId: string): string {
  let h = 0;
  for (let i = 0; i < profileId.length; i++) h = (h * 31 + profileId.charCodeAt(i)) >>> 0;
  return `ITSS-${COURSE_META.saqaId}-${h.toString(36).toUpperCase().padStart(7, "0").slice(0, 7)}`;
}

/** Points string for an SVG starburst polygon (alternating outer/inner radii). */
function starPoints(
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  spikes: number,
  phase = 0
): string {
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / spikes - Math.PI / 2 + phase;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}

/** Printable certificate of competence (formal SETA-style layout with
 *  rosette seal, serial number and NLRD/quality-assurance wording). */
export function openCertificate(profile: Profile, creditsEarned: number) {
  const issued = new Date().toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const idNumber = profile.enrolment?.idNumber?.trim();
  const certNo = certificateNo(profile.id);

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<title>Certificate — ${esc(profile.name)}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Georgia, "Times New Roman", serif; color: #1c2437; background: #eceff4; }
  .page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 26px; }
  .sheet {
    position: relative;
    width: 1020px;
    background: #fdfcf7;
    padding: 14px;
    box-shadow: 0 2px 18px rgba(15, 30, 70, 0.18);
  }
  /* layered formal frame */
  .frame {
    position: relative;
    overflow: hidden;
    border: 3px solid #123a75;
    outline: 1px solid #123a75;
    outline-offset: -9px;
    padding: 46px 64px 40px;
    background:
      radial-gradient(circle at 0 0, rgba(18, 58, 117, 0.05), transparent 32%),
      radial-gradient(circle at 100% 100%, rgba(18, 58, 117, 0.05), transparent 32%),
      #fdfcf7;
  }
  .frame::before, .frame::after {
    content: "";
    position: absolute;
    width: 74px; height: 74px;
    border: 3px solid #b98a2e;
    pointer-events: none;
  }
  .frame::before { top: 12px; left: 12px; border-right: none; border-bottom: none; }
  .frame::after { bottom: 12px; right: 12px; border-left: none; border-top: none; }

  .rep { text-align: center; font-size: 12px; letter-spacing: 4px; color: #4d5a75; text-transform: uppercase; }
  .provider { text-align: center; font-size: 15px; letter-spacing: 2.5px; color: #123a75; text-transform: uppercase; margin-top: 8px; font-weight: 700; }
  .accred { text-align: center; font-size: 11px; color: #6a7690; margin-top: 3px; }
  .rule { width: 200px; height: 1px; background: #b98a2e; margin: 18px auto; }
  h1 { text-align: center; font-size: 42px; font-weight: 400; letter-spacing: 1px; margin: 6px 0 0; color: #123a75; font-variant: small-caps; }
  .subtitle { text-align: center; font-size: 13px; color: #4d5a75; margin-top: 4px; letter-spacing: 1px; }

  .certify { text-align: center; font-size: 14.5px; color: #333c52; margin-top: 30px; }
  .name { text-align: center; font-size: 34px; margin: 10px auto 2px; padding: 0 40px 8px; border-bottom: 1px solid #1c2437; display: table; }
  .idline { text-align: center; font-size: 12.5px; color: #4d5a75; margin-top: 6px; }
  .body { text-align: center; font-size: 15px; line-height: 1.7; margin: 26px auto 0; max-width: 720px; }
  .body .qual { font-size: 19px; font-weight: 700; color: #123a75; }
  .detail-table { width: 640px; margin: 26px auto 0; border-collapse: collapse; font-size: 12.5px; }
  .detail-table td { border: 1px solid #cfd6e4; padding: 6px 12px; }
  .detail-table td:first-child { background: #f2f4f9; color: #4d5a75; width: 220px; }

  .footer { display: flex; align-items: flex-end; gap: 30px; margin-top: 46px; }
  .sign { flex: 1; text-align: center; font-size: 12px; color: #333c52; }
  .sign .line { border-top: 1px solid #1c2437; margin-bottom: 5px; padding-top: 5px; }
  .sign .role { font-size: 11px; color: #6a7690; letter-spacing: 0.6px; text-transform: uppercase; }

  /* rosette seal with ribbon */
  .seal { flex: 0 0 150px; width: 150px; height: 196px; }
  .seal svg { width: 100%; height: 100%; display: block; filter: drop-shadow(0 1px 4px rgba(0,0,0,0.25)); }

  .fineprint { margin-top: 30px; padding-top: 12px; border-top: 1px solid #d8dde8; font-size: 10.5px; color: #6a7690; line-height: 1.65; text-align: justify; }
  .serials { display: flex; justify-content: space-between; font-size: 11px; color: #4d5a75; margin-top: 10px; letter-spacing: 0.5px; }

  @media print {
    @page { size: A4 landscape; margin: 6mm; }
    body { background: #fff; }
    .page { min-height: auto; padding: 0; display: block; }
    .sheet { width: 100%; box-shadow: none; padding: 6px; }
    .frame { padding: 20px 40px 16px; }
    .frame::before, .frame::after { width: 48px; height: 48px; }
    .rule { margin: 9px auto; }
    h1 { font-size: 31px; }
    .subtitle { margin-top: 2px; }
    .certify { margin-top: 10px; font-size: 13.5px; }
    .name { font-size: 25px; padding-bottom: 5px; }
    .idline { margin-top: 4px; }
    .body { margin-top: 10px; font-size: 13px; line-height: 1.5; }
    .body .qual { font-size: 16.5px; }
    .detail-table { margin: 10px auto 0; font-size: 11px; }
    .detail-table td { padding: 3px 10px; }
    .footer { margin-top: 12px; gap: 22px; }
    .seal { flex: 0 0 96px; width: 96px; height: 126px; }
    .fineprint { margin-top: 10px; padding-top: 8px; font-size: 8.5px; line-height: 1.45; }
    .serials { margin-top: 5px; font-size: 9px; }
  }
</style></head>
<body>
  <div class="page"><div class="sheet"><div class="frame">

    <div class="rep">Republic of South Africa</div>
    <div class="provider">ITSS Learn · Investec Group</div>
    <div class="accred">Skills development provider delivering training quality assured by ${esc(COURSE_META.qualityAssurance)}</div>

    <div class="rule"></div>
    <h1>Certificate of Competence</h1>
    <div class="subtitle">awarded in recognition of the achievement of a registered national qualification</div>

    <p class="certify">This is to certify that</p>
    <div class="name">${esc(profile.name)}</div>
    ${idNumber ? `<div class="idline">Identity number: ${esc(idNumber)}</div>` : ""}

    <p class="body">
      having been assessed and found <strong>competent</strong> against all required unit standards,
      has satisfied the requirements of the<br/>
      <span class="qual">${esc(COURSE_META.title)}</span>
    </p>

    <table class="detail-table">
      <tr><td>SAQA qualification ID</td><td>${esc(COURSE_META.saqaId)}</td></tr>
      <tr><td>NQF level</td><td>Level ${COURSE_META.nqfLevel}</td></tr>
      <tr><td>Credits achieved</td><td>${creditsEarned} of ${COURSE_META.credits}</td></tr>
      <tr><td>Quality assurance</td><td>${esc(COURSE_META.qualityAssurance)}</td></tr>
      <tr><td>Date of issue</td><td>${esc(issued)}</td></tr>
    </table>

    <div class="footer">
      <div class="sign"><div class="line">&nbsp;</div>Facilitator<div class="role">Training Provider</div></div>
      <div class="sign"><div class="line">&nbsp;</div>Registered Assessor<div class="role">Assessment</div></div>
      <div class="seal">
        <svg viewBox="0 0 200 262" role="img" aria-label="ITSS gold seal">
          <defs>
            <linearGradient id="faceGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#f6e2a0"/>
              <stop offset="45%" stop-color="#ddb659"/>
              <stop offset="72%" stop-color="#c2952f"/>
              <stop offset="100%" stop-color="#a97f1f"/>
            </linearGradient>
            <radialGradient id="burstGold" cx="38%" cy="32%" r="80%">
              <stop offset="0%" stop-color="#efd287"/>
              <stop offset="60%" stop-color="#cda23c"/>
              <stop offset="100%" stop-color="#9a761e"/>
            </radialGradient>
          </defs>

          <!-- red ribbon with forked tail -->
          <path d="M 64,120 L 64,254 L 100,226 L 136,254 L 136,120 Z" fill="#d6252c"/>
          <path d="M 64,120 L 68,120 L 68,251 L 64,254 Z" fill="#a3181e"/>
          <path d="M 136,120 L 132,120 L 132,251 L 136,254 Z" fill="#a3181e"/>
          <line x1="70.5" y1="140" x2="70.5" y2="249" stroke="#e7bd58" stroke-width="1.6"/>
          <line x1="129.5" y1="140" x2="129.5" y2="249" stroke="#e7bd58" stroke-width="1.6"/>

          <!-- starburst rosette (back layer peeks between front spikes) -->
          <polygon points="${starPoints(100, 102, 98, 80, 24, Math.PI / 24)}" fill="#b8912c"/>
          <polygon points="${starPoints(100, 102, 93, 78, 24)}" fill="url(#burstGold)" stroke="#8a6a19" stroke-width="0.6"/>

          <!-- polished face -->
          <circle cx="100" cy="102" r="70" fill="url(#faceGold)" stroke="#8a6a19" stroke-width="1.4"/>
          <ellipse cx="76" cy="78" rx="50" ry="32" fill="rgba(255,250,225,0.30)" transform="rotate(-28 76 78)"/>

          <!-- milled dot ring + engraved tick ring -->
          <circle cx="100" cy="102" r="64" fill="none" stroke="#7a5c10" stroke-width="2"
                  stroke-linecap="round" stroke-dasharray="0.1 5.2" opacity="0.75"/>
          <circle cx="100" cy="102" r="57" fill="none" stroke="rgba(122,92,16,0.4)" stroke-width="6"
                  stroke-dasharray="1 2.6"/>
          <circle cx="100" cy="102" r="52.5" fill="none" stroke="rgba(122,92,16,0.5)" stroke-width="0.8"/>

          <!-- minimum wording -->
          <text x="100" y="104" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif"
                font-size="24" letter-spacing="5" font-weight="bold" fill="#6d500c">ITSS</text>
          <text x="100" y="124" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif"
                font-size="11" letter-spacing="4" fill="#7a5c10">SAQA</text>
        </svg>
      </div>
      <div class="sign"><div class="line">&nbsp;</div>Registered Moderator<div class="role">Moderation</div></div>
      <div class="sign"><div class="line">&nbsp;</div>Programme Manager<div class="role">Provider Authority</div></div>
    </div>

    <div class="fineprint">
      This certificate records the achievement of the above learner on the training provider's learning
      management system and is issued pending verification of the learner's Portfolio of Evidence.
      The formal certificate for the qualification is issued by the relevant SETA following external
      moderation and upload of results to the National Learners' Records Database (NLRD).
      Authenticity of this document may be confirmed with the training provider by quoting the
      certificate number below. This certificate is invalid if altered in any way.
    </div>
    <div class="serials">
      <span>Certificate no: ${esc(certNo)}</span>
      <span>Learner record: ${esc(profile.id)}</span>
      <span>Issued: ${esc(issued)}</span>
    </div>
  </div></div></div>
  ${docToolbar(`Certificate-${profile.name.replace(/[^\w]+/g, "-")}.html`)}
</body></html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}