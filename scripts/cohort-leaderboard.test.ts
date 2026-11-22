import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

test("leaderboard returns the same scores with role-appropriate learner visibility", async () => {
  const database = new PGlite();
  const learnerId = "11111111-1111-4111-8111-111111111111";
  const classmateId = "22222222-2222-4222-8222-222222222222";
  const otherCohortId = "33333333-3333-4333-8333-333333333333";
  const staffId = "44444444-4444-4444-8444-444444444444";
  const adminId = "55555555-5555-4555-8555-555555555555";
  const unassignedId = "66666666-6666-4666-8666-666666666666";

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
      create function public.is_admin() returns boolean language sql stable as $$
        select auth.uid() = '${adminId}'::uuid
      $$;
      create table public.app_state (
        tenant_id text,
        user_id uuid,
        key text,
        value text,
        updated_at timestamptz default now()
      );
      create table public.profile_progress_owners (
        tenant_id text,
        profile_id text,
        user_id uuid
      );
      create table public.shared_state (tenant_id text, user_id uuid, key text, value text);
      create function public.current_learner_chat_profile()
      returns table(profile_id text, cohort_id text)
      language sql stable as $$
        select person ->> 'id', person ->> 'cohortId'
        from public.app_state state
        cross join lateral jsonb_array_elements(state.value::jsonb) person
        where state.tenant_id = public.current_tenant()
          and state.key = 'itss.profiles'
          and person ->> 'role' = 'Learner'
          and person ->> 'cloudUserId' = auth.uid()::text
        limit 1
      $$;
      create function public.current_staff_assignment() returns jsonb language sql stable as $$
        select case when auth.uid() = '${staffId}'::uuid
          then '{"learnerIds":["learner-a"]}'::jsonb else '{}'::jsonb end
      $$;
      grant usage on schema public, auth to authenticated, anon;
      insert into public.app_state (tenant_id, user_id, key, value) values
        ('investec', '${learnerId}', 'itss.profiles', '[{
          "id":"learner-a","name":"Bonolo","role":"Learner",
          "cloudUserId":"${learnerId}","cohortId":"cohort-a",
          "enrolment":{"email":"bonolo@example.test"}
        },{
          "id":"legacy-a","name":"Bonolo old profile","role":"Learner",
          "cloudUserId":"${learnerId}","cohortId":"cohort-a",
          "enrolment":{"email":"bonolo@example.test"}
        }]'),
        ('investec', '${learnerId}', 'itss.progress.learner-a', '{"units":{"u1":{"quiz":{"total":10,"best":10,"attempts":1}}}}'),
        ('investec', '${learnerId}', 'itss.progress.legacy-a', '{"units":{
          "u1":{"quiz":{"total":10,"best":8,"attempts":1}},
          "u2":{"quiz":{"total":10,"best":10,"attempts":1}}
        }}'),
        ('investec', '${learnerId}', 'itss.progress.unlisted-a', '{"units":{"u3":{"quiz":{"total":10,"best":10,"attempts":1}}}}'),
        ('investec', '${learnerId}', 'itss.poe.learner-a', '{"doc1__1":{}}'),
        ('investec', '${learnerId}', 'itss.poe.legacy-a', '{"doc1__2":{},"doc2":{}}'),
        ('investec', '${classmateId}', 'itss.profiles', '[{
          "id":"learner-b","name":"Classmate","role":"Learner",
          "cloudUserId":"${classmateId}","cohortId":"cohort-a",
          "enrolment":{"email":"classmate@example.test"}
        }]'),
        ('investec', '${classmateId}', 'itss.progress.learner-b', '{"units":{"u1":{"quiz":{"total":10,"best":8,"attempts":1}}}}'),
        ('investec', '${otherCohortId}', 'itss.profiles', '[{
          "id":"learner-c","name":"Other cohort","role":"Learner",
          "cloudUserId":"${otherCohortId}","cohortId":"cohort-b"
        }]');
    `);

    const migration = await readFile(
      new URL("../supabase/migrations/20261122_cohort_leaderboard_xp.sql", import.meta.url),
      "utf8",
    );
    await database.exec(migration);

    const loadAs = async (userId: string) => {
      await database.query("select set_config('request.jwt.claim.sub', $1, false)", [userId]);
      await database.exec("set role authenticated");
      try {
        return await database.query<{ profile_id: string; xp: number }>(
          "select profile_id, xp from public.cohort_leaderboard()",
        );
      } finally {
        await database.exec("reset role");
      }
    };

    const learners = await loadAs(learnerId);
    assert.deepEqual(
      new Set(learners.rows.map((row) => row.profile_id)),
      new Set(["learner-a", "legacy-a", "learner-b"]),
    );
    assert.deepEqual(
      Object.fromEntries(learners.rows.map((row) => [row.profile_id, row.xp])),
      { "learner-a": 340, "legacy-a": 340, "learner-b": 75 },
    );

    const staff = await loadAs(staffId);
    assert.deepEqual(staff.rows.map((row) => row.profile_id), ["learner-a"]);
    assert.equal(staff.rows[0].xp, 120);

    const admin = await loadAs(adminId);
    assert.deepEqual(
      new Set(admin.rows.map((row) => row.profile_id)),
      new Set(["learner-a", "legacy-a", "learner-b", "learner-c"]),
    );

    await database.query("select set_config('request.jwt.claim.sub', $1, false)", [unassignedId]);
    await database.exec("set role authenticated");
    try {
      await assert.rejects(
        database.query("select profile_id, xp from public.cohort_leaderboard()"),
        /administrator, learner, or assigned staff profile/,
      );
    } finally {
      await database.exec("reset role");
    }

    assert.ok(learners.rows.every((learner) => admin.rows.some(
      (row) => row.profile_id === learner.profile_id && row.xp === learner.xp,
    )));
  } finally {
    await database.close();
  }
});
