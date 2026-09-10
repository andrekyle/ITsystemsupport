/*
 * Renders the US 114051 group role-play — the technical practitioners meeting
 * played out scene by scene — as a print-ready A4 screenplay-style PDF.
 * The scenes are read straight from the app content (src/data/content.ts,
 * exercise id "rp114051"), so the PDF always matches what learners see.
 *
 * Run:  npx tsx scripts/make-114051-script-pdf.ts
 * Out:  public/downloads/US-114051-Meeting-Role-Play-Script.pdf
 */
import { mkdirSync, createWriteStream } from "node:fs";
import PDFDocument from "pdfkit";
import { CONTENT } from "../src/data/content";

const A4W = 595.28;
const A4H = 841.89;
const MARGIN = 54; // 0.75"
const CW = A4W - MARGIN * 2;

const NAVY = "#002050";
const BLUE = "#0F6CBD";
const INK = "#1F2430";
const GREY = "#5A6472";
const LIGHT = "#EAF4FF";
const BORDER = "#D5E3F2";

const TITLE_FONT = "Helvetica-Bold";
const BODY_FONT = "Helvetica";
const ITALIC_FONT = "Helvetica-Oblique";

const CAST: [string, string][] = [
  ["Role 1", "Chairperson"],
  ["Role 2", "Vice-chairperson & preparation officer"],
  ["Role 3", "Secretary (minute-taker)"],
  ["Role 4", "Treasurer"],
  ["Role 5", "Senior technician (technical report)"],
  ["Role 6", "Mover of the motion"],
  ["Role 7", "Seconder"],
  ["Role 8", "Objector & amendment proposer"],
  ["Role 9", "Point of order & questions"],
  ["Role 10", "Scrutineer (voting officer)"],
  ["Role 11", "Matters arising & report-back"],
  ["Role 12", "Timekeeper & meeting evaluator"],
];

const unit = CONTENT["114051"];
const ex = unit?.exercises?.find((e) => e.id === "rp114051");
if (!ex) {
  console.error("rp114051 exercise not found in CONTENT[\"114051\"]");
  process.exit(1);
}

mkdirSync("public/downloads", { recursive: true });
const OUT = "public/downloads/US-114051-Meeting-Role-Play-Script.pdf";
const doc = new PDFDocument({
  size: "A4",
  margins: { top: MARGIN, bottom: MARGIN + 14, left: MARGIN, right: MARGIN },
  info: {
    Title: "US 114051 — Group role-play: the meeting script, scene by scene",
    Author: "IT Systems Support — Learning Platform",
  },
});
doc.pipe(createWriteStream(OUT));

/** Footer on every page. */
let pageNo = 0;
function footer() {
  pageNo += 1;
  const px = doc.x;
  const py = doc.y;
  // writing below the bottom margin would trigger an auto page-break loop —
  // lift the margin while the footer is drawn
  const mb = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;
  const y = A4H - MARGIN + 6;
  doc.font(BODY_FONT).fontSize(8).fillColor(GREY);
  doc.text("US 114051 · Group role-play — meeting script", MARGIN, y, {
    width: CW / 2,
    align: "left",
    lineBreak: false,
  });
  doc.text(String(pageNo), MARGIN + CW / 2, y, { width: CW / 2, align: "right", lineBreak: false });
  // restore the content cursor — footer writes must not disturb the flow
  doc.page.margins.bottom = mb;
  doc.x = px;
  doc.y = py;
}
footer();
doc.on("pageAdded", footer);

/** Start a new page if fewer than `need` points remain. */
function ensure(need: number) {
  if (doc.y + need > A4H - MARGIN - 18) doc.addPage();
}

/* ---------- cover block ---------- */

doc.font(BODY_FONT).fontSize(9).fillColor(BLUE);
doc.text("US 114051 — CONDUCT A TECHNICAL PRACTITIONERS MEETING", { characterSpacing: 0.6 });
doc.moveDown(0.35);
doc.font(TITLE_FONT).fontSize(19).fillColor(NAVY);
doc.text("The meeting, scene by scene");
doc.moveDown(0.2);
doc.font(ITALIC_FONT).fontSize(11).fillColor(GREY);
doc.text("Group role-play script — Investec IT support team, monthly technical practitioners meeting");
doc.moveDown(0.5);
doc.font(BODY_FONT).fontSize(9.5).fillColor(INK);
doc.text(ex.task, { lineGap: 2 });
doc.moveDown(0.8);

/* scenario intro, agenda and ground rules from the app data */
const scenario = ex.scenario ?? [];
const agendaLines = scenario.filter((s) => /^\d+\.\s/.test(s));
const proseLines = scenario.filter((s) => !/^\d+\.\s/.test(s));

for (const p of proseLines.slice(0, 2)) {
  doc.font(BODY_FONT).fontSize(10).fillColor(INK);
  doc.text(p, { lineGap: 2.5 });
  doc.moveDown(0.5);
}

/* cast + agenda side by side */
ensure(230);
const colY = doc.y + 4;
const colW = (CW - 18) / 2;

function panel(x: number, title: string, rows: string[], w: number, labelW = 46): number {
  const padX = 12;
  const padY = 10;
  doc.font(TITLE_FONT).fontSize(8.5);
  const rowH = 13.2;
  const h = padY * 2 + 14 + rows.length * rowH;
  doc.save();
  doc.roundedRect(x, colY, w, h, 6).fillAndStroke(LIGHT, BORDER);
  doc.fillColor(BLUE).font(TITLE_FONT).fontSize(8.5);
  doc.text(title, x + padX, colY + padY, { width: w - padX * 2, characterSpacing: 0.5 });
  let y = colY + padY + 16;
  for (const r of rows) {
    const m = r.match(/^(Role \d+|\d+\.)\s*[—-]?\s*(.*)$/);
    doc.font(TITLE_FONT).fontSize(8.8).fillColor(NAVY);
    const label = m ? m[1] : "";
    if (label) doc.text(label, x + padX, y, { width: labelW - 2, lineBreak: false });
    doc.font(BODY_FONT).fontSize(8.8).fillColor(INK);
    doc.text(m ? m[2] : r, x + padX + (label ? labelW : 0), y, {
      width: w - padX * 2 - (label ? labelW : 0),
      height: rowH,
      ellipsis: true,
      lineBreak: false,
    });
    y += rowH;
  }
  doc.restore();
  return h;
}

const castRows = CAST.map(([a, b]) => `${a} — ${b}`);
// compact agenda labels for the fixed-height panel (full detail lives in the scenes)
const agendaRows = agendaLines.map((s) =>
  s
    .replace(/ — every member states.*$/, "")
    .replace(/\s*\(move, second.*\)$/, "")
    .replace("a round of introductions", "introductions")
);
const h1 = panel(MARGIN, "THE CAST — 12 ROLES, ONE EACH", castRows, colW);
const h2 = panel(MARGIN + colW + 18, "THE AGENDA — RUN IT IN THIS ORDER", agendaRows, colW, 20);
doc.y = colY + Math.max(h1, h2) + 14;
doc.x = MARGIN;

/* ground rules */
const ground = proseLines.find((s) => s.startsWith("Ground rules"));
if (ground) {
  ensure(60);
  doc.font(TITLE_FONT).fontSize(8.5).fillColor(BLUE);
  doc.text("GROUND RULES", { characterSpacing: 0.5 });
  doc.moveDown(0.2);
  doc.font(BODY_FONT).fontSize(9.5).fillColor(INK);
  const groundText = ground.replace(/^Ground rules for everyone:\s*/, "");
  doc.text(groundText.charAt(0).toUpperCase() + groundText.slice(1), { lineGap: 2.5 });
}

/* ---------- the scenes ---------- */

const CUE_RE = /^([A-Z][A-Z0-9 ()&\-'’.]{1,44}):\s*(.*)$/s;

for (const step of ex.steps) {
  const lines = step.split("\n").filter((l) => l.trim());
  const heading = lines[0];
  const rest = lines.slice(1);

  /* scene heading bar */
  ensure(96);
  doc.moveDown(1.1);
  const barY = doc.y;
  doc.save();
  doc.rect(MARGIN, barY, CW, 22).fill(NAVY);
  doc.fillColor("#FFFFFF").font(TITLE_FONT).fontSize(9.5);
  doc.text(heading, MARGIN + 10, barY + 6.5, {
    width: CW - 20,
    height: 12,
    ellipsis: true,
    lineBreak: false,
  });
  doc.restore();
  doc.y = barY + 30;
  doc.x = MARGIN;

  for (const line of rest) {
    /* stage directions — italic, indented, no cue */
    if (line.startsWith("(")) {
      ensure(34);
      doc.font(ITALIC_FONT).fontSize(9.3).fillColor(GREY);
      doc.text(line, MARGIN + 16, doc.y, { width: CW - 32, lineGap: 2.2 });
      doc.moveDown(0.45);
      continue;
    }
    const cue = line.match(CUE_RE);
    if (cue) {
      /* speaker cue + dialogue with hanging indent */
      ensure(40);
      const speaker = cue[1].trim();
      const speech = cue[2].trim();
      doc.font(TITLE_FONT).fontSize(9.6).fillColor(NAVY);
      doc.text(`${speaker}:`, MARGIN, doc.y, { width: CW, continued: true });
      doc.font(BODY_FONT).fontSize(9.6).fillColor(INK);
      doc.text(` ${speech}`, { width: CW, lineGap: 2.4 });
      doc.moveDown(0.5);
      continue;
    }
    /* debrief-style "Why X matters: ..." and any other prose */
    const why = line.match(/^([^:]{3,60}):\s*(.*)$/s);
    ensure(36);
    if (why) {
      doc.font(TITLE_FONT).fontSize(9.4).fillColor(BLUE);
      doc.text(`${why[1]}:`, MARGIN, doc.y, { width: CW, continued: true });
      doc.font(BODY_FONT).fontSize(9.4).fillColor(INK);
      doc.text(` ${why[2]}`, { width: CW, lineGap: 2.3 });
    } else {
      doc.font(BODY_FONT).fontSize(9.5).fillColor(INK);
      doc.text(line, { width: CW, lineGap: 2.3 });
    }
    doc.moveDown(0.45);
  }
}

doc.end();
console.log(`Wrote ${OUT}`);
