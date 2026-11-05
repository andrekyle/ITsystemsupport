import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

const require = createRequire(import.meta.url);
const { createCanvas } = require("@napi-rs/canvas");
const source = path.resolve("public/logos/SAQA -114074    - Learner Guide.pdf");
const destination = path.resolve("public/learner-guide-114074");

if (!fs.existsSync(source)) throw new Error(`Guide PDF is missing: ${source}`);
fs.mkdirSync(destination, { recursive: true });
const wasmUrl = pathToFileURL(`${path.resolve("node_modules/pdfjs-dist/wasm")}${path.sep}`).href;
const pdf = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(source)), useSystemFonts: true, wasmUrl }).promise;
const pages = [];
for (let number = 1; number <= pdf.numPages; number += 1) {
  const page = await pdf.getPage(number);
  const viewport = page.getViewport({ scale: 1.6 });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const context = canvas.getContext("2d");
  await page.render({ canvasContext: context, viewport, canvas }).promise;
  const originalPixels = context.getImageData(0, 0, canvas.width, canvas.height);
  const content = await page.getTextContent();
  const items = content.items.filter(item => item.str?.trim()).map(item => ({
    text: item.str,
    x: item.transform[4],
    y: page.view[3] - item.transform[5] - item.height,
    width: item.width,
    height: item.height,
    bold: /_f[13579]$/.test(item.fontName),
  }));
  if (number > 1) {
    for (const item of items) {
      const x = Math.max(0, Math.round(item.x * 1.6));
      const y = Math.max(0, Math.round(item.y * 1.6));
      const width = Math.min(canvas.width - x, Math.ceil(item.width * 1.6) + 6);
      const height = Math.min(canvas.height - y, Math.ceil(item.height * 1.6) + 7);
      if (width <= 0 || height <= 0) continue;
      const sample = context.getImageData(Math.max(0, x - 4), Math.min(canvas.height - 1, y + Math.round(height / 2)), 1, 1).data;
      context.fillStyle = `rgb(${sample[0]},${sample[1]},${sample[2]})`;
      context.fillRect(x - 3, y - 3, width, height);
    }
    const cleanedPixels = context.getImageData(0, 0, canvas.width, canvas.height);
    const { width, height } = canvas;
    const linePixel = (index) => {
      const r = originalPixels.data[index], g = originalPixels.data[index + 1], b = originalPixels.data[index + 2];
      return (r < 170 && g < 170 && b < 170) || (Math.max(r, g, b) - Math.min(r, g, b) > 90 && Math.min(r, g, b) < 170);
    };
    const restore = (index) => {
      for (let channel = 0; channel < 4; channel += 1) cleanedPixels.data[index + channel] = originalPixels.data[index + channel];
    };
    for (let y = 0; y < height; y += 1) {
      let start = -1;
      for (let x = 0; x <= width; x += 1) {
        const dark = x < width && linePixel((y * width + x) * 4);
        if (dark && start < 0) start = x;
        if ((!dark || x === width) && start >= 0) {
          if (x - start >= 90) for (let col = start; col < x; col += 1) restore((y * width + col) * 4);
          start = -1;
        }
      }
    }
    for (let x = 0; x < width; x += 1) {
      let start = -1;
      for (let y = 0; y <= height; y += 1) {
        const dark = y < height && linePixel((y * width + x) * 4);
        if (dark && start < 0) start = y;
        if ((!dark || y === height) && start >= 0) {
          if (y - start >= 90) for (let row = start; row < y; row += 1) restore((row * width + x) * 4);
          start = -1;
        }
      }
    }
    context.putImageData(cleanedPixels, 0, 0);
  }
  const filename = `page-${String(number).padStart(2, "0")}.png`;
  fs.writeFileSync(path.join(destination, filename), canvas.toBuffer("image/png"));
  pages.push({ number, image: filename, width: page.view[2], height: page.view[3], items });
  console.log(`Rendered guide page ${number}/${pdf.numPages}`);
}
fs.writeFileSync(path.join(destination, "pages.json"), JSON.stringify({ source: path.basename(source), pages }));
