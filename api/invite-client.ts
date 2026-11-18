import { createClient } from '@supabase/supabase-js';
export const config = { runtime: 'edge' };
declare const process: { env?: Record<string, string | undefined> };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') return Response.json({ error: 'Use POST.' }, { status: 405 });
  const env = process.env ?? {};
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const anon = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
  const service = env.SUPABASE_SERVICE_ROLE_KEY;
  const portalBase = env.CLIENT_PORTAL_BASE_URL;
  if (!url || !anon || !service || !portalBase) return Response.json({ error: 'Client invitations are not configured. Set the server-side Supabase service key and client portal base URL.' }, { status: 503 });
  const authorization = request.headers.get('authorization') ?? '';
  if (!/^Bearer\s+\S+$/.test(authorization)) return Response.json({ error: 'Sign in as the provider administrator.' }, { status: 401 });
  const caller = createClient(url, anon, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  let invitedId: string | null = null;
  try {
    const { data: identity, error: identityError } = await caller.auth.getUser(authorization.replace(/^Bearer\s+/i, ''));
    if (identityError || !identity.user) return Response.json({ error: 'Your session has expired.' }, { status: 401 });
    const [permission, client, tenant] = await Promise.all([caller.rpc('is_admin'), caller.rpc('is_client_portal'), caller.rpc('current_tenant')]);
    if (permission.error || client.error || tenant.error || permission.data !== true || client.data !== false || !['investec', 'discovery'].includes(tenant.data)) return Response.json({ error: 'Provider administrator access is required.' }, { status: 403 });
    const raw = await request.text();
    if (raw.length > 2000) return Response.json({ error: 'Request is too large.' }, { status: 413 });
    const body = JSON.parse(raw);
    const email = String(body.email ?? '').trim().toLowerCase();
    const name = String(body.name ?? '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !name || name.length > 120) return Response.json({ error: 'Provide a valid client name and email address.' }, { status: 422 });
    const redirect = new URL(`/clients/${tenant.data}`, portalBase);
    redirect.searchParams.set("setup", "1");
    if (redirect.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(redirect.hostname)) return Response.json({ error: 'The portal base URL must use HTTPS.' }, { status: 503 });
    const result = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: redirect.href, data: { display_name: name } });
    if (result.error || !result.data.user) return Response.json({ error: result.error?.message || 'The client invitation could not be created.' }, { status: 400 });
    invitedId = result.data.user.id;
    const role = await admin.auth.admin.updateUserById(invitedId, { app_metadata: { tenant_id: tenant.data, portal_role: 'client' } });
    if (role.error) throw role.error;
    const membership = await admin.from('client_portal_accounts').insert({ user_id: invitedId, tenant_id: tenant.data, display_name: name, email });
    if (membership.error) throw membership.error;
    return Response.json({ message: 'Client invitation sent.', portalUrl: redirect.href });
  } catch (error) {
    // Never delete an auth account on a partial invitation failure. Membership
    // remains absent/disabled and therefore cannot read client publications.
    return Response.json({ error: error instanceof SyntaxError ? 'Invalid request.' : 'The client invitation could not be completed. Check the portal database setup.' }, { status: 500 });
  }
}
