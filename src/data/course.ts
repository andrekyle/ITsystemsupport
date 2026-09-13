// Facade over the active course so existing imports keep working.
// The course is selected per device (localStorage) via the switcher on the Course page.
import { activeCourse } from "./courses";

const C = activeCourse();

export const COURSE_META = C.meta;
export const COURSE_BLURB = C.blurb;
export const MODULES = C.modules;
export const PROGRAMME_ABOUT = C.programmeAbout;
export const PROGRAMME_PURPOSE = C.programmePurpose;
export const WHAT_YOULL_LEARN = C.whatYoullLearn;
export const RESOURCES = C.resources;
export const POE_SECTIONS = C.poeSections;
export const MODULE_FLOW = C.moduleFlow;
export const PROGRAMME_MILESTONES = C.programmeMilestones;
export const DELIVERABLES = C.deliverables;
export const FACILITATION_DUTIES = C.facilitationDuties;
export const ASSESSMENT_FRAMEWORK = C.assessmentFramework;

/** Up to this many files may be uploaded per multi-file POE item. */
export const MAX_POE_FILES = 10;

export const POE_TOTAL = POE_SECTIONS.reduce((n, s) => n + s.items.length, 0);

export const TOTAL_UNITS = MODULES.reduce((n, m) => n + m.units.length, 0);
export const TOTAL_CREDITS = MODULES.reduce(
  (n, m) => n + m.units.reduce((c, u) => c + u.credits, 0),
  0
);

export function findModule(id: string) {
  return MODULES.find((m) => m.id === id);
}

export function findUnit(us: string) {
  for (const m of MODULES) {
    const u = m.units.find((x) => x.us === us);
    if (u) return { module: m, unit: u };
  }
  return undefined;
}

/** True for registered SAQA unit standards (numeric codes); false for internal lessons like HWSW. */
export function isSaqaUnit(us: string) {
  return /^\d+$/.test(us);
}

/** Display label for a unit code — "US 8252" for registered standards, the plain code for internal lessons. */
export function usLabel(us: string) {
  return isSaqaUnit(us) ? `US ${us}` : us;
}
