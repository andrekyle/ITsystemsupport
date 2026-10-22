import type { Profile } from "../src/types";
import { TENANT } from "../src/lib/tenant";
import { profileMatchesCloudIdentity, resolveCloudProfile } from "../src/lib/cloudProfile";

export function testCloudProfileResolution() {
  const learner = { id: "learner-profile", name: "Learner", role: "Learner", cloudUserId: "learner-auth" } as Profile;
  const admin = { id: "admin-profile", name: TENANT.superUserName, role: "Super User", cloudUserId: "admin-auth" } as Profile;
  const identity = { userId: "learner-auth", email: "learner@example.test" };
  function assert(value: unknown, message: string) {
    if (!value) throw new Error(message);
  }
  assert(resolveCloudProfile([admin], identity) === null, "A lone cached admin must not match a learner.");
  assert(resolveCloudProfile([admin, learner], identity)?.id === learner.id, "Select the linked learner, not the last admin.");
  assert(!profileMatchesCloudIdentity({ ...admin, cloudUserId: identity.userId }, identity), "A mislinked designated admin must not open for a learner.");
  const legacy = { ...learner, cloudUserId: undefined, enrolment: { email: " LEARNER@example.test " } } as Profile;
  assert(resolveCloudProfile([admin, legacy], identity)?.id === learner.id, "Unlinked legacy profiles can match the verified email.");
  assert(resolveCloudProfile([{ ...legacy, cloudUserId: "someone-else" }], identity) === null, "Email must not override another account's link.");
  assert(resolveCloudProfile([{ ...legacy, enrolment: undefined }], { ...identity, email: null }) === null, "Missing emails must not match.");
  assert(resolveCloudProfile([legacy, { ...legacy, id: "duplicate" }], identity) === null, "Ambiguous email matches must not be selected.");
  assert(resolveCloudProfile([admin], { userId: "admin-auth", email: TENANT.superUserEmail })?.id === admin.id, "The designated admin retains access.");
  const ownerIdentity = { userId: "admin-auth", email: ` ${TENANT.superUserEmail.toUpperCase()} ` };
  const freshOwner = resolveCloudProfile([], ownerIdentity);
  assert(freshOwner?.role === "Super User" && freshOwner.cloudUserId === ownerIdentity.userId, "The verified owner can sign in without a learner profile.");
  assert(freshOwner?.id === resolveCloudProfile([], ownerIdentity)?.id, "The session-only owner id is stable across devices.");
  assert(profileMatchesCloudIdentity(freshOwner!, ownerIdentity), "The owner fallback passes the account ownership check.");
  const staleOwner = { ...admin, cloudUserId: "old-admin-auth" };
  const repairedOwner = resolveCloudProfile([learner, staleOwner], ownerIdentity);
  assert(repairedOwner?.id === admin.id && repairedOwner.cloudUserId === ownerIdentity.userId, "A stale owner link does not force learner enrolment or change the owner profile id.");
  assert(resolveCloudProfile([admin, { ...admin, id: "duplicate-admin" }], ownerIdentity)?.id === admin.id, "Duplicate owner copies do not lock out the verified owner.");
  assert(resolveCloudProfile([learner], ownerIdentity)?.id !== learner.id, "The owner fallback never opens an unrelated learner profile.");
  assert(resolveCloudProfile([], identity) === null, "Learners still require their matching profile.");
  assert(resolveCloudProfile([], { userId: "other-site-owner", email: TENANT.id === "investec" ? "ad4snell@gmail.com" : "andresnell29@gmail.com" }) === null, "The other site's owner cannot bootstrap a superuser here.");
  const seededLearner = { ...legacy, id: "facilitator-seeded-learner" };
  const directory = [seededLearner];
  const local = [admin];
  const candidates = [...directory.filter(p => !local.some(q => q.id === p.id)), ...local];
  assert(resolveCloudProfile(candidates, identity)?.id === seededLearner.id, "A facilitator-seeded learner must be found outside the account's local snapshot.");
  assert(candidates.filter(p => profileMatchesCloudIdentity(p, identity)).length === 1, "The cloud-account picker must hide the unrelated facilitator.");
  return "Passed cloud profile isolation: stale admin cache, lone profile, mislinked admin, email matching, conflicting links, missing emails, ambiguous profiles and admin access.";
}
