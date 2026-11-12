import type { ProgressState, QuizResult, ExerciseResult, UnitProgress } from "../types";

export function parseProgressSnapshot(value: string): ProgressState {
  const parsed = JSON.parse(value) as ProgressState;
  const isRecord = (record: unknown) => !!record && typeof record === "object" && !Array.isArray(record);
  if (!parsed || typeof parsed.units !== "object" || parsed.units === null || Array.isArray(parsed.units) ||
      Object.values(parsed.units).some(unit => !isRecord(unit) || !isRecord(unit.activities) ||
        [unit.logbook, unit.quizzes, unit.exercises].some(record => record !== undefined && !isRecord(record)))) {
    throw new Error("The saved progress has an invalid format.");
  }
  return parsed;
}

function bestResult<T extends QuizResult | ExerciseResult>(older: T | undefined, preferred: T | undefined): T | undefined {
  if (!older) return preferred;
  if (!preferred) return older;
  if (!older.total) return preferred;
  if (!preferred.total) return older;
  const beforeRatio = older.best / older.total;
  const afterRatio = preferred.best / preferred.total;
  const strongest = beforeRatio > afterRatio ||
    (beforeRatio === afterRatio && older.attempts > preferred.attempts) ? older : preferred;
  // Keep a real recorded result intact, including its attempt history and
  // retake penalty. Never manufacture an improved first-attempt score.
  return strongest;
}

function mergeResults<T extends QuizResult | ExerciseResult>(older: Record<string, T> = {}, preferred: Record<string, T> = {}): Record<string, T> {
  const merged = { ...older, ...preferred };
  for (const id of Object.keys(older)) {
    const result = bestResult(older[id], preferred[id]);
    if (result) merged[id] = result;
  }
  return merged;
}

/** Reconcile snapshots of the same profile without changing the source records. */
export function mergeProgressEvidence(
  older: ProgressState,
  preferred: ProgressState,
  mode: "recover" | "save" = "recover",
): ProgressState {
  const units = { ...older.units, ...preferred.units };
  for (const [id, before] of Object.entries(older.units)) {
    const after = preferred.units[id];
    if (!after) continue;
    const activities = { ...before.activities, ...after.activities };
    for (const activity of Object.keys(before.activities) as (keyof UnitProgress["activities"])[]) {
      if (mode === "recover" && before.activities[activity]) activities[activity] = true;
    }
    const logbook = { ...before.logbook, ...after.logbook };
    for (const [key, value] of Object.entries(before.logbook ?? {})) {
      const preferredValue = after.logbook?.[key];
      const completionFlag = key.endsWith(".ok") ||
        key.startsWith("slidegate.") ||
        key.startsWith("videoengagement.likeXp.") ||
        key.startsWith("videoengagement.commentXp.");
      if (mode === "recover" && ((value === true && completionFlag) ||
          ((preferredValue === undefined || preferredValue === "") && value !== undefined))) {
        logbook[key] = value;
      }
    }
    units[id] = {
      ...before,
      ...after,
      activities,
      quiz: bestResult(before.quiz, after.quiz),
      quizzes: mergeResults(before.quizzes, after.quizzes),
      exercises: mergeResults(before.exercises, after.exercises),
      logbook,
    };
  }
  return { ...older, ...preferred, units };
}

function keepUneditedFields<T>(
  base: Record<string, T> = {},
  edited: Record<string, T> = {},
  current: Record<string, T> = {},
  merged: Record<string, T> = {},
): Record<string, T> {
  const result = { ...merged };
  for (const [key, value] of Object.entries(edited)) {
    if (JSON.stringify(value) === JSON.stringify(base[key]) && current[key] !== undefined) result[key] = current[key];
  }
  return result;
}

/** Apply only locally changed fields; a stale tab must not undo someone else's answers. */
export function mergeProgressChanges(base: ProgressState, edited: ProgressState, current: ProgressState): ProgressState {
  const merged = mergeProgressEvidence(current, edited, "save");
  for (const [id, unit] of Object.entries(edited.units)) {
    const before = base.units[id];
    const remote = current.units[id];
    if (!before || !remote) continue;
    merged.units[id] = {
      ...merged.units[id],
      activities: keepUneditedFields(before.activities, unit.activities, remote.activities, merged.units[id].activities),
      logbook: keepUneditedFields(before.logbook, unit.logbook, remote.logbook, merged.units[id].logbook),
      quizzes: keepUneditedFields(before.quizzes, unit.quizzes, remote.quizzes, merged.units[id].quizzes),
      exercises: keepUneditedFields(before.exercises, unit.exercises, remote.exercises, merged.units[id].exercises),
      quiz: JSON.stringify(before.quiz) === JSON.stringify(unit.quiz) ? remote.quiz ?? unit.quiz : merged.units[id].quiz,
    };
  }
  if (base.lastVisited === edited.lastVisited) merged.lastVisited = current.lastVisited ?? edited.lastVisited;
  return merged;
}
