-- Read-only. Lists current course units and recoverable saved versions.
-- Run in the project's Supabase SQL editor. No learner answers are selected.
with packs as (
  select tenant_id, key, updated_at, value::jsonb as pack,
    regexp_replace(regexp_replace(key, '^itss\.unitbuilder\.', ''), '\.(shared|deleted-backup)$', '') as unit_id
  from public.shared_state
  where key ~ '^itss\.unitbuilder\..+\.(shared|deleted-backup)$'
), versions as (
  select tenant_id, unit_id, updated_at,
    case when key like '%.deleted-backup' then 'deleted-build backup' else 'current published unit' end as source,
    pack as version
  from packs
  union all
  select p.tenant_id, p.unit_id, p.updated_at, 'saved history ' || h.position::text, h.version
  from packs p cross join lateral jsonb_array_elements(
    case when jsonb_typeof(p.pack -> 'history') = 'array' then p.pack -> 'history'
      when jsonb_typeof(p.pack -> 'previous') = 'object' then jsonb_build_array(p.pack -> 'previous')
      else '[]'::jsonb end
  ) with ordinality as h(version, position)
), counts as (
  select v.*, e.value::jsonb as edits,
    jsonb_array_length(coalesce(v.version #> '{content,lesson}', '[]'::jsonb)) as stored_slides
  from versions v
  left join public.shared_state e on e.tenant_id = v.tenant_id
    and e.key = 'itss.lessonedits.' || v.unit_id || '.built-' || (v.version ->> 'revision')
)
select tenant_id, unit_id, source, version ->> 'revision' as revision,
  version ->> 'createdAt' as saved_at, updated_at as published_row_updated_at,
  stored_slides,
  (select count(distinct hidden.value::integer) from jsonb_array_elements_text(coalesce(edits -> 'deletedSections', '[]'::jsonb)) hidden(value)
    where hidden.value ~ '^\d+$' and hidden.value::integer >= 0 and hidden.value::integer < stored_slides) as hidden_slides,
  stored_slides - (select count(distinct hidden.value::integer) from jsonb_array_elements_text(coalesce(edits -> 'deletedSections', '[]'::jsonb)) hidden(value)
    where hidden.value ~ '^\d+$' and hidden.value::integer >= 0 and hidden.value::integer < stored_slides) as visible_slides,
  coalesce(edits -> 'deletedSections', '[]'::jsonb) as hidden_slide_indices
from counts
order by tenant_id, unit_id, source;
