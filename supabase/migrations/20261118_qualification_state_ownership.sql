-- Qualification-specific keys retain the learner's canonical ownership and staff permissions.
-- This migration changes functions/policies only. It never updates or deletes learner records.
begin;

create or replace function public.qualification_state_profile_id(state_key text)
returns text language sql immutable strict
set search_path = public
as $$
  select split_part(regexp_replace(
    regexp_replace(state_key, '^itss\.[^.]+\.', ''),
    '^(custom-[^.]+|genman)\.', ''), '.', 1);
$$;

create or replace function public.enforce_profile_progress_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  progress_profile_id text;
  canonical_user_id uuid;
begin
  if new.key not like 'itss.progress.%' then
    return new;
  end if;

  progress_profile_id := public.qualification_state_profile_id(new.key);
  select owner.user_id into canonical_user_id
    from public.profile_progress_owners owner
   where owner.tenant_id = new.tenant_id
     and owner.profile_id = progress_profile_id;

  if canonical_user_id is not null and new.user_id <> canonical_user_id then
    raise exception 'Progress profile % belongs to its canonical learner account', progress_profile_id
      using errcode = '23514';
  end if;
  return new;
end;
$$;


drop policy if exists "scope learner state to assignments" on public.app_state;
create policy "scope learner state to assignments" on public.app_state
  as restrictive for select to authenticated using (
    tenant_id = public.current_tenant() and (
      public.is_admin() or user_id = auth.uid()
      or (key ~ '^itss\.(progress|poe|checklist|notes|noteorder|notetitles)\.'
        and public.can_access_assigned_learner(
          public.qualification_state_profile_id(key), user_id::text))
      or (key ~ '^itss\.lessonquiz\.[^.]+\.' and public.can_access_assigned_learner(public.qualification_state_profile_id(key), user_id::text))
    )
  );


commit;
