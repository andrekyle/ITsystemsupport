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
  const group = document.querySelector<HTMLDetailsElement>(".editing-tool-group");
  if (innerWidth <= 640) {
    assert(!group, "Desktop quiz tools stay hidden on phones");
  } else {
    assert(group && !group.open, "Quiz question tools are closed by default");
    const summary = group.querySelector("summary")!;
    const remove = summary.querySelector<HTMLButtonElement>('[aria-label="Remove question 1"]');
    assert(remove, "Delete is available in the collapsed header");
    const bounds = remove.getBoundingClientRect();
    assert(bounds.width === 28 && bounds.height === 28, "Delete is a small icon button");
    assert(summary.getBoundingClientRect().right - bounds.right <= 16, "Delete is at the far right");
    summary.click();
    assert(group.open, "Header opens quiz question tools");
    assert(group.querySelector('[aria-label="Correct answer for question 1"]'), "Correct answer control remains available");
    summary.click();
    remove.click();
    assert(!group.open, "Delete does not toggle the group");
    await tick();
    assert(!document.querySelector(".editing-tool-group"), "Delete removes the question");
  }
  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent = "PASS: collapsed quiz tools, compact right-aligned delete and question removal";
}
test().catch(error => {
  document.body.dataset.result = "failed";
  document.getElementById("result")!.textContent = String(error);
});
