-- Roll back the learner-progress recovery batch if verification fails.
BEGIN;

UPDATE public.app_state AS state
SET value = backup.value,
    updated_at = backup.updated_at,
    tenant_id = backup.tenant_id
FROM public.app_state_recovery_backup_20261021 AS backup
WHERE backup.backup_batch = '2026-10-21-five-learner-progress'
  AND state.user_id = backup.user_id
  AND state.key = backup.key;

COMMIT;
