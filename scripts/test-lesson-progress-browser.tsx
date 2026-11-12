import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { useState } from "react";
import { UnitPage } from "../src/pages/Course";
import { buildUnitContent } from "../src/lib/unitBuilder";
import { rememberUnitPack } from "../src/lib/unitStorage";
import { receiveLessonEdits } from "../src/lib/lessonEditStore";
import type { Profile, ProgressState, QuizQuestion } from "../src/types";

const first: QuizQuestion = { q: "Choose Beta", options: ["Alpha", "Beta"], answer: 1, explain: "Try again." };
const extra: QuizQuestion = { q: "Choose One", options: ["One", "Two"], answer: 0, explain: "Try again." };
let root = createRoot(document.getElementById("fixture")!);
const tick = () => new Promise(resolve => setTimeout(resolve, 40));
const profile: Profile = { id: "lesson-retention-a", name: "Test learner", role: "Learner", createdAt: "" };
let activeUnit = "114050";
let activeProfile = profile;
let progressSnapshot: ProgressState = { units: {} };
const writes: { key: string; value: string }[] = [];

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
async function waitFor(check: () => boolean, message: string) {
  for (let i = 0; i < 120; i++) {
    if (check()) return;
    await tick();
  }
  throw new Error(message);
}
function click(label: string) {
  const button = [...document.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent?.trim() === label);
  assert(button, `Missing ${label}`);
  flushSync(() => button.click());
}
function quizKey(unit = activeUnit, id = activeProfile.id) {
  return `itss.lessonquiz.${id}.${unit}`;
}
function saved(unit = activeUnit, id = activeProfile.id) {
  return JSON.parse(localStorage.getItem(quizKey(unit, id))!);
}
function Harness() {
  const [progress, setProgress] = useState<ProgressState>({ units: {
    "114050": { activities: { "Lesson & Training Aids": true }, logbook: { written: "Keep my workbook answer" } },
    "114051": { activities: {} },
  } });
  progressSnapshot = progress;
  return <UnitPage unitId={activeUnit} profile={activeProfile} progress={progress}
    toggleActivity={(us, activity) => setProgress(previous => ({
      ...previous, units: { ...previous.units, [us]: {
        ...previous.units[us], activities: { ...previous.units[us]?.activities, [activity]: !previous.units[us]?.activities[activity] },
      } },
    }))}
    setLogbookField={(us, key, value) => setProgress(previous => ({
      ...previous, units: { ...previous.units, [us]: {
        ...previous.units[us], logbook: { ...previous.units[us]?.logbook, [key]: value },
      } },
    }))}
    setLogbookFields={() => {}} saveQuizResult={() => {}} saveExerciseResult={() => {}} navigate={() => {}} />;
}
function mount() { flushSync(() => root.render(<Harness />)); }

async function test() {
  const setter = localStorage.setItem.bind(localStorage);
  localStorage.setItem = (key, value) => { writes.push({ key, value }); setter(key, value); };
  for (const us of ["114050", "114051"]) {
    const source = "Identify the main task and gather all required information before starting. Check the facts and record the results.";
    const content = buildUnitContent({ us, title: "Test lesson", nqf: 5, credits: 5, dates: "", time: "" }, source, { questions: 3, minutes: 60 });
    content.lesson = [{ heading: `Slide ${us}`, icon: "book", paragraphs: [source], ...(us === "114050" ? { slideQuiz: [first] } : {}) }];
    const file = { name: "Fixture", type: "application/pdf", size: 0, uploadedAt: "2026-11-12" };
    rememberUnitPack(`itss.unitbuilder.${us}.shared`, JSON.stringify({
      revision: "retention-fixture", source, files: { pdf: file, pptx: file, answers: file }, content,
    }));
  }
  setter(quizKey(), JSON.stringify({ answers: { 0: [1] }, checked: { 0: true }, attempts: { 0: 2 } }));
  const secondProfile = { ...profile, id: "lesson-retention-b" };
  const secondKey = quizKey("114051", secondProfile.id);
  setter(secondKey, JSON.stringify({ answers: { 0: [0] }, checked: { 0: false }, attempts: { 0: 1 } }));
  const firstEditsKey = "itss.lessonedits.114050.built-retention-fixture";
  receiveLessonEdits("itss.lessonedits.114051.built-retention-fixture", JSON.stringify({ generatedQuizzes: { 0: [first] } }));
  mount();
  await waitFor(() => !!saved()?.identities, "Legacy quiz did not migrate");
  assert(Object.keys(saved().identities.picks).some(key => key.includes("Choose Beta")), "Migration uses the original quiz definition");
  click("Lesson");
  await waitFor(() => !!document.querySelector(".lesson-slide-quiz"), "Lesson quiz did not render");
  assert(saved().answers[0][0] === 1, "Existing answer remains selected");
  flushSync(() => receiveLessonEdits(firstEditsKey, JSON.stringify({ generatedQuizzes: { 0: [extra, first] } })));
  await waitFor(() => saved().answers[0].length === 2, "Generated quiz addition did not reconcile");
  assert(saved().answers[0][0] === -1 && saved().answers[0][1] === 1, `Adding a quiz question preserves the old answer at its new position: ${JSON.stringify(saved())}`);
  assert(progressSnapshot.units["114050"].logbook?.written === "Keep my workbook answer", "Quiz edits must not change written work");
  assert(progressSnapshot.units["114050"].activities["Lesson & Training Aids"] === true, "Adding questions must not revoke completed activities");

  writes.length = 0;
  activeUnit = "114051";
  activeProfile = secondProfile;
  mount();
  await tick();
  const secondWrites = writes.filter(write => write.key === secondKey);
  assert(secondWrites.length > 0 && secondWrites.every(write => JSON.parse(write.value).answers[0]?.[0] === 0), "Unit/profile navigation must never write the previous learner's quiz into the new record");
  assert(saved("114050", profile.id).answers[0][1] === 1, "The original learner's quiz remains saved");
  assert(!progressSnapshot.units["114051"].activities["Lesson & Training Aids"], "Generated quizzes must gate automatic training credit");
  click("Lesson");
  await waitFor(() => document.querySelectorAll(".lesson-quiz-options button").length === 2, "Second learner quiz did not render");
  const correctOption = [...document.querySelectorAll<HTMLButtonElement>(".lesson-quiz-options button")]
    .find(button => button.textContent?.includes("Beta"));
  assert(correctOption, "The correct option is displayed");
  flushSync(() => correctOption.click());
  await waitFor(() => progressSnapshot.units["114051"].logbook?.["slidegate.0"] === true, "Passed generated quiz did not receive slide credit");
  assert(progressSnapshot.units["114051"].activities["Lesson & Training Aids"] === true, "Passed generated quiz receives training credit");
  assert(saved().answers[0][0] === 1, "The new learner's own answer is saved");
  flushSync(() => root.unmount());
  root = createRoot(document.getElementById("fixture")!);
  mount();
  click("Lesson");
  await waitFor(() => [...document.querySelectorAll(".lesson-quiz-options button")]
    .some(button => button.classList.contains("selected") && button.textContent?.includes("Beta")), "Quiz selection did not restore after remount");
  if (innerWidth > 600) {
    activeProfile = { ...activeProfile, role: "Super User" };
    mount();
    click("Edit slide text");
    const editor = document.querySelector<HTMLElement>(".slide-whole-editor")!;
    assert(editor.isContentEditable, "Staff can still edit slide text");
    assert(!document.querySelector(".save-cloud-action") &&
      ![...document.querySelectorAll("button")].some(button => button.textContent?.trim() === "Save to cloud"),
    "The separate Save to cloud button is removed");
    editor.focus();
    flushSync(() => {
      editor.innerHTML += "<p>Slide changes save without a save button.</p>";
      editor.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const editsKey = "itss.lessonedits.114051.built-retention-fixture";
    await waitFor(() => !!localStorage.getItem(editsKey)?.includes("Slide changes save without a save button."),
      "Slide edits must autosave without the removed button");
    const setter = localStorage.setItem;
    localStorage.setItem = (key, value) => {
      if (key === editsKey) throw new DOMException("Slide save blocked", "QuotaExceededError");
      setter(key, value);
    };
    try {
      click("Done editing slide");
      await waitFor(() => [...document.querySelectorAll('[role="alert"]')]
        .some(alert => alert.textContent?.includes("Slide save blocked")), "A failed finish-editing save must show its error");
      assert(editor.isContentEditable, "A failed save must keep slide editing open");
    } finally { localStorage.setItem = setter; }
    click("Done editing slide");
    await waitFor(() => !document.querySelector<HTMLElement>(".slide-whole-editor")?.isContentEditable,
      "Finishing slide editing must flush pending changes and close the editor");
    assert(localStorage.getItem(editsKey)?.includes("Slide changes save without a save button."),
      "Finishing editing retains the saved slide text");
  }
  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent = "PASS: lesson quiz retention, learner isolation, generated credit, restoration, removed save button and automatic slide saving";
}
test().catch(error => {
  document.body.dataset.result = "failed";
  document.getElementById("result")!.textContent = String(error);
});
