-- ITSS Learn — Supabase schema
-- Run this once in your Supabase project: Dashboard → SQL Editor → New query → paste → Run.

-- One row per synced app-state key, per authenticated user.
create table if not exists public.app_state (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  key        text        not null,
  value      text        not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

-- Admins (the super user) may edit and delete ANY account's rows.
-- Add yourself once, either by email:
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'YOUR-EMAIL-HERE'
--   on conflict (user_id) do nothing;
-- or automatically via the synced Super User profile:
--   insert into public.admins (user_id)
--   select user_id from public.app_state
--   where key = 'itss.profiles'
--     and value like '%"Andre Snell"%'
--     and value like '%"Super User"%'
--   on conflict (user_id) do nothing;
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.admins enable row level security;

drop policy if exists "read admins" on public.admins;
create policy "read admins"
  on public.admins
  for select
  to authenticated
  using (true);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

-- Signed-in users can read every account's rows (needed so facilitators and the
-- super user can see learners who sign in with their own email accounts).
-- Writes: each user's own rows, or any row for admins.
alter table public.app_state enable row level security;

drop policy if exists "own app state" on public.app_state;

drop policy if exists "read app state" on public.app_state;
create policy "read app state"
  on public.app_state
  for select
  to authenticated
  using (true);

drop policy if exists "insert own app state" on public.app_state;
create policy "insert own app state"
  on public.app_state
  for insert
  to authenticated
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "update own app state" on public.app_state;
create policy "update own app state"
  on public.app_state
  for update
  to authenticated
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "delete own app state" on public.app_state;
create policy "delete own app state"
  on public.app_state
  for delete
  to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- Shared content (facilitator notes, lesson-plan slides): one row per key,
-- visible to every signed-in user. The app's UI limits who can edit it.
create table if not exists public.shared_state (
  key        text        primary key,
  value      text        not null,
  updated_at timestamptz not null default now()
);

alter table public.shared_state enable row level security;

drop policy if exists "read shared state" on public.shared_state;
create policy "read shared state"
  on public.shared_state
  for select
  to authenticated
  using (true);

drop policy if exists "write shared state" on public.shared_state;
create policy "write shared state"
  on public.shared_state
  for all
  to authenticated
  using (true)
  with check (true);

-- File storage: uploaded documents (POE evidence, lesson-plan/course PDFs).
-- Private files live under <auth-uid>/... ; shared uploads under shared/... .
insert into storage.buckets (id, name, public)
values ('files', 'files', false)
on conflict (id) do nothing;

drop policy if exists "read app files" on storage.objects;
create policy "read app files"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'files');

drop policy if exists "insert app files" on storage.objects;
create policy "insert app files"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'files'
    and (storage.foldername(name))[1] in (auth.uid()::text, 'shared')
  );

drop policy if exists "update app files" on storage.objects;
create policy "update app files"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'files'
    and (storage.foldername(name))[1] in (auth.uid()::text, 'shared')
  );

drop policy if exists "delete app files" on storage.objects;
create policy "delete app files"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'files'
    and (storage.foldername(name))[1] in (auth.uid()::text, 'shared')
  );



