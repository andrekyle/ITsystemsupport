-- Let the designated platform Super User review video discussions across cohorts.
-- Learners and staff remain restricted to their own tenant.
begin;

create or replace function public.is_platform_super_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admins administrator
    where administrator.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_platform_super_user() from public, anon;
grant execute on function public.is_platform_super_user() to authenticated;

drop policy if exists "tenant reads video likes" on public.lesson_video_likes;
drop policy if exists "tenant or super user reads video likes" on public.lesson_video_likes;
create policy "tenant or super user reads video likes"
on public.lesson_video_likes
for select
to authenticated
using (
  tenant_id = (select public.current_tenant())
  or (select public.is_platform_super_user())
);

drop policy if exists "tenant reads video comments" on public.lesson_video_comments;
drop policy if exists "tenant or super user reads video comments" on public.lesson_video_comments;
create policy "tenant or super user reads video comments"
on public.lesson_video_comments
for select
to authenticated
using (
  tenant_id = (select public.current_tenant())
  or (select public.is_platform_super_user())
);

drop policy if exists "tenant reads comment likes" on public.lesson_video_comment_likes;
drop policy if exists "tenant or super user reads comment likes" on public.lesson_video_comment_likes;
create policy "tenant or super user reads comment likes"
on public.lesson_video_comment_likes
for select
to authenticated
using (
  tenant_id = (select public.current_tenant())
  or (select public.is_platform_super_user())
);

notify pgrst, 'reload schema';
commit;
