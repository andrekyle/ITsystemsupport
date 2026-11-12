import assert from "node:assert/strict";
import { parseLessonQuizState, reconcileLessonQuiz, recordLessonQuiz, type SlideQuizDefinition } from "../src/lib/lessonQuizProgress";

const first = { q: "Choose the second option", options: ["Alpha", "Beta"], answer: 1, explain: "Feedback" };
const extra = { q: "Choose the first option", options: ["One", "Two"], answer: 0, explain: "Feedback" };
const original: SlideQuizDefinition[] = [{ heading: "First slide", questions: [first] }];
const legacy = { answers: { 0: [1] }, checked: { 0: true }, attempts: { 0: 2 } };
const saved = reconcileLessonQuiz(legacy, original);
assert.deepEqual(saved.legacy, legacy, "Keep the exact positional record during migration");
assert.deepEqual(reconcileLessonQuiz(saved, original).answers[0], [1]);

const added = [{ heading: "First slide", questions: [extra, first] }];
const updated = reconcileLessonQuiz(saved, added);
assert.deepEqual(updated.answers[0], [-1, 1], "Adding a question must retain the existing selection, not transfer it to the new question");
assert.equal(updated.checked[0], false);
assert.equal(updated.attempts[0], 0, "New questions need an available attempt");
const answered = recordLessonQuiz({
  ...updated, answers: { 0: [0, 1] }, checked: { 0: true }, attempts: { 0: 1 },
}, added);
const reordered = [{ heading: "First slide", questions: [
  { ...first, options: ["Beta", "Alpha"], answer: 0 }, extra,
] }];
assert.deepEqual(reconcileLessonQuiz(answered, reordered).answers[0], [0, 0], "Question and option reordering preserve the selected text");
assert.equal(reconcileLessonQuiz(answered, reordered).attempts[0], 1, "Reordering is not a new quiz attempt");
const corrected = [{ heading: "First slide", questions: [{ ...first, answer: 0 }] }];
assert.equal(reconcileLessonQuiz(saved, corrected).attempts[0], 0, "A corrected answer key permits a new attempt");
assert.deepEqual(reconcileLessonQuiz(saved, corrected).answers[0], [1], "Correcting the key does not change the learner's selection");
const duplicates = [{ heading: "First slide", questions: [first, first] }];
const duplicateSave = reconcileLessonQuiz({ answers: { 0: [0, 1] }, checked: {}, attempts: {} }, duplicates);
assert.deepEqual(reconcileLessonQuiz(duplicateSave, duplicates).answers[0], [0, 1], "Repeated questions must retain independent selections");
const moved = [{ heading: "New slide", questions: [] }, ...reordered];
assert.deepEqual(reconcileLessonQuiz(answered, moved).answers[1], [0, 0], "Inserting a slide must not move answers onto unrelated questions");
const removed = reconcileLessonQuiz(answered, [{ heading: "First slide", questions: [extra] }]);
assert.deepEqual(reconcileLessonQuiz(removed, original).answers[0], [1], "Removed questions retain recoverable selections");
assert.equal(reconcileLessonQuiz(removed, original).attempts[0], 2, "Restoring the original quiz restores its recorded attempt count");
const changed = [{ heading: "First slide", questions: [{ ...first, q: "A different question" }] }];
assert.deepEqual(reconcileLessonQuiz(saved, changed).answers[0], [-1], "Do not invent answers to edited questions");
assert.deepEqual(reconcileLessonQuiz(parseLessonQuizState(JSON.stringify(answered)), added).answers[0], [0, 1], "Identity-based saves survive serialization");
assert.throws(() => parseLessonQuizState("null"), /invalid format/);
assert.throws(() => parseLessonQuizState('{"answers": []}'), /invalid format/);
console.log("PASS: legacy migration, inserted questions/slides, reordered questions/options, retained removed answers, attempt versions, changed questions, serialization and malformed data");
