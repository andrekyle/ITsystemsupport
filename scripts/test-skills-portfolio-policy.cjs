const fs = require('node:fs');
const assert = require('node:assert/strict');
const { PGlite } = require('@electric-sql/pglite');
async function main() {
  const db = new PGlite();
  try {
    await db.exec(`create role authenticated; create table public.app_state(tenant_id text,user_id uuid,key text,value text);
      alter table public.app_state enable row level security;
      grant select,insert,update,delete on public.app_state to authenticated;
      create function public.current_tenant() returns text language sql stable as $$select 'investec'::text$$;
      create function public.is_admin() returns boolean language sql stable as $$select current_setting('test.admin',true)='yes'$$;
      create policy "legacy broad access" on public.app_state for all to authenticated using(true) with check(true);`);
    await db.exec(fs.readFileSync('supabase/migrations/20261116_skills_evidence_register.sql','utf8'));
    await db.exec("set role authenticated;set test.admin='no';");
    await assert.rejects(db.query("insert into public.app_state values('investec',null,'itss.skills-evidence.alice.f7','forged')"),/row-level security/);
    await db.exec("set test.admin='yes';");
    await db.query("insert into public.app_state values('investec',null,'itss.skills-evidence.alice.f7','real'),('investec',null,'itss.progress.alice','{}')");
    await assert.rejects(db.query("insert into public.app_state values('discovery',null,'itss.skills-evidence.alice.f7','cross tenant')"),/row-level security/);
    assert.equal((await db.query("select * from public.app_state where key like 'itss.skills-evidence.%'")).rows.length,1);
    await db.exec("set test.admin='no';");
    assert.equal((await db.query("select * from public.app_state where key like 'itss.skills-evidence.%'")).rows.length,0);
    assert.equal((await db.query("update public.app_state set value='forged' where key like 'itss.skills-evidence.%' returning *")).rows.length,0);
    assert.equal((await db.query("delete from public.app_state where key like 'itss.skills-evidence.%' returning *")).rows.length,0);
    assert.equal((await db.query("select * from public.app_state where key='itss.progress.alice'")).rows.length,1,'Existing learner progress access is unchanged by this migration');
    console.log('Skills portfolio policy passed: administrator-only records, tenant isolation, forged writes denied, existing learner work preserved.');
  } finally { await db.close(); }
}
main().catch(error=>{console.error(error);process.exitCode=1});
