-- Expanded read-only recovery export, covering every unit and key type.
-- Includes lesson steps, slide quiz answers, quiz drafts, notes, documents,
-- progress, alternate profile IDs, and the preserved pre-recovery copies.
-- Only matches whole profile-ID segments, never partial IDs or learner names
-- inside unrelated answer text. This query does not mark any work complete.
-- Export results as CSV. Contains private learner data: do not commit it.
with targets(learner, known_id) as (
  values
    ('Anele Khanyile', 'p_mrom4usy_le6ki'),
    ('Mpumelelo Hlongwane', 'p_mrom65g0_ho04y'),
    ('Ntokozo Ngcobo', 'p_mromq49w_0jfmq'),
    ('Pontsho Molekane', 'p_mrom0udn_jcpeg')
), profiles as (
  select s.user_id, p
  from public.app_state s
  cross join lateral jsonb_array_elements(
    case when s.key = 'itss.profiles' then s.value::jsonb else '[]'::jsonb end
  ) p
  where s.tenant_id = 'investec' and s.key = 'itss.profiles'
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
), exported as (
  select i.learner, i.profile_id, 'app_state'::text as source,
    s.tenant_id, s.user_id, s.key, s.updated_at, s.value
  from identities i join public.app_state s on
    i.profile_id = any(string_to_array(s.key, '.'))
  where s.tenant_id = 'investec'
  union all
  select i.learner, i.profile_id, 'pre_recovery_backup:' || b.batch_id,
    b.tenant_id, b.user_id, b.key, b.updated_at, b.value
  from identities i join learner_recovery_private.progress_backup b on
    i.profile_id = any(string_to_array(b.key, '.'))
  where b.tenant_id = 'investec'
)
select * from exported
order by learner, profile_id, key, source, user_id, updated_at;
