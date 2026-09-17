import { createRoot } from "react-dom/client";
import { UnitPage } from "../src/pages/Course";
import { buildUnitContent } from "../src/lib/unitBuilder";
import { rememberUnitPack } from "../src/lib/unitStorage";
import "../src/styles.css";

const presentationTitle = "The category 'Presentation' could include the following items of work";
const presentationPoints = ["GUI (Forms and controls)", "Custom controls", "Validation", "Animation and Graphics"];
const estimateTitle = "2. Preparing an estimate";
const estimateLead = "The aim is to estimate a regular software project. A typical engineering project estimate contains several parts as follows:";
const estimatePoints = [
  "Identifying the items of work.",
  "Fixing a unit for each item of work.",
  "Calculating the quantity of work.",
  "Calculating the rate for each item of work.",
  "Fine tuning the final cost.",
];
const overheadTitle = "The overheads involve";
const overheadPoints = [
  "The establishment charges.",
  "Depreciation of tools and plants.",
  "Interest factor etc.",
  "Licenses, permits, taxes.",
];
const resourceTitle = "The rate is the cost of resources involved per unit of work. The resources are usually:";
const resourcePoints = ["Man-hours.", "Materials.", "Tools and plants.", "Overheads.", "Profit margin."];
const revision = "numbered-list-fixture-4";
const storageKey = `itss.lessonedits.114059.built-${revision}`;
const reloadKey = "lesson-lists-reloaded-4";
const tick = () => new Promise(resolve => setTimeout(resolve, 80));
function assert(ok: unknown, message: string): asserts ok { if (!ok) throw new Error(message); }
function click(label: string) {
  const button = Array.from(document.querySelectorAll("button")).find(button => button.textContent?.trim() === label);
  assert(button, `Missing button: ${label}`);
  button.click();
}
function verifyBullet(mode: string, expected: string[]) {
  const lesson = document.querySelector<HTMLElement>(".lesson-section");
  assert(lesson, `${mode}: lesson is displayed`);
  const lists = Array.from(lesson.querySelectorAll<HTMLUListElement>("ul.lesson-inferred-list"));
  assert(lists.length === 1, `${mode}: one bullet list contains the resource group (found ${lists.length})`);
  assert(lesson.querySelectorAll("ol.lesson-inferred-list").length === 0, `${mode}: resource list is not numbered`);
  const items = Array.from(lists[0].querySelectorAll<HTMLElement>(":scope > li"));
  assert(items.length === expected.length, `${mode}: all bullet items remain on this slide`);
  items.forEach((item, index) => {
    assert(item.textContent?.trim() === expected[index], `${mode}: bullet item ${index + 1} text preserved`);
    assert(getComputedStyle(item).listStyleType !== "decimal", `${mode}: bullet item ${index + 1} does not use decimal numbering`);
  });
}
function visible(element: Element) {
  const style = getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden" && element.getBoundingClientRect().width > 0;
}
function verify(mode: string, expected: string[]) {
  const lesson = document.querySelector<HTMLElement>(".lesson-section");
  assert(lesson, `${mode}: lesson is displayed`);
  const lists = Array.from(lesson.querySelectorAll<HTMLOListElement>("ol"));
  assert(lists.length === 1, `${mode}: one ordered list contains the entire group (found ${lists.length})`);
  const list = lists[0];
  const items = Array.from(list.querySelectorAll<HTMLElement>(":scope > li"));
  assert(items.length === expected.length, `${mode}: all ${expected.length} items remain on this slide (found ${items.length})`);
  assert(list.start === 1 && !list.reversed, `${mode}: numbering starts at one and increases`);
  items.forEach((item, index) => {
    const content = item.cloneNode(true) as HTMLElement;
    content.querySelectorAll(".num").forEach(number => number.remove());
    assert(content.textContent?.trim() === expected[index], `${mode}: item ${index + 1} text and order preserved`);
    const style = getComputedStyle(item);
    const markerStyle = getComputedStyle(item, "::marker");
    const nativeNumber = style.display === "list-item" && style.listStyleType === "decimal" && markerStyle.content !== "none" && markerStyle.content !== '""';
    const customNumbers = Array.from(item.querySelectorAll<HTMLElement>(".num")).filter(visible);
    assert(Number(nativeNumber) + customNumbers.length === 1, `${mode}: item ${index + 1} has exactly one visible number`);
    if (nativeNumber) assert(!item.hasAttribute("value") || item.getAttribute("value") === String(index + 1), `${mode}: item ${index + 1} has the correct number`);
    customNumbers.forEach(number => assert(number.textContent?.trim().replace(/\.$/, "") === String(index + 1), `${mode}: custom number matches item position`));
    assert(parseFloat(style.borderLeftWidth) === 0, `${mode}: item ${index + 1} has no lead-paragraph stripe`);
    for (const paragraph of item.querySelectorAll(".lesson-p,p,blockquote")) {
      assert(parseFloat(getComputedStyle(paragraph).borderLeftWidth) === 0, `${mode}: item text has no lead-paragraph stripe`);
    }
    assert(item.getBoundingClientRect().right <= innerWidth + 1, `${mode}: item ${index + 1} fits the viewport`);
  });
  const pointParagraphs = Array.from(lesson.querySelectorAll(".lesson-p")).filter(paragraph => expected.includes(paragraph.textContent?.trim() ?? "") && !paragraph.closest("ol"));
  assert(pointParagraphs.length === 0, `${mode}: list points are not left behind as separate paragraphs`);
  assert(!lesson.querySelector(".lesson-card,.lesson-p-cards"), `${mode}: list points do not become tiles`);
  assert(lesson.scrollWidth <= lesson.clientWidth + 1, `${mode}: lesson has no horizontal overflow`);
}
async function verifyEditing(mode: string, expected: string[]) {
  verify(`${mode}: reading`, expected);
  click("Edit content");
  await tick();
  verify(`${mode}: editing`, expected);
  const editor = document.querySelector<HTMLElement>(".slide-whole-editor");
  assert(editor, `${mode}: slide editor exists`);
  // Change the first item's emphasis to exercise the actual save path while
  // preserving the source text and its numbering.
  const firstItem = editor.querySelector("ol > li")!;
  const emphasis = document.createElement("strong");
  while (firstItem.firstChild) emphasis.append(firstItem.firstChild);
  firstItem.append(emphasis);
  editor.dispatchEvent(new Event("input", { bubbles: true }));
  await tick();
  click("Done editing");
  await tick();
  verify(`${mode}: saved`, expected);
}
async function test() {
  const source = `${presentationTitle}\n\n${presentationPoints.join("\n\n")}\n\n${estimateTitle}\n\n${estimateLead}\n\n${estimatePoints.join("\n\n")}\n\n${overheadTitle}\n\n${overheadPoints.join("\n\n")}\n\n${resourceTitle}\n\n${resourcePoints.join("\n\n")}`;
  const content = buildUnitContent({ us: "114059", title: "Cost estimation", nqf: 5, credits: 5, dates: "", time: "" }, source, { questions: 3, minutes: 60 });
  const file = { name: "Fixture", type: "application/pdf", size: 0, uploadedAt: "2026-09-17" };
  rememberUnitPack("itss.unitbuilder.114059.shared", JSON.stringify({
    revision, source, files: { pdf: file, pptx: file, answers: file },
    content: { ...content, lesson: [
      { heading: presentationTitle, paragraphs: presentationPoints },
      { heading: presentationTitle, paragraphs: presentationPoints },
      { heading: "Brass Tacks", paragraphs: [estimateTitle, estimateLead, ...estimatePoints] },
      { heading: overheadTitle, paragraphs: overheadPoints },
      { heading: resourceTitle, paragraphs: resourcePoints },
    ] },
  }));
  if (!sessionStorage.getItem(reloadKey)) {
    localStorage.setItem(storageKey, JSON.stringify({ sectionBody: {
      1: {
        paragraphs: presentationPoints,
        richHtml: "<div>GUI <strong>(Forms and controls)</strong></div><p>Custom controls</p><blockquote>Validation</blockquote><div>Animation and Graphics</div>",
      },
    } }));
  }
  createRoot(document.getElementById("fixture")!).render(<UnitPage unitId="114059" profile={{ id: "numbered-list-test", name: "Test", role: "Super User" } as any} progress={{ units: {} }} toggleActivity={() => {}} saveQuizResult={() => {}} setLogbookField={() => {}} saveExerciseResult={() => {}} navigate={() => {}} />);
  for (let i = 0; i < 100 && !document.querySelector('[role="tab"]'); i++) await tick();
  click("Lesson");
  await tick();
  const reloaded = Boolean(sessionStorage.getItem(reloadKey));
  if (reloaded) {
    click("Previous");
    await tick();
    click("Previous");
    await tick();
    click("Previous");
    await tick();
    click("Previous");
    await tick();
  }
  if (reloaded) verify("Reloaded Presentation", presentationPoints);
  else await verifyEditing("Plain Presentation", presentationPoints);
  click("Next");
  await tick();
  if (reloaded) verify("Reloaded saved Presentation", presentationPoints);
  else await verifyEditing("Saved mixed rich text", presentationPoints);
  click("Next");
  await tick();
  if (reloaded) verify("Reloaded list after subheading", estimatePoints);
  else await verifyEditing("List after subheading", estimatePoints);
  const subheading = document.querySelector(".lesson-subheading");
  assert(subheading?.textContent === estimateTitle, "Numbered subheading remains a heading before the list");
  assert(document.querySelector(".lesson-section")?.textContent?.includes(estimateLead), "List introduction is preserved");
  click("Next");
  await tick();
  if (reloaded) verify("Reloaded overhead list", overheadPoints);
  else await verifyEditing("Overhead involve list", overheadPoints);
  click("Next");
  await tick();
  if (reloaded) verify("Reloaded resource numbered list", resourcePoints);
  else {
    verify("Resource numbered list: reading", resourcePoints);
    click("Edit content");
    await tick();
    verify("Resource numbered list: editing", resourcePoints);
    const firstItem = document.querySelector<HTMLElement>(".slide-whole-editor ol > li")!;
    const emphasis = document.createElement("strong");
    while (firstItem.firstChild) emphasis.append(firstItem.firstChild);
    firstItem.append(emphasis);
    document.querySelector<HTMLElement>(".slide-whole-editor")!.dispatchEvent(new Event("input", { bubbles: true }));
    await tick();
    click("Done editing");
    await tick();
    verify("Resource numbered list: saved", resourcePoints);
  }
  if (!reloaded) {
    const stored = JSON.parse(localStorage.getItem(storageKey)!);
    assert([0, 1, 2, 3, 4].every(index => stored.sectionBody?.[index]?.richHtml?.includes("<ol")), "Each edited list is saved as an ordered list");
    sessionStorage.setItem(reloadKey, "1");
    location.reload();
    return;
  }
  // Leave the exact Presentation example visible for the runner's screenshot.
  click("Previous");
  await tick();
  click("Previous");
  await tick();
  click("Previous");
  await tick();
  click("Previous");
  await tick();
  click("Previous");
  await tick();
  verify("Final Presentation screenshot", presentationPoints);
  document.querySelector(".lesson-screen")?.scrollIntoView();
  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent = "PASS: numbered lesson groups, including usually/resource groups, keep every point in one ordered list through read/edit/save/reload";
}

test().catch(error => {
  document.body.dataset.result = "failed";
  document.getElementById("result")!.textContent = String(error);
});
