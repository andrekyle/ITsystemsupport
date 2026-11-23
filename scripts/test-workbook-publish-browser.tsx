import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { UnitPage } from "../src/pages/Course";
import { rememberUnitPack, unitPackSnapshot } from "../src/lib/unitStorage";
import type { Profile, UnitContent } from "../src/types";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
const tick = () => new Promise(resolve => setTimeout(resolve, 60));
const fixture = document.getElementById("fixture")!;
const learner: Profile = { id: "workbook-publish-test", name: "Test learner", role: "Learner", createdAt: "2026-10-16" };
const admin: Profile = { ...learner, role: "Super User" };
const content: UnitContent = {
  lesson: [], exercises: [], assignments: [], quiz: [],
  workbook: { title: "Learner Workbook", outcomes: [] },
};
const packKey = "itss.unitbuilder.114074.shared";
const render = (profile: Profile) => {
  const root = createRoot(fixture);
  flushSync(() => root.render(<UnitPage unitId="114074" profile={profile} progress={{ units: {} }}
    toggleActivity={() => {}} saveQuizResult={() => {}} setLogbookField={() => {}} saveExerciseResult={() => {}} navigate={() => {}} />));
  return root;
};

async function test() {
  const pack = JSON.stringify({ revision: "workbook-publish", source: "", files: {}, content });
  rememberUnitPack(packKey, pack);
  const savedAnswers = JSON.stringify({ units: { "114074": { activities: {}, logbook: { "learner-workbook.answer": "Retain my answer" } } } });
  localStorage.setItem("itss.progress.workbook-publish-test", savedAnswers);

  localStorage.setItem("itss.unittab.us", "114074");
  localStorage.setItem("itss.unittab", "workbook");
  let root = render(learner);
  await tick();
  assert(Array.from(fixture.querySelectorAll('[role="tab"]')).some(node => node.textContent?.includes("Learner Workbook")), "114074 Learner Workbook tab is available again");
  assert(fixture.querySelector(".workbook-114074"), "114074 built-in workbook still renders before a replacement is published");
  assert(!fixture.querySelector('[aria-label="Upload Learner Workbook PDF"]'), "Learners do not see the administrator upload control");
  flushSync(() => root.unmount());

  root = render(admin);
  await tick();
  if (window.innerWidth < 600) {
    assert(!fixture.querySelector('[aria-label="Upload Learner Workbook PDF"]'), "Phone view keeps its existing editor restrictions");
  } else {
    assert(fixture.querySelector('[aria-label="Upload Learner Workbook PDF"]'), "Administrators can upload a replacement workbook even when the unit already has one");
  }
  flushSync(() => root.unmount());

  const publishedContent: UnitContent = {
    ...content,
    learnerWorkbook: { title: "Published replacement", sections: [], workbookTemplateBuilt: true },
    workbook: {
      title: "Published replacement",
      outcomes: [{
        id: "uploaded-outcome",
        specificOutcome: 1,
        title: "Uploaded specific outcome",
        learningOutcomes: ["Uploaded learning outcome"],
        questions: [{ id: "uploaded-task", task: 1, text: "Uploaded task text", marks: 5 }],
      }],
    },
  };
  const publishedPack = JSON.stringify({ revision: "workbook-publish-replacement", source: "", files: {}, content: publishedContent });
  rememberUnitPack(packKey, publishedPack);
  root = render(learner);
  await tick();
  assert(fixture.querySelector(".lw-outcome-head")?.textContent?.includes("Uploaded specific outcome"), "Published workbook content replaces the unit-specific built-in workbook");
  assert(!fixture.querySelector(".workbook-114074"), "Do not render the old built-in workbook alongside the published replacement");
  flushSync(() => root.unmount());

  assert(unitPackSnapshot(packKey) === publishedPack, "Workbook publishing does not remove its saved unit content");
  assert(localStorage.getItem("itss.progress.workbook-publish-test") === savedAnswers, "Existing learner responses are retained");
  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent = "PASS: 114074 workbook tab restored; admins can upload replacements; published content takes precedence; learner progress retained.";
}

test().catch(error => {
  document.body.dataset.result = "failed";
  document.getElementById("result")!.textContent = String(error);
});
