import { createRoot } from "react-dom/client";
import { UnitPage } from "../src/pages/Course";
import { buildUnitContent } from "../src/lib/unitBuilder";
import { receiveUnitPack } from "../src/lib/unitStorage";
import { builtUnitKey } from "../src/lib/builtUnits";
import { readBuiltUnit } from "../src/lib/builtUnits";
import { loadInlineDraft } from "../src/lib/inlineDraftStorage";

const runtimeErrors: string[] = [];
window.addEventListener("error", e => runtimeErrors.push(String(e.error?.stack ?? e.message)));
const assert = (condition: unknown, message: string) => { if (!condition) throw new Error(message); };
const tick = () => new Promise(resolve => setTimeout(resolve, 30));
async function waitFor(check: () => boolean) { for (let i = 0; i < 300; i++) { if (check()) return; await tick(); } throw new Error(`Timed out: ${document.body.textContent?.slice(-1000)}`); }
function click(text: string) {
  const button = [...document.querySelectorAll<HTMLButtonElement>("button")].find(b => b.textContent?.replace(/\s+/g, " ").trim() === text);
  assert(button, `Missing button: ${text}; buttons: ${[...document.querySelectorAll("button")].map(b=>b.textContent).join(" | ")}`); button!.click();
}
function Fixture({ role = "Super User" }: { role?: string }) {
  return <UnitPage unitId="114059" profile={{ id: "self-assessment-test", name: "Test", role } as any} progress={{ units: {} }} toggleActivity={() => {}} saveQuizResult={() => {}} navigate={() => {}} setLogbookField={() => {}} saveExerciseResult={() => {}} />;
}
async function test() {
  const source = "# Teamwork\n\nEffective teamwork involves listening carefully to colleagues and respecting their contributions. Ask questions to clarify ideas and resolve disagreements fairly. Share responsibilities and communicate progress so the team can complete its tasks successfully.";
  const content = buildUnitContent({ us: "114059", title: "Teamwork", nqf: 5, credits: 5, dates: "", time: "" }, source, { questions: 5, minutes: 60 });
  content.exercises = []; content.questionSessions = [];
  const file = { name: "test", type: "text/plain", size: 0, data: "data:text/plain,test", uploadedAt: new Date().toISOString() };
  receiveUnitPack(builtUnitKey("114059"), JSON.stringify({ revision: "test", source, content, files: { pdf: file, pptx: file, answers: file }, createdAt: new Date().toISOString(), aiUsed: false }));
  const root = createRoot(document.getElementById("fixture")!);
  root.render(<Fixture />);
  await waitFor(() => !!document.querySelector('[role="tab"]'));
  click("Self assessment"); await tick();
  const original = readBuiltUnit("114059")!.content.selfAssessment!;
  const removeButtons = () => [...document.querySelectorAll<HTMLButtonElement>('[aria-label^="Delete self assessment option"]')];
  assert(removeButtons().length === 0, "Delete controls are hidden outside editing");
  click("Edit self assessment inline"); await tick();
  assert(removeButtons().length === original.items.length, "Every option has a delete button");
  removeButtons()[0].click(); await tick();
  const draft = loadInlineDraft("self-assessment-test", "114059")!;
  assert(draft.selfAssessment!.items.length === original.items.length - 1, "Deletion updates the preserved draft");
  assert(draft.selfAssessment!.items[0] === original.items[1], "Deleting removes the selected option");
  assert(readBuiltUnit("114059")!.content.selfAssessment!.items.length === original.items.length, "Saved content waits for explicit save");
  assert(removeButtons().length === original.items.length - 1, "Deleted option disappears");
  assert(!document.querySelector<HTMLInputElement>(".self-assess-item input:checked"), "Delete does not tick a checkbox");
  click("Cancel inline changes"); await tick();
  assert(!loadInlineDraft("self-assessment-test", "114059"), "Cancel clears the deletion draft");
  assert(document.querySelectorAll(".self-assess-item").length === original.items.length, "Cancel restores all options");
  click("Edit self assessment inline"); await tick();
  while (removeButtons().length) { removeButtons()[0].click(); await tick(); }
  assert(loadInlineDraft("self-assessment-test", "114059")!.selfAssessment!.items.length === 0, "All unwanted options can be removed");
  click("Cancel inline changes"); await tick();
  root.render(<Fixture role="Learner" />); await tick();
  assert(removeButtons().length === 0, "Learners cannot delete assessment content");
  assert(![...document.querySelectorAll("button")].some(b => b.textContent === "Edit self assessment inline"), "Learners cannot enter content editing");
  document.getElementById("result")!.textContent = "PASS: delete selected option, preserve draft, cancel, delete all, learner permissions";
  document.body.dataset.result = "passed";
}
test().catch(error => { document.getElementById("result")!.textContent = String(error.stack ?? error) + "\n" + runtimeErrors.join("\n"); document.body.dataset.result = "failed"; });
