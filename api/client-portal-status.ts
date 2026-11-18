import { createClient } from '@supabase/supabase-js';
export const config = { runtime: 'edge' };

declare const process: { env?: Record<string, string | undefined> };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'GET') return Response.json({ error: 'Use GET.' }, { status: 405 });
  const env = process.env ?? {};
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const key = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
  const authorization = request.headers.get('authorization') || '';
  if (!url || !key) return Response.json({ error: 'Cloud access is not configured.' }, { status: 503 });
  if (!/^Bearer\s+\S+$/.test(authorization)) return Response.json({ error: 'Sign in as the provider administrator.' }, { status: 401 });
  const sb = createClient(url, key, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
  const identity = await sb.auth.getUser(authorization.replace(/^Bearer\s+/i, ''));
  if (identity.error || !identity.data.user) return Response.json({ error: 'Your session has expired.' }, { status: 401 });
  const [admin, client] = await Promise.all([sb.rpc('is_admin'), sb.rpc('is_client_portal')]);
  if (admin.error || client.error || admin.data !== true || client.data !== false) return Response.json({ error: 'Provider administrator access is required.' }, { status: 403 });
  const table = await sb.from('client_portal_accounts').select('user_id').limit(1);
  return Response.json({ databaseReady: !table.error, invitationsReady: !!env.SUPABASE_SERVICE_ROLE_KEY && !!env.CLIENT_PORTAL_BASE_URL, serviceKeyReady: !!env.SUPABASE_SERVICE_ROLE_KEY, portalUrlReady: !!env.CLIENT_PORTAL_BASE_URL }, { headers: { 'Cache-Control': 'no-store' } });
}
