-- Read-only recovery inventory. Run in the affected project's SQL Editor.
-- Shows existing copies; does not restore, move, delete, or overwrite data.
-- Tenant is intentionally included so a misplaced copy can be identified.
-- Preserve the learner browsers and export candidate rows before any repair.
begin transaction read only;

with targets(name, screenshot_xp) as (
  values
    ('Pontsho Molekane', 706),
    ('Anele Khanyile', 630),
    ('Ntokozo Ngcobo', 536),
    ('Mpumelelo Hlongwane', 413)
), profile_copies as (
  select distinct t.name, t.screenshot_xp,
    s.tenant_id, s.user_id as profile_copy_owner,
    p ->> 'id' as profile_id, p ->> 'lastLogin' as last_login
  from public.app_state s
  cross join lateral jsonb_array_elements(
    case when s.key = 'itss.profiles' then s.value::jsonb else '[]'::jsonb end
  ) p
  join targets t on
    lower(trim(p ->> 'name')) = lower(t.name)
    or lower(trim(concat_ws(' ', p #>> '{enrolment,firstNames}',
                                 p #>> '{enrolment,surname}'))) = lower(t.name)
  where s.key = 'itss.profiles'
), identities as (
  select name, screenshot_xp, tenant_id, profile_id,
    array_agg(distinct profile_copy_owner) as profile_copy_owners,
    max(last_login) as latest_recorded_login
  from profile_copies
  group by name, screenshot_xp, tenant_id, profile_id
)
select t.name as learner, t.screenshot_xp,
  i.tenant_id as profile_tenant, i.profile_id, i.profile_copy_owners,
  i.latest_recorded_login,
  d.tenant_id as work_tenant, d.user_id as work_copy_owner,
  d.key as work_key, d.updated_at, octet_length(d.value) as saved_bytes,
  case
    when i.profile_id is null then 'No matching profile found; check spelling, browser copies and backups'
    when d.key is null then 'Profile found; no matching work rows found'
    else 'Existing copy found; inspect and export before restoring'
  end as finding
from targets t
left join identities i on i.name = t.name
left join public.app_state d on
  d.key in (
    'itss.progress.' || i.profile_id,
    'itss.poe.' || i.profile_id,
    'itss.notes.' || i.profile_id,
    'itss.noteorder.' || i.profile_id,
    'itss.notetitles.' || i.profile_id,
    'itss.checklist.' || i.profile_id,
    'itss.sectiond.' || i.profile_id
  )
order by t.name, i.tenant_id, i.profile_id, d.tenant_id, d.user_id, d.key;

rollback;
