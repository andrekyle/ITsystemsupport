// Run after prepare-lesson-recovery.mjs with the same two CSV arguments.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { readCsv } from './recovery-csv.mjs';

const [workFile, definitionsFile] = process.argv.slice(2);
const work = readCsv(workFile), definitions = readCsv(definitionsFile);
const db = new PGlite();
const md5 = text => crypto.createHash('md5').update(text).digest('hex');
await db.exec(`create role anon; create role authenticated;
  create table app_state(tenant_id text,user_id uuid,key text,value text,updated_at timestamptz,
    primary key(tenant_id,user_id,key));
  create table shared_state(tenant_id text,key text,value text,primary key(tenant_id,key));`);
for (const row of work.filter(r => r.source === 'app_state')) {
  await db.query('insert into app_state values($1,$2,$3,$4,$5)',
    [row.tenant_id, row.user_id, row.key, row.value, row.updated_at]);
}
// Install the same private backup helper and safeguard used in production.
const original = fs.readFileSync('supabase/recovery/restore-missing-learner-work.sql', 'utf8');
await db.exec(original.slice(0, original.indexOf('create temporary table recovery_targets')) + '\ncommit;');
let sql = fs.readFileSync('supabase/recovery/restore-verified-lesson-progress.sql', 'utf8');
// Export contains only quiz portions, so fixture hashes replace live whole-pack hashes.
for (const d of definitions) {
  for (const [column, key] of [
    ['built_snapshot_md5', `itss.unitbuilder.${d.unit_id}.shared`],
    ['edits_snapshot_md5', `itss.lessonedits.${d.unit_id}`],
  ]) {
    if (!d[column] || d[column] === 'null') continue;
    const fixture = JSON.stringify({ fixture: key });
    await db.query('insert into shared_state values($1,$2,$3)', ['investec', key, fixture]);
    sql = sql.replaceAll(d[column], md5(fixture));
  }
}
const snapshot = async () => (await db.query('select * from app_state order by tenant_id,user_id,key')).rows;
const before = await snapshot();
const output = await db.exec(sql);
const report = output.find(r => r.fields.some(f => f.name === 'added_slide_gates')).rows;
assert.equal(report.length, 9);
assert.equal(report.reduce((n, r) => n + r.added_slide_gates, 0), 173);
assert.equal(report.filter(r => r.training_stage_added).length, 6);
assert(report.every(r => r.result === 'Verified lesson progress restored'));
function preserveLeaves(old, updated) {
  if (old !== null && typeof old === 'object' && !Array.isArray(old)) {
    for (const key of Object.keys(old)) preserveLeaves(old[key], updated[key]);
  } else assert.deepEqual(updated, old);
}
const after = await snapshot();
for (const old of before) {
  const updated = after.find(r => r.tenant_id === old.tenant_id && r.user_id === old.user_id && r.key === old.key);
  if (old.key.startsWith('itss.progress.')) preserveLeaves(JSON.parse(old.value), JSON.parse(updated.value));
  else assert.deepEqual(updated, old);
}
const backupBeforeRerun = (await db.query('select * from learner_recovery_private.progress_backup order by user_id,key')).rows;
assert(backupBeforeRerun.length > 0);
await db.exec(sql);
assert.deepEqual(await snapshot(), after);
assert.deepEqual((await db.query('select * from learner_recovery_private.progress_backup order by user_id,key')).rows, backupBeforeRerun);
// A new saved answer prevents applying its outdated evidence plan.
const firstQuiz = work.find(r => r.learner === 'Mpumelelo Hlongwane' && r.key.endsWith('.114046') && r.key.startsWith('itss.lessonquiz.'));
await db.query('update app_state set value=$1 where tenant_id=$2 and user_id=$3 and key=$4',
  [firstQuiz.value + ' ', firstQuiz.tenant_id, firstQuiz.user_id, firstQuiz.key]);
const skipped = (await db.exec(sql)).find(r => r.fields.some(f => f.name === 'added_slide_gates')).rows;
assert(skipped.some(r => r.learner === firstQuiz.learner && r.unit_id === '114046' && r.result.startsWith('Skipped:')));
// A changed quiz definition aborts the entire repair transaction.
await db.query('update shared_state set value=$1 where key=$2', ['{}', 'itss.unitbuilder.114046.shared']);
const beforeFailure = await snapshot();
await assert.rejects(db.exec(sql), /Unit content changed/);
await db.exec('rollback;');
assert.deepEqual(await snapshot(), beforeFailure);
console.log('Passed: 173 gates, six training stages, all existing values preserved, immutable backups, idempotence, changed-answer skip, changed-definition rollback.');
await db.close();
