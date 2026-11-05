// One-off, insert-only recovery from the separate Supabase recovery project.
// Run without --apply to inspect; --apply restores only missing production keys.
const { Client } = require('pg');
const { createHash } = require('crypto');

const tenant = 'investec';
const registerKey = /^itss\.attendance\.(\d{4}-\d{2}-\d{2})(?:\.row\.(.+))?$/;
const digest = (value) => createHash('sha256').update(value).digest('hex');

async function main() {
  const apiHost = new URL(process.env.VITE_SUPABASE_URL).hostname;
  const recoveryHost = new URL(process.env.RECOVERY_SUPABASE_DB_URL).hostname;
  const production = new Client({
    host: recoveryHost,
    port: 5432,
    user: `postgres.${apiHost.split('.')[0]}`,
    password: process.env.SUPABASE_DB_PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });
  const recovery = new Client({
    connectionString: process.env.RECOVERY_SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });
  const apply = process.argv.includes('--apply');
  try {
    await Promise.all([production.connect(), recovery.connect()]);
    const sourceResult = await recovery.query(
      `select key, value, updated_at from public.shared_state
       where tenant_id = $1 and key like 'itss.attendance.%' order by key`, [tenant]
    );
    const backupResult = await production.query(
      `select key, value, updated_at from public.shared_state_register_restore_backup_20261022
       where tenant_id = $1 and key like 'itss.attendance.%' order by key`, [tenant]
    );
    const currentResult = await production.query(
      `select key, value from public.shared_state
       where tenant_id = $1 and key like 'itss.attendance.%'`, [tenant]
    );
    const existing = new Map(currentResult.rows.map(row => [row.key, row.value]));
    const sources = [
      ...sourceResult.rows.map(row => ({ ...row, source: 'recovery' })),
      ...backupResult.rows.map(row => ({ ...row, source: '2026-10-22 production backup' })),
    ];
    if (sourceResult.rows.length < 18 || backupResult.rows.length < 3) {
      throw new Error('Source register counts changed; inspect before restoring.');
    }
    const records = new Map();
    const dates = new Set();
    for (const row of sources) {
      const match = row.key.match(registerKey);
      if (!match) throw new Error(`Unexpected attendance key in ${row.source}`);
      dates.add(match[1]);
      let parsed;
      try { parsed = JSON.parse(row.value); }
      catch { throw new Error(`Invalid JSON for ${row.key}`); }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error(`Invalid register object for ${row.key}`);
      }
      if (match[2]) {
        if (typeof parsed.name !== 'string' || !parsed.name.trim()) {
          throw new Error(`Invalid signed row for ${row.key}`);
        }
      } else if (!parsed.rows || typeof parsed.rows !== 'object' || Array.isArray(parsed.rows)
        || !parsed.header || typeof parsed.header !== 'object' || !Array.isArray(parsed.order)) {
        throw new Error(`Invalid aggregate register for ${row.key}`);
      }
      const previous = records.get(row.key);
      if (previous && digest(previous.value) !== digest(row.value)) {
        throw new Error(`Conflicting recovery sources for ${row.key}`);
      }
      records.set(row.key, row);
    }
    const missing = [...records.values()].filter(row => !existing.has(row.key));
    console.log(JSON.stringify({
      tenant,
      recoveryKeys: sourceResult.rows.length,
      backupKeys: backupResult.rows.length,
      dates: [...dates].sort(),
      alreadyInProduction: existing.size,
      missingKeys: missing.length,
      recoveryAggregates: sourceResult.rows.filter(row => !row.key.includes('.row.')).length,
      recoveredSignatureRows: sourceResult.rows.filter(row => row.key.includes('.row.')).length,
      backupSignatureRows: backupResult.rows.filter(row => row.key.includes('.row.')).length,
    }, null, 2));
    if (!apply) return;
    await production.query('begin');
    try {
      await production.query("set local lock_timeout = '5s'");
      const keys = missing.map(row => row.key);
      const values = missing.map(row => row.value);
      const updated = missing.map(row => row.updated_at);
      const inserted = await production.query(
        `insert into public.shared_state (tenant_id, key, value, updated_at)
         select $1, item.key, item.value, item.updated_at
         from unnest($2::text[], $3::text[], $4::timestamptz[]) as item(key, value, updated_at)
         on conflict (tenant_id, key) do nothing returning key`,
        [tenant, keys, values, updated]
      );
      const insertedKeys = inserted.rows.map(row => row.key);
      const check = await production.query(
        `select key, value from public.shared_state
         where tenant_id = $1 and key = any($2::text[])`, [tenant, insertedKeys]
      );
      if (check.rows.length !== insertedKeys.length ||
        check.rows.some(row => digest(row.value) !== digest(records.get(row.key).value))) {
        throw new Error('Post-insert content verification failed; transaction rolled back.');
      }
      await production.query('commit');
      console.log(`Restored ${insertedKeys.length} missing register keys; ${missing.length - insertedKeys.length} concurrent keys preserved.`);
    } catch (error) {
      await production.query('rollback');
      throw error;
    }
  } finally {
    await Promise.allSettled([production.end(), recovery.end()]);
  }
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
