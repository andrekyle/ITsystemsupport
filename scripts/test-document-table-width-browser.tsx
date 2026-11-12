import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { Workbook8252 } from "../src/components/Workbook8252";
import "../src/styles.css";

const fixture = document.getElementById("fixture")!;
const root = createRoot(fixture);
const assert = (value: unknown, message: string) => { if (!value) throw new Error(message); };

function checkTables() {
  const issues: string[] = [];
  for (const table of fixture.querySelectorAll<HTMLTableElement>(".document-print-target table")) {
    const page = table.closest<HTMLElement>(".lw-page,.lgd-page,.pt-page");
    assert(page, `Table ${table.className} must belong to a printable page`);
    if (page.matches(".lw-cover,.pt-cover")) continue;
    const style = getComputedStyle(page);
    const rect = page.getBoundingClientRect();
    const left = rect.left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft);
    const right = rect.right - parseFloat(style.borderRightWidth) - parseFloat(style.paddingRight);
    const bounds = table.getBoundingClientRect();
    if (Math.abs(bounds.left - left) > 1 || Math.abs(bounds.right - right) > 1) {
      issues.push(`Page ${table.closest("[data-page]")?.getAttribute("data-page")}: ${table.className}: ${bounds.width.toFixed(2)}px instead of ${(right - left).toFixed(2)}px`);
    }
  }
  assert(issues.length === 0, `Tables must fill the printable content width within 1px:\n${issues.join("\n")}`);
}

async function test() {
  flushSync(() => root.render(<Workbook8252
    profile={{ id: "print-width-test", name: "Test learner", role: "Learner", createdAt: "" }}
    values={{ "learner-workbook.outcome-1.activity-1.answer": "My saved written response" }}
    memoItems={[]} onChange={() => {}} onSave={async () => {}} />));
  await document.fonts.ready;
  assert(matchMedia("print").matches, "The test must use real print-media layout");
  checkTables();
  // Imported documents can carry narrow widths on both the table and columns.
  // PDF layout must override these without dropping any rows or field values.
  for (const table of fixture.querySelectorAll<HTMLTableElement>(".document-print-target table")) {
    table.style.width = "40%";
    table.style.minWidth = "120px";
    table.style.maxWidth = "240px";
    table.style.marginLeft = "20px";
    table.style.marginRight = "20px";
  }
  checkTables();
  const tables = fixture.querySelectorAll("table").length;
  const rows = fixture.querySelectorAll("tr").length;
  const cells = fixture.querySelectorAll("th,td").length;
  const print = window.print;
  let printed = false;
  window.print = () => {
    printed = true;
    checkTables();
    assert(fixture.querySelectorAll("table").length === tables && fixture.querySelectorAll("tr").length === rows &&
      fixture.querySelectorAll("th,td").length === cells, "PDF download must preserve every table, row and cell");
    window.dispatchEvent(new Event("afterprint"));
  };
  try { fixture.querySelector<HTMLButtonElement>(".document-action-pdf")!.click(); }
  finally { window.print = print; }
  assert(printed, "Validate the actual PDF download control");
  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent = `PASS: ${tables} tables, ${rows} rows and ${cells} cells fill the printable width before and during PDF download`;
}
test().catch(error => {
  document.body.dataset.result = "failed";
  document.getElementById("result")!.textContent = String(error);
});
