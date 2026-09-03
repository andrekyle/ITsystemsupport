// Generates the FOUR US 114051 deck sets (one per Specific Outcome) in the
// Microsoft Fluent / Learn style — same styling as the US 114050 decks.
// Accessibility rule: NO text below 18pt.
// Run: node scripts/make-114051-ppt.mjs
// Out: public/downloads/US-114051-L{1..4}-*.pptx
import pptxgen from "pptxgenjs";
import { mkdirSync } from "node:fs";
import { DECKS } from "./114051-decks.mjs";

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
const MIN_FONT = 18; // smallest font size used anywhere in the decks

const W = 13.33;
const H = 7.5;
const MX = 0.55;
const CW = W - MX * 2;

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

function iconUri(name, color = "#" + BLUE, sw = 1.4) {
  const body = ICONS[name];
  if (!body) throw new Error(`Unknown icon: ${name}`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  return "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
}

function buildDeck(deck) {
  const pptx = new pptxgen();
  pptx.defineLayout({ name: "WIDE", width: W, height: H });
  pptx.layout = "WIDE";
  pptx.author = "Andre Snell";
  pptx.company = "Investec — Corporate Banking Technology";
  pptx.title = deck.title;

  let pageNo = 0;

  function slide() {
    const s = pptx.addSlide();
    s.background = { color: WHITE };
    pageNo += 1;
    if (pageNo > 1) {
      s.addText("US 114051 · Conduct a technical practitioners meeting · NQF 5 · 4 credits", {
        x: MX, y: H - 0.5, w: CW - 1, h: 0.38, fontFace: BODY_FONT, fontSize: MIN_FONT, color: GREY,
      });
      s.addText(String(pageNo), { x: W - MX - 0.7, y: H - 0.5, w: 0.7, h: 0.38, fontFace: BODY_FONT, fontSize: MIN_FONT, color: GREY, align: "right" });
      s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.09, fill: { color: BLUE } });
    }
    return s;
  }

  function addIcon(s, name, x, y, size = 0.34, color) {
    s.addImage({ data: iconUri(name, color), x, y, w: size, h: size });
  }

  function eyebrowTitle(s, eyebrow, title) {
    s.addText(eyebrow.toUpperCase(), { x: MX, y: 0.26, w: CW, h: 0.38, fontFace: BODY_FONT, fontSize: MIN_FONT, bold: true, color: BLUE, charSpacing: 2 });
    s.addText(title, { x: MX, y: 0.64, w: CW, h: 0.66, fontFace: TITLE_FONT, fontSize: 30, bold: true, color: NAVY });
  }

  function card(s, x, y, w, h, { fill = WHITE, line = BORDER } = {}) {
    s.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.09, fill: { color: fill }, line: { color: line, width: 1 }, shadow: { ...SHADOW } });
  }

  function iconCards(s, items, { x = MX, y = 2.0, w = CW, cols = 4, rowH = 1.6, gap = 0.2, fontSize = MIN_FONT, titleSize = 20 } = {}) {
    const cw = (w - gap * (cols - 1)) / cols;
    items.forEach((it, i) => {
      const cx = x + (i % cols) * (cw + gap);
      const cy = y + Math.floor(i / cols) * (rowH + gap);
      card(s, cx, cy, cw, rowH);
      if (it.d) {
        addIcon(s, it.icon, cx + 0.18, cy + 0.2, 0.38);
        s.addText(it.text, {
          x: cx + 0.66, y: cy + 0.12, w: cw - 0.84, h: 0.85, fontFace: TITLE_FONT, fontSize: titleSize, bold: true, color: NAVY, valign: "middle", lineSpacingMultiple: 1.0,
        });
        s.addText(it.d, {
          x: cx + 0.18, y: cy + 1.02, w: cw - 0.36, h: rowH - 1.16, fontFace: BODY_FONT, fontSize, color: GREY, valign: "top", lineSpacingMultiple: 1.1,
        });
      } else {
        addIcon(s, it.icon, cx + 0.18, cy + rowH / 2 - 0.19, 0.38);
        s.addText(it.text, {
          x: cx + 0.68, y: cy + 0.08, w: cw - 0.86, h: rowH - 0.16, fontFace: BODY_FONT, fontSize, color: NAVY, valign: "middle", lineSpacingMultiple: 1.05,
        });
      }
    });
  }

  function introText(s, text, y = 1.4, h = 0.68) {
    s.addText(text, { x: MX, y, w: CW, h, fontFace: BODY_FONT, fontSize: MIN_FONT, color: GREY, valign: "top", lineSpacingMultiple: 1.15 });
  }

  function dataTable(s, header, rows, { x = MX, y = 2.0, w = CW, colW, fontSize = MIN_FONT, rowH = 0.55 } = {}) {
    const tableRows = [
      header.map((t) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: BLUE }, fontFace: TITLE_FONT, fontSize } })),
      ...rows.map((r, i) => r.map((c) => ({ text: c, options: { color: NAVY, fill: { color: i % 2 ? LIGHT : WHITE }, fontFace: BODY_FONT, fontSize } }))),
    ];
    s.addTable(tableRows, { x, y, w, colW, border: { type: "solid", color: BORDER, pt: 0.75 }, rowH, valign: "middle", margin: 0.09 });
  }

  function bulletItems(items) {
    return items.map((t) => ({ text: t, options: { bullet: { characterCode: "2022", indent: 16 }, color: NAVY, breakLine: true } }));
  }

  function bulletList(s, items, { x = MX, y = 1.7, w = CW, h = 5.0, fontSize = MIN_FONT } = {}) {
    s.addText(bulletItems(items), { x, y, w, h, fontFace: BODY_FONT, fontSize, valign: "top", lineSpacingMultiple: 1.2, paraSpaceAfter: 10 });
  }

  function callout(s, c, y, h = 1.0) {
    card(s, MX, y, CW, h, { fill: LIGHT });
    addIcon(s, c.icon, MX + 0.22, y + h / 2 - 0.19, 0.38);
    s.addText(c.text, {
      x: MX + 0.72, y, w: CW - 0.98, h, fontFace: BODY_FONT, fontSize: MIN_FONT, color: NAVY, valign: "middle", lineSpacingMultiple: 1.1,
    });
  }

  for (const sl of deck.slides) {
    if (sl.type === "cover") {
      const s = slide();
      s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.12, fill: { color: BLUE } });
      s.addShape(pptx.ShapeType.roundRect, { x: MX, y: 1.1, w: 6.6, h: 0.62, rectRadius: 0.31, fill: { color: BLUE } });
      s.addText(sl.pill, { x: MX, y: 1.1, w: 6.6, h: 0.62, fontFace: BODY_FONT, fontSize: MIN_FONT, bold: true, color: WHITE, align: "center", valign: "middle", charSpacing: 1 });
      s.addText(sl.title, { x: MX, y: 1.9, w: 10.8, h: 1.85, fontFace: TITLE_FONT, fontSize: 38, bold: true, color: NAVY });
      s.addText(sl.subtitle, { x: MX, y: 3.8, w: 9.7, h: 0.78, fontFace: BODY_FONT, fontSize: 19, color: GREY, lineSpacingMultiple: 1.15 });
      addIcon(s, sl.icon, 11.0, 1.4, 1.8, "#" + BORDER);
      s.addShape(pptx.ShapeType.line, { x: MX, y: 4.62, w: CW, h: 0, line: { color: BORDER, width: 1 } });
      sl.meta.forEach(([k, v], i) => {
        const x = MX + i * (CW / 4);
        s.addText(k, { x, y: 4.82, w: CW / 4 - 0.2, h: 0.36, fontFace: BODY_FONT, fontSize: MIN_FONT, bold: true, color: BLUE, charSpacing: 0.5, wrap: false });
        s.addText(v, { x, y: 5.2, w: CW / 4 - 0.2, h: 1.0, fontFace: BODY_FONT, fontSize: MIN_FONT, color: NAVY, lineSpacingMultiple: 1.1 });
      });
      s.addText("ITSS Learn · Investec · Corporate Banking Technology", { x: MX, y: H - 0.62, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: MIN_FONT, color: GREY });
    } else if (sl.type === "cards") {
      const s = slide();
      eyebrowTitle(s, sl.eyebrow, sl.title);
      if (sl.intro) introText(s, sl.intro, 1.4, 0.55);
      iconCards(s, sl.items, { y: sl.y ?? 2.0, cols: sl.cols ?? 3, rowH: sl.rowH ?? 2.3 });
      const rowsUsed = Math.ceil(sl.items.length / (sl.cols ?? 3));
      const bottom = (sl.y ?? 2.0) + rowsUsed * ((sl.rowH ?? 2.3) + 0.2);
      if (sl.callout) callout(s, sl.callout, Math.min(bottom, 5.75), 0.95);
      if (sl.note) {
        s.addText(sl.note, { x: MX, y: Math.min(bottom + 0.05, 5.3), w: CW, h: 0.6, fontFace: BODY_FONT, fontSize: MIN_FONT, color: GREY, italic: true, lineSpacingMultiple: 1.15 });
      }
    } else if (sl.type === "bullets") {
      const s = slide();
      eyebrowTitle(s, sl.eyebrow, sl.title);
      bulletList(s, sl.items, { y: sl.y ?? 1.7, h: sl.callout ? 3.4 : 5.0 });
      if (sl.callout) callout(s, sl.callout, 5.35, 1.05);
    } else if (sl.type === "twocol") {
      const s = slide();
      eyebrowTitle(s, sl.eyebrow, sl.title);
      const colW2 = (CW - 0.3) / 2;
      [[sl.left, MX], [sl.right, MX + colW2 + 0.3]].forEach(([col, x]) => {
        card(s, x, 1.7, colW2, 4.9);
        s.addText(col.label, { x: x + 0.25, y: 1.9, w: colW2 - 0.5, h: 0.36, fontFace: BODY_FONT, fontSize: MIN_FONT, bold: true, color: BLUE, charSpacing: 1 });
        s.addText(bulletItems(col.items), { x: x + 0.25, y: 2.3, w: colW2 - 0.5, h: 4.1, fontFace: BODY_FONT, fontSize: MIN_FONT, valign: "top", lineSpacingMultiple: 1.2, paraSpaceAfter: 10 });
      });
    } else if (sl.type === "table") {
      const s = slide();
      eyebrowTitle(s, sl.eyebrow, sl.title);
      if (sl.intro) introText(s, sl.intro, 1.4, 0.55);
      dataTable(s, sl.header, sl.rows, { y: sl.y ?? 1.95, colW: sl.colW, rowH: sl.rowH ?? 0.62 });
    } else if (sl.type === "closing") {
      const s = slide();
      s.background = { color: NAVY };
      s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.12, fill: { color: BLUE } });
      addIcon(s, sl.icon, MX, 1.6, 0.7, "#" + DARK_LABEL);
      s.addText(sl.quote, { x: MX, y: 2.45, w: CW, h: 1.4, fontFace: TITLE_FONT, fontSize: 36, bold: true, color: WHITE });
      s.addText(sl.text, { x: MX, y: 3.95, w: 11.0, h: 1.4, fontFace: BODY_FONT, fontSize: MIN_FONT, color: DARK_SUB, lineSpacingMultiple: 1.25 });
      s.addText("US 114051 · National Certificate: IT — System Support · SAQA ID 48573 · ITSS Learn", {
        x: MX, y: H - 0.62, w: CW, h: 0.4, fontFace: BODY_FONT, fontSize: MIN_FONT, color: DARK_MUTED,
      });
    } else {
      throw new Error(`Unknown slide type: ${sl.type}`);
    }
  }

  return { pptx, pageNo };
}

mkdirSync("public/downloads", { recursive: true });
for (const deck of DECKS) {
  const { pptx, pageNo } = buildDeck(deck);
  const out = `public/downloads/${deck.file}.pptx`;
  await pptx.writeFile({ fileName: out });
  console.log(`Written ${out} — ${pageNo} slides (min font ${MIN_FONT}pt)`);
}
