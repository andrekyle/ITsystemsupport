const fs = require('node:fs');
const { Client } = require('pg');
const env = {};
for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (match) env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
}
const db = new Client({ host: new URL(env.RECOVERY_SUPABASE_DB_URL).hostname, port: 5432,
  user: `postgres.${new URL(env.VITE_SUPABASE_URL).hostname.split('.')[0]}`,
  password: env.SUPABASE_DB_PASSWORD, database: 'postgres', ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
async function main() {
  await db.connect();
  if (process.argv.includes('--apply')) {
    const prerequisite = await db.query("select to_regprocedure('public.current_learner_chat_profile()') as helper, to_regclass('public.profile_progress_owners') as owners");
    if (!prerequisite.rows[0].helper || !prerequisite.rows[0].owners) throw new Error('Missing learner identity/ownership prerequisites; no changes applied.');
    await db.query(fs.readFileSync('supabase/migrations/20261122_cohort_leaderboard_xp.sql', 'utf8'));
    console.log('Installed leaderboard functions.');
  }
  await db.query("begin read only; set local statement_timeout = '30s'");
  console.log((await db.query("select to_regprocedure('public.cohort_leaderboard()') as leaderboard, to_regprocedure('public.qualification_state_profile_id(text)') as dependency")).rows);
  const learner = (await db.query(`select u.id, u.email from auth.users u where u.id = '019c8179-b1eb-4883-8471-be7ae31f90de'`)).rows[0];
  if (!learner) throw new Error('Test learner not found');
  await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: learner.id, email: learner.email, role: 'authenticated', app_metadata: { tenant_id: 'investec' } })]);
  await db.query('set local role authenticated');
  const result = await db.query('select profile_id, xp from public.cohort_leaderboard()');
  console.log({ learners: result.rows.length, scores: result.rows.map(r => r.xp) });
  await db.query('rollback');
}
main().catch(e => { console.error({ message: e.message, code: e.code, where: e.where }); process.exitCode = 1; }).finally(() => db.end());
