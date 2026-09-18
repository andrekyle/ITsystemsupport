import { useState } from "react";
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
  const button = [...document.querySelectorAll<HTMLButtonElement>("button")].find(b => b.textContent?.trim() === text);
  assert(button, `Missing button: ${text}; buttons: ${[...document.querySelectorAll("button")].map(b=>b.textContent).join(" | ")}`); button!.click();
}
async function type(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  Object.getOwnPropertyDescriptor(element instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype, "value")!.set!.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true })); await tick();
}
const check = { answer: ["Listening — Pay attention to other people's ideas and ask questions to clarify what they mean.", "Respect — Treat colleagues fairly and consider different views when making team decisions."], concepts: [["listening"], ["respect"]], labels: ["Listening", "Respect"] };
let failGeneration = true, failMarking = true, markingCalls = 0;
const scores: number[] = [];
globalThis.fetch = async (url, init) => {
  if (String(url) === "/api/generate-activity-answers") {
    const payload = JSON.parse(String(init?.body));
    assert(payload.questions[0] === "Explain effective teamwork.", "The entered question reaches generation");
    assert(!payload.checks, "Author does not provide model answers");
    return failGeneration ? Response.json({ error: "Generation unavailable" }, { status: 503 }) : Response.json({ checks: [check], task: "Time: 10 minutes - Activity: Self & Group" });
  }
  if (String(url) === "/api/mark-answer") {
    markingCalls++;
    const payload = JSON.parse(String(init?.body));
    assert(payload.concepts.length === 2, "AI receives the complete answer key");
    assert(payload.answer.includes("colleagues"), "AI receives typed answers without requiring blur");
    return Response.json(failMarking ? { error: "timeout", credited: [] } : { credited: ["c0"], reason: "Listening is explained; respect needs more detail." });
  }
  return Response.json({});
};
function Fixture() {
  const [progress, setProgress] = useState<any>({ units: {} });
  return <UnitPage unitId="114059" profile={{ id: "activity-test", name: "Test", role: "Super User" } as any} progress={progress} toggleActivity={() => {}} saveQuizResult={() => {}} navigate={() => {}}
    setLogbookField={(us, key, value) => setProgress((p: any) => ({ ...p, units: { ...p.units, [us]: { activities: {}, ...p.units[us], logbook: { ...p.units[us]?.logbook, [key]: value } } } }))}
    saveExerciseResult={(_us, _id, score) => { scores.push(score); }} />;
}
async function test() {
  const source = "# Teamwork\n\nEffective teamwork involves listening carefully to colleagues and respecting their contributions. Ask questions to clarify ideas and resolve disagreements fairly. Share responsibilities and communicate progress so the team can complete its tasks successfully.";
  const content = buildUnitContent({ us: "114059", title: "Teamwork", nqf: 5, credits: 5, dates: "", time: "" }, source, { questions: 5, minutes: 60 });
  content.exercises = []; content.questionSessions = [];
  const file = { name: "test", type: "text/plain", size: 0, data: "data:text/plain,test", uploadedAt: new Date().toISOString() };
  receiveUnitPack(builtUnitKey("114059"), JSON.stringify({ revision: "test", source, content, files: { pdf: file, pptx: file, answers: file }, createdAt: new Date().toISOString(), aiUsed: false }));
  createRoot(document.getElementById("fixture")!).render(<Fixture />);
  await waitFor(() => !!document.querySelector('[role="tab"]'));
  click("Activity"); await tick(); click("Add activity"); await tick();
  assert(!document.querySelector(".activity-editor-card")!.textContent!.includes("Concepts"), "Editor hides answer-key internals");
  await type(document.querySelector<HTMLInputElement>(".activity-editor-card input")!, "Teamwork questions");
  await type(document.querySelectorAll<HTMLTextAreaElement>(".activity-editor-card textarea")[1], "Explain effective teamwork.");
  click("Save activity"); await waitFor(() => document.body.textContent!.includes("Generation unavailable"));
  assert(readBuiltUnit("114059")!.content.exercises.length === 0, "Generation failure does not save incomplete activity");
  failGeneration = false; click("Save activity");
  await waitFor(() => !document.querySelector(".activity-editor-card"));
  assert(document.querySelectorAll(".exq-part-input").length === 2, "One learner box per generated key idea");
  const boxes = document.querySelectorAll<HTMLTextAreaElement>(".exq-part-input");
  await type(boxes[0], "I listen carefully to my colleagues and ask questions to clarify their suggestions.");
  await type(boxes[1], "This answer does not explain the second point clearly enough to earn marks.");
  click("Submit answers for marking");
  await waitFor(() => document.body.textContent!.includes("No attempt was used"));
  assert(scores.length === 0, "Failed AI marking does not record an attempt");
  failMarking = false; click("Submit answers for marking");
  await waitFor(() => scores.length === 1);
  assert(scores[0] === 2 && markingCalls === 2, "Submission records the AI score and retries failed marking");
  document.getElementById("result")!.textContent = "PASS: question-only authoring, generation failure, answer boxes, typed input, AI score, failed marking retry";
  document.body.dataset.result = "passed";
}
test().catch(error => { document.getElementById("result")!.textContent = String(error.stack ?? error) + "\n" + runtimeErrors.join("\n"); document.body.dataset.result = "failed"; });
