import { createRoot } from "react-dom/client";
import { SignIn } from "../src/components/SignIn";
import { TENANT } from "../src/lib/tenant";
import { testCloudProfileResolution } from "./test-cloud-profile-browser";
import type { Profile } from "../src/types";
import { setAccountEmail } from "../src/store";
import { profileMatchesCloudIdentity } from "../src/lib/cloudProfile";

const tick = () => new Promise(resolve => setTimeout(resolve, 70));
function assert(value: unknown, message: string) { if (!value) throw new Error(message); }
let own: Profile[] = [];
let remote: Profile[] = [];
let accountId = "owner-auth";
Object.assign(globalThis, { profileCloud: { from(table: string) {
  const filters: Record<string, string> = {};
  let poe = false;
  const query = {
    select() { return query; },
    eq(field: string, value: string) { filters[field] = value; return query; },
    like() { poe = true; return query; },
    async maybeSingle() {
      assert(table === "app_state" && filters.tenant_id === TENANT.id && filters.user_id === accountId && filters.key === "itss.profiles", "Own-profile reads verify the exact account, tenant and key");
      return { data: own.length ? { value: JSON.stringify(own) } : null, error: null };
    },
    then(resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) {
      assert(filters.tenant_id === TENANT.id, "Directory reads remain tenant scoped");
      return Promise.resolve({ data: poe ? [] : [{ user_id: "directory-owner", value: JSON.stringify(remote) }], error: null }).then(resolve, reject);
    },
  }; return query;
} } });
async function test() {
  localStorage.clear();
  setAccountEmail(TENANT.superUserEmail);
  testCloudProfileResolution();
  let opened: Profile | undefined;
  const root = createRoot(document.getElementById("fixture")!);
  root.render(<SignIn cloudIdentity={{ userId: "owner-auth", email: TENANT.superUserEmail }} onSignIn={profile => { opened = profile; }} />);
  for (let i = 0; i < 50 && !opened; i++) await tick();
  assert(opened?.role === "Super User", "Owner signs in without learner enrolment or a cloud directory");
  assert(localStorage.getItem("itss.profiles") === null, "Owner fallback does not overwrite a still-loading cloud profile list");
  assert(!document.body.textContent?.includes("No unique profile"), "Owner is not blocked by learner lookup");
  opened = undefined;
  setAccountEmail("learner@example.test"); accountId = "learner-auth";
  root.render(<SignIn cloudIdentity={{ userId: "learner-auth", email: "learner@example.test" }} onSignIn={profile => { opened = profile; }} />);
  await tick(); await tick();
  assert(!opened, "A learner without a matching profile cannot use owner fallback");
  const legacy = { id: "original-learner-id", name: "Existing learner", role: "Learner", createdAt: "2026-01-01" } as Profile;
  for (const saved of [legacy, { ...legacy, cloudUserId: "old-auth", enrolment: { email: "old@example.test" } } as Profile]) {
    root.render(null); await tick(); localStorage.clear(); own = [saved]; opened = undefined;
    root.render(<SignIn cloudIdentity={{ userId: accountId, email: "learner@example.test" }} onSignIn={profile => { opened = profile; }} />);
    for (let i = 0; i < 50 && !opened; i++) await tick();
    assert(opened?.id === legacy.id && opened.role === "Learner", "Existing learners retain their original profile and progress identity");
    assert(profileMatchesCloudIdentity(opened!, { userId: accountId, email: "learner@example.test" }), "The resolved profile passes App's ownership guard");
    assert(JSON.parse(localStorage.getItem("itss.profiles")!)[0].cloudUserId === accountId, "The repaired account link survives later sign-ins");
  }
  root.render(null); await tick(); localStorage.clear(); opened = undefined;
  own = [{ ...legacy, enrolment: { email: "learner@example.test" } } as Profile,
    { ...legacy, id: "other-account-profile", name: "Another profile", cloudUserId: "another-auth" }];
  root.render(<SignIn cloudIdentity={{ userId: accountId, email: "learner@example.test" }} onSignIn={profile => { opened = profile; }} />);
  for (let i = 0; i < 50 && !opened; i++) await tick();
  assert(opened?.id === legacy.id, "Email identifies the correct profile in the account's full list");
  assert(JSON.parse(localStorage.getItem("itss.profiles")!).some((profile: Profile) => profile.id === "other-account-profile"), "Opening one profile during hydration preserves the rest of the account's records");
  root.render(null); await tick(); localStorage.clear(); own = []; opened = undefined;
  localStorage.setItem("itss.profiles", JSON.stringify([legacy]));
  remote = [{ ...legacy, cloudUserId: accountId }];
  root.render(<SignIn cloudIdentity={{ userId: accountId, email: "learner@example.test" }} onSignIn={profile => { opened = profile; }} />);
  for (let i = 0; i < 50 && !opened; i++) await tick();
  assert(opened?.id === legacy.id, "A stale local copy cannot hide a valid directory profile with the same id");
  root.unmount();
  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent = `PASS (${TENANT.id}): superuser access, owned legacy learner profiles, stale account links, original profile ids, fresh directory matches, account and tenant isolation`;
}
test().catch(error => {
  document.body.dataset.result = "failed";
  document.getElementById("result")!.textContent = String(error);
});
