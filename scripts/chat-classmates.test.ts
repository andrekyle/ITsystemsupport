import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

test("chat classmates are limited to same-cohort identities and sends", async () => {
  const database = new PGlite();
  const learnerId = "11111111-1111-4111-8111-111111111111";
  const classmateId = "22222222-2222-4222-8222-222222222222";
  const otherCohortId = "33333333-3333-4333-8333-333333333333";
  const unlinkedOwnerId = "44444444-4444-4444-8444-444444444444";
  const staffId = "55555555-5555-4555-8555-555555555555";
  const unknownId = "66666666-6666-4666-8666-666666666666";
  try {
    await database.exec(`
      create role authenticated;
      create role anon;
      create schema auth;
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $$;
      create function auth.jwt() returns jsonb language sql stable as $$
        select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb)
      $$;
      create function public.current_tenant() returns text language sql stable as $$ select 'investec' $$;
      create function public.is_admin() returns boolean language sql stable as $$ select false $$;
      create table public.app_state (tenant_id text, user_id uuid, key text, value text);
      create table public.chat_messages (
        id bigint generated always as identity,
        tenant_id text not null,
        sender_user_id uuid not null,
        recipient_user_id uuid not null,
        sender_profile_id text not null,
        recipient_profile_id text not null,
        cohort_id text not null default 'default'
      );
      alter table public.chat_messages enable row level security;
      create policy allow_chat_insert on public.chat_messages
        for insert to authenticated
        with check (tenant_id = public.current_tenant() and auth.uid() = sender_user_id);
      grant usage on schema public, auth to authenticated, anon;
      grant select on public.app_state to authenticated;
      grant insert on public.chat_messages to authenticated;
      insert into public.app_state values
        ('investec', '${learnerId}', 'itss.profiles', '[{
          "id":"bonolo-profile","name":"Bonolo","role":"Learner",
          "cloudUserId":"${learnerId}","cohortId":"cohort-a","enrolment":{"email":"bonolo@example.test"}
        }]'),
        ('investec', '${classmateId}', 'itss.profiles', '[{
          "id":"peer-profile","name":"Classmate","role":"Learner",
          "cloudUserId":"${classmateId}","cohortId":"cohort-a"
        }]'),
        ('investec', '${otherCohortId}', 'itss.profiles', '[{
          "id":"peer-profile","name":"Classmate copy","role":"Learner",
          "cloudUserId":"${classmateId}","cohortId":"cohort-a"
        }]'),
        ('investec', '${otherCohortId}', 'itss.profiles', '[{
          "id":"other-profile","name":"Other cohort","role":"Learner",
          "cloudUserId":"${otherCohortId}","cohortId":"cohort-b"
        }]'),
        ('investec', '${unlinkedOwnerId}', 'itss.profiles', '[{
          "id":"unlinked-profile","name":"Unlinked learner","role":"Learner",
          "cohortId":"cohort-a"
        }]'),
        ('investec', '${staffId}', 'itss.profiles', '[{
          "id":"staff-profile","name":"Facilitator","role":"Facilitator",
          "cloudUserId":"${staffId}"
        }]');
    `);
    const migration = await readFile(new URL("../supabase/migrations/20261121_chat_classmates.sql", import.meta.url), "utf8");
    await database.exec(migration);

    await database.query("select set_config('request.jwt.claim.sub', $1, false)", [learnerId]);
    await database.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify({ email: "bonolo@example.test" })]);
    await database.exec("set role authenticated");

    const peers = await database.query<{ profile_id: string; display_name: string; auth_user_id: string | null }>(
      "select profile_id, display_name, auth_user_id from public.chat_peers()");
    assert.deepEqual(peers.rows.map((peer) => peer.profile_id), ["peer-profile"]);
    assert.equal(peers.rows.find((peer) => peer.profile_id === "peer-profile")?.auth_user_id, classmateId);
    assert.equal(Object.keys(peers.rows[0]).sort().join(","), "auth_user_id,display_name,profile_id");

    await database.query(
      `insert into public.chat_messages
        (tenant_id, sender_user_id, recipient_user_id, sender_profile_id, recipient_profile_id, cohort_id)
       values ('investec', $1, $2, 'bonolo-profile', 'peer-profile', 'cohort-a')`,
      [learnerId, classmateId],
    );
    await assert.rejects(database.query(
      `insert into public.chat_messages
        (tenant_id, sender_user_id, recipient_user_id, sender_profile_id, recipient_profile_id, cohort_id)
       values ('investec', $1, $2, 'bonolo-profile', 'other-profile', 'cohort-a')`,
      [learnerId, otherCohortId],
    ), /row-level security/);
    await assert.rejects(database.query(
      `insert into public.chat_messages
        (tenant_id, sender_user_id, recipient_user_id, sender_profile_id, recipient_profile_id, cohort_id)
       values ('investec', $1, $1, 'bonolo-profile', 'bonolo-profile', 'cohort-a')`,
      [learnerId],
    ), /row-level security/);
    await database.exec("reset role");
    assert.equal((await database.query("select id from public.chat_messages")).rows.length, 1);

    await database.query("select set_config('request.jwt.claim.sub', $1, false)", [staffId]);
    await database.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify({ email: "staff@example.test" })]);
    await database.exec("set role authenticated");
    await database.query(
      `insert into public.chat_messages
        (tenant_id, sender_user_id, recipient_user_id, sender_profile_id, recipient_profile_id, cohort_id)
       values ('investec', $1, $2, 'staff-profile', 'other-profile', 'cohort-b')`,
      [staffId, otherCohortId],
    );
    await database.exec("reset role");
    await database.query("select set_config('request.jwt.claim.sub', $1, false)", [unknownId]);
    await database.exec("set role authenticated");
    await assert.rejects(database.query(
      `insert into public.chat_messages
        (tenant_id, sender_user_id, recipient_user_id, sender_profile_id, recipient_profile_id, cohort_id)
       values ('investec', $1, $2, 'unknown-profile', 'other-profile', 'cohort-b')`,
      [unknownId, otherCohortId],
    ), /row-level security/);
  } finally {
    await database.close();
  }
});
