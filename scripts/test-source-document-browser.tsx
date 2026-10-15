import React from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import JSZip from "jszip";
import { PracticalTask } from "../src/components/PracticalTask";
import { importUnitSource } from "../src/lib/unitSourceImport";
import { practicalTaskFromSource } from "../src/lib/practicalTaskImport";
import type { Profile } from "../src/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function pdfFile(blankSecondPage = false): Promise<File> {
  const { default: PDFDocument } = await import("pdfkit/js/pdfkit.standalone.js");
  const pdf = new PDFDocument({ compress: false });
  const chunks: Uint8Array[] = [];
  const ready = new Promise<File>((resolve, reject) => {
    pdf.on("data", (chunk: Uint8Array) => chunks.push(new Uint8Array(chunk)));
    pdf.on("end", () => resolve(new File(chunks, "source.pdf", { type: "application/pdf" })));
    pdf.on("error", reject);
  });
  pdf.font("Helvetica").text("Learner Workbook").text("Name:").text("1. Read.").text("Total: 10");
  pdf.addPage();
  if (!blankSecondPage) pdf.text("Sign-off").text("Date:").text("Total: 15").text("End.");
  pdf.end();
  return ready;
}

export async function testSourceDocuments() {
  const pdfText = await importUnitSource(await pdfFile());
  assert(pdfText.split("\f").length === 2, "Both PDF pages must survive extraction.");
  for (const text of ["Learner Workbook", "Name:", "1. Read.", "Total: 10", "Sign-off", "Date:", "Total: 15", "End."]) {
    assert(pdfText.includes(text), `PDF extraction lost ${text}.`);
  }
  let rejected = false;
  try { await importUnitSource(await pdfFile(true)); }
  catch (error) { rejected = error instanceof Error && error.message.includes("Page 2 has no readable text"); }
  assert(rejected, "A PDF with an unreadable page must not publish partial content.");

  const zip = new JSZip();
  zip.file("word/numbering.xml", `<w:numbering xmlns:w="urn:word"><w:abstractNum w:abstractNumId="1"><w:lvl w:ilvl="0"><w:start w:val="3"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="1"/></w:num></w:numbering>`);
  const list = (text: string) => `<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>${text}</w:t></w:r></w:p>`;
  const cell = (text: string) => `<w:tc><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:tc>`;
  zip.file("word/document.xml", `<w:document xmlns:w="urn:word"><w:body><w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>Original heading</w:t></w:r></w:p>${list("Read.")}${list("Write.")}<w:tbl><w:tr>${cell("Task")}${cell("Marks")}${cell("Answer")}</w:tr><w:tr>${cell("Explain")}${cell("5")}${cell("")}</w:tr><w:tr>${cell("Line one</w:t><w:br/><w:t>Line two")}${cell("2")}${cell("")}</w:tr></w:tbl></w:body></w:document>`);
  const wordText = await importUnitSource(new File([await zip.generateAsync({ type: "blob" })], "source.docx"));
  assert(wordText.startsWith("# Original heading"), "Semantic Word headings must survive, not font styling.");
  assert(wordText.includes("3. Read.") && wordText.includes("4. Write."), "Word numbering must retain its original starting value.");
  const wordDocument = practicalTaskFromSource(wordText, "source.docx", "Test unit");
  const table = wordDocument.sections.flatMap(section => section.blocks ?? []).find(block => block.kind === "table");
  assert(table?.kind === "table" && table.rows.length === 2 && table.rows[0][2] === "" && table.rows[1][0] === "Line one\nLine two", "Table rows, blank answers and cell line breaks must survive.");

  const source = [
    "# Learner Workbook", "Name:", "C", "NYS", "1. Read.", "2. Write.",
    "| Task | Marks | Answer |", "| --- | --- | --- |", "| Explain | 5 | |",
    "\f", "# Sign-off", "Total: 10", "Total: 15", '<img src="x" onerror="alert(1)">',
  ].join("\n");
  const documentModel = practicalTaskFromSource(source, "workbook.pdf", "Test unit");
  const fixture = document.createElement("div");
  document.body.append(fixture);
  const root = createRoot(fixture);
  const profile = { id: "source-test", name: "Test learner", role: "Learner" } as Profile;
  const saved: Record<string, string | boolean> = {};
  const mount = (prefix: string) => flushSync(() => root.render(<PracticalTask
    key={prefix} document={JSON.parse(JSON.stringify(documentModel))} unitId="114046"
    profile={profile} values={saved} storagePrefix={prefix}
    onChange={(key, value) => { saved[key] = value; }}
  />));
  try {
    for (const prefix of ["learner-workbook.", "", "editable-document.extra."]) {
      mount(prefix);
      const article = fixture.querySelector(".source-document");
      assert(article && !fixture.querySelector(".pt-pdf-document"), "Uploaded source must override the built-in 114046 document.");
      assert(article.querySelectorAll("[data-source-page]").length === 2, "Renderer must show both source page boundaries.");
      assert(article.querySelectorAll("ol li").length === 2 && article.querySelectorAll("table tbody tr").length === 1, "Renderer must use semantic lists and tables.");
      assert(!article.querySelector("img"), "HTML-looking source must remain inert text.");
      const text = article.textContent ?? "";
      assert(text.indexOf("Total: 10") < text.indexOf("Total: 15") && text.includes("NYS"), "Conflicting totals and short statuses must remain in order.");
      const input = article.querySelector<HTMLInputElement>('input[aria-label="Name:"]');
      assert(input, "Source fields must remain editable.");
      input.value = `Answer ${prefix}`;
      input.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
      assert(Object.entries(saved).some(([key, value]) => key.startsWith(`${prefix}practical.`) && value === `Answer ${prefix}`), "Answers must save under the document's isolated prefix.");
      flushSync(() => root.render(null));
      mount(prefix);
      assert(fixture.querySelector<HTMLInputElement>('input[aria-label="Name:"]')?.value === `Answer ${prefix}`, "Saved answers must reload after serialization and remount.");
    }
    assert(Object.keys(saved).length === 3, "Workbook, practical and extra document answers must not overwrite one another.");
  } finally {
    flushSync(() => root.unmount());
    fixture.remove();
  }
  return "Passed actual PDF/DOCX extraction, page rejection, headings, original numbering, blank table cells, inert source HTML and source rendering with isolated save/reload.";
}
