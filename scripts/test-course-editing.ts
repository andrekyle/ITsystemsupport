import assert from "node:assert/strict";

const storage = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
  get length() { return storage.size; }, key: (i: number) => [...storage.keys()][i] ?? null,
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
} });
Object.defineProperty(globalThis, "window", { configurable: true, value: new EventTarget() });
const { builtUnitKey, readBuiltUnit } = await import("../src/lib/builtUnits");
const { rememberUnitPack, isUnitPackKey } = await import("../src/lib/unitStorage");
const { validateUnitContent } = await import("../src/lib/unitBuilder");
const { courseScopedUnit } = await import("../src/lib/courseScope");
const content = {
  lesson: [{ heading: "Original", paragraphs: ["Original teaching content"] }],
  exercises: [], assignments: [], quiz: [],
  evaluation: { intro: "Feedback", questions: ["What did you learn?"] },
  customTabs: [{ id: "custom-notes", title: "Extra resources", text: "Resources for this course" }],
};
validateUnitContent(content, false);
assert.throws(() => validateUnitContent({ ...content, customTabs: [...content.customTabs, ...content.customTabs] }, false), /unique ID/);
assert.throws(() => validateUnitContent(content), /assignment/);
const originalKey = builtUnitKey("8252");
rememberUnitPack(originalKey, JSON.stringify({ revision: "original", content, files: {} }));
assert.equal(readBuiltUnit("8252")?.content.lesson[0].heading, "Original");
localStorage.setItem("itss.activeCourse", "custom-first");
assert.notEqual(builtUnitKey("8252"), originalKey);
assert.ok(isUnitPackKey(builtUnitKey("8252")));
assert.equal(readBuiltUnit("8252"), undefined, "A custom course does not read another course's editable pack");
rememberUnitPack(builtUnitKey("8252"), JSON.stringify({ revision: "custom", content: { ...content, lesson: [{ heading: "Changed", paragraphs: ["New content"] }] }, files: {} }));
assert.equal(readBuiltUnit("8252")?.content.lesson[0].heading, "Changed");
assert.equal(readBuiltUnit("8252")?.content.customTabs?.[0].title, "Extra resources");
assert.equal(readBuiltUnit("8252")?.content.evaluation?.intro, "Feedback");
assert.equal(courseScopedUnit("8252.built-revision"), "custom-first.8252.built-revision");
localStorage.setItem("itss.activeCourse", "custom-second");
assert.equal(readBuiltUnit("8252"), undefined);
localStorage.setItem("itss.activeCourse", "itss");
assert.equal(readBuiltUnit("8252")?.content.lesson[0].heading, "Original");
assert.equal(courseScopedUnit("8252"), "8252");
console.log("Course editing isolation and tab validation tests passed.");
