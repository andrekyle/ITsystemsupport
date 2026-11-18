-- Public tile artwork contains no learner or account data.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('course-covers', 'course-covers', true, 6291456, array['image/jpeg'])
on conflict (id) do nothing;

create policy "Administrators upload tenant course covers" on storage.objects
for insert to authenticated with check (
  bucket_id = 'course-covers' and public.is_admin()
  and (storage.foldername(name))[1] = public.current_tenant()
);
