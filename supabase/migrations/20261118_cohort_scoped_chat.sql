-- Separate chat history for different intakes taking the same course.
alter table public.chat_messages
  add column if not exists cohort_id text not null default 'default';

create index if not exists chat_messages_cohort_idx
  on public.chat_messages (tenant_id, course_id, cohort_id, sent_at);
