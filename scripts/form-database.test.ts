import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

test("forms migration preserves private responses and restricts template changes to admins", async () => {
  const database = new PGlite();
  const adminId = "11111111-1111-4111-8111-111111111111";
  const learnerId = "22222222-2222-4222-8222-222222222222";
  const otherId = "33333333-3333-4333-8333-333333333333";
  const formId = "44444444-4444-4444-8444-444444444444";
  try {
    await database.exec(`
      create role authenticated;
      create schema auth;
      create schema storage;
      create table auth.users (id uuid primary key);
      create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint);
      create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
      alter table storage.objects enable row level security;
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      create function public.is_admin() returns boolean language sql stable as $$ select auth.uid() = '${adminId}'::uuid $$;
      create function storage.foldername(name text) returns text[] language sql immutable as $$ select string_to_array(name, '/') $$;
      grant usage on schema public, auth, storage to authenticated;
      grant select, insert, delete on storage.objects to authenticated;
      insert into auth.users values ('${adminId}'), ('${learnerId}'), ('${otherId}');
    `);
    const migration = await readFile(new URL("../supabase/migrations/20260911_form_builder.sql", import.meta.url), "utf8");
    await database.exec(migration);
    await database.exec(migration);
    const asUser = async (id: string) => {
      await database.exec("reset role");
      await database.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
      await database.exec("set role authenticated");
    };
    await asUser(adminId);
    await database.query("insert into forms (id, title, definition, created_by) values ($1, $2, $3, $4)", [formId, "Equipment request", JSON.stringify({ title: "Equipment request", sections: [] }), adminId]);
    await database.query("insert into storage.objects (bucket_id, name) values ('form-sources', $1)", [`${adminId}/${formId}/request.pdf`]);
    await asUser(learnerId);
    assert.equal((await database.query("select id from forms")).rows.length, 1);
    await assert.rejects(database.query("insert into forms (title, definition, created_by) values ('Unauthorized', '{\"sections\":[]}', $1)", [learnerId]), /row-level security/);
    assert.equal((await database.query("delete from forms returning id")).rows.length, 0);
    await database.query("insert into form_responses (form_id, user_id, profile_id, answers) values ($1, $2, 'learner-profile', '{\"name\":\"Learner\"}')", [formId, learnerId]);
    await assert.rejects(database.query("insert into form_responses (form_id, user_id, profile_id) values ($1, $2, 'other-profile')", [formId, otherId]), /row-level security/);
    assert.equal((await database.query("select * from storage.objects")).rows.length, 0);
    await asUser(otherId);
    assert.equal((await database.query("select * from form_responses")).rows.length, 0);
    assert.equal((await database.query("update form_responses set answers = '{}' returning form_id")).rows.length, 0);
    await asUser(learnerId);
    assert.equal((await database.query("select * from form_responses")).rows.length, 1);
    await database.query("update form_responses set answers = '{\"name\":\"Updated\"}'");
    await asUser(adminId);
    assert.equal((await database.query("select * from form_responses")).rows.length, 1);
    assert.equal((await database.query("select * from storage.objects")).rows.length, 1);
    await database.query("delete from forms where id = $1", [formId]);
    assert.equal((await database.query("select * from form_responses")).rows.length, 0);
  } finally {
    await database.close();
  }
});