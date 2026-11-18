Add course now starts with selecting a pack already uploaded under Qualification
Packs. Admin and Super User accounts can read a pack and create the course.
The server checks administrator access, selects the pack from the current
tenant's shared library and downloads its documents using the caller's access.
No service-role key is needed.

Supported documents: PDF (including scanned pages), DOCX, XLS/XLSX, CSV, TXT,
Markdown, PNG, JPEG and WebP. Unsupported documents appear in the review notes.
Legacy DOC files should be converted to DOCX or PDF. The current import limit is
100 readable files / 40 MB, with up to 300,000 characters of extracted Word,
spreadsheet and text content. Larger packs should have a separate outline pack
containing qualification details, module names and module-to-unit mapping tables.

AI extracts the qualification and ordered module-to-unit mappings from the pack,
and adds grounded summaries and outcomes. It must not invent grouping or unit
codes. Missing numeric metadata stays blank for administrator correction.
Unclear mappings block the import with an explanatory message. Conflicts and
other missing facts appear in review notes. The administrator can correct
qualification fields, module names, unit titles/codes, NQF levels and credits.

Create course and tiles validates the review, generates a cover for each module
and unit, and saves the course with its source pack ID and name. Completed
covers survive a failed save for retry. The existing course-covers storage
migration and server OpenAI configuration still apply; no new migration is needed.
PDFs are temporarily uploaded to OpenAI for reading and deleted after the request.

Validation: scripts/test-qualification-pack.ts uses mixed document fixtures and
mocked storage/AI to exercise access checks, extraction, cleanup and missing
metadata. scripts/test-course-creator-browser.mjs covers pack selection, review,
correction, partial cover failure and saving.
