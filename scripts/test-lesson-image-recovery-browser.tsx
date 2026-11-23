import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { UnitPage } from "../src/pages/Course";
import { courseScopedUnit } from "../src/lib/courseScope";
import { rememberUnitPack } from "../src/lib/unitStorage";
import type { Profile, UnitContent } from "../src/types";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

const fixture = document.getElementById("fixture")!;
const profile: Profile = {
  id: "lesson-image-recovery-test",
  name: "Test learner",
  role: "Learner",
  createdAt: "2026-11-23",
};
const unitId = "114058";
const content: UnitContent = {
  lesson: [{
    heading: "Operating systems",
    paragraphs: ["Image loading recovery test."],
    figures: [{ id: "broken-os-comparison", caption: "Operating Systems_ A Visual Comparison" }],
  }],
  exercises: [],
  assignments: [],
  quiz: [],
};

async function test() {
  rememberUnitPack(`itss.unitbuilder.${unitId}.shared`, JSON.stringify({
    revision: "lesson-image-recovery",
    source: "",
    files: {},
    content,
  }));
  localStorage.setItem(`itss.lessonfigs.${courseScopedUnit(unitId)}`, JSON.stringify({
    "broken-os-comparison": { image: "/missing-operating-systems-image.png", uploadedAt: "2026-11-23" },
  }));
  localStorage.setItem("itss.unittab.us", unitId);
  localStorage.setItem("itss.unittab", "lesson");

  const root = createRoot(fixture);
  flushSync(() => root.render(<UnitPage unitId={unitId} profile={profile} progress={{ units: {} }}
    toggleActivity={() => {}} saveQuizResult={() => {}} setLogbookField={() => {}} saveExerciseResult={() => {}} navigate={() => {}} />));
  try {
    for (let attempt = 0; attempt < 50 && !fixture.querySelector('[role="alert"]')?.textContent?.includes("lesson image"); attempt++) {
      await new Promise(resolve => setTimeout(resolve, 40));
    }
    const images = Array.from(fixture.querySelectorAll("img")).filter(image => image.alt === "Operating Systems_ A Visual Comparison");
    assert(images.length > 0, `The lesson figure is rendered. Current view: ${fixture.textContent?.slice(0, 500)}`);
    assert(images.every(image => image.hidden), "Failed images are hidden instead of displaying broken-image icons and alt text.");
    assert(fixture.querySelector('[role="alert"]')?.textContent?.includes("lesson image"), "The learner receives a clear image load error.");
    document.body.dataset.result = "passed";
    document.getElementById("result")!.textContent = "PASS: failed lesson images are hidden and reported instead of showing broken-image icons.";
  } finally {
    flushSync(() => root.unmount());
  }
}

test().catch(error => {
  document.body.dataset.result = "failed";
  document.getElementById("result")!.textContent = error instanceof Error ? error.message : String(error);
});
