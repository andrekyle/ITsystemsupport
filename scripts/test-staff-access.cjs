const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

function compile(file, dependencies) {
  const exports = {};
  const code = ts.transpile(fs.readFileSync(file, "utf8"), {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  });
  new Function("require", "exports", code)(id => dependencies[id], exports);
  return exports;
}

const values = new Map();
global.localStorage = {
  getItem: key => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
};
global.window = { dispatchEvent() {} };
const types = compile("src/types.ts", {});
const access = compile("src/lib/assignments.ts", { react: {}, "../types": types });
const admin = { id: "admin", role: "Admin" };
const learner = { id: "learner", role: "Learner", cloudUserId: "learner-auth" };
const unrelated = { id: "unrelated", role: "Learner" };

for (const role of ["Facilitator", "Assessor", "Moderator"]) {
  const staff = { id: `${role}-seed`, cloudUserId: `${role}-auth`, role };
  assert.equal(access.canSeeProfile(staff, learner, {}), false, `${role}: deny unassigned learner`);
  assert.equal(access.canSeeCourse(staff, "itss", {}), false, `${role}: deny unassigned course`);
  access.saveStaffAssignment(admin, staff, { courseIds: ["itss"], learnerIds: [learner.cloudUserId] });
  const assignments = access.readAssignments();
  assert.equal(access.canSeeProfile(staff, learner, assignments), true);
  assert.equal(access.canSeeProfile(staff, unrelated, assignments), false);
  assert.equal(access.canSeeProfile(staff, { id: "other-staff", role: "Facilitator" }, assignments), false);
  assert.equal(access.canSeeCourse(staff, "itss", assignments), true);
  assert.equal(access.canSeeCourse(staff, "genman", assignments), false);
  assert.equal(access.canSeeProfile({ ...staff, id: "signed-in-copy" }, { ...learner, id: "learner-new-id" }, assignments), true, "Auth IDs survive profile migration");
  assert.throws(() => access.saveStaffAssignment(staff, staff, { courseIds: ["genman"], learnerIds: ["unrelated"] }), /Only administrators/);
  access.saveStaffAssignment(admin, staff, { courseIds: [], learnerIds: [] });
  assert.equal(access.canSeeProfile(staff, learner, access.readAssignments()), false, "Revocation takes effect");
}
for (const role of ["Admin", "Super User"]) {
  const viewer = { id: role, role };
  assert.equal(access.canSeeProfile(viewer, learner, {}), true);
  assert.equal(access.canSeeProfile(viewer, { id: "facilitator", role: "Facilitator" }, {}), true);
  assert.equal(access.canSeeCourse(viewer, "custom-course", {}), true);
}
localStorage.setItem(access.ASSIGNMENTS_KEY, '{"bad":{"courseIds":"all","learnerIds":[]}}');
assert.deepEqual(access.readAssignments(), {}, "Invalid assignment records fail closed");
console.log("Staff access checks passed: assignment, denial, revocation, identity migration, and administrator access.");

// Exercise the actual directory page, including typed/deep-linked student IDs.
const staffViewer = { id: "facilitator", role: "Facilitator", name: "Facilitator" };
const otherStaff = { id: "assessor", role: "Assessor", name: "Assessor" };
const roster = [admin, staffViewer, otherStaff, { ...learner, name: "Assigned student" }, { ...unrelated, name: "Unassigned student" }].map(p => ({ ...p, name: p.name ?? p.id, createdAt: "2026-11-15" }));
let pageAssignments = { [staffViewer.id]: { courseIds: ["itss"], learnerIds: [learner.id] } };
const jsx = (type, props) => ({ type, props });
const { StudentsPage } = compile("src/pages/People.tsx", {
  "react/jsx-runtime": { jsx, jsxs: jsx },
  react: { useState: initial => [typeof initial === "function" ? initial() : initial, () => {}], useRef: value => ({ current: value }), useEffect() {} },
  "../types": types,
  "../lib/assignments": { ...access, useAssignments: () => pageAssignments },
  "../data/course": { MODULES: [], POE_SECTIONS: [], POE_TOTAL: 0 },
  "../store": { loadProfiles: () => roster, loadPoeDocs: () => ({}), poeItemCount: () => 0 },
  "../lib/directory": { identityKeys: p => [p.id], resolveCloudLink: () => null, mergeProfileWithCloud: p => p },
  "../icons": {}, "../components/EditingSidebar": {}, "../components/Select": {},
  "../components/StaffAssignments": {}, "../data/content": {}, "../data/workbook114074": {},
  "../lib/audit": {}, "../lib/onboarding": {}, "../lib/integrations": {},
  "../components/VerdictSwitch": {}, "../components/Avatar": {}, "../components/ProfilePortfolio": {},
  "../components/EnrolmentForm": {}, "../components/Modal": {}, "../lib/files": {},
  "../lib/signature": {}, "../lib/supabase": {}, "../lib/tenant": {}, "./Attendance": {},
  "../lib/presence": {}, "../lib/progressEvidence": {}, jszip: {},
});
function page(profile, studentId) {
  return StudentsPage({ profile, route: { page: "students", studentId }, navigate() {} });
}
function directoryIds(tree) {
  const ids = [];
  function walk(node) {
    if (!node) return;
    if (Array.isArray(node)) return node.forEach(walk);
    if (node.props?.className?.includes("people-directory-row")) {
      // Profile rows carry the actual navigation callback; use their child Avatar's profile.
      const avatar = node.props.children[0].props.children[0];
      ids.push(avatar.props.profile.id);
    }
    walk(node.props?.children);
  }
  walk(tree); return ids;
}
assert.deepEqual(directoryIds(page(staffViewer)), [learner.id]);
assert.equal(page(staffViewer, learner.id).props.student.id, learner.id);
assert(JSON.stringify(page(staffViewer, unrelated.id)).includes("Student unavailable"));
assert(JSON.stringify(page(staffViewer, otherStaff.id)).includes("Student unavailable"));
assert(directoryIds(page(admin)).includes(otherStaff.id));
assert(directoryIds(page(admin)).includes(unrelated.id));
pageAssignments = {};
assert.deepEqual(directoryIds(page(staffViewer)), []);
assert(JSON.stringify(page(staffViewer, learner.id)).includes("Student unavailable"));
console.log("Directory page checks passed: assigned-only roster, blocked direct links, administrator visibility, and revocation.");

async function testDatabasePolicies() {
  delete global.window;
  const { PGlite } = require("@electric-sql/pglite");
  const db = new PGlite();
  try {
    await db.exec(`
      create role authenticated;
      create role anon;
      create schema auth;
      grant usage on schema auth to authenticated;
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
      create function auth.jwt() returns jsonb language sql stable as
        $$ select jsonb_build_object('email', 'staff@example.test') $$;
      create function public.current_tenant() returns text language sql stable as $$ select 'investec'::text $$;
      create table public.app_state (tenant_id text, user_id uuid, key text, value text);
      alter table public.app_state enable row level security;
      grant select on public.app_state to authenticated;
      create policy "legacy broad state read" on public.app_state for select to authenticated using (true);
      create table public.shared_state (key text primary key, value text, tenant_id text default 'investec');
      create schema storage;
      grant usage on schema storage to authenticated;
      create table storage.objects (bucket_id text, name text);
      alter table storage.objects enable row level security;
      grant select on storage.objects to authenticated;
      create policy "legacy broad file read" on storage.objects for select to authenticated using (true);
      alter table public.shared_state enable row level security;
      grant select, insert, update, delete on public.shared_state to authenticated;
      create function public.is_admin() returns boolean language sql stable as
        $$ select current_setting('test.admin', true) = 'yes' $$;
      create policy "legacy broad shared access" on public.shared_state for all to authenticated using (true) with check (true);
    `);
    await db.exec(fs.readFileSync("supabase/migrations/20261115_staff_assignments.sql", "utf8"));
    await db.exec("set role authenticated; set test.admin = 'no';");
    await assert.rejects(db.query("insert into public.shared_state (key, value) values ($1, '{}')", [access.ASSIGNMENTS_KEY]), /row-level security/);
    await db.exec("set test.admin = 'yes';");
    await db.query("insert into public.shared_state (key, value) values ($1, '{}')", [access.ASSIGNMENTS_KEY]);
    await db.exec("set test.admin = 'no';");
    assert.equal((await db.query("select * from public.shared_state")).rows.length, 1, "Staff can read assignments");
    assert.equal((await db.query("update public.shared_state set value = 'tampered' returning *")).rows.length, 0);
    assert.equal((await db.query("delete from public.shared_state returning *")).rows.length, 0);
    await db.query("insert into public.shared_state (key, value) values ('itss.other.shared', '{}')");
    await assert.rejects(db.query("update public.shared_state set key = $1 where key = 'itss.other.shared'", [access.ASSIGNMENTS_KEY]), /row-level security|duplicate key/);
    await db.exec("set test.admin = 'yes';");
    assert.equal((await db.query("update public.shared_state set value = '{\"saved\":true}' where key = $1 returning *", [access.ASSIGNMENTS_KEY])).rows.length, 1);
    console.log("Database policy checks passed: staff cannot create, alter, or delete assignments despite legacy broad policies.");

    const staffUid = '00000000-0000-0000-0000-000000000001';
    const learnerUid = '00000000-0000-0000-0000-000000000002';
    const otherUid = '00000000-0000-0000-0000-000000000003';
    await db.exec('reset role');
    await db.query("insert into public.app_state values ('investec', $1, 'itss.profiles', $2)", [staffUid, JSON.stringify([{ id: 'staff', role: 'Admin', cloudUserId: staffUid }])]);
    // One foreign array intentionally contains both assigned and unassigned profiles.
    await db.query("insert into public.app_state values ('investec', $1, 'itss.profiles', $2)", [learnerUid, JSON.stringify([
      { id: 'learner', role: 'Learner', passwordHash: 'private-hash', cloudUserId: learnerUid },
      { id: 'unrelated', role: 'Learner', cloudUserId: otherUid },
    ])]);
    await db.query("insert into public.app_state values ('investec', $1, 'itss.progress.learner', '{}'), ('investec', $2, 'itss.progress.unrelated', '{}'), ('discovery', $1, 'itss.progress.learner', '{}')", [learnerUid, otherUid]);
    await db.query("insert into public.app_state values ('investec', $1, 'itss.progress.unrelated', '{}')", [learnerUid]);
    await db.query("insert into storage.objects values ('files', $1), ('files', $2), ('files', $3)", [
      `investec/${learnerUid}/poe/learner/id.pdf`, `investec/${otherUid}/poe/unrelated/id.pdf`,
      `discovery/${learnerUid}/poe/learner/id.pdf`,
    ]);
    await db.exec(`set role authenticated; set test.uid = '${staffUid}'; set test.admin = 'yes';`);
    await db.query('update public.shared_state set value = $1 where key = $2', [JSON.stringify({ [staffUid]: { learnerIds: ['learner'], courseIds: ['itss'] } }), access.ASSIGNMENTS_KEY]);
    await db.exec("set test.admin = 'no'");
    const visible = (await db.query('select * from public.visible_profiles()')).rows.flatMap(row => JSON.parse(row.value));
    assert.deepEqual(visible.map(p => p.id).sort(), ['learner', 'staff']);
    assert.equal(visible.find(p => p.id === 'learner').passwordHash, undefined);
    const raw = (await db.query('select * from public.app_state')).rows;
    assert.equal(raw.filter(row => row.key === 'itss.profiles').length, 1, 'Foreign profile arrays cannot be downloaded directly');
    assert(raw.some(row => row.key === 'itss.progress.learner'));
    assert(!raw.some(row => row.key === 'itss.progress.unrelated'), 'An edited Admin profile role cannot bypass database access');
    assert(!raw.some(row => row.tenant_id === 'discovery'));
    assert.deepEqual((await db.query('select name from storage.objects')).rows.map(row => row.name), [`investec/${learnerUid}/poe/learner/id.pdf`]);
    await db.exec("set test.admin = 'yes'");
    assert.equal((await db.query("select * from public.app_state where tenant_id = 'investec'")).rows.length, 5);
    await db.query('update public.shared_state set value = $1 where key = $2', [JSON.stringify({ [staffUid]: { learnerIds: [learnerUid], courseIds: ['itss'] } }), access.ASSIGNMENTS_KEY]);
    await db.exec("set test.admin = 'no'");
    assert.equal((await db.query("select * from public.app_state where key = 'itss.progress.learner'")).rows.length, 1);
    assert.equal((await db.query("select * from public.app_state where key = 'itss.progress.unrelated'")).rows.length, 0, 'Account assignment cannot expose another learner cached in the same account');
    await db.exec("set test.admin = 'yes'");
    await db.query("update public.shared_state set value = '{}' where key = $1", [access.ASSIGNMENTS_KEY]);
    await db.exec("set test.admin = 'no'");
    assert.equal((await db.query("select * from public.app_state where key = 'itss.progress.learner'")).rows.length, 0);
    assert.equal((await db.query('select * from storage.objects')).rows.length, 0);
    assert(!(await db.query('select * from public.visible_profiles()')).rows.flatMap(row => JSON.parse(row.value)).some(p => p.id === 'learner'));
    console.log('Database visibility checks passed: filtered profile arrays, assigned progress, tenant isolation, role-spoof denial, and revocation.');
  } finally { await db.close(); }
}
testDatabasePolicies().catch(error => { console.error(error); process.exitCode = 1; });
