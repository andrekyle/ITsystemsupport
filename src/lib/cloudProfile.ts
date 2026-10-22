import type { Profile } from "../types";
import { TENANT } from "./tenant";

export interface CloudIdentity {
  userId: string;
  email: string | null;
}

export function isSuperUserIdentity(identity: CloudIdentity): boolean {
  return !!identity.userId && identity.email?.trim().toLowerCase() === TENANT.superUserEmail.toLowerCase();
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
  if (isSuperUserIdentity(identity)) {
    // The authenticated installation owner does not need learner enrolment.
    // Prefer an existing owner profile so its notes/settings retain their id.
    const email = TENANT.superUserEmail.toLowerCase();
    const owners = profiles.filter(profile =>
      profile.name.trim().toLowerCase() === TENANT.superUserName.toLowerCase() ||
      profile.name.trim().toLowerCase() === email ||
      profile.enrolment?.email?.trim().toLowerCase() === email ||
      (profile.role === "Super User" && profile.cloudUserId === identity.userId)
    );
    owners.sort((a, b) =>
      Number(b.cloudUserId === identity.userId) - Number(a.cloudUserId === identity.userId) ||
      Number(b.enrolment?.email?.trim().toLowerCase() === email) - Number(a.enrolment?.email?.trim().toLowerCase() === email) ||
      a.id.localeCompare(b.id)
    );
    const owner = owners[0];
    // This fallback is session-only: never overwrite the cloud profile list
    // while it may still be hydrating on a fresh device or slow connection.
    return owner ? { ...owner, role: "Super User", cloudUserId: identity.userId } : {
      id: `superuser-${TENANT.id}-${identity.userId}`,
      name: TENANT.superUserName,
      role: "Super User",
      cloudUserId: identity.userId,
      createdAt: new Date().toISOString(),
    };
  }
  const matches = profiles.filter(profile => profileMatchesCloudIdentity(profile, identity));
  const linked = matches.filter(profile => profile.cloudUserId === identity.userId);
  if (linked.length === 1) return linked[0];
  return matches.length === 1 ? matches[0] : null;
}
