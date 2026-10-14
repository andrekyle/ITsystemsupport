import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import * as XLSX from "xlsx";
import type { Profile } from "../types";
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

/** Editable, print-ready tracker using the same report template as the approved HTML. */
function trackerDocumentHtml(file: File, source: SpreadsheetSource, author: Profile): string {
  const today = new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
  const filename = `${fileStem(file.name)}-Learner-Tracker-Edited.html`;
  const sheets = source.sheets.map((sheet) => ({
    name: sheet.name.trim() || "Worksheet",
    headers: sheet.rows[0] ?? [],
    rows: sheet.rows.slice(1),
  }));
  const learnerRows = sheets[0]?.rows ?? [];
  const learners = learnerRows.length;
  const allStatuses = sheets.flatMap((sheet) => sheet.rows.flatMap((row) => row.slice(3).map((cell) => cell.trim().toUpperCase())));
  const statusCounts = { C: allStatuses.filter((status) => status === "C").length, NYC: allStatuses.filter((status) => status === "NYC").length, TBC: allStatuses.filter((status) => status === "TBC").length };
  const totalStatuses = statusCounts.C + statusCounts.NYC + statusCounts.TBC;
  const unitCount = sheets.reduce((total, sheet) => Math.max(total, Math.max(sheet.headers.length - 3, 0)), 0);
  const escAttr = (value: string) => esc(value).replace(/'/g, "&#39;");
  const legend = `<div class="legend">${[
    ["C", "Competent", "var(--competent)"],
    ["NYC", "Not Yet Competent", "var(--nyc)"],
    ["TBC", "To Be Confirmed", "var(--tbc)"],
  ].map(([code, label, colour]) => `<div class="legend-item"><span class="legend-swatch" style="background:${colour}"></span><span class="legend-code">${code}</span><span>${label}</span></div>`).join("")}</div>`;
  const tableFor = (sheet: typeof sheets[number]) => {
    const headers = sheet.headers;
    const statusHeaders = headers.slice(3);
    return `<table class="tracker" data-sheet="${escAttr(sheet.name)}">
      <thead><tr><th class="no">No.</th><th class="surname">Surname</th><th class="name">Name</th>${statusHeaders.map((header) => `<th>${esc(String(header))}</th>`).join("")}</tr></thead>
      <tbody>${sheet.rows.map((row, rowIndex) => {
        const number = row[0] || rowIndex + 1;
        return `<tr><td class="no">${esc(String(number))}</td><td class="surname">${esc(String(row[1] ?? ""))}</td><td class="name">${esc(String(row[2] ?? ""))}</td>${statusHeaders.map((_, index) => {
          const status = String(row[index + 3] ?? "").trim().toUpperCase();
          const valid = status === "C" || status === "NYC" || status === "TBC";
          return `<td class="status${valid ? ` status-${status}` : ""}" contenteditable="true">${esc(status || String(row[index + 3] ?? ""))}</td>`;
        }).join("")}</tr>`;
      }).join("")}</tbody>
    </table>`;
  };
  const overview = learnerRows.map((row, index) => {
    const name = `${String(row[2] ?? "").trim()} ${String(row[1] ?? "").trim()}`.trim();
    const statuses = sheets.flatMap((sheet) => sheet.rows[index]?.slice(3) ?? []).map((value) => String(value).trim().toUpperCase());
    const competent = statuses.filter((status) => status === "C").length;
    const nyc = statuses.filter((status) => status === "NYC").length;
    const tbc = statuses.filter((status) => status === "TBC").length;
    const progress = unitCount ? Math.round((competent / unitCount) * 100) : 0;
    return `<tr><td class="num">${index + 1}</td><td class="learner">${esc(name)}</td><td>${competent}</td><td>${nyc}</td><td>${tbc}</td><td class="progress-cell"><div class="bar"><span style="width:${progress}%"></span></div><div class="bar-label">${competent}/${unitCount} · ${progress}%</div></td></tr>`;
  }).join("");
  const sectionPages = sheets.map((sheet, index) => {
    const statuses = sheet.rows.flatMap((row) => row.slice(3).map((cell) => String(cell).trim().toUpperCase()));
    const summary = ["C", "NYC", "TBC"].map((code) => `${statuses.filter((status) => status === code).length} ${code}`).filter((value) => !value.startsWith("0 ")).join(" · ");
    return `<section class="page${index === 1 ? " core" : ""}">
      <h1 class="report-title">Learner tracker report</h1>
      <p class="qualification">${esc(sheet.name)} unit standards · ${sheet.rows.length} learners · ${statuses.length} learner-unit status entries</p>
      <div class="section-head"><h2>${esc(sheet.name)}</h2><p>${esc(summary)}</p></div>
      ${legend}${tableFor(sheet)}
      <div class="notes"><strong>Section result:</strong> Every status is reproduced exactly from the ${esc(sheet.name)} worksheet.</div>
      <div class="footer"><span>${esc(file.name)} · ${esc(sheet.name)} Unit Standards</span><span class="page-number">${String(index + 2).padStart(2, "0")}</span></div>
    </section>`;
  }).join("");
  const percent = (value: number) => totalStatuses ? `${((value / totalStatuses) * 100).toFixed(1)}%` : "0.0%";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Learner tracker report — ${esc(file.name)}</title>
<style>
:root{--blue:#2e9b7a;--blue-deep:#f0872b;--blue-soft:#edf7f3;--blue-head:#f7f5f1;--line:#222b38;--ink:#273244;--muted:#657086;--competent:#35c96f;--competent-soft:#dcfce7;--nyc:#ffd92f;--nyc-soft:#fff7bf;--tbc:#43aaf5;--tbc-soft:#dff2ff;--paper:#fff}*{box-sizing:border-box;margin:0;padding:0}body{background:#d9dee8;color:var(--ink);font-family:Calibri,"Segoe UI",Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{position:relative;width:16in;min-height:9in;margin:20px auto;padding:.34in .45in .42in;overflow:hidden;background:var(--paper);box-shadow:0 5px 24px rgba(20,30,50,.25)}.report-title{color:var(--blue);font-size:25pt;font-weight:800;line-height:1.05}.qualification{margin-top:.1in;color:var(--muted);font-size:11.5pt}.summary{margin-top:.2in;padding:.18in .2in;border:1px solid #b9ddcf;border-radius:.1in;background:var(--blue-soft)}.summary h2{font-size:12pt}.summary p{margin-top:.055in;font-size:10.3pt;line-height:1.28}.summary .source{color:var(--muted);font-size:8.8pt}.legend{display:flex;align-items:center;gap:.3in;margin-top:.16in;font-size:10pt}.legend-item{display:flex;align-items:center;gap:.08in}.legend-swatch{width:.16in;height:.16in;border-radius:.035in}.legend-code{font-weight:800}.metrics{display:grid;grid-template-columns:repeat(5,1fr);gap:.15in;margin-top:.18in}.metric{position:relative;padding:.15in .16in .12in;border:0;border-radius:.08in;background:#f7f5f1;overflow:hidden}.metric:before{content:"";position:absolute;inset:0 0 auto;height:.045in;background:var(--accent,var(--blue))}.metric-value{color:var(--accent,var(--blue));font-size:21pt;font-weight:800;line-height:1}.metric-label{margin-top:.05in;font-size:9.7pt;font-weight:700}.metric-note{margin-top:.025in;color:var(--muted);font-size:7.8pt}.section-head{display:flex;align-items:flex-end;justify-content:space-between;margin-top:.18in}.section-head h2{color:var(--blue);font-size:17pt}.section-head p{color:var(--muted);font-size:9pt}table{width:100%;border-collapse:collapse;table-layout:fixed}.tracker{margin-top:.12in;border:1.2px solid var(--line)}.tracker th,.tracker td{border:1px solid var(--line);text-align:center;vertical-align:middle}.tracker thead th{background:var(--blue-head);font-size:8.4pt;font-weight:800;padding:.075in .045in}.tracker tbody td{height:.32in;font-size:8.6pt;padding:.035in}.tracker .no{width:.42in}.tracker .surname{width:1.12in;text-align:left;padding-left:.08in}.tracker .name{width:1.42in;text-align:left;padding-left:.08in}.status{font-weight:800}.status-C{background:var(--competent-soft);color:#16713c}.status-NYC{background:var(--nyc-soft);color:#745d00}.status-TBC{background:var(--tbc-soft);color:#075f9d}.overview{margin-top:.12in}.overview th{padding:.045in;border:1px solid var(--line);background:var(--blue-head);font-size:8pt}.overview td{height:.185in;padding:.015in .06in;border:1px solid var(--line);font-size:7.6pt}.overview .learner{text-align:left;font-weight:700}.overview .num{text-align:center;width:.75in}.overview .progress-cell{width:3.1in}.bar{position:relative;height:.09in;border-radius:.05in;background:#e9edf4;overflow:hidden}.bar>span{display:block;height:100%;border-radius:.07in;background:var(--competent)}.bar-label{margin-top:.01in;color:var(--muted);font-size:6.8pt;text-align:right}.notes{margin-top:.16in;padding:.13in .17in;border-radius:.08in;background:var(--blue-soft);font-size:9.2pt;line-height:1.3}.footer{position:absolute;left:.45in;right:.45in;bottom:.16in;display:flex;justify-content:space-between;padding-top:.07in;border-top:1px solid #cbd5e1;color:var(--muted);font-size:7.5pt}.page-number{color:var(--blue);font-weight:800}.editor-toolbar{position:sticky;top:0;z-index:1000;display:flex;align-items:center;gap:4px;padding:5px 8px;background:#172033;color:#fff;box-shadow:0 3px 14px rgba(0,0,0,.28)}.editor-toolbar button{border:0;border-radius:4px;padding:4px 7px;background:#fff;color:#172033;font:600 11px/1 Calibri,"Segoe UI",Arial,sans-serif;cursor:pointer}.editor-toolbar button.primary{background:var(--blue);color:#fff}.editor-toolbar button.danger{color:#b91c1c}.editor-toolbar .editor-status{margin-left:auto;font-size:10px;color:#cbd5e1}body.editing [contenteditable=true]{outline:1px dashed #2e9b7a;outline-offset:1px;cursor:text}@media print{@page{size:16in 9in;margin:0}body{background:#fff}.editor-toolbar{display:none}.page{margin:0;box-shadow:none;break-after:page}.page:last-child{break-after:auto}}
</style></head><body>
<div class="editor-toolbar edit-toolbar" role="toolbar" aria-label="Report editing controls"><button id="toggle-edit" class="primary" type="button">Edit report</button><button id="save-edits" type="button">Save changes</button><button id="download-html" type="button">Download edited HTML</button><button id="print-report" type="button">Print / Save PDF</button><button id="reset-edits" class="danger" type="button">Reset</button><span id="editor-status" class="editor-status">Viewing mode</span></div>
<section class="page"><h1 class="report-title">Learner tracker report</h1><p class="qualification">${esc(file.name)} · ${source.sheets.length} worksheets · ${learners} learners · generated ${esc(today)}</p><div class="summary"><h2>Learner tracker report — generated ${esc(today)}.</h2><p><em>Report scope: all learners and all status entries from the uploaded worksheets are included.</em></p><p>The cohort consists of ${learners} learners across ${unitCount} unit standards. Of ${totalStatuses} learner-unit status entries, ${statusCounts.C} are marked Competent, ${statusCounts.NYC} are marked Not Yet Competent, and ${statusCounts.TBC} are To Be Confirmed.</p><p class="source">Source: ${esc(file.name)}. Statuses are reproduced exactly as recorded in the workbook. Prepared by ${esc(author.name)}.</p></div>${legend}<div class="metrics"><div class="metric" style="--accent:var(--blue)"><div class="metric-value">${learners}</div><div class="metric-label">Learners</div><div class="metric-note">No learner omitted</div></div><div class="metric" style="--accent:var(--blue-deep)"><div class="metric-value">${unitCount}</div><div class="metric-label">Unit standards</div><div class="metric-note">${sheets.map((sheet) => `${Math.max(sheet.headers.length - 3, 0)} ${sheet.name}`).join(" · ")}</div></div><div class="metric" style="--accent:var(--competent)"><div class="metric-value">${statusCounts.C}</div><div class="metric-label">Competent entries</div><div class="metric-note">${percent(statusCounts.C)} of all status entries</div></div><div class="metric" style="--accent:#d3aa00"><div class="metric-value">${statusCounts.NYC}</div><div class="metric-label">Not Yet Competent</div><div class="metric-note">${percent(statusCounts.NYC)} of all status entries</div></div><div class="metric" style="--accent:#a97852"><div class="metric-value">${statusCounts.TBC}</div><div class="metric-label">To Be Confirmed</div><div class="metric-note">${percent(statusCounts.TBC)} of all status entries</div></div></div><div class="section-head"><h2>Cohort overview</h2><p>Progress bar = Competent entries out of ${unitCount} unit standards</p></div><table class="overview"><thead><tr><th>No.</th><th>Learner full name</th><th>C</th><th>NYC</th><th>TBC</th><th>Competent progress</th></tr></thead><tbody>${overview}</tbody></table><div class="footer"><span>${esc(file.name)} · Learner Tracker Report</span><span class="page-number">01</span></div></section>
${sectionPages}
<script>
var original=document.body.innerHTML, editing=false;
document.getElementById("toggle-edit").onclick=function(){editing=!editing;document.body.classList.toggle("editing",editing);document.querySelectorAll("[contenteditable]").forEach(function(e){e.contentEditable=editing?"true":"false"});this.textContent=editing?"Viewing mode":"Edit report";document.getElementById("editor-status").textContent=editing?"Editing mode":"Viewing mode"};
document.getElementById("save-edits").onclick=function(){localStorage.setItem("uploaded-tracker-edits",document.body.innerHTML);document.getElementById("editor-status").textContent="Changes saved"};
document.getElementById("download-html").onclick=function(){var clone=document.documentElement.cloneNode(true);clone.querySelector(".editor-toolbar").remove();var b=new Blob(["<!doctype html>"+clone.outerHTML],{type:"text/html"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=${JSON.stringify(filename)};a.click();URL.revokeObjectURL(a.href)};
document.getElementById("print-report").onclick=function(){window.print()};
document.getElementById("reset-edits").onclick=function(){if(confirm("Reset all edits?")){document.body.innerHTML=original;location.reload()}};
</script></body></html>`;
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
