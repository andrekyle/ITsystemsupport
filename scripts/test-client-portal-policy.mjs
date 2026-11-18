import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const db = new PGlite();
const staff='00000000-0000-0000-0000-000000000001';
const client='00000000-0000-0000-0000-000000000002';
const other='00000000-0000-0000-0000-000000000003';
try {
  await db.exec(`create role authenticated; create schema auth; create schema storage;
    create table auth.users(id uuid primary key);
    insert into auth.users values('${staff}'),('${client}'),('${other}');
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
    create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('test.jwt',true),''),'{}')::jsonb$$;
    create function public.current_tenant() returns text language sql stable as $$select coalesce(auth.jwt()->'app_metadata'->>'tenant_id','investec')$$;
    create function public.is_admin() returns boolean language sql stable as $$select current_setting('test.admin',true)='yes'$$;
    grant usage on schema auth,storage to authenticated;
    create table public.app_state(key text,tenant_id text,value text);
    alter table public.app_state enable row level security;
    grant all on public.app_state to authenticated;
    create policy legacy on public.app_state for all to authenticated using(true) with check(true);
    insert into public.app_state values('private.staff.data','investec','secret');
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint);
    create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    grant all on storage.objects to authenticated;
    create policy legacy_files on storage.objects for all to authenticated using(true) with check(true);
    create function storage.foldername(path text) returns text[] language sql immutable as $$select string_to_array(path,'/')$$;`);
  await db.exec(readFileSync('supabase/migrations/20261117_client_portal.sql','utf8'));
  await db.exec(readFileSync('supabase/migrations/20261117_client_portal_bbbee.sql','utf8'));
  await db.exec(`insert into public.client_portal_accounts(user_id,tenant_id,display_name,email) values
    ('${client}','investec','Investec Client','client@example.test'),('${other}','discovery','Discovery Client','other@example.test');
    insert into public.client_portal_learners(tenant_id,learner_ref,name,programme) values('investec','a','Alice','ITSS'),('discovery','b','Bob','ITSS');
    insert into public.client_portal_documents(tenant_id,title,category,filename,storage_path,file_size,published) values
    ('investec','Published','Evidence','one.pdf','investec/published.pdf',1,true),
    ('investec','Draft','Evidence','draft.pdf','investec/draft.pdf',1,false),
    ('discovery','Other','Evidence','other.pdf','discovery/other.pdf',1,true);
    insert into storage.objects(bucket_id,name) values('client-evidence','investec/published.pdf'),('client-evidence','investec/draft.pdf'),('client-evidence','discovery/other.pdf'),('files','investec/private.pdf');
    set role authenticated; set test.uid='${client}'; set test.admin='no'; set test.jwt='{"app_metadata":{"tenant_id":"investec","portal_role":"client"}}';`);
  assert.equal((await db.query('select * from public.client_portal_learners')).rows.length,1);
  assert.equal((await db.query('select * from public.client_portal_documents')).rows.length,1);
  assert.equal((await db.query('select * from storage.objects')).rows.length,1);
  assert.equal((await db.query('select * from public.app_state')).rows.length,0);
  await assert.rejects(db.exec("insert into public.client_portal_learners(tenant_id,learner_ref,name,programme) values('investec','x','Injected','ITSS')"),/row-level security/);
  await assert.rejects(db.exec("insert into storage.objects(bucket_id,name) values('client-evidence','investec/evil')"),/row-level security/);
  assert.equal((await db.query(`update public.client_portal_accounts set enabled=false where user_id='${client}' returning user_id`)).rows.length,0);
  assert.equal((await db.query("update public.client_portal_documents set published=true returning id")).rows.length,0);
  // A changed tenant claim cannot redirect an existing client's membership.
  await db.exec(`set test.jwt='{"app_metadata":{"tenant_id":"discovery","portal_role":"client"}}';`);
  assert.equal((await db.query('select name from public.client_portal_learners')).rows[0].name,'Alice');
  await db.exec(`reset role; update public.client_portal_accounts set enabled=false where user_id='${client}'; set role authenticated;`);
  assert.equal((await db.query('select * from public.client_portal_documents')).rows.length,0);
  assert.equal((await db.query('select * from storage.objects')).rows.length,0);
  assert.equal((await db.query('select * from public.app_state')).rows.length,0);
  // Provider administration remains available for its own tenant.
  await db.exec(`set test.uid='${staff}'; set test.admin='yes'; set test.jwt='{"app_metadata":{"tenant_id":"investec"}}';`);
  assert.equal((await db.query('select * from public.client_portal_documents')).rows.length,2);
  assert.equal((await db.query('select * from public.app_state')).rows.length,1);
  await db.exec(`insert into public.client_portal_learners(tenant_id,learner_ref,name,programme) values('investec','c','Carol','ITSS')`);
  await assert.rejects(db.exec("insert into public.client_portal_learners(tenant_id,learner_ref,name,programme) values('discovery','d','Forbidden','ITSS')"),/row-level security/);
  console.log('PASS: client tenant isolation, published-only downloads, no edits, legacy-data denial, revoked-access denial and provider permissions.');
} finally { await db.close(); }
