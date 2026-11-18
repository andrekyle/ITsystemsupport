import assert from "node:assert/strict";
import { activeCourse, createCourse, courseStorageKey, deleteCustomCourse, getCourses, saveCustomCourse } from "../src/data/courses";

const data = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", { value: {
  get length() { return data.size; },
  key: (index: number) => [...data.keys()][index] ?? null,
  getItem: (key: string) => data.get(key) ?? null,
  setItem: (key: string, value: string) => data.set(key, value),
}, configurable: true });
const details = { title: "New qualification", saqaId: "123456", nqfLevel: 4, credits: 120, description: "New course description", unitCounts: [2, 1], moduleNames: ["Module 1", "Module 2"], unitCodes: [["11", "12"], ["21"]] };
assert.equal(getCourses().length, 2);
const modules = details.unitCounts.map((count, index) => ({ name: `Module ${index + 1}`, description: "Module summary", outcomes: ["Apply the subject"], units: Array.from({ length: count }, (_, i) => ({ us: `${index + 1}${i + 1}`, title: `Unit ${i + 1}`, nqf: 4, credits: 5, description: "Unit summary", outcomes: ["Demonstrate competence"] })) }));
const course = createCourse(details, modules);
assert.deepEqual(course.modules.map(module => module.units.length), [2, 1]);
assert.ok(course.modules[0].units.length > 0, "Generated modules retain their units");
assert.equal(course.programmeAbout.intro, details.description);
assert.equal(course.poeSections.length, 0, "New courses do not inherit another qualification's POE content");
assert.equal(course.programmeMilestones.length, 0, "New courses do not inherit scheduled dates");
assert.equal(course.modules[0].description, "Module summary");
assert.equal(course.modules[0].units[0].description, "Unit summary");
assert.equal(course.modules[0].units[0].dates, "");
assert.throws(() => createCourse({ ...details, unitCounts: [1] }, modules));
assert.throws(() => createCourse(details, [modules[0], modules[0]]));
saveCustomCourse(course);
assert.equal(getCourses().length, 3);
localStorage.setItem("itss.activeCourse", course.id);
assert.equal(activeCourse().meta.title, details.title);
course.modules[0].units.push({ us: "123", title: "New unit", nqf: 4, credits: 5, dates: "1 Oct 2026", time: "09h00 - 14h00" });
saveCustomCourse(course);
assert.equal(getCourses().length, 3, "Saving a course does not duplicate it");
assert.equal(activeCourse().modules[0].units.at(-1)?.title, "New unit");
const another = createCourse(details, modules);
saveCustomCourse(another);
assert.equal(getCourses().length, 4);
assert.notEqual(course.id, another.id);
assert.notEqual(course.modules[0].id, another.modules[0].id);
data.set(courseStorageKey("custom-broken"), "invalid JSON");
assert.equal(getCourses().length, 4);
assert.throws(() => createCourse({ ...details, title: " " }, modules));
assert.throws(() => createCourse({ ...details, nqfLevel: 11 }, modules));
assert.throws(() => createCourse({ ...details, credits: -1 }, modules));
const unrelatedKey = "itss.lessonedits.8252";
localStorage.setItem(unrelatedKey, "preserve learner content");
deleteCustomCourse(course.id);
assert.equal(getCourses().length, 3);
assert.equal(activeCourse().id, "itss", "Deleting the selected course falls back to a built-in course");
assert.equal(getCourses().find(item => item.id === another.id)?.meta.title, details.title);
assert.equal(localStorage.getItem(unrelatedKey), "preserve learner content");
assert.equal(JSON.parse(localStorage.getItem(courseStorageKey(course.id))!).deleted, true);
assert.throws(() => saveCustomCourse(course), /deleted/);
assert.throws(() => deleteCustomCourse("itss"), /Built-in/);
assert.throws(() => deleteCustomCourse("genman"), /Built-in/);
deleteCustomCourse(course.id);
assert.equal(getCourses().length, 3, "Retrying deletion is safe");
console.log("Custom course tests passed.");
