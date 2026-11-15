const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
function compile(file, dependencies) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function("require", "exports", code)(id => dependencies[id] ?? {}, exports);
  return exports;
}
const rich = compile("src/lib/slideRichText.ts", {});
const slideQuiz = compile("src/lib/slideQuiz.ts", { "./slideRichText": rich });
const quiz = compile("src/lib/lessonQuizProgress.ts", { "./slideQuiz": slideQuiz });
const recoveryData = compile("src/data/verifiedLegacyQuizContext.ts", {});
const recovery = compile("src/lib/legacyQuizRecovery.ts", { "../data/verifiedLegacyQuizContext": recoveryData, "./lessonQuizProgress": quiz });
const evidence = compile("src/lib/academicEvidence.ts", { "./slideRichText": rich, "./lessonQuizProgress": quiz });
global.localStorage = { length: 0 };
const audit = JSON.parse(fs.readFileSync("supabase-export/learner-progress-audit.json", "utf8"));
const row = audit.rows.find(row => row.key.endsWith(".10135") && row.key.startsWith("itss.lessonquiz."));
const saved = { "10135": [quiz.parseLessonQuizState(row.value)] };
assert.equal(evidence.savedLessonAnswers(saved["10135"]).length, 45);
  const completed = evidence.savedLessonQuizResults(saved["10135"]);
  assert.equal(completed.filter(result => result.completed).length, 9);
  assert(completed.every(result => result.total === 5 && !("correct" in result)), "No score may be calculated from saved answers");
  const unsubmitted = structuredClone(saved["10135"][0]);
  Object.values(unsubmitted.identities.versions).forEach(version => { version.checked = false; });
  assert(evidence.savedLessonQuizResults([unsubmitted]).every(result => !result.completed), "Selections alone must not be marked completed");
  const legacy = evidence.savedLessonQuizResults([{ answers: { 0: [0, 1] }, checked: { 0: true }, attempts: {} }])[0];
  assert(legacy.completed, "Legacy checked quizzes must also show completed");
  assert(!("correct" in legacy), "A legacy quiz cannot have a fabricated score");
let state, dependencies, pendingEffect;
const requests = [];
const hook = compile("src/lib/useSavedLessonQuizzes.ts", {
  react: {
    useState(initial) { if (state === undefined) state = initial(); return [state, value => { state = typeof value === "function" ? value(state) : value; }]; },
    useEffect(effect, next) {
      if (!dependencies || next.some((value, i) => value !== dependencies[i])) { pendingEffect = effect; dependencies = next; }
    },
  },
  "./supabase": { cloudEnabled: true }, "./academicEvidence": evidence,
  "./directory": { fetchCloudLessonQuizzes(ids, receive) {
    return new Promise((resolve, reject) => requests.push({ ids, receive, resolve, reject }));
  } },
});
function render(ids, refresh = 0) {
  const value = hook.useSavedLessonQuizzes(new Set(ids), refresh);
  if (pendingEffect) { const effect = pendingEffect; pendingEffect = undefined; effect(); }
  return value;
}
async function main() {
  if (fs.existsSync("supabase-export/all-learners/source-snapshot.json")) {
    const snapshot = JSON.parse(fs.readFileSync("supabase-export/all-learners/source-snapshot.json", "utf8"));
    const shared = snapshot.shared.filter(row => row.tenant_id === "investec");
    for (const unit of ["8252", "114051", "114046", "114074", "114059"]) {
      assert(await recovery.verifyLegacyQuizSource(unit, shared), `Audited source must verify for ${unit}`);
      const sourceKey = recoveryData.VERIFIED_LEGACY_BUILT_SOURCES[unit] ? `itss.unitbuilder.${unit}.shared` : `itss.lessonedits.${unit}`;
      const source = shared.find(row => row.key === sourceKey);
      assert(!await recovery.verifyLegacyQuizSource(unit, shared.filter(row => row !== source)), "Missing source must disable recovery");
      assert(!await recovery.verifyLegacyQuizSource(unit, shared.map(row => row === source ? { ...row, value: row.value + " " } : row)), "Changed pack/edits must disable recovery");
      assert(!await recovery.verifyLegacyQuizSource(unit, [...shared, source]), "Ambiguous duplicate sources must disable recovery");
      assert(!await recovery.verifyLegacyQuizSource(unit, snapshot.shared.filter(row => row.tenant_id === "discovery")), "Other tenant course sources must not authorize recovery");
      if (recoveryData.VERIFIED_LEGACY_BUILT_SOURCES[unit] && !shared.some(row => row.key === `itss.lessonedits.${unit}`)) {
        assert(!await recovery.verifyLegacyQuizSource(unit, [...shared, { key: `itss.lessonedits.${unit}`, value: "{}" }]), "New quiz overrides must disable recovery");
      }
      const versioned = shared.find(row => row.key.startsWith(`itss.lessonedits.${unit}.built-`));
      if (versioned && recoveryData.VERIFIED_LEGACY_BUILT_SOURCES[unit]) {
        assert(!await recovery.verifyLegacyQuizSource(unit, shared.filter(row => row !== versioned)), 'Missing version-specific original definitions must disable recovery');
        assert(!await recovery.verifyLegacyQuizSource(unit, shared.map(row => row === versioned ? { ...row, value: row.value + ' ' } : row)), 'Changed version-specific definitions must disable recovery');
        assert(!await recovery.verifyLegacyQuizSource(unit, [...shared, { key: `itss.lessonedits.${unit}.built-new`, value: '{}' }]), 'New version-specific definitions must disable recovery');
      }
    }
    const originalRow = snapshot.rows.find(row => row.key === 'itss.lessonquiz.p_mrolz8et_3ary3.114059');
    const original = quiz.parseLessonQuizState(originalRow.value);
    const restored = recovery.recoverLegacyQuizContext('114059', original, await recovery.verifyLegacyQuizSource('114059', shared));
    assert.deepEqual(restored.recoveredSlides, [10, 11, 12]);
    assert(!recoveryData.VERIFIED_LEGACY_QUIZ_CONTEXT['114059'][0], 'Conflicting Slide 1 versions cannot be guessed');
    assert(!recoveryData.VERIFIED_LEGACY_QUIZ_CONTEXT['114059'][1], 'Conflicting Slide 2 versions cannot be guessed');
    assert.deepEqual(restored.answers, original.answers);
    assert.deepEqual(restored.checked, original.checked);
    assert.deepEqual(restored.attempts, original.attempts);
    assert.equal(evidence.savedLessonAnswers([restored]).length, evidence.savedLessonAnswers([original]).length);
    assert(evidence.savedLessonQuizResults([restored]).every(result => !('correct' in result)));
    const restoredText = evidence.savedLessonAnswers([restored]).filter(answer => !answer.legacy);
    assert.equal(restoredText.length, 15);
    assert(restoredText.some(answer => answer.question.includes('key metric of performance')));
    console.log('US 114059 original archived definitions recovered for Slides 11–13; conflicting versions rejected, selections and completion retained, no grades calculated.');
    console.log("Expanded recovery guards passed: audited sources only; missing, changed, duplicate, other-tenant and new override sources rejected.");
  }
  let targetSlide32;
  if (fs.existsSync("supabase-export/tsepiso-progress-audit.json")) {
    const target = JSON.parse(fs.readFileSync("supabase-export/tsepiso-progress-audit.json", "utf8"));
    const original = quiz.parseLessonQuizState(target.rows.find(row => row.key.endsWith(".114050") && row.key.startsWith("itss.lessonquiz.")).value);
    const sourceAudit = JSON.parse(fs.readFileSync("supabase-export/tsepiso-quiz-source-audit.json", "utf8"));
    assert(await recovery.verifyLegacyQuizSource("114050", sourceAudit.shared));
    assert(!await recovery.verifyLegacyQuizSource("114050", sourceAudit.shared.map(row => ({ ...row, value: row.value + " " }))), "Changed source must disable positional recovery");
    assert(!await recovery.verifyLegacyQuizSource("114050", [...sourceAudit.shared, { key: "itss.unitbuilder.114050.shared", value: "{}" }]), "A custom unit pack must disable default-source recovery");
    assert.equal(recovery.recoverLegacyQuizContext("114050", original), original, "Unverified source must never be used to relabel responses");
    const before = structuredClone(original);
    const restored = recovery.recoverLegacyQuizContext("114050", original, true);
    assert.equal(restored.recoveredSlides.length, 18);
    assert(restored.recoveredSlides.includes(31));
    assert.deepEqual(original, before, "Recovery must not mutate the saved submission");
    assert.deepEqual(restored.answers, original.answers);
    assert.deepEqual(restored.attempts, original.attempts);
    assert.deepEqual(restored.checked, original.checked);
    assert.equal(evidence.savedLessonAnswers([restored]).length, evidence.savedLessonAnswers([original]).length, "Unresolved selections must be retained alongside recovered ones");
    const question = recoveryData.VERIFIED_LEGACY_QUIZ_CONTEXT["114050"][31].questions[0];
    const restoredAnswer = evidence.savedLessonAnswers([restored]).find(answer => answer.question === question.q);
    assert.equal(restoredAnswer.answer, question.options[original.answers[31][0]]);
    targetSlide32 = evidence.savedLessonQuizResults([restored]).find(result => result.answers.some(answer => answer.question === question.q));
    assert(evidence.savedLessonQuizResults([restored]).every(result => !("correct" in result)), "Recovery must not manufacture grades");
    console.log("Tsepiso recovery passed: 18 verified original quizzes recovered, including Slide 32; all selections, attempts and completion flags retained, no scores calculated.");
  }
  assert.equal(render(["bradley"]).loading, true);
  render(["bradley"]);
  assert.equal(requests.length, 1, "Fresh directory objects with identical IDs must not restart the query");
  requests[0].receive(saved); requests[0].resolve(saved);
  await new Promise(resolve => setImmediate(resolve));
  const loaded = render(["bradley"]);
  assert.equal(loaded.loading, false);
  assert.equal(evidence.savedLessonAnswers(loaded.lessons["10135"]).length, 45);
  render(["bradley"], 1);
  const refreshing = render(["bradley"], 1);
  assert.equal(refreshing.loading, true);
  assert.equal(evidence.savedLessonAnswers(refreshing.lessons["10135"]).length, 45, "Refresh must retain known answers");
  requests[1].receive({});
  assert.equal(evidence.savedLessonAnswers(state.lessons["10135"]).length, 45, "An empty partial result must not clear known answers");
  requests[1].reject(new Error("Network unavailable"));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(render(["bradley"], 1).error, "Network unavailable");
  assert.equal(evidence.savedLessonAnswers(state.lessons["10135"]).length, 45, "A failed refresh must not erase saved answers");
  assert.deepEqual(render(["different-student"]).lessons, {}, "Switching students must not expose the previous learner's work");
  const lookups = [];
  const directory = compile("src/lib/directory.ts", {
    "./legacyQuizRecovery": recovery,
    "./lessonQuizProgress": quiz, "./tenant": { TENANT_ID: row.tenant_id },
    "./supabase": { supabase: { from() {
      return { select() { return this; }, eq() { return this; }, like(key, prefix) { this.prefix = prefix; return this; },
        order() { return this; }, range() { return this; }, abortSignal() {
          return new Promise(resolve => lookups.push({ prefix: this.prefix, resolve }));
        } };
    } } },
  });
  const id = row.key.split(".")[2];
  const lookup = directory.fetchCloudLessonQuizzes([id, "old-profile-id"]);
  assert.equal(lookups.length, 2, "Linked identities must load concurrently rather than block each other");
  lookups.find(query => query.prefix.includes(id)).resolve({ data: [row], error: null });
  lookups.find(query => !query.prefix.includes(id)).resolve({ data: [], error: null });
  const retrieved = await lookup;
  assert.equal(evidence.savedLessonAnswers(retrieved["10135"]).length, 45, "The actual cloud query/parser must retain Bradley's saved US 10135 selections");
  if (fs.existsSync('supabase-export/all-learners/source-snapshot.json')) {
    const snapshot = JSON.parse(fs.readFileSync('supabase-export/all-learners/source-snapshot.json', 'utf8'));
    const archivedRow = snapshot.rows.find(row => row.key === 'itss.lessonquiz.p_mrolz8et_3ary3.114059');
    let queriedVersions = false;
    const archivedDirectory = compile('src/lib/directory.ts', {
      './legacyQuizRecovery': recovery, './lessonQuizProgress': quiz, './tenant': { TENANT_ID: 'investec' },
      './supabase': { supabase: { from(table) {
        return { select() { return this; }, eq() { return this; }, like() { return this; }, order() { return this; }, range() { return this; },
          or(filter) { queriedVersions = filter.includes('key.like.itss.lessonedits.114059.built-%'); return this; },
          async abortSignal() { return { data: table === 'shared_state' ? snapshot.shared.filter(row => row.tenant_id === 'investec' && (row.key.startsWith('itss.lessonedits.114059.') || row.key === 'itss.lessonedits.114059' || row.key === 'itss.unitbuilder.114059.shared')) : [archivedRow], error: null }; }
        };
      } } },
    });
    const recovered = await archivedDirectory.fetchCloudLessonQuizzes(['p_mrolz8et_3ary3']);
    assert(queriedVersions, 'The real cloud path must fetch the original version-specific edits');
    assert.deepEqual(recovered['114059'][0].recoveredSlides, [10, 11, 12]);
    assert.equal(evidence.savedLessonAnswers(recovered['114059']).length, 50);
  }
  // Render the actual academic record with Bradley's real saved work and an
  // unmatched current catalogue, reproducing the screenshot's situation.
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const page = ts.createSourceFile("People.tsx", fs.readFileSync("src/pages/People.tsx", "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const record = page.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === "AcademicRecord");
  const answerViews = page.statements.filter(node => ts.isFunctionDeclaration(node) && ["LessonQuizReview", "QuizAnswers", "ExerciseAnswers"].includes(node.name?.text)).map(node => node.getText(page)).join("\n");
  const code = ts.transpileModule(`export ${record.getText(page)}\n${answerViews}\nexport { LessonQuizReview };`, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const progressRow = audit.rows.find(row => row.key.startsWith("itss.progress."));
  const progress = { units: { "10135": JSON.parse(progressRow.value).units["10135"] } };
  const unit = { us: "10135", title: "Work as a project team member" };
  const catalogue = { quiz: [], quizzes: Array.from({ length: 4 }, (_, index) => ({ id: `new-quiz-${index}`, title: `Current quiz ${index + 1}`, questions: [{ q: "Reference question", options: ["A", "B"], answer: 0 }] })),
    exercises: Array.from({ length: 3 }, (_, index) => ({ id: `new-exercise-${index}`, title: `Current exercise ${index + 1}`, steps: ["Reference exercise"], checks: ["Reference exercise"] })) };
  const bindings = { ...evidence, useState: React.useState, useEffect: React.useEffect,
    useAssignments: () => ({}), useWorkbookMemo: () => [{ items: [] }], loadProgress: () => progress,
    cloudEnabled: true, cloudProfileIds: () => new Set([id]), useSavedLessonQuizzes: () => ({ lessons: saved, loading: false, error: "" }),
    getCourses: () => [{ id: "itss", modules: [{ units: [unit] }] }], canSeeCourse: () => true, isAdminRole: () => true,
    getContent: () => catalogue, WORKBOOK_SPECS: {}, Icon: () => null, usLabel: value => `US ${value}` };
  const component = {};
  new Function(...Object.keys(bindings), "require", "exports", code)(...Object.values(bindings), require, component);
  const html = renderToStaticMarkup(React.createElement(component.AcademicRecord, { student: { id, name: audit.learner }, viewer: { role: "Admin" } }));
  if (targetSlide32) {
    const targetHtml = renderToStaticMarkup(React.createElement(component.LessonQuizReview, { answers: targetSlide32.answers }));
    assert(targetHtml.includes("Data") || targetHtml.includes("data"));
    assert(targetHtml.includes('class="quiz-options"'));
    assert(targetHtml.includes("learner&#x27;s pick"));
    assert(!targetHtml.includes("Answer text unavailable"));
    assert(!targetHtml.includes("Saved option"));
    assert(!targetHtml.includes("100%"));
  }
  assert(html.includes("19 workbook answers"));
  assert(html.includes("45 saved lesson-quiz answers"));
  assert(html.includes("9 lesson quizzes completed"));
  assert(!html.includes("Current course reference activities"), "The full activity list must remain visible");
  assert.equal((html.match(/Completed — score not recorded/g) ?? []).length, 9, "Every completed lesson quiz must explicitly state that no score was recorded");
  assert(!html.includes("100%"), "A perfect selection match must not create a submission percentage");
  const savedQuizReview = html.slice(html.indexOf("Lesson quiz —"), html.indexOf("Current quiz 1"));
  assert(savedQuizReview.includes("Question 1"));
  assert(savedQuizReview.includes("learner&#x27;s pick"));
  assert(savedQuizReview.includes('class="quiz-option correct right-pick"'));
  assert(!savedQuizReview.includes("workbook-learner-answer-text"), "Completed quizzes must use quiz options rather than workbook text boxes");
  assert(html.includes("Current quiz 1"));
  assert(html.includes("Current exercise 1"));
  const allSaved = html.slice(html.indexOf('>Saved lesson quizzes</span>'));
  assert(allSaved.includes('class="quiz-options"'), "The aggregate saved-quiz section must use the same option review layout");
  assert(!allSaved.includes('class="workbook-learner-answer-text"'), "Saved quizzes must not use workbook answer boxes");
  const researchRow = audit.rows.find(row => row.key.endsWith(".114076") && row.key.startsWith("itss.lessonquiz."));
  const researchAnswers = evidence.savedLessonAnswers([quiz.parseLessonQuizState(researchRow.value)]);
  assert.equal(researchAnswers.length, 105);
  const researchHtml = renderToStaticMarkup(React.createElement(component.LessonQuizReview, { answers: researchAnswers }));
  assert(researchHtml.includes("Which data forms are primarily used in qualitative research according to the slide?"));
  assert(researchHtml.includes("Graphs and charts"));
  assert(!researchHtml.includes("wrong-pick"), "Without a saved answer key, selected answers must not be graded as wrong");
  assert(!researchHtml.includes("workbook-learner-answer-text"));
  assert(!researchHtml.includes("100%"));
  const recordedProgress = structuredClone(progress);
  recordedProgress.units["10135"].quiz = { best: 2, total: 5, attempts: 3 };
  const recordedBindings = { ...bindings, loadProgress: () => recordedProgress };
  const recordedComponent = {};
  new Function(...Object.keys(recordedBindings), "require", "exports", code)(...Object.values(recordedBindings), require, recordedComponent);
  const recordedHtml = renderToStaticMarkup(React.createElement(recordedComponent.AcademicRecord, { student: { id, name: audit.learner }, viewer: { role: "Admin" } }));
  assert(recordedHtml.includes("Completed · 2/5 · 40%"), "An explicitly saved submission score must still display unchanged");
  assert(recordedHtml.includes("3 attempt"));
  const legacyBindings = { ...bindings, useSavedLessonQuizzes: () => ({ lessons: { "10135": [{ answers: { 57: [1, 2, 0, 1, 0] }, checked: { 57: true }, attempts: { 57: 2 } }] }, loading: false, error: "" }) };
  const legacyComponent = {};
  new Function(...Object.keys(legacyBindings), "require", "exports", code)(...Object.values(legacyBindings), require, legacyComponent);
  const legacyHtml = renderToStaticMarkup(React.createElement(legacyComponent.AcademicRecord, { student: { id, name: audit.learner }, viewer: { role: "Admin" } }));
  const legacyReview = legacyHtml.slice(legacyHtml.indexOf("Lesson quiz —"), legacyHtml.indexOf("Current quiz 1"));
  assert(legacyReview.includes("Lesson quiz — Slide 58"));
  assert(!legacyReview.includes("Lesson quiz — Lesson quiz"));
  assert(!legacyReview.includes("Question 1"), "Missing original questions must not be replaced with fabricated question rows");
  assert(legacyReview.includes("Answer text unavailable."));
  assert(!legacyReview.includes("Learner’s selection: Option"), "Option numbers alone must not be presented as student answer text");
  if (process.env.ACADEMIC_VIEW_FIXTURE) {
    const path = require("node:path");
    const output = path.resolve(process.env.ACADEMIC_VIEW_FIXTURE);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, `<!doctype html><html data-theme="dark"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${fs.readFileSync("src/styles.css", "utf8")}body{padding:20px}</style><body>${legacyHtml}<pre id="result"></pre><script>
      requestAnimationFrame(() => requestAnimationFrame(() => {
        try {
          for (const row of document.querySelectorAll('.attempt-row.acad')) {
            const cells = [...row.querySelectorAll(':scope > .cell')];
            for (const cell of cells) for (const chip of cell.querySelectorAll('.chip')) {
              if (chip.getBoundingClientRect().right > cell.getBoundingClientRect().right + 1) throw new Error('Chip overflows its cell: ' + chip.textContent);
            }
            if (cells.length > 1 && cells[0].textContent.trim() && cells[1].textContent.trim()) {
              const score = cells[0].getBoundingClientRect(), attempts = cells[1].getBoundingClientRect();
              const sameLine = Math.min(score.bottom, attempts.bottom) > Math.max(score.top, attempts.top) + 1;
              if (sameLine && score.right > attempts.left + 1) throw new Error('Score overlaps attempts');
            }
          }
          document.body.dataset.result = 'passed'; document.getElementById('result').textContent = 'PASS: academic status/attempt columns do not overlap at ' + innerWidth + 'px';
        } catch (error) { document.body.dataset.result = 'failed'; document.getElementById('result').textContent = String(error); }
      }));
    </script></body></html>`);
  }
  console.log("Academic record rendering passed: nine completed lesson quizzes show score not recorded; no calculated scores or percentages.");
  console.log("Lesson-quiz loading checks passed: 45 real US 10135 answers, stable lookup, retained answers during refresh/failure, and student isolation.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
