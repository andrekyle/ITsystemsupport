import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { UnitPage } from "../src/pages/Course";
import { getContent } from "../src/data/content";
import { LEARNER_WORKBOOK_114074 } from "../src/data/learnerWorkbook114074";
import { withDefaultLearnerWorkbook } from "../src/data/learnerWorkbooks";
import { loadProgress, useProgress } from "../src/store";
import { rememberUnitPack } from "../src/lib/unitStorage";
import { parseFormDefinition } from "../src/lib/formSchema";
import { installSync } from "../src/lib/sync";
import { unitExportPages } from "../src/lib/unitExports";
import type { Profile } from "../src/types";
import "../src/styles.css";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
const tick = () => new Promise(resolve => setTimeout(resolve, 60));
const learner: Profile = { id: "workbook-114074-learner-a", name: "Learner A", role: "Learner", createdAt: "2026-10-16" };
const other: Profile = { ...learner, id: "workbook-114074-learner-b", name: "Learner B" };
const answerKey = "learner-workbook.practical.replica.answers";
function Harness({ profile }: { profile: Profile }) {
  const { state, ...actions } = useProgress(profile.id);
  return <UnitPage unitId="114074" profile={profile} progress={state} {...actions} navigate={() => {}} />;
}
function click(label: string) {
  const button = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(button =>
    button.getAttribute("aria-label") === label || button.textContent?.trim() === label);
  assert(button, `Button exists: ${label}`);
  flushSync(() => button.click());
}
function input(label: string) {
  const element = Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(".replica-field input,.replica-field textarea")).find(element => element.getAttribute("aria-label") === label);
  assert(element, `Editable field exists: ${label}`);
  return element;
}
function type(label: string, value: string) {
  const element = input(label);
  assert(!element.readOnly, `${label} is writable for the learner`);
  const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, "value")!.set!;
  flushSync(() => {
    setter.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
async function test() {
  installSync();
  const model = LEARNER_WORKBOOK_114074;
  const definition = model.replica!;
  const fields = definition.sections.flatMap(section => section.fields);
  assert(model.sourcePageCount === 18 && definition.pages.length === 18, "All 18 source pages are retained");
  assert(definition.display === "digital", "Workbook displays real HTML, not full-page pictures");
  assert(definition.pages.reduce((sum, page) => sum + page.layer!.text.length, 0) === 607, "All 607 extracted source text runs are retained");
  assert(fields.length === 97, "Every reviewed write-in area is included");
  const parsed = parseFormDefinition(definition);
  assert(parsed.pages.length === 18 && parsed.sections.flatMap(section => section.fields).length === 97, "Workbook survives persisted-content validation");
  assert(parsed.pages.reduce((sum, page) => sum + page.layer!.text.length, 0) === 607, "Persisted-content validation does not remove source text");
  assert(!withDefaultLearnerWorkbook("114046", undefined), "Other units are unchanged");
  const content = getContent("114074")!;
  assert(content.learnerWorkbook === model, "Workbook is available in the unit content");
  assert(withDefaultLearnerWorkbook("114074", { ...content, learnerWorkbook: model })!.learnerWorkbook === model, "An uploaded replacement workbook is not overwritten");
  assert(unitExportPages({ us:"114074", title:"Networks", nqf:5, credits:5, dates:"", time:"" }, content).filter(page => page.originalPage).length === 18, "Learner-pack exports retain all original source pages");
  rememberUnitPack("itss.unitbuilder.114074.shared", JSON.stringify({
    revision:"114074-workbook-test", source:"Existing built lesson without a workbook.", files:{},
    content:{lesson:[],exercises:[],assignments:[],quiz:[]},
  }));
  const fixture = document.getElementById("fixture")!;
  let root = createRoot(fixture);
  const mount = async (profile: Profile) => {
    flushSync(() => root.render(<Harness profile={profile} />));
    for (let attempt = 0; attempt < 100 && !document.querySelector('[role="tab"]'); attempt++) await tick();
    click("Learner Workbook");
    await tick();
    assert(document.querySelectorAll(".replica-page").length === 18, "The unit tab renders all 18 HTML pages, including with an older saved build");
    assert(document.querySelectorAll(".rp-text").length === 607, "Every source text run is present in the DOM");
    assert(!document.querySelector(".replica-page > img"), "No full-page image is substituted for HTML");
    for (const field of fields) {
      if (field.type === "radio") {
        for (const option of field.options) assert(Array.from(document.querySelectorAll('[role="radio"]')).some(element => element.getAttribute("aria-label") === `${field.label}: ${option}`), `Choice is editable: ${field.label}: ${option}`);
      } else input(field.label);
    }
  };
  await mount(learner);
  type("Name", "Learner A");
  type("Surname", "Test surname");
  type("Email Address", "learner-a@example.test");
  type("Date Started", "2026-10-16");
  type("Learner declaration name", "Learner A declaration");
  type("Learner self-assessment Signature", "Learner A");
  type("Learner feedback and comments", "All questions completed.");
  type("Self-assessment learning outcome 7", "Outcome entered by learner");
  for (const field of fields.filter(field => field.id.startsWith("activity-"))) type(field.label, `Saved response for ${field.id}\nSecond line of answer.`);
  click("Assessment preparation row 1: Yes");
  click("Self-assessment rating 7: 3");
  const saved = JSON.parse(String(loadProgress(learner.id).units["114074"].logbook![answerKey]));
  assert(saved["cover-1"] === "Learner A" && saved["activity-3-page-15"]?.includes("Second line"), "Answers autosave before blur or pressing Save");
  assert(saved["self-rating-7"] === "3" && saved["preparation-1"] === "Yes", "Checklist choices autosave");
  assert(input("Facilitator final Signature").readOnly, "Learner cannot sign on behalf of a facilitator");
  click("Save 114074 Learner Workbook");
  for (let attempt = 0; attempt < 100 && !document.querySelector(".document-actions .is-saved"); attempt++) await tick();
  assert(document.querySelector(".document-actions .is-saved"), "Explicit Save verifies persisted learner progress");

  let downloaded: Blob | undefined;
  const originalUrl = URL.createObjectURL;
  const originalClick = HTMLAnchorElement.prototype.click;
  URL.createObjectURL = blob => { if (blob instanceof Blob) downloaded = blob; return originalUrl(blob); };
  HTMLAnchorElement.prototype.click = () => {};
  try { click("Download 114074 Learner Workbook as HTML"); } finally { URL.createObjectURL = originalUrl; HTMLAnchorElement.prototype.click = originalClick; }
  assert(downloaded, "Editable HTML can be downloaded");
  const exported = new DOMParser().parseFromString(await downloaded.text(), "text/html");
  assert(exported.querySelectorAll(".replica-page").length === 18 && exported.querySelectorAll(".rp-text").length === 607, "HTML export retains every source page and text run");
  assert(exported.querySelector<HTMLInputElement>('input[aria-label="Name"]')?.value === "Learner A", "HTML export includes saved field values");
  assert(exported.querySelectorAll("textarea").length === fields.filter(field => field.type === "textarea").length, "Answer areas remain editable in downloaded HTML");
  assert(!exported.querySelector(".no-print"), "Editing controls are excluded from export");
  const originalPrint = window.print;
  let printed = false;
  window.print = () => {
    const target = document.querySelector(".document-print-target")!;
    assert(target.querySelectorAll(".replica-page").length === 18 && target.querySelectorAll(".rp-text").length === 607, "Printing retains all source pages and wording");
    assert(!target.querySelector(".replica-field input,.replica-field textarea"), "Printing replaces input controls with their saved values");
    assert(target.textContent?.includes(saved["activity-3-page-15"]), "The last answer page prints its saved response");
    printed = true;
    window.dispatchEvent(new Event("afterprint"));
  };
  try { click("Download 114074 Learner Workbook as PDF"); } finally { window.print = originalPrint; }
  assert(printed && input("Name").value === "Learner A", "Print / Save as PDF restores editable controls afterwards");

  flushSync(() => root.unmount());
  root = createRoot(fixture);
  await mount(other);
  assert(input("Name").value === "" && input("Activity 1 answer - page 8").value === "", "A different learner starts with their own blank workbook");
  type("Name", "Learner B");
  flushSync(() => root.unmount());
  root = createRoot(fixture);
  await mount(learner);
  assert(input("Name").value === "Learner A" && input("Learner feedback and comments").value === "All questions completed.", "Learner A answers survive remounting without leaking learner B data");
  for (const field of fields.filter(field => field.id.startsWith("activity-"))) assert(input(field.label).value === saved[field.id], `Answer reloads: ${field.id}`);
  assert(loadProgress(other.id).units["114074"].logbook![answerKey] !== loadProgress(learner.id).units["114074"].logbook![answerKey], "Responses are isolated by learner profile");
  document.querySelector(".uploaded-pdf")?.scrollIntoView();
  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent = "PASS: 114074 workbook tab; 18 HTML pages, 607 source text runs, 97 editable fields; immediate autosave, Save verification, reload, learner isolation, editable HTML export and print workflow.";
}
test().catch(error => {
  document.body.dataset.result = "failed";
  document.getElementById("result")!.textContent = String(error);
});
