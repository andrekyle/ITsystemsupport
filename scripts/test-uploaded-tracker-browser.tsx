import * as XLSX from "xlsx";
import { buildUploadedSpreadsheetReport } from "../src/lib/uploadedReports";
import type { Profile } from "../src/types";

const SHEET_ONE = [
  ["No", "Surname", "Name", "114051", "114052"],
  ["1", "Mokoena", "Thabo", "c", "TBC"],
  ["2", "Dlamini", "Naledi", "NYC", "TBC"],
];
const SHEET_TWO = [
  ["Record", "Surname", "Name", "114053"],
  ["2", "Dlamini", "Naledi", "C"],
  ["1", "Mokoena", "Thabo", "NYC"],
  ["3", "Ncube", "Sipho", "TBC"],
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
  const storageKey = "uploaded-tracker-edits:HONOR-Learner-Progress-List-Third-Quarter";
  localStorage.removeItem(storageKey);
  const result = await buildUploadedSpreadsheetReport(workbookFile(), author);
  assert(result.kind === "spreadsheet", "Spreadsheet uploads report as a spreadsheet source");
  assert(result.pagesOrSheets === 2, "Both worksheets are kept");
  assert(result.records === 5, "Every learner row is kept");
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
  assert(headers.join("|") === SHEET_ONE[0].join("|"), "Header row is preserved exactly");
  const dataRows = [...first.querySelectorAll("tbody tr")];
  assert(dataRows.length === 2, "Both learner rows are present");
  assert(
    [...dataRows[0].cells].map((cell) => cell.textContent?.trim()).join("|") === SHEET_ONE[1].join("|"),
    "Learner cell values are preserved exactly"
  );
  assert(dataRows[0].cells[3].textContent === "c", "Status capitalization is preserved exactly");
  assert(dataRows[0].cells[3].classList.contains("status-C"), "Competent cells are colour-coded without changing their text");
  assert(dataRows[1].cells[4].classList.contains("status-TBC"), "Status cells are preserved");
  assert(doc.querySelector(".legend .legend-code"), "The status legend is shown");
  assert(
    [...tables[1].rows[0].cells].map((cell) => cell.textContent?.trim()).join("|") === SHEET_TWO[0].join("|"),
    "The second worksheet's distinct headers are preserved too"
  );
  const metricValues = [...doc.querySelectorAll(".metric-value")].map((node) => node.textContent?.trim());
  assert(metricValues.slice(0, 5).join("|") === "3|3|2|2|3", "Summary totals include all standards and unique learners across every sheet");
  const overviewRows = [...doc.querySelectorAll<HTMLTableRowElement>(".overview tbody tr")];
  assert(overviewRows.length === 3, "The cohort overview contains the union of learners from all sheets");
  assert(
    overviewRows.map((row) => row.cells[1].textContent?.trim()).join("|") === "Thabo Mokoena|Naledi Dlamini|Sipho Ncube",
    "Learners are combined by identity rather than worksheet row position"
  );
  assert(
    [...overviewRows[0].cells].slice(2, 5).map((cell) => cell.textContent?.trim()).join("|") === "1|1|1",
    "Reordered worksheet statuses are assigned to the correct learner"
  );

  assert(doc.getElementById("print-report"), "A print/save-as-PDF button is offered");
  assert(result.html.includes("@page{size:16in 9in"), "The tracker uses the approved 16:9 print layout");
  const toolbar = doc.querySelector<HTMLElement>(".editor-toolbar")!;
  const toolbarStyle = frame.contentWindow!.getComputedStyle(toolbar);
  assert(toolbar.getBoundingClientRect().height >= 40, "The toolbar bar is wider than the original strip");
  assert(toolbarStyle.boxShadow === "none", "The toolbar has no glow");
  for (const button of [...toolbar.querySelectorAll<HTMLButtonElement>("button")]) {
    const style = frame.contentWindow!.getComputedStyle(button);
    assert(style.borderTopWidth === "0px" && style.borderBottomWidth === "0px", `${button.id} has no border`);
    assert(style.boxShadow === "none", `${button.id} has no glow`);
    const [r, g, b] = style.backgroundColor.match(/\d+/g)!.map(Number);
    assert((r + g + b) / 3 < 140, `${button.id} uses a dark-mode background`);
    const [tr, tg, tb] = style.color.match(/\d+/g)!.map(Number);
    assert((tr + tg + tb) / 3 > 150, `${button.id} uses light dark-mode text`);
  }
  const editButton = doc.getElementById("toggle-edit") as HTMLButtonElement;
  assert(editButton, "An editing toggle is offered");
  assert(doc.querySelector(".tracker-column-controls"), "Spreadsheet editing controls are attached");
  editButton.click();
  await tick();
  assert(first.querySelector("[contenteditable='true']"), "Editing makes the tracker editable");
  assert(/Viewing mode/.test(editButton.textContent!.trim()), "The editing toggle reports its state");
  dataRows[0].cells[3].textContent = "Edited exactly";
  (doc.getElementById("save-edits") as HTMLButtonElement).click();
  await tick();
  assert(doc.getElementById("editor-status")?.textContent === "Changes saved", "Save changes confirms the edit was persisted");

  const restoredFrame = document.createElement("iframe");
  restoredFrame.srcdoc = result.html;
  document.getElementById("fixture")!.appendChild(restoredFrame);
  await new Promise((resolve) => restoredFrame.addEventListener("load", resolve, { once: true }));
  await tick();
  const restoredDoc = restoredFrame.contentDocument!;
  assert(
    restoredDoc.querySelector<HTMLTableCellElement>("table.tracker tbody td:nth-child(4)")?.textContent === "Edited exactly",
    "Saved edits are restored when the generated HTML is loaded again"
  );
  assert(restoredDoc.getElementById("editor-status")?.textContent === "Saved changes restored", "Restored edits are reported in the toolbar");
  localStorage.removeItem(storageKey);

  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent =
    "PASS: spreadsheet uploads build an editable, printable learner tracker with every row preserved";
}

test().catch((error) => {
  document.body.dataset.result = "failed";
  document.getElementById("result")!.textContent = error instanceof Error ? error.stack ?? error.message : String(error);
});
