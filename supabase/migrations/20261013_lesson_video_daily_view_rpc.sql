-- Run this file in the Supabase SQL editor. It is safe on any deployment:
-- with or without 20261012_lesson_video_views.sql and
-- 20261012_lesson_video_daily_views.sql applied, and it can be rerun.
--
-- Platform video views count each signed-in learner at most once per video per
-- calendar day. Days start at midnight South African time
-- (Africa/Johannesburg), where the platform and its learners are based. The
-- counter gets its own RPC name so the app can tell a database that still runs
-- the legacy per-click counter apart from one that counts correctly (it
-- reports the missing migration instead of silently inflating totals), and the
-- legacy per-click RPC is removed. The result reports the platform total and
-- whether this call counted as today's view.
begin;

create table if not exists public.lesson_video_views (
  tenant_id text not null,
  video_id text not null,
  view_count bigint not null default 0 check (view_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, video_id)
);
alter table public.lesson_video_views enable row level security;
revoke all on public.lesson_video_views from public, anon, authenticated;

lock table public.lesson_video_views in access exclusive mode;

-- Totals recorded before receipts existed were per-click; start them over once.
do $$
begin
  if to_regclass('public.lesson_video_view_receipts') is null then
    delete from public.lesson_video_views;
  end if;
end;
$$;

create table if not exists public.lesson_video_view_receipts (
  tenant_id text not null,
  video_id text not null,
  user_id uuid not null,
  last_counted_at timestamptz not null,
  primary key (tenant_id, video_id, user_id)
);
alter table public.lesson_video_view_receipts enable row level security;
revoke all on public.lesson_video_view_receipts from public, anon, authenticated;

drop function if exists public.record_lesson_video_view(text);

create or replace function public.record_lesson_video_daily_view(p_video_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  -- Views reset at midnight in this zone (SAST, no daylight saving).
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
commit;
