import type { ProgressState } from "../src/types";
import { mergeProgressEvidence } from "../src/lib/progressEvidence";
import { computeGamification, cloudLeaderboard } from "../src/lib/gamification";
import { bestProgress, type CloudLearnerData } from "../src/lib/directory";

export function testProgressEvidence() {
  function assert(value: unknown, message: string) {
    if (!value) throw new Error(message);
  }
  const older: ProgressState = { units: {
    "100": { activities: {}, quizzes: {
      first: { best: 10, total: 10, attempts: 1 },
      retry: { best: 10, total: 10, attempts: 2 },
    }, logbook: { "slidegate.one": true, note: "old note" } },
    "200": { activities: {}, exercises: { written: { best: 10, last: 10, total: 10, attempts: 1 } } },
  } };
  const owner: ProgressState = { units: {
    "100": { activities: {}, quizzes: {
      first: { best: 8, total: 10, attempts: 2 },
      third: { best: 8, total: 10, attempts: 1 },
    }, logbook: { "slidegate.one": false, note: "current note" } },
  } };
  const original = JSON.stringify([older, owner]);
  const recovered = mergeProgressEvidence(older, owner);
  // 75 + 38 + 50 quiz XP, two quiz/exercise stages at 25 each,
  // 90 written-exercise XP and one slide gate at 5 XP.
  assert(computeGamification(recovered, 0, 0).xp === 308, "Recover exact evidence-based XP, retaining the retake penalty.");
  assert(recovered.units["100"].logbook?.note === "current note", "Keep preferred narrative fields.");
  assert(computeGamification(mergeProgressEvidence(recovered, owner), 0, 0).xp === 308, "Repeated reads must not double-count XP.");
  assert(JSON.stringify([older, owner]) === original, "Do not mutate either source snapshot.");
  const empty: ProgressState = { units: { "300": { activities: {} } } };
  assert(computeGamification(mergeProgressEvidence(older, empty), 0, 0).xp === computeGamification(older, 0, 0).xp, "A newer empty snapshot must not hide recorded work.");
  const profile = { id: "xp-recovery-test", name: "Evidence test", role: "Learner" as const, createdAt: "" };
  const cloud: CloudLearnerData = {
    profiles: [profile], owners: { [profile.id]: "owner" }, poe: {}, checklists: {},
    progress: { [profile.id]: recovered },
  };
  assert(computeGamification(bestProgress(profile, cloud), 0, 0).xp === 308, "Analytics must receive recovered evidence.");
  assert(cloudLeaderboard(cloud)[0].xp === 308, "Leaderboard must display the same recovered XP.");
  const tie = mergeProgressEvidence(
    { units: { "100": { activities: {}, quiz: { best: 10, total: 10, attempts: 2 } } } },
    { units: { "100": { activities: {}, quiz: { best: 10, total: 10, attempts: 1 } } } }
  );
  assert(tie.units["100"].quiz?.attempts === 2, "Equal scores must not erase known retakes.");
  return "Passed: exact recovered XP, retake penalties, distinct assessments, missing units, idempotence, source preservation and leaderboard/Analytics consistency.";
}
