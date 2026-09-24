import assert from "node:assert/strict";
import { buildUnitContent } from "../src/lib/unitBuilder.ts";

const longTeachingText = "Estimating begins by defining scope, deliverables and dependencies before calculating effort. Teams compare prior records, document assumptions and allow for risk so stakeholders understand the basis of the estimate. ".repeat(5).trim();
const source = `# Estimating work\n\n${longTeachingText}\n\n# Managing late delivery\n\nLate delivery affects cost, dependent tasks and stakeholder commitments. Communicate early, assess the impact and agree a revised date.`;
const content = buildUnitContent({ us: "114059", title: "Estimate a unit of work", nqf: 5, credits: 5, dates: "", time: "" }, source, { minutes: 300 });
const plan = content.lessonPlan!;
const topicRows = plan.sections.flatMap(section => section.rows).filter(row => /Facilitator & Class/.test(row.title));

assert.equal(topicRows.length, 2, "one compact plan row is created per lesson topic");
assert.ok(topicRows.every(row => !row.text?.length), "lesson paragraphs are not copied into topic rows");
assert.ok(topicRows.every(row => (row.bullets?.length ?? 0) >= 1 && (row.bullets?.length ?? 0) <= 3), "topic rows use concise facilitator actions");
assert.ok(!JSON.stringify(plan).includes(longTeachingText), "the lesson plan does not duplicate the supplied teaching text");
assert.deepEqual(topicRows.map(row => row.title), ["Estimating work — Facilitator & Class", "Managing late delivery — Facilitator & Class"]);

console.log("PASS: generated lesson plans use compact facilitator rows without copying lesson text");
