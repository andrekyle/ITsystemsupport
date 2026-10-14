import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import * as XLSX from "xlsx";
import type { Profile } from "../types";
import { docToolbar } from "./certificates";
import {
  deckDocumentHtml,
  eruditioLogoDataUrl,
  requestReport,
  type AiDeck,
  type ReportKind,
} from "./reports";
import { enhanceTrackerHtml } from "./trackerEditor";

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface UploadedReportResult {
  html: string;
  title: string;
  pagesOrSheets: number;
  records: number;
  kind: "pdf" | "spreadsheet";
}

interface PdfSource {
  sourceFile: string;
  sourceType: "pdf";
  pages: { page: number; text: string }[];
}

interface SpreadsheetSource {
  sourceFile: string;
  sourceType: "spreadsheet";
  sheets: { name: string; rows: string[][] }[];
}

const UPLOADED_KIND: ReportKind = {
  id: "uploaded-source",
  name: "Uploaded source report",
  desc: "An Eruditio-styled report generated from an uploaded source document.",
  icon: "document",
};

const fileStem = (name: string) =>
  name.replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "") || "uploaded-report";

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

function sourceDataForAi(source: PdfSource | SpreadsheetSource): unknown {
  if (source.sourceType === "pdf") {
    return {
      sourceFile: source.sourceFile,
      sourceType: source.sourceType,
      pageCount: source.pages.length,
      pages: source.pages,
      completenessRule: "Use every named learner and every substantive source section in the styled report. No appendix will be added.",
    };
  }
  return {
    sourceFile: source.sourceFile,
    sourceType: source.sourceType,
    sheetCount: source.sheets.length,
    sheets: source.sheets,
    completenessRule: "Use every named learner and worksheet in the styled report. No appendix will be added.",
  };
}

async function renderStyledSource(
  file: File,
  source: PdfSource | SpreadsheetSource,
  author: Profile
): Promise<UploadedReportResult> {
  const result = await requestReport(UPLOADED_KIND, sourceDataForAi(source), undefined, "report");
  if (!result.ok || !result.deck) {
    const reason = !result.ok ? result.error : "empty_report";
    if (reason === "not_configured") throw new Error("AI report styling is not configured on this deployment.");
    if (reason === "timeout") throw new Error("The AI took too long to style the report. Please try again.");
    throw new Error(`The AI could not create the Eruditio report (${reason}).`);
  }
  const deck: AiDeck = {
    cover: result.deck.cover,
    slides: result.deck.slides,
  };
  const title = result.deck.cover.title?.trim() || `${fileStem(file.name)} — Eruditio report`;
  const count = source.sourceType === "pdf" ? source.pages.length : source.sheets.length;
  const records = source.sourceType === "pdf"
    ? source.pages.reduce((total, page) => total + page.text.split(/\r?\n/).filter(Boolean).length, 0)
    : source.sheets.reduce((total, sheet) => total + sheet.rows.length, 0);
  const html = deckDocumentHtml(
    UPLOADED_KIND,
    deck,
    [],
    author,
    await eruditioLogoDataUrl(),
    {
      sponsorWord: "ERUDITIO",
      eyebrow: "ERUDITIO • SOURCE-BASED CLIENT REPORT",
      filename: `${fileStem(file.name)}-Styled.html`,
      footerText: "Confidential Client Report · Empower · Develop · Transform",
      metaRows: [
        ["Source file", file.name],
        ["Source type", source.sourceType === "pdf" ? "PDF document" : "Spreadsheet workbook"],
        [source.sourceType === "pdf" ? "Source pages" : "Worksheets", String(count)],
        ["Prepared by", author.name],
        ["Output", "Styled Eruditio report"],
      ],
    }
  );
  return { html, title, pagesOrSheets: count, records, kind: source.sourceType };
}

const STATUS_CLASSES: Record<string, string> = {
  NYS: "st-nys",
  C: "st-c",
  SA: "st-sa",
  IP: "st-ip",
  X: "st-x",
};

const STATUS_LEGEND: [string, string][] = [
  ["NYS", "Not yet submitted"],
  ["C", "Competent"],
  ["SA", "Submitted, in assessment"],
  ["IP", "In process of submission"],
  ["X", "Absent"],
];

const esc = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const statusClass = (value: string) => STATUS_CLASSES[value.trim().toUpperCase()] ?? "";

/** Renders one worksheet exactly as supplied — every row, every column, nothing dropped. */
function sheetTableHtml(sheet: SpreadsheetSource["sheets"][number], index: number): string {
  const width = sheet.rows.reduce((max, row) => Math.max(max, row.length), 0);
  if (width === 0) {
    return `<section class="sheet-block"><h2>${esc(sheet.name)}</h2><p class="small">This worksheet is empty.</p></section>`;
  }
  const pad = (row: string[]) => Array.from({ length: width }, (_, i) => row[i] ?? "");
  const [headerRow, ...dataRows] = sheet.rows;
  const head = `<tr>${pad(headerRow ?? [])
    .map((cell, i) => `<th class="${i < 2 ? "nm" : "c"}">${esc(cell) || "&nbsp;"}</th>`)
    .join("")}</tr>`;
  const filters = `<tr class="flt">${pad(headerRow ?? [])
    .map((_, i) =>
      i < 3
        ? `<th><input data-col="${i}" type="text" placeholder="Filter" aria-label="Filter column ${i + 1}" /></th>`
        : "<th></th>"
    )
    .join("")}</tr>`;
  const body = dataRows
    .map(
      (row) =>
        `<tr>${pad(row)
          .map((cell) => {
            const cls = statusClass(cell);
            const align = cls || cell.length <= 4 ? "c" : "";
            const classes = [align, cls].filter(Boolean).join(" ");
            const text = esc(cell) || "&nbsp;";
            return `<td${classes ? ` class="${classes}"` : ""}>${cls ? `<strong>${text}</strong>` : text}</td>`;
          })
          .join("")}</tr>`
    )
    .join("");
  return `<section class="sheet-block">
    <h2><span class="sec-num">${String(index + 1).padStart(2, "0")}</span>${esc(sheet.name)}</h2>
    <table class="tracker">${head}${filters}${body}</table>
  </section>`;
}

/** Editable, print-ready learner tracker built straight from the uploaded workbook. */
function trackerDocumentHtml(file: File, source: SpreadsheetSource, author: Profile): string {
  const today = new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
  const stem = fileStem(file.name);
  const filename = `${stem}-learner-tracker-${new Date().toISOString().slice(0, 10)}.html`;
  const learners = source.sheets.reduce((total, sheet) => total + Math.max(sheet.rows.length - 1, 0), 0);
  const usedCodes = new Set<string>();
  for (const sheet of source.sheets) {
    for (const row of sheet.rows) {
      for (const cell of row) {
        const code = cell.trim().toUpperCase();
        if (STATUS_CLASSES[code]) usedCodes.add(code);
      }
    }
  }
  const legendCodes = STATUS_LEGEND.filter(([code]) => usedCodes.has(code));
  const legend = legendCodes.length
    ? `<div class="legend">${legendCodes
        .map(
          ([code, label]) =>
            `<span class="item"><span class="sw ${STATUS_CLASSES[code]}"></span><strong>${code}</strong> ${label}</span>`
        )
        .join("")}</div>`
    : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Learner tracker report — ${esc(file.name)}</title>
<style>
  * { box-sizing: border-box; }
  body { font: 15px/1.7 "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif; color: #444; margin: 0; padding: 34px 44px; }
  h1 { font-size: 26px; margin: 0 0 3px; color: #479ef5; letter-spacing: -0.01em; }
  h2 { display: flex; align-items: center; gap: 12px; font-size: 17.5px; font-weight: 650; margin: 32px 0 12px; color: #479ef5; }
  h2::after { content: ""; flex: 1; border-top: 1px solid #e1e9f6; }
  p { margin: 0 0 12px; }
  .sub { color: #5f6368; margin: 0 0 18px; }
  .banner { background: #eef4ff; border: 1px solid #c9dbf7; border-radius: 10px; padding: 14px 18px; margin: 18px 0; }
  .small { color: #5f6368; font-size: 12px; }
  .legend { display: flex; flex-wrap: wrap; gap: 10px 26px; margin: 4px 0 18px; }
  .legend .item { display: inline-flex; align-items: center; gap: 9px; font-size: 14px; color: #444; }
  .legend .sw { width: 16px; height: 16px; border-radius: 4px; display: inline-block; box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08); }
  table.tracker { border-collapse: collapse; width: 100%; margin: 8px 0 4px; table-layout: auto; }
  .tracker th, .tracker td { font-size: 13px; padding: 6px 9px; border: 0.5px solid rgba(0, 0, 0, 0.94); text-align: left; vertical-align: top; }
  .tracker th { background: #f2f6fd; font-weight: 600; vertical-align: middle; }
  .tracker th.c, .tracker td.c { text-align: center; white-space: nowrap; }
  .tracker .nm { min-width: 90px; }
  .tracker .flt input { width: 100%; min-width: 46px; padding: 3px 5px; border: 1px solid #ccd7ea; border-radius: 4px; font: inherit; font-size: 11.5px; color: #444; background: #fff; }
  .tracker .flt input:focus { outline: none; border-color: #479ef5; }
  .tracker .flt th { padding: 4px; background: #fff; }
  .st-nys { background: #ffdd33; }
  .st-c { background: #3ecf6a; }
  .st-sa { background: #45b6ff; }
  .st-ip { background: #ffb266; }
  .st-x { background: #ff5a52; color: #fff; }
  .sign { display: flex; gap: 60px; margin-top: 36px; align-items: flex-end; }
  .sign div { flex: 1; font-size: 12.5px; color: #444; }
  .sign .sign-img { display: block; max-height: 58px; max-width: 220px; margin-bottom: 2px; }
  .sign .sign-line { display: block; border-top: 1.5px solid #999; margin-bottom: 5px; }
  .sign .sign-line-tall { margin-top: 60px; }
  @media print {
    body { padding: 8mm 10mm; }
    h2 { break-after: avoid; }
    tr { break-inside: avoid; }
    .tracker .flt { display: none !important; }
    @page { size: A3 landscape; margin: 10mm; }
  }
</style>
</head>
<body>
  ${docToolbar(filename)}
  <div class="sheet">
    <h1>Learner tracker report</h1>
    <p class="sub">${esc(file.name)} · ${source.sheets.length} worksheet${source.sheets.length === 1 ? "" : "s"} · ${learners} learner row${learners === 1 ? "" : "s"} · generated ${esc(today)}</p>
    <div class="banner">
      <strong>Every row, column and cell of the uploaded workbook is reproduced below.</strong><br/>
      Click <em>Editing: off</em> to switch the tracker into spreadsheet mode — type in any cell, add or delete rows and columns, fill colours, and undo with Ctrl+Z. Use <em>Print</em> to save the tracker as a PDF (A3 landscape).
      <span class="small">Prepared by ${esc(author.name)} from ${esc(file.name)}. No values have been added, removed or re-interpreted.</span>
    </div>
    ${legend}
    ${source.sheets.map((sheet, index) => sheetTableHtml(sheet, index)).join("")}
    <div class="sign">
      <div>
        ${author.signatureImage ? `<img class="sign-img" src="${author.signatureImage}" alt="Signature of ${esc(author.name)}" />` : ""}
        <span class="sign-line"></span>
        Compiled by <strong>${esc(author.name)}</strong> · ${esc(today)}
      </div>
      <div>
        <span class="sign-line sign-line-tall"></span>
        Reviewed by (name &amp; signature)
      </div>
    </div>
  </div>
  <style>
    .edit-toolbar { position: fixed; bottom: 14px; right: 12px; z-index: 999; display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; font-family: "Segoe UI", system-ui, sans-serif; }
    .edit-toolbar button { display: inline-flex; align-items: center; gap: 7px; padding: 9px 15px; border: 1px solid #c9d4e4; border-radius: 8px; background: #ffffff; color: #444; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.14); }
    .edit-toolbar button:hover { background: #f0f5fb; }
    .edit-toolbar button.on { border-color: #479ef5; color: #479ef5; }
    body[contenteditable="true"] { caret-color: #479ef5; }
    body[contenteditable="true"]:focus { outline: none; }
    @media print { .edit-toolbar { display: none !important; } }
  </style>
  <div class="edit-toolbar" contenteditable="false">
    <button type="button" id="__editBtn" onclick="__toggleEdit()" title="Edit any cell before printing or downloading">&#9998; Editing: off</button>
  </div>
  <script>
    var __editing = false;
    function __toggleEdit() {
      __editing = !__editing;
      document.body.contentEditable = __editing ? "true" : "false";
      document.body.classList.toggle("editing", __editing);
      var b = document.getElementById("__editBtn");
      b.textContent = "\\u270E Editing: " + (__editing ? "on" : "off");
      b.className = __editing ? "on" : "";
    }
    // per-column filters on every tracker grid
    Array.prototype.forEach.call(document.querySelectorAll("table.tracker"), function (t) {
      var inputs = Array.prototype.slice.call(t.querySelectorAll(".flt input"));
      function apply() {
        Array.prototype.forEach.call(t.rows, function (r) {
          if (!r.cells.length || r.cells[0].tagName !== "TD") return;
          var show = true;
          inputs.forEach(function (inp) {
            var v = inp.value.trim().toLowerCase();
            if (!v || !show) return;
            var cell = r.cells[Number(inp.getAttribute("data-col"))];
            if (!cell || cell.innerText.toLowerCase().indexOf(v) === -1) show = false;
          });
          r.style.display = show ? "" : "none";
        });
      }
      inputs.forEach(function (inp) {
        inp.addEventListener("input", apply);
        inp.setAttribute("contenteditable", "false");
      });
    });
    function __downloadDoc() {
      var clone = document.documentElement.cloneNode(true);
      Array.prototype.forEach.call(clone.querySelectorAll(".doc-toolbar, .edit-toolbar"), function (el) { el.remove(); });
      var body = clone.querySelector("body");
      if (body) { body.removeAttribute("contenteditable"); body.classList.remove("editing"); }
      var blob = new Blob(["<!doctype html>" + clone.outerHTML], { type: "text/html" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = ${JSON.stringify(filename)};
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  </script>
</body>
</html>`;
}

export async function buildUploadedPdfReport(file: File, author: Profile): Promise<UploadedReportResult> {
  const pdf = await getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: PdfSource["pages"] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const items = content.items.filter(
      (item): item is typeof item & { str: string; transform: number[] } =>
        "str" in item && "transform" in item && typeof item.str === "string" && Array.isArray(item.transform)
    );
    pages.push({ page: pageNumber, text: pageText(items) });
  }
  const source: PdfSource = { sourceFile: file.name, sourceType: "pdf", pages };
  return renderStyledSource(file, source, author);
}

export async function buildUploadedSpreadsheetReport(file: File, author: Profile): Promise<UploadedReportResult> {
  const workbook = XLSX.read(await file.arrayBuffer(), { cellDates: false, raw: false });
  const sheets = workbook.SheetNames.map((name) => ({
    name,
    rows: XLSX.utils.sheet_to_json<string[]>(workbook.Sheets[name], { header: 1, defval: "" })
      .map((row) => row.map((cell) => String(cell))),
  }));
  const source: SpreadsheetSource = { sourceFile: file.name, sourceType: "spreadsheet", sheets };
  const title = `${fileStem(file.name).replace(/-/g, " ")} — Learner tracker`;
  const records = sheets.reduce((total, sheet) => total + Math.max(sheet.rows.length - 1, 0), 0);
  return {
    html: enhanceTrackerHtml(trackerDocumentHtml(file, source, author)),
    title,
    pagesOrSheets: sheets.length,
    records,
    kind: "spreadsheet",
  };
}

export async function buildUploadedReport(file: File, author: Profile): Promise<UploadedReportResult> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "pdf" || file.type === "application/pdf") return buildUploadedPdfReport(file, author);
  if (extension === "xlsx" || extension === "xls" || extension === "csv" || file.type.includes("spreadsheet")) {
    return buildUploadedSpreadsheetReport(file, author);
  }
  throw new Error("Upload a PDF or Excel workbook (.xlsx/.xls/.csv).");
}
