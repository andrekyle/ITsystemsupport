import { createRoot } from "react-dom/client";
import { SignIn } from "../src/components/SignIn";
import { TENANT } from "../src/lib/tenant";
import { testCloudProfileResolution } from "./test-cloud-profile-browser";
import type { Profile } from "../src/types";

const tick = () => new Promise(resolve => setTimeout(resolve, 70));
function assert(value: unknown, message: string) { if (!value) throw new Error(message); }
async function test() {
  localStorage.clear();
  testCloudProfileResolution();
  let opened: Profile | undefined;
  const root = createRoot(document.getElementById("fixture")!);
  root.render(<SignIn cloudIdentity={{ userId: "owner-auth", email: TENANT.superUserEmail }} onSignIn={profile => { opened = profile; }} />);
  for (let i = 0; i < 50 && !opened; i++) await tick();
  assert(opened?.role === "Super User", "Owner signs in without learner enrolment or a cloud directory");
  assert(localStorage.getItem("itss.profiles") === null, "Owner fallback does not overwrite a still-loading cloud profile list");
  assert(!document.body.textContent?.includes("No unique profile"), "Owner is not blocked by learner lookup");
  opened = undefined;
  root.render(<SignIn cloudIdentity={{ userId: "learner-auth", email: "learner@example.test" }} onSignIn={profile => { opened = profile; }} />);
  await tick(); await tick();
  assert(!opened, "A learner without a matching profile cannot use owner fallback");
  root.unmount();
  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent = `PASS (${TENANT.id}): superuser sign-in without learner profile, stable owner id, stale and duplicate owner links, learner and tenant isolation, no profile-list overwrite`;
}
test().catch(error => {
  document.body.dataset.result = "failed";
  document.getElementById("result")!.textContent = String(error);
});
