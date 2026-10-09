-- Defence-in-depth tenant lockdown for direct messages.
-- Safe to re-run. Existing chat rows remain assigned to Investec.

create or replace function public.current_tenant()
returns text language sql stable as $$
  select coalesce(
    nullif(auth.jwt() -> 'app_metadata' ->> 'tenant_id', ''),
    nullif(auth.jwt() -> 'user_metadata' ->> 'tenant_id', ''),
    'investec'
  );
$$;

alter table public.chat_messages
  add column if not exists tenant_id text not null default 'investec';

create index if not exists chat_messages_tenant_idx
  on public.chat_messages (tenant_id, sent_at);

alter table public.chat_messages enable row level security;

drop policy if exists "read chat messages" on public.chat_messages;
create policy "read chat messages" on public.chat_messages for select to authenticated
  using (
    tenant_id = public.current_tenant()
    and (auth.uid() in (sender_user_id, recipient_user_id) or public.is_admin())
  );

drop policy if exists "send chat messages" on public.chat_messages;
create policy "send chat messages" on public.chat_messages for insert to authenticated
  with check (
    tenant_id = public.current_tenant()
    and (auth.uid() = sender_user_id or public.is_admin())
  );

drop policy if exists "update chat messages" on public.chat_messages;
create policy "update chat messages" on public.chat_messages for update to authenticated
  using (
    tenant_id = public.current_tenant()
    and (auth.uid() in (sender_user_id, recipient_user_id) or public.is_admin())
  )
  with check (
    tenant_id = public.current_tenant()
    and (auth.uid() in (sender_user_id, recipient_user_id) or public.is_admin())
  );

drop policy if exists "delete chat messages" on public.chat_messages;
create policy "delete chat messages" on public.chat_messages for delete to authenticated
  using (
    tenant_id = public.current_tenant()
    and (auth.uid() = sender_user_id or public.is_admin())
  );
