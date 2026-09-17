import { createRoot } from "react-dom/client";
import { UnitPage } from "../src/pages/Course";
import { rememberUnitPack } from "../src/lib/unitStorage";
import "../src/styles.css";

const revision = "editor-table-fixture";
const reloadKey = "editor-table-reloaded";
const storageKey = `itss.lessonedits.114059.built-${revision}`;
const tick = () => new Promise(resolve => setTimeout(resolve, 80));
function assert(ok: unknown, message: string): asserts ok { if (!ok) throw new Error(message); }
function click(label: string) {
  const button = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(button =>
    button.textContent?.trim() === label || button.getAttribute("aria-label") === label
  );
  assert(button, `Missing button: ${label}`);
  button.click();
}
function placeCaretAtEnd(element: HTMLElement) {
  element.focus();
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  document.dispatchEvent(new Event("selectionchange"));
}
function verify(mode: string) {
  const lesson = document.querySelector<HTMLElement>(".lesson-section");
  assert(lesson, `${mode}: lesson section exists`);
  const wrapper = lesson.querySelector<HTMLElement>(".lesson-table-scroll");
  assert(wrapper, `${mode}: inserted table uses the lesson table scroll wrapper`);
  const table = wrapper.querySelector<HTMLTableElement>("table.data.lesson-table");
  assert(table, `${mode}: inserted table uses existing lesson table classes`);
  assert(table.querySelectorAll("thead th").length === 3, `${mode}: default table has three heading cells`);
  assert(table.querySelectorAll("tbody tr").length === 2, `${mode}: three requested rows produce one heading row and two body rows`);
  assert(table.querySelectorAll("tbody td").length === 6, `${mode}: body cells match three columns`);
  const firstCell = table.querySelector<HTMLTableCellElement>("tbody td")!;
  const before = getComputedStyle(firstCell).backgroundColor;
  table.querySelector("tbody tr")!.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
  const after = getComputedStyle(firstCell).backgroundColor;
  assert(before === after, `${mode}: lesson table row hover does not change cell background`);
}
async function test() {
  rememberUnitPack("itss.unitbuilder.114059.shared", JSON.stringify({
    revision,
    source: "Editor table fixture source with enough text to avoid empty content.",
    files: {
      pdf: { name: "pdf", type: "application/pdf", size: 0, uploadedAt: "2026-09-17" },
      pptx: { name: "pptx", type: "application/vnd.openxmlformats-officedocument.presentationml.presentation", size: 0, uploadedAt: "2026-09-17" },
      answers: { name: "answers", type: "application/pdf", size: 0, uploadedAt: "2026-09-17" },
    },
    content: {
      lesson: [{ heading: "Editor table", paragraphs: ["Insert a table below this paragraph."] }],
      exercises: [{ id: "e1", title: "Activity", task: "Task", scenario: ["Scenario"], steps: ["Step"], modelAnswer: [{ heading: "Answer", paragraphs: ["Answer"] }] }],
      questionSessions: [], assignments: [], quiz: [{ q: "Question?", options: ["A", "B"], answer: 0, explain: "A" }],
      saqa: { notice: "", registration: [], sections: [] },
      logbook: { assignmentTitle: "", programme: "", unitLabel: "", detailFields: [], project: { time: "", title: "", text: "", resource: "" }, knowledgeQuestions: [], practicalActivities: [], workplaceActivities: [], workplaceEvidenceNote: "", otherActivities: [], otherEvidenceNote: "", projectChecklist: [] },
      selfAssessment: { intro: [], items: ["Ready"], outro: [] },
      lessonPlan: { title: "", startTime: "", details: [], prep: [], sections: [] },
      studyNotes: [], evaluation: { intro: "", questions: ["Question"] },
    },
  }));
  createRoot(document.getElementById("fixture")!).render(<UnitPage unitId="114059" profile={{ id: "editor-table-test", name: "Test", role: "Super User" } as any} progress={{ units: {} }} toggleActivity={() => {}} saveQuizResult={() => {}} setLogbookField={() => {}} saveExerciseResult={() => {}} navigate={() => {}} />);
  for (let i = 0; i < 100 && !document.querySelector('[role="tab"]'); i++) await tick();
  click("Lesson");
  await tick();
  if (!sessionStorage.getItem(reloadKey)) {
    click("Edit content");
    await tick();
    const editor = document.querySelector<HTMLElement>(".slide-whole-editor")!;
    placeCaretAtEnd(editor);
    click("Table");
    await tick();
    assert(document.querySelector('[aria-label="Table options"]'), "Table button opens the row and column picker");
    click("Insert table");
    await tick();
    verify("editing");
    click("Done editing");
    await tick();
    verify("saved");
    const stored = JSON.parse(localStorage.getItem(storageKey)!);
    assert(stored.sectionBody?.[0]?.richHtml?.includes("lesson-table-scroll"), "Saved rich HTML keeps the inserted table wrapper");
    sessionStorage.setItem(reloadKey, "1");
    location.reload();
    return;
  }
  verify("reloaded");
  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent = "PASS: editor inserts styled lesson tables that save, reload and do not highlight on row hover";
}

test().catch(error => {
  document.body.dataset.result = "failed";
  document.getElementById("result")!.textContent = String(error);
});
