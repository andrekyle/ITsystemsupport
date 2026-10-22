-- Read-only: recover quiz definitions from older saved unit versions.
-- Needed where saved answers no longer match the current lesson content.
-- Does not export attached files, change course content, or credit completion.
with units(unit_id) as (
  values ('114046'), ('114055'), ('114059'), ('114074')
), packs as (
  select u.unit_id, s.value::jsonb as pack, md5(s.value) as current_pack_md5
  from units u join public.shared_state s
    on s.tenant_id = 'investec'
    and s.key = 'itss.unitbuilder.' || u.unit_id || '.shared'
), versions as (
  select p.unit_id, p.current_pack_md5, v.version, v.position
  from packs p
  cross join lateral jsonb_array_elements(
    case when jsonb_typeof(p.pack -> 'history') = 'array'
      and jsonb_array_length(p.pack -> 'history') > 0 then p.pack -> 'history'
    when jsonb_typeof(p.pack -> 'previous') = 'object'
      then jsonb_build_array(p.pack -> 'previous')
    else '[]'::jsonb end
  ) with ordinality as v(version, position)
)
select unit_id, current_pack_md5, position as archived_version,
  version ->> 'revision' as revision, version ->> 'createdAt' as created_at,
  (select jsonb_agg(jsonb_build_object(
    'heading', section -> 'heading',
    'slideQuiz', coalesce(section -> 'slideQuiz', '[]'::jsonb)
  ) order by section_index)
   from jsonb_array_elements(coalesce(version #> '{content,lesson}', '[]'::jsonb))
     with ordinality as lessons(section, section_index)) as archived_lesson_quizzes
from versions order by unit_id, position;
