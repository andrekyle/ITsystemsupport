-- Include only the profile photo alongside the minimal same-cohort chat identity.
begin;

drop function if exists public.chat_peers();

create function public.chat_peers()
returns table(
  profile_id text,
  auth_user_id uuid,
  display_name text,
  cohort_id text,
  avatar text
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
      p ->> 'avatar' as avatar,
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
      peer.cohort_id,
      peer.avatar
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
  select profile_id, auth_user_id, display_name, cohort_id, avatar
  from classmates
  order by lower(display_name), profile_id;
$$;

revoke all on function public.chat_peers() from public, anon;
grant execute on function public.chat_peers() to authenticated;

commit;
