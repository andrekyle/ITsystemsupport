import assert from "node:assert/strict";
import fs from "node:fs";
import { savedLessonQuizResults, quizEvidenceLabel, hasFormativeEvidence, savedWorkbookResults, hasSavedAcademicWork, savedWorkbookAnswers, savedLessonAnswers, savedAcademicWorkHtml, type LessonQuizEvidence } from "../src/lib/academicEvidence";
import { WORKBOOK_SPECS } from "../src/data/workbookSpecs";
import { recordLessonQuiz, parseLessonQuizState } from "../src/lib/lessonQuizProgress";
import type { ProgressState, UnitProgress } from "../src/types";

const unit: UnitProgress = { activities: {}, logbook: {
  "learner-workbook.cover-name": "Name only",
  "learner-workbook.session-1.activity-1.answer": "A real project-team answer <script>",
  "learner-workbook.task-mark.activity-1": JSON.stringify({ awarded: 4, maxMarks: 5, feedback: "Saved feedback" }),
  "built-workbook.channel-use.channel-use": "Broadband and baseband answer",
  "built-workbook.source.cover-id": "Never treat identity details as an answer",
} };
assert.equal(quizEvidenceLabel(undefined, undefined), "No saved result linked to this quiz");
assert.equal(quizEvidenceLabel(undefined, undefined, true), "Checking saved records…");
assert.equal(quizEvidenceLabel(undefined, '{"0":{"kind":"choice","picks":[0]}}'), "Answers saved · score unavailable");
assert.equal(quizEvidenceLabel(undefined, '{"0":{"kind":"choice","picks":[]}}'), "No saved result linked to this quiz");
assert.equal(quizEvidenceLabel({ best: 4, total: 5 }, undefined), "4/5 · 80%");
assert.equal(savedWorkbookAnswers(unit).length, 2);
const named = savedWorkbookAnswers(unit, WORKBOOK_SPECS["10135"]);
assert(named[0].question.startsWith("Activity 1:"));
assert.equal(named[0].mark?.awarded, 4);
assert(hasFormativeEvidence(unit));
assert.deepEqual(savedWorkbookResults(unit), [{ best: 4, total: 5 }]);
assert(!hasFormativeEvidence({ activities: {}, logbook: { "learner-workbook.task.answer": "Unsubmitted draft" } }));
assert(!hasFormativeEvidence({ activities: {}, logbook: { "learner-workbook.task.answer": "Answer", "learner-workbook.task-mark.task": '{"awarded":20,"maxMarks":5}' } }));
assert(hasSavedAcademicWork({ units: { "10135": unit } }));
assert(!hasSavedAcademicWork({ units: { "10135": { activities: {}, logbook: { "learner-workbook.cover-name": "Name" } } } }));

const quiz = recordLessonQuiz({ answers: { 0: [1] }, checked: { 0: true }, attempts: { 0: 2 } }, [{
  heading: "Original heading", questions: [{ q: "Original question", options: ["Wrong", "Saved choice"], answer: 1, explain: "" }],
}]);
const stored = structuredClone(quiz);
assert.deepEqual(savedLessonAnswers([quiz]).map(row => [row.heading, row.question, row.answer]), [["Original heading", "Original question", "Saved choice"]]);
assert.deepEqual(quiz, stored, "Reading evidence must not mutate attempts, marks or selections");
const originalSlides = [{ heading: "Original quiz", questions: [
  { q: "Z first authored question", options: ["Z option", "A option"], answer: 0, explain: "" },
  { q: "A second authored question", options: ["Correct", "Wrong"], answer: 0, explain: "" },
] }];
const orderedState = recordLessonQuiz({ answers: { 0: [0, 1] }, checked: { 0: true }, attempts: { 0: 1 } }, originalSlides);
const orderedBefore = structuredClone(orderedState);
const review = savedLessonQuizResults([orderedState], originalSlides)[0];
assert.deepEqual(review.answers.map(answer => answer.question), originalSlides[0].questions.map(question => question.q), "Quiz review must use authored question order, not sorted identity keys");
assert.deepEqual(review.answers[0].options, ["Z option", "A option"]);
assert.equal(review.answers[1].correctAnswer, "Correct");
assert(!("correct" in review), "Saved selections must not be converted into a submission score");
assert.deepEqual(orderedState, orderedBefore, "Formatting the review must not change saved answers or results");
const richKey = JSON.stringify([JSON.stringify(['<!--slide-rich--><span style="font-weight:bold">De facto</span><p>Tradition &amp; facts</p>', 0, '<!--slide-rich--><b>Which standard?</b>', '', []]), 0]);
const richState = { answers: {}, checked: {}, attempts: {}, identities: { picks: { [richKey]: '<!--slide-rich--><span>Historical &amp; traditional</span>' }, versions: {} } };
const richBefore = structuredClone(richState);
const richAnswer = savedLessonAnswers([richState])[0];
assert.equal(richAnswer.heading, 'De facto\nTradition & facts');
assert.equal(richAnswer.question, 'Which standard?');
assert.equal(richAnswer.answer, 'Historical & traditional');
assert.deepEqual(richState, richBefore, 'Display cleanup must preserve stored identities and answers');
assert(!savedAcademicWorkHtml(undefined, undefined, [richState]).includes('slide-rich'));
assert.equal(savedLessonAnswers([{ answers: { 0: [0, -1] }, checked: {}, attempts: {} }])[0].answer, "Saved option 1");
assert.equal(savedLessonAnswers([{ answers: { 0: [-1] }, checked: {}, attempts: {} }]).length, 0);
const html = savedAcademicWorkHtml(unit, WORKBOOK_SPECS["10135"], [quiz]);
assert(html.includes("Saved choice"));
assert(html.includes("&lt;script&gt;"));
assert(!html.includes("<script>"));
assert(!html.includes("Never treat identity details"));
assert(html.includes("Saved mark: 4/5"));
assert(hasSavedAcademicWork({ units: {} }, { "10135": [quiz] }));

const auditPath = process.argv[2];
if (auditPath) {
  const audit = JSON.parse(fs.readFileSync(auditPath, "utf8"));
  const progress: ProgressState = JSON.parse(audit.rows.find((row: { key: string }) => row.key.startsWith("itss.progress.")).value);
  const lessons: LessonQuizEvidence = {};
  for (const row of audit.rows.filter((row: { key: string }) => row.key.startsWith("itss.lessonquiz."))) {
    const unitId = row.key.split(".").slice(3).join(".");
    (lessons[unitId] ??= []).push(parseLessonQuizState(row.value));
  }
  const workbookAnswers = Object.values(progress.units).reduce((sum, saved) => sum + savedWorkbookAnswers(saved).length, 0);
  const lessonAnswers = Object.values(lessons).reduce((sum, states) => sum + savedLessonAnswers(states).length, 0);
  assert(workbookAnswers >= 52, "Bradley's recorded workbook answers must be visible");
  assert(lessonAnswers > 700, "Bradley's separately stored lesson quizzes must be visible");
  assert(hasSavedAcademicWork(progress, lessons));
  assert(hasFormativeEvidence(progress.units["114046"]), "Saved workbook marks must count in progress without an old activity tick");
  console.log(`Verified live read-only snapshot: ${workbookAnswers} workbook answers and ${lessonAnswers} lesson-quiz selections retained.`);
}
console.log("Academic evidence checks passed.");
