import * as XLSX from "xlsx";
import { buildUploadedSpreadsheetReport } from "../src/lib/uploadedReports";
import type { Profile } from "../src/types";

const SHEET_ONE = [
  ["No", "Surname", "Name", "114051", "114052"],
  ["1", "Mokoena", "Thabo", "C", "SA"],
  ["2", "Dlamini", "Naledi", "NYC", "TBC"],
];
const SHEET_TWO = [
  ["No", "Surname", "Name", "114053"],
  ["1", "Mokoena", "Thabo", "C"],
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
  const headers = [...first.querySelectorAll("thead tr")[0].cells].map((cell) => cell.textContent?.trim());
  assert(headers.join("|") === ["No.", ...SHEET_ONE[0].slice(1)].join("|"), "Header row is preserved exactly");
  const dataRows = [...first.querySelectorAll("tbody tr")];
  assert(dataRows.length === 2, "Both learner rows are present");
  assert(
    [...dataRows[0].cells].map((cell) => cell.textContent?.trim()).join("|") === SHEET_ONE[1].join("|"),
    "Learner cell values are preserved exactly"
  );
  assert(dataRows[0].cells[3].classList.contains("status-C"), "Competent cells are colour-coded");
  assert(dataRows[1].cells[4].classList.contains("status-TBC"), "Status cells are preserved");
  assert(doc.querySelector(".legend .legend-code"), "The status legend is shown");
  assert(
    [...tables[1].rows[0].cells].map((cell) => cell.textContent?.trim()).join("|") === ["No.", ...SHEET_TWO[0].slice(1)].join("|"),
    "The second worksheet is preserved too"
  );

  assert(doc.getElementById("print-report"), "A print/save-as-PDF button is offered");
  assert(result.html.includes("@page{size:16in 9in"), "The tracker uses the approved 16:9 print layout");
  const editButton = doc.getElementById("toggle-edit") as HTMLButtonElement;
  assert(editButton, "An editing toggle is offered");
  assert(doc.querySelector(".tracker-column-controls"), "Spreadsheet editing controls are attached");
  editButton.click();
  await tick();
  assert(first.querySelector("[contenteditable='true']"), "Editing makes the tracker editable");
  assert(/Viewing mode/.test(editButton.textContent!.trim()), "The editing toggle reports its state");

  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent =
    "PASS: spreadsheet uploads build an editable, printable learner tracker with every row preserved";
}

test().catch((error) => {
  document.body.dataset.result = "failed";
  document.getElementById("result")!.textContent = error instanceof Error ? error.stack ?? error.message : String(error);
});
