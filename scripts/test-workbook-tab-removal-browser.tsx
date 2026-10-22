import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { UnitPage } from "../src/pages/Course";
import { rememberUnitPack, unitPackSnapshot } from "../src/lib/unitStorage";
import type { Profile, UnitContent } from "../src/types";
import "../src/styles.css";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
const tick = () => new Promise(resolve => setTimeout(resolve, 60));
const fixture = document.getElementById("fixture")!;
const profile: Profile = { id: "workbook-removal-test", name: "Test learner", role: "Learner", createdAt: "2026-10-16" };
const content: UnitContent = {
  lesson: [], exercises: [], assignments: [], quiz: [],
  workbook: { title: "Learner Workbook", outcomes: [] },
};
async function test() {
  const key = "itss.unitbuilder.114074.shared";
  const pack = JSON.stringify({ revision: "workbook-removal", source: "", files: {}, content });
  rememberUnitPack(key, pack);
  const savedAnswers = JSON.stringify({ units: { "114074": { activities: {}, logbook: { "learner-workbook.answer": "Retain my answer" } } } });
  localStorage.setItem("itss.progress.workbook-removal-test", savedAnswers);
  for (const tab of ["workbook", "memo"]) {
    localStorage.setItem("itss.unittab.us", "114074");
    localStorage.setItem("itss.unittab", tab);
    const root = createRoot(fixture);
    flushSync(() => root.render(<UnitPage unitId="114074" profile={profile} progress={{ units: {} }}
      toggleActivity={() => {}} saveQuizResult={() => {}} setLogbookField={() => {}} saveExerciseResult={() => {}} navigate={() => {}} />));
    await tick();
    const tabs = Array.from(fixture.querySelectorAll('[role="tab"]'));
    assert(!tabs.some(node => /Learner Workbook|^Memo$/.test(node.textContent?.trim() ?? "")), "114074 has no workbook or workbook memo tab");
    assert(!fixture.querySelector(".lw-document,.source-workbook,.uploaded-pdf"), "Remembered workbook cannot render");
    assert(tabs.find(node => node.getAttribute("aria-selected") === "true")?.textContent?.includes("Learning activities"), "Remembered workbook/memo redirects to Learning activities");
    flushSync(() => root.unmount());
  }
  assert(unitPackSnapshot(key) === pack, "Removing the tab does not erase saved unit content");
  assert(localStorage.getItem("itss.progress.workbook-removal-test") === savedAnswers, "Existing learner responses are retained");
  localStorage.setItem("itss.unittab.us", "114046");
  localStorage.setItem("itss.unittab", "overview");
  const root = createRoot(fixture);
  flushSync(() => root.render(<UnitPage unitId="114046" profile={profile} progress={{ units: {} }}
    toggleActivity={() => {}} saveQuizResult={() => {}} setLogbookField={() => {}} saveExerciseResult={() => {}} navigate={() => {}} />));
  await tick();
  assert(Array.from(fixture.querySelectorAll('[role="tab"]')).some(node => node.textContent?.includes("Learner Workbook")), "114046 workbook remains available");
  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent = "PASS: 114074 workbook/memo tabs removed; remembered tabs redirect; saved content and answers retained; 114046 unaffected.";
}
test().catch(error => {
  document.body.dataset.result = "failed";
  document.getElementById("result")!.textContent = String(error);
});
