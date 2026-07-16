// Extracts all media from a .pptx and reports which slides reference which images.
import JSZip from "jszip";
import { readFileSync, writeFileSync, mkdirSync } from "fs";

const file = process.argv[2];
const outDir = process.argv[3] ?? "pptx-media";
mkdirSync(outDir, { recursive: true });
const zip = await JSZip.loadAsync(readFileSync(file));

// media files
for (const name of Object.keys(zip.files)) {
  if (name.startsWith("ppt/media/")) {
    const buf = await zip.file(name).async("nodebuffer");
    const out = `${outDir}/${name.split("/").pop()}`;
    writeFileSync(out, buf);
    console.log("wrote", out, buf.length, "bytes");
  }
}

// slide -> image relationships
const relNames = Object.keys(zip.files).filter((n) => /^ppt\/slides\/_rels\/slide\d+\.xml\.rels$/.test(n));
for (const rn of relNames.sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))) {
  const xml = await zip.file(rn).async("string");
  const media = [...xml.matchAll(/Target="\.\.\/media\/([^"]+)"/g)].map((m) => m[1]);
  if (media.length) console.log(rn.match(/slide\d+/)[0], "->", media.join(", "));
}
