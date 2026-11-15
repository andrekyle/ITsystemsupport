// Read-only: compare original quiz definitions across repository revisions.
const fs = require("node:fs");
const ts = require("typescript");
const cp = require("node:child_process");
const crypto = require("node:crypto");
function lesson(text, unit) {
  const file = ts.createSourceFile("content.ts", text, ts.ScriptTarget.Latest, true);
  let content;
  for (const statement of file.statements) if (ts.isVariableStatement(statement)) for (const declaration of statement.declarationList.declarations)
    if (declaration.name.getText(file) === "CONTENT") content = declaration.initializer;
  while (content && ts.isAsExpression(content)) content = content.expression;
  const property = content?.properties.find(property => property.name?.getText(file).replace(/['"]/g, "") === unit);
  if (!property) return null;
  const value = property.initializer.properties.find(property => property.name?.getText(file) === "lesson");
  return value ? new Function(`return (${value.initializer.getText(file)})`)().map(section => ({ heading: section.heading, questions: section.slideQuiz ?? [] })) : null;
}
const units = process.argv.slice(2);
if (!units.length || units.some(unit => !/^[\w-]+$/.test(unit))) throw new Error("Supply unit IDs.");
const commits = cp.execFileSync("git", ["log", "--format=%H", "--", "src/data/content.ts"], { encoding: "utf8" }).trim().split("\n");
const versions = Object.fromEntries(units.map(unit => [unit, new Map()]));
const failures = Object.fromEntries(units.map(unit => [unit, 0]));
for (const commit of commits) {
  const text = cp.execFileSync("git", ["show", `${commit}:src/data/content.ts`], { encoding: "utf8", maxBuffer: 20e6 });
  for (const unit of units) try {
    const slides = lesson(text, unit);
    if (!slides) continue;
    const hash = crypto.createHash("sha256").update(JSON.stringify(slides)).digest("hex");
    if (!versions[unit].has(hash)) versions[unit].set(hash, { hash, commit, slides, revisions: 0 });
    versions[unit].get(hash).revisions++;
  } catch { failures[unit]++; }
}
fs.mkdirSync("supabase-export", { recursive: true });
const result = Object.fromEntries(units.map(unit => [unit, { failures: failures[unit], versions: [...versions[unit].values()] }]));
fs.writeFileSync("supabase-export/quiz-definition-history.json", JSON.stringify(result, null, 2));
console.log(JSON.stringify(Object.fromEntries(units.map(unit => [unit, { failures: failures[unit], versions: result[unit].versions.map(version => ({ hash: version.hash, commit: version.commit, slides: version.slides.length, revisions: version.revisions, slide32: version.slides[31]?.heading })) }])), null, 2));
