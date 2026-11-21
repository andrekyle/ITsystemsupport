-- Let learners discover and message only peers in their own cohort.
-- The chat directory intentionally returns no enrolment or other private
-- profile fields; message access remains limited to the two participants.
begin;

create or replace function public.current_learner_chat_profile()
returns table(profile_id text, cohort_id text)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p ->> 'id',
    coalesce(nullif(btrim(p ->> 'cohortId'), ''), 'default')
  from public.app_state s
  cross join lateral jsonb_array_elements(
    case when jsonb_typeof(s.value::jsonb) = 'array'
      then s.value::jsonb else '[]'::jsonb end
  ) p
  where s.tenant_id = public.current_tenant()
    and s.key = 'itss.profiles'
    and p ->> 'role' = 'Learner'
    and (
      p ->> 'cloudUserId' = auth.uid()::text
      or (
        s.user_id = auth.uid()
        and lower(p #>> '{enrolment,email}') = lower(auth.jwt() ->> 'email')
      )
    )
  order by (p ->> 'cloudUserId' = auth.uid()::text) desc
  limit 1;
$$;

create or replace function public.chat_peers()
returns table(
  profile_id text,
  auth_user_id uuid,
  display_name text,
  cohort_id text
)
language sql
stable
security definer
set search_path = ''
as $$
  with caller as (
    select * from public.current_learner_chat_profile()
  ),
  peer_rows as (
    select
      p ->> 'id' as profile_id,
      case
        when p ->> 'cloudUserId' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          then (p ->> 'cloudUserId')::uuid
        else null
      end as auth_user_id,
      p ->> 'name' as display_name,
      coalesce(nullif(btrim(p ->> 'cohortId'), ''), 'default') as cohort_id,
      (p ->> 'cloudUserId' = s.user_id::text) as canonical_copy,
      p ->> 'role' as role
    from public.app_state s
    cross join lateral jsonb_array_elements(
      case when jsonb_typeof(s.value::jsonb) = 'array'
        then s.value::jsonb else '[]'::jsonb end
    ) p
    where s.tenant_id = public.current_tenant()
      and s.key = 'itss.profiles'
  ),
  classmates as (
    select distinct on (peer.profile_id)
      peer.profile_id,
      peer.auth_user_id,
      peer.display_name,
      peer.cohort_id
    from peer_rows peer
    cross join caller
    where peer.role = 'Learner'
      and peer.profile_id is not null
      and nullif(btrim(peer.display_name), '') is not null
      and peer.auth_user_id is not null
      and peer.profile_id <> caller.profile_id
      and peer.cohort_id = caller.cohort_id
    order by peer.profile_id, peer.canonical_copy desc nulls last
  )
  select profile_id, auth_user_id, display_name, cohort_id
  from classmates
  order by lower(display_name), profile_id;
$$;

create or replace function public.can_send_classmate_chat(
  sender_profile text,
  recipient_user uuid,
  recipient_profile text,
  message_cohort text
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller record;
  caller_role text;
begin
  if public.is_admin() then return true; end if;

  select p ->> 'role' into caller_role
  from public.app_state s
  cross join lateral jsonb_array_elements(
    case when jsonb_typeof(s.value::jsonb) = 'array'
      then s.value::jsonb else '[]'::jsonb end
  ) p
  where s.tenant_id = public.current_tenant()
    and s.key = 'itss.profiles'
    and (
      p ->> 'cloudUserId' = auth.uid()::text
      or (
        s.user_id = auth.uid()
        and lower(p #>> '{enrolment,email}') = lower(auth.jwt() ->> 'email')
      )
    )
  order by (p ->> 'cloudUserId' = auth.uid()::text) desc
  limit 1;

  if caller_role is null then return false; end if;
  if caller_role <> 'Learner' then
    return caller_role in ('Facilitator', 'Assessor', 'Moderator', 'Admin', 'Super User');
  end if;

  select * into caller from public.current_learner_chat_profile();
  if not found then return false; end if;

  if sender_profile <> caller.profile_id
    or message_cohort <> caller.cohort_id
    or recipient_profile = caller.profile_id then
    return false;
  end if;

  return exists (
    select 1 from public.chat_peers() peer
    where peer.profile_id = recipient_profile
      and peer.auth_user_id = recipient_user
  );
end;
$$;

revoke all on function public.current_learner_chat_profile() from public, anon;
revoke all on function public.chat_peers() from public, anon;
revoke all on function public.can_send_classmate_chat(text, uuid, text, text) from public, anon;
grant execute on function public.current_learner_chat_profile() to authenticated;
grant execute on function public.chat_peers() to authenticated;
grant execute on function public.can_send_classmate_chat(text, uuid, text, text) to authenticated;

drop policy if exists "restrict learner chat to same cohort" on public.chat_messages;
create policy "restrict learner chat to same cohort"
  on public.chat_messages
  as restrictive
  for insert
  to authenticated
  with check (
    public.can_send_classmate_chat(
      sender_profile_id, recipient_user_id, recipient_profile_id, cohort_id
    )
  );

commit;
