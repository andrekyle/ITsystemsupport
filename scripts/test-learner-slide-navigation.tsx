import { createRoot } from "react-dom/client";
import { UnitPage } from "../src/pages/Course";
import { CONTENT } from "../src/data/content";

const tick = () => new Promise(resolve => setTimeout(resolve, 80));
function assert(value: unknown, message: string) { if (!value) throw new Error(message); }
function button(label: string) {
  const result = Array.from(document.querySelectorAll<HTMLButtonElement>("button"))
    .find(item => item.textContent?.trim() === label);
  assert(result, `Missing button: ${label}`);
  return result!;
}
async function test() {
  localStorage.clear();
  const quiz = [{ q: "Choose the correct option", options: ["Correct", "Incorrect"], answer: 0 }];
  CONTENT["8252"].lesson = [0, 1].map(index => ({
    heading: `Navigation fixture ${index + 1}`, paragraphs: ["Lesson content"],
    slideQuiz: quiz, quizRetries: 1,
  }));
  let credited = false;
  createRoot(document.getElementById("fixture")!).render(
    <UnitPage unitId="8252" profile={{ id: "navigation-test", name: "Test", role: "Learner" } as any}
      progress={{ units: {} }} toggleActivity={() => { credited = true; }} saveQuizResult={() => {}}
      setLogbookField={() => {}} saveExerciseResult={() => {}} navigate={() => {}} />
  );
  await tick(); button("Lesson").click(); await tick();
  const moveAndReturn = async () => {
    const next = Array.from(document.querySelectorAll<HTMLButtonElement>("button"))
      .filter(item => item.textContent?.trim() === "Next");
    assert(next.length === 2 && next.every(item => !item.disabled), "Both Next buttons enabled");
    next[1].click(); await tick();
    assert(document.querySelector(".lesson-nav-count")?.textContent?.includes("2 of 2"), "Next advances the slide");
    assert(!button("Finish lesson").disabled, "Finish lesson enabled without passing");
    button("Previous").click(); await tick();
  };
  await moveAndReturn();
  const wrong = Array.from(document.querySelectorAll<HTMLButtonElement>(".lesson-quiz-options button"))
    .find(item => item.textContent?.includes("Incorrect"))!;
  wrong.click(); await tick(); button("Check answers").click(); await tick();
  assert(document.querySelector(".lesson-quiz-attempts")?.textContent?.includes("1 of 2"), "One attempt recorded");
  await moveAndReturn();
  button("Check answers").click(); await tick();
  assert(button("Check answers").disabled, "Attempt limit enforced");
  await moveAndReturn();
  assert(button("Check answers").disabled, "Attempt limit persists after returning");
  assert(!credited, "Skipping or exhausting attempts does not award a pass");
  button("Next").click(); await tick();
  button("Finish lesson").click(); await tick();
  assert(!document.querySelector(".lesson-screen"), "Finish lesson opens exercises without passing");
  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent = "PASS: learner navigation before, during and after attempts; attempt limits persist; no false pass; finish lesson opens exercises";
}
test().catch(error => {
  document.body.dataset.result = "failed";
  document.getElementById("result")!.textContent = String(error);
});
