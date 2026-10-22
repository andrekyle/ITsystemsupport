import fs from "node:fs";
import { createRequire } from "node:module";
import { PGlite } from "@electric-sql/pglite";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");
const [livePath, recoveryPath] = process.argv.slice(2);

if (!livePath || !recoveryPath) {
  console.error("Usage: node scripts/validate-progress-recovery.mjs <live.csv> <recovery.sql>");
  process.exit(1);
}

const workbook = XLSX.readFile(livePath, { raw: true });
const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {
  defval: "",
  raw: true,
});

const db = new PGlite();
await db.exec(`
  CREATE SCHEMA IF NOT EXISTS public;
  CREATE TABLE public.app_state (
    user_id uuid NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    updated_at timestamptz NOT NULL,
    tenant_id text NOT NULL,
    PRIMARY KEY (user_id, key)
  );
`);

for (const row of rows) {
  await db.query(
    `INSERT INTO public.app_state (user_id, key, value, updated_at, tenant_id)
     VALUES ($1::uuid, $2, $3, $4::timestamptz, $5)`,
    [row.user_id, row.key, row.value, row.updated_at, row.tenant_id]
  );
}

await db.exec(fs.readFileSync(recoveryPath, "utf8"));

const backup = await db.query(`
  SELECT count(*)::int AS count
  FROM public.app_state_recovery_backup_20261021
  WHERE backup_batch = '2026-10-21-five-learner-progress'
`);
const recovered = await db.query(`
  SELECT key, length(value)::int AS value_size
  FROM public.app_state
  WHERE updated_at > '2026-10-21 06:00:00+00'::timestamptz
  ORDER BY key
`);

console.log(JSON.stringify({
  backupRows: backup.rows[0].count,
  recoveredRows: recovered.rows,
}, null, 2));
