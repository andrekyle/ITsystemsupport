// Regenerates LearnerManual.pptx in the Investec / Microsoft Learn house style —
// large fonts, thin-stroke icons everywhere, ALL original text preserved
// including the text that lived inside screenshots in the source deck.
// Run: node scripts/make-learner-manual-ppt.mjs
import pptxgen from "pptxgenjs";

const BLUE = "0F6CBD";
const NAVY = "002050";
const LIGHT = "EAF4FF";
const GREY = "6B7280";
const WHITE = "FFFFFF";
const BORDER = "D5E3F2";
const RED = "C50F1F";
const REDBG = "FCEDEE";
const GREEN = "0E700E";
const GREENBG = "E7F4E7";
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
  dismiss: '<circle cx="12" cy="12" r="8.5"/><path d="m9 9 6 6M15 9l-6 6"/>',
  document: '<path d="M6.5 3.5h7.2l4.8 4.8V19a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 19z"/><path d="M13.5 3.5v5h5M9.5 12.5h5M9.5 15.5h5"/>',
  people: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5"/><circle cx="16.8" cy="9.2" r="2.4"/><path d="M16.3 14.7c2.2.2 3.8 1.5 4.3 4.3"/>',
  shield: '<path d="M12 3l7 2.8v5.4c0 4.5-3 7.9-7 9.8-4-1.9-7-5.3-7-9.8V5.8z"/><path d="m9.2 11.8 2 2 3.6-4"/>',
  pen: '<path d="M4 20l1-4L16.5 4.5a2.12 2.12 0 0 1 3 3L8 19l-4 1z"/><path d="m14.5 6.5 3 3"/>',
  database: '<ellipse cx="12" cy="5.5" rx="7" ry="2.5"/><path d="M5 5.5v13c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-13"/><path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5"/>',
  briefcase: '<rect x="3.5" y="7" width="17" height="13" rx="1.8"/><path d="M9 7V5.6A1.6 1.6 0 0 1 10.6 4h2.8A1.6 1.6 0 0 1 15 5.6V7M3.5 12h17"/>',
  book: '<path d="M4 19.5v-14A2.5 2.5 0 0 1 6.5 3H20v18H6.5a2.5 2.5 0 0 1-2.5-2.5zm0 0A2.5 2.5 0 0 1 6.5 17H20"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4.5 4.5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.2 2"/>',
  chart: '<path d="M4 4v16h16"/><path d="M8 16v-5M12 16V7M16 16v-8"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  lock: '<rect x="5.5" y="10.5" width="13" height="9.5" rx="1.6"/><path d="M8.5 10.5V7.7a3.5 3.5 0 0 1 7 0v2.8"/><circle cx="12" cy="15" r="1.2"/>',
  key: '<circle cx="8" cy="14.5" r="4.5"/><path d="m11.3 11.2 8-8M16 6.5l2.7 2.7M13.4 9.1l2.2 2.2"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  warning: '<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17.2h.05"/>',
  question: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.2a2.4 2.4 0 1 1 3.3 2.2c-.8.33-1.3 1-1.3 1.8v.4"/><path d="M11.6 16.6h.05"/>',
  compass: '<circle cx="12" cy="12" r="8.5"/><path d="m14.8 9.2-1.7 4.5-4.5 1.7 1.7-4.5z"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="1.8"/><path d="m3.5 7 8.5 6 8.5-6"/>',
  list: '<path d="M8.5 6h12M8.5 12h12M8.5 18h12"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  speed: '<path d="M4.5 17.5a8.5 8.5 0 1 1 15 0"/><path d="m12 14 4-5.5"/><circle cx="12" cy="15" r="1.4"/>',
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
pptx.title = "US 8252 — Writing Business Reports (Learner Manual)";

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
    x: MX, y: 0.28, w: CW, h: 0.38, fontFace: BODY_FONT, fontSize: 14, bold: true, color: BLUE, charSpacing: 2,
  });
  s.addText(title, {
    x: MX, y: 0.64, w: CW, h: 0.86, fontFace: TITLE_FONT, fontSize: 34, bold: true, color: NAVY,
  });
}

function card(s, x, y, w, h, { fill = WHITE, line = BORDER } = {}) {
  s.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.09, fill: { color: fill }, line: { color: line, width: 1 }, shadow: SHADOW,
  });
}

function bigParas(s, paras, { y = 1.75, h = H - 2.4, fontSize = 18 } = {}) {
  s.addText(
    paras.map((p, i) => ({
      text: p + (i < paras.length - 1 ? "\n" : ""),
      options: { fontSize, color: NAVY, breakLine: true, paraSpaceAfter: 12 },
    })),
    { x: MX, y, w: CW, h, fontFace: BODY_FONT, valign: "top", lineSpacingMultiple: 1.12 }
  );
}

/** Rows of icon + "Label: description" — the deck's signature icon list. */
function iconRows(s, items, { y = 1.85, rowH = 0.95, fontSize = 16, iconSize = 0.4, color } = {}) {
  items.forEach((it, i) => {
    const cy = y + i * rowH;
    addIcon(s, it.icon, MX + 0.05, cy + 0.06, iconSize, color);
    s.addText([
      ...(it.t ? [{ text: it.t + (it.d ? ": " : ""), options: { bold: true, color: NAVY, fontSize } }] : []),
      ...(it.d ? [{ text: it.d, options: { color: NAVY, fontSize } }] : []),
    ], { x: MX + 0.68, y: cy - 0.08, w: CW - 0.9, h: rowH + 0.1, fontFace: BODY_FONT, valign: "middle", lineSpacingMultiple: 1.06 });
  });
}

function stackCards(s, items, { y = 1.75, h = H - 2.45, fontSize = 16, iconDefault } = {}) {
  const gap = 0.22;
  const ch = (h - gap * (items.length - 1)) / items.length;
  items.forEach((it, i) => {
    const cy = y + i * (ch + gap);
    card(s, MX, cy, CW, ch, { fill: i % 2 ? LIGHT : WHITE });
    s.addShape(pptx.ShapeType.rect, { x: MX, y: cy, w: 0.09, h: ch, fill: { color: BLUE } });
    const icon = it.icon ?? iconDefault;
    if (icon) addIcon(s, icon, MX + 0.28, cy + 0.18, 0.4);
    s.addText([
      { text: it.t + "\n", options: { bold: true, color: NAVY, fontSize: fontSize + 3.5, fontFace: TITLE_FONT } },
      { text: it.d, options: { color: NAVY, fontSize, fontFace: BODY_FONT } },
    ], { x: MX + (icon ? 0.85 : 0.32), y: cy + 0.12, w: CW - (icon ? 1.15 : 0.6), h: ch - 0.24, valign: "middle", lineSpacingMultiple: 1.08 });
  });
}

function dataTable(s, header, rows, { y = 1.75, colW, fontSize = 15.5, rowH = 0.5 } = {}) {
  const tableRows = [
    header.map((t) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: BLUE }, fontFace: TITLE_FONT, fontSize } })),
    ...rows.map((r, i) =>
      r.map((c) => ({ text: c, options: { color: NAVY, fill: { color: i % 2 ? LIGHT : WHITE }, fontFace: BODY_FONT, fontSize } }))
    ),
  ];
  s.addTable(tableRows, { x: MX, y, w: CW, colW, border: { type: "solid", color: BORDER, pt: 0.75 }, rowH, valign: "middle", margin: 0.1 });
}

/** "What NOT / Why it fails / Accurate way" accuracy case slide */
function accuracyCase(eyebrow, no, title, wrong, why, right) {
  const s = slide();
  eyebrowTitle(s, eyebrow, `${no}. ${title}`);
  card(s, MX, 1.8, CW, 1.55, { fill: REDBG, line: "F2C7CB" });
  addIcon(s, "dismiss", MX + 0.25, 2.0, 0.4, "#" + RED);
  s.addText([
    { text: "WHAT NOT TO DO\n", options: { bold: true, color: RED, fontSize: 12.5, charSpacing: 1.5 } },
    { text: wrong, options: { color: NAVY, fontSize: 15.5, italic: true } },
  ], { x: MX + 0.85, y: 1.92, w: CW - 1.15, h: 1.3, fontFace: BODY_FONT, valign: "middle", lineSpacingMultiple: 1.08 });
  card(s, MX, 3.55, CW, 1.25, { fill: WHITE });
  addIcon(s, "warning", MX + 0.25, 3.85, 0.4, "#" + GREY);
  s.addText([
    { text: "WHY IT BREAKS THE RULE\n", options: { bold: true, color: GREY, fontSize: 12.5, charSpacing: 1.5 } },
    { text: why, options: { color: NAVY, fontSize: 15.5 } },
  ], { x: MX + 0.85, y: 3.65, w: CW - 1.15, h: 1.05, fontFace: BODY_FONT, valign: "middle", lineSpacingMultiple: 1.08 });
  card(s, MX, 5.0, CW, 1.55, { fill: GREENBG, line: "BFE0BF" });
  addIcon(s, "check", MX + 0.25, 5.22, 0.4, "#" + GREEN);
  s.addText([
    { text: "THE ACCURATE WAY\n", options: { bold: true, color: GREEN, fontSize: 12.5, charSpacing: 1.5 } },
    { text: right, options: { color: NAVY, fontSize: 15.5 } },
  ], { x: MX + 0.85, y: 5.12, w: CW - 1.15, h: 1.3, fontFace: BODY_FONT, valign: "middle", lineSpacingMultiple: 1.08 });
  s.addText("Accuracy — check that everything you write is factually accurate and capable of being verified.", {
    x: MX, y: 6.68, w: CW, h: 0.3, fontFace: BODY_FONT, fontSize: 12.5, italic: true, color: GREY,
  });
  return s;
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

/* ============================================================ 2 · CONTENTS */
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
  ], { y: 1.85, colW: [3.6, 7.6, 1.03], fontSize: 16.5, rowH: 0.78 });
}

/* ============================================================ 3 · ALIGNMENT INDEX */
{
  const s = slide();
  eyebrowTitle(s, "Specific outcomes and related assessment criteria", "Alignment Index — Specific Outcomes");
  card(s, MX, 1.72, CW, 0.66, { fill: LIGHT });
  s.addText([
    { text: "SO 1   ", options: { bold: true, color: BLUE, fontSize: 17, fontFace: TITLE_FONT } },
    { text: "The demonstrated ability to make decisions and consider options when:   ", options: { color: NAVY, fontSize: 16.5 } },
    { text: "AC 1 — as for SO 1", options: { bold: true, color: BLUE, fontSize: 14 } },
  ], { x: MX + 0.25, y: 1.72, w: CW - 0.5, h: 0.66, fontFace: BODY_FONT, valign: "middle" });
  s.addText("The criterion tests your ability to create, share, and verify workplace reports. It is broken down into four main tasks:", {
    x: MX, y: 2.55, w: CW, h: 0.45, fontFace: BODY_FONT, fontSize: 16, color: GREY,
  });
  stackCards(s, [
    { icon: "target", t: "Matching reports to business needs", d: "Ensuring the type and contents of the report match what management or stakeholders actually need to see." },
    { icon: "lock", t: "Handling private information", d: "Knowing where to find company data and following the correct rules for sharing sensitive or confidential details." },
    { icon: "clock", t: "Writing and meeting deadlines", d: "Using proper techniques to write reports so they look professional, contain the right information, and are submitted on time." },
    { icon: "people", t: "Teamwork and fact-checking", d: "Checking with your colleagues to make sure your data is correct, and adding any extra notes or explanations if they are needed." },
  ], { y: 3.1, h: 3.7, fontSize: 14.5 });
}

/* ============================================================ 4 · INTRODUCTION + PERSON TABLE */
{
  const s = slide();
  eyebrowTitle(s, "Purpose & content of reports", "Introduction");
  bigParas(s, [
    "There are a few general rules about report writing. A report should be a formal document and should be in the past tense as far as possible, as well as avoiding the use of first or second person pronouns.",
  ], { y: 1.75, h: 1.2, fontSize: 17.5 });
  dataTable(s, ["Person", "Who it refers to", "Common Examples"], [
    ["First Person", "The person speaking", "I, me, we, us, my, our"],
    ["Second Person", "The person being spoken to", "You, your, yours"],
  ], { y: 3.15, colW: [3.2, 4.8, 4.23], fontSize: 17, rowH: 0.85 });
}

/* ============================================================ 5 · PASSIVE VOICE */
{
  const s = slide();
  eyebrowTitle(s, "Purpose & content of reports", "Write Without \u201cYou\u201d — Passive Voice");
  card(s, MX, 1.7, CW, 1.35, { fill: LIGHT });
  addIcon(s, "briefcase", MX + 0.25, 1.9, 0.4);
  s.addText([
    { text: "IT EXAMPLE\n", options: { bold: true, color: BLUE, fontSize: 12.5, charSpacing: 1.5 } },
    { text: "\u201cYou need to reset your password before accessing the system.\u201d — in professional IT documentation, system messages and banking support environments like Investec, the correct way to write this is to use passive voice or imperative (action-based) phrasing. This removes the word \u201cYou\u201d, making the instructions sound objective, professional, and less accusatory.", options: { color: NAVY, fontSize: 14.5 } },
  ], { x: MX + 0.85, y: 1.82, w: CW - 1.15, h: 1.12, fontFace: BODY_FONT, valign: "middle", lineSpacingMultiple: 1.06 });
  bigParas(s, [
    "Passive voice is a way of writing a sentence where the focus is placed on the action or the object receiving the action, rather than the person or thing doing it. In IT and business writing, it is used to make statements sound neutral, objective, and professional.",
  ], { y: 3.25, h: 1.1, fontSize: 15.5 });
  addIcon(s, "search", MX + 0.05, 4.45, 0.38);
  s.addText("The Core Difference", { x: MX + 0.55, y: 4.4, w: CW, h: 0.45, fontFace: TITLE_FONT, fontSize: 20, bold: true, color: NAVY });
  const half = (CW - 0.3) / 2;
  card(s, MX, 4.95, half, 1.7, { fill: WHITE });
  s.addText([
    { text: "Active Voice:  ", options: { bold: true, color: NAVY, fontSize: 15.5 } },
    { text: "The subject does the action. (Focus is on who did it).\n", options: { color: NAVY, fontSize: 15.5 } },
    { text: "\u201cJohn updated the database.\u201d", options: { italic: true, color: GREY, fontSize: 15.5 } },
  ], { x: MX + 0.25, y: 5.1, w: half - 0.5, h: 1.4, fontFace: BODY_FONT, valign: "middle", lineSpacingMultiple: 1.12 });
  card(s, MX + half + 0.3, 4.95, half, 1.7, { fill: LIGHT });
  s.addText([
    { text: "Passive Voice:  ", options: { bold: true, color: BLUE, fontSize: 15.5 } },
    { text: "The subject receives the action. (Focus is on what happened).\n", options: { color: NAVY, fontSize: 15.5 } },
    { text: "\u201cThe database was updated.\u201d", options: { italic: true, color: GREY, fontSize: 15.5 } },
  ], { x: MX + half + 0.55, y: 5.1, w: half - 0.5, h: 1.4, fontFace: BODY_FONT, valign: "middle", lineSpacingMultiple: 1.12 });
}

/* ============================================================ 6 · IMPERATIVE PHRASING */
{
  const s = slide();
  eyebrowTitle(s, "Purpose & content of reports", "Imperative-Based Phrasing");
  bigParas(s, [
    "Imperative-based phrasing is a style of writing that gives a direct command or instruction.",
    "It removes unnecessary fluff and personal pronouns (like \u201cyou\u201d), starting the sentence with a strong action verb instead. In IT and software systems, it is the primary way to write clear, actionable documentation, error resolutions, and user interface buttons.",
  ], { y: 1.75, h: 1.9, fontSize: 16.5 });
  addIcon(s, "search", MX + 0.05, 3.7, 0.38);
  s.addText("The Core Formula", { x: MX + 0.55, y: 3.65, w: CW, h: 0.45, fontFace: TITLE_FONT, fontSize: 20, bold: true, color: NAVY });
  s.addText("Instead of explaining a situation or telling someone what they need to do, you tell them exactly what action to execute.", {
    x: MX, y: 4.15, w: CW, h: 0.45, fontFace: BODY_FONT, fontSize: 15.5, color: NAVY,
  });
  const half = (CW - 0.3) / 2;
  card(s, MX, 4.75, half, 1.75, { fill: "F4F5F7", line: "DADDE2" });
  addIcon(s, "dismiss", MX + 0.25, 4.93, 0.32, "#" + GREY);
  s.addText([
    { text: "WORDY / EXPLANATORY\n", options: { bold: true, color: GREY, fontSize: 12, charSpacing: 1.5 } },
    { text: "\u201cYou will need to click on the save button to keep your data.\u201d", options: { italic: true, color: NAVY, fontSize: 16 } },
  ], { x: MX + 0.25, y: 5.3, w: half - 0.5, h: 1.1, fontFace: BODY_FONT, valign: "top", lineSpacingMultiple: 1.1 });
  card(s, MX + half + 0.3, 4.75, half, 1.75, { fill: LIGHT });
  addIcon(s, "check", MX + half + 0.55, 4.93, 0.32);
  s.addText([
    { text: "IMPERATIVE (ACTION-BASED)\n", options: { bold: true, color: BLUE, fontSize: 12, charSpacing: 1.5 } },
    { text: "\u201cClick Save.\u201d", options: { italic: true, color: NAVY, fontSize: 20, bold: true } },
  ], { x: MX + half + 0.55, y: 5.3, w: half - 0.5, h: 1.1, fontFace: BODY_FONT, valign: "top", lineSpacingMultiple: 1.1 });
}

/* ============================================================ 7 · IMPERATIVE TABLE */
{
  const s = slide();
  eyebrowTitle(s, "Purpose & content of reports", "Imperative Phrasing in Practice");
  dataTable(s, ["Non-Imperative Phrasing (Avoid)", "Imperative Phrasing (Use)", "Primary Action Verb"], [
    ["\u201cYou need to restart your device now.\u201d", "\u201cRestart the device.\u201d", "Restart"],
    ["\u201cPlease download the software update.\u201d", "\u201cDownload the update.\u201d", "Download"],
    ["\u201cYou should enter your username here.\u201d", "\u201cEnter your username.\u201d", "Enter"],
    ["\u201cMake sure to backup your files first.\u201d", "\u201cBackup all data prior to installation.\u201d", "Backup"],
  ], { y: 1.75, colW: [5.1, 4.6, 2.53], fontSize: 15, rowH: 0.72 });
}

/* ============================================================ 8 · WHY USE IMPERATIVE */
{
  const s = slide();
  eyebrowTitle(s, "Purpose & content of reports", "Why Use Imperative Phrasing in IT?");
  stackCards(s, [
    { icon: "speed", t: "Saves Time", d: "Users scan technical text quickly; commands tell them what to do instantly." },
    { icon: "chart", t: "Saves Screen Space", d: "It is perfect for system dialog boxes, mobile alerts, and buttons." },
    { icon: "shield", t: "Removes Blame", d: "Like passive voice, it avoids using \u201cyou\u201d, keeping the language strictly professional." },
  ], { y: 1.85, h: 4.7, fontSize: 16 });
}

/* ============================================================ 9 · PURPOSE & STYLE INTRO */
{
  const s = slide();
  eyebrowTitle(s, "Purpose & content of reports", "Know the Purpose Before You Write");
  bigParas(s, [
    "Before we start writing reports in business, we need to understand what the purpose of the report is — i.e. the outcome, or required outcome thereof — as well as the manner (style) in which the report must be written.",
    "Writing a report in a style which is not suited to its audience or readers will not be professional. Therefore, we must understand what we need to put into the report and phrase it appropriately so that the readers understand the information being given to them.",
  ], { y: 2.0, fontSize: 19 });
  addIcon(s, "compass", W / 2 - 0.5, 5.2, 1.0, "#" + BORDER);
}

/* ============================================================ 10 · HOW TO WRITE — STYLE */
{
  const s = slide();
  eyebrowTitle(s, "How to write a report", "How to Write a Report — Style");
  s.addText("To make sure a recommendation report works perfectly, the persons for whom the report is intended must be able to do four things:", {
    x: MX, y: 1.7, w: CW, h: 0.5, fontFace: BODY_FONT, fontSize: 16.5, color: GREY,
  });
  stackCards(s, [
    { icon: "speed", t: "Read it quickly", d: "They can read the report without wasting any time." },
    { icon: "eye", t: "Understand it easily", d: "They can grasp everything in the report without struggling." },
    { icon: "check", t: "Trust the information", d: "They agree with and believe your facts, results, and ideas." },
    { icon: "target", t: "Take action", d: "They choose to follow your advice and do what you suggest." },
  ], { y: 2.3, h: 3.4, fontSize: 14.5 });
  card(s, MX, 5.9, CW, 1.0, { fill: LIGHT });
  addIcon(s, "pen", MX + 0.25, 6.15, 0.36);
  s.addText(
    "Achieving this demands more of you than merely presenting relevant facts accurately. It also demands that you communicate in a way that is both acceptable and intelligible to the readers.",
    { x: MX + 0.75, y: 6.0, w: CW - 1.05, h: 0.8, fontFace: BODY_FONT, fontSize: 15, color: NAVY, valign: "middle", lineSpacingMultiple: 1.08 }
  );
}

/* ============================================================ 11 · SELECTIVITY */
{
  const s = slide();
  eyebrowTitle(s, "Qualities of good report writing · 1 of 2", "Selectivity");
  s.addText("Careful choice of words can enable you to convey many subtleties of meaning.", {
    x: MX, y: 1.7, w: CW, h: 0.45, fontFace: BODY_FONT, fontSize: 16.5, color: GREY,
  });
  dataTable(s, ["Vague / Soft Phrasing", "Precise IT Phrasing", "Impact of the Change"], [
    ["\u201cThe server went down.\u201d", "\u201cThe server experienced an unscheduled outage.\u201d", "Clarifies that the downtime was unplanned and requires investigation."],
    ["\u201cWe need to fix the software.\u201d", "\u201cWe must patch the vulnerability.\u201d", "Identifies the exact action (patching) and the specific issue (security risk)."],
    ["\u201cThe app is slow.\u201d", "\u201cLatencies exceeded the 200ms threshold.\u201d", "Provides measurable data instead of a subjective opinion."],
    ["\u201cUsers can't login.\u201d", "\u201cAuthentication requests are timing out.\u201d", "Pinpoints the exact technical failure point in the login process."],
  ], { y: 2.25, colW: [3.4, 4.1, 4.73], fontSize: 14, rowH: 0.95 });
}

/* ============================================================ 12 · ACCURACY */
{
  const s = slide();
  eyebrowTitle(s, "Qualities of good report writing · 1 of 2", "Accuracy");
  bigParas(s, [
    "Check that everything you write is factually accurate and capable of being verified. Arguments should be soundly based and your reasoning logical. Do not write anything that will misinform, mislead or unfairly persuade your readers — accurate information is essential for effective communication and decision making.",
  ], { y: 1.75, h: 1.35, fontSize: 15.5 });
  addIcon(s, "search", MX + 0.05, 3.15, 0.38);
  s.addText("What the Text Means", { x: MX + 0.55, y: 3.1, w: CW, h: 0.45, fontFace: TITLE_FONT, fontSize: 20, bold: true, color: NAVY });
  iconRows(s, [
    { icon: "check", t: "Tell the truth", d: "Everything you write must be 100% correct." },
    { icon: "document", t: "Prove it", d: "You must be able to back up your claims with real facts or evidence." },
    { icon: "compass", t: "Be logical", d: "Your ideas must make sense and follow a clear line of reasoning." },
    { icon: "shield", t: "Do not trick people", d: "Do not leave out important facts to force someone to agree with you." },
  ], { y: 3.75, rowH: 0.78, fontSize: 16.5 });
}

/* ============================================================ 13–15 · ACCURACY CASES */
accuracyCase(
  "Accuracy in practice · 1 of 3",
  1,
  "Do Not Guess or Assume (Verifiable Facts)",
  "Writing in an incident report: \u201cThe server crashed because the network team messed up the configuration update last night.\u201d",
  "You are blaming another team without proof or log evidence.",
  "\u201cThe server went offline at 02:14 AM due to a 100% CPU spike. Logs are being reviewed to find the root cause.\u201d"
);

accuracyCase(
  "Accuracy in practice · 2 of 3",
  2,
  "Do Not Hide the Full Truth (Misleading)",
  "Telling a client: \u201cThe new software update is 100% finished and ready for deployment tomorrow.\u201d",
  "The code is done, but you intentionally left out the fact that it completely failed security testing.",
  "\u201cThe software development phase is complete, but deployment is on hold until it passes final security validation.\u201d"
);

accuracyCase(
  "Accuracy in practice · 3 of 3",
  3,
  "Do Not Exaggerate (Sound Reasoning)",
  "Writing to management: \u201cThe entire bank network is completely down and the whole company is paralyzed!\u201d",
  "It is an emotional overstatement. Only one localized branch office is experiencing a slow internet connection.",
  "\u201cThe Sandton branch office is currently experiencing high network latency, impacting 15 users.\u201d"
);

/* ============================================================ 16 · OBJECTIVITY */
{
  const s = slide();
  eyebrowTitle(s, "Qualities of good report writing · 1 of 2", "Objectivity");
  bigParas(s, [
    "A report should not be an essay reflecting personal emotions and opinions. Look at all sides of a problem with an open mind before stating conclusions. Showing an open mind makes your conclusions and recommendations more acceptable — the emphasis is on the factual material and conclusions drawn, not on personal beliefs, biases or prejudices.",
  ], { y: 1.75, h: 1.4, fontSize: 15.5 });
  addIcon(s, "wrench", MX + 0.05, 3.2, 0.38);
  s.addText("How to Apply This to an IT Report", { x: MX + 0.55, y: 3.15, w: CW, h: 0.45, fontFace: TITLE_FONT, fontSize: 20, bold: true, color: NAVY });
  iconRows(s, [
    { icon: "list", t: "Make it fast to read", d: "Use bullet points and clear headers so the reader gets the point instantly." },
    { icon: "eye", t: "Make it easy to understand", d: "Use plain language instead of dense technical jargon." },
    { icon: "chart", t: "Make it believable", d: "Support your conclusions with hard data, system logs, or metrics." },
    { icon: "target", t: "Make it actionable", d: "End the report with a clear, step-by-step instruction on what to do next." },
  ], { y: 3.8, rowH: 0.78, fontSize: 16.5 });
}

/* ============================================================ 17 · WHAT NOT TO DO (IT EXAMPLES) */
{
  const s = slide();
  eyebrowTitle(s, "Qualities of good report writing · 1 of 2", "\u2716 What NOT to Do (IT Examples)");
  card(s, MX, 1.85, CW, 2.25, { fill: REDBG, line: "F2C7CB" });
  addIcon(s, "dismiss", MX + 0.25, 2.05, 0.4, "#" + RED);
  s.addText([
    { text: "DO NOT DELAY THE READER (WORDY)\n", options: { bold: true, color: RED, fontSize: 12.5, charSpacing: 1.5 } },
    { text: "\u201cIt has come to our attention via various diagnostic methodologies that the database is encountering latency constraints due to a variety of interconnected factors.\u201d\n", options: { italic: true, color: NAVY, fontSize: 15.5 } },
    { text: "Why it fails: It wastes the reader's time with empty filler words.", options: { bold: true, color: NAVY, fontSize: 14.5 } },
  ], { x: MX + 0.85, y: 2.0, w: CW - 1.15, h: 2.0, fontFace: BODY_FONT, valign: "middle", lineSpacingMultiple: 1.12 });
  card(s, MX, 4.35, CW, 2.25, { fill: REDBG, line: "F2C7CB" });
  addIcon(s, "dismiss", MX + 0.25, 4.55, 0.4, "#" + RED);
  s.addText([
    { text: "DO NOT MAKE IT HARD TO UNDERSTAND (TOO MUCH JARGON)\n", options: { bold: true, color: RED, fontSize: 12.5, charSpacing: 1.5 } },
    { text: "\u201cExecute a hard provisioning cycle on the hypervisor virtual switch infrastructure to mitigate packet drops.\u201d\n", options: { italic: true, color: NAVY, fontSize: 15.5 } },
    { text: "Why it fails: A non-technical manager will struggle to understand what this means.", options: { bold: true, color: NAVY, fontSize: 14.5 } },
  ], { x: MX + 0.85, y: 4.5, w: CW - 1.15, h: 2.0, fontFace: BODY_FONT, valign: "middle", lineSpacingMultiple: 1.12 });
}

/* ============================================================ 18 · QUALITIES 2 OF 2 */
{
  const s = slide();
  eyebrowTitle(s, "Qualities of good report writing · 2 of 2", "The Qualities of Good Report Writing");
  stackCards(s, [
    { icon: "pen", t: "Conciseness", d: "'Veni, Vidi, Vici' (I came, I saw, I conquered) — that is how Julius Caesar reported his visit. While your reports won't be this short, aim to keep them concise. Do not mistake brevity for conciseness: a brief report may omit important information; a concise report is short but keeps all essential details." },
    { icon: "clock", t: "Clarity & Consistency", d: "The best way to achieve clarity is to allow time between the first draft and its revision — over a weekend, or at least overnight. If under pressure, at least leave it over a lunch or coffee break. A period of time thinking of other things lets you return with objectivity." },
    { icon: "check", t: "Simplicity", d: "If your writing is selective, accurate, objective, concise, clear and consistent, it will also be as simple as it can be. Guard against over-simplifying to the point of leaving out information the reader needs. Keep the reader in mind and ask whether they can follow the logic of your presentation." },
  ], { y: 1.8, h: 4.95, fontSize: 14.5 });
}

/* ============================================================ 19 · POINTLESS WORDS */
{
  const s = slide();
  eyebrowTitle(s, "Writing tips", "Avoid Pointless Words");
  bigParas(s, [
    "Some words and phrases — like 'basically', 'actually', 'undoubtedly', 'each and every one' and 'during the course of our investigation' — keep cropping up in reports. Yet they add nothing to the message and often can be removed without changing the meaning or the tone.",
    "Try leaving them out of your writing. You will find your sentences survive, succeed and may even flourish without them.",
  ], { y: 1.9, fontSize: 19 });
  card(s, MX, 4.4, CW, 1.7, { fill: LIGHT });
  addIcon(s, "check", MX + 0.25, 4.65, 0.36);
  s.addText([
    { text: "TRY THIS   ", options: { bold: true, color: BLUE, fontSize: 13.5, charSpacing: 1.5 } },
    { text: "Take a paragraph you wrote this week and strike out every filler word. Read it again — the meaning stays, the message gets stronger.", options: { color: NAVY, fontSize: 17 } },
  ], { x: MX + 0.75, y: 4.55, w: CW - 1.05, h: 1.4, fontFace: BODY_FONT, valign: "middle", lineSpacingMultiple: 1.1 });
}

/* ============================================================ 20 · BASIC STRUCTURE */
{
  const s = slide();
  eyebrowTitle(s, "Report structure", "What is the Basic Structure of a Report?");
  bigParas(s, [
    "Types of reports can vary greatly; they can range from an experimental report to an environmental impact statement. There is, however, a basic structure common to most reports, irrespective of their type.",
    "The major components of a general report are shown on the next slide — from the title page through to the appendices.",
  ], { y: 2.0, fontSize: 20 });
  addIcon(s, "book", W / 2 - 0.5, 4.6, 1.0, "#" + BORDER);
}

/* ============================================================ 21 · MAJOR COMPONENTS */
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
  ], { y: 1.62, colW: [2.9, 9.33], fontSize: 13.5, rowH: 0.56 });
}

/* ============================================================ 22 · TYPES OF REPORTS */
{
  const s = slide();
  eyebrowTitle(s, "Purpose & content of reports", "There Are Various Types of Reports");
  iconRows(s, [
    { icon: "chart", d: "A report of a sports match" },
    { icon: "shield", d: "A report of an accident to the Police or an insurance company" },
    { icon: "people", d: "A report of a social function, such as a wedding" },
    { icon: "document", d: "A news report about an accident, meeting or noteworthy incident" },
    { icon: "search", d: "A report of a commission of enquiry" },
    { icon: "briefcase", d: "A trade report" },
    { icon: "warning", d: "A company report or a Company Accident Report" },
    { icon: "award" in ICONS ? "award" : "chart", d: "An Annual Report by a Chairman or a Treasurer" },
    { icon: "database", d: "An internal report on a business related matter following an investigation or collection of data" },
  ], { y: 1.8, rowH: 0.56, fontSize: 16, iconSize: 0.34 });
}

/* ============================================================ 23 · 7 WORKED MODELS */
{
  const s = slide();
  eyebrowTitle(s, "Worked examples", "Investec Sample Reports — 7 Worked Models");
  s.addText("Use these models to practise matching report type, purpose, audience and recommended action.", {
    x: MX, y: 1.55, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: 16, color: GREY,
  });
  dataTable(s, ["No.", "Report type", "Investec systems support example"], [
    ["1", "Incident", "Online Banking login outage — immediate facts, impact, action taken and escalation"],
    ["2", "Incident", "Lost corporate laptop — data risk, containment and compliance notification"],
    ["3", "Investigation", "Repeated VPN disconnections — evidence, root cause and conclusion"],
    ["4", "Investigation", "Print-cost increase — data analysis, findings and controls"],
    ["5", "Project status", "Windows 11 pilot rollout — progress, risks, issues and next steps"],
    ["6", "Project status", "Branch Wi-Fi upgrade — milestone status and blockers"],
    ["7", "Recommendation", "Service desk knowledge base — proposed solution, cost and decision needed"],
  ], { y: 2.05, colW: [0.85, 2.5, 8.88], fontSize: 15, rowH: 0.62 });
}

/* ============================================================ 24–26 · SAMPLE PAIRS */
function samplePair(eyebrow, title, intro, icon, a, b) {
  const s = slide();
  eyebrowTitle(s, eyebrow, title);
  s.addText(intro, { x: MX, y: 1.55, w: CW, h: 0.45, fontFace: BODY_FONT, fontSize: 16.5, color: GREY });
  [a, b].forEach((it, i) => {
    const cy = 2.15 + i * 2.4;
    card(s, MX, cy, CW, 2.2, { fill: i % 2 ? LIGHT : WHITE });
    s.addShape(pptx.ShapeType.rect, { x: MX, y: cy, w: 0.09, h: 2.2, fill: { color: BLUE } });
    addIcon(s, icon, MX + 0.28, cy + 0.22, 0.42);
    s.addText([
      { text: it.t + "\n", options: { bold: true, color: NAVY, fontSize: 19, fontFace: TITLE_FONT } },
      { text: it.d, options: { color: NAVY, fontSize: 15.5, fontFace: BODY_FONT } },
    ], { x: MX + 0.9, y: cy + 0.14, w: CW - 1.2, h: 1.95, valign: "top", lineSpacingMultiple: 1.1 });
  });
  return s;
}

samplePair(
  "Worked examples · incident",
  "Sample Incident Reports",
  "Incident reports answer: What happened, who was affected, what immediate action was taken and what must happen next?",
  "warning",
  { t: "Online Banking login outage", d: "At 09:12 on 6 August 2026, monitoring reported elevated login failures. About 18% of attempted logins failed until 09:47 and the Service Desk logged 43 related calls. Action: escalate to Digital Channels Support, publish an internal advisory and monitor recovery after the authentication node restart." },
  { t: "Lost corporate laptop", d: "A Relationship Manager reported a lost encrypted laptop at 17:40 on 12 August 2026. IT Security initiated remote lock and wipe, disabled cached sessions and opened a compliance notification ticket. Follow-up: manager sign-off, replacement device and travel security refresher." }
);

samplePair(
  "Worked examples · investigation",
  "Sample Investigation Reports",
  "Investigation reports answer: What evidence was gathered, what caused the problem and what conclusion is supported by the facts?",
  "search",
  { t: "Repeated VPN disconnections", d: "Review of 28 VPN tickets, firewall logs, endpoint versions and interviews showed that affected laptops were running an outdated VPN client after a staged update failed on one device group. Conclusion: the root cause was incomplete deployment validation." },
  { t: "Print-cost increase", d: "Print management data showed a 32% cost increase on Sandton 5th-floor devices. Findings showed default colour printing was enabled after a driver update and secure-release settings were missing on two devices. Conclusion: print policy controls were removed during the update." }
);

samplePair(
  "Worked examples · project status",
  "Sample Project Status Reports",
  "Project status reports answer: Is the project on track against scope, time, cost, quality, risks and next milestones?",
  "chart",
  { t: "Windows 11 pilot rollout", d: "Overall status amber. Planned: 40 pilot laptops. Completed: 34 upgraded, 3 deferred for application compatibility and 3 awaiting user availability. Main risk: the treasury spreadsheet add-in is not yet certified. Next step: submit the phase 2 go/no-go recommendation." },
  { t: "Branch Wi-Fi upgrade", d: "Overall status green. Access points installed at 5 of 6 planned branches; the remaining branch is delayed by landlord access approval. Budget used: 71% against planned 75%. Next step: coverage tests and branch manager sign-off." }
);

/* ============================================================ 27 · RECOMMENDATION SAMPLE */
{
  const s = slide();
  eyebrowTitle(s, "Worked examples · recommendation", "Sample Recommendation Report");
  s.addText("Recommendation reports answer: Which option should management approve, why, by when, and at what cost or risk?", {
    x: MX, y: 1.55, w: CW, h: 0.45, fontFace: BODY_FONT, fontSize: 16.5, color: GREY,
  });
  card(s, MX, 2.15, CW, 1.0, { fill: LIGHT });
  s.addShape(pptx.ShapeType.rect, { x: MX, y: 2.15, w: 0.09, h: 1.0, fill: { color: BLUE } });
  s.addText([
    { text: "Service desk knowledge base:  ", options: { bold: true, color: NAVY, fontSize: 18, fontFace: TITLE_FONT } },
    { text: "Implement a searchable knowledge base for recurring support issues by 30 November 2026.", options: { color: NAVY, fontSize: 17 } },
  ], { x: MX + 0.3, y: 2.15, w: CW - 0.58, h: 1.0, fontFace: BODY_FONT, valign: "middle", lineSpacingMultiple: 1.08 });
  stackCards(s, [
    { icon: "chart", t: "Evidence", d: "Password resets, VPN setup, printer mapping and Teams audio issues account for 41% of first-line requests." },
    { icon: "check", t: "Recommended option", d: "Use the existing ITSM knowledge module because it avoids new licensing costs, supports approval workflows and links articles directly to tickets." },
    { icon: "people", t: "Approval requested", d: "Assign two analysts for article creation and require monthly review by team leads." },
  ], { y: 3.4, h: 3.3, fontSize: 15.5 });
}

/* ============================================================ 28 · RESOURCES */
{
  const s = slide();
  eyebrowTitle(s, "Obtaining & distributing information", "Resources for Getting Information");
  bigParas(s, [
    "Firstly, all information which is available in the organisation must always be seen as confidential information. When information is made available to competitors, they may gain the upper hand and copy concepts and ideas from the organisation — which could lead to serious financial implications.",
    "Information centres in the organisation — such as operations, finance, research and development, and human resources — will have information about the organisation and will be able to give an authorised individual all the information they may need.",
  ], { y: 2.0, fontSize: 19 });
  addIcon(s, "database", W / 2 - 0.5, 5.1, 1.0, "#" + BORDER);
}

/* ============================================================ 29 · SOURCED INFO */
{
  const s = slide();
  eyebrowTitle(s, "Obtaining & distributing information", "Information Sourced From the Organisation");
  s.addText("Information can include, but is not limited to:", {
    x: MX, y: 1.75, w: CW, h: 0.45, fontFace: BODY_FONT, fontSize: 17.5, color: GREY,
  });
  iconRows(s, [
    { icon: "chart", d: "Financial statements / reports" },
    { icon: "search", d: "Research and development activities" },
    { icon: "mail", d: "Marketing and advertising strategies" },
    { icon: "people", d: "Human resource needs / expectations" },
    { icon: "compass", d: "Company vision regarding the long-term expectations and future of the organisation" },
    { icon: "briefcase", d: "Project-specific information of certain aspects of projects undertaken by the organisation" },
  ], { y: 2.4, rowH: 0.72, fontSize: 17.5 });
}

/* ============================================================ 30 · DISTRIBUTING */
{
  const s = slide();
  eyebrowTitle(s, "Obtaining & distributing information", "Procedures for Distributing Information");
  bigParas(s, [
    "Distributing information about the organisation must be handled in a very delicate manner and the recipients of such information must be selected carefully.",
    "Depending on the severity of the information and the level of security and/or risk attached to it, recipients should be graded on whether or not they are liable to obtain such information.",
  ], { y: 1.75, h: 1.9, fontSize: 16.5 });
  stackCards(s, [
    { icon: "lock", t: "Be careful with sharing", d: "You must handle company information delicately and be very picky about who you send it to." },
    { icon: "key", t: "Check permission levels", d: "Before sharing anything sensitive or risky, check if the person has the right clearance or permission level to see it." },
    { icon: "target", t: "Share only what is needed", d: "Employees should only get information that they actually need to do their specific job." },
  ], { y: 3.75, h: 3.05, fontSize: 14.5 });
}

/* ============================================================ 31 · DISTRIBUTION MISTAKES */
{
  const s = slide();
  eyebrowTitle(s, "Obtaining & distributing information", "\u2716 What NOT to Do (Examples of Mistakes)");
  stackCards(s, [
    { icon: "mail", t: "Do not send to everyone", d: "Never blast a company-wide email containing private client data or financial reports." },
    { icon: "key", t: "Do not bypass security tiers", d: "Never give a junior staff member access to restricted server folders without official permission." },
    { icon: "dismiss", t: "Do not share irrelevant data", d: "Never send a software developer a file full of HR medical records just because they asked for a \u201csample file\u201d." },
  ], { y: 1.85, h: 4.7, fontSize: 16 });
}

/* ============================================================ 32 · SECURITY TABLE */
{
  const s = slide();
  eyebrowTitle(s, "Obtaining & distributing information", "Security Practice — Avoid vs Use");
  dataTable(s, ["Poor Security Practice (Avoid)", "Correct Security Practice (Use)", "Why the Correct Way Matters"], [
    ["Emailing a database password to a teammate over unsecure chat.", "Storing the password in an encrypted vault with restricted access.", "Keeps data safe and limits who can view it."],
    ["Giving all employees admin rights to the entire network.", "Using the \u201cPrinciple of Least Privilege\u201d (giving only required access).", "Prevents accidental data leaks or virus spreads."],
    ["Sharing full client profiles with a third-party vendor.", "Sending only the specific, anonymized data needed for the project.", "Protects privacy and follows strict security laws."],
  ], { y: 2.0, colW: [4.1, 4.4, 3.73], fontSize: 14.5, rowH: 1.1 });
}

/* ============================================================ 33 · VERIFYING */
{
  const s = slide();
  eyebrowTitle(s, "Verifying reported information", "Verifying Reported Information");
  bigParas(s, [
    "Before any report is sent to a person who will proof it and ensure it is correct, the originator is required to double-check that all the information given in the report is in line with the stipulated requirements of both the target audience and the required outcomes of the report.",
  ], { y: 1.75, h: 1.15, fontSize: 15.5 });
  stackCards(s, [
    { icon: "eye", t: "Double-check your work first", d: "Before you hand your report to anyone else, you must verify that it matches what the audience wants and hits the main goals." },
    { icon: "people", t: "Get a coworker to check it", d: "Have another person read your report using the project checklist to find mistakes, missing facts, or unfair opinions." },
    { icon: "clock", t: "Send it to your boss early", d: "Give the report to your department head for final approval at least one week early so they have time to give feedback." },
    { icon: "shield", t: "Follow company rules", d: "Stick to the official company steps for gathering and sharing data so your report has just the right amount of information." },
  ], { y: 3.0, h: 3.85, fontSize: 14 });
}

/* ============================================================ 34 · VERIFICATION MISTAKES */
{
  const s = slide();
  eyebrowTitle(s, "Verifying reported information", "\u2716 What NOT to Do (Examples of Mistakes)");
  stackCards(s, [
    { icon: "eye", t: "Do not skip your own review", d: "Never write a report and hand it over immediately without reading through it yourself first." },
    { icon: "list", t: "Do not ask for a blind review", d: "Never give a report to a teammate without giving them the project guidelines or checklist to compare it against." },
    { icon: "clock", t: "Do not submit at the last minute", d: "Never send a report to your manager the night before it is due, leaving them no time to review or fix it." },
    { icon: "dismiss", t: "Do not make up your own process", d: "Never use unverified channels or unapproved formats to collect your data." },
  ], { y: 1.85, h: 4.85, fontSize: 15 });
}

/* ============================================================ 35 · REVIEW WORKFLOW TABLE */
{
  const s = slide();
  eyebrowTitle(s, "Verifying reported information", "Review Workflow — Avoid vs Use");
  dataTable(s, ["Bad Workflow Practice (Avoid)", "Correct Review Practice (Use)", "Why the Correct Way Matters"], [
    ["Sending an incident report directly to a bank client immediately after typing it.", "Having a senior engineer peer-review the technical logs and facts first.", "Catches wrong technical details before the client sees them."],
    ["Emailing a budget request to the executive board without checking it against the quarterly goals.", "Double-checking that the requested software licenses align perfectly with the target audience's project requirements.", "Ensures the proposal meets the exact business needs."],
    ["Asking your department head to sign off on a system migration plan 10 minutes before deployment.", "Submitting the migration document to the department head 7 days before the change window.", "Allows time to add missing steps or make critical adjustments."],
  ], { y: 2.0, colW: [4.1, 4.4, 3.73], fontSize: 14, rowH: 1.25 });
}

/* ============================================================ 36 · ACTIVITY */
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
    s.addText(String(i + 1), { x: MX, y: cy, w: 0.5, h: 0.5, fontFace: TITLE_FONT, fontSize: 18, bold: true, color: WHITE, align: "center", valign: "middle" });
    s.addText(t, { x: MX + 0.72, y: cy - 0.05, w: CW - 0.9, h: 0.62, fontFace: BODY_FONT, fontSize: 17.5, color: NAVY, valign: "middle" });
  });
}

/* ============================================================ 37 · SELF-ASSESSMENT */
{
  const s = slide();
  eyebrowTitle(s, "Self-assessment", "Self-Assessment — Be Honest With Yourself");
  s.addText("Tick the box with a \u2713 or an \u2717 to indicate your response.", {
    x: MX, y: 1.55, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: 16, color: GREY,
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
    s.addText(t, { x: MX + 0.66, y: cy - 0.03, w: CW - 0.9, h: 0.62, fontFace: BODY_FONT, fontSize: 16.5, color: NAVY, valign: "middle" });
  });
  card(s, MX, 5.9, CW, 1.0, { fill: LIGHT });
  addIcon(s, "target", MX + 0.25, 6.15, 0.36);
  s.addText(
    "Think about any point you could not tick. Write it down as a goal, decide on a plan of action to achieve it, and review your goals regularly.",
    { x: MX + 0.75, y: 6.0, w: CW - 1.05, h: 0.8, fontFace: BODY_FONT, fontSize: 16, color: NAVY, valign: "middle", lineSpacingMultiple: 1.1 }
  );
}

const OUT = "public/downloads/LearnerManual.pptx";
await pptx.writeFile({ fileName: OUT });
console.log("Wrote", OUT, "with", pageNo, "slides");
