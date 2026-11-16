-- Administrator-managed portfolio controls are distinct from learner submissions.
-- Uses existing tenant/user/key app_state storage; no learner work is rewritten.
begin;
drop policy if exists "administer skills evidence records" on public.app_state;
create policy "administer skills evidence records" on public.app_state
  as restrictive for all to authenticated
  using (key not like 'itss.skills-evidence.%' or (tenant_id = public.current_tenant() and public.is_admin()))
  with check (key not like 'itss.skills-evidence.%' or (tenant_id = public.current_tenant() and public.is_admin()));
commit;
notify pgrst, 'reload schema';
