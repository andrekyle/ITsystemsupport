import { createRoot } from "react-dom/client";
import { UnitPage } from "../src/pages/Course";
import { rememberUnitPack } from "../src/lib/unitStorage";
import { readBuiltUnit } from "../src/lib/builtUnits";
const tick = () => new Promise(resolve => setTimeout(resolve, 30));
const until = async (f: () => unknown) => { for (let i=0;i<160;i++) { if (f()) return; await tick(); } throw new Error("Timed out: " + document.body.textContent); };
function assert(v: unknown, message: string): asserts v { if (!v) throw new Error(message); }
function button(text: string) { const el = [...document.querySelectorAll("button")].find(el => el.textContent?.trim() === text); assert(el, `Missing button ${text}`); return el; }
async function test() {
  rememberUnitPack("itss.unitbuilder.114059.shared", JSON.stringify({ revision: "empty-lesson", source: "", files: {}, content: { lesson: [], exercises: [], assignments: [], quiz: [] } }));
  createRoot(document.getElementById("fixture")!).render(<UnitPage unitId="114059" profile={{ id: "empty-editor", name: "Editor", role: "Super User", createdAt: "2026-11-18" }} progress={{ units: {} }} toggleActivity={() => {}} saveQuizResult={() => {}} setLogbookField={() => {}} setLogbookFields={() => {}} saveExerciseResult={() => {}} navigate={() => {}} />);
  await until(() => [...document.querySelectorAll("button")].some(el => el.textContent?.trim() === "Lesson"));
  button("Lesson").click(); await tick();
  button("Edit slide text").click();
  await until(() => document.querySelector('[aria-label="Create first lesson slide"]'));
  button("Create slide").click(); await until(() => document.querySelector('[role="alert"]'));
  assert(document.querySelector('[role="alert"]')?.textContent?.includes("Enter a slide heading"), "Empty text is explained");
  const textarea = document.querySelector("[role=dialog] textarea")!;
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(textarea, "First lesson teaching text.");
  textarea.dispatchEvent(new Event("input", { bubbles: true })); await tick();
  button("Create slide").click();
  await until(() => readBuiltUnit("114059")?.content.lesson.length === 1);
  await until(() => !document.querySelector('[aria-label="Create first lesson slide"]'));
  assert(document.body.textContent?.includes("First lesson teaching text."), "Saved slide is displayed");
  assert(document.querySelector('[data-lesson-editor="0"]'), "New slide opens for editing");
  assert(readBuiltUnit("114059")?.files.pdf, "Course files saved with slide");
  document.body.dataset.result="passed";
  document.getElementById("result")!.textContent="PASS: empty lesson opens editor, validates, saves first slide with files and enables slide editing.";
}
test().catch(error => { document.body.dataset.result="failed"; document.getElementById("result")!.textContent=String(error); });
