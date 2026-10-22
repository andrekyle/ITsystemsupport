import { useState } from "react";
import { createRoot } from "react-dom/client";
import { EditingProvider } from "../src/components/EditingSidebar";
import { GeneratedQuizEditor } from "../src/components/GeneratedQuizEditor";
import "../src/styles.css";

function Fixture() {
  const [removed, setRemoved] = useState(false);
  const [question, setQuestion] = useState({ q: "Example question", options: ["A", "B", "C", "D"], answer: 1, explain: "" });
  return <EditingProvider>{removed ? <p>Question removed</p> :
    <GeneratedQuizEditor question={question} number={1} onChange={setQuestion} onRemove={() => setRemoved(true)} />}
  </EditingProvider>;
}
const tick = () => new Promise(resolve => setTimeout(resolve, 100));
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
async function test() {
  createRoot(document.getElementById("fixture")!).render(<Fixture />);
  await tick();
  const editor = document.querySelector<HTMLElement>(".generated-quiz-edit");
  assert(editor, "Quiz question editor is displayed inline");
  assert(!document.querySelector(".editing-tool-group"), "Question is not duplicated in editing tools");
  const answers = editor.querySelectorAll<HTMLInputElement>('input[type="radio"]');
  assert(answers.length === 4 && answers[1].checked, "Correct answer is selected beside the visible options");
  answers[2].click();
  await tick();
  assert(document.querySelectorAll<HTMLInputElement>('.generated-quiz-edit input[type="radio"]')[2].checked,
    "Correct answer can be changed directly on the question");
  const remove = editor.querySelector<HTMLButtonElement>('[aria-label="Remove question 1"]');
  assert(remove, "Delete remains available beside the displayed question");
  const bounds = remove.getBoundingClientRect();
  assert(bounds.width === 28 && bounds.height === 28, "Delete remains a small icon button");
  remove.click();
  await tick();
  assert(!document.querySelector(".generated-quiz-edit"), "Delete removes the question");
  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent = "PASS: correct answer selection is inline with no duplicated sidebar question";
}
test().catch(error => {
  document.body.dataset.result = "failed";
  document.getElementById("result")!.textContent = String(error);
});
