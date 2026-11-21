import { createClient } from '@supabase/supabase-js';
export const config = { runtime: 'edge' };
declare const process: { env?: Record<string, string | undefined> };

export default async function handler(request: Request): Promise<Response> {
  const fail = (error: string, status: number) => Response.json({ error }, { status });
  if (request.method !== 'POST') return fail('Use POST.', 405);
  const env = process.env ?? {};
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const key = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
  const service = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !service) return fail('Login management requires SUPABASE_SERVICE_ROLE_KEY on the server.', 503);
  const authorization = request.headers.get('authorization') ?? '';
  if (!/^Bearer\s+\S+$/.test(authorization)) return fail('Sign in as an administrator or super user.', 401);
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  const caller = createClient(url, key, { ...options, global: { headers: { Authorization: authorization } } });
  const admin = createClient(url, service, options);
  try {
    const [identity, permission, portal, tenant] = await Promise.all([
      caller.auth.getUser(authorization.replace(/^Bearer\s+/i, '')),
      caller.rpc('is_admin'), caller.rpc('is_client_portal'), caller.rpc('current_tenant'),
    ]);
    if (identity.error || !identity.data.user || permission.error || permission.data !== true || portal.error || portal.data !== false || tenant.error || !tenant.data) return fail('Administrator or super user access is required.', 403);
    const body = await request.json();
    const { owner, profileId } = body;
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : undefined;
    const password = typeof body.password === 'string' ? body.password : undefined;
    if (typeof owner !== 'string' || typeof profileId !== 'string' || (!email && !password) || (email !== undefined && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)) || (password !== undefined && (password.length < 8 || password.length > 128))) return fail('Provide a valid login email or a password of 8–128 characters.', 422);
    // Resolve identity from a tenant-scoped saved record, never a client-supplied auth ID.
    const row = await admin.from('app_state').select('value').eq('tenant_id', tenant.data).eq('user_id', owner).eq('key', 'itss.profiles').maybeSingle();
    if (row.error || !row.data) return fail('The saved account profile could not be found.', 404);
    const profiles = JSON.parse(row.data.value);
    const profile = Array.isArray(profiles) ? profiles.find(p => p.id === profileId) : undefined;
    if (!profile) return fail('The saved account profile could not be found.', 404);
    const targetId = profile.cloudUserId || owner;
    const target = await admin.auth.admin.getUserById(targetId);
    const user = target.data.user;
    const targetTenant = user?.app_metadata?.tenant_id || user?.user_metadata?.tenant_id || 'investec';
    // Seeded profiles can live in an administrator's storage; do not reset that administrator.
    if (target.error || !user || targetTenant !== tenant.data || !profile.enrolment?.email || user.email?.toLowerCase() !== profile.enrolment.email.trim().toLowerCase()) return fail('This profile is not linked to a matching login account. Check its saved email and cloud account link first.', 409);
    const result = await admin.auth.admin.updateUserById(user.id, {
      ...(email ? { email, email_confirm: true } : {}),
      ...(password ? { password } : {}),
    });
    if (result.error) return fail(result.error.message, 400);
    return Response.json({ ok: true });
  } catch (error) {
    return fail(error instanceof SyntaxError ? 'Invalid request or saved profile data.' : 'Could not update the login account. Please retry.', 500);
  }
}
