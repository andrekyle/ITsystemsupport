// Regenerates US8252-Writing-Business-Reports.pptx in the Investec / Microsoft Learn
// house style used by the other decks — with large, readable fonts and the full text.
// Run: node scripts/make-writing-ppt.mjs
import pptxgen from "pptxgenjs";

const BLUE = "0F6CBD";
const NAVY = "002050";
const LIGHT = "EAF4FF";
const GREY = "6B7280";
const WHITE = "FFFFFF";
const BORDER = "D5E3F2";
const DARK_LABEL = "8CC2F0";
const DARK_SUB = "B9D6F2";
const DARK_MUTED = "6E93BC";
const DARK_LINE = "1B4272";

const TITLE_FONT = "Aptos Display";
const BODY_FONT = "Aptos";

const W = 13.33;
const H = 7.5;
const MX = 0.55;
const CW = W - MX * 2;

const SHADOW = { type: "outer", angle: 90, blur: 7, offset: 2, color: "9AB4CC", opacity: 0.3 };

const ICONS = {
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="0.8"/>',
  check: '<circle cx="12" cy="12" r="8.5"/><path d="m8.3 12.4 2.5 2.5 4.9-5.3"/>',
  document: '<path d="M6.5 3.5h7.2l4.8 4.8V19a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 19z"/><path d="M13.5 3.5v5h5M9.5 12.5h5M9.5 15.5h5"/>',
  people: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5"/><circle cx="16.8" cy="9.2" r="2.4"/><path d="M16.3 14.7c2.2.2 3.8 1.5 4.3 4.3"/>',
  shield: '<path d="M12 3l7 2.8v5.4c0 4.5-3 7.9-7 9.8-4-1.9-7-5.3-7-9.8V5.8z"/><path d="m9.2 11.8 2 2 3.6-4"/>',
  pen: '<path d="M4 20l1-4L16.5 4.5a2.12 2.12 0 0 1 3 3L8 19l-4 1z"/><path d="m14.5 6.5 3 3"/>',
  database: '<ellipse cx="12" cy="5.5" rx="7" ry="2.5"/><path d="M5 5.5v13c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-13"/><path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5"/>',
  briefcase: '<rect x="3.5" y="7" width="17" height="13" rx="1.8"/><path d="M9 7V5.6A1.6 1.6 0 0 1 10.6 4h2.8A1.6 1.6 0 0 1 15 5.6V7M3.5 12h17"/>',
  book: '<path d="M4 19.5v-14A2.5 2.5 0 0 1 6.5 3H20v18H6.5a2.5 2.5 0 0 1-2.5-2.5zm0 0A2.5 2.5 0 0 1 6.5 17H20"/>',
};

function iconUri(name, color = "#" + BLUE, sw = 1.4) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
  return "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
}
function addIcon(s, name, x, y, size = 0.32, color) {
  s.addImage({ data: iconUri(name, color), x, y, w: size, h: size });
}

const pptx = new pptxgen();
pptx.defineLayout({ name: "WIDE", width: W, height: H });
pptx.layout = "WIDE";
pptx.author = "Andre Snell";
pptx.company = "Investec — Corporate Banking Technology";
pptx.title = "US 8252 — Writing Business Reports";

let pageNo = 0;
function slide() {
  const s = pptx.addSlide();
  s.background = { color: WHITE };
  pageNo += 1;
  if (pageNo > 1) {
    s.addText("Unit Standard 8252 — Writing Business Reports   ·   Investec IT Systems Support NQF 5", {
      x: MX, y: H - 0.42, w: CW - 1, h: 0.3, fontFace: BODY_FONT, fontSize: 10, color: GREY,
    });
    s.addText(String(pageNo), {
      x: W - MX - 0.6, y: H - 0.42, w: 0.6, h: 0.3, fontFace: BODY_FONT, fontSize: 10, color: GREY, align: "right",
    });
    s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.09, fill: { color: BLUE } });
  }
  return s;
}

function eyebrowTitle(s, eyebrow, title) {
  s.addText(eyebrow.toUpperCase(), {
    x: MX, y: 0.3, w: CW, h: 0.36, fontFace: BODY_FONT, fontSize: 13, bold: true, color: BLUE, charSpacing: 2,
  });
  s.addText(title, {
    x: MX, y: 0.66, w: CW, h: 0.82, fontFace: TITLE_FONT, fontSize: 31, bold: true, color: NAVY,
  });
}

function card(s, x, y, w, h, { fill = WHITE, line = BORDER } = {}) {
  s.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.09, fill: { color: fill }, line: { color: line, width: 1 }, shadow: SHADOW,
  });
}

/** Large-type paragraphs. paras = string[] */
function bigParas(s, paras, { y = 1.7, h = H - 2.35, fontSize = 16 } = {}) {
  s.addText(
    paras.map((p, i) => ({
      text: p + (i < paras.length - 1 ? "\n" : ""),
      options: { fontSize, color: NAVY, breakLine: true, paraSpaceAfter: 12 },
    })),
    { x: MX, y, w: CW, h, fontFace: BODY_FONT, valign: "top", lineSpacingMultiple: 1.12 }
  );
}

/** Large-type bullet list */
function bigBullets(s, items, { y = 1.75, h = H - 2.4, fontSize = 17, intro } = {}) {
  const runs = [];
  if (intro) runs.push({ text: intro + "\n", options: { fontSize, color: NAVY, paraSpaceAfter: 12 } });
  items.forEach((t) =>
    runs.push({
      text: t,
      options: { fontSize, color: NAVY, bullet: { code: "2022", indent: 18 }, paraSpaceAfter: 10, breakLine: true },
    })
  );
  s.addText(runs, { x: MX, y, w: CW, h, fontFace: BODY_FONT, valign: "top", lineSpacingMultiple: 1.1 });
}

/** Stacked labelled cards: items = [{t, d}] */
function stackCards(s, items, { y = 1.75, h = H - 2.45, fontSize = 14.5 } = {}) {
  const gap = 0.22;
  const ch = (h - gap * (items.length - 1)) / items.length;
  items.forEach((it, i) => {
    const cy = y + i * (ch + gap);
    card(s, MX, cy, CW, ch, { fill: i % 2 ? LIGHT : WHITE });
    s.addShape(pptx.ShapeType.rect, { x: MX, y: cy, w: 0.09, h: ch, fill: { color: BLUE } });
    s.addText([
      { text: it.t + "\n", options: { bold: true, color: NAVY, fontSize: fontSize + 3.5, fontFace: TITLE_FONT } },
      { text: it.d, options: { color: NAVY, fontSize, fontFace: BODY_FONT } },
    ], { x: MX + 0.32, y: cy + 0.12, w: CW - 0.6, h: ch - 0.24, valign: "middle", lineSpacingMultiple: 1.08 });
  });
}

function dataTable(s, header, rows, { y = 1.75, colW, fontSize = 14, rowH = 0.5 } = {}) {
  const tableRows = [
    header.map((t) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: BLUE }, fontFace: TITLE_FONT, fontSize } })),
    ...rows.map((r, i) =>
      r.map((c) => ({ text: c, options: { color: NAVY, fill: { color: i % 2 ? LIGHT : WHITE }, fontFace: BODY_FONT, fontSize } }))
    ),
  ];
  s.addTable(tableRows, { x: MX, y, w: CW, colW, border: { type: "solid", color: BORDER, pt: 0.75 }, rowH, valign: "middle", margin: 0.1 });
}

/* ============================================================ 1 · COVER */
{
  const s = slide();
  s.background = { color: NAVY };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.12, fill: { color: BLUE } });
  s.addShape(pptx.ShapeType.roundRect, { x: MX, y: 1.3, w: 3.6, h: 0.56, rectRadius: 0.28, fill: { color: BLUE } });
  s.addText("UNIT STANDARD 8252 · NQF 5 · 6 CREDITS", {
    x: MX, y: 1.3, w: 3.6, h: 0.56, fontFace: BODY_FONT, fontSize: 12.5, bold: true, color: WHITE, align: "center", valign: "middle", charSpacing: 1,
  });
  s.addText("Writing Business Reports", { x: MX, y: 2.1, w: CW, h: 1.5, fontFace: TITLE_FONT, fontSize: 52, bold: true, color: WHITE });
  s.addText("Writing business reports in Retail/Wholesale practices", {
    x: MX, y: 3.55, w: 10.5, h: 0.55, fontFace: BODY_FONT, fontSize: 21, color: DARK_SUB,
  });
  s.addText("Official learner guide — Investec Systems Support (NQF Level 5) Learnership", {
    x: MX, y: 4.15, w: 10.5, h: 0.5, fontFace: BODY_FONT, fontSize: 16, color: DARK_LABEL,
  });
  addIcon(s, "document", 10.75, 1.45, 1.9, "#" + DARK_LINE);
  s.addShape(pptx.ShapeType.line, { x: MX, y: 5.15, w: CW, h: 0, line: { color: DARK_LINE, width: 1 } });
  s.addText("Investec · Corporate Banking Technology · IT Systems Support NQF Level 5 (SAQA ID 48573)", {
    x: MX, y: H - 0.6, w: CW, h: 0.35, fontFace: BODY_FONT, fontSize: 11.5, color: DARK_MUTED,
  });
}

/* ============================================================ 2 · COMPETENCE REQUIREMENTS */
{
  const s = slide();
  eyebrowTitle(s, "Learner guide contents", "Competence Requirements");
  dataTable(s, ["Section", "What it covers", "Page"], [
    ["Alignment index", "The different outcomes you must prove competent in to complete US 8252", "3"],
    ["Purpose & content of reports", "The various types of reports, their purposes and the range of information in them", "4"],
    ["Obtaining & distributing information", "The resources used to obtain information and the methods for distributing reports", "8"],
    ["Verifying reported information", "How report information is checked against requirements and approved for distribution", "9"],
    ["Question Session 1", "Your knowledge of this section is assessed with the questions", "10"],
    ["Self-assessment", "Check the progress you have made and arrange support to become competent", "12"],
  ], { y: 1.85, colW: [3.6, 7.6, 1.03], fontSize: 15, rowH: 0.72 });
}

/* ============================================================ 3 · ALIGNMENT INDEX */
{
  const s = slide();
  eyebrowTitle(s, "Specific outcomes and related assessment criteria", "Alignment Index — Specific Outcomes");
  card(s, MX, 1.8, CW, 0.72, { fill: LIGHT });
  s.addText([
    { text: "SO 1   ", options: { bold: true, color: BLUE, fontSize: 16, fontFace: TITLE_FONT } },
    { text: "The demonstrated ability to make decisions and consider options when:", options: { color: NAVY, fontSize: 16 } },
  ], { x: MX + 0.25, y: 1.8, w: CW - 0.5, h: 0.72, fontFace: BODY_FONT, valign: "middle" });
  bigBullets(s, [
    "Relating the purpose and content of a range of reports to the information needs of business",
    "Recognising appropriate information resources and organisational procedures for obtaining and distributing confidential information",
    "Applying a range of techniques for compiling reports, ensuring content and format are appropriate to information requirements and that reporting deadlines are met",
    "Liaising with relevant parties and verifying reported information is in accordance with requirements, compiling and distributing additional commentary/information where required",
  ], { y: 2.75, h: 3.35, fontSize: 15.5 });
  s.addShape(pptx.ShapeType.roundRect, { x: MX, y: 6.25, w: 2.2, h: 0.52, rectRadius: 0.26, fill: { color: NAVY } });
  s.addText("AC 1 — as for SO 1", { x: MX, y: 6.25, w: 2.2, h: 0.52, fontFace: BODY_FONT, fontSize: 12.5, bold: true, color: WHITE, align: "center", valign: "middle" });
}

/* ============================================================ 4 · CCFO */
{
  const s = slide();
  eyebrowTitle(s, "Critical cross-field outcomes", "Critical Cross-Field Outcomes");
  const items = [
    ["CCFO — Working", "Demonstrate an understanding of the world as a set of related systems where follow-up actions are vital to ensuring that confidential information is received and verified by authorised recipients."],
    ["CCFO — Organising", "Organise oneself and one's activities when compiling reports so that sufficient time is set aside to check comprehensiveness and accuracy of information reported."],
    ["CCFO — Collecting", "Collect, organise, analyse and critically evaluate information when compiling reports so that information reflected is appropriate to business needs."],
    ["CCFO — Communicating", "Communicate effectively when compiling written reports by applying a style and format that facilitates clear interpretation of facts presented on the part of the recipient."],
  ];
  const cw = (CW - 0.3) / 2;
  const chh = 2.35;
  items.forEach(([t, d], i) => {
    const cx = MX + (i % 2) * (cw + 0.3);
    const cy = 1.8 + Math.floor(i / 2) * (chh + 0.25);
    card(s, cx, cy, cw, chh, { fill: i % 3 ? WHITE : LIGHT });
    s.addShape(pptx.ShapeType.rect, { x: cx, y: cy, w: 0.09, h: chh, fill: { color: BLUE } });
    s.addText([
      { text: t + "\n", options: { bold: true, color: NAVY, fontSize: 18, fontFace: TITLE_FONT } },
      { text: d, options: { color: NAVY, fontSize: 14.5, fontFace: BODY_FONT } },
    ], { x: cx + 0.3, y: cy + 0.15, w: cw - 0.55, h: chh - 0.3, valign: "top", lineSpacingMultiple: 1.1 });
  });
}

/* ============================================================ 5 · INTRODUCTION */
{
  const s = slide();
  eyebrowTitle(s, "Purpose & content of reports", "Introduction");
  bigParas(s, [
    "Because we are dealing with business communication, this section is based on business communication, but the remainder of the types of reports do not differ much from this type of report. By practising how to write an internal report on a business related matter, we will prepare you to learn the basics of report writing so that you may develop to writing more advanced and specific reports as you move up in your career.",
    "There are a few general rules about report writing. A report should be a formal document and should be in the past tense as far as possible, as well as avoiding the use of first or second person pronouns. There should be a simple numbering system with clear headings.",
    "Before we start writing reports in business, we need to understand what the purpose of the report is — i.e. the outcome, or required outcome thereof — as well as the manner (style) in which the report must be written. Writing a report in a style which is not suited to its audience or readers will not be professional. Therefore we must understand what we need to put into the report and phrase it appropriately so that the readers understand the information being given to them.",
  ], { y: 1.8, fontSize: 15.5 });
}

/* ============================================================ 6 · STYLE */
{
  const s = slide();
  eyebrowTitle(s, "How to write a report", "How to Write a Report — Style");
  bigBullets(s, [
    "Read it without unnecessary delay",
    "Understand everything in it without undue effort",
    "Accept the facts, findings, conclusions and recommendations",
    "Decide to take the action recommended",
  ], {
    y: 1.8,
    h: 3.3,
    fontSize: 17,
    intro: "To be completely successful, a report which makes recommendations must ensure that the persons for whom the report is intended:",
  });
  card(s, MX, 5.15, CW, 1.5, { fill: LIGHT });
  addIcon(s, "pen", MX + 0.25, 5.4, 0.36);
  s.addText(
    "Achieving this demands more of you than merely presenting relevant facts accurately. It also demands that you communicate in a way that is both acceptable and intelligible to the readers.",
    { x: MX + 0.75, y: 5.3, w: CW - 1.05, h: 1.2, fontFace: BODY_FONT, fontSize: 15.5, color: NAVY, valign: "middle", lineSpacingMultiple: 1.1 }
  );
}

/* ============================================================ 7 · QUALITIES 1 */
{
  const s = slide();
  eyebrowTitle(s, "Qualities of good report writing · 1 of 2", "The Qualities of Good Report Writing");
  stackCards(s, [
    { t: "Selectivity", d: "Careful choice of words can enable you to convey many subtleties of meaning." },
    { t: "Accuracy", d: "Check that everything you write is factually accurate and capable of being verified. Arguments should be soundly based and your reasoning logical. Do not write anything that will misinform, mislead or unfairly persuade your readers — accurate information is essential for effective communication and decision making." },
    { t: "Objectivity", d: "A report should not be an essay reflecting personal emotions and opinions. Look at all sides of a problem with an open mind before stating conclusions. Showing an open mind makes your conclusions and recommendations more acceptable — the emphasis is on the factual material and conclusions drawn, not on personal beliefs, biases or prejudices." },
  ], { y: 1.8, h: 4.95, fontSize: 14 });
}

/* ============================================================ 8 · QUALITIES 2 */
{
  const s = slide();
  eyebrowTitle(s, "Qualities of good report writing · 2 of 2", "The Qualities of Good Report Writing");
  stackCards(s, [
    { t: "Conciseness", d: "'Veni, Vidi, Vici' (I came, I saw, I conquered) — that is how Julius Caesar reported his visit. While your reports won't be this short, aim to keep them concise. Do not mistake brevity for conciseness: a brief report may omit important information; a concise report is short but keeps all essential details." },
    { t: "Clarity & Consistency", d: "The best way to achieve clarity is to allow time between the first draft and its revision — over a weekend, or at least overnight. If under pressure, at least leave it over a lunch or coffee break. A period of time thinking of other things lets you return with objectivity." },
    { t: "Simplicity", d: "If your writing is selective, accurate, objective, concise, clear and consistent, it will also be as simple as it can be. Guard against over-simplifying to the point of leaving out information the reader needs. Keep the reader in mind and ask whether they can follow the logic of your presentation." },
  ], { y: 1.8, h: 4.95, fontSize: 14 });
}

/* ============================================================ 9 · POINTLESS WORDS */
{
  const s = slide();
  eyebrowTitle(s, "Writing tips", "Avoid Pointless Words");
  bigParas(s, [
    "Some words and phrases — like 'basically', 'actually', 'undoubtedly', 'each and every one' and 'during the course of our investigation' — keep cropping up in reports. Yet they add nothing to the message and often can be removed without changing the meaning or the tone.",
    "Try leaving them out of your writing. You will find your sentences survive, succeed and may even flourish without them.",
  ], { y: 1.9, fontSize: 17 });
  card(s, MX, 4.4, CW, 1.7, { fill: LIGHT });
  addIcon(s, "check", MX + 0.25, 4.65, 0.36);
  s.addText([
    { text: "TRY THIS   ", options: { bold: true, color: BLUE, fontSize: 12.5, charSpacing: 1.5 } },
    { text: "Take a paragraph you wrote this week and strike out every filler word. Read it again — the meaning stays, the message gets stronger.", options: { color: NAVY, fontSize: 15.5 } },
  ], { x: MX + 0.75, y: 4.55, w: CW - 1.05, h: 1.4, fontFace: BODY_FONT, valign: "middle", lineSpacingMultiple: 1.1 });
}

/* ============================================================ 10 · BASIC STRUCTURE */
{
  const s = slide();
  eyebrowTitle(s, "Report structure", "What is the Basic Structure of a Report?");
  bigParas(s, [
    "Types of reports can vary greatly; they can range from an experimental report to an environmental impact statement. There is, however, a basic structure common to most reports, irrespective of their type.",
    "The major components of a general report are shown on the next slide — from the title page through to the appendices.",
  ], { y: 2.0, fontSize: 17.5 });
  addIcon(s, "book", W / 2 - 0.5, 4.6, 1.0, "#" + BORDER);
}

/* ============================================================ 11 · MAJOR COMPONENTS */
{
  const s = slide();
  eyebrowTitle(s, "Report structure", "Major Components of a General Report");
  dataTable(s, ["Component", "What it contains"], [
    ["Title Page", "The report title, and identifying details"],
    ["Abstract", "In less than 200 words: what was the problem, how was it investigated, what did you find out and what do your findings mean?"],
    ["Table of Contents", "A list of the major and minor sections of your report"],
    ["Introduction", "Set the scene; give background about the topic; state the aim/purpose of the investigation; outline the body sections"],
    ["Main Body", "Organise sections in a logical sequence: what you investigated, what you found, what interpretations and judgments you made. Use short informative headings and subheadings"],
    ["Conclusion", "What has been achieved and the significance of your findings and discussion? Have your aims been successful or not?"],
    ["Recommendations", "What do you recommend as a course of action following your conclusion?"],
    ["References", "A list of all the sources you used"],
    ["Appendices", "Any information (graphs, charts, tables or other data) used but not included in the body"],
  ], { y: 1.7, colW: [2.9, 9.33], fontSize: 12.5, rowH: 0.52 });
}

/* ============================================================ 12 · TYPES OF REPORTS */
{
  const s = slide();
  eyebrowTitle(s, "Purpose & content of reports", "There Are Various Types of Reports");
  bigBullets(s, [
    "A report of a sports match",
    "A report of an accident to the Police or an insurance company",
    "A report of a social function, such as a wedding",
    "A news report about an accident, meeting or noteworthy incident",
    "A report of a commission of enquiry",
    "A trade report",
    "A company report or a Company Accident Report",
    "An Annual Report by a Chairman or a Treasurer",
    "An internal report on a business related matter following an investigation or collection of data",
  ], { y: 1.85, fontSize: 16.5 });
}

/* ============================================================ 13 · SAMPLE OVERVIEW */
{
  const s = slide();
  eyebrowTitle(s, "Worked examples", "Investec Sample Reports — 7 Worked Models");
  s.addText("Use these models to practise matching report type, purpose, audience and recommended action.", {
    x: MX, y: 1.55, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: 14.5, color: GREY,
  });
  dataTable(s, ["No.", "Report type", "Investec systems support example"], [
    ["1", "Incident", "Online Banking login outage — immediate facts, impact, action taken and escalation"],
    ["2", "Incident", "Lost corporate laptop — data risk, containment and compliance notification"],
    ["3", "Investigation", "Repeated VPN disconnections — evidence, root cause and conclusion"],
    ["4", "Investigation", "Print-cost increase — data analysis, findings and controls"],
    ["5", "Project status", "Windows 11 pilot rollout — progress, risks, issues and next steps"],
    ["6", "Project status", "Branch Wi-Fi upgrade — milestone status and blockers"],
    ["7", "Recommendation", "Service desk knowledge base — proposed solution, cost and decision needed"],
  ], { y: 2.05, colW: [0.85, 2.5, 8.88], fontSize: 13.5, rowH: 0.56 });
}

/* ============================================================ 14–16 · SAMPLE PAIRS */
function samplePair(eyebrow, title, intro, a, b) {
  const s = slide();
  eyebrowTitle(s, eyebrow, title);
  s.addText(intro, { x: MX, y: 1.55, w: CW, h: 0.45, fontFace: BODY_FONT, fontSize: 15, color: GREY });
  const items = [a, b];
  items.forEach((it, i) => {
    const cy = 2.15 + i * 2.4;
    card(s, MX, cy, CW, 2.2, { fill: i % 2 ? LIGHT : WHITE });
    s.addShape(pptx.ShapeType.rect, { x: MX, y: cy, w: 0.09, h: 2.2, fill: { color: BLUE } });
    s.addText([
      { text: it.t + "\n", options: { bold: true, color: NAVY, fontSize: 17, fontFace: TITLE_FONT } },
      { text: it.d, options: { color: NAVY, fontSize: 14, fontFace: BODY_FONT } },
    ], { x: MX + 0.3, y: cy + 0.14, w: CW - 0.58, h: 1.95, valign: "top", lineSpacingMultiple: 1.1 });
  });
  return s;
}

samplePair(
  "Worked examples · incident",
  "Sample Incident Reports",
  "Incident reports answer: What happened, who was affected, what immediate action was taken and what must happen next?",
  { t: "Online Banking login outage", d: "At 09:12 on 6 August 2026, monitoring reported elevated login failures. About 18% of attempted logins failed until 09:47 and the Service Desk logged 43 related calls. Action: escalate to Digital Channels Support, publish an internal advisory and monitor recovery after the authentication node restart." },
  { t: "Lost corporate laptop", d: "A Relationship Manager reported a lost encrypted laptop at 17:40 on 12 August 2026. IT Security initiated remote lock and wipe, disabled cached sessions and opened a compliance notification ticket. Follow-up: manager sign-off, replacement device and travel security refresher." }
);

samplePair(
  "Worked examples · investigation",
  "Sample Investigation Reports",
  "Investigation reports answer: What evidence was gathered, what caused the problem and what conclusion is supported by the facts?",
  { t: "Repeated VPN disconnections", d: "Review of 28 VPN tickets, firewall logs, endpoint versions and interviews showed that affected laptops were running an outdated VPN client after a staged update failed on one device group. Conclusion: the root cause was incomplete deployment validation." },
  { t: "Print-cost increase", d: "Print management data showed a 32% cost increase on Sandton 5th-floor devices. Findings showed default colour printing was enabled after a driver update and secure-release settings were missing on two devices. Conclusion: print policy controls were removed during the update." }
);

samplePair(
  "Worked examples · project status",
  "Sample Project Status Reports",
  "Project status reports answer: Is the project on track against scope, time, cost, quality, risks and next milestones?",
  { t: "Windows 11 pilot rollout", d: "Overall status amber. Planned: 40 pilot laptops. Completed: 34 upgraded, 3 deferred for application compatibility and 3 awaiting user availability. Main risk: the treasury spreadsheet add-in is not yet certified. Next step: submit the phase 2 go/no-go recommendation." },
  { t: "Branch Wi-Fi upgrade", d: "Overall status green. Access points installed at 5 of 6 planned branches; the remaining branch is delayed by landlord access approval. Budget used: 71% against planned 75%. Next step: coverage tests and branch manager sign-off." }
);

/* ============================================================ 17 · RECOMMENDATION SAMPLE */
{
  const s = slide();
  eyebrowTitle(s, "Worked examples · recommendation", "Sample Recommendation Report");
  s.addText("Recommendation reports answer: Which option should management approve, why, by when, and at what cost or risk?", {
    x: MX, y: 1.55, w: CW, h: 0.45, fontFace: BODY_FONT, fontSize: 15, color: GREY,
  });
  card(s, MX, 2.15, CW, 1.0, { fill: LIGHT });
  s.addShape(pptx.ShapeType.rect, { x: MX, y: 2.15, w: 0.09, h: 1.0, fill: { color: BLUE } });
  s.addText([
    { text: "Service desk knowledge base:  ", options: { bold: true, color: NAVY, fontSize: 16.5, fontFace: TITLE_FONT } },
    { text: "Implement a searchable knowledge base for recurring support issues by 30 November 2026.", options: { color: NAVY, fontSize: 15.5 } },
  ], { x: MX + 0.3, y: 2.15, w: CW - 0.58, h: 1.0, fontFace: BODY_FONT, valign: "middle", lineSpacingMultiple: 1.08 });
  stackCards(s, [
    { t: "Evidence", d: "Password resets, VPN setup, printer mapping and Teams audio issues account for 41% of first-line requests." },
    { t: "Recommended option", d: "Use the existing ITSM knowledge module because it avoids new licensing costs, supports approval workflows and links articles directly to tickets." },
    { t: "Approval requested", d: "Assign two analysts for article creation and require monthly review by team leads." },
  ], { y: 3.4, h: 3.3, fontSize: 14 });
}

/* ============================================================ 18 · RESOURCES */
{
  const s = slide();
  eyebrowTitle(s, "Obtaining & distributing information", "Resources for Getting Information");
  bigParas(s, [
    "Firstly, all information which is available in the organisation must always be seen as confidential information. When information is made available to competitors, they may gain the upper hand and copy concepts and ideas from the organisation — which could lead to serious financial implications.",
    "Information centres in the organisation — such as operations, finance, research and development, and human resources — will have information about the organisation and will be able to give an authorised individual all the information they may need.",
  ], { y: 2.0, fontSize: 17 });
  addIcon(s, "database", W / 2 - 0.5, 5.1, 1.0, "#" + BORDER);
}

/* ============================================================ 19 · SOURCED INFO */
{
  const s = slide();
  eyebrowTitle(s, "Obtaining & distributing information", "Information Sourced From the Organisation");
  bigBullets(s, [
    "Financial statements / reports",
    "Research and development activities",
    "Marketing and advertising strategies",
    "Human resource needs / expectations",
    "Company vision regarding the long-term expectations and future of the organisation",
    "Project-specific information of certain aspects of projects undertaken by the organisation",
  ], { y: 1.9, fontSize: 17.5, intro: "Information can include, but is not limited to:" });
}

/* ============================================================ 20 · DISTRIBUTING */
{
  const s = slide();
  eyebrowTitle(s, "Obtaining & distributing information", "Procedures for Distributing Information");
  bigParas(s, [
    "Distributing information about the organisation must be handled in a very delicate manner and the recipients of such information must be selected carefully. Depending on the severity of the information and the level of security and/or risk attached to it, recipients should be graded on whether or not they are liable to obtain such information.",
    "Most information will be distributed to individuals in the organisation depending on their need for it. The information should be relevant to their needs and their use.",
    "For example: if the marketing department is included in the distribution of a new marketing campaign, the information given to them should purely be on the new product/service and how it will influence and/or attract customers, including the expected target market. They need not know the amount spent on the research and development costs of the new product.",
  ], { y: 1.8, fontSize: 15.5 });
}

/* ============================================================ 21 · VERIFYING */
{
  const s = slide();
  eyebrowTitle(s, "Verifying reported information", "Verifying Reported Information");
  bigParas(s, [
    "Before any report is sent to a person who will proof it and ensure it is correct, the originator is required to double-check that all the information given in the report is in line with the stipulated requirements of both the target audience and the required outcomes of the report.",
    "The person who wrote the report will get another person to read through it — with the required outlines and requirements at hand — and critique it. This gives a second opinion, ensures all required information is present, and checks the report for bias toward the readers.",
    "In many cases, once critiqued and sent for proofing, the report is handed to the head of the department for approval at least a week in advance of the expected delivery date, allowing time to give feedback on add-ons and irrelevant information.",
    "Throughout, organisational procedures must be strictly followed and adhered to, so that set protocols are followed for gathering and distributing the information — ensuring the report is true to its requirements and contains sufficient, but not too much, information.",
  ], { y: 1.75, fontSize: 14.5 });
}

/* ============================================================ 22 · ACTIVITY */
{
  const s = slide();
  eyebrowTitle(s, "Question session 1", "Activity — Apply Your Knowledge");
  const items = [
    "Give examples of different types of reports that are produced in organisations",
    "Explain the information that will be relayed in each of the reports you have mentioned above",
    "Explain your organisational procedures for obtaining and distributing sensitive company information",
    "Explain your organisational procedures for obtaining sensitive company information",
    "Identify and explain the steps that are used for compiling reports",
    "Explain how to ensure that the reported information is in accordance with the requirements of the report",
  ];
  items.forEach((t, i) => {
    const cy = 1.8 + i * 0.82;
    s.addShape(pptx.ShapeType.ellipse, { x: MX, y: cy, w: 0.5, h: 0.5, fill: { color: BLUE } });
    s.addText(String(i + 1), { x: MX, y: cy, w: 0.5, h: 0.5, fontFace: TITLE_FONT, fontSize: 17, bold: true, color: WHITE, align: "center", valign: "middle" });
    s.addText(t, { x: MX + 0.72, y: cy - 0.05, w: CW - 0.9, h: 0.62, fontFace: BODY_FONT, fontSize: 15.5, color: NAVY, valign: "middle" });
  });
}

/* ============================================================ 23 · SELF-ASSESSMENT */
{
  const s = slide();
  eyebrowTitle(s, "Self-assessment", "Self-Assessment — Be Honest With Yourself");
  s.addText("Tick the box with a ✓ or an ✗ to indicate your response.", {
    x: MX, y: 1.55, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: 14.5, color: GREY,
  });
  const items = [
    "I am able to identify and explain different types of reports used in organisations",
    "I am able to explain the use of the different types of reports",
    "I am able to identify and explain the reasons for handling confidential information confidentially",
    "I am able to explain a range of techniques for compiling reports",
    "I am able to explain how the reported information is checked for appropriateness and then distributed according to the intended audience of the report",
  ];
  items.forEach((t, i) => {
    const cy = 2.1 + i * 0.72;
    s.addShape(pptx.ShapeType.roundRect, { x: MX, y: cy + 0.06, w: 0.42, h: 0.42, rectRadius: 0.07, fill: { color: WHITE }, line: { color: BLUE, width: 1.5 } });
    s.addText(t, { x: MX + 0.66, y: cy - 0.03, w: CW - 0.9, h: 0.62, fontFace: BODY_FONT, fontSize: 15, color: NAVY, valign: "middle" });
  });
  card(s, MX, 5.9, CW, 1.0, { fill: LIGHT });
  addIcon(s, "target", MX + 0.25, 6.15, 0.36);
  s.addText(
    "Think about any point you could not tick. Write it down as a goal, decide on a plan of action to achieve it, and review your goals regularly.",
    { x: MX + 0.75, y: 6.0, w: CW - 1.05, h: 0.8, fontFace: BODY_FONT, fontSize: 14.5, color: NAVY, valign: "middle", lineSpacingMultiple: 1.1 }
  );
}

const OUT = "public/downloads/US8252-Writing-Business-Reports.pptx";
await pptx.writeFile({ fileName: OUT });
console.log("Wrote", OUT, "with", pageNo, "slides");
