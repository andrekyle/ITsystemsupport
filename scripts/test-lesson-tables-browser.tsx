import { createRoot } from "react-dom/client";
import { UnitPage } from "../src/pages/Course";
import { buildUnitContent } from "../src/lib/unitBuilder";
import { rememberUnitPack } from "../src/lib/unitStorage";
import "../src/styles.css";

const headers = ["Serial No.", "Item Code", "Description", "Rate (INR)", "Unit", "Qty", "Amt"];
const flattenedHeaders = ["Serial No.", "Item", "Code", "Description", "Rate", "(INR)", "Unit", "Qty", "Amt"];
const rows = [
  ["1", "wf_res_01", "Developing and deploying the work flow resource allotment including inserting, modifying, deleting and retrieving data, passing data between the components, formatting data, implementing business rules and preparing user documentation.", "1500", "each", "2", "3000"],
  ["2", "wf_res_02", "Testing and reviewing the work flow resource allotment with the project team.", "800", "hour", "3", "2400"],
];
const before = "The following estimate describes the work required for this project.";
const after = "Review the estimate with the project manager before implementation begins.";
const paragraphs = [before, ...flattenedHeaders, ...rows.flat(), after];
const otherHeaders = ["Product", "Count", "Status"];
const otherRows = [["Keyboard", "2", "Ready"], ["Monitor", "3", "Pending"]];
const listTitle = "The category 'Presentation' could include the following items of work";
const listPoints = ["GUI (Forms and controls)", "Custom controls", "Validation", "Animation and Graphics"];
const revision = "table-layout-fixture";
const storageKey = `itss.lessonedits.114059.built-${revision}`;
const reloadKey = "lesson-tables-reloaded";
const tick = () => new Promise(resolve => setTimeout(resolve, 80));
function assert(ok: unknown, message: string): asserts ok { if (!ok) throw new Error(message); }
function click(label: string) {
  const button = Array.from(document.querySelectorAll("button")).find(button => button.textContent?.trim() === label);
  assert(button, `Missing button: ${label}`);
  button.click();
}
const normalize = (value: string | null | undefined) => (value ?? "").replace(/\s+/g, " ").trim();
function verifyTable(mode: string, expectedHeaders = headers, expectedRows = rows, surroundingProse = true) {
  const lesson = document.querySelector<HTMLElement>(".lesson-section");
  assert(lesson, `${mode}: Lesson section is displayed`);
  const tables = lesson.querySelectorAll<HTMLTableElement>("table");
  assert(tables.length === 1, `${mode}: one semantic table contains the source data (found ${tables.length})`);
  const table = tables[0];
  const actualHeaders = Array.from(table.querySelectorAll("thead th"), cell => normalize(cell.textContent));
  assert(JSON.stringify(actualHeaders) === JSON.stringify(expectedHeaders), `${mode}: header cells align with their columns: ${JSON.stringify(actualHeaders)}`);
  const actualRows = Array.from(table.querySelectorAll("tbody tr"), row => Array.from(row.querySelectorAll(":scope > td"), cell => normalize(cell.textContent)));
  assert(JSON.stringify(actualRows) === JSON.stringify(expectedRows), `${mode}: every value remains in its correct row and column: ${JSON.stringify(actualRows)}`);
  assert(!table.querySelector("ol,.lesson-card"), `${mode}: table values do not become numbered lists or tiles`);
  if (surroundingProse) {
    for (const text of [before, after]) {
      const paragraph = Array.from(lesson.querySelectorAll("p")).find(element => normalize(element.textContent) === text);
      assert(paragraph && !paragraph.closest("table"), `${mode}: surrounding prose remains outside the table: ${text}`);
    }
    const body = normalize(lesson.textContent);
    assert(body.indexOf(before) < body.indexOf("Serial No."), `${mode}: introductory prose stays before the table`);
    assert(body.indexOf(after) > body.indexOf("2400"), `${mode}: concluding prose stays after the table`);
  }
  if (innerWidth < 600) {
    let wrapper: HTMLElement | null = table.parentElement;
    while (wrapper && wrapper !== lesson && !/auto|scroll/.test(getComputedStyle(wrapper).overflowX)) wrapper = wrapper.parentElement;
    assert(wrapper && /auto|scroll/.test(getComputedStyle(wrapper).overflowX), `${mode}: narrow screens contain tables in a horizontal scroll area`);
    assert(wrapper.getBoundingClientRect().right <= innerWidth + 1, `${mode}: the table scroll area fits the viewport`);
    if (expectedHeaders.length > 3) {
      assert(wrapper.scrollWidth > wrapper.clientWidth, `${mode}: wide tables can scroll without squeezing the columns`);
      wrapper.scrollLeft = wrapper.scrollWidth;
      assert(wrapper.scrollLeft > 0, `${mode}: the final columns are reachable by horizontal scrolling`);
      wrapper.scrollLeft = 0;
    }
  }
  assert(lesson.scrollWidth <= lesson.clientWidth + 1, `${mode}: the table does not overflow the lesson`);
}
function verifyList(mode: string) {
  const lesson = document.querySelector<HTMLElement>(".lesson-section")!;
  assert(!lesson.querySelector("table"), `${mode}: an ordinary list is not misclassified as a table`);
  const items = Array.from(lesson.querySelectorAll("ol > li"), item => normalize(item.textContent));
  assert(JSON.stringify(items) === JSON.stringify(listPoints), `${mode}: ordinary list numbering and order survive table recognition`);
}
async function editAndVerify(mode: string, verify: (mode: string) => void) {
  verify(`${mode}: reading`);
  click("Edit content");
  await tick();
  verify(`${mode}: editing`);
  const editor = document.querySelector<HTMLElement>(".slide-whole-editor");
  assert(editor, `${mode}: slide editor exists`);
  const firstCell = editor.querySelector("tbody td:nth-child(3),ol > li");
  assert(firstCell, `${mode}: editable content exists`);
  const emphasis = document.createElement("strong");
  while (firstCell.firstChild) emphasis.append(firstCell.firstChild);
  firstCell.append(emphasis);
  editor.dispatchEvent(new Event("input", { bubbles: true }));
  await tick();
  click("Done editing");
  await tick();
  verify(`${mode}: saved`);
}
async function test() {
  const content = buildUnitContent({ us: "114059", title: "Cost estimation", nqf: 5, credits: 5, dates: "", time: "" }, paragraphs.join("\n\n"), { questions: 3, minutes: 60 });
  const file = { name: "Fixture", type: "application/pdf", size: 0, uploadedAt: "2026-09-17" };
  const tsv = [otherHeaders.join("\t"), ...otherRows.map(row => row.join("\t"))];
  const pipe = [`| ${otherHeaders.join(" | ")} |`, "| --- | --- | --- |", ...otherRows.map(row => `| ${row.join(" | ")} |`)];
  rememberUnitPack("itss.unitbuilder.114059.shared", JSON.stringify({
    revision, source: paragraphs.join("\n\n"), files: { pdf: file, pptx: file, answers: file },
    content: { ...content, lesson: [
      { heading: "Cost estimate", paragraphs },
      { heading: "Saved cost estimate", paragraphs },
      { heading: "Equipment inventory", paragraphs: tsv },
      { heading: "Equipment status", paragraphs: pipe },
      { heading: listTitle, paragraphs: listPoints },
    ] },
  }));
  if (!sessionStorage.getItem(reloadKey)) {
    const tags = ["p", "div", "blockquote"];
    const richHtml = paragraphs.map((text, index) => `<${tags[index % tags.length]}>${text}</${tags[index % tags.length]}>`).join("");
    localStorage.setItem(storageKey, JSON.stringify({ sectionBody: { 1: { paragraphs, richHtml } } }));
  }
  createRoot(document.getElementById("fixture")!).render(<UnitPage unitId="114059" profile={{ id: "table-layout-test", name: "Test", role: "Super User" } as any} progress={{ units: {} }} toggleActivity={() => {}} saveQuizResult={() => {}} setLogbookField={() => {}} saveExerciseResult={() => {}} navigate={() => {}} />);
  for (let i = 0; i < 100 && !document.querySelector('[role="tab"]'); i++) await tick();
  click("Lesson");
  await tick();
  const reloaded = Boolean(sessionStorage.getItem(reloadKey));
  if (reloaded) for (let i = 0; i < 4; i++) { click("Previous"); await tick(); }
  const checks = [
    { name: "Flattened cost estimate", verify: verifyTable },
    { name: "Saved mixed rich text cost estimate", verify: verifyTable },
    { name: "TSV inventory", verify: (mode: string) => verifyTable(mode, otherHeaders, otherRows, false) },
    { name: "Pipe inventory", verify: (mode: string) => verifyTable(mode, otherHeaders, otherRows, false) },
    { name: "Numbered presentation list", verify: verifyList },
  ];
  for (let index = 0; index < checks.length; index++) {
    const check = checks[index];
    if (reloaded) check.verify(`${check.name}: full reload`);
    else await editAndVerify(check.name, check.verify);
    if (index < checks.length - 1) { click("Next"); await tick(); }
  }
  if (!reloaded) {
    const stored = JSON.parse(localStorage.getItem(storageKey)!);
    assert([0, 1, 2, 3].every(index => stored.sectionBody?.[index]?.richHtml?.includes("<table")), "All edited tables are saved as semantic table HTML");
    sessionStorage.setItem(reloadKey, "1");
    location.reload();
    return;
  }
  for (let i = 0; i < 4; i++) { click("Previous"); await tick(); }
  verifyTable("Final cost estimate screenshot");
  document.querySelector(".lesson-screen")?.scrollIntoView();
  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent = "PASS: flattened, saved rich text, TSV and pipe tables preserve columns, values and surrounding prose in Lesson reading, editing, saving and reload; mobile scrolling stays contained and ordinary lists remain numbered";
}

test().catch(error => {
  document.body.dataset.result = "failed";
  document.getElementById("result")!.textContent = String(error);
});
