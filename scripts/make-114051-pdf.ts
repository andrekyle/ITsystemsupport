/*
 * Build the slide-deck PDF for "US 114051 — Conduct a technical
 * practitioners meeting" from the lesson content in src/data/content.ts.
 * One title page, a Specific Outcome banner page per lessonStart, and
 * text slides for each lesson's paragraphs and bullets.
 *
 * Run:  npx tsx scripts/make-114051-pdf.ts
 * Out:  public/downloads/US-114051-Technical-Practitioners-Meeting.pdf
 */
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { existsSync, mkdirSync, createWriteStream } from "node:fs";
import PDFDocument from "pdfkit";

import { CONTENT } from "../src/data/content";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_DIR = join(ROOT, "public", "downloads");
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
const OUT_PATH = join(OUT_DIR, "US-114051-Technical-Practitioners-Meeting.pdf");

const unit = CONTENT["114051"];
if (!unit || !unit.lesson?.length) {
  console.error("114051 lesson not found in src/data/content.ts");
  process.exit(1);
}

const PAGE_W = 842;
const PAGE_H = 595;
const MARGIN = 56;
const BODY_W = PAGE_W - MARGIN * 2;
const BLUE = "#1f6bd8";
const DARK = "#16202c";
const GREY = "#5b6b7c";

const doc = new PDFDocument({
  size: [PAGE_W, PAGE_H],
  margins: { top: 0, bottom: 0, left: 0, right: 0 },
  autoFirstPage: false,
  info: {
    Title: "US 114051 — Conduct a technical practitioners meeting",
    Author: "ITSS Learn",
    Subject: "NQF 5 · 4 credits — lesson slide deck",
  },
});
doc.pipe(createWriteStream(OUT_PATH));

let pageNo = 0;
function footer() {
  doc.rect(0, PAGE_H - 34, PAGE_W, 34).fill("#f2f6fb");
  doc
    .fillColor(GREY)
    .font("Helvetica")
    .fontSize(9)
    .text("ITSS Learn · US 114051 — Conduct a technical practitioners meeting · NQF 5 · 4 credits", MARGIN, PAGE_H - 24, {
      width: BODY_W - 60,
    });
  doc.text(String(pageNo), PAGE_W - MARGIN - 40, PAGE_H - 24, { width: 40, align: "right" });
}

function newPage(heading: string, cont = false): number {
  doc.addPage();
  pageNo++;
  doc.rect(0, 0, PAGE_W, 8).fill(BLUE);
  doc
    .fillColor(BLUE)
    .font("Helvetica-Bold")
    .fontSize(20)
    .text(heading + (cont ? " (continued)" : ""), MARGIN, 34, { width: BODY_W });
  const y = doc.y + 8;
  doc
    .moveTo(MARGIN, y)
    .lineTo(PAGE_W - MARGIN, y)
    .lineWidth(1)
    .strokeColor("#d4e0ee")
    .stroke();
  footer();
  return y + 14;
}

const MAX_Y = PAGE_H - 52;

function bannerPage(n: number, title: string) {
  doc.addPage();
  pageNo++;
  doc.rect(0, 0, PAGE_W, PAGE_H).fill(BLUE);
  doc.fillColor("#cfe0f7").font("Helvetica-Bold").fontSize(22).text(`Specific Outcome ${n}`, MARGIN, 200, { width: BODY_W, align: "center" });
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(30).text(title, MARGIN, 240, { width: BODY_W, align: "center" });
  doc.fillColor("#cfe0f7").font("Helvetica").fontSize(12).text("US 114051 — Conduct a technical practitioners meeting", MARGIN, PAGE_H - 70, { width: BODY_W, align: "center" });
}

function titlePage() {
  doc.addPage();
  pageNo++;
  doc.rect(0, 0, PAGE_W, PAGE_H).fill("#ffffff");
  doc.rect(0, 0, PAGE_W, 10).fill(BLUE);
  doc.rect(0, PAGE_H - 10, PAGE_W, 10).fill(BLUE);
  doc.fillColor(GREY).font("Helvetica-Bold").fontSize(16).text("ITSS Learn — National Certificate: IT Systems Support (SAQA 48573)", MARGIN, 150, { width: BODY_W, align: "center" });
  doc.fillColor(DARK).font("Helvetica-Bold").fontSize(34).text("Conduct a technical\npractitioners meeting", MARGIN, 210, { width: BODY_W, align: "center" });
  doc.fillColor(BLUE).font("Helvetica-Bold").fontSize(18).text("Unit Standard 114051 · NQF Level 5 · 4 Credits", MARGIN, 330, { width: BODY_W, align: "center" });
  doc.fillColor(GREY).font("Helvetica").fontSize(13).text("Meeting types · Leadership styles · Decision-making · Conventions\nPreparation · Chairing · Post-meeting follow-up", MARGIN, 380, { width: BODY_W, align: "center" });
}

type Item = { text: string; bullet: boolean };

function renderLesson(heading: string, items: Item[]) {
  let y = newPage(heading);
  for (const item of items) {
    const font = item.bullet ? "Helvetica" : "Helvetica";
    const size = 13;
    const indent = item.bullet ? 18 : 0;
    doc.font(font).fontSize(size);
    const h = doc.heightOfString(item.text, { width: BODY_W - indent, lineGap: 3 });
    if (y + h > MAX_Y) y = newPage(heading, true);
    if (item.bullet) {
      doc.circle(MARGIN + 5, y + 7, 2.4).fill(BLUE);
      doc.fillColor(DARK).text(item.text, MARGIN + indent, y, { width: BODY_W - indent, lineGap: 3 });
    } else {
      doc.fillColor(DARK).text(item.text, MARGIN, y, { width: BODY_W, lineGap: 3 });
    }
    y = doc.y + 10;
  }
}

titlePage();

for (const lesson of unit.lesson) {
  if (lesson.lessonStart) bannerPage(lesson.lessonStart.n, lesson.lessonStart.title);
  const items: Item[] = [];
  for (const p of lesson.paragraphs ?? []) items.push({ text: p, bullet: false });
  for (const b of (lesson as { bullets?: string[] }).bullets ?? []) items.push({ text: b, bullet: true });
  renderLesson(lesson.heading, items);
}

doc.end();
console.log(`Wrote ${OUT_PATH} (${pageNo} pages)`);
