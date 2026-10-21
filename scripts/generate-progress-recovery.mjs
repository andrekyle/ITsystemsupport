import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const [historicalPath, livePath, outputPath] = process.argv.slice(2);

if (!historicalPath || !livePath || !outputPath) {
  console.error("Usage: node scripts/generate-progress-recovery.mjs <historical.csv> <live.csv> <output.sql>");
  process.exit(1);
}

const targetKeys = new Set([
  "itss.progress.p_mrom4usy_le6ki",
  "itss.progress.p_mrom1ltu_6w5hf",
  "itss.progress.p_mrom0udn_jcpeg",
  "itss.lessonquiz.p_mrom1ltu_6w5hf.10135",
  "itss.lessonquiz.p_mrom1ltu_6w5hf.114046",
  "itss.lessonquiz.p_mrom1ltu_6w5hf.114050",
  "itss.lessonquiz.p_mrom1ltu_6w5hf.8252",
]);

function readCsv(filePath) {
  // Keep timestamptz cells as exact CSV text so the live-row guard includes
  // milliseconds and timezone instead of a locale-formatted calendar date.
  const workbook = XLSX.readFile(filePath, { raw: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: "", raw: true });
}

function latestByKey(rows) {
  const latest = new Map();
  for (const row of rows) {
    if (!targetKeys.has(row.key)) continue;
    const existing = latest.get(row.key);
    if (!existing || Date.parse(row.updated_at) > Date.parse(existing.updated_at)) {
      latest.set(row.key, row);
    }
  }
  return latest;
}

function bestResult(older, preferred) {
  if (!older) return preferred;
  if (!preferred) return older;
  if (!older.total) return preferred;
  if (!preferred.total) return older;
  const olderRatio = older.best / older.total;
  const preferredRatio = preferred.best / preferred.total;
  return olderRatio > preferredRatio ||
    (olderRatio === preferredRatio && older.attempts > preferred.attempts)
    ? older
    : preferred;
}

function mergeResults(older = {}, preferred = {}) {
  const merged = { ...older, ...preferred };
  for (const id of Object.keys(older)) {
    const result = bestResult(older[id], preferred[id]);
    if (result) merged[id] = result;
  }
  return merged;
}

function isEmpty(value) {
  return value === undefined || value === null || value === "";
}

function mergeLogbook(older = {}, preferred = {}) {
  const merged = { ...older, ...preferred };
  for (const [key, value] of Object.entries(older)) {
    const completionFlag = key.endsWith(".ok") ||
      key.startsWith("slidegate.") ||
      key.startsWith("videoengagement.likeXp.") ||
      key.startsWith("videoengagement.commentXp.");

    if (isEmpty(preferred[key]) || (value === true && completionFlag)) {
      merged[key] = value;
    }
  }
  return merged;
}

function mergeProgress(older, preferred) {
  const units = { ...(older.units ?? {}), ...(preferred.units ?? {}) };
  for (const [id, before] of Object.entries(older.units ?? {})) {
    const after = preferred.units?.[id];
    if (!after) continue;

    const activities = { ...(before.activities ?? {}), ...(after.activities ?? {}) };
    for (const [activity, completed] of Object.entries(before.activities ?? {})) {
      if (completed === true) activities[activity] = true;
    }

    units[id] = {
      ...before,
      ...after,
      activities,
      quiz: bestResult(before.quiz, after.quiz),
      quizzes: mergeResults(before.quizzes, after.quizzes),
      exercises: mergeResults(before.exercises, after.exercises),
      logbook: mergeLogbook(before.logbook, after.logbook),
    };
  }

  return { ...older, ...preferred, units };
}

function mergeLessonQuiz(older, preferred) {
  const answers = { ...(older.answers ?? {}), ...(preferred.answers ?? {}) };
  const checked = { ...(older.checked ?? {}), ...(preferred.checked ?? {}) };
  const attempts = { ...(older.attempts ?? {}), ...(preferred.attempts ?? {}) };

  for (const [id, value] of Object.entries(older.checked ?? {})) {
    if (value === true) checked[id] = true;
  }
  for (const [id, value] of Object.entries(older.attempts ?? {})) {
    attempts[id] = Math.max(Number(value) || 0, Number(preferred.attempts?.[id]) || 0);
  }

  return { ...older, ...preferred, answers, checked, attempts };
}

function sqlLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function jsonLiteral(value) {
  const json = JSON.stringify(value);
  const tag = "$itss_recovery$";
  if (json.includes(tag)) throw new Error("Recovery delimiter unexpectedly occurs in JSON data");
  return `${tag}${json}${tag}`;
}

const historical = latestByKey(readCsv(historicalPath));
const live = latestByKey(readCsv(livePath));
const updates = [];

for (const key of targetKeys) {
  const olderRow = historical.get(key);
  const liveRow = live.get(key);
  if (!olderRow || !liveRow) throw new Error(`Missing historical or live row for ${key}`);

  const olderValue = JSON.parse(olderRow.value);
  const liveValue = JSON.parse(liveRow.value);
  const mergedValue = key.startsWith("itss.progress.")
    ? mergeProgress(olderValue, liveValue)
    : mergeLessonQuiz(olderValue, liveValue);

  if (JSON.stringify(mergedValue) !== JSON.stringify(liveValue)) {
    updates.push({ ...liveRow, mergedValue });
  }
}

if (updates.length === 0) throw new Error("No recoverable differences were found");

const batch = "2026-10-21-five-learner-progress";
const checks = updates.map((row) => `
  IF NOT EXISTS (
    SELECT 1 FROM public.app_state
    WHERE user_id = ${sqlLiteral(row.user_id)}::uuid
      AND tenant_id = ${sqlLiteral(row.tenant_id)}
      AND key = ${sqlLiteral(row.key)}
      AND updated_at = ${sqlLiteral(row.updated_at)}::timestamptz
  ) THEN
    RAISE EXCEPTION 'Live row changed since backup: ${row.key}';
  END IF;`).join("\n");

const backupPredicates = updates.map((row) => `(
    user_id = ${sqlLiteral(row.user_id)}::uuid
    AND tenant_id = ${sqlLiteral(row.tenant_id)}
    AND key = ${sqlLiteral(row.key)}
  )`).join("\n  OR ");

const updateSql = updates.map((row) => `UPDATE public.app_state
SET value = ${jsonLiteral(row.mergedValue)},
    updated_at = now()
WHERE user_id = ${sqlLiteral(row.user_id)}::uuid
  AND tenant_id = ${sqlLiteral(row.tenant_id)}
  AND key = ${sqlLiteral(row.key)}
  AND updated_at = ${sqlLiteral(row.updated_at)}::timestamptz;`).join("\n\n");

const sql = `-- Generated learner-progress recovery. Review before running in the LIVE project.
-- Restores historical evidence without replacing newer answers or stronger scores.
BEGIN;

DO $$
BEGIN${checks}
END $$;

CREATE TABLE IF NOT EXISTS public.app_state_recovery_backup_20261021 AS
SELECT state.*, ''::text AS backup_batch, now() AS backed_up_at
FROM public.app_state AS state
WITH NO DATA;

INSERT INTO public.app_state_recovery_backup_20261021
SELECT state.*, ${sqlLiteral(batch)}, now()
FROM public.app_state AS state
WHERE (${backupPredicates})
  AND NOT EXISTS (
    SELECT 1
    FROM public.app_state_recovery_backup_20261021 AS backup
    WHERE backup.user_id = state.user_id
      AND backup.key = state.key
      AND backup.backup_batch = ${sqlLiteral(batch)}
  );

${updateSql}

COMMIT;

SELECT user_id, tenant_id, key, updated_at, length(value) AS value_size
FROM public.app_state
WHERE ${backupPredicates}
ORDER BY key;
`;

const rollbackPath = outputPath.replace(/\.sql$/i, "-rollback.sql");
const rollback = `-- Roll back the learner-progress recovery batch if verification fails.
BEGIN;

UPDATE public.app_state AS state
SET value = backup.value,
    updated_at = backup.updated_at,
    tenant_id = backup.tenant_id
FROM public.app_state_recovery_backup_20261021 AS backup
WHERE backup.backup_batch = ${sqlLiteral(batch)}
  AND state.user_id = backup.user_id
  AND state.key = backup.key;

COMMIT;
`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, sql, "utf8");
fs.writeFileSync(rollbackPath, rollback, "utf8");

console.log(JSON.stringify({
  updates: updates.map(({ user_id, key, updated_at, value, mergedValue }) => ({
    user_id,
    key,
    expected_updated_at: updated_at,
    before_size: value.length,
    after_size: JSON.stringify(mergedValue).length,
  })),
  outputPath,
  rollbackPath,
}, null, 2));
