import { MODULES, COURSE_META, POE_TOTAL, TOTAL_UNITS } from "../src/data/course";
import { aggregateLearnerDashboard } from "../src/lib/dashboardStats";
import type { PoeDoc, ProgressState } from "../src/types";
import { UNIT_ACTIVITIES } from "../src/types";
import type { UnitOutcome } from "../src/store";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

function documentRecord(id: string): PoeDoc {
  return { name: id, type: "application/pdf", size: 1, uploadedAt: "2026-01-01T00:00:00.000Z" };
}

export function testDashboardAggregate() {
  const completedProgress: ProgressState = {
    units: Object.fromEntries(MODULES.flatMap(module => module.units.map(unit => [
      unit.us,
      { activities: Object.fromEntries(UNIT_ACTIVITIES.map(activity => [activity, true])) },
    ]))),
  };
  const completedOutcomes: Record<string, UnitOutcome> = Object.fromEntries(
    MODULES.flatMap(module => module.units.map(unit => [
      unit.us,
      { status: "C", byId: "assessor", by: "Assessor", at: "2026-01-01T00:00:00.000Z" },
    ]))
  );
  const summary = aggregateLearnerDashboard([
    {
      progress: completedProgress,
      poe: { first: documentRecord("first"), second: documentRecord("second") },
      outcomes: completedOutcomes,
      attendance: 3,
    },
    {
      progress: { units: {} },
      poe: { third: documentRecord("third") },
      outcomes: {},
      attendance: 2,
    },
  ]);
  const expectedCredits = MODULES.flatMap(module => module.units).reduce((sum, unit) => sum + unit.credits, 0);

  assert(summary.learnerCount === 2, "Count both learner records.");
  assert(summary.overall === 0.5, "Average overall completion across learners.");
  assert(summary.creditsEarned === expectedCredits && summary.creditsTotal === COURSE_META.credits * 2, "Sum earned credits and scale the cohort denominator.");
  assert(summary.unitsCompleted === TOTAL_UNITS && summary.unitsTotal === TOTAL_UNITS * 2, "Sum completed standards and scale the cohort denominator.");
  assert(summary.modulesCompleted === MODULES.length && summary.modulesTotal === MODULES.length * 2, "Sum completed modules and scale the cohort denominator.");
  assert(summary.classesAttended === 5, "Sum signed attendance registers across learners.");
  assert(summary.poeItemsComplete === 3 && summary.poeItemsTotal === POE_TOTAL * 2, "Sum POE items and scale the cohort denominator.");
  assert(MODULES.every(module => summary.moduleProgress[module.id] === 0.5), "Average module progress across learners.");

  const empty = aggregateLearnerDashboard([]);
  assert(empty.learnerCount === 0 && empty.creditsTotal === 0 && empty.unitsTotal === 0, "Empty cohorts have zero denominators.");
  return "Passed: cohort completion, credits, standards, modules, attendance, POE totals, module averages, and empty-cohort handling.";
}

try {
  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent = testDashboardAggregate();
} catch (error) {
  document.body.dataset.result = "failed";
  document.getElementById("result")!.textContent = error instanceof Error ? error.message : String(error);
}
