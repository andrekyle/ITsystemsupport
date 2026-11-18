begin;

create table if not exists public.client_portal_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tenant_id text not null,
  display_name text not null,
  email text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.client_portal_learners (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  learner_ref text not null,
  name text not null,
  programme text not null,
  start_date date,
  end_date date,
  status text not null default 'Enrolled',
  published_at timestamptz not null default now(),
  unique(tenant_id, learner_ref)
);
create table if not exists public.client_portal_documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  title text not null,
  category text not null check (category in ('Evidence', 'Reports', 'Registers', 'Workbooks', 'Programme')),
  filename text not null,
  storage_path text not null unique,
  file_size bigint not null check (file_size >= 0),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  check (split_part(storage_path, '/', 1) = tenant_id)
);

create or replace function public.is_client_portal()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'portal_role', '') = 'client'
    or exists (select 1 from public.client_portal_accounts where user_id = auth.uid());
$$;
create or replace function public.client_portal_access(target_tenant text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.client_portal_accounts
    where user_id = auth.uid() and enabled and tenant_id = target_tenant);
$$;
revoke all on function public.is_client_portal() from public;
revoke all on function public.client_portal_access(text) from public;
grant execute on function public.is_client_portal() to authenticated;
grant execute on function public.client_portal_access(text) to authenticated;

alter table public.client_portal_accounts enable row level security;
alter table public.client_portal_learners enable row level security;
alter table public.client_portal_documents enable row level security;
grant select, insert, update, delete on public.client_portal_accounts, public.client_portal_learners, public.client_portal_documents to authenticated;

create policy "portal account read" on public.client_portal_accounts for select to authenticated
  using (user_id = auth.uid() or (not public.is_client_portal() and tenant_id = public.current_tenant() and public.is_admin()));
create policy "portal account administration" on public.client_portal_accounts for update to authenticated
  using (not public.is_client_portal() and tenant_id = public.current_tenant() and public.is_admin())
  with check (not public.is_client_portal() and tenant_id = public.current_tenant() and public.is_admin());
-- Account creation is server-side only. No browser may create or move membership.
revoke insert, delete on public.client_portal_accounts from authenticated;
revoke update on public.client_portal_accounts from authenticated;
grant update (enabled) on public.client_portal_accounts to authenticated;

create policy "published learner read" on public.client_portal_learners for select to authenticated
  using (public.client_portal_access(tenant_id) or (not public.is_client_portal() and tenant_id = public.current_tenant() and public.is_admin()));
create policy "publish learner administration" on public.client_portal_learners for all to authenticated
  using (not public.is_client_portal() and tenant_id = public.current_tenant() and public.is_admin())
  with check (not public.is_client_portal() and tenant_id = public.current_tenant() and public.is_admin());
create policy "published document read" on public.client_portal_documents for select to authenticated
  using ((published and public.client_portal_access(tenant_id)) or (not public.is_client_portal() and tenant_id = public.current_tenant() and public.is_admin()));
create policy "publish document administration" on public.client_portal_documents for all to authenticated
  using (not public.is_client_portal() and tenant_id = public.current_tenant() and public.is_admin())
  with check (not public.is_client_portal() and tenant_id = public.current_tenant() and public.is_admin());

-- Client accounts cannot enter the learning/staff data plane, even through its APIs.
do $$ declare target record; begin
  for target in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
      and c.relname not like 'client_portal_%'
  loop
    execute format('create policy "exclude client portal accounts" on public.%I as restrictive for all to authenticated using (not public.is_client_portal()) with check (not public.is_client_portal())', target.relname);
  end loop;
end $$;

insert into storage.buckets(id, name, public, file_size_limit)
values ('client-evidence', 'client-evidence', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;
create policy "client evidence read" on storage.objects for select to authenticated
  using (bucket_id = 'client-evidence' and (
    (not public.is_client_portal() and (storage.foldername(name))[1] = public.current_tenant() and public.is_admin())
    or exists (select 1 from public.client_portal_documents d where d.storage_path = name and d.published and public.client_portal_access(d.tenant_id))
  ));
create policy "client evidence administration" on storage.objects for all to authenticated
  using (bucket_id = 'client-evidence' and not public.is_client_portal() and (storage.foldername(name))[1] = public.current_tenant() and public.is_admin())
  with check (bucket_id = 'client-evidence' and not public.is_client_portal() and (storage.foldername(name))[1] = public.current_tenant() and public.is_admin());
-- Restrictive rules also cover broad legacy file policies in this shared bucket table.
create policy "client files limited to published evidence" on storage.objects as restrictive for select to authenticated
  using (not public.is_client_portal() or (bucket_id = 'client-evidence' and exists (
    select 1 from public.client_portal_documents d where d.storage_path = name and d.published and public.client_portal_access(d.tenant_id))));
create policy "client cannot insert files" on storage.objects as restrictive for insert to authenticated with check (not public.is_client_portal());
create policy "client cannot update files" on storage.objects as restrictive for update to authenticated using (not public.is_client_portal()) with check (not public.is_client_portal());
create policy "client cannot delete files" on storage.objects as restrictive for delete to authenticated using (not public.is_client_portal());
commit;
notify pgrst, 'reload schema';
