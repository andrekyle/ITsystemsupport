import { createRoot } from "react-dom/client";
import { UnitPage } from "../src/pages/Course";
import { buildUnitContent } from "../src/lib/unitBuilder";
import { receiveUnitPack } from "../src/lib/unitStorage";
import { builtUnitKey } from "../src/lib/builtUnits";
import { readBuiltUnit } from "../src/lib/builtUnits";

const runtimeErrors: string[] = [];
window.addEventListener("error", e => runtimeErrors.push(String(e.error?.stack ?? e.message)));
const assert = (condition: unknown, message: string) => { if (!condition) throw new Error(message); };
const tick = () => new Promise(resolve => setTimeout(resolve, 30));
async function waitFor(check: () => boolean) { for (let i = 0; i < 300; i++) { if (check()) return; await tick(); } throw new Error(`Timed out: ${document.body.textContent?.slice(-1000)}`); }
function click(text: string) {
  const button = [...document.querySelectorAll<HTMLButtonElement>("button")].find(b => b.textContent?.replace(/\s+/g, " ").trim() === text);
  assert(button, `Missing button: ${text}; buttons: ${[...document.querySelectorAll("button")].map(b=>b.textContent).join(" | ")}`); button!.click();
}
async function type(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  Object.getOwnPropertyDescriptor(element instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype, "value")!.set!.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true })); await tick();
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
  click("Self assessment"); await tick(); click("Edit self assessment"); await tick();
  const original = readBuiltUnit("114059")!.content.selfAssessment!;
  const editor = () => document.querySelector(".self-assessment-editor")!;
  await type(editor().querySelector<HTMLTextAreaElement>("textarea")!, "Custom introduction");
  click("Cancel"); await tick();
  assert(readBuiltUnit("114059")!.content.selfAssessment!.intro[0] === original.intro[0], "Cancel preserves saved instructions");
  click("Edit self assessment"); await tick();
  await type(editor().querySelector<HTMLTextAreaElement>("textarea")!, "Custom introduction");
  const item = [...editor().querySelectorAll<HTMLTextAreaElement>("textarea")].find(t => t.closest("label")?.textContent?.includes("Checklist items 1"))!;
  await type(item, "I can explain cost-benefit analysis.");
  click("Add checklist items"); await tick();
  const items = [...editor().querySelectorAll<HTMLTextAreaElement>("textarea")].filter(t => t.closest("label")?.textContent?.includes("Checklist items"));
  await type(items[items.length - 1], "I can estimate the resources required.");
  const closing = [...editor().querySelectorAll<HTMLTextAreaElement>("textarea")].find(t => t.closest("label")?.textContent?.includes("Closing instructions 1"))!;
  await type(closing, "Discuss any gaps with your facilitator.");
  click("Save changes");
  await waitFor(() => !document.querySelector(".self-assessment-editor"));
  const saved = readBuiltUnit("114059")!.content.selfAssessment!;
  assert(saved.intro[0] === "Custom introduction", "Loading preserves edited introduction");
  assert(saved.items[0] === "I can explain cost-benefit analysis.", "Checklist text is saved");
  assert(saved.items.length === original.items.length + 1, "New checklist item is saved");
  assert(saved.outro[0] === "Discuss any gaps with your facilitator.", "Loading preserves closing instructions");
  assert(document.body.textContent!.includes(saved.items[0]), "Updated checklist is displayed");
  root.render(<Fixture role="Learner" />); await tick();
  assert(![...document.querySelectorAll("button")].some(b => b.textContent === "Edit self assessment"), "Learners cannot edit assessment content");
  document.getElementById("result")!.textContent = "PASS: edit, add item, cancel, save, preserve instructions on read, learner permissions";
  document.body.dataset.result = "passed";
}
test().catch(error => { document.getElementById("result")!.textContent = String(error.stack ?? error) + "\n" + runtimeErrors.join("\n"); document.body.dataset.result = "failed"; });
