-- Extend published client documents to include B-BBEE supporting evidence.
alter table public.client_portal_documents
  drop constraint if exists client_portal_documents_category_check;
alter table public.client_portal_documents
  add constraint client_portal_documents_category_check
  check (category in ('Evidence', 'Reports', 'Registers', 'Workbooks', 'Programme', 'B-BBEE Compliance'));
