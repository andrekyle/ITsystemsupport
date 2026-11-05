import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from '@napi-rs/canvas';

const source = process.argv[2] || 'public/logos/SAQA- 114076- Learner workbook.pdf';
const pdf = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(source)), useSystemFonts: true }).promise;
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'workbook-114076-'));
console.log(`PAGES ${pdf.numPages}`);
for (const number of (process.argv[3] || '1,2,3,5,7,9,10,11,12').split(',').map(Number).filter(number => number >= 1 && number <= pdf.numPages)) {
  const page = await pdf.getPage(number);
  const viewport = page.getViewport({ scale: 1.1 });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  await page.render({ canvasContext: canvas.getContext('2d'), viewport, canvas }).promise;
  const destination = path.join(directory, `page-${number}.png`);
  fs.writeFileSync(destination, canvas.toBuffer('image/png'));
  console.log(destination);
  const content = await page.getTextContent();
  console.log(`TEXT ${number}: ${content.items.map(item => item.str || '').join(' | ').slice(0, 5000)}`);
}
