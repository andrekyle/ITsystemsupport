-- Keep direct conversations isolated per qualification/course.
alter table public.chat_messages
  add column if not exists course_id text not null default 'itss';

create index if not exists chat_messages_course_idx
  on public.chat_messages (tenant_id, course_id, sent_at);
