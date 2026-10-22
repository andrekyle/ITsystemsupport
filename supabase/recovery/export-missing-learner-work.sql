-- Read-only export of the copies identified by the recovery inventory.
-- Export results as CSV and preserve the file before any restoration.
-- Contains learner work: keep private and out of source control.
begin transaction read only;

with targets(learner, profile_id) as (
  values
    ('Anele Khanyile', 'p_mrom4usy_le6ki'),
    ('Mpumelelo Hlongwane', 'p_mrom65g0_ho04y'),
    ('Ntokozo Ngcobo', 'p_mromq49w_0jfmq'),
    ('Pontsho Molekane', 'p_mrom0udn_jcpeg')
)
select t.learner, t.profile_id, s.tenant_id, s.user_id,
  s.key, s.updated_at, s.value
from public.app_state s
join targets t on s.key in (
  'itss.progress.' || t.profile_id,
  'itss.poe.' || t.profile_id,
  'itss.notes.' || t.profile_id,
  'itss.noteorder.' || t.profile_id,
  'itss.notetitles.' || t.profile_id,
  'itss.checklist.' || t.profile_id,
  'itss.sectiond.' || t.profile_id
)
where s.tenant_id = 'investec'
order by t.learner, s.key, s.user_id;

rollback;
