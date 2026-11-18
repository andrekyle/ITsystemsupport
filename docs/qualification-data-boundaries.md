# Qualification data boundaries

New custom qualifications have independent course records, explicit learner enrolments,
progress, quiz submissions, POE indexes, checklists, logbooks, attendance, notes,
class photos, announcements, reviews, outcomes, content edits and uploaded lesson figures.
A learner account can be enrolled in more than one qualification; enrolling it does
not copy its scores, answers or submissions. Account identity and the staff signup
code remain tenant-wide.

The original qualification retains its existing storage keys. These changes do not
reset learner progress, remove records or bulk migrate live data.

Before deploying, run `supabase/migrations/20261118_qualification_state_ownership.sql`
after the existing staff assignment and progress ownership migrations. It updates
key parsing in ownership checks and staff read permissions, with no learner-record
updates or deletes. It has not been applied to the live database by this change.

The older built-in IT Systems Support and Generic Management qualifications still
share some legacy cohort records. At the owner's request, these records are left
untouched for manual cleanup. This change does not copy, reset or delete them.

Regression checks:

- `node scripts/test-course-roster-browser.mjs`
- `node scripts/test-course-editing.mjs`
- `node scripts/test-sync-reload.mjs`
- `node scripts/test-course-content-safety.mjs`
- `node scripts/test-unit-content-tools.mjs`
- `node_modules/.bin/tsx.cmd scripts/test-course-enrolment.ts`
- `node_modules/.bin/tsc.cmd -b`
