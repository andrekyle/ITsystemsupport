import assert from 'node:assert/strict';
import { completeQualificationMetadata } from '../src/lib/completeQualificationMetadata';
import type { QualificationDraft } from '../src/lib/qualificationPack';
const draft: QualificationDraft = { qualification: { title: 'Management', saqaId: '59201', nqfLevel: 0, credits: -1, description: 'Management skills' }, modules: [{ name: 'Team development', description: 'Team skills', outcomes: ['Lead teams'], units: [{ us: '252034', title: 'Unit Standard 252034', nqf: 0, credits: -1, description: 'Manage teams', outcomes: ['Develop teams'] }] }], issues: [] };
const original = globalThis.fetch;
let current = draft;
const requests: string[] = [];
let fail: 'json' | 'plain-text' | false = 'json';
globalThis.fetch = async (_input, init) => {
  const body = JSON.parse(String(init?.body)); requests.push(body.us);
  if (body.kind === 'qualification') return Response.json({ metadata: { us: '59201', title: 'Generic Management', nqf: 5, credits: 162 } });
  if (fail === 'json') return Response.json({ error: 'SAQA unavailable' }, { status: 502 });
  if (fail === 'plain-text') return new Response('An error occurred while reading SAQA.', { status: 502, headers: { 'Content-Type': 'text/plain' } });
  return Response.json({ metadata: { us: '252034', title: 'Monitor and evaluate team members', nqf: 5, credits: 8 } });
};
try {
  await assert.rejects(completeQualificationMetadata(draft, 'token', 'gpt-4.1-mini', value => { current = value; }, () => {}), /252034: SAQA unavailable/);
  assert.equal(current.qualification.credits, 162, 'Completed lookups survive failure');
  fail = 'plain-text';
  await assert.rejects(
    completeQualificationMetadata(current, 'token', 'gpt-4.1-mini', () => {}, () => {}),
    /SAQA unit standard 252034 lookup failed: \/api\/unit-metadata returned HTTP 502 with text\/plain, not JSON\. Server response: "An error occurred while reading SAQA\."/,
  );
  fail = false;
  const progress: number[] = [];
  current = await completeQualificationMetadata(current, 'token', 'gpt-4.1-mini', value => { current = value; }, (_message, done, total) => { progress.push(done / total); });
  assert.deepEqual(requests, ['59201', '252034', '252034', '252034'], 'Retry skips completed records');
  assert.equal(current.modules[0].units[0].nqf, 5);
  assert.equal(current.modules[0].units[0].credits, 8);
  assert.equal(progress.at(-1), 1);
  await completeQualificationMetadata(current, 'token', 'gpt-4.1-mini', () => {}, () => {});
  assert.equal(requests.length, 4, 'Complete metadata needs no lookup on save');
  console.log('PASS: missing qualification/unit metadata, progress, partial failure and resumable lookup.');
} finally { globalThis.fetch = original; }
