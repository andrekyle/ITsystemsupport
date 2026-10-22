-- Read-only check after learners have reopened the app.
-- Checks whether restored fields remain saved and lists matching profile IDs.
with recursive targets(learner, profile_id, owner_id) as (
  values
    ('Anele Khanyile', 'p_mrom4usy_le6ki', '6ac4a7ae-93ff-46cf-bba0-e3eb925c2c59'::uuid),
    ('Mpumelelo Hlongwane', 'p_mrom65g0_ho04y', 'b4080237-546b-42a4-beb7-c8e55812f4f9'::uuid),
    ('Ntokozo Ngcobo', 'p_mromq49w_0jfmq', '0167b875-b652-4bfd-aa52-86a7442c8ba5'::uuid),
    ('Pontsho Molekane', 'p_mrom0udn_jcpeg', 'fdc7dbcb-d492-4045-ba81-aaad6ef50f26'::uuid)
), copies as (
  select t.*, d.value::jsonb as current_progress, d.updated_at,
    s.value::jsonb as recovery_source
  from targets t
  left join public.app_state d on d.tenant_id = 'investec'
    and d.user_id = t.owner_id and d.key = 'itss.progress.' || t.profile_id
  left join public.app_state s on s.tenant_id = 'investec'
    and s.user_id = '2154d8e2-5fc7-47ee-bd43-bd07e6688124'::uuid
    and s.key = 'itss.progress.' || t.profile_id
), source_fields as (
  select learner, array[]::text[] as path, recovery_source as value from copies
  union all
  select f.learner, f.path || e.key, e.value
  from source_fields f
  cross join lateral jsonb_each(
    case when jsonb_typeof(f.value) = 'object' then f.value else '{}'::jsonb end
  ) e
), matching_profiles as (
  select distinct t.learner, s.user_id, p ->> 'id' as profile_id
  from public.app_state s
  cross join lateral jsonb_array_elements(
    case when s.key = 'itss.profiles' then s.value::jsonb else '[]'::jsonb end
  ) p
  join targets t on p ->> 'id' = t.profile_id
    or lower(trim(p ->> 'name')) = lower(t.learner)
    or lower(trim(concat_ws(' ', p #>> '{enrolment,firstNames}',
                                p #>> '{enrolment,surname}'))) = lower(t.learner)
  where s.tenant_id = 'investec' and s.key = 'itss.profiles'
)
select c.learner, c.profile_id as restored_profile_id, c.owner_id,
  c.updated_at, c.current_progress is not null as progress_row_exists,
  (select count(*) from source_fields f where f.learner = c.learner
    and cardinality(f.path) > 0 and jsonb_typeof(f.value) <> 'object'
    and (c.current_progress #> f.path) is null) as missing_recovery_fields,
  (select jsonb_object_agg(u.key, jsonb_build_object(
    'saved_text_entries', (select count(*) from jsonb_each(coalesce(u.value -> 'logbook', '{}'::jsonb)) l
      where jsonb_typeof(l.value) = 'string' and trim(l.value #>> '{}') <> ''),
    'quiz_present', u.value ? 'quiz',
    'quiz_ids', coalesce((select jsonb_agg(q.key) from jsonb_object_keys(coalesce(u.value -> 'quizzes', '{}'::jsonb)) q(key)), '[]'::jsonb)
  )) from jsonb_each(coalesce(c.current_progress -> 'units', '{}'::jsonb)) u) as saved_work_by_unit,
  (select jsonb_agg(jsonb_build_object('account', p.user_id, 'profile_id', p.profile_id))
    from matching_profiles p where p.learner = c.learner) as matching_profiles
from copies c order by c.learner;
