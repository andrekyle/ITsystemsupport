/*
 * Renders the FOUR US 114051 deck sets as PDFs for the Course material tab,
 * in the same Microsoft Fluent / Learn style as the US 114050 decks and the
 * companion PPTX files (scripts/make-114051-ppt.mjs) — same slides, geometry,
 * colours and iconography. pdfkit draws the icons as vector paths, so no
 * PowerPoint install is needed to produce the PDFs.
 *
 * Run:  npx tsx scripts/make-114051-pdf.ts
 * Out:  public/downloads/US-114051-L{1..4}-*.pdf
 */
import { mkdirSync, createWriteStream } from "node:fs";
import PDFDocument from "pdfkit";
// @ts-expect-error plain-JS data module shared with the PPTX generator
import { DECKS } from "./114051-decks.mjs";

const IN = 72; // points per inch
const W = 13.33 * IN;
const H = 7.5 * IN;
const MX = 0.55;
const CW_IN = 13.33 - MX * 2;

const BLUE = "#0F6CBD";
const NAVY = "#002050";
const LIGHT = "#EAF4FF";
const GREY = "#6B7280";
const WHITE = "#FFFFFF";
const BORDER = "#D5E3F2";
const DARK_LABEL = "#8CC2F0";
const DARK_SUB = "#B9D6F2";
const DARK_MUTED = "#6E93BC";

const TITLE_FONT = "Helvetica-Bold";
const BODY_FONT = "Helvetica";
const BODY_ITALIC = "Helvetica-Oblique";
const MIN_FONT = 18;

/* Fluent icon set — same 24-unit stroke icons as the PPTX generator. */
const ICONS: Record<string, string> = {
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="0.8"/>',
  briefcase: '<rect x="3.5" y="7" width="17" height="13" rx="1.8"/><path d="M9 7V5.6A1.6 1.6 0 0 1 10.6 4h2.8A1.6 1.6 0 0 1 15 5.6V7M3.5 12h17"/>',
  check: '<circle cx="12" cy="12" r="8.5"/><path d="m8.3 12.4 2.5 2.5 4.9-5.3"/>',
  folder: '<path d="M3.5 6.5A1.5 1.5 0 0 1 5 5h4l2 2.5h8A1.5 1.5 0 0 1 20.5 9v9a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18z"/>',
  people: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5"/><circle cx="16.8" cy="9.2" r="2.4"/><path d="M16.3 14.7c2.2.2 3.8 1.5 4.3 4.3"/>',
  shield: '<path d="M12 3l7 2.8v5.4c0 4.5-3 7.9-7 9.8-4-1.9-7-5.3-7-9.8V5.8z"/><path d="m9.2 11.8 2 2 3.6-4"/>',
  pen: '<path d="M4 20l1-4L16.5 4.5a2.12 2.12 0 0 1 3 3L8 19l-4 1z"/><path d="m14.5 6.5 3 3"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.2 2"/>',
  chart: '<path d="M4 4v16h16"/><path d="M8 16v-5M12 16V7M16 16v-8"/>',
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

interface TextOpts {
  font?: string;
  size?: number;
  color?: string;
  align?: "left" | "center" | "right";
  valign?: "top" | "middle";
  lineGap?: number;
  charSpacing?: number;
  /** render on a single line even if wider than the box */
  noWrap?: boolean;
}

interface CardItem {
  icon: string;
  text: string;
  d?: string;
}

type Slide =
  | { type: "cover"; pill: string; title: string; subtitle: string; icon: string; meta: [string, string][] }
  | { type: "cards"; eyebrow: string; title: string; intro?: string; cols?: number; rowH?: number; y?: number; items: CardItem[]; callout?: { icon: string; text: string }; note?: string }
  | { type: "bullets"; eyebrow: string; title: string; y?: number; items: string[]; callout?: { icon: string; text: string } }
  | { type: "twocol"; eyebrow: string; title: string; left: { label: string; items: string[] }; right: { label: string; items: string[] } }
  | { type: "table"; eyebrow: string; title: string; intro?: string; header: string[]; rows: string[][]; colW: number[]; rowH?: number; y?: number }
  | { type: "closing"; icon: string; quote: string; text: string };

interface Deck {
  file: string;
  deckName: string;
  title: string;
  slides: Slide[];
}

function renderDeck(deck: Deck): Promise<number> {
  const doc = new PDFDocument({
    size: [W, H],
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    autoFirstPage: false,
    info: { Title: deck.title, Author: "Andre Snell", Subject: "NQF 5 · 4 credits — lesson slide deck" },
  });
  const out = `public/downloads/${deck.file}.pdf`;
  const stream = createWriteStream(out);
  doc.pipe(stream);

  const inx = (v: number) => v * IN;

  function drawIcon(name: string, x: number, y: number, size = 0.34, color = BLUE) {
    const body = ICONS[name];
    if (!body) throw new Error(`Unknown icon: ${name}`);
    doc.save();
    doc.translate(inx(x), inx(y)).scale(inx(size) / 24);
    doc.lineWidth(1.4).lineCap("round").lineJoin("round").strokeColor(color);
    const els = body.match(/<(circle|rect|path)[^>]*\/>/g) ?? [];
    for (const el of els) {
      const attr = (n: string) => {
        const m = el.match(new RegExp(`${n}="([^"]+)"`));
        return m ? m[1] : undefined;
      };
      if (el.startsWith("<circle")) {
        doc.circle(Number(attr("cx")), Number(attr("cy")), Number(attr("r"))).stroke();
      } else if (el.startsWith("<rect")) {
        const rx = Number(attr("rx") ?? 0);
        doc.roundedRect(Number(attr("x")), Number(attr("y")), Number(attr("width")), Number(attr("height")), rx).stroke();
      } else {
        doc.path(attr("d")!).stroke();
      }
    }
    doc.restore();
  }

  function textBox(text: string, x: number, y: number, w: number, h: number, o: TextOpts = {}) {
    const font = o.font ?? BODY_FONT;
    const size = o.size ?? MIN_FONT;
    doc.font(font).fontSize(size);
    const opts = {
      width: inx(w),
      align: o.align ?? ("left" as const),
      lineGap: o.lineGap ?? size * 0.18,
      characterSpacing: o.charSpacing ?? 0,
      ...(o.noWrap ? { lineBreak: false } : {}),
    };
    let ty = inx(y);
    if (o.valign === "middle") {
      const th = doc.heightOfString(text, opts);
      ty += Math.max(0, (inx(h) - th) / 2);
    }
    doc.fillColor(o.color ?? NAVY).text(text, inx(x), ty, opts);
  }

  function card(x: number, y: number, w: number, h: number, { fill = WHITE, line = BORDER } = {}) {
    const r = inx(0.09);
    doc.save();
    doc.fillOpacity(0.3).fillColor("#9AB4CC");
    doc.roundedRect(inx(x) + 1, inx(y) + 2.5, inx(w), inx(h), r).fill();
    doc.restore();
    doc.roundedRect(inx(x), inx(y), inx(w), inx(h), r).fillAndStroke(fill, line);
  }

  let pageNo = 0;
  function slide(bg = WHITE) {
    doc.addPage();
    pageNo++;
    doc.rect(0, 0, W, H).fill(bg);
    if (pageNo > 1 && bg === WHITE) {
      textBox("US 114051 · Conduct a technical practitioners meeting · NQF 5 · 4 credits", MX, 7.5 - 0.46, CW_IN - 1, 0.38, { color: GREY });
      textBox(String(pageNo), 13.33 - MX - 0.7, 7.5 - 0.46, 0.7, 0.38, { color: GREY, align: "right" });
      doc.rect(0, 0, W, inx(0.09)).fill(BLUE);
    }
  }

  function eyebrowTitle(eyebrow: string, title: string) {
    textBox(eyebrow.toUpperCase(), MX, 0.3, CW_IN, 0.38, { font: TITLE_FONT, color: BLUE, charSpacing: 2 });
    textBox(title, MX, 0.68, CW_IN, 0.66, { font: TITLE_FONT, size: 30 });
  }

  function introText(text: string, y = 1.42) {
    textBox(text, MX, y, CW_IN, 0.68, { color: GREY });
  }

  function iconCards(items: CardItem[], { x = MX, y = 2.0, w = CW_IN, cols = 3, rowH = 2.3, gap = 0.2, titleSize = 20 } = {}) {
    const cw = (w - gap * (cols - 1)) / cols;
    items.forEach((it, i) => {
      const cx = x + (i % cols) * (cw + gap);
      const cy = y + Math.floor(i / cols) * (rowH + gap);
      card(cx, cy, cw, rowH);
      if (it.d) {
        drawIcon(it.icon, cx + 0.18, cy + 0.2, 0.38);
        textBox(it.text, cx + 0.66, cy + 0.14, cw - 0.84, 0.85, { font: TITLE_FONT, size: titleSize, valign: "middle" });
        textBox(it.d, cx + 0.18, cy + 1.06, cw - 0.36, rowH - 1.16, { color: GREY, lineGap: 2.5 });
      } else {
        drawIcon(it.icon, cx + 0.18, cy + rowH / 2 - 0.19, 0.38);
        textBox(it.text, cx + 0.68, cy + 0.08, cw - 0.86, rowH - 0.16, { valign: "middle" });
      }
    });
  }

  function bulletList(items: string[], { x = MX, y = 1.7, w = CW_IN, size = MIN_FONT, gap = 0.155 } = {}) {
    let cy = inx(y);
    doc.font(BODY_FONT).fontSize(size);
    for (const t of items) {
      doc.circle(inx(x) + 5, cy + size * 0.55, 2.6).fill(NAVY);
      doc.fillColor(NAVY).font(BODY_FONT).fontSize(size).text(t, inx(x) + 22, cy, { width: inx(w) - 26, lineGap: size * 0.2 });
      cy = doc.y + inx(gap);
    }
  }

  function callout(c: { icon: string; text: string }, y: number, h = 1.0) {
    card(MX, y, CW_IN, h, { fill: LIGHT });
    drawIcon(c.icon, MX + 0.22, y + h / 2 - 0.19, 0.38);
    textBox(c.text, MX + 0.72, y, CW_IN - 0.98, h, { valign: "middle" });
  }

  function dataTable(header: string[], rows: string[][], { x = MX, y = 2.0, colW, rowH = 0.62 }: { x?: number; y?: number; colW: number[]; rowH?: number }) {
    const px = inx(x);
    let py = inx(y);
    const widths = colW.map((c) => inx(c));
    const rh = inx(rowH);
    doc.rect(px, py, widths.reduce((a, b) => a + b, 0), rh).fill(BLUE);
    let cx = px;
    header.forEach((t, c) => {
      doc.font(TITLE_FONT).fontSize(MIN_FONT).fillColor(WHITE);
      const th = doc.heightOfString(t, { width: widths[c] - 13 });
      doc.text(t, cx + 6.5, py + Math.max(2, (rh - th) / 2), { width: widths[c] - 13 });
      cx += widths[c];
    });
    py += rh;
    rows.forEach((r, i) => {
      doc.font(BODY_FONT).fontSize(MIN_FONT);
      const rowHeight = Math.max(rh, ...r.map((t, c) => doc.heightOfString(t, { width: widths[c] - 13 }) + 8));
      doc.rect(px, py, widths.reduce((a, b) => a + b, 0), rowHeight).fill(i % 2 ? LIGHT : WHITE);
      let cx2 = px;
      r.forEach((t, c) => {
        doc.fillColor(NAVY);
        const th = doc.heightOfString(t, { width: widths[c] - 13 });
        doc.text(t, cx2 + 6.5, py + Math.max(2, (rowHeight - th) / 2), { width: widths[c] - 13 });
        cx2 += widths[c];
      });
      py += rowHeight;
    });
    doc.lineWidth(0.75).strokeColor(BORDER);
    doc.rect(px, inx(y), widths.reduce((a, b) => a + b, 0), py - inx(y)).stroke();
    let gx = px;
    for (let c = 0; c < widths.length - 1; c++) {
      gx += widths[c];
      doc.moveTo(gx, inx(y)).lineTo(gx, py).stroke();
    }
  }

  for (const sl of deck.slides) {
    if (sl.type === "cover") {
      slide();
      doc.rect(0, 0, W, inx(0.12)).fill(BLUE);
      doc.roundedRect(inx(MX), inx(1.1), inx(6.6), inx(0.62), inx(0.31)).fill(BLUE);
      textBox(sl.pill, MX, 1.1, 6.6, 0.62, { font: TITLE_FONT, color: WHITE, align: "center", valign: "middle", charSpacing: 1 });
      textBox(sl.title, MX, 1.95, 10.8, 1.85, { font: TITLE_FONT, size: 38 });
      textBox(sl.subtitle, MX, 3.82, 9.7, 0.78, { size: 19, color: GREY });
      drawIcon(sl.icon, 11.0, 1.4, 1.8, BORDER);
      doc.moveTo(inx(MX), inx(4.62)).lineTo(W - inx(MX), inx(4.62)).lineWidth(1).strokeColor(BORDER).stroke();
      sl.meta.forEach(([k, v], i) => {
        const x = MX + (i * CW_IN) / 4;
        textBox(k, x, 4.84, CW_IN / 4 - 0.2, 0.36, { font: TITLE_FONT, color: BLUE, charSpacing: 0.5, noWrap: true });
        textBox(v, x, 5.22, CW_IN / 4 - 0.2, 1.0, {});
      });
      textBox("ITSS Learn · Investec · Corporate Banking Technology", MX, 7.5 - 0.58, CW_IN, 0.4, { color: GREY });
    } else if (sl.type === "cards") {
      slide();
      eyebrowTitle(sl.eyebrow, sl.title);
      if (sl.intro) introText(sl.intro);
      iconCards(sl.items, { y: sl.y ?? 2.0, cols: sl.cols ?? 3, rowH: sl.rowH ?? 2.3 });
      const rowsUsed = Math.ceil(sl.items.length / (sl.cols ?? 3));
      const bottom = (sl.y ?? 2.0) + rowsUsed * ((sl.rowH ?? 2.3) + 0.2);
      if (sl.callout) callout(sl.callout, Math.min(bottom, 5.75), 0.95);
      if (sl.note) textBox(sl.note, MX, Math.min(bottom + 0.05, 5.3), CW_IN, 0.6, { font: BODY_ITALIC, color: GREY });
    } else if (sl.type === "bullets") {
      slide();
      eyebrowTitle(sl.eyebrow, sl.title);
      bulletList(sl.items, { y: sl.y ?? 1.7 });
      if (sl.callout) callout(sl.callout, 5.35, 1.05);
    } else if (sl.type === "twocol") {
      slide();
      eyebrowTitle(sl.eyebrow, sl.title);
      const colW2 = (CW_IN - 0.3) / 2;
      (
        [
          [sl.left, MX],
          [sl.right, MX + colW2 + 0.3],
        ] as const
      ).forEach(([col, x]) => {
        card(x, 1.7, colW2, 4.9);
        textBox(col.label, x + 0.25, 1.92, colW2 - 0.5, 0.36, { font: TITLE_FONT, color: BLUE, charSpacing: 1 });
        bulletList(col.items, { x: x + 0.25, y: 2.38, w: colW2 - 0.5, gap: 0.14 });
      });
    } else if (sl.type === "table") {
      slide();
      eyebrowTitle(sl.eyebrow, sl.title);
      if (sl.intro) introText(sl.intro);
      dataTable(sl.header, sl.rows, { y: sl.y ?? 1.95, colW: sl.colW, rowH: sl.rowH ?? 0.62 });
    } else if (sl.type === "closing") {
      slide(NAVY);
      doc.rect(0, 0, W, inx(0.12)).fill(BLUE);
      drawIcon(sl.icon, MX, 1.6, 0.7, DARK_LABEL);
      textBox(sl.quote, MX, 2.5, CW_IN, 1.4, { font: TITLE_FONT, size: 36, color: WHITE });
      textBox(sl.text, MX, 4.0, 11.0, 1.4, { color: DARK_SUB });
      textBox("US 114051 · National Certificate: IT — System Support · SAQA ID 48573 · ITSS Learn", MX, 7.5 - 0.58, CW_IN, 0.4, { color: DARK_MUTED });
    }
  }

  doc.end();
  return new Promise((resolve) => stream.on("finish", () => {
    console.log(`Written ${out} — ${pageNo} slides (min font ${MIN_FONT}pt)`);
    resolve(pageNo);
  }));
}

mkdirSync("public/downloads", { recursive: true });
for (const deck of DECKS as Deck[]) {
  await renderDeck(deck);
}
