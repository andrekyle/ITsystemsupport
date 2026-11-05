import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TemplateLearnerWorkbook } from "../src/components/TemplateLearnerWorkbook";
import { WORKBOOK_114076 } from "../src/data/workbook114076";
import type { Profile, UnitStandard } from "../src/types";

const unit = { us: "114076", title: WORKBOOK_114076.title, nqf: 4, credits: 3, dates: "", time: "" } satisfies UnitStandard;
const profile = { role: "Learner", name: "Test learner" } as Profile;
const html = renderToStaticMarkup(<TemplateLearnerWorkbook source114076 workbook={WORKBOOK_114076} unit={unit} profile={profile} memoItems={[]} values={{}} onChange={() => {}} onSave={async () => {}} />);

for (let page = 1; page <= 12; page++) {
  assert.equal((html.match(new RegExp(`data-page="${page}"`, "g")) ?? []).length, 1, `Page ${page} must appear exactly once`);
}
assert.equal((html.match(/class="lw-page/g) ?? []).length, 12, "Workbook must have twelve page sections");
for (const phrase of [
  "NOTIONAL HOURS: 30", "Table of contents", "NOTIONAL HOURS BREAKDOWN", "Overall Assessment Decision",
  "Control sheet", "In pairs outline how you would plan the research of a computer topic",
  "Describe Data Collection in computer science", "Quantitative content analysis findings",
  "SELF-ASSESSMENT", "ASSESSMENT FEEDBACK REPORT", "DECLARATION BY LEARNER", "DECLARATION BY THE ASSESSOR",
]) assert.ok(html.includes(phrase), `Missing PDF content: ${phrase}`);
assert.equal(WORKBOOK_114076.outcomes.flatMap(outcome => outcome.questions).reduce((sum, question) => sum + question.marks, 0), 32);
console.log("Unit 114076 workbook: twelve ordered pages, four PDF questions, 32 marks.");
