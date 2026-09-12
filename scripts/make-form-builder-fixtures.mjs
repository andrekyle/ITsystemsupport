import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import PDFDocument from "pdfkit";
import JSZip from "jszip";
import sharp from "sharp";

const folder = join(tmpdir(), "itss-form-builder-tests");
await mkdir(folder, { recursive: true });

async function pdf(name, fillable) {
  const document = new PDFDocument({ size: "A4", margin: 48 });
  const chunks = [];
  const done = new Promise(resolve => {
    document.on("data", chunk => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
  });
  document.font("Helvetica").fontSize(20).text("Equipment request");
  document.fontSize(12).text("Full name", 48, 112);
  document.text("Equipment", 48, 176);
  document.text("I accept responsibility for the equipment", 72, 242);
  if (fillable) {
    document.initForm();
    document.formText("Full name", 48, 132, 360, 24, { required: true });
    document.formCombo("Equipment", 48, 196, 360, 24, { select: ["Laptop", "Switch"], required: true });
    document.formCheckbox("I accept responsibility", 48, 240, 16, 16, { required: true });
  } else {
    document.rect(48, 132, 360, 24).stroke();
    document.rect(48, 196, 360, 24).stroke();
    document.rect(48, 240, 16, 16).stroke();
  }
  document.end();
  const path = join(folder, name);
  await writeFile(path, await done);
  return path;
}

const nativePdf = await pdf("equipment-request-fillable.pdf", true);
const scannedPdf = await pdf("equipment-request-paper.pdf", false);
const word = new JSZip();
word.file("[Content_Types].xml", '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>');
word.file("word/document.xml", '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Equipment request</w:t></w:r></w:p><w:p><w:r><w:t>Full name: __________</w:t></w:r></w:p><w:p><w:r><w:t>Equipment: Laptop / Switch</w:t></w:r></w:p></w:body></w:document>');
const wordPath = join(folder, "equipment-request.docx");
await writeFile(wordPath, await word.generateAsync({ type: "nodebuffer" }));
const imagePath = join(folder, "equipment-request.png");
await sharp({ text: { text: '<span foreground="black">Equipment request\n\nFull name: __________\n\nEquipment: Laptop / Switch</span>', width: 700, height: 480, rgba: true } }).flatten({ background: "#ffffff" }).png().toFile(imagePath);
console.log(JSON.stringify({ nativePdf, scannedPdf, wordPath, imagePath }));