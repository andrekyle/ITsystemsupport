-- Shared, tenant-isolated video discussion. Apply in the Supabase SQL editor.
begin;

create table if not exists public.lesson_video_likes (
  tenant_id text not null default public.current_tenant(),
  video_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (tenant_id, video_id, user_id)
);
create table if not exists public.lesson_video_comments (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null default public.current_tenant(),
  video_id text not null,
  parent_id uuid references public.lesson_video_comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null check (length(author_name) between 1 and 120),
  body text not null check (length(body) between 1 and 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists lesson_video_comments_video_idx on public.lesson_video_comments (tenant_id, video_id, created_at);
create or replace function public.check_lesson_video_comment_identity()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'UPDATE' and (
    new.tenant_id <> old.tenant_id or new.video_id <> old.video_id
    or new.user_id <> old.user_id or new.parent_id is distinct from old.parent_id
  ) then
    raise exception 'A comment can only be edited, not moved.';
  end if;
  if new.parent_id is not null and not exists (
    select 1 from public.lesson_video_comments parent
    where parent.id = new.parent_id and parent.tenant_id = new.tenant_id
      and parent.video_id = new.video_id
  ) then
    raise exception 'Replies must belong to the same video.';
  end if;
  return new;
end;
$$;
drop trigger if exists check_lesson_video_comment_identity on public.lesson_video_comments;
create trigger check_lesson_video_comment_identity
before insert or update on public.lesson_video_comments
for each row execute function public.check_lesson_video_comment_identity();
create table if not exists public.lesson_video_comment_likes (
  tenant_id text not null default public.current_tenant(),
  comment_id uuid not null references public.lesson_video_comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (tenant_id, comment_id, user_id)
);

alter table public.lesson_video_likes enable row level security;
alter table public.lesson_video_comments enable row level security;
alter table public.lesson_video_comment_likes enable row level security;

grant select, insert, delete on public.lesson_video_likes to authenticated;
grant select, insert, update on public.lesson_video_comments to authenticated;
grant select, insert, delete on public.lesson_video_comment_likes to authenticated;
revoke all on public.lesson_video_likes, public.lesson_video_comments, public.lesson_video_comment_likes from anon;

create policy "tenant reads video likes" on public.lesson_video_likes for select to authenticated
  using (tenant_id = (select public.current_tenant()));
create policy "user likes video" on public.lesson_video_likes for insert to authenticated
  with check (tenant_id = (select public.current_tenant()) and user_id = (select auth.uid()));
create policy "user unlikes video" on public.lesson_video_likes for delete to authenticated
  using (tenant_id = (select public.current_tenant()) and user_id = (select auth.uid()));

create policy "tenant reads video comments" on public.lesson_video_comments for select to authenticated
  using (tenant_id = (select public.current_tenant()));
create policy "user posts video comment" on public.lesson_video_comments for insert to authenticated
  with check (
    tenant_id = (select public.current_tenant()) and user_id = (select auth.uid())
    and length(video_id) between 1 and 2048
  );
create policy "user edits video comment" on public.lesson_video_comments for update to authenticated
  using (tenant_id = (select public.current_tenant()) and user_id = (select auth.uid()))
  with check (tenant_id = (select public.current_tenant()) and user_id = (select auth.uid()));

create policy "tenant reads comment likes" on public.lesson_video_comment_likes for select to authenticated
  using (tenant_id = (select public.current_tenant()));
create policy "user likes comment" on public.lesson_video_comment_likes for insert to authenticated
  with check (
    tenant_id = (select public.current_tenant()) and user_id = (select auth.uid())
    and exists (select 1 from public.lesson_video_comments comment
      where comment.id = lesson_video_comment_likes.comment_id
        and comment.tenant_id = lesson_video_comment_likes.tenant_id)
  );
create policy "user unlikes comment" on public.lesson_video_comment_likes for delete to authenticated
  using (tenant_id = (select public.current_tenant()) and user_id = (select auth.uid()));

notify pgrst, 'reload schema';
commit;
