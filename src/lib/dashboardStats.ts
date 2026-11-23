import { COURSE_META, MODULES, POE_TOTAL, TOTAL_UNITS } from "../data/course";
import type { PoeDoc, ProgressState } from "../types";
import { moduleCompletion, overallStats, type UnitOutcome } from "../store";

export interface LearnerDashboardRecord {
  progress: ProgressState;
  poe: Record<string, PoeDoc>;
  outcomes: Record<string, UnitOutcome>;
  attendance: number;
}

export function aggregateLearnerDashboard(records: LearnerDashboardRecord[]) {
  let completion = 0;
  let creditsEarned = 0;
  let unitsCompleted = 0;
  let modulesCompleted = 0;
  let classesAttended = 0;
  let poeItemsComplete = 0;

  for (const record of records) {
    const stats = overallStats(record.progress, record.poe, record.outcomes);
    completion += stats.overall;
    creditsEarned += stats.creditsEarned;
    unitsCompleted += stats.unitsCompleted;
    modulesCompleted += stats.modulesCompleted;
    classesAttended += record.attendance;
    poeItemsComplete += Object.keys(record.poe).length;
  }

  const learnerCount = records.length;
  return {
    learnerCount,
    overall: learnerCount ? completion / learnerCount : 0,
    creditsEarned,
    creditsTotal: COURSE_META.credits * learnerCount,
    unitsCompleted,
    unitsTotal: TOTAL_UNITS * learnerCount,
    modulesCompleted,
    modulesTotal: MODULES.length * learnerCount,
    classesAttended,
    poeItemsComplete,
    poeItemsTotal: POE_TOTAL * learnerCount,
    moduleProgress: Object.fromEntries(MODULES.map(module => [
      module.id,
      learnerCount
        ? records.reduce((sum, record) => sum + moduleCompletion(record.progress, module.id), 0) / learnerCount
        : 0,
    ])),
  };
}
