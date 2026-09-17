import { createRoot } from "react-dom/client";
import { UnitPage } from "../src/pages/Course";
import "../src/styles.css";

const source = `# Estimating work

Estimating starts with understanding the scope and identifying the required deliverables. Break the work into smaller tasks before estimating the time required. Use previous experience and recorded performance to improve the accuracy of estimates.

# Resources and dependencies

Consider the availability of staff, equipment and materials when preparing an estimate. Dependencies affect the sequence of tasks and can delay the start of subsequent work. Record assumptions so that stakeholders understand the basis of the estimate.`;
const tick = () => new Promise(resolve => setTimeout(resolve, 80));
function assert(ok: unknown, message: string): asserts ok { if (!ok) throw new Error(message); }
async function waitFor(check: () => boolean, message: string) {
  for (let i = 0; i < 120; i++) {
    if (check()) return;
    await tick();
  }
  throw new Error(message);
}
function click(label: string) {
  const button = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(button => button.textContent?.trim() === label);
  assert(button, `Missing button: ${label}`);
  button.click();
}
function clickBuildToggle() {
  const button = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(button => /^(Rebuild|Build) unit standard$/.test(button.textContent?.trim() ?? ""));
  assert(button, "Missing build/rebuild button");
  button.click();
}

async function test() {
  const originalFetch = window.fetch.bind(window);
  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    if (String(input).startsWith("data:")) return new Promise(resolve => setTimeout(() => resolve(originalFetch(input, init)), 1200));
    return originalFetch(input, init);
  }) as typeof window.fetch;
  createRoot(document.getElementById("fixture")!).render(<UnitPage unitId="114059" profile={{ id: "builder-progress-test", name: "Test administrator", role: "Super User" } as any} progress={{ units: {} }} toggleActivity={() => {}} saveQuizResult={() => {}} setLogbookField={() => {}} saveExerciseResult={() => {}} navigate={() => {}} />);
  await waitFor(() => !!document.querySelector(".unit-builder"), "Unit builder appears");
  clickBuildToggle();
  await tick();
  const textarea = document.querySelector<HTMLTextAreaElement>(".unit-builder textarea")!;
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(textarea, source);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  (document.querySelector('.unit-builder input[type="checkbox"]') as HTMLInputElement).click();
  await tick();
  click("Build complete unit standard");
  const progressValues: number[] = [];
  await waitFor(() => {
    const button = document.querySelector<HTMLButtonElement>(".unit-build-action");
    const match = /Creating\s+(\d+)%/.exec(button?.textContent ?? "");
    if (match) progressValues.push(Number(match[1]));
    return progressValues.some(value => value > 1);
  }, "Build button shows animated progress above 1%");
  await waitFor(() => /Creating\s+100%/.test(document.querySelector<HTMLButtonElement>(".unit-build-action")?.textContent ?? ""), "Build button reaches 100%");
  assert(progressValues[0] === 1 || progressValues.includes(1), "Progress starts at 1%");
  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent = "PASS: Unit Builder button animates from 1 toward 100 while creating";
}

test().catch(error => {
  document.body.dataset.result = "failed";
  document.getElementById("result")!.textContent = String(error);
});
