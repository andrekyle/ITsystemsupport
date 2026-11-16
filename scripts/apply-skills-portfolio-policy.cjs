// Apply only the bounded, idempotent portfolio access policy; no learner rows change.
const fs = require('node:fs');
const { Client } = require('pg');
const env = {};
for (const line of fs.readFileSync('.env.local','utf8').split(/\r?\n/)) {
  const match=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if(match) env[match[1]]=match[2].replace(/^['"]|['"]$/g,'');
}
const db=new Client({host:new URL(env.RECOVERY_SUPABASE_DB_URL).hostname,port:5432,
  user:`postgres.${new URL(env.VITE_SUPABASE_URL).hostname.split('.')[0]}`,password:env.SUPABASE_DB_PASSWORD,
  database:'postgres',ssl:{rejectUnauthorized:false},connectionTimeoutMillis:10000});
async function main(){
  await db.connect();
  const prerequisites=(await db.query("select to_regprocedure('public.current_tenant()') is not null and to_regprocedure('public.is_admin()') is not null as ready")).rows[0];
  if(!prerequisites.ready) throw new Error('Required platform access helpers are missing; no changes made.');
  await db.query(fs.readFileSync('supabase/migrations/20261116_skills_evidence_register.sql','utf8'));
  const policy=(await db.query("select permissive,roles,cmd from pg_policies where schemaname='public' and tablename='app_state' and policyname='administer skills evidence records'")).rows[0];
  if(policy?.permissive!=='RESTRICTIVE'||policy.cmd!=='ALL') throw new Error('The expected portfolio access policy was not found.');
  console.log('Applied and verified administrator-only portfolio storage policy. No learner records modified.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1}).finally(()=>db.end());
