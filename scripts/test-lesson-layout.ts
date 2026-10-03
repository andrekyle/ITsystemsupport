import { strict as assert } from "node:assert";
import { createLessonBlocks, paginateLesson, validateLessonPages } from "../src/lib/lessonLayout";

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

console.log(`PASS: ${blocks.length} semantic blocks paginated into ${pages.length} validated slides`);
