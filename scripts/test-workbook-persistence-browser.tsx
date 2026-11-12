import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { WorkbookTaskAnswer } from "../src/components/WorkbookTaskAnswer";
import { Workbook114074 } from "../src/components/Workbook114074";
import { WORKBOOK_114074 } from "../src/data/workbook114074";
import { flushProgress, loadProgress, useProgress } from "../src/store";
import { installSync } from "../src/lib/sync";
import { persistUnitPack, storedUnitPacks } from "../src/lib/unitStorage";
import type { Profile } from "../src/types";

const profile: Profile = { id: "workbook-persistence", name: "Test learner", role: "Learner", createdAt: "2026-11-12" };
const key = `itss.progress.${profile.id}`;
const fixture = document.getElementById("fixture")!;
const root = createRoot(fixture);
const task = { id: "draft", task: 1, text: "Describe your understanding.", marks: 5, modelAnswer: "Staff only" };
const memo = { id: "outcome", question: task.text, maxMarks: 5, tasks: [task], criteria: [{ id: "criterion", taskId: task.id, text: "Assessment criterion", marks: 5 }] };
const outcome = WORKBOOK_114074.outcomes[0];
const activityKey = `built-workbook.${outcome.id}.${outcome.questions[0].id}`;
const latestText = "My latest answer, edited while marking.";
const tick = () => new Promise(resolve => setTimeout(resolve, 30));
let progress: ReturnType<typeof useProgress>;
let view: "activity" | "task" = "activity";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
async function waitFor(check: () => boolean, message: string) {
  for (let attempt = 0; attempt < 150; attempt++) {
    if (check()) return;
    await tick();
  }
  throw new Error(message);
}
function Harness() {
  progress = useProgress(profile.id);
  if (!progress.ready) return <p role={progress.loadError ? "alert" : "status"}>{progress.loadError || "Loading"}</p>;
  const values = progress.state.units["114074"]?.logbook ?? {};
  const onChange = (field: string, value: string | boolean) => progress.setLogbookField("114074", field, value);
  return view === "activity"
    ? <Workbook114074 profile={profile} values={values} memoItems={[]} onChange={onChange} onSave={() => flushProgress(profile.id)} />
    : <WorkbookTaskAnswer profile={profile} outcomeId="outcome" task={task} memoItem={memo} values={values} valueKey="draft" markKey="draft-mark" onChange={onChange} />;
}
function mount() {
  flushSync(() => root.render(<Harness />));
}
function input(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  flushSync(() => {
    Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
function saved(field: string) {
  return loadProgress(profile.id).units["114074"]?.logbook?.[field];
}

async function test() {
  installSync();
  if (location.search === "?restore") {
    mount();
    await waitFor(() => progress.ready, "Saved progress did not hydrate after reload");
    assert(saved(activityKey) === "Activity saved without clicking away", "Activity answer survives a fresh page context");
    assert(saved("built-workbook.source.cover-name") === "Updated learner name", "Cover field survives a fresh page context");
    assert(saved("draft") === latestText, "Latest answer survives a fresh page context");
    assert(saved("unrelated") === "Keep this existing work", "Unrelated work survives");
    assert(loadProgress(profile.id).units["114076"].logbook?.original === "Another unit's answer", "Other units survive");
    document.body.dataset.result = "passed";
    document.getElementById("result")!.textContent = "Restored saved work from IndexedDB.";
    return;
  }

  await persistUnitPack(key, JSON.stringify({ units: {
    "114074": { activities: {}, logbook: { [activityKey]: "Existing activity answer", unrelated: "Keep this existing work" } },
    "114076": { activities: {}, logbook: { original: "Another unit's answer" } },
  } }));
  mount();
  assert(!progress.ready, "Editing waits for IndexedDB hydration");
  let blocked = false;
  try { progress.setLogbookField("114074", "premature", "Must not replace saved work"); }
  catch (error) { blocked = /still loading/.test(String(error)); }
  assert(blocked, "Writes during hydration are blocked explicitly");
  await waitFor(() => progress.ready, "Saved progress did not finish loading");
  assert(!fixture.querySelector('.document-actions [aria-label^="Save "]'), "Workbook autosaving does not require a save button");
  const activity = fixture.querySelector<HTMLTextAreaElement>('[data-primary-activity="1"]')!;
  assert(activity.value === "Existing activity answer", "Existing work is restored before editing");
  input(activity, "Activity saved without clicking away");
  assert(saved(activityKey) === "Activity saved without clicking away", "Activity autosaves without blur");
  input(fixture.querySelector<HTMLInputElement>('input[aria-label="Name"]')!, "Updated learner name");
  assert(saved("built-workbook.source.cover-name") === "Updated learner name", "Cover autosaves without blur");
  assert(saved("unrelated") === "Keep this existing work", "Typing preserves unrelated fields");

  view = "task";
  mount();
  let area = fixture.querySelector<HTMLTextAreaElement>("textarea")!;
  const setter = localStorage.setItem;
  localStorage.setItem = () => { throw new DOMException("Storage full", "QuotaExceededError"); };
  try {
    input(area, "Unsaved draft kept in the editor");
    assert(area.value === "Unsaved draft kept in the editor", "Failed save retains the typed draft");
    assert(fixture.querySelector('[role="alert"]')?.textContent?.includes("could not be saved"), "Save failure is explicit");
  } finally { localStorage.setItem = setter; }
  flushSync(() => progress.setLogbookField("114074", "draft", "An older background snapshot"));
  await tick();
  assert(area.value === "Unsaved draft kept in the editor", "Background hydration cannot replace a draft after a failed save");
  flushSync(() => area.dispatchEvent(new FocusEvent("focusout", { bubbles: true })));
  assert(saved("draft") === "Unsaved draft kept in the editor", "Draft can be saved after storage recovers");

  const fetch = window.fetch;
  let finish: ((response: Response) => void) | undefined;
  window.fetch = () => new Promise<Response>(resolve => { finish = resolve; });
  try {
    flushSync(() => fixture.querySelector<HTMLButtonElement>(".workbook-task-mark")!.click());
    assert(finish, "Marking request started");
    area = fixture.querySelector<HTMLTextAreaElement>("textarea")!;
    input(area, latestText);
    finish(Response.json({ results: [{ id: "outcome", awarded: 2, maxMarks: 5, feedback: "An older mark" }] }));
    await waitFor(() => !!fixture.querySelector('[role="alert"]')?.textContent?.includes("latest work has been kept"), "Stale marking result was not rejected");
    assert(saved("draft") === latestText, "An older marking response cannot overwrite newer text");
    assert(!saved("draft-mark"), "An older mark is not applied to the newer answer");
    assert(fixture.querySelector<HTMLTextAreaElement>("textarea")?.value === latestText, "The latest draft remains editable");
  } finally { window.fetch = fetch; }

  await flushProgress(profile.id);
  const durable = (await storedUnitPacks()).find(([storedKey]) => storedKey === key)?.[1];
  assert(durable?.includes(latestText), "Latest text is durably committed to IndexedDB");
  flushSync(() => root.unmount());
  const reload = document.createElement("iframe");
  reload.src = `${location.href}?restore`;
  document.body.append(reload);
  await waitFor(() => !!reload.contentDocument?.body.dataset.result, "Fresh page did not complete restoration");
  assert(reload.contentDocument?.body.dataset.result === "passed", reload.contentDocument?.getElementById("result")?.textContent || "Reload lost saved work");
  reload.remove();
  const damagedKey = "itss.progress.damaged-workbook-test";
  await persistUnitPack(damagedKey, "unreadable saved progress");
  let damagedProgress: ReturnType<typeof useProgress>;
  function DamagedHarness() {
    damagedProgress = useProgress("damaged-workbook-test");
    return <p role="alert">{damagedProgress.loadError}</p>;
  }
  const damagedRoot = createRoot(fixture);
  flushSync(() => damagedRoot.render(<DamagedHarness />));
  await waitFor(() => !!damagedProgress.loadError, "Unreadable progress must produce an explicit load error");
  assert(!damagedProgress.ready, "Unreadable progress cannot enable editing of an empty replacement");
  assert((await storedUnitPacks()).find(([storedKey]) => storedKey === damagedKey)?.[1] === "unreadable saved progress", "Unreadable original data is retained for recovery");
  flushSync(() => damagedRoot.unmount());
  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent = "PASS: hydration guards, per-keystroke activity/cover saving, storage failure recovery, stale marking protection, durable reload, preservation of other fields/units and unreadable-data protection.";
}

test().catch(error => {
  document.body.dataset.result = "failed";
  document.getElementById("result")!.textContent = error instanceof Error ? error.stack || error.message : String(error);
});
