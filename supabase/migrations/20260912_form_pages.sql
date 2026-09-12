-- Replica forms: the uploaded pages are stored as images and drawn behind the
-- fields, so every signed-in learner's browser must be able to load them.
-- Blank forms only (the builder requires that consent), hence a public bucket.
insert into storage.buckets (id, name, public, file_size_limit)
values ('form-pages', 'form-pages', true, 6291456)
on conflict (id) do update set public = true, file_size_limit = 6291456;

drop policy if exists "signed-in reads form pages" on storage.objects;
create policy "signed-in reads form pages" on storage.objects
  for select to authenticated using (bucket_id = 'form-pages');

drop policy if exists "admin uploads form pages" on storage.objects;
create policy "admin uploads form pages" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'form-pages' and public.is_admin()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "admin deletes form pages" on storage.objects;
create policy "admin deletes form pages" on storage.objects
  for delete to authenticated using (bucket_id = 'form-pages' and public.is_admin());
