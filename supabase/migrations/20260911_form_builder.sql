create table if not exists public.forms (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '',
  definition jsonb not null check (
    jsonb_typeof(definition) = 'object'
    and jsonb_typeof(definition -> 'sections') = 'array'
    and octet_length(definition::text) <= 500000
  ),
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source_name text not null default '',
  source_type text not null default '',
  source_size bigint not null default 0 check (source_size >= 0),
  source_path text
);

create table if not exists public.form_responses (
  form_id uuid not null references public.forms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  profile_id text not null,
  answers jsonb not null default '{}'::jsonb check (
    jsonb_typeof(answers) = 'object' and octet_length(answers::text) <= 500000
  ),
  updated_at timestamptz not null default now(),
  primary key (form_id, user_id, profile_id)
);

create index if not exists forms_created_at_idx on public.forms (created_at desc);
create index if not exists form_responses_user_idx on public.form_responses (user_id);

alter table public.forms enable row level security;
alter table public.form_responses enable row level security;

drop policy if exists "read published forms" on public.forms;
create policy "read published forms" on public.forms
  for select to authenticated using (true);

drop policy if exists "admin creates forms" on public.forms;
create policy "admin creates forms" on public.forms
  for insert to authenticated
  with check (public.is_admin() and created_by = auth.uid());

drop policy if exists "admin updates forms" on public.forms;
create policy "admin updates forms" on public.forms
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin deletes forms" on public.forms;
create policy "admin deletes forms" on public.forms
  for delete to authenticated using (public.is_admin());

drop policy if exists "read own form responses" on public.form_responses;
create policy "read own form responses" on public.form_responses
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists "insert own form responses" on public.form_responses;
create policy "insert own form responses" on public.form_responses
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "update own form responses" on public.form_responses;
create policy "update own form responses" on public.form_responses
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "delete own form responses" on public.form_responses;
create policy "delete own form responses" on public.form_responses
  for delete to authenticated using (user_id = auth.uid() or public.is_admin());

grant select, insert, update, delete on public.forms to authenticated;
grant select, insert, update, delete on public.form_responses to authenticated;

insert into storage.buckets (id, name, public, file_size_limit)
values ('form-sources', 'form-sources', false, 10485760)
on conflict (id) do nothing;

drop policy if exists "admin reads form sources" on storage.objects;
create policy "admin reads form sources" on storage.objects
  for select to authenticated using (bucket_id = 'form-sources' and public.is_admin());

drop policy if exists "admin uploads form sources" on storage.objects;
create policy "admin uploads form sources" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'form-sources' and public.is_admin()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "admin deletes form sources" on storage.objects;
create policy "admin deletes form sources" on storage.objects
  for delete to authenticated using (bucket_id = 'form-sources' and public.is_admin());