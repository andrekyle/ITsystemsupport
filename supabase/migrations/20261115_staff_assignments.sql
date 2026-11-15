-- Assignment changes are administrative operations. Restrictive policies
-- also apply when an older permissive "write shared state" policy exists.
drop policy if exists "admin inserts staff assignments" on public.shared_state;
create policy "admin inserts staff assignments" on public.shared_state
  as restrictive for insert to authenticated
  with check (key <> 'itss.staff-assignments.shared' or public.is_admin());

drop policy if exists "admin updates staff assignments" on public.shared_state;
create policy "admin updates staff assignments" on public.shared_state
  as restrictive for update to authenticated
  using (key <> 'itss.staff-assignments.shared' or public.is_admin())
  with check (key <> 'itss.staff-assignments.shared' or public.is_admin());

drop policy if exists "admin deletes staff assignments" on public.shared_state;
create policy "admin deletes staff assignments" on public.shared_state
  as restrictive for delete to authenticated
  using (key <> 'itss.staff-assignments.shared' or public.is_admin());

-- Resolve assignments using the authenticated account, never an editable
-- profile role or display name supplied by a browser.
create or replace function public.current_staff_assignment()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  select s.value::jsonb -> auth.uid()::text into result
  from public.shared_state s
  where s.tenant_id = public.current_tenant() and s.key = 'itss.staff-assignments.shared';
  return coalesce(result, '{}'::jsonb);
exception when others then return '{}'::jsonb;
end;
$$;

create or replace function public.can_access_assigned_learner(profile_id text, owner_id text)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare assignment jsonb; state record; people jsonb; person jsonb;
begin
  assignment := public.current_staff_assignment();
  if coalesce((assignment->'learnerIds') ? profile_id, false) then return true; end if;
  if not coalesce((assignment->'learnerIds') ? owner_id, false) then return false; end if;
  -- An assigned account can hold cached copies of other students. Account
  -- ownership alone must not make those additional profile records visible.
  for state in select s.value from public.app_state s
    where s.tenant_id = public.current_tenant() and s.user_id::text = owner_id and s.key = 'itss.profiles'
  loop
    begin people := state.value::jsonb;
    exception when others then continue;
    end;
    if jsonb_typeof(people) <> 'array' then continue; end if;
    for person in select * from jsonb_array_elements(people)
    loop
      if person->>'id' = profile_id and person->>'role' = 'Learner'
        and person->>'cloudUserId' = owner_id then return true; end if;
    end loop;
  end loop;
  return false;
end;
$$;

-- Profile lists are legacy JSON arrays and may contain several people. Never
-- grant staff access to a whole foreign array just because one person matches.
create or replace function public.visible_profiles()
returns table(user_id uuid, value text)
language plpgsql stable security definer set search_path = '' as $$
declare state record; person jsonb; people jsonb; administrator boolean;
begin
  administrator := public.is_admin();
  for state in select s.user_id, s.value from public.app_state s
    where s.tenant_id = public.current_tenant() and s.key = 'itss.profiles'
  loop
    begin people := state.value::jsonb;
    exception when others then continue;
    end;
    if jsonb_typeof(people) <> 'array' then continue; end if;
    for person in select * from jsonb_array_elements(people)
    loop
      if administrator
        or person->>'cloudUserId' = auth.uid()::text
        or (state.user_id = auth.uid() and lower(person->'enrolment'->>'email') = lower(auth.jwt()->>'email'))
        or (person->>'role' = 'Learner' and public.can_access_assigned_learner(
          person->>'id', coalesce(person->>'cloudUserId', state.user_id::text)))
      then
        user_id := state.user_id;
        value := jsonb_build_array(case when administrator then person else person - 'passwordHash' end)::text;
        return next;
      end if;
    end loop;
  end loop;
end;
$$;

-- This restrictive policy constrains any older tenant-wide SELECT policies.
drop policy if exists "scope learner state to assignments" on public.app_state;
create policy "scope learner state to assignments" on public.app_state
  as restrictive for select to authenticated using (
    tenant_id = public.current_tenant() and (
      public.is_admin() or user_id = auth.uid()
      or (key ~ '^itss\.(progress|poe|checklist|notes|noteorder|notetitles)\.'
        and public.can_access_assigned_learner(
          regexp_replace(key, '^itss\.(progress|poe|checklist|notes|noteorder|notetitles)\.', ''), user_id::text))
      or (key ~ '^itss\.lessonquiz\.[^.]+\.' and public.can_access_assigned_learner(split_part(key, '.', 3), user_id::text))
    )
  );

revoke all on function public.current_staff_assignment() from public, anon;
revoke all on function public.can_access_assigned_learner(text, text) from public, anon;
revoke all on function public.visible_profiles() from public, anon;
grant execute on function public.current_staff_assignment() to authenticated;
grant execute on function public.can_access_assigned_learner(text, text) to authenticated;
grant execute on function public.visible_profiles() to authenticated;

-- A document's storage URL is also an access path. Protect private POE files,
-- including files an administrator uploaded on behalf of an assigned learner.
drop policy if exists "scope private evidence files to assignments" on storage.objects;
create policy "scope private evidence files to assignments" on storage.objects
  as restrictive for select to authenticated using (
    bucket_id <> 'files' or (
      (split_part(name, '/', 1) = public.current_tenant() and (
        public.is_admin() or split_part(name, '/', 2) in (auth.uid()::text, 'shared')
        or (split_part(name, '/', 3) = 'poe' and public.can_access_assigned_learner(
          split_part(name, '/', 4), split_part(name, '/', 2)))
      ))
      or (public.current_tenant() = 'investec' and split_part(name, '/', 1) not in ('investec', 'discovery') and (
        public.is_admin() or split_part(name, '/', 1) in (auth.uid()::text, 'shared')
        or (split_part(name, '/', 2) = 'poe' and public.can_access_assigned_learner(
          split_part(name, '/', 3), split_part(name, '/', 1)))
      ))
    )
  );

notify pgrst, 'reload schema';
