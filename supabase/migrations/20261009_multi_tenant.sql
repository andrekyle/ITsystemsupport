-- Investec + Discovery tenant isolation. Existing rows/accounts belong to Investec.
-- Run after schema.sql and the form-builder migrations.

create or replace function public.current_tenant()
returns text language sql stable as $$
  select coalesce(
    nullif(auth.jwt() -> 'app_metadata' ->> 'tenant_id', ''),
    nullif(auth.jwt() -> 'user_metadata' ->> 'tenant_id', ''),
    'investec'
  );
$$;

alter table public.app_state add column if not exists tenant_id text not null default 'investec';
create index if not exists app_state_tenant_idx on public.app_state (tenant_id, key);

alter table public.shared_state add column if not exists tenant_id text not null default 'investec';
alter table public.shared_state drop constraint if exists shared_state_pkey;
alter table public.shared_state add primary key (tenant_id, key);

alter table public.chat_messages add column if not exists tenant_id text not null default 'investec';
create index if not exists chat_messages_tenant_idx on public.chat_messages (tenant_id, sent_at);

alter table public.token_usage add column if not exists tenant_id text not null default 'investec';

drop policy if exists "read token usage" on public.token_usage;
create policy "read token usage" on public.token_usage for select to authenticated
  using (tenant_id = public.current_tenant() and public.is_admin());
drop policy if exists "insert token usage" on public.token_usage;
create policy "insert token usage" on public.token_usage for insert to authenticated
  with check (tenant_id = public.current_tenant() and (user_id is null or user_id = auth.uid()));

drop policy if exists "read app state" on public.app_state;
create policy "read app state" on public.app_state for select to authenticated
  using (tenant_id = public.current_tenant());
drop policy if exists "insert own app state" on public.app_state;
create policy "insert own app state" on public.app_state for insert to authenticated
  with check (tenant_id = public.current_tenant() and (auth.uid() = user_id or public.is_admin()));
drop policy if exists "update own app state" on public.app_state;
create policy "update own app state" on public.app_state for update to authenticated
  using (tenant_id = public.current_tenant() and (auth.uid() = user_id or public.is_admin()))
  with check (tenant_id = public.current_tenant() and (auth.uid() = user_id or public.is_admin()));
drop policy if exists "delete own app state" on public.app_state;
create policy "delete own app state" on public.app_state for delete to authenticated
  using (tenant_id = public.current_tenant() and (auth.uid() = user_id or public.is_admin()));

drop policy if exists "read shared state" on public.shared_state;
create policy "read shared state" on public.shared_state for select to authenticated
  using (tenant_id = public.current_tenant());
drop policy if exists "write shared state" on public.shared_state;
create policy "write shared state" on public.shared_state for all to authenticated
  using (tenant_id = public.current_tenant()) with check (tenant_id = public.current_tenant());

drop policy if exists "read chat messages" on public.chat_messages;
create policy "read chat messages" on public.chat_messages for select to authenticated
  using (tenant_id = public.current_tenant() and (auth.uid() in (sender_user_id, recipient_user_id) or public.is_admin()));
drop policy if exists "send chat messages" on public.chat_messages;
create policy "send chat messages" on public.chat_messages for insert to authenticated
  with check (tenant_id = public.current_tenant() and (auth.uid() = sender_user_id or public.is_admin()));
drop policy if exists "update chat messages" on public.chat_messages;
create policy "update chat messages" on public.chat_messages for update to authenticated
  using (tenant_id = public.current_tenant() and (auth.uid() in (sender_user_id, recipient_user_id) or public.is_admin()))
  with check (tenant_id = public.current_tenant() and (auth.uid() in (sender_user_id, recipient_user_id) or public.is_admin()));
drop policy if exists "delete chat messages" on public.chat_messages;
create policy "delete chat messages" on public.chat_messages for delete to authenticated
  using (tenant_id = public.current_tenant() and (auth.uid() = sender_user_id or public.is_admin()));

-- Files now live at <tenant>/<auth-uid>/... . Keep legacy one-folder objects
-- visible only to Investec while new Discovery objects are strictly prefixed.
drop policy if exists "read app files" on storage.objects;
create policy "read app files" on storage.objects for select to authenticated using (
  bucket_id = 'files' and (
    (storage.foldername(name))[1] = public.current_tenant()
    or (public.current_tenant() = 'investec' and (storage.foldername(name))[1] <> 'discovery')
  )
);
drop policy if exists "insert app files" on storage.objects;
create policy "insert app files" on storage.objects for insert to authenticated with check (
  bucket_id = 'files' and (storage.foldername(name))[1] = public.current_tenant()
  and (storage.foldername(name))[2] in (auth.uid()::text, 'shared')
);
drop policy if exists "update app files" on storage.objects;
create policy "update app files" on storage.objects for update to authenticated using (
  bucket_id = 'files' and (storage.foldername(name))[1] = public.current_tenant()
  and (storage.foldername(name))[2] in (auth.uid()::text, 'shared')
);
drop policy if exists "delete app files" on storage.objects;
create policy "delete app files" on storage.objects for delete to authenticated using (
  bucket_id = 'files' and (storage.foldername(name))[1] = public.current_tenant()
  and (storage.foldername(name))[2] in (auth.uid()::text, 'shared')
);

-- Forms and learner responses are tenant-owned too.
alter table if exists public.forms add column if not exists tenant_id text not null default 'investec';
alter table if exists public.form_responses add column if not exists tenant_id text not null default 'investec';
drop policy if exists "read published forms" on public.forms;
create policy "read published forms" on public.forms for select to authenticated using (tenant_id = public.current_tenant());
drop policy if exists "admin creates forms" on public.forms;
create policy "admin creates forms" on public.forms for insert to authenticated with check (tenant_id = public.current_tenant() and public.is_admin() and created_by = auth.uid());
drop policy if exists "admin updates forms" on public.forms;
create policy "admin updates forms" on public.forms for update to authenticated using (tenant_id = public.current_tenant() and public.is_admin()) with check (tenant_id = public.current_tenant() and public.is_admin());
drop policy if exists "admin deletes forms" on public.forms;
create policy "admin deletes forms" on public.forms for delete to authenticated using (tenant_id = public.current_tenant() and public.is_admin());
drop policy if exists "read own form responses" on public.form_responses;
create policy "read own form responses" on public.form_responses for select to authenticated using (tenant_id = public.current_tenant() and (user_id = auth.uid() or public.is_admin()));
drop policy if exists "insert own form responses" on public.form_responses;
create policy "insert own form responses" on public.form_responses for insert to authenticated with check (tenant_id = public.current_tenant() and user_id = auth.uid());
drop policy if exists "update own form responses" on public.form_responses;
create policy "update own form responses" on public.form_responses for update to authenticated using (tenant_id = public.current_tenant() and user_id = auth.uid()) with check (tenant_id = public.current_tenant() and user_id = auth.uid());
drop policy if exists "delete own form responses" on public.form_responses;
create policy "delete own form responses" on public.form_responses for delete to authenticated using (tenant_id = public.current_tenant() and (user_id = auth.uid() or public.is_admin()));
