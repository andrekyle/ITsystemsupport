// In-process TypeScript compilation keeps these data checks independent of bundler subprocesses.
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  const localRequire = id => {
    if (!id.startsWith(".")) return require(id);
    const target = path.resolve(path.dirname(file), id);
    const source = [target, `${target}.ts`, `${target}.tsx`].find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
    if (!source) throw new Error(`Cannot resolve ${id}`);
    return load(source);
  };
  new Function("require", "module", "exports", code)(localRequire, module, module.exports);
  return module.exports;
}
load(path.resolve("scripts/test-academic-evidence.ts"));

// Exercise the actual shared progress functions without browser/storage side effects.
const assert = require("node:assert/strict");
const source = ts.createSourceFile("store.ts", fs.readFileSync("src/store.ts", "utf8"), ts.ScriptTarget.Latest, true);
const names = ["unitCompletion", "unitProgress", "unitStatus", "moduleCompletion", "overallStats"];
const derived = source.statements.filter(node => ts.isFunctionDeclaration(node) && names.includes(node.name?.text)).map(node => node.getText(source)).join("\n");
const evidence = load(path.resolve("src/lib/academicEvidence.ts"));
const { UNIT_ACTIVITIES } = load(path.resolve("src/types.ts"));
const js = ts.transpileModule(derived, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const stats = {};
new Function("exports", "UNIT_ACTIVITIES", "MODULES", "poeDocUnits", "hasFormativeEvidence", "savedWorkbookAnswers", js)(stats,
  UNIT_ACTIVITIES, [{ id: "test", units: [{ us: "114046", credits: 10 }] }], () => [], evidence.hasFormativeEvidence, evidence.savedWorkbookAnswers);
const marked = { units: { "114046": { activities: {}, logbook: {
  "learner-workbook.activity-1.answer": "Recorded work",
  "learner-workbook.task-mark.activity-1": '{"awarded":4,"maxMarks":5}',
} } } };
assert.equal(stats.unitCompletion(marked, "114046"), 1 / UNIT_ACTIVITIES.length);
assert.equal(stats.unitStatus(marked, "114046"), "in-progress");
assert.equal(stats.overallStats(marked).creditsEarned, 0, "Workbook marks cannot award assessor credits");
assert.equal(stats.overallStats(marked).unitsCompleted, 0, "Workbook marks cannot complete summative and POE stages");
assert.equal(stats.overallStats(marked, {}, { "114046": { status: "C" } }).creditsEarned, 10);
console.log("Shared progress checks passed: workbook evidence counts; completion and credits require the remaining recorded stages/outcomes.");

const quizSource = ts.createSourceFile("Quiz.tsx", fs.readFileSync("src/components/Quiz.tsx", "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let submitNode;
function findSubmit(node) {
  if (ts.isFunctionDeclaration(node) && node.name?.text === "submit") submitNode = node;
  ts.forEachChild(node, findSubmit);
}
findSubmit(quizSource);
const submitCode = ts.transpileModule(submitNode.getText(quizSource), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
for (const fails of [true, false]) {
  let removed = false, submitted = false, error = "", saved = false;
  const submit = new Function("setSaveError", "answers", "shuffled", "onSubmit", "score", "questions", "setSubmitted", "draftKey", "localStorage", "document", `${submitCode}; return submit;`)(
    message => { error = message; }, { 0: { kind: "choice", picks: [0] } }, [{ optOrder: [0, 1] }],
    () => { if (fails) throw new Error("Save failed"); saved = true; }, 1, [{}], value => { submitted = value; }, "draft",
    { removeItem() { assert(saved, "Draft must not be cleared before a successful save"); removed = true; } }, { querySelector() { return null; } });
  submit();
  assert.equal(removed, !fails);
  assert.equal(submitted, !fails);
  assert.equal(error, fails ? "Save failed" : "");
}
console.log("Quiz save checks passed: failed saves retain drafts and do not show a successful submission.");
