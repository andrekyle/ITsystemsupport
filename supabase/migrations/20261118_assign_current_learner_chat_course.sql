-- Move legacy Investec learner conversations onto the current course scope.
update public.chat_messages
set course_id = 'itssinvestec2026'
where course_id = 'itss';
