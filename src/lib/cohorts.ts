import type { Profile } from "../types";

export function cohortIds(profiles: readonly Profile[]): string[] {
  return [...new Set(
    profiles
      .filter(profile => profile.role === "Learner")
      .map(profile => profile.cohortId?.trim())
      .filter((cohortId): cohortId is string => !!cohortId)
  )].sort((a, b) => a.localeCompare(b));
}
