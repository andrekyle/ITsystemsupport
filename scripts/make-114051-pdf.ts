/*
 * Renders the US 114051 deck as a PDF for the Course material tab, in the
 * same Microsoft Fluent / Learn style as the US 114050 decks and the
 * companion PPTX (scripts/make-114051-ppt.mjs) — same slides, geometry,
 * colours and iconography. pdfkit draws the icons as vector paths, so no
 * PowerPoint install is needed to produce the PDF.
 *
 * Run:  npx tsx scripts/make-114051-pdf.ts
 * Out:  public/downloads/US-114051-Technical-Practitioners-Meeting.pdf
 */
import { mkdirSync, createWriteStream } from "node:fs";
import PDFDocument from "pdfkit";

const IN = 72; // points per inch
const W = 13.33 * IN;
const H = 7.5 * IN;
const MX = 0.55 * IN;
const CW = W - MX * 2;

const BLUE = "#0F6CBD";
const NAVY = "#002050";
const LIGHT = "#EAF4FF";
const GREY = "#6B7280";
const WHITE = "#FFFFFF";
const BORDER = "#D5E3F2";
const DARK_LABEL = "#8CC2F0";
const DARK_SUB = "#B9D6F2";
const DARK_MUTED = "#6E93BC";

const TITLE_FONT = "Helvetica-Bold";
const BODY_FONT = "Helvetica";
const BODY_ITALIC = "Helvetica-Oblique";
const MIN_FONT = 18;

/* Fluent icon set — same 24-unit stroke icons as the PPTX generator. */
const ICONS: Record<string, string> = {
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
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="1.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
  chat: '<path d="M4 6.2A2.2 2.2 0 0 1 6.2 4h11.6A2.2 2.2 0 0 1 20 6.2v8.1a2.2 2.2 0 0 1-2.2 2.2H12l-4.5 3.6v-3.6H6.2A2.2 2.2 0 0 1 4 14.3z"/><path d="M8 9h8M8 12h5"/>',
  person: '<circle cx="12" cy="8" r="3.6"/><path d="M4.8 20c.8-3.7 3.6-5.6 7.2-5.6s6.4 1.9 7.2 5.6"/>',
  trend: '<path d="m3.5 17 5.5-5.5 3.5 3.5 7.5-7.5"/><path d="M15 7.5h5v5"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.3"/><path d="m15.5 15.5 5 5"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.3 4 5.2 4 8.5s-1.4 6.2-4 8.5c-2.6-2.3-4-5.2-4-8.5s1.4-6.2 4-8.5z"/>',
  design: '<circle cx="12" cy="12" r="8.5"/><path d="m14.8 9.2-1.7 4.5-4.5 1.7 1.7-4.5z"/>',
  dashboard: '<rect x="3.5" y="3.5" width="7.3" height="7.3" rx="1.2"/><rect x="13.2" y="3.5" width="7.3" height="7.3" rx="1.2"/><rect x="3.5" y="13.2" width="7.3" height="7.3" rx="1.2"/><rect x="13.2" y="13.2" width="7.3" height="7.3" rx="1.2"/>',
  layers: '<path d="M12 3.5l8.5 4.7L12 12.9 3.5 8.2z"/><path d="m3.5 12.4 8.5 4.7 8.5-4.7"/><path d="m3.5 16.3 8.5 4.7 8.5-4.7"/>',
  presenter: '<rect x="3.5" y="4" width="17" height="11" rx="1.5"/><path d="M12 15v3.5M8.5 21h7"/><path d="m8.5 8 2.5 2.5L15.5 6"/>',
};

mkdirSync("public/downloads", { recursive: true });
const OUT = "public/downloads/US-114051-Technical-Practitioners-Meeting.pdf";
const doc = new PDFDocument({
  size: [W, H],
  margins: { top: 0, bottom: 0, left: 0, right: 0 },
  autoFirstPage: false,
  info: {
    Title: "US 114051 — Conduct a Technical Practitioners Meeting",
    Author: "Andre Snell",
    Subject: "NQF 5 · 4 credits — lesson slide deck",
  },
});
doc.pipe(createWriteStream(OUT));

/* ------------------------------------------------------------ helpers */
const inx = (v: number) => v * IN;

function drawIcon(name: string, x: number, y: number, size = 0.34, color = BLUE) {
  const body = ICONS[name];
  if (!body) throw new Error(`Unknown icon: ${name}`);
  doc.save();
  doc.translate(inx(x), inx(y)).scale(inx(size) / 24);
  doc.lineWidth(1.4).lineCap("round").lineJoin("round").strokeColor(color);
  const els = body.match(/<(circle|rect|path)[^>]*\/>/g) ?? [];
  for (const el of els) {
    const attr = (n: string) => {
      const m = el.match(new RegExp(`${n}="([^"]+)"`));
      return m ? m[1] : undefined;
    };
    if (el.startsWith("<circle")) {
      doc.circle(Number(attr("cx")), Number(attr("cy")), Number(attr("r"))).stroke();
    } else if (el.startsWith("<rect")) {
      const rx = Number(attr("rx") ?? 0);
      doc.roundedRect(Number(attr("x")), Number(attr("y")), Number(attr("width")), Number(attr("height")), rx).stroke();
    } else {
      doc.path(attr("d")!).stroke();
    }
  }
  doc.restore();
}

interface TextOpts {
  font?: string;
  size?: number;
  color?: string;
  align?: "left" | "center" | "right";
  valign?: "top" | "middle";
  lineGap?: number;
  charSpacing?: number;
}

/** Text inside an inch-based box, with optional vertical centring. */
function textBox(text: string, x: number, y: number, w: number, h: number, o: TextOpts = {}) {
  const font = o.font ?? BODY_FONT;
  const size = o.size ?? MIN_FONT;
  doc.font(font).fontSize(size);
  const opts = {
    width: inx(w),
    align: o.align ?? ("left" as const),
    lineGap: o.lineGap ?? size * 0.18,
    characterSpacing: o.charSpacing ?? 0,
  };
  let ty = inx(y);
  if (o.valign === "middle") {
    const th = doc.heightOfString(text, opts);
    ty += Math.max(0, (inx(h) - th) / 2);
  }
  doc.fillColor(o.color ?? NAVY).text(text, inx(x), ty, opts);
}

function card(x: number, y: number, w: number, h: number, { fill = WHITE, line = BORDER } = {}) {
  const r = inx(0.09);
  doc.save();
  doc.fillOpacity(0.3).fillColor("#9AB4CC");
  doc.roundedRect(inx(x) + 1, inx(y) + 2.5, inx(w), inx(h), r).fill();
  doc.restore();
  doc.roundedRect(inx(x), inx(y), inx(w), inx(h), r).fillAndStroke(fill, line);
}

let pageNo = 0;
function slide(bg = WHITE) {
  doc.addPage();
  pageNo++;
  doc.rect(0, 0, W, H).fill(bg);
  if (pageNo > 1 && bg === WHITE) {
    textBox("US 114051 · Conduct a technical practitioners meeting · NQF 5 · 4 credits", 0.55, 7.5 - 0.46, CW / IN - 1, 0.38, { color: GREY });
    textBox(String(pageNo), W / IN - 0.55 - 0.7, 7.5 - 0.46, 0.7, 0.38, { color: GREY, align: "right" });
    doc.rect(0, 0, W, inx(0.09)).fill(BLUE);
  }
}

function eyebrowTitle(eyebrow: string, title: string) {
  textBox(eyebrow.toUpperCase(), 0.55, 0.3, CW / IN, 0.38, { font: TITLE_FONT, color: BLUE, charSpacing: 2 });
  textBox(title, 0.55, 0.68, CW / IN, 0.66, { font: TITLE_FONT, size: 30 });
}

function introText(text: string, y = 1.42) {
  textBox(text, 0.55, y, CW / IN, 0.68, { color: GREY });
}

interface CardItem {
  icon: string;
  text: string;
  d?: string;
}

function iconCards(items: CardItem[], { x = 0.55, y = 2.0, w = CW / IN, cols = 4, rowH = 1.6, gap = 0.2, titleSize = 20 } = {}) {
  const cw = (w - gap * (cols - 1)) / cols;
  items.forEach((it, i) => {
    const cx = x + (i % cols) * (cw + gap);
    const cy = y + Math.floor(i / cols) * (rowH + gap);
    card(cx, cy, cw, rowH);
    if (it.d) {
      drawIcon(it.icon, cx + 0.18, cy + 0.2, 0.38);
      textBox(it.text, cx + 0.66, cy + 0.14, cw - 0.84, 0.85, { font: TITLE_FONT, size: titleSize, valign: "middle" });
      textBox(it.d, cx + 0.18, cy + 1.06, cw - 0.36, rowH - 1.16, { color: GREY, lineGap: 2.5 });
    } else {
      drawIcon(it.icon, cx + 0.18, cy + rowH / 2 - 0.19, 0.38);
      textBox(it.text, cx + 0.68, cy + 0.08, cw - 0.86, rowH - 0.16, { valign: "middle" });
    }
  });
}

function bulletList(items: string[], { x = 0.55, y = 1.7, w = CW / IN, size = MIN_FONT, gap = 0.155 } = {}) {
  let cy = inx(y);
  doc.font(BODY_FONT).fontSize(size);
  for (const t of items) {
    doc.circle(inx(x) + 5, cy + size * 0.55, 2.6).fill(NAVY);
    doc.fillColor(NAVY).font(BODY_FONT).fontSize(size).text(t, inx(x) + 22, cy, { width: inx(w) - 26, lineGap: size * 0.2 });
    cy = doc.y + inx(gap);
  }
}

function labelledBullets(label: string, items: string[], x: number, y: number, w: number) {
  textBox(label, x + 0.25, y + 0.22, w - 0.5, 0.36, { font: TITLE_FONT, color: BLUE, charSpacing: 1 });
  bulletList(items, { x: x + 0.25, y: y + 0.68, w: w - 0.5, gap: 0.14 });
}

function dataTable(header: string[], rows: string[][], { x = 0.55, y = 2.0, w = CW / IN, colW, rowH = 0.55 }: { x?: number; y?: number; w?: number; colW: number[]; rowH?: number }) {
  const px = inx(x);
  let py = inx(y);
  const widths = colW.map((c) => inx(c));
  const rh = inx(rowH);
  // header
  doc.rect(px, py, widths.reduce((a, b) => a + b, 0), rh).fill(BLUE);
  let cx = px;
  header.forEach((t, c) => {
    doc.font(TITLE_FONT).fontSize(MIN_FONT).fillColor(WHITE);
    const th = doc.heightOfString(t, { width: widths[c] - 13 });
    doc.text(t, cx + 6.5, py + Math.max(2, (rh - th) / 2), { width: widths[c] - 13 });
    cx += widths[c];
  });
  py += rh;
  rows.forEach((r, i) => {
    doc.font(BODY_FONT).fontSize(MIN_FONT);
    const rowHeight = Math.max(rh, ...r.map((t, c) => doc.heightOfString(t, { width: widths[c] - 13 }) + 8));
    doc.rect(px, py, widths.reduce((a, b) => a + b, 0), rowHeight).fill(i % 2 ? LIGHT : WHITE);
    let cx2 = px;
    r.forEach((t, c) => {
      doc.fillColor(NAVY);
      const th = doc.heightOfString(t, { width: widths[c] - 13 });
      doc.text(t, cx2 + 6.5, py + Math.max(2, (rowHeight - th) / 2), { width: widths[c] - 13 });
      cx2 += widths[c];
    });
    py += rowHeight;
  });
  // grid
  doc.lineWidth(0.75).strokeColor(BORDER);
  doc.rect(px, inx(y), widths.reduce((a, b) => a + b, 0), py - inx(y)).stroke();
  let gx = px;
  for (let c = 0; c < widths.length - 1; c++) {
    gx += widths[c];
    doc.moveTo(gx, inx(y)).lineTo(gx, py).stroke();
  }
}

/* ============================================================= COVER */
slide();
doc.rect(0, 0, W, inx(0.12)).fill(BLUE);
doc.roundedRect(inx(0.55), inx(1.1), inx(5.9), inx(0.62), inx(0.31)).fill(BLUE);
textBox("US 114051 · NQF LEVEL 5 · 4 CREDITS", 0.55, 1.1, 5.9, 0.62, { font: TITLE_FONT, color: WHITE, align: "center", valign: "middle", charSpacing: 1 });
textBox("Conduct a Technical Practitioners Meeting", 0.55, 1.95, 10.8, 1.85, { font: TITLE_FONT, size: 38 });
textBox("Meeting types, leadership styles and decision-making — then prepare, chair and follow up a technical meeting of your own", 0.55, 3.82, 9.7, 0.75, { size: 19, color: GREY });
drawIcon("people", 11.0, 1.4, 1.8, BORDER);
doc.moveTo(inx(0.55), inx(4.62)).lineTo(W - inx(0.55), inx(4.62)).lineWidth(1).strokeColor(BORDER).stroke();
const meta: [string, string][] = [
  ["TIME", "90-minute lessons · Self & Group"],
  ["SESSIONS", "Fridays, 4 & 11 Sep 2026 · 09h00 – 14h00"],
  ["MODULE", "Module 1 · Personal Development"],
  ["QUALITY ASSURANCE", "QCTO / MICT SETA"],
];
meta.forEach(([k, v], i) => {
  const x = 0.55 + (i * CW) / 4 / IN;
  textBox(k, x, 4.84, CW / 4 / IN - 0.2, 0.36, { font: TITLE_FONT, color: BLUE, charSpacing: 1 });
  textBox(v, x, 5.22, CW / 4 / IN - 0.2, 1.0, {});
});
textBox("ITSS Learn · Investec · Corporate Banking Technology", 0.55, 7.5 - 0.58, CW / IN, 0.4, { color: GREY });

/* ============================================================= OUTCOMES */
slide();
eyebrowTitle("Specific outcomes & assessment criteria", "What you must be able to do");
introText("Four specific outcomes take you from knowing how meetings work to running one end-to-end. You will be assessed against these:");
iconCards(
  [
    { icon: "book", text: "1 · Know the meetings", d: "Describe the types of technical meetings and their uses; identify leadership styles, decision-making processes and meeting conventions." },
    { icon: "calendar", text: "2 · Prepare", d: "Venue, facilities, technology and supporting information in place; clear documented outcomes; timeous invitations; agenda distributed." },
    { icon: "presenter", text: "3 · Chair", d: "Establish rules with members, apply agreed conventions, follow the agenda, enable participation, prioritise topics, land clear decisions." },
    { icon: "document", text: "4 · Follow up", d: "Accurate minutes per organisational policy; decisions communicated in the required format and timeframe; actions summarised." },
  ],
  { y: 2.1, cols: 2, rowH: 2.2 }
);

/* ============================================================= WHY MEETINGS MATTER */
slide();
eyebrowTitle("Introduction", "Why technical practitioners meet");
bulletList(
  [
    "Meetings are very important for the work of any organisation — they are where the technical team decides, plans and holds itself accountable.",
    "Good meetings support collective decision-making, planning and follow-up, accountability and democracy.",
    "The principal activities of a technical committee are the development and maintenance of its standards, technical reports and data files.",
    "A badly run meeting wastes the scarcest resource a technical team has — its practitioners' time.",
  ],
  { y: 1.8 }
);
card(0.55, 5.35, CW / IN, 1.05, { fill: LIGHT });
drawIcon("check", 0.77, 5.68, 0.38);
textBox("By the end of this unit you will have prepared, chaired and minuted a technical practitioners meeting yourself — that is the evidence in your logbook.", 1.27, 5.35, CW / IN - 0.98, 1.05, { valign: "middle" });

/* ============================================================= MEETING TYPES */
slide();
eyebrowTitle("Types of technical practitioners meetings", "Three meetings you must know");
introText("Organisations hold many kinds of meetings — general members, special, executive, AGMs. For technical practitioners, three types matter most:");
iconCards(
  [
    { icon: "briefcase", text: "Contract meetings", d: "Discuss, review and manage contractual obligations and deliverables related to technical projects or services." },
    { icon: "search", text: "Technical review meetings", d: "Evaluate technical solutions, designs and implementations, and resolve technical issues and problems." },
    { icon: "chart", text: "Project review meetings", d: "Assess project progress, timelines, resource allocation and project deliverables." },
  ],
  { y: 2.2, cols: 3, rowH: 2.9 }
);

/* ============================================================= LEADERSHIP STYLES */
slide();
eyebrowTitle("Leadership styles", "Who decides — the chair, the group, or both?");
introText("Three main leadership styles are used in meeting procedures. Choose the style that fits the meeting's purpose:");
iconCards(
  [
    { icon: "people", text: "Democratic", d: "The members decide through discussion and voting. The chair guides the process, but the group makes the decision." },
    { icon: "person", text: "Autocratic", d: "The chairperson controls the meeting and takes the decisions; members give input only when asked. Fast — use with care." },
    { icon: "chat", text: "Facilitative", d: "A group effort: the facilitator guides the process while staying neutral, and the group produces the outcome together." },
  ],
  { y: 2.05, cols: 3, rowH: 3.0 }
);

/* ============================================================= DECISION-MAKING */
slide();
eyebrowTitle("Decision-making processes", "Five ways meetings reach a decision");
iconCards(
  [
    { icon: "check", text: "Voting", d: "Each member votes; the option with the majority is adopted." },
    { icon: "people", text: "Consensus", d: "Discussion continues until every member can accept the decision." },
    { icon: "chart", text: "Criteria-based rating", d: "Score options against agreed criteria — the highest score wins." },
    { icon: "layers", text: "Ranking", d: "Members order the options by preference; rankings are combined." },
    { icon: "design", text: "Paired comparisons", d: "Compare options two at a time; the overall winner is selected." },
    { icon: "target", text: "Match the process", d: "Pick the process that fits the decision's importance, urgency and need for buy-in." },
  ],
  { y: 1.75, cols: 3, rowH: 2.3 }
);

/* ============================================================= CONVENTIONS */
slide();
eyebrowTitle("Meeting conventions & procedures", "Order, fairness and effective decisions");
iconCards(
  [
    { icon: "pen", text: "Moving", d: "Formally propose a motion for the meeting to consider." },
    { icon: "person", text: "Seconding", d: "A second member supports the motion — unseconded motions fall away." },
    { icon: "document", text: "Amending", d: "Modify the motion before the vote; amendments are voted on first." },
    { icon: "check", text: "Voting procedures", d: "Show of hands, ballot or poll — counted and recorded by the chair." },
  ],
  { y: 1.7, cols: 2, rowH: 1.95 }
);
card(0.55, 5.75, CW / IN, 0.95, { fill: LIGHT });
drawIcon("book", 0.77, 6.03, 0.38);
textBox("The note taker needs a technical background — minutes must capture the terminology, decisions and reasons accurately.", 1.27, 5.75, CW / IN - 0.98, 0.95, { valign: "middle" });

/* ============================================================= PREPARATION — ARRANGEMENTS */
slide();
eyebrowTitle("Prepare the meeting", "Physical arrangements — nothing left to chance");
introText("Preparation is where a meeting is won. Four arrangements must be in place before anyone walks in:");
iconCards(
  [
    { icon: "globe", text: "Venue", d: "Booked, accessible and set up for the meeting style — seating that lets practitioners face each other." },
    { icon: "folder", text: "Facilities", d: "Whiteboards, flip charts, stationery, refreshments — everything the discussion will need." },
    { icon: "dashboard", text: "Technology", d: "Projector, video conferencing, network access — prepared and tested before the meeting starts." },
    { icon: "document", text: "Supporting information", d: "Reports, designs and data the discussion depends on — available to every participant." },
  ],
  { y: 2.0, cols: 2, rowH: 2.15 }
);

/* ============================================================= PREPARATION — OUTCOMES & AGENDA */
slide();
eyebrowTitle("Prepare the meeting", "Outcomes, invitations and the agenda");
iconCards(
  [
    { icon: "target", text: "Document the outcomes", d: "Intended outcomes must be clear, concise and well documented — the agenda is built around them and success is measured against them." },
    { icon: "calendar", text: "Invite timeously", d: "Early invitations let participants prepare, study the documentation and arrange their schedules — so the right people attend." },
    { icon: "pen", text: "Complete & distribute the agenda", d: "The agenda and supporting documentation are completed and distributed to all participants before the meeting." },
  ],
  { y: 1.8, cols: 3, rowH: 3.1 }
);
textBox("An agenda states the meeting's purpose, lists the items in priority order, and shows the time allocated to each.", 0.55, 5.25, CW / IN, 0.7, { font: BODY_ITALIC, color: GREY });

/* ============================================================= CHAIRING — OPENING */
slide();
eyebrowTitle("Chair the meeting", "Open with rules the members own");
const colW2 = (CW / IN - 0.3) / 2;
card(0.55, 1.7, colW2, 4.9);
labelledBullets(
  "ESTABLISH RULES & GUIDELINES",
  [
    "Agree the rules in conjunction with the members at the start",
    "How to get the floor, how long contributions may run",
    "How decisions will be taken — and what is in scope",
    "Agreed rules create buy-in and prevent procedural disputes",
  ],
  0.55,
  1.7,
  colW2
);
const x2 = 0.55 + colW2 + 0.3;
card(x2, 1.7, colW2, 4.9);
labelledBullets(
  "APPLY THE AGREED CONVENTIONS",
  [
    "Run motions through moving, seconding and amending",
    "Follow the published agenda item by item",
    "Park unrelated issues and keep an eye on the clock",
    "Apply the conventions consistently — the same rules for everyone",
  ],
  x2,
  1.7,
  colW2
);

/* ============================================================= CHAIRING — RUNNING */
slide();
eyebrowTitle("Chair the meeting", "Participation, priorities and decisions");
bulletList(
  [
    "Provide for active participation by ALL members — invite quiet members by name, use round-robin turns, acknowledge every contribution.",
    "Keep debate on the issue, not the person — that is how conflict is minimised.",
    "Prioritise topics and allocate discussion time according to importance, urgency and complexity.",
    "Move minor items to the end of the agenda — or carry them over to the next meeting.",
    "Ensure agreed decisions are clear, accurate and include a time frame for action.",
    "Confirm each decision — and who owns it — with the members before moving on.",
  ],
  { y: 1.75 }
);

/* ============================================================= DIFFICULT BEHAVIOURS */
slide();
eyebrowTitle("Chair the meeting", "Managing difficult behaviours");
dataTable(
  ["Behaviour", "What the chair does"],
  [
    ["The heckler", "Stay calm; acknowledge any valid point and return to the agenda and agreed rules."],
    ["The overly talkative", "Thank them, summarise their point, and invite someone who has not yet spoken."],
    ["The cynic", "Ask for evidence and an alternative — turn the criticism into an agenda item or action."],
    ["The silent member", "Invite their input by name on a topic they know well."],
    ["Conflicting egos", "Keep debate on the issue, not the person; restate the meeting's outcomes."],
    ["Side conversations", "Pause the meeting and draw the conversation back to the floor."],
    ["Factually wrong statements", "Correct tactfully with the facts — or park the point for verification and record it."],
  ],
  { y: 1.75, colW: [3.6, 8.63], rowH: 0.62 }
);

/* ============================================================= FOLLOW-UP */
slide();
eyebrowTitle("Post-meeting follow-up", "The meeting is not over when it ends");
iconCards(
  [
    { icon: "document", text: "Accurate minutes", d: "Attendance, discussions, decisions and actions — produced in line with organisational policy and checked before distribution." },
    { icon: "chat", text: "Communicate decisions", d: "To all affected stakeholders, in the required format — minutes, e-mail or report — and within the required timeframe." },
    { icon: "check", text: "Summarise actions", d: "Each action with its owner and deadline; unresolved items carried over to the next agenda." },
  ],
  { y: 1.8, cols: 3, rowH: 3.0 }
);
textBox("Decisions that are not communicated and tracked might as well not have been taken.", 0.55, 5.15, CW / IN, 0.6, { font: BODY_ITALIC, color: GREY });

/* ============================================================= WHAT'S NEXT */
slide();
eyebrowTitle("Now prove it", "Your work for this unit standard");
iconCards(
  [
    { icon: "chat", text: "Questioning sessions", d: "Four AI-marked questioning exercises — meeting types, preparation, chairing and follow-up." },
    { icon: "dashboard", text: "Knowledge check quizzes", d: "Four quizzes across the unit. 80%+ is competent." },
    { icon: "presenter", text: "Chair a meeting", d: "Role-play practical on Day 2 — every learner chairs a 10-minute technical meeting from a scenario card." },
    { icon: "folder", text: "Logbook project — Meeting portfolio", d: "Notice and agenda, invitations, attendance register, minutes and action summary. Mark it 114051." },
  ],
  { y: 1.75, cols: 2, rowH: 2.35 }
);

/* ============================================================= CLOSING */
slide(NAVY);
doc.rect(0, 0, W, inx(0.12)).fill(BLUE);
drawIcon("people", 0.55, 1.6, 0.7, DARK_LABEL);
textBox("Run the meeting — don't let the meeting run you.", 0.55, 2.5, CW / IN, 1.4, { font: TITLE_FONT, size: 36, color: WHITE });
textBox(
  "Meeting types » leadership styles » decision processes » conventions » preparation » chairing » follow-up — the meeting skills every technical practitioner needs to turn discussion into action.",
  0.55,
  4.0,
  11.0,
  1.4,
  { color: DARK_SUB }
);
textBox("US 114051 · National Certificate: IT — System Support · SAQA ID 48573 · ITSS Learn", 0.55, 7.5 - 0.58, CW / IN, 0.4, { color: DARK_MUTED });

doc.end();
console.log(`Written ${OUT} — ${pageNo} slides (min font ${MIN_FONT}pt)`);
