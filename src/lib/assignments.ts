import { isEnrolledInCourse } from "./courseEnrolment";
import { useSyncExternalStore } from "react";
import { isAdminRole, type Profile } from "../types";
import { supabase } from "./supabase";
import { TENANT_ID } from "./tenant";
import { hasPendingCloudWrite, writeFromCloud } from "./sync";

export const ASSIGNMENTS_KEY = "itss.staff-assignments.shared";
const CHANGE_EVENT = "itss:staff-assignments";
export interface StaffAssignment { courseIds: string[]; learnerIds: string[] }
export type StaffAssignments = Record<string, StaffAssignment>;
export const isAssignedStaff = (profile: Profile) =>
  ["Facilitator", "Assessor", "Moderator"].includes(profile.role);

function parseAssignments(value: string): StaffAssignments {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([, entry]) =>
      entry && Array.isArray(entry.courseIds) && entry.courseIds.every((id: unknown) => typeof id === "string") &&
      Array.isArray(entry.learnerIds) && entry.learnerIds.every((id: unknown) => typeof id === "string")));
  } catch { return {}; }
}

export function readAssignments(): StaffAssignments {
  try { return parseAssignments(localStorage.getItem(ASSIGNMENTS_KEY) ?? "{}"); }
  catch { return {}; }
}

export function assignmentFor(viewer: Profile, assignments: StaffAssignments): StaffAssignment {
  return assignments[viewer.cloudUserId ?? ""] ?? assignments[viewer.id] ?? { courseIds: [], learnerIds: [] };
}

export function canSeeCourse(viewer: Profile, courseId: string, assignments: StaffAssignments): boolean {
  if (viewer.role === "Learner" && !isEnrolledInCourse(viewer, courseId)) return false;
  return !isAssignedStaff(viewer) || assignmentFor(viewer, assignments).courseIds.includes(courseId);
}

export function canSeeProfile(viewer: Profile, target: Profile, assignments: StaffAssignments): boolean {
  if (!isEnrolledInCourse(target)) return false;
  if (isAdminRole(viewer.role) || viewer.id === target.id ||
    (!!viewer.cloudUserId && viewer.cloudUserId === target.cloudUserId)) return true;
  if (!isAssignedStaff(viewer)) return target.role === "Learner";
  const ids = assignmentFor(viewer, assignments).learnerIds;
  return target.role === "Learner" && (ids.includes(target.id) || (!!target.cloudUserId && ids.includes(target.cloudUserId)));
}

const listeners = new Set<() => void>();
let refreshTimer: ReturnType<typeof setInterval> | undefined;
let refreshing = false;
async function refreshAssignments() {
  if (!supabase || refreshing || hasPendingCloudWrite(ASSIGNMENTS_KEY)) return;
  refreshing = true;
  try {
    const { data: auth } = await supabase.auth.getSession();
    if (!auth.session) return;
    const { data, error } = await supabase.from("shared_state").select("value")
      .eq("tenant_id", TENANT_ID).eq("key", ASSIGNMENTS_KEY).maybeSingle();
    if (!error) await writeFromCloud(ASSIGNMENTS_KEY, data?.value ?? "{}");
  } catch { /* Keep the last synced assignments while offline. */ }
  finally { refreshing = false; }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    void refreshAssignments();
    refreshTimer = setInterval(() => { void refreshAssignments(); }, 30_000);
    window.addEventListener("focus", refreshAssignments);
  }
  const onStorage = (event: StorageEvent) => { if (!event.key || event.key === ASSIGNMENTS_KEY) listener(); };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, listener);
  return () => {
    window.removeEventListener("storage", onStorage); window.removeEventListener(CHANGE_EVENT, listener);
    listeners.delete(listener);
    if (!listeners.size) { clearInterval(refreshTimer); window.removeEventListener("focus", refreshAssignments); }
  };
}
const snapshot = () => localStorage.getItem(ASSIGNMENTS_KEY) ?? "{}";
export function useAssignments(): StaffAssignments {
  const value = useSyncExternalStore(subscribe, snapshot, () => "{}");
  return parseAssignments(value);
}

export function saveStaffAssignment(viewer: Profile, staff: Profile, assignment: StaffAssignment) {
  if (!isAdminRole(viewer.role)) throw new Error("Only administrators can change assignments.");
  const next = readAssignments();
  // Retain both identifiers so seeded and signed-in copies resolve consistently.
  next[staff.id] = assignment;
  if (staff.cloudUserId) next[staff.cloudUserId] = assignment;
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
