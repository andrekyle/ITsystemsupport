import assert from "node:assert/strict";
import type { LessonPlan } from "../src/types";
import { insertLessonPlanDay, lessonPlanDayCount, removeLessonPlanDay, startLessonPlanDay } from "../src/lib/lessonPlanDays";

const plan: LessonPlan = {
  title: "Two-day unit", startTime: "08:30", prep: [],
  sections: [{ heading: "Training", rows: [
    { title: "Networking concepts", time: "30 minutes", resources: ["Manual"] },
    { title: "Practice", time: "60 minutes", bullets: ["Work in pairs"] },
    { title: "Review", time: "20 minutes" },
  ] }],
};
const originalRows = structuredClone(plan.sections.flatMap(section => section.rows));
assert.equal(lessonPlanDayCount(plan), 1);
startLessonPlanDay(plan, 0, 1);
assert.equal(lessonPlanDayCount(plan), 2);
assert.equal(plan.sections[1].startTime, "08:30");
assert.equal(plan.sections[0].heading, "Training");
assert.deepEqual(plan.sections.flatMap(section => section.rows), originalRows);
assert.deepEqual(plan.sections.map(section => section.rows.length), [1, 2]);
startLessonPlanDay(plan, 1, 0);
assert.equal(lessonPlanDayCount(plan), 2, "An existing day boundary is not duplicated");
plan.sections[0].startTime = "08:00";
assert.equal(lessonPlanDayCount(plan), 2, "An explicit Day 1 start does not add a day");
delete plan.sections[1].startTime;
assert.equal(lessonPlanDayCount(plan), 1);
startLessonPlanDay(plan, 1, 0);
assert.equal(lessonPlanDayCount(plan), 2, "A section can start a new day without splitting rows");
const snapshot = structuredClone(plan);
startLessonPlanDay(plan, 0, 0);
startLessonPlanDay(plan, 99, 0);
assert.deepEqual(plan, snapshot);
delete plan.startTime;
startLessonPlanDay(plan, 1, 1);
assert.equal(plan.sections[2].startTime, "09:00");
assert.equal(lessonPlanDayCount(plan), 3);
assert.deepEqual(JSON.parse(JSON.stringify(plan)).sections.flatMap((section: any) => section.rows), originalRows);
const daily: LessonPlan = {
  title: "Daily routines", startTime: "08:30", prep: [], sections: [
    { rows: [
      { title: "Room Set Up", text: ["Prepare the projector."] },
      { title: "Meet, Greet & Seat", time: "20 minutes", resources: ["Register"] },
    ] },
    { heading: "Teaching", rows: [
      { title: "Index & Unit Standard Alignment — Facilitator", time: "25 minutes" },
      { title: "Topic A", time: "60 minutes" },
      { title: "Topic B", time: "60 minutes" },
      { title: "Parking Bay — Facilitator", time: "10 minutes", bullets: ["Answer questions."] },
      { title: "Closing — Facilitator", time: "10 minutes", text: ["Thank the class."] },
    ] },
  ],
};
const appended = structuredClone(daily);
const beforeSplit = structuredClone(daily);
const restored = structuredClone(daily);
startLessonPlanDay(restored, 1, 2);
const reloaded = JSON.parse(JSON.stringify(restored)) as LessonPlan;
removeLessonPlanDay(reloaded, 2);
assert.deepEqual(reloaded, beforeSplit, "Removing a split day restores the original plan even after saving and reloading");
startLessonPlanDay(restored, 2, 0);
removeLessonPlanDay(restored, 2);
assert.deepEqual(restored, beforeSplit, "An existing day boundary remains unchanged by repeated addition");
const editedDay = structuredClone(daily);
startLessonPlanDay(editedDay, 1, 2);
editedDay.sections[2].rows.push({ title: "Manually added activity" });
removeLessonPlanDay(editedDay, 2);
assert.equal(editedDay.sections[1].rows.at(-1)?.title, "Manually added activity", "Removal preserves manually added rows");
const legacy = structuredClone(daily);
legacy.sections[1].startTime = "09:00";
removeLessonPlanDay(legacy, 1);
assert.deepEqual(legacy, daily, "Older day boundaries preserve all untracked rows");
insertLessonPlanDay(appended, appended.sections.length, { title: "New activity" });
assert.deepEqual(appended.sections[2].rows.map(row => row.title), [
  "Room Set Up", "Meet, Greet & Seat", "Index & Unit Standard Alignment — Facilitator",
  "New activity", "Parking Bay — Facilitator", "Closing — Facilitator",
]);
startLessonPlanDay(daily, 1, 2);
assert.equal(lessonPlanDayCount(daily), 2);
assert.deepEqual(daily.sections[1].rows.map(row => row.title), [
  "Index & Unit Standard Alignment — Facilitator", "Topic A", "Parking Bay — Facilitator", "Closing — Facilitator",
]);
assert.deepEqual(daily.sections[2].rows.map(row => row.title), [
  "Room Set Up", "Meet, Greet & Seat", "Index & Unit Standard Alignment — Facilitator",
  "Topic B", "Parking Bay — Facilitator", "Closing — Facilitator",
]);
assert.deepEqual(daily.sections[2].rows[1].resources, ["Register"]);
daily.sections[2].rows[0].text![0] = "Different room";
assert.equal(daily.sections[0].rows[0].text![0], "Prepare the projector.", "Copied activities are independently editable");
const saved = structuredClone(daily);
startLessonPlanDay(daily, 2, 0);
assert.deepEqual(daily, saved, "Repeated clicks do not duplicate introductions or conclusions");
const middle = structuredClone(appended);
insertLessonPlanDay(middle, 1, { title: "Inserted activity" });
assert.equal(lessonPlanDayCount(middle), 3);
assert.equal(middle.sections[1].rows[0].title, "Room Set Up");
assert.equal(middle.sections[2].rows.filter(row => row.title === "Closing — Facilitator").length, 1);
console.log("Lesson plan day tests passed.");
