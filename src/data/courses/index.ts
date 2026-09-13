import { IT_SYSTEMS_SUPPORT } from "./it-systems-support";
import { GENERIC_MANAGEMENT } from "./generic-management";

/** The IT course is the reference shape every course must match. */
export type CourseData = typeof IT_SYSTEMS_SUPPORT;

export const COURSES: CourseData[] = [IT_SYSTEMS_SUPPORT, GENERIC_MANAGEMENT];

const KEY = "itss.activeCourse";

export function activeCourseId(): string {
  try {
    const id = localStorage.getItem(KEY);
    if (id && COURSES.some((c) => c.id === id)) return id;
  } catch {
    /* storage unavailable */
  }
  return COURSES[0].id;
}

export function activeCourse(): CourseData {
  const id = activeCourseId();
  return COURSES.find((c) => c.id === id) ?? COURSES[0];
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
