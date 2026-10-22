-- Recovery for the four learners in the reviewed October 16 export.
-- Run in Supabase SQL Editor as the project database owner.
-- Close learner app tabs first; reopen after this transaction succeeds.
-- Adds missing progress fields only. Existing fields (including false/empty)
-- win conflicts. Does not change profiles, files, or other accounts' copies.
-- Original progress rows are backed up in a schema unavailable to app roles.
-- Temporary safeguard: saves to these four rows cannot omit existing fields.
-- Explicit edits (including empty strings/false) still take effect. Removing
-- fields by omission requires removing the trigger after sync is repaired:
-- drop trigger if exists protect_four_recovered_progress on public.app_state;
begin;
set local lock_timeout = '10s';
set local statement_timeout = '60s';
lock table public.app_state in share row exclusive mode;

create schema if not exists learner_recovery_private;
revoke all on schema learner_recovery_private from public, anon, authenticated;
create table if not exists learner_recovery_private.progress_backup (
  batch_id text not null,
  backed_up_at timestamptz not null default now(),
  tenant_id text not null,
  user_id uuid not null,
  key text not null,
  value text not null,
  updated_at timestamptz not null,
  primary key (batch_id, tenant_id, user_id, key)
);
alter table learner_recovery_private.progress_backup enable row level security;
revoke all on learner_recovery_private.progress_backup from public, anon, authenticated;

create or replace function learner_recovery_private.keep_missing_fields(incoming jsonb, saved jsonb)
returns jsonb language plpgsql set search_path = pg_catalog as $$
declare field record;
begin
  if jsonb_typeof(incoming) is distinct from 'object'
    or jsonb_typeof(saved) is distinct from 'object' then
    return incoming;
  end if;
  for field in select key, value from jsonb_each(saved) loop
    if not (incoming ? field.key) then
      incoming := jsonb_set(incoming, array[field.key], field.value);
    elsif jsonb_typeof(incoming -> field.key) = 'object'
      and jsonb_typeof(field.value) = 'object' then
      incoming := jsonb_set(incoming, array[field.key],
        learner_recovery_private.keep_missing_fields(incoming -> field.key, field.value));
    end if;
  end loop;
  return incoming;
end;
$$;
revoke all on function learner_recovery_private.keep_missing_fields(jsonb, jsonb)
  from public, anon, authenticated;

-- Runs inside the save transaction, including saves made by an older app.
-- Definer rights permit access only to the private helper; no table reads or
-- writes are performed by this function, and normal app_state RLS still applies.
create or replace function learner_recovery_private.protect_four_progress_rows()
returns trigger language plpgsql security definer set search_path = pg_catalog as $$
begin
  if (old.user_id::text, old.key) not in (
    ('6ac4a7ae-93ff-46cf-bba0-e3eb925c2c59', 'itss.progress.p_mrom4usy_le6ki'),
    ('b4080237-546b-42a4-beb7-c8e55812f4f9', 'itss.progress.p_mrom65g0_ho04y'),
    ('0167b875-b652-4bfd-aa52-86a7442c8ba5', 'itss.progress.p_mromq49w_0jfmq'),
    ('fdc7dbcb-d492-4045-ba81-aaad6ef50f26', 'itss.progress.p_mrom0udn_jcpeg')
  ) then return new; end if;
  if jsonb_typeof(new.value::jsonb -> 'units') is distinct from 'object' then
    raise exception 'Progress save rejected: expected a units object. Existing work has been preserved.';
  end if;
  new.value := learner_recovery_private.keep_missing_fields(new.value::jsonb, old.value::jsonb)::text;
  return new;
end;
$$;
revoke all on function learner_recovery_private.protect_four_progress_rows()
  from public, anon, authenticated;
drop trigger if exists protect_four_recovered_progress on public.app_state;
create trigger protect_four_recovered_progress before update of value on public.app_state
for each row when (
  old.tenant_id = 'investec' and new.tenant_id = old.tenant_id
  and new.user_id = old.user_id and new.key = old.key
  and old.key in ('itss.progress.p_mrom4usy_le6ki', 'itss.progress.p_mrom65g0_ho04y',
                  'itss.progress.p_mromq49w_0jfmq', 'itss.progress.p_mrom0udn_jcpeg')
) execute function learner_recovery_private.protect_four_progress_rows();

create temporary table recovery_targets (
  learner text, profile_id text, owner_id uuid, source_md5 text
) on commit drop;
insert into recovery_targets values
  ('Anele Khanyile', 'p_mrom4usy_le6ki', '6ac4a7ae-93ff-46cf-bba0-e3eb925c2c59', 'd830975c8b744a10ce822d6d489e06f3'),
  ('Mpumelelo Hlongwane', 'p_mrom65g0_ho04y', 'b4080237-546b-42a4-beb7-c8e55812f4f9', '6570ac61df6e4443aae11f36c3982016'),
  ('Ntokozo Ngcobo', 'p_mromq49w_0jfmq', '0167b875-b652-4bfd-aa52-86a7442c8ba5', '4e1ece4274d60a39bdd947ba6d78a476'),
  ('Pontsho Molekane', 'p_mrom0udn_jcpeg', 'fdc7dbcb-d492-4045-ba81-aaad6ef50f26', 'f2df2f6b73e1b90cbea06f2115092f24');

-- Recursively fill absent object keys; never replace a current scalar/array.
create or replace function pg_temp.fill_missing_progress(current_value jsonb, recovered_value jsonb)
returns jsonb language plpgsql as $$
declare field record;
begin
  if jsonb_typeof(current_value) <> 'object'
     or jsonb_typeof(recovered_value) <> 'object' then
    return current_value;
  end if;
  for field in select key, value from jsonb_each(recovered_value) loop
    if not (current_value ? field.key) then
      current_value := jsonb_set(current_value, array[field.key], field.value);
    elsif jsonb_typeof(current_value -> field.key) = 'object'
      and jsonb_typeof(field.value) = 'object' then
      current_value := jsonb_set(current_value, array[field.key],
        pg_temp.fill_missing_progress(current_value -> field.key, field.value));
    end if;
  end loop;
  return current_value;
end;
$$;

create temporary table recovery_result (
  learner text, result text, units_before integer, units_after integer
) on commit drop;

do $$
declare
  t record;
  source_text text;
  current_text text;
  merged jsonb;
  before_units integer;
  after_units integer;
begin
  for t in select * from recovery_targets loop
    -- Fail the whole transaction if the reviewed source has changed or vanished.
    select value into strict source_text from public.app_state
      where tenant_id = 'investec'
        and user_id = '2154d8e2-5fc7-47ee-bd43-bd07e6688124'
        and key = 'itss.progress.' || t.profile_id;
    if md5(source_text) <> t.source_md5 then
      raise exception 'Source changed for %. Export again before recovery.', t.learner;
    end if;

    -- Confirm the destination still has this exact learner identity.
    if not exists (
      select 1 from public.app_state s
      cross join lateral jsonb_array_elements(
        case when s.key = 'itss.profiles' then s.value::jsonb else '[]'::jsonb end
      ) p
      where s.tenant_id = 'investec' and s.user_id = t.owner_id
        and s.key = 'itss.profiles' and p ->> 'id' = t.profile_id
        and (lower(trim(p ->> 'name')) = lower(t.learner)
          or lower(trim(concat_ws(' ', p #>> '{enrolment,firstNames}',
                                      p #>> '{enrolment,surname}'))) = lower(t.learner))
    ) then
      raise exception 'Destination profile could not be verified for %.', t.learner;
    end if;

    select value into strict current_text from public.app_state
      where tenant_id = 'investec' and user_id = t.owner_id
        and key = 'itss.progress.' || t.profile_id;
    if jsonb_typeof(current_text::jsonb -> 'units') is distinct from 'object'
      or jsonb_typeof(source_text::jsonb -> 'units') is distinct from 'object' then
      raise exception 'Unexpected progress format for %.', t.learner;
    end if;

    -- Keep every existing copy. Rerunning never replaces the original backup.
    insert into learner_recovery_private.progress_backup
      (batch_id, tenant_id, user_id, key, value, updated_at)
    select '2026-10-16-four-learners-v1', tenant_id, user_id, key, value, updated_at
      from public.app_state
      where tenant_id = 'investec' and key = 'itss.progress.' || t.profile_id
    on conflict do nothing;

    merged := pg_temp.fill_missing_progress(current_text::jsonb, source_text::jsonb);
    select count(*) into before_units from jsonb_object_keys(current_text::jsonb -> 'units');
    select count(*) into after_units from jsonb_object_keys(merged -> 'units');
    if merged is distinct from current_text::jsonb then
      update public.app_state set value = merged::text, updated_at = now()
        where tenant_id = 'investec' and user_id = t.owner_id
          and key = 'itss.progress.' || t.profile_id;
    end if;
    insert into recovery_result values (t.learner,
      case when merged is distinct from current_text::jsonb
        then 'Missing progress restored; current values preserved'
        else 'Already contains recovered progress; no change needed' end,
      before_units, after_units);
  end loop;
end;
$$;

select * from recovery_result order by learner;
commit;
