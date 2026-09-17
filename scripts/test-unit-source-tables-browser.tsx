import JSZip from "jszip";
import { importUnitSource } from "../src/lib/unitSourceImport";
import "../src/styles.css";

const wordNamespace = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const drawingNamespace = "http://schemas.openxmlformats.org/drawingml/2006/main";
const paragraph = (text: string, prefix = "w") => `<${prefix}:p><${prefix}:r><${prefix}:t>${text}</${prefix}:t></${prefix}:r></${prefix}:p>`;
const cell = (text: string, prefix = "w") => `<${prefix}:tc>${paragraph(text, prefix)}</${prefix}:tc>`;
const row = (values: string[], prefix = "w") => `<${prefix}:tr>${values.map(value => cell(value, prefix)).join("")}</${prefix}:tr>`;
const table = (rows: string[], prefix = "w") => `<${prefix}:tbl>${rows.join("")}</${prefix}:tbl>`;
function assert(ok: unknown, message: string): asserts ok { if (!ok) throw new Error(message); }
async function zippedFile(files: Record<string, string>, extension: string) {
  const zip = new JSZip();
  Object.entries(files).forEach(([path, value]) => zip.file(path, value));
  return new File([await zip.generateAsync({ type: "blob" })], `table-fixture.${extension}`);
}
async function test() {
  const wordTable = table([
    row(["Item", "Description", "Quantity"]),
    `<w:tr>${cell("A-1")}<w:tc>${paragraph("First paragraph.")}${paragraph("Second | paragraph.")}</w:tc>${cell("2")}</w:tr>`,
    `<w:tr><w:tc><w:tcPr><w:gridSpan w:val="2"/></w:tcPr>${paragraph("Merged note")}</w:tc>${cell("3")}</w:tr>`,
    `<w:tr>${cell("Nested")}<w:tc>${paragraph("Before nested content")}${table([row(["nested value"])])}</w:tc>${cell("4")}</w:tr>`,
  ]);
  const wordDocument = `<w:document xmlns:w="${wordNamespace}"><w:body>${paragraph("Before the table.")}<w:sdt><w:sdtContent>${wordTable}</w:sdtContent></w:sdt>${paragraph("After the table.")}${table([row(["Code", "Path"]), row(["B-2", "C:\\work\\draft"])])}</w:body></w:document>`;
  const wordText = await importUnitSource(await zippedFile({ "word/document.xml": wordDocument }, "docx"));
  assert(wordText === [
    "Before the table.",
    "| Item | Description | Quantity |\n| --- | --- | --- |\n| A-1 | First paragraph. Second \\| paragraph. | 2 |\n| Merged note |  | 3 |\n| Nested | Before nested content nested value | 4 |",
    "After the table.",
    "| Code | Path |\n| --- | --- |\n| B-2 | C:\\\\work\\\\draft |",
  ].join("\n\n"), `DOCX preserves table cells, order, merged/nested text, and escaped delimiters:\n${wordText}`);

  const slide = (contents: string) => `<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="${drawingNamespace}"><p:cSld><p:spTree>${contents}</p:spTree></p:cSld></p:sld>`;
  const shape = (text: string) => `<p:sp><p:txBody>${paragraph(text, "a")}</p:txBody></p:sp>`;
  const presentationTable = table([
    row(["Task", "Hours"], "a"),
    `<a:tr>${cell("Review", "a")}<a:tc><a:txBody>${paragraph("2", "a")}${paragraph("hours", "a")}</a:txBody></a:tc></a:tr>`,
    `<a:tr><a:tc gridSpan="2">${paragraph("Merged slide note", "a")}</a:tc><a:tc hMerge="1">${paragraph("", "a")}</a:tc></a:tr>`,
  ], "a");
  const pptText = await importUnitSource(await zippedFile({
    "ppt/slides/slide10.xml": slide(shape("Later slide") + shape("Later text")),
    "ppt/slides/slide2.xml": slide(`<p:graphicFrame><a:graphic><a:graphicData>${presentationTable}</a:graphicData></a:graphic></p:graphicFrame>` + shape("Actual slide title") + shape("Following paragraph")),
    "ppt/notesSlides/notesSlide1.xml": slide(shape("Speaker notes are not slide content")),
  }, "pptx"));
  assert(pptText === [
    "| Task | Hours |\n| --- | --- |\n| Review | 2 hours |\n| Merged slide note |  |",
    "# Actual slide title",
    "Following paragraph",
    "# Later slide",
    "Later text",
  ].join("\n\n"), `PPTX preserves table/paragraph order and only promotes actual non-table title:\n${pptText}`);

  const textOnly = await importUnitSource(await zippedFile({ "word/document.xml": `<w:document xmlns:w="${wordNamespace}"><w:body>${paragraph("Ordinary text")}${paragraph("More ordinary text")}</w:body></w:document>` }, "docx"));
  assert(textOnly === "Ordinary text\n\nMore ordinary text", "Normal documents remain normal paragraphs");
  document.getElementById("fixture")!.textContent = wordText + "\n\n" + pptText;
  document.getElementById("result")!.textContent = "PASS: DOCX/PPTX tables retain cells, rows, document order, multiline and merged text; slide titles exclude table cells; ordinary paragraphs unchanged.";
  document.body.dataset.result = "passed";
}
void test().catch(error => {
  document.getElementById("result")!.textContent = String(error instanceof Error ? error.stack : error);
  document.body.dataset.result = "failed";
});
