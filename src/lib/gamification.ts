import type { ProgressState, Profile } from "../types";
import { UNIT_ACTIVITIES } from "../types";
import { MODULES } from "../data/course";
import { loadPoeDocs, loadProgress, poeItemCount } from "../store";
import { bestPoeDocs, bestProgress, type CloudLearnerData } from "./directory";

/**
 * Gamification layer: XP, levels and badges are computed deterministically
 * from real learning records (progress, POE evidence, attendance) — nothing
 * extra is stored, so scores can never drift from the underlying data.
 * Live multiplayer quizzes run on Wayground (linked from the Community page).
 */

export interface Badge {
  id: string;
  name: string;
  desc: string;
  icon: string;
  earned: boolean;
}

export interface Gamification {
  xp: number;
  level: number;
  levelName: string;
  /** XP where the current level started */
  levelFloor: number;
  /** XP needed for the next level (null at max level) */
  nextLevelXp: number | null;
  badges: Badge[];
  /** count of earned badges */
  earnedCount: number;
}

const LEVELS: { name: string; xp: number }[] = [
  { name: "Newcomer", xp: 0 },
  { name: "Apprentice", xp: 150 },
  { name: "Technician", xp: 400 },
  { name: "Specialist", xp: 800 },
  { name: "Professional", xp: 1400 },
  { name: "Expert", xp: 2200 },
  { name: "Master", xp: 3200 },
  { name: "Legend", xp: 4500 },
];

/** Count attendance registers on this device that the profile has signed. */
export function attendanceSignedCount(profileId: string): number {
  let signed = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith("itss.attendance.")) continue;
    try {
      const data = JSON.parse(localStorage.getItem(key) ?? "{}") as {
        rows?: Record<string, unknown>;
      };
      if (data.rows && data.rows[profileId]) signed++;
    } catch {
      /* corrupt register — skip */
    }
  }
  return signed;
}

/** Total attendance registers held on this device (for participation rates). */
export function attendanceRegisterCount(): number {
  let n = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("itss.attendance.")) n++;
  }
  return n;
}

export function computeGamification(
  progress: ProgressState,
  poeItems: number,
  attendanceSigned: number
): Gamification {
  let xp = 0;
  /** stages backed by real recorded evidence (quiz / exercise attempts) —
   *  the ONLY activity XP source, so self-ticking stages cannot farm XP. */
  let evidenceStages = 0;
  let quizzesCompetent = 0;
  let quizzesPerfect = 0;
  let exercisesPassed = 0;
  let slideGates = 0;

  for (const [, unit] of Object.entries(progress.units)) {
    const quizResults = [
      ...(unit.quiz ? [unit.quiz] : []),
      ...Object.values(unit.quizzes ?? {}),
    ];
    let unitHasQuiz = false;
    for (const q of quizResults) {
      if (!q.total) continue;
      unitHasQuiz = true;
      const ratio = q.best / q.total;
      // First-attempt mastery is worth full XP. A best score reached by
      // retaking (answers + explanations are shown after each submission)
      // earns half — so grinding retakes can't out-rank honest first passes.
      const retried = (q.attempts ?? 1) > 1;
      const firstTry = q.history && q.history.length >= (q.attempts ?? 1)
        ? q.history[q.history.length - 1] // oldest kept attempt = the first one
        : null;
      const firstRatio = firstTry && firstTry.total ? firstTry.score / firstTry.total : null;
      const scale = !retried || (firstRatio !== null && firstRatio >= 0.8) ? 1 : 0.5;
      if (ratio >= 1) {
        quizzesPerfect++;
        quizzesCompetent++;
        xp += Math.round(75 * scale);
      } else if (ratio >= 0.8) {
        quizzesCompetent++;
        xp += Math.round(50 * scale);
      } else if (q.best > 0) {
        xp += 10;
      }
    }

    let unitHasExercise = false;
    for (const ex of Object.values(unit.exercises ?? {})) {
      if (!ex.total) continue;
      unitHasExercise = true;
      const ratio = ex.best / ex.total;
      // Written exercises take real effort (typed answers, AI-marked) —
      // they pay more than quizzes so quiz-only grinding can't dominate.
      if (ratio >= 1) {
        exercisesPassed++;
        xp += 90;
      } else if (ratio >= 0.5) {
        exercisesPassed++;
        xp += 60;
      } else {
        xp += 15;
      }
    }

    if (unitHasQuiz) evidenceStages++;
    if (unitHasExercise) evidenceStages++;

    // Slide gate quizzes passed while working through the lesson wizard —
    // recorded as logbook flags so they can't be self-ticked.
    for (const [k, v] of Object.entries(unit.logbook ?? {})) {
      if (v === true && k.startsWith("slidegate.")) slideGates++;
    }
  }

  // Activity XP comes from evidence-backed stages only — a manual tick on
  // "Mark each stage" earns nothing, so the leaderboard can't be gamed by
  // ticking stages on units that were never actually done.
  xp += evidenceStages * 25;
  xp += poeItems * 20;
  xp += attendanceSigned * 15;
  // each 5-question gate passed on a lesson slide is honest evidence of
  // working through the material — smaller than a full quiz (75/50)
  xp += slideGates * 5;

  // module completion (all 4 activities on every unit) for the badge
  let anyModuleComplete = false;
  let unitsCompleted = 0;
  let totalUnits = 0;
  for (const m of MODULES) {
    let done = 0;
    for (const u of m.units) {
      totalUnits++;
      const unit = progress.units[u.us];
      const complete = unit && UNIT_ACTIVITIES.every((a) => unit.activities[a]);
      if (complete) {
        done++;
        unitsCompleted++;
      }
    }
    if (m.units.length > 0 && done === m.units.length) anyModuleComplete = true;
  }
  const overall = totalUnits ? unitsCompleted / totalUnits : 0;

  const badges: Badge[] = [
    { id: "first-steps", name: "First Steps", desc: "Complete your first learning activity", icon: "play", earned: evidenceStages >= 1 || poeItems >= 1 || attendanceSigned >= 1 },
    { id: "quiz-whiz", name: "Quiz Whiz", desc: "Score 80%+ on five quizzes", icon: "target", earned: quizzesCompetent >= 5 },
    { id: "perfectionist", name: "Perfectionist", desc: "Score 100% on a quiz", icon: "award", earned: quizzesPerfect >= 1 },
    { id: "scholar", name: "Scholar", desc: "Pass ten marked exercises", icon: "exercise", earned: exercisesPassed >= 10 },
    { id: "evidence-builder", name: "Evidence Builder", desc: "Upload ten POE items", icon: "folder", earned: poeItems >= 10 },
    { id: "module-master", name: "Module Master", desc: "Complete every unit in a module", icon: "book", earned: anyModuleComplete },
    { id: "regular", name: "Regular", desc: "Sign five attendance registers", icon: "clipboard", earned: attendanceSigned >= 5 },
    { id: "committed", name: "Committed", desc: "Sign ten attendance registers", icon: "calendar", earned: attendanceSigned >= 10 },
    { id: "halfway", name: "Halfway There", desc: "Reach 50% overall completion", icon: "trend", earned: overall >= 0.5 },
    { id: "finisher", name: "Finisher", desc: "Complete every unit standard", icon: "certificate", earned: overall >= 1 },
  ];

  let level = 0;
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].xp) level = i;

  return {
    xp,
    level: level + 1,
    levelName: LEVELS[level].name,
    levelFloor: LEVELS[level].xp,
    nextLevelXp: level + 1 < LEVELS.length ? LEVELS[level + 1].xp : null,
    badges,
    earnedCount: badges.filter((b) => b.earned).length,
  };
}

/** Compute gamification for a profile straight from stored records. */
export function gamificationFor(profileId: string): Gamification {
  return computeGamification(
    loadProgress(profileId),
    poeItemCount(loadPoeDocs(profileId)),
    attendanceSignedCount(profileId)
  );
}

export interface LeaderboardRow {
  profile: Profile;
  xp: number;
  level: number;
  levelName: string;
  earnedBadges: number;
}

/** Rank learner profiles by XP (highest first). */
export function leaderboard(profiles: Profile[]): LeaderboardRow[] {
  return profiles
    .filter((p) => p.role === "Learner")
    .map((p) => {
      const g = gamificationFor(p.id);
      return { profile: p, xp: g.xp, level: g.level, levelName: g.levelName, earnedBadges: g.earnedCount };
    })
    .sort((a, b) => b.xp - a.xp);
}

/**
 * Cloud-first leaderboard. Uses the cloud directory as the authoritative
 * roster of accounts (only accounts that have actually signed in with their
 * own Supabase auth show up). Each learner's XP is computed through the same
 * bestProgress/bestPoeDocs helpers the Analytics page uses — whichever copy
 * (local snapshot or cloud sync) holds more evidence wins — so the
 * leaderboard and Analytics can never disagree about a learner's XP.
 */
export function cloudLeaderboard(cloud: CloudLearnerData): LeaderboardRow[] {
  return cloud.profiles
    .filter((p) => p.role === "Learner")
    .map((p) => {
      const progress = bestProgress(p, cloud);
      const poe = bestPoeDocs(p, cloud);
      const g = computeGamification(progress, poeItemCount(poe), attendanceSignedCount(p.id));
      return { profile: p, xp: g.xp, level: g.level, levelName: g.levelName, earnedBadges: g.earnedCount };
    })
    .sort((a, b) => b.xp - a.xp);
}
