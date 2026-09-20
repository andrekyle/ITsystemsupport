import { IT_SYSTEMS_SUPPORT } from "./it-systems-support";
import { GENERIC_MANAGEMENT } from "./generic-management";

/** The IT course is the reference shape every course must match. */
export type CourseData = typeof IT_SYSTEMS_SUPPORT;

export const COURSES: CourseData[] = [IT_SYSTEMS_SUPPORT, GENERIC_MANAGEMENT];

export const courseStorageKey = (id: string) => `itss.course.${id}.shared`;
export function getCourses(): CourseData[] {
  const courses = [...COURSES];
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

export function saveCustomCourse(course: CourseData) {
  if (!course.id.startsWith("custom-")) throw new Error("Only custom courses can be saved here.");
  localStorage.setItem(courseStorageKey(course.id), JSON.stringify(course));
}

export function createCourse(details: { title: string; saqaId: string; nqfLevel: number; credits: number; description: string; moduleName: string }): CourseData {
  if (!details.title.trim() || !details.moduleName.trim()) throw new Error("Enter the course name and first module name.");
  if (!/^\d+$/.test(details.saqaId.trim())) throw new Error("Enter a numeric SAQA ID.");
  if (!Number.isInteger(details.nqfLevel) || details.nqfLevel < 1 || details.nqfLevel > 10 || !Number.isInteger(details.credits) || details.credits < 0) throw new Error("Enter a valid NQF level (1–10) and credits.");
  // Retain the shared course shape without copying another qualification's content.
  const blank = (value: unknown): unknown => Array.isArray(value) ? [] : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).map(([key, item]) => [key, blank(item)]))
    : typeof value === "number" ? 0 : typeof value === "boolean" ? false : "";
  const course = blank(IT_SYSTEMS_SUPPORT) as CourseData;
  course.id = `custom-${crypto.randomUUID()}`;
  course.label = `${details.title.trim()} (${details.saqaId.trim()})`;
  course.blurb = details.description.trim();
  course.meta = { title: details.title.trim(), saqaId: details.saqaId.trim(), nqfLevel: details.nqfLevel, credits: details.credits, time: "09h00 - 14h00", sponsor: "", qualityAssurance: "" };
  course.modules = [{ id: `${course.id}-m1`, name: details.moduleName.trim(), icon: "book", activities: 0, units: [] }];
  course.programmeAbout.intro = course.blurb;
  course.programmeAbout.saqaLink = { label: "View qualification on SAQA", url: `https://allqs.saqa.org.za/showQualification.php?id=${course.meta.saqaId}` };
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
