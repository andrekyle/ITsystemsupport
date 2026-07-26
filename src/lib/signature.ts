/**
 * Reads a photo/scan of a signature on white paper and enhances it: adapts to
 * the photo's lighting, removes the paper plus any yellow/grey shadows, and
 * redraws the ink in a clean dark colour so only a crisp signature remains.
 * Small dark specks (paper texture, dust, camera noise) are removed so the
 * result has no black spots.
 */
export function fileToSignature(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const w = Math.min(480, img.width);
      const h = Math.round((img.height / img.width) * w);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h);
      const px = data.data;

      // estimate the paper brightness (75th percentile of luminance) so the
      // cut-off adapts to dim photos, yellow paper tints and soft shadows
      const lums = new Float32Array(px.length / 4);
      for (let i = 0, j = 0; i < px.length; i += 4, j++) {
        lums[j] = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
      }
      const sorted = Float32Array.from(lums).sort();
      const paper = Math.max(120, sorted[Math.floor(sorted.length * 0.75)]);

      // pixels close to paper brightness (incl. yellowish shadows) → transparent;
      // clearly darker pixels = ink, redrawn in a uniform dark colour
      const start = paper * 0.85; // must be >15% darker than the paper to count
      const full = paper * 0.55; // 45% darker = fully opaque ink
      const alpha = new Uint8Array(w * h);
      for (let j = 0; j < lums.length; j++) {
        const a = ((start - lums[j]) / (start - full)) * 255;
        alpha[j] = Math.max(0, Math.min(255, Math.round(a)));
      }

      // despeckle: keep only connected ink blobs of a meaningful size so
      // dust, paper grain and sensor noise don't leave black spots behind
      const minArea = Math.max(24, Math.round((w * h) / 4000));
      const keep = despeckle(alpha, w, h, minArea);

      for (let i = 0, j = 0; i < px.length; i += 4, j++) {
        px[i + 3] = keep[j] ? alpha[j] : 0;
        // clean dark ink — removes any yellow/brown colour cast from the photo
        px[i] = 16;
        px[i + 1] = 16;
        px[i + 2] = 32;
      }
      ctx.putImageData(data, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}

/**
 * Marks which pixels belong to ink blobs at least `minArea` pixels big.
 * Isolated specks smaller than that are dropped; kept blobs are grown by one
 * pixel so soft anti-aliased stroke edges survive.
 */
function despeckle(alpha: Uint8Array, w: number, h: number, minArea: number): Uint8Array {
  const solid = 48; // alpha below this is haze, not ink
  const label = new Int32Array(w * h); // 0 = unvisited, -1 = dropped, 1 = kept
  const stack: number[] = [];
  const component: number[] = [];

  for (let s = 0; s < w * h; s++) {
    if (label[s] !== 0 || alpha[s] < solid) continue;
    stack.length = 0;
    component.length = 0;
    stack.push(s);
    label[s] = -1;
    while (stack.length) {
      const c = stack.pop() as number;
      component.push(c);
      const x = c % w;
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
    if (component.length >= minArea) for (const c of component) label[c] = 1;
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
