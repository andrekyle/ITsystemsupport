-- Consolidate Bonolo Mekgoe's profile-keyed app_state into her verified account.
-- Run in the Investec Supabase SQL Editor as the database owner, with learner
-- app tabs closed. Originals are retained in a private recovery backup table.
-- The canonical profile itself is not rewritten.
begin;
set local lock_timeout = '10s';
set local statement_timeout = '120s';
lock table public.app_state in share row exclusive mode;

create schema if not exists learner_recovery_private;
revoke all on schema learner_recovery_private from public, anon, authenticated;

create table if not exists learner_recovery_private.bonolo_work_backup (
  run_id text not null,
  backed_up_at timestamptz not null default now(),
  tenant_id text not null,
  user_id uuid not null,
  key text not null,
  value text not null,
  updated_at timestamptz not null,
  primary key (run_id, tenant_id, user_id, key)
);
alter table learner_recovery_private.bonolo_work_backup enable row level security;
revoke all on learner_recovery_private.bonolo_work_backup from public, anon, authenticated;

create table if not exists learner_recovery_private.bonolo_owner_backup (
  run_id text not null,
  backed_up_at timestamptz not null default now(),
  tenant_id text not null,
  profile_id text not null,
  user_id uuid not null,
  primary key (run_id, tenant_id, profile_id)
);
alter table learner_recovery_private.bonolo_owner_backup enable row level security;
revoke all on learner_recovery_private.bonolo_owner_backup from public, anon, authenticated;

create or replace function pg_temp.fill_missing(preferred jsonb, recovered jsonb)
returns jsonb language plpgsql as $$
declare
  field record;
begin
  if preferred is null then return recovered; end if;
  if jsonb_typeof(preferred) <> 'object'
     or jsonb_typeof(recovered) <> 'object' then
    return preferred;
  end if;
  for field in select key, value from jsonb_each(recovered) loop
    if not (preferred ? field.key) then
      preferred := jsonb_set(preferred, array[field.key], field.value);
    elsif jsonb_typeof(preferred -> field.key) = 'object'
      and jsonb_typeof(field.value) = 'object' then
      preferred := jsonb_set(preferred, array[field.key],
        pg_temp.fill_missing(preferred -> field.key, field.value));
    end if;
  end loop;
  return preferred;
end;
$$;

create or replace function pg_temp.best_result(older jsonb, preferred jsonb)
returns jsonb language plpgsql as $$
declare
  older_total numeric;
  preferred_total numeric;
  older_best numeric;
  preferred_best numeric;
begin
  if older is null or older = 'null'::jsonb then return preferred; end if;
  if preferred is null or preferred = 'null'::jsonb then return older; end if;
  if jsonb_typeof(older) <> 'object' or jsonb_typeof(preferred) <> 'object'
     or coalesce(older ->> 'total', '') !~ '^-?[0-9]+([.][0-9]+)?$'
     or coalesce(preferred ->> 'total', '') !~ '^-?[0-9]+([.][0-9]+)?$'
     or coalesce(older ->> 'best', '') !~ '^-?[0-9]+([.][0-9]+)?$'
     or coalesce(preferred ->> 'best', '') !~ '^-?[0-9]+([.][0-9]+)?$' then
    return preferred;
  end if;
  older_total := (older ->> 'total')::numeric;
  preferred_total := (preferred ->> 'total')::numeric;
  older_best := (older ->> 'best')::numeric;
  preferred_best := (preferred ->> 'best')::numeric;
  if older_total = 0 then return preferred; end if;
  if preferred_total = 0 then return older; end if;
  if older_best / older_total > preferred_best / preferred_total
     or (older_best / older_total = preferred_best / preferred_total
       and coalesce(nullif(older ->> 'attempts', '')::numeric, 0)
         > coalesce(nullif(preferred ->> 'attempts', '')::numeric, 0)) then
    return older;
  end if;
  return preferred;
end;
$$;

create or replace function pg_temp.merge_result_map(older jsonb, preferred jsonb)
returns jsonb language plpgsql as $$
declare
  result jsonb;
  item record;
begin
  result := pg_temp.fill_missing(preferred, older);
  if jsonb_typeof(older) = 'object' and jsonb_typeof(preferred) = 'object' then
    for item in select key, value from jsonb_each(older) loop
      if preferred ? item.key then
        result := jsonb_set(result, array[item.key],
          pg_temp.best_result(item.value, preferred -> item.key), true);
      end if;
    end loop;
  end if;
  return result;
end;
$$;

create or replace function pg_temp.merge_progress(older jsonb, preferred jsonb)
returns jsonb language plpgsql as $$
declare
  merged jsonb;
  unit_id text;
  older_unit jsonb;
  preferred_unit jsonb;
  unit_value jsonb;
  activities jsonb;
  logbook jsonb;
  item record;
  preferred_value jsonb;
  completion_flag boolean;
begin
  if jsonb_typeof(older -> 'units') <> 'object'
     or jsonb_typeof(preferred -> 'units') <> 'object' then
    raise exception 'Unexpected progress format; expected a units object.';
  end if;
  merged := pg_temp.fill_missing(preferred, older);

  for unit_id in select key from jsonb_each(older -> 'units') loop
    if not (preferred -> 'units' ? unit_id) then continue; end if;
    older_unit := older -> 'units' -> unit_id;
    preferred_unit := preferred -> 'units' -> unit_id;
    if jsonb_typeof(older_unit) <> 'object'
       or jsonb_typeof(preferred_unit) <> 'object' then continue; end if;

    unit_value := pg_temp.fill_missing(preferred_unit, older_unit);
    activities := pg_temp.fill_missing(
      preferred_unit -> 'activities', older_unit -> 'activities');
    if jsonb_typeof(older_unit -> 'activities') = 'object' then
      for item in select key, value from jsonb_each(older_unit -> 'activities') loop
        if item.value = 'true'::jsonb then
          activities := jsonb_set(activities, array[item.key], 'true'::jsonb, true);
        end if;
      end loop;
    end if;
    if activities is not null then
      unit_value := jsonb_set(unit_value, '{activities}', activities, true);
    end if;

    if older_unit ? 'quiz' or preferred_unit ? 'quiz' then
      unit_value := jsonb_set(unit_value, '{quiz}',
        pg_temp.best_result(older_unit -> 'quiz', preferred_unit -> 'quiz'), true);
    end if;
    if older_unit ? 'quizzes' or preferred_unit ? 'quizzes' then
      unit_value := jsonb_set(unit_value, '{quizzes}',
        pg_temp.merge_result_map(older_unit -> 'quizzes', preferred_unit -> 'quizzes'), true);
    end if;
    if older_unit ? 'exercises' or preferred_unit ? 'exercises' then
      unit_value := jsonb_set(unit_value, '{exercises}',
        pg_temp.merge_result_map(older_unit -> 'exercises', preferred_unit -> 'exercises'), true);
    end if;

    logbook := pg_temp.fill_missing(
      preferred_unit -> 'logbook', older_unit -> 'logbook');
    if jsonb_typeof(older_unit -> 'logbook') = 'object' then
      for item in select key, value from jsonb_each(older_unit -> 'logbook') loop
        preferred_value := preferred_unit -> 'logbook' -> item.key;
        completion_flag := right(item.key, 3) = '.ok'
          or left(item.key, 10) = 'slidegate.'
          or item.key like 'videoengagement.likeXp.%'
          or item.key like 'videoengagement.commentXp.%';
        if (completion_flag and item.value = 'true'::jsonb)
           or (preferred_value is null and item.value is not null)
           or preferred_value = '""'::jsonb then
          logbook := jsonb_set(logbook, array[item.key], item.value, true);
        end if;
      end loop;
    end if;
    if logbook is not null then
      unit_value := jsonb_set(unit_value, '{logbook}', logbook, true);
    end if;
    merged := jsonb_set(merged, array['units', unit_id], unit_value, true);
  end loop;
  return merged;
end;
$$;

do $$
declare
  target_id constant uuid := '019c8179-b1eb-4883-8471-be7ae31f90de';
  learner_profile constant text := 'p_mrom1ltu_6w5hf';
  run_id text := 'bonolo-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSUS');
  target_profile_count integer;
  key_row record;
  source_row record;
  current_value jsonb;
  merged_value jsonb;
  target_exists boolean;
  affected integer;
begin
  select count(*) into target_profile_count
  from public.app_state s
  cross join lateral jsonb_array_elements(s.value::jsonb) p
  where s.tenant_id = 'investec'
    and s.user_id = target_id
    and s.key = 'itss.profiles'
    and p ->> 'id' = learner_profile
    and p ->> 'name' = 'Bonolo Mekgoe'
    and p ->> 'role' = 'Learner'
    and p ->> 'cloudUserId' = target_id::text;

  if target_profile_count <> 1 then
    raise exception 'Expected exactly one verified Bonolo profile on the target account; found %.',
      target_profile_count;
  end if;

  insert into learner_recovery_private.bonolo_work_backup
    (run_id, tenant_id, user_id, key, value, updated_at)
  select run_id, s.tenant_id, s.user_id, s.key, s.value, s.updated_at
  from public.app_state s
  where s.tenant_id = 'investec'
    and learner_profile = any(string_to_array(s.key, '.'))
  on conflict do nothing;

  insert into learner_recovery_private.bonolo_work_backup
    (run_id, tenant_id, user_id, key, value, updated_at)
  select run_id, s.tenant_id, s.user_id, s.key, s.value, s.updated_at
  from public.app_state s
  where s.tenant_id = 'investec'
    and s.key = 'itss.profiles'
    and exists (
      select 1
      from jsonb_array_elements(
        case when jsonb_typeof(s.value::jsonb) = 'array'
          then s.value::jsonb else '[]'::jsonb end
      ) p
      where p ->> 'id' = learner_profile
    )
  on conflict do nothing;

  insert into learner_recovery_private.bonolo_owner_backup
    (run_id, tenant_id, profile_id, user_id)
  select run_id, tenant_id, profile_id, user_id
  from public.profile_progress_owners
  where tenant_id = 'investec' and profile_id = learner_profile
  on conflict do nothing;

  insert into public.profile_progress_owners (tenant_id, profile_id, user_id)
  values ('investec', learner_profile, target_id)
  on conflict (tenant_id, profile_id) do update set user_id = excluded.user_id;

  for key_row in
    select distinct s.key
    from public.app_state s
    where s.tenant_id = 'investec'
      and learner_profile = any(string_to_array(s.key, '.'))
      and s.user_id <> target_id
  loop
    select s.value::jsonb into current_value
    from public.app_state s
    where s.tenant_id = 'investec'
      and s.user_id = target_id
      and s.key = key_row.key;
    target_exists := found;

    if key_row.key = 'itss.progress.' || learner_profile then
      merged_value := null;
      for source_row in
        select s.value::jsonb as value
        from public.app_state s
        where s.tenant_id = 'investec'
          and s.user_id <> target_id
          and s.key = key_row.key
        order by s.updated_at asc, s.user_id
      loop
        merged_value := case when merged_value is null
          then source_row.value
          else pg_temp.merge_progress(merged_value, source_row.value)
        end;
      end loop;
      if target_exists then
        merged_value := case when merged_value is null
          then current_value
          else pg_temp.merge_progress(merged_value, current_value)
        end;
      end if;
    else
      merged_value := current_value;
      for source_row in
        select s.value::jsonb as value
        from public.app_state s
        where s.tenant_id = 'investec'
          and s.user_id <> target_id
          and s.key = key_row.key
        order by s.updated_at desc, s.user_id
      loop
        merged_value := pg_temp.fill_missing(merged_value, source_row.value);
      end loop;
    end if;

    if target_exists then
      update public.app_state
      set value = merged_value::text, updated_at = now()
      where tenant_id = 'investec' and user_id = target_id and key = key_row.key;
    else
      insert into public.app_state (tenant_id, user_id, key, value, updated_at)
      values ('investec', target_id, key_row.key, merged_value::text, now());
    end if;
  end loop;

  update public.app_state s
  set value = coalesce((
    select jsonb_agg(p.value)
    from jsonb_array_elements(s.value::jsonb) p(value)
    where coalesce(p.value ->> 'id', '') <> learner_profile
  ), '[]'::jsonb)::text,
  updated_at = now()
  where s.tenant_id = 'investec'
    and s.user_id <> target_id
    and s.key = 'itss.profiles'
    and jsonb_typeof(s.value::jsonb) = 'array'
    and exists (
      select 1 from jsonb_array_elements(s.value::jsonb) p
      where p ->> 'id' = learner_profile
    );

  delete from public.app_state s
  where s.tenant_id = 'investec'
    and s.user_id <> target_id
    and learner_profile = any(string_to_array(s.key, '.'));

  get diagnostics affected = row_count;

  if exists (
    select 1 from public.app_state s
    where s.tenant_id = 'investec'
      and s.user_id <> target_id
      and learner_profile = any(string_to_array(s.key, '.'))
  ) or exists (
    select 1
    from public.app_state s
    cross join lateral jsonb_array_elements(
      case when jsonb_typeof(s.value::jsonb) = 'array'
        then s.value::jsonb else '[]'::jsonb end
    ) p
    where s.tenant_id = 'investec'
      and s.user_id <> target_id
      and s.key = 'itss.profiles'
      and p ->> 'id' = learner_profile
  ) then
    raise exception 'Duplicate live profile rows remain; transaction rolled back.';
  end if;

  raise notice 'Bonolo consolidation complete. Run id: %, duplicate data rows removed: %; original rows are backed up.',
    run_id, affected;
end;
$$;

commit;

-- Verify the canonical profile-specific rows. The private backup is not exposed
-- to app users; retain it unless the recovery is independently confirmed.
select run_id, count(*) as backed_up_rows, min(backed_up_at) as backed_up_at
from learner_recovery_private.bonolo_work_backup
group by run_id
order by max(backed_up_at) desc
limit 1;

select count(*) as duplicate_live_rows
from public.app_state
where tenant_id = 'investec'
  and user_id <> '019c8179-b1eb-4883-8471-be7ae31f90de'::uuid
  and 'p_mrom1ltu_6w5hf' = any(string_to_array(key, '.'));

select tenant_id, user_id, key, updated_at, octet_length(value) as saved_bytes
from public.app_state
where tenant_id = 'investec'
  and 'p_mrom1ltu_6w5hf' = any(string_to_array(key, '.'))
order by key;
