// Usage: node scripts/prepare-lesson-recovery.mjs <learner-export.csv> <quiz-definitions.csv>
// Writes a reviewable SQL repair and summary, never the learner answers.
import fs from 'node:fs';
import crypto from 'node:crypto';
import ts from 'typescript';
import { readCsv } from './recovery-csv.mjs';
const md5 = value => crypto.createHash('md5').update(value).digest('hex');
const owners = {
  'Anele Khanyile': '6ac4a7ae-93ff-46cf-bba0-e3eb925c2c59',
  'Mpumelelo Hlongwane': 'b4080237-546b-42a4-beb7-c8e55812f4f9',
  'Ntokozo Ngcobo': '0167b875-b652-4bfd-aa52-86a7442c8ba5',
  'Pontsho Molekane': 'fdc7dbcb-d492-4045-ba81-aaad6ef50f26',
};

// Load only the repository's literal default CONTENT. No app/browser bootstrap.
const contentSource = fs.readFileSync('src/data/content.ts', 'utf8')
  .replace(/import \{ readBuiltUnit \} from "\.\.\/lib\/builtUnits";/, 'const readBuiltUnit = () => undefined;');
const compiled = ts.transpileModule(contentSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { CONTENT } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));

const [workFile, definitionsFile] = process.argv.slice(2);
if (!workFile || !definitionsFile) throw new Error('Supply learner-export.csv and quiz-definitions.csv.');
const work = readCsv(workFile), definitions = readCsv(definitionsFile);
if (!work[0]?.learner || !definitions[0]?.unit_id) throw new Error('Wrong CSV export supplied.');
for (const d of definitions) {
  for (const field of ['built_snapshot_md5', 'edits_snapshot_md5', 'revision']) {
    if (!d[field] || d[field] === 'null') d[field] = null;
  }
}
const plain = text => String(text ?? '').replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]*>/g, '')
  .replace(/&#(x[0-9a-f]+|\d+);/gi, (_, n) => String.fromCodePoint(n[0].toLowerCase() === 'x' ? parseInt(n.slice(1), 16) : Number(n)))
  .replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, n) => ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' })[n]);
const comparable = text => plain(text).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
function expectedAnswer(question, heading) {
  if (!Array.isArray(question.options) || !Number.isInteger(question.answer)
    || question.answer < 0 || question.answer >= question.options.length) return -1;
  if (!/\b(?:main\s+)?(?:topic|title|subject)\b/i.test(question.q)) return question.answer;
  const matches = question.options.flatMap((option, index) => comparable(option) === comparable(heading) ? [index] : []);
  return matches.length === 1 ? matches[0] : question.answer;
}
const plan = [], summaries = [];
for (const row of work.filter(r => r.source === 'app_state' && r.user_id === owners[r.learner] && r.key.startsWith('itss.lessonquiz.'))) {
  const unit = row.key.split('.').slice(3).join('.');
  const definition = definitions.find(d => d.unit_id === unit);
  if (!definition) throw new Error('Missing quiz definition for ' + unit);
  const edits = JSON.parse(definition.quiz_edits);
  const base = definition.built_snapshot_md5 ? JSON.parse(definition.built_lesson_quizzes) : CONTENT[unit]?.lesson;
  if (!base?.length) { summaries.push({ learner: row.learner, unit, status: 'No quiz content available; no repair generated' }); continue; }
  const sections = base.map((section, index) => ({ heading: edits.headings?.[index] ?? section.heading, slideQuiz: edits.generatedQuizzes?.[index] ?? section.slideQuiz ?? [] }));
  const state = JSON.parse(row.value);
  const passed = sections.flatMap((section, index) => {
    const answers = state.answers?.[index];
    return section.slideQuiz.length && Array.isArray(answers) && answers.length === section.slideQuiz.length
      && section.slideQuiz.every((q, i) => expectedAnswer(q, section.heading) >= 0 && answers[i] === expectedAnswer(q, section.heading)) ? [index] : [];
  });
  const progressRow = work.find(r => r.source === 'app_state' && r.user_id === row.user_id && r.key === 'itss.progress.' + row.profile_id);
  if (!progressRow) throw new Error('Missing destination progress for ' + row.learner);
  const currentUnit = JSON.parse(progressRow.value).units?.[unit];
  const stepRow = work.find(r => r.source === 'app_state' && r.user_id === row.user_id && r.key === 'itss.lessonstep.' + row.profile_id + '.' + unit);
  const final = sections.length - 1;
  // An out-of-range saved position can refer to an older version of the unit.
  // Only add training credit when the current final quiz itself is verified.
  const training = !!stepRow && Number(JSON.parse(stepRow.value)) === final
    && sections[final].slideQuiz.length > 0 && passed.includes(final);
  const newGates = passed.filter(i => !(('slidegate.' + i) in (currentUnit?.logbook ?? {})));
  const newTraining = training && !Object.hasOwn(currentUnit?.activities ?? {}, 'Lesson & Training Aids');
  summaries.push({ learner: row.learner, unit, saved_slides: Object.keys(state.answers ?? {}).length,
    verified_passed_slides: passed.length, missing_gates: newGates.length, training_stage_to_add: newTraining });
  if (!newGates.length && !newTraining) continue;
  plan.push({ learner: row.learner, profile_id: row.profile_id, owner: row.user_id, unit,
    quiz_key: row.key, quiz_md5: md5(row.value), step_key: stepRow?.key ?? null,
    step_md5: stepRow ? md5(stepRow.value) : null, built_md5: definition.built_snapshot_md5 || null,
    edits_md5: definition.edits_snapshot_md5 || null,
    patch: { units: { [unit]: { activities: newTraining ? { 'Lesson & Training Aids': true } : {},
      logbook: Object.fromEntries(newGates.map(i => ['slidegate.' + i, true])) } } } });
}
const planJson = JSON.stringify(plan);
if (planJson.includes('$recovery_plan$')) throw new Error('Unsafe SQL delimiter.');
const sql = `-- Generated by scripts/prepare-lesson-recovery.mjs from the reviewed exports.
-- Rebuilds only independently verified passed slide gates and training stages.
-- Does not invent answers, quiz scores, assessment results, or whole-unit completion.
-- Close learner app tabs first. Run the ENTIRE script; choose Run without RLS.
-- Requires the previously installed recovery backup table and private helper.
begin;
set local lock_timeout = '10s';
set local statement_timeout = '60s';
lock table public.app_state in share row exclusive mode;
lock table public.shared_state in share mode;
create temporary table lesson_recovery_result (
  learner text, unit_id text, result text, added_slide_gates integer,
  training_stage_added boolean
) on commit drop;
do $repair$
declare
  item jsonb;
  current_text text;
  merged jsonb;
  result_unit jsonb;
  prior_unit jsonb;
  added integer;
  training_added boolean;
  current_md5 text;
begin
  for item in select value from jsonb_array_elements($recovery_plan$${planJson}$recovery_plan$::jsonb) loop
    select md5(value) into current_md5 from public.app_state
      where tenant_id = 'investec' and user_id = (item ->> 'owner')::uuid
        and key = item ->> 'quiz_key';
    if current_md5 is distinct from item ->> 'quiz_md5' then
      insert into lesson_recovery_result values (item ->> 'learner', item ->> 'unit', 'Skipped: saved quiz changed; export again', 0, false);
      continue;
    end if;
    select md5(value) into current_md5 from public.shared_state
      where tenant_id = 'investec' and key = 'itss.unitbuilder.' || (item ->> 'unit') || '.shared';
    if current_md5 is distinct from item ->> 'built_md5' then
      raise exception 'Unit content changed for %. No repairs committed.', item ->> 'unit';
    end if;
    select md5(value) into current_md5 from public.shared_state
      where tenant_id = 'investec' and key = 'itss.lessonedits.' || (item ->> 'unit');
    if current_md5 is distinct from item ->> 'edits_md5' then
      raise exception 'Quiz definitions changed for %. No repairs committed.', item ->> 'unit';
    end if;
    -- The final-slide position must still be the reviewed one before adding training credit.
    if (item #> array['patch','units',item ->> 'unit','activities']) ? 'Lesson & Training Aids' then
      select md5(value) into current_md5 from public.app_state
        where tenant_id = 'investec' and user_id = (item ->> 'owner')::uuid and key = item ->> 'step_key';
      if current_md5 is distinct from item ->> 'step_md5' then
        insert into lesson_recovery_result values (item ->> 'learner', item ->> 'unit', 'Skipped: lesson position changed; export again', 0, false);
        continue;
      end if;
    end if;
    select value into strict current_text from public.app_state
      where tenant_id = 'investec' and user_id = (item ->> 'owner')::uuid
        and key = 'itss.progress.' || (item ->> 'profile_id');
    if jsonb_typeof(current_text::jsonb -> 'units') is distinct from 'object' then
      raise exception 'Unexpected progress format for %.', item ->> 'learner';
    end if;
    insert into learner_recovery_private.progress_backup
      (batch_id,tenant_id,user_id,key,value,updated_at)
    select '2026-10-16-verified-lessons-v2',tenant_id,user_id,key,value,updated_at
      from public.app_state where tenant_id = 'investec' and user_id = (item ->> 'owner')::uuid
        and key in ('itss.progress.' || (item ->> 'profile_id'), item ->> 'quiz_key', item ->> 'step_key')
    on conflict do nothing;
    merged := learner_recovery_private.keep_missing_fields(current_text::jsonb, item -> 'patch');
    prior_unit := coalesce(current_text::jsonb #> array['units',item ->> 'unit'], '{}'::jsonb);
    result_unit := merged #> array['units',item ->> 'unit'];
    select count(*) into added from jsonb_each(coalesce(result_unit -> 'logbook','{}'::jsonb)) e
      where e.key like 'slidegate.%' and e.value = 'true'::jsonb
        and not (coalesce(prior_unit -> 'logbook','{}'::jsonb) ? e.key);
    training_added := coalesce(result_unit #>> '{activities,Lesson & Training Aids}', 'false') = 'true'
      and coalesce(prior_unit #>> '{activities,Lesson & Training Aids}', 'false') <> 'true';
    if merged is distinct from current_text::jsonb then
      update public.app_state set value = merged::text,updated_at = now()
        where tenant_id = 'investec' and user_id = (item ->> 'owner')::uuid
          and key = 'itss.progress.' || (item ->> 'profile_id');
    end if;
    insert into lesson_recovery_result values (item ->> 'learner',item ->> 'unit',
      case when merged is distinct from current_text::jsonb then 'Verified lesson progress restored'
        else 'Already present; current values preserved' end,added,training_added);
  end loop;
end;
$repair$;
select * from lesson_recovery_result order by learner,unit_id;
commit;
`;
fs.writeFileSync('supabase/recovery/restore-verified-lesson-progress.sql', sql);
const report = ['# Verified lesson recovery preview', '', 'Only passed slide gates and the training stage can be reconstructed from these records. Other assessment stages are not inferred.', '',
  '| Learner | Unit | Saved slides | Verified passed slides | Missing gates | Training stage to add |',
  '| --- | --- | ---: | ---: | ---: | --- |',
  ...summaries.map(s => `| ${s.learner} | ${s.unit} | ${s.saved_slides ?? 0} | ${s.verified_passed_slides ?? 0} | ${s.missing_gates ?? 0} | ${s.training_stage_to_add ?? s.status} |`), ''];
fs.writeFileSync('supabase/recovery/verified-lesson-recovery-preview.md', report.join('\n'));
console.log(JSON.stringify({ reviewed_units: summaries.length, repair_rows: plan.length,
  added_gates: summaries.reduce((n, s) => n + (s.missing_gates ?? 0), 0),
  training_stages: summaries.filter(s => s.training_stage_to_add).length, summary: summaries }));
