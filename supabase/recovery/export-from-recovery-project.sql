-- RUN ONLY IN THE SEPARATE PROJECT RESTORED FROM A PRE-LOSS BACKUP.
-- Read-only export: all unit/activity records linked to the four learners.
-- Works with backups from before the tenant_id column was introduced.
-- Does not require our newer recovery schema, helper functions, or triggers.
-- Export as CSV; keep private. Do not change the live app's Supabase settings.
begin transaction read only;

with targets(learner, known_id) as (
  values
    ('Anele Khanyile', 'p_mrom4usy_le6ki'),
    ('Mpumelelo Hlongwane', 'p_mrom65g0_ho04y'),
    ('Ntokozo Ngcobo', 'p_mromq49w_0jfmq'),
    ('Pontsho Molekane', 'p_mrom0udn_jcpeg')
), profiles as (
  select p
  from public.app_state s
  cross join lateral jsonb_array_elements(
    case when s.key = 'itss.profiles' then s.value::jsonb else '[]'::jsonb end
  ) p
  where coalesce(to_jsonb(s) ->> 'tenant_id', 'investec') = 'investec'
    and s.key = 'itss.profiles'
), anchors as (
  select t.learner, p.p
  from targets t join profiles p on
    p.p ->> 'id' = t.known_id
    or lower(trim(p.p ->> 'name')) = lower(t.learner)
    or lower(trim(concat_ws(' ', p.p #>> '{enrolment,firstNames}',
                                p.p #>> '{enrolment,surname}'))) = lower(t.learner)
), identities as (
  select learner, known_id as profile_id from targets
  union
  select a.learner, p.p ->> 'id'
  from anchors a join profiles p on
    p.p ->> 'id' = a.p ->> 'id'
    or (nullif(trim(a.p #>> '{enrolment,idNumber}'), '') is not null
      and trim(p.p #>> '{enrolment,idNumber}') = trim(a.p #>> '{enrolment,idNumber}'))
    or (nullif(trim(a.p #>> '{enrolment,email}'), '') is not null
      and lower(trim(p.p #>> '{enrolment,email}')) = lower(trim(a.p #>> '{enrolment,email}')))
  where nullif(p.p ->> 'id', '') is not null
)
select i.learner, i.profile_id, 'backup_app_state'::text as source,
  coalesce(to_jsonb(s) ->> 'tenant_id', 'investec') as tenant_id,
  s.user_id, s.key, s.updated_at, s.value
from identities i join public.app_state s on
  i.profile_id = any(string_to_array(s.key, '.'))
where coalesce(to_jsonb(s) ->> 'tenant_id', 'investec') = 'investec'
order by learner, profile_id, key, user_id, updated_at;

rollback;
