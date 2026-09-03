// Generates the client-facing ITSS Learn platform pitch deck (Microsoft Fluent / Learn style).
// Covers: the problems the platform solves, every feature area, and how it makes
// running the learnership easy for learners and administrators.
// Big-room typography: no text below 18 pt. Detail lives in the speaker notes on every slide.
// Run: node scripts/make-platform-pitch-ppt.mjs -> ITSS-Learn-Platform-Pitch.pptx (repo root, not served by the app)
import pptxgen from "pptxgenjs";

const BLUE = "0F6CBD";
const NAVY = "002050";
const LIGHT = "EAF4FF";
const GREY = "6B7280";
const WHITE = "FFFFFF";
const BORDER = "D5E3F2";
const GREEN = "107C41";
const GREENBG = "F0FAF2";
const GREENLN = "CFE9D6";
const DARK_LABEL = "8CC2F0";
const DARK_SUB = "B9D6F2";
const DARK_MUTED = "6E93BC";

const TITLE_FONT = "Aptos Display";
const BODY_FONT = "Aptos";
const MIN_FS = 18; // smallest font size used anywhere in the deck

const W = 13.33;
const H = 7.5;
const MX = 0.55;
const CW = W - MX * 2;

const SHADOW = { type: "outer", angle: 90, blur: 7, offset: 2, color: "9AB4CC", opacity: 0.3 };

/* Thin-stroke Fluent-style icon set */
const ICONS = {
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
  monitor: '<rect x="3" y="4.5" width="18" height="12" rx="1.5"/><path d="M9.5 20h5M12 16.5V20"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="1.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
  chat: '<path d="M4 6.2A2.2 2.2 0 0 1 6.2 4h11.6A2.2 2.2 0 0 1 20 6.2v8.1a2.2 2.2 0 0 1-2.2 2.2H12l-4.5 3.6v-3.6H6.2A2.2 2.2 0 0 1 4 14.3z"/><path d="M8 9h8M8 12h5"/>',
  person: '<circle cx="12" cy="8" r="3.6"/><path d="M4.8 20c.8-3.7 3.6-5.6 7.2-5.6s6.4 1.9 7.2 5.6"/>',
  gradcap: '<path d="m12 4 10 4.5L12 13 2 8.5z"/><path d="M6.5 10.8v4.4c0 1.2 2.5 2.6 5.5 2.6s5.5-1.4 5.5-2.6v-4.4"/><path d="M22 8.5v5"/>',
  trend: '<path d="m3.5 17 5.5-5.5 3.5 3.5 7.5-7.5"/><path d="M15 7.5h5v5"/>',
  dashboard: '<rect x="3.5" y="3.5" width="7.3" height="7.3" rx="1.2"/><rect x="13.2" y="3.5" width="7.3" height="7.3" rx="1.2"/><rect x="3.5" y="13.2" width="7.3" height="7.3" rx="1.2"/><rect x="13.2" y="13.2" width="7.3" height="7.3" rx="1.2"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.3"/><path d="m15.5 15.5 5 5"/>',
  phone: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M10.8 17.8h2.4"/>',
  lock: '<rect x="5" y="10.5" width="14" height="9.5" rx="1.6"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/><path d="M12 14.5v2"/>',
  cloud: '<path d="M7 18.5a4 4 0 0 1-.6-7.96 5.5 5.5 0 0 1 10.7-1.2A4.4 4.4 0 0 1 16.6 18.5z"/>',
  bolt: '<path d="M13 3 5 13.5h5.5L11 21l8-10.5h-5.5z"/>',
  camera: '<rect x="3.5" y="7" width="17" height="12.5" rx="1.8"/><path d="M8.5 7 10 4.5h4L15.5 7"/><circle cx="12" cy="13" r="3.4"/>',
  bell: '<path d="M6 16v-5.5a6 6 0 0 1 12 0V16l1.5 2.5h-15z"/><path d="M10 21a2 2 0 0 0 4 0"/>',
  sparkle: '<path d="M12 4.5 13.6 9.4 18.5 11l-4.9 1.6L12 17.5l-1.6-4.9L5.5 11l4.9-1.6z"/><path d="M18.8 3.8v3.4M17.1 5.5h3.4"/>',
  print: '<path d="M7 8V3.5h10V8"/><rect x="4" y="8" width="16" height="8" rx="1.5"/><path d="M7 13.5h10v7H7z"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  upload: '<path d="M12 15.5V4.5m0 0L7.5 9M12 4.5 16.5 9"/><path d="M4.5 15.5v3A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5v-3"/>',
  sync: '<path d="M4.5 12a7.5 7.5 0 0 1 12.8-5.3L20 9.5m0-5v5h-5"/><path d="M19.5 12a7.5 7.5 0 0 1-12.8 5.3L4 14.5m0 5v-5h5"/>',
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
pptx.company = "ITSS Learn";
pptx.title = "ITSS Learn — Platform Pitch";

let pageNo = 0;

function slide(notes) {
  const s = pptx.addSlide();
  s.background = { color: WHITE };
  pageNo += 1;
  if (pageNo > 1) {
    s.addText(String(pageNo), { x: W - MX - 0.7, y: H - 0.46, w: 0.7, h: 0.35, fontFace: BODY_FONT, fontSize: MIN_FS, color: GREY, align: "right" });
    s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.09, fill: { color: BLUE } });
  }
  if (notes) s.addNotes(notes);
  return s;
}

function addIcon(s, name, x, y, size = 0.32, color) {
  s.addImage({ data: iconUri(name, color), x, y, w: size, h: size });
}

function eyebrowTitle(s, eyebrow, title) {
  s.addText(eyebrow.toUpperCase(), { x: MX, y: 0.26, w: CW, h: 0.38, fontFace: BODY_FONT, fontSize: MIN_FS, bold: true, color: BLUE, charSpacing: 2 });
  s.addText(title, { x: MX, y: 0.64, w: CW, h: 0.8, fontFace: TITLE_FONT, fontSize: 30, bold: true, color: NAVY });
}

function card(s, x, y, w, h, { fill = WHITE, line = BORDER } = {}) {
  s.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.09, fill: { color: fill }, line: { color: line, width: 1 }, shadow: { ...SHADOW } });
}

/** 6-card grid (3 × 2): 20 pt titles, 18 pt descriptions. Keep descriptions ≤ 85 chars. */
function iconCards(s, items, { x = MX, y = 2.12, w = CW, cols = 3, rowH = 1.8, gap = 0.2 } = {}) {
  const cw = (w - gap * (cols - 1)) / cols;
  items.forEach((it, i) => {
    const cx = x + (i % cols) * (cw + gap);
    const cy = y + Math.floor(i / cols) * (rowH + gap);
    card(s, cx, cy, cw, rowH);
    addIcon(s, it.icon, cx + 0.18, cy + 0.18, 0.36);
    s.addText(it.text, {
      x: cx + 0.64, y: cy + 0.1, w: cw - 0.82, h: 0.64, fontFace: TITLE_FONT, fontSize: 20, bold: true, color: NAVY, valign: "middle", lineSpacingMultiple: 0.98,
    });
    s.addText(it.d, {
      x: cx + 0.18, y: cy + 0.8, w: cw - 0.36, h: rowH - 0.92, fontFace: BODY_FONT, fontSize: MIN_FS, color: GREY, valign: "top", lineSpacingMultiple: 1.05,
    });
  });
}

function introText(s, text, y = 1.44, h = 0.62) {
  s.addText(text, { x: MX, y, w: CW, h, fontFace: BODY_FONT, fontSize: MIN_FS, color: GREY, valign: "top", lineSpacingMultiple: 1.1 });
}

function caption(s, text, y = 6.32) {
  s.addText(text, { x: MX, y, w: CW, h: 0.45, fontFace: BODY_FONT, fontSize: MIN_FS, color: GREY, italic: true });
}

function dataTable(s, header, rows, { x = MX, y = 1.75, w = CW, colW, rowH = 0.52 } = {}) {
  const tableRows = [
    header.map((t) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: BLUE }, fontFace: TITLE_FONT, fontSize: MIN_FS } })),
    ...rows.map((r, i) => r.map((c) => ({ text: c, options: { color: NAVY, fill: { color: i % 2 ? LIGHT : WHITE }, fontFace: BODY_FONT, fontSize: MIN_FS } }))),
  ];
  s.addTable(tableRows, { x, y, w, colW, border: { type: "solid", color: BORDER, pt: 0.75 }, rowH, valign: "middle", margin: 0.07 });
}

/* ============================================================= 1 · COVER */
{
  const s = slide(
    "Welcome and thank you for the time. Today I want to show you the platform we use to run the IT Systems Support learnership end to end — it is called ITSS Learn. " +
    "One sentence summary: it is a single app in which learners are taught, assessed, tracked and supported, and in which all the administration, evidence and compliance paperwork produces itself. " +
    "It is live today, runs on any device, and was purpose-built for this exact qualification — SAQA 48573, NQF Level 5, 148 credits, quality-assured under QCTO / MICT SETA."
  );
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.12, fill: { color: BLUE } });
  s.addShape(pptx.ShapeType.roundRect, { x: MX, y: 1.05, w: 4.9, h: 0.56, rectRadius: 0.28, fill: { color: BLUE } });
  s.addText("ITSS LEARN · PLATFORM OVERVIEW", { x: MX, y: 1.05, w: 4.9, h: 0.56, fontFace: BODY_FONT, fontSize: MIN_FS, bold: true, color: WHITE, align: "center", valign: "middle", charSpacing: 1 });
  s.addText("One platform that runs the entire learnership.", { x: MX, y: 1.8, w: 11.2, h: 1.85, fontFace: TITLE_FONT, fontSize: 40, bold: true, color: NAVY });
  s.addText("It teaches, marks, tracks, communicates, reports and audits — so your team can focus on people, not paperwork.", { x: MX, y: 3.7, w: 10.2, h: 0.85, fontFace: BODY_FONT, fontSize: 20, color: GREY, lineSpacingMultiple: 1.12 });
  addIcon(s, "monitor", 11.2, 1.15, 1.7, "#" + BORDER);
  s.addShape(pptx.ShapeType.line, { x: MX, y: 4.72, w: CW, h: 0, line: { color: BORDER, width: 1 } });
  const meta = [
    ["BUILT FOR", "NC: IT Systems Support\nSAQA 48573 · NQF 5"],
    ["QUALITY ASSURED", "QCTO / MICT SETA\naudit-ready evidence"],
    ["RUNS ON", "Any device — installable,\nworks offline"],
    ["WHO USES IT", "Learners + 4 staff roles,\nup to Super User"],
  ];
  meta.forEach(([k, v], i) => {
    const x = MX + i * (CW / 4);
    s.addText(k, { x, y: 4.95, w: CW / 4 - 0.2, h: 0.34, fontFace: BODY_FONT, fontSize: MIN_FS, bold: true, color: BLUE, charSpacing: 1 });
    s.addText(v, { x, y: 5.3, w: CW / 4 - 0.2, h: 0.95, fontFace: BODY_FONT, fontSize: MIN_FS, color: NAVY, lineSpacingMultiple: 1.12 });
  });
  s.addText("ITSS Learn · i-tsystemsupport.vercel.app", { x: MX, y: H - 0.62, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: MIN_FS, color: GREY });
}

/* ============================================================= 2 · THE PROBLEM */
{
  const s = slide(
    "Start with the pain. Running a 12-month learnership the traditional way means six recurring problems. " +
    "Paper everywhere — registers, registration forms, portfolios — that must be chased, filed and stored for audits. " +
    "Marking backlogs — facilitators lose evenings hand-marking, and learners wait days for feedback. " +
    "No live visibility — you only discover a struggling learner at month-end review, when it is often too late. " +
    "Evidence chaos — POE documents scattered across email, WhatsApp and memory sticks; assembling one portfolio for moderation takes days. " +
    "Compliance stress — every SETA/QCTO audit becomes a scramble to reconstruct evidence. " +
    "And disengagement — learners get no instant feedback and no sense of progress, so momentum dies between sessions. " +
    "Ask the client which of these they recognise — usually all six. Every one is a staff-hours cost, a quality risk, or both."
  );
  eyebrowTitle(s, "The problem", "Running a learnership on paper is expensive");
  introText(s, "The traditional way costs staff hours every week — and still leaves gaps at audit time.");
  iconCards(s, [
    { icon: "document", text: "Paper everywhere", d: "Registers, forms and portfolios to chase, file and find again at audit time." },
    { icon: "clock", text: "Marking backlogs", d: "Staff hand-mark every script; learners get feedback days later." },
    { icon: "search", text: "No live visibility", d: "Progress sits in after-the-fact spreadsheets; strugglers surface too late." },
    { icon: "folder", text: "Evidence chaos", d: "POE files arrive by email, WhatsApp and memory stick — moderation prep takes days." },
    { icon: "shield", text: "Compliance stress", d: "Every SETA / QCTO audit is a scramble to reconstruct paper evidence." },
    { icon: "trend", text: "Disengagement", d: "No instant marks, no visible progress — momentum dies between sessions." },
  ]);
  caption(s, "Every one of these is a staff-hours cost, a quality risk, or both.");
}

/* ============================================================= 3 · THE ANSWER */
{
  const s = slide(
    "ITSS Learn replaces all of that with one app doing five jobs. " +
    "Teach — the full curriculum lives in the app as interactive lessons, with a live classroom presenter mode. " +
    "Assess — quizzes and written answers are marked automatically, including by AI, with explained feedback. " +
    "Track — progress records itself the moment work is done; nobody captures anything. " +
    "Communicate — private chat, class Q&A, announcements and broadcasts, all moderated. " +
    "Comply — every register, form, portfolio and audit trail is generated by the platform, print-perfect. " +
    "The key message: it is not five tools glued together — it is one system where each part feeds the others. A quiz taken in class instantly updates progress, analytics, the leaderboard and the compliance dashboard, with zero admin typing."
  );
  eyebrowTitle(s, "The answer", "One platform, five jobs");
  introText(s, "ITSS Learn is a single app — every part feeds the others, so work done once is captured everywhere.");
  const rows = [
    { icon: "book", t: "Teach", d: "The full curriculum as interactive lessons, plus live presenter mode." },
    { icon: "check", t: "Assess", d: "Auto-marked quizzes and AI-marked written answers, explained." },
    { icon: "chart", t: "Track", d: "Progress and XP record themselves the moment work is done." },
    { icon: "chat", t: "Communicate", d: "Private chat, class Q&A, announcements and broadcasts." },
    { icon: "shield", t: "Comply", d: "Registers, forms, portfolios and audit trail — print-ready." },
  ];
  rows.forEach((r, i) => {
    const y = 2.12 + i * 0.82;
    card(s, MX, y, CW, 0.68);
    addIcon(s, r.icon, MX + 0.2, y + 0.16, 0.36);
    s.addText(r.t, { x: MX + 0.72, y, w: 2.65, h: 0.68, fontFace: TITLE_FONT, fontSize: 20, bold: true, color: NAVY, valign: "middle" });
    s.addText(r.d, { x: MX + 3.45, y, w: CW - 3.7, h: 0.68, fontFace: BODY_FONT, fontSize: MIN_FS, color: GREY, valign: "middle", lineSpacingMultiple: 1.05 });
  });
  card(s, MX, 6.35, CW, 0.68, { fill: LIGHT });
  addIcon(s, "bolt", MX + 0.2, 6.51, 0.36);
  s.addText([
    { text: "Everything in one place — ", options: { bold: true, color: NAVY } },
    { text: "one quiz updates progress, analytics, leaderboard and compliance instantly.", options: { color: GREY } },
  ], { x: MX + 0.72, y: 6.35, w: CW - 1.0, h: 0.68, fontFace: BODY_FONT, fontSize: MIN_FS, valign: "middle" });
}

/* ============================================================= 4 · AT A GLANCE */
{
  const s = slide(
    "Six headline numbers to anchor the scale. The entire qualification is preloaded: 6 modules, 24 unit standards, 148 credits, with the full one-year training calendar. " +
    "Assessment: 4 auto-marked question types plus AI marking of written answers. " +
    "Evidence: a guided 37-item portfolio checklist across 8 sections, reviewed and signed off in-app. " +
    "Motivation: 8 levels and earnable badges computed only from real work. " +
    "Access control: 5 roles from Learner to Super User. " +
    "And reporting is one click: CSV analytics, PDF registers and forms, ZIP portfolios. " +
    "Plus, as the bottom line says: it installs like an app, works offline, syncs in real time, and ships with 160+ illustrated teaching figures."
  );
  eyebrowTitle(s, "At a glance", "The whole qualification, already inside");
  const stats = [
    ["6 · 24 · 148", "THE FULL CURRICULUM", "Modules, unit standards and credits preloaded"],
    ["4 + AI", "ASSESSMENT ENGINES", "Four auto-marked types plus AI-marked written answers"],
    ["37", "POE EVIDENCE ITEMS", "Guided checklist, signed off in-app"],
    ["8", "LEVELS & BADGES", "XP earned only from real recorded work"],
    ["5", "USER ROLES", "Learner to Super User — screens adapt"],
    ["1-click", "EXPORTS ON DEMAND", "CSV, PDF and ZIP evidence in one click"],
  ];
  const gap = 0.2, cols = 3, cw = (CW - gap * (cols - 1)) / cols, rowH = 1.85;
  stats.forEach(([n, l, d], i) => {
    const x = MX + (i % cols) * (cw + gap);
    const y = 1.95 + Math.floor(i / cols) * (rowH + gap);
    card(s, x, y, cw, rowH);
    s.addText(n, { x: x + 0.18, y: y + 0.1, w: cw - 0.36, h: 0.56, fontFace: TITLE_FONT, fontSize: 30, bold: true, color: BLUE });
    s.addText(l, { x: x + 0.18, y: y + 0.68, w: cw - 0.36, h: 0.32, fontFace: BODY_FONT, fontSize: MIN_FS, bold: true, color: NAVY, charSpacing: 1 });
    s.addText(d, { x: x + 0.18, y: y + 1.04, w: cw - 0.36, h: 0.72, fontFace: BODY_FONT, fontSize: MIN_FS, color: GREY, lineSpacingMultiple: 1.05 });
  });
  caption(s, "Plus: installable app · works offline · real-time sync · 160+ illustrated figures", 6.15);
}

/* ============================================================= 5 · LEARNER — LEARNING */
{
  const s = slide(
    "Now the learner's side — this is what your learners live in every day. " +
    "Lessons are interactive slide decks with photos, diagrams, pop-up glossary definitions and collapsible worked examples — not PDFs. " +
    "Knowledge gating: the next slide can stay locked until the learner answers a checkpoint question correctly, so nobody can page through without engaging. " +
    "The same material has a classroom presenter mode — full-screen slides with speaker notes — so what is taught live on Friday is exactly what learners revise on their phone on Monday. " +
    "There is a personal logbook for workplace evidence, session notes, and a built-in training calendar that adds sessions to Outlook or Teams with one tap — no API keys, nothing leaves the device. " +
    "Official slide decks and manuals are downloadable as PPTX / PDF for offline study. " +
    "Everything works on the learner's own phone — no laptop required."
  );
  eyebrowTitle(s, "The learner experience", "Learning that lives on their phone");
  introText(s, "The full curriculum as interactive lessons — the same material the facilitator presents in class.");
  iconCards(s, [
    { icon: "monitor", text: "Interactive lessons", d: "Slides with images, pop-up glossary and worked examples — built for phones." },
    { icon: "lock", text: "Knowledge gating", d: "The next slide unlocks only when checkpoint questions are answered." },
    { icon: "people", text: "Presenter mode", d: "Full-screen slides with speaker notes — class and self-study match." },
    { icon: "book", text: "Notes & logbook", d: "Per-unit notes plus a workplace logbook that becomes POE evidence." },
    { icon: "calendar", text: "Training calendar", d: "Every session preloaded; one tap adds it to Outlook or Teams." },
    { icon: "upload", text: "Rich downloads", d: "Official decks and manuals (PPTX / PDF) for offline study." },
  ]);
  caption(s, "Learn on the bus or at home — the app installs on any phone and works offline.");
}

/* ============================================================= 6 · LEARNER — ASSESSMENT & AI */
{
  const s = slide(
    "Assessment is where the platform saves the most staff time — and where learners feel the biggest difference. " +
    "Four question types mark themselves instantly: multiple choice, select-all, drag-to-order and matching, with attempt history and best-score tracking. " +
    "Written answers get a two-stage AI marker. Stage one is deterministic key-idea detection — it places a tick on the exact sentence that earned each mark. Stage two sends rejected answers to a large language model that judges meaning, so a learner who answers correctly in their own words still gets the credit. " +
    "Feedback is explanatory: the app tells the learner which idea is missing and quotes the exact lesson line that teaches it — and a gentle in-browser spellchecker helps with typed answers. " +
    "Marked attempts are capped and self-assessments lock after saving, with a staff-only unlock — results cannot be gamed. " +
    "And there is full transparency: staff can open any learner and see every option picked and every sentence typed. " +
    "Key line for the client: marking that used to take a facilitator evenings now happens in the second the learner presses submit."
  );
  eyebrowTitle(s, "The learner experience", "Instant marking — even written answers");
  introText(s, "Learners get marks and reasons the moment they submit. Staff never mark a script by hand.");
  iconCards(s, [
    { icon: "check", text: "4 auto-marked types", d: "Multiple choice, select-all, ordering, matching — instant scores." },
    { icon: "sparkle", text: "AI marks written work", d: "Ticks the sentence that earned each mark; AI credits own-words answers." },
    { icon: "chat", text: "Feedback that teaches", d: "Names the missing idea and quotes the lesson line that covers it." },
    { icon: "lock", text: "Attempts capped", d: "Marked attempts limited; assessments lock with staff-only unlock." },
    { icon: "eye", text: "Full transparency", d: "Staff see every option picked and every sentence typed." },
    { icon: "bolt", text: "Zero marking backlog", d: "Marks and records exist the second a learner presses submit." },
  ]);
}

/* ============================================================= 7 · LEARNER — MOTIVATION */
{
  const s = slide(
    "Twelve months is a long programme — motivation is a real risk. The platform bakes it in. " +
    "Learners earn XP across 8 levels, from Newcomer to Legend, plus badges — and every point is computed from real recorded work: quizzes passed, evidence uploaded, registers signed. It cannot be inflated, so the class leaderboard is honest and genuinely competitive. " +
    "Community features keep the cohort connected between Fridays: class Q&A with threaded replies, announcements from staff, live multiplayer quiz sessions, and a class photo wall for the social side. " +
    "Every learner also has a private 1-to-1 chat line to the facilitator — with online presence, read receipts and message editing — so questions get asked early instead of festering. " +
    "Staff can broadcast one message privately to every learner at once, and authorised staff can open any conversation read-only for safeguarding — enforced by the database itself."
  );
  eyebrowTitle(s, "The learner experience", "Motivation and community built in");
  introText(s, "XP, badges and an honest leaderboard keep momentum; chat and Q&A keep every learner supported.");
  iconCards(s, [
    { icon: "award", text: "XP, levels & badges", d: "Newcomer to Legend — computed only from real recorded work." },
    { icon: "trend", text: "Live leaderboard", d: "Honest competition on quizzes, evidence and attendance." },
    { icon: "people", text: "Q&A & announcements", d: "Threaded class questions, staff announcements, live quizzes." },
    { icon: "chat", text: "Private 1-to-1 chat", d: "Direct line to the facilitator — presence, read receipts, broadcast." },
    { icon: "camera", text: "Class photo wall", d: "Shared course memories, played back as a slideshow." },
    { icon: "shield", text: "Safe by design", d: "Staff can open any conversation read-only — database-enforced." },
  ]);
}

/* ============================================================= 8 · POE & EVIDENCE */
{
  const s = slide(
    "The Portfolio of Evidence is usually the most painful part of any learnership — here it runs itself. " +
    "Learners get a guided checklist: 8 sections, 37 evidence items, from certified ID copy to the signed learnership agreement to per-unit assignments. They photograph or upload documents straight from their phone — up to 10 files per item — into private cloud storage. " +
    "Assessors review and sign off each item in the app, with a clear competent / not-yet-competent verdict workflow, so learners always see exactly what is outstanding. " +
    "When the moderator or the SETA asks for a portfolio, staff export any learner's entire POE as a ZIP in one click — no more days of assembling paper files. " +
    "The workplace logbook is digital too. And the dual accounting model — a lenient coaching view plus a strict auditable view — means you always know exactly what is claimable."
  );
  eyebrowTitle(s, "Evidence", "The Portfolio of Evidence runs itself");
  introText(s, "A guided 37-item checklist, phone uploads to private cloud storage, in-app sign-off, one-click export.");
  iconCards(s, [
    { icon: "dashboard", text: "Guided POE checklist", d: "8 sections, 37 items — from certified ID to unit assignments." },
    { icon: "phone", text: "Upload from a phone", d: "Photos, PDFs and documents straight into private cloud storage." },
    { icon: "check", text: "Review & sign-off", d: "Assessors record competent / not-yet-competent on each item." },
    { icon: "folder", text: "One-click ZIP export", d: "A learner's complete portfolio in seconds — not days." },
    { icon: "book", text: "Digital logbook", d: "Structured per-unit logbook, cloud-saved and printable." },
    { icon: "chart", text: "Dual accounting", d: "A coaching view plus a strict, auditable view for credits." },
  ]);
}

/* ============================================================= 9 · ADMIN — RUN THE DAY */
{
  const s = slide(
    "Now the administrative side — first, the day-to-day running of a session. " +
    "Attendance: the register is digital. Learners sign on their phone in seconds; a learner can even photograph their pen-on-paper signature and the platform extracts clean ink strokes automatically. Registers print as pixel-perfect replicas of the official paper form — every register at once if you like. " +
    "Enrolment: the official registration form and the biographical enrolment form are digitised to match the paper originals exactly. Learners complete them once online; forms auto-fill from stored data and print exactly like the originals. " +
    "Each new learner can be handed an auto-generated onboarding pack — programme overview, calendar, required documents, POE guide and app how-to — built in one click. " +
    "Content management is central: staff upload slide decks and lesson figures and they sync to every device instantly. " +
    "And one click sends a private broadcast to every learner — session reminders, venue changes, deadline nudges. " +
    "The message: a facilitator runs the entire Friday session from one screen."
  );
  eyebrowTitle(s, "The admin experience", "Run the session from one screen");
  introText(s, "Attendance, enrolment, onboarding and content — the daily mechanics of the course, automated.");
  iconCards(s, [
    { icon: "pen", text: "Digital attendance", d: "Signed on phones; ink extracted from a photographed signature." },
    { icon: "print", text: "Print-perfect forms", d: "Pixel-accurate registers and registration forms, auto-filled." },
    { icon: "document", text: "Digital enrolment", d: "Biographical form captured once — never re-typed." },
    { icon: "gradcap", text: "Onboarding pack", d: "Welcome document with calendar, POE guide and app how-to." },
    { icon: "upload", text: "Central content", d: "Upload decks and figures once — synced to every device." },
    { icon: "bell", text: "1-click broadcast", d: "One private message to every learner at once." },
  ]);
}

/* ============================================================= 10 · ADMIN — VISIBILITY */
{
  const s = slide(
    "Second admin superpower: visibility. " +
    "The analytics dashboard shows the whole cohort live in one sortable table — completion percentage, quiz and exercise averages, attendance rate, last-seen and XP for every learner. " +
    "The early-warning engine flags at-risk learners automatically and states the reasons: low completion, poor attendance, inactivity, low scores. You intervene in week 3, not month 3. " +
    "Drill into any learner and see their actual work — every quiz option picked, every sentence typed, every file uploaded, every register signed. " +
    "The compliance dashboard tracks milestones and document completeness across the cohort. " +
    "Everything exports: the full analytics table to CSV for your own reporting, and formal management reports can be served inside the app, restricted to the Super User. " +
    "For a client, this is the difference between hoping the programme is on track and knowing it is."
  );
  eyebrowTitle(s, "The admin experience", "See every learner, live");
  introText(s, "A live cohort dashboard, automatic at-risk flags and drill-down to every learner's actual work.");
  iconCards(s, [
    { icon: "dashboard", text: "Cohort dashboard", d: "Completion, averages, attendance, last-seen and XP — one table." },
    { icon: "bell", text: "Early-warning flags", d: "At-risk learners flagged automatically, with reasons." },
    { icon: "eye", text: "Drill into anyone", d: "Every answer, upload and signed register on record." },
    { icon: "shield", text: "Compliance view", d: "Milestones and document completeness at a glance." },
    { icon: "chart", text: "CSV export", d: "Full analytics table for BI, board packs and SETA reports." },
    { icon: "document", text: "Management reports", d: "Formal reports served in-app, Super User only." },
  ]);
}

/* ============================================================= 11 · COMPLIANCE & DOCUMENTS */
{
  const s = slide(
    "Third admin pillar: compliance and paperwork that produces itself. " +
    "Every significant action — sign-ins, enrolments, uploads, marks, reviews, deletions — lands in a shared audit trail with actor and timestamp, exportable to CSV. When the verifier asks 'who marked this and when', the answer is one click away. " +
    "Certificates and statements of results generate as print-ready documents from real completion data. " +
    "The provider deliverables — lesson plans before delivery, assessment records within five days, progress reports — are tracked against their deadlines. " +
    "And because every register, form, portfolio and declaration is digital and print-perfect, a SETA or QCTO audit stops being a scramble: you print the evidence pack on demand. " +
    "Position this as risk reduction for the client's compliance and HR teams."
  );
  eyebrowTitle(s, "The admin experience", "Audit-ready by default");
  introText(s, "The paperwork a SETA / QCTO audit demands is generated, tracked and exportable — not reconstructed.");
  iconCards(s, [
    { icon: "search", text: "Full audit trail", d: "Every action logged with actor and timestamp; CSV export." },
    { icon: "award", text: "Certificates", d: "Statements of results and certificates, print-ready." },
    { icon: "calendar", text: "Deliverables tracked", d: "Lesson plans and assessment records against deadlines." },
    { icon: "print", text: "Evidence on demand", d: "Registers, forms and logbooks print like the originals." },
    { icon: "folder", text: "Moderation-ready POE", d: "Complete portfolio ZIPs with verdicts and sign-off history." },
    { icon: "check", text: "Honest credit", d: "Claimed credits always match recorded evidence." },
  ]);
}

/* ============================================================= 12 · SECURITY */
{
  const s = slide(
    "Security and privacy — usually the first question from a corporate client. " +
    "Privacy is enforced in the database itself with row-level security. A learner physically cannot query another learner's messages, files or records — even if they bypass the app entirely. That is a much stronger guarantee than app-side checks. " +
    "Five roles — Learner, Facilitator, Assessor, Moderator, Super User — and every screen adapts to the role. Sensitive reports are Super User only. " +
    "Files live in a private storage bucket, never on a public URL. " +
    "Every significant action is audited: submissions, messages, deletions and sign-offs, with actor and timestamp. " +
    "Accounts have a full lifecycle: email sign-up, password recovery, promotion and demotion, and remove-profile-from-device. " +
    "Personal data in reports is kept out of the codebase and served only to authorised signed-in staff. " +
    "This design directly supports POPIA obligations around minimising access to personal information."
  );
  eyebrowTitle(s, "Trust", "Security enforced by the database");
  introText(s, "Learner privacy and role separation are guaranteed at the data layer — even outside the app.");
  iconCards(s, [
    { icon: "lock", text: "Row-level security", d: "The database itself blocks access to other learners' data." },
    { icon: "people", text: "5-tier role system", d: "Every screen, action and report adapts to the role." },
    { icon: "cloud", text: "Private storage", d: "Evidence behind authentication — no public links." },
    { icon: "search", text: "Everything audited", d: "Submissions, messages and sign-offs logged with timestamps." },
    { icon: "person", text: "Account lifecycle", d: "Sign-up, password recovery, promotion — self-service." },
    { icon: "shield", text: "POPIA-conscious", d: "Personal-data reports served privately to authorised staff." },
  ]);
}

/* ============================================================= 13 · PLATFORM */
{
  const s = slide(
    "The platform itself removes every classic IT objection. " +
    "It installs like an app on any phone, tablet or computer — but there is nothing to deploy: it is a progressive web app, no app store or MDM packaging needed. " +
    "It keeps working offline — a local cache means learners in low-signal areas can keep studying, and work syncs when they reconnect. " +
    "Real-time cloud sync means work saved on one device appears on every other — start on a PC in class, finish on the phone at home. " +
    "Updates ship centrally: every user gets the newest version on next refresh — no versions to manage, no rollouts. " +
    "Dark and light themes, print-optimised output for every document, and zero-secret integrations with Teams, Outlook and calendar apps — deep links and files only, so no API keys and no data leaving the device. " +
    "Total infrastructure the client must install and maintain: none."
  );
  eyebrowTitle(s, "The platform", "Works everywhere, maintains itself");
  introText(s, "An installable web app with offline support and central updates — nothing for IT to deploy or patch.");
  iconCards(s, [
    { icon: "phone", text: "Installs like an app", d: "Phone, tablet, laptop or desktop — no app store needed." },
    { icon: "bolt", text: "Works offline", d: "Local cache keeps studying alive; syncs on reconnect." },
    { icon: "sync", text: "Real-time sync", d: "Start on a PC in class, finish on the phone at home." },
    { icon: "cloud", text: "Zero-install updates", d: "Everyone is on the latest version at next refresh." },
    { icon: "calendar", text: "Teams / Outlook", d: "Sessions deep-link into calendars — no API keys." },
    { icon: "monitor", text: "Polished experience", d: "Dark & light themes and print-optimised output." },
  ]);
}

/* ============================================================= 14 · BEFORE / AFTER */
{
  const s = slide(
    "This table is the operational summary — walk it row by row. " +
    "Attendance: paper registers passed around and filed become digital signatures captured in seconds with print-perfect output. " +
    "Marking: evenings of hand-marking become instant auto-marking plus AI marking of written answers. " +
    "Progress capture: hand-updated spreadsheets disappear — progress records itself. " +
    "Struggling learners: instead of month-end surprises, the platform flags them automatically with reasons. " +
    "Moderation prep: days of assembling paper portfolios become a one-click ZIP. " +
    "Stakeholder reporting: collation becomes on-demand CSV / PDF / ZIP exports. " +
    "Onboarding: printed packs and re-typed forms become digital enrolment plus a generated welcome pack. " +
    "Close with: the platform gives your staff their evenings back and gives you certainty the programme is on track."
  );
  eyebrowTitle(s, "The payoff", "Running the course: before and after");
  dataTable(s,
    ["Task", "The paper way", "With ITSS Learn"],
    [
      ["Attendance", "Paper register chased and filed", "Signed on phones; prints itself"],
      ["Marking", "Evenings of hand-marking", "Instant — AI marks written work"],
      ["Progress capture", "Hand-updated spreadsheets", "Records itself as work is done"],
      ["At-risk learners", "Noticed at month-end — too late", "Flagged automatically, with reasons"],
      ["Moderation prep", "Days assembling paper portfolios", "One-click ZIP of the full POE"],
      ["Reporting", "Collating registers and marks", "CSV / PDF / ZIP on demand"],
      ["Onboarding", "Printed packs, re-typed forms", "Digital forms + welcome pack"],
    ],
    { y: 1.72, colW: [2.9, 4.6, 4.73], rowH: 0.53 }
  );
  caption(s, "Staff hours go back into coaching — the platform does the capture, marking and filing.", 6.2);
}

/* ============================================================= 15 · TWO SIDES SUMMARY */
{
  const s = slide(
    "One-slide summary of the value on each side. " +
    "For learners: everything in one app on their own phone — learning, instant marks with reasons including AI, self-updating progress, a private line to the facilitator, digital signing of the register, and forms they complete exactly once. " +
    "For your team: live truth about every learner's answers, activity and risk status; zero manual marking or capture; audit-ready evidence on demand; one-click CSV / PDF / ZIP exports for SETA and QCTO reporting; broadcasts and read-only conversation moderation; and role-controlled access with a full audit trail. " +
    "If the client remembers one thing: learners get a better course, and the provider team gets their time back — from the same system."
  );
  eyebrowTitle(s, "Summary", "What each side gets");
  const colW2 = (CW - 0.3) / 2;
  card(s, MX, 1.72, colW2, 4.75, { fill: "F7FBFF" });
  addIcon(s, "gradcap", MX + 0.25, 1.98, 0.42);
  s.addText("In learners' hands", { x: MX + 0.8, y: 1.96, w: colW2 - 1, h: 0.48, fontFace: TITLE_FONT, fontSize: 22, bold: true, color: NAVY });
  s.addText([
    "Learn, practise and submit from one app",
    "Instant marks with reasons — AI included",
    "Progress that updates itself",
    "Private chat, Q&A, XP and leaderboard",
    "Sign the register in seconds",
    "Forms completed once, never re-written",
  ].map((t) => ({ text: t, options: { bullet: { characterCode: "2022", indent: 14 }, color: NAVY, breakLine: true } })),
    { x: MX + 0.3, y: 2.62, w: colW2 - 0.6, h: 3.7, fontFace: BODY_FONT, fontSize: MIN_FS, lineSpacingMultiple: 1.5, valign: "top" });

  const x2 = MX + colW2 + 0.3;
  card(s, x2, 1.72, colW2, 4.75, { fill: GREENBG, line: GREENLN });
  addIcon(s, "briefcase", x2 + 0.25, 1.98, 0.42, "#" + GREEN);
  s.addText("In your team's hands", { x: x2 + 0.8, y: 1.96, w: colW2 - 1, h: 0.48, fontFace: TITLE_FONT, fontSize: 22, bold: true, color: GREEN });
  s.addText([
    "Live answers, activity and risk status",
    "Zero manual marking or capture",
    "Audit-ready evidence on demand",
    "1-click CSV / PDF / ZIP for SETA & QCTO",
    "Broadcasts and read-only moderation",
    "Role control with a full audit trail",
  ].map((t) => ({ text: t, options: { bullet: { characterCode: "2022", indent: 14 }, color: NAVY, breakLine: true } })),
    { x: x2 + 0.3, y: 2.62, w: colW2 - 0.6, h: 3.7, fontFace: BODY_FONT, fontSize: MIN_FS, lineSpacingMultiple: 1.5, valign: "top" });
}

/* ============================================================= 16 · CLOSING */
{
  const s = slide(
    "Close. ITSS Learn can run the entire learnership digitally — it teaches, marks, tracks, communicates, reports and audits on its own. " +
    "It is not a concept: it is live today, running this exact qualification with the full curriculum, calendar and compliance pack inside. " +
    "Suggested next step: a 30-minute live walkthrough — sign in as a learner, take a quiz and watch the AI mark a written answer, then sign in as a facilitator and watch the dashboard update in real time. " +
    "Then leave the demo environment with them to explore."
  );
  s.background = { color: NAVY };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.12, fill: { color: BLUE } });
  addIcon(s, "monitor", MX, 1.5, 0.65, "#" + DARK_LABEL);
  s.addText("It teaches, marks, tracks, communicates,\nreports and audits — on its own.", {
    x: MX, y: 2.3, w: CW, h: 1.9, fontFace: TITLE_FONT, fontSize: 36, bold: true, color: WHITE, lineSpacingMultiple: 1.08,
  });
  s.addText("ITSS Learn is live today, running the National Certificate: IT Systems Support (NQF 5) end to end — ready to do the same for your cohort.", {
    x: MX, y: 4.3, w: 10.4, h: 1.0, fontFace: BODY_FONT, fontSize: 20, color: DARK_SUB, lineSpacingMultiple: 1.2,
  });
  s.addShape(pptx.ShapeType.roundRect, { x: MX, y: 5.55, w: 6.3, h: 0.6, rectRadius: 0.3, fill: { color: BLUE } });
  s.addText("Next step: a 30-minute live walkthrough", { x: MX, y: 5.55, w: 6.3, h: 0.6, fontFace: BODY_FONT, fontSize: MIN_FS, bold: true, color: WHITE, align: "center", valign: "middle" });
  s.addText("ITSS Learn · i-tsystemsupport.vercel.app · SAQA ID 48573 · QCTO / MICT SETA", {
    x: MX, y: H - 0.65, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: MIN_FS, color: DARK_MUTED,
  });
}

const OUT = "ITSS-Learn-Platform-Pitch.pptx";
await pptx.writeFile({ fileName: OUT });
console.log(`Written ${OUT} — ${pageNo} slides`);
