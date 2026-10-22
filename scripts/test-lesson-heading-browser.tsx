import { createRoot } from "react-dom/client";
import { UnitPage } from "../src/pages/Course";
import { buildUnitContent } from "../src/lib/unitBuilder";
import { rememberUnitPack } from "../src/lib/unitStorage";
import "../src/styles.css";

const title = "2.1 Outline of the Unit Price Estimation Method";
const paragraph = "The present cost estimation method uses work efficiency to total the materials costs. The Unit Price Estimation Method estimates unit prices that include the materials and labour required, helping explain the final value.";
const nextTitle = "3.1 Anticipated effects";
const nextParagraph = "The method makes estimates easier to review and compare.";
const shortLines = [
  "Accidents and emergencies",
  "Services (web services, remoting, DCOM, COM+)",
];
const tick = () => new Promise(resolve => setTimeout(resolve, 60));
const assert = (ok: unknown, message: string) => { if (!ok) throw new Error(message); };
function click(label: string) {
  const button = Array.from(document.querySelectorAll("button")).find(button => button.textContent?.trim() === label);
  assert(button, `Missing button: ${label}`); button!.click();
}
function verify(mode: string) {
  const lesson = document.querySelector('.lesson-section')!;
  assert(!lesson.querySelector('.lesson-card,.lesson-p-cards'), `${mode}: short source lines never become tiles`);
  for(const text of shortLines) {
    const line = Array.from(lesson.querySelectorAll('p')).find(element=>element.textContent===text);
    assert(line && !line.querySelector('svg'), `${mode}: plain text preserved: ${text}`);
  }
  assert(!lesson.querySelector(".section-title,.lesson-subsection,.lesson-subheading"), `${mode}: no inferred header or heading groups`);
  assert(lesson.textContent?.includes(title) && lesson.textContent.includes(paragraph), `${mode}: title and body wording preserved`);
  assert(lesson.querySelector('[data-slide-title="true"]')?.tagName === "P", `${mode}: slide title is plain body text by default`);
  const paragraphs = Array.from(lesson.querySelectorAll<HTMLElement>(".lesson-p"));
  assert(paragraphs.length > 0, `${mode}: paragraph formatting fixture is present`);
  for (const element of paragraphs) {
    const style = getComputedStyle(element);
    assert(style.borderLeftWidth === "0px" && style.paddingLeft === "0px", `${mode}: paragraphs have no automatic blue line or indentation`);
    assert(style.fontSize === getComputedStyle(paragraphs[0]).fontSize && style.lineHeight === getComputedStyle(paragraphs[0]).lineHeight, `${mode}: first paragraph uses the same typography as other paragraphs`);
  }
  const headings = Array.from(lesson.querySelectorAll("h1,h2,h3,h4"));
  assert(headings.length === (mode === "Saved rich-text lesson" ? 1 : 0), `${mode}: only author-selected headings remain`);
  if (mode === "Saved rich-text lesson") {
    assert(headings[0]?.textContent === nextTitle, "User-selected heading is not removed or reassigned");
    const image = lesson.querySelector<HTMLImageElement>("img")!;
    assert(image && getComputedStyle(image).float === "none" && getComputedStyle(image).display === "block", "Legacy wrapped image returns to single-column flow");
  }
  if(mode !== "Editor") assert(document.querySelector('.lesson-section')!.getBoundingClientRect().right <= innerWidth, `${mode}: content fits viewport`);
}
async function test() {
  const content = buildUnitContent({us:"114059",title:"Cost estimation",nqf:5,credits:5,dates:"",time:""}, `${title}\n\n${paragraph}\n\n${nextTitle}\n\n${nextParagraph}`, { questions:3, minutes:60 });
  const file = { name:"Fixture", type:"application/pdf", size:0, uploadedAt:"2026-09-16" };
  rememberUnitPack("itss.unitbuilder.114059.shared", JSON.stringify({
    revision: "heading-fixture", source: "", files: {pdf:file,pptx:file,answers:file},
    content: { ...content, lesson: [{ heading: "Cost estimation", paragraphs: [...shortLines, title, paragraph, nextTitle, nextParagraph] }] },
  }));
  createRoot(document.getElementById("fixture")!).render(<UnitPage unitId="114059" profile={{ id:"heading-test", name:"Test", role:"Super User" } as any} progress={{units:{}}} toggleActivity={()=>{}} saveQuizResult={()=>{}} setLogbookField={()=>{}} saveExerciseResult={()=>{}} navigate={()=>{}}/>);
  for (let i=0;i<100 && !document.querySelector('[role="tab"]');i++) await tick();
  click("Lesson"); await tick(); verify("Plain lesson");
  if (innerWidth < 600) {
    document.body.dataset.result = "passed";
    document.getElementById("result")!.textContent = "PASS: mobile slides have no automatic headings and retain source wording";
    return;
  }
  click("Edit slide"); await tick();
  click("Edit slide text"); await tick(); verify("Editor");
  const editor = document.querySelector<HTMLElement>(".slide-whole-editor")!;
  // Reproduce an already-saved slide whose subheadings are ordinary paragraphs.
  editor.innerHTML = `<p class="lesson-p" data-slide-title="true">Cost estimation</p>${shortLines.map(text=>`<p class="lesson-p">${text}</p>`).join('')}<img data-figure-id="layout-test" style="float:left;display:inline;width:80px;height:80px;margin-right:60%"><p>${title}</p><p>${paragraph}</p><h3>${nextTitle}</h3><p>${nextParagraph}</p>`;
  editor.dispatchEvent(new Event("input", { bubbles: true }));
  await tick(); click("Done editing slide"); await tick(); verify("Saved rich-text lesson");
  click("Edit slide"); await tick(); click("Edit slide text"); await tick();
  const reopened = document.querySelector<HTMLElement>(".slide-whole-editor")!;
  const titleParagraph = reopened.querySelector<HTMLElement>('[data-slide-title="true"]')!;
  const authoredTitle = document.createElement("h2");
  authoredTitle.dataset.slideTitle = "true";
  authoredTitle.textContent = titleParagraph.textContent;
  titleParagraph.replaceWith(authoredTitle);
  reopened.dispatchEvent(new Event("input", { bubbles: true }));
  await tick(); click("Done editing slide"); await tick();
  assert(document.querySelector('[data-slide-title="true"]')?.tagName === "H2", "Author-selected title style survives saving");
  assert(document.querySelectorAll('[data-slide-title="true"]').length === 1, "Saving never duplicates the slide title");
  document.querySelector(".lesson-screen")?.scrollIntoView();
  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent = "PASS: no automatic headers or heading inference; user-selected headings survive saving; legacy image wrapping is removed; all text remains in single-column flow";
}
test().catch(error => { document.body.dataset.result = "failed"; document.getElementById("result")!.textContent = String(error); });
