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
  return renderStyledSource(file, source, author);
}

export async function buildUploadedReport(file: File, author: Profile): Promise<UploadedReportResult> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "pdf" || file.type === "application/pdf") return buildUploadedPdfReport(file, author);
  if (extension === "xlsx" || extension === "xls" || extension === "csv" || file.type.includes("spreadsheet")) {
    return buildUploadedSpreadsheetReport(file, author);
  }
  throw new Error("Upload a PDF or Excel workbook (.xlsx/.xls/.csv).");
}
