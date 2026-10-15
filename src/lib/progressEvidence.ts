import type { ProgressState, QuizResult, ExerciseResult, UnitProgress } from "../types";

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
export function mergeProgressEvidence(older: ProgressState, preferred: ProgressState): ProgressState {
  const units = { ...older.units, ...preferred.units };
  for (const [id, before] of Object.entries(older.units)) {
    const after = preferred.units[id];
    if (!after) continue;
    const activities = { ...before.activities, ...after.activities };
    for (const activity of Object.keys(before.activities) as (keyof UnitProgress["activities"])[]) {
      if (before.activities[activity]) activities[activity] = true;
    }
    const logbook = { ...before.logbook, ...after.logbook };
    for (const [key, value] of Object.entries(before.logbook ?? {})) {
      if (value === true && (
        key.startsWith("slidegate.") ||
        key.startsWith("videoengagement.likeXp.") ||
        key.startsWith("videoengagement.commentXp.")
      )) logbook[key] = true;
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
