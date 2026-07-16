// Generates the My Course programme overview deck (Microsoft Fluent / Learn style).
// Run: node scripts/make-course-ppt.mjs -> public/downloads/IT-Systems-Support-NQF5-Course-Overview.pptx
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
const DARK_LINE = "1B4272";

const TITLE_FONT = "Aptos Display";
const BODY_FONT = "Aptos";

const W = 13.33;
const H = 7.5;
const MX = 0.55;
const CW = W - MX * 2;

const SHADOW = { type: "outer", angle: 90, blur: 7, offset: 2, color: "9AB4CC", opacity: 0.3 };

/* Thin-stroke Fluent-style icon set */
const ICONS = {
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="0.8"/>',
  briefcase: '<rect x="3.5" y="7" width="17" height="13" rx="1.8"/><path d="M9 7V5.6A1.6 1.6 0 0 1 10.6 4h2.8A1.6 1.6 0 0 1 15 5.6V7M3.5 12h17"/>',
  check: '<circle cx="12" cy="12" r="8.5"/><path d="m8.3 12.4 2.5 2.5 4.9-5.3"/>',
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
  monitor: '<rect x="3" y="4.5" width="18" height="12" rx="1.5"/><path d="M9.5 20h5M12 16.5V20"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="1.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
  chat: '<path d="M4 6.2A2.2 2.2 0 0 1 6.2 4h11.6A2.2 2.2 0 0 1 20 6.2v8.1a2.2 2.2 0 0 1-2.2 2.2H12l-4.5 3.6v-3.6H6.2A2.2 2.2 0 0 1 4 14.3z"/><path d="M8 9h8M8 12h5"/>',
  chip: '<rect x="6.5" y="6.5" width="11" height="11" rx="1.5"/><rect x="9.8" y="9.8" width="4.4" height="4.4"/><path d="M9 3.5v3M15 3.5v3M9 17.5v3M15 17.5v3M3.5 9h3M3.5 15h3M17.5 9h3M17.5 15h3"/>',
  person: '<circle cx="12" cy="8" r="3.6"/><path d="M4.8 20c.8-3.7 3.6-5.6 7.2-5.6s6.4 1.9 7.2 5.6"/>',
  gradcap: '<path d="m12 4 10 4.5L12 13 2 8.5z"/><path d="M6.5 10.8v4.4c0 1.2 2.5 2.6 5.5 2.6s5.5-1.4 5.5-2.6v-4.4"/><path d="M22 8.5v5"/>',
  trend: '<path d="m3.5 17 5.5-5.5 3.5 3.5 7.5-7.5"/><path d="M15 7.5h5v5"/>',
  dashboard: '<rect x="3.5" y="3.5" width="7.3" height="7.3" rx="1.2"/><rect x="13.2" y="3.5" width="7.3" height="7.3" rx="1.2"/><rect x="3.5" y="13.2" width="7.3" height="7.3" rx="1.2"/><rect x="13.2" y="13.2" width="7.3" height="7.3" rx="1.2"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.3"/><path d="m15.5 15.5 5 5"/>',
  network: '<circle cx="12" cy="5.5" r="2.5"/><circle cx="5.5" cy="18" r="2.5"/><circle cx="18.5" cy="18" r="2.5"/><path d="M10.9 7.6 6.8 15.9M13.1 7.6l4.1 8.3M8 18h8"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.3 4 5.2 4 8.5s-1.4 6.2-4 8.5c-2.6-2.3-4-5.2-4-8.5s1.4-6.2 4-8.5z"/>',
  design: '<circle cx="12" cy="12" r="8.5"/><path d="m14.8 9.2-1.7 4.5-4.5 1.7 1.7-4.5z"/>',
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
pptx.title = "IT Systems Support NQF 5 — Course Overview";

let pageNo = 0;

function slide() {
  const s = pptx.addSlide();
  s.background = { color: WHITE };
  pageNo += 1;
  if (pageNo > 1) {
    s.addText("National Certificate: Information Technology — System Support · SAQA ID 48573 · NQF 5", {
      x: MX, y: H - 0.42, w: CW - 1, h: 0.3, fontFace: BODY_FONT, fontSize: 10, color: GREY,
    });
    s.addText(String(pageNo), { x: W - MX - 0.6, y: H - 0.42, w: 0.6, h: 0.3, fontFace: BODY_FONT, fontSize: 10, color: GREY, align: "right" });
    s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.09, fill: { color: BLUE } });
  }
  return s;
}

function addIcon(s, name, x, y, size = 0.32, color) {
  s.addImage({ data: iconUri(name, color), x, y, w: size, h: size });
}

function eyebrowTitle(s, eyebrow, title) {
  s.addText(eyebrow.toUpperCase(), { x: MX, y: 0.3, w: CW, h: 0.34, fontFace: BODY_FONT, fontSize: 13, bold: true, color: BLUE, charSpacing: 2 });
  s.addText(title, { x: MX, y: 0.62, w: CW, h: 0.8, fontFace: TITLE_FONT, fontSize: 30, bold: true, color: NAVY });
}

function card(s, x, y, w, h, { fill = WHITE, line = BORDER } = {}) {
  s.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.09, fill: { color: fill }, line: { color: line, width: 1 }, shadow: SHADOW });
}

function iconCards(s, items, { x = MX, y = 2.0, w = CW, cols = 4, rowH = 1.15, gap = 0.2, fontSize = 14 } = {}) {
  const cw = (w - gap * (cols - 1)) / cols;
  items.forEach((it, i) => {
    const cx = x + (i % cols) * (cw + gap);
    const cy = y + Math.floor(i / cols) * (rowH + gap);
    card(s, cx, cy, cw, rowH);
    if (it.d) {
      addIcon(s, it.icon, cx + 0.18, cy + 0.18, 0.36);
      s.addText(it.text, {
        x: cx + 0.64, y: cy + 0.12, w: cw - 0.82, h: 0.62, fontFace: TITLE_FONT, fontSize, bold: true, color: NAVY, valign: "middle", lineSpacingMultiple: 1.0,
      });
      s.addText(it.d, {
        x: cx + 0.18, y: cy + 0.8, w: cw - 0.36, h: rowH - 0.92, fontFace: BODY_FONT, fontSize: fontSize - 2, color: GREY, valign: "top", lineSpacingMultiple: 1.1,
      });
    } else {
      addIcon(s, it.icon, cx + 0.18, cy + rowH / 2 - 0.18, 0.36);
      s.addText(it.text, {
        x: cx + 0.66, y: cy + 0.08, w: cw - 0.84, h: rowH - 0.16, fontFace: BODY_FONT, fontSize, color: NAVY, valign: "middle", lineSpacingMultiple: 1.05,
      });
    }
  });
}

function introText(s, text, y = 1.42, h = 0.6) {
  s.addText(text, { x: MX, y, w: CW, h, fontFace: BODY_FONT, fontSize: 16, color: GREY, valign: "top", lineSpacingMultiple: 1.15 });
}

function dataTable(s, header, rows, { x = MX, y = 2.0, w = CW, colW, fontSize = 14 } = {}) {
  const tableRows = [
    header.map((t) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: BLUE }, fontFace: TITLE_FONT, fontSize } })),
    ...rows.map((r, i) => r.map((c) => ({ text: c, options: { color: NAVY, fill: { color: i % 2 ? LIGHT : WHITE }, fontFace: BODY_FONT, fontSize } }))),
  ];
  s.addTable(tableRows, { x, y, w, colW, border: { type: "solid", color: BORDER, pt: 0.75 }, rowH: 0.46, valign: "middle", margin: 0.09 });
}

/* ============================================================= COVER */
{
  const s = slide();
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.12, fill: { color: BLUE } });
  s.addShape(pptx.ShapeType.roundRect, { x: MX, y: 1.25, w: 4.2, h: 0.52, rectRadius: 0.26, fill: { color: BLUE } });
  s.addText("SAQA ID 48573 · NQF LEVEL 5 · 148 CREDITS", { x: MX, y: 1.25, w: 4.2, h: 0.52, fontFace: BODY_FONT, fontSize: 12, bold: true, color: WHITE, align: "center", valign: "middle", charSpacing: 1 });
  s.addText("National Certificate: Information Technology System Support (Legacy)", { x: MX, y: 1.95, w: 10.6, h: 1.9, fontFace: TITLE_FONT, fontSize: 40, bold: true, color: NAVY });
  s.addText("Programme overview — modules, unit standards, purpose and outcomes", { x: MX, y: 3.85, w: 9.5, h: 0.6, fontFace: BODY_FONT, fontSize: 19, color: GREY });
  addIcon(s, "gradcap", 11.0, 1.4, 1.8, "#" + BORDER);
  s.addShape(pptx.ShapeType.line, { x: MX, y: 4.55, w: CW, h: 0, line: { color: BORDER, width: 1 } });
  const meta = [
    ["MODULES", "6 modules · 24 unit standards"],
    ["DURATION", "1 Year · 17 Jul 2026 – 25 Jun 2027"],
    ["SESSIONS", "Fridays · 09h00 – 14h00"],
    ["QUALITY ASSURANCE", "QCTO / MICT SETA"],
  ];
  meta.forEach(([k, v], i) => {
    const x = MX + i * (CW / 4);
    s.addText(k, { x, y: 4.8, w: CW / 4 - 0.2, h: 0.3, fontFace: BODY_FONT, fontSize: 11.5, bold: true, color: BLUE, charSpacing: 2 });
    s.addText(v, { x, y: 5.12, w: CW / 4 - 0.2, h: 0.6, fontFace: BODY_FONT, fontSize: 14, color: NAVY });
  });
  s.addText("ITSS Learn · Investec · Corporate Banking Technology", { x: MX, y: H - 0.55, w: CW, h: 0.35, fontFace: BODY_FONT, fontSize: 12, color: GREY });
}

/* ============================================================= ABOUT */
{
  const s = slide();
  eyebrowTitle(s, "About this programme", "A career in IT support");
  introText(s, "This qualification provides the student with the opportunity to pursue a career in support in the Information Technology field. On completion, the graduate will be able to:");
  iconCards(s, [
    { icon: "wrench", text: "Troubleshoot hardware & software problems — investigate, diagnose, solve" },
    { icon: "monitor", text: "Install, configure & maintain hardware, applications, systems and networks" },
    { icon: "briefcase", text: "Understand the role of technology in the business context" },
    { icon: "database", text: "Store, manage & retrieve data to meet organisational requirements" },
    { icon: "shield", text: "Secure information systems against data loss and breaches of integrity" },
    { icon: "calendar", text: "Plan & undertake scheduled maintenance upgrades" },
    { icon: "chat", text: "Talk to clients and users to determine the nature of problems" },
    { icon: "chip", text: "Repair equipment and replace parts" },
  ], { y: 2.15, cols: 4, rowH: 1.5 });
  card(s, MX, 5.75, CW, 0.62, { fill: LIGHT });
  addIcon(s, "document", MX + 0.22, 5.9, 0.3);
  s.addText([
    { text: "View the registered qualification on SAQA (ID 48573):  ", options: { bold: true, color: NAVY, fontSize: 13.5 } },
    { text: "allqs.saqa.org.za/showQualification.php?id=48573", options: { color: BLUE, fontSize: 13.5, hyperlink: { url: "https://allqs.saqa.org.za/showQualification.php?id=48573" } } },
  ], { x: MX + 0.62, y: 5.75, w: CW - 0.88, h: 0.62, fontFace: BODY_FONT, valign: "middle" });
}

/* ============================================================= WHAT YOU'LL LEARN — AREAS */
{
  const s = slide();
  eyebrowTitle(s, "What you'll learn", "Seven learning areas");
  introText(s, "The programme builds competence across seven areas, from personal development to enterprise-grade infrastructure.");
  iconCards(s, [
    { icon: "person", text: "Personal Development", d: "Business reports, project teamwork, technical meetings, ethics and professional conduct in IT." },
    { icon: "server", text: "Server Installation and Configuration", d: "Install and configure multi-user networked operating systems from bare metal to running service." },
    { icon: "wrench", text: "Server Administration", d: "Monitor, maintain and administer servers, networks and backups day to day." },
    { icon: "layers", text: "Server Configuring Advanced Services", d: "Configure advanced network services, security and multi-user environments against specification." },
    { icon: "monitor", text: "Desktop Infrastructure Implementation", d: "Build, install and support networked workstations and the desktop environment." },
    { icon: "dashboard", text: "Desktop Application Environment Implementation", d: "Deploy, support and maintain end-user applications across the organisation." },
    { icon: "document", text: "Enterprise Development", d: "LAN design for departmental offices, enterprise systems management and SQL database access." },
  ], { y: 2.15, cols: 4, rowH: 1.95, fontSize: 13.5 });
  s.addText("Each area is covered by dedicated unit standards, assessed formatively in class and summatively in your Portfolio of Evidence.", {
    x: MX, y: 6.45, w: CW, h: 0.5, fontFace: BODY_FONT, fontSize: 14, color: GREY, italic: true,
  });
}

/* ============================================================= WHAT YOU'LL LEARN — FACTS */
{
  const s = slide();
  eyebrowTitle(s, "What you'll learn", "Programme facts");
  const facts = [
    { icon: "award", label: "QUALIFICATION LEVEL", value: "NQF Level 5", detail: "148 credits · SAQA ID 48573" },
    { icon: "document", label: "MINIMUM ADMISSION REQUIREMENTS", value: "Grade 12", detail: "National Senior Certificate or equivalent" },
    { icon: "briefcase", label: "CAREER OPPORTUNITIES", value: "", detail: "End-User Support Technician · IT Technician · Network Technician · System Administrator" },
    { icon: "clock", label: "DURATION", value: "1 Year", detail: "Full-time · 17 Jul 2026 – 25 Jun 2027" },
  ];
  facts.forEach((f, i) => {
    const cw = (CW - 0.66) / 4;
    const cx = MX + i * (cw + 0.22);
    card(s, cx, 1.9, cw, 3.5);
    addIcon(s, f.icon, cx + 0.24, 2.2, 0.52);
    s.addText(f.label, { x: cx + 0.24, y: 2.88, w: cw - 0.48, h: 0.62, fontFace: BODY_FONT, fontSize: 11.5, bold: true, color: GREY, charSpacing: 1 });
    if (f.value) s.addText(f.value, { x: cx + 0.24, y: 3.52, w: cw - 0.48, h: 0.55, fontFace: TITLE_FONT, fontSize: 24, bold: true, color: BLUE });
    s.addText(f.detail, { x: cx + 0.24, y: f.value ? 4.12 : 3.52, w: cw - 0.48, h: 1.2, fontFace: BODY_FONT, fontSize: 13.5, color: NAVY, valign: "top", lineSpacingMultiple: 1.2 });
  });
}

/* ============================================================= PURPOSE + PATHWAY */
{
  const s = slide();
  eyebrowTitle(s, "Purpose of the qualification", "Why this qualification exists");
  introText(s, "The purpose of this qualification is to develop learners with the requisite competencies against the skills profile for the systems support career path — the overarching aim being to develop a broader base of skilled ICT professionals to underpin economic growth.", 1.42, 0.85);
  s.addText("YOUR QUALIFICATION PATHWAY", { x: MX, y: 2.45, w: CW, h: 0.3, fontFace: BODY_FONT, fontSize: 12.5, bold: true, color: BLUE, charSpacing: 1.5 });
  const path = [
    { icon: "layers", title: "NQF Level 4", desc: "National Certificate: IT Technical Support (or equivalent) — used as prior learning", current: false },
    { icon: "server", title: "NQF Level 5 — you are here", desc: "Systems Support, 148 credits, earned in the workplace through the learnership", current: true },
    { icon: "gradcap", title: "Beyond", desc: "Credits towards Computer Studies/Science · employment in industry · professional body membership", current: false },
  ];
  path.forEach((p, i) => {
    const cw = (CW - 1.3) / 3;
    const cx = MX + i * (cw + 0.65);
    card(s, cx, 2.85, cw, 1.95, { fill: p.current ? LIGHT : WHITE, line: p.current ? BLUE : BORDER });
    addIcon(s, p.icon, cx + 0.22, 3.05, 0.42);
    s.addText(p.title, { x: cx + 0.22, y: 3.55, w: cw - 0.44, h: 0.42, fontFace: TITLE_FONT, fontSize: 15, bold: true, color: p.current ? BLUE : NAVY });
    s.addText(p.desc, { x: cx + 0.22, y: 3.98, w: cw - 0.44, h: 0.82, fontFace: BODY_FONT, fontSize: 12, color: GREY, valign: "top", lineSpacingMultiple: 1.1 });
    if (i < 2) s.addShape(pptx.ShapeType.rightArrow, { x: cx + cw + 0.14, y: 3.65, w: 0.38, h: 0.34, fill: { color: BLUE } });
  });
  card(s, MX, 5.1, CW, 1.15, { fill: LIGHT });
  addIcon(s, "briefcase", MX + 0.22, 5.35, 0.34);
  s.addText("The qualification may be acquired through formal study or in the workplace through learnerships — so practical experience is gained WHILE qualifying, solving the old problem of graduates being turned away for lacking experience.", {
    x: MX + 0.68, y: 5.2, w: CW - 0.95, h: 0.95, fontFace: BODY_FONT, fontSize: 14, color: NAVY, valign: "middle", lineSpacingMultiple: 1.15,
  });
}

/* ============================================================= DESIGNED TO */
{
  const s = slide();
  eyebrowTitle(s, "Purpose of the qualification", "The qualification is designed to");
  iconCards(s, [
    { icon: "gradcap", text: "Give undergraduate entry into networking/systems support with credits towards tertiary study" },
    { icon: "briefcase", text: "Prepare learners for initial employment in the computer industry" },
    { icon: "trend", text: "Recognise NQF Level 4 IT credits as prior learning" },
    { icon: "dashboard", text: "Feed learnership schemes across the ICT sector and beyond" },
  ], { y: 1.75, cols: 2, rowH: 1.15, fontSize: 15 });
  s.addText("NB", { x: MX, y: 4.5, w: CW, h: 0.3, fontFace: BODY_FONT, fontSize: 12.5, bold: true, color: BLUE, charSpacing: 1.5 });
  card(s, MX, 4.85, CW, 1.85, { fill: "F8FAFC", line: BORDER });
  s.addText("This qualification has been developed within a contextual qualifications framework — electives indicate the context in which the overall learning programme is designed and assessed. The core components form the generic base, contextualised to meet the unique and specific issues of the ICT sector and the range of enabled (vertical) markets. It has also been developed to assist with professionalisation across the IT industry, allowing qualified learners to gain membership of registered professional bodies in the ICT industry.", {
    x: MX + 0.25, y: 4.98, w: CW - 0.5, h: 1.6, fontFace: BODY_FONT, fontSize: 13.5, color: NAVY, valign: "top", lineSpacingMultiple: 1.2,
  });
}

/* ============================================================= 13 COMPETENCIES */
{
  const s = slide();
  eyebrowTitle(s, "Purpose of the qualification", "To qualify, you must demonstrate competence in 13 areas");
  iconCards(s, [
    { icon: "wrench", text: "Logical troubleshooting of day-to-day hardware & software problems" },
    { icon: "briefcase", text: "The role of technology in the business context" },
    { icon: "chat", text: "Integrated technology-based communication systems" },
    { icon: "database", text: "Storing, managing & retrieving data for the organisation" },
    { icon: "shield", text: "Secure information systems — no data loss, no integrity breaches" },
    { icon: "document", text: "Reflecting business structure in IT systems for efficiency" },
    { icon: "chip", text: "Mobilising technical resources to solve business problems" },
    { icon: "trend", text: "Cost-effective performance in technology-based projects" },
    { icon: "person", text: "Managing customer relations appropriately" },
    { icon: "layers", text: "Working within change, release & configuration processes" },
    { icon: "search", text: "Using research tools and knowledge-base repositories" },
    { icon: "award", text: "Identifying & communicating business opportunities" },
    { icon: "monitor", text: "Installing, supporting & maintaining end-user applications" },
  ], { y: 1.7, cols: 3, rowH: 0.92, gap: 0.14, fontSize: 12.5 });
}

/* ============================================================= RATIONALE */
{
  const s = slide();
  eyebrowTitle(s, "Purpose of the qualification", "Rationale");
  card(s, MX, 1.7, CW, 1.65, { fill: LIGHT });
  s.addShape(pptx.ShapeType.rect, { x: MX, y: 1.7, w: 0.09, h: 1.65, fill: { color: BLUE } });
  s.addText("An increasing dissatisfaction of industry employers with the stated lack of ability of 'paper-certified' graduates seeking employment in systems support and networking precipitated a review of the competencies desired by industry.", {
    x: MX + 0.32, y: 1.85, w: CW - 0.64, h: 1.35, fontFace: BODY_FONT, fontSize: 16, color: NAVY, valign: "middle", lineSpacingMultiple: 1.2,
  });
  s.addText("Three years of research in the sector revealed the need for entry-level candidates who can apply a range of institutionally acquired skills in the workplace, in the field of systems support, in a manner that adds business value. The stated requirement is for a new set of skills and competencies, within the specific focus of networking/systems support, contextualised as appropriate for a wide range of related industry sectors.", {
    x: MX, y: 3.65, w: CW, h: 1.4, fontFace: BODY_FONT, fontSize: 15, color: GREY, valign: "top", lineSpacingMultiple: 1.25,
  });
  card(s, MX, 5.35, CW, 0.85, { fill: "F8FAFC" });
  addIcon(s, "check", MX + 0.22, 5.6, 0.34);
  s.addText("The answer: skills applied in the workplace, in a manner that adds business value — exactly what this learnership delivers.", {
    x: MX + 0.68, y: 5.35, w: CW - 0.95, h: 0.85, fontFace: BODY_FONT, fontSize: 14, bold: true, color: NAVY, valign: "middle",
  });
}

/* ============================================================= WORTH PURSUING / INDUSTRY RELEVANCE */
{
  const s = slide();
  s.addText("PURPOSE OF THE QUALIFICATION", { x: MX, y: 0.3, w: CW, h: 0.34, fontFace: BODY_FONT, fontSize: 13, bold: true, color: BLUE, charSpacing: 2 });
  s.addText("Is this qualification worth pursuing — and for how long will it remain industry-relevant?", {
    x: MX, y: 0.62, w: CW, h: 0.6, fontFace: TITLE_FONT, fontSize: 23, bold: true, color: NAVY,
  });
  introText(s, "Yes. The qualification is registered on the NQF and, once achieved, your certificate never lapses — it is a lifetime asset. The competencies it builds (troubleshooting, networking, server administration, security, databases) map directly onto the IT support roles industry hires for today.", 1.35, 0.9);

  // Registration window — key SAQA dates
  const dates = [
    { icon: "calendar", label: "LAST DATE FOR ENROLMENT", value: "30 Dec 2026", detail: "New learners must be registered on the qualification by this date — this intake is inside the window." },
    { icon: "award", label: "LAST DATE FOR ACHIEVEMENT", value: "30 Dec 2029", detail: "All assessment and certification must be completed by this date — this programme certificates in June 2027, well within it." },
  ];
  dates.forEach((d, i) => {
    const cw = (CW - 0.22) / 2;
    const cx = MX + i * (cw + 0.22);
    card(s, cx, 2.5, cw, 1.75);
    addIcon(s, d.icon, cx + 0.24, 2.72, 0.44);
    s.addText(d.label, { x: cx + 0.84, y: 2.7, w: cw - 1.06, h: 0.3, fontFace: BODY_FONT, fontSize: 11.5, bold: true, color: GREY, charSpacing: 1.5 });
    s.addText(d.value, { x: cx + 0.84, y: 3.0, w: cw - 1.06, h: 0.5, fontFace: TITLE_FONT, fontSize: 24, bold: true, color: BLUE });
    s.addText(d.detail, { x: cx + 0.24, y: 3.55, w: cw - 0.48, h: 0.62, fontFace: BODY_FONT, fontSize: 12, color: GREY, valign: "top", lineSpacingMultiple: 1.1 });
  });

  // Why it stays relevant
  iconCards(s, [
    { icon: "award", text: "Your certificate never expires — achieved credits are a lifetime asset on the NQF" },
    { icon: "trend", text: "Credits are recognised for RPL and articulation into newer QCTO occupational qualifications" },
    { icon: "wrench", text: "The skills — support, networks, servers, security, SQL — remain the core of IT support work" },
  ], { y: 4.5, cols: 3, rowH: 1.05, fontSize: 12.5 });

  card(s, MX, 5.85, CW, 0.8, { fill: LIGHT });
  addIcon(s, "check", MX + 0.22, 6.08, 0.34);
  s.addText([
    { text: "Bottom line: ", options: { bold: true, color: NAVY } },
    { text: "enrol within the window, certificate by June 2027, and the qualification — and the experience gained in the workplace — stays with you for life.", options: { color: NAVY } },
  ], { x: MX + 0.68, y: 5.85, w: CW - 0.95, h: 0.8, fontFace: BODY_FONT, fontSize: 14, valign: "middle" });
}

/* ============================================================= ACCREDITATION NOTE */
{
  const RED = "D13438";
  const GREEN = "6BA02B";
  const s = slide();
  s.addText("ACCREDITATION", { x: MX, y: 0.3, w: CW, h: 0.34, fontFace: BODY_FONT, fontSize: 13, bold: true, color: RED, charSpacing: 2 });
  addIcon(s, "shield", MX, 0.68, 0.52, "#" + RED);
  s.addText("Important Accreditation Note!", {
    x: MX + 0.68, y: 0.62, w: CW - 0.68, h: 0.8, fontFace: TITLE_FONT, fontSize: 30, bold: true, color: RED, valign: "middle",
  });
  card(s, MX, 1.75, CW, 1.75, { fill: "FDF3F4", line: "E8B3B5" });
  s.addShape(pptx.ShapeType.rect, { x: MX, y: 1.75, w: 0.09, h: 1.75, fill: { color: RED } });
  s.addText([
    { text: "While this remains a highly requested MICT SETA IT Learnership program for entry-level tech roles, its final quality assurance, assessment oversight, and certification are ", options: { color: NAVY } },
    { text: "transitioning", options: { color: BLUE, italic: true } },
    { text: " to the ", options: { color: NAVY } },
    { text: "QCTO", options: { bold: true, color: BLUE } },
    { text: " (Quality Council for Trades and Occupations) under the modern occupational qualification's framework.", options: { color: NAVY } },
  ], { x: MX + 0.35, y: 1.9, w: CW - 0.7, h: 1.45, fontFace: BODY_FONT, fontSize: 16, valign: "middle", lineSpacingMultiple: 1.25 });
  const dates = [
    { icon: "calendar", label: "LAST DATE FOR ENROLMENT", value: "2026-12-30", color: GREEN },
    { icon: "clock", label: "LAST DATE FOR ACHIEVEMENT", value: "2029-12-30", color: RED },
  ];
  dates.forEach((d, i) => {
    const cw = (CW - 0.22) / 2;
    const cx = MX + i * (cw + 0.22);
    card(s, cx, 3.85, cw, 1.6);
    addIcon(s, d.icon, cx + 0.24, 4.08, 0.44, "#" + d.color);
    s.addText(d.label, { x: cx + 0.84, y: 4.05, w: cw - 1.06, h: 0.35, fontFace: TITLE_FONT, fontSize: 14, bold: true, color: d.color, charSpacing: 1 });
    s.addText(d.value, { x: cx + 0.84, y: 4.45, w: cw - 1.06, h: 0.6, fontFace: TITLE_FONT, fontSize: 26, bold: true, color: d.color });
  });
  card(s, MX, 5.75, CW, 0.85, { fill: LIGHT });
  addIcon(s, "check", MX + 0.22, 6.0, 0.34);
  s.addText([
    { text: "This intake is safely inside both windows: ", options: { bold: true, color: NAVY } },
    { text: "enrolment July 2026, certification June 2027 — well before the last date for achievement.", options: { color: NAVY } },
  ], { x: MX + 0.68, y: 5.75, w: CW - 0.95, h: 0.85, fontFace: BODY_FONT, fontSize: 14, valign: "middle" });
}

/* ============================================================= MICT SETA */
{
  const s = slide();
  eyebrowTitle(s, "Quality assurance", "MICT SETA");
  introText(s, "Media, Information and Communication Technologies Sector Education and Training Authority — the statutory body that oversees skills development in the media and ICT sectors.");

  s.addText("CORE MANDATE", { x: MX, y: 2.15, w: CW, h: 0.3, fontFace: BODY_FONT, fontSize: 12.5, bold: true, color: BLUE, charSpacing: 1.5 });
  card(s, MX, 2.5, CW, 0.95, { fill: LIGHT });
  s.addShape(pptx.ShapeType.rect, { x: MX, y: 2.5, w: 0.09, h: 0.95, fill: { color: BLUE } });
  s.addText([
    { text: "Bridges the gap between educational institutions and the labour market ", options: { bold: true, color: NAVY } },
    { text: "— turning classroom learning into workplace-ready skills the sector actually needs.", options: { color: NAVY } },
  ], { x: MX + 0.35, y: 2.5, w: CW - 0.7, h: 0.95, fontFace: BODY_FONT, fontSize: 15.5, valign: "middle", lineSpacingMultiple: 1.15 });

  s.addText("ROLE", { x: MX, y: 3.7, w: CW, h: 0.3, fontFace: BODY_FONT, fontSize: 12.5, bold: true, color: BLUE, charSpacing: 1.5 });
  iconCards(s, [
    { icon: "briefcase", text: "Funds and administers learnerships, internships and skills programmes — including this one" },
    { icon: "check", text: "Accredits training providers and quality-assures learning programmes and assessments" },
    { icon: "award", text: "Certifies learners and registers achievements on the NQF" },
    { icon: "people", text: "Registers assessors and moderators to guarantee credible assessment" },
    { icon: "chart", text: "Researches sector skills needs and publishes the Sector Skills Plan" },
    { icon: "trend", text: "Disburses mandatory and discretionary grants that make workplace learning viable" },
  ], { y: 4.05, cols: 3, rowH: 1.05, fontSize: 12.5 });

  card(s, MX, 6.35, CW, 0.62, { fill: "F8FAFC" });
  addIcon(s, "shield", MX + 0.22, 6.5, 0.3);
  s.addText("Your learnership is registered with MICT SETA — with quality assurance transitioning to the QCTO under the occupational qualifications framework.", {
    x: MX + 0.62, y: 6.35, w: CW - 0.88, h: 0.62, fontFace: BODY_FONT, fontSize: 13, color: NAVY, valign: "middle",
  });
}

/* ============================================================= QCTO */
{
  const s = slide();
  eyebrowTitle(s, "Quality assurance", "QCTO");
  introText(s, "Quality Council for Trades and Occupations — the quality council responsible for occupational qualifications on the National Qualifications Framework (NQF).");

  s.addText("CORE MANDATE", { x: MX, y: 2.15, w: CW, h: 0.3, fontFace: BODY_FONT, fontSize: 12.5, bold: true, color: BLUE, charSpacing: 1.5 });
  card(s, MX, 2.5, CW, 0.95, { fill: LIGHT });
  s.addShape(pptx.ShapeType.rect, { x: MX, y: 2.5, w: 0.09, h: 0.95, fill: { color: BLUE } });
  s.addText([
    { text: "Oversees the design, implementation, assessment and certification of occupational qualifications ", options: { bold: true, color: NAVY } },
    { text: "on the National Qualifications Framework (NQF) — ensuring every qualification reflects real workplace competence.", options: { color: NAVY } },
  ], { x: MX + 0.35, y: 2.5, w: CW - 0.7, h: 0.95, fontFace: BODY_FONT, fontSize: 15.5, valign: "middle", lineSpacingMultiple: 1.15 });

  s.addText("TRANSITION", { x: MX, y: 3.7, w: CW, h: 0.3, fontFace: BODY_FONT, fontSize: 12.5, bold: true, color: BLUE, charSpacing: 1.5 });
  iconCards(s, [
    { icon: "layers", text: "Legacy SETA qualifications — like this National Certificate — are migrating to the QCTO's occupational framework" },
    { icon: "check", text: "The QCTO now holds final quality assurance and assessment oversight for this programme" },
    { icon: "award", text: "Certification is issued under QCTO oversight — your certificate remains registered on the NQF" },
    { icon: "clock", text: "Enrol by 30 Dec 2026, achieve by 30 Dec 2029 — after that, successor occupational qualifications take over" },
    { icon: "trend", text: "Credits achieved now articulate into the newer occupational qualifications via RPL" },
    { icon: "shield", text: "One national standard: external, integrated summative assessment protects the value of your qualification" },
  ], { y: 4.05, cols: 3, rowH: 1.05, fontSize: 12.5 });

  card(s, MX, 6.35, CW, 0.62, { fill: "F8FAFC" });
  addIcon(s, "gradcap", MX + 0.22, 6.5, 0.3);
  s.addText("MICT SETA administers your learnership day to day; the QCTO guarantees the standard behind your certificate.", {
    x: MX + 0.62, y: 6.35, w: CW - 0.88, h: 0.62, fontFace: BODY_FONT, fontSize: 13, color: NAVY, valign: "middle",
  });
}

/* ============================================================= HOW EACH MODULE WORKS */
{
  const s = slide();
  eyebrowTitle(s, "How each module works", "Five steps, every module");
  const steps = [
    { name: "Study", desc: "Work through the unit standard study notes" },
    { name: "Practise", desc: "Complete the activities & practicals" },
    { name: "Logbook", desc: "Record your workplace evidence" },
    { name: "Quiz", desc: "Pass the module quiz (80%+)" },
    { name: "Assignment", desc: "Submit the official assignment for your POE" },
  ];
  steps.forEach((st, i) => {
    const cw = (CW - 0.88) / 5;
    const cx = MX + i * (cw + 0.22);
    card(s, cx, 2.0, cw, 2.1);
    s.addShape(pptx.ShapeType.ellipse, { x: cx + 0.2, y: 2.2, w: 0.46, h: 0.46, fill: { color: i === steps.length - 1 ? NAVY : BLUE } });
    s.addText(String(i + 1), { x: cx + 0.2, y: 2.2, w: 0.46, h: 0.46, fontFace: TITLE_FONT, fontSize: 16, bold: true, color: WHITE, align: "center", valign: "middle" });
    s.addText(st.name, { x: cx + 0.2, y: 2.8, w: cw - 0.4, h: 0.42, fontFace: TITLE_FONT, fontSize: 16, bold: true, color: NAVY });
    s.addText(st.desc, { x: cx + 0.2, y: 3.24, w: cw - 0.4, h: 0.82, fontFace: BODY_FONT, fontSize: 12, color: GREY, valign: "top", lineSpacingMultiple: 1.1 });
  });
  card(s, MX, 4.5, CW, 0.85, { fill: LIGHT });
  addIcon(s, "award", MX + 0.22, 4.75, 0.34);
  s.addText([
    { text: "After all six modules:  ", options: { bold: true, color: NAVY } },
    { text: "Remedials (if needed) \u2192 FISA \u2192 Logbook sign-off \u2192 Certification (148 credits)", options: { color: NAVY } },
  ], { x: MX + 0.68, y: 4.5, w: CW - 0.95, h: 0.85, fontFace: BODY_FONT, fontSize: 14.5, valign: "middle" });
  s.addText("Remedials: 7, 14, 21 May 2027 · FISA (Final Integrated Summative Assessment): 28 May – 4 Jun 2027 · Logbook: 11, 18, 25 Jun 2027 — all sessions 09h00 – 14h00.", {
    x: MX, y: 5.55, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: 12.5, color: GREY, italic: true,
  });
}

/* ============================================================= REMEDIALS · FISA · LOGBOOK */
{
  const s = slide();
  eyebrowTitle(s, "After the six modules", "Remedials · FISA · Logbook");
  introText(s, "Once all six modules are complete, three final steps stand between you and certification.");
  const finals = [
    {
      icon: "wrench",
      title: "Remedials",
      desc: "Extra support sessions to close any gaps identified in your assessments. You re-attempt only the outcomes not yet achieved — attend only if needed.",
      dates: "7, 14, 21 May 2027",
    },
    {
      icon: "award",
      title: "FISA",
      desc: "Final Integrated Summative Assessment — the final comprehensive exam covering the whole curriculum, integrating all six modules and 24 unit standards.",
      dates: "28 May – 4 Jun 2027",
    },
    {
      icon: "document",
      title: "Logbook",
      desc: "Your workplace evidence logbook is completed, verified and signed off with your facilitator and workplace mentor as final proof of applied competence.",
      dates: "11, 18, 25 Jun 2027",
    },
  ];
  finals.forEach((f, i) => {
    const cw = (CW - 0.44) / 3;
    const cx = MX + i * (cw + 0.22);
    card(s, cx, 2.15, cw, 3.15);
    addIcon(s, f.icon, cx + 0.24, 2.4, 0.46);
    s.addText(f.title, { x: cx + 0.84, y: 2.42, w: cw - 1.06, h: 0.46, fontFace: TITLE_FONT, fontSize: 20, bold: true, color: NAVY, valign: "middle" });
    s.addText(f.desc, { x: cx + 0.24, y: 3.05, w: cw - 0.48, h: 1.6, fontFace: BODY_FONT, fontSize: 13, color: GREY, valign: "top", lineSpacingMultiple: 1.2 });
    s.addShape(pptx.ShapeType.roundRect, { x: cx + 0.24, y: 4.72, w: cw - 0.48, h: 0.44, rectRadius: 0.22, fill: { color: LIGHT } });
    addIcon(s, "calendar", cx + 0.38, 4.8, 0.28);
    s.addText(f.dates, { x: cx + 0.72, y: 4.72, w: cw - 1.0, h: 0.44, fontFace: BODY_FONT, fontSize: 12.5, bold: true, color: BLUE, valign: "middle" });
    if (i < 2) s.addShape(pptx.ShapeType.rightArrow, { x: cx + cw + 0.02, y: 3.55, w: 0.4, h: 0.36, fill: { color: BLUE } });
  });
  card(s, MX, 5.75, CW, 0.85, { fill: LIGHT });
  addIcon(s, "gradcap", MX + 0.22, 6.0, 0.34);
  s.addText([
    { text: "Pass FISA and have your logbook signed off ", options: { bold: true, color: NAVY } },
    { text: "— and you are certificated with the National Certificate: Information Technology — System Support (148 credits, NQF 5).", options: { color: NAVY } },
  ], { x: MX + 0.68, y: 5.75, w: CW - 0.95, h: 0.85, fontFace: BODY_FONT, fontSize: 14, valign: "middle" });
}

/* ============================================================= MODULES OVERVIEW */
const MODULES = [
  { n: 1, icon: "person", name: "Personal Development", units: 7, credits: 36, activities: 6 },
  { n: 2, icon: "network", name: "Client Server Networking", units: 3, credits: 15, activities: 4 },
  { n: 3, icon: "globe", name: "Network, Concept, Architecture", units: 4, credits: 24, activities: 5 },
  { n: 4, icon: "design", name: "Design a LAN for Developmental Office & Enterprise Development", units: 3, credits: 14, activities: 5 },
  { n: 5, icon: "server", name: "Configure, Operate & Administer Server Computer & Peripherals", units: 4, credits: 26, activities: 5 },
  { n: 6, icon: "database", name: "Database Access", units: 3, credits: 31, activities: 5 },
];
{
  const s = slide();
  eyebrowTitle(s, "Modules", "Six modules · 24 unit standards · 148 credits");
  MODULES.forEach((m, i) => {
    const cw = (CW - 0.44) / 3;
    const cx = MX + (i % 3) * (cw + 0.22);
    const cy = 1.85 + Math.floor(i / 3) * 2.15;
    card(s, cx, cy, cw, 1.95);
    addIcon(s, m.icon, cx + 0.22, cy + 0.22, 0.42);
    s.addText(`MODULE ${m.n}`, { x: cx + 0.78, y: cy + 0.24, w: cw - 1.0, h: 0.3, fontFace: BODY_FONT, fontSize: 11.5, bold: true, color: BLUE, charSpacing: 1.5 });
    s.addText(m.name, { x: cx + 0.22, y: cy + 0.72, w: cw - 0.44, h: 0.78, fontFace: TITLE_FONT, fontSize: 14.5, bold: true, color: NAVY, valign: "top", lineSpacingMultiple: 1.05 });
    s.addText(`${m.units} unit standards · ${m.credits} credits · ${m.activities} activities`, { x: cx + 0.22, y: cy + 1.52, w: cw - 0.44, h: 0.32, fontFace: BODY_FONT, fontSize: 12, color: GREY });
  });
}

/* ============================================================= MODULE SUMMARY — UNIT STANDARDS & ACTIVITIES */
{
  const s = slide();
  eyebrowTitle(s, "Modules", "Module summary — unit standards & activities");
  introText(s, "Every module combines unit standards (credit-bearing theory and practice) with formal learning activities completed in class and in the workplace.");
  dataTable(s, ["Module", "Unit standards", "Activities", "Credits"], MODULES.map((m) => [
    `${m.n}. ${m.name}`, String(m.units), String(m.activities), String(m.credits),
  ]), { y: 2.25, colW: [7.63, 1.7, 1.5, 1.4], fontSize: 12 });
  s.addText("Totals: 24 unit standards · 30 activities · 148 credits", {
    x: MX, y: 6.0, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: 14.5, bold: true, color: NAVY,
  });
}

/* ============================================================= MODULE DETAIL TABLES */
const MODULE_UNITS = [
  ["Module 1 — Personal Development", [
    ["8252", "Writing business reports in Retail/Wholesale practices", "5", "6", "17 Jul 2026"],
    ["10135", "Work as a project team member", "4", "8", "24, 31 Jul 2026"],
    ["114050", "Explain the principles of business and the role of information technology", "5", "4", "7 Aug 2026"],
    ["114051", "Conduct a technical practitioners meeting", "5", "4", "14 Aug 2026"],
    ["114055", "Demonstrate an awareness of ethics and professionalism for the computer industry in South Africa", "5", "3", "21 Aug 2026"],
    ["114046", "Demonstrate an understanding of issues affecting the management of a local area computer network (LAN)", "5", "4", "28 Aug 2026"],
    ["114183", "Apply the principles of resolving problems for single-user and multi-user computer operating systems", "5", "7", "4, 11 Sep 2026"],
  ]],
  ["Module 2 — Client Server Networking", [
    ["114058", "Demonstrate an understanding of the concepts of Multi-User computer Operating systems", "5", "7", "18, 25 Sep 2026"],
    ["114059", "Demonstrate an understanding of estimating a unit of work and the implications of late delivery", "5", "5", "2 Oct 2026"],
    ["114076", "Use computer technology to research a computer topic", "4", "3", "9 Oct 2026"],
  ]],
  ["Module 3 — Network, Concept, Architecture", [
    ["114060", "Demonstrate an understanding of local area computer networks, by installing a networked workstation", "5", "5", "16 Oct 2026"],
    ["114061", "Demonstrate an understanding of Wide Area Computer Networks (WANs), comparing them with Local Area Networks (LANs)", "5", "5", "23 Oct 2026"],
    ["114072", "Install and commission a local area computer network", "5", "9", "30 Oct, 6 Nov 2026"],
    ["114074", "Demonstrate an understanding of different computer network architectures and standards", "5", "5", "13 Nov 2026"],
  ]],
  ["Module 4 — Design a LAN for Developmental Office & Enterprise Development", [
    ["114052", "Demonstrate appropriate customer care in the context of IT support, according to a Service Level Agreement", "5", "8", "20, 27 Nov 2026"],
    ["114056", "Describe enterprise systems management and its role in IT systems support", "5", "3", "4 Dec 2026"],
    ["114075", "Design a local area computer network for a departmental office environment", "5", "3", "11 Dec 2026"],
  ]],
  ["Module 5 — Configure, Operate & Administer Server Computer & Peripherals", [
    ["114047", "Install and configure a multi-user networked operating system", "5", "9", "15, 22 Jan 2027"],
    ["114053", "Monitor and maintain a multi-user networked operating system", "5", "6", "29 Jan 2027"],
    ["114054", "Administer a local area computer network", "5", "7", "5, 12 Feb 2027"],
    ["114066", "Test Networked IT systems against given specifications", "5", "4", "19 Feb 2027"],
  ]],
  ["Module 6 — Database Access", [
    ["114048", "Create database access for a computer application using structured query language", "5", "9", "26 Feb, 5, 12 Mar 2027"],
    ["114049", "Demonstrate an understanding of Computer Database Management Systems", "5", "7", "19, 26 Mar 2027"],
    ["114069", "Administer security systems for a multi-user computer system", "6", "15", "2, 9, 16, 23, 30 Apr 2027"],
  ]],
];
MODULE_UNITS.forEach(([title, rows], i) => {
  const s = slide();
  eyebrowTitle(s, `Modules · ${i + 1} of 6`, title);
  const credits = rows.reduce((n, r) => n + Number(r[3]), 0);
  s.addText(`${rows.length} unit standards · ${credits} credits · all sessions 09h00 – 14h00`, {
    x: MX, y: 1.42, w: CW, h: 0.35, fontFace: BODY_FONT, fontSize: 14, color: GREY,
  });
  dataTable(s, ["US", "Unit standard title", "NQF", "Credits", "Dates"], rows, {
    y: 1.95, colW: [1.0, 7.03, 0.8, 0.9, 2.5], fontSize: 12.5,
  });
});

/* ============================================================= CLOSING */
{
  const s = slide();
  s.background = { color: NAVY };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.12, fill: { color: BLUE } });
  addIcon(s, "gradcap", MX, 1.7, 0.65, "#" + DARK_LABEL);
  s.addText("Six modules. 24 unit standards. 148 credits. One career.", {
    x: MX, y: 2.5, w: CW, h: 1.4, fontFace: TITLE_FONT, fontSize: 36, bold: true, color: WHITE,
  });
  s.addText("Study \u2192 Practise \u2192 Logbook \u2192 Quiz \u2192 Assignment, module by module — then Remedials, FISA and logbook sign-off to certification in June 2027.", {
    x: MX, y: 3.95, w: 10.2, h: 1.0, fontFace: BODY_FONT, fontSize: 17, color: DARK_SUB, lineSpacingMultiple: 1.25,
  });
  s.addText("National Certificate: Information Technology — System Support · SAQA ID 48573 · ITSS Learn", {
    x: MX, y: H - 0.6, w: CW, h: 0.35, fontFace: BODY_FONT, fontSize: 12, color: DARK_MUTED,
  });
}

mkdirSync("public/downloads", { recursive: true });
const OUT = "public/downloads/IT-Systems-Support-NQF5-Course-Overview.pptx";
await pptx.writeFile({ fileName: OUT });
console.log(`Written ${OUT} — ${pageNo} slides`);
