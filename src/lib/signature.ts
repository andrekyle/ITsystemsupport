/**
 * Reads a photo/scan of a signature and extracts only the pen strokes.
 *
 * Ink is detected by LOCAL contrast: a pixel counts as ink only when it is
 * clearly darker than the brightest paper in its own neighbourhood. Because
 * pen strokes are thin, the paper right next to them is always visible — but
 * the inside of a shadow, a dark table edge or a phone-camera vignette is not
 * darker than its surroundings, so those large dark areas disappear entirely.
 *
 * Afterwards small specks (dust, paper grain, noise) and blobs hugging the
 * photo border are dropped, the ink is redrawn in a clean dark colour and the
 * image is cropped to just the signature.
 */
export function fileToSignature(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  return loadAndExtract(url).finally(() => URL.revokeObjectURL(url));
}

/**
 * Re-runs the ink extraction on an already-saved signature image (data-URL).
 * Used to clean up signatures that were processed by an older, weaker filter
 * and still contain shadows or dark blobs. Returns null when nothing usable
 * can be extracted — callers should keep the existing image in that case.
 */
export async function reprocessSignature(dataUrl: string): Promise<string | null> {
  try {
    const next = await loadAndExtract(dataUrl);
    return next === dataUrl ? null : next;
  } catch {
    return null;
  }
}

function loadAndExtract(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const w = Math.min(480, img.width);
        const h = Math.max(1, Math.round((img.height / img.width) * w));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas not supported");
        // white underlay so transparent PNGs (already-processed signatures)
        // read as ink-on-paper
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const px = ctx.getImageData(0, 0, w, h).data;

        const lum = new Float32Array(w * h);
        for (let i = 0, j = 0; i < px.length; i += 4, j++) {
          lum[j] = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
        }

        // local paper brightness = max luminance within ~1/20th of the image;
        // strokes are thinner than this window, shadows are much wider
        const radius = Math.max(8, Math.round(w / 40));
        const bg = maxFilter(lum, w, h, radius);

        // ink = clearly darker than the local paper (relative + absolute floor)
        const alpha = new Uint8Array(w * h);
        for (let j = 0; j < lum.length; j++) {
          const paper = bg[j];
          if (paper < 60) continue; // inside a big dark area — not paper at all
          const start = Math.max(14, paper * 0.18); // ignore soft shading
          const full = Math.max(40, paper * 0.42); // fully opaque ink
          const a = ((paper - lum[j] - start) / (full - start)) * 255;
          alpha[j] = Math.max(0, Math.min(255, Math.round(a)));
        }

        // drop specks, anything hugging the photo border, and the paper-edge
        // band next to dark surroundings (table, background)
        const minArea = Math.max(24, Math.round((w * h) / 4000));
        const keep = cleanComponents(alpha, lum, w, h, minArea);

        // crop to the signature with a little padding
        let minX = w, minY = h, maxX = -1, maxY = -1;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            if (keep[y * w + x] && alpha[y * w + x] > 0) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        if (maxX < 0) throw new Error("No signature found");
        const pad = 10;
        minX = Math.max(0, minX - pad);
        minY = Math.max(0, minY - pad);
        maxX = Math.min(w - 1, maxX + pad);
        maxY = Math.min(h - 1, maxY + pad);
        const cw = maxX - minX + 1;
        const ch = maxY - minY + 1;

        const out = document.createElement("canvas");
        out.width = cw;
        out.height = ch;
        const octx = out.getContext("2d");
        if (!octx) throw new Error("Canvas not supported");
        const odata = octx.createImageData(cw, ch);
        const opx = odata.data;
        for (let y = 0; y < ch; y++) {
          for (let x = 0; x < cw; x++) {
            const src = (y + minY) * w + (x + minX);
            const o = (y * cw + x) * 4;
            // clean dark ink — removes any colour cast from the photo
            opx[o] = 16;
            opx[o + 1] = 16;
            opx[o + 2] = 32;
            opx[o + 3] = keep[src] ? alpha[src] : 0;
          }
        }
        octx.putImageData(odata, 0, 0);
        resolve(out.toDataURL("image/png"));
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Could not read image"));
      }
    };
    img.onerror = () => {
      reject(new Error("Could not read image"));
    };
    img.src = src;
  });
}

/** Separable grayscale dilation — the max value within a square window. */
function maxFilter(src: Float32Array, w: number, h: number, r: number): Float32Array {
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      let m = 0;
      const x0 = Math.max(0, x - r);
      const x1 = Math.min(w - 1, x + r);
      for (let k = x0; k <= x1; k++) if (src[row + k] > m) m = src[row + k];
      tmp[row + x] = m;
    }
  }
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      let m = 0;
      const y0 = Math.max(0, y - r);
      const y1 = Math.min(h - 1, y + r);
      for (let k = y0; k <= y1; k++) if (tmp[k * w + x] > m) m = tmp[k * w + x];
      out[y * w + x] = m;
    }
  }
  return out;
}

/**
 * Marks which pixels belong to ink blobs worth keeping: at least `minArea`
 * pixels big, not hugging the photo border, and not running along the edge of
 * a large dark region (paper edges against a dark table always do). Kept
 * blobs are grown by one pixel so soft anti-aliased stroke edges survive.
 */
function cleanComponents(
  alpha: Uint8Array,
  lum: Float32Array,
  w: number,
  h: number,
  minArea: number
): Uint8Array {
  const solid = 48; // alpha below this is haze, not ink
  const dark = 60; // luminance below this = dark surroundings, not paper
  // a neighbouring pixel that is dark but NOT ink = a big dark region next door
  const darkNb = (n: number) => alpha[n] < solid && lum[n] < dark;
  const label = new Int32Array(w * h); // 0 = unvisited, -1 = dropped, 1 = kept
  const stack: number[] = [];
  const component: number[] = [];

  for (let s = 0; s < w * h; s++) {
    if (label[s] !== 0 || alpha[s] < solid) continue;
    stack.length = 0;
    component.length = 0;
    stack.push(s);
    label[s] = -1;
    let borderCount = 0;
    let darkEdgeCount = 0;
    while (stack.length) {
      const c = stack.pop() as number;
      component.push(c);
      const x = c % w;
      const y = (c - x) / w;
      if (x < 2 || x > w - 3 || y < 2 || y > h - 3) borderCount++;
      if (
        (x > 0 && darkNb(c - 1)) ||
        (x < w - 1 && darkNb(c + 1)) ||
        (c >= w && darkNb(c - w)) ||
        (c < w * (h - 1) && darkNb(c + w))
      )
        darkEdgeCount++;
      if (x > 0 && label[c - 1] === 0 && alpha[c - 1] >= solid) {
        label[c - 1] = -1;
        stack.push(c - 1);
      }
      if (x < w - 1 && label[c + 1] === 0 && alpha[c + 1] >= solid) {
        label[c + 1] = -1;
        stack.push(c + 1);
      }
      if (c >= w && label[c - w] === 0 && alpha[c - w] >= solid) {
        label[c - w] = -1;
        stack.push(c - w);
      }
      if (c < w * (h - 1) && label[c + w] === 0 && alpha[c + w] >= solid) {
        label[c + w] = -1;
        stack.push(c + w);
      }
    }
    const isSpeck = component.length < minArea;
    const hugsBorder = borderCount > Math.max(40, component.length * 0.2);
    const hugsDarkEdge = darkEdgeCount > Math.max(15, component.length * 0.05);
    if (!isSpeck && !hugsBorder && !hugsDarkEdge) for (const c of component) label[c] = 1;
  }

  // grow kept blobs by one pixel to preserve anti-aliased edges
  const keep = new Uint8Array(w * h);
  for (let c = 0; c < w * h; c++) {
    if (label[c] !== 1) continue;
    keep[c] = 1;
    const x = c % w;
    if (x > 0) keep[c - 1] = 1;
    if (x < w - 1) keep[c + 1] = 1;
    if (c >= w) keep[c - w] = 1;
    if (c < w * (h - 1)) keep[c + w] = 1;
  }
  return keep;
}
