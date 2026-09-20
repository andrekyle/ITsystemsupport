import assert from "node:assert/strict";
import { activeCourse, createCourse, courseStorageKey, deleteCustomCourse, getCourses, saveCustomCourse } from "../src/data/courses";

const data = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", { value: {
  get length() { return data.size; },
  key: (index: number) => [...data.keys()][index] ?? null,
  getItem: (key: string) => data.get(key) ?? null,
  setItem: (key: string, value: string) => data.set(key, value),
}, configurable: true });
const details = { title: "New qualification", saqaId: "123456", nqfLevel: 4, credits: 120, description: "New course description", moduleName: "First module" };
assert.equal(getCourses().length, 2);
const course = createCourse(details);
assert.equal(course.modules.length, 6, "A new course copies the complete module structure");
assert.ok(course.modules[0].units.length > 0, "Copied modules retain their units");
assert.equal(course.programmeAbout.intro, details.description);
assert.ok(course.poeSections.length > 0, "Copied course retains POE tabs");
assert.ok(course.programmeMilestones.length > 0, "Copied course retains calendar milestones");
saveCustomCourse(course);
assert.equal(getCourses().length, 3);
localStorage.setItem("itss.activeCourse", course.id);
assert.equal(activeCourse().meta.title, details.title);
course.modules[0].units.push({ us: "123", title: "New unit", nqf: 4, credits: 5, dates: "1 Oct 2026", time: "09h00 - 14h00" });
saveCustomCourse(course);
assert.equal(getCourses().length, 3, "Saving a course does not duplicate it");
assert.equal(activeCourse().modules[0].units.at(-1)?.title, "New unit");
const another = createCourse(details);
saveCustomCourse(another);
assert.equal(getCourses().length, 4);
assert.notEqual(course.id, another.id);
assert.notEqual(course.modules[0].id, another.modules[0].id);
data.set(courseStorageKey("custom-broken"), "invalid JSON");
assert.equal(getCourses().length, 4);
assert.throws(() => createCourse({ ...details, title: " " }));
assert.throws(() => createCourse({ ...details, nqfLevel: 11 }));
assert.throws(() => createCourse({ ...details, credits: -1 }));
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
