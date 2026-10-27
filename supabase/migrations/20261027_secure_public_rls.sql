-- Secure all current public tables, including recovery backups created with
-- CREATE TABLE AS (which does not inherit RLS or privileges from its source).
-- Existing application rows and backup data are not changed.

-- Tenant membership must not depend on user_metadata in a JWT: signed-in
-- users can edit that metadata. Freeze the tenant at account creation instead.
create table if not exists public.account_tenants (
  user_id uuid primary key references auth.users (id) on delete cascade,
  tenant_id text not null check (tenant_id in ('investec', 'discovery'))
);
alter table public.account_tenants enable row level security;
revoke all on table public.account_tenants from public, anon, authenticated;

insert into public.account_tenants (user_id, tenant_id)
select id, coalesce(
  nullif(raw_app_meta_data ->> 'tenant_id', ''),
  nullif(raw_user_meta_data ->> 'tenant_id', ''),
  'investec'
)
from auth.users
on conflict (user_id) do nothing;

create or replace function public.assign_account_tenant()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.account_tenants (user_id, tenant_id)
  values (
    new.id,
    coalesce(
      nullif(new.raw_app_meta_data ->> 'tenant_id', ''),
      nullif(new.raw_user_meta_data ->> 'tenant_id', ''),
      'investec'
    )
  );
  return new;
end;
$$;
revoke all on function public.assign_account_tenant() from public, anon, authenticated;
drop trigger if exists assign_account_tenant on auth.users;
create trigger assign_account_tenant
after insert on auth.users
for each row execute function public.assign_account_tenant();

create or replace function public.current_tenant()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select t.tenant_id
  from public.account_tenants t
  where t.user_id = (select auth.uid());
$$;
revoke all on function public.current_tenant() from public, anon;
grant execute on function public.current_tenant() to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins a
    where a.user_id = (select auth.uid())
      and a.tenant_id = (select public.current_tenant())
  );
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- RLS is already present on the active tables. Reassert it and remove default
-- grants such as TRUNCATE, which RLS does not restrict. Keep only the operations
-- used by the client. service_role and database administrators remain able to
-- perform maintenance.
alter table public.admins enable row level security;
alter table public.app_state enable row level security;
alter table public.chat_messages enable row level security;
alter table public.forms enable row level security;
alter table public.form_responses enable row level security;
alter table public.lesson_video_views enable row level security;
alter table public.lesson_video_view_receipts enable row level security;
alter table public.profile_progress_owners enable row level security;
alter table public.shared_state enable row level security;
alter table public.token_usage enable row level security;

revoke all on table public.admins, public.app_state, public.chat_messages,
  public.forms, public.form_responses, public.lesson_video_views,
  public.lesson_video_view_receipts, public.profile_progress_owners,
  public.shared_state, public.token_usage from public, anon, authenticated;

grant select on table public.admins to authenticated;
grant select, insert, update, delete on table public.app_state,
  public.chat_messages, public.forms, public.form_responses,
  public.shared_state to authenticated;
grant select, insert on table public.token_usage to authenticated;

-- Backups are maintenance artifacts. No browser or signed-in account needs
-- direct access. Include every currently unprotected public table so a missed
-- recovery-table name cannot remain exposed.
do $$
declare
  item record;
begin
  for item in
    select n.nspname, c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and not c.relrowsecurity
  loop
    execute format('alter table %I.%I enable row level security', item.nspname, item.relname);
    execute format('revoke all on table %I.%I from public, anon, authenticated', item.nspname, item.relname);
  end loop;
end;
$$;

notify pgrst, 'reload schema';
