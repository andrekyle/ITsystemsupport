AI tile covers are generated automatically when saving new modules and unit
standards, including those created through Add course, inline editing, the course
editor and the Training Calendar. Existing items and uploaded images are retained.

Apply `supabase/migrations/20261118_course_covers.sql` to create the public
`course-covers` bucket and restrict uploads to administrators in their tenant.
Configure the server's `OPENAI_API_KEY`. `OPENAI_IMAGE_MODEL` defaults to
`gpt-image-2`; a configured alternative must support 1536x512 JPEG generation.
Restart the local dev server after changing environment variables.

Each new tile requests a separate subject-specific cover. The cover includes its
label and title in a charcoal panel with professional photography on the right.
Generation progress appears during save. Successful covers remain in the draft
if a later request fails; retrying save continues with the missing covers. No
course changes are saved until every required cover has been generated and stored.
Generated images use public stable URLs, avoiding localStorage image size limits.
Titles embedded in generated covers remain as originally generated if later renamed.
