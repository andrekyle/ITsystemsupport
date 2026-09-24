import assert from "node:assert/strict";
import { buildUnitContent, KNOWLEDGE_MARKS, PRACTICAL_MARKS } from "../src/lib/unitBuilder.ts";

const source = `# Define project scope\n\nA scope describes the required deliverables, boundaries and assumptions for the work.\n\n# Estimate resources and dependencies\n\nIdentify the people, equipment, materials and dependent tasks needed to complete the work.\n\n# Communicate late delivery\n\nAssess the impact of a delay, notify affected stakeholders and agree corrective action.`;
const unit = { us: "114059", title: "Estimate a unit of work and explain late delivery", nqf: 5, credits: 5, dates: "", time: "" };
const logbook = buildUnitContent(unit, source, { minutes: 300 }).logbook!;

assert.deepEqual(logbook.detailFields, ["Learner Name", "Qualification", "Group / Class", "Workplace Name", "Supervisor / Mentor", "Start & Completion Date"]);
assert.equal(logbook.knowledgeQuestions.length, 3);
assert.ok(logbook.knowledgeQuestions.every(row => row.marks.every((mark, index) => mark === KNOWLEDGE_MARKS[index])));
assert.ok(logbook.practicalActivities.length > 0);
assert.ok(logbook.practicalActivities.every(row => row.marks.every((mark, index) => mark === PRACTICAL_MARKS[index])));
assert.notDeepEqual(logbook.knowledgeQuestions.map(row => row.text), logbook.practicalActivities.map(row => row.text));
assert.deepEqual(logbook.workplaceActivities, logbook.practicalActivities.map(row => row.text.replace(/ and produce evidence of the completed work\.$/, ".")));
assert.match(logbook.project.text, /work product, supporting records/i);
assert.equal(logbook.otherActivities.length, 1);
assert.match(logbook.otherActivities[0].evidence, /Workplace evidence portfolio/);
assert.deepEqual(logbook.projectChecklist, [{ no: "1", name: "114059" }]);
assert.ok(!JSON.stringify(logbook).includes("A scope describes the required deliverables"), "lesson paragraphs are not copied into the logbook");

console.log("PASS: generated logbook matches the Module 1 evidence-led structure without duplicating lesson text");
