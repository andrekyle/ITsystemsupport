# Client portal

Client users sign in at `/clients/investec` or `/clients/discovery`. They can only
read their organisation's published learner register and download published files.
They cannot enter staff/learner screens, edit records, upload files, or access raw
learning data. Branding is selected from the existing tenant registry.

## Deployment

1. Apply `supabase/migrations/20261117_client_portal.sql` to the existing Supabase
   project, followed by `supabase/migrations/20261117_client_portal_bbbee.sql`. Back up and verify the migration in staging first. It adds a separate
   publication area and excludes client accounts from existing RLS-protected tables.
2. Set `SUPABASE_SERVICE_ROLE_KEY` and `CLIENT_PORTAL_BASE_URL` on the server.
   The base URL is the HTTPS application origin, for example `https://learn.example.com`.
   Keep the service key out of browser variables. Existing Supabase URL/anonymous
   key settings are reused. `api/invite-client.ts` needs the deployed API runtime;
   the Vite development server also serves these endpoints locally.
3. Add both client URLs (including `?setup=1`) to the Supabase Auth redirect allowlist.
   Configure outgoing authentication email and the invitation/reset templates.
4. Deploy the app and server endpoint together. For local cloud testing, enable
   `VITE_ENABLE_CLOUD=true` and set the server-only service key and portal base URL in `.env.local`, then restart Vite. Never prefix the service key with `VITE_`.
5. As the provider administrator, open the evidence register and expand
   **Client portal access and publishing**. Invite each client contact by name/email.
   An account must use a new email address; existing staff accounts are not converted.
6. Publish the cohort details. Upload client-facing documents as drafts, review
   their contents, and select **Publish to client**. Publication is organisation-wide.
   Supplied drafts or local generated artifacts are never published automatically.
7. Verify the invitation link, password setup, sign-in, downloads and sign-out using
   a client test account. Confirm the other organisation's records are inaccessible.

## Administration

- **Disable access** blocks subsequent data and file requests. Use **Enable access**
  to restore membership. Files already downloaded cannot be recalled.
- **Unpublish** removes client access to a document without deleting the provider's copy.
- Cohort publication upserts learner names, programme dates and enrolment status.
  It does not publish identity numbers, addresses, private answers or grading data.
- Adding another organisation requires a tenant branding entry and the same tenant
  id in server-controlled membership. Update the invitation endpoint's tenant allowlist.
  Do not assign tenants using editable user metadata.
- The migration checks membership on every request. The server assigns
  `app_metadata.portal_role=client` so client accounts also avoid staff cache/sync paths.

## Validation

Run `node scripts/test-client-portal-policy.mjs` for database isolation and read-only
permissions, `node scripts/test-client-portal-browser.mjs` for client UI flows, and
`npm run build`. The tests use local fixtures and do not send invitations or change
the production database.
