/*
 * Build a printable PDF of the "HWSW2 — Hardware and Software: Illustrated
 * Slide Deck" lesson (src/data/content.ts). One PDF page per slide, using
 * the same figure image the app renders (public/HWSW/*.png).
 *
 * Run:  npx tsx scripts/make-hwsw2-pdf.ts
 * Out:  public/downloads/HWSW2-Illustrated-Slide-Deck.pdf
 */
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { existsSync, mkdirSync, createWriteStream } from "node:fs";
import PDFDocument from "pdfkit";
import sharp from "sharp";

import { CONTENT } from "../src/data/content";
import { HWSW_SLIDE_FIGURES } from "../src/data/hwswSlideFigures";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PUBLIC_DIR = join(ROOT, "public");
const OUT_DIR = join(PUBLIC_DIR, "downloads");
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
const OUT_PATH = join(OUT_DIR, "HWSW2-Illustrated-Slide-Deck.pdf");

const deck = CONTENT["HWSW2"];
if (!deck || !deck.lesson?.length) {
  console.error("HWSW2 lesson not found in src/data/content.ts");
  process.exit(1);
}

// Page geometry (landscape A4, matches a slide 4:3-ish feel)
const PAGE_W = 842; // pt
const PAGE_H = 595;
const MARGIN = 40;
const CONTENT_W = PAGE_W - MARGIN * 2;
const NAVY = "#0F2C4E";
const BLUE = "#0F6CBD";
const GREY = "#3F3F46";
const MUTED = "#6B7280";

const doc = new PDFDocument({
  size: [PAGE_W, PAGE_H],
  margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
  info: {
    Title: "Hardware and Software — Illustrated Slide Deck",
    Author: "ITSS Learn",
    Subject: "US ID 48573 · NQF 5 — companion visual lesson",
  },
});
doc.pipe(createWriteStream(OUT_PATH));

/** Resolve a figure id to an absolute filesystem path under /public. */
function figurePath(figId: string): string | null {
  const rec = HWSW_SLIDE_FIGURES[figId];
  if (!rec?.src) return null;
  // src is like "/HWSW/Motherboard%20Components.png" — decode & join.
  const rel = decodeURI(rec.src).replace(/^\/+/, "");
  const full = join(PUBLIC_DIR, rel);
  return existsSync(full) ? full : null;
}

/** Pre-resize + re-encode a figure so the embedded copy stays small.
 *  Returns a JPEG buffer bounded by 1400 px on the long edge. */
const figureCache = new Map<string, Buffer>();
async function loadFigureBuffer(file: string): Promise<Buffer | null> {
  const cached = figureCache.get(file);
  if (cached) return cached;
  try {
    const buf = await sharp(file)
      .resize({ width: 1400, height: 1400, fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 78, mozjpeg: true })
      .toBuffer();
    figureCache.set(file, buf);
    return buf;
  } catch {
    return null;
  }
}

async function main() {

// ---- Cover slide ------------------------------------------------------------
doc.rect(0, 0, PAGE_W, PAGE_H).fill(NAVY);
doc.fillColor("#FFFFFF");
doc.font("Helvetica-Bold").fontSize(11);
doc.text("ITSS Learn · System Support NQF 5", MARGIN, MARGIN, { width: CONTENT_W });
doc.moveDown(6);
doc.font("Helvetica-Bold").fontSize(34).fillColor("#FFFFFF");
doc.text("Hardware and Software", MARGIN, 200, { width: CONTENT_W });
doc.font("Helvetica-Bold").fontSize(24).fillColor("#8CC2F0");
doc.text("Illustrated Slide Deck", MARGIN, 250, { width: CONTENT_W });
doc.moveDown(2);
doc.font("Helvetica").fontSize(13).fillColor("#B9D6F2");
doc.text(
  "A companion visual lesson to HWSW — hardware first (motherboard → CPU → cooling → RAM → storage → GPU/AI → power → case & ports → peripherals → networking), then software (OS → applications → cloud, virtualisation, security and AI).",
  MARGIN,
  310,
  { width: CONTENT_W, align: "left", lineGap: 3 }
);
doc.fillColor("#6E93BC").fontSize(10);
doc.text(`${deck.lesson.length} slides · generated ${new Date().toISOString().slice(0, 10)}`, MARGIN, PAGE_H - MARGIN - 12, {
  width: CONTENT_W,
});

// ---- One page per slide -----------------------------------------------------
type Slide = {
  heading: string;
  paragraphs?: string[];
  figures?: { id: string; caption?: string }[];
};
const slides = deck.lesson as unknown as Slide[];

for (let i = 0; i < slides.length; i++) {
  const slide = slides[i];
  doc.addPage();
  const pageNum = i + 1;

  // Header band
  doc.rect(0, 0, PAGE_W, 70).fill(NAVY);
  doc.fillColor("#8CC2F0").font("Helvetica-Bold").fontSize(10);
  doc.text(`Slide ${pageNum} of ${slides.length}`, MARGIN, 20, { width: CONTENT_W });
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(18);
  doc.text(slide.heading ?? "", MARGIN, 36, { width: CONTENT_W, ellipsis: true, height: 28 });

  // Figure (if any)
  const fig = slide.figures?.[0];
  const figFile = fig ? figurePath(fig.id) : null;
  const figBuf = figFile ? await loadFigureBuffer(figFile) : null;

  const contentTop = 90;
  const textLeft = MARGIN;
  let textWidth = CONTENT_W;
  const bodyBottom = PAGE_H - MARGIN - 20; // leave room for footer

  if (figBuf) {
    // Two-column layout: image on the right, bullets on the left.
    const imgBoxW = Math.round(CONTENT_W * 0.5);
    const imgBoxH = bodyBottom - contentTop;
    const imgX = PAGE_W - MARGIN - imgBoxW;
    try {
      doc.image(figBuf, imgX, contentTop, {
        fit: [imgBoxW, imgBoxH],
        align: "center",
        valign: "center",
      });
    } catch {
      doc.fillColor(MUTED).font("Helvetica-Oblique").fontSize(10);
      doc.text(`[figure unavailable: ${fig!.id}]`, imgX, contentTop + imgBoxH / 2, { width: imgBoxW, align: "center" });
    }
    if (fig?.caption) {
      doc.fillColor(MUTED).font("Helvetica-Oblique").fontSize(9);
      doc.text(fig.caption, imgX, contentTop + imgBoxH + 2, { width: imgBoxW, align: "center" });
    }
    textWidth = imgX - MARGIN - 16;
  }

  // Body paragraphs / bullets
  doc.fillColor(GREY).font("Helvetica").fontSize(12);
  const paragraphs = slide.paragraphs ?? [];
  let y = contentTop;
  for (const p of paragraphs) {
    const isBullet = /^\s*[•\-\*]/.test(p);
    const text = p.replace(/^\s*[•\-\*]\s*/, "");
    const opts = { width: textWidth, lineGap: 3 };
    if (isBullet) {
      // hanging bullet
      doc.fillColor(BLUE).font("Helvetica-Bold").fontSize(12);
      doc.text("•", textLeft, y, { continued: false });
      doc.fillColor(GREY).font("Helvetica").fontSize(12);
      doc.text(text, textLeft + 14, y, { ...opts, width: textWidth - 14 });
    } else {
      doc.fillColor(GREY).font("Helvetica").fontSize(12);
      doc.text(text, textLeft, y, opts);
    }
    y = doc.y + 6;
    if (y > bodyBottom) break; // don't overflow — the figure is the anchor
  }

  // Footer
  doc.fillColor(MUTED).font("Helvetica").fontSize(9);
  doc.text("ITSS Learn · Hardware and Software — Illustrated Slide Deck", MARGIN, PAGE_H - MARGIN - 6, {
    width: CONTENT_W - 60,
  });
  doc.text(`${pageNum}`, PAGE_W - MARGIN - 40, PAGE_H - MARGIN - 6, { width: 40, align: "right" });
}

doc.end();
doc.on("finish", () => {
  console.log(`Wrote ${OUT_PATH}`);
});
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
