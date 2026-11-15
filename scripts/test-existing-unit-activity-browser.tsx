import { createRoot } from "react-dom/client";
import { UnitPage } from "../src/pages/Course";
import "../src/styles.css";

const tick = () => new Promise(resolve => setTimeout(resolve, 60));
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
async function until(check: () => boolean, message: string) {
  for (let index = 0; index < 100; index++) { if (check()) return; await tick(); }
  throw new Error(message);
}
async function test() {
  const savedAnswer = "My saved report-writing answer must remain attached to the original question session.";
  const progress = { units: { "8252": { activities: {}, logbook: { "exq.qs1.0": savedAnswer } } } };
  const root = createRoot(document.getElementById("fixture")!);
  for (const role of ["Learner", "Admin"] as const) {
    root.render(<UnitPage unitId="8252" profile={{ id: "activity-visibility-test", name: "Test", role } as any}
      progress={progress} toggleActivity={() => {}} saveQuizResult={() => {}} setLogbookField={() => {}}
      saveExerciseResult={() => {}} navigate={() => {}} />);
    await until(() => !!document.querySelector('[role="tab"]'), "Unit tabs must render");
    const activity = [...document.querySelectorAll<HTMLButtonElement>('[role="tab"]')].find(button => button.textContent?.trim() === "Activity");
    assert(activity, "Activity tab must exist"); activity.click(); await tick();
    await until(() => document.body.textContent?.includes("Give examples of different types of reports that are produced in organisations") ?? false, `${role}: original report-writing activity must be visible`);
    assert(!document.querySelector(".unit-tab-empty"), `${role}: existing question sessions must not show an empty activity state`);
    assert([...document.querySelectorAll<HTMLTextAreaElement>("textarea")].some(input => input.value === savedAnswer), `${role}: saved learner answer must still load under qs1`);
  }
  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent = "PASS: US 8252's original question-session activity appears in Activity for learners and admins, with the existing saved answer intact.";
}
test().catch(error => { document.body.dataset.result = "failed"; document.getElementById("result")!.textContent = String(error); });
