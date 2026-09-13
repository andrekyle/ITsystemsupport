// Generates the US 252034 deck ("Monitor and evaluate team members against
// performance standards") in the Microsoft Fluent / Learn style — same styling
// as the US 114051 / 114050 decks. Content is read live from src/data/content.ts
// (key "252034"): lesson sections only. Quizzes are NOT rendered in the deck —
// learners answer them inside the ITSS Learn app.
// DECK STANDARD: no content text below 18pt — long content is never shrunk,
// it continues onto "(continued)" slides (tables split with repeated headers).
// Only footer/page-number furniture may be smaller.
// Run: node scripts/make-252034-ppt.mjs
// Out: public/downloads/US-252034-Monitor-Evaluate-Performance.pptx
import pptxgen from "pptxgenjs";
import { mkdirSync, readFileSync } from "node:fs";

/* ---------- Pull the "252034" unit straight out of src/data/content.ts ---------- */
function extractUnit(key) {
  const src = readFileSync("src/data/content.ts", "utf8");
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

/* ---------- Style constants (identical to make-114051-ppt.mjs) ---------- */
const BLUE = "0F6CBD";
const NAVY = "002050";
const LIGHT = "EAF4FF";
const GREY = "6B7280";
const WHITE = "FFFFFF";
const BORDER = "D5E3F2";
const DARK_LABEL = "8CC2F0";
const DARK_SUB = "B9D6F2";
const DARK_MUTED = "6E93BC";

const TITLE_FONT = "Aptos Display";
const BODY_FONT = "Aptos";

const W = 13.33;
const H = 7.5;
const MX = 0.55;
const CW = W - MX * 2;
const MAXY = 6.85; // content must end above the footer strip

const SHADOW = { type: "outer", angle: 90, blur: 7, offset: 2, color: "9AB4CC", opacity: 0.3 };

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
// content.ts icon names not present in the reference icon set
const ICON_ALIASES = { checklist: "check", monitor: "presenter", clipboard: "document" };

function iconUri(name, color = "#" + BLUE, sw = 1.4) {
  const body = ICONS[name] ?? ICONS[ICON_ALIASES[name]] ?? ICONS.document;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  return "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
}

/* ---------- Rich text: turn **bold** markers into pptxgenjs runs ---------- */
function runs(text, base = {}) {
  const out = [];
  const parts = String(text).split(/\*\*/);
  parts.forEach((p, i) => {
    if (!p) return;
    out.push({ text: p, options: { ...base, bold: i % 2 === 1 ? true : base.bold ?? false } });
  });
  return out.length ? out : [{ text: "", options: base }];
}
const plain = (t) => String(t).replace(/\*\*/g, "");

/* ---------- conservative height estimation (never under-estimates) ---------- */
function linesFor(text, fontSize, widthIn, bold = false) {
  // deliberately pessimistic chars-per-line so boxes are always tall enough
  const cpl = Math.max(8, Math.floor((widthIn * 72) / (fontSize * (bold ? 0.6 : 0.58))));
  const words = plain(text).split(/\s+/);
  let lines = 1;
  let len = 0;
  for (const w of words) {
    if (len + w.length + 1 > cpl) {
      lines += 1;
      len = w.length;
    } else len += w.length + 1;
  }
  return lines;
}
const textH = (text, fontSize, widthIn, lineMult = 1.35, bold = false) =>
  (linesFor(text, fontSize, widthIn, bold) * fontSize * lineMult) / 72;

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

/* ---------- deck ---------- */
const FOOTER = "US 252034 · Monitor and evaluate team members against performance standards · NQF 5 · 8 credits";
const pptx = new pptxgen();
pptx.defineLayout({ name: "WIDE", width: W, height: H });
pptx.layout = "WIDE";
pptx.author = "Andre Snell";
pptx.company = "Investec — Corporate Banking Technology";
pptx.title = "US 252034 — Monitor and evaluate team members against performance standards";

let pageNo = 0;
function slide() {
  const s = pptx.addSlide();
  s.background = { color: WHITE };
  pageNo += 1;
  if (pageNo > 1) {
    s.addText(FOOTER, { x: MX, y: H - 0.46, w: CW - 1, h: 0.34, fontFace: BODY_FONT, fontSize: 12, color: GREY });
    s.addText(String(pageNo), { x: W - MX - 0.7, y: H - 0.46, w: 0.7, h: 0.34, fontFace: BODY_FONT, fontSize: 12, color: GREY, align: "right" });
    s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.09, fill: { color: BLUE } });
  }
  return s;
}
function addIcon(s, name, x, y, size = 0.34, color, sw) {
  s.addImage({ data: iconUri(name, color, sw), x, y, w: size, h: size });
}
// Draws eyebrow + the (possibly wrapped) title at its MEASURED height and
// returns the y where content may start — content can never run into the title.
function eyebrowTitle(s, eyebrow, title) {
  s.addText(String(eyebrow).toUpperCase(), { x: MX, y: 0.22, w: CW, h: 0.36, fontFace: BODY_FONT, fontSize: 18, bold: true, color: BLUE, charSpacing: 2 });
  const tw = CW - 1.45; // keep clear of the corner watermark
  const th = Math.max(0.5, textH(title, 28, tw, 1.15, true));
  s.addText(runs(title, { color: NAVY, bold: true }), {
    x: MX, y: 0.58, w: tw, h: th + 0.12, fontFace: TITLE_FONT, fontSize: 28, valign: "top", lineSpacingMultiple: 1.05, fit: "none",
  });
  return Math.max(0.58 + th + 0.3, 1.32);
}
function cardShape(s, x, y, w, h, { fill = WHITE, line = BORDER } = {}) {
  s.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.09, fill: { color: fill }, line: { color: line, width: 1 }, shadow: { ...SHADOW } });
}

/* Flow: writes blocks top-to-bottom, spilling onto continued slides. */
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
    this.s = slide();
    // faint oversized corner watermark, clipped to the header band (never behind content)
    addIcon(this.s, this.icon ?? "design", W - 2.0, -1.08, 2.35, "#E8F1FA", 1.1);
    this.s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.09, fill: { color: BLUE } }); // strip back over the bleed
    if (this.icon) addIcon(this.s, this.icon, W - MX - 0.5, 0.3, 0.44);
    const eb = this.part === 1 ? this.eyebrow : `${this.eyebrow} \u00B7 Continued`;
    this.y = eyebrowTitle(this.s, eb, this.title);
    this.top = this.y; // measured title bottom + gap: content can never touch the title
  }
  ensure(h) {
    if (this.y + h > MAXY) this.newSlide();
  }
  gap(g = 0.12) {
    this.y = Math.min(this.y + g, MAXY);
  }
  paragraph(text, { fontSize = 18, color = GREY } = {}) {
    const h = textH(text, fontSize, CW) + 0.06;
    this.ensure(Math.min(h, MAXY - this.top));
    this.s.addText(runs(text, { color }), {
      x: MX, y: this.y, w: CW, h, fontFace: BODY_FONT, fontSize, valign: "top", lineSpacingMultiple: 1.12, fit: "none",
    });
    this.y += h + 0.08;
  }
  bullet(text, { fontSize = 18 } = {}) {
    const tw = CW - 0.42;
    const h = textH(text, fontSize, tw) + 0.05;
    this.ensure(h);
    // small azure dot glyph instead of a text bullet
    this.s.addShape(pptx.ShapeType.ellipse, { x: MX + 0.06, y: this.y + 0.12, w: 0.1, h: 0.1, fill: { color: BLUE } });
    this.s.addText(runs(text, { color: NAVY }), {
      x: MX + 0.32, y: this.y, w: tw, h, fontFace: BODY_FONT, fontSize, valign: "top", lineSpacingMultiple: 1.12, fit: "none",
    });
    this.y += h + 0.07;
  }
  table(headers, rows) {
    // 18pt everywhere; a table that doesn't fit is SPLIT across slides with the
    // header row repeated — the font is never shrunk to force a fit.
    const nCols = headers.length;
    const fontSize = 18;
    const colWIn = CW / nCols;
    const cellH = (c) => Math.max(0.52, textH(c, fontSize, colWIn - 0.24) + 0.18);
    const headH = Math.max(0.52, ...headers.map(cellH));
    const rowHeights = rows.map((r) => Math.max(...r.map(cellH)));
    const headerCells = headers.map((t) => ({ text: plain(t), options: { bold: true, color: WHITE, fill: { color: BLUE }, fontFace: TITLE_FONT, fontSize } }));
    let i = 0;
    while (i < rows.length) {
      if (this.y + headH + rowHeights[i] + 0.1 > MAXY) this.newSlide();
      const startIdx = i;
      const chunkHs = [];
      let used = headH;
      while (i < rows.length && this.y + used + rowHeights[i] + 0.1 <= MAXY) {
        chunkHs.push(rowHeights[i]);
        used += rowHeights[i];
        i += 1;
      }
      if (!chunkHs.length) {
        // single oversized row: place alone on its own fresh slide
        chunkHs.push(rowHeights[i]);
        used += rowHeights[i];
        i += 1;
      }
      const chunk = rows.slice(startIdx, i);
      const tableRows = [
        headerCells,
        ...chunk.map((r, ri) =>
          r.map((c) => ({ text: plain(c), options: { color: NAVY, fill: { color: (startIdx + ri) % 2 ? LIGHT : WHITE }, fontFace: BODY_FONT, fontSize } }))
        ),
      ];
      this.s.addTable(tableRows, {
        x: MX, y: this.y, w: CW, border: { type: "solid", color: BORDER, pt: 0.75 },
        rowH: [headH, ...chunkHs], valign: "middle", margin: 0.08, autoPage: false,
      });
      this.y += used + 0.16;
    }
  }
  cards(items) {
    const cols = 2;
    const gapX = 0.24;
    const cw = (CW - gapX) / cols;
    const titleW = cw - 0.95; // right of the icon
    const bodyW = cw - 0.32;
    const padTop = 0.16;
    const padBottom = 0.18;
    const titleRow = (it) => Math.max(textH(it.title, 18, titleW, 1.2, true), 0.36);
    // a card body may use at most a whole (continued) slide — split longer text
    // (0.72 budgets a two-line title row so a split chunk always fits)
    const maxBodyH = MAXY - this.top - padTop - 0.72 - 0.1 - padBottom - 0.1;
    const expanded = [];
    for (const it of items) {
      const chunks = splitTextToFit(it.text, (t) => textH(t, 18, bodyW) <= maxBodyH);
      chunks.forEach((c, k) => expanded.push({ ...it, text: c, title: k === 0 ? it.title : `${it.title} (continued)` }));
    }
    for (let i = 0; i < expanded.length; i += cols) {
      const pair = expanded.slice(i, i + cols);
      // measured: title row + measured body height + paddings; row takes the max
      const heights = pair.map((it) => padTop + titleRow(it) + 0.1 + textH(it.text, 18, bodyW) + padBottom);
      const rowH = Math.max(...heights, 1.0);
      this.ensure(rowH + 0.06);
      pair.forEach((it, j) => {
        const cx = MX + j * (cw + gapX);
        cardShape(this.s, cx, this.y, cw, rowH);
        addIcon(this.s, it.icon, cx + 0.16, this.y + 0.16, 0.34);
        const tRow = titleRow(it);
        this.s.addText(runs(it.title, { color: NAVY, bold: true }), {
          x: cx + 0.6, y: this.y + padTop - 0.04, w: titleW + 0.14, h: tRow + 0.08, fontFace: TITLE_FONT, fontSize: 18, valign: "top", lineSpacingMultiple: 1.05, fit: "none",
        });
        const bodyY = this.y + padTop + tRow + 0.1;
        this.s.addText(runs(it.text, { color: GREY }), {
          x: cx + 0.16, y: bodyY, w: bodyW, h: rowH - (bodyY - this.y) - 0.06, fontFace: BODY_FONT, fontSize: 18, valign: "top", lineSpacingMultiple: 1.1, fit: "none",
        });
      });
      this.y += rowH + 0.14;
    }
  }
  // short-bullet lists render as 2-column icon cards (keyword-picked icons)
  iconBullets(bullets) {
    const cols = 2;
    const gapX = 0.24;
    const cw = (CW - gapX) / cols;
    const textW = cw - 0.86;
    for (let i = 0; i < bullets.length; i += cols) {
      const pair = bullets.slice(i, i + cols);
      const heights = pair.map((b) => Math.max(0.34, textH(b, 18, textW)) + 0.32);
      const rowH = Math.max(...heights, 0.72);
      this.ensure(rowH + 0.06);
      pair.forEach((b, j) => {
        const cx = MX + j * (cw + gapX);
        cardShape(this.s, cx, this.y, cw, rowH);
        addIcon(this.s, pickIcon(b), cx + 0.18, this.y + 0.17, 0.34);
        this.s.addText(runs(b, { color: NAVY }), {
          x: cx + 0.66, y: this.y + 0.14, w: textW, h: rowH - 0.24, fontFace: BODY_FONT, fontSize: 18, valign: "top", lineSpacingMultiple: 1.1, fit: "none",
        });
      });
      this.y += rowH + 0.14;
    }
  }
  example(ex) {
    const innerW = CW - 0.5;
    const titleH = textH("Example — " + ex.title, 18, innerW, 1.35, true);
    const lineHs = ex.lines.map((l) => textH(l, 18, innerW - 0.35) + 0.04);
    const linesH = lineHs.reduce((a, b) => a + b, 0);
    const boxH = 0.18 + titleH + 0.08 + linesH + 0.18;
    this.ensure(boxH + 0.06);
    cardShape(this.s, MX, this.y, CW, boxH, { fill: LIGHT });
    this.s.addText(runs("Example — " + ex.title, { color: BLUE, bold: true }), {
      x: MX + 0.25, y: this.y + 0.12, w: innerW, h: titleH + 0.06, fontFace: TITLE_FONT, fontSize: 18, valign: "top", fit: "none",
    });
    let ly = this.y + 0.14 + titleH + 0.08;
    ex.lines.forEach((l, i) => {
      const lh = lineHs[i];
      this.s.addShape(pptx.ShapeType.ellipse, { x: MX + 0.28, y: ly + 0.12, w: 0.09, h: 0.09, fill: { color: BLUE } });
      this.s.addText(runs(l, { color: NAVY }), {
        x: MX + 0.5, y: ly, w: innerW - 0.35, h: lh, fontFace: BODY_FONT, fontSize: 18, valign: "top", lineSpacingMultiple: 1.1, fit: "none",
      });
      ly += lh;
    });
    this.y += boxH + 0.16;
  }
}

/* ---------- 1. Title slide ---------- */
{
  const s = slide();
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.12, fill: { color: BLUE } });
  s.addShape(pptx.ShapeType.roundRect, { x: MX, y: 1.1, w: 7.7, h: 0.62, rectRadius: 0.31, fill: { color: BLUE } });
  s.addText("GENERIC MANAGEMENT · UNIT STANDARD 252034", { x: MX, y: 1.1, w: 7.7, h: 0.62, fontFace: BODY_FONT, fontSize: 18, bold: true, color: WHITE, align: "center", valign: "middle", charSpacing: 1 });
  s.addText("US 252034 — Monitor and evaluate team members against performance standards", { x: MX, y: 1.9, w: 10.8, h: 1.85, fontFace: TITLE_FONT, fontSize: 36, bold: true, color: NAVY });
  s.addText("Formulate performance standards and monitoring systems, prepare for a performance review, and conduct the review interview — the complete lesson deck.", { x: MX, y: 3.75, w: 9.7, h: 0.82, fontFace: BODY_FONT, fontSize: 18, color: GREY, lineSpacingMultiple: 1.15 });
  addIcon(s, "presenter", 11.0, 1.4, 1.8, "#" + BORDER);
  s.addShape(pptx.ShapeType.line, { x: MX, y: 4.62, w: CW, h: 0, line: { color: BORDER, width: 1 } });
  const meta = [
    ["NQF LEVEL", "Level 5"],
    ["CREDITS", "8 credits"],
    ["QUALIFICATION", "National Certificate: Generic Management"],
    ["SAQA ID", "59201"],
  ];
  meta.forEach(([k, v], i) => {
    const x = MX + i * (CW / 4);
    s.addText(k, { x, y: 4.82, w: CW / 4 - 0.2, h: 0.38, fontFace: BODY_FONT, fontSize: 18, bold: true, color: BLUE, charSpacing: 0.5, wrap: false });
    s.addText(v, { x, y: 5.24, w: CW / 4 - 0.2, h: 1.1, fontFace: BODY_FONT, fontSize: 18, color: NAVY, lineSpacingMultiple: 1.1, fit: "none" });
  });
  s.addText("ITSS Learn · Investec · Corporate Banking Technology", { x: MX, y: H - 0.62, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: 15, color: GREY });
}

/* ---------- 2. Lesson sections ---------- */
let currentLesson = 0;
const sections = UNIT.lesson;
for (const sec of sections) {
  if (sec.lessonStart) {
    currentLesson = sec.lessonStart.n;
    const s = slide();
    s.background = { color: NAVY };
    s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.12, fill: { color: BLUE } });
    s.addText(`LESSON ${sec.lessonStart.n}`, { x: MX, y: 2.1, w: CW, h: 0.5, fontFace: BODY_FONT, fontSize: 20, bold: true, color: DARK_LABEL, charSpacing: 3 });
    s.addText(sec.lessonStart.title, { x: MX, y: 2.7, w: 11.4, h: 1.7, fontFace: TITLE_FONT, fontSize: 40, bold: true, color: WHITE });
    addIcon(s, sec.icon ?? "book", MX, 1.2, 0.7, "#" + DARK_LABEL);
    s.addText(FOOTER + " · ITSS Learn", { x: MX, y: H - 0.62, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: 14, color: DARK_MUTED });
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
  const s = slide();
  s.background = { color: NAVY };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.12, fill: { color: BLUE } });
  addIcon(s, "award", MX, 1.6, 0.7, "#" + DARK_LABEL);
  s.addText("Plan. Coach. Appraise.", { x: MX, y: 2.45, w: CW, h: 1.4, fontFace: TITLE_FONT, fontSize: 36, bold: true, color: WHITE });
  s.addText("You can now formulate performance standards, build a monitoring system, prepare for a review, and conduct a fair, constructive performance review interview. Complete the unit quiz and your Portfolio of Evidence assignment in ITSS Learn.", {
    x: MX, y: 3.95, w: 11.6, h: 1.7, fontFace: BODY_FONT, fontSize: 18, color: DARK_SUB, lineSpacingMultiple: 1.25, fit: "none",
  });
  s.addText("US 252034 · National Certificate: Generic Management · SAQA ID 59201 · ITSS Learn", {
    x: MX, y: H - 0.62, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: 14, color: DARK_MUTED,
  });
}

mkdirSync("public/downloads", { recursive: true });
const OUT = "public/downloads/US-252034-Monitor-Evaluate-Performance.pptx";
await pptx.writeFile({ fileName: OUT });
console.log(`Written ${OUT} — ${pageNo} slides`);
