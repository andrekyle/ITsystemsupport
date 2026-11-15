// Read-only diagnosis; never changes learner records or prints credentials.
const fs = require('node:fs');
const { Client } = require('pg');
const name = process.argv.slice(2).join(' ').trim();
if (!name) throw new Error('Supply the learner full name.');
const env = {};
for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (match) env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
}
const apiHost = new URL(env.VITE_SUPABASE_URL).hostname;
const host = new URL(env.RECOVERY_SUPABASE_DB_URL).hostname;
const db = new Client({ host, port: 5432, user: `postgres.${apiHost.split('.')[0]}`,
  password: env.SUPABASE_DB_PASSWORD, database: 'postgres', ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
const normalize = value => String(value ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
async function main() {
  await db.connect();
  await db.query("begin read only; set local statement_timeout = '20s'");
  const rows = (await db.query("select tenant_id, user_id, value, updated_at from public.app_state where key = 'itss.profiles' and value ilike $1", [`%${name.split(' ')[0]}%`])).rows;
  const profiles = [];
  for (const row of rows) {
    let list; try { list = JSON.parse(row.value); } catch { continue; }
    for (const p of list) if (normalize(p.name) === normalize(name) || normalize([p.enrolment?.firstNames, p.enrolment?.surname].filter(Boolean).join(' ')) === normalize(name)) {
      profiles.push({ tenant: row.tenant_id, owner: row.user_id, profile: p, updatedAt: row.updated_at });
    }
  }
  console.log(JSON.stringify({ matchingProfiles: profiles.map(p => ({ tenant: p.tenant, id: p.profile.id, name: p.profile.name, cloudUserId: p.profile.cloudUserId, owner: p.owner, updatedAt: p.updatedAt })) }, null, 2));
  if (!profiles.length) return;
  const ids = [...new Set(profiles.flatMap(p => [p.profile.id, p.profile.cloudUserId].filter(Boolean)))];
  const tenants = [...new Set(profiles.map(p => p.tenant))];
  const progressRows = (await db.query(`select tenant_id, user_id, key, value, updated_at from public.app_state
    where tenant_id = any($1::text[]) and (key = any($2::text[]) or exists (
      select 1 from unnest($3::text[]) id where key like 'itss.lessonquiz.' || id || '.%'))`,
    [tenants, ids.map(id => `itss.progress.${id}`), ids])).rows;
  const summary = progressRows.map(row => {
    const data = JSON.parse(row.value);
    const units = Object.entries(data.units ?? {}).map(([id, unit]) => {
      const fields = Object.entries(unit.logbook ?? {});
      return { id, exercises: Object.keys(unit.exercises ?? {}).length,
        quizzes: Object.keys(unit.quizzes ?? {}).length + Number(!!unit.quiz),
        savedFields: fields.length,
        answerKeys: fields.filter(([key, value]) => typeof value === 'string' && value.trim() && !/\.(ok|tries|picks)$/.test(key)).map(([key]) => key),
        completedActivities: Object.entries(unit.activities ?? {}).filter(([, done]) => done).map(([key]) => key) };
    });
    return { tenant: row.tenant_id, owner: row.user_id, key: row.key, updatedAt: row.updated_at, bytes: row.value.length,
      units, lessonQuizSections: row.key.startsWith('itss.lessonquiz.') ? Object.keys(data) : undefined };
  });
  fs.mkdirSync('supabase-export', { recursive: true });
  const file = 'supabase-export/learner-progress-audit.json';
  fs.writeFileSync(file, JSON.stringify({ learner: name, profiles, rows: progressRows }, null, 2));
  console.log(JSON.stringify({ snapshots: summary, privateAuditFile: file }, null, 2));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => db.end());
