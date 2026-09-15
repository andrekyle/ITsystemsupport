// Neonatologist — Career Awareness deck (South African context).
// One-off deck generated from supplied content; NOT wired into the app
// (no BUILTIN_DECKS entry, output goes to the repo root, not public/downloads).
// DECK STANDARD: no content text below 18pt — long content is never shrunk,
// it continues onto "(continued)" slides. Only footer/source furniture smaller.
// Run: node scripts/make-neonatologist-ppt.mjs
// Out: Neonatologist-Career-Awareness.pptx (repo root)
import pptxgen from "pptxgenjs";

/* ---------- Palette (medical teal + coral accent) ---------- */
const TEAL = "0E8074";
const INK = "0B3B4A";
const MINT = "E6F4F2";
const CORAL = "E85D4A";
const CORAL_SOFT = "FDEEEB";
const GREY = "4B5563";
const WHITE = "FFFFFF";
const BORDER = "CBE5E1";
const DARK_LABEL = "9FD9D2";
const DARK_SUB = "CDEAE6";

const TITLE_FONT = "Aptos Display";
const BODY_FONT = "Aptos";

const W = 13.33;
const H = 7.5;
const MX = 0.55;
const CW = W - MX * 2;
const MAXY = 6.85;

const SHADOW = { type: "outer", angle: 90, blur: 7, offset: 2, color: "9CBFBA", opacity: 0.3 };

/* ---------- Icon set (24x24 stroke SVGs) ---------- */
const ICONS = {
  baby: '<circle cx="12" cy="13" r="7.5"/><path d="M12 5.5c0-1.8 1.2-2.6 2.6-2.3"/><circle cx="9.4" cy="12.3" r="0.7" fill="currentcolor"/><circle cx="14.6" cy="12.3" r="0.7" fill="currentcolor"/><path d="M9.6 16c1.5 1.2 3.3 1.2 4.8 0"/>',
  heartPulse: '<path d="M12 20s-7.5-4.7-9-9c-1-3 1-6.5 4.4-6.5 2 0 3.6 1.2 4.6 2.9 1-1.7 2.6-2.9 4.6-2.9C20 4.5 22 8 21 11c-1.5 4.3-9 9-9 9z"/><path d="M4.5 12h4l1.5-2.8 2.4 4.8 1.6-2h5.5"/>',
  stethoscope: '<path d="M5 3.5v5a4.5 4.5 0 0 0 9 0v-5"/><path d="M9.5 13v3.2a4.3 4.3 0 0 0 8.6 0v-2.4"/><circle cx="18.1" cy="10.6" r="2.2"/>',
  hospital: '<rect x="4" y="5" width="16" height="15.5" rx="1.2"/><path d="M12 9v6M9 12h6M9.5 20.5v-3h5v3"/>',
  gradCap: '<path d="M12 4 2.5 8.5 12 13l9.5-4.5z"/><path d="M6.5 10.8v4.4c0 1.5 2.5 2.8 5.5 2.8s5.5-1.3 5.5-2.8v-4.4"/><path d="M21.5 9v5"/>',
  lightbulb: '<path d="M12 3.5a5.8 5.8 0 0 0-3.4 10.5c.8.6 1.2 1.4 1.3 2.3h4.2c.1-.9.5-1.7 1.3-2.3A5.8 5.8 0 0 0 12 3.5z"/><path d="M9.9 19.3h4.2M10.6 21.5h2.8"/>',
  flask: '<path d="M9.5 3.5h5M10.5 3.5v5l-5.4 9a1.8 1.8 0 0 0 1.6 2.7h10.6a1.8 1.8 0 0 0 1.6-2.7l-5.4-9v-5"/><path d="M7.8 15.5h8.4"/>',
  coins: '<rect x="3.5" y="7.5" width="12" height="8" rx="1.2"/><circle cx="9.5" cy="11.5" r="2"/><path d="M18 10.5h1a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5H8.5A1.5 1.5 0 0 1 7 18v-0.5"/>',
  signpost: '<path d="M12 3v3M12 13v8M8.5 21h7"/><path d="M5.5 6h11l2.5 2.3-2.5 2.2h-11z"/>',
  heart: '<path d="M12 20s-7.5-4.7-9-9c-1-3 1-6.5 4.4-6.5 2 0 3.6 1.2 4.6 2.9 1-1.7 2.6-2.9 4.6-2.9C20 4.5 22 8 21 11c-1.5 4.3-9 9-9 9z"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
  star: '<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="0.8"/>',
  check: '<circle cx="12" cy="12" r="8.5"/><path d="m8.3 12.4 2.5 2.5 4.9-5.3"/>',
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
  microscope: '<path d="M9 3.5 13.5 8l-3.8 3.8L5.2 7.3z"/><path d="M11.5 9.9c3 .8 5 3.2 5 6.1a6.3 6.3 0 0 1-.7 2.9"/><path d="M4 20.5h16M7.5 17.5h6"/>',
  monitor: '<rect x="3.5" y="4" width="17" height="11" rx="1.5"/><path d="M12 15v3.5M8.5 21h7"/><path d="m8.5 8 2.5 2.5L15.5 6"/>',
};
function iconUri(name, color = "#" + TEAL, sw = 1.4) {
  const body = ICONS[name] ?? ICONS.check;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  return "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
}

/* ---------- text helpers ---------- */
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

function linesFor(text, fontSize, widthIn, bold = false) {
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

/* ---------- deck ---------- */
const pptx = new pptxgen();
pptx.defineLayout({ name: "WIDE", width: W, height: H });
pptx.layout = "WIDE";
pptx.author = "Andre Snell";
pptx.title = "Neonatologist — Career Awareness (South African Context)";

const FOOTER = "Neonatologist \u00B7 Career Awareness \u00B7 South African Context";
let pageNo = 0;

function slide(chrome = true, source = null) {
  const s = pptx.addSlide();
  s.background = { color: WHITE };
  pageNo += 1;
  if (pageNo > 1 && chrome) {
    if (source) {
      s.addText(
        [
          { text: "Source: ", options: { color: GREY } },
          { text: source.label, options: { color: TEAL, hyperlink: { url: source.url }, underline: { style: "sng" } } },
          { text: "  \u00B7  " + FOOTER, options: { color: GREY } },
        ],
        { x: MX, y: H - 0.46, w: CW - 1, h: 0.34, fontFace: BODY_FONT, fontSize: 12 }
      );
    } else {
      s.addText(FOOTER, { x: MX, y: H - 0.46, w: CW - 1, h: 0.34, fontFace: BODY_FONT, fontSize: 12, color: GREY });
    }
    s.addText(String(pageNo), { x: W - MX - 0.7, y: H - 0.46, w: 0.7, h: 0.34, fontFace: BODY_FONT, fontSize: 12, color: GREY, align: "right" });
    s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.09, fill: { color: TEAL } });
  }
  return s;
}
function addIcon(s, name, x, y, size = 0.34, color, sw) {
  s.addImage({ data: iconUri(name, color, sw), x, y, w: size, h: size });
}
function eyebrowTitle(s, eyebrow, title) {
  s.addText(String(eyebrow).toUpperCase(), { x: MX, y: 0.22, w: CW, h: 0.36, fontFace: BODY_FONT, fontSize: 18, bold: true, color: TEAL, charSpacing: 2 });
  const tw = CW - 1.45;
  const th = Math.max(0.5, textH(title, 28, tw, 1.15, true));
  s.addText(runs(title, { color: INK, bold: true }), {
    x: MX, y: 0.58, w: tw, h: th + 0.12, fontFace: TITLE_FONT, fontSize: 28, valign: "top", lineSpacingMultiple: 1.05, fit: "none",
  });
  return Math.max(0.58 + th + 0.3, 1.32);
}
function cardShape(s, x, y, w, h, { fill = WHITE, line = BORDER } = {}) {
  s.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.09, fill: { color: fill }, line: { color: line, width: 1 }, shadow: { ...SHADOW } });
}

class Flow {
  constructor(eyebrow, title, icon, source = null) {
    this.eyebrow = eyebrow;
    this.title = title;
    this.icon = icon;
    this.source = source;
    this.part = 0;
    this.newSlide();
  }
  newSlide() {
    this.part += 1;
    if (this.part > 1) console.log(`  continued: "${this.title}" part ${this.part}`);
    this.s = slide(true, this.source);
    addIcon(this.s, this.icon ?? "heartPulse", W - 2.0, -1.08, 2.35, "#E4F2F0", 1.1);
    this.s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.09, fill: { color: TEAL } });
    if (this.icon) addIcon(this.s, this.icon, W - MX - 0.5, 0.3, 0.44);
    const eb = this.part === 1 ? this.eyebrow : `${this.eyebrow} \u00B7 Continued`;
    this.y = eyebrowTitle(this.s, eb, this.title);
    this.top = this.y;
  }
  ensure(h) {
    if (this.y + h > MAXY) this.newSlide();
  }
  gap(g = 0.12) {
    this.y = Math.min(this.y + g, MAXY);
  }
  paragraph(text, { fontSize = 18, color = GREY, bold = false } = {}) {
    const h = textH(text, fontSize, CW, 1.35, bold) + 0.06;
    this.ensure(Math.min(h, MAXY - this.top));
    this.s.addText(runs(text, { color, bold }), {
      x: MX, y: this.y, w: CW, h, fontFace: BODY_FONT, fontSize, valign: "top", lineSpacingMultiple: 1.12, fit: "none",
    });
    this.y += h + 0.08;
  }
  bullet(text, { fontSize = 18 } = {}) {
    const tw = CW - 0.42;
    const h = textH(text, fontSize, tw) + 0.05;
    this.ensure(h);
    this.s.addShape(pptx.ShapeType.ellipse, { x: MX + 0.06, y: this.y + 0.12, w: 0.1, h: 0.1, fill: { color: TEAL } });
    this.s.addText(runs(text, { color: INK }), {
      x: MX + 0.32, y: this.y, w: tw, h, fontFace: BODY_FONT, fontSize, valign: "top", lineSpacingMultiple: 1.12, fit: "none",
    });
    this.y += h + 0.07;
  }
  // two-column icon rows; items = { icon, text }
  iconRows(items) {
    const cols = 2;
    const gapX = 0.24;
    const cw = (CW - gapX) / cols;
    const textW = cw - 0.86;
    for (let i = 0; i < items.length; i += cols) {
      const pair = items.slice(i, i + cols);
      const heights = pair.map((b) => Math.max(0.34, textH(b.text, 18, textW)) + 0.32);
      const rowH = Math.max(...heights, 0.72);
      this.ensure(rowH + 0.06);
      pair.forEach((b, j) => {
        const cx = MX + j * (cw + gapX);
        cardShape(this.s, cx, this.y, cw, rowH);
        addIcon(this.s, b.icon, cx + 0.18, this.y + 0.17, 0.34);
        this.s.addText(runs(b.text, { color: INK }), {
          x: cx + 0.66, y: this.y + 0.14, w: textW, h: rowH - 0.24, fontFace: BODY_FONT, fontSize: 18, valign: "top", lineSpacingMultiple: 1.1, fit: "none",
        });
      });
      this.y += rowH + 0.14;
    }
  }
  // titled cards; items = { icon, title, text }
  cards(items) {
    const cols = 2;
    const gapX = 0.24;
    const cw = (CW - gapX) / cols;
    const titleW = cw - 0.95;
    const bodyW = cw - 0.32;
    for (let i = 0; i < items.length; i += cols) {
      const pair = items.slice(i, i + cols);
      const heights = pair.map((it) => 0.16 + Math.max(textH(it.title, 18, titleW, 1.2, true), 0.36) + 0.1 + textH(it.text, 18, bodyW) + 0.18);
      const rowH = Math.max(...heights, 1.0);
      this.ensure(rowH + 0.06);
      pair.forEach((it, j) => {
        const cx = MX + j * (cw + gapX);
        cardShape(this.s, cx, this.y, cw, rowH);
        addIcon(this.s, it.icon, cx + 0.16, this.y + 0.16, 0.34);
        const tRow = Math.max(textH(it.title, 18, titleW, 1.2, true), 0.36);
        this.s.addText(runs(it.title, { color: INK, bold: true }), {
          x: cx + 0.6, y: this.y + 0.12, w: titleW + 0.14, h: tRow + 0.08, fontFace: TITLE_FONT, fontSize: 18, valign: "top", lineSpacingMultiple: 1.05, fit: "none",
        });
        const bodyY = this.y + 0.16 + tRow + 0.1;
        this.s.addText(runs(it.text, { color: GREY }), {
          x: cx + 0.16, y: bodyY, w: bodyW, h: rowH - (bodyY - this.y) - 0.06, fontFace: BODY_FONT, fontSize: 18, valign: "top", lineSpacingMultiple: 1.1, fit: "none",
        });
      });
      this.y += rowH + 0.14;
    }
  }
  // tinted callout panel with label + optional bullets
  callout(label, icon, text, bullets = [], { fill = MINT, accent = TEAL } = {}) {
    const innerW = CW - 0.9;
    const labelH = 0.3;
    const tH = text ? textH(text, 18, innerW) + 0.04 : 0;
    const bHs = bullets.map((b) => textH(b, 18, innerW - 0.35) + 0.04);
    const bodyH = bHs.reduce((a, b) => a + b, 0);
    const boxH = 0.12 + labelH + (tH ? 0.06 + tH : 0) + (bodyH ? 0.08 + bodyH : 0) + 0.12;
    this.ensure(boxH + 0.06);
    cardShape(this.s, MX, this.y, CW, boxH, { fill, line: fill === MINT ? BORDER : "F3CFC7" });
    this.s.addShape(pptx.ShapeType.rect, { x: MX, y: this.y, w: 0.09, h: boxH, fill: { color: accent } });
    addIcon(this.s, icon, MX + 0.24, this.y + 0.13, 0.32, "#" + accent);
    this.s.addText(label.toUpperCase(), { x: MX + 0.68, y: this.y + 0.09, w: innerW, h: labelH + 0.05, fontFace: BODY_FONT, fontSize: 18, bold: true, color: accent, charSpacing: 1.5 });
    let ly = this.y + 0.12 + labelH + 0.06;
    if (text) {
      this.s.addText(runs(text, { color: INK }), {
        x: MX + 0.68, y: ly, w: innerW, h: tH, fontFace: BODY_FONT, fontSize: 18, valign: "top", lineSpacingMultiple: 1.12, fit: "none",
      });
      ly += tH + (bodyH ? 0.08 : 0);
    }
    bullets.forEach((b, i) => {
      this.s.addShape(pptx.ShapeType.ellipse, { x: MX + 0.72, y: ly + 0.12, w: 0.09, h: 0.09, fill: { color: accent } });
      this.s.addText(runs(b, { color: INK }), {
        x: MX + 0.94, y: ly, w: innerW - 0.35, h: bHs[i], fontFace: BODY_FONT, fontSize: 18, valign: "top", lineSpacingMultiple: 1.1, fit: "none",
      });
      ly += bHs[i];
    });
    this.y += boxH + 0.16;
  }
  // numbered vertical list with spine (steps / pathway)
  numbered(items) {
    const textW = CW - 1.15;
    const hs = items.map((t) => Math.max(0.46, textH(t, 18, textW) + 0.08));
    items.forEach((t, i) => {
      const h = hs[i];
      this.ensure(h + 0.1);
      if (i < items.length - 1) {
        this.s.addShape(pptx.ShapeType.line, { x: MX + 0.25, y: this.y + 0.48, w: 0, h: h + 0.06, line: { color: BORDER, width: 2 } });
      }
      this.s.addShape(pptx.ShapeType.ellipse, { x: MX, y: this.y, w: 0.5, h: 0.5, fill: { color: TEAL } });
      this.s.addText(String(i + 1), { x: MX, y: this.y, w: 0.5, h: 0.5, fontFace: TITLE_FONT, fontSize: 20, bold: true, color: WHITE, align: "center", valign: "middle" });
      this.s.addText(runs(t, { color: INK }), {
        x: MX + 0.78, y: this.y + 0.03, w: textW, h, fontFace: BODY_FONT, fontSize: 18, valign: "top", lineSpacingMultiple: 1.12, fit: "none",
      });
      this.y += h + 0.1;
    });
  }
  // big statistic banner
  kpi(number, restText) {
    const numW = 4.6;
    const restW = CW - numW - 0.7;
    const restH = textH(restText, 22, restW, 1.25, true);
    const boxH = Math.max(1.4, restH + 0.44);
    this.ensure(boxH + 0.08);
    cardShape(this.s, MX, this.y, CW, boxH, { fill: MINT });
    this.s.addText(number, { x: MX + 0.3, y: this.y, w: numW, h: boxH, fontFace: TITLE_FONT, fontSize: 44, bold: true, color: TEAL, valign: "middle" });
    this.s.addText(runs(restText, { color: INK, bold: true }), {
      x: MX + numW + 0.5, y: this.y, w: restW, h: boxH, fontFace: BODY_FONT, fontSize: 22, valign: "middle", lineSpacingMultiple: 1.2, fit: "none",
    });
    this.y += boxH + 0.16;
  }
  // team diagram: teal hub card left, 2x2 spoke grid right, measured heights
  teamDiagram(hub, spokes) {
    const hubW = 3.0;
    const gridX = MX + hubW + 0.6;
    const gapX = 0.22;
    const cw = (W - MX - gridX - gapX) / 2;
    const textW = cw - 0.82;
    const rowHs = [0, 1].map((r) =>
      Math.max(...spokes.slice(r * 2, r * 2 + 2).map((sp) => Math.max(0.6, textH(sp.text, 18, textW, 1.1) + 0.24)))
    );
    const totalH = rowHs[0] + 0.2 + rowHs[1];
    this.ensure(totalH + 0.1);
    const hubH = 1.05;
    const hubY = this.y + (totalH - hubH) / 2;
    spokes.forEach((sp, i) => {
      const r = Math.floor(i / 2);
      const c = i % 2;
      const bx = gridX + c * (cw + gapX);
      const by = this.y + r * (rowHs[0] + 0.2);
      // connector from hub right edge to card left edge
      const hy = hubY + hubH / 2;
      const ty = by + rowHs[r] / 2;
      this.s.addShape(pptx.ShapeType.line, {
        x: MX + hubW, y: Math.min(hy, ty), w: bx - MX - hubW, h: Math.abs(ty - hy),
        line: { color: BORDER, width: 1.75 },
        flipV: ty < hy,
      });
      cardShape(this.s, bx, by, cw, rowHs[r]);
      addIcon(this.s, sp.icon, bx + 0.16, by + 0.15, 0.32);
      this.s.addText(runs(sp.text, { color: INK }), {
        x: bx + 0.6, y: by + 0.08, w: textW, h: rowHs[r] - 0.16, fontFace: BODY_FONT, fontSize: 18, valign: "middle", lineSpacingMultiple: 1.05, fit: "none",
      });
    });
    this.s.addShape(pptx.ShapeType.roundRect, {
      x: MX, y: hubY, w: hubW, h: hubH, rectRadius: 0.12, fill: { color: TEAL }, shadow: { ...SHADOW },
    });
    addIcon(this.s, "baby", MX + 0.22, hubY + (hubH - 0.4) / 2, 0.4, "#FFFFFF");
    this.s.addText(hub, {
      x: MX + 0.7, y: hubY, w: hubW - 0.85, h: hubH, fontFace: TITLE_FONT, fontSize: 20, bold: true, color: WHITE, valign: "middle",
    });
    this.y += totalH + 0.12;
  }
  // three-phase roadmap with arrows
  phases(items) {
    const arrowW = 0.42;
    const gapX = 0.18;
    const cw = (CW - 2 * (arrowW + gapX * 2)) / 3;
    const bodyW = cw - 0.32;
    const heights = items.map((p) => 0.18 + 0.34 + 0.06 + 0.4 + 0.08 + textH(p.text, 18, bodyW) + 0.2);
    const rowH = Math.max(...heights, 2.0);
    this.ensure(rowH + 0.08);
    let x = MX;
    items.forEach((p, i) => {
      cardShape(this.s, x, this.y, cw, rowH, { fill: i === 1 ? MINT : WHITE });
      this.s.addText(p.days.toUpperCase(), { x: x + 0.16, y: this.y + 0.14, w: bodyW, h: 0.34, fontFace: BODY_FONT, fontSize: 18, bold: true, color: TEAL, charSpacing: 1.5 });
      this.s.addText(p.title, { x: x + 0.16, y: this.y + 0.52, w: bodyW, h: 0.44, fontFace: TITLE_FONT, fontSize: 24, bold: true, color: INK });
      this.s.addText(runs(p.text, { color: GREY }), {
        x: x + 0.16, y: this.y + 1.04, w: bodyW, h: rowH - 1.2, fontFace: BODY_FONT, fontSize: 18, valign: "top", lineSpacingMultiple: 1.12, fit: "none",
      });
      addIcon(this.s, p.icon, x + cw - 0.5, this.y + 0.14, 0.34);
      if (i < items.length - 1) {
        this.s.addShape(pptx.ShapeType.rightArrow, {
          x: x + cw + gapX, y: this.y + rowH / 2 - 0.19, w: arrowW, h: 0.38, fill: { color: TEAL },
        });
      }
      x += cw + arrowW + gapX * 2;
    });
    this.y += rowH + 0.16;
  }
  // 2-col table, header repeated on split (never shrunk)
  table(headers, rows) {
    const nCols = headers.length;
    const fontSize = 18;
    const colW = [CW * 0.3, CW * 0.7];
    const cellH = (c, wIn) => Math.max(0.52, textH(c, fontSize, wIn - 0.24) + 0.18);
    const headH = Math.max(...headers.map((h, i) => cellH(h, colW[i])));
    const rowHeights = rows.map((r) => Math.max(...r.map((c, i) => cellH(c, colW[i]))));
    const headerCells = headers.map((t) => ({ text: plain(t), options: { bold: true, color: WHITE, fill: { color: TEAL }, fontFace: TITLE_FONT, fontSize } }));
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
        chunkHs.push(rowHeights[i]);
        used += rowHeights[i];
        i += 1;
      }
      const chunk = rows.slice(startIdx, i);
      const tableRows = [
        headerCells,
        ...chunk.map((r, ri) =>
          r.map((c, ci) => ({ text: plain(c), options: { color: INK, bold: ci === 0, fill: { color: (startIdx + ri) % 2 ? MINT : WHITE }, fontFace: BODY_FONT, fontSize } }))
        ),
      ];
      this.s.addTable(tableRows, {
        x: MX, y: this.y, w: CW, colW, border: { type: "solid", color: BORDER, pt: 0.75 },
        rowH: [headH, ...chunkHs], valign: "middle", margin: 0.08, autoPage: false,
      });
      this.y += used + 0.16;
    }
  }
  // linked resource rows (sources slide)
  linkRows(items) {
    for (const it of items) {
      const tw = CW - 0.7;
      const h = Math.max(0.5, textH(it.label, 18, tw) + 0.1);
      this.ensure(h + 0.08);
      addIcon(this.s, "globe", MX + 0.02, this.y + 0.08, 0.3);
      this.s.addText(
        [{ text: it.label, options: { color: TEAL, hyperlink: { url: it.url }, underline: { style: "sng" } } }],
        { x: MX + 0.46, y: this.y + 0.02, w: tw, h, fontFace: BODY_FONT, fontSize: 18, valign: "top", lineSpacingMultiple: 1.15, fit: "none" }
      );
      this.y += h + 0.06;
    }
  }
}

/* ---------- sources ---------- */
const SRC = {
  aap: { label: "American Academy of Pediatrics", url: "https://www.healthychildren.org/English/family-life/health-management/pediatric-specialists/Pages/What-is-a-Neonatologist.aspx" },
  who: { label: "World Health Organization", url: "https://www.who.int/news-room/fact-sheets/detail/preterm-birth" },
  wits: { label: "Wits University", url: "https://www.wits.ac.za/course-finder/undergraduate/health/medicine-and-surgery/" },
  doh: { label: "National Department of Health", url: "https://www.health.gov.za/icsp/" },
  uct: { label: "University of Cape Town", url: "https://health.uct.ac.za/department-paediatrics/research-research-procedures/mmed" },
  cmsa: { label: "Colleges of Medicine of South Africa", url: "https://cmsa.co.za/sub-specialty-certificate-in-neonatology-of-the-college-of-paediatricians-of-south-africa-cert-neonatologysa/" },
};

/* ================= Slide 1 — Cover ================= */
{
  const s = slide();
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.12, fill: { color: TEAL } });
  // right-side art panel: concentric rings + medallion icons
  s.addShape(pptx.ShapeType.roundRect, { x: 8.7, y: 0.85, w: 4.1, h: 5.15, rectRadius: 0.18, fill: { color: MINT } });
  s.addShape(pptx.ShapeType.ellipse, { x: 9.1, y: 1.35, w: 3.3, h: 3.3, fill: { type: "none" }, line: { color: BORDER, width: 1.5 } });
  s.addShape(pptx.ShapeType.ellipse, { x: 9.55, y: 1.8, w: 2.4, h: 2.4, fill: { type: "none" }, line: { color: BORDER, width: 1.5 } });
  s.addShape(pptx.ShapeType.ellipse, { x: 10.05, y: 2.3, w: 1.4, h: 1.4, fill: { color: WHITE }, line: { color: BORDER, width: 1 }, shadow: { ...SHADOW } });
  addIcon(s, "baby", 10.3, 2.55, 0.9, "#" + TEAL, 1.3);
  s.addShape(pptx.ShapeType.ellipse, { x: 9.0, y: 4.35, w: 0.85, h: 0.85, fill: { color: WHITE }, line: { color: BORDER, width: 1 }, shadow: { ...SHADOW } });
  addIcon(s, "stethoscope", 9.2, 4.55, 0.45, "#" + CORAL, 1.5);
  s.addShape(pptx.ShapeType.ellipse, { x: 11.85, y: 1.15, w: 0.85, h: 0.85, fill: { color: WHITE }, line: { color: BORDER, width: 1 }, shadow: { ...SHADOW } });
  addIcon(s, "heartPulse", 12.05, 1.35, 0.45, "#" + CORAL, 1.5);
  s.addShape(pptx.ShapeType.ellipse, { x: 11.7, y: 4.8, w: 0.7, h: 0.7, fill: { color: WHITE }, line: { color: BORDER, width: 1 }, shadow: { ...SHADOW } });
  addIcon(s, "gradCap", 11.85, 4.95, 0.4, "#" + TEAL, 1.5);
  // left: kicker pill, title, tagline, intro
  s.addShape(pptx.ShapeType.roundRect, { x: MX, y: 1.15, w: 5.6, h: 0.58, rectRadius: 0.29, fill: { color: TEAL } });
  s.addText("CAREER AWARENESS \u00B7 SOUTH AFRICAN CONTEXT", { x: MX, y: 1.15, w: 5.6, h: 0.58, fontFace: BODY_FONT, fontSize: 16, bold: true, color: WHITE, align: "center", valign: "middle", charSpacing: 1 });
  s.addText("Neonatologist", { x: MX, y: 2.0, w: 8.0, h: 1.15, fontFace: TITLE_FONT, fontSize: 60, bold: true, color: INK });
  s.addText("Small patients. A lasting impact.", { x: MX, y: 3.3, w: 8.0, h: 0.6, fontFace: TITLE_FONT, fontSize: 28, bold: true, color: TEAL });
  s.addText("Discover how the subjects, skills and choices you build today can prepare you for a career in specialist newborn care.", {
    x: MX, y: 4.05, w: 7.6, h: 1.0, fontFace: BODY_FONT, fontSize: 19, color: GREY, lineSpacingMultiple: 1.25,
  });
  s.addShape(pptx.ShapeType.line, { x: MX, y: 5.35, w: 7.6, h: 0, line: { color: BORDER, width: 1 } });
  const chips = [
    ["heartPulse", "Specialist newborn care"],
    ["gradCap", "Training pathway"],
    ["trend", "Steps you can take now"],
  ];
  chips.forEach(([ic, t], i) => {
    const x = MX + i * 2.62;
    addIcon(s, ic, x, 5.62, 0.32);
    s.addText(t, { x: x + 0.4, y: 5.58, w: 2.2, h: 0.7, fontFace: BODY_FONT, fontSize: 15, color: INK, valign: "top", lineSpacingMultiple: 1.05 });
  });
  s.addText(FOOTER, { x: MX, y: H - 0.62, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: 15, color: GREY });
}

/* ================= Slide 2 — Objectives ================= */
{
  const f = new Flow("Objectives", "Your Future Starts With What You Practise Now", "target");
  f.paragraph("By the end of this presentation, you should be able to:");
  f.gap(0.04);
  f.iconRows([
    { icon: "stethoscope", text: "Explain what a neonatologist does." },
    { icon: "trend", text: "Identify skills that support success in this career." },
    { icon: "signpost", text: "Understand the main stages of the training pathway." },
    { icon: "check", text: "Choose practical steps you can begin taking now." },
  ]);
  f.gap(0.1);
  f.callout("Think about it", "lightbulb", "What interests you about a career that combines science and caring for people?");
}

/* ================= Slide 3 — What is a neonatologist? ================= */
{
  const f = new Flow("The role", "What Is a Neonatologist?", "stethoscope", SRC.aap);
  f.callout("Definition", "stethoscope", "A neonatologist is a **medical doctor** who specialises in caring for **newborn babies with complex health needs**.");
  f.gap(0.12);
  f.iconRows([
    { icon: "gradCap", text: "Trains in paediatrics before specialising further." },
    { icon: "baby", text: "Cares for babies born prematurely or seriously unwell." },
    { icon: "heart", text: "Helps families understand their baby\u2019s care." },
  ]);
}

/* ================= Slide 4 — Why does this career matter? ================= */
{
  const f = new Flow("Why it matters", "Why Does This Career Matter?", "heartPulse", SRC.who);
  f.kpi("13.4 million", "babies were born prematurely worldwide in 2020 \u2014 an estimated figure from the World Health Organization.");
  f.gap(0.04);
  f.iconRows([
    { icon: "calendar", text: "Premature birth means birth before **37 completed weeks** of pregnancy." },
    { icon: "baby", text: "Some babies need specialist support while their bodies develop." },
    { icon: "trend", text: "Effective newborn care can improve survival and development." },
  ]);
  f.gap(0.08);
  f.callout("Remember", "heart", "Behind every patient is a family hoping for the best possible start.", [], { fill: CORAL_SOFT, accent: CORAL });
}

/* ================= Slide 5 — Which babies need specialist care? ================= */
{
  const f = new Flow("Patients", "Which Babies Need Specialist Care?", "baby", SRC.aap);
  f.paragraph("Neonatologists may care for:");
  f.gap(0.04);
  f.iconRows([
    { icon: "clock", text: "Babies born prematurely." },
    { icon: "heartPulse", text: "Newborns with breathing difficulties." },
    { icon: "shield", text: "Babies with serious infections." },
    { icon: "baby", text: "Newborns with conditions present at birth." },
    { icon: "hospital", text: "Babies needing coordinated medical care around surgery." },
  ]);
}

/* ================= Slide 6 — Where do neonatologists work? ================= */
{
  const f = new Flow("Workplaces", "Where Do Neonatologists Work?", "hospital", SRC.aap);
  f.iconRows([
    { icon: "heartPulse", text: "Neonatal intensive care units: **NICUs**." },
    { icon: "baby", text: "Special-care newborn nurseries." },
    { icon: "hospital", text: "Children\u2019s hospitals and university hospitals." },
    { icon: "people", text: "Delivery areas when specialist newborn support is needed." },
    { icon: "calendar", text: "Follow-up clinics in some services." },
  ]);
}

/* ================= Slide 7 — What does the work involve? ================= */
{
  const f = new Flow("Daily work", "What Does the Work Involve?", "monitor", SRC.aap);
  f.iconRows([
    { icon: "search", text: "Assess babies and review their progress." },
    { icon: "document", text: "Diagnose problems and plan treatment." },
    { icon: "people", text: "Coordinate care with other professionals." },
    { icon: "chat", text: "Explain care to parents and caregivers." },
    { icon: "trend", text: "Support recovery, nutrition and growth." },
  ]);
}

/* ================= Slide 8 — Teamwork ================= */
{
  const f = new Flow("Teamwork", "Newborn Care Is Teamwork", "people");
  f.paragraph("A neonatologist works with other professionals rather than working alone. The team can include:");
  f.gap(0.08);
  f.teamDiagram("Neonatologist", [
    { icon: "stethoscope", text: "Paediatricians and other medical specialists" },
    { icon: "heartPulse", text: "Neonatal nurses" },
    { icon: "trend", text: "Professionals supporting nutrition and development" },
    { icon: "heart", text: "Parents and caregivers" },
  ]);
  f.gap(0.06);
  f.callout("Start now", "trend", "Learn to listen, share responsibility and respect other people\u2019s contributions.");
}

/* ================= Slide 9 — Technology and human judgement ================= */
{
  const f = new Flow("Technology", "Technology and Human Judgement", "monitor", SRC.aap);
  f.paragraph("Specialised equipment helps clinicians monitor and support newborn babies.");
  f.callout("Key idea", "lightbulb", "Technology provides **information**. Clinicians must **interpret it carefully** and decide what it means for the individual baby.");
  f.gap(0.08);
  f.callout("Start now", "trend", "", [
    "Check information before accepting it.",
    "Look for patterns and inconsistencies.",
    "Ask questions when something does not make sense.",
  ]);
}

/* ================= Slide 10 — Scientific curiosity ================= */
{
  const f = new Flow("Skills to build", "Build Scientific Curiosity", "flask");
  f.paragraph("Scientific curiosity begins with asking useful questions.");
  f.gap(0.04);
  f.iconRows([
    { icon: "person", text: "How does the human body work?" },
    { icon: "search", text: "Why do different conditions affect people differently?" },
    { icon: "document", text: "What evidence supports an explanation?" },
    { icon: "flask", text: "How could an idea be tested?" },
  ]);
  f.gap(0.1);
  f.callout("Try this", "pen", "Read a reliable science article and explain its main finding in three sentences.");
}

/* ================= Slide 11 — Communication ================= */
{
  const f = new Flow("Skills to build", "Strengthen Your Communication", "chat");
  f.paragraph("Clear communication helps people understand important information. Practise these habits:");
  f.gap(0.04);
  f.iconRows([
    { icon: "people", text: "Listen before responding." },
    { icon: "chat", text: "Explain ideas in simple, accurate language." },
    { icon: "search", text: "Ask questions respectfully." },
    { icon: "check", text: "Check whether the other person understands." },
  ]);
  f.gap(0.1);
  f.callout("Try this", "pen", "Explain a science concept to a classmate without using complicated terminology.");
}

/* ================= Slide 12 — Dependable team member ================= */
{
  const f = new Flow("Skills to build", "Become a Dependable Team Member", "people");
  f.paragraph("Good teamwork requires more than being friendly.");
  f.gap(0.04);
  f.iconRows([
    { icon: "check", text: "Complete the tasks you agree to do." },
    { icon: "chat", text: "Share information clearly." },
    { icon: "globe", text: "Respect different perspectives." },
    { icon: "people", text: "Ask for help when needed." },
    { icon: "trend", text: "Respond constructively to feedback." },
  ]);
  f.gap(0.1);
  f.callout("School connection", "gradCap", "Group projects, clubs and community activities provide opportunities to practise these skills.");
}

/* ================= Slide 13 — Empathy and respect ================= */
{
  const f = new Flow("Skills to build", "Practise Empathy and Respect", "heart");
  f.paragraph("Empathy means trying to understand another person\u2019s experience.");
  f.gap(0.04);
  f.iconRows([
    { icon: "people", text: "Listen without interrupting." },
    { icon: "heart", text: "Recognise that people respond differently to uncertainty." },
    { icon: "shield", text: "Avoid making assumptions about someone\u2019s background." },
    { icon: "document", text: "Respect personal information." },
    { icon: "check", text: "Be honest when you do not know an answer." },
  ]);
  f.gap(0.1);
  f.callout("Start now", "trend", "Ask, \u201CWhat would help this person feel heard and respected?\u201D");
}

/* ================= Slide 14 — Problem-solving ================= */
{
  const f = new Flow("Skills to build", "Develop Careful Problem-Solving", "search");
  f.callout("Classroom scenario", "flask", "Two members of your science group have recorded different results. **What should you do?**");
  f.gap(0.1);
  f.numbered([
    "Compare the original observations.",
    "Check the method and units.",
    "Consider possible explanations.",
    "Ask for guidance if uncertainty remains.",
    "Explain your conclusion using evidence.",
  ]);
  f.gap(0.06);
  f.callout("Discussion", "chat", "Which steps require honesty, teamwork and attention to detail?", [], { fill: CORAL_SOFT, accent: CORAL });
}

/* ================= Slide 15 — Study habits ================= */
{
  const f = new Flow("Skills to build", "Build Study Habits That Last", "book");
  f.paragraph("A demanding career begins with manageable learning habits.");
  f.gap(0.04);
  f.iconRows([
    { icon: "calendar", text: "Create a realistic weekly study routine." },
    { icon: "check", text: "Test your understanding without looking at the answer." },
    { icon: "search", text: "Revisit mistakes and identify what caused them." },
    { icon: "chat", text: "Ask for help before confusion builds up." },
    { icon: "heart", text: "Make time for rest and activities you enjoy." },
  ]);
  f.gap(0.1);
  f.paragraph("**Progress comes from consistent practice and useful feedback.**", { color: INK });
}

/* ================= Slide 16 — Subjects ================= */
{
  const f = new Flow("School subjects", "Choose Subjects With the Pathway in Mind", "book", SRC.wits);
  f.table(
    ["Subject", "Skills you can develop"],
    [
      ["Mathematics", "Accurate reasoning, calculations and interpreting information"],
      ["Life Sciences", "Understanding living systems and the human body"],
      ["Physical Sciences", "Experimental thinking and understanding physical processes"],
      ["Languages", "Reading carefully, listening and explaining clearly"],
    ]
  );
  f.gap(0.06);
  f.paragraph("Medical-school subject requirements vary. **Check the current requirements of each university** before making subject choices \u2014 for example, Wits Medicine and Surgery admissions (see source below).", { color: INK });
}

/* ================= Slide 17 — SA training pathway ================= */
{
  const f = new Flow("The pathway", "The South African Training Pathway", "signpost", SRC.doh);
  f.numbered([
    "**Medical degree:** For example, the six-year MBBCh at Wits.",
    "**Medical internship:** Two years.",
    "**Community service:** One year.",
    "**Paediatric specialist training:** UCT\u2019s programme runs for four years.",
    "**Neonatology subspecialty training:** Further supervised training and assessments.",
  ]);
  f.gap(0.06);
  f.paragraph("Professional registration requirements apply. The overall journey can take longer because entry into training posts is **competitive**. Sources: Wits, Department of Health, UCT and the Colleges of Medicine of South Africa (see final slide).");
}

/* ================= Slide 18 — University applications ================= */
{
  const f = new Flow("Getting in", "Prepare for University Applications", "document", SRC.wits);
  f.iconRows([
    { icon: "search", text: "Compare admission requirements across several universities." },
    { icon: "trend", text: "Work towards the strongest academic results you can achieve." },
    { icon: "check", text: "Check whether admission tests are required." },
    { icon: "calendar", text: "Track application and supporting-document deadlines." },
    { icon: "document", text: "Keep copies of documents and submission confirmations." },
  ]);
  f.gap(0.1);
  f.callout("Important", "shield", "Meeting minimum requirements does **not** guarantee admission.", [], { fill: CORAL_SOFT, accent: CORAL });
}

/* ================= Slide 19 — Cost of studying ================= */
{
  const f = new Flow("Funding", "Plan for the Cost of Studying", "coins");
  f.paragraph("Consider the full cost of attending university:");
  f.gap(0.04);
  f.iconRows([
    { icon: "book", text: "Tuition and learning materials." },
    { icon: "hospital", text: "Accommodation and meals." },
    { icon: "globe", text: "Transport and internet access." },
    { icon: "coins", text: "Application and other required fees." },
  ]);
  f.gap(0.08);
  f.paragraph("Ask university financial-aid offices about current funding opportunities. Check **eligibility, deadlines and any conditions** attached to bursaries.");
  f.callout("Start now", "trend", "Create a funding checklist with a school adviser, parent or guardian.");
}

/* ================= Slide 20 — Explore the career ================= */
{
  const f = new Flow("Explore", "Explore the Career Before Committing", "search");
  f.paragraph("You can learn about healthcare while still at school.");
  f.gap(0.04);
  f.iconRows([
    { icon: "gradCap", text: "Attend university open days." },
    { icon: "chat", text: "Join career talks and science events." },
    { icon: "person", text: "Ask a healthcare professional about their working life." },
    { icon: "people", text: "Take part in age-appropriate, supervised community service." },
    { icon: "pen", text: "Keep a journal of what interests and challenges you." },
  ]);
  f.gap(0.08);
  f.paragraph("Hospital observation depends on **permission, age requirements and patient consent**.");
}

/* ================= Slide 21 — Understand the demands ================= */
{
  const f = new Flow("Reality check", "Understand the Demands", "clock");
  f.paragraph("This career requires a realistic understanding of its responsibilities.");
  f.gap(0.04);
  f.iconRows([
    { icon: "book", text: "Training involves sustained study and assessments." },
    { icon: "moon", text: "Hospital work may include nights and weekends." },
    { icon: "clock", text: "Priorities can change quickly." },
    { icon: "heart", text: "Caring for seriously unwell babies can be emotionally demanding." },
    { icon: "trend", text: "Ongoing learning continues after qualification." },
  ]);
  f.gap(0.1);
  f.callout("A useful question", "lightbulb", "What support helps professionals manage these demands?");
}

/* ================= Slide 22 — What could make it rewarding? ================= */
{
  const f = new Flow("Rewards", "What Could Make This Career Rewarding?", "star");
  f.paragraph("Possible sources of satisfaction include:");
  f.gap(0.04);
  f.iconRows([
    { icon: "flask", text: "Applying scientific knowledge to meaningful problems." },
    { icon: "baby", text: "Contributing to the care of babies and families." },
    { icon: "people", text: "Working with skilled colleagues." },
    { icon: "trend", text: "Developing expertise over time." },
    { icon: "microscope", text: "Exploring interests in teaching, research or improving services." },
  ]);
  f.gap(0.1);
  f.callout("Reflect", "lightbulb", "Which of these would matter most to you?");
}

/* ================= Slide 23 — Related careers ================= */
{
  const f = new Flow("Alternatives", "Keep Related Careers in View", "signpost");
  f.paragraph("There are several ways to contribute to children\u2019s health. Each profession has its own education and registration pathway.");
  f.gap(0.04);
  f.cards([
    { icon: "stethoscope", title: "Paediatrics", text: "Medical care across childhood." },
    { icon: "heartPulse", title: "Neonatal nursing", text: "Nursing care for newborn babies." },
    { icon: "baby", title: "Midwifery", text: "Care around pregnancy, birth and the postnatal period." },
    { icon: "microscope", title: "Biomedical research", text: "Investigating questions that may improve health." },
  ]);
  f.gap(0.08);
  f.paragraph("**Exploring alternatives helps you make an informed choice.**", { color: INK });
}

/* ================= Slide 24 — Your next 90 days ================= */
{
  const f = new Flow("Action plan", "Your Next 90 Days", "calendar");
  f.phases([
    { days: "Days 1\u201330", title: "Explore", icon: "search", text: "Compare medical-school requirements and speak to a school adviser." },
    { days: "Days 31\u201360", title: "Practise", icon: "pen", text: "Strengthen one subject and practise explaining ideas clearly." },
    { days: "Days 61\u201390", title: "Reflect", icon: "lightbulb", text: "Attend a career event or speak to a healthcare professional. Review what you learned." },
  ]);
  f.gap(0.1);
  f.callout("Record", "document", "One **goal**, one **weekly action** and one **person who can support you**.");
}

/* ================= Slide 25 — Choose one next step ================= */
{
  const f = new Flow("Your move", "Choose One Next Step", "check");
  f.paragraph("Ask yourself:");
  f.gap(0.04);
  f.iconRows([
    { icon: "heart", text: "Which part of this career interests me most?" },
    { icon: "star", text: "Which skill do I already enjoy using?" },
    { icon: "trend", text: "Which skill could I improve?" },
    { icon: "calendar", text: "What can I do this week?" },
    { icon: "people", text: "Who can help me understand the next stage?" },
  ]);
  f.gap(0.1);
  f.callout("Remember", "lightbulb", "You do not need every answer today. **Begin with one informed choice.**", [], { fill: CORAL_SOFT, accent: CORAL });
}

/* ================= Slide 26 — Sources ================= */
{
  const f = new Flow("References", "Sources and Further Reading", "book");
  f.linkRows([
    { label: "American Academy of Pediatrics \u2014 What Is a Neonatologist?", url: SRC.aap.url },
    { label: "World Health Organization \u2014 Preterm Birth", url: SRC.who.url },
    { label: "Wits University \u2014 Medicine and Surgery", url: SRC.wits.url },
    { label: "National Department of Health \u2014 Internship and Community Service", url: SRC.doh.url },
    { label: "University of Cape Town \u2014 Paediatric Specialist Training", url: SRC.uct.url },
    { label: "Colleges of Medicine of South Africa \u2014 Neonatology", url: SRC.cmsa.url },
  ]);
  f.gap(0.12);
  f.paragraph("Information checked in September 2026. Confirm current admission and training requirements when applying.", { color: GREY });
}

/* ================= Closing ================= */
{
  const s = slide(false);
  s.background = { color: INK };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.12, fill: { color: TEAL } });
  addIcon(s, "baby", MX, 1.5, 0.7, "#" + DARK_LABEL);
  s.addText("Small patients. A lasting impact.", { x: MX, y: 2.4, w: CW, h: 1.0, fontFace: TITLE_FONT, fontSize: 40, bold: true, color: WHITE });
  s.addText("Your future starts with what you practise now \u2014 curiosity, communication, teamwork, empathy and careful problem-solving.", {
    x: MX, y: 3.6, w: 11.4, h: 1.1, fontFace: BODY_FONT, fontSize: 20, color: DARK_SUB, lineSpacingMultiple: 1.25,
  });
  s.addText(FOOTER, { x: MX, y: H - 0.62, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: 14, color: "6E9DA8" });
}

const OUT = "Neonatologist-Career-Awareness.pptx";
await pptx.writeFile({ fileName: OUT });
console.log(`Written ${OUT} \u2014 ${pageNo} slides`);
