-- ITSS Learn — Supabase bootstrap schema.
-- Apply migrations in date order after this file, including
-- migrations/20261027_secure_public_rls.sql. Do not rerun this bootstrap on an
-- existing database: its original policies would replace the hardened ones.
-- Run this once in your Supabase project: Dashboard → SQL Editor → New query → paste → Run.
--
-- REQUIRED AUTH SETTING: Dashboard → Authentication → Sign In / Providers → Email
-- → turn OFF "Confirm email". Sign-ups must work without a confirmation step.
-- To unlock accounts created while confirmation was on:
--   update auth.users set email_confirmed_at = now() where email_confirmed_at is null;
--
-- PASSWORD RESET EMAILS: Dashboard → Authentication → URL Configuration
-- → set Site URL to the deployed app URL (and add it to Redirect URLs) so the
-- "Forgot password?" links land back in the app.

-- One row per synced app-state key, per authenticated user.
create table if not exists public.app_state (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  tenant_id  text        not null default 'investec',
  key        text        not null,
  value      text        not null,
  updated_at timestamptz not null default now(),
  primary key (tenant_id, user_id, key)
);

-- Admins (the super user) may edit and delete ANY account's rows.
-- THERE IS ONLY ONE SUPER USER: andresnell29@gmail.com.
-- Register it once (safe to re-run):
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'andresnell29@gmail.com'
--   on conflict (user_id) do nothing;
-- Remove anyone else who somehow ended up here:
--   delete from public.admins
--   where user_id not in (
--     select id from auth.users where email = 'andresnell29@gmail.com'
--   );
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

-- Resolve the signed-in account's company. Legacy accounts default to
-- Investec until the app assigns their tenant during sign-in.
create or replace function public.current_tenant()
returns text language sql stable as $$
  select coalesce(
    nullif(auth.jwt() -> 'app_metadata' ->> 'tenant_id', ''),
    nullif(auth.jwt() -> 'user_metadata' ->> 'tenant_id', ''),
    'investec'
  );
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


-- ============================================================================
-- Direct-message chat (1-to-1, database-enforced privacy)
-- ============================================================================
-- Every message has a real sender/recipient auth user id, so RLS restricts
-- reads to *those two people* plus admins (super users). Other learners
-- cannot see the row at all, even by querying Supabase directly.
create table if not exists public.chat_messages (
  id                   uuid        primary key default gen_random_uuid(),
  tenant_id            text        not null default 'investec',
  sender_user_id       uuid        not null references auth.users (id) on delete cascade,
  recipient_user_id    uuid        not null references auth.users (id) on delete cascade,
  -- App-side profile ids (may differ from auth ids on this device — the client
  -- resolves them via the identity-aware directory) used purely for display
  -- and pair-keying so both sides see the same thread.
  sender_profile_id    text        not null,
  recipient_profile_id text        not null,
  sender_name          text        not null,
  sender_role          text        not null,
  body                 text        not null,
  sent_at              timestamptz not null default now(),
  read_at              timestamptz,
  edited_at            timestamptz
);

-- Older installs that created the table before message editing existed:
alter table public.chat_messages add column if not exists edited_at timestamptz;
-- Reactions: the recipient can like/love a message (stored as the emoji).
alter table public.chat_messages add column if not exists reaction text;
-- Broadcasts ("message all learners"): every per-recipient copy of one send
-- shares this id so the sender can edit all copies in one statement.
alter table public.chat_messages add column if not exists broadcast_id uuid;
alter table public.chat_messages add column if not exists tenant_id text not null default 'investec';

create index if not exists chat_messages_tenant_idx
  on public.chat_messages (tenant_id, sent_at);

create index if not exists chat_messages_broadcast_idx
  on public.chat_messages (broadcast_id) where broadcast_id is not null;

create index if not exists chat_messages_participants_idx
  on public.chat_messages (sender_user_id, recipient_user_id, sent_at);
create index if not exists chat_messages_recipient_idx
  on public.chat_messages (recipient_user_id, sent_at);
create index if not exists chat_messages_sender_idx
  on public.chat_messages (sender_user_id, sent_at);

alter table public.chat_messages enable row level security;

drop policy if exists "read chat messages" on public.chat_messages;
create policy "read chat messages"
  on public.chat_messages
  for select
  to authenticated
  using (
    tenant_id = public.current_tenant()
    and (auth.uid() in (sender_user_id, recipient_user_id) or public.is_admin())
  );

drop policy if exists "send chat messages" on public.chat_messages;
create policy "send chat messages"
  on public.chat_messages
  for insert
  to authenticated
  with check (
    tenant_id = public.current_tenant()
    and (auth.uid() = sender_user_id or public.is_admin())
  );

drop policy if exists "update chat messages" on public.chat_messages;
create policy "update chat messages"
  on public.chat_messages
  for update
  to authenticated
  using (
    tenant_id = public.current_tenant()
    and (auth.uid() in (sender_user_id, recipient_user_id) or public.is_admin())
  )
  with check (
    tenant_id = public.current_tenant()
    and (auth.uid() in (sender_user_id, recipient_user_id) or public.is_admin())
  );

drop policy if exists "delete chat messages" on public.chat_messages;
create policy "delete chat messages"
  on public.chat_messages
  for delete
  to authenticated
  using (
    tenant_id = public.current_tenant()
    and (auth.uid() = sender_user_id or public.is_admin())
  );


-- ============================================================================
-- AI-marking token usage (super-user token gauge)
-- ============================================================================
-- One row per /api/mark-answer call, inserted by the calling client and
-- tagged qualification → module → unit standard. Rows are insert-only from
-- the app; only admins (the super user) can read them, via RLS.
create table if not exists public.token_usage (
  id                bigint      generated always as identity primary key,
  user_id           uuid        references auth.users (id) on delete set null,
  qual              text        not null,
  module_id         text        not null default '',
  us                text        not null default '',
  model             text        not null default '',
  prompt_tokens     integer     not null default 0,
  completion_tokens integer     not null default 0,
  total_tokens      integer     not null default 0,
  created_at        timestamptz not null default now()
);

create index if not exists token_usage_created_idx on public.token_usage (created_at);
create index if not exists token_usage_us_idx on public.token_usage (qual, module_id, us);

alter table public.token_usage enable row level security;

drop policy if exists "read token usage" on public.token_usage;
create policy "read token usage"
  on public.token_usage
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "insert token usage" on public.token_usage;
create policy "insert token usage"
  on public.token_usage
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Grouped sums for the dashboard gauge, optionally since a timestamp.
-- SECURITY INVOKER (the default): RLS applies, so non-admins get no rows.
create or replace function public.token_usage_summary(since timestamptz default null)
returns table (
  qual              text,
  module_id         text,
  us                text,
  model             text,
  requests          bigint,
  prompt_tokens     bigint,
  completion_tokens bigint,
  total_tokens      bigint
)
language sql
stable
set search_path = public
as $$
  select
    t.qual,
    t.module_id,
    t.us,
    t.model,
    count(*)::bigint,
    coalesce(sum(t.prompt_tokens), 0)::bigint,
    coalesce(sum(t.completion_tokens), 0)::bigint,
    coalesce(sum(t.total_tokens), 0)::bigint
  from public.token_usage t
  where since is null or t.created_at >= since
  group by t.qual, t.module_id, t.us, t.model
  order by t.qual, t.module_id, t.us, t.model;
$$;

-- Video views: included in new installations; existing deployments apply
-- migrations/20261013_lesson_video_daily_view_rpc.sql, which also resets old
-- click-based totals once. Each signed-in learner counts at most once per
-- video per calendar day (midnight South African time), and the result says
-- whether the call counted so the app can tell learners they were already
-- counted today.
create table if not exists public.lesson_video_views (
  tenant_id text not null,
  video_id text not null,
  view_count bigint not null default 0 check (view_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, video_id)
);
alter table public.lesson_video_views enable row level security;
revoke all on public.lesson_video_views from public, anon, authenticated;

create table if not exists public.lesson_video_view_receipts (
  tenant_id text not null,
  video_id text not null,
  user_id uuid not null,
  last_counted_at timestamptz not null,
  primary key (tenant_id, video_id, user_id)
);
alter table public.lesson_video_view_receipts enable row level security;
revoke all on public.lesson_video_view_receipts from public, anon, authenticated;

create or replace function public.record_lesson_video_daily_view(p_video_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  platform_zone constant text := 'Africa/Johannesburg';
  viewer_id uuid := auth.uid();
  viewer_tenant text := public.current_tenant();
  viewed_at timestamptz := clock_timestamp();
  accepted_at timestamptz;
  recorded_count bigint;
begin
  if viewer_id is null then
    raise exception 'Authentication is required to record a video view.';
  end if;
  if viewer_tenant is null or length(btrim(viewer_tenant)) = 0 then
    raise exception 'A tenant is required to record a video view.';
  end if;
  if p_video_id is null or length(btrim(p_video_id)) = 0 or length(p_video_id) > 2048 then
    raise exception 'A valid video identifier is required.';
  end if;
  insert into public.lesson_video_view_receipts (tenant_id, video_id, user_id, last_counted_at)
  values (viewer_tenant, p_video_id, viewer_id, viewed_at)
  on conflict (tenant_id, video_id, user_id) do update
    set last_counted_at = excluded.last_counted_at
    where (public.lesson_video_view_receipts.last_counted_at at time zone platform_zone)::date
        < (viewed_at at time zone platform_zone)::date
  returning last_counted_at into accepted_at;
  if accepted_at is not null then
    insert into public.lesson_video_views (tenant_id, video_id, view_count, updated_at)
    values (viewer_tenant, p_video_id, 1, viewed_at)
    on conflict (tenant_id, video_id) do update
      set view_count = public.lesson_video_views.view_count + 1,
          updated_at = excluded.updated_at
    returning view_count into recorded_count;
  else
    select view_count into recorded_count from public.lesson_video_views
    where tenant_id = viewer_tenant and video_id = p_video_id;
    if recorded_count is null then
      raise exception 'The video view total is missing. Contact an administrator.';
    end if;
  end if;
  return jsonb_build_object('views', recorded_count, 'counted', accepted_at is not null);
end;
$$;
revoke all on function public.record_lesson_video_daily_view(text) from public, anon;
grant execute on function public.record_lesson_video_daily_view(text) to authenticated;
notify pgrst, 'reload schema';

