import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

test("client attendance maps legacy register IDs to a unique published learner by name", async () => {
  const database = new PGlite();
  try {
    await database.exec(`
      create role anon;
      create role authenticated;
      create table public.client_portal_learners (
        tenant_id text not null,
        learner_ref text not null,
        name text not null
      );
      create table public.app_state (
        tenant_id text,
        key text,
        value text,
        updated_at timestamptz
      );
      create table public.shared_state (tenant_id text, key text, value text);
      create function public.client_portal_access(target_tenant text)
        returns boolean language sql stable as $$ select target_tenant = 'investec' $$;
      create function public.is_client_portal()
        returns boolean language sql stable as $$ select false $$;
      create function public.current_tenant()
        returns text language sql stable as $$ select 'investec'::text $$;
      create function public.is_admin()
        returns boolean language sql stable as $$ select true $$;
      insert into public.client_portal_learners values
        ('investec', 'current-profile', 'Thokozani Junior Buthelezi');
      insert into public.shared_state values
        ('investec', 'itss.attendance.2026-07-17',
          '{"rows":{"current-profile":{"name":"Thokozani Junior","surname":"Buthelezi","signature":"signed","idNumber":"private"},"a":{"name":"Learner A"},"b":{"name":"Learner B"},"c":{"name":"Learner C"}}}'),
        ('investec', 'itss.attendance.2026-07-24',
          '{"rows":{"legacy-profile":{"name":"Thokozani Junior","surname":"Buthelezi","signature":"signed","idNumber":"private"},"a":{"name":"Learner A"},"b":{"name":"Learner B"},"c":{"name":"Learner C"}}}');
    `);
    const migration = await readFile(
      new URL("../supabase/migrations/2026112402_client_portal_dashboard_match_learner_names.sql", import.meta.url),
      "utf8",
    );
    await database.exec(migration);

    const result = await database.query<{ dashboard: {
      attendance: Array<{ date: string; signer_count: number; rows: Record<string, unknown> }>;
    } }>("select public.client_portal_dashboard('investec') as dashboard");
    const attendance = result.rows[0].dashboard.attendance;
    assert.deepEqual(attendance.map(({ date, signer_count }) => [date, signer_count]), [
      ["2026-07-17", 4],
      ["2026-07-24", 4],
    ]);
    assert.deepEqual(attendance[1].rows, {
      "current-profile": { name: "Thokozani Junior Buthelezi" },
    });
    assert.equal(JSON.stringify(attendance).includes("private"), false);
    assert.equal(JSON.stringify(attendance).includes("signed"), false);
  } finally {
    await database.close();
  }
});
