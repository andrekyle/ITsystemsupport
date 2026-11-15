// Process one learner at a time. Outputs stay in ignored, private supabase-export.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { savedAcademicWorkHtml, savedLessonAnswers, savedWorkbookAnswers, type LessonQuizEvidence } from '../src/lib/academicEvidence';
import { parseLessonQuizState } from '../src/lib/lessonQuizProgress';
import { recoverLegacyQuizContext, verifyLegacyQuizSource } from '../src/lib/legacyQuizRecovery';
import { mergeProgressEvidence } from '../src/lib/progressEvidence';
import { WORKBOOK_SPECS } from '../src/data/workbookSpecs';
import type { ProgressState } from '../src/types';

type Row = { tenant_id: string; key: string; value: string; user_id?: string; updated_at: string };
type Profile = { id: string; name: string; role: string; cloudUserId?: string };
const root = 'supabase-export/all-learners';
const snapshot: { rows: Row[]; shared: Row[]; capturedAt: string } = JSON.parse(fs.readFileSync(`${root}/source-snapshot.json`, 'utf8'));
const learners = new Map<string, { tenant: string; profile: Profile }>();
for (const row of snapshot.rows.filter(row => row.key === 'itss.profiles')) {
  for (const profile of JSON.parse(row.value) as Profile[]) {
    if (profile.role === 'Learner') learners.set(`${row.tenant_id}:${profile.id}`, { tenant: row.tenant_id, profile });
  }
}
const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const summary: object[] = [];
const usedRows = new Set<Row>();
const sourceConfirmed = new Map<string, boolean>();
for (const { tenant, profile } of [...learners.values()].sort((a, b) => a.profile.name.localeCompare(b.profile.name))) {
  const ids = [profile.id, profile.cloudUserId].filter(Boolean);
  const rows = snapshot.rows.filter(row => row.tenant_id === tenant && ids.some(id => row.key === `itss.progress.${id}` || row.key.startsWith(`itss.lessonquiz.${id}.`)));
  let progress: ProgressState = { units: {} };
  const lessons: LessonQuizEvidence = {};
  let recoveredQuizzes = 0;
  let preservedSelections = 0;
  let readableSelections = 0;
  let unavailableSelections = 0;
  const units: object[] = [];
  for (const row of rows) {
    usedRows.add(row);
    if (row.key.startsWith('itss.progress.')) {
      progress = mergeProgressEvidence(progress, JSON.parse(row.value));
      continue;
    }
    const unit = row.key.split('.').slice(3).join('.');
    const original = parseLessonQuizState(row.value);
    const cacheKey = `${tenant}:${unit}`;
    if (!sourceConfirmed.has(cacheKey)) sourceConfirmed.set(cacheKey, await verifyLegacyQuizSource(unit, snapshot.shared.filter(row => row.tenant_id === tenant)));
    const recovered = recoverLegacyQuizContext(unit, original, sourceConfirmed.get(cacheKey));
    assert.deepEqual(recovered.answers, original.answers, 'Raw answers changed');
    assert.deepEqual(recovered.checked, original.checked, 'Completion flags changed');
    assert.deepEqual(recovered.attempts, original.attempts, 'Attempts changed');
    assert.equal(JSON.stringify(parseLessonQuizState(row.value)), JSON.stringify(original), 'Original record mutated');
    const before = savedLessonAnswers([original]);
    const after = savedLessonAnswers([recovered]);
    assert.equal(after.length, before.length, `Selection count changed for ${profile.id}/${unit}`);
    const readable = after.filter(answer => !answer.legacy).length;
    const unavailable = after.length - readable;
    recoveredQuizzes += recovered.recoveredSlides?.length ?? 0;
    preservedSelections += after.length;
    readableSelections += readable;
    unavailableSelections += unavailable;
    units.push({ unit, selections: after.length, readable, unavailable, recoveredQuizzes: recovered.recoveredSlides?.length ?? 0 });
    (lessons[unit] ??= []).push(recovered);
  }
  const workbookAnswers = Object.values(progress.units).reduce((count, unit) => count + savedWorkbookAnswers(unit).length, 0);
  const sections = [...new Set([...Object.keys(progress.units), ...Object.keys(lessons)])].map(unit => {
    const html = savedAcademicWorkHtml(progress.units[unit], WORKBOOK_SPECS[unit], lessons[unit]);
    return html ? `<section><h2>Unit ${escape(unit)}</h2>${html}</section>` : '';
  }).join('\n');
  assert(!/Learner.s selection: (?:Saved )?Option \d+/.test(sections), 'Numeric placeholders exposed');
  const filename = `${tenant}-${profile.id}.html`.replace(/[^\w.-]/g, '-');
  fs.writeFileSync(`${root}/${filename}`, `<!doctype html><html lang="en"><meta charset="utf-8"><title>${escape(profile.name)} — saved work</title><style>body{font:15px/1.5 system-ui;max-width:1000px;margin:40px auto;padding:20px}section{border-top:1px solid #aaa;margin-top:28px}.answer{white-space:pre-wrap;background:#f3f5f7;padding:12px}.q{margin:20px 0}.q-text{font-weight:600}</style><h1>${escape(profile.name)}</h1><p>${workbookAnswers} workbook answers; ${preservedSelections} lesson-quiz selections preserved. ${readableSelections} selections have verified question/answer text; ${unavailableSelections} need original source recovery.</p><p>Saved completion flags and attempts are preserved. No historical scores have been calculated. Snapshot: ${escape(snapshot.capturedAt)}.</p>${sections}</html>`);
  summary.push({ tenant, learner: profile.name, profileId: profile.id, report: filename, workbookAnswers, preservedSelections, readableSelections, unavailableSelections, recoveredQuizzes, units });
  // Keep private raw snapshots separate so another learner never overwrites an earlier audit.
  fs.writeFileSync(`${root}/${tenant}-${profile.id}.json`, JSON.stringify({ learner: profile.name, rows }, null, 2));
  console.log(`${profile.name}: ${recoveredQuizzes} quiz contexts recovered; ${preservedSelections} selections preserved; ${unavailableSelections} need original text.`);
}
const unmatched = snapshot.rows.filter(row => row.key !== 'itss.profiles' && !usedRows.has(row));
fs.writeFileSync(`${root}/unmatched-evidence.json`, JSON.stringify(unmatched, null, 2));
fs.writeFileSync(`${root}/review-summary.json`, JSON.stringify({ capturedAt: snapshot.capturedAt, learners: summary, unmatchedRows: unmatched.length }, null, 2));
fs.writeFileSync(`${root}/index.html`, `<!doctype html><html lang="en"><meta charset="utf-8"><title>Learner evidence review</title><style>body{font:16px/1.5 system-ui;max-width:1200px;margin:40px auto}td,th{text-align:left;padding:10px;border-bottom:1px solid #ccc}</style><h1>Learner evidence review</h1><p>Each learner was checked individually. Raw saved answers, completion flags and attempts remain unchanged. Scores were not invented.</p><table><tr><th>Learner</th><th>Workbook answers</th><th>Quiz selections</th><th>Recovered quizzes</th><th>Selections needing original text</th></tr>${(summary as any[]).map(row => `<tr><td><a href="${escape(row.report)}">${escape(row.learner)}</a></td><td>${row.workbookAnswers}</td><td>${row.preservedSelections}</td><td>${row.recoveredQuizzes}</td><td>${row.unavailableSelections}</td></tr>`).join('')}</table><p>${unmatched.length} evidence rows could not be matched to a current learner profile and were retained separately for investigation.</p></html>`);
console.log(`Reviewed ${summary.length} learners sequentially; ${unmatched.length} unmatched rows retained for investigation.`);
