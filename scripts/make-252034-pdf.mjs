// PDF twin of the US 252034 PowerPoint deck for the in-app slide viewer.
// Mirrors scripts/make-252034-ppt.mjs slide-for-slide: title slide, navy
// lesson dividers, content slides (paragraphs/cards/example/bullets/tables
// with "(continued)" overflow) and the navy closing slide. One landscape
// 16:9 page per slide (960 x 540 pt). Content is read live from
// src/data/content.ts ("252034").
//
// LEARNER-FACING: quizzes are NOT rendered in this PDF — learners answer
// them inside the ITSS Learn app.
//
// DECK STANDARD: no content text below 18pt — fit is measured with
// doc.heightOfString before placing; content that doesn't fit continues on
// "(continued)" pages and tables split across pages with the header repeated.
// Only footer/page-number furniture may be smaller.
//
// Run: node scripts/make-252034-pdf.mjs
// Out: public/downloads/US-252034-Monitor-Evaluate-Performance.pdf
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { existsSync, mkdirSync, readFileSync, createWriteStream, statSync } from "node:fs";
import PDFDocument from "pdfkit";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_DIR = join(ROOT, "public", "downloads");
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
const OUT_PATH = join(OUT_DIR, "US-252034-Monitor-Evaluate-Performance.pdf");

/* ---------- Pull the "252034" unit straight out of src/data/content.ts ---------- */
function extractUnit(key) {
  const src = readFileSync(join(ROOT, "src/data/content.ts"), "utf8");
  const marker = `"${key}": {`;
  const at = src.indexOf(marker);
  if (at < 0) throw new Error(`Key ${key} not found in content.ts`);
  const start = at + marker.length - 1; // points at "{"
  let depth = 0;
  let i = start;
  let quote = null;
  while (i < src.length) {
    const ch = src[i];
    if (quote) {
      if (ch === "\\") i += 1;
      else if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
    } else if (ch === "{") {
      depth += 1;
    } else if (ch === "}") {
      depth -= 1;
      if (depth === 0) break;
    }
    i += 1;
  }
  const objText = src.slice(start, i + 1);
  return new Function(`return (${objText});`)();
}

const UNIT = extractUnit("252034");
if (!UNIT?.lesson?.length || !UNIT?.quiz?.length) throw new Error("252034 lesson/quiz missing");

/* ---------- Style constants (mirrors make-252034-ppt.mjs, 1 in = 72 pt) ---------- */
const IN = 72;
const BLUE = "#0F6CBD";
const NAVY = "#002050";
const LIGHT = "#EAF4FF";
const GREY = "#6B7280";
const WHITE = "#FFFFFF";
const BORDER = "#D5E3F2";
const DARK_LABEL = "#8CC2F0";
const DARK_SUB = "#B9D6F2";
const DARK_MUTED = "#6E93BC";

const HELV = "Helvetica";
const HELVB = "Helvetica-Bold";

const W = 13.33 * IN; // 960 pt
const H = 7.5 * IN;   // 540 pt
const MX = 0.55 * IN;
const CW = W - MX * 2;
const MAXY = 6.85 * IN; // content must end above the footer strip

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
  trend: '<path d="m3.5 17 5.5-5.5 3.5 3.5 7.5-7.5"/><path d="M15 7.5h5v5"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.3"/><path d="m15.5 15.5 5 5"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.3 4 5.2 4 8.5s-1.4 6.2-4 8.5c-2.6-2.3-4-5.2-4-8.5s1.4-6.2 4-8.5z"/>',
  design: '<circle cx="12" cy="12" r="8.5"/><path d="m14.8 9.2-1.7 4.5-4.5 1.7 1.7-4.5z"/>',
  dashboard: '<rect x="3.5" y="3.5" width="7.3" height="7.3" rx="1.2"/><rect x="13.2" y="3.5" width="7.3" height="7.3" rx="1.2"/><rect x="3.5" y="13.2" width="7.3" height="7.3" rx="1.2"/><rect x="13.2" y="13.2" width="7.3" height="7.3" rx="1.2"/>',
  layers: '<path d="M12 3.5l8.5 4.7L12 12.9 3.5 8.2z"/><path d="m3.5 12.4 8.5 4.7 8.5-4.7"/><path d="m3.5 16.3 8.5 4.7 8.5-4.7"/>',
  presenter: '<rect x="3.5" y="4" width="17" height="11" rx="1.5"/><path d="M12 15v3.5M8.5 21h7"/><path d="m8.5 8 2.5 2.5L15.5 6"/>',
};
const ICON_ALIASES = { checklist: "check", monitor: "presenter", clipboard: "document" };

/* ---------- document ---------- */
const doc = new PDFDocument({
  size: [W, H],
  margins: { top: 0, bottom: 0, left: 0, right: 0 },
  autoFirstPage: false,
  info: {
    Title: "US 252034 — Monitor and evaluate team members against performance standards",
    Author: "Andre Snell",
    Subject: "National Certificate: Generic Management · SAQA ID 59201 · NQF 5 · 8 credits",
  },
});
const stream = createWriteStream(OUT_PATH);
doc.pipe(stream);

/* ---------- icon renderer (strokes the same SVG primitives as the PPT) ---------- */
function attrsOf(str) {
  const o = {};
  for (const m of str.matchAll(/([\w-]+)="([^"]*)"/g)) o[m[1]] = m[2];
  return o;
}
function drawIcon(name, x, y, sizeIn = 0.34, color = BLUE, sw = 1.4) {
  const body = ICONS[name] ?? ICONS[ICON_ALIASES[name]] ?? ICONS.document;
  const k = (sizeIn * IN) / 24;
  doc.save();
  doc.translate(x, y).scale(k);
  doc.lineWidth(sw).strokeColor(color).lineCap("round").lineJoin("round");
  for (const m of body.matchAll(/<(circle|rect|path)([^/]*)\/>/g)) {
    const a = attrsOf(m[2]);
    if (m[1] === "circle") doc.circle(+a.cx, +a.cy, +a.r).stroke();
    else if (m[1] === "rect") doc.roundedRect(+a.x, +a.y, +a.width, +a.height, +(a.rx ?? 0)).stroke();
    else doc.path(a.d).stroke();
  }
  doc.restore();
}

/* ---------- rich text: **bold** markers become bold runs, never literal ** ---------- */
const plain = (t) => String(t).replace(/\*\*/g, "");

function lineGapFor(size) {
  return size * 0.16;
}
function textH(text, size, width, bold = false) {
  const useBold = bold || String(text).includes("**");
  doc.font(useBold ? HELVB : HELV).fontSize(size);
  return doc.heightOfString(plain(text), { width, lineGap: lineGapFor(size) });
}

/* ---------- keyword → icon picker for bullet-derived icon cards ---------- */
const ICON_RULES = [
  [/\bgoal|target|objectiv|standard|aim|expectation/i, "target"],
  [/\bteam|people|staff|member|colleague|group|stakeholder|employe/i, "people"],
  [/feedback|discuss|conversat|communicat|interview|meeting|talk|listen|agree/i, "chat"],
  [/measur|data|kpi|metric|result|trend|productiv|output|score|rating|quantit/i, "chart"],
  [/fair|legal|polic|compl(y|ian)|protect|confiden|right|ethic|disciplin/i, "shield"],
  [/check|verif|monitor|review|evaluat|assess|audit|inspect|observ/i, "check"],
  [/time|deadline|schedul|\bdate\b|frequen|weekly|monthly|quarter|annual/i, "clock"],
  [/document|record|report|form|written|write|plan|agreement|contract|minute/i, "document"],
  [/train|coach|develop|learn|skill|mentor|growth|improve/i, "book"],
  [/search|investigat|identif|find|analys|diagnos/i, "search"],
];
function pickIcon(text) {
  const t = plain(text);
  for (const [re, ic] of ICON_RULES) if (re.test(t)) return ic;
  return "check";
}

/* split text on word boundaries until every chunk satisfies fits(); keeps **bold** pairs balanced */
function splitTextToFit(text, fits) {
  if (fits(text)) return [text];
  const words = String(text).trim().split(/\s+/);
  if (words.length < 2) return [text];
  const mid = Math.ceil(words.length / 2);
  let a = words.slice(0, mid).join(" ");
  let b = words.slice(mid).join(" ");
  if ((a.match(/\*\*/g) || []).length % 2 === 1) {
    a += "**";
    b = "**" + b;
  }
  return [...splitTextToFit(a, fits), ...splitTextToFit(b, fits)];
}
function drawRuns(text, x, y, { width, size, color, align = "left", charSpacing = 0, forceBold = false } = {}) {
  const parts = String(text).split(/\*\*/).map((p, i) => ({ p, bold: forceBold || i % 2 === 1 })).filter((r) => r.p);
  if (!parts.length) return;
  const opts = { width, lineGap: lineGapFor(size), align, characterSpacing: charSpacing };
  parts.forEach((r, i) => {
    doc.font(r.bold ? HELVB : HELV).fontSize(size).fillColor(color);
    const o = { ...opts, continued: i < parts.length - 1 };
    if (i === 0) doc.text(r.p, x, y, o);
    else doc.text(r.p, o);
  });
}

/* ---------- slide chrome ---------- */
const FOOTER = "US 252034 · Monitor and evaluate team members against performance standards · NQF 5 · 8 credits";
let pageNo = 0;

function slide({ bg = WHITE } = {}) {
  doc.addPage();
  pageNo += 1;
  if (bg !== WHITE) doc.rect(0, 0, W, H).fill(bg);
  // navy divider/closing pages draw their own single attribution line
  if (pageNo > 1 && bg === WHITE) {
    doc.rect(0, 0, W, 0.09 * IN).fill(BLUE);
    doc.font(HELV).fontSize(12).fillColor(GREY);
    doc.text(FOOTER, MX, H - 0.42 * IN, { width: CW - 1 * IN, lineBreak: false });
    doc.text(String(pageNo), W - MX - 0.7 * IN, H - 0.42 * IN, { width: 0.7 * IN, align: "right", lineBreak: false });
  }
}
// Draws eyebrow + the (possibly wrapped) title at its MEASURED height and
// returns the y where content may start — content can never run into the title.
function eyebrowTitle(eyebrow, title) {
  doc.font(HELVB).fontSize(18).fillColor(BLUE);
  doc.text(String(eyebrow).toUpperCase(), MX, 0.24 * IN, { width: CW, characterSpacing: 2, lineBreak: false });
  const tw = CW - 1.45 * IN; // keep clear of the corner watermark
  doc.font(HELVB).fontSize(28);
  const th = doc.heightOfString(plain(title), { width: tw, lineGap: 2 });
  doc.fillColor(NAVY).text(plain(title), MX, 0.62 * IN, { width: tw, lineGap: 2 });
  return Math.max(0.62 * IN + th + 0.3 * IN, 1.32 * IN);
}
function cardShape(x, y, w, h, { fill = WHITE, line = BORDER } = {}) {
  const r = 0.09 * IN;
  // soft fake shadow
  doc.save().opacity(0.35).roundedRect(x + 1.5, y + 2.5, w, h, r).fill("#9AB4CC").restore();
  doc.roundedRect(x, y, w, h, r).fillAndStroke(fill, line);
}

/* ---------- Flow: writes blocks top-to-bottom, spilling onto continued pages ---------- */
class Flow {
  constructor(eyebrow, title, icon) {
    this.eyebrow = eyebrow;
    this.title = title;
    this.icon = icon;
    this.part = 0;
    this.newSlide();
  }
  newSlide() {
    this.part += 1;
    slide();
    // faint oversized corner watermark, clipped to the header band (never behind content)
    drawIcon(this.icon ?? "design", W - 2.0 * IN, -1.08 * IN, 2.35, "#E8F1FA", 1.1);
    doc.rect(0, 0, W, 0.09 * IN).fill(BLUE); // strip back over the bleed
    if (this.icon) drawIcon(this.icon, W - MX - 0.5 * IN, 0.3 * IN, 0.44);
    const eb = this.part === 1 ? this.eyebrow : `${this.eyebrow} \u00B7 Continued`;
    this.y = eyebrowTitle(eb, this.title);
    this.top = this.y; // measured title bottom + gap: content can never touch the title
  }
  ensure(h) {
    if (this.y + h > MAXY) this.newSlide();
  }
  gap(g = 0.12) {
    this.y = Math.min(this.y + g * IN, MAXY);
  }
  paragraph(text, { size = 18, color = GREY } = {}) {
    const h = textH(text, size, CW) + 0.06 * IN;
    this.ensure(Math.min(h, MAXY - this.top));
    drawRuns(text, MX, this.y, { width: CW, size, color });
    this.y += h + 0.08 * IN;
  }
  bullet(text, { size = 18 } = {}) {
    const tx = MX + 0.32 * IN;
    const tw = CW - 0.42 * IN;
    const h = textH(text, size, tw) + 0.05 * IN;
    this.ensure(h);
    // small azure dot glyph instead of a text bullet
    doc.circle(MX + 0.11 * IN, this.y + 0.155 * IN, 3.4).fill(BLUE);
    drawRuns(text, tx, this.y, { width: tw, size, color: NAVY });
    this.y += h + 0.07 * IN;
  }
  table(headers, rows) {
    // 18pt everywhere; heights come from doc.heightOfString. A table that
    // doesn't fit is SPLIT across pages with the header repeated — never shrunk.
    const nCols = headers.length;
    const size = 18;
    const colW = CW / nCols;
    const pad = 0.08 * IN;
    const cellH = (c) => textH(c, size, colW - pad * 2) + pad * 2;
    const headH = Math.max(0.52 * IN, ...headers.map(cellH));
    const rowHeights = rows.map((r) => Math.max(0.52 * IN, ...r.map(cellH)));

    const drawHeader = (ty) => {
      doc.rect(MX, ty, CW, headH).fill(BLUE);
      headers.forEach((hText, c) => {
        const th = textH(hText, size, colW - pad * 2);
        doc.font(HELVB).fontSize(size).fillColor(WHITE);
        doc.text(plain(hText), MX + c * colW + pad, ty + (headH - th) / 2, { width: colW - pad * 2, lineGap: lineGapFor(size) });
      });
    };

    let i = 0;
    while (i < rows.length) {
      if (this.y + headH + rowHeights[i] + 0.1 * IN > MAXY) this.newSlide();
      const startY = this.y;
      drawHeader(startY);
      let ty = startY + headH;
      const startIdx = i;
      while (i < rows.length && ty + rowHeights[i] <= MAXY) {
        const rh = rowHeights[i];
        if (i % 2) doc.rect(MX, ty, CW, rh).fill(LIGHT);
        rows[i].forEach((cText, c) => {
          const th = textH(cText, size, colW - pad * 2);
          doc.font(HELV).fontSize(size).fillColor(NAVY);
          doc.text(plain(cText), MX + c * colW + pad, ty + (rh - th) / 2, { width: colW - pad * 2, lineGap: lineGapFor(size) });
        });
        ty += rh;
        i += 1;
      }
      if (i === startIdx) throw new Error("Table row taller than a page at 18pt — content must be shortened");
      // grid lines for this chunk
      const total = ty - startY;
      doc.save().lineWidth(0.75).strokeColor(BORDER);
      let gy = startY;
      doc.moveTo(MX, gy).lineTo(MX + CW, gy).stroke();
      gy += headH;
      doc.moveTo(MX, gy).lineTo(MX + CW, gy).stroke();
      for (let r = startIdx; r < i; r += 1) {
        gy += rowHeights[r];
        doc.moveTo(MX, gy).lineTo(MX + CW, gy).stroke();
      }
      for (let c = 0; c <= nCols; c += 1) {
        const gx = MX + c * colW;
        doc.moveTo(gx, startY).lineTo(gx, startY + total).stroke();
      }
      doc.restore();
      this.y = ty + 0.16 * IN;
    }
  }
  cards(items) {
    const cols = 2;
    const gapX = 0.24 * IN;
    const cw = (CW - gapX) / cols;
    const titleW = cw - 0.95 * IN; // right of the icon
    const bodyW = cw - 0.32 * IN;
    const padTop = 0.16 * IN;
    const padBottom = 0.18 * IN;
    const titleRow = (it) => Math.max(textH(it.title, 18, titleW, true), 0.36 * IN);
    // a card body may use at most a whole (continued) page — split longer text
    // (0.72in budgets a two-line title row so a split chunk always fits)
    const maxBodyH = MAXY - this.top - padTop - 0.72 * IN - 0.1 * IN - padBottom - 0.1 * IN;
    const expanded = [];
    for (const it of items) {
      const chunks = splitTextToFit(it.text, (t) => textH(t, 18, bodyW) <= maxBodyH);
      chunks.forEach((c, k) => expanded.push({ ...it, text: c, title: k === 0 ? it.title : `${it.title} (continued)` }));
    }
    for (let i = 0; i < expanded.length; i += cols) {
      const pair = expanded.slice(i, i + cols);
      // measured: title row + measured body height + paddings; row takes the max
      const heights = pair.map((it) => padTop + titleRow(it) + 0.1 * IN + textH(it.text, 18, bodyW) + padBottom);
      const rowH = Math.max(...heights, 1.0 * IN);
      this.ensure(rowH + 0.06 * IN);
      pair.forEach((it, j) => {
        const cx = MX + j * (cw + gapX);
        cardShape(cx, this.y, cw, rowH);
        drawIcon(it.icon, cx + 0.16 * IN, this.y + 0.16 * IN, 0.34);
        const tRow = titleRow(it);
        drawRuns(it.title, cx + 0.6 * IN, this.y + padTop, { width: titleW + 0.14 * IN, size: 18, color: NAVY, forceBold: true });
        drawRuns(it.text, cx + 0.16 * IN, this.y + padTop + tRow + 0.1 * IN, { width: bodyW, size: 18, color: GREY });
      });
      this.y += rowH + 0.14 * IN;
    }
  }
  // short-bullet lists render as 2-column icon cards (keyword-picked icons)
  iconBullets(bullets) {
    const cols = 2;
    const gapX = 0.24 * IN;
    const cw = (CW - gapX) / cols;
    const textW = cw - 0.86 * IN;
    for (let i = 0; i < bullets.length; i += cols) {
      const pair = bullets.slice(i, i + cols);
      const heights = pair.map((b) => Math.max(0.34 * IN, textH(b, 18, textW)) + 0.32 * IN);
      const rowH = Math.max(...heights, 0.72 * IN);
      this.ensure(rowH + 0.06 * IN);
      pair.forEach((b, j) => {
        const cx = MX + j * (cw + gapX);
        cardShape(cx, this.y, cw, rowH);
        drawIcon(pickIcon(b), cx + 0.18 * IN, this.y + 0.17 * IN, 0.34);
        drawRuns(b, cx + 0.66 * IN, this.y + 0.16 * IN, { width: textW, size: 18, color: NAVY });
      });
      this.y += rowH + 0.14 * IN;
    }
  }
  example(ex) {
    const innerW = CW - 0.5 * IN;
    const titleH = textH("Example — " + ex.title, 18, innerW, true);
    const lineHs = ex.lines.map((l) => textH(l, 18, innerW - 0.4 * IN) + 0.04 * IN);
    const linesH = lineHs.reduce((a, b) => a + b, 0);
    const boxH = 0.18 * IN + titleH + 0.08 * IN + linesH + 0.18 * IN;
    this.ensure(boxH + 0.06 * IN);
    cardShape(MX, this.y, CW, boxH, { fill: LIGHT });
    drawRuns("Example — " + ex.title, MX + 0.25 * IN, this.y + 0.14 * IN, { width: innerW, size: 18, color: BLUE, forceBold: true });
    let ly = this.y + 0.16 * IN + titleH + 0.08 * IN;
    ex.lines.forEach((l, i) => {
      doc.circle(MX + 0.34 * IN, ly + 0.15 * IN, 3.2).fill(BLUE);
      drawRuns(l, MX + 0.52 * IN, ly, { width: innerW - 0.4 * IN, size: 18, color: NAVY });
      ly += lineHs[i];
    });
    this.y += boxH + 0.16 * IN;
  }
}

/* ---------- 1. Title slide ---------- */
{
  slide();
  doc.rect(0, 0, W, 0.12 * IN).fill(BLUE);
  const pillW = 7.7 * IN;
  const pillH = 0.62 * IN;
  doc.roundedRect(MX, 1.1 * IN, pillW, pillH, pillH / 2).fill(BLUE);
  doc.font(HELVB).fontSize(18).fillColor(WHITE);
  const pillText = "GENERIC MANAGEMENT · UNIT STANDARD 252034";
  const ptH = doc.heightOfString(pillText, { width: pillW });
  doc.text(pillText, MX, 1.1 * IN + (pillH - ptH) / 2, { width: pillW, align: "center", characterSpacing: 1 });
  doc.font(HELVB).fontSize(36).fillColor(NAVY);
  doc.text("US 252034 — Monitor and evaluate team members against performance standards", MX, 1.95 * IN, { width: 10.8 * IN, lineGap: 4 });
  doc.font(HELV).fontSize(18).fillColor(GREY);
  doc.text(
    "Formulate performance standards and monitoring systems, prepare for a performance review, and conduct the review interview — the complete lesson deck.",
    MX, 3.8 * IN, { width: 9.7 * IN, lineGap: 3 }
  );
  drawIcon("presenter", 11.0 * IN, 1.4 * IN, 1.8, BORDER);
  doc.save().lineWidth(1).strokeColor(BORDER).moveTo(MX, 4.62 * IN).lineTo(MX + CW, 4.62 * IN).stroke().restore();
  const meta = [
    ["NQF LEVEL", "Level 5"],
    ["CREDITS", "8 credits"],
    ["QUALIFICATION", "National Certificate: Generic Management"],
    ["SAQA ID", "59201"],
  ];
  meta.forEach(([k, v], i) => {
    const x = MX + i * (CW / 4);
    doc.font(HELVB).fontSize(18).fillColor(BLUE);
    doc.text(k, x, 4.88 * IN, { width: CW / 4 - 0.2 * IN, characterSpacing: 0.5, lineBreak: false });
    doc.font(HELV).fontSize(18).fillColor(NAVY);
    doc.text(v, x, 5.28 * IN, { width: CW / 4 - 0.2 * IN, lineGap: 2 });
  });
  doc.font(HELV).fontSize(15).fillColor(GREY);
  doc.text("ITSS Learn · Investec · Corporate Banking Technology", MX, H - 0.56 * IN, { width: CW, lineBreak: false });
}

/* ---------- 2. Lesson sections ---------- */
let currentLesson = 0;
for (const sec of UNIT.lesson) {
  if (sec.lessonStart) {
    currentLesson = sec.lessonStart.n;
    slide({ bg: NAVY });
    doc.rect(0, 0, W, 0.12 * IN).fill(BLUE);
    drawIcon(sec.icon ?? "book", MX, 1.2 * IN, 0.7, DARK_LABEL);
    doc.font(HELVB).fontSize(20).fillColor(DARK_LABEL);
    doc.text(`LESSON ${sec.lessonStart.n}`, MX, 2.16 * IN, { width: CW, characterSpacing: 3, lineBreak: false });
    doc.font(HELVB).fontSize(40).fillColor(WHITE);
    doc.text(plain(sec.lessonStart.title), MX, 2.76 * IN, { width: 11.4 * IN, lineGap: 5 });
    doc.font(HELV).fontSize(14).fillColor(DARK_MUTED);
    doc.text(FOOTER + " · ITSS Learn", MX, H - 0.56 * IN, { width: CW, lineBreak: false });
  }

  const eyebrow = currentLesson ? `Lesson ${currentLesson}` : "US 252034";
  const flow = new Flow(eyebrow, sec.heading, sec.icon);

  for (const p of sec.paragraphs ?? []) flow.paragraph(p);
  if (sec.cards?.length) {
    flow.gap(0.04);
    flow.cards(sec.cards);
  }
  if (sec.example) {
    flow.gap(0.04);
    flow.example(sec.example);
  }
  if (sec.bullets?.length) {
    flow.gap(0.04);
    const short = sec.bullets.length >= 2 && sec.bullets.every((b) => plain(b).length <= 140);
    if (short) flow.iconBullets(sec.bullets);
    else for (const b of sec.bullets) flow.bullet(b);
  }
  if (sec.table) {
    flow.gap(0.06);
    flow.table(sec.table.headers, sec.table.rows);
  }
}

/* ---------- 3. Closing slide ---------- */
{
  slide({ bg: NAVY });
  doc.rect(0, 0, W, 0.12 * IN).fill(BLUE);
  drawIcon("award", MX, 1.6 * IN, 0.7, DARK_LABEL);
  doc.font(HELVB).fontSize(36).fillColor(WHITE);
  doc.text("Plan. Coach. Appraise.", MX, 2.55 * IN, { width: CW, lineBreak: false });
  doc.font(HELV).fontSize(18).fillColor(DARK_SUB);
  doc.text(
    "You can now formulate performance standards, build a monitoring system, prepare for a review, and conduct a fair, constructive performance review interview. Complete the unit quiz and your Portfolio of Evidence assignment in ITSS Learn.",
    MX, 4.0 * IN, { width: 11.6 * IN, lineGap: 5 }
  );
  doc.font(HELV).fontSize(14).fillColor(DARK_MUTED);
  doc.text("US 252034 · National Certificate: Generic Management · SAQA ID 59201 · ITSS Learn", MX, H - 0.56 * IN, { width: CW, lineBreak: false });
}

doc.end();
stream.on("finish", () => {
  const size = statSync(OUT_PATH).size;
  console.log(`Wrote ${OUT_PATH}`);
  console.log(`Pages: ${pageNo}, Size: ${(size / 1024).toFixed(1)} KB`);
});
