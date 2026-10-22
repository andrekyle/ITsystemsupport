import { createRoot, type Root } from "react-dom/client";
import { flushSync } from "react-dom";
import { UnitPage } from "../src/pages/Course";
import { effectiveBuiltContent } from "../src/components/UnitBuilder";
import { rememberUnitPack } from "../src/lib/unitStorage";
import { cachedLessonEdits, receiveLessonEdits } from "../src/lib/lessonEditStore";
import { readBuiltUnit } from "../src/lib/builtUnits";
import { saveInlineDraft } from "../src/lib/inlineDraftStorage";
import type { LessonEdits } from "../src/store";
import type { Profile, UnitContent } from "../src/types";
import "../src/styles.css";

const tick = () => new Promise(resolve => setTimeout(resolve, 80));
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
const content: UnitContent = {
  lesson: ["First", "Middle", "Last"].map(heading => ({ heading, paragraphs: [`${heading} slide content`] })),
  exercises: [], assignments: [], quiz: [],
};
const fixture = document.getElementById("fixture")!;
let root: Root | undefined;
const profile: Profile = { id: "slide-deletion", name: "Editor", role: "Super User", createdAt: "2026-10-16" };
const key = "itss.lessonedits.114059.built-slide-deletion";
const initialEdits: LessonEdits = { paragraphs: { "2:0": "Last slide edited content" }, videos: { 1: ["https://youtu.be/deletedvideo"], 2: ["https://youtu.be/retainedvideo"] } };
function button(text: string, scope: ParentNode = document): HTMLButtonElement {
  const node = Array.from(scope.querySelectorAll<HTMLButtonElement>("button")).find(node => node.textContent?.trim() === text);
  assert(node, `Missing button: ${text}`);
  return node;
}
async function mount(role: Profile["role"] = "Super User") {
  if (root) flushSync(() => root!.unmount());
  root = createRoot(fixture);
  flushSync(() => root!.render(<UnitPage unitId="114059" profile={{ ...profile, role }} progress={{ units: {} }}
    toggleActivity={() => {}} saveQuizResult={() => {}} setLogbookField={() => {}} saveExerciseResult={() => {}} navigate={() => {}} />));
  await tick();
  button("Lesson").click();
  await tick();
}
async function confirmDelete() {
  button("Delete slide").click();
  await tick();
  const modal = document.querySelector('[role="dialog"]')!;
  assert(modal, "Slide deletion requires confirmation");
  button("Delete slide", modal).click();
  await tick();
}
async function test() {
  rememberUnitPack("itss.unitbuilder.114059.shared", JSON.stringify({
    revision: "slide-deletion", source: "", files: {}, content,
  }));
  receiveLessonEdits(key, JSON.stringify(initialEdits));
  await mount();
  if (innerWidth < 600) {
    assert(!Array.from(document.querySelectorAll("button")).some(node => node.textContent?.trim() === "Delete slide"), "Phone slides remain read-only");
    document.body.dataset.result = "passed";
    document.getElementById("result")!.textContent = "PASS: phone lesson editing remains disabled.";
    return;
  }
  assert(document.querySelector(".lesson-stepper-top")?.contains(button("Delete slide")), "Delete slide is inline beside lesson navigation, without opening the editing sidebar");
  document.querySelector<HTMLButtonElement>('[aria-label="Go to section 2"]')!.click();
  await tick();
  button("Delete slide").click(); await tick();
  button("Cancel", document.querySelector('[role="dialog"]')!).click(); await tick();
  assert(document.querySelector(".lesson-section")?.textContent?.includes("Middle slide content"), "Cancelling leaves the slide intact");
  const setItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(storageKey, value) {
    if (storageKey === key) throw new Error("Simulated save failure");
    return setItem.call(this, storageKey, value);
  };
  try { await confirmDelete(); }
  finally { Storage.prototype.setItem = setItem; }
  assert(document.querySelector('[role="alert"]')?.textContent?.includes("Simulated save failure"), "A failed deletion save is explicitly reported");
  assert(document.querySelector(".lesson-section")?.textContent?.includes("Middle slide content"), "Failed deletion restores the slide");
  await confirmDelete();
  assert(document.querySelector(".lesson-section")?.textContent?.includes("Last slide edited content"), "Deleting a middle slide selects the next and preserves its indexed edits");
  assert(document.querySelector(".lesson-nav-count")?.textContent?.trim() === "Slide 2 of 2", "Slide count is updated without index gaps");
  assert(document.querySelectorAll(".lesson-dot").length === 2, "Deleted slide has no navigation dot");
  assert(cachedLessonEdits<LessonEdits>(key, {}).videos?.[2]?.[0]?.includes("retainedvideo"), "Other slide videos remain attached to their source index");
  const exported = effectiveBuiltContent(content, cachedLessonEdits<LessonEdits>(key, {}));
  assert(exported.lesson.length === 2 && exported.lesson[1].paragraphs[0] === "Last slide edited content", "Updated exports omit the deleted slide after applying original indexed edits");
  const draftContent = effectiveBuiltContent(content, cachedLessonEdits<LessonEdits>(key, {}), true);
  assert(draftContent.lesson.length === 3 && effectiveBuiltContent(draftContent, cachedLessonEdits<LessonEdits>(key, {})).lesson.length === 2, "Draft publishing retains original indices internally, without removing the wrong slide when copied edits load");
  assert(JSON.parse(localStorage.getItem(key)!).deletedSections.includes(1), "Deletion is persisted through existing lesson edit storage");
  await mount("Learner");
  assert(!Array.from(document.querySelectorAll("button")).some(node => node.textContent?.trim() === "Delete slide"), "Learners cannot delete slides");
  assert(document.querySelectorAll(".lesson-dot").length === 2, "Saved deletion survives remount and applies to learner view");
  await mount();
  await confirmDelete();
  assert(document.querySelector(".lesson-nav-count")?.textContent?.trim() === "Slide 1 of 1", "Deleting the last slide selects the preceding slide");
  await confirmDelete();
  assert(document.body.textContent?.includes("No slides remain in this lesson."), "Deleting the final slide has an explicit empty state");
  await mount();
  assert(document.body.textContent?.includes("No slides remain in this lesson."), "An empty lesson stays empty after remount");
  assert(effectiveBuiltContent(content, cachedLessonEdits<LessonEdits>(key, {})).lesson.length === 0, "All deleted slides are absent from updated exports");
  saveInlineDraft(profile.id, "114059", content);
  await mount();
  await confirmDelete(); await confirmDelete(); await confirmDelete();
  assert(document.body.textContent?.includes("No slides remain in this lesson."), "Draft slides can all be removed");
  assert(button("Save inline changes and update files") && button("Cancel inline changes"), "An empty inline draft retains its publish and cancel controls");
  button("Cancel inline changes").click(); await tick();
  rememberUnitPack("itss.unitbuilder.114059.shared", JSON.stringify({
    revision: "slide-split", source: "", files: {}, content,
  }));
  const splitKey = "itss.lessonedits.114059.built-slide-split";
  receiveLessonEdits(splitKey, JSON.stringify({ ...initialEdits, deletedSections: [1] }));
  await mount();
  document.querySelector<HTMLButtonElement>('[aria-label="Go to section 1"]')!.click();
  await tick();
  button("Edit slide").click(); await tick();
  button("Edit slide text").click(); await tick();
  const editor = document.querySelector<HTMLElement>(".slide-whole-editor")!;
  editor.focus();
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
  let text: Text | undefined;
  while (walker.nextNode()) if (walker.currentNode.textContent === "First slide content") text = walker.currentNode as Text;
  assert(text, "Split fixture has editable paragraph text");
  const range = document.createRange();
  range.setStart(text, 5); range.collapse(true);
  window.getSelection()!.removeAllRanges(); window.getSelection()!.addRange(range);
  button("Split slide at cursor").click();
  for (let i = 0; i < 40 && readBuiltUnit("114059")?.revision === "slide-split"; i++) await tick();
  await tick();
  const split = readBuiltUnit("114059")!;
  assert(split.revision !== "slide-split", "Split publishes a new revision atomically after saving reindexed edits");
  const splitEdits = cachedLessonEdits<LessonEdits>(`itss.lessonedits.114059.built-${split.revision}`, {});
  assert(splitEdits.deletedSections?.includes(2) && !splitEdits.deletedSections.includes(1), "Splitting a preceding slide never resurrects a deleted slide or hides its continuation");
  assert(splitEdits.paragraphs?.["3:0"] === "Last slide edited content" && splitEdits.videos?.[3]?.[0].includes("retainedvideo"), "Split preserves the remaining indexed content and videos");
  assert(document.querySelectorAll(".lesson-dot").length === 3, "Split adds only the continuation to visible navigation");
  assert(cachedLessonEdits<LessonEdits>(splitKey, {}).deletedSections?.[0] === 1, "The old revision's deletion state is unchanged");
  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent = "PASS: inline deletion, confirmation/cancellation, save failures, persistence, permissions, stable edits/videos, navigation, export/draft filtering, final-slide empty state and split-after-delete.";
}
test().catch(error => {
  document.body.dataset.result = "failed";
  document.getElementById("result")!.textContent = String(error);
});
