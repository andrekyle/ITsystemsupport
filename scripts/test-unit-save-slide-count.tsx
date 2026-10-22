import { createRoot } from "react-dom/client";
import { UnitBuilder, effectiveBuiltContent } from "../src/components/UnitBuilder";
import { readBuiltUnit } from "../src/lib/builtUnits";
import { persistUnitPack, rememberUnitPack } from "../src/lib/unitStorage";
import { receiveLessonEdits } from "../src/lib/lessonEditStore";
import type { UnitContent } from "../src/types";

const tick = () => new Promise(resolve => setTimeout(resolve, 80));
function assert(value: unknown, message: string) { if (!value) throw new Error(message); }
async function test() {
  localStorage.clear();
  const content: UnitContent = { lesson: Array.from({ length: 33 }, (_, i) => ({ heading: `Slide ${i + 1}`, paragraphs: [`Content for slide ${i + 1}.`] })), exercises: [], assignments: [], quiz: [] };
  const edits = { deletedSections: [1, 3, 5, 7, 9], videos: { 32: ["https://example.test/last-slide-video"] } };
  const key = "itss.unitbuilder.114074.shared";
  const value = JSON.stringify({ revision: "save-count", content, files: {}, source: "Fixture source", createdAt: new Date().toISOString() });
  await persistUnitPack(key, value); rememberUnitPack(key, value);
  receiveLessonEdits("itss.lessonedits.114074.built-save-count", JSON.stringify(edits));
  let saves = 0;
  const root = createRoot(document.getElementById("fixture")!);
  root.render(<UnitBuilder unit={{ us: "114074", title: "Networking", nqf: 5, credits: 5, dates: "", time: "" }} content={content} edits={edits}
    profileId="count-test" onSaved={() => { saves++; }} onCancelInline={() => {}} />);
  await tick(); await tick();
  for (let attempt = 1; attempt <= 3; attempt++) {
    const save = document.querySelector<HTMLButtonElement>('[aria-label="Save changes without rebuilding files"]');
    assert(save && !save.disabled, "Structured editor exposes the save action");
    save!.click();
    for (let i = 0; i < 100 && saves < attempt; i++) await tick();
    assert(saves === attempt, `Save ${attempt} completes`);
    const saved = readBuiltUnit("114074")!;
    assert(saved.content.lesson.length === 33, "Saved content retains original slide indices");
    const savedEdits = JSON.parse(localStorage.getItem(`itss.lessonedits.114074.built-${saved.revision}`)!);
    const visible = effectiveBuiltContent(saved.content, savedEdits);
    assert(visible.lesson.length === 28, "Repeated saves hide each deleted slide only once");
    assert(visible.lesson.at(-1)?.heading === "Slide 33" && savedEdits.videos[32][0].includes("last-slide-video"), "Remaining content and video positions are preserved");
    await tick();
  }
  root.unmount();
  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent = "PASS: three real editor saves retain all 33 stored slides, exactly 28 visible slides, and the final slide/video";
}
test().catch(error => { document.body.dataset.result = "failed"; document.getElementById("result")!.textContent = String(error); });
