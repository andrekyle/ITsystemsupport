import { validateCourseDetails, validateCourseModules, type CourseDetails, type GeneratedCourseModule } from "../../lib/courseMetadata";
import { IT_SYSTEMS_SUPPORT } from "./it-systems-support";
import { GENERIC_MANAGEMENT } from "./generic-management";

/** The IT course is the reference shape every course must match. */
export type CourseData = typeof IT_SYSTEMS_SUPPORT & { learnerIds?: string[]; sourcePack?: { id: string; name: string } };

export const COURSES: CourseData[] = [IT_SYSTEMS_SUPPORT, GENERIC_MANAGEMENT];

export const courseStorageKey = (id: string) => `itss.course.${id}.shared`;
export function getCourses(): CourseData[] {
  const courses = COURSES.map(base => {
    try {
      const saved = JSON.parse(localStorage.getItem(courseStorageKey(base.id)) ?? "null") as CourseData | null;
      if (saved?.id === base.id && saved.meta?.title && Array.isArray(saved.modules)) return saved;
    } catch { /* Use built-in content when an override cannot be read. */ }
    return base;
  });
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)!;
    if (!key.startsWith("itss.course.") || !key.endsWith(".shared")) continue;
    try {
      const course = JSON.parse(localStorage.getItem(key)! ) as CourseData;
      if (course.id?.startsWith("custom-") && course.meta?.title && Array.isArray(course.modules)
        && key === courseStorageKey(course.id) && !courses.some(c => c.id === course.id)) courses.push(course);
    } catch { /* Ignore invalid stored course records. */ }
  }
  return courses;
}

/** Merge only edited fields into the latest record. Reject overlapping edits. */
export function mergeCourseEdits<T>(original: T, edited: T, latest: T, path = "course"): T {
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  if (same(original, edited)) return structuredClone(latest);
  if (same(edited, latest)) return structuredClone(latest);
  if (Array.isArray(original) && Array.isArray(edited) && Array.isArray(latest)) {
    const identity = (value: unknown): unknown => value && typeof value === "object" ? (value as { id?: string; us?: string }).id ?? (value as { us?: string }).us : undefined;
    if ([...original, ...edited, ...latest].every(value => identity(value) !== undefined)) {
      const result = structuredClone(latest);
      for (const value of original) {
        const edit = edited.find(candidate => identity(candidate) === identity(value));
        const target = result.findIndex(candidate => identity(candidate) === identity(value));
        if (!edit) {
          if (target >= 0 && !same(value, result[target])) throw new Error(`${path}: an item being deleted was changed elsewhere. Reload before deleting it.`);
          if (target >= 0) result.splice(target, 1);
        } else if (!same(value, edit)) {
          if (target < 0) throw new Error(`${path}: an edited item was removed. Reload before editing it again.`);
          result[target] = mergeCourseEdits(value, edit, result[target], `${path}.${identity(value)}`);
        }
      }
      for (const value of edited) {
        if (original.some(candidate => identity(candidate) === identity(value))) continue;
        if (result.some(candidate => identity(candidate) === identity(value))) throw new Error(`${path}: this item already exists. Choose a unique code.`);
        result.push(structuredClone(value));
      }
      return result as T;
    }
    if (original.length === edited.length && original.length === latest.length && original.every(value => identity(value) === undefined)) {
      return original.map((value, index) => mergeCourseEdits(value, edited[index], latest[index], `${path}.${index}`)) as T;
    }
  } else if (original && edited && latest && typeof original === "object" && typeof edited === "object" && typeof latest === "object") {
    const before = original as Record<string, unknown>;
    const after = edited as Record<string, unknown>;
    const current = latest as Record<string, unknown>;
    const result = structuredClone(current);
    for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
      if (same(before[key], after[key])) continue;
      const value = mergeCourseEdits(before[key], after[key], current[key], `${path}.${key}`);
      if (key in after) result[key] = value;
      else delete result[key];
    }
    return result as T;
  }
  if (!same(original, latest)) throw new Error(`${path} was changed elsewhere. Reload and review that field before saving.`);
  return structuredClone(edited);
}

export function saveCourseEdits(original: CourseData, edited: CourseData) {
  if (original.id !== edited.id) throw new Error("The course identity cannot be changed.");
  const latest = getCourses().find(course => course.id === original.id);
  if (!latest) throw new Error("This course is no longer available.");
  const merged = mergeCourseEdits(original, edited, latest);
  if (JSON.stringify(merged) !== JSON.stringify(latest)) saveCourse(merged);
  return merged;
}

/** Save edits to built-in or custom courses using the shared course record. */
export function saveCourse(course: CourseData) {
  if (!COURSES.some(base => base.id === course.id) && !course.id.startsWith("custom-")) throw new Error("Unknown course.");
  const stored = localStorage.getItem(courseStorageKey(course.id));
  if (stored && JSON.parse(stored).deleted === true) throw new Error("This course has been deleted.");
  localStorage.setItem(courseStorageKey(course.id), JSON.stringify(course));
}

export function saveCustomCourse(course: CourseData) {
  if (!course.id.startsWith("custom-")) throw new Error("Only custom courses can be saved here.");
  const stored = localStorage.getItem(courseStorageKey(course.id));
  if (stored && JSON.parse(stored).deleted === true) throw new Error("This course has been deleted.");
  localStorage.setItem(courseStorageKey(course.id), JSON.stringify(course));
}

export function deleteCustomCourse(id: string) {
  if (!id.startsWith("custom-")) throw new Error("Built-in courses cannot be deleted.");
  // Retain a shared deletion marker so another device's cached course is
  // replaced during sync instead of being uploaded again as local-only data.
  localStorage.setItem(courseStorageKey(id), JSON.stringify({ id, deleted: true }));
}

export function createCourse(details: CourseDetails, modules: GeneratedCourseModule[]): CourseData {
  validateCourseDetails(details);
  validateCourseModules(modules, details.unitCounts, details);
  // Keep the page shape without inheriting another qualification's content.
  function empty(value: unknown): unknown {
    if (Array.isArray(value)) return [];
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, empty(item)]));
    return typeof value === "string" ? "" : value;
  }
  const course = empty(IT_SYSTEMS_SUPPORT) as CourseData;
  const courseId = `custom-${crypto.randomUUID()}`;
  course.id = courseId;
  course.learnerIds = [];
  course.label = `${details.title.trim()} (${details.saqaId.trim()})`;
  course.blurb = details.description.trim();
  course.meta = { title: details.title.trim(), saqaId: details.saqaId.trim(), nqfLevel: details.nqfLevel, credits: details.credits, time: "09h00 - 14h00", sponsor: "", qualityAssurance: "" };
  course.modules = modules.map((module, index) => ({
    ...structuredClone(module), id: `${courseId}-m${index + 1}`, icon: "layers", activities: 0,
    units: module.units.map(unit => ({ ...structuredClone(unit), dates: "", time: course.meta.time, metadataSource: `https://allqs.saqa.org.za/showUnitStandard.php?id=${unit.us}` })),
  }));
  course.programmeAbout.intro = course.blurb;
  course.programmeAbout.lead = "On completion, the graduate will be able to:";
  course.programmeAbout.outcomes = modules.flatMap(module => module.outcomes.map(text => ({ icon: "award", text })));
  course.programmeAbout.saqaLink = { label: "View qualification on SAQA", url: `https://allqs.saqa.org.za/showQualification.php?id=${course.meta.saqaId}` };
  course.programmePurpose.intro = course.blurb;
  course.moduleFlow = structuredClone(IT_SYSTEMS_SUPPORT.moduleFlow);
  return course;
}

const KEY = "itss.activeCourse";

export function activeCourseId(): string {
  try {
    const id = localStorage.getItem(KEY);
    if (id && getCourses().some((c) => c.id === id)) return id;
  } catch {
    /* storage unavailable */
  }
  return COURSES[0].id;
}

export function activeCourse(): CourseData {
  const id = activeCourseId();
  return getCourses().find((c) => c.id === id) ?? COURSES[0];
}

/** Course data is read once at module init across the app, so switching reloads. */
export function setActiveCourse(id: string) {
  if (id === activeCourseId()) return;
  try {
    localStorage.setItem(KEY, id);
  } catch {
    return;
  }
  location.reload();
}
