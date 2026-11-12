# Learner progress safety and recovery

## Saving protections

- Progress hydration waits for IndexedDB before editing is enabled.
- Document fields save automatically; their toolbar offers PDF and HTML
  downloads, not a manual save button. Lesson slide edits also autosave.
  **Done editing slide** flushes pending staff edits before closing the editor;
  it stays open and shows an error if that final save fails.
- Cloud hydration reconciles saved evidence instead of replacing a whole learner
  record with an incomplete snapshot. Existing completion and missing answers are
  retained; cloud narrative text is preferred unless there are pending edits.
- New pending progress saves include the snapshot from before the first unsynced
  edit. Only changed fields override the latest cloud copy, so editing one answer
  in an older tab does not revert another answer changed elsewhere.
- Progress uploads compare the cloud row's `updated_at` revision before updating.
  A competing save triggers a fresh read and merge. After three collisions the
  save fails explicitly and remains queued on the device.
- Intentional answer clearing and manual activity changes still save. If two
  devices change the same field, the later successful edit wins; this is not
  collaborative text merging.
- Progress replaced during cloud reconciliation gets a local recovery copy in
  the same IndexedDB transaction. Copies use the existing
  `itssDevice.courseRecovery.*` keys in `itss-unit-packs` / `packs`, include their
  original key, value, tenant and timestamp, and are not uploaded or treated as
  active learner records. Normal sign-out cleanup preserves these copies.

## Slide quiz changes

New quiz saves associate selections with question text, option text and the
original slide heading, rather than question/slide positions alone. Adding or
reordering questions and options, or inserting a differently titled slide,
retains matching answers. Removed question selections remain in the saved
identity map. Different question sets or a corrected answer key have their own
attempt counts. Generated quizzes use the same definition for display and
automatic completion credit; already earned completion is not revoked.

Legacy positional answers are retained alongside their first identity-based
save. Their original question definitions cannot be reconstructed if the content
had already changed before migration. Changed wording or slide headings must not
be guessed to represent the same question. Unit/profile navigation remounts the
lesson editor so old state is never saved under the next learner or unit.

## Investigating previously missing work

1. Do not clear storage, reset progress, or reinstall the affected browser.
2. Obtain authorized read-only exports of the affected learner's cloud rows,
   pending writes and original browser data. Confirm tenant and profile IDs,
   including any historical IDs, before selecting records.
3. Configure the target IDs/names in
   [the browser export snippet](./export-browser-learner-work.js) before running
   it on the original device. It includes matching local recovery copies and
   does not export authentication tokens. Keep the downloaded JSON private.
4. Compare original snapshots and quiz definitions before restoring anything.
   Preserve the originals and restore only demonstrated work; do not invent
   answers, attendance or completion.

The safeguards must be deployed to protect live sessions. They do not prove the
cause of a past incident or recreate data that is absent from every saved copy.
Local backups depend on browser storage availability and are not a substitute
for server backups. Older pending writes without a baseline use evidence merging;
which fields were actually edited in those historical snapshots is unknown.
