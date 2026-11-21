begin;

-- Include the key parser so leaderboard setup does not depend on applying
-- the separate qualification-ownership policy migration first.
create or replace function public.qualification_state_profile_id(state_key text)
returns text language sql immutable strict
set search_path = public
as $$
  select split_part(regexp_replace(
    regexp_replace(state_key, '^itss\.[^.]+\.', ''),
    '^(custom-[^.]+|genman)\.', ''), '.', 1);
$$;

create or replace function public.leaderboard_number(value text)
returns numeric
language sql
immutable
set search_path = ''
as $$
  select case
    when value ~ '^[+-]?([0-9]+(\.[0-9]*)?|\.[0-9]+)$' then value::numeric
    else null
  end;
$$;

create or replace function public.cohort_profile_xp(target_profile jsonb)
returns integer
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  target_id text := target_profile ->> 'id';
  progress_text text;
  progress_data jsonb := '{}'::jsonb;
  poe_text text;
  poe_data jsonb := '{}'::jsonb;
  unit_entry record;
  quiz_entry record;
  exercise_entry record;
  log_entry record;
  quiz_items jsonb;
  logbook jsonb;
  history jsonb;
  mark_data jsonb;
  mark_text text;
  answer_id text;
  workbook_group text;
  question_id text;
  workbook_key_count integer;
  answer_parts text[];
  quiz_best numeric;
  quiz_total numeric;
  quiz_attempts integer;
  first_score numeric;
  first_total numeric;
  exercise_best numeric;
  exercise_total numeric;
  awarded numeric;
  max_marks numeric;
  scale numeric;
  has_first_attempt boolean;
  unit_has_quiz boolean;
  unit_has_exercise boolean;
  evidence_stages integer := 0;
  slide_gates integer := 0;
  poe_items integer := 0;
  attendance_count integer := 0;
  xp_total integer := 0;
  liked_videos text[] := array[]::text[];
  commented_videos text[] := array[]::text[];
  video_id text;
  target_id_number text := regexp_replace(coalesce(target_profile #>> '{enrolment,idNumber}', ''), '\D', '', 'g');
  target_name text := lower(btrim(coalesce(target_profile ->> 'name', '')));
begin
  if nullif(target_id, '') is null then
    return 0;
  end if;

  select state.value into progress_text
  from public.app_state state
  left join public.profile_progress_owners owner
    on owner.tenant_id = state.tenant_id
    and owner.profile_id = public.qualification_state_profile_id(state.key)
  where state.tenant_id = public.current_tenant()
    and state.key like 'itss.progress.%'
    and public.qualification_state_profile_id(state.key) = target_id
  order by (state.user_id = owner.user_id) desc nulls last, state.updated_at desc
  limit 1;

  if progress_text is not null then
    begin
      progress_data := progress_text::jsonb;
    exception when others then
      progress_data := '{}'::jsonb;
    end;
  end if;

  if jsonb_typeof(progress_data -> 'units') = 'object' then
    for unit_entry in
      select item.key, item.value
      from jsonb_each(progress_data -> 'units') item
    loop
      unit_has_quiz := false;
      unit_has_exercise := false;
      quiz_items := '[]'::jsonb;
      logbook := case
        when jsonb_typeof(unit_entry.value -> 'logbook') = 'object' then unit_entry.value -> 'logbook'
        else '{}'::jsonb
      end;

      if jsonb_typeof(unit_entry.value -> 'quiz') = 'object' then
        quiz_items := quiz_items || jsonb_build_array(unit_entry.value -> 'quiz');
      end if;
      if jsonb_typeof(unit_entry.value -> 'quizzes') = 'object' then
        for quiz_entry in
          select item.value
          from jsonb_each(unit_entry.value -> 'quizzes') item
        loop
          quiz_items := quiz_items || jsonb_build_array(quiz_entry.value);
        end loop;
      end if;

      for quiz_entry in
        select item.value
        from jsonb_array_elements(quiz_items) item(value)
      loop
        quiz_total := public.leaderboard_number(quiz_entry.value ->> 'total');
        quiz_best := public.leaderboard_number(quiz_entry.value ->> 'best');
        if coalesce(quiz_total, 0) <= 0 then
          continue;
        end if;
        unit_has_quiz := true;
        quiz_best := coalesce(quiz_best, 0);
        quiz_attempts := coalesce(public.leaderboard_number(quiz_entry.value ->> 'attempts')::integer, 1);
        scale := 1;
        history := quiz_entry.value -> 'history';
        if quiz_attempts > 1 then
          has_first_attempt := jsonb_typeof(history) = 'array';
          if has_first_attempt then
            has_first_attempt := jsonb_array_length(history) >= quiz_attempts;
          end if;
          if has_first_attempt then
            first_score := public.leaderboard_number(
              history -> (jsonb_array_length(history) - 1) ->> 'score'
            );
            first_total := public.leaderboard_number(
              history -> (jsonb_array_length(history) - 1) ->> 'total'
            );
          else
            first_score := null;
            first_total := null;
          end if;
          if coalesce(first_total, 0) <= 0 or first_score / first_total < 0.8 then
            scale := 0.5;
          end if;
        end if;
        if quiz_best / quiz_total >= 1 then
          xp_total := xp_total + round(75 * scale)::integer;
        elsif quiz_best / quiz_total >= 0.8 then
          xp_total := xp_total + round(50 * scale)::integer;
        elsif quiz_best > 0 then
          xp_total := xp_total + 10;
        end if;
      end loop;

      if jsonb_typeof(unit_entry.value -> 'exercises') = 'object' then
        for exercise_entry in
          select item.value
          from jsonb_each(unit_entry.value -> 'exercises') item
        loop
          exercise_total := public.leaderboard_number(exercise_entry.value ->> 'total');
          exercise_best := public.leaderboard_number(exercise_entry.value ->> 'best');
          if coalesce(exercise_total, 0) <= 0 then
            continue;
          end if;
          unit_has_exercise := true;
          exercise_best := coalesce(exercise_best, 0);
          if exercise_best / exercise_total >= 1 then
            xp_total := xp_total + 90;
          elsif exercise_best / exercise_total >= 0.5 then
            xp_total := xp_total + 60;
          else
            xp_total := xp_total + 15;
          end if;
        end loop;
      end if;

      for log_entry in
        select item.key, item.value
        from jsonb_each(logbook) item
      loop
        if log_entry.value = 'true'::jsonb and log_entry.key like 'slidegate.%' then
          slide_gates := slide_gates + 1;
        elsif log_entry.value = 'true'::jsonb and log_entry.key like 'videoengagement.likeXp.%' then
          video_id := substring(log_entry.key from length('videoengagement.likeXp.') + 1);
          if not (video_id = any(liked_videos)) then
            liked_videos := array_append(liked_videos, video_id);
          end if;
        elsif log_entry.value = 'true'::jsonb and log_entry.key like 'videoengagement.commentXp.%' then
          video_id := substring(log_entry.key from length('videoengagement.commentXp.') + 1);
          if not (video_id = any(commented_videos)) then
            commented_videos := array_append(commented_videos, video_id);
          end if;
        end if;

        if jsonb_typeof(log_entry.value) <> 'string'
          or btrim(log_entry.value #>> '{}') = '' then
          continue;
        end if;

        mark_text := null;
        mark_data := null;
        workbook_group := null;
        question_id := null;
        answer_id := null;

        if log_entry.key ~ '^learner-workbook\..+\.answer$' then
          answer_id := substring(log_entry.key from '^learner-workbook\.(.*)\.answer$');
          answer_parts := string_to_array(answer_id, '.');
          question_id := answer_parts[array_length(answer_parts, 1)];
          mark_text := logbook ->> ('learner-workbook.task-mark.' || question_id);
          if mark_text is null then
            mark_text := logbook ->> ('built-workbook.task-mark.' || answer_id);
          end if;
        elsif log_entry.key ~ '^built-workbook\.[^.]+\.[^.]+$'
          and split_part(log_entry.key, '.', 2) not in ('source', 'cover', 'mark', 'task-mark') then
          answer_parts := string_to_array(log_entry.key, '.');
          workbook_group := answer_parts[2];
          question_id := answer_parts[3];
          answer_id := workbook_group || '.' || question_id;
          mark_text := logbook ->> ('built-workbook.task-mark.' || answer_id);
          if mark_text is null then
            select count(*) into workbook_key_count
            from jsonb_object_keys(logbook) keys(key)
            where keys.key like ('built-workbook.' || workbook_group || '.%');
            if workbook_key_count = 1 then
              mark_text := logbook ->> ('built-workbook.mark.' || workbook_group);
            end if;
          end if;
        else
          continue;
        end if;

        if mark_text is not null then
          begin
            mark_data := mark_text::jsonb;
          exception when others then
            mark_data := null;
          end;
        end if;
        awarded := public.leaderboard_number(mark_data ->> 'awarded');
        max_marks := public.leaderboard_number(mark_data ->> 'maxMarks');
        if coalesce(max_marks, 0) > 0
          and coalesce(awarded, -1) >= 0
          and awarded <= max_marks then
          unit_has_exercise := true;
          if awarded / max_marks >= 1 then
            xp_total := xp_total + 90;
          elsif awarded / max_marks >= 0.5 then
            xp_total := xp_total + 60;
          else
            xp_total := xp_total + 15;
          end if;
        end if;
      end loop;

      if unit_has_quiz then
        evidence_stages := evidence_stages + 1;
      end if;
      if unit_has_exercise then
        evidence_stages := evidence_stages + 1;
      end if;
    end loop;
  end if;

  select state.value into poe_text
  from public.app_state state
  left join public.profile_progress_owners owner
    on owner.tenant_id = state.tenant_id
    and owner.profile_id = public.qualification_state_profile_id(state.key)
  where state.tenant_id = public.current_tenant()
    and state.key like 'itss.poe.%'
    and public.qualification_state_profile_id(state.key) = target_id
  order by (state.user_id = owner.user_id) desc nulls last, state.updated_at desc
  limit 1;
  if poe_text is not null then
    begin
      poe_data := poe_text::jsonb;
    exception when others then
      poe_data := '{}'::jsonb;
    end;
  end if;
  if jsonb_typeof(poe_data) = 'object' then
    select count(distinct split_part(item.key, '__', 1))::integer
    into poe_items
    from jsonb_object_keys(poe_data) item(key);
  end if;

  select count(distinct matched.session_date)::integer
  into attendance_count
  from (
    select substring(state.key from '^itss\.attendance\.([0-9]{4}-[0-9]{2}-[0-9]{2})\.row\.') as session_date
    from public.shared_state state
    where state.tenant_id = public.current_tenant()
      and state.key ~ '^itss\.attendance\.[0-9]{4}-[0-9]{2}-[0-9]{2}\.row\..+$'
      and (
        substring(state.key from '\.row\.(.*)$') = target_id
        or (
          target_id_number <> ''
          and regexp_replace(coalesce(state.value::jsonb ->> 'idNumber', ''), '\D', '', 'g') = target_id_number
        )
        or (
          target_name <> ''
          and lower(btrim(concat_ws(' ', state.value::jsonb ->> 'name', state.value::jsonb ->> 'surname'))) = target_name
        )
      )
    union all
    select substring(state.key from '^itss\.attendance\.([0-9]{4}-[0-9]{2}-[0-9]{2})$')
    from public.shared_state state
    cross join lateral jsonb_each(
      case
        when jsonb_typeof(state.value::jsonb -> 'rows') = 'object' then state.value::jsonb -> 'rows'
        else '{}'::jsonb
      end
    ) register_row
    where state.tenant_id = public.current_tenant()
      and state.key ~ '^itss\.attendance\.[0-9]{4}-[0-9]{2}-[0-9]{2}$'
      and (
        register_row.key = target_id
        or (
          target_id_number <> ''
          and regexp_replace(coalesce(register_row.value ->> 'idNumber', ''), '\D', '', 'g') = target_id_number
        )
        or (
          target_name <> ''
          and lower(btrim(concat_ws(' ', register_row.value ->> 'name', register_row.value ->> 'surname'))) = target_name
        )
      )
  ) matched;

  xp_total := xp_total
    + evidence_stages * 25
    + poe_items * 20
    + attendance_count * 15
    + slide_gates * 5
    + coalesce(cardinality(liked_videos), 0) * 5
    + coalesce(cardinality(commented_videos), 0) * 10;
  return xp_total;
end;
$$;

create or replace function public.cohort_leaderboard()
returns table(
  profile_id text,
  auth_user_id uuid,
  display_name text,
  cohort_id text,
  avatar text,
  xp integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller record;
begin
  select * into caller from public.current_learner_chat_profile();
  if not found then
    raise exception 'A learner profile is required to load the class leaderboard.';
  end if;

  return query
  with profile_rows as (
    select
      jsonb_build_object(
        'id', profile.value ->> 'id',
        'name', profile.value ->> 'name',
        'enrolment', jsonb_build_object('idNumber', profile.value #>> '{enrolment,idNumber}')
      ) as profile_data,
      profile.value ->> 'id' as id,
      case
        when profile.value ->> 'cloudUserId' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          then (profile.value ->> 'cloudUserId')::uuid
        when profile.value ->> 'id' = active_learner.profile_id then auth.uid()
        else null
      end as owner_id,
      profile.value ->> 'name' as name,
      coalesce(nullif(btrim(profile.value ->> 'cohortId'), ''), 'default') as cohort,
      profile.value ->> 'avatar' as photo,
      (profile.value ->> 'cloudUserId' = state.user_id::text) as canonical_copy
    from public.app_state state
    cross join lateral jsonb_array_elements(
      case
        when jsonb_typeof(state.value::jsonb) = 'array' then state.value::jsonb
        else '[]'::jsonb
      end
    ) profile(value)
    cross join public.current_learner_chat_profile() active_learner
    where state.tenant_id = public.current_tenant()
      and state.key = 'itss.profiles'
      and (
        profile.value ->> 'cloudUserId' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        or profile.value ->> 'id' = active_learner.profile_id
      )
      and profile.value ->> 'role' = 'Learner'
      and profile.value ->> 'id' is not null
      and coalesce(nullif(btrim(profile.value ->> 'cohortId'), ''), 'default') = active_learner.cohort_id
  ),
  selected_profiles as (
    select distinct on (peer.id)
      peer.profile_data, peer.id, peer.owner_id, peer.name, peer.cohort, peer.photo
    from profile_rows peer
    where nullif(btrim(peer.name), '') is not null
    order by peer.id, peer.canonical_copy desc nulls last
  )
  select
    peer.id,
    peer.owner_id,
    peer.name,
    peer.cohort,
    case
      when peer.photo ~* '^data:image/(jpeg|png|webp|gif);base64,' then peer.photo
      else null
    end,
    public.cohort_profile_xp(peer.profile_data)
  from selected_profiles peer
  order by 6 desc, lower(peer.name), peer.id;
end;
$$;

revoke all on function public.leaderboard_number(text) from public, anon, authenticated;
revoke all on function public.cohort_profile_xp(jsonb) from public, anon, authenticated;
revoke all on function public.cohort_leaderboard() from public, anon;
grant execute on function public.cohort_leaderboard() to authenticated;

commit;
notify pgrst, 'reload schema';
