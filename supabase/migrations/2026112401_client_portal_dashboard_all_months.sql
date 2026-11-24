begin;

-- A client may see only the learners explicitly published to its portal. The
-- underlying app_state/shared_state rows remain inaccessible through RLS.
create or replace function public.client_portal_dashboard(target_tenant text)
returns jsonb
language plpgsql stable security definer
set search_path = public
as $$
declare result jsonb;
begin
  if not public.client_portal_access(target_tenant)
     and not (not public.is_client_portal() and target_tenant = public.current_tenant() and public.is_admin()) then
    raise exception 'Client portal access denied';
  end if;

  with published as (
    select learner_ref, name from public.client_portal_learners where tenant_id = target_tenant
  ), progress as (
    select distinct on (p.learner_ref) p.learner_ref, p.name,
      case when a.value ~ '^\s*\{' then a.value::jsonb else '{}'::jsonb end as value
    from published p
    left join public.app_state a on a.tenant_id = target_tenant
      and a.key like 'itss.progress.%' and a.key like '%' || p.learner_ref
    order by p.learner_ref, a.updated_at desc nulls last
  ), attendance_source as (
    select s.key, s.value,
      substring(s.key from '([0-9]{4}-[0-9]{2}-[0-9]{2})') as date
    from public.shared_state s
    where s.tenant_id = target_tenant
      and s.key ~ '^itss\.attendance\.(custom-[^.]+\.)?[0-9]{4}-[0-9]{2}-[0-9]{2}(\.row\..+)?$'
  ), attendance_dates as (
    select distinct date from attendance_source
  ), attendance_row_items as (
    -- Historical register snapshots may still contain a rows object.
    select source.date, item.key as learner_ref, item.value as row, 0 as priority
    from attendance_source source
    cross join lateral jsonb_each(
      case when source.key !~ '\.row\.'
             and source.value ~ '^\s*\{'
           then coalesce(source.value::jsonb -> 'rows', '{}'::jsonb)
           else '{}'::jsonb end
    ) item
    union all
    -- Newer registers save one authoritative record per learner.
    select source.date,
      substring(source.key from '\.row\.(.+)$') as learner_ref,
      case when source.value ~ '^\s*\{' then source.value::jsonb else '{}'::jsonb end as row,
      1 as priority
    from attendance_source source
    where source.key like 'itss.attendance.%.row.%'
  ), attendance as (
    select dates.date,
      coalesce(jsonb_object_agg(items.learner_ref, items.row order by items.priority)
        filter (where items.learner_ref is not null), '{}'::jsonb) as rows,
      count(distinct coalesce(
        nullif(regexp_replace(coalesce(items.row ->> 'idNumber', ''), '\D', '', 'g'), ''),
        nullif(regexp_replace(lower(trim(concat_ws(' ', items.row ->> 'name', items.row ->> 'surname'))), '\s+', ' ', 'g'), ''),
        items.learner_ref
      )) filter (where items.learner_ref is not null) as signer_count
    from attendance_dates dates
    left join attendance_row_items items on items.date = dates.date
    group by dates.date
  ), counted_attendance as (
    -- Ignore drafts and registers with fewer than seven distinct signers.
    -- Return only published learner names, never raw attendance row data.
    select attendance.date, attendance.signer_count,
      coalesce((
        select jsonb_object_agg(item.key, jsonb_build_object('name', published.name))
        from jsonb_each(attendance.rows) item
        join published on published.learner_ref = item.key
      ), '{}'::jsonb) as rows
    from attendance
    where attendance.signer_count >= 7
  )
  select jsonb_build_object(
    'learners', coalesce((select jsonb_agg(jsonb_build_object('learner_ref', learner_ref, 'name', name, 'progress', value) order by name) from progress), '[]'::jsonb),
    'attendance', coalesce((select jsonb_agg(jsonb_build_object('date', date, 'signer_count', signer_count, 'rows', rows) order by date) from counted_attendance), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;

revoke all on function public.client_portal_dashboard(text) from public, anon;
grant execute on function public.client_portal_dashboard(text) to authenticated;
commit;
notify pgrst, 'reload schema';
