/*
 * Build an image-only PDF of the "HWSW2 — Hardware and Software:
 * Illustrated Slide Deck". Every page is a single figure image filling the
 * page — no cover, headings, captions, labels or page numbers.
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

// Landscape A4 canvas. Pages are recreated to match each image's aspect ratio
// so the picture fills the sheet edge-to-edge without letterboxing.
const DEFAULT_PAGE_W = 842;
const DEFAULT_PAGE_H = 595;

const doc = new PDFDocument({
  size: [DEFAULT_PAGE_W, DEFAULT_PAGE_H],
  margins: { top: 0, bottom: 0, left: 0, right: 0 },
  autoFirstPage: false,
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
  const rel = decodeURI(rec.src).replace(/^\/+/, "");
  const full = join(PUBLIC_DIR, rel);
  return existsSync(full) ? full : null;
}

interface Rendered {
  buf: Buffer;
  width: number;
  height: number;
}

/** Resize + JPEG-encode a figure so the embedded copy stays small. */
const figureCache = new Map<string, Rendered>();
async function loadFigure(file: string): Promise<Rendered | null> {
  const cached = figureCache.get(file);
  if (cached) return cached;
  try {
    const pipeline = sharp(file)
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 82, mozjpeg: true });
    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
    const out: Rendered = { buf: data, width: info.width, height: info.height };
    figureCache.set(file, out);
    return out;
  } catch {
    return null;
  }
}

async function main() {
  type Slide = { figures?: { id: string; caption?: string }[] };
  const slides = deck.lesson as unknown as Slide[];

  // Collect every figure referenced by the deck, in slide order, de-duplicated
  // so the same infographic isn't repeated across pages.
  const figureIds: string[] = [];
  const seen = new Set<string>();
  for (const slide of slides) {
    for (const fig of slide.figures ?? []) {
      if (fig?.id && !seen.has(fig.id)) {
        seen.add(fig.id);
        figureIds.push(fig.id);
      }
    }
  }

  let pageCount = 0;
  for (const id of figureIds) {
    const file = figurePath(id);
    if (!file) continue;
    const rendered = await loadFigure(file);
    if (!rendered) continue;

    // Size each page to the image's aspect ratio, capped at the default
    // landscape footprint so PDF readers open at a sensible zoom.
    const landscape = rendered.width >= rendered.height;
    const maxW = landscape ? DEFAULT_PAGE_W : DEFAULT_PAGE_H;
    const maxH = landscape ? DEFAULT_PAGE_H : DEFAULT_PAGE_W;
    const scale = Math.min(maxW / rendered.width, maxH / rendered.height);
    const pageW = Math.round(rendered.width * scale);
    const pageH = Math.round(rendered.height * scale);

    doc.addPage({ size: [pageW, pageH], margin: 0 });
    doc.image(rendered.buf, 0, 0, { width: pageW, height: pageH });
    pageCount++;
  }

  doc.end();
  doc.on("finish", () => {
    console.log(`Wrote ${OUT_PATH} (${pageCount} pages)`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
