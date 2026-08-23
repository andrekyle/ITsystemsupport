// Generates the US 114050 Lesson 3 deck (how IT can be used in business — 2026
// applications) in the same Microsoft Fluent / Learn style. Accessibility rule:
// NO text below 18pt. Uses the lesson's tool images from public/figures/.
// Run: node scripts/make-114050-l3-ppt.mjs -> public/downloads/US-114050-L3-IT-in-Business.pptx
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
pptx.title = "US 114050 Lesson 3 — How Information Technology can be used in Business";

let pageNo = 0;

function slide() {
  const s = pptx.addSlide();
  s.background = { color: WHITE };
  pageNo += 1;
  if (pageNo > 1) {
    s.addText("US 114050 · Lesson 3 — How IT can be used in business · NQF 5", {
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
  s.addText("US 114050 · LESSON 3 · NQF LEVEL 5", { x: MX, y: 1.1, w: 5.9, h: 0.62, fontFace: BODY_FONT, fontSize: MIN_FONT, bold: true, color: WHITE, align: "center", valign: "middle", charSpacing: 1 });
  s.addText("Explain how Information Technology can be used in Business", { x: MX, y: 1.9, w: 10.8, h: 1.85, fontFace: TITLE_FONT, fontSize: 38, bold: true, color: NAVY });
  s.addText("Word processors, spreadsheets, databases, graphics and the integrated office suites of 2026 — their functions, and their effects on the business", { x: MX, y: 3.8, w: 9.7, h: 0.75, fontFace: BODY_FONT, fontSize: 19, color: GREY, lineSpacingMultiple: 1.15 });
  addIcon(s, "briefcase", 11.0, 1.4, 1.8, "#" + BORDER);
  s.addShape(pptx.ShapeType.line, { x: MX, y: 4.62, w: CW, h: 0, line: { color: BORDER, width: 1 } });
  const meta = [
    ["TIME", "90 minutes · Self & Group"],
    ["SESSION", "Friday, 21 Aug 2026 · 09h00 – 14h00"],
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

/* ============================================================= WORD PROCESSORS */
{
  const s = slide();
  eyebrowTitle(s, "Word processors", "The most common of all computer applications");
  bulletList(s, [
    "Word processing: using a computer to create, edit and print documents — create it, store it electronically, display it on screen, modify it from the keyboard, print or share it.",
    "The great advantage over a typewriter: change anything without retyping the document — correct, delete, insert and move text freely.",
    "In 2026 it also saves to the cloud automatically, keeps a version history, and lets several people edit the same document at once.",
    "The tools a business will meet: Microsoft Word (Microsoft 365, with Copilot), Google Docs (Google Workspace, with Gemini) and the free LibreOffice Writer.",
  ], { y: 1.6, h: 3.6 });
  strip(s, "In business", "Letters, quotations, contracts, reports, policies, minutes — produced faster and with fewer errors, kept on-brand with templates, finished together in the cloud.", { y: 5.35 });
}

/* ============================================================= BASIC FEATURES */
{
  const s = slide();
  eyebrowTitle(s, "Word processors", "Basic features every word processor supports");
  iconCards(s, [
    { icon: "pen", text: "Insert text", d: "Add text anywhere in the document." },
    { icon: "check", text: "Delete text", d: "Erase characters, words, lines or pages." },
    { icon: "scissors", text: "Cut and paste", d: "Remove a section and insert it elsewhere." },
    { icon: "folder", text: "Copy", d: "Duplicate a section of text." },
    { icon: "dashboard", text: "Page size & margins", d: "Change them — the text re-fits automatically." },
    { icon: "search", text: "Search & replace", d: "Find a phrase; swap every occurrence." },
    { icon: "type", text: "Word wrap", d: "New lines start themselves; text re-flows." },
    { icon: "print", text: "Print", d: "Hardcopy — or a PDF for email and WhatsApp." },
  ], { y: 1.7, cols: 4, rowH: 1.75 });
  strip(s, "Text editor or word processor?", "A program with only these basics is a text editor (Windows Notepad). Word processors that add much more are called full-featured word processors.", { y: 5.6, h: 1.15 });
}

/* ============================================================= FULL-FEATURED */
{
  const s = slide();
  eyebrowTitle(s, "Word processors", "What full-featured word processors add");
  iconCards(s, [
    { icon: "type", text: "Fonts & layout", d: "Typefaces, bold, italics; margins and indents; WYSIWYG." },
    { icon: "document", text: "Headers, footers & numbering", d: "Custom top and bottom of every page — numbers tracked." },
    { icon: "people", text: "Mail merge", d: "A list plus a template: personalised letters and labels." },
    { icon: "check", text: "Spell checker & thesaurus", d: "Unrecognised words highlighted; synonyms built in." },
    { icon: "book", text: "Contents & indexes", d: "Contents, indexes, footnotes, cross-references — automated." },
    { icon: "clock", text: "Macros", d: "Record keystrokes once; replay them on routine work." },
  ], { y: 1.6, cols: 3, rowH: 1.85 });
  strip(s, "What 2026 adds", "Track changes and comments · real-time co-authoring with named cursors · Copilot and Gemini drafting, summarising and translating · dictation with automatic punctuation.", { y: 5.6, h: 1.15 });
}

/* ============================================================= SPREADSHEETS */
{
  const s = slide();
  eyebrowTitle(s, "Spreadsheets", "A grid of cells that does the arithmetic for you");
  bulletList(s, [
    "A spreadsheet is a rectangular table (grid) of information, often financial — the name comes from ledgers \u201cspread\u201d across two facing pages.",
    "Electronic spreadsheets keep the rows, columns and cells but add formulas — =SUM(B2:B13) — and every dependent formula recalculates the instant a number changes.",
    "Charts, pivot tables and conditional formatting turn the numbers into pictures and summaries.",
    "The 2026 line-up: Microsoft Excel (Copilot writes formulas and analyses data), Google Sheets (browser, real-time sharing) and the free LibreOffice Calc.",
  ], { y: 1.6, h: 3.6 });
  strip(s, "In business", "Budgets, cash-flow forecasts, price lists, sales analysis, stock counts, dashboards — and \u201cwhat if\u201d scenarios tested before money is spent (the decision stages from Lesson 2).", { y: 5.35 });
}

/* ============================================================= DATABASES */
{
  const s = slide();
  eyebrowTitle(s, "Databases", "Structured records, queried for answers");
  bulletList(s, [
    "A database is a structured collection of records stored so that a program — or a person using a query language — can consult it to answer questions.",
    "The DBMS is the software that manages and queries the database; the schema describes the facts it holds and the relationships among them.",
    "A typical query: \u201cHow many burgers with two or more patties were sold in March in region 4?\u201d — the answer is information for a decision.",
    "The relational model rules (Lesson 2): related tables of rows and columns, linked by shared values.",
  ], { y: 1.6, h: 3.6 });
  strip(s, "In business", "Customer records (CRM), stock and inventory, sales history, loyalty, payroll, point-of-sale. Questions answered in seconds — and POPIA makes the business guard the personal data it holds.", { y: 5.35 });
}

/* ============================================================= DB ENGINES */
{
  const s = slide();
  eyebrowTitle(s, "Databases", "The database engines of 2026");
  iconCards(s, [
    { icon: "database", text: "SQL Server / Azure SQL", d: "Microsoft's engine on-premise and its cloud twin — the corporate mainstay." },
    { icon: "globe", text: "PostgreSQL & MySQL", d: "The open-source workhorses behind most of the web's applications." },
    { icon: "briefcase", text: "Oracle Database", d: "The heavyweight of large enterprises, banks and government systems." },
    { icon: "layers", text: "MongoDB", d: "A NoSQL store for records that do not fit neatly into tables." },
    { icon: "folder", text: "Access & Airtable", d: "Where small businesses start — friendly forms over real databases." },
    { icon: "cloud", text: "In the cloud", d: "Most new databases run as managed cloud services, not on an office server." },
  ], { y: 1.7, cols: 3, rowH: 2.15 });
}

/* ============================================================= GRAPHICS */
{
  const s = slide();
  eyebrowTitle(s, "Graphics", "Digitally creating and manipulating visual content");
  iconCards(s, [
    { icon: "layers", text: "Geometry", d: "Representing and processing surfaces and shapes." },
    { icon: "play", text: "Animation", d: "Representing and manipulating motion." },
    { icon: "design", text: "Rendering", d: "Algorithms that reproduce how light falls on a scene." },
    { icon: "monitor", text: "Imaging", d: "Image acquisition and image editing." },
  ], { y: 1.7, cols: 4, rowH: 2.0 });
  strip(s, "In business", "Logos and branding, adverts, social-media posts, product photos, packaging, signage, slides. A professional image builds trust — and in-house design is fast and cheap.", { y: 4.15, h: 1.3 });
}

/* ============================================================= 2026 TOOLBOX (IMAGES) */
{
  const s = slide();
  eyebrowTitle(s, "Graphics", "The 2026 toolbox");
  imageCards(s, [
    { img: "public/figures/114050-tool-canva.png", text: "Canva", d: "Browser design for posts, flyers and slides." },
    { img: "public/figures/114050-tool-adobe.png", text: "Photoshop & Illustrator", d: "Pro photo editing and vector art, with Firefly AI." },
    { img: "public/figures/114050-tool-figma.png", text: "Figma", d: "Collaborative design in the browser, for teams." },
    { img: "public/figures/114050-tool-blender.png", text: "Blender", d: "Free, professional 3D modelling and animation." },
    { img: "public/figures/114050-tool-video.png", text: "CapCut & Premiere Pro", d: "Video editing for adverts and social media." },
    { img: "public/figures/114050-tool-ai.jpg", text: "AI image generation", d: "Firefly, DALL·E and Midjourney draw from a prompt." },
  ], { y: 1.62, cols: 3, rowH: 2.42, gap: 0.22, imgH: 1.02 });
}

/* ============================================================= AI SHOWCASE */
{
  const s = slide();
  eyebrowTitle(s, "Graphics", "An AI-generated artwork, from one sentence");
  s.addImage({ path: "public/figures/114050-tool-ai.jpg", x: 6.6, y: 1.7, w: 6.1, h: 4.06, sizing: { type: "contain", w: 6.1, h: 4.06 } });
  s.addText("Théâtre d'Opéra Spatial — generated with Midjourney by Jason M. Allen; it won a Colorado State Fair art competition in 2022 and started a worldwide debate.", {
    x: 6.6, y: 5.85, w: 6.1, h: 0.85, fontFace: BODY_FONT, fontSize: MIN_FONT, color: GREY, lineSpacingMultiple: 1.1, valign: "top",
  });
  bulletList(s, [
    "Generative AI drafts images from a text prompt — describe the visual, refine, and export.",
    "In business: campaign concepts, product mock-ups and social artwork in minutes instead of days.",
    "Rules still apply: check licensing, brand fit and honesty before publishing AI-generated visuals.",
  ], { x: MX, y: 1.9, w: 5.7, h: 4.4 });
}

/* ============================================================= MICROSOFT 365 */
{
  const s = slide();
  eyebrowTitle(s, "Integrated office suites", "Microsoft 365 — one subscription, tools that work together");
  bulletList(s, [
    "An office suite bundles the word processor, spreadsheet, presentations and email — one look and feel, one spell checker, live links between applications.",
    "Live links keep work current: an Excel chart pasted into a Word report updates when the numbers change.",
    "Office began in 1989 (Mac) and 1990 (Windows) as Word + Excel + PowerPoint. Today it is Microsoft 365 — a cloud subscription priced per user per month.",
    "A 2026 business subscription: Word, Excel, PowerPoint, Outlook, OneNote, Teams, OneDrive and SharePoint — with Copilot woven through all of them.",
  ], { y: 1.6, h: 3.6 });
  strip(s, "In business", "A quotation drafted in Word, costed in Excel, presented in PowerPoint, shared in Teams and signed off the same day — on desktop, browser, tablet or phone.", { y: 5.35 });
}

/* ============================================================= OTHER SUITES */
{
  const s = slide();
  eyebrowTitle(s, "Integrated office suites", "The rest of the 2026 market");
  iconCards(s, [
    { icon: "globe", text: "Google Workspace", d: "Docs, Sheets, Slides, Gmail, Drive, Meet with Gemini — browser-first, collaboration is its superpower." },
    { icon: "folder", text: "LibreOffice", d: "Free, open-source, fully offline — Writer, Calc, Impress and Base. Opens Microsoft formats." },
    { icon: "dashboard", text: "iWork · Zoho · OnlyOffice · WPS", d: "Apple's suite plus capable challengers — all read and write the standard formats." },
  ], { y: 1.7, cols: 3, rowH: 2.5 });
  strip(s, "Compatibility is what matters", ".docx, .xlsx and .pptx are the de facto exchange standards; PDF is the standard for final documents. Weigh cost, collaboration, connectivity and staff skills.", { y: 4.55, h: 1.3 });
}

/* ============================================================= HISTORY */
{
  const s = slide();
  eyebrowTitle(s, "Integrated office suites", "The suites that came before — and what they teach");
  dataTable(s, ["Suite", "What it bundled", "What happened"], [
    ["Lotus SmartSuite", "Word Pro · 1-2-3 · Freelance Graphics · Approach · Organizer", "Discontinued — 1-2-3 ended in 2013"],
    ["Corel WordPerfect Office", "WordPerfect · Quattro Pro · Paradox", "Survives only in a small legal niche"],
    ["CorelDRAW", "Vector graphics (still Corel's best-seller)", "Lives on — as a graphics tool, not a suite"],
  ], { y: 1.9, colW: [3.1, 5.53, 3.6], rowH: 0.8 });
  strip(s, "The lesson", "Compatibility beats features. Users would not leave the formats everyone else used — the same reason .docx and .xlsx still rule in 2026.", { y: 5.0, h: 1.2 });
}

/* ============================================================= FUNCTION & EFFECT */
{
  const s = slide();
  eyebrowTitle(s, "Pulling it together", "Function and effect — what you must be able to explain");
  dataTable(s, ["Application", "Function — what it does", "Effect — what it changes"], [
    ["Word processors", "Create, edit and share documents", "Faster, error-free, on-brand paperwork"],
    ["Spreadsheets", "Calculate, analyse and chart numbers", "Accurate arithmetic; \u201cwhat if\u201d before money moves"],
    ["Databases", "Store and query business records", "Facts on demand; one trusted copy of the truth"],
    ["Graphics", "Create the visual face of the business", "Professional image at low in-house cost"],
    ["Integrated suites", "Bundle it all with email and cloud files", "One subscription; data flows, skills transfer"],
  ], { y: 1.8, colW: [2.7, 4.9, 4.63], rowH: 0.72 });
}

/* ============================================================= YOUR WORK */
{
  const s = slide();
  eyebrowTitle(s, "Now prove it", "Your work for Lesson 3");
  iconCards(s, [
    { icon: "chat", text: "Questioning session", d: "45 minutes · Self & Group — explain each application's functions AND effects. AI-marked on the Exercises tab." },
    { icon: "dashboard", text: "Slide quizzes", d: "Every section gates on its five questions — all correct unlocks Next." },
    { icon: "check", text: "Self assessment", d: "\u201cI am able to explain how IT can be used in business\u201d — tick it honestly." },
    { icon: "folder", text: "Logbook project — Research", d: "Show how IT is used in everyday business, with articles and pictures. Mark it 114050." },
  ], { y: 1.75, cols: 2, rowH: 2.35 });
}

/* ============================================================= CLOSING */
{
  const s = slide();
  s.background = { color: NAVY };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.12, fill: { color: BLUE } });
  addIcon(s, "briefcase", MX, 1.6, 0.7, "#" + DARK_LABEL);
  s.addText("IT is how a business writes, counts, remembers and shows itself.", {
    x: MX, y: 2.45, w: CW, h: 1.4, fontFace: TITLE_FONT, fontSize: 36, bold: true, color: WHITE,
  });
  s.addText("Word processors for the paperwork · spreadsheets for the numbers · databases for the records · graphics for the brand · one integrated suite tying it all together — always explain the function AND the effect.", {
    x: MX, y: 3.95, w: 11.0, h: 1.4, fontFace: BODY_FONT, fontSize: MIN_FONT, color: DARK_SUB, lineSpacingMultiple: 1.2,
  });
  s.addText("US 114050 · National Certificate: IT — System Support · SAQA ID 48573 · ITSS Learn", {
    x: MX, y: H - 0.62, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: MIN_FONT, color: DARK_MUTED,
  });
}

mkdirSync("public/downloads", { recursive: true });
const OUT = "public/downloads/US-114050-L3-IT-in-Business.pptx";
await pptx.writeFile({ fileName: OUT });
console.log(`Written ${OUT} — ${pageNo} slides (min font ${MIN_FONT}pt)`);
