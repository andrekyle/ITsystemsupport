import { createRoot } from "react-dom/client";
import JSZip from "jszip";
import { UnitPage } from "../src/pages/Course";
import { buildUnitContent } from "../src/lib/unitBuilder";
import { logbookFromSource } from "../src/lib/logbookBuilder";
import { importUnitSource } from "../src/lib/unitSourceImport";
import { rememberUnitPack } from "../src/lib/unitStorage";
import "../src/styles.css";

const revision = "logbook-edit-fixture";
const storageKey = `itss.lessonedits.114059.built-${revision}`;
const tick = () => new Promise(resolve => setTimeout(resolve, 80));
function assert(ok: unknown, message: string): asserts ok { if (!ok) throw new Error(message); }
const normalize = (value: string | null | undefined) => (value ?? "").replace(/\s+/g, " ").trim();
function click(label: string) {
  const button = Array.from(document.querySelectorAll("button")).find(button => normalize(button.textContent) === label);
  assert(button, `Missing button: ${label}`);
  button.click();
}
async function typeInto(el: HTMLElement, text: string) {
  el.focus();
  el.textContent = text;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.blur();
  await tick();
}
const esc = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const para = (text: string, bold = false) => `<w:p><w:pPr/><w:r>${bold ? "<w:rPr><w:b/></w:rPr>" : ""}<w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
const cell = (content: string, span?: number) => `<w:tc><w:tcPr>${span ? `<w:gridSpan w:val="${span}"/>` : ""}</w:tcPr>${content || "<w:p/>"}</w:tc>`;
const row = (...cells: string[]) => `<w:tr>${cells.join("")}</w:tr>`;
const mark = (on: boolean) => cell(on ? para("✓") : "");

/** A Word logbook form laid out like the facilitator's template. */
function logbookDocx(): string {
  const checklist = (no: string, text: string, marks: boolean[]) => row(cell(para(no)), cell(para(text)), ...marks.map(mark));
  const matrix = `<w:tbl>
    ${row(cell(para("Specific outcome & assessment criteria", true) + para("Embedded knowledge questions"), 2), cell(para("Evidence checklist", true), 6))}
    ${row(cell(""), cell(""), cell(para("Workplace", true), 3), cell(para("Assessor", true), 3))}
    ${row(cell(""), cell(""), cell(para("Learner Activity")), cell(para("Logbook Activity")), cell(para("Project")), cell(para("Learner Manual")), cell(para("Logbook Activity")), cell(para("Project")))}
    ${checklist("1", "Explain the purpose of a cost/benefit analysis.", [true, false, false, true, false, false])}
    ${checklist("2", "Describe how to prepare a time estimate for an element of work.", [true, false, false, true, false, false])}
    ${checklist("3", "Explain the effects of late delivery on the organisation and the client.", [true, false, false, true, false, false])}
    ${row(cell(para("Practical activities", true), 8))}
    ${checklist("4", "Prepare a time and cost estimate for an element of work.", [false, true, false, false, true, false])}
    ${checklist("5", "Present the estimate to the client and record feedback.", [true, true, true, true, true, true])}
  </w:tbl>`;
  const project = `<w:tbl>${row(cell(para("Logbook project", true), 3))}${row(cell(para("Time", true)), cell(para("Activity", true)), cell(para("Resources", true)))}${row(cell(para("45 minutes")), cell(para("Cost estimate project", true) + para("Prepare a time and cost estimate for a small element of work at your workplace and attach it to this logbook.")), cell(para("Logbook")))}</w:tbl>`;
  const details = `<w:tbl>${row(cell(para("Learner details", true), 2))}${row(cell(para("Learner Name")), cell(""))}${row(cell(para("Employer")), cell(""))}${row(cell(para("Start & Completion Date")), cell(""))}</w:tbl>`;
  const workplace = `<w:tbl>${row(cell(para("Workplace activities", true), 4))}${row(cell(para("Activity") + para("These activities must be completed in the workplace.")), cell(para("Evidence") + para("The workplace completes this section after observing the learner.")), cell(para("Workplace")), cell(para("Learner")))}${row(cell(para("Estimate a real unit of work at the workplace.")), cell(""), cell(""), cell(""))}${row(cell(para("Report a late delivery to the client.")), cell(""), cell(""), cell(""))}</w:tbl>`;
  const other = `<w:tbl>${row(cell(para("Other activities", true), 4))}${row(cell(para("Activity")), cell(para("Evidence") + para("Learner evidence and experience is recorded here.")), cell(para("Assessor")), cell(para("Learner")))}${row(cell(para("Cost estimate project", true)), cell(para("Attach the completed estimate and the client's feedback.")), cell(""), cell(""))}</w:tbl>`;
  const checklistTable = `<w:tbl>${row(cell(para("Project checklist", true), 8))}${row(cell(para("No")), cell(para("Project name")), cell(para("Learner")), cell(para("Date")), cell(para("Workplace")), cell(para("Date")), cell(para("Assessor")), cell(para("Date")))}${row(cell(para("1")), cell(para("114059 Cost estimate")), cell(""), cell(""), cell(""), cell(""), cell(""), cell(""))}</w:tbl>`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${para("Assignment: Assignment Two", true)}${para("Programme: Information Technology - Systems Support")}${para("Unit standard: 114059 - Estimating a unit of work")}${details}${project}${matrix}${workplace}${other}${checklistTable}<w:sectPr/></w:body></w:document>`;
}

async function makeDocx(): Promise<File> {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file("word/document.xml", logbookDocx());
  return new File([await zip.generateAsync({ type: "blob" })], "114059 Logbook.docx");
}

async function test() {
  const unit = { us: "114059", title: "Estimating", nqf: 5, credits: 5, dates: "", time: "" };
  const file = await makeDocx();

  // 1. Word logbook → parsed structure.
  const text = await importUnitSource(file);
  const spec = logbookFromSource(unit, text);
  assert(spec, `A logbook is produced from the Word form:\n${text.slice(0, 800)}`);
  assert(spec.assignmentTitle === "Assignment Two" && spec.unitLabel.startsWith("114059"), `Headings come from the labelled lines (${spec.assignmentTitle} / ${spec.unitLabel})`);
  assert(spec.detailFields.join("|") === "Learner Name|Employer|Start & Completion Date", `Learner detail fields are read (${spec.detailFields.join("|")})`);
  assert(spec.project.time === "45 minutes" && spec.project.title === "Cost estimate project" && spec.project.resource === "Logbook" && spec.project.text.startsWith("Prepare a time and cost"), `Project row is read (${JSON.stringify(spec.project)})`);
  assert(spec.knowledgeQuestions.length === 3 && spec.practicalActivities.length === 2, `3 knowledge + 2 practical rows (${spec.knowledgeQuestions.length}/${spec.practicalActivities.length})`);
  assert(spec.knowledgeQuestions[0].marks.join() === "true,false,false,true,false,false", `Knowledge marks are read from the ✓ cells (${spec.knowledgeQuestions[0].marks.join()})`);
  assert(spec.practicalActivities[0].marks.join() === "false,true,false,false,true,false" && spec.practicalActivities[1].marks.every(Boolean), `Practical marks are read from the ✓ cells (${spec.practicalActivities.map(r => `${r.text}: ${r.marks.join()}`).join(" / ")})\nLINE: ${text.split("\n").find(l => l.includes("Present the estimate"))}`);
  assert(spec.workplaceActivities.join("|") === "Estimate a real unit of work at the workplace.|Report a late delivery to the client.", `Workplace activities are read (${spec.workplaceActivities.join("|")})`);
  assert(spec.workplaceEvidenceNote.startsWith("The workplace completes this section after observing the learner"), `Workplace evidence note comes from the header (${spec.workplaceEvidenceNote})`);
  assert(spec.otherActivities.length === 1 && spec.otherActivities[0].evidence.startsWith("Attach the completed estimate"), `Other activity + evidence are read (${JSON.stringify(spec.otherActivities)})`);
  assert(spec.projectChecklist.length === 1 && spec.projectChecklist[0].name === "114059 Cost estimate", `Project checklist is read (${JSON.stringify(spec.projectChecklist)})`);

  // 2. On the Logbook tab: import through the builder, preview; then edit inline.
  const content = buildUnitContent(unit, "# Estimating work\n\nEstimating starts with understanding the scope and identifying the required deliverables. Break the work into smaller tasks before estimating.", { minutes: 300 });
  const doc = { name: "Fixture", type: "application/pdf", size: 0, uploadedAt: "2026-09-17" };
  localStorage.removeItem(storageKey);
  rememberUnitPack("itss.unitbuilder.114059.shared", JSON.stringify({ revision, source: "x", files: { pdf: doc, pptx: doc, answers: doc }, content }));
  createRoot(document.getElementById("fixture")!).render(<UnitPage unitId="114059" profile={{ id: "logbook-edit-test", name: "Test", role: "Super User" } as any} progress={{ units: {} }} toggleActivity={() => {}} saveQuizResult={() => {}} setLogbookField={() => {}} saveExerciseResult={() => {}} navigate={() => {}} />);
  for (let i = 0; i < 100 && !document.querySelector('[role="tab"]'); i++) await tick();
  click("Logbook");
  await tick();
  click("Build logbook from notes");
  await tick();
  const input = document.querySelector<HTMLInputElement>('input[aria-label="Import logbook"]');
  assert(input, "Import logbook file input exists");
  const transfer = new DataTransfer();
  transfer.items.add(file);
  input.files = transfer.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
  const textarea = document.querySelector<HTMLTextAreaElement>(".unit-source-field textarea");
  assert(textarea, "Logbook textarea exists");
  for (let i = 0; i < 100 && !textarea.value; i++) await tick();
  assert(textarea.value.includes("| 1 | Explain the purpose"), "Imported Word content fills the logbook box");
  click("Preview logbook");
  await tick();
  const preview = document.querySelector<HTMLElement>(".unit-confirm");
  assert(preview, `Preview appears without error: ${document.querySelector('[role="alert"]')?.textContent}`);
  assert(normalize(preview.textContent).includes("3 knowledge questions · 2 practical · 2 workplace · 1 other · 1 project checklist"), `Preview summarises the imported logbook: ${normalize(preview.textContent)}`);
  click("Close logbook builder");
  await tick();

  const rowTexts = () => Array.from(document.querySelectorAll<HTMLElement>(".lb-matrix tbody tr")).filter(tr => tr.querySelector(".lb-no")).map(tr => normalize(tr.children[1].textContent));
  const originalRows = rowTexts();
  assert(originalRows.length >= 2, `Generated logbook has checklist rows (${originalRows.length})`);
  assert(!document.querySelector(".plan-edit"), "Reading mode has no editable cells");

  click("Edit logbook");
  await tick();
  assert(document.querySelector(".logbook.lb-editing"), "Edit mode is on");
  // Edit a checklist row's text
  const firstRow = document.querySelector<HTMLElement>(".lb-matrix tbody tr .lb-edit-row .plan-edit");
  assert(firstRow, "Checklist row text is editable");
  await typeInto(firstRow, "Explain what a cost/benefit analysis is for.");
  assert(rowTexts()[0] === "Explain what a cost/benefit analysis is for.", `Typed row text is saved (${rowTexts()[0]})`);
  // Toggle a default mark on that row
  const firstMarkBtn = document.querySelector<HTMLButtonElement>(".lb-matrix tbody tr .lb-mark .lb-markbtn");
  assert(firstMarkBtn, "Mark button exists");
  const wasOn = firstMarkBtn.classList.contains("on");
  firstMarkBtn.click();
  await tick();
  assert(document.querySelector<HTMLButtonElement>(".lb-matrix tbody tr .lb-mark .lb-markbtn")!.classList.contains("on") === !wasOn, "Clicking a mark in edit mode flips its default");
  // Add and delete a knowledge question
  const before = rowTexts().length;
  click("Add knowledge question");
  await tick();
  assert(rowTexts().length === before + 1 && rowTexts().includes("New knowledge question"), "Add knowledge question appends a row");
  const del = Array.from(document.querySelectorAll<HTMLButtonElement>('.lb-matrix button[title="Delete row"]')).find(b => normalize(b.closest("tr")?.children[1].textContent) === "New knowledge question");
  assert(del, "Delete control exists on the new row");
  del.click();
  await tick();
  assert(rowTexts().length === before, "Delete row removes it again");
  // Edit the project title and a workplace activity; add a detail field
  const projectTitle = document.querySelector<HTMLElement>(".lb-table strong.plan-edit");
  assert(projectTitle, "Project title is editable");
  await typeInto(projectTitle, "Cost estimate project");
  assert(normalize(document.querySelector(".lb-table strong")?.textContent) === "Cost estimate project", "Project title saved");
  click("Add detail field");
  await tick();
  assert(Array.from(document.querySelectorAll(".lb-details td.k")).some(td => normalize(td.textContent) === "New field"), "Detail field added");
  click("Add workplace activity");
  await tick();
  assert(Array.from(document.querySelectorAll(".lb-table td")).some(td => normalize(td.textContent) === "New workplace activity"), "Workplace activity added");
  // Persisted to the shared lesson-edits key
  const stored = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
  assert(stored.logbook?.knowledgeQuestions?.[0]?.text === "Explain what a cost/benefit analysis is for.", "Inline logbook structure is stored in lesson edits");
  assert(stored.logbook.detailFields.includes("New field") && stored.logbook.workplaceActivities.includes("New workplace activity"), "Added rows are stored");
  click("Done");
  await tick();
  assert(!document.querySelector(".plan-edit"), "Reading mode again has no editable cells");
  assert(rowTexts()[0] === "Explain what a cost/benefit analysis is for.", "Edited text stays after leaving edit mode");
  window.confirm = () => { throw new Error("Native confirmation must not be used"); };
  click("Reset to original");
  await tick();
  click("Reset logbook");
  await tick();
  assert(rowTexts()[0] === originalRows[0], `Reset restores the original logbook (${rowTexts()[0]})`);

  click("Edit logbook");
  await tick();
  document.querySelector(".lb-matrix")?.scrollIntoView();
  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent = "PASS: a Word logbook form imports into the logbook builder with headings, project, six evidence marks, workplace/other activities and project checklist; the Logbook tab edits inline — rows, marks, headings, fields — persists to shared edits and resets";
}

test().catch(error => {
  document.body.dataset.result = "failed";
  document.getElementById("result")!.textContent = `FAIL: ${error instanceof Error ? error.stack ?? error.message : String(error)}`;
});
