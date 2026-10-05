import type { UnitContent } from "../types";
import { courseScopedUnit } from "./courseScope";

const inlineDraftKey = (profileId: string, unitId: string) =>
  `itss.inlineDraft.${profileId}.${courseScopedUnit(unitId)}`;

export function loadInlineDraft(profileId: string, unitId: string): UnitContent | undefined {
  try {
    const value = sessionStorage.getItem(inlineDraftKey(profileId, unitId));
    return value ? JSON.parse(value) as UnitContent : undefined;
  } catch {
    return undefined;
  }
}

export function saveInlineDraft(profileId: string, unitId: string, draft: UnitContent): boolean {
  try {
    sessionStorage.setItem(inlineDraftKey(profileId, unitId), JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function clearInlineDraft(profileId: string, unitId: string): void {
  try {
    sessionStorage.removeItem(inlineDraftKey(profileId, unitId));
  } catch {
    /* session storage cleanup is best effort */
  }
}
