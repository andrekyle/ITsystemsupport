/**
 * Geometry of a scanned or rendered form page: the table cells, tick boxes
 * and write-on lines drawn on it, and the printed text runs with the empty
 * box nearest to each. The AI binds fields to these boxes by id, so the
 * digital replica's inputs land exactly on the paper's own boxes.
 *
 * Pure pixel code (no DOM) so it runs on canvas ImageData in the browser and
 * on raw buffers in tests. All output coordinates are fractions of the page
 * width and height measured from the top-left corner.
 */

export type PageBoxKind = "cell" | "tick" | "line";

export interface PageBox {
  id: string;
  kind: PageBoxKind;
  x: number;
  y: number;
  w: number;
  h: number;
  /** printed text lies inside the box (a caption cell, a labelled tick cell) */
  text: boolean;
}

export interface PageText {
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** id of the box the run is printed in, "" when none */
  in: string;
  /** id of the nearest empty box to the right on the same line, "" when none */
  right: string;
  /** id of the nearest empty box underneath, "" when none */
  below: string;
  /** id of a tick box just left of the run ("[ ] I agree"), "" when none */
  left: string;
}

export interface PageAnalysis {
  page: number;
  width: number;
  height: number;
  text: PageText[];
  boxes: PageBox[];
}

/** A printed text run in image pixels (from pdf.js or OCR). */
export interface TextRun {
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PixelSource {
  data: Uint8ClampedArray | Uint8Array;
  width: number;
  height: number;
  channels: 3 | 4;
}

export const MAX_PAGE_BOXES = 400;
export const MAX_PAGE_TEXT = 400;

interface HLine { y: number; x1: number; x2: number; t: number }
interface VLine { x: number; y1: number; y2: number; t: number }
interface Rect { x: number; y: number; w: number; h: number }

const DARK = 176;
const GAP = 4;
const MAX_THICKNESS = 9;

function darkMask({ data, width, height, channels }: PixelSource): Uint8Array {
  const mask = new Uint8Array(width * height);
  for (let i = 0, p = 0; i < mask.length; i++, p += channels) {
    const lum = data[p] * 0.299 + data[p + 1] * 0.587 + data[p + 2] * 0.114;
    if (lum < DARK) mask[i] = 1;
  }
  return mask;
}

/** Dark runs along one scanline, bridging gaps of up to GAP pixels. */
function runs(dark: (i: number) => boolean, length: number, minLength: number): [number, number][] {
  const found: [number, number][] = [];
  let i = 0;
  while (i < length) {
    if (!dark(i)) { i++; continue; }
    const start = i;
    let last = i;
    while (i < length) {
      if (dark(i)) { last = i; i++; continue; }
      let j = i + 1;
      while (j < length && j - last <= GAP && !dark(j)) j++;
      if (j < length && j - last <= GAP && dark(j)) { i = j; continue; }
      break;
    }
    if (last - start + 1 >= minLength) found.push([start, last]);
    i = last + 1;
  }
  return found;
}

function horizontalLines(mask: Uint8Array, width: number, height: number, minLength: number): HLine[] {
  const segments: HLine[] = [];
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (const [x1, x2] of runs(x => mask[row + x] === 1, width, minLength)) segments.push({ y, x1, x2, t: 1 });
  }
  // stack the rows of one drawn line (2-6 px thick) into a single line
  const lines: HLine[] = [];
  for (const segment of segments) {
    const overlap = (a: HLine, b: HLine) => Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1) + 1;
    const previous = lines.find(line => segment.y - (line.y + line.t - 1) === 1 && overlap(line, segment) >= 0.8 * Math.min(line.x2 - line.x1 + 1, segment.x2 - segment.x1 + 1));
    if (previous) {
      previous.t += 1;
      previous.x1 = Math.min(previous.x1, segment.x1);
      previous.x2 = Math.max(previous.x2, segment.x2);
    } else {
      lines.push({ ...segment });
    }
  }
  return lines.filter(line => line.t <= MAX_THICKNESS).map(line => ({ ...line, y: line.y + (line.t - 1) / 2 }));
}

function verticalLines(mask: Uint8Array, width: number, height: number, minLength: number): VLine[] {
  const segments: VLine[] = [];
  for (let x = 0; x < width; x++) {
    for (const [y1, y2] of runs(y => mask[y * width + x] === 1, height, minLength)) segments.push({ x, y1, y2, t: 1 });
  }
  const lines: VLine[] = [];
  for (const segment of segments) {
    const overlap = (a: VLine, b: VLine) => Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1) + 1;
    const previous = lines.find(line => segment.x - (line.x + line.t - 1) === 1 && overlap(line, segment) >= 0.8 * Math.min(line.y2 - line.y1 + 1, segment.y2 - segment.y1 + 1));
    if (previous) {
      previous.t += 1;
      previous.y1 = Math.min(previous.y1, segment.y1);
      previous.y2 = Math.max(previous.y2, segment.y2);
    } else {
      lines.push({ ...segment });
    }
  }
  return lines.filter(line => line.t <= MAX_THICKNESS).map(line => ({ ...line, x: line.x + (line.t - 1) / 2 }));
}

/** Closed rectangles bounded by a horizontal line above and below and a
 *  vertical line either side — table cells and tick boxes. */
function cells(hLines: HLine[], vLines: VLine[], tolerance: number, minSize: number): { rects: Rect[]; used: Set<HLine> } {
  const rects: Rect[] = [];
  const used = new Set<HLine>();
  const sortedH = [...hLines].sort((a, b) => a.y - b.y);
  const crossesH = (v: VLine, h: HLine) => v.x >= h.x1 - tolerance && v.x <= h.x2 + tolerance && h.y >= v.y1 - tolerance && h.y <= v.y2 + tolerance;
  for (const top of sortedH) {
    const verticals = vLines.filter(v => crossesH(v, top)).sort((a, b) => a.x - b.x);
    for (let a = 0; a < verticals.length; a++) {
      const left = verticals[a];
      if (left.y2 < top.y + minSize - tolerance) continue;
      for (let b = a + 1; b < verticals.length; b++) {
        const right = verticals[b];
        if (right.x - left.x < minSize) continue;
        if (right.y2 < top.y + minSize - tolerance) continue;
        const bottom = sortedH.find(h =>
          h.y >= top.y + minSize
          && h.x1 <= left.x + tolerance && h.x2 >= right.x - tolerance
          && left.y2 >= h.y - tolerance && right.y2 >= h.y - tolerance
          && left.y1 <= top.y + tolerance && right.y1 <= top.y + tolerance);
        if (!bottom) continue;
        rects.push({ x: left.x, y: top.y, w: right.x - left.x, h: bottom.y - top.y });
        used.add(top);
        used.add(bottom);
        break;
      }
    }
  }
  // the same cell can be reached from both of its vertical pairs
  const unique: Rect[] = [];
  for (const rect of rects) {
    if (!unique.some(r => Math.abs(r.x - rect.x) <= tolerance && Math.abs(r.y - rect.y) <= tolerance && Math.abs(r.w - rect.w) <= tolerance && Math.abs(r.h - rect.h) <= tolerance)) unique.push(rect);
  }
  return { rects: unique, used };
}

function darkRatio(mask: Uint8Array, width: number, height: number, rect: Rect, inset: number): number {
  const x1 = Math.max(0, Math.round(rect.x + inset));
  const x2 = Math.min(width - 1, Math.round(rect.x + rect.w - inset));
  const y1 = Math.max(0, Math.round(rect.y + inset));
  const y2 = Math.min(height - 1, Math.round(rect.y + rect.h - inset));
  if (x2 <= x1 || y2 <= y1) return 0;
  let dark = 0;
  for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) dark += mask[y * width + x];
  return dark / ((x2 - x1 + 1) * (y2 - y1 + 1));
}

/** Letters such as D or R close into small rectangles too; a real tick box
 *  has clear paper around it, letters have their neighbours. */
function isolated(mask: Uint8Array, width: number, height: number, rect: Rect, margin: number): boolean {
  const outer = { x: rect.x - margin, y: rect.y - margin, w: rect.w + 2 * margin, h: rect.h + 2 * margin };
  const x1 = Math.max(0, Math.round(outer.x));
  const x2 = Math.min(width - 1, Math.round(outer.x + outer.w));
  const y1 = Math.max(0, Math.round(outer.y));
  const y2 = Math.min(height - 1, Math.round(outer.y + outer.h));
  const ix1 = Math.round(rect.x) - 2, ix2 = Math.round(rect.x + rect.w) + 2, iy1 = Math.round(rect.y) - 2, iy2 = Math.round(rect.y + rect.h) + 2;
  let dark = 0;
  let total = 0;
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      if (x >= ix1 && x <= ix2 && y >= iy1 && y <= iy2) continue;
      total++;
      dark += mask[y * width + x];
    }
  }
  return total === 0 || dark / total < 0.06;
}

/** Join pdf.js items printed on one baseline into phrases ("National ID"). */
function mergeRuns(runs: TextRun[]): TextRun[] {
  const sorted = runs.filter(run => run.text.trim() && run.w > 0 && run.h > 0).sort((a, b) => (a.y + a.h) - (b.y + b.h) || a.x - b.x);
  const merged: TextRun[] = [];
  for (const run of sorted) {
    const last = merged[merged.length - 1];
    if (last && Math.abs((last.y + last.h) - (run.y + run.h)) <= 0.4 * Math.max(last.h, run.h) && run.x - (last.x + last.w) <= 0.6 * Math.max(last.h, run.h) && run.x >= last.x) {
      const gap = run.x - (last.x + last.w);
      last.text = `${last.text}${gap > 0.12 * last.h && !last.text.endsWith(" ") && !run.text.startsWith(" ") ? " " : ""}${run.text}`;
      const right = Math.max(last.x + last.w, run.x + run.w);
      const bottom = Math.max(last.y + last.h, run.y + run.h);
      last.y = Math.min(last.y, run.y);
      last.h = bottom - last.y;
      last.w = right - last.x;
    } else {
      merged.push({ ...run });
    }
  }
  return merged.map(run => ({ ...run, text: run.text.replace(/\s+/g, " ").trim() })).filter(run => run.text);
}

const round = (value: number) => Math.round(value * 10000) / 10000;

export function analysePage(pixels: PixelSource, runs: TextRun[], page: number): PageAnalysis {
  const { width, height } = pixels;
  const mask = darkMask(pixels);
  const minLine = Math.max(10, Math.round(width * 0.0085));
  const tolerance = Math.max(3, Math.round(width * 0.002));
  const hLines = horizontalLines(mask, width, height, minLine);
  const vLines = verticalLines(mask, width, height, minLine);
  const { rects, used } = cells(hLines, vLines, tolerance, minLine);

  const phrases = mergeRuns(runs);
  const contains = (box: Rect, run: TextRun) => {
    const cx = run.x + run.w / 2;
    const cy = run.y + run.h / 2;
    return cx >= box.x && cx <= box.x + box.w && cy >= box.y && cy <= box.y + box.h;
  };
  const minTick = Math.max(12, width * 0.01);
  const boxes: (Rect & { kind: PageBoxKind })[] = [];
  for (const rect of rects) {
    const small = rect.w <= width * 0.035 && rect.h <= width * 0.035;
    if (small) {
      const square = rect.w / rect.h > 0.6 && rect.w / rect.h < 1.6;
      if (!square || rect.w < minTick || rect.h < minTick) continue;
      if (!isolated(mask, width, height, rect, Math.max(4, Math.round(0.4 * Math.max(rect.w, rect.h))))) continue;
      if (phrases.some(run => contains(rect, run))) continue;
      boxes.push({ ...rect, kind: "tick" });
    } else {
      boxes.push({ ...rect, kind: "cell" });
    }
  }
  // a long rule with clear paper above it is a write-on line (text baselines
  // also join into rules, so anything with printed words above is skipped)
  const lineBoxHeight = Math.round(height * 0.024);
  for (const line of hLines) {
    if (used.has(line) || line.x2 - line.x1 < width * 0.1) continue;
    const rect = { x: line.x1, y: line.y - lineBoxHeight, w: line.x2 - line.x1, h: lineBoxHeight };
    if (rect.y < 0) continue;
    if (darkRatio(mask, width, height, rect, 2) > 0.03) continue;
    if (phrases.some(run => contains(rect, run))) continue;
    boxes.push({ ...rect, kind: "line" });
  }
  boxes.sort((a, b) => a.y - b.y || a.x - b.x);

  const pageBoxes: PageBox[] = boxes.slice(0, MAX_PAGE_BOXES).map((box, index) => ({
    id: `b${index + 1}`,
    kind: box.kind,
    x: round(box.x / width),
    y: round(box.y / height),
    w: round(box.w / width),
    h: round(box.h / height),
    text: phrases.length
      ? phrases.some(run => contains(box, run))
      : darkRatio(mask, width, height, box, Math.max(3, tolerance)) > 0.015,
  }));
  const pixelBoxes = boxes.slice(0, MAX_PAGE_BOXES);

  const text: PageText[] = phrases.slice(0, MAX_PAGE_TEXT).map(run => {
    const cy = run.y + run.h / 2;
    let inside = -1;
    let right = -1;
    let below = -1;
    let left = -1;
    let rightDistance = Infinity;
    let belowDistance = Infinity;
    let leftDistance = Infinity;
    pixelBoxes.forEach((box, index) => {
      if (contains(box, run) && (inside < 0 || box.w * box.h < pixelBoxes[inside].w * pixelBoxes[inside].h)) inside = index;
      if (pageBoxes[index].text) return;
      const empty = box;
      if (cy >= empty.y && cy <= empty.y + empty.h && empty.x >= run.x + run.w - tolerance) {
        const distance = empty.x - (run.x + run.w);
        if (distance < rightDistance && distance <= width * 0.25) { rightDistance = distance; right = index; }
      }
      if (empty.x < run.x + run.w && empty.x + empty.w > run.x && empty.y >= run.y + run.h - tolerance) {
        const distance = empty.y - (run.y + run.h);
        if (distance < belowDistance && distance <= height * 0.06) { belowDistance = distance; below = index; }
      }
      if (pageBoxes[index].kind === "tick" && cy >= empty.y - tolerance && cy <= empty.y + empty.h + tolerance && empty.x + empty.w <= run.x + tolerance) {
        const distance = run.x - (empty.x + empty.w);
        if (distance < leftDistance && distance <= width * 0.08) { leftDistance = distance; left = index; }
      }
    });
    return {
      text: run.text.slice(0, 300),
      x: round(run.x / width),
      y: round(run.y / height),
      w: round(run.w / width),
      h: round(run.h / height),
      in: inside >= 0 ? pageBoxes[inside].id : "",
      right: right >= 0 ? pageBoxes[right].id : "",
      below: below >= 0 ? pageBoxes[below].id : "",
      left: left >= 0 ? pageBoxes[left].id : "",
    };
  });

  return { page, width, height, text, boxes: pageBoxes };
}
