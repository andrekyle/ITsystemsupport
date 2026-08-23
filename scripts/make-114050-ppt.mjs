// Generates the US 114050 lesson deck (Microsoft Fluent / Learn style — same
// styling as the Course Overview deck). Accessibility rule: NO text below 18pt.
// Run: node scripts/make-114050-ppt.mjs -> public/downloads/US-114050-Principles-of-Business.pptx
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
const MIN_FONT = 18; // smallest font size used anywhere in the deck

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
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="1.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
  chat: '<path d="M4 6.2A2.2 2.2 0 0 1 6.2 4h11.6A2.2 2.2 0 0 1 20 6.2v8.1a2.2 2.2 0 0 1-2.2 2.2H12l-4.5 3.6v-3.6H6.2A2.2 2.2 0 0 1 4 14.3z"/><path d="M8 9h8M8 12h5"/>',
  person: '<circle cx="12" cy="8" r="3.6"/><path d="M4.8 20c.8-3.7 3.6-5.6 7.2-5.6s6.4 1.9 7.2 5.6"/>',
  gradcap: '<path d="m12 4 10 4.5L12 13 2 8.5z"/><path d="M6.5 10.8v4.4c0 1.2 2.5 2.6 5.5 2.6s5.5-1.4 5.5-2.6v-4.4"/><path d="M22 8.5v5"/>',
  trend: '<path d="m3.5 17 5.5-5.5 3.5 3.5 7.5-7.5"/><path d="M15 7.5h5v5"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.3"/><path d="m15.5 15.5 5 5"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.3 4 5.2 4 8.5s-1.4 6.2-4 8.5c-2.6-2.3-4-5.2-4-8.5s1.4-6.2 4-8.5z"/>',
  design: '<circle cx="12" cy="12" r="8.5"/><path d="m14.8 9.2-1.7 4.5-4.5 1.7 1.7-4.5z"/>',
  dashboard: '<rect x="3.5" y="3.5" width="7.3" height="7.3" rx="1.2"/><rect x="13.2" y="3.5" width="7.3" height="7.3" rx="1.2"/><rect x="3.5" y="13.2" width="7.3" height="7.3" rx="1.2"/><rect x="13.2" y="13.2" width="7.3" height="7.3" rx="1.2"/>',
  layers: '<path d="M12 3.5l8.5 4.7L12 12.9 3.5 8.2z"/><path d="m3.5 12.4 8.5 4.7 8.5-4.7"/><path d="m3.5 16.3 8.5 4.7 8.5-4.7"/>',
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
pptx.title = "US 114050 — Principles of Business and the Role of Information Technology";

let pageNo = 0;

function slide() {
  const s = pptx.addSlide();
  s.background = { color: WHITE };
  pageNo += 1;
  if (pageNo > 1) {
    s.addText("US 114050 · Principles of business & the role of IT · NQF 5 · 4 credits", {
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
  s.addText("US 114050 · NQF LEVEL 5 · 4 CREDITS", { x: MX, y: 1.1, w: 5.9, h: 0.62, fontFace: BODY_FONT, fontSize: MIN_FONT, bold: true, color: WHITE, align: "center", valign: "middle", charSpacing: 1 });
  s.addText("Explain the Principles of Business and the Role of Information Technology", { x: MX, y: 1.9, w: 10.8, h: 1.85, fontFace: TITLE_FONT, fontSize: 38, bold: true, color: NAVY });
  s.addText("Forms of enterprise, business objectives and the environment within which businesses operate", { x: MX, y: 3.8, w: 9.7, h: 0.75, fontFace: BODY_FONT, fontSize: 19, color: GREY, lineSpacingMultiple: 1.15 });
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

/* ============================================================= OUTCOMES */
{
  const s = slide();
  eyebrowTitle(s, "Specific outcomes & assessment criteria", "What you must be able to do");
  introText(s, "Specific outcome: explain the principles of business and the role of information technology. You will be assessed against these criteria:");
  iconCards(s, [
    { icon: "layers", text: "Types of business organisations", d: "Distinguish sole trader, partnership, limited, private and public companies." },
    { icon: "target", text: "Common objectives", d: "Outline the objectives businesses pursue — buying & selling, profit, charity, social clubs." },
    { icon: "globe", text: "Business environment", d: "Outline the environment within which businesses operate." },
  ], { y: 2.25, cols: 3, rowH: 3.0 });
  card(s, MX, 5.55, CW, 0.85, { fill: LIGHT });
  addIcon(s, "check", MX + 0.22, 5.78, 0.38);
  s.addText("Choose your own business setup as you work through this lesson — every form of enterprise you meet is a candidate.", {
    x: MX + 0.72, y: 5.55, w: CW - 0.98, h: 0.85, fontFace: BODY_FONT, fontSize: MIN_FONT, color: NAVY, valign: "middle", lineSpacingMultiple: 1.1,
  });
}

/* ============================================================= FORMS OF ENTERPRISE */
{
  const s = slide();
  eyebrowTitle(s, "Forms of enterprises", "Four ways to own a business");
  introText(s, "The different types of businesses — from which you must choose your own setup.", 1.4, 0.4);
  iconCards(s, [
    { icon: "person", text: "Sole Proprietor", d: "One owner, no partners. No formal registration — but if the business fails, you personally become insolvent." },
    { icon: "people", text: "Partnership", d: "Two to 20 people making and sharing profits. Partners are jointly and severally liable for its debts." },
    { icon: "folder", text: "Closed Corporation", d: "A simple, flexible, inexpensive legal person for up to ten natural persons." },
    { icon: "briefcase", text: "Company", d: "The most advanced form — limits liability and improves access to capital. Private or public." },
  ], { y: 2.0, cols: 2, rowH: 2.15, fontSize: MIN_FONT });
}

/* ============================================================= COMPANY TABLE */
{
  const s = slide();
  eyebrowTitle(s, "The company (Pty Ltd)", "Private vs public company");
  introText(s, "Two types of profit-seeking companies are found in South Africa. The most important differences:", 1.4, 0.4);
  dataTable(s, ["", "Private Company", "Public Company"], [
    ["Members (shareholders)", "Between one and 50", "At least seven"],
    ["Directors", "At least one", "At least two"],
    ["Shares", "May not be offered to the public", "May be offered to the public"],
    ["Transfer of shares", "Needs the board's consent", "Freely transferable"],
    ["Name ends with", "(Pty.) Ltd.", "Ltd. or Limited"],
    ["Legal requirements", "Fewer requirements", "Numerous requirements"],
  ], { y: 1.95, colW: [3.6, 4.4, 4.23], rowH: 0.62 });
}

/* ============================================================= CLOSED CORPORATION */
{
  const s = slide();
  eyebrowTitle(s, "Forms of enterprises", "Closed corporations (CC)");
  bulletList(s, [
    "A simple, flexible, inexpensive legal structure for up to ten natural persons in business together.",
    "Maximum ten members; must be registered with the Registrar of Closed Corporations in Pretoria.",
    "A legal person — it can enter into contracts, operate a bank account, own property, sue or be sued.",
    "Formed by its members but exists independently — it continues even if membership changes or all members die.",
    "Established, run and terminated only in terms of the Closed Corporations Act.",
    "Each member holds an interest (a percentage); the interests must always add up to 100 percent.",
    "A company, corporation or trust may not be a member of a closed corporation.",
  ]);
}

/* ============================================================= PARTNERSHIPS */
{
  const s = slide();
  eyebrowTitle(s, "Forms of enterprises", "Partnerships");
  bulletList(s, [
    "A business association concluded between people who intend making and sharing profits.",
    "Not a legal person — its rights, duties and liabilities bind the individual partners.",
    "Minimum of two and maximum of 20 partners (certain professional partnerships may have more).",
    "Each partner is an agent of the partnership and binds all the other partners.",
    "Partners are jointly and severally liable for partnership debts; insolvency sequestrates every partner's estate.",
    "Always have a properly worded agreement drawn up by an attorney — covering death of a partner or dissolution.",
  ]);
}

/* ============================================================= SOLE PROPRIETOR */
{
  const s = slide();
  eyebrowTitle(s, "Forms of enterprises", "Sole proprietor");
  bulletList(s, [
    "Only one person owns the business — there are no partners or co-owners.",
    "No formal registration, administration or termination; no statutes regulate sole owners.",
    "You do not have to work alone — you may employ people to help you run the business.",
    "If the business becomes insolvent, you personally become insolvent.",
  ], { y: 1.7, h: 2.6 });
  card(s, MX, 4.35, CW, 2.15, { fill: LIGHT });
  s.addText("BEFORE YOU START: RESEARCH THE NEED", { x: MX + 0.25, y: 4.55, w: CW - 0.5, h: 0.36, fontFace: BODY_FONT, fontSize: MIN_FONT, bold: true, color: BLUE, charSpacing: 1 });
  s.addText(
    "Your skills · your interests · other commitments · is there a market? · who is it? · how big? · the competition · growing or stagnant? · premises or home? · capital · right size · working hours · staffing · the risk",
    { x: MX + 0.25, y: 4.95, w: CW - 0.5, h: 1.45, fontFace: BODY_FONT, fontSize: MIN_FONT, color: NAVY, lineSpacingMultiple: 1.25 }
  );
}

/* ============================================================= CHOOSING AN IDEA */
{
  const s = slide();
  eyebrowTitle(s, "Choosing your idea", "New, existing or franchised?");
  introText(s, "Rate each idea against the research criteria on a scale of 1–10.", 1.4, 0.4);
  iconCards(s, [
    { icon: "pen", text: "Start a new business", d: "Your own idea from scratch — rate it against the checklist: skills, market, competition, capital, risk." },
    { icon: "briefcase", text: "Buy an existing one", d: "Revenue from day one with customers and suppliers in place — but you pay for goodwill and there may be unseen flaws." },
    { icon: "globe", text: "Open a franchise", d: "The in-between: a new business that is also a known brand. \u201cA marriage between a big business and a small business.\u201d" },
  ], { y: 2.0, cols: 3, rowH: 3.2 });
  s.addText("According to the South African Franchise Association, franchising is about to explode in South Africa.", {
    x: MX, y: 5.5, w: CW, h: 0.75, fontFace: BODY_FONT, fontSize: MIN_FONT, color: GREY, italic: true, lineSpacingMultiple: 1.15,
  });
}

/* ============================================================= FRANCHISING ROLES */
{
  const s = slide();
  eyebrowTitle(s, "Franchising", "Franchisor and franchisee");
  iconCards(s, [
    { icon: "award", text: "The franchisor", d: "A person or company with a highly marketable product or service. Achieves rapid expansion at relatively low cost." },
    { icon: "person", text: "The franchisee", d: "Licensed to perform the marketing function; provides most of the capital. Gains big-business purchasing and advertising advantages." },
  ], { y: 1.75, cols: 2, rowH: 2.5 });
  s.addText("The small size of the franchisee's business keeps small-business advantages — personal dedication and commitment — making franchising particularly suited to service businesses, at relatively low risk.", {
    x: MX, y: 4.55, w: CW, h: 1.3, fontFace: BODY_FONT, fontSize: MIN_FONT, color: GREY, lineSpacingMultiple: 1.25,
  });
}

/* ============================================================= FRANCHISE ADVANTAGES */
{
  const s = slide();
  eyebrowTitle(s, "Franchising", "Advantages of franchising");
  bulletList(s, [
    "Far greater chances of success — the franchisor supplies goods or services more cheaply.",
    "The franchisor obtains bigger discounts by buying in bulk for his outlets.",
    "The franchisee starts with a product or service that has an existing, acceptable image.",
    "Customers know the business, even if the outlet is new — an accepted brand from the start.",
    "A complete package: operations manual, accounting system, marketing, outlet design, staff training.",
    "Ongoing management advice — every outlet's success is in the franchisor's own interest.",
  ]);
}

/* ============================================================= FRANCHISE DISADVANTAGES + REQUIREMENTS */
{
  const s = slide();
  eyebrowTitle(s, "Franchising", "Disadvantages — and what you need");
  const colW = (CW - 0.3) / 2;
  card(s, MX, 1.7, colW, 5.0);
  s.addText("DISADVANTAGES", { x: MX + 0.25, y: 1.9, w: colW - 0.5, h: 0.36, fontFace: BODY_FONT, fontSize: MIN_FONT, bold: true, color: BLUE, charSpacing: 1 });
  s.addText(
    [
      "Selling rights restricted to a particular area only",
      "Strict franchisor controls for uniform quality and cleanliness",
      "Risk of becoming too dependent on the franchisor",
      "It costs money — initial franchise fees plus ongoing royalties",
    ].map((t) => ({ text: t, options: { bullet: { characterCode: "2022", indent: 14 }, color: NAVY, breakLine: true } })),
    { x: MX + 0.25, y: 2.3, w: colW - 0.5, h: 4.2, fontFace: BODY_FONT, fontSize: MIN_FONT, valign: "top", lineSpacingMultiple: 1.2, paraSpaceAfter: 10 }
  );
  const x2 = MX + colW + 0.3;
  card(s, x2, 1.7, colW, 5.0);
  s.addText("WHAT YOU NEED", { x: x2 + 0.25, y: 1.9, w: colW - 0.5, h: 0.36, fontFace: BODY_FONT, fontSize: MIN_FONT, bold: true, color: BLUE, charSpacing: 1 });
  s.addText(
    [
      "The qualities of a successful entrepreneur",
      "A thorough investigation of the franchisor's track record",
      "Contact with existing franchisees; established training",
      "An attorney to scrutinise the franchise agreement — fair to both parties",
      "Loans come easier to franchises because of the reduced risk",
    ].map((t) => ({ text: t, options: { bullet: { characterCode: "2022", indent: 14 }, color: NAVY, breakLine: true } })),
    { x: x2 + 0.25, y: 2.3, w: colW - 0.5, h: 4.2, fontFace: BODY_FONT, fontSize: MIN_FONT, valign: "top", lineSpacingMultiple: 1.2, paraSpaceAfter: 10 }
  );
}

/* ============================================================= WHAT ARE FRANCHISED BUSINESSES */
{
  const s = slide();
  eyebrowTitle(s, "Franchising", "What are franchised businesses?");
  introText(s, "Think McDonald's, Steers, Spar, Shoprite — the same name and goods at the same prices.", 1.4, 0.4);
  bulletList(s, [
    "The largest criterion: every outlet must look uniformly the same and sell the branded products the franchisor suggests.",
    "Products are increasingly labelled as \u201chouse brands\u201d — a building tool for the franchise brand name.",
    "The brand gives consumers peace of mind: the same quality from one outlet as from the next.",
    "This is the brand consumers long for — confidence in the quality of the product they are buying.",
  ], { y: 2.05, h: 4.3 });
}

/* ============================================================= AIMS / OBJECTIVES / MISSION */
{
  const s = slide();
  eyebrowTitle(s, "Direction", "Aims, objectives and mission statements");
  introText(s, "A sole trader may have unstated aims — like surviving the first year. Others state exactly what they aim to do: Amazon wants to \u201cmake history and have fun\u201d.");
  iconCards(s, [
    { icon: "target", text: "An aim", d: "Where the business wants to go — its goals. E.g. \u201cwe want to grow the business into Europe.\u201d" },
    { icon: "chart", text: "Objectives", d: "Stated, measurable targets for achieving the aims — e.g. \u201c\u20ac10 million of European sales in 2004.\u201d" },
    { icon: "document", text: "A mission statement", d: "Sets out the vision and values so staff, customers and suppliers understand the basis for the business's actions." },
  ], { y: 2.3, cols: 3, rowH: 3.1 });
}

/* ============================================================= SMART */
{
  const s = slide();
  eyebrowTitle(s, "Business objectives", "SMART objectives");
  introText(s, "Objectives give a clearly defined target — plans can be made and progress measured.", 1.4, 0.4);
  iconCards(s, [
    { icon: "target", text: "S — Specific", d: "Aimed at what the business does, e.g. a hotel filling 60% of its beds a night." },
    { icon: "chart", text: "M — Measurable", d: "A value can be put on it, e.g. \u20ac10,000 in sales in the next half year." },
    { icon: "people", text: "A — Agreed", d: "By all those concerned in trying to achieve the objective." },
    { icon: "check", text: "R — Realistic", d: "Challenging, but achievable with the resources available." },
    { icon: "clock", text: "T — Time specific", d: "A time limit for achievement, e.g. by the end of the year." },
  ], { y: 2.0, cols: 3, rowH: 2.2 });
}

/* ============================================================= MAIN OBJECTIVES */
{
  const s = slide();
  eyebrowTitle(s, "Business objectives", "The main objectives businesses pursue");
  iconCards(s, [
    { icon: "shield", text: "Survival", d: "Short-term — new businesses, new entrants to a market, or a time of crisis." },
    { icon: "trend", text: "Profit maximisation", d: "Make the most profit possible — the likely aim of the owners and shareholders." },
    { icon: "check", text: "Profit satisfying", d: "Enough profit to keep the owners comfortable — without working longer hours." },
    { icon: "chart", text: "Sales growth", d: "Make as many sales as possible — survival through size and economies of scale." },
  ], { y: 1.75, cols: 2, rowH: 2.35 });
}

/* ============================================================= CONFLICTING & CHANGING OBJECTIVES */
{
  const s = slide();
  eyebrowTitle(s, "Business objectives", "When objectives conflict — and why they change");
  card(s, MX, 1.75, CW, 2.3, { fill: LIGHT });
  s.addText("WHEN OBJECTIVES CONFLICT", { x: MX + 0.25, y: 1.95, w: CW - 0.5, h: 0.36, fontFace: BODY_FONT, fontSize: MIN_FONT, bold: true, color: BLUE, charSpacing: 1 });
  s.addText(
    [
      "Growth vs profit: price cuts lift short-term sales but reduce short-term profit.",
      "Short term vs long term: cash flow drops now while investing in new products and equipment.",
      "Large Stock Exchange investors are often accused of chasing short-term performance.",
    ].map((t) => ({ text: t, options: { bullet: { characterCode: "2022", indent: 14 }, color: NAVY, breakLine: true } })),
    { x: MX + 0.25, y: 2.38, w: CW - 0.5, h: 1.55, fontFace: BODY_FONT, fontSize: MIN_FONT, valign: "top", lineSpacingMultiple: 1.2, paraSpaceAfter: 8 }
  );
  card(s, MX, 4.3, CW, 2.3);
  s.addText("WHY OBJECTIVES CHANGE", { x: MX + 0.25, y: 4.5, w: CW - 0.5, h: 0.36, fontFace: BODY_FONT, fontSize: MIN_FONT, bold: true, color: BLUE, charSpacing: 1 });
  s.addText(
    [
      "An objective is achieved and a new one is needed — survival in year one, profit in year two.",
      "Competitors launch new products or cut prices, so targets must be revised.",
      "Technology changes product designs, so sales and production targets change too.",
    ].map((t) => ({ text: t, options: { bullet: { characterCode: "2022", indent: 14 }, color: NAVY, breakLine: true } })),
    { x: MX + 0.25, y: 4.93, w: CW - 0.5, h: 1.55, fontFace: BODY_FONT, fontSize: MIN_FONT, valign: "top", lineSpacingMultiple: 1.2, paraSpaceAfter: 8 }
  );
}

/* ============================================================= ALTERNATIVE AIMS */
{
  const s = slide();
  eyebrowTitle(s, "Alternative aims and objectives", "Not all businesses seek profit or growth");
  iconCards(s, [
    { icon: "shield", text: "Ethical businesses", d: "The Co-op, the Body Shop — led by beliefs about the environment and people." },
    { icon: "briefcase", text: "Public corporations", d: "Profit plus a public service — e.g. cheap, accessible transport." },
    { icon: "search", text: "Public regulators", d: "Monitor the private sector — ensuring businesses comply with the law." },
    { icon: "gradcap", text: "Health & education", d: "Most private schools have charitable status; the aim is educating pupils." },
    { icon: "people", text: "Charities & voluntary", d: "Aims and objectives led by the beliefs they stand for." },
  ], { y: 1.75, cols: 3, rowH: 2.3 });
}

/* ============================================================= WHAT'S NEXT */
{
  const s = slide();
  eyebrowTitle(s, "Now prove it", "Your work for this unit standard");
  iconCards(s, [
    { icon: "chat", text: "Questioning session", d: "Distinguish the forms of enterprise and outline the objectives — typed answers, AI-marked." },
    { icon: "dashboard", text: "Knowledge check quiz", d: "10 questions on everything in this lesson. 80%+ is competent." },
    { icon: "check", text: "Self assessment", d: "Be honest with yourself — tick what you can do, write goals for the rest." },
    { icon: "folder", text: "Logbook project — Research", d: "Compile a project showing how IT is used in everyday business. Mark it 114050." },
  ], { y: 1.75, cols: 2, rowH: 2.35 });
}

/* ============================================================= CLOSING */
{
  const s = slide();
  s.background = { color: NAVY };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.12, fill: { color: BLUE } });
  addIcon(s, "briefcase", MX, 1.6, 0.7, "#" + DARK_LABEL);
  s.addText("Know the business — then support its technology.", {
    x: MX, y: 2.45, w: CW, h: 1.4, fontFace: TITLE_FONT, fontSize: 36, bold: true, color: WHITE,
  });
  s.addText("Forms of enterprise \u2192 researching the idea \u2192 franchising \u2192 aims, SMART objectives and the environments businesses operate in — the business context every IT systems support professional works inside.", {
    x: MX, y: 3.95, w: 11.0, h: 1.4, fontFace: BODY_FONT, fontSize: MIN_FONT, color: DARK_SUB, lineSpacingMultiple: 1.25,
  });
  s.addText("US 114050 · National Certificate: IT — System Support · SAQA ID 48573 · ITSS Learn", {
    x: MX, y: H - 0.62, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: MIN_FONT, color: DARK_MUTED,
  });
}

mkdirSync("public/downloads", { recursive: true });
const OUT = "public/downloads/US-114050-Principles-of-Business.pptx";
await pptx.writeFile({ fileName: OUT });
console.log(`Written ${OUT} — ${pageNo} slides (min font ${MIN_FONT}pt)`);
