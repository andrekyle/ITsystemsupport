# Form Builder

The Forms page lists the existing registration form and uploaded, generated forms. Super Users can upload a blank PDF, Word (.docx) document, PNG, JPG or WebP image, review the extracted fields, and save a template. Learners can open saved templates, fill them in, save their own answers and print a completed copy.

## Database Setup

For an existing Supabase project, run `supabase/migrations/20260911_form_builder.sql` in its SQL Editor. This migration requires the existing `public.is_admin()` function from `supabase/schema.sql`. For a fresh project, apply the base schema first and then this migration.

The migration creates:

- `public.forms`: generated definitions and source-file metadata, readable by signed-in accounts and writable only by administrators.
- `public.form_responses`: answers isolated by authenticated account and profile. Administrators can read responses; accounts can only save their own responses.
- `form-sources`: a private, administrator-only storage bucket for original uploaded documents.

Deleting a template also deletes its saved responses. The UI asks for confirmation before deletion.

## Generation Configuration

The existing server-side `OPENAI_API_KEY` is used for document-to-form conversion with `gpt-4.1-mini`. The function also needs `SUPABASE_URL` and `SUPABASE_ANON_KEY`, or their existing `VITE_` equivalents, to validate the signed-in session and administrator role. Never expose `OPENAI_API_KEY` in a `VITE_` variable.

Generation is available at `/api/generate-form` in Vercel and through the local Vite middleware. Uploading and selecting Generate form sends extracted text and rendered page images to OpenAI. Use blank forms; completed personal answers are not intended for template generation. Original documents are uploaded to the private source bucket only when the generated template is saved.

Limits: 10 MB per upload, 12 PDF pages, 80,000 extracted text characters and 150 generated fields. Oversized, unreadable, unsupported or malformed forms are rejected without saving a template. Image-only Word documents should be exported to PDF first.

## Local Preview

Without Supabase configuration, templates and responses remain in this browser. Fillable PDFs with native fields can be imported directly without AI; standard PDFs, photos and Word forms require a signed-in cloud administrator for AI generation. A manual editor is available for corrections or when generation cannot run. No failed cloud save is reported as a successful local save.

Generated forms preserve field content and order, not the exact paper layout. Review the fields and declaration wording before saving. Signature controls capture a typed name; they are not cryptographic signatures or a claim of legally verified electronic signing.

## Checks

### Build: original unit PDFs

Build's Learner Guide, Practical Task, Learner Workbook and additional PDF uploads
use the existing replica renderer, not the text-document or AI slide layout.
Every original page is rendered without deskewing, font substitution, new covers
or reflow. Native PDF fields and detected blank cells, answer lines, combs and
tick boxes receive positioned HTML controls. Fill & sign handles additional
answer areas that automatic detection cannot identify, including scanned pages.
Field detection runs locally; these PDFs are not sent to AI.

Uploads support 20 MB and 250 pages per PDF. Pages are saved using the existing
`form-pages` storage bucket (apply `supabase/migrations/20260912_form_pages.sql`).
Answers and annotations use the unit's existing learner-progress storage, with
separate namespaces for each document. Printed output and editable HTML exports
retain the original pages. The learner-pack PDF includes original page images,
not a reformatted transcription.

PDF-only builds are the default, need no pasted lesson text and make no AI requests.
Enable **Also generate lesson tabs** to use separately provided lesson source
text without changing the
uploaded documents. Rebuilding an older unit recreates replicas from its archived
original PDFs; old additional-document tabs without an archived PDF must be
reuploaded to restore their original appearance. Existing saved text-document
answers are not erased or guessed into newly positioned PDF fields.

Run `node --import tsx --test scripts/form-builder.test.ts scripts/generate-form.test.ts scripts/form-database.test.ts` and `npm run build` from the project directory. The database test runs the migration twice in embedded PostgreSQL and checks template permissions, response isolation, source-document access and cascading deletion without contacting Supabase.