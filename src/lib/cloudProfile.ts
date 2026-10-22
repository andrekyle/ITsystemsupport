import type { Profile } from "../types";
import { TENANT } from "./tenant";

export interface CloudIdentity {
  userId: string;
  email: string | null;
}

export function profileMatchesCloudIdentity(profile: Profile, identity: CloudIdentity): boolean {
  const email = identity.email?.trim().toLowerCase() ?? "";
  const name = profile.name.trim().toLowerCase();
  const profileEmail = profile.enrolment?.email?.trim().toLowerCase() ?? "";
  const designated = profile.role === "Super User" ||
    name === TENANT.superUserName.toLowerCase() ||
    name === TENANT.superUserEmail ||
    profileEmail === TENANT.superUserEmail;
  if (designated && email !== TENANT.superUserEmail) return false;
  if (profile.cloudUserId) return profile.cloudUserId === identity.userId;
  if (!email) return false;
  return profileEmail === email || name === email ||
    (designated && email === TENANT.superUserEmail);
}

export function resolveCloudProfile(profiles: Profile[], identity: CloudIdentity): Profile | null {
  const matches = profiles.filter(profile => profileMatchesCloudIdentity(profile, identity));
  const linked = matches.filter(profile => profile.cloudUserId === identity.userId);
  if (linked.length === 1) return linked[0];
  return matches.length === 1 ? matches[0] : null;
}
