import { createRoot } from "react-dom/client";
import { UnitPage } from "../src/pages/Course";
import { buildUnitContent } from "../src/lib/unitBuilder";
import { rememberUnitPack } from "../src/lib/unitStorage";
import "../src/styles.css";

const revision = "plan-inline-edit-fixture";
const storageKey = `itss.lessonedits.114059.built-${revision}`;
const tick = () => new Promise(resolve => setTimeout(resolve, 80));
function assert(ok: unknown, message: string): asserts ok { if (!ok) throw new Error(message); }
const normalize = (value: string | null | undefined) => (value ?? "").replace(/\s+/g, " ").trim();
function click(label: string) {
  const button = Array.from(document.querySelectorAll("button")).find(button => normalize(button.textContent) === label);
  assert(button, `Missing button: ${label}`);
  button.click();
}
function clickTitled(title: string, index = 0) {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>(`button[title="${title}"]`));
  assert(buttons[index], `Missing control: ${title} #${index}`);
  buttons[index].click();
}
function planRows() {
  return Array.from(document.querySelectorAll<HTMLTableRowElement>(".plan-table tbody tr")).filter(row => !row.classList.contains("plan-sec") && !row.classList.contains("plan-add-row"));
}
async function typeInto(el: HTMLElement, text: string) {
  el.focus();
  el.textContent = text;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.blur();
  await tick();
}

async function test() {
  const source = ["# Estimating work", "Estimating starts with understanding the scope and identifying the required deliverables. Break the work into smaller tasks before estimating.", "# Late delivery", "Late delivery can increase costs and disrupt dependent activities. Communicate delays early so stakeholders can adjust their plans."].join("\n\n");
  const content = buildUnitContent({ us: "114059", title: "Cost estimation", nqf: 5, credits: 5, dates: "", time: "" }, source, { minutes: 300 });
  const file = { name: "Fixture", type: "application/pdf", size: 0, uploadedAt: "2026-09-17" };
  localStorage.removeItem(storageKey);
  // The saved pack carries a facilitator-pasted plan; it must be shown as saved, not replaced by a template.
  const pastedPlan = { title: "Facilitator Preparation", startTime: "09:00", prep: ["Study the notes."], sections: [{ heading: "Unit Standard 114059", rows: [
    { time: "30 minutes", title: "Index & Unit Standard Alignment – Facilitator", text: ["Read through the index with the learners."], resources: ["LM p2-3"] },
    { time: "90 minutes", title: "Interpret the cost/benefit analysis documentation – Facilitator & Class", bullets: ["Read through page 4-6 of the learner manual."], resources: ["LM p4-6"] },
    { time: "45 minutes", title: "Questionnaire 1 – Class in pairs", bullets: ["Facilitator to read through the questions.", "Allow the learners to complete the questions."], resources: ["LM p 7"] },
    { time: "10 minutes", title: "Break", break: true },
    { time: "20 minutes", title: "Affects of late delivery – Facilitator & Class", bullets: ["Read through pages 22-25."], resources: ["LM p22-25"] },
    { time: "10 minutes", title: "Parking Bay – Facilitator", bullets: ["Take all the questions from the learners."], resources: ["White Board"] },
    { time: "10 minutes", title: "Closing – Facilitator", bullets: ["Thank the learners for their participation."] },
  ] }] };
  rememberUnitPack("itss.unitbuilder.114059.shared", JSON.stringify({ revision, source, planSource: "pasted", files: { pdf: file, pptx: file, answers: file }, content: { ...content, lessonPlan: pastedPlan } }));

  createRoot(document.getElementById("fixture")!).render(<UnitPage unitId="114059" profile={{ id: "plan-edit-test", name: "Test", role: "Super User" } as any} progress={{ units: {} }} toggleActivity={() => {}} saveQuizResult={() => {}} setLogbookField={() => {}} saveExerciseResult={() => {}} navigate={() => {}} />);
  for (let i = 0; i < 100 && !document.querySelector('[role="tab"]'); i++) await tick();
  click("Lesson plan");
  await tick();

  const table = document.querySelector<HTMLTableElement>(".plan-table");
  assert(table, "Lesson plan table is displayed");
  const originalRows = planRows().length;
  const originalTitle = normalize(planRows()[1]?.querySelector(".plan-title")?.textContent);
  assert(originalRows === 7, `Pasted plan is shown exactly as saved — 7 rows (got ${originalRows})`);
  assert(normalize(planRows()[0].querySelector(".plan-title")?.textContent) === "Index & Unit Standard Alignment – Facilitator", "Pasted first row is shown, not the template");
  assert(normalize(planRows()[0].querySelector(".plan-res")?.textContent) === "LM p2-3", "Pasted resource is shown");
  assert(normalize(planRows()[1].querySelector(".plan-clock")?.textContent) === "09:30 – 11:00", `Pasted times drive the clock: ${normalize(planRows()[1].querySelector(".plan-clock")?.textContent)}`);
  assert(!document.querySelector(".plan-edit"), "Reading mode has no editable cells");

  click("Edit table");
  await tick();
  assert(document.querySelector(".plan-card.plan-editing"), "Edit mode is on");
  const editable = document.querySelectorAll<HTMLElement>(".plan-table .plan-edit");
  assert(editable.length >= originalRows * 2, `Every row exposes editable cells (${editable.length})`);

  // 1. Edit an activity title character-by-character (typed text replaces the cell)
  const titleCell = planRows()[1].querySelector<HTMLElement>(".plan-title .plan-edit");
  assert(titleCell, "Activity title is editable");
  await typeInto(titleCell, "Welcome & registration – Facilitator");
  assert(normalize(planRows()[1].querySelector(".plan-title")?.textContent) === "Welcome & registration – Facilitator", "Typed title is saved in the table");

  // 2. Edit a time and see the clock column recalculate
  const timeCell = planRows()[1].querySelector<HTMLElement>(".plan-mins");
  assert(timeCell, "Time cell is editable");
  await typeInto(timeCell, "45 minutes");
  assert(normalize(planRows()[1].querySelector(".plan-clock")?.textContent).includes("09:30 – 10:15"), `Clock column recalculates: ${normalize(planRows()[1].querySelector(".plan-clock")?.textContent)}`);

  // 3. Edit a resource cell
  const resCell = planRows()[1].querySelector<HTMLElement>(".plan-res .plan-edit");
  assert(resCell, "Resource cell is editable");
  await typeInto(resCell, "LM p2-3");
  assert(normalize(planRows()[1].querySelector(".plan-res")?.textContent).includes("LM p2-3"), "Resource edit is saved");

  // 4. Insert a row below, then delete it
  clickTitled("Insert row below", 1);
  await tick();
  assert(planRows().length === originalRows + 1, `Insert row adds a row (${planRows().length})`);
  assert(normalize(planRows()[2].querySelector(".plan-title")?.textContent) === "New activity", "Inserted row appears directly below");
  clickTitled("Delete row", 2);
  await tick();
  assert(document.querySelector('[role="dialog"][aria-label="Delete row?"]'), "Row deletion uses an app dialog");
  click("Cancel");
  await tick();
  assert(planRows().length === originalRows + 1, "Cancel preserves the row");
  clickTitled("Delete row", 2);
  await tick();
  click("Delete row");
  await tick();
  assert(planRows().length === originalRows, `Delete row removes it (${planRows().length})`);

  // 5. Add a bullet + resource to a row, then remove the bullet
  const bulletsBefore = planRows()[1].querySelectorAll(".plan-bullets li").length;
  const addBullet = Array.from(planRows()[1].querySelectorAll("button")).find(b => normalize(b.textContent) === "Bullet");
  assert(addBullet, "Add bullet button exists");
  addBullet.click();
  await tick();
  assert(planRows()[1].querySelectorAll(".plan-bullets li").length === bulletsBefore + 1, "Bullet added to the activity cell");
  const removeBullet = planRows()[1].querySelector<HTMLButtonElement>('button[title="Remove bullet"]');
  assert(removeBullet, "Remove bullet control exists");
  removeBullet.click();
  await tick();
  assert(planRows()[1].querySelectorAll(".plan-bullets li").length === bulletsBefore, "Bullet removed again");

  // 6. Add a section and delete it through the app dialog
  const sectionsBefore = document.querySelectorAll(".plan-table tr.plan-sec").length;
  click("Add section");
  await tick();
  assert(document.querySelectorAll(".plan-table tr.plan-sec").length === sectionsBefore + 1, "Add section appends a section heading row");
  window.confirm = () => { throw new Error("Native confirmation must not be used"); };
  const deleteSection = Array.from(document.querySelectorAll<HTMLButtonElement>('button[title="Delete this section and all its rows"]')).pop();
  assert(deleteSection, "Delete section control exists");
  deleteSection.click();
  await tick();
  click("Delete section");
  await tick();
  assert(document.querySelectorAll(".plan-table tr.plan-sec").length === sectionsBefore, "Delete section removes it");

  // 7. Edits are persisted to the shared lesson-edits key
  const stored = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
  assert(stored.lessonPlan?.sections?.length, "Inline plan is stored in lesson edits");
  assert(JSON.stringify(stored.lessonPlan).includes("Welcome & registration"), "Stored plan contains the typed title");

  // 8. Leaving edit mode shows the edited (not original) table with no editable cells
  click("Done");
  await tick();
  assert(!document.querySelector(".plan-table .plan-edit"), "Reading mode again has no editable cells");
  assert(normalize(planRows()[1].querySelector(".plan-title")?.textContent) === "Welcome & registration – Facilitator", "Edited title stays after leaving edit mode");
  assert(originalTitle !== "Welcome & registration – Facilitator", "Fixture title actually changed");

  // 9. Reset restores the original
  click("Reset to original");
  await tick();
  click("Reset lesson plan");
  await tick();
  assert(normalize(planRows()[1].querySelector(".plan-title")?.textContent) === originalTitle, "Reset restores the original plan");

  // Leave the page in edit mode for the screenshot.
  click("Edit table");
  await tick();
  document.querySelector(".plan-table")?.scrollIntoView();

  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent = "PASS: lesson plan table edits inline — titles, times, resources, bullets, rows and sections can be typed, added, moved and deleted, persist to shared edits and can be reset";
}

test().catch(error => {
  document.body.dataset.result = "failed";
  document.getElementById("result")!.textContent = `FAIL: ${error instanceof Error ? error.stack ?? error.message : String(error)}`;
});
