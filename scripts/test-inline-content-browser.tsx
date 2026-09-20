import { createRoot } from "react-dom/client";
import { CoursePage, ModulePage, UnitPage } from "../src/pages/Course";
import { createCourse, saveCustomCourse } from "../src/data/courses";
import { buildUnitContent } from "../src/lib/unitBuilder";
import { receiveUnitPack } from "../src/lib/unitStorage";
import { builtUnitKey, readBuiltUnit } from "../src/lib/builtUnits";

const assert = (value: unknown, message: string) => { if (!value) throw new Error(message); };
const tick = () => new Promise(resolve => setTimeout(resolve, 30));
async function waitFor(check: () => boolean) { for (let i = 0; i < 900; i++) { if (check()) return; await tick(); } throw new Error(`Timed out: ${document.body.textContent?.slice(-1500)}`); }
function click(text: string) {
  const button = [...document.querySelectorAll<HTMLButtonElement>("button")].find(b => b.textContent?.trim() === text);
  assert(button, `Missing button ${text}`); button!.click();
}
async function edit(element: HTMLElement, value: string) {
  assert(element, "Missing inline field"); element.focus(); element.textContent = value; element.blur(); await tick();
}
const profile = { id: "inline-test", name: "Test", role: "Super User" } as any;
const progress = { units: {} } as any;
const root = createRoot(document.getElementById("fixture")!);
async function test() {
  const course = createCourse({ title: "Inline course", saqaId: "48573", nqfLevel: 5, credits: 10, description: "Description", moduleName: "Module" });
  saveCustomCourse(course); localStorage.setItem("itss.activeCourse", course.id);
  root.render(<CoursePage profile={profile} progress={progress} navigate={() => { throw new Error("Editing navigated away"); }} />);
  await waitFor(() => !!document.querySelector(".page-title")); click("Edit inline"); await tick();
  await edit(document.querySelector<HTMLElement>('.page-title [contenteditable]')!, "Changed course");
  assert(document.querySelector(".page-title")!.textContent === "Changed course", "Course title updates in place");
  click("Cancel"); await tick();
  assert(document.querySelector(".page-title")!.textContent === "Inline course", "Cancel restores course title");
  root.render(<ModulePage profile={profile} progress={progress} moduleId={course.modules[0].id} navigate={() => { throw new Error("Editing navigated away"); }} />);
  await tick(); click("Edit inline"); await tick();
  await edit(document.querySelector<HTMLElement>('.unit-row [aria-label="title"]')!, "Changed unit");
  assert(document.querySelector(".unit-row")!.textContent!.includes("Changed unit"), "Unit list edits in place");
  click("Cancel"); await tick();
  // UnitPage uses the built-in course lookup loaded at module import.
  localStorage.setItem("itss.activeCourse", "itss");
  const source = "# Teamwork\n\nEffective teamwork involves listening carefully to colleagues and respecting their contributions. Ask questions to clarify ideas and resolve disagreements fairly. Share responsibilities and communicate progress so the team can complete its tasks successfully.";
  const content = buildUnitContent({ us: "114059", title: "Teamwork", nqf: 5, credits: 5, dates: "", time: "" }, source, { questions: 5, minutes: 60 });
  content.quiz = [{ q: "What helps teamwork?", options: ["Listening", "Ignoring colleagues"], answer: 0, explain: "Listen to colleagues." }];
  const file = { name: "test", type: "text/plain", size: 0, data: "data:text/plain,test", uploadedAt: new Date().toISOString() };
  receiveUnitPack(builtUnitKey("114059"), JSON.stringify({ revision: "inline-test", source, content, files: { pdf: file, pptx: file, answers: file }, createdAt: new Date().toISOString(), aiUsed: false }));
  const fixture = (role = "Super User") => <UnitPage profile={{ ...profile, role }} progress={progress} unitId="114059" navigate={() => {}} toggleActivity={() => {}} saveQuizResult={() => {}} setLogbookField={() => {}} saveExerciseResult={() => {}} />;
  root.render(fixture()); await waitFor(() => !!document.querySelector('[role="tab"]'));
  click("Edit content inline"); await tick(); click("Self assessment"); await tick();
  await edit(document.querySelector<HTMLElement>('.self-assess-item [contenteditable]')!, "Changed checklist");
  click("Cancel inline changes"); await tick();
  assert(!document.body.textContent!.includes("Changed checklist"), "Cancel restores unit content");
  click("Edit content inline"); await tick();
  await edit(document.querySelector<HTMLElement>('.self-assess-item [contenteditable]')!, "Saved checklist");
  click("Quiz"); await tick();
  await edit(document.querySelector<HTMLElement>('.qt [contenteditable]')!, "");
  click("Save inline changes and update files"); await tick();
  assert(readBuiltUnit("114059")!.revision === "inline-test", "Invalid content is not published");
  assert(!!document.querySelector('.qt [contenteditable]'), "Failed save keeps the draft editable");
  await edit(document.querySelector<HTMLElement>('.qt [contenteditable]')!, "Saved question?");
  assert(!document.body.textContent!.includes("Submit answers"), "Editing a quiz cannot submit learner answers");
  click("Save inline changes and update files");
  await waitFor(() => readBuiltUnit("114059")?.revision !== "inline-test");
  assert(readBuiltUnit("114059")!.content.selfAssessment!.items[0] === "Saved checklist", "Inline checklist persisted");
  assert(readBuiltUnit("114059")!.content.quiz[0].q === "Saved question?", "Inline quiz persisted across tabs");
  root.render(fixture("Learner")); await tick();
  assert(!document.querySelector('[contenteditable]'), "Learners cannot edit published content");
  document.getElementById("result")!.textContent = "PASS: inline course and unit list, cancellation, unit edits across tabs, save/export, learner permissions";
  document.body.dataset.result = "passed";
}
test().catch(error => { document.getElementById("result")!.textContent = String(error.stack ?? error); document.body.dataset.result = "failed"; });
