// Generates the US 114055 learner deck — Ethics & Professionalism for the
// computer industry in South Africa — in the same Investec / Microsoft Learn
// house style as LearnerManual.pptx. All text comes from the unit's lesson
// content in src/data/content.ts.
// Run: node scripts/make-ethics-ppt.mjs
import pptxgen from "pptxgenjs";

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

const ICONS = {
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="0.8"/>',
  check: '<circle cx="12" cy="12" r="8.5"/><path d="m8.3 12.4 2.5 2.5 4.9-5.3"/>',
  dismiss: '<circle cx="12" cy="12" r="8.5"/><path d="m9 9 6 6M15 9l-6 6"/>',
  document: '<path d="M6.5 3.5h7.2l4.8 4.8V19a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 19z"/><path d="M13.5 3.5v5h5M9.5 12.5h5M9.5 15.5h5"/>',
  people: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5"/><circle cx="16.8" cy="9.2" r="2.4"/><path d="M16.3 14.7c2.2.2 3.8 1.5 4.3 4.3"/>',
  shield: '<path d="M12 3l7 2.8v5.4c0 4.5-3 7.9-7 9.8-4-1.9-7-5.3-7-9.8V5.8z"/><path d="m9.2 11.8 2 2 3.6-4"/>',
  pen: '<path d="M4 20l1-4L16.5 4.5a2.12 2.12 0 0 1 3 3L8 19l-4 1z"/><path d="m14.5 6.5 3 3"/>',
  briefcase: '<rect x="3.5" y="7" width="17" height="13" rx="1.8"/><path d="M9 7V5.6A1.6 1.6 0 0 1 10.6 4h2.8A1.6 1.6 0 0 1 15 5.6V7M3.5 12h17"/>',
  book: '<path d="M4 19.5v-14A2.5 2.5 0 0 1 6.5 3H20v18H6.5a2.5 2.5 0 0 1-2.5-2.5zm0 0A2.5 2.5 0 0 1 6.5 17H20"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4.5 4.5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.2 2"/>',
  chart: '<path d="M4 4v16h16"/><path d="M8 16v-5M12 16V7M16 16v-8"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  lock: '<rect x="5.5" y="10.5" width="13" height="9.5" rx="1.6"/><path d="M8.5 10.5V7.7a3.5 3.5 0 0 1 7 0v2.8"/><circle cx="12" cy="15" r="1.2"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  warning: '<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17.2h.05"/>',
  question: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.2a2.4 2.4 0 1 1 3.3 2.2c-.8.33-1.3 1-1.3 1.8v.4"/><path d="M11.6 16.6h.05"/>',
  compass: '<circle cx="12" cy="12" r="8.5"/><path d="m14.8 9.2-1.7 4.5-4.5 1.7 1.7-4.5z"/>',
  list: '<path d="M8.5 6h12M8.5 12h12M8.5 18h12"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.3 3.6 5.1 3.6 8.5s-1.2 6.2-3.6 8.5c-2.4-2.3-3.6-5.1-3.6-8.5s1.2-6.2 3.6-8.5z"/>',
  scale: '<path d="M12 4v16M7 20h10"/><path d="m7 7-3.2 6.2a3.4 3.4 0 0 0 6.4 0zM17 7l-3.2 6.2a3.4 3.4 0 0 0 6.4 0z"/><path d="M4.5 7h15"/>',
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
pptx.title = "US 114055 — Ethics & Professionalism (Learner Manual)";

let pageNo = 0;
function slide() {
  const s = pptx.addSlide();
  s.background = { color: WHITE };
  pageNo += 1;
  if (pageNo > 1) {
    s.addText("Unit Standard 114055 — Ethics & Professionalism   ·   Investec IT Systems Support NQF 5", {
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
    x: MX, y: 0.64, w: CW, h: 0.86, fontFace: TITLE_FONT, fontSize: 32, bold: true, color: NAVY,
  });
}

function card(s, x, y, w, h, { fill = WHITE, line = BORDER } = {}) {
  s.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.09, fill: { color: fill }, line: { color: line, width: 1 }, shadow: { ...SHADOW },
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

function numberedActivity(s, items, { y = 1.8, rowH = 0.82, fontSize = 17 } = {}) {
  items.forEach((t, i) => {
    const cy = y + i * rowH;
    s.addShape(pptx.ShapeType.ellipse, { x: MX, y: cy, w: 0.5, h: 0.5, fill: { color: BLUE } });
    s.addText(String(i + 1), { x: MX, y: cy, w: 0.5, h: 0.5, fontFace: TITLE_FONT, fontSize: 18, bold: true, color: WHITE, align: "center", valign: "middle" });
    s.addText(t, { x: MX + 0.72, y: cy - 0.05, w: CW - 0.9, h: rowH - 0.15, fontFace: BODY_FONT, fontSize, color: NAVY, valign: "middle", lineSpacingMultiple: 1.05 });
  });
}

/* ============================================================ 1 · COVER */
{
  const s = slide();
  s.background = { color: NAVY };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.12, fill: { color: BLUE } });
  s.addShape(pptx.ShapeType.roundRect, { x: MX, y: 1.3, w: 3.9, h: 0.56, rectRadius: 0.28, fill: { color: BLUE } });
  s.addText("UNIT STANDARD 114055 · NQF 5 · 3 CREDITS", {
    x: MX, y: 1.3, w: 3.9, h: 0.56, fontFace: BODY_FONT, fontSize: 12.5, bold: true, color: WHITE, align: "center", valign: "middle", charSpacing: 1,
  });
  s.addText("Ethics & Professionalism", { x: MX, y: 2.1, w: CW, h: 1.5, fontFace: TITLE_FONT, fontSize: 52, bold: true, color: WHITE });
  s.addText("Demonstrate an awareness of ethics and professionalism for the computer industry in South Africa", {
    x: MX, y: 3.55, w: 10.5, h: 0.85, fontFace: BODY_FONT, fontSize: 21, color: DARK_SUB,
  });
  s.addText("Official learner guide — Investec Systems Support (NQF Level 5) Learnership", {
    x: MX, y: 4.45, w: 10.5, h: 0.5, fontFace: BODY_FONT, fontSize: 16, color: DARK_LABEL,
  });
  addIcon(s, "shield", 10.75, 1.45, 1.9, "#" + DARK_LINE);
  s.addShape(pptx.ShapeType.line, { x: MX, y: 5.35, w: CW, h: 0, line: { color: DARK_LINE, width: 1 } });
  s.addText("Investec · Corporate Banking Technology · IT Systems Support NQF Level 5 (SAQA ID 48573)", {
    x: MX, y: H - 0.6, w: CW, h: 0.35, fontFace: BODY_FONT, fontSize: 11.5, color: DARK_MUTED,
  });
}

/* ============================================================ 2 · CONTENTS */
{
  const s = slide();
  eyebrowTitle(s, "Learner guide contents", "Competence Requirements");
  dataTable(s, ["Section", "What it covers"], [
    ["Introduction", "What ethics and professionalism mean for a computing professional in South Africa"],
    ["The CSSA Constitution", "How the Computer Society of South Africa — today the IITPSA — elevates ICT capability and professionalism"],
    ["The CSSA Code of Practice", "Competence, organisation & management, contracting, privacy & security, development, implementation and live systems"],
    ["Professional bodies", "CSSA, BITF, ITUC and ITA — who they are and what they do"],
    ["The Code of Ethics", "Equality of opportunity, and how the industry fights software piracy in South Africa"],
    ["Question Sessions 1 & 2", "Your knowledge of professionalism and ethics is assessed with typed answers"],
    ["Self-assessment", "Check the progress you have made and arrange support to become competent"],
  ], { y: 1.85, colW: [3.6, 8.63], fontSize: 15.5, rowH: 0.7 });
}

/* ============================================================ 3 · INTRODUCTION */
{
  const s = slide();
  eyebrowTitle(s, "Introduction", "Ethics & Professionalism for the Computer Industry");
  bigParas(s, [
    "Unit Standard 114055 — Demonstrate an awareness of ethics and professionalism for the computer industry in South Africa — is about knowing how a computing professional is expected to behave: the professional practices that are acceptable and unacceptable, the professional bodies that represent the industry, the codes of practice they publish, and the code of ethics that governs issues such as equality of opportunity and software piracy.",
    "The guide works through two big sections. First, Professionalism and Codes of Practice: the CSSA Constitution and its Code of Practice — competence, organisation and management, contracting, privacy and security, development, implementation and live systems — and the professional bodies CSSA, BITF, ITUC and ITA. Second, the Code of Ethics: equality of opportunity, and how the industry fights software piracy in South Africa.",
    "Read each section carefully. After the lesson, two Question Sessions assess your knowledge with typed answers, and a self-assessment checklist closes the unit.",
  ], { y: 1.85, fontSize: 17 });
}

/* ============================================================ 4 · CSSA CONSTITUTION */
{
  const s = slide();
  eyebrowTitle(s, "Professionalism & codes of practice", "The CSSA Constitution");
  bigParas(s, [
    "The Constitution is an important tool for the Information Society, guiding the way we operate. At the AGM on 22 July 2004 an amended version of the Constitution was adopted; the previous version had been registered in terms of the Companies Act in 1970, so it was updated to reflect today's environment.",
    "The Society (the Computer Society of South Africa) is established to elevate Information and Communications Technology (ICT) capability and professionalism in South Africa.",
  ], { y: 1.85, h: 2.4, fontSize: 17 });
  card(s, MX, 4.35, CW, 2.3, { fill: LIGHT });
  addIcon(s, "target", MX + 0.25, 4.6, 0.4);
  s.addText([
    { text: "PURPOSE\n", options: { bold: true, color: BLUE, fontSize: 12.5, charSpacing: 1.5 } },
    { text: "To elevate ICT capability and professionalism in South Africa — through the exchange of opinions and views on ICT, representing industry practitioners to inform and lobby Government on ICT policy, and promoting knowledge of ICT to members and the public.", options: { color: NAVY, fontSize: 16 } },
  ], { x: MX + 0.85, y: 4.55, w: CW - 1.15, h: 1.9, fontFace: BODY_FONT, valign: "middle", lineSpacingMultiple: 1.1 });
}

/* ============================================================ 5 · CSSA AIMS */
{
  const s = slide();
  eyebrowTitle(s, "Professionalism & codes of practice", "Aims of the Society");
  iconRows(s, [
    { icon: "people", d: "Facilitate the exchange of opinions and views on ICT, and inform and promote knowledge of ICT to members and the public for the development and use of ICT." },
    { icon: "scale", d: "By representing industry practitioners, inform and lobby Government on ICT policy." },
    { icon: "document", d: "Obtain information relating to ICT from members and other sources, and disseminate it amongst the public and the Society by means of journals, circulars, publications, lectures, seminars, conferences or otherwise." },
    { icon: "chart", d: "Improve the technical and general knowledge and elevate the professional status of persons engaged in ICT." },
    { icon: "book", d: "Education and training to elevate the level of ICT capability in South Africa." },
    { icon: "target", d: "Professional development and advancement." },
    { icon: "globe", d: "Community development that enhances the standards and levels of ICT for the greater good of the South African people." },
    { icon: "check", d: "Do all such other lawful things as are incidental or conducive to the attainment of the above purposes." },
  ], { y: 1.8, rowH: 0.62, fontSize: 13, iconSize: 0.34 });
}

/* ============================================================ 5b · CSSA TODAY — THE IITPSA */
{
  const s = slide();
  eyebrowTitle(s, "Professionalism & codes of practice", "CSSA Today — the IITPSA");
  bigParas(s, [
    "The Computer Society of South Africa (CSSA) is now known as the Institute of Information Technology Professionals South Africa (IITPSA). The legacy CSSA Code of Practice and professional conduct guidelines can now be found through the official IITPSA website (iitpsa.org.za).",
  ], { y: 1.75, h: 0.95, fontSize: 15 });
  s.addText([
    { text: "Read the Institute's current Constitution: ", options: { color: NAVY, fontSize: 13.5 } },
    { text: "www.iitpsa.org.za/constitution", options: { color: BLUE, fontSize: 13.5, bold: true, underline: true, hyperlink: { url: "https://www.iitpsa.org.za/constitution/", tooltip: "IITPSA Constitution" } } },
  ], { x: MX, y: 2.62, w: CW, h: 0.32, fontFace: BODY_FONT });
  s.addText("HOW TO JOIN", {
    x: MX, y: 3.0, w: CW, h: 0.3, fontFace: BODY_FONT, fontSize: 12.5, bold: true, color: BLUE, charSpacing: 1.5,
  });
  numberedActivity(s, [
    "Create a profile on the IITPSA Membership Portal.",
    "Choose your membership tier.",
    "Submit certified qualifications and a CV.",
    "Pay the relevant application and annual fees.",
  ], { y: 3.32, rowH: 0.52, fontSize: 14 });
  card(s, MX, 5.4, CW, 1.55, { fill: LIGHT });
  addIcon(s, "target", MX + 0.25, 5.62, 0.4);
  s.addText([
    { text: "WHY JOIN?\n", options: { bold: true, color: BLUE, fontSize: 12.5, charSpacing: 1.5 } },
    { text: "Professional recognition — the letters MIITPSA (Member), PMIITPSA® (Professional Member) or Pr.CIO® (Professional CIO) after your name identify you as belonging to a professional body · International recognition — grading and admission criteria are maintained in line with international practices · Networking — seminars, workshops, events and Special Interest Groups · Career advancement — companies increasingly recognise IITPSA membership as a prerequisite for promotion.", options: { color: NAVY, fontSize: 12.5 } },
  ], { x: MX + 0.85, y: 5.5, w: CW - 1.15, h: 1.38, fontFace: BODY_FONT, valign: "middle", lineSpacingMultiple: 1.08 });
}

/* ============================================================ 6 · CODE OF PRACTICE — WHAT IT IS */
{
  const s = slide();
  eyebrowTitle(s, "Professionalism & codes of practice", "The CSSA Code of Practice — What It Is");
  addIcon(s, "scale", W - MX - 1.0, 0.52, 0.95, "#" + BORDER);
  s.addText("Set out by the Computer Society of South Africa — one of, if not the most respected associations concerned with South African Information Technology.", {
    x: MX, y: 1.66, w: CW, h: 0.42, fontFace: BODY_FONT, fontSize: 15, color: GREY,
  });
  stackCards(s, [
    { icon: "document", t: "A series of statements", d: "The Code is directed to all professional members of the CSSA. It consists, essentially, of a series of statements that prescribe minimum standards of practice to be observed by members." },
    { icon: "people", t: "Professional responsibility", d: "All members have responsibilities — to clients, to users, to the State and to society at large. Members who are employees also have responsibilities to their employers and employers' customers and, often, to a Trade Union." },
    { icon: "compass", t: "When responsibilities clash", d: "In the event of an apparent clash in responsibilities, obligations or prescribed practice, the Society should be consulted at the earliest opportunity." },
  ], { y: 2.2, h: 4.45, fontSize: 14.5 });
}

/* ============================================================ 6b · CODE OF PRACTICE — HOW IT IS READ */
{
  const s = slide();
  eyebrowTitle(s, "Professionalism & codes of practice", "Reading the Code — As a Whole, In the Spirit, Two Levels");
  s.addText("Because CSSA membership covers all occupations relevant to the use of computers, the Code is set out in two levels:", {
    x: MX, y: 1.62, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: 14.5, color: GREY,
  });
  // ---- two-level graphic ----
  card(s, MX, 2.08, CW, 0.92, { fill: BLUE, line: BLUE });
  s.addShape(pptx.ShapeType.ellipse, { x: MX + 0.22, y: 2.29, w: 0.5, h: 0.5, fill: { color: WHITE } });
  s.addText("1", { x: MX + 0.22, y: 2.29, w: 0.5, h: 0.5, fontFace: TITLE_FONT, fontSize: 20, bold: true, color: BLUE, align: "center", valign: "middle" });
  s.addText([
    { text: "LEVEL ONE — the practice.  ", options: { bold: true, color: WHITE, fontSize: 15.5, fontFace: TITLE_FONT } },
    { text: "A series of brief statements defining the elements of practice to be observed.", options: { color: LIGHT, fontSize: 14 } },
  ], { x: MX + 0.9, y: 2.14, w: CW - 1.2, h: 0.8, fontFace: BODY_FONT, valign: "middle" });
  s.addShape(pptx.ShapeType.triangle, { x: W / 2 - 0.24, y: 3.06, w: 0.48, h: 0.26, fill: { color: BLUE }, flipV: true });
  card(s, MX, 3.38, CW, 0.92, { fill: LIGHT });
  s.addShape(pptx.ShapeType.ellipse, { x: MX + 0.22, y: 3.59, w: 0.5, h: 0.5, fill: { color: BLUE } });
  s.addText("2", { x: MX + 0.22, y: 3.59, w: 0.5, h: 0.5, fontFace: TITLE_FONT, fontSize: 20, bold: true, color: WHITE, align: "center", valign: "middle" });
  s.addText([
    { text: "LEVEL TWO — the rationale.  ", options: { bold: true, color: NAVY, fontSize: 15.5, fontFace: TITLE_FONT } },
    { text: "The reasoning behind each Level One statement, so every member can reach appropriate interpretations.", options: { color: NAVY, fontSize: 14 } },
  ], { x: MX + 0.9, y: 3.44, w: CW - 1.2, h: 0.8, fontFace: BODY_FONT, valign: "middle" });
  // ---- how to read it: two side-by-side cards ----
  const half = (CW - 0.3) / 2;
  card(s, MX, 4.62, half, 1.3, { fill: WHITE });
  addIcon(s, "eye", MX + 0.25, 4.85, 0.44);
  s.addText([
    { text: "Viewed as a whole\n", options: { bold: true, color: NAVY, fontSize: 15.5, fontFace: TITLE_FONT } },
    { text: "Individual parts are not to be used in isolation to justify errors of omission or commission.", options: { color: NAVY, fontSize: 13 } },
  ], { x: MX + 0.85, y: 4.74, w: half - 1.05, h: 1.06, fontFace: BODY_FONT, valign: "middle", lineSpacingMultiple: 1.06 });
  card(s, MX + half + 0.3, 4.62, half, 1.3, { fill: WHITE });
  addIcon(s, "shield", MX + half + 0.55, 4.85, 0.44);
  s.addText([
    { text: "Observed in the spirit\n", options: { bold: true, color: NAVY, fontSize: 15.5, fontFace: TITLE_FONT } },
    { text: "The Code is intended to be observed in the spirit — and not merely to the word.", options: { color: NAVY, fontSize: 13 } },
  ], { x: MX + half + 1.15, y: 4.74, w: half - 1.05, h: 1.06, fontFace: BODY_FONT, valign: "middle", lineSpacingMultiple: 1.06 });
  // ---- the obvious, overlooked ----
  card(s, MX, 6.12, CW, 0.78, { fill: LIGHT });
  addIcon(s, "warning", MX + 0.25, 6.31, 0.4);
  s.addText([
    { text: "Many clauses may seem to state the obvious — ", options: { color: NAVY, fontSize: 13.5 } },
    { text: "but much that goes wrong in computer use does so because the obvious has been overlooked.", options: { bold: true, color: NAVY, fontSize: 13.5 } },
  ], { x: MX + 0.85, y: 6.2, w: CW - 1.15, h: 0.62, fontFace: BODY_FONT, valign: "middle" });
}

/* ============================================================ 7 · COP 1 — PERSONAL COMPETENCE */
{
  const s = slide();
  eyebrowTitle(s, "Code of practice · 1 of 7", "Personal Competence & Keeping Up to Date");
  s.addText("In the practice of their profession, members will, to the extent that they are responsible:", {
    x: MX, y: 1.66, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: 15, color: GREY,
  });
  stackCards(s, [
    { icon: "book", t: "1.1 Keep informed", d: "Keep themselves, and subordinates, informed of new technologies, practices, legal requirements and standards relevant to their duties — you cannot retain professional standing by relying on the knowledge you had when you qualified." },
    { icon: "people", t: "1.2 Train on an equal opportunity basis", d: "Ensure subordinates are trained on an equal opportunity basis, in order to be effective in their duties and to qualify for increased responsibilities." },
    { icon: "check", t: "1.3 Accept only competent work", d: "Accept only such work as they believe they are competent to perform — always be aware of your own limitations and never knowingly imply competence you do not possess." },
    { icon: "chart", t: "1.4 Seek efficiency and effectiveness", d: "Actively seek opportunities for increasing efficiency and effectiveness to the benefit of the user and of the ultimate recipient." },
  ], { y: 2.15, h: 4.45, fontSize: 13.5 });
}

/* ============================================================ 8 · COP 2 — ORGANISATION & MANAGEMENT */
{
  const s = slide();
  eyebrowTitle(s, "Code of practice · 2 of 7", "Organisation & Management");
  s.addText("Computer management is still management — the normal principles applicable to any kind of management apply here also:", {
    x: MX, y: 1.66, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: 15, color: GREY,
  });
  stackCards(s, [
    { icon: "target", t: "2.1 Plan and review objectives", d: "Plan, establish and review objectives, tasks and organisational structures for themselves and subordinates — it is dangerously easy to become engrossed in the problem of the moment and lose sight of overall objectives." },
    { icon: "people", t: "2.2 Assign tasks by ability", d: "Ensure that specific tasks are assigned to individuals according to their known ability and competence — delegate work that develops competence and increases motivation." },
    { icon: "list", t: "2.3 Maintain channels of communication", d: "Establish and maintain channels of communication from and to seniors, equals and subordinates — good communication is vital and can be improved considerably by formal training." },
    { icon: "clock", t: "2.4 Be accountable", d: "Be accountable for the quality, timeliness and use of resources in the work for which they are responsible — provide a service of agreed quality, on time and within budget, and plan for contingencies." },
  ], { y: 2.15, h: 4.45, fontSize: 13.5 });
}

/* ============================================================ 9 · COP 3 — CONTRACTING */
{
  const s = slide();
  eyebrowTitle(s, "Code of practice · 3 of 7", "Contracting");
  s.addText("Some formal agreement — even if not a specific contract — is needed before any project is started. Commitment and definition of responsibilities are essential, in advance of action:", {
    x: MX, y: 1.66, w: CW, h: 0.5, fontFace: BODY_FONT, fontSize: 15, color: GREY,
  });
  stackCards(s, [
    { icon: "search", t: "3.1 Seek expert advice", d: "Seek expert advice in the preparation of any formal contract — just as you expect to be consulted in your field, be ready to consult other specialists for guidance on contracts, commerce, finance, tax, law or risk evaluation. A badly drawn-up contract or a wrong assessment of a legal situation carries real dangers; many professional bodies provide 'standard contract' forms to reduce problem areas." },
    { icon: "document", t: "3.2 Cover all requirements and responsibilities", d: "Ensure that all requirements and the practical responsibilities of all parties are adequately covered in any contract or tendering procedures — review the totality of the detail, taking care that items such as provision of accommodation, typing, data preparation, responsibility for media security and standby arrangements are not forgotten." },
  ], { y: 2.3, h: 4.3, fontSize: 15 });
}

/* ============================================================ 10 · COP 4 — PRIVACY & SECURITY (RISK) */
{
  const s = slide();
  eyebrowTitle(s, "Code of practice · 4 of 7", "Privacy, Security & Integrity — Evaluating Risk");
  bigParas(s, [
    "A system is at risk from the moment the project that develops it is first conceived, and the risk remains at least until after the system is finally discontinued. Threats to security range from incompetence, accident and carelessness to deliberate theft, fraud, espionage or malicious attack.",
    "Members must ascertain and evaluate all potential risks with regard to the cost, effectiveness and practicality of proposed levels of security (4.1) — deciding how much should be spent on security in four areas:",
  ], { y: 1.8, h: 2.1, fontSize: 15.5 });
  stackCards(s, [
    { icon: "shield", t: "Protection", d: "Preventing threats from becoming reality." },
    { icon: "eye", t: "Detection", d: "In time to take suppressive action." },
    { icon: "warning", t: "Suppression", d: "To limit the effect." },
    { icon: "wrench", t: "Recovery", d: "To rectify and get the system going." },
  ], { y: 3.95, h: 2.75, fontSize: 12.5 });
}

/* ============================================================ 11 · COP 4 — CLAUSES */
{
  const s = slide();
  eyebrowTitle(s, "Code of practice · 4 of 7", "Privacy, Security & Integrity — The Clauses");
  iconRows(s, [
    { icon: "shield", t: "4.2", d: "Recommend appropriate levels of security, commensurate with the anticipated risks and appropriate to the needs of the client — some areas of risk are mandatory, such as health and safety legislation." },
    { icon: "chart", t: "4.3", d: "Apply, monitor and report upon the effectiveness of the agreed levels of security — an ongoing security audit keeps people aware of requirements and identifies weaknesses and loopholes." },
    { icon: "people", t: "4.4", d: "Ensure that all staff are trained to take effective action to protect life, data and equipment (in that order) in the event of disaster — the safety of people comes first." },
    { icon: "lock", t: "4.5", d: "Take all reasonable measures to protect confidential information from inadvertent or deliberate improper access or use — your responsibility for confidentiality is at least as great as in other professions." },
    { icon: "check", t: "4.6", d: "Ensure that competent people are assigned responsibility for the accuracy and integrity of the data in data files and each part of an organisation's database." },
    { icon: "scale", t: "4.7", d: "Ensure that, where stored data may be dangerous to an individual, the individual has adequate rights of review, correction and appeal — for example credit information that is incorrect or disputed." },
  ], { y: 1.85, rowH: 0.82, fontSize: 13, iconSize: 0.36 });
}

/* ============================================================ 12 · COP 5 — DEVELOPMENT (1) */
{
  const s = slide();
  eyebrowTitle(s, "Code of practice · 5 of 7", "Development — Clauses 5.1 to 5.6");
  s.addText("'Development' means all the work involved to reach the stage where a viable computer system is ready to become operational, including installing the system in its eventual production environment.", {
    x: MX, y: 1.66, w: CW, h: 0.55, fontFace: BODY_FONT, fontSize: 14, color: GREY,
  });
  iconRows(s, [
    { icon: "scale", t: "5.1", d: "Exercise impartiality when evaluating each project with respect to its technical, moral and economic benefits — do not lose objectivity through enthusiasm for the latest technology." },
    { icon: "chart", t: "5.2", d: "Effectively plan, monitor, adjust and report on all development, acquisition or replacement projects." },
    { icon: "document", t: "5.3", d: "Ensure that effective standard procedures and documentation are available and used — standards should not cause inhibiting rigidity but provide a framework." },
    { icon: "target", t: "5.4", d: "Specify the system objectives, completion date, cost and security requirements for the client and the criteria for their achievement — and review objectives regularly on large projects." },
    { icon: "people", t: "5.5", d: "Ensure that the client can participate in all stages of problem analysis, system development and implementation — the system ultimately belongs to the client." },
    { icon: "check", t: "5.6", d: "Ensure that each task is completed to a defined level before the next dependent task is started — e.g. do not start writing a program before the specification is complete." },
  ], { y: 2.35, rowH: 0.72, fontSize: 13, iconSize: 0.34 });
}

/* ============================================================ 13 · COP 5 — DEVELOPMENT (2) */
{
  const s = slide();
  eyebrowTitle(s, "Code of practice · 5 of 7", "Development — Clauses 5.7 to 5.12");
  iconRows(s, [
    { icon: "search", t: "5.7", d: "Specify and conduct program tests and system tests to prove the system functions as intended — not merely to detect errors — with the client involved." },
    { icon: "book", t: "5.8", d: "Ensure that systems are designed and documented to facilitate subsequent audit, maintenance, enhancement and accurate comprehension by users." },
    { icon: "eye", t: "5.9", d: "Ensure that input and output are designed to obviate misunderstanding — avoid jargon, unfamiliar codes and abbreviations; use plain language." },
    { icon: "dismiss", t: "5.10", d: "Ensure adequate procedures exist to delete erroneous, redundant and out-of-date data from files." },
    { icon: "wrench", t: "5.11", d: "Ensure adequate procedures exist to restore data and program files after loss, corruption or system failure — designed in at the start, not after a disaster." },
    { icon: "check", t: "5.12", d: "Ensure that projects are completed with technical soundness, using the most appropriate technology, within time and cost constraints — the best technology for the client's problem, not necessarily the most sophisticated." },
  ], { y: 1.85, rowH: 0.82, fontSize: 13.5, iconSize: 0.36 });
}

/* ============================================================ 14 · COP 6 — IMPLEMENTATION */
{
  const s = slide();
  eyebrowTitle(s, "Code of practice · 6 of 7", "Implementation");
  s.addText("Implementation is the transition from development to full operation:", {
    x: MX, y: 1.66, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: 15, color: GREY,
  });
  stackCards(s, [
    { icon: "people", t: "6.1 Train users and operations staff", d: "Ensure adequate provision is made for user and operations staff training in all functions of the system for which they are responsible — the task is not complete until the system can be used effectively by the client's staff, and training in advance of implementation counters resistance to change." },
    { icon: "chart", t: "6.2 Plan the changeover", d: "Effectively plan, monitor, adjust and report upon all activities concerned with the changeover from development to operational running — all who are affected must be advised of changes and given the opportunity to comment." },
    { icon: "clock", t: "6.3 Complete expeditiously and economically", d: "Ensure expeditious and economic completion of implementation consistent with adequate testing and security — a professional judgement between under- and over-testing; if corners are cut, evaluate the likely effect and make it known." },
  ], { y: 2.15, h: 4.45, fontSize: 14 });
}

/* ============================================================ 15 · COP 7 — LIVE SYSTEMS */
{
  const s = slide();
  eyebrowTitle(s, "Code of practice · 7 of 7", "Live Systems");
  s.addText("Live Systems covers the ongoing operation of systems handed over by design and development staff:", {
    x: MX, y: 1.66, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: 15, color: GREY,
  });
  stackCards(s, [
    { icon: "chart", t: "7.1 Reliable processing within budget", d: "Plan and operate efficient and reliable processing within defined budgets — users depend on processing services just as they depend on the application software." },
    { icon: "eye", t: "7.2 Monitor performance and quality", d: "Monitor performance and quality and arrange regular reviews of the efficiency, effectiveness and security of live systems — check not only how well the system meets its original objectives, but how it has evolved with current business requirements." },
    { icon: "wrench", t: "7.3 Plan maintenance from the start", d: "Plan, from the start of a project, to provide adequate maintenance and enhancement support to live systems — much criticism of computer applications is traceable to their failure to respond to changing conditions." },
    { icon: "people", t: "7.4 Establish good liaison with users", d: "Establish good liaison with users and provide proper facilities for dealing with enquiries and day-to-day problems — maintain continuous formal and informal liaison, including channels for emergencies." },
  ], { y: 2.15, h: 4.45, fontSize: 13 });
}

/* ============================================================ 16 · BODIES — CSSA & ITUC */
{
  const s = slide();
  eyebrowTitle(s, "Professional bodies in South Africa", "CSSA & ITUC");
  stackCards(s, [
    { icon: "shield", t: "CSSA — The Computer Society of South Africa", d: "The body from which the Constitution and Code of Practice in this guide are directly derived: one of, if not the most respected associations concerned with South African Information Technology." },
    { icon: "globe", t: "ITUC — The International Trade Union Confederation", d: "The world's largest trade union federation, formed on 1 November 2006 out of the merger of the International Confederation of Free Trade Unions (ICFTU) and the World Confederation of Labour (WCL). It assists the South African IT market in trading internationally, empowering the market — especially its emerging sector." },
  ], { y: 1.85, h: 4.75, fontSize: 15.5 });
}

/* ============================================================ 17 · BODIES — BITF */
{
  const s = slide();
  eyebrowTitle(s, "Professional bodies in South Africa", "BITF — The Black Information Technology Forum");
  bigParas(s, [
    "The Black Information Technology Forum was launched in Cape Town in 1995 to propel black individuals into the mainstream of the ICT industry. A Gauteng branch formed in 1997 and the forum became a national organisation in 1998, with branches serving 2 400 members.",
    "It is the largest organisation representing the interests of black people in South Africa's ICT industry and has considerable credibility with government bodies.",
  ], { y: 1.85, h: 2.2, fontSize: 16 });
  s.addText("Its aims:", { x: MX, y: 4.0, w: CW, h: 0.4, fontFace: TITLE_FONT, fontSize: 17, bold: true, color: NAVY });
  iconRows(s, [
    { icon: "people", d: "Empower members with technical and business skills, and make members significant role players in the ICT sector." },
    { icon: "globe", d: "Improve access to technology for historically disadvantaged communities." },
    { icon: "scale", d: "Actively influence policy-making forums, and promote the status of historically disadvantaged individuals and communities in the ICT sector." },
    { icon: "chart", d: "Its two programmes develop skills, internships and experiential training, and promote governance and black economic empowerment (the ABC Programme)." },
  ], { y: 4.5, rowH: 0.6, fontSize: 13, iconSize: 0.32 });
}

/* ============================================================ 18 · BODIES — ITA */
{
  const s = slide();
  eyebrowTitle(s, "Professional bodies in South Africa", "ITA — The Information Technology Association");
  bigParas(s, [
    "The ITA is the official trade and employer body of the ICTe industry, striving to promote consistent standards of professionalism and service. Its purpose, per its Constitution, is to 'represent and promote the interests of its members, which shall be employers active in the Information Technology Sector.'",
    "Founded in 1934 (as the Transvaal Typewriter and Office Appliance Traders Association), it was renamed the ITA after the amalgamation of the Business Equipment Association and the Computer Services Association. Its primary business is to promote and represent the ICTe industry nationally and internationally, assemble and disseminate information, provide a networking and marketing platform, and encourage interest groups that influence standards, strategies and legislation.",
  ], { y: 1.85, h: 2.6, fontSize: 15 });
  s.addText("It operates through an Executive Council and three divisions:", { x: MX, y: 4.45, w: CW, h: 0.4, fontFace: TITLE_FONT, fontSize: 16, bold: true, color: NAVY });
  iconRows(s, [
    { icon: "people", t: "ITUC", d: "The Information Technology Users Council — guaranteeing the authenticity and credibility of examinations." },
    { icon: "briefcase", t: "ITARCS", d: "The Recruitment Consultancy Services Group — recruitment and contracting issues under the Labour Relations Act." },
    { icon: "document", t: "PAG", d: "The Payroll Authors Group — liaising with government so payroll software incorporates legislative changes." },
  ], { y: 4.95, rowH: 0.6, fontSize: 13, iconSize: 0.32 });
}

/* ============================================================ 19 · CODE OF ETHICS — MUSIC PIRACY */
{
  const s = slide();
  eyebrowTitle(s, "The code of ethics", "The Music Piracy Example");
  bigParas(s, [
    "'Piracy' is generally considered to include: (a) pirate recordings, where just the music is copied, usually by ordinary people on a not-for-profit basis; (b) counterfeiting, which copies the music and the packaging and attempts to pass the copy off as the real thing; (c) online piracy — the same, done via the internet; and (d) bootlegging — recording and trading a performance (usually a live concert) that has not been officially released.",
    "RIAA, the Recording Industry Association of America, claims the recording industry 'loses' around 4.2 billion US dollars to piracy each year — a figure reached by inferring that each pirate transaction represents a lost legitimate sale, which is overly simplistic. Even so, full-blown counterfeiting is both illegal and unethical, and we ought not to support it by buying cheap counterfeits at flea markets and from street traders.",
    "Some 'home pirates' see themselves as modern-day Robin Hoods — but the argument does not hold. In a free market the way to drive an overpriced product's price down is not to buy it; and if protest is really your goal, copying a friend's CD is not an effective protest. The ethical answer: if you really like the CD, buy a legitimate copy and discard the pirated one.",
  ], { y: 1.85, fontSize: 14.5 });
}

/* ============================================================ 20 · SOFTWARE PIRACY IN SA — SCALE */
{
  const s = slide();
  eyebrowTitle(s, "The code of ethics", "Software Piracy in South Africa — The Scale");
  bigParas(s, [
    "Half of the software in use in South Africa has been illegal — not paid for, or pirated. In the US about 30% of software is pirated, in the UK 35%, and in the rest of Africa the rate runs into the 90% range. BSA figures showed South Africa's rate rising to 49% (from 48%) even as the worldwide rate fell to 38% — a retail revenue loss to the local software industry of R580-million. 'For almost every copy of software sold, another is pirated or stolen,' said Microsoft South Africa's director of legalisation.",
    "The Business Software Alliance (BSA) — an anti-piracy umbrella body made up of large software companies — recovered R300 000 in out-of-court settlements and committed to prosecuting offenders to the full extent of the law. Illegal copying and distribution of software is the main obstacle to the growth of the software sector, with worldwide industry losses estimated at US$11-billion in 1998.",
  ], { y: 1.85, fontSize: 15.5 });
}

/* ============================================================ 21 · SOFTWARE PIRACY — IMPACT & LAW */
{
  const s = slide();
  eyebrowTitle(s, "The code of ethics", "Software Piracy — Jobs, Losses & the Law");
  bigParas(s, [
    "By 2006 about 36% of the software used by South African businesses was illegal, depriving more than 30 000 people of jobs in the multibillion-rand IT industry and representing at least R1,2bn in economic losses. 'Software piracy remains one of the major hurdles to realising the potential of the information economy in South Africa, on the continent and around the world,' said the BSA's local chairperson.",
    "Globally, piracy was most prevalent in Zimbabwe and Vietnam (90%); the African average topped 70%. BSA calculated that dropping the global piracy rate from 35% to 25% would create about 2,4 million new jobs and add $67bn in tax revenues worldwide.",
    "South African law does allow enforcement of copyright violation: the Intellectual Property Laws Amendment Act (effective 1 October 1997) brought South Africa closer to compliance with its World Trade Organisation TRIPS obligations, especially in protection for computer programs, compilations of data and databases, and audio-visual works.",
  ], { y: 1.85, fontSize: 15 });
}

/* ============================================================ 22 · FORMS OF SOFTWARE PIRACY */
{
  const s = slide();
  eyebrowTitle(s, "The code of ethics", "What Is Piracy? — The Forms of Software Piracy");
  s.addText("Software piracy is the failure to comply with software licence agreements. Piracy, in any form, is an unlawful action and offenders are liable to either civil or criminal prosecution. All software users and resellers must understand the different forms of software piracy in order to comply with the law and protect themselves and their business.", {
    x: MX, y: 1.66, w: CW, h: 0.85, fontFace: BODY_FONT, fontSize: 14.5, color: NAVY, lineSpacingMultiple: 1.1,
  });
  stackCards(s, [
    { icon: "people", t: "End User Copying", d: "A licensed software user passes their software on to friends, business colleagues and family to copy indiscriminately; or, with volume licences, users and businesses under-report the number of computers on which the software is installed." },
    { icon: "briefcase", t: "Reseller Copying", d: "Resellers pass their software on to their clients." },
    { icon: "dismiss", t: "Counterfeiting", d: "Criminals copy the software and collateral, such as manuals, and sell it as the original product." },
  ], { y: 2.65, h: 4.0, fontSize: 14 });
}

/* ============================================================ 23 · FIGHTING PIRACY */
{
  const s = slide();
  eyebrowTitle(s, "The code of ethics", "Fighting Piracy in South Africa");
  bigParas(s, [
    "bidorbuy, one of South Africa's largest online marketplaces, took a proactive stance against the selling of pirated goods online, declaring combating piracy a top priority. 'Piracy is nothing less than serious theft. It is a crime that impacts right across our society, from government to the retail sector and right down to the individual customer, who, in buying pirated goods, ends up with inferior products. The only winners are the criminals,' said its managing director.",
    "bidorbuy works closely with industry bodies and authorities: the South African Police Services (SAPS), the Southern African Federation Against Copyright Theft (SAFACT), the Business Software Alliance (BSA) and the Independent Communications Authority of South Africa (ICASA). SAFACT — the trade association representing the entertainment industry, which loses approximately R200 million per annum to piracy — entered an agreement with bidorbuy to fight the sale of pirated DVD movies and games online.",
    "Law enforcement has also cracked down on DVD piracy (which crippled sales of local films such as Mama Jack and the Oscar-winning Tsotsi), and music industry figures raided Johannesburg streets to wipe out pirated CDs.",
  ], { y: 1.85, fontSize: 14 });
}

/* ============================================================ 24 · HOW PIRACY IS ADDRESSED */
{
  const s = slide();
  eyebrowTitle(s, "The code of ethics", "How Piracy Is Addressed in South Africa");
  stackCards(s, [
    { icon: "scale", t: "Copyright legislation", d: "Copyright legislation and TRIPS compliance — the Intellectual Property Laws Amendment Act (effective 1 October 1997)." },
    { icon: "briefcase", t: "BSA prosecution and settlements", d: "The Business Software Alliance recovers losses through out-of-court settlements and prosecutes offenders to the full extent of the law." },
    { icon: "shield", t: "SAFACT and SAPS enforcement", d: "Enforcement raids and crackdowns on pirated DVDs, CDs and software by SAFACT, SAPS and industry bodies." },
    { icon: "globe", t: "Online marketplace policing", d: "Online marketplaces such as bidorbuy police their platforms with SAPS, SAFACT, the BSA and ICASA." },
    { icon: "people", t: "Public awareness", d: "Public awareness campaigns that software piracy is stealing — no more, no less." },
  ], { y: 1.85, h: 4.8, fontSize: 12.5 });
}

/* ============================================================ 25 · QUESTION SESSION 1 */
{
  const s = slide();
  eyebrowTitle(s, "Question session 1 · 45 minutes · Self & group", "Professionalism & Codes of Practice");
  numberedActivity(s, [
    "Identify and explain acceptable and unacceptable professional practices found in the computer industry",
    "Identify and explain the CSSA as a professional body in South Africa",
    "Identify and explain the BITF as a professional body in South Africa",
    "Identify and explain the ITUC as a professional body in South Africa",
    "Identify and explain the ITA as a professional body in South Africa (at least 2 points)",
    "Identify and explain the codes of practice for the IT industry in South Africa",
  ], { y: 1.85, rowH: 0.8, fontSize: 16.5 });
}

/* ============================================================ 26 · QUESTION SESSION 2 */
{
  const s = slide();
  eyebrowTitle(s, "Question session 2 · 45 minutes · Self & group", "Code of Ethics in the Computer Industry");
  numberedActivity(s, [
    "Explain how the computer industry supports equality of opportunity",
    "Explain how the computer industry is against computer software piracy",
    "Identify ways in which piracy is addressed in South Africa",
  ], { y: 2.1, rowH: 1.0, fontSize: 18 });
  card(s, MX, 5.5, CW, 1.2, { fill: LIGHT });
  addIcon(s, "pen", MX + 0.25, 5.85, 0.36);
  s.addText(
    "Project — Code of Ethics: Compile an ideal example of an ideal code of ethics derived from the current code of ethics followed within the South African IT industry. Attach your project to your logbook and mark it 114055.",
    { x: MX + 0.75, y: 5.62, w: CW - 1.05, h: 0.96, fontFace: BODY_FONT, fontSize: 14.5, color: NAVY, valign: "middle", lineSpacingMultiple: 1.1 }
  );
}

/* ============================================================ 27 · SELF-ASSESSMENT */
{
  const s = slide();
  eyebrowTitle(s, "Self-assessment", "Self-Assessment — Be Honest With Yourself");
  s.addText("Tick the box with a \u2713 or an \u2717 to indicate your response.", {
    x: MX, y: 1.55, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: 16, color: GREY,
  });
  const items = [
    "I am able to describe professionalism for the computer industry in South Africa.",
    "I am able to describe the codes of practice for professionalism in the IT industry in South Africa.",
    "I am able to describe the code of ethics in the computer industry in South Africa.",
  ];
  items.forEach((t, i) => {
    const cy = 2.25 + i * 0.95;
    s.addShape(pptx.ShapeType.roundRect, { x: MX, y: cy + 0.06, w: 0.42, h: 0.42, rectRadius: 0.07, fill: { color: WHITE }, line: { color: BLUE, width: 1.5 } });
    s.addText(t, { x: MX + 0.66, y: cy - 0.03, w: CW - 0.9, h: 0.62, fontFace: BODY_FONT, fontSize: 17, color: NAVY, valign: "middle" });
  });
  card(s, MX, 5.5, CW, 1.35, { fill: LIGHT });
  addIcon(s, "target", MX + 0.25, 5.85, 0.36);
  s.addText(
    "Think about any point you could not tick. Write it down as a goal, decide on a plan of action to achieve it, and review your goals regularly. Show your completed self-assessment to your facilitator and make the necessary arrangements to assist you to become competent in any area you could not tick.",
    { x: MX + 0.75, y: 5.62, w: CW - 1.05, h: 1.1, fontFace: BODY_FONT, fontSize: 14.5, color: NAVY, valign: "middle", lineSpacingMultiple: 1.1 }
  );
}

const OUT = "public/downloads/US-114055-Ethics-Professionalism.pptx";
await pptx.writeFile({ fileName: OUT });
console.log("Wrote", OUT, "with", pageNo, "slides");
