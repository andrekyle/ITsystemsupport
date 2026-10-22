import assert from "node:assert/strict";
import { buildUnitContent, mergeUnitContentEnhancement } from "../src/lib/unitBuilder.ts";

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

const unit = { us: "114059", title: "Estimate a unit of work", nqf: 5, credits: 5, dates: "", time: "" };
const manual = Array.from({ length: 25 }, (_, index) => `# Topic ${index + 1}\n\n${longTeachingText}`).join("\n\n");
for (const minutes of [60, 180, 300, 2400]) {
  const pack = buildUnitContent(unit, manual, { minutes });
  const rows = pack.lessonPlan!.sections.flatMap(section => section.rows);
  assert.ok(rows.filter(row => /Facilitator & Class/.test(row.title)).length <= 8, "large manuals stay within eight teaching rows");
  assert.ok(JSON.stringify(pack.lessonPlan).length < 6000, "the plan has a measurable size limit");
  assert.equal(rows.reduce((sum, row) => sum + Number(row.time?.match(/\d+/)?.[0] ?? 0), 0), minutes, "scheduled minutes match the chosen duration");
  assert.ok(pack.lessonPlan!.details?.find(detail => /^time$/i.test(detail.label))?.value.includes(`${minutes} minutes`), "plan metadata must reflect the selected duration, not the template's old hours");
  assert.ok(pack.lesson.flatMap(section => section.paragraphs).join(" ").includes(longTeachingText), "shortening the plan does not remove lesson content");
  const verbosePlan = structuredClone(pack.lessonPlan!);
  verbosePlan.sections[1].rows[1].text = [longTeachingText];
  assert.deepEqual(mergeUnitContentEnhancement(pack, { lessonPlan: verbosePlan }, unit).lessonPlan, pack.lessonPlan, "rejecting a verbose AI plan must retain the selected duration and local schedule");
}
const verbose = structuredClone(content.lessonPlan!);
verbose.sections[1].rows[1].text = [longTeachingText];
const merged = mergeUnitContentEnhancement(content, { lessonPlan: verbose }, unit);
assert.ok(!JSON.stringify(merged.lessonPlan).includes(longTeachingText), "verbose AI plans fall back to a concise schedule");
console.log("PASS: generated/AI lesson plans stay concise, preserve lessons, cap teaching rows and match 60–2400 minute durations");
