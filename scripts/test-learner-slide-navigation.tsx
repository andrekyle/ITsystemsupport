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
    assert(next.length > 0 && next.every(item => !item.disabled), "Next buttons enabled");
    next.at(-1)!.click(); await tick();
    assert(document.querySelector(".lesson-nav-count")?.textContent?.includes("2 of 2"), "Next advances the slide");
    assert(button("Next").disabled, "Next stops at the final visible slide");
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
  const dot = document.querySelector<HTMLButtonElement>('[aria-label="Go to section 2"]');
  assert(dot && !dot.disabled, "Slide dots are available regardless of quiz results");
  dot!.click(); await tick();
  assert(document.querySelector(".lesson-nav-count")?.textContent?.includes("2 of 2"), "Slide dots advance without passing");
  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent = "PASS: learner navigation before, during and after attempts; attempt limits persist; no false pass; slide dots work without passing";
}
test().catch(error => {
  document.body.dataset.result = "failed";
  document.getElementById("result")!.textContent = String(error);
});
