create table if not exists public.lesson_video_views (
  tenant_id text not null,
  video_id text not null,
  view_count bigint not null default 0 check (view_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, video_id)
);

alter table public.lesson_video_views enable row level security;
revoke all on public.lesson_video_views from anon, authenticated;

create or replace function public.record_lesson_video_view(p_video_id text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  recorded_count bigint;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required to record a video view.';
  end if;

  if p_video_id is null or length(btrim(p_video_id)) = 0 or length(p_video_id) > 2048 then
    raise exception 'A valid video identifier is required.';
  end if;

  insert into public.lesson_video_views (tenant_id, video_id, view_count, updated_at)
  values (public.current_tenant(), p_video_id, 1, now())
  on conflict (tenant_id, video_id) do update
    set view_count = public.lesson_video_views.view_count + 1,
        updated_at = now()
  returning view_count into recorded_count;

  return recorded_count;
end;
$$;

revoke all on function public.record_lesson_video_view(text) from public, anon;
grant execute on function public.record_lesson_video_view(text) to authenticated;
