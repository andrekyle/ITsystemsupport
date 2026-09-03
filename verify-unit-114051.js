// Verifies unit 114051 in the REAL src/data/content.ts (no mocks).
// Run: node verify-unit-114051.js   (spawns tsx to load the TS module)
import { execFileSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const tsx = join(__dirname, "node_modules", ".bin", process.platform === "win32" ? "tsx.cmd" : "tsx");

const probe = `
import { CONTENT } from "./src/data/content";
const u: any = CONTENT["114051"];
const out = {
  exists: !!u,
  lessons: u?.lesson?.length ?? 0,
  soMarkers: (u?.lesson ?? []).filter((l: any) => l.lessonStart).map((l: any) => l.lessonStart),
  headings: (u?.lesson ?? []).map((l: any) => l.heading),
  allHaveFields: (u?.lesson ?? []).every((l: any) => l.heading && l.icon && Array.isArray(l.paragraphs)),
  gateQuizzes: (u?.lesson ?? []).reduce((n: number, l: any) => n + (l.slideQuiz?.length ?? 0), 0),
  exercises: u?.exercises?.length ?? 0,
  quizzes: (u?.quizzes ?? []).reduce((n: number, q: any) => n + q.questions.length, 0),
  namedQuizzes: u?.quizzes?.length ?? 0,
  logbook: !!u?.logbook,
  selfAssessment: !!u?.selfAssessment,
  lessonPlan: !!u?.lessonPlan,
  saqaSections: u?.saqa?.sections?.length ?? 0,
};
console.log(JSON.stringify(out));
`;

const raw = (() => {
  const probeFile = join(__dirname, ".verify-114051-probe.mts");
  writeFileSync(probeFile, probe);
  try {
    return execFileSync(tsx, [probeFile], { cwd: __dirname, encoding: "utf8", shell: process.platform === "win32" });
  } finally {
    unlinkSync(probeFile);
  }
})();
const u = JSON.parse(raw.trim().split("\n").pop());

const line = "=".repeat(80);
console.log(line);
console.log("UNIT STANDARD 114051 - CONTENT VERIFICATION");
console.log(line);

let failures = 0;
function test(name, pass, detail = "") {
  if (!pass) failures++;
  console.log(`\n${pass ? "✓" : "✗"} ${name}`);
  console.log(`  Result: ${pass ? "PASS" : "FAIL"}${detail ? ` (${detail})` : ""}`);
}

test("TEST 1: Unit 114051 exists in content", u.exists);
test("TEST 2: Unit has a full set of lesson slides", u.lessons >= 28, `Found ${u.lessons} slides`);
test("TEST 3: All slides have heading, icon and paragraphs", u.allHaveFields);
test("TEST 4: All four Specific Outcome markers present", u.soMarkers.length === 4, u.soMarkers.map((s) => `SO ${s.n}`).join(", "));
const topics = [
  /introduction/i,
  /types of technical practitioners meetings/i,
  /leadership styles/i,
  /decision-making processes/i,
  /conventions/i,
  /resolutions/i,
  /procedural points/i,
  /note taker/i,
  /preparing for a technical/i,
  /notification/i,
  /agenda/i,
  /chairing a technical/i,
  /difficult behaviours/i,
  /post-meeting follow-up/i,
  /minutes/i,
  /life cycle/i,
  /self-assessment/i,
];
const missing = topics.filter((t) => !u.headings.some((h) => t.test(h)));
test("TEST 5: Key topics covered in slide headings", missing.length === 0, missing.length ? `missing ${missing.join(", ")}` : `${topics.length}/${topics.length} topics`);
test("TEST 6: Gate quizzes present across slides", u.gateQuizzes >= 30, `${u.gateQuizzes} questions`);
test("TEST 7: Exercises for all four SOs", u.exercises >= 4, `${u.exercises} exercises`);
test("TEST 8: Named quizzes with full question bank", u.namedQuizzes >= 4 && u.quizzes >= 20, `${u.namedQuizzes} quizzes, ${u.quizzes} questions`);
test("TEST 9: Logbook, self assessment, lesson plan and SAQA present", u.logbook && u.selfAssessment && u.lessonPlan && u.saqaSections === 4, `saqa sections: ${u.saqaSections}`);

console.log(`\n${line}`);
console.log("VERIFICATION SUMMARY");
console.log(line);
console.log(`\nUnit: 114051 - Conduct a technical practitioners meeting`);
console.log(`Slides: ${u.lessons} · Gate quiz questions: ${u.gateQuizzes} · Exercises: ${u.exercises} · Quiz bank: ${u.quizzes}`);
console.log(`Status: ${failures === 0 ? "✓ READY FOR TESTING" : `✗ ${failures} TEST(S) FAILED`}`);
console.log(`\n${line}`);
process.exit(failures === 0 ? 0 : 1);
