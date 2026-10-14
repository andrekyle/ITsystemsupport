import * as XLSX from "xlsx";
import { buildUploadedSpreadsheetReport } from "../src/lib/uploadedReports";
import type { Profile } from "../src/types";

const SHEET_ONE = [
  ["Learner name", "Learner surname", "ID number", "114051", "114052", "Comments"],
  ["Thabo", "Mokoena", "9001015800081", "C", "SA", "On track for completion"],
  ["Naledi", "Dlamini", "9203124500083", "NYS", "IP", "Awaiting portfolio"],
];
const SHEET_TWO = [
  ["Learner name", "Session 1", "Session 2"],
  ["Thabo Mokoena", "✓", "X"],
];

const author = { name: "Andre Kyle", signatureImage: "" } as unknown as Profile;

const tick = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

function workbookFile(): File {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(SHEET_ONE), "Unit standards");
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(SHEET_TWO), "Attendance");
  const data = XLSX.write(book, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  return new File([data], "HONOR Learner Progress List - Third Quarter.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

async function test() {
  const result = await buildUploadedSpreadsheetReport(workbookFile(), author);
  assert(result.kind === "spreadsheet", "Spreadsheet uploads report as a spreadsheet source");
  assert(result.pagesOrSheets === 2, "Both worksheets are kept");
  assert(result.records === 3, "Every learner row is kept");
  assert(/learner tracker/i.test(result.title), "Output is titled as a learner tracker");

  const frame = document.createElement("iframe");
  frame.style.cssText = "width:1280px;height:720px;border:0";
  frame.srcdoc = result.html;
  document.getElementById("fixture")!.appendChild(frame);
  await new Promise((resolve) => frame.addEventListener("load", resolve, { once: true }));
  await tick();
  const doc = frame.contentDocument!;

  const tables = doc.querySelectorAll("table.tracker");
  assert(tables.length === 2, "Each worksheet is rendered as its own tracker grid");
  const first = tables[0] as HTMLTableElement;
  const headers = [...first.rows[0].cells].map((cell) => cell.textContent?.trim());
  assert(headers.join("|") === SHEET_ONE[0].join("|"), "Header row is preserved exactly");
  const dataRows = [...first.rows].filter((row) => row.cells[0].tagName === "TD");
  assert(dataRows.length === 2, "Both learner rows are present");
  assert(
    [...dataRows[0].cells].map((cell) => cell.textContent?.trim()).join("|") === SHEET_ONE[1].join("|"),
    "Learner cell values are preserved exactly"
  );
  assert(dataRows[0].cells[3].classList.contains("st-c"), "Competent cells are colour-coded");
  assert(dataRows[1].cells[4].classList.contains("st-ip"), "In-process cells are colour-coded");
  assert(doc.querySelector(".legend .st-nys"), "The status legend is shown for the codes in use");
  assert(
    [...tables[1].rows[0].cells].map((cell) => cell.textContent?.trim()).join("|") === SHEET_TWO[0].join("|"),
    "The second worksheet is preserved too"
  );

  assert(doc.querySelector(".doc-toolbar button[onclick='window.print()']"), "A print/save-as-PDF button is offered");
  assert(result.html.includes("size: A3 landscape"), "The tracker prints as A3 landscape");
  const editButton = doc.getElementById("__editBtn") as HTMLButtonElement;
  assert(editButton, "An editing toggle is offered");
  assert(doc.querySelector(".tracker-column-controls"), "Spreadsheet editing controls are attached");
  editButton.click();
  await tick();
  assert(doc.body.getAttribute("contenteditable") === "true", "Editing makes the whole tracker editable");
  assert(/on$/.test(editButton.textContent!.trim()), "The editing toggle reports its state");

  const filters = first.querySelectorAll<HTMLInputElement>(".flt input");
  assert(filters.length === 3, "Learner columns can be filtered");
  filters[0].value = "naledi";
  filters[0].dispatchEvent(new Event("input", { bubbles: true }));
  await tick();
  assert(dataRows[0].style.display === "none" && dataRows[1].style.display === "", "Filtering hides non-matching learners");

  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent =
    "PASS: spreadsheet uploads build an editable, printable learner tracker with every row preserved";
}

test().catch((error) => {
  document.body.dataset.result = "failed";
  document.getElementById("result")!.textContent = String(error);
});
