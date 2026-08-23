// Generates the US 114050 Lesson 4 deck (the relationship between a business and
// its data / information needs) in the same Microsoft Fluent / Learn style.
// Accessibility rule: NO text below 18pt.
// Run: node scripts/make-114050-l4-ppt.mjs -> public/downloads/US-114050-L4-Business-Information-Needs.pptx
import pptxgen from "pptxgenjs";
import { mkdirSync } from "node:fs";

const BLUE = "0F6CBD";
const NAVY = "002050";
const LIGHT = "EAF4FF";
const GREY = "6B7280";
const WHITE = "FFFFFF";
const BORDER = "D5E3F2";
const DARK_LABEL = "8CC2F0";
const DARK_SUB = "B9D6F2";
const DARK_MUTED = "6E93BC";

const TITLE_FONT = "Aptos Display";
const BODY_FONT = "Aptos";
const MIN_FONT = 18;

const W = 13.33;
const H = 7.5;
const MX = 0.55;
const CW = W - MX * 2;

const SHADOW = { type: "outer", angle: 90, blur: 7, offset: 2, color: "9AB4CC", opacity: 0.3 };

const ICONS = {
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="0.8"/>',
  briefcase: '<rect x="3.5" y="7" width="17" height="13" rx="1.8"/><path d="M9 7V5.6A1.6 1.6 0 0 1 10.6 4h2.8A1.6 1.6 0 0 1 15 5.6V7M3.5 12h17"/>',
  check: '<circle cx="12" cy="12" r="8.5"/><path d="m8.3 12.4 2.5 2.5 4.9-5.3"/>',
  folder: '<path d="M3.5 6.5A1.5 1.5 0 0 1 5 5h4l2 2.5h8A1.5 1.5 0 0 1 20.5 9v9a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18z"/>',
  people: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5"/><circle cx="16.8" cy="9.2" r="2.4"/><path d="M16.3 14.7c2.2.2 3.8 1.5 4.3 4.3"/>',
  person: '<circle cx="12" cy="8" r="3.6"/><path d="M4.8 20c.8-3.7 3.6-5.6 7.2-5.6s6.4 1.9 7.2 5.6"/>',
  shield: '<path d="M12 3l7 2.8v5.4c0 4.5-3 7.9-7 9.8-4-1.9-7-5.3-7-9.8V5.8z"/><path d="m9.2 11.8 2 2 3.6-4"/>',
  pen: '<path d="M4 20l1-4L16.5 4.5a2.12 2.12 0 0 1 3 3L8 19l-4 1z"/><path d="m14.5 6.5 3 3"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.2 2"/>',
  chart: '<path d="M4 4v16h16"/><path d="M8 16v-5M12 16V7M16 16v-8"/>',
  book: '<path d="M4 19.5v-14A2.5 2.5 0 0 1 6.5 3H20v18H6.5a2.5 2.5 0 0 1-2.5-2.5zm0 0A2.5 2.5 0 0 1 6.5 17H20"/>',
  document: '<path d="M6.5 3.5h7.2l4.8 4.8V19a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 19z"/><path d="M13.5 3.5v5h5M9.5 12.5h5M9.5 15.5h5"/>',
  chat: '<path d="M4 6.2A2.2 2.2 0 0 1 6.2 4h11.6A2.2 2.2 0 0 1 20 6.2v8.1a2.2 2.2 0 0 1-2.2 2.2H12l-4.5 3.6v-3.6H6.2A2.2 2.2 0 0 1 4 14.3z"/><path d="M8 9h8M8 12h5"/>',
  gradcap: '<path d="m12 4 10 4.5L12 13 2 8.5z"/><path d="M6.5 10.8v4.4c0 1.2 2.5 2.6 5.5 2.6s5.5-1.4 5.5-2.6v-4.4"/><path d="M22 8.5v5"/>',
  trend: '<path d="m3.5 17 5.5-5.5 3.5 3.5 7.5-7.5"/><path d="M15 7.5h5v5"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.3"/><path d="m15.5 15.5 5 5"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.3 4 5.2 4 8.5s-1.4 6.2-4 8.5c-2.6-2.3-4-5.2-4-8.5s1.4-6.2 4-8.5z"/>',
  design: '<circle cx="12" cy="12" r="8.5"/><path d="m14.8 9.2-1.7 4.5-4.5 1.7 1.7-4.5z"/>',
  dashboard: '<rect x="3.5" y="3.5" width="7.3" height="7.3" rx="1.2"/><rect x="13.2" y="3.5" width="7.3" height="7.3" rx="1.2"/><rect x="3.5" y="13.2" width="7.3" height="7.3" rx="1.2"/><rect x="13.2" y="13.2" width="7.3" height="7.3" rx="1.2"/>',
  layers: '<path d="M12 3.5l8.5 4.7L12 12.9 3.5 8.2z"/><path d="m3.5 12.4 8.5 4.7 8.5-4.7"/><path d="m3.5 16.3 8.5 4.7 8.5-4.7"/>',
  database: '<ellipse cx="12" cy="5.5" rx="7.5" ry="2.8"/><path d="M4.5 5.5v13c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8v-13"/><path d="M4.5 12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8"/>',
  network: '<circle cx="12" cy="5" r="2.5"/><circle cx="5.5" cy="18" r="2.5"/><circle cx="18.5" cy="18" r="2.5"/><path d="M12 7.5v4M12 11.5 6.8 16M12 11.5l5.2 4.5"/>',
  lock: '<rect x="5.5" y="10.5" width="13" height="9.5" rx="1.6"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
  scissors: '<circle cx="6.5" cy="6.5" r="2.5"/><circle cx="6.5" cy="17.5" r="2.5"/><path d="M8.6 8.2 20 19M8.6 15.8 20 5"/>',
  type: '<path d="M5 6V4.5h14V6M12 4.5v15M9.5 19.5h5"/>',
  play: '<circle cx="12" cy="12" r="8.5"/><path d="M10 8.5v7l5.5-3.5z"/>',
  monitor: '<rect x="3" y="4.5" width="18" height="12" rx="1.5"/><path d="M9.5 20h5M12 16.5V20"/>',
  print: '<path d="M7 8V3.5h10V8M7 17H4.5v-7A1.5 1.5 0 0 1 6 8.5h12a1.5 1.5 0 0 1 1.5 1.5v7H17"/><rect x="7" y="14" width="10" height="6.5" rx="0.8"/>',
  cloud: '<path d="M7 18.5a4.5 4.5 0 0 1-.5-8.97A6 6 0 0 1 18.2 11a3.75 3.75 0 0 1-.7 7.5z"/>',
};

function iconUri(name, color = "#" + BLUE, sw = 1.4) {
  const body = ICONS[name];
  if (!body) throw new Error(`Unknown icon: ${name}`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  return "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
}

const pptx = new pptxgen();
pptx.defineLayout({ name: "WIDE", width: W, height: H });
pptx.layout = "WIDE";
pptx.author = "Andre Snell";
pptx.company = "Investec — Corporate Banking Technology";
pptx.title = "US 114050 Lesson 4 — The relationship between a business and its data requirements";

let pageNo = 0;

function slide() {
  const s = pptx.addSlide();
  s.background = { color: WHITE };
  pageNo += 1;
  if (pageNo > 1) {
    s.addText("US 114050 · Lesson 4 — The business and its information needs · NQF 5", {
      x: MX, y: H - 0.5, w: CW - 1, h: 0.38, fontFace: BODY_FONT, fontSize: MIN_FONT, color: GREY,
    });
    s.addText(String(pageNo), { x: W - MX - 0.7, y: H - 0.5, w: 0.7, h: 0.38, fontFace: BODY_FONT, fontSize: MIN_FONT, color: GREY, align: "right" });
    s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.09, fill: { color: BLUE } });
  }
  return s;
}

function addIcon(s, name, x, y, size = 0.34, color) {
  s.addImage({ data: iconUri(name, color), x, y, w: size, h: size });
}

function eyebrowTitle(s, eyebrow, title) {
  s.addText(eyebrow.toUpperCase(), { x: MX, y: 0.26, w: CW, h: 0.38, fontFace: BODY_FONT, fontSize: MIN_FONT, bold: true, color: BLUE, charSpacing: 2 });
  s.addText(title, { x: MX, y: 0.64, w: CW, h: 0.66, fontFace: TITLE_FONT, fontSize: 30, bold: true, color: NAVY });
}

function card(s, x, y, w, h, { fill = WHITE, line = BORDER } = {}) {
  s.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.09, fill: { color: fill }, line: { color: line, width: 1 }, shadow: { ...SHADOW } });
}

function iconCards(s, items, { x = MX, y = 2.0, w = CW, cols = 4, rowH = 1.6, gap = 0.2, fontSize = MIN_FONT, titleSize = 20 } = {}) {
  const cw = (w - gap * (cols - 1)) / cols;
  items.forEach((it, i) => {
    const cx = x + (i % cols) * (cw + gap);
    const cy = y + Math.floor(i / cols) * (rowH + gap);
    card(s, cx, cy, cw, rowH);
    if (it.d) {
      addIcon(s, it.icon, cx + 0.18, cy + 0.2, 0.38);
      s.addText(it.text, {
        x: cx + 0.66, y: cy + 0.12, w: cw - 0.84, h: 0.85, fontFace: TITLE_FONT, fontSize: titleSize, bold: true, color: NAVY, valign: "middle", lineSpacingMultiple: 1.0,
      });
      s.addText(it.d, {
        x: cx + 0.18, y: cy + 1.02, w: cw - 0.36, h: rowH - 1.16, fontFace: BODY_FONT, fontSize, color: GREY, valign: "top", lineSpacingMultiple: 1.1,
      });
    } else {
      addIcon(s, it.icon, cx + 0.18, cy + rowH / 2 - 0.19, 0.38);
      s.addText(it.text, {
        x: cx + 0.68, y: cy + 0.08, w: cw - 0.86, h: rowH - 0.16, fontFace: BODY_FONT, fontSize, color: NAVY, valign: "middle", lineSpacingMultiple: 1.05,
      });
    }
  });
}

/** Cards with a real picture on top (tool logos / artwork), title + description below. */
function imageCards(s, items, { x = MX, y = 1.7, w = CW, cols = 3, rowH = 2.3, gap = 0.2, imgH = 1.0, fontSize = MIN_FONT, titleSize = 20 } = {}) {
  const cw = (w - gap * (cols - 1)) / cols;
  items.forEach((it, i) => {
    const cx = x + (i % cols) * (cw + gap);
    const cy = y + Math.floor(i / cols) * (rowH + gap);
    card(s, cx, cy, cw, rowH);
    s.addImage({ path: it.img, x: cx + 0.25, y: cy + 0.18, w: cw - 0.5, h: imgH, sizing: { type: "contain", w: cw - 0.5, h: imgH } });
    s.addText(it.text, {
      x: cx + 0.18, y: cy + imgH + 0.24, w: cw - 0.36, h: 0.42, fontFace: TITLE_FONT, fontSize: titleSize, bold: true, color: NAVY, valign: "top", lineSpacingMultiple: 1.0,
    });
    s.addText(it.d, {
      x: cx + 0.18, y: cy + imgH + 0.66, w: cw - 0.36, h: rowH - imgH - 0.8, fontFace: BODY_FONT, fontSize, color: GREY, valign: "top", lineSpacingMultiple: 1.08,
    });
  });
}

function introText(s, text, y = 1.4, h = 0.68) {
  s.addText(text, { x: MX, y, w: CW, h, fontFace: BODY_FONT, fontSize: MIN_FONT, color: GREY, valign: "top", lineSpacingMultiple: 1.15 });
}

function dataTable(s, header, rows, { x = MX, y = 2.0, w = CW, colW, fontSize = MIN_FONT, rowH = 0.55 } = {}) {
  const tableRows = [
    header.map((t) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: BLUE }, fontFace: TITLE_FONT, fontSize } })),
    ...rows.map((r, i) => r.map((c) => ({ text: c, options: { color: NAVY, fill: { color: i % 2 ? LIGHT : WHITE }, fontFace: BODY_FONT, fontSize } }))),
  ];
  s.addTable(tableRows, { x, y, w, colW, border: { type: "solid", color: BORDER, pt: 0.75 }, rowH, valign: "middle", margin: 0.09 });
}

function bulletList(s, items, { x = MX, y = 1.7, w = CW, h = 5.0, fontSize = MIN_FONT } = {}) {
  s.addText(
    items.map((t) => ({ text: t, options: { bullet: { characterCode: "2022", indent: 16 }, color: NAVY, breakLine: true } })),
    { x, y, w, h, fontFace: BODY_FONT, fontSize, valign: "top", lineSpacingMultiple: 1.2, paraSpaceAfter: 10 }
  );
}

function strip(s, label, text, { y = 5.35, h = 1.3 } = {}) {
  card(s, MX, y, CW, h, { fill: LIGHT });
  s.addText(label.toUpperCase(), { x: MX + 0.25, y: y + 0.14, w: CW - 0.5, h: 0.36, fontFace: BODY_FONT, fontSize: MIN_FONT, bold: true, color: BLUE, charSpacing: 1 });
  s.addText(text, { x: MX + 0.25, y: y + 0.52, w: CW - 0.5, h: h - 0.66, fontFace: BODY_FONT, fontSize: MIN_FONT, color: NAVY, lineSpacingMultiple: 1.12, valign: "top" });
}

/* ============================================================= COVER */
{
  const s = slide();
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.12, fill: { color: BLUE } });
  s.addShape(pptx.ShapeType.roundRect, { x: MX, y: 1.1, w: 5.9, h: 0.62, rectRadius: 0.31, fill: { color: BLUE } });
  s.addText("US 114050 · LESSON 4 · NQF LEVEL 5", { x: MX, y: 1.1, w: 5.9, h: 0.62, fontFace: BODY_FONT, fontSize: MIN_FONT, bold: true, color: WHITE, align: "center", valign: "middle", charSpacing: 1 });
  s.addText("The Relationship between a Business and its Information Needs", { x: MX, y: 1.9, w: 10.8, h: 1.85, fontFace: TITLE_FONT, fontSize: 38, bold: true, color: NAVY });
  s.addText("From data to wisdom — how a business gathers data, turns it into information, uses it in its roles, and protects it from threats", { x: MX, y: 3.8, w: 9.7, h: 0.75, fontFace: BODY_FONT, fontSize: 19, color: GREY, lineSpacingMultiple: 1.15 });
  addIcon(s, "database", 11.0, 1.4, 1.8, "#" + BORDER);
  s.addShape(pptx.ShapeType.line, { x: MX, y: 4.62, w: CW, h: 0, line: { color: BORDER, width: 1 } });
  const meta = [
    ["TIME", "90 minutes · Self & Group"],
    ["SESSION", "Thursday, 27 Aug 2026 · 09h00 – 14h00"],
    ["MODULE", "Module 1 · Professional Team Development"],
    ["QUALITY ASSURANCE", "QCTO / MICT SETA"],
  ];
  meta.forEach(([k, v], i) => {
    const x = MX + i * (CW / 4);
    s.addText(k, { x, y: 4.82, w: CW / 4 - 0.2, h: 0.36, fontFace: BODY_FONT, fontSize: MIN_FONT, bold: true, color: BLUE, charSpacing: 1 });
    s.addText(v, { x, y: 5.2, w: CW / 4 - 0.2, h: 1.0, fontFace: BODY_FONT, fontSize: MIN_FONT, color: NAVY, lineSpacingMultiple: 1.1 });
  });
  s.addText("ITSS Learn · Investec · Corporate Banking Technology", { x: MX, y: H - 0.62, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: MIN_FONT, color: GREY });
}

/* ============================================================= ACKOFF */
{
  const s = slide();
  eyebrowTitle(s, "From data to wisdom", "Ackoff's five categories of the human mind");
  introText(s, "According to Russell Ackoff, systems theorist and professor of organisational change:", 1.4, 0.4);
  iconCards(s, [
    { icon: "database", text: "Data", d: "Symbols — raw facts with no significance beyond their existence." },
    { icon: "chart", text: "Information", d: "Data processed to be useful — answers who, what, where, when." },
    { icon: "book", text: "Knowledge", d: "Application of data and information — answers how." },
    { icon: "search", text: "Understanding", d: "Appreciation of why — carries each level to the next." },
    { icon: "gradcap", text: "Wisdom", d: "Evaluated understanding — vision and design." },
  ], { y: 2.0, cols: 3, rowH: 1.85 });
  strip(s, "Past and future", "The first four categories deal with the past — what has been or what is known. Only wisdom deals with the future; people must move successively through the other categories to reach it.", { y: 5.95, h: 1.15 });
}

/* ============================================================= DATA & INFO */
{
  const s = slide();
  eyebrowTitle(s, "The first two levels", "Data and information");
  iconCards(s, [
    { icon: "database", text: "Data is raw", d: "It simply exists — usable or not — and has no meaning of itself. In computer terms, a spreadsheet generally starts out by holding data." },
    { icon: "chart", text: "Information has meaning", d: "Data given meaning by relational connection. In computer terms, a relational database makes information from the data stored within it." },
  ], { y: 1.7, cols: 2, rowH: 2.35 });
  strip(s, "The weather example", "Data: \u201cIt is raining.\u201d  ·  Information: \u201cThe temperature dropped 15 degrees and then it started raining\u201d — a relationship, possibly cause and effect.", { y: 4.5, h: 1.3 });
}

/* ============================================================= KNOWLEDGE / UNDERSTANDING / WISDOM */
{
  const s = slide();
  eyebrowTitle(s, "The higher levels", "Knowledge, understanding and wisdom");
  iconCards(s, [
    { icon: "book", text: "Knowledge", d: "The appropriate collection of information — memorised, deterministic. The times table answers 2 \u00d7 2, but not 1267 \u00d7 300." },
    { icon: "search", text: "Understanding", d: "Cognitive and analytical — synthesises NEW knowledge from what is known. Learning, not memorising. AI systems (2026: Copilot, Gemini) do this at scale." },
    { icon: "gradcap", text: "Wisdom", d: "Extrapolative, non-deterministic. Calls on moral and ethical codes; judges right from wrong. The authors: computers will never possess it." },
  ], { y: 1.7, cols: 3, rowH: 2.6 });
  strip(s, "The weather example, continued", "Knowledge: high humidity + a sharp temperature drop usually means rain. Wisdom is systemic: \u201cit rains because it rains\u201d — grasping all the interactions between evaporation, air currents and temperature gradients.", { y: 4.75, h: 1.4 });
}

/* ============================================================= PATTERN OR NOISE */
{
  const s = slide();
  eyebrowTitle(s, "A test", "When is a pattern knowledge — and when is it noise?");
  bulletList(s, [
    "\u201cAbugt dbesbt regtc uatn s uitrzt\u2026\u201d — 100% novelty. To you it is noise; there is no foundation to connect with the pattern. Yet translated, these are Newton's three laws of motion.",
    "Is something knowledge if you can't understand it?",
    "Now: a heavy 3\u00d73\u00d76 box with a door, food inside, colder inside than out, usually in the kitchen, ice compartment, light when it opens, dirt underneath, junk on top\u2026",
    "A refrigerator — at some point you connected with the pattern, and every further statement only confirmed it. In a society without refrigerators, it stays a riddle.",
  ], { y: 1.6, h: 3.7 });
  strip(s, "The point for business", "Information only becomes knowledge when the receiver can connect it to a pattern they understand — present information in the language and context of its users, or it is noise.", { y: 5.5, h: 1.25 });
}

/* ============================================================= DECISION MAKING */
{
  const s = slide();
  eyebrowTitle(s, "Communication in decision making", "From information to a final choice");
  bulletList(s, [
    "Decision making is the cognitive process leading to the selection of a course of action among variations — every process produces a final choice: an action or an opinion.",
    "It begins when we need to do something but know not what — a reasoning process, rational or irrational, on explicit or tacit assumptions.",
    "Structured, rational decisions drive science-based professions — e.g. medical diagnosis, then treatment selection.",
    "Under time pressure, high stakes or ambiguity, experts decide intuitively: recognition-primed decisions fit the indicators into experience and arrive immediately at a satisfactory course of action.",
    "Robust-decision approaches formally integrate uncertainty into the process.",
  ], { y: 1.6, h: 4.8 });
}

/* ============================================================= PRICE CONTROL */
{
  const s = slide();
  eyebrowTitle(s, "Using the information", "Price control");
  iconCards(s, [
    { icon: "trend", text: "Free price system", d: "Prices set by supply and demand — signals between producers and consumers that ration supplies, distribute income and allocate resources." },
    { icon: "lock", text: "Controlled price system", d: "Prices set by government within a controlled market or planned economy." },
  ], { y: 1.7, cols: 2, rowH: 2.3 });
  strip(s, "In the organisation", "Your prices are largely governed by what competitors charge for similar products. Pricing, costing and manufacturing must communicate so goods sell at the same or better price than competitors.", { y: 4.45, h: 1.35 });
}

/* ============================================================= QUALITY CONTROL */
{
  const s = slide();
  eyebrowTitle(s, "Using the information", "Quality control and PDCA");
  introText(s, "Quality systems ensure products and services meet or exceed customer requirements — \u201cfit for purpose\u201d, \u201cdo it right the first time\u201d. QA covers design through documentation.", 1.4, 0.72);
  iconCards(s, [
    { icon: "target", text: "Plan", d: "Decide the objective and the process to deliver it." },
    { icon: "check", text: "Do", d: "Carry out the plan; collect data along the way." },
    { icon: "search", text: "Check", d: "Measure results against the expected outcome." },
    { icon: "shield", text: "Act", d: "Correct differences; standardise what worked." },
  ], { y: 2.3, cols: 4, rowH: 1.95 });
  strip(s, "Communication", "Competitors' items are checked and measured against the organisation's own quality — that comparison depends on communication.", { y: 4.6, h: 1.2 });
}

/* ============================================================= MARKETING & BPM */
{
  const s = slide();
  eyebrowTitle(s, "Using the information", "Marketing and business performance");
  iconCards(s, [
    { icon: "people", text: "Marketing", d: "R&D meets sales & marketing so new products are fully understood, then marketed to consumers. Two-way: client surveys flow back to R&D to build what customers request." },
    { icon: "chart", text: "Business performance (BPM)", d: "Processes that organise, automate and analyse the metrics, processes and systems driving performance — the next generation of business intelligence (BI)." },
  ], { y: 1.7, cols: 2, rowH: 2.6 });
  strip(s, "Growth through communication", "Analyse the performing areas, understand the tools that work, and apply them where the business performs less well. All views, opinions and input are needed for educated decisions.", { y: 4.75, h: 1.3 });
}

/* ============================================================= THREATS */
{
  const s = slide();
  eyebrowTitle(s, "Protecting the information", "Three threats you must be able to explain");
  iconCards(s, [
    { icon: "lock", text: "Unauthorised access", d: "Hackers or insiders reading data they have no right to see. Defend: passwords + MFA, per-role access rights, encryption — POPIA makes it a legal duty." },
    { icon: "shield", text: "Viruses & malware", d: "Software that corrupts, steals or destroys data — in 2026 above all ransomware via phishing email. Defend: antivirus, patches, backups, cautious staff." },
    { icon: "person", text: "Disgruntled staff", d: "Insiders who deliberately damage, leak or delete data. Defend: least-privilege access, audit trails, remove access the day someone leaves." },
  ], { y: 1.75, cols: 3, rowH: 2.9 });
}

/* ============================================================= SUB-SYSTEMS */
{
  const s = slide();
  eyebrowTitle(s, "Who needs what", "The information needs of the sub-systems");
  dataTable(s, ["Sub-system", "Information it needs"], [
    ["HR (employment)", "Employee records, contracts, leave and attendance, payslips, performance reviews"],
    ["Production (manufacture)", "Orders, raw-material stock, production schedules, quality measurements"],
    ["Marketing (branding)", "Brand assets, campaign results, customer feedback and survey data"],
    ["Financial (cash flow)", "Invoices, payments, debtors and creditors, cash-flow forecasts, budgets"],
  ], { y: 2.0, colW: [3.4, 8.83], rowH: 0.85 });
}

/* ============================================================= YOUR WORK */
{
  const s = slide();
  eyebrowTitle(s, "Now prove it", "Your work for Lesson 4");
  iconCards(s, [
    { icon: "chat", text: "Questioning session", d: "90 minutes · Self & Group — all 14 questions: data, information, the five roles, the three threats and the four sub-systems. AI-marked." },
    { icon: "dashboard", text: "Slide quizzes", d: "Every section gates on its five questions — all correct unlocks Next." },
    { icon: "check", text: "Self assessment", d: "\u201cI am able to explain the relationship between a business and its data requirements\u201d — tick it honestly, or write it down as a goal." },
    { icon: "folder", text: "Logbook project — Research", d: "Your IT-in-business research project also evidences this outcome. Mark it 114050." },
  ], { y: 1.75, cols: 2, rowH: 2.35 });
}

/* ============================================================= CLOSING */
{
  const s = slide();
  s.background = { color: NAVY };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.12, fill: { color: BLUE } });
  addIcon(s, "gradcap", MX, 1.6, 0.7, "#" + DARK_LABEL);
  s.addText("Data is raw. Information has meaning. Wisdom stays human.", {
    x: MX, y: 2.45, w: CW, h: 1.4, fontFace: TITLE_FONT, fontSize: 36, bold: true, color: WHITE,
  });
  s.addText("Data \u2192 information \u2192 knowledge \u2192 understanding \u2192 wisdom · decisions, price control, quality (PDCA), marketing and BPM · guard it against unauthorised access, malware and insiders · give HR, Production, Marketing and Finance the information they need.", {
    x: MX, y: 3.95, w: 11.0, h: 1.4, fontFace: BODY_FONT, fontSize: MIN_FONT, color: DARK_SUB, lineSpacingMultiple: 1.2,
  });
  s.addText("US 114050 · National Certificate: IT — System Support · SAQA ID 48573 · ITSS Learn", {
    x: MX, y: H - 0.62, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: MIN_FONT, color: DARK_MUTED,
  });
}

mkdirSync("public/downloads", { recursive: true });
const OUT = "public/downloads/US-114050-L4-Business-Information-Needs.pptx";
await pptx.writeFile({ fileName: OUT });
console.log(`Written ${OUT} — ${pageNo} slides (min font ${MIN_FONT}pt)`);
