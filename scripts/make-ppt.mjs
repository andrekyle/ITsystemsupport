// Generates the US 8252 facilitator training deck (Microsoft Fluent / Learn style).
// Run: node scripts/make-ppt.mjs           -> blue/white deck
//      node scripts/make-ppt.mjs --mono    -> black & white deck with grey accents
import pptxgen from "pptxgenjs";
import { mkdirSync } from "node:fs";

const MONO = process.argv.includes("--mono");

const BLUE = MONO ? "3D3D3D" : "0F6CBD"; // primary accent
const NAVY = MONO ? "141414" : "002050"; // dark surface / headings
const LIGHT = MONO ? "F2F2F2" : "EAF4FF"; // light fill
const GREY = "6B7280";
const WHITE = "FFFFFF";
const BORDER = MONO ? "DBDBDB" : "D5E3F2";
// accents used on dark (navy/black) backgrounds
const DARK_LABEL = MONO ? "C9C9C9" : "8CC2F0"; // labels + icons on dark
const DARK_SUB = MONO ? "CFCFCF" : "B9D6F2"; // subtitles on dark
const DARK_MUTED = MONO ? "8F8F8F" : "6E93BC"; // footers on dark
const DARK_LINE = MONO ? "3F3F3F" : "1B4272"; // rules/watermarks on dark

const TITLE_FONT = "Aptos Display";
const BODY_FONT = "Aptos";

const W = 13.33;
const H = 7.5;
const MX = 0.55; // side margin
const CW = W - MX * 2; // content width

const SHADOW = { type: "outer", angle: 90, blur: 7, offset: 2, color: MONO ? "BDBDBD" : "9AB4CC", opacity: 0.3 };

/* Thin-stroke Fluent-style icon set (SVG, embedded as images) */
const ICONS = {
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="0.8"/>',
  question: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.2a2.4 2.4 0 1 1 3.3 2.2c-.8.33-1.3 1-1.3 1.8v.4"/><path d="M11.6 16.6h.05"/>',
  briefcase: '<rect x="3.5" y="7" width="17" height="13" rx="1.8"/><path d="M9 7V5.6A1.6 1.6 0 0 1 10.6 4h2.8A1.6 1.6 0 0 1 15 5.6V7M3.5 12h17"/>',
  check: '<circle cx="12" cy="12" r="8.5"/><path d="m8.3 12.4 2.5 2.5 4.9-5.3"/>',
  dismiss: '<circle cx="12" cy="12" r="8.5"/><path d="m9 9 6 6M15 9l-6 6"/>',
  database: '<ellipse cx="12" cy="5.5" rx="7" ry="2.5"/><path d="M5 5.5v13c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-13"/><path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5"/>',
  server: '<rect x="4" y="4" width="16" height="6.4" rx="1.4"/><rect x="4" y="13.6" width="16" height="6.4" rx="1.4"/><path d="M7.2 7.2h.05M7.2 16.8h.05"/>',
  folder: '<path d="M3.5 6.5A1.5 1.5 0 0 1 5 5h4l2 2.5h8A1.5 1.5 0 0 1 20.5 9v9a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18z"/>',
  people: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5"/><circle cx="16.8" cy="9.2" r="2.4"/><path d="M16.3 14.7c2.2.2 3.8 1.5 4.3 4.3"/>',
  shield: '<path d="M12 3l7 2.8v5.4c0 4.5-3 7.9-7 9.8-4-1.9-7-5.3-7-9.8V5.8z"/><path d="m9.2 11.8 2 2 3.6-4"/>',
  layers: '<path d="M12 3.5l8.5 4.7L12 12.9 3.5 8.2z"/><path d="m3.5 12.4 8.5 4.7 8.5-4.7"/><path d="m3.5 16.3 8.5 4.7 8.5-4.7"/>',
  pen: '<path d="M4 20l1-4L16.5 4.5a2.12 2.12 0 0 1 3 3L8 19l-4 1z"/><path d="m14.5 6.5 3 3"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.2 2"/>',
  chart: '<path d="M4 4v16h16"/><path d="M8 16v-5M12 16V7M16 16v-8"/>',
  award: '<circle cx="12" cy="9" r="5"/><path d="M8.8 13.2 7.5 20l4.5-2.5L16.5 20l-1.3-6.8"/>',
  book: '<path d="M4 19.5v-14A2.5 2.5 0 0 1 6.5 3H20v18H6.5a2.5 2.5 0 0 1-2.5-2.5zm0 0A2.5 2.5 0 0 1 6.5 17H20"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  document: '<path d="M6.5 3.5h7.2l4.8 4.8V19a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 19z"/><path d="M13.5 3.5v5h5M9.5 12.5h5M9.5 15.5h5"/>',
  compass: '<circle cx="12" cy="12" r="8.5"/><path d="m14.8 9.2-1.7 4.5-4.5 1.7 1.7-4.5z"/>',
};

function iconUri(name, color = "#" + BLUE, sw = 1.4) {
  const body = ICONS[name];
  if (!body) throw new Error(`Unknown icon: ${name}`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
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
pptx.title = "US 8252 — Compile and Produce Reports";

let pageNo = 0;

function slide() {
  const s = pptx.addSlide();
  s.background = { color: WHITE };
  pageNo += 1;
  if (pageNo > 1) {
    s.addText(`Unit Standard 8252 — Compile and Produce Reports   ·   Investec IT Systems Support NQF 5`, {
      x: MX, y: H - 0.42, w: CW - 1, h: 0.3, fontFace: BODY_FONT, fontSize: 9, color: GREY, align: "left",
    });
    s.addText(String(pageNo), {
      x: W - MX - 0.6, y: H - 0.42, w: 0.6, h: 0.3, fontFace: BODY_FONT, fontSize: 9, color: GREY, align: "right",
    });
    s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.09, fill: { color: BLUE } });
  }
  return s;
}

function eyebrowTitle(s, eyebrow, title, titleColor = NAVY) {
  s.addText(eyebrow.toUpperCase(), {
    x: MX, y: 0.32, w: CW, h: 0.32, fontFace: BODY_FONT, fontSize: 11, bold: true, color: BLUE, charSpacing: 2,
  });
  s.addText(title, {
    x: MX, y: 0.62, w: CW, h: 0.72, fontFace: TITLE_FONT, fontSize: 26, bold: true, color: titleColor,
  });
}

function objectiveStrip(s, text, y = 1.42) {
  s.addShape(pptx.ShapeType.roundRect, {
    x: MX, y, w: CW, h: 0.62, rectRadius: 0.07, fill: { color: LIGHT }, line: { color: BORDER, width: 0.75 },
  });
  addIcon(s, "target", MX + 0.22, y + 0.16, 0.3);
  s.addText([
    { text: "LEARNING OBJECTIVE   ", options: { bold: true, color: BLUE, fontSize: 10.5, charSpacing: 1.5 } },
    { text: text, options: { color: NAVY, fontSize: 13 } },
  ], { x: MX + 0.62, y, w: CW - 0.88, h: 0.62, fontFace: BODY_FONT, valign: "middle" });
}

function knowledgeCheck(s, q, y = H - 1.18) {
  s.addShape(pptx.ShapeType.roundRect, {
    x: MX, y, w: CW, h: 0.66, rectRadius: 0.07, fill: { color: NAVY },
  });
  addIcon(s, "question", MX + 0.22, y + 0.18, 0.3, "#" + DARK_LABEL);
  s.addText([
    { text: "KNOWLEDGE CHECK   ", options: { bold: true, color: DARK_LABEL, fontSize: 10.5, charSpacing: 1.5 } },
    { text: q, options: { color: WHITE, fontSize: 12.5 } },
  ], { x: MX + 0.62, y, w: CW - 0.88, h: 0.66, fontFace: BODY_FONT, valign: "middle" });
}

function card(s, x, y, w, h, { fill = WHITE, line = BORDER } = {}) {
  s.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.09, fill: { color: fill }, line: { color: line, width: 1 }, shadow: SHADOW,
  });
}

/** Grid of cards: items = [{icon, t, d}] */
function cardGrid(s, items, { x = MX, y = 2.3, w = CW, cols = 4, rowH = 1.5, gap = 0.22 } = {}) {
  const cw = (w - gap * (cols - 1)) / cols;
  items.forEach((it, i) => {
    const cx = x + (i % cols) * (cw + gap);
    const cy = y + Math.floor(i / cols) * (rowH + gap);
    card(s, cx, cy, cw, rowH);
    if (it.icon) {
      addIcon(s, it.icon, cx + 0.18, cy + 0.17, 0.34);
      s.addText(it.t, {
        x: cx + 0.62, y: cy + 0.13, w: cw - 0.8, h: 0.42, fontFace: TITLE_FONT, fontSize: 13.5, bold: true, color: NAVY, valign: "middle",
      });
    } else {
      s.addText(it.t, {
        x: cx + 0.18, y: cy + 0.13, w: cw - 0.36, h: 0.42, fontFace: TITLE_FONT, fontSize: 13.5, bold: true, color: NAVY, valign: "middle",
      });
    }
    if (it.d) s.addText(it.d, {
      x: cx + 0.18, y: cy + 0.6, w: cw - 0.36, h: rowH - 0.72, fontFace: BODY_FONT, fontSize: 10.5, color: GREY, valign: "top",
    });
  });
}

/** Chevron process flow */
function flow(s, steps, { x = MX, y = 2.5, w = CW, h = 1.35 } = {}) {
  const overlap = 0.28;
  const cw = (w + overlap * (steps.length - 1)) / steps.length;
  steps.forEach((st, i) => {
    const cx = x + i * (cw - overlap);
    s.addShape(i === 0 ? pptx.ShapeType.homePlate : pptx.ShapeType.chevron, {
      x: cx, y, w: cw, h, fill: { color: i % 2 === 0 ? BLUE : NAVY }, line: { color: WHITE, width: 1.5 },
    });
    s.addText(st, {
      x: cx + (i === 0 ? 0.12 : 0.3), y, w: cw - 0.45, h, fontFace: BODY_FONT, fontSize: 12, bold: true, color: WHITE, align: "center", valign: "middle",
    });
  });
}

/** Numbered process cards (grid) */
function numberedGrid(s, items, { x = MX, y = 2.3, w = CW, cols = 3, rowH = 1.15, gap = 0.22 } = {}) {
  const cw = (w - gap * (cols - 1)) / cols;
  items.forEach((it, i) => {
    const cx = x + (i % cols) * (cw + gap);
    const cy = y + Math.floor(i / cols) * (rowH + gap);
    card(s, cx, cy, cw, rowH);
    s.addShape(pptx.ShapeType.ellipse, { x: cx + 0.18, y: cy + rowH / 2 - 0.21, w: 0.42, h: 0.42, fill: { color: BLUE } });
    s.addText(String(i + 1), { x: cx + 0.18, y: cy + rowH / 2 - 0.21, w: 0.42, h: 0.42, fontFace: TITLE_FONT, fontSize: 14, bold: true, color: WHITE, align: "center", valign: "middle" });
    s.addText([
      { text: it.t + (it.d ? "\n" : ""), options: { bold: true, color: NAVY, fontSize: 12.5, fontFace: TITLE_FONT } },
      ...(it.d ? [{ text: it.d, options: { color: GREY, fontSize: 10.5, fontFace: BODY_FONT } }] : []),
    ], { x: cx + 0.72, y: cy + 0.1, w: cw - 0.9, h: rowH - 0.2, valign: "middle" });
  });
}

/** Before / after comparison */
function beforeAfter(s, before, after, { y = 2.4, h = 2.5 } = {}) {
  const cw = (CW - 0.5) / 2;
  card(s, MX, y, cw, h, { fill: "F4F5F7", line: "DADDE2" });
  addIcon(s, "dismiss", MX + 0.25, y + 0.18, 0.28, "#" + GREY);
  s.addText("WEAK", { x: MX + 0.62, y: y + 0.15, w: cw - 0.85, h: 0.35, fontFace: BODY_FONT, fontSize: 12, bold: true, color: GREY, charSpacing: 1.5, valign: "middle" });
  s.addText(`“${before}”`, { x: MX + 0.25, y: y + 0.6, w: cw - 0.5, h: h - 0.85, fontFace: BODY_FONT, fontSize: 16, italic: true, color: GREY, valign: "top" });
  card(s, MX + cw + 0.5, y, cw, h, { fill: LIGHT });
  addIcon(s, "check", MX + cw + 0.75, y + 0.18, 0.28);
  s.addText("STRONG", { x: MX + cw + 1.12, y: y + 0.15, w: cw - 0.85, h: 0.35, fontFace: BODY_FONT, fontSize: 12, bold: true, color: BLUE, charSpacing: 1.5, valign: "middle" });
  s.addText(`“${after}”`, { x: MX + cw + 0.75, y: y + 0.6, w: cw - 0.5, h: h - 0.85, fontFace: BODY_FONT, fontSize: 15, color: NAVY, valign: "top" });
  s.addShape(pptx.ShapeType.rightArrow, { x: MX + cw + 0.08, y: y + h / 2 - 0.17, w: 0.36, h: 0.34, fill: { color: BLUE } });
}

/** Professional table */
function dataTable(s, header, rows, { x = MX, y = 2.35, w = CW, colW, fontSize = 12.5 } = {}) {
  const tableRows = [
    header.map((t) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: BLUE }, fontFace: TITLE_FONT, fontSize } })),
    ...rows.map((r, i) => r.map((c) => ({ text: c, options: { color: NAVY, fill: { color: i % 2 ? LIGHT : WHITE }, fontFace: BODY_FONT, fontSize } }))),
  ];
  s.addTable(tableRows, { x, y, w, colW, border: { type: "solid", color: BORDER, pt: 0.75 }, rowH: 0.42, valign: "middle", margin: 0.09 });
}

/** Two cards: best practice vs common mistake */
function bestVsMistake(s, best, mistake, { y = 4.55, h = 1.45 } = {}) {
  const cw = (CW - 0.5) / 2;
  card(s, MX, y, cw, h, { fill: LIGHT });
  addIcon(s, "check", MX + 0.25, y + 0.16, 0.3);
  s.addText("BEST PRACTICE", { x: MX + 0.64, y: y + 0.14, w: cw - 0.9, h: 0.34, fontFace: BODY_FONT, fontSize: 11, bold: true, color: BLUE, charSpacing: 1.5, valign: "middle" });
  s.addText(best, { x: MX + 0.25, y: y + 0.52, w: cw - 0.5, h: h - 0.64, fontFace: BODY_FONT, fontSize: 12.5, color: NAVY, valign: "top" });
  card(s, MX + cw + 0.5, y, cw, h, { fill: "F4F5F7", line: "DADDE2" });
  addIcon(s, "dismiss", MX + cw + 0.75, y + 0.16, 0.3, "#" + GREY);
  s.addText("COMMON MISTAKE", { x: MX + cw + 1.14, y: y + 0.14, w: cw - 0.9, h: 0.34, fontFace: BODY_FONT, fontSize: 11, bold: true, color: GREY, charSpacing: 1.5, valign: "middle" });
  s.addText(mistake, { x: MX + cw + 0.75, y: y + 0.52, w: cw - 0.5, h: h - 0.64, fontFace: BODY_FONT, fontSize: 12.5, color: NAVY, valign: "top" });
}

function exampleCard(s, title, body, { y = 2.3, h = 2.0 } = {}) {
  card(s, MX, y, CW, h, { fill: LIGHT });
  s.addShape(pptx.ShapeType.rect, { x: MX, y, w: 0.09, h, fill: { color: BLUE } });
  addIcon(s, "briefcase", MX + CW - 0.66, y + 0.2, 0.38);
  s.addText([
    { text: "WORKPLACE EXAMPLE \u2014 INVESTEC\n", options: { bold: true, color: BLUE, fontSize: 10.5, charSpacing: 1.5 } },
    { text: title + "\n", options: { bold: true, color: NAVY, fontSize: 15, fontFace: TITLE_FONT } },
    { text: body, options: { color: NAVY, fontSize: 12.5 } },
  ], { x: MX + 0.32, y: y + 0.16, w: CW - 1.1, h: h - 0.32, fontFace: BODY_FONT, valign: "top", lineSpacingMultiple: 1.15 });
}

function divider(sectionNo, title, sub, iconName = "book") {
  const s = slide();
  s.background = { color: LIGHT };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.09, fill: { color: BLUE } });
  addIcon(s, iconName, MX, 1.7, 0.6);
  s.addText(`SECTION ${sectionNo}`, { x: MX, y: 2.5, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: 14, bold: true, color: BLUE, charSpacing: 3 });
  s.addText(title, { x: MX, y: 2.95, w: CW, h: 1.0, fontFace: TITLE_FONT, fontSize: 40, bold: true, color: NAVY });
  s.addText(sub, { x: MX, y: 4.0, w: CW - 3, h: 0.8, fontFace: BODY_FONT, fontSize: 15, color: GREY });
  s.addShape(pptx.ShapeType.roundRect, { x: MX, y: 4.9, w: 1.4, h: 0.12, rectRadius: 0.06, fill: { color: BLUE } });
  return s;
}

/* =========================================================== COVER */
{
  const s = slide();
  s.background = { color: NAVY };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.12, fill: { color: BLUE } });
  s.addShape(pptx.ShapeType.roundRect, { x: MX, y: 1.35, w: 2.9, h: 0.5, rectRadius: 0.25, fill: { color: BLUE } });
  s.addText("UNIT STANDARD 8252 · NQF 5 · 5 CREDITS", { x: MX, y: 1.35, w: 2.9, h: 0.5, fontFace: BODY_FONT, fontSize: 10.5, bold: true, color: WHITE, align: "center", valign: "middle", charSpacing: 1 });
  s.addText("Compile and Produce Reports", { x: MX, y: 2.05, w: CW, h: 1.6, fontFace: TITLE_FONT, fontSize: 44, bold: true, color: WHITE });
  s.addText("Professional business-report writing for IT Systems Support — facilitator training deck", {
    x: MX, y: 3.5, w: 9.5, h: 0.6, fontFace: BODY_FONT, fontSize: 17, color: DARK_SUB,
  });  addIcon(s, "document", 10.6, 1.5, 2.0, "#" + DARK_LINE);  s.addShape(pptx.ShapeType.line, { x: MX, y: 4.55, w: CW, h: 0, line: { color: DARK_LINE, width: 1 } });
  const meta = [
    ["FACILITATOR", "Andre Snell"],
    ["DATE", "Friday, 17 July 2026"],
    ["TIME", "09:00 – 14:00"],
    ["VENUE", "Investec, Sandton, Johannesburg"],
  ];
  meta.forEach(([k, v], i) => {
    const x = MX + i * (CW / 4);
    s.addText(k, { x, y: 4.8, w: CW / 4 - 0.2, h: 0.3, fontFace: BODY_FONT, fontSize: 10, bold: true, color: DARK_LABEL, charSpacing: 2 });
    s.addText(v, { x, y: 5.1, w: CW / 4 - 0.2, h: 0.35, fontFace: BODY_FONT, fontSize: 13.5, color: WHITE });
  });
  s.addText("Investec · Corporate Banking Technology · IT Systems Support NQF Level 5 (SAQA ID 48573)", {
    x: MX, y: H - 0.55, w: CW, h: 0.35, fontFace: BODY_FONT, fontSize: 10.5, color: DARK_MUTED,
  });
}

/* =========================================================== LEARNING OUTCOMES */
{
  const s = slide();
  eyebrowTitle(s, "Course introduction", "What you will be able to do");
  objectiveStrip(s, "By the end of Unit Standard 8252 you can plan, compile and produce professional business reports that support decision-making.");
  cardGrid(s, [
    { icon: "target", t: "Purpose", d: "Understand why each report is written and who it is for." },
    { icon: "database", t: "Sources", d: "Gather information from reliable business systems and records." },
    { icon: "shield", t: "Confidentiality", d: "Protect sensitive information and share it correctly." },
    { icon: "layers", t: "Standards", d: "Apply organisational layout and format standards." },
    { icon: "pen", t: "Writing", d: "Write clear, factual, objective and professional reports." },
    { icon: "clock", t: "Deadlines", d: "Meet organisational reporting deadlines every time." },
    { icon: "people", t: "Audience", d: "Match content and language to each report's reader." },
    { icon: "chart", t: "Decisions", d: "Produce reports that enable informed business decisions." },
  ], { y: 2.35, cols: 4, rowH: 1.55 });
  knowledgeCheck(s, "Which of these eight skills do you already use in your current support role — and which one needs the most work?");
}

/* =========================================================== WHY THIS MATTERS */
{
  const s = slide();
  eyebrowTitle(s, "Course introduction", "Why report writing matters in IT support");
  objectiveStrip(s, "Recognise the business value of professional reporting in a corporate banking technology environment.");
  cardGrid(s, [
    { icon: "chart", t: "Decisions", d: "Managers approve budgets, staffing and fixes based on what your reports tell them." },
    { icon: "shield", t: "Compliance", d: "POPIA and financial-sector regulation demand accurate, controlled records of incidents." },
    { icon: "award", t: "Reputation", d: "A clear, professional report builds trust in you and the whole support team." },
  ], { y: 2.35, cols: 3, rowH: 1.85 });
  exampleCard(s, "One outage, three audiences",
    "After a trading-floor network outage, the same facts feed an incident report for the IT Manager, a compliance record for the risk team and an executive summary for business heads. Writing it well once saves the business three times.",
    { y: 4.45, h: 1.55 });
}

/* =========================================================== VISUAL OVERVIEW */
{
  const s = slide();
  eyebrowTitle(s, "Course introduction", "Course roadmap — 11 assessment criteria");
  s.addText("SECTION 1 — EMBEDDED KNOWLEDGE (THEORY)", { x: MX, y: 1.55, w: CW, h: 0.3, fontFace: BODY_FONT, fontSize: 11, bold: true, color: BLUE, charSpacing: 1.5 });
  numberedGrid(s, [
    { t: "Purpose of reports" }, { t: "Information resources" }, { t: "Confidential dissemination" },
    { t: "Layout & format standards" }, { t: "Information needs" }, { t: "Report types (range)" },
    { t: "Reporting deadlines" }, { t: "Writing techniques" }, { t: "Report recipients" },
  ], { y: 1.95, cols: 3, rowH: 0.78, gap: 0.18 });
  s.addText("SECTION 2 — PRACTICAL ACTIVITIES (APPLICATION)", { x: MX, y: 5.05, w: CW, h: 0.3, fontFace: BODY_FONT, fontSize: 11, bold: true, color: BLUE, charSpacing: 1.5 });
  const items = [
    { t: "Obtain & distribute confidential information correctly" },
    { t: "Compile complete reports — right content, format and deadline" },
  ];
  items.forEach((it, i) => {
    const cw = (CW - 0.25) / 2;
    const cx = MX + i * (cw + 0.25);
    card(s, cx, 5.45, cw, 0.85, { fill: LIGHT });
    s.addShape(pptx.ShapeType.ellipse, { x: cx + 0.18, y: 5.45 + 0.22, w: 0.42, h: 0.42, fill: { color: NAVY } });
    s.addText(String(10 + i), { x: cx + 0.18, y: 5.45 + 0.22, w: 0.42, h: 0.42, fontFace: TITLE_FONT, fontSize: 14, bold: true, color: WHITE, align: "center", valign: "middle" });
    s.addText(it.t, { x: cx + 0.72, y: 5.45, w: cw - 0.9, h: 0.85, fontFace: TITLE_FONT, fontSize: 13, bold: true, color: NAVY, valign: "middle" });
  });
}

/* =========================================================== SECTION 1 DIVIDER */
divider(1, "Embedded Knowledge Questions", "Nine criteria that assess whether the learner understands the theory behind professional report writing.", "book");

/* ============================ TOPIC BUILDERS ============================ */
function topicSlides(n, section, title, objective, explain, visualFn, ex, best, mistake, check) {
  // Slide A — concept + visual
  const a = slide();
  eyebrowTitle(a, `${section} · Criterion ${n}`, title);
  objectiveStrip(a, objective);
  a.addText(explain, { x: MX, y: 2.18, w: CW, h: 0.62, fontFace: BODY_FONT, fontSize: 13.5, color: GREY, valign: "top", lineSpacingMultiple: 1.15 });
  visualFn(a);

  // Slide B — example, best practice vs mistake, knowledge check
  const b = slide();
  eyebrowTitle(b, `${section} · Criterion ${n}`, `${title} — in practice`);
  exampleCard(b, ex.t, ex.d, { y: 1.5, h: 2.7 });
  bestVsMistake(b, best, mistake, { y: 4.4, h: 1.5 });
  knowledgeCheck(b, check);
}

/* 1 — Purpose of reports */
topicSlides(1, "Embedded knowledge", "Purpose and content of reports",
  "Relate the purpose and content of a range of reports to the information needs of the business.",
  "Every report exists to answer a reader's questions so a decision can be made. Content must match what the reader needs — nothing more, nothing less.",
  (s) => flow(s, ["Why am I\nwriting this?", "Who will\nread it?", "What will\nthey decide?", "Write only what\nanswers that"], { y: 3.15, h: 1.5 }),
  { t: "Incident report after a network outage", d: "An Investec IT Support Technician writes an incident report after a network outage. The IT Manager needs five answers: What happened? Why did it happen? Which users were affected? How was it fixed? How will it be prevented? The report answers exactly those questions — with no unnecessary technical detail." },
  "Confirm the reader's questions before you write a single word.",
  "Padding the report with technical detail the reader never asked for.",
  "Your IT Manager requests an outage report. Name three questions the report must answer before they will call it complete.");

/* 2 — Information resources */
topicSlides(2, "Embedded knowledge", "Available information resources",
  "Identify reliable sources of information for compiling accurate business reports.",
  "A report is only as good as its evidence. Draw on official business systems and records — never on memory or assumption.",
  (s) => cardGrid(s, [
    { icon: "database", t: "System logs", d: "Windows Event Viewer · SQL Server logs · firewall logs" },
    { icon: "server", t: "Service platforms", d: "ServiceNow · helpdesk tickets · Microsoft Intune · Microsoft Entra ID" },
    { icon: "folder", t: "Business records", d: "Email records · asset register · company policies · previous reports" },
    { icon: "people", t: "People", d: "User interviews · Microsoft Teams messages · escalation notes" },
  ], { y: 3.0, cols: 4, rowH: 1.85 }),
  { t: "Verify before you write", d: "Investigating a login failure spike, a technician exports the sign-in log from Microsoft Entra ID, cross-checks affected users against ServiceNow tickets and confirms the change window in the previous maintenance report — three official sources, zero guesswork." },
  "Verify every fact against an official business record before it goes in the report.",
  "Relying on memory or assumptions instead of system evidence.",
  "A user says 'the server was down all morning'. Which two sources would you check to verify that claim?");

/* 3 — Confidential dissemination */
topicSlides(3, "Embedded knowledge", "Disseminating confidential information",
  "Follow organisational procedures for who may access, share and store confidential reports.",
  "Not everyone may see every report. Policy defines who may access it, how it is shared, where it is stored and how it is protected.",
  (s) => {
    flow(s, ["Classify the\nreport", "Check the\naccess policy", "Share via approved\nchannel only", "Store in controlled\nlocation"], { y: 3.0, h: 1.3 });
    s.addText([
      { text: "Authorised readers of a cyber-security report:  ", options: { bold: true, color: NAVY, fontSize: 12.5 } },
      { text: "IT Manager · Information Security Team · Compliance Officer — never the whole company.", options: { color: GREY, fontSize: 12.5 } },
    ], { x: MX, y: 4.6, w: CW, h: 0.5, fontFace: BODY_FONT, valign: "middle" });
  },
  { t: "Security report with usernames and IP addresses", d: "A cyber-security report identifies employee usernames and IP addresses involved in a phishing attempt. It is shared only with the IT Manager, the Information Security Team and the Compliance Officer through the approved document management system — it is not emailed to every employee." },
  "Classify first, then share only with named, authorised roles via approved channels.",
  "Emailing a sensitive report to a broad distribution list 'for awareness'.",
  "Your security report names three staff members. Who may receive it — and through which channel?");

/* 4 — Layout & format standards */
topicSlides(4, "Embedded knowledge", "Layout and format standards",
  "Apply organisational standards for the layout and format of reports.",
  "Consistent formatting makes reports easier to read and reinforces the organisation's professional image.",
  (s) => cardGrid(s, [
    { icon: "award", t: "Identity", d: "Company logo · title page · confidential classification" },
    { icon: "layers", t: "Structure", d: "Heading styles · numbered sections · automatic table of contents" },
    { icon: "pen", t: "Typography", d: "Aptos font · blue headings · consistent sizes" },
    { icon: "compass", t: "Navigation", d: "Page numbers · tables for data · professional finish" },
  ], { y: 3.0, cols: 4, rowH: 1.85 }),
  { t: "The Investec house style", d: "Investec reports use the Aptos font, defined heading styles with blue headings, page numbering, a confidential classification on the cover and an automatic table of contents. A report in house style is recognised — and trusted — instantly." },
  "Start from the approved company template so every standard is applied automatically.",
  "Building each report from a blank page with improvised fonts and headings.",
  "Name four formatting elements every company report must carry before it can be submitted.");

/* 5 — Information needs */
topicSlides(5, "Embedded knowledge", "Information needs of the organisation",
  "Provide the quantified information management needs to make informed business decisions.",
  "Management thinks in cost, impact, cause and next steps. Quantify everything — vague statements cannot support decisions.",
  (s) => beforeAfter(s, "The server crashed.",
    "The server outage affected 43 users, interrupted online banking for 18 minutes, delayed two client transactions, and generated 26 helpdesk tickets.",
    { y: 2.95, h: 2.4 }),
  { t: "Answer management's five questions", d: "How much did it cost? Which departments were affected? What caused the issue? What is the business impact? What should we do next? A report that answers all five lets an Investec department head act the same day, without a follow-up meeting." },
  "Quantify impact: users, minutes, tickets, transactions, rands.",
  "Vague statements — 'the system was slow' — that no one can act on.",
  "Rewrite 'Email was down for a while this morning' so that it answers management's impact questions.");

/* 6 — Report types */
topicSlides(6, "Embedded knowledge", "Purpose and content of a range of reports",
  "Distinguish the purpose of the report types used in business practice.",
  "The principles come from Retail/Wholesale practice but apply to every industry, including IT: each report type answers a different question.",
  (s) => dataTable(s, ["Report type", "It answers…", "Report type", "It answers…"], [
    ["Incident report", "What happened?", "Risk report", "What could go wrong?"],
    ["Service report", "How did the service perform?", "Audit report", "Do we comply?"],
    ["Fault report", "What is broken?", "Security report", "Are we protected?"],
    ["Maintenance report", "What work was completed?", "Performance report", "How well are we doing?"],
    ["Progress / project report", "How far are we?", "Inventory report", "What do we have?"],
  ], { y: 2.95, fontSize: 12 }),
  { t: "Same outage, different reports", d: "One SAN failure at Investec produces an incident report (what happened), a maintenance report (the disk replacement completed), and feeds the monthly service report (availability against SLA). Three documents, three purposes — never mixed into one." },
  "Name the report type before you start writing — it fixes the purpose and the content.",
  "Mixing incident detail, maintenance logs and performance stats into one unfocused document.",
  "A director asks 'what work was completed on the SAN last night?' — which report type answers that?");

/* 7 — Deadlines */
topicSlides(7, "Embedded knowledge", "Organisational reporting deadlines",
  "Meet the reporting deadlines the organisation sets for each report type.",
  "A late report loses its value — timeliness is a key measure of professionalism.",
  (s) => dataTable(s, ["Report", "Deadline"], [
    ["Security incident", "Within 1 hour"],
    ["Major outage report", "Within 24 hours"],
    ["Weekly IT report", "Every Friday"],
    ["Monthly performance report", "Last working day of the month"],
  ], { y: 2.9, colW: [6.5, 5.73], fontSize: 13 }),
  { t: "The 24-hour outage clock", d: "A core switch fails at 14:00 on Tuesday. The major-outage report is due by 14:00 Wednesday. The technician books thirty minutes the same afternoon to capture evidence while it is fresh — the report is submitted with three hours to spare." },
  "Start capturing evidence immediately — the deadline clock starts when the incident does.",
  "Leaving the report until 'things calm down' and missing the submission window.",
  "A security incident is confirmed at 10:15. By what time must the first report be submitted?");

/* 8 — Writing techniques */
topicSlides(8, "Embedded knowledge", "Business report writing techniques",
  "Apply techniques that make reports clear, concise, objective and professional.",
  "Good technique turns raw facts into a document a busy manager can absorb in minutes.",
  (s) => {
    numberedGrid(s, [
      { t: "Structure it", d: "Headings, subheadings, correct numbering" },
      { t: "Keep it plain", d: "Plain English, short sentences, bullets" },
      { t: "Stay objective", d: "Facts and evidence — never opinions" },
      { t: "Show the data", d: "Tables for figures, realistic recommendations" },
      { t: "Prove it", d: "Support every finding with evidence" },
      { t: "Polish it", d: "Check spelling, grammar and numbering" },
    ], { y: 2.95, cols: 3, rowH: 1.12 });
  },
  { t: "Objective beats dramatic", d: "Weak: 'The network was really bad.'  Strong: 'Network latency increased to 780 ms between 09:12 and 09:48, preventing users from accessing shared resources.' The second version is evidence a manager can act on — and an auditor can verify." },
  "Write facts with numbers, times and sources; let the evidence carry the argument.",
  "Opinion words — 'terrible', 'really bad', 'fine' — that cannot be verified.",
  "Turn 'the Wi-Fi was awful in the boardroom' into one objective, evidence-based sentence.");

/* 9 — Recipients */
topicSlides(9, "Embedded knowledge", "Recipients of various reports",
  "Match each report to its correct audience and write with that reader in mind.",
  "Technical language that suits an IT engineer may be wrong for a senior executive. Audience decides tone, depth and detail.",
  (s) => dataTable(s, ["Report", "Reader", "Report", "Reader"], [
    ["Incident report", "IT Manager", "Project report", "Project sponsor"],
    ["Financial report", "Finance Manager", "Executive summary", "CEO"],
    ["Security report", "Security team", "Audit report", "Internal auditors"],
  ], { y: 2.95, fontSize: 12.5 }),
  { t: "One incident, two versions", d: "For the Corporate Banking Technology manager the report details certificate chains and Entra ID sign-in logs. The executive summary for business heads says: 'Email authentication failed for 90 minutes; client impact contained; fix and prevention in place.' Same facts, right depth for each reader." },
  "Ask 'what does this reader already know, and what do they need to decide?'",
  "Sending an engineer-level technical report to a non-technical executive unchanged.",
  "The CEO wants an update on last week's outage. Which document do you send — and what stays out of it?");

/* =========================================================== SECTION 2 DIVIDER */
divider(2, "Practical Activities", "Two criteria that assess whether the learner can apply the knowledge in realistic workplace situations.", "wrench");

/* 10 — Practical: confidential info */
topicSlides(10, "Practical activity", "Obtaining and distributing confidential information",
  "Demonstrate the correct sources, procedures and protections when handling confidential report information.",
  "The assessor watches the whole chain: the right sources, accurate collection, company procedure, protection, and authorised distribution only.",
  (s) => flow(s, ["Identify correct\nsources", "Collect accurate\ninformation", "Follow company\nprocedure", "Protect confidential\ndata", "Share with authorised\npeople only"], { y: 3.05, h: 1.4 }),
  { t: "Printer failure investigation", d: "The learner investigates a printer failure by reviewing helpdesk tickets, interviewing the user, checking printer logs and consulting the asset register. The completed report goes to the IT Manager through the approved document management system — confidential information never reaches unauthorised staff." },
  "Run the full chain every time: source → collect → procedure → protect → authorised share.",
  "Getting the investigation right, then leaking the result by sharing it outside approved channels.",
  "List the four sources the learner used in the printer investigation — and the one approved way the report was distributed.");

/* 11 — Practical: compiling reports */
topicSlides(11, "Practical activity", "Compiling complete reports on deadline",
  "Compile a report with content and format appropriate to the information requirements — and meet the reporting deadline.",
  "This is the practical demonstration of the entire unit standard: nine steps from planning to on-time submission.",
  (s) => numberedGrid(s, [
    { t: "Plan the report" }, { t: "Gather evidence" }, { t: "Verify facts" },
    { t: "Organise logically" }, { t: "Use correct format" }, { t: "Apply company standards" },
    { t: "Write professionally" }, { t: "Proofread" }, { t: "Submit on time" },
  ], { y: 2.95, cols: 3, rowH: 0.85, gap: 0.18 }),
  { t: "Outlook outage — Corporate Banking Technology", d: "An Investec IT Support Technician investigates a Microsoft Outlook outage. Evidence comes from ServiceNow tickets, Microsoft Entra ID logs and user interviews; the cause is a failed authentication certificate. The incident report is prepared on the approved template with clear headings, findings, conclusions and recommendations, proofread, and submitted to the IT Support Manager inside the 24-hour deadline." },
  "Work the nine steps in order — planning and verification prevent rewrites later.",
  "Jumping straight to writing before evidence is gathered and verified.",
  "Which three evidence sources did the technician combine in the Outlook outage investigation?");

/* =========================================================== WRAP-UP DIVIDER */
divider(3, "Wrap-up and Assessment", "Summary, assessment preparation, practical activity and final knowledge check.", "award");

/* =========================================================== SUMMARY */
{
  const s = slide();
  eyebrowTitle(s, "Wrap-up", "Summary — what competent looks like");
  objectiveStrip(s, "Consolidate the nine knowledge criteria and two practical activities of US 8252.");
  cardGrid(s, [
    { icon: "target", t: "Purpose first", d: "Know why the report is written and who reads it." },
    { icon: "database", t: "Real evidence", d: "Reliable business sources, verified facts." },
    { icon: "shield", t: "Confidential control", d: "Authorised readers, approved channels, safe storage." },
    { icon: "layers", t: "House standards", d: "Template, headings, numbering, classification." },
    { icon: "pen", t: "Professional writing", d: "Objective, quantified, plain-English content." },
    { icon: "clock", t: "On time, every time", d: "Deadlines met; decisions enabled." },
  ], { y: 2.35, cols: 3, rowH: 1.3 });
  knowledgeCheck(s, "Which single criterion would an assessor say is your strongest today — and which needs deliberate practice this week?");
}

/* =========================================================== ASSESSMENT PREP */
{
  const s = slide();
  eyebrowTitle(s, "Wrap-up", "Assessment preparation");
  objectiveStrip(s, "Know exactly what the assessor checks before you submit your evidence.");
  dataTable(s, ["Assessor checks…", "Your evidence"], [
    ["Knowledge questions answered in own words", "Questionnaire 1 (LM p10–11) complete and signed"],
    ["Correct sources identified and used", "Report references tickets, logs and records"],
    ["Confidentiality procedure followed", "Distribution list and channel recorded"],
    ["Company format standards applied", "Template, headings, numbering, classification"],
    ["Report submitted on deadline", "Submission timestamp inside the window"],
    ["Logbook and self-assessment complete", "Signed logbook entries filed in the POE"],
  ], { y: 2.35, colW: [6.1, 6.13], fontSize: 12 });
  knowledgeCheck(s, "Open your logbook now: which evidence row above is still missing for you?");
}

/* =========================================================== PRACTICAL ACTIVITY */
{
  const s = slide();
  eyebrowTitle(s, "Wrap-up", "Practical activity — your turn");
  objectiveStrip(s, "Apply all eleven criteria to a realistic Investec support scenario.");
  exampleCard(s, "Scenario — Teams outage on the trading floor",
    "At 08:40, Microsoft Teams stops connecting for 30 users in Corporate Banking Technology. By 09:25 the cause is traced to an expired proxy certificate and service is restored. Your task: compile the incident report. Gather evidence from ServiceNow, Entra ID sign-in logs and two user interviews; quantify the impact; apply the company template; and submit to the IT Support Manager within 24 hours.",
    { y: 2.3, h: 2.3 });
  numberedGrid(s, [
    { t: "Plan & gather", d: "20 min — sources and impact figures" },
    { t: "Draft", d: "40 min — template, headings, findings" },
    { t: "Verify & submit", d: "15 min — proofread, authorised channel" },
  ], { y: 4.85, cols: 3, rowH: 1.0 });
}

/* =========================================================== KEY TAKEAWAYS */
{
  const s = slide();
  eyebrowTitle(s, "Wrap-up", "Key takeaways");
  const points = [
    "A report answers its reader's questions so a decision can be made.",
    "Evidence comes from official systems — never memory or assumption.",
    "Confidential information moves only through approved channels to authorised people.",
    "House standards and objective, quantified writing make reports trusted.",
    "A late report is a failed report — the deadline is part of the job.",
  ];
  points.forEach((p, i) => {
    const y = 1.7 + i * 0.98;
    card(s, MX, y, CW, 0.8, { fill: i === 4 ? LIGHT : WHITE });
    s.addShape(pptx.ShapeType.ellipse, { x: MX + 0.2, y: y + 0.19, w: 0.42, h: 0.42, fill: { color: NAVY } });
    s.addText(String(i + 1), { x: MX + 0.2, y: y + 0.19, w: 0.42, h: 0.42, fontFace: TITLE_FONT, fontSize: 14, bold: true, color: WHITE, align: "center", valign: "middle" });
    s.addText(p, { x: MX + 0.8, y, w: CW - 1.0, h: 0.8, fontFace: BODY_FONT, fontSize: 14.5, color: NAVY, valign: "middle" });
  });
}

/* =========================================================== FINAL QUIZ */
{
  const s = slide();
  eyebrowTitle(s, "Wrap-up", "Final quiz — 5 questions");
  objectiveStrip(s, "Answer individually, then discuss as a class. 80%+ is considered competent.");
  const qs = [
    "Name the five questions an incident report must answer for the IT Manager.",
    "Give four reliable information sources for an IT report — and one source you must never rely on.",
    "Who may receive a cyber-security report naming staff members, and through which channel?",
    "Rewrite 'the server crashed' as a quantified, decision-ready sentence.",
    "A major outage starts at 14:00 Tuesday — when is the report due, and what do you do first?",
  ];
  qs.forEach((q, i) => {
    const y = 2.3 + i * 0.85;
    card(s, MX, y, CW, 0.7);
    s.addText([
      { text: `Q${i + 1}   `, options: { bold: true, color: BLUE, fontSize: 13, fontFace: TITLE_FONT } },
      { text: q, options: { color: NAVY, fontSize: 12.5, fontFace: BODY_FONT } },
    ], { x: MX + 0.22, y, w: CW - 0.44, h: 0.7, valign: "middle" });
  });
}

/* =========================================================== CLOSING */
{
  const s = slide();
  s.background = { color: NAVY };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.12, fill: { color: BLUE } });
  addIcon(s, "check", MX, 1.8, 0.6, "#" + DARK_LABEL);
  s.addText("You can now compile and produce professional reports.", {
    x: MX, y: 2.6, w: CW, h: 1.4, fontFace: TITLE_FONT, fontSize: 34, bold: true, color: WHITE,
  });
  s.addText("File your questionnaire, self-assessment and logbook evidence in your Portfolio of Evidence.\nNext session date to be agreed at close — thank you for your participation.", {
    x: MX, y: 4.05, w: 10, h: 1.0, fontFace: BODY_FONT, fontSize: 15, color: DARK_SUB, lineSpacingMultiple: 1.25,
  });
  s.addText("Unit Standard 8252 · Andre Snell · Investec, Sandton, Johannesburg", {
    x: MX, y: H - 0.6, w: CW, h: 0.35, fontFace: BODY_FONT, fontSize: 10.5, color: DARK_MUTED,
  });
}

mkdirSync("public/downloads", { recursive: true });
const OUT = MONO
  ? "public/downloads/US-8252-Compile-and-Produce-Reports-Training-BW.pptx"
  : "public/downloads/US-8252-Compile-and-Produce-Reports-Training.pptx";
await pptx.writeFile({ fileName: OUT });
console.log(`Written ${OUT} — ${pageNo} slides`);
