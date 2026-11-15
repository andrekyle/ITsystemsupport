// Read-only, tenant-scoped snapshot for sequential learner recovery review.
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
  await db.query("begin read only; set local statement_timeout = '30s'");
  const rows = (await db.query(`select tenant_id, user_id, key, value, updated_at from public.app_state
    where key = 'itss.profiles' or key like 'itss.progress.%' or key like 'itss.lessonquiz.%'`)).rows;
  const shared = (await db.query(`select tenant_id, key, value, updated_at from public.shared_state
    where key like 'itss.lessonedits.%' or key like 'itss.unitbuilder.%.shared'`)).rows;
  const archivedProfiles = [];
  const tables = (await db.query(`select table_name from information_schema.columns where table_schema = 'public'
    and table_name like 'app_state%backup%' group by table_name
    having count(distinct column_name) filter (where column_name in ('tenant_id','key','value','updated_at')) = 4`)).rows;
  for (const { table_name: table } of tables) {
    if (!/^app_state[a-z0-9_]+$/.test(table)) throw new Error('Unexpected backup table name');
    const profiles = (await db.query(`select tenant_id, key, value, updated_at from public."${table}" where key = 'itss.profiles'`)).rows;
    archivedProfiles.push(...profiles.map(row => ({ ...row, sourceTable: table })));
  }
  await db.query('commit');
  fs.mkdirSync('supabase-export/all-learners', { recursive: true });
  fs.writeFileSync('supabase-export/all-learners/source-snapshot.json', JSON.stringify({ capturedAt: new Date().toISOString(), rows, shared, archivedProfiles }, null, 2));
  console.log(`Saved private read-only snapshot: ${rows.length} evidence/profile rows, ${shared.length} course source rows.`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => db.end());
