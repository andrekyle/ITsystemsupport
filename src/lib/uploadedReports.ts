import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import * as XLSX from "xlsx";

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface UploadedReportResult {
  html: string;
  title: string;
  pagesOrSheets: number;
  records: number;
  kind: "pdf" | "spreadsheet";
}

const esc = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const fileStem = (name: string) => name.replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "") || "uploaded-report";

function toolbar(filename: string): string {
  return `
    <div class="toolbar" contenteditable="false">
      <button type="button" onclick="toggleEdit()">Edit report</button>
      <button type="button" onclick="downloadHtml()">Download HTML</button>
      <button type="button" onclick="window.print()">Print / Save PDF</button>
    </div>
    <script>
      var editing = false;
      function toggleEdit() {
        editing = !editing;
        document.body.contentEditable = editing ? "true" : "false";
        document.querySelector(".toolbar button").textContent = editing ? "Editing on" : "Edit report";
      }
      function downloadHtml() {
        var clone = document.documentElement.cloneNode(true);
        clone.querySelector(".toolbar").setAttribute("contenteditable", "false");
        var blob = new Blob(["<!doctype html>" + clone.outerHTML], { type: "text/html" });
        var link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = ${JSON.stringify(filename)};
        link.click();
        URL.revokeObjectURL(link.href);
      }
    </script>`;
}

function baseDocument(title: string, body: string, filename: string, landscape = false): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<style>
  * { box-sizing: border-box; }
  :root { --orange: #f47b20; --green: #126b4b; --mint: #e7f4ed; --ink: #25352f; --line: #cfe1d7; }
  body { margin: 0; padding: 32px 42px; color: var(--ink); font: 15px/1.55 "Segoe UI", Arial, sans-serif; background: #f4f7f5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  main { max-width: 1180px; margin: 0 auto; background: #fff; padding: 34px 42px; box-shadow: 0 4px 24px rgba(18, 107, 75, .12); }
  h1 { color: var(--green); margin: 0 0 4px; font-size: 30px; }
  h2 { color: var(--green); border-bottom: 3px solid var(--orange); padding-bottom: 6px; margin: 30px 0 12px; }
  .meta, .notice { background: var(--mint); border-left: 5px solid var(--orange); padding: 12px 16px; margin: 16px 0 22px; }
  .small { color: #5d6d65; font-size: 13px; }
  .page { break-after: page; }
  .page:last-child { break-after: auto; }
  .source-text { white-space: pre-wrap; font-family: "Segoe UI", Arial, sans-serif; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0 24px; }
  th { background: var(--green); color: white; text-align: left; }
  th, td { border: 1px solid var(--line); padding: 7px 9px; vertical-align: top; }
  tr:nth-child(even) td { background: #f8fbf9; }
  .sheet { break-after: page; }
  .sheet:last-child { break-after: auto; }
  .toolbar { position: fixed; right: 16px; bottom: 16px; z-index: 5; display: flex; gap: 6px; }
  .toolbar button { border: 0; border-radius: 5px; padding: 6px 9px; background: var(--green); color: white; cursor: pointer; font-size: 12px; }
  .toolbar button:hover { background: var(--orange); }
  body[contenteditable="true"] { caret-color: var(--orange); }
  body[contenteditable="true"] main { outline: 2px dashed var(--orange); outline-offset: 5px; }
  @media print {
    body { padding: 0; background: #fff; }
    main { max-width: none; box-shadow: none; padding: 10mm 12mm; }
    .toolbar { display: none !important; }
    @page { size: ${landscape ? "A4 landscape" : "A4"}; margin: 0; }
  }
</style>
</head>
<body>${toolbar(filename)}<main>${body}</main></body>
</html>`;
}

function pageText(items: Array<{ str: string; transform: number[] }>): string {
  const lines = new Map<number, { x: number; text: string }[]>();
  for (const item of items) {
    const y = Math.round(item.transform[5]);
    const row = lines.get(y) ?? [];
    row.push({ x: item.transform[4], text: item.str });
    lines.set(y, row);
  }
  return [...lines.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([, row]) => row.sort((a, b) => a.x - b.x).map((part) => part.text).join(" ").trim())
    .filter(Boolean)
    .join("\n");
}

export async function buildUploadedPdfReport(file: File): Promise<UploadedReportResult> {
  const pdf = await getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const items = content.items.filter(
      (item): item is typeof item & { str: string; transform: number[] } =>
        "str" in item && "transform" in item && typeof item.str === "string" && Array.isArray(item.transform)
    );
    pages.push(`<section class="page"><h2>Page ${pageNumber}</h2><div class="source-text">${esc(pageText(items))}</div></section>`);
  }
  const title = `${fileStem(file.name)} — Eruditio report`;
  const body = `<h1>${esc(title)}</h1>
    <div class="meta"><strong>Source:</strong> ${esc(file.name)}<br><span class="small">All extracted page text is preserved below. Edit the report in the browser before downloading or printing.</span></div>
    ${pages.join("")}`;
  return { html: baseDocument(title, body, `${fileStem(file.name)}-Styled.html`), title, pagesOrSheets: pdf.numPages, records: pages.length, kind: "pdf" };
}

export async function buildUploadedSpreadsheetReport(file: File): Promise<UploadedReportResult> {
  const workbook = XLSX.read(await file.arrayBuffer(), { cellDates: false, raw: false });
  const sheets = workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name];
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" });
    const width = rows.reduce((max, row) => Math.max(max, row.length), 0);
    const normalised = rows.map((row) => [...row, ...Array(Math.max(0, width - row.length)).fill("")]);
    const header = normalised[0] ?? [];
    const body = normalised.slice(1);
    return `<section class="sheet"><h2>${esc(name)}</h2>
      <p class="small">${body.length} data row${body.length === 1 ? "" : "s"} · ${width} column${width === 1 ? "" : "s"} · every source cell is retained</p>
      <table><thead><tr>${(header.length ? header : Array.from({ length: width }, (_, i) => `Column ${i + 1}`)).map((cell, i) => `<th>${esc(String(cell || `Column ${i + 1}`))}</th>`).join("")}</tr></thead>
      <tbody>${body.map((row) => `<tr>${row.map((cell) => `<td>${esc(String(cell))}</td>`).join("")}</tr>`).join("")}</tbody></table></section>`;
  });
  const records = sheets.reduce((total, sheet) => total + (sheet.match(/<tr>/g)?.length ?? 0), 0);
  const title = `${fileStem(file.name)} — Eruditio tracker`;
  const body = `<h1>${esc(title)}</h1>
    <div class="meta"><strong>Source:</strong> ${esc(file.name)}<br><span class="small">Workbook structure and every populated cell are preserved. Edit any report text or table cell before downloading or printing.</span></div>
    ${sheets.join("")}`;
  return { html: baseDocument(title, body, `${fileStem(file.name)}-Styled.html`, true), title, pagesOrSheets: workbook.SheetNames.length, records, kind: "spreadsheet" };
}

export async function buildUploadedReport(file: File): Promise<UploadedReportResult> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "pdf" || file.type === "application/pdf") return buildUploadedPdfReport(file);
  if (extension === "xlsx" || extension === "xls" || extension === "csv" || file.type.includes("spreadsheet")) {
    return buildUploadedSpreadsheetReport(file);
  }
  throw new Error("Upload a PDF or Excel workbook (.xlsx/.xls/.csv).");
}
