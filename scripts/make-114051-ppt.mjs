// Generates the US 114051 lesson deck (Microsoft Fluent / Learn style — same
// styling as the US 114050 deck). Accessibility rule: NO text below 18pt.
// Run: node scripts/make-114051-ppt.mjs -> public/downloads/US-114051-Technical-Practitioners-Meeting.pptx
// PDF for the Course material tab: open the PPTX in PowerPoint and export, or run
//   powershell scripts/convert-114051-pdf.ps1
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
  presenter: '<rect x="3.5" y="4" width="17" height="11" rx="1.5"/><path d="M12 15v3.5M8.5 21h7"/><path d="m8.5 8 2.5 2.5L15.5 6"/>',
  gavel: '<path d="m9 7 5 5M7 9l5 5M12.5 3.5 20 11M3.5 20.5h9"/><path d="m5.5 13 5.5-5.5 5 5L10.5 18z"/>',
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
pptx.title = "US 114051 — Conduct a Technical Practitioners Meeting";

let pageNo = 0;

function slide() {
  const s = pptx.addSlide();
  s.background = { color: WHITE };
  pageNo += 1;
  if (pageNo > 1) {
    s.addText("US 114051 · Conduct a technical practitioners meeting · NQF 5 · 4 credits", {
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
  s.addText("US 114051 · NQF LEVEL 5 · 4 CREDITS", { x: MX, y: 1.1, w: 5.9, h: 0.62, fontFace: BODY_FONT, fontSize: MIN_FONT, bold: true, color: WHITE, align: "center", valign: "middle", charSpacing: 1 });
  s.addText("Conduct a Technical Practitioners Meeting", { x: MX, y: 1.9, w: 10.8, h: 1.85, fontFace: TITLE_FONT, fontSize: 38, bold: true, color: NAVY });
  s.addText("Meeting types, leadership styles and decision-making — then prepare, chair and follow up a technical meeting of your own", { x: MX, y: 3.8, w: 9.7, h: 0.75, fontFace: BODY_FONT, fontSize: 19, color: GREY, lineSpacingMultiple: 1.15 });
  addIcon(s, "people", 11.0, 1.4, 1.8, "#" + BORDER);
  s.addShape(pptx.ShapeType.line, { x: MX, y: 4.62, w: CW, h: 0, line: { color: BORDER, width: 1 } });
  const meta = [
    ["TIME", "90-minute lessons · Self & Group"],
    ["SESSIONS", "Fridays, 4 & 11 Sep 2026 · 09h00 – 14h00"],
    ["MODULE", "Module 1 · Personal Development"],
    ["QUALITY ASSURANCE", "QCTO / MICT SETA"],
  ];
  meta.forEach(([k, v], i) => {
    const x = MX + i * (CW / 4);
    s.addText(k, { x, y: 4.82, w: CW / 4 - 0.2, h: 0.36, fontFace: BODY_FONT, fontSize: MIN_FONT, bold: true, color: BLUE, charSpacing: 0.5, wrap: false });
    s.addText(v, { x, y: 5.2, w: CW / 4 - 0.2, h: 1.0, fontFace: BODY_FONT, fontSize: MIN_FONT, color: NAVY, lineSpacingMultiple: 1.1 });
  });
  s.addText("ITSS Learn · Investec · Corporate Banking Technology", { x: MX, y: H - 0.62, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: MIN_FONT, color: GREY });
}

/* ============================================================= OUTCOMES */
{
  const s = slide();
  eyebrowTitle(s, "Specific outcomes & assessment criteria", "What you must be able to do");
  introText(s, "Four specific outcomes take you from knowing how meetings work to running one end-to-end. You will be assessed against these:", 1.4, 0.55);
  iconCards(s, [
    { icon: "book", text: "1 · Know the meetings", d: "Describe the types of technical meetings and their uses; identify leadership styles, decision-making processes and meeting conventions." },
    { icon: "calendar", text: "2 · Prepare", d: "Venue, facilities, technology and supporting information in place; clear documented outcomes; timeous invitations; agenda distributed." },
    { icon: "presenter", text: "3 · Chair", d: "Establish rules with members, apply agreed conventions, follow the agenda, enable participation, prioritise topics, land clear decisions." },
    { icon: "document", text: "4 · Follow up", d: "Accurate minutes per organisational policy; decisions communicated in the required format and timeframe; actions summarised." },
  ], { y: 2.1, cols: 2, rowH: 2.2 });
}

/* ============================================================= WHY MEETINGS MATTER */
{
  const s = slide();
  eyebrowTitle(s, "Introduction", "Why technical practitioners meet");
  bulletList(s, [
    "Meetings are very important for the work of any organisation — they are where the technical team decides, plans and holds itself accountable.",
    "Good meetings support collective decision-making, planning and follow-up, accountability and democracy.",
    "The principal activities of a technical committee are the development and maintenance of its standards, technical reports and data files.",
    "A badly run meeting wastes the scarcest resource a technical team has — its practitioners' time.",
  ], { y: 1.8, h: 3.4 });
  card(s, MX, 5.35, CW, 1.05, { fill: LIGHT });
  addIcon(s, "check", MX + 0.22, 5.68, 0.38);
  s.addText("By the end of this unit you will have prepared, chaired and minuted a technical practitioners meeting yourself — that is the evidence in your logbook.", {
    x: MX + 0.72, y: 5.35, w: CW - 0.98, h: 1.05, fontFace: BODY_FONT, fontSize: MIN_FONT, color: NAVY, valign: "middle", lineSpacingMultiple: 1.1,
  });
}

/* ============================================================= MEETING TYPES */
{
  const s = slide();
  eyebrowTitle(s, "Types of technical practitioners meetings", "Three meetings you must know");
  introText(s, "Organisations hold many kinds of meetings — general members, special, executive, AGMs. For technical practitioners, three types matter most:", 1.4, 0.55);
  iconCards(s, [
    { icon: "briefcase", text: "Contract meetings", d: "Discuss, review and manage contractual obligations and deliverables related to technical projects or services." },
    { icon: "search", text: "Technical review meetings", d: "Evaluate technical solutions, designs and implementations, and resolve technical issues and problems." },
    { icon: "chart", text: "Project review meetings", d: "Assess project progress, timelines, resource allocation and project deliverables." },
  ], { y: 2.2, cols: 3, rowH: 2.9 });
}

/* ============================================================= LEADERSHIP STYLES */
{
  const s = slide();
  eyebrowTitle(s, "Leadership styles", "Who decides — the chair, the group, or both?");
  introText(s, "Three main leadership styles are used in meeting procedures. Choose the style that fits the meeting's purpose:", 1.4, 0.4);
  iconCards(s, [
    { icon: "people", text: "Democratic", d: "The members decide through discussion and voting. The chair guides the process, but the group makes the decision." },
    { icon: "person", text: "Autocratic", d: "The chairperson controls the meeting and takes the decisions; members give input only when asked. Fast — use with care." },
    { icon: "chat", text: "Facilitative", d: "A group effort: the facilitator guides the process while staying neutral, and the group produces the outcome together." },
  ], { y: 2.05, cols: 3, rowH: 3.0 });
}

/* ============================================================= DECISION-MAKING */
{
  const s = slide();
  eyebrowTitle(s, "Decision-making processes", "Five ways meetings reach a decision");
  iconCards(s, [
    { icon: "check", text: "Voting", d: "Each member votes; the option with the majority is adopted." },
    { icon: "people", text: "Consensus", d: "Discussion continues until every member can accept the decision." },
    { icon: "chart", text: "Criteria-based rating", d: "Score options against agreed criteria — the highest score wins." },
    { icon: "layers", text: "Ranking", d: "Members order the options by preference; rankings are combined." },
    { icon: "design", text: "Paired comparisons", d: "Compare options two at a time; the overall winner is selected." },
    { icon: "target", text: "Match the process", d: "Pick the process that fits the decision's importance, urgency and need for buy-in." },
  ], { y: 1.75, cols: 3, rowH: 2.3 });
}

/* ============================================================= CONVENTIONS */
{
  const s = slide();
  eyebrowTitle(s, "Meeting conventions & procedures", "Order, fairness and effective decisions");
  iconCards(s, [
    { icon: "pen", text: "Moving", d: "Formally propose a motion for the meeting to consider." },
    { icon: "person", text: "Seconding", d: "A second member supports the motion — unseconded motions fall away." },
    { icon: "document", text: "Amending", d: "Modify the motion before the vote; amendments are voted on first." },
    { icon: "check", text: "Voting procedures", d: "Show of hands, ballot or poll — counted and recorded by the chair." },
  ], { y: 1.7, cols: 2, rowH: 1.95 });
  card(s, MX, 5.75, CW, 0.95, { fill: LIGHT });
  addIcon(s, "book", MX + 0.22, 6.03, 0.38);
  s.addText("The note taker needs a technical background — minutes must capture the terminology, decisions and reasons accurately.", {
    x: MX + 0.72, y: 5.75, w: CW - 0.98, h: 0.95, fontFace: BODY_FONT, fontSize: MIN_FONT, color: NAVY, valign: "middle", lineSpacingMultiple: 1.1,
  });
}

/* ============================================================= PREPARATION — ARRANGEMENTS */
{
  const s = slide();
  eyebrowTitle(s, "Prepare the meeting", "Physical arrangements — nothing left to chance");
  introText(s, "Preparation is where a meeting is won. Four arrangements must be in place before anyone walks in:", 1.4, 0.4);
  iconCards(s, [
    { icon: "globe", text: "Venue", d: "Booked, accessible and set up for the meeting style — seating that lets practitioners face each other." },
    { icon: "folder", text: "Facilities", d: "Whiteboards, flip charts, stationery, refreshments — everything the discussion will need." },
    { icon: "dashboard", text: "Technology", d: "Projector, video conferencing, network access — prepared and tested before the meeting starts." },
    { icon: "document", text: "Supporting information", d: "Reports, designs and data the discussion depends on — available to every participant." },
  ], { y: 2.0, cols: 2, rowH: 2.15 });
}

/* ============================================================= PREPARATION — OUTCOMES & AGENDA */
{
  const s = slide();
  eyebrowTitle(s, "Prepare the meeting", "Outcomes, invitations and the agenda");
  iconCards(s, [
    { icon: "target", text: "Document the outcomes", d: "Intended outcomes must be clear, concise and well documented — the agenda is built around them and success is measured against them." },
    { icon: "calendar", text: "Invite timeously", d: "Early invitations let participants prepare, study the documentation and arrange their schedules — so the right people attend." },
    { icon: "pen", text: "Complete & distribute the agenda", d: "The agenda and supporting documentation are completed and distributed to all participants before the meeting." },
  ], { y: 1.8, cols: 3, rowH: 3.1 });
  s.addText("An agenda states the meeting's purpose, lists the items in priority order, and shows the time allocated to each.", {
    x: MX, y: 5.25, w: CW, h: 0.7, fontFace: BODY_FONT, fontSize: MIN_FONT, color: GREY, italic: true, lineSpacingMultiple: 1.15,
  });
}

/* ============================================================= CHAIRING — OPENING */
{
  const s = slide();
  eyebrowTitle(s, "Chair the meeting", "Open with rules the members own");
  const colW2 = (CW - 0.3) / 2;
  card(s, MX, 1.7, colW2, 4.9);
  s.addText("ESTABLISH RULES & GUIDELINES", { x: MX + 0.25, y: 1.9, w: colW2 - 0.5, h: 0.36, fontFace: BODY_FONT, fontSize: MIN_FONT, bold: true, color: BLUE, charSpacing: 1 });
  s.addText(
    [
      "Agree the rules in conjunction with the members at the start",
      "How to get the floor, how long contributions may run",
      "How decisions will be taken — and what is in scope",
      "Agreed rules create buy-in and prevent procedural disputes",
    ].map((t) => ({ text: t, options: { bullet: { characterCode: "2022", indent: 14 }, color: NAVY, breakLine: true } })),
    { x: MX + 0.25, y: 2.3, w: colW2 - 0.5, h: 4.1, fontFace: BODY_FONT, fontSize: MIN_FONT, valign: "top", lineSpacingMultiple: 1.2, paraSpaceAfter: 10 }
  );
  const x2 = MX + colW2 + 0.3;
  card(s, x2, 1.7, colW2, 4.9);
  s.addText("APPLY THE AGREED CONVENTIONS", { x: x2 + 0.25, y: 1.9, w: colW2 - 0.5, h: 0.36, fontFace: BODY_FONT, fontSize: MIN_FONT, bold: true, color: BLUE, charSpacing: 1 });
  s.addText(
    [
      "Run motions through moving, seconding and amending",
      "Follow the published agenda item by item",
      "Park unrelated issues and keep an eye on the clock",
      "Apply the conventions consistently — the same rules for everyone",
    ].map((t) => ({ text: t, options: { bullet: { characterCode: "2022", indent: 14 }, color: NAVY, breakLine: true } })),
    { x: x2 + 0.25, y: 2.3, w: colW2 - 0.5, h: 4.1, fontFace: BODY_FONT, fontSize: MIN_FONT, valign: "top", lineSpacingMultiple: 1.2, paraSpaceAfter: 10 }
  );
}

/* ============================================================= CHAIRING — RUNNING */
{
  const s = slide();
  eyebrowTitle(s, "Chair the meeting", "Participation, priorities and decisions");
  bulletList(s, [
    "Provide for active participation by ALL members — invite quiet members by name, use round-robin turns, acknowledge every contribution.",
    "Keep debate on the issue, not the person — that is how conflict is minimised.",
    "Prioritise topics and allocate discussion time according to importance, urgency and complexity.",
    "Move minor items to the end of the agenda — or carry them over to the next meeting.",
    "Ensure agreed decisions are clear, accurate and include a time frame for action.",
    "Confirm each decision — and who owns it — with the members before moving on.",
  ], { y: 1.75, h: 4.9 });
}

/* ============================================================= DIFFICULT BEHAVIOURS */
{
  const s = slide();
  eyebrowTitle(s, "Chair the meeting", "Managing difficult behaviours");
  dataTable(s, ["Behaviour", "What the chair does"], [
    ["The heckler", "Stay calm; acknowledge any valid point and return to the agenda and agreed rules."],
    ["The overly talkative", "Thank them, summarise their point, and invite someone who has not yet spoken."],
    ["The cynic", "Ask for evidence and an alternative — turn the criticism into an agenda item or action."],
    ["The silent member", "Invite their input by name on a topic they know well."],
    ["Conflicting egos", "Keep debate on the issue, not the person; restate the meeting's outcomes."],
    ["Side conversations", "Pause the meeting and draw the conversation back to the floor."],
    ["Factually wrong statements", "Correct tactfully with the facts — or park the point for verification and record it."],
  ], { y: 1.75, colW: [3.6, 8.63], rowH: 0.62 });
}

/* ============================================================= FOLLOW-UP */
{
  const s = slide();
  eyebrowTitle(s, "Post-meeting follow-up", "The meeting is not over when it ends");
  iconCards(s, [
    { icon: "document", text: "Accurate minutes", d: "Attendance, discussions, decisions and actions — produced in line with organisational policy and checked before distribution." },
    { icon: "chat", text: "Communicate decisions", d: "To all affected stakeholders, in the required format — minutes, e-mail or report — and within the required timeframe." },
    { icon: "check", text: "Summarise actions", d: "Each action with its owner and deadline; unresolved items carried over to the next agenda." },
  ], { y: 1.8, cols: 3, rowH: 3.0 });
  s.addText("Decisions that are not communicated and tracked might as well not have been taken.", {
    x: MX, y: 5.15, w: CW, h: 0.6, fontFace: BODY_FONT, fontSize: MIN_FONT, color: GREY, italic: true, lineSpacingMultiple: 1.15,
  });
}

/* ============================================================= WHAT'S NEXT */
{
  const s = slide();
  eyebrowTitle(s, "Now prove it", "Your work for this unit standard");
  iconCards(s, [
    { icon: "chat", text: "Questioning sessions", d: "Four AI-marked questioning exercises — meeting types, preparation, chairing and follow-up." },
    { icon: "dashboard", text: "Knowledge check quizzes", d: "Four quizzes across the unit. 80%+ is competent." },
    { icon: "presenter", text: "Chair a meeting", d: "Role-play practical on Day 2 — every learner chairs a 10-minute technical meeting from a scenario card." },
    { icon: "folder", text: "Logbook project — Meeting portfolio", d: "Notice and agenda, invitations, attendance register, minutes and action summary. Mark it 114051." },
  ], { y: 1.75, cols: 2, rowH: 2.35 });
}

/* ============================================================= CLOSING */
{
  const s = slide();
  s.background = { color: NAVY };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.12, fill: { color: BLUE } });
  addIcon(s, "people", MX, 1.6, 0.7, "#" + DARK_LABEL);
  s.addText("Run the meeting — don't let the meeting run you.", {
    x: MX, y: 2.45, w: CW, h: 1.4, fontFace: TITLE_FONT, fontSize: 36, bold: true, color: WHITE,
  });
  s.addText("Meeting types \u2192 leadership styles \u2192 decision processes \u2192 conventions \u2192 preparation \u2192 chairing \u2192 follow-up — the meeting skills every technical practitioner needs to turn discussion into action.", {
    x: MX, y: 3.95, w: 11.0, h: 1.4, fontFace: BODY_FONT, fontSize: MIN_FONT, color: DARK_SUB, lineSpacingMultiple: 1.25,
  });
  s.addText("US 114051 · National Certificate: IT — System Support · SAQA ID 48573 · ITSS Learn", {
    x: MX, y: H - 0.62, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: MIN_FONT, color: DARK_MUTED,
  });
}

mkdirSync("public/downloads", { recursive: true });
const OUT = "public/downloads/US-114051-Technical-Practitioners-Meeting.pptx";
await pptx.writeFile({ fileName: OUT });
console.log(`Written ${OUT} — ${pageNo} slides (min font ${MIN_FONT}pt)`);
