import { createRoot } from "react-dom/client";
import { UnitPage } from "../src/pages/Course";
import { buildUnitContent } from "../src/lib/unitBuilder";
import { rememberUnitPack, loadUnitPack } from "../src/lib/unitStorage";
import { readBuiltUnit, builtUnitKey } from "../src/lib/builtUnits";
import "../src/styles.css";

const tick = () => new Promise(resolve => setTimeout(resolve, 70));
function assert(ok: unknown, message: string): asserts ok { if (!ok) throw new Error(message); }
function click(label: string) {
  const button = Array.from(document.querySelectorAll("button")).find(button => button.textContent?.trim() === label);
  assert(button && !button.disabled, `Enabled button: ${label}`);
  button.click();
}
async function until(check: () => boolean, message: string) {
  for (let i = 0; i < 100; i++) { if (check()) return; await tick(); }
  throw new Error(message);
}
async function test() {
  const us = "114059";
  const key = builtUnitKey(us);
  const reloaded = sessionStorage.getItem("activity-reload");
  if (reloaded) await loadUnitPack(key);
  else {
    const source = "Break work into smaller tasks before estimating the time required. Use previous experience to improve estimates.";
    const content = buildUnitContent({us, title: "Estimating project time", nqf: 5, credits: 5, dates: "", time: ""}, source, {questions: 3, minutes: 60});
    content.exercises = []; content.questionSessions = [];
    const file = {name: "Fixture", type: "application/pdf", size: 0, uploadedAt: "2026-09-18"};
    rememberUnitPack(key, JSON.stringify({revision: "activity-fixture", source, files: {pdf: file, pptx: file, answers: file}, content}));
  }
  createRoot(document.getElementById("fixture")!).render(<UnitPage unitId={us} profile={{id: "activity-test", name: "Test", role: "Super User"} as any} progress={{units: {}}} toggleActivity={() => {}} saveQuizResult={() => {}} setLogbookField={() => {}} saveExerciseResult={() => {}} navigate={() => {}} />);
  await until(() => !!document.querySelector('[role="tab"]'), "Unit page rendered");
  click("Activity"); await tick();
  if (reloaded) {
    assert(readBuiltUnit(us)?.content.exercises.length === 1, "One activity survives reload");
    assert(document.querySelector(".activity-edit-bar") && document.body.textContent?.includes("Browser test activity"), "Saved activity visible after reload");
    document.body.dataset.result = "passed";
    document.getElementById("result")!.textContent = "PASS: Add opens visible fields immediately, Cancel saves nothing, Save adds exactly one activity, edits and activity persist after reload";
    return;
  }
  click("Add activity"); await tick();
  assert(document.querySelector<HTMLDetailsElement>(".activity-editor-card details")?.open, "New activity fields are expanded");
  assert(readBuiltUnit(us)?.content.exercises.length === 0, "Opening draft does not save placeholders");
  click("Cancel"); await tick();
  assert(!document.querySelector(".activity-editor-card"), "Cancel closes editor");
  assert(readBuiltUnit(us)?.content.exercises.length === 0, "Cancel leaves activity list unchanged");
  click("Add activity"); await tick();
  const title = document.querySelector<HTMLTextAreaElement>(".activity-editor-card textarea")!;
  assert(title.getBoundingClientRect().height > 0, "Title input is visible");
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(title, "Browser test activity");
  title.dispatchEvent(new Event("input", {bubbles: true})); await tick();
  click("Save activity");
  await until(() => !document.querySelector(".activity-editor-card"), "Save completes and closes editor");
  assert(readBuiltUnit(us)?.content.exercises.length === 1, "Exactly one activity saved");
  assert(readBuiltUnit(us)?.content.exercises[0].title === "Browser test activity", "Edited title saved");
  click("Edit activity"); await tick();
  assert(document.querySelector<HTMLTextAreaElement>(".activity-editor-card textarea")?.value === "Browser test activity", "Existing activity opens with saved title");
  click("Save activity");
  await until(() => !document.querySelector(".activity-editor-card"), "Edit saves");
  assert(readBuiltUnit(us)?.content.exercises.length === 1, "Editing does not duplicate activity");
  sessionStorage.setItem("activity-reload", "1"); location.reload();
}
test().catch(error => { document.body.dataset.result = "failed"; document.getElementById("result")!.textContent = String(error); });
