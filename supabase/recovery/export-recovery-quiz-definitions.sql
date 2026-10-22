-- Read-only: export the live quiz definitions needed to verify the learners'
-- saved slide answers before rebuilding progress. No files or images exported.
-- No completed activity is inferred from a lesson position or checked flag.
with learner_ids(profile_id) as (
  values ('p_mrom4usy_le6ki'), ('p_mrom65g0_ho04y'),
         ('p_mromq49w_0jfmq'), ('p_mrom0udn_jcpeg')
), units as (
  select distinct split_part(s.key, '.', 4) as unit_id
  from public.app_state s join learner_ids l
    on split_part(s.key, '.', 3) = l.profile_id
  where s.tenant_id = 'investec' and s.key like 'itss.lessonquiz.%'
), definitions as (
  select u.unit_id, b.value as built_raw, b.value::jsonb as built,
    e.value as edits_raw, e.value::jsonb as edits
  from units u
  left join public.shared_state b on b.tenant_id = 'investec'
    and b.key = 'itss.unitbuilder.' || u.unit_id || '.shared'
  left join public.shared_state e on e.tenant_id = 'investec'
    and e.key = 'itss.lessonedits.' || u.unit_id
)
select unit_id,
  case when built is null then 'Use repository default content with these edits'
    else 'Use saved unit content with these edits' end as content_source,
  built ->> 'revision' as revision,
  md5(built_raw) as built_snapshot_md5, md5(edits_raw) as edits_snapshot_md5,
  (select jsonb_agg(jsonb_build_object(
    'heading', section -> 'heading',
    'slideQuiz', coalesce(section -> 'slideQuiz', '[]'::jsonb)
  ) order by position)
   from jsonb_array_elements(coalesce(built #> '{content,lesson}', '[]'::jsonb))
     with ordinality as lessons(section, position)) as built_lesson_quizzes,
  jsonb_build_object(
    'headings', coalesce(edits -> 'headings', '{}'::jsonb),
    'generatedQuizzes', coalesce(edits -> 'generatedQuizzes', '{}'::jsonb)
  ) as quiz_edits
from definitions order by unit_id;
