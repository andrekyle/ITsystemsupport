// Generates the PSU / Rectifier / MOSFET deep-dive deck (icon-driven visuals).
// Run: node scripts/make-psu-ppt.mjs
import pptxgen from "pptxgenjs";
import { mkdirSync } from "node:fs";

const BLUE = "0F6CBD";
const NAVY = "002050";
const LIGHT = "EAF4FF";
const GREY = "6B7280";
const WHITE = "FFFFFF";
const BORDER = "D5E3F2";
const AMBER = "F59E0B";
const AMBER_LIGHT = "FEF3C7";
const GREEN = "16A34A";
const GREEN_LIGHT = "DCFCE7";
const RED = "DC2626";
const DARK_LABEL = "8CC2F0";
const DARK_SUB = "B9D6F2";
const DARK_MUTED = "6E93BC";
const DARK_LINE = "1B4272";

const TITLE_FONT = "Aptos Display";
const BODY_FONT = "Aptos";
const MONO_FONT = "Consolas";

const W = 13.33, H = 7.5, MX = 0.55, CW = W - MX * 2;
const SHADOW = { type: "outer", angle: 90, blur: 7, offset: 2, color: "9AB4CC", opacity: 0.3 };

/* ================ ICON LIBRARY (Fluent-style thin-stroke SVG) ================ */
const ICONS = {
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="0.8"/>',
  book: '<path d="M4 19.5v-14A2.5 2.5 0 0 1 6.5 3H20v18H6.5a2.5 2.5 0 0 1-2.5-2.5zm0 0A2.5 2.5 0 0 1 6.5 17H20"/>',
  check: '<circle cx="12" cy="12" r="8.5"/><path d="m8.3 12.4 2.5 2.5 4.9-5.3"/>',
  dismiss: '<circle cx="12" cy="12" r="8.5"/><path d="m9 9 6 6M15 9l-6 6"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  outlet: '<rect x="4" y="3.5" width="16" height="17" rx="2"/><circle cx="9" cy="10" r="1.2"/><circle cx="15" cy="10" r="1.2"/><path d="M8 15h8"/>',
  plug: '<path d="M9 3v4M15 3v4"/><path d="M6.5 7h11v5a5.5 5.5 0 0 1-11 0z"/><path d="M12 17.5V21"/>',
  cable: '<path d="M3 6h4a3 3 0 0 1 3 3v6a3 3 0 0 0 3 3h4"/><rect x="2" y="5" width="3" height="3" rx=".4"/><rect x="19" y="17" width="3" height="3" rx=".4"/>',
  psu: '<rect x="3" y="6" width="18" height="12" rx="1.5"/><circle cx="8" cy="12" r="2.5"/><path d="M8 9.5v5M5.5 12h5"/><rect x="14" y="9" width="4" height="1.4" rx=".4"/><rect x="14" y="12" width="4" height="1.4" rx=".4"/><rect x="14" y="15" width="4" height="1.4" rx=".4"/>',
  filter: '<path d="M2 9q2 -4 4 0 q2 -4 4 0 q2 -4 4 0"/><path d="M14 9h8"/><path d="M18 9v4"/><path d="M15 13h6"/><path d="M16 15h4"/><path d="M17 17h2"/>',
  diode: '<path d="M2 12h6"/><path d="M8 6l10 6-10 6z"/><path d="M18 6v12"/><path d="M18 12h4"/>',
  bridgeRect: '<path d="M12 3l9 9-9 9-9-9z"/><path d="M12 1v2M12 21v2M1 12h2M21 12h2"/><path d="M9.5 6.5l2 2 2-2z"/><path d="M9.5 17.5l2-2 2 2z"/><path d="M6.5 9.5l2 2-2 2z"/><path d="M17.5 9.5l-2 2 2 2z"/>',
  transistor: '<path d="M2 12h6"/><path d="M8 7v10"/><path d="M11 8h3M11 12h3M11 16h3"/><path d="M14 8v8"/><path d="M14 8h6V4"/><path d="M14 16h6v4"/><path d="M14 12h6"/><path d="M17 10l-3 2 3 2z"/>',
  transformer: '<path d="M2 7h5M2 17h5M17 7h5M17 17h5"/><path d="M7 7q-3 2.5 0 5 q-3 2.5 0 5"/><path d="M17 7q3 2.5 0 5 q3 2.5 0 5"/><path d="M11 5v14M13 5v14"/>',
  capacitor: '<path d="M2 12h8M14 12h8"/><path d="M10 6v12M14 6v12"/>',
  regulator: '<rect x="5" y="6" width="14" height="12" rx="1"/><path d="M2 10h3M19 10h3M12 18v4"/><path d="M8 10h8M8 13h8"/>',
  gaugeSteady: '<path d="M4 17a8 8 0 0 1 16 0"/><path d="M12 17l3-6"/><circle cx="12" cy="17" r="0.8"/>',
  gaugeWobble: '<path d="M4 17a8 8 0 0 1 16 0"/><path d="M12 17l5-3"/><path d="M8 17l2-4" opacity=".4"/><path d="M16 17l-1-5" opacity=".4"/><circle cx="12" cy="17" r="0.8"/>',
  motherboard: '<rect x="3" y="3" width="18" height="18" rx="1.5"/><rect x="6" y="6" width="6" height="4" rx=".3"/><rect x="14" y="6" width="4" height="12" rx=".3"/><path d="M6 13h6M6 16h6M6 18h4"/>',
  cpu: '<rect x="5" y="5" width="14" height="14" rx="1"/><rect x="8.5" y="8.5" width="7" height="7" rx=".4"/><path d="M9 3v2M12 3v2M15 3v2M9 19v2M12 19v2M15 19v2M3 9h2M3 12h2M3 15h2M19 9h2M19 12h2M19 15h2"/>',
  gpu: '<rect x="2.5" y="7" width="19" height="9" rx="1"/><circle cx="8" cy="11.5" r="2.5"/><path d="M8 9v5M5.5 11.5h5"/><rect x="14" y="10" width="5" height="3" rx=".3"/><path d="M4 16v2M8 16v2M12 16v2M18 16v2"/>',
  ram: '<rect x="2" y="8" width="20" height="8" rx=".6"/><path d="M5 8v8M8 8v8M11 8v8M14 8v8M17 8v8M20 8v8"/><path d="M2 14h20"/>',
  ssd: '<rect x="3" y="5" width="18" height="14" rx="1"/><rect x="6" y="8" width="3.5" height="3" rx=".2"/><rect x="10.5" y="8" width="3.5" height="3" rx=".2"/><rect x="15" y="8" width="3.5" height="3" rx=".2"/><rect x="6" y="13" width="3.5" height="3" rx=".2"/><rect x="10.5" y="13" width="3.5" height="3" rx=".2"/><rect x="15" y="13" width="3.5" height="3" rx=".2"/>',
  hdd: '<rect x="3" y="4" width="18" height="16" rx="1"/><circle cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="1.5"/><path d="M12 12l4-2"/>',
  fan: '<circle cx="12" cy="12" r="1.5"/><path d="M12 10.5c-1-3-4-4-6-2 2 3 5 3 6 2z"/><path d="M13.5 12c3-1 4-4 2-6-3 2-3 5-2 6z"/><path d="M12 13.5c1 3 4 4 6 2-2-3-5-3-6-2z"/><path d="M10.5 12c-3 1-4 4-2 6 3-2 3-5 2-6z"/><circle cx="12" cy="12" r="9"/>',
  usb: '<path d="M12 21V6"/><path d="M8 10l4-4 4 4"/><circle cx="12" cy="21" r="1"/><path d="M8 15l4 2 4-3v-2"/><rect x="10.5" y="13" width="3" height="2" rx=".2"/><rect x="15" y="11" width="2.5" height="2.5" rx=".3"/>',
  chip: '<rect x="6" y="6" width="12" height="12" rx="1"/><path d="M9 4v2M12 4v2M15 4v2M9 18v2M12 18v2M15 18v2M4 9h2M4 12h2M4 15h2M18 9h2M18 12h2M18 15h2"/>',
  bios: '<rect x="5" y="5" width="14" height="14" rx="1"/><path d="M8 8h8v8H8z" fill="none"/><path d="M9 3v2M12 3v2M15 3v2M9 19v2M12 19v2M15 19v2M3 9h2M3 12h2M3 15h2M19 9h2M19 12h2M19 15h2"/><text x="12" y="14" font-size="4" text-anchor="middle" stroke="none" fill="currentColor">BIOS</text>',
  pcie: '<rect x="2" y="10" width="20" height="4" rx=".3"/><path d="M4 14v2M6 14v2M8 14v2M10 14v2M12 14v2M14 14v2M16 14v2M18 14v2M20 14v2"/>',
  water: '<path d="M12 2c4 6 7 10 7 13a7 7 0 0 1-14 0c0-3 3-7 7-13z"/>',
  plant: '<rect x="3" y="10" width="18" height="11" rx=".5"/><path d="M3 10 8 4h8l5 6"/><rect x="7" y="14" width="4" height="7"/><rect x="13" y="14" width="4" height="4"/><path d="M9 8v2M13 8v2"/>',
  house: '<path d="M3 11 12 3l9 8"/><path d="M5 10v11h14V10"/><rect x="10" y="14" width="4" height="7"/>',
  river: '<path d="M2 8c3 0 3 2 6 2s3-2 6-2 3 2 6 2"/><path d="M2 13c3 0 3 2 6 2s3-2 6-2 3 2 6 2"/><path d="M2 18c3 0 3 2 6 2s3-2 6-2 3 2 6 2"/>',
  pipe: '<rect x="3" y="9" width="18" height="6" rx=".5"/><rect x="3" y="9" width="2" height="6"/><rect x="19" y="9" width="2" height="6"/>',
  door: '<rect x="4" y="3" width="16" height="18" rx=".5"/><circle cx="12" cy="12" r="6"/><path d="M12 6v12M6 12h12"/>',
  lightswitch: '<rect x="7" y="3" width="10" height="18" rx="1"/><rect x="10" y="8" width="4" height="5" rx=".4"/><circle cx="12" cy="17" r=".5"/>',
  sineWave: '<path d="M2 12c2-6 4-6 6 0s4 6 6 0 4-6 6 0"/>',
  dcLine: '<path d="M2 12h20"/><path d="M18 9l3 3-3 3"/>',
  squarePulse: '<path d="M2 16h2v-8h3v8h3v-8h3v8h3v-8h3v8h2"/>',
  arrowRight: '<path d="M4 12h14"/><path d="M14 6l6 6-6 6"/>',
  arrowDown: '<path d="M12 4v14"/><path d="M6 14l6 6 6-6"/>',
  swap: '<path d="M4 8h14"/><path d="M14 4l4 4-4 4"/><path d="M20 16H6"/><path d="M10 20l-4-4 4-4"/>',
  pool: '<path d="M3 14c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2 2 2 2 2"/><path d="M4 18h16"/><path d="M6 14V6h12v8"/>',
  question: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.2a2.4 2.4 0 1 1 3.3 2.2c-.8.33-1.3 1-1.3 1.8v.4"/><path d="M11.6 16.6h.05"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  layers: '<path d="M12 3.5l8.5 4.7L12 12.9 3.5 8.2z"/><path d="m3.5 12.4 8.5 4.7 8.5-4.7"/><path d="m3.5 16.3 8.5 4.7 8.5-4.7"/>',
  shield: '<path d="M12 3l7 2.8v5.4c0 4.5-3 7.9-7 9.8-4-1.9-7-5.3-7-9.8V5.8z"/><path d="m9.2 11.8 2 2 3.6-4"/>',
};

function iconUri(name, color = "#" + BLUE, sw = 1.4) {
  const body = ICONS[name];
  if (!body) throw new Error("Unknown icon: " + name);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  return "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
}
function addIcon(s, name, x, y, size = 0.32, color) {
  s.addImage({ data: iconUri(name, color), x, y, w: size, h: size });
}

const pptx = new pptxgen();
pptx.defineLayout({ name: "WIDE", width: W, height: H });
pptx.layout = "WIDE";
pptx.author = "Andre Snell";
pptx.company = "Investec — IT Systems Support";
pptx.title = "How a PSU Works — Rectifier & MOSFET";

let pageNo = 0;

function slide() {
  const s = pptx.addSlide();
  s.background = { color: WHITE };
  pageNo += 1;
  if (pageNo > 1) {
    s.addText("How a PSU Works  ·  Rectifier & MOSFET Deep Dive  ·  IT Systems Support", {
      x: MX, y: H - 0.42, w: CW - 1, h: 0.3, fontFace: BODY_FONT, fontSize: 9, color: GREY, align: "left",
    });
    s.addText(String(pageNo), {
      x: W - MX - 0.6, y: H - 0.42, w: 0.6, h: 0.3, fontFace: BODY_FONT, fontSize: 9, color: GREY, align: "right",
    });
    s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.09, fill: { color: BLUE } });
  }
  return s;
}

function eyebrowTitle(s, eyebrow, title) {
  s.addText(eyebrow.toUpperCase(), { x: MX, y: 0.32, w: CW, h: 0.32, fontFace: BODY_FONT, fontSize: 11, bold: true, color: BLUE, charSpacing: 2 });
  s.addText(title, { x: MX, y: 0.62, w: CW, h: 0.72, fontFace: TITLE_FONT, fontSize: 26, bold: true, color: NAVY });
}

function card(s, x, y, w, h, { fill = WHITE, line = BORDER, shadow = true } = {}) {
  s.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.09, fill: { color: fill }, line: { color: line, width: 1 },
    ...(shadow ? { shadow: { ...SHADOW } } : {}),
  });
}

/* Icon tile: rounded card with big icon + label + optional sub. Tones: primary, accent, muted, amber, green */
const TONES = {
  primary: { fill: LIGHT, line: BORDER, icon: BLUE, label: NAVY, sub: GREY },
  accent:  { fill: NAVY,  line: NAVY,   icon: DARK_LABEL, label: WHITE, sub: DARK_SUB },
  muted:   { fill: "F4F5F7", line: "DADDE2", icon: GREY, label: NAVY, sub: GREY },
  amber:   { fill: AMBER_LIGHT, line: "FCD34D", icon: AMBER, label: NAVY, sub: GREY },
  green:   { fill: GREEN_LIGHT, line: "86EFAC", icon: GREEN, label: NAVY, sub: GREY },
};

function iconTile(s, x, y, w, h, iconName, label, { tone = "primary", sub, iconSize } = {}) {
  const t = TONES[tone] || TONES.primary;
  card(s, x, y, w, h, { fill: t.fill, line: t.line });
  const iSize = iconSize || Math.min(w, h) * 0.42;
  const iX = x + w / 2 - iSize / 2;
  const iY = y + h * 0.15;
  addIcon(s, iconName, iX, iY, iSize, "#" + t.icon);
  const labelY = iY + iSize + 0.08;
  s.addText(label, {
    x: x + 0.1, y: labelY, w: w - 0.2, h: 0.36,
    fontFace: TITLE_FONT, fontSize: 12.5, bold: true, color: t.label, align: "center", valign: "middle",
  });
  if (sub) {
    s.addText(sub, {
      x: x + 0.1, y: labelY + 0.36, w: w - 0.2, h: h - (labelY + 0.36 - y) - 0.08,
      fontFace: BODY_FONT, fontSize: 10, color: t.sub, align: "center", valign: "top",
    });
  }
}

/* Horizontal chain of icon tiles connected by blue right arrows */
function iconRow(s, items, { x = MX, y, w = CW, h = 1.9, arrow = 0.36 } = {}) {
  const n = items.length;
  const totalArrows = (n - 1) * arrow;
  const tileW = (w - totalArrows) / n;
  items.forEach((it, i) => {
    const tx = x + i * (tileW + arrow);
    iconTile(s, tx, y, tileW, h, it.icon, it.t, { tone: it.tone, sub: it.d });
    if (i < n - 1) {
      s.addShape(pptx.ShapeType.rightArrow, {
        x: tx + tileW + 0.02, y: y + h / 2 - 0.16, w: arrow - 0.04, h: 0.32,
        fill: { color: BLUE }, line: { color: BLUE, width: 0 },
      });
    }
  });
}

/* Vertical chain of icon tiles connected by down arrows */
function iconCol(s, items, { x, y, w, tileH = 0.95, arrow = 0.28 } = {}) {
  items.forEach((it, i) => {
    const ty = y + i * (tileH + arrow);
    const tone = TONES[it.tone || "primary"];
    card(s, x, ty, w, tileH, { fill: tone.fill, line: tone.line });
    addIcon(s, it.icon, x + 0.18, ty + tileH / 2 - 0.24, 0.48, "#" + tone.icon);
    s.addText([
      { text: it.t + (it.d ? "\n" : ""), options: { bold: true, fontSize: 13, color: tone.label, fontFace: TITLE_FONT } },
      ...(it.d ? [{ text: it.d, options: { fontSize: 10.5, color: tone.sub, fontFace: BODY_FONT } }] : []),
    ], { x: x + 0.78, y: ty + 0.08, w: w - 0.9, h: tileH - 0.16, valign: "middle" });
    if (i < items.length - 1) {
      s.addShape(pptx.ShapeType.downArrow, {
        x: x + w / 2 - 0.14, y: ty + tileH + 0.02, w: 0.28, h: arrow - 0.04,
        fill: { color: BLUE }, line: { color: BLUE, width: 0 },
      });
    }
  });
}

/* Fanout: parent tile at top, arrow trunk, then children row */
function iconFanout(s, parent, children, { x = MX, y, w = CW, parentH = 1.4, childH = 1.5, gap = 0.22 } = {}) {
  const pTone = TONES[parent.tone || "accent"];
  const pW = 3.0;
  const pX = x + w / 2 - pW / 2;
  card(s, pX, y, pW, parentH, { fill: pTone.fill, line: pTone.line });
  addIcon(s, parent.icon, pX + 0.2, y + parentH / 2 - 0.32, 0.64, "#" + pTone.icon);
  s.addText(parent.t, {
    x: pX + 0.95, y, w: pW - 1.05, h: parentH,
    fontFace: TITLE_FONT, fontSize: 15, bold: true, color: pTone.label, valign: "middle",
  });
  const trunkY = y + parentH + 0.05;
  s.addShape(pptx.ShapeType.line, { x: x + w / 2, y: trunkY, w: 0, h: 0.35, line: { color: BLUE, width: 2 } });
  const beamY = trunkY + 0.35;
  const n = children.length;
  const totalGap = (n - 1) * gap;
  const cW = (w - totalGap) / n;
  const firstCX = x + cW / 2;
  const lastCX = x + w - cW / 2;
  s.addShape(pptx.ShapeType.line, { x: firstCX, y: beamY, w: lastCX - firstCX, h: 0, line: { color: BLUE, width: 2 } });
  const childY = beamY + 0.05;
  children.forEach((c, i) => {
    const cx = x + i * (cW + gap);
    s.addShape(pptx.ShapeType.line, { x: cx + cW / 2, y: beamY, w: 0, h: 0.28, line: { color: BLUE, width: 2 } });
    iconTile(s, cx, childY + 0.28, cW, childH, c.icon, c.t, { tone: c.tone || "primary", sub: c.d });
  });
}

/* Bulleted list where each item is a single bullet paragraph (safe with bold runs) */
function bulletList(s, items, opts = {}) {
  const runs = [];
  items.forEach((it, idx) => {
    const parts = Array.isArray(it) ? it : [{ text: it }];
    parts.forEach((p, j) => {
      const isFirst = j === 0;
      const isLast = j === parts.length - 1;
      runs.push({
        text: p.text,
        options: {
          ...(p.bold ? { bold: true } : {}),
          ...(p.color ? { color: p.color } : {}),
          ...(isFirst ? { bullet: { code: "25A0" } } : {}),
          ...(isLast ? { breakLine: true } : {}),
        },
      });
    });
  });
  s.addText(runs, {
    fontFace: BODY_FONT, fontSize: opts.fontSize || 14, color: opts.color || NAVY,
    x: opts.x ?? MX, y: opts.y ?? 2.0, w: opts.w ?? CW, h: opts.h ?? 4.0,
    valign: "top", paraSpaceAfter: 6, ...opts.text,
  });
}

/* Wave / ASCII box: keep monospaced for actual waveforms */
function waveBox(s, x, y, w, h, text, { tone = "primary", fontSize = 12 } = {}) {
  const t = TONES[tone];
  card(s, x, y, w, h, { fill: t.fill, line: t.line, shadow: false });
  s.addText(text, {
    x: x + 0.15, y: y + 0.1, w: w - 0.3, h: h - 0.2,
    fontFace: MONO_FONT, fontSize, color: t.label, valign: "middle", align: "center",
  });
}

function keyPoint(s, text, y = H - 1.15) {
  s.addShape(pptx.ShapeType.roundRect, {
    x: MX, y, w: CW, h: 0.66, rectRadius: 0.07, fill: { color: NAVY },
  });
  addIcon(s, "bolt", MX + 0.22, y + 0.18, 0.3, "#" + DARK_LABEL);
  s.addText([
    { text: "KEY POINT   ", options: { bold: true, color: DARK_LABEL, fontSize: 10.5, charSpacing: 1.5 } },
    { text, options: { color: WHITE, fontSize: 12.5 } },
  ], { x: MX + 0.62, y, w: CW - 0.88, h: 0.66, fontFace: BODY_FONT, valign: "middle" });
}

function divider(sectionNo, title, sub, iconName = "bolt") {
  const s = slide();
  s.background = { color: LIGHT };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.09, fill: { color: BLUE } });
  addIcon(s, iconName, MX, 1.7, 0.7);
  s.addText("PART " + sectionNo, { x: MX, y: 2.6, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: 14, bold: true, color: BLUE, charSpacing: 3 });
  s.addText(title, { x: MX, y: 3.05, w: CW, h: 1.0, fontFace: TITLE_FONT, fontSize: 40, bold: true, color: NAVY });
  s.addText(sub, { x: MX, y: 4.1, w: CW - 3, h: 0.8, fontFace: BODY_FONT, fontSize: 15, color: GREY });
  s.addShape(pptx.ShapeType.roundRect, { x: MX, y: 5.0, w: 1.4, h: 0.12, rectRadius: 0.06, fill: { color: BLUE } });
  return s;
}

/* ============================================================ COVER */
{
  const s = slide();
  s.background = { color: NAVY };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.12, fill: { color: BLUE } });
  s.addShape(pptx.ShapeType.roundRect, { x: MX, y: 1.35, w: 3.6, h: 0.5, rectRadius: 0.25, fill: { color: BLUE } });
  s.addText("IT SYSTEMS SUPPORT · POWER FUNDAMENTALS", { x: MX, y: 1.35, w: 3.6, h: 0.5, fontFace: BODY_FONT, fontSize: 10.5, bold: true, color: WHITE, align: "center", valign: "middle", charSpacing: 1 });
  s.addText("How a PSU Works", { x: MX, y: 2.05, w: CW, h: 1.2, fontFace: TITLE_FONT, fontSize: 48, bold: true, color: WHITE });
  s.addText("From the wall socket to every component — including a deep dive on the Rectifier and MOSFET.", {
    x: MX, y: 3.35, w: 9.0, h: 0.9, fontFace: BODY_FONT, fontSize: 17, color: DARK_SUB,
  });
  addIcon(s, "psu", 10.4, 1.6, 2.2, "#" + DARK_LINE);
  addIcon(s, "bolt", 11.8, 3.9, 0.9, "#" + DARK_LABEL);
  s.addShape(pptx.ShapeType.line, { x: MX, y: 4.75, w: CW, h: 0, line: { color: DARK_LINE, width: 1 } });
  const meta = [
    ["MODULE", "PSU & Power Delivery"],
    ["REGION", "South Africa (230 V AC)"],
    ["LEVEL", "Foundational — IT Support"],
    ["AUDIENCE", "Learners & Technicians"],
  ];
  meta.forEach(([k, v], i) => {
    const x = MX + i * (CW / 4);
    s.addText(k, { x, y: 5.0, w: CW / 4 - 0.2, h: 0.3, fontFace: BODY_FONT, fontSize: 10, bold: true, color: DARK_LABEL, charSpacing: 2 });
    s.addText(v, { x, y: 5.3, w: CW / 4 - 0.2, h: 0.35, fontFace: BODY_FONT, fontSize: 13.5, color: WHITE });
  });
  s.addText("Investec · IT Systems Support · Learning content", {
    x: MX, y: H - 0.55, w: CW, h: 0.35, fontFace: BODY_FONT, fontSize: 10.5, color: DARK_MUTED,
  });
}

/* =========================================================== ROADMAP */
{
  const s = slide();
  eyebrowTitle(s, "What we will cover", "The journey of electricity through your PC");
  iconRow(s, [
    { icon: "outlet", t: "Wall Outlet", d: "230 V AC" },
    { icon: "psu", t: "PSU", d: "Filter · Rectify · Regulate" },
    { icon: "motherboard", t: "Motherboard", d: "Distribution" },
    { icon: "cpu", t: "Components", d: "CPU · GPU · Drives" },
  ], { y: 2.0, h: 2.0 });

  const parts = [
    { icon: "psu", t: "Part 1 — Inside the PSU", d: "8 steps from wall power to stable DC rails." },
    { icon: "chip", t: "Part 2 — Where power goes", d: "Motherboard, CPU, GPU, storage and fans." },
    { icon: "diode", t: "Part 3 — Rectifier deep dive", d: "AC → DC using diodes and a bridge rectifier." },
    { icon: "transistor", t: "Part 4 — MOSFET deep dive", d: "The high-speed switch that makes it all work." },
  ];
  const cw = (CW - 0.66) / 4;
  parts.forEach((p, i) => {
    const cx = MX + i * (cw + 0.22);
    iconTile(s, cx, 4.4, cw, 2.1, p.icon, p.t, { tone: "primary", sub: p.d });
  });
}

/* =================================================== PART 1 DIVIDER */
divider(1, "Inside the PSU", "Eight steps that turn 230 V wall power into the clean, stable low-voltage DC every component needs.", "psu");

/* ============================================= STEP 1 — WALL POWER */
{
  const s = slide();
  eyebrowTitle(s, "Step 1", "Power comes from the wall");
  iconRow(s, [
    { icon: "outlet", t: "Wall Outlet", d: "230 V AC (South Africa)" },
    { icon: "cable", t: "Power Cable", d: "Carries AC to the PC" },
    { icon: "psu", t: "Power Supply Unit", d: "Where the magic happens" },
  ], { y: 1.85, h: 2.1 });

  bulletList(s, [
    [{ text: "South African wall sockets provide " }, { text: "230 Volts AC (Alternating Current)", bold: true }, { text: "." }],
    [{ text: "AC means the electricity constantly changes direction about " }, { text: "50 times every second (50 Hz)", bold: true }, { text: "." }],
    [{ text: "Computer components " }, { text: "cannot use AC power", bold: true }, { text: "." }],
  ], { y: 4.35, h: 1.7, fontSize: 15 });

  keyPoint(s, "The wall gives us alternating current — but PCs can only run on direct current (DC).");
}

/* ================================================ STEP 2 — EMI FILTER */
{
  const s = slide();
  eyebrowTitle(s, "Step 2", "The PSU filters the electricity");
  s.addText("The electricity first enters an EMI Filter.", {
    x: MX, y: 1.35, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: 15, color: NAVY,
  });
  iconRow(s, [
    { icon: "bolt", t: "Dirty Electricity", d: "Noise · Spikes · Interference", tone: "amber" },
    { icon: "filter", t: "EMI Filter", d: "Cleans the incoming power", tone: "primary" },
    { icon: "check", t: "Clean Electricity", d: "Safe for the next stage", tone: "green" },
  ], { y: 1.9, h: 2.1 });

  s.addText("Think of it like a water filter. It removes:", {
    x: MX, y: 4.25, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: 14, color: NAVY,
  });
  bulletList(s, ["electrical noise", "spikes", "interference"], { y: 4.65, h: 1.4, fontSize: 14 });

  keyPoint(s, "Result: dirty electricity in, clean electricity out — like a water filter for power.");
}

/* ================================================ STEP 3 — RECTIFIER */
{
  const s = slide();
  eyebrowTitle(s, "Step 3", "AC becomes DC");
  s.addText("Next comes the Rectifier.", { x: MX, y: 1.35, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: 15, color: NAVY });

  iconRow(s, [
    { icon: "sineWave", t: "230 V AC", d: "Back and forth", tone: "amber" },
    { icon: "bridgeRect", t: "Rectifier", d: "One-way gate", tone: "primary" },
    { icon: "dcLine", t: "320 V DC", d: "One direction only", tone: "green" },
  ], { y: 1.9, h: 2.2 });

  bulletList(s, [
    "AC moves back and forth.",
    "DC only moves one direction.",
    [{ text: "Computers only work on " }, { text: "Direct Current (DC).", bold: true }],
  ], { y: 4.4, h: 1.6, fontSize: 15 });

  keyPoint(s, "The rectifier converts 230 V AC into roughly 320 V DC — one direction only.");
}

/* ================================================ STEP 4 — MOSFET CHOP */
{
  const s = slide();
  eyebrowTitle(s, "Step 4", "High voltage is chopped into tiny pulses");
  bulletList(s, [
    [{ text: "The PSU uses " }, { text: "high-speed transistors (MOSFETs)", bold: true }, { text: "." }],
    "Instead of using the electricity directly, it rapidly turns it ON / OFF / ON / OFF…",
    [{ text: "…about " }, { text: "50,000 – 500,000 times every second", bold: true }, { text: "." }],
    "This creates high-frequency electricity.",
    "Why? Because high frequency allows the transformer to be much smaller and more efficient.",
  ], { y: 1.5, h: 2.4, fontSize: 14 });

  iconRow(s, [
    { icon: "transistor", t: "MOSFET", d: "Ultra-fast switch", tone: "primary" },
    { icon: "squarePulse", t: "ON / OFF Pulses", d: "50 kHz – 500 kHz", tone: "accent" },
    { icon: "transformer", t: "Small Transformer", d: "Efficient · Compact", tone: "green" },
  ], { y: 4.0, h: 2.1 });

  keyPoint(s, "Chopping DC into rapid pulses lets a tiny transformer do the work of a huge one.");
}

/* =============================================== STEP 5 — TRANSFORMER */
{
  const s = slide();
  eyebrowTitle(s, "Step 5", "Transformer lowers the voltage");
  s.addText("The transformer reduces the voltage. Example:", {
    x: MX, y: 1.35, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: 15, color: NAVY,
  });

  iconFanout(s,
    { icon: "transformer", t: "Transformer" },
    [
      { icon: "bolt", t: "+12 V", d: "Motors & high power", tone: "primary" },
      { icon: "bolt", t: "+5 V",  d: "Electronics", tone: "primary" },
      { icon: "bolt", t: "+3.3 V", d: "Chips & logic", tone: "primary" },
    ],
    { y: 1.9, w: CW, parentH: 1.2, childH: 1.5, gap: 0.4 }
  );

  keyPoint(s, "Now we have the voltages a computer actually needs: +12 V, +5 V and +3.3 V.");
}

/* =============================================== STEP 6 — CAPACITORS */
{
  const s = slide();
  eyebrowTitle(s, "Step 6", "Output filters smooth everything");
  s.addText("Capacitors remove tiny ripples.", { x: MX, y: 1.35, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: 15, color: NAVY });

  iconRow(s, [
    { icon: "sineWave", t: "Rough DC", d: "Ripples remain", tone: "amber" },
    { icon: "capacitor", t: "Capacitors", d: "Absorb & release", tone: "primary" },
    { icon: "dcLine", t: "Smooth DC", d: "Stable output", tone: "green" },
  ], { y: 1.9, h: 2.1 });

  bulletList(s, [
    "This is extremely important.",
    [{ text: "The CPU needs " }, { text: "very stable electricity", bold: true }, { text: "." }],
    "Even tiny fluctuations can crash a computer.",
  ], { y: 4.35, h: 1.6, fontSize: 15 });

  keyPoint(s, "Capacitors turn rippled DC into a rock-steady voltage that CPUs demand.");
}

/* ======================================== STEP 7 — VOLTAGE REGULATORS */
{
  const s = slide();
  eyebrowTitle(s, "Step 7", "Voltage regulators keep everything constant");
  s.addText("Suppose your wall voltage changes. Instead of a wobbling output…", {
    x: MX, y: 1.35, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: 15, color: NAVY,
  });

  const halfW = (CW - 0.5) / 2;
  iconTile(s, MX, 1.9, halfW, 2.7, "gaugeWobble", "Without Regulation", {
    tone: "amber",
    sub: "12.0 V  →  11.5 V  →  12.7 V  →  11.8 V  →  12.3 V",
  });
  iconTile(s, MX + halfW + 0.5, 1.9, halfW, 2.7, "gaugeSteady", "With Regulation", {
    tone: "green",
    sub: "12.00 V  ·  12.01 V  ·  11.99 V  ·  12.00 V",
  });
  s.addShape(pptx.ShapeType.rightArrow, {
    x: MX + halfW + 0.08, y: 1.9 + 2.7 / 2 - 0.17, w: 0.34, h: 0.34, fill: { color: BLUE },
  });

  s.addText("…the PSU constantly adjusts itself so the output stays almost perfectly stable.", {
    x: MX, y: 4.8, w: CW, h: 0.5, fontFace: BODY_FONT, fontSize: 14, color: NAVY, align: "center",
  });

  keyPoint(s, "The regulator watches the output non-stop and corrects it thousands of times per second.");
}

/* ===================================== STEP 8 — DISTRIBUTES POWER */
{
  const s = slide();
  eyebrowTitle(s, "Step 8", "The PSU sends power to every component");
  s.addText("Different components need different voltages.", {
    x: MX, y: 1.35, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: 15, color: NAVY,
  });

  iconFanout(s,
    { icon: "psu", t: "PSU", tone: "accent" },
    [
      { icon: "motherboard", t: "Motherboard", d: "CPU · RAM · Fans", tone: "primary" },
      { icon: "gpu",         t: "GPU",         d: "Graphics card",   tone: "primary" },
      { icon: "hdd",         t: "Drives",      d: "SSD / HDD",       tone: "primary" },
    ],
    { y: 1.9, w: CW, parentH: 1.2, childH: 1.7, gap: 0.4 }
  );

  keyPoint(s, "The PSU is the central hub — every component ultimately gets its energy from here.");
}

/* =================================================== PART 2 DIVIDER */
divider(2, "Where the power goes", "Each rail (+12 V, +5 V, +3.3 V) feeds different components. Here is who uses what — and how.", "chip");

/* ==================================================== +12 V RAIL */
{
  const s = slide();
  eyebrowTitle(s, "Voltage rails · +12 V", "The most powerful rail");
  bulletList(s, [
    "The most powerful rail.",
    "Used by: CPU, GPU, cooling fans, water pumps, motors in HDDs.",
  ], { y: 1.4, h: 0.9, fontSize: 14 });

  iconFanout(s,
    { icon: "bolt", t: "+12 V", tone: "accent" },
    [
      { icon: "cpu", t: "CPU", tone: "primary" },
      { icon: "gpu", t: "GPU", tone: "primary" },
      { icon: "fan", t: "Fans", tone: "primary" },
      { icon: "hdd", t: "HDD Motors", tone: "primary" },
    ],
    { y: 2.5, w: CW, parentH: 1.1, childH: 1.5, gap: 0.3 }
  );
  keyPoint(s, "+12 V does the heavy lifting — CPUs, GPUs, fans and hard drive motors all pull from here.");
}

/* ==================================================== +5 V RAIL */
{
  const s = slide();
  eyebrowTitle(s, "Voltage rails · +5 V", "Used for electronics");
  s.addText("Used for electronics.", { x: MX, y: 1.4, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: 14, color: NAVY });

  iconFanout(s,
    { icon: "bolt", t: "+5 V", tone: "accent" },
    [
      { icon: "ssd", t: "SSD", tone: "primary" },
      { icon: "hdd", t: "HDD Logic Board", tone: "primary" },
      { icon: "usb", t: "USB Devices", tone: "primary" },
      { icon: "bolt", t: "RGB Controllers", tone: "primary" },
    ],
    { y: 2.0, w: CW, parentH: 1.1, childH: 1.5, gap: 0.3 }
  );
  keyPoint(s, "+5 V powers the digital electronics inside drives, USB ports and RGB.");
}

/* ==================================================== +3.3 V RAIL */
{
  const s = slide();
  eyebrowTitle(s, "Voltage rails · +3.3 V", "Used by small chips");
  s.addText("Used by small chips.", { x: MX, y: 1.4, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: 14, color: NAVY });

  iconFanout(s,
    { icon: "bolt", t: "+3.3 V", tone: "accent" },
    [
      { icon: "ram", t: "RAM Electronics", tone: "primary" },
      { icon: "chip", t: "Motherboard Chipset", tone: "primary" },
      { icon: "bios", t: "BIOS Chip", tone: "primary" },
      { icon: "pcie", t: "PCIe Logic", tone: "primary" },
    ],
    { y: 2.0, w: CW, parentH: 1.1, childH: 1.5, gap: 0.3 }
  );
  keyPoint(s, "+3.3 V feeds the low-power chips and logic that run RAM, chipset, BIOS and PCIe.");
}

/* ============================================ MOTHERBOARD DISTRIBUTION */
{
  const s = slide();
  eyebrowTitle(s, "Distribution", "How the motherboard distributes power");
  s.addText("The motherboard receives power from the PSU and acts like a power distribution board.", {
    x: MX, y: 1.4, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: 14, color: NAVY,
  });

  iconRow(s, [
    { icon: "psu", t: "PSU", d: "+12 V · +5 V · +3.3 V", tone: "accent" },
    { icon: "motherboard", t: "Motherboard", d: "Power distribution board", tone: "primary" },
  ], { y: 1.9, h: 1.9, w: CW * 0.7, x: MX + CW * 0.15 });

  iconFanout(s,
    { icon: "motherboard", t: "Motherboard", tone: "accent" },
    [
      { icon: "cpu", t: "CPU", tone: "primary" },
      { icon: "ram", t: "RAM", tone: "primary" },
      { icon: "chip", t: "Chipset", tone: "primary" },
      { icon: "pcie", t: "PCIe Slots", tone: "primary" },
      { icon: "usb", t: "USB Ports", tone: "primary" },
    ],
    { y: 4.05, w: CW, parentH: 0.9, childH: 1.4, gap: 0.22 }
  );
}

/* ============================================ CPU POWER (VRM) */
{
  const s = slide();
  eyebrowTitle(s, "CPU power is special", "The motherboard steps 12 V down for the CPU");
  bulletList(s, [
    [{ text: "Although the PSU sends " }, { text: "12 V", bold: true }, { text: ", the CPU " }, { text: "cannot use 12 V directly", bold: true }, { text: "." }],
    "Modern CPUs usually need about 0.8 V, 1.0 V, 1.1 V or 1.2 V.",
    [{ text: "So the motherboard contains " }, { text: "VRMs (Voltage Regulator Modules)", bold: true }, { text: "." }],
    "The VRM acts like a precision power converter.",
  ], { y: 1.4, h: 2.0, fontSize: 14 });

  iconRow(s, [
    { icon: "psu", t: "PSU", d: "12 V", tone: "accent" },
    { icon: "regulator", t: "VRM", d: "Precision converter", tone: "primary" },
    { icon: "cpu", t: "CPU", d: "~1.1 V", tone: "green" },
  ], { y: 3.7, h: 2.2 });

  keyPoint(s, "The VRM converts 12 V from the PSU into the ~1.1 V the CPU actually runs on.");
}

/* ============================================ GPU POWER */
{
  const s = slide();
  eyebrowTitle(s, "GPU power", "Graphics cards receive 12 V and regulate it internally");
  iconRow(s, [
    { icon: "psu", t: "PSU", d: "12 V", tone: "accent" },
    { icon: "cable", t: "PCIe Cable", d: "Dedicated GPU power", tone: "primary" },
    { icon: "gpu", t: "GPU", d: "Internal regulators", tone: "primary" },
    { icon: "chip", t: "Core · Memory · Controllers", d: "Final destination", tone: "green" },
  ], { y: 1.85, h: 2.2 });

  bulletList(s, [
    "Graphics cards also receive 12 V.",
    "Internal voltage regulators feed the GPU core, memory and controllers.",
    [{ text: "A high-end graphics card may consume " }, { text: "300–600 watts", bold: true }, { text: ", so it has its own dedicated power connectors." }],
  ], { y: 4.4, h: 1.7, fontSize: 14 });

  keyPoint(s, "High-end GPUs pull hundreds of watts — they get their own PCIe power cables.");
}

/* ============================================ SSD POWER */
{
  const s = slide();
  eyebrowTitle(s, "SSD power", "Very simple — one voltage only");
  iconRow(s, [
    { icon: "psu", t: "PSU", d: "5 V", tone: "accent" },
    { icon: "ssd", t: "SSD Controller", d: "Flash memory", tone: "primary" },
  ], { y: 2.0, h: 2.4, w: CW * 0.75, x: MX + CW * 0.125 });

  s.addText("An SSD is much simpler. Very little power is needed.", {
    x: MX, y: 5.0, w: CW, h: 0.5, fontFace: BODY_FONT, fontSize: 15, color: NAVY, align: "center",
  });

  keyPoint(s, "SSDs have no motors — 5 V is enough for the controller and flash memory.");
}

/* ============================================ HDD POWER */
{
  const s = slide();
  eyebrowTitle(s, "HDD power", "Hard drives need two voltages");
  const halfW = (CW - 0.5) / 2;
  iconTile(s, MX, 1.9, halfW, 2.7, "hdd", "12 V — Spins the platters", { tone: "primary", sub: "The motor uses 12 V" });
  iconTile(s, MX + halfW + 0.5, 1.9, halfW, 2.7, "chip", "5 V — Runs the electronics", { tone: "primary", sub: "The controller chip uses 5 V" });

  s.addText("Hard drives need two voltages — one for the motor, one for the electronics.", {
    x: MX, y: 4.85, w: CW, h: 0.5, fontFace: BODY_FONT, fontSize: 15, color: NAVY, align: "center",
  });

  keyPoint(s, "Anything with a motor (HDD, fans, pumps) needs 12 V. Logic still runs on 5 V.");
}

/* ============================================ FANS */
{
  const s = slide();
  eyebrowTitle(s, "Fans", "Fans use 12 V");
  iconRow(s, [
    { icon: "psu", t: "PSU", d: "12 V", tone: "accent" },
    { icon: "fan", t: "Motor", d: "Converts current to rotation", tone: "primary" },
    { icon: "fan", t: "Fan Spins", d: "Cooling airflow", tone: "green" },
  ], { y: 2.0, h: 2.4 });

  s.addText("The motherboard can change the voltage or use PWM signals to control fan speed.", {
    x: MX, y: 5.0, w: CW, h: 0.5, fontFace: BODY_FONT, fontSize: 15, color: NAVY, align: "center",
  });

  keyPoint(s, "Fan speed is controlled by adjusting the voltage or using PWM signals.");
}

/* ============================================ COMPLETE POWER JOURNEY */
{
  const s = slide();
  eyebrowTitle(s, "Summary", "The complete power journey");

  const leftItems = [
    { icon: "outlet", t: "Wall Outlet — 230 V AC", tone: "amber" },
    { icon: "filter", t: "EMI Filter", tone: "primary" },
    { icon: "bridgeRect", t: "Rectifier (AC → DC)", tone: "primary" },
    { icon: "transistor", t: "High-Speed Switching (MOSFETs)", tone: "primary" },
    { icon: "transformer", t: "Transformer (steps down)", tone: "primary" },
  ];
  const rightItems = [
    { icon: "diode", t: "Rectifiers", tone: "primary" },
    { icon: "capacitor", t: "Capacitors (smoothing)", tone: "primary" },
    { icon: "regulator", t: "Voltage Regulators", tone: "primary" },
    { icon: "bolt", t: "+12 V · +5 V · +3.3 V", tone: "green" },
    { icon: "motherboard", t: "Motherboard · GPU · SSD · HDD · Fans · USB", tone: "accent" },
  ];
  const colW = (CW - 0.5) / 2;
  iconCol(s, leftItems, { x: MX, y: 1.5, w: colW, tileH: 0.85, arrow: 0.22 });
  iconCol(s, rightItems, { x: MX + colW + 0.5, y: 1.5, w: colW, tileH: 0.85, arrow: 0.22 });
}

/* ============================================ WATER ANALOGY */
{
  const s = slide();
  eyebrowTitle(s, "Simple analogy", "Imagine your house has a water treatment plant");

  const items = [
    { icon: "river", t: "Wall outlet", d: "A large river", tone: "amber" },
    { icon: "plant", t: "PSU", d: "Cleans & controls water", tone: "primary" },
    { icon: "pipe",  t: "Pipes", d: "PSU cables",          tone: "primary" },
    { icon: "house", t: "Motherboard", d: "City water network", tone: "primary" },
    { icon: "cpu",   t: "Buildings", d: "CPU · GPU · SSD · RAM", tone: "green" },
  ];
  const cw = (CW - 0.22 * 4) / 5;
  items.forEach((it, i) => {
    iconTile(s, MX + i * (cw + 0.22), 1.85, cw, 2.4, it.icon, it.t, { tone: it.tone, sub: it.d });
  });

  s.addText([
    { text: "The PSU makes sure ", options: { color: NAVY } },
    { text: "every component gets exactly the right amount of clean, stable power", options: { color: NAVY, bold: true } },
    { text: ". Too much power could damage the component, too little power could cause crashes, so the PSU continuously regulates and distributes electricity safely throughout the computer.", options: { color: NAVY } },
  ], { x: MX, y: 4.55, w: CW, h: 1.6, fontFace: BODY_FONT, fontSize: 13.5, valign: "top", lineSpacingMultiple: 1.2 });

  keyPoint(s, "PSU = water treatment plant · Cables = pipes · Motherboard = city network · Components = buildings.");
}

/* =================================================== PART 3 DIVIDER */
divider(3, "Rectifier deep dive", "The one-way gate for electricity — how diodes turn AC into DC.", "bridgeRect");

/* ============================================ WHAT IS A RECTIFIER */
{
  const s = slide();
  eyebrowTitle(s, "1. What is a Rectifier?", "The one-way gate for electricity");
  bulletList(s, [
    [{ text: "A " }, { text: "rectifier", bold: true }, { text: " is like a " }, { text: "one-way gate", bold: true }, { text: " for electricity." }],
    [{ text: "Electricity from your wall outlet moves " }, { text: "forward and backward", bold: true }, { text: " (AC)." }],
    [{ text: "A rectifier only allows electricity to move " }, { text: "forward", bold: true }, { text: ", turning it into DC." }],
    "Think of it like a revolving door at a stadium.",
  ], { y: 1.4, h: 2.2, fontSize: 14 });

  const items = [
    { icon: "swap",  t: "AC", d: "People walking in and out", tone: "amber" },
    { icon: "door",  t: "Rectifier", d: "Security lets people through one way", tone: "primary" },
    { icon: "arrowRight", t: "DC", d: "Everyone walking the same way", tone: "green" },
  ];
  const cw = (CW - 0.44) / 3;
  items.forEach((it, i) => {
    iconTile(s, MX + i * (cw + 0.22), 4.05, cw, 2.1, it.icon, it.t, { tone: it.tone, sub: it.d });
  });
}

/* ============================================ BEFORE THE RECTIFIER */
{
  const s = slide();
  eyebrowTitle(s, "Before the Rectifier (AC)", "Electricity keeps changing direction");
  iconRow(s, [
    { icon: "swap", t: "→ ← → ← → ←", d: "AC current flow", tone: "amber" },
    { icon: "sineWave", t: "Sine Waveform", d: "Positive then negative", tone: "amber" },
  ], { y: 1.9, h: 2.3 });

  waveBox(s, MX, 4.35, CW, 1.4,
    "Voltage:      /\\        /\\\n            /  \\      /  \\\n___________/    \\____/    \\___\n                \\    /\n                 \\  /\n                  \\/",
    { tone: "amber", fontSize: 10 }
  );

  bulletList(s, [
    "The voltage goes positive…",
    "then negative…",
    "50 times every second.",
  ], { y: 5.85, h: 1.1, fontSize: 13 });
}

/* ============================================ AFTER THE RECTIFIER */
{
  const s = slide();
  eyebrowTitle(s, "After the Rectifier (DC)", "Electricity only flows in one direction");
  iconRow(s, [
    { icon: "arrowRight", t: "→ → → → → →", d: "One direction", tone: "green" },
    { icon: "dcLine", t: "Flat DC Waveform", d: "Steady, forward only", tone: "green" },
  ], { y: 1.9, h: 2.3 });

  waveBox(s, MX, 4.35, CW, 1.0, "────────────────────────────────", { tone: "green", fontSize: 14 });

  s.addText("Now the computer can use it.", {
    x: MX, y: 5.6, w: CW, h: 0.5, fontFace: BODY_FONT, fontSize: 16, bold: true, color: NAVY, align: "center",
  });
}

/* ============================================ HOW A RECTIFIER WORKS */
{
  const s = slide();
  eyebrowTitle(s, "How does a Rectifier work?", "Diodes — one-way valves for electricity");

  bulletList(s, [
    [{ text: "Inside are special electronic parts called " }, { text: "diodes", bold: true }, { text: "." }],
    [{ text: "A diode behaves like a " }, { text: "one-way valve", bold: true }, { text: " — forward is allowed, backward is blocked." }],
    [{ text: "A PSU usually uses " }, { text: "four diodes", bold: true }, { text: " arranged in a " }, { text: "Bridge Rectifier", bold: true }, { text: "." }],
    [{ text: "This converts " }, { text: "230 V AC", bold: true }, { text: " into approximately " }, { text: "320 V DC", bold: true }, { text: "." }],
  ], { y: 1.4, h: 2.2, fontSize: 14 });

  iconRow(s, [
    { icon: "arrowRight", t: "Forward", d: "Allowed", tone: "green" },
    { icon: "diode", t: "Diode", d: "One-way valve", tone: "primary" },
    { icon: "dismiss", t: "Backward", d: "Blocked", tone: "muted" },
    { icon: "bridgeRect", t: "Bridge Rectifier", d: "Four diodes together", tone: "accent" },
  ], { y: 3.9, h: 2.2 });

  keyPoint(s, "Four diodes wired as a bridge convert 230 V AC into ~320 V DC.");
}

/* ============================================ WHERE IN THE PSU */
{
  const s = slide();
  eyebrowTitle(s, "Where is the rectifier inside the PSU?", "Location in the power chain");
  const colW = 3.8;
  iconCol(s, [
    { icon: "outlet", t: "Wall Outlet", tone: "amber" },
    { icon: "filter", t: "EMI Filter", tone: "primary" },
    { icon: "bridgeRect", t: "Rectifier", d: "You are here", tone: "accent" },
    { icon: "transistor", t: "MOSFETs", tone: "primary" },
  ], { x: W / 2 - colW / 2, y: 1.5, w: colW, tileH: 1.05, arrow: 0.28 });

  keyPoint(s, "The rectifier sits after the EMI filter and before the high-speed MOSFET switches.");
}

/* =================================================== PART 4 DIVIDER */
divider(4, "MOSFET deep dive", "The impossibly-fast electronic switch that makes the modern PSU possible.", "transistor");

/* ============================================ WHAT ARE MOSFETS */
{
  const s = slide();
  eyebrowTitle(s, "2. What are MOSFETs?", "Metal-Oxide-Semiconductor Field-Effect Transistor");

  card(s, MX, 1.5, CW, 1.1, { fill: LIGHT });
  s.addText([
    { text: "MOSFET stands for:  ", options: { color: NAVY, fontSize: 14 } },
    { text: "Metal-Oxide-Semiconductor Field-Effect Transistor", options: { color: NAVY, bold: true, fontSize: 15 } },
  ], { x: MX + 0.3, y: 1.5, w: CW - 0.6, h: 1.1, fontFace: BODY_FONT, valign: "middle" });

  s.addText("That sounds complicated, but its job is actually simple.", {
    x: MX, y: 2.85, w: CW, h: 0.5, fontFace: BODY_FONT, fontSize: 15, italic: true, color: GREY, align: "center",
  });

  iconRow(s, [
    { icon: "transistor", t: "MOSFET", d: "A transistor", tone: "primary" },
    { icon: "lightswitch", t: "Electronic Switch", d: "ON / OFF at incredible speed", tone: "accent" },
  ], { y: 3.7, h: 2.4, w: CW * 0.75, x: MX + CW * 0.125 });
}

/* ============================================ MOSFET SIMPLE EXPLANATION */
{
  const s = slide();
  eyebrowTitle(s, "MOSFET · Simple explanation", "An extremely fast electronic switch");
  bulletList(s, [
    [{ text: "A MOSFET is an " }, { text: "extremely fast electronic switch", bold: true }, { text: "." }],
    "Imagine someone turning a light switch on and off: ON / OFF / ON / OFF.",
    "A human can do this maybe once every second.",
  ], { y: 1.4, h: 1.6, fontSize: 14 });

  const halfW = (CW - 0.5) / 2;
  iconTile(s, MX, 3.1, halfW, 2.8, "lightswitch", "Human", {
    tone: "muted",
    sub: "≈ 1 switch per second",
  });
  iconTile(s, MX + halfW + 0.5, 3.1, halfW, 2.8, "transistor", "MOSFET", {
    tone: "green",
    sub: "100,000  ·  200,000  ·  300,000  ·  500,000 times every second",
  });
  s.addShape(pptx.ShapeType.rightArrow, {
    x: MX + halfW + 0.08, y: 3.1 + 2.8 / 2 - 0.17, w: 0.34, h: 0.34, fill: { color: BLUE },
  });

  keyPoint(s, "A MOSFET can switch hundreds of thousands of times per second — far beyond human speed.");
}

/* ============================================ WHY SWITCH SO FAST */
{
  const s = slide();
  eyebrowTitle(s, "Why switch so fast?", "Because it makes the transformer tiny and efficient");
  s.addText("The PSU needs to reduce the voltage. Instead of using a huge transformer like older power supplies, modern PSUs:", {
    x: MX, y: 1.4, w: CW, h: 0.8, fontFace: BODY_FONT, fontSize: 14, color: NAVY,
  });

  const items = [
    { icon: "bridgeRect", t: "1. Convert", d: "AC to DC", tone: "primary" },
    { icon: "squarePulse", t: "2. Chop", d: "DC into tiny pulses", tone: "primary" },
    { icon: "transformer", t: "3. Send", d: "Pulses through a small transformer", tone: "primary" },
  ];
  const cw = (CW - 0.44) / 3;
  items.forEach((it, i) => iconTile(s, MX + i * (cw + 0.22), 2.3, cw, 1.9, it.icon, it.t, { tone: it.tone, sub: it.d }));

  s.addText("This makes the PSU:", { x: MX, y: 4.4, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: 14, bold: true, color: NAVY });
  bulletList(s, ["much smaller", "much lighter", "more efficient", "cooler"], { y: 4.8, h: 1.3, fontSize: 13 });
}

/* ============================================ MOSFET WAVEFORM */
{
  const s = slide();
  eyebrowTitle(s, "MOSFET waveform", "Instead of a smooth wave — tiny square pulses");
  s.addText("Instead of a smooth wave…", { x: MX, y: 1.4, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: 14, color: NAVY });
  waveBox(s, MX, 1.85, CW, 0.9, "──────────────────────────────", { tone: "muted", fontSize: 16 });

  s.addText("…the MOSFET creates tiny square pulses:", { x: MX, y: 2.95, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: 14, color: NAVY });
  waveBox(s, MX, 3.4, CW, 1.2, "_|‾|_|‾|_|‾|_|‾|_|‾|_|‾|_|‾|_|‾|_", { tone: "primary", fontSize: 16 });

  s.addText([
    { text: "These pulses can be over ", options: { color: NAVY, fontSize: 15 } },
    { text: "100,000 times per second", options: { color: NAVY, fontSize: 15, bold: true } },
    { text: ".", options: { color: NAVY, fontSize: 15 } },
  ], { x: MX, y: 4.85, w: CW, h: 0.5, fontFace: BODY_FONT, align: "center" });

  keyPoint(s, "MOSFETs replace smooth waves with rapid square pulses — the language of switching PSUs.");
}

/* ============================================ WHY NOT LEAVE ON */
{
  const s = slide();
  eyebrowTitle(s, "Why not leave the electricity on?", "The swimming-pool analogy");
  iconRow(s, [
    { icon: "pool", t: "Filling a Pool", d: "Instead of one huge bucket…", tone: "amber" },
    { icon: "water", t: "Many Tiny Cups", d: "Poured very quickly", tone: "primary" },
    { icon: "check", t: "Easier to Control", d: "Exactly what a MOSFET does", tone: "green" },
  ], { y: 2.0, h: 2.4 });

  bulletList(s, [
    "Imagine filling a swimming pool.",
    "Instead of one huge bucket… you pour many tiny cups very quickly.",
    "It becomes much easier to control.",
    "That's exactly what a MOSFET does with electricity.",
  ], { y: 4.65, h: 1.5, fontSize: 14 });
}

/* ============================================ AFTER THE MOSFET */
{
  const s = slide();
  eyebrowTitle(s, "What happens after the MOSFET?", "It enables the transformer to do its job");
  const colW = 3.8;
  iconCol(s, [
    { icon: "outlet", t: "Wall Outlet", tone: "amber" },
    { icon: "bridgeRect", t: "Rectifier", tone: "primary" },
    { icon: "transistor", t: "MOSFET", d: "You are here", tone: "accent" },
    { icon: "transformer", t: "Transformer", tone: "primary" },
    { icon: "bolt", t: "Low Voltage", tone: "green" },
  ], { x: W / 2 - colW / 2, y: 1.4, w: colW, tileH: 0.95, arrow: 0.22 });

  keyPoint(s, "The transformer only works because the MOSFET is switching so rapidly.");
}

/* ============================================ WHY MOSFETS MATTER */
{
  const s = slide();
  eyebrowTitle(s, "Why are MOSFETs so important?", "They power the modern electronic world");

  s.addText("Without them the PSU would be:", { x: MX, y: 1.4, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: 14, bold: true, color: NAVY });
  bulletList(s, ["much bigger", "heavier", "less efficient", "hotter", "more expensive"],
    { y: 1.85, h: 1.7, fontSize: 13 });

  s.addText("Nearly every modern electronic device uses MOSFETs, including:", {
    x: MX, y: 3.7, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: 14, bold: true, color: NAVY,
  });

  const items = [
    { icon: "psu", t: "Computer PSUs", tone: "primary" },
    { icon: "motherboard", t: "Motherboards", tone: "primary" },
    { icon: "gpu", t: "Graphics cards", tone: "primary" },
    { icon: "psu", t: "Laptop chargers", tone: "primary" },
    { icon: "plug", t: "Phone chargers", tone: "primary" },
    { icon: "bolt", t: "Electric vehicles", tone: "primary" },
    { icon: "bolt", t: "Solar inverters", tone: "primary" },
  ];
  const cw = (CW - 0.16 * 6) / 7;
  items.forEach((it, i) => iconTile(s, MX + i * (cw + 0.16), 4.2, cw, 1.9, it.icon, it.t, { tone: it.tone }));
}

/* ============================================ RECTIFIER VS MOSFET */
{
  const s = slide();
  eyebrowTitle(s, "Rectifier vs MOSFET", "Side-by-side comparison");
  const header = ["Aspect", "Rectifier", "MOSFET"];
  const rows = [
    ["Job", "Converts AC to DC", "Switches DC on and off at very high speed"],
    ["Built from", "Diodes", "Transistors"],
    ["Controls", "Only the direction of current", "When current flows"],
    ["Stage in PSU", "First major conversion stage", "Second major conversion stage"],
    ["Produces", "DC power", "High-frequency pulses"],
  ];
  const tableRows = [
    header.map((t) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: BLUE }, fontFace: TITLE_FONT, fontSize: 13 } })),
    ...rows.map((r, i) => r.map((c) => ({ text: c, options: { color: NAVY, fill: { color: i % 2 ? LIGHT : WHITE }, fontFace: BODY_FONT, fontSize: 12.5 } }))),
  ];
  s.addTable(tableRows, {
    x: MX, y: 1.6, w: CW, colW: [2.2, 4.9, 5.13],
    border: { type: "solid", color: BORDER, pt: 0.75 }, rowH: 0.6, valign: "middle", margin: 0.1,
  });

  keyPoint(s, "Rectifier = converts AC into DC. MOSFET = switches DC on and off very fast.");
}

/* ============================================ COMPLETE PSU PROCESS */
{
  const s = slide();
  eyebrowTitle(s, "The complete PSU process", "End-to-end from wall power to your components");

  const colW = (CW - 0.5) / 2;
  iconCol(s, [
    { icon: "outlet", t: "230 V AC Wall Power", tone: "amber" },
    { icon: "filter", t: "EMI Filter", d: "Removes noise", tone: "primary" },
    { icon: "bridgeRect", t: "Bridge Rectifier", d: "AC → DC", tone: "primary" },
    { icon: "dcLine", t: "320 V DC", tone: "primary" },
    { icon: "transistor", t: "MOSFETs", d: "Fast electronic switches", tone: "primary" },
  ], { x: MX, y: 1.4, w: colW, tileH: 0.85, arrow: 0.2 });

  iconCol(s, [
    { icon: "squarePulse", t: "High-Frequency Pulses", tone: "primary" },
    { icon: "transformer", t: "Transformer", d: "Steps voltage down", tone: "primary" },
    { icon: "diode", t: "Rectifiers & Filters", tone: "primary" },
    { icon: "bolt", t: "Stable +12 V, +5 V, +3.3 V DC", tone: "green" },
    { icon: "motherboard", t: "Motherboard · CPU · GPU · RAM · SSD · Fans", tone: "accent" },
  ], { x: MX + colW + 0.5, y: 1.4, w: colW, tileH: 0.85, arrow: 0.2 });
}

/* ============================================ REMEMBER */
{
  const s = slide();
  eyebrowTitle(s, "A good way to remember them", "Two simple pictures");
  const halfW = (CW - 0.5) / 2;

  card(s, MX, 1.7, halfW, 4.3, { fill: LIGHT });
  addIcon(s, "bridgeRect", MX + halfW / 2 - 0.6, 2.0, 1.2, "#" + BLUE);
  s.addText("Rectifier = Translator", {
    x: MX, y: 3.35, w: halfW, h: 0.5, fontFace: TITLE_FONT, fontSize: 20, bold: true, color: NAVY, align: "center",
  });
  s.addText([
    { text: "Changes the type of electricity from ", options: { color: NAVY, fontSize: 14 } },
    { text: "AC to DC", options: { color: NAVY, fontSize: 14, bold: true } },
    { text: ".", options: { color: NAVY, fontSize: 14 } },
  ], { x: MX + 0.3, y: 3.95, w: halfW - 0.6, h: 1.8, fontFace: BODY_FONT, align: "center", valign: "top" });

  card(s, MX + halfW + 0.5, 1.7, halfW, 4.3, { fill: LIGHT });
  addIcon(s, "transistor", MX + halfW + 0.5 + halfW / 2 - 0.6, 2.0, 1.2, "#" + BLUE);
  s.addText("MOSFET = Super-fast switch", {
    x: MX + halfW + 0.5, y: 3.35, w: halfW, h: 0.5, fontFace: TITLE_FONT, fontSize: 20, bold: true, color: NAVY, align: "center",
  });
  s.addText([
    { text: "Chops that DC into high-frequency pulses so the transformer can efficiently produce the different voltages your PC components need.", options: { color: NAVY, fontSize: 13 } },
  ], { x: MX + halfW + 0.5 + 0.3, y: 3.95, w: halfW - 0.6, h: 1.8, fontFace: BODY_FONT, align: "center", valign: "top" });

  keyPoint(s, "Rectifier = translator (AC → DC). MOSFET = super-fast switch (chops DC into pulses).");
}

/* ============================================ CLOSING */
{
  const s = slide();
  s.background = { color: NAVY };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.12, fill: { color: BLUE } });
  addIcon(s, "psu", W / 2 - 1.1, 1.6, 2.2, "#" + DARK_LABEL);
  s.addText("You now understand how a PSU works.", {
    x: MX, y: 4.1, w: CW, h: 0.9, fontFace: TITLE_FONT, fontSize: 32, bold: true, color: WHITE, align: "center",
  });
  s.addText("From 230 V AC at the wall, through filtering, rectification, MOSFET switching, transformation, smoothing and regulation — to the exact voltages every component needs.", {
    x: MX + 1.0, y: 5.1, w: CW - 2.0, h: 1.2, fontFace: BODY_FONT, fontSize: 15, color: DARK_SUB, align: "center",
  });
  s.addText("Investec · IT Systems Support · Power Fundamentals", {
    x: MX, y: H - 0.55, w: CW, h: 0.35, fontFace: BODY_FONT, fontSize: 10.5, color: DARK_MUTED, align: "center",
  });
}

mkdirSync("public/downloads", { recursive: true });
const out = "public/downloads/How-a-PSU-Works-Rectifier-and-MOSFET.pptx";
await pptx.writeFile({ fileName: out });
console.log("Wrote " + out + " (" + pageNo + " slides)");
