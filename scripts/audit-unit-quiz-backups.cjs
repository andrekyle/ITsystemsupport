// Read-only discovery of original course sources and saved quiz snapshots.
const fs = require('node:fs');
const { Client } = require('pg');
const unit = process.argv[2];
if (!/^\w+$/.test(unit ?? '')) throw new Error('Supply a unit ID');
const env = {};
for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (match) env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
}
const recovery = process.argv.includes('--recovery');
const recoveryUrl = new URL(env.RECOVERY_SUPABASE_DB_URL);
const db = new Client({ host: recoveryUrl.hostname, port: Number(recoveryUrl.port || 5432),
  user: recovery ? decodeURIComponent(recoveryUrl.username) : `postgres.${new URL(env.VITE_SUPABASE_URL).hostname.split('.')[0]}`,
  password: recovery ? env.RECOVERY_SUPABASE_DB_PASSWORD : env.SUPABASE_DB_PASSWORD, database: 'postgres', ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
async function main() {
  await db.connect();
  await db.query("begin read only; set local statement_timeout = '30s'");
  const tables = (await db.query(`select table_name from information_schema.columns where table_schema='public'
    and (table_name like '%backup%' or table_name in ('app_state','shared_state'))
    group by table_name having count(distinct column_name) filter (where column_name in ('tenant_id','key','value'))=3`)).rows;
  const rows = [];
  for (const { table_name: table } of tables) {
    if (!/^[a-z0-9_]+$/.test(table)) throw new Error('Unexpected table');
    const found = (await db.query(`select tenant_id,key,value::text,to_jsonb(t)->>'updated_at' as updated_at
      from public."${table}" t where tenant_id='investec' and
      (key like $1 or key=$2 or key like $3)`, [`itss.lessonedits.${unit}%`, `itss.unitbuilder.${unit}.shared`, `itss.lessonquiz.%.${unit}`])).rows;
    rows.push(...found.map(row => ({ ...row, sourceTable: table })));
  }
  await db.query('commit');
  fs.writeFileSync(`supabase-export/unit-${unit}-quiz-backups${recovery ? '-recovery' : ''}.json`, JSON.stringify(rows, null, 2));
  console.log(JSON.stringify({ unit, tables: tables.length, rows: rows.length, byTable: Object.fromEntries(tables.map(({ table_name: table }) => [table, rows.filter(row => row.sourceTable === table).length]).filter(([, count]) => count)) }));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => db.end());
