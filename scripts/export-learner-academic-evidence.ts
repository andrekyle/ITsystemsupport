// Export the read-only audit without changing any cloud records.
import fs from "node:fs";
import { savedAcademicWorkHtml, savedWorkbookAnswers, savedLessonAnswers, type LessonQuizEvidence } from "../src/lib/academicEvidence";
import { WORKBOOK_SPECS } from "../src/data/workbookSpecs";
import { COURSES } from "../src/data/courses";
import { parseLessonQuizState } from "../src/lib/lessonQuizProgress";
import { mergeProgressEvidence } from "../src/lib/progressEvidence";
import type { ProgressState } from "../src/types";

const audit = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const output = process.argv[3];
if (!output) throw new Error("Supply a private output HTML path.");
let progress: ProgressState = { units: {} };
const lessons: LessonQuizEvidence = {};
for (const row of audit.rows) {
  if (row.key.startsWith("itss.progress.")) progress = mergeProgressEvidence(progress, JSON.parse(row.value));
  if (row.key.startsWith("itss.lessonquiz.")) (lessons[row.key.split(".").slice(3).join(".")] ??= []).push(parseLessonQuizState(row.value));
}
const escape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const units = COURSES.flatMap(course => course.modules.flatMap(module => module.units));
const sections = [...new Set([...Object.keys(progress.units), ...Object.keys(lessons)])].map(id => {
  const body = savedAcademicWorkHtml(progress.units[id], WORKBOOK_SPECS[id], lessons[id]);
  return body ? `<section><h2>US ${escape(id)} — ${escape(units.find(unit => unit.us === id)?.title ?? "Saved learner work")}</h2>${body}</section>` : "";
});
const workbookAnswers = Object.values(progress.units).reduce((sum, unit) => sum + savedWorkbookAnswers(unit).length, 0);
const quizAnswers = Object.values(lessons).reduce((sum, states) => sum + savedLessonAnswers(states).length, 0);
fs.writeFileSync(output, `<!doctype html><html lang="en"><meta charset="utf-8"><title>Saved academic work — ${escape(audit.learner)}</title><style>body{font:15px/1.5 system-ui;max-width:900px;margin:40px auto;padding:20px;color:#222}h2{border-top:2px solid #aaa;padding-top:18px}.answer{white-space:pre-wrap;background:#f3f5f7;padding:12px}.q,.exercise{margin:20px 0}.q-text{font-weight:600}.marks{font-size:13px;color:#555}@media print{.q,.exercise{break-inside:avoid}}</style><h1>${escape(audit.learner)}</h1><p>Verified saved academic work: ${workbookAnswers} workbook answers and ${quizAnswers} lesson-quiz selections.</p><p>This read-only export preserves recorded answers and marks. Historical quiz selections are retained without recalculating scores or claiming programme completion.</p>${sections.join("\n")}</html>`);
console.log(`Exported ${workbookAnswers} workbook answers and ${quizAnswers} lesson-quiz selections.`);
