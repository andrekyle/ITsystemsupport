-- Complete tenant isolation for cached/shared application state.
-- Safe to re-run after 20261009_multi_tenant.sql.

alter table public.app_state
  add column if not exists tenant_id text not null default 'investec';

alter table public.app_state drop constraint if exists app_state_pkey;
alter table public.app_state
  add primary key (tenant_id, user_id, key);

create index if not exists app_state_tenant_idx
  on public.app_state (tenant_id, key);

-- Discovery had no valid polls before tenant separation. Remove any poll list
-- copied from the legacy Investec shared row while the old broad policy was live.
delete from public.shared_state
where tenant_id = 'discovery'
  and key = 'itss.polls.shared';
