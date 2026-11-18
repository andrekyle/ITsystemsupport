import type { Profile } from "../types";
import { activeCourse, getCourses, saveCourse } from "../data/courses";

/** Existing qualifications retain their roster; new ones require explicit enrolment. */
export function isEnrolledInCourse(profile: Profile, courseId?: string): boolean {
  if (profile.role !== "Learner") return true;
  const course = courseId ? getCourses().find(item => item.id === courseId) : activeCourse();
  if (!course) return false;
  if (!course.id.startsWith("custom-")) return true;
  const ids = course.learnerIds ?? [];
  return ids.includes(profile.id) || (!!profile.cloudUserId && ids.includes(profile.cloudUserId));
}
export function enrolCourseLearners(profiles: Profile[]) {
  const course = activeCourse();
  if (!course.id.startsWith("custom-")) return;
  const ids = new Set(course.learnerIds ?? []);
  for (const profile of profiles) { ids.add(profile.id); if (profile.cloudUserId) ids.add(profile.cloudUserId); }
  saveCourse({ ...course, learnerIds: [...ids] });
}
