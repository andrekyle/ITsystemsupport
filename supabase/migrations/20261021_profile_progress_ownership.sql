-- Prevent retired device/facilitator snapshots from recreating duplicate
-- progress rows after a learner's profile has been consolidated.
create table if not exists public.profile_progress_owners (
  tenant_id text not null,
  profile_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (tenant_id, profile_id)
);

alter table public.profile_progress_owners enable row level security;

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

  progress_profile_id := substring(new.key from length('itss.progress.') + 1);
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

drop trigger if exists enforce_profile_progress_owner on public.app_state;
create trigger enforce_profile_progress_owner
before insert or update of user_id, tenant_id, key on public.app_state
for each row execute function public.enforce_profile_progress_owner();

insert into public.profile_progress_owners (tenant_id, profile_id, user_id)
values
  ('investec', 'p_mrom65g0_ho04y', 'b4080237-546b-42a4-beb7-c8e55812f4f9'::uuid),
  ('investec', 'p_mromq49w_0jfmq', '0167b875-b652-4bfd-aa52-86a7442c8ba5'::uuid)
on conflict (tenant_id, profile_id) do update set user_id = excluded.user_id;
