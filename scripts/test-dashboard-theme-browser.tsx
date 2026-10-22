import { createRoot } from "react-dom/client";
import { DiscoveryDashboard } from "../src/pages/Dashboard";
import "../src/styles.css";

const tick = () => new Promise(resolve => setTimeout(resolve, 40));
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
async function test() {
  createRoot(document.getElementById("fixture")!).render(<DiscoveryDashboard
    profile={{ id: "theme-test", name: "Andre", role: "Learner", createdAt: "2026-10-12" }}
    progress={{ units: {} }} navigate={() => {}} />);
  await tick();
  for (const theme of ["light", "dark", "light"]) {
    document.documentElement.dataset.theme = theme;
    await new Promise(resolve => setTimeout(resolve, 350));
    const probe = document.createElement("span");
    probe.style.color = theme === "dark" ? "var(--azure)" : "#e51b35";
    document.body.append(probe);
    const expected = getComputedStyle(probe).color;
    probe.remove();
    for (const selector of [
      ".discovery-onboarding-kicker",
      'section[aria-labelledby="discovery-start-title"] .discovery-onboarding-eyebrow',
      ".discovery-onboarding-card-icon",
      ".discovery-onboarding-card-link",
    ]) {
      const elements = document.querySelectorAll(selector);
      assert(elements.length, `${selector} renders`);
      for (const element of elements)
        assert(getComputedStyle(element).color === expected, `${theme}: ${selector} uses the theme accent`);
    }
    for (const selector of [
      ".discovery-onboarding-primary",
      ".discovery-onboarding-progress-track > span",
    ]) {
      const element = document.querySelector(selector);
      assert(element && getComputedStyle(element).backgroundColor === expected,
        `${theme}: ${selector} uses the theme accent (${element ? getComputedStyle(element).backgroundColor : "missing"} vs ${expected})`);
    }
    const inkProbe = document.createElement("span");
    inkProbe.style.color = "var(--ink)";
    document.body.append(inkProbe);
    const ink = getComputedStyle(inkProbe).color;
    inkProbe.remove();
    for (const element of document.querySelectorAll(
      '.discovery-onboarding-module-number, section[aria-labelledby="discovery-plan-title"] .discovery-onboarding-eyebrow'
    )) {
      assert(getComputedStyle(element).color === ink, "Learning plan heading and numbers use readable neutral text");
    }
  }
  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent = "PASS: dashboard headings, icons, links, action button and progress use blue in dark mode and retain red in light mode";
}
test().catch(error => {
  document.body.dataset.result = "failed";
  document.getElementById("result")!.textContent = String(error);
});
