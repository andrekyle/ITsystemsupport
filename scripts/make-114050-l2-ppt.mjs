// Generates the US 114050 Lesson 2 deck (systems theory & information systems)
// in the same Microsoft Fluent / Learn style. Accessibility rule: NO text below 18pt.
// Run: node scripts/make-114050-l2-ppt.mjs -> public/downloads/US-114050-L2-Systems-Theory.pptx
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
  award: '<circle cx="12" cy="9" r="5"/><path d="M8.8 13.2 7.5 20l4.5-2.5L16.5 20l-1.3-6.8"/>',
  book: '<path d="M4 19.5v-14A2.5 2.5 0 0 1 6.5 3H20v18H6.5a2.5 2.5 0 0 1-2.5-2.5zm0 0A2.5 2.5 0 0 1 6.5 17H20"/>',
  document: '<path d="M6.5 3.5h7.2l4.8 4.8V19a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 19z"/><path d="M13.5 3.5v5h5M9.5 12.5h5M9.5 15.5h5"/>',
  chat: '<path d="M4 6.2A2.2 2.2 0 0 1 6.2 4h11.6A2.2 2.2 0 0 1 20 6.2v8.1a2.2 2.2 0 0 1-2.2 2.2H12l-4.5 3.6v-3.6H6.2A2.2 2.2 0 0 1 4 14.3z"/><path d="M8 9h8M8 12h5"/>',
  person: '<circle cx="12" cy="8" r="3.6"/><path d="M4.8 20c.8-3.7 3.6-5.6 7.2-5.6s6.4 1.9 7.2 5.6"/>',
  gradcap: '<path d="m12 4 10 4.5L12 13 2 8.5z"/><path d="M6.5 10.8v4.4c0 1.2 2.5 2.6 5.5 2.6s5.5-1.4 5.5-2.6v-4.4"/><path d="M22 8.5v5"/>',
  trend: '<path d="m3.5 17 5.5-5.5 3.5 3.5 7.5-7.5"/><path d="M15 7.5h5v5"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.3"/><path d="m15.5 15.5 5 5"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.3 4 5.2 4 8.5s-1.4 6.2-4 8.5c-2.6-2.3-4-5.2-4-8.5s1.4-6.2 4-8.5z"/>',
  design: '<circle cx="12" cy="12" r="8.5"/><path d="m14.8 9.2-1.7 4.5-4.5 1.7 1.7-4.5z"/>',
  dashboard: '<rect x="3.5" y="3.5" width="7.3" height="7.3" rx="1.2"/><rect x="13.2" y="3.5" width="7.3" height="7.3" rx="1.2"/><rect x="3.5" y="13.2" width="7.3" height="7.3" rx="1.2"/><rect x="13.2" y="13.2" width="7.3" height="7.3" rx="1.2"/>',
  layers: '<path d="M12 3.5l8.5 4.7L12 12.9 3.5 8.2z"/><path d="m3.5 12.4 8.5 4.7 8.5-4.7"/><path d="m3.5 16.3 8.5 4.7 8.5-4.7"/>',
  database: '<ellipse cx="12" cy="5.5" rx="7.5" ry="2.8"/><path d="M4.5 5.5v13c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8v-13"/><path d="M4.5 12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8"/>',
  server: '<rect x="4" y="4" width="16" height="6.5" rx="1.3"/><rect x="4" y="13.5" width="16" height="6.5" rx="1.3"/><path d="M7.5 7.2h.01M7.5 16.7h.01"/>',
  network: '<circle cx="12" cy="5" r="2.5"/><circle cx="5.5" cy="18" r="2.5"/><circle cx="18.5" cy="18" r="2.5"/><path d="M12 7.5v4M12 11.5 6.8 16M12 11.5l5.2 4.5"/>',
  lock: '<rect x="5.5" y="10.5" width="13" height="9.5" rx="1.6"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
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
pptx.title = "US 114050 Lesson 2 — Systems Theory with respect to Information Systems";

let pageNo = 0;

function slide() {
  const s = pptx.addSlide();
  s.background = { color: WHITE };
  pageNo += 1;
  if (pageNo > 1) {
    s.addText("US 114050 · Lesson 2 — Systems theory & information systems · NQF 5", {
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

/* ============================================================= COVER */
{
  const s = slide();
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.12, fill: { color: BLUE } });
  s.addShape(pptx.ShapeType.roundRect, { x: MX, y: 1.1, w: 5.9, h: 0.62, rectRadius: 0.31, fill: { color: BLUE } });
  s.addText("US 114050 · LESSON 2 · NQF LEVEL 5", { x: MX, y: 1.1, w: 5.9, h: 0.62, fontFace: BODY_FONT, fontSize: MIN_FONT, bold: true, color: WHITE, align: "center", valign: "middle", charSpacing: 1 });
  s.addText("Describe Systems Theory with respect to Information Systems", { x: MX, y: 1.9, w: 10.8, h: 1.85, fontFace: TITLE_FONT, fontSize: 38, bold: true, color: NAVY });
  s.addText("The business environment, the management system, and the information systems that serve every level of the organisation", { x: MX, y: 3.8, w: 9.7, h: 0.75, fontFace: BODY_FONT, fontSize: 19, color: GREY, lineSpacingMultiple: 1.15 });
  addIcon(s, "layers", 11.0, 1.4, 1.8, "#" + BORDER);
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

/* ============================================================= BUSINESS ENVIRONMENT */
{
  const s = slide();
  eyebrowTitle(s, "The business environment", "The manager and the management system");
  bulletList(s, [
    "A manager is someone skilled in knowing how to analyse and improve the ability of an organisation to survive and grow in a complex and changing world.",
    "Managers have a set of tools that enable them to grasp the complexity of the organisation's environment.",
    "A management system describes the organisation and the set of significant interacting institutions and forces in its complex, rapidly changing environment that affect its ability to serve its customers.",
    "The firm must continuously monitor and adapt to the environment if it is to survive and prosper.",
    "Disturbances in the environment may spell profound threats or new opportunities — the successful firm identifies, appraises and responds to both.",
  ]);
}

/* ============================================================= INTERNAL / EXTERNAL */
{
  const s = slide();
  eyebrowTitle(s, "Two levels", "Internal and external environment");
  iconCards(s, [
    { icon: "dashboard", text: "Internal environment", d: "The organisation is a resource conversion machine: it takes inputs (labour, money, materials, equipment) from the outside world and converts them into useful products, goods and services — its outputs to customers." },
    { icon: "globe", text: "External environment", d: "All outside institutions and forces with an actual or potential interest or impact on the organisation's objectives: competitive, economic, technological, political, legal, demographic, cultural and ecosystem." },
  ], { y: 1.75, cols: 2, rowH: 2.9 });
  card(s, MX, 5.0, CW, 1.35, { fill: LIGHT });
  s.addText("GLOBALISATION — AN OPPORTUNITY", { x: MX + 0.25, y: 5.18, w: CW - 0.5, h: 0.36, fontFace: BODY_FONT, fontSize: MIN_FONT, bold: true, color: BLUE, charSpacing: 1 });
  s.addText("Improving transport and communications let companies expand into worldwide markets — managers must handle multiple cultures and political systems.", {
    x: MX + 0.25, y: 5.56, w: CW - 0.5, h: 0.72, fontFace: BODY_FONT, fontSize: MIN_FONT, color: NAVY, lineSpacingMultiple: 1.15,
  });
}

/* ============================================================= TYPES OF IS */
{
  const s = slide();
  eyebrowTitle(s, "Types of information systems", "Technology serving every level of the pyramid");
  introText(s, "The description distinguishes these types of information systems (any three):", 1.4, 0.4);
  iconCards(s, [
    { icon: "database", text: "TPS", d: "Collects, stores, modifies and retrieves the organisation's transactions." },
    { icon: "design", text: "KWS", d: "Supports technical expertise — word processing, CAD, expert systems." },
    { icon: "chart", text: "MIS", d: "Turns internal and external data into decision-making information." },
    { icon: "target", text: "DSS", d: "Supports \u201cwhat if\u201d analysis and unstructured decisions." },
    { icon: "briefcase", text: "ESS", d: "A long-term, strategic view for senior management." },
  ], { y: 2.0, cols: 3, rowH: 2.15 });
}

/* ============================================================= TPS */
{
  const s = slide();
  eyebrowTitle(s, "Transaction processing", "Transaction Processing Systems (TPS)");
  bulletList(s, [
    "A TPS collects, stores, modifies and retrieves the transactions of an organisation.",
    "A transaction is an event that generates or modifies data that is eventually stored in an information system.",
    "To be considered a transaction processing system, the computer must pass the ACID test.",
    "Batch processing is NOT transaction processing — several transactions are processed together and results are not immediately available while a transaction is entered.",
  ], { y: 1.7, h: 4.7 });
}

/* ============================================================= TPS FEATURES */
{
  const s = slide();
  eyebrowTitle(s, "Transaction processing", "Features of a TPS");
  iconCards(s, [
    { icon: "clock", text: "Rapid response", d: "Customers cannot be kept waiting — input to output in a few seconds or less." },
    { icon: "shield", text: "Reliability", d: "A breakdown can stop the business — very low failure rate, quick recovery, solid backups." },
    { icon: "lock", text: "Inflexibility", d: "Every transaction is processed the same way — no non-standard operations per user or agent." },
    { icon: "check", text: "Controlled processing", d: "Enforces the organisation's allocated roles and responsibilities." },
  ], { y: 1.75, cols: 2, rowH: 2.35 });
}

/* ============================================================= ACID */
{
  const s = slide();
  eyebrowTitle(s, "The ACID test", "Four properties every transaction must have");
  iconCards(s, [
    { icon: "check", text: "Atomicity", d: "All or nothing: an R5,000 transfer must debit the sender AND credit the receiver — or be cancelled entirely." },
    { icon: "shield", text: "Consistency", d: "Follows the rules and keeps the data correct: sender R20,000 \u2192 R15,000, receiver R10,000 \u2192 R15,000." },
    { icon: "lock", text: "Isolation", d: "Simultaneous transactions do not interfere: Client A's R5,000 and Client B's R2,000 each run as if on their own." },
    { icon: "database", text: "Durability", d: "Once the transfer completes, the balances are saved permanently — a crash or power loss cannot undo them." },
  ], { y: 1.75, cols: 2, rowH: 2.35 });
}

/* ============================================================= DATABASES */
{
  const s = slide();
  eyebrowTitle(s, "Storing and retrieving", "Databases and files");
  introText(s, "A database is a collection of data neatly organised, storing the accounting and operational records — accurate, protected, and used many times a day.", 1.4, 0.72);
  iconCards(s, [
    { icon: "layers", text: "Hierarchical", d: "Data in a series of levels — top-to-bottom nodes and branches; each child links to only ONE parent node." },
    { icon: "network", text: "Network", d: "Nodes and branches like hierarchical — but each child can link to MULTIPLE higher parent nodes." },
    { icon: "dashboard", text: "Relational", d: "Data in a series of related tables — flexibility comes from the relationships built between tables." },
  ], { y: 2.35, cols: 3, rowH: 2.5 });
}

/* ============================================================= BATCH VS ONLINE */
{
  const s = slide();
  eyebrowTitle(s, "Data processing", "Batch and on-line systems");
  iconCards(s, [
    { icon: "folder", text: "Batch systems", d: "Transactions are collected over a period and dealt with in one go — mail-order tickets batched in 50s, keyed in, then the stock-control program runs. Hours may pass, but a 4–5 day delivery makes that acceptable." },
    { icon: "clock", text: "On-line systems", d: "Updates happen immediately — critical for production-line sensors checking imbalances. A travel-agent ticket updates the airline's computer within seconds: pseudo-on-line processing." },
  ], { y: 1.75, cols: 2, rowH: 2.9 });
}

/* ============================================================= KWS */
{
  const s = slide();
  eyebrowTitle(s, "Knowledge work systems", "Software for technical expertise");
  bulletList(s, [
    "Word-processing for clerical staff · spreadsheets for accounts and sales · database management systems for records.",
    "CAD for designers · project management systems · expert systems for specialist staff.",
    "Expert system example: an engineer types in the parameters for a bearing and the system suggests several alloys — the engineer's knowledge and experience make the final choice.",
    "Computers are networked; large organisations link several LANs so staff communicate by e-mail, document scanning, web-cams and video conferencing.",
  ], { y: 1.7, h: 4.7 });
}

/* ============================================================= MIS */
{
  const s = slide();
  eyebrowTitle(s, "Management information systems", "The MIS and the manager's five functions");
  card(s, MX, 1.7, CW, 1.15, { fill: LIGHT });
  s.addText("The role of an MIS is to convert data from internal and external sources into information used to make effective decisions for planning, directing and controlling.", {
    x: MX + 0.25, y: 1.85, w: CW - 0.5, h: 0.9, fontFace: BODY_FONT, fontSize: 19, bold: true, color: NAVY, lineSpacingMultiple: 1.15, valign: "middle",
  });
  iconCards(s, [
    { icon: "target", text: "Planning — the direction a company takes, e.g. diversifying, where to operate" },
    { icon: "people", text: "Organising — resources such as people, space, equipment and services" },
    { icon: "network", text: "Coordinating — the activities of various departments" },
    { icon: "check", text: "Decision-making — the organisation, products, employees, use of IT" },
    { icon: "search", text: "Controlling — monitoring and supervising the activities of others" },
  ], { y: 3.1, cols: 2, rowH: 0.95, gap: 0.18 });
}

/* ============================================================= DP VS OIS VS MIS */
{
  const s = slide();
  eyebrowTitle(s, "Management information systems", "From data processing to management information");
  iconCards(s, [
    { icon: "database", text: "Data processing systems", d: "Record day-to-day transactions — e.g. the sale of a CD to a customer." },
    { icon: "document", text: "Operational information systems", d: "Read the collected data and produce lists — e.g. items that need to be re-ordered." },
    { icon: "chart", text: "The MIS", d: "Analyses sales data to highlight trends per product line — special promotion, or discontinue?" },
  ], { y: 1.75, cols: 3, rowH: 2.7 });
}

/* ============================================================= MIS SOURCES */
{
  const s = slide();
  eyebrowTitle(s, "Management information systems", "Information sources and flows");
  bulletList(s, [
    "Internal information comes easily from systems on the company network, e.g. sales figures per product line.",
    "External information: intelligence about competitors (press, leaks, even industrial espionage) · population shifts · economic and social factors · government legislation.",
    "Formal flows follow a procedure — Monday-morning branch downloads, agencies like Dun and Bradstreet, shared documents, e-mail, company intranets.",
    "Informal flows come from chance meetings, magazines, newspapers, or the news on TV.",
  ], { y: 1.7, h: 4.7 });
}

/* ============================================================= MIS LEVELS */
{
  const s = slide();
  eyebrowTitle(s, "Management information systems", "Three levels of information for managers");
  dataTable(s, ["Level", "Decisions it serves", "Example"], [
    ["Operational", "Day-to-day decisions", "Ordering in more stock"],
    ["Tactical", "Short to medium term", "Introducing a new product to a retail outlet"],
    ["Strategic", "Long term — the organisation's future", "Opening a new store, or taking over a rival"],
  ], { y: 2.0, colW: [2.6, 4.8, 4.83], rowH: 0.75 });
}

/* ============================================================= DECISIONS */
{
  const s = slide();
  eyebrowTitle(s, "Types of decision", "Structured, unstructured — and the four stages");
  iconCards(s, [
    { icon: "check", text: "Structured", d: "Repetitive, with a definite routine — stock below 15% triggers an order." },
    { icon: "search", text: "Unstructured", d: "Needs knowledge, insight and evaluation — may crop up without warning." },
  ], { y: 1.75, cols: 2, rowH: 1.9 });
  card(s, MX, 3.95, CW, 2.6, { fill: LIGHT });
  s.addText("THE DECISION STAGES", { x: MX + 0.25, y: 4.12, w: CW - 0.5, h: 0.36, fontFace: BODY_FONT, fontSize: MIN_FONT, bold: true, color: BLUE, charSpacing: 1 });
  s.addText(
    [
      "1. Recognise the problem — the MIS shows where performance is off.",
      "2. Consider the solution — \u201cwhat if\u201d scenarios in a spreadsheet.",
      "3. Choose — the manager's experience plus the MIS's information.",
      "4. Implement and review — the MIS supplies the evaluation data.",
    ].map((t) => ({ text: t, options: { color: NAVY, breakLine: true } })),
    { x: MX + 0.25, y: 4.52, w: CW - 0.5, h: 1.9, fontFace: BODY_FONT, fontSize: MIN_FONT, valign: "top", lineSpacingMultiple: 1.2, paraSpaceAfter: 6 }
  );
}

/* ============================================================= YOUR WORK */
{
  const s = slide();
  eyebrowTitle(s, "Now prove it", "Your work for Lesson 2");
  iconCards(s, [
    { icon: "chat", text: "Questioning session", d: "System concept, Input–Process–Output, three types of IS — AI-marked." },
    { icon: "dashboard", text: "Knowledge check quiz 2", d: "10 questions on systems theory and information systems. 80%+ is competent." },
    { icon: "check", text: "Self assessment", d: "Tick the systems-theory statement honestly — or write it down as a goal." },
    { icon: "folder", text: "Logbook project — Research", d: "Your IT-in-business research project also evidences this outcome. Mark it 114050." },
  ], { y: 1.75, cols: 2, rowH: 2.35 });
}

/* ============================================================= CLOSING */
{
  const s = slide();
  s.background = { color: NAVY };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.12, fill: { color: BLUE } });
  addIcon(s, "layers", MX, 1.6, 0.7, "#" + DARK_LABEL);
  s.addText("Every business is a system — IT keeps it running.", {
    x: MX, y: 2.45, w: CW, h: 1.4, fontFace: TITLE_FONT, fontSize: 36, bold: true, color: WHITE,
  });
  s.addText("Inputs \u2192 process \u2192 outputs · TPS, KWS and MIS · ACID-safe transactions · databases · batch and on-line processing · information for operational, tactical and strategic decisions.", {
    x: MX, y: 3.95, w: 11.0, h: 1.4, fontFace: BODY_FONT, fontSize: MIN_FONT, color: DARK_SUB, lineSpacingMultiple: 1.25,
  });
  s.addText("US 114050 · National Certificate: IT — System Support · SAQA ID 48573 · ITSS Learn", {
    x: MX, y: H - 0.62, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: MIN_FONT, color: DARK_MUTED,
  });
}

mkdirSync("public/downloads", { recursive: true });
const OUT = "public/downloads/US-114050-L2-Systems-Theory.pptx";
await pptx.writeFile({ fileName: OUT });
console.log(`Written ${OUT} — ${pageNo} slides (min font ${MIN_FONT}pt)`);
