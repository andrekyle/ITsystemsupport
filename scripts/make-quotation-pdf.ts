/*
 * Build a professionally formatted Quotation PDF for the ITSS Learn LMS
 * application — development, hosting/maintenance retainer, and optional
 * developer/content-creator day rate.
 *
 * Same minimal Microsoft Azure look used across this project's other
 * generated PDFs (Segoe UI, hairline rules, restrained Azure blue accents).
 *
 * NOTE: All names, company details and contact numbers below are
 * FICTITIOUS PLACEHOLDERS — replace the CLIENT / VENDOR constants with
 * your real details before sending this quotation.
 *
 * Run:  npx tsx scripts/make-quotation-pdf.ts
 * Out:  public/downloads/ITSS-Learn-Quotation.pdf
 */
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { existsSync, mkdirSync, createWriteStream } from "node:fs";
import PDFDocument from "pdfkit";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_DIR = join(ROOT, "public", "downloads");
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
const OUT_PATH = join(OUT_DIR, "ITSS-Learn-Quotation.pdf");

// ---------------------------------------------------------------- Placeholders
// Replace these with real details before sending.
const VENDOR = {
  name: "Placeholder Name Ndlovu",
  business: "PixelForge Digital Solutions (Pty) Ltd",
  regNo: "2026/000000/07",
  vat: "VAT4000000000",
  email: "quotes@pixelforgedigital.example",
  phone: "+27 82 000 0000",
  address: "12 Example Street, Johannesburg, 2000, South Africa",
};

const CLIENT = {
  name: "Placeholder Client Contact",
  business: "African Code Academy (Pty) Ltd",
  email: "info@africancodeacademy.example",
  phone: "+27 11 000 0000",
  address: "Client Address Line 1, City, Postal Code, South Africa",
};

const QUOTE_NO = "Q-2026-0091";
const QUOTE_DATE = "03 September 2026";
const VALID_UNTIL = "03 October 2026";

// ---------------------------------------------------------------- Fonts
const WIN_FONTS = "C:/Windows/Fonts";
const FONT_FILES = {
  regular: join(WIN_FONTS, "segoeui.ttf"),
  bold: join(WIN_FONTS, "segoeuib.ttf"),
  light: join(WIN_FONTS, "segoeuil.ttf"),
  semilight: join(WIN_FONTS, "segoeuisl.ttf"),
};
const HAS_SEGOE = Object.values(FONT_FILES).every((f) => existsSync(f));
const F_REGULAR = HAS_SEGOE ? "SegoeUI" : "Helvetica";
const F_BOLD = HAS_SEGOE ? "SegoeUI-Bold" : "Helvetica-Bold";
const F_LIGHT = HAS_SEGOE ? "SegoeUI-Light" : "Helvetica";
const F_SEMILIGHT = HAS_SEGOE ? "SegoeUI-Semilight" : "Helvetica";

// A4 portrait
const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN_X = 64;
const MARGIN_TOP = 76;
const MARGIN_BOTTOM = 72;

// ---------------------------------------------------------------- Colours
const AZURE_BLUE = "#0078D4";
const INK = "#201F1E";
const INK_SECONDARY = "#605E5C";
const RULE = "#EDEBE9";
const PANEL = "#F3F2F1";

const doc = new PDFDocument({
  size: [PAGE_W, PAGE_H],
  margins: { top: MARGIN_TOP, bottom: MARGIN_BOTTOM, left: MARGIN_X, right: MARGIN_X },
  autoFirstPage: false,
  bufferPages: true,
  info: {
    Title: `Quotation ${QUOTE_NO} — ITSS Learn LMS`,
    Author: VENDOR.business,
    Subject: "Quotation for development, hosting and support services",
    Keywords: "quotation, LMS, development, retainer, contract",
  },
});

if (HAS_SEGOE) {
  doc.registerFont("SegoeUI", FONT_FILES.regular);
  doc.registerFont("SegoeUI-Bold", FONT_FILES.bold);
  doc.registerFont("SegoeUI-Light", FONT_FILES.light);
  doc.registerFont("SegoeUI-Semilight", FONT_FILES.semilight);
}

doc.pipe(createWriteStream(OUT_PATH));

// ---------------------------------------------------------------- Helpers
function ensureRoom(minHeight: number) {
  const bottom = PAGE_H - MARGIN_BOTTOM;
  if (doc.y + minHeight > bottom) doc.addPage();
}

function heading(text: string, opts: { level?: 1 | 2 | 3; space?: number } = {}) {
  const { level = 2, space = 12 } = opts;
  const size = level === 1 ? 24 : level === 2 ? 15 : 11;
  ensureRoom(size + 20);
  if (level !== 1) doc.moveDown(space / 12);
  const font = level === 1 ? F_LIGHT : F_BOLD;
  doc
    .font(font)
    .fontSize(size)
    .fillColor(level === 1 ? INK : level === 2 ? AZURE_BLUE : INK)
    .text(text, { align: "left", lineGap: 0 });
  if (level <= 2) {
    const y = doc.y + 4;
    doc.save().moveTo(MARGIN_X, y).lineTo(PAGE_W - MARGIN_X, y).lineWidth(0.6).strokeColor(RULE).stroke().restore();
    doc.moveDown(0.8);
  } else {
    doc.moveDown(0.4);
  }
}

function eyebrow(text: string) {
  doc.font(F_BOLD).fontSize(9.5).fillColor(AZURE_BLUE).text(text, { characterSpacing: 1.4, lineGap: 0 });
  doc.moveDown(0.35);
}

function paragraph(text: string, opts: { muted?: boolean; size?: number; bold?: boolean } = {}) {
  const { muted = false, size = 10.5, bold = false } = opts;
  ensureRoom(size + 8);
  doc
    .font(bold ? F_BOLD : F_REGULAR)
    .fontSize(size)
    .fillColor(muted ? INK_SECONDARY : INK)
    .text(text, { align: "left", lineGap: 3.2, paragraphGap: 8 });
}

function bulletList(items: string[]) {
  const size = 10.5;
  const bulletX = MARGIN_X + 2;
  const textX = MARGIN_X + 16;
  const textWidth = PAGE_W - MARGIN_X - textX;
  for (const item of items) {
    ensureRoom(size + 8);
    const y = doc.y;
    doc.font(F_REGULAR).fontSize(size).fillColor(INK_SECONDARY).text("\u2022", bulletX, y, { lineBreak: false });
    doc.font(F_REGULAR).fontSize(size).fillColor(INK).text(item, textX, y, { width: textWidth, align: "left", lineGap: 3.2 });
    doc.moveDown(0.45);
  }
  doc.moveDown(0.2);
}

function pageFooter(pageNum: number, total: number) {
  const savedBottom = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;
  const y = PAGE_H - MARGIN_BOTTOM + 22;
  doc.save().moveTo(MARGIN_X, y - 8).lineTo(PAGE_W - MARGIN_X, y - 8).lineWidth(0.5).strokeColor(RULE).stroke().restore();
  doc
    .font(F_REGULAR)
    .fontSize(8.5)
    .fillColor(INK_SECONDARY)
    .text(`Quotation ${QUOTE_NO}`, MARGIN_X, y, { width: (PAGE_W - MARGIN_X * 2) / 2, align: "left", lineBreak: false });
  doc
    .font(F_REGULAR)
    .fontSize(8.5)
    .fillColor(INK_SECONDARY)
    .text(`Page ${pageNum} of ${total}`, PAGE_W / 2, y, { width: (PAGE_W - MARGIN_X * 2) / 2, align: "right", lineBreak: false });
  doc.page.margins.bottom = savedBottom;
}

// A simple 2-column info panel (label/value rows) inside a light grey box.
function infoPanel(title: string, rows: [string, string][], opts: { x?: number; width?: number } = {}) {
  const x = opts.x ?? MARGIN_X;
  const width = opts.width ?? PAGE_W - MARGIN_X * 2;
  const padding = 14;
  const rowHeight = 16;
  const titleHeight = 20;
  const boxHeight = titleHeight + rows.length * rowHeight + padding * 1.4;
  ensureRoom(boxHeight + 10);
  const top = doc.y;
  doc.save().rect(x, top, width, boxHeight).fill(PANEL).restore();
  let cy = top + padding * 0.7;
  doc.font(F_BOLD).fontSize(10).fillColor(AZURE_BLUE).text(title, x + padding, cy, { lineGap: 0 });
  cy += titleHeight;
  for (const [label, value] of rows) {
    doc.font(F_REGULAR).fontSize(9.5).fillColor(INK_SECONDARY).text(label, x + padding, cy, { width: width * 0.34, lineBreak: false });
    doc.font(F_BOLD).fontSize(9.5).fillColor(INK).text(value, x + padding + width * 0.34, cy, { width: width * 0.62 - padding, lineBreak: false });
    cy += rowHeight;
  }
  doc.y = top + boxHeight;
  doc.x = MARGIN_X;
  doc.moveDown(1);
}

// A simple line-item table.
function lineItemTable(
  header: string[],
  rows: string[][],
  colWidths: number[],
) {
  const size = 9.8;
  const rowPad = 8;
  const x0 = MARGIN_X;
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);

  function drawRow(cells: string[], opts: { bold?: boolean; color?: string; fill?: string } = {}) {
    const { bold = false, color = INK, fill } = opts;
    // measure max height needed
    let maxH = 0;
    const heights: number[] = [];
    cells.forEach((c, i) => {
      const h = doc.heightOfString(c, { width: colWidths[i] - 12, font: bold ? F_BOLD : F_REGULAR, fontSize: size, lineGap: 2 });
      heights.push(h);
      if (h > maxH) maxH = h;
    });
    const rowH = maxH + rowPad;
    ensureRoom(rowH + 4);
    const y = doc.y;
    if (fill) {
      doc.save().rect(x0, y, totalWidth, rowH).fill(fill).restore();
    }
    let cx = x0;
    cells.forEach((c, i) => {
      doc
        .font(bold ? F_BOLD : F_REGULAR)
        .fontSize(size)
        .fillColor(color)
        .text(c, cx + 6, y + rowPad / 2, { width: colWidths[i] - 12, align: i === cells.length - 1 ? "right" : "left", lineGap: 2 });
      cx += colWidths[i];
    });
    doc.y = y + rowH;
    doc.x = MARGIN_X;
  }

  drawRow(header, { bold: true, color: AZURE_BLUE, fill: PANEL });
  rows.forEach((r, idx) => drawRow(r, { fill: idx % 2 === 1 ? "#FAFAFA" : undefined }));
  const y = doc.y + 2;
  doc.save().moveTo(x0, y).lineTo(x0 + totalWidth, y).lineWidth(0.6).strokeColor(RULE).stroke().restore();
  doc.moveDown(0.8);
}

let pageNum = 0;
doc.on("pageAdded", () => {
  pageNum += 1;
});

// ================================================================== Cover / Header
doc.addPage();
doc.x = MARGIN_X;
doc.y = MARGIN_TOP;

eyebrow("QUOTATION");
doc
  .font(F_LIGHT)
  .fontSize(34)
  .fillColor(INK)
  .text("ITSS Learn — LMS Development, Hosting & Support", MARGIN_X, doc.y, { width: PAGE_W - MARGIN_X * 2, lineGap: 2 });

doc.moveDown(0.6);
doc
  .save()
  .moveTo(MARGIN_X, doc.y)
  .lineTo(MARGIN_X + 60, doc.y)
  .lineWidth(2)
  .strokeColor(AZURE_BLUE)
  .stroke()
  .restore();
doc.moveDown(1.2);

// Vendor / Client / Quote meta panels side by side
const halfWidth = (PAGE_W - MARGIN_X * 2 - 20) / 2;
const topY = doc.y;

doc.x = MARGIN_X;
doc.y = topY;
infoPanel(
  "FROM",
  [
    ["Business", VENDOR.business],
    ["Contact", VENDOR.name],
    ["Email", VENDOR.email],
    ["Phone", VENDOR.phone],
    ["Reg. No.", VENDOR.regNo],
    ["VAT No.", VENDOR.vat],
  ],
  { x: MARGIN_X, width: halfWidth },
);
const afterFrom = doc.y;

doc.x = MARGIN_X + halfWidth + 20;
doc.y = topY;
infoPanel(
  "TO",
  [
    ["Business", CLIENT.business],
    ["Contact", CLIENT.name],
    ["Email", CLIENT.email],
    ["Phone", CLIENT.phone],
    ["Quote No.", QUOTE_NO],
    ["Date", QUOTE_DATE],
  ],
  { x: MARGIN_X + halfWidth + 20, width: halfWidth },
);
doc.x = MARGIN_X;
doc.y = Math.max(afterFrom, doc.y);
doc.moveDown(0.4);

paragraph(
  `This quotation is valid until ${VALID_UNTIL} and sets out the pricing, scope and terms for the development, hosting/maintenance retainer, optional developer services, and contract terms for the ITSS Learn Learning Management System ("the App") supplied to ${CLIENT.business} ("the Client").`,
  { muted: true },
);

// ================================================================== 1. Development
heading("1. Once-off Development — Administrative Build", { level: 2 });
paragraph(
  "A once-off development fee to build the LMS application to the Client's administrative requirements (learner management, course administration, reporting and related back-office functionality).",
);
lineItemTable(
  ["Description", "Qty", "Rate (ZAR)", "Amount (ZAR)"],
  [
    [
      "LMS development to Client's administrative requirements (admin dashboards, learner/course management, reporting)",
      "1",
      "R 30 000.00",
      "R 30 000.00",
    ],
  ],
  [280, 40, 90, 91],
);
paragraph(
  "Payable once-off on commissioning of the administrative build. This fee is separate from the monthly application fee below and from any content/course development work.",
  { muted: true, size: 9.5 },
);

// ================================================================== 2. Monthly retainer
heading("2. Monthly Application Fee (Recurring)", { level: 2 });
lineItemTable(
  ["Description", "Frequency", "Rate (ZAR)", "Amount (ZAR)"],
  [
    ["ITSS Learn LMS application fee", "Monthly", "R 10 000.00", "R 10 000.00"],
    ["Annual total (12 months), paid in advance", "Annually", "\u2014", "R 120 000.00"],
  ],
  [280, 90, 90, 91],
);
bulletList([
  "The monthly application fee of R 10 000.00 (R 120 000.00 per annum) is payable annually in advance, before any new Client development request is performed.",
  "The monthly fee covers the ongoing operation, maintenance and support of the App only.",
  "The monthly fee EXCLUDES: domain registration/renewal fees, database hosting fees, and AI model/API usage fees. These are billed separately at cost, or may be paid for directly by the Client.",
  "New development requests raised by the Client outside of the agreed scope are quoted and invoiced separately, and are only carried out once the current annual application fee has been paid in full.",
]);

// ================================================================== 3. Delivery & timeline
heading("3. Delivery, Onboarding & Timeline", { level: 2 });
bulletList([
  "Delivery and onboarding of the App is scheduled for 25 September 2026.",
  "Recommended timeline: 4 months from onboarding to complete all training materials and administrative documentation, depending on the final number of courses the Client wishes to upload. This estimate should be re-confirmed once the course list is finalised.",
]);

// ================================================================== 4. Optional developer / content creator services
heading("4. Optional \u2014 Developer & Content Creator Services", { level: 2 });
paragraph(
  "In addition to the App itself, the Client has the option to engage the Developer directly for further development and content creation work on the following basis:",
);
lineItemTable(
  ["Service", "Basis", "Rate (ZAR)"],
  [
    ["Developer & content creator (ad hoc / project basis)", "Per day", "R 2 500.00 / day"],
    ["Developer & content creator (employed basis, from Sept 2026)", "4 days per week", "R 2 500.00 / day worked"],
  ],
  [230, 170, 100],
);
bulletList([
  "From September 2026, and separate to the annual application fee, the Client has the option to employ the Developer for content and other development work at R 2 500.00 per day, for 4 days per week.",
  "Of the 4 working days per week, 1 day is on-premises at the Client's offices; the remaining days may be performed remotely, unless otherwise agreed.",
  "This engagement is optional, invoiced separately from the App's monthly fee, and may be scaled up or down by mutual written agreement.",
]);

// ================================================================== 5. Contract term
heading("5. Contract Term & Renewal", { level: 2 });
bulletList([
  "This quotation, once accepted, forms the basis of a 3 (three) year service contract between the Vendor and the Client.",
  "The contract is renewed every 12 (twelve) months, subject to both parties confirming continuation in writing prior to each renewal date.",
  "Pricing may be reviewed and adjusted at each annual renewal, with any changes communicated to the Client in writing at least 30 days before the renewal date.",
]);

// ================================================================== 6. Summary of costs
heading("6. Summary of Costs", { level: 2 });
lineItemTable(
  ["Item", "Type", "Amount (ZAR)"],
  [
    ["Once-off development (administrative build)", "Once-off", "R 30 000.00"],
    ["Monthly application fee", "Recurring (paid annually in advance)", "R 10 000.00 / month"],
    ["Annual application fee total", "Recurring (paid annually in advance)", "R 120 000.00 / year"],
    ["Domain, database hosting & AI model fees", "Excluded \u2014 billed at cost", "At cost"],
    ["Developer & content creator (ad hoc)", "Optional, per day", "R 2 500.00 / day"],
    ["Developer & content creator (employed, 4 days/week)", "Optional, from Sept 2026", "R 2 500.00 / day worked"],
  ],
  [230, 190, 80],
);
paragraph(
  "All amounts are quoted in South African Rand (ZAR) and are exclusive of VAT unless the Vendor is a registered VAT vendor, in which case VAT will be added at the applicable rate and reflected on the corresponding tax invoice.",
  { muted: true, size: 9.5 },
);

// ================================================================== 7. Terms & acceptance
heading("7. Terms & Acceptance", { level: 2 });
bulletList([
  "This quotation is valid until " + VALID_UNTIL + " and is subject to the terms described above.",
  "Acceptance of this quotation constitutes agreement to the 3-year contract term described in Section 5.",
  "Any changes to scope, pricing or timelines must be agreed in writing by both parties.",
]);

doc.moveDown(1.2);
ensureRoom(140);
const sigTop = doc.y;
const sigWidth = (PAGE_W - MARGIN_X * 2 - 30) / 2;

doc.font(F_BOLD).fontSize(10).fillColor(INK).text("Accepted on behalf of the Vendor", MARGIN_X, sigTop);
doc.save().moveTo(MARGIN_X, sigTop + 46).lineTo(MARGIN_X + sigWidth, sigTop + 46).lineWidth(0.6).strokeColor(RULE).stroke().restore();
doc.font(F_REGULAR).fontSize(9.5).fillColor(INK_SECONDARY).text("Name: " + VENDOR.name, MARGIN_X, sigTop + 52);
doc.text("Date: _______________________", MARGIN_X, sigTop + 70);

const sigX2 = MARGIN_X + sigWidth + 30;
doc.font(F_BOLD).fontSize(10).fillColor(INK).text("Accepted on behalf of the Client", sigX2, sigTop);
doc.save().moveTo(sigX2, sigTop + 46).lineTo(sigX2 + sigWidth, sigTop + 46).lineWidth(0.6).strokeColor(RULE).stroke().restore();
doc.font(F_REGULAR).fontSize(9.5).fillColor(INK_SECONDARY).text("Name: " + CLIENT.name, sigX2, sigTop + 52);
doc.text("Date: _______________________", sigX2, sigTop + 70);

doc.x = MARGIN_X;
doc.y = sigTop + 100;

// ---------------------------------------------------------------- Footers
const range = doc.bufferedPageRange();
const total = range.count;
for (let i = 0; i < total; i++) {
  doc.switchToPage(i);
  pageFooter(i + 1, total);
}

doc.end();
doc.on("end", () => {
  console.log(`Quotation PDF written to ${OUT_PATH}`);
});
