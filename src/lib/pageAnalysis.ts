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

export type PageBoxKind = "cell" | "tick" | "line" | "comb";

export interface PageBox {
  id: string;
  kind: PageBoxKind;
  x: number;
  y: number;
  w: number;
  h: number;
  /** printed text lies inside the box (a caption cell, a labelled tick cell) */
  text: boolean;
  /** comb: number of character boxes in the row */
  n?: number;
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
  /** id of the nearest empty box just left of the run (a tick before "I agree", a box before a right-aligned caption), "" when none */
  left: string;
  /** id of the nearest empty box just above the run (a line captioned underneath), "" when none */
  above: string;
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

export const MAX_PAGE_BOXES = 600;
export const MAX_PAGE_TEXT = 600;

interface HLine { y: number; x1: number; x2: number; t: number; x1b?: number; x2b?: number }
interface VLine { x: number; y1: number; y2: number; t: number; y1b?: number; y2b?: number }
interface Rect { x: number; y: number; w: number; h: number }

const GAP_H = 6;
const GAP_V = 3;
const MAX_THICKNESS = 9;

/** Pixels clearly darker than the paper. Thin light-grey rules render as
 *  pale anti-aliased grey, so the cut is taken relative to the page's own
 *  background rather than at a fixed level. */
function darkMask({ data, width, height, channels }: PixelSource): Uint8Array {
  const mask = new Uint8Array(width * height);
  const lum = new Uint8Array(width * height);
  const histogram = new Uint32Array(256);
  for (let i = 0, p = 0; i < lum.length; i++, p += channels) {
    const value = data[p] * 0.299 + data[p + 1] * 0.587 + data[p + 2] * 0.114;
    lum[i] = value;
    histogram[value | 0]++;
  }
  let background = 255;
  for (let value = 1; value < 256; value++) if (histogram[value] > histogram[background]) background = value;
  const cut = Math.min(225, background - 30);
  for (let i = 0; i < lum.length; i++) if (lum[i] < cut) mask[i] = 1;
  return mask;
}

/** Dark runs along one scanline, bridging gaps of up to `gap` pixels. */
function runs(dark: (i: number) => boolean, length: number, minLength: number, gap: number): [number, number][] {
  const found: [number, number][] = [];
  let i = 0;
  while (i < length) {
    if (!dark(i)) { i++; continue; }
    const start = i;
    let last = i;
    while (i < length) {
      if (dark(i)) { last = i; i++; continue; }
      let j = i + 1;
      while (j < length && j - last <= gap && !dark(j)) j++;
      if (j < length && j - last <= gap && dark(j)) { i = j; continue; }
      break;
    }
    if (last - start + 1 >= minLength) found.push([start, last]);
    i = last + 1;
  }
  return found;
}

function horizontalLines(mask: Uint8Array, width: number, height: number, minLength: number, keepThick = false, gap = GAP_H): HLine[] {
  const segments: HLine[] = [];
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (const [x1, x2] of runs(x => mask[row + x] === 1, width, minLength, gap)) segments.push({ y, x1, x2, t: 1 });
  }
  // stack the rows of one drawn line (2-6 px thick) into a single line; a row
  // must be of comparable length, or a crossing vertical would extend a rule
  // downwards row by row until it counted as a block
  const lines: HLine[] = [];
  for (const segment of segments) {
    const length = (line: HLine) => line.x2 - line.x1 + 1;
    const overlap = (a: HLine, b: HLine) => Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1) + 1;
    const previous = lines.find(line => segment.y - (line.y + line.t - 1) === 1
      && overlap(line, segment) >= 0.8 * Math.min(length(line), length(segment))
      && Math.min(length(line), length(segment)) >= 0.35 * Math.max(length(line), length(segment)));
    if (previous) {
      previous.t += 1;
      // the widest and narrowest extents tell a straight rule from an arc or a word
      previous.x1b = Math.max(previous.x1b ?? previous.x1, segment.x1);
      previous.x2b = Math.min(previous.x2b ?? previous.x2, segment.x2);
      previous.x1 = Math.min(previous.x1, segment.x1);
      previous.x2 = Math.max(previous.x2, segment.x2);
    } else {
      lines.push({ ...segment, x1b: segment.x1, x2b: segment.x2 });
    }
  }
  if (keepThick) return lines;
  return lines.filter(line => line.t <= MAX_THICKNESS).map(line => ({ ...line, y: line.y + (line.t - 1) / 2 }));
}

function verticalLines(mask: Uint8Array, width: number, height: number, minLength: number, keepThick = false): VLine[] {
  const segments: VLine[] = [];
  for (let x = 0; x < width; x++) {
    for (const [y1, y2] of runs(y => mask[y * width + x] === 1, height, minLength, GAP_V)) segments.push({ x, y1, y2, t: 1 });
  }
  const lines: VLine[] = [];
  for (const segment of segments) {
    const length = (line: VLine) => line.y2 - line.y1 + 1;
    const overlap = (a: VLine, b: VLine) => Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1) + 1;
    const previous = lines.find(line => segment.x - (line.x + line.t - 1) === 1
      && overlap(line, segment) >= 0.8 * Math.min(length(line), length(segment))
      && Math.min(length(line), length(segment)) >= 0.35 * Math.max(length(line), length(segment)));
    if (previous) {
      previous.t += 1;
      previous.y1b = Math.max(previous.y1b ?? previous.y1, segment.y1);
      previous.y2b = Math.min(previous.y2b ?? previous.y2, segment.y2);
      previous.y1 = Math.min(previous.y1, segment.y1);
      previous.y2 = Math.max(previous.y2, segment.y2);
    } else {
      lines.push({ ...segment, y1b: segment.y1, y2b: segment.y2 });
    }
  }
  if (keepThick) return lines;
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

const SKEW_RANGE = 3;

/**
 * Skew of a scanned page in degrees (positive = content runs downhill to the
 * right), found where the rows of a rotated projection of the dark pixels
 * are sharpest. Rotate the image by the negative of this to straighten it.
 */
export function estimateSkew({ data, width, height, channels }: PixelSource): number {
  const step = Math.max(1, Math.ceil(width / 500));
  const points: number[] = [];
  const histogram = new Uint32Array(256);
  const lums: number[] = [];
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const p = (y * width + x) * channels;
      const lum = data[p] * 0.299 + data[p + 1] * 0.587 + data[p + 2] * 0.114;
      lums.push(lum);
      histogram[lum | 0]++;
    }
  }
  let background = 255;
  for (let value = 1; value < 256; value++) if (histogram[value] > histogram[background]) background = value;
  const cut = Math.min(225, background - 30);
  const columns = Math.ceil(width / step);
  for (let i = 0; i < lums.length; i++) if (lums[i] < cut) points.push(i % columns, Math.floor(i / columns));
  if (points.length < 400) return 0;
  const rows = Math.ceil(height / step);
  const offset = columns;
  const bins = new Float64Array(rows + 2 * columns + 2);
  const score = (degrees: number) => {
    bins.fill(0);
    const angle = (degrees * Math.PI) / 180;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    for (let i = 0; i < points.length; i += 2) bins[Math.round(points[i + 1] * cos - points[i] * sin) + offset]++;
    let total = 0;
    for (let i = 0; i < bins.length; i++) total += bins[i] * bins[i];
    return total;
  };
  let best = 0;
  let bestScore = -1;
  for (let degrees = -SKEW_RANGE; degrees <= SKEW_RANGE + 1e-9; degrees += 0.1) {
    const value = score(degrees);
    if (value > bestScore) { bestScore = value; best = degrees; }
  }
  for (let degrees = best - 0.09; degrees <= best + 0.09 + 1e-9; degrees += 0.02) {
    const value = score(degrees);
    if (value > bestScore) { bestScore = value; best = degrees; }
  }
  return Math.round(best * 100) / 100;
}

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
  const boxes: (Rect & { kind: PageBoxKind; n?: number })[] = [];
  const squares: Rect[] = [];
  for (const rect of rects) {
    const small = rect.w <= width * 0.035 && rect.h <= width * 0.035;
    if (small) {
      const square = rect.w / rect.h > 0.6 && rect.w / rect.h < 1.6;
      if (!square || rect.w < minTick || rect.h < minTick) continue;
      if (phrases.some(run => contains(rect, run))) continue;
      squares.push(rect);
    } else {
      boxes.push({ ...rect, kind: "cell" });
    }
  }
  // a row of touching, equal squares is a comb: one answer, one box per character
  squares.sort((a, b) => a.y - b.y || a.x - b.x);
  const inComb = new Set<Rect>();
  for (let i = 0; i < squares.length; i++) {
    if (inComb.has(squares[i])) continue;
    const chain = [squares[i]];
    for (let j = i + 1; j < squares.length; j++) {
      const last = chain[chain.length - 1];
      const next = squares[j];
      if (inComb.has(next) || next.y - squares[i].y > tolerance * 2) continue;
      if (Math.abs(next.y - last.y) <= tolerance && Math.abs(next.h - last.h) <= tolerance && Math.abs(next.w - last.w) <= tolerance * 1.5 && next.x - (last.x + last.w) <= tolerance * 2 && next.x > last.x) chain.push(next);
    }
    // three or more in a row, or two that share a side (a two-digit month box)
    const touching = chain.length === 2 && chain[1].x - (chain[0].x + chain[0].w) <= tolerance;
    if (chain.length >= 3 || touching) {
      chain.forEach(square => inComb.add(square));
      const first = chain[0];
      const last = chain[chain.length - 1];
      boxes.push({ x: first.x, y: Math.min(...chain.map(s => s.y)), w: last.x + last.w - first.x, h: Math.max(...chain.map(s => s.h)), kind: "comb", n: chain.length });
    }
  }
  for (const square of squares) {
    if (inComb.has(square)) continue;
    // letters such as D or R close into small rectangles too; a lone tick box has clear paper around it
    if (!isolated(mask, width, height, square, Math.max(4, Math.round(0.4 * Math.max(square.w, square.h))))) continue;
    boxes.push({ ...square, kind: "tick" });
  }
  // a long rule with clear paper above it is a write-on line (text baselines
  // also join into rules, so anything with printed words above is skipped)
  const lineBoxHeight = Math.round(height * 0.018);
  const edgeTolerance = 2 * tolerance;
  for (const line of hLines) {
    if (used.has(line) || line.x2 - line.x1 < width * 0.1) continue;
    // a stretch of a cell's own border left over by a slight residual skew
    if (boxes.some(box => box.kind === "cell"
      && (Math.abs(line.y - box.y) <= edgeTolerance || Math.abs(line.y - (box.y + box.h)) <= edgeTolerance)
      && line.x1 >= box.x - edgeTolerance && line.x2 <= box.x + box.w + edgeTolerance)) continue;
    const rect = { x: line.x1, y: line.y - lineBoxHeight, w: line.x2 - line.x1, h: lineBoxHeight };
    if (rect.y < 0) continue;
    if (darkRatio(mask, width, height, rect, 2) > 0.04) continue;
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
    text: box.kind === "comb" ? false : phrases.length
      ? phrases.some(run => contains(box, run))
      : darkRatio(mask, width, height, box, Math.max(3, tolerance)) > 0.015,
    ...(box.n ? { n: box.n } : {}),
  }));
  const pixelBoxes = boxes.slice(0, MAX_PAGE_BOXES);

  const text: PageText[] = phrases.slice(0, MAX_PAGE_TEXT).map(run => {
    const cy = run.y + run.h / 2;
    let inside = -1;
    let right = -1;
    let below = -1;
    let left = -1;
    let above = -1;
    let rightDistance = Infinity;
    let belowDistance = Infinity;
    let leftDistance = Infinity;
    let aboveDistance = Infinity;
    pixelBoxes.forEach((box, index) => {
      if (contains(box, run) && (inside < 0 || box.w * box.h < pixelBoxes[inside].w * pixelBoxes[inside].h)) inside = index;
      if (pageBoxes[index].text) return;
      const empty = box;
      if (cy >= empty.y && cy <= empty.y + empty.h && empty.x >= run.x + run.w - tolerance) {
        const distance = empty.x - (run.x + run.w);
        if (distance < rightDistance && distance <= width * 0.25) { rightDistance = distance; right = index; }
      }
      const overlapsX = empty.x < run.x + run.w && empty.x + empty.w > run.x;
      if (overlapsX && empty.y >= run.y + run.h - tolerance) {
        const distance = empty.y - (run.y + run.h);
        if (distance < belowDistance && distance <= height * 0.06) { belowDistance = distance; below = index; }
      }
      if (overlapsX && empty.y + empty.h <= run.y + tolerance) {
        const distance = run.y - (empty.y + empty.h);
        if (distance < aboveDistance && distance <= height * 0.02) { aboveDistance = distance; above = index; }
      }
      if (cy >= empty.y - tolerance && cy <= empty.y + empty.h + tolerance && empty.x + empty.w <= run.x + tolerance) {
        const distance = run.x - (empty.x + empty.w);
        if (distance < leftDistance && distance <= width * 0.25) { leftDistance = distance; left = index; }
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
      above: above >= 0 ? pageBoxes[above].id : "",
    };
  });

  return { page, width, height, text, boxes: pageBoxes };
}

// ---------------------------------------------------------------------------
// Digital layer: everything printed on the page that is not text, so the page
// can be rebuilt from real text plus these shapes instead of shown as a photo.
// ---------------------------------------------------------------------------

/** A drawn rule or a solid block, in page fractions, with its colour. */
export interface LayerRect {
  x: number;
  y: number;
  w: number;
  h: number;
  c: string;
  /** rule drawn as dots or dashes */
  d?: boolean;
}

/** A hollow rectangle (a tick box) with its stroke colour. */
export interface LayerFrame extends LayerRect {
  /** stroke thickness as a fraction of the page width */
  t: number;
  /** comb: number of character boxes across */
  n?: number;
}

export interface LayerGeometry {
  rules: LayerRect[];
  fills: LayerRect[];
  frames: LayerFrame[];
  combs: LayerFrame[];
  /** regions that are neither text nor shapes (logos, pictures), in pixels */
  pictures: Rect[];
}

const hex = (r: number, g: number, b: number) => `#${[r, g, b].map(v => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`;

/** The dominant colour of a region (quantised histogram mode, then the mean
 *  of the pixels near it) and how uniform the region is. */
function regionColour({ data, width, channels }: PixelSource, rect: Rect, only?: (lum: number) => boolean, exclude: Rect[] = []): { colour: string; share: number; lum: number } {
  const x1 = Math.max(0, Math.round(rect.x));
  const x2 = Math.min(width - 1, Math.round(rect.x + rect.w - 1));
  const y1 = Math.max(0, Math.round(rect.y));
  const y2 = Math.min(Math.round((data.length / channels) / width) - 1, Math.round(rect.y + rect.h - 1));
  const bins = new Map<number, number>();
  const step = Math.max(1, Math.floor(Math.sqrt(((x2 - x1 + 1) * (y2 - y1 + 1)) / 4000)));
  const skipped = (x: number, y: number) => exclude.some(box => x >= box.x - 2 && x <= box.x + box.w + 2 && y >= box.y - 2 && y <= box.y + box.h + 2);
  let total = 0;
  for (let y = y1; y <= y2; y += step) {
    for (let x = x1; x <= x2; x += step) {
      if (exclude.length && skipped(x, y)) continue;
      const p = (y * width + x) * channels;
      const lum = data[p] * 0.299 + data[p + 1] * 0.587 + data[p + 2] * 0.114;
      if (only && !only(lum)) continue;
      total++;
      const key = ((data[p] >> 4) << 8) | ((data[p + 1] >> 4) << 4) | (data[p + 2] >> 4);
      bins.set(key, (bins.get(key) ?? 0) + 1);
    }
  }
  if (!total) return { colour: "#000000", share: 0, lum: 0 };
  let best = 0;
  let bestCount = -1;
  for (const [key, count] of bins) if (count > bestCount) { bestCount = count; best = key; }
  const mr = ((best >> 8) & 15) * 16 + 8, mg = ((best >> 4) & 15) * 16 + 8, mb = (best & 15) * 16 + 8;
  let r = 0, g = 0, b = 0, n = 0;
  for (let y = y1; y <= y2; y += step) {
    for (let x = x1; x <= x2; x += step) {
      if (exclude.length && skipped(x, y)) continue;
      const p = (y * width + x) * channels;
      const lum = data[p] * 0.299 + data[p + 1] * 0.587 + data[p + 2] * 0.114;
      if (only && !only(lum)) continue;
      if (Math.abs(data[p] - mr) <= 24 && Math.abs(data[p + 1] - mg) <= 24 && Math.abs(data[p + 2] - mb) <= 24) { r += data[p]; g += data[p + 1]; b += data[p + 2]; n++; }
    }
  }
  if (!n) return { colour: hex(mr, mg, mb), share: bestCount / total, lum: mr * 0.299 + mg * 0.587 + mb * 0.114 };
  return { colour: hex(r / n, g / n, b / n), share: n / total, lum: (r * 0.299 + g * 0.587 + b * 0.114) / n };
}

/** The ink colour of printed text: the most deviating pixels against the
 *  box's own background (so white text on an orange strip reads as white). */
export function textColour(pixels: PixelSource, rect: Rect): string {
  const background = regionColour(pixels, rect);
  const ink = regionColour(pixels, rect, lum => Math.abs(lum - background.lum) > 60);
  if (ink.share === 0) return background.lum < 128 ? "#ffffff" : "#000000";
  return ink.colour;
}

const intersects = (a: Rect, b: Rect, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;

/** Pixels that are not the paper at all - even a light table shading - for
 *  finding solid blocks. */
function tintMask({ data, width, height, channels }: PixelSource): Uint8Array {
  const mask = new Uint8Array(width * height);
  const histogram = new Uint32Array(256);
  const lum = new Uint8Array(width * height);
  for (let i = 0, p = 0; i < lum.length; i++, p += channels) {
    lum[i] = data[p] * 0.299 + data[p + 1] * 0.587 + data[p + 2] * 0.114;
    histogram[lum[i]]++;
  }
  let background = 255;
  for (let value = 1; value < 256; value++) if (histogram[value] > histogram[background]) background = value;
  for (let i = 0, p = 0; i < lum.length; i++, p += channels) {
    const chroma = Math.max(data[p], data[p + 1], data[p + 2]) - Math.min(data[p], data[p + 1], data[p + 2]);
    if (background - lum[i] > 10 || chroma > 24) mask[i] = 1;
  }
  return mask;
}

/** Hairlines render as anti-aliased grey; a dark, unsaturated sample is ink. */
function inkColour(colour: string): string {
  const r = parseInt(colour.slice(1, 3), 16), g = parseInt(colour.slice(3, 5), 16), b = parseInt(colour.slice(5, 7), 16);
  const lum = r * 0.299 + g * 0.587 + b * 0.114;
  const saturation = Math.max(r, g, b) - Math.min(r, g, b);
  return lum < 140 && saturation < 40 ? "#000000" : colour;
}

/** How many rows (or columns) in from one side of a shaded block are a
 *  border - markedly darker than the block's own colour along their whole
 *  length; 0 when the block has no border on that side. */
function borderThickness({ data, width, channels }: PixelSource, rect: Rect, side: "top" | "bottom" | "left" | "right", fillLum: number): number {
  const x1 = Math.max(0, Math.round(rect.x)), x2 = Math.min(width - 1, Math.round(rect.x + rect.w - 1));
  const y1 = Math.max(0, Math.round(rect.y)), y2 = Math.round(rect.y + rect.h - 1);
  const along = side === "top" || side === "bottom" ? [x1, x2] : [y1, y2];
  const step = Math.max(1, Math.floor((along[1] - along[0]) / 200));
  const lumAt = (x: number, y: number) => { const p = (y * width + x) * channels; return data[p] * 0.299 + data[p + 1] * 0.587 + data[p + 2] * 0.114; };
  const darkRow = (k: number) => {
    let dark = 0, n = 0;
    for (let a = along[0]; a <= along[1]; a += step) {
      const lum = side === "top" ? lumAt(a, y1 + k) : side === "bottom" ? lumAt(a, y2 - k) : side === "left" ? lumAt(x1 + k, a) : lumAt(x2 - k, a);
      n++;
      if (lum < fillLum - 40) dark++;
    }
    return dark / n >= 0.9;
  };
  // the outermost row may be the border's anti-aliased fringe
  let t = darkRow(0) ? 0 : darkRow(1) ? 1 : -1;
  if (t < 0) return 0;
  while (t < MAX_THICKNESS && darkRow(t)) t++;
  return t;
}

/**
 * Shapes of the page: rules (thin lines, solid or dotted), fills (solid
 * colour blocks such as a contact strip), frames (small hollow squares) and
 * picture regions — dark areas explained by none of those nor by `textBoxes`.
 */
export function extractLayer(pixels: PixelSource, textBoxes: Rect[], ticks: Rect[], combRows: (Rect & { n: number })[] = []): LayerGeometry {
  const { width, height } = pixels;
  const mask = darkMask(pixels);
  const minLine = Math.max(10, Math.round(width * 0.0085));
  const inText = (rect: Rect) => textBoxes.some(box => intersects(box, rect, 1) && rect.x >= box.x - 4 && rect.x + rect.w <= box.x + box.w + 4 && rect.y >= box.y - 4 && rect.y + rect.h <= box.y + box.h + 4);
  const wobble = Math.max(4, Math.round(width * 0.004));
  const rules: LayerRect[] = [];
  const fills: LayerRect[] = [];
  const pictures: Rect[] = [];
  const fx = (v: number) => round(v / width);
  const fy = (v: number) => round(v / height);
  const tint = tintMask(pixels);

  for (const line of horizontalLines(mask, width, height, minLine, true)) {
    const rect = { x: line.x1, y: line.y, w: line.x2 - line.x1 + 1, h: line.t };
    if (inText(rect) || line.t > MAX_THICKNESS) continue;
    if (rect.w < width * 0.02) continue;
    const straight = line.t <= 3 || ((line.x1b ?? line.x1) - line.x1 <= wobble && line.x2 - (line.x2b ?? line.x2) <= wobble);
    // a wobbly stack is lettering, not a rule; anything really drawn there is
    // picked up by the leftover pass below
    if (!straight) continue;
    // a light solid rule is only partly "dark"; the tint mask sees all of it
    const row = line.y + Math.floor(line.t / 2);
    let inked = 0;
    for (let x = line.x1; x <= line.x2; x++) inked += tint[row * width + x];
    // the ink is the rule's darkest row; the others are anti-aliased fringe
    const colour = Array.from({ length: line.t }, (_, k) => regionColour(pixels, { x: rect.x, y: rect.y + k, w: rect.w, h: 1 }, lum => lum < 200))
      .reduce((best, sample) => sample.share > 0 && (best.share === 0 || sample.lum < best.lum) ? sample : best);
    rules.push({ x: fx(rect.x), y: fy(rect.y), w: fx(rect.w), h: fy(rect.h), c: inkColour(colour.colour), ...(inked / rect.w < 0.7 ? { d: true } : {}) });
  }
  // solid blocks, including light shading, come from the gentler mask; the
  // wide gap bridges words printed on the block so its rows stay whole
  const paper = regionColour(pixels, { x: 0, y: 0, w: width, h: height });
  for (const block of horizontalLines(tint, width, height, minLine, true, Math.round(width * 0.03))) {
    if (block.t <= MAX_THICKNESS) continue;
    const rect = { x: block.x1, y: block.y, w: block.x2 - block.x1 + 1, h: block.t };
    if (inText(rect) || rect.w < width * 0.02) continue;
    // judged inside its border (a heavy or doubled one is a good share of a
    // shallow block) and without the words printed on it
    const inset = Math.min(Math.max(4, Math.round(width * 0.006)), Math.floor(rect.h / 4));
    const inner = { x: rect.x + inset, y: rect.y + inset, w: rect.w - 2 * inset, h: rect.h - 2 * inset };
    const colour = regionColour(pixels, inner, undefined, textBoxes.filter(box => intersects(box, inner)));
    // a paper-coloured "block" is just ruled structure (a comb, a grid), not shading
    const tinted = Math.abs(colour.lum - paper.lum) > 10 || (() => { const r = parseInt(colour.colour.slice(1, 3), 16), g = parseInt(colour.colour.slice(3, 5), 16), b = parseInt(colour.colour.slice(5, 7), 16); return Math.max(r, g, b) - Math.min(r, g, b) > 24; })();
    if (tinted && colour.share >= 0.8) {
      fills.push({ x: fx(rect.x), y: fy(rect.y), w: fx(rect.w), h: fy(rect.h), c: colour.colour });
      // a shaded block swallows its own border in the dark mask; find it from
      // the edges inwards and draw it as rules
      for (const side of ["top", "bottom", "left", "right"] as const) {
        const t = borderThickness(pixels, rect, side, colour.lum);
        if (!t) continue;
        const strip = side === "top" ? { x: rect.x, y: rect.y, w: rect.w, h: t }
          : side === "bottom" ? { x: rect.x, y: rect.y + rect.h - t, w: rect.w, h: t }
          : side === "left" ? { x: rect.x, y: rect.y, w: t, h: rect.h }
          : { x: rect.x + rect.w - t, y: rect.y, w: t, h: rect.h };
        const ink = regionColour(pixels, strip, lum => lum < colour.lum - 40);
        rules.push({ x: fx(strip.x), y: fy(strip.y), w: fx(strip.w), h: fy(strip.h), c: inkColour(ink.colour) });
      }
    }
  }
  for (const line of verticalLines(mask, width, height, Math.max(minLine, Math.round(height * 0.012)), false)) {
    const rect = { x: line.x - (line.t - 1) / 2, y: line.y1, w: line.t, h: line.y2 - line.y1 + 1 };
    if (inText(rect)) continue;
    if ((line.y1b ?? line.y1) - line.y1 > wobble || line.y2 - (line.y2b ?? line.y2) > wobble) continue;
    const colour = regionColour(pixels, rect, lum => lum < 200);
    rules.push({ x: fx(rect.x), y: fy(rect.y), w: fx(rect.w), h: fy(rect.h), c: inkColour(colour.colour) });
  }
  const frames: LayerFrame[] = ticks.map(tick => {
    const colour = regionColour(pixels, { x: tick.x, y: tick.y, w: tick.w, h: 2 }, lum => lum < 200);
    return { x: fx(tick.x), y: fy(tick.y), w: fx(tick.w), h: fy(tick.h), c: inkColour(colour.colour), t: fx(Math.max(1, Math.round(width * 0.0009))) };
  });
  const combs: LayerFrame[] = combRows.map(row => {
    const colour = regionColour(pixels, { x: row.x, y: row.y, w: row.w, h: 2 }, lum => lum < 200);
    return { x: fx(row.x), y: fy(row.y), w: fx(row.w), h: fy(row.h), c: inkColour(colour.colour), t: fx(Math.max(1, Math.round(width * 0.0009))), n: row.n };
  });
  // the frames draw a box's own edges; the same edges found as rules would double them
  const framed = [...ticks, ...combRows];
  const edgeTolerance = Math.max(3, Math.round(width * 0.003));
  // (a frame edge may have bridged the small gap to a neighbouring rule, so
  // "drawn by" means nearly all of the rule lies on the frame)
  const drawnByFrame = (rule: LayerRect) => {
    const px = { x: rule.x * width, y: rule.y * height, w: rule.w * width, h: rule.h * height };
    return framed.some(box => {
      const w = Math.min(px.x + px.w, box.x + box.w + edgeTolerance) - Math.max(px.x, box.x - edgeTolerance);
      const h = Math.min(px.y + px.h, box.y + box.h + edgeTolerance) - Math.max(px.y, box.y - edgeTolerance);
      return w > 0 && h > 0 && (w * h) >= 0.9 * px.w * px.h;
    });
  };
  // a border printed twice a hair apart (adjacent cells each drawing theirs) is one rule
  const joinedRules: LayerRect[] = [];
  for (const rule of rules.filter(rule => !drawnByFrame(rule)).sort((a, b) => a.y - b.y || a.x - b.x)) {
    const px = { x: rule.x * width, y: rule.y * height, w: rule.w * width, h: rule.h * height };
    const horizontal = px.w >= px.h;
    const twin = joinedRules.find(other => {
      const o = { x: other.x * width, y: other.y * height, w: other.w * width, h: other.h * height };
      if ((o.w >= o.h) !== horizontal) return false;
      if (horizontal) {
        const shared = Math.min(o.x + o.w, px.x + px.w) - Math.max(o.x, px.x);
        return Math.abs(o.y - px.y) <= edgeTolerance && shared >= 0.8 * Math.min(o.w, px.w);
      }
      const shared = Math.min(o.y + o.h, px.y + px.h) - Math.max(o.y, px.y);
      return Math.abs(o.x - px.x) <= edgeTolerance && shared >= 0.8 * Math.min(o.h, px.h);
    });
    if (twin) {
      const o = { x: twin.x * width, y: twin.y * height, w: twin.w * width, h: twin.h * height };
      const x = Math.min(o.x, px.x), y = Math.min(o.y, px.y);
      twin.x = fx(x); twin.y = fy(y);
      twin.w = fx(Math.max(o.x + o.w, px.x + px.w) - x);
      twin.h = fy(Math.max(o.y + o.h, px.y + px.h) - y);
    } else {
      joinedRules.push({ ...rule });
    }
  }
  const keptRules = joinedRules;

  // whatever dark paper is left, in coarse cells, clusters into pictures
  const cell = 8;
  const cols = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  const grid = new Uint8Array(cols * rows);
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) if (mask[row + x]) grid[Math.floor(y / cell) * cols + Math.floor(x / cell)] = 1;
  }
  const explained: Rect[] = [
    // glyphs overshoot their boxes, and fake-bold prints a hair to the side
    ...textBoxes.map(box => { const pad = Math.max(3, box.h * 0.35); return { x: box.x - pad, y: box.y - pad, w: box.w + 2 * pad, h: box.h + 2 * pad }; }),
    ...keptRules.map(rule => ({ x: rule.x * width - 2, y: rule.y * height - 2, w: rule.w * width + 4, h: rule.h * height + 4 })),
    ...fills.map(fill => ({ x: fill.x * width - 2, y: fill.y * height - 2, w: fill.w * width + 4, h: fill.h * height + 4 })),
    ...ticks.map(tick => ({ x: tick.x - 2, y: tick.y - 2, w: tick.w + 4, h: tick.h + 4 })),
    ...combRows.map(row => ({ x: row.x - 2, y: row.y - 2, w: row.w + 4, h: row.h + 4 })),
  ];
  for (const rect of explained) {
    const c1 = Math.max(0, Math.floor(rect.x / cell)), c2 = Math.min(cols - 1, Math.floor((rect.x + rect.w) / cell));
    const r1 = Math.max(0, Math.floor(rect.y / cell)), r2 = Math.min(rows - 1, Math.floor((rect.y + rect.h) / cell));
    for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) grid[r * cols + c] = 0;
  }
  const seen = new Uint8Array(cols * rows);
  const minSide = Math.max(12, width * 0.012);
  for (let start = 0; start < grid.length; start++) {
    if (!grid[start] || seen[start]) continue;
    const stack = [start];
    seen[start] = 1;
    let c1 = cols, c2 = -1, r1 = rows, r2 = -1;
    while (stack.length) {
      const index = stack.pop()!;
      const r = Math.floor(index / cols), c = index % cols;
      c1 = Math.min(c1, c); c2 = Math.max(c2, c); r1 = Math.min(r1, r); r2 = Math.max(r2, r);
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
        const next = nr * cols + nc;
        if (grid[next] && !seen[next]) { seen[next] = 1; stack.push(next); }
      }
    }
    const rect = { x: c1 * cell, y: r1 * cell, w: (c2 - c1 + 1) * cell, h: (r2 - r1 + 1) * cell };
    if (rect.w < minSide || rect.h < minSide) continue;
    if (darkRatio(mask, width, height, rect, 0) < 0.03) continue;
    // leftovers hugging printed text are that text's own edges, not a picture
    const textShare = textBoxes.reduce((sum, box) => {
      const w = Math.min(box.x + box.w, rect.x + rect.w) - Math.max(box.x, rect.x);
      const h = Math.min(box.y + box.h, rect.y + rect.h) - Math.max(box.y, rect.y);
      return sum + (w > 0 && h > 0 ? w * h : 0);
    }, 0) / (rect.w * rect.h);
    if (textShare > 0.35) continue;
    pictures.push(rect);
  }
  // overlapping picture regions become one crop
  const merged: Rect[] = [];
  for (const rect of pictures.sort((a, b) => b.w * b.h - a.w * a.h)) {
    const hit = merged.find(other => intersects(other, rect, 4));
    if (hit) {
      const x = Math.min(hit.x, rect.x), y = Math.min(hit.y, rect.y);
      hit.w = Math.max(hit.x + hit.w, rect.x + rect.w) - x;
      hit.h = Math.max(hit.y + hit.h, rect.y + rect.h) - y;
      hit.x = x; hit.y = y;
    } else {
      merged.push({ ...rect });
    }
  }
  return {
    rules: keptRules,
    fills,
    frames,
    combs,
    pictures: merged.slice(0, 20).map(rect => ({
      x: Math.max(0, rect.x - 3), y: Math.max(0, rect.y - 3),
      w: Math.min(width - Math.max(0, rect.x - 3), rect.w + 6), h: Math.min(height - Math.max(0, rect.y - 3), rect.h + 6),
    })),
  };
}
