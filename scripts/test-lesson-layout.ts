import { strict as assert } from "node:assert";
import { createLessonBlocks, layoutLessonSections, paginateLesson, validateLessonPages } from "../src/lib/lessonLayout";

const sentences = Array.from({ length: 22 }, (_, index) => `Sentence ${index + 1} explains an important technical idea clearly enough for a presentation audience.`).join(" ");
const rows = Array.from({ length: 18 }, (_, index) => [`${index + 1}`, `Device ${index + 1}`, "A longer description that must wrap safely inside its own table cell without splitting the row."]);
const table = ["| No | Device | Description |", "| --- | --- | --- |", ...rows.map(row => `| ${row.join(" | ")} |`)].join("\n");
const source = [
  "Introductory paragraph with deliberately inconsistent     spacing.",
  "**2.1 Network Topologies**",
  sentences,
  "The process includes:",
  "1. Inspect the hardware before making changes.",
  "2. Record the current configuration and serial numbers.",
  "3. Apply the approved change and test the result.",
  "4. Document the outcome for the support team.",
  table,
];

const blocks = createLessonBlocks(source);
assert(blocks.some(block => block.type === "subheading"));
assert(blocks.some(block => block.type === "numbered" && block.items?.length === 4));
assert(blocks.some(block => block.type === "table" && block.table?.rows.length === 18));

const pages = paginateLesson("Infrastructure", source);
assert(pages.length >= 3, "difficult content should create continuation slides");
assert.equal(pages[0].heading, "Infrastructure");
assert(pages.slice(1).every(page => page.heading === "Infrastructure — Continued"));
assert.equal(validateLessonPages(pages).length, 0, validateLessonPages(pages).join("\n"));
assert.equal(pages.flatMap(page => page.paragraphs).filter(paragraph => paragraph.includes("| No | Device")).length >= 2, true, "table headers repeat on continuation slides");
assert.equal(pages.flatMap(page => page.paragraphs).join(" ").includes("Sentence 22"), true, "long paragraph content is retained");

const saved = layoutLessonSections([{ heading: "Saved lesson", icon: "presenter", flat: true, paragraphs: source, slideQuiz: [{ q: "Check?", options: ["Yes", "No"], answer: 0, explain: "Yes." }] }]);
assert(saved.length >= 3, "existing saved lessons are repaginated at load time");
assert(saved.slice(0, -1).every(section => !section.slideQuiz), "the slide quiz is not duplicated across continuations");
assert.equal(saved.at(-1)?.slideQuiz?.length, 1, "the slide quiz remains on the final continuation");

const malformedStages = [
  "Stage 1 | The sender decides what information is going to be transmitted. |", "---",
  "Stage 2 | The sender encodes this information. |", "---",
  "Stage 3 | The sender transmits the message. |", "---",
  "Stage 4 | The receiver takes in the message. |",
  "Stage 5 | The receiver decodes the message. |",
];
const stageBlocks = createLessonBlocks(malformedStages);
assert.equal(stageBlocks.length, 1, "malformed Word table separators do not render as paragraphs");
assert.equal(stageBlocks[0].type, "numbered", "communication stages use a semantic numbered list");
assert.equal(stageBlocks[0].items?.length, 5, "every stage remains in the same ordered sequence");

console.log(`PASS: ${blocks.length} semantic blocks paginated into ${pages.length} validated slides`);
