// Dumps all text from a .pptx, slide by slide, preserving paragraph structure.
import JSZip from "jszip";
import { readFileSync } from "fs";

const file = process.argv[2];
const zip = await JSZip.loadAsync(readFileSync(file));
const slideNames = Object.keys(zip.files)
  .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
  .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));

for (const name of slideNames) {
  const xml = await zip.file(name).async("string");
  console.log(`\n===== ${name} =====`);
  // paragraphs: <a:p> ... </a:p>; runs: <a:t>text</a:t>
  const paras = xml.split(/<a:p[ >]/).slice(1);
  for (const p of paras) {
    const texts = [...p.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((m) => m[1]);
    if (texts.length) console.log("• " + texts.join(""));
  }
}
