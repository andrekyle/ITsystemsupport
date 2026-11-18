import { createClient } from '@supabase/supabase-js';
export const config = { runtime: 'edge' };
declare const process: { env?: Record<string, string | undefined> };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') return Response.json({ error: 'Use POST.' }, { status: 405 });
  const env = process.env ?? {};
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const anon = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
  const service = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service) return Response.json({ error: 'Client account creation needs SUPABASE_SERVICE_ROLE_KEY on the server.' }, { status: 503 });
  const authorization = request.headers.get('authorization') ?? '';
  if (!/^Bearer\s+\S+$/.test(authorization)) return Response.json({ error: 'Sign in as the provider administrator.' }, { status: 401 });
  const caller = createClient(url, anon, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    const [identity, permission, client, tenant] = await Promise.all([
      caller.auth.getUser(authorization.replace(/^Bearer\s+/i, '')),
      caller.rpc('is_admin'), caller.rpc('is_client_portal'), caller.rpc('current_tenant'),
    ]);
    if (identity.error || !identity.data.user || permission.error || permission.data !== true || client.error || client.data !== false || tenant.error || !['investec', 'discovery'].includes(tenant.data)) return Response.json({ error: 'Provider administrator access is required.' }, { status: 403 });
    const body = JSON.parse(await request.text());
    const name = String(body.name ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    if (!name || name.length > 120 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 12) return Response.json({ error: 'Provide a name, valid email address and a password of at least 12 characters.' }, { status: 422 });
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { display_name: name }, app_metadata: { tenant_id: tenant.data, portal_role: 'client' } });
    if (created.error || !created.data.user) return Response.json({ error: created.error?.message || 'The client account could not be created.' }, { status: 400 });
    const membership = await admin.from('client_portal_accounts').insert({ user_id: created.data.user.id, tenant_id: tenant.data, display_name: name, email });
    if (membership.error) return Response.json({ error: 'The account was created but client portal membership could not be saved.' }, { status: 500 });
    return Response.json({ message: 'Client account created.' });
  } catch (error) { return Response.json({ error: error instanceof SyntaxError ? 'Invalid request.' : 'The client account could not be created.' }, { status: 500 }); }
}
