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

-- Users can only read and write their own rows.
alter table public.app_state enable row level security;

drop policy if exists "own app state" on public.app_state;
create policy "own app state"
  on public.app_state
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
