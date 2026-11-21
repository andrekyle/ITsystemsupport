import assert from 'node:assert/strict';
import handler from '../api/update-user-login';

process.env.SUPABASE_URL = 'https://login-test.invalid';
process.env.SUPABASE_ANON_KEY = 'test-anon';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service';
let allowed = true;
let targetTenant = 'investec';
let targetEmail = 'learner@example.com';
let writes: unknown[] = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = String(input);
  let body: unknown;
  if (url.endsWith('/auth/v1/user')) body = { id: 'admin' };
  else if (url.endsWith('/rpc/is_admin')) body = allowed;
  else if (url.endsWith('/rpc/is_client_portal')) body = false;
  else if (url.endsWith('/rpc/current_tenant')) body = 'investec';
  else if (url.includes('/rest/v1/app_state')) {
    assert.match(url, /tenant_id=eq.investec/);
    assert.match(url, /user_id=eq.owner/);
    body = { value: JSON.stringify([{ id: 'profile', cloudUserId: '11111111-1111-4111-8111-111111111111', enrolment: { email: 'learner@example.com' } }]) };
  } else if (url.endsWith('/auth/v1/admin/users/11111111-1111-4111-8111-111111111111')) {
    if (init?.method === 'PUT') writes.push(JSON.parse(String(init.body)));
    body = { id: '11111111-1111-4111-8111-111111111111', email: targetEmail, app_metadata: { tenant_id: targetTenant } };
  } else throw new Error(`Unexpected request: ${url}`);
  return Response.json(body);
};
const send = (body: unknown, auth = true) => handler(new Request('http://localhost/api/update-user-login', {
  method: 'POST', headers: auth ? { authorization: 'Bearer test' } : {}, body: JSON.stringify(body),
}));
const change = { owner: 'owner', profileId: 'profile', password: 'new-password-123' };
try {
  assert.equal((await send(change, false)).status, 401);
  allowed = false;
  assert.equal((await send(change)).status, 403);
  allowed = true;
  assert.equal((await send({ ...change, password: 'short' })).status, 422);
  targetTenant = 'discovery';
  assert.equal((await send(change)).status, 409);
  targetTenant = 'investec';
  targetEmail = 'admin@example.com';
  assert.equal((await send(change)).status, 409);
  targetEmail = 'learner@example.com';
  assert.equal((await send({ ...change, profileId: 'missing' })).status, 404);
  assert.equal(writes.length, 0);
  assert.equal((await send(change)).status, 200);
  assert.deepEqual(writes.pop(), { password: change.password });
  assert.equal((await send({ owner: 'owner', profileId: 'profile', email: 'New@Example.com' })).status, 200);
  assert.deepEqual(writes.pop(), { email: 'new@example.com', email_confirm: true });
  console.log('Login management: authentication, admin permission, tenant isolation, identity checks, password and email updates passed.');
} finally { globalThis.fetch = originalFetch; }
