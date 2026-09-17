import { createRoot } from "react-dom/client";
import { UnitPage } from "../src/pages/Course";
import { buildUnitContent } from "../src/lib/unitBuilder";
import { rememberUnitPack } from "../src/lib/unitStorage";
import "../src/styles.css";

const title = "2. Outline of the Unit Price Estimation Method";
const paragraph = "The present cost estimation method uses work efficiency to total the materials costs. The Unit Price Estimation Method estimates unit prices that include the materials and labour required, helping explain the final value.";
const nextTitle = "3. Anticipated effects";
const nextParagraph = "The method makes estimates easier to review and compare.";
const shortLines = [
  "Other high urgency tasks to be carried out which will have an impact on the estimate",
  "Accidents and emergencies",
  "Allow time for unexpected events when estimating the work.",
  "Item", "Code", "Description", "Rate", "(INR)", "Unit", "Qty", "Amt", "1", "wf_res_01",
  "Services (web services, remoting, DCOM, COM+, application server etc.)",
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
  const groups = Array.from(document.querySelectorAll<HTMLElement>(".lesson-subsection"));
  assert(groups.length === 2, `${mode}: two heading/body groups (${groups.length}); ${document.querySelector('.slide-whole-editor')?.innerHTML.slice(0,700) ?? ''}`);
  const heading = groups[0].querySelector<HTMLElement>("h3")!;
  const body = heading.nextElementSibling as HTMLElement;
  assert(heading.textContent === title && body.textContent === paragraph, `${mode}: heading and body share their group`);
  assert(groups[1].textContent === nextTitle + nextParagraph, `${mode}: next heading stays with its own text`);
  assert(!groups.some(group => group.querySelector(".lesson-card,.lesson-p-ico")), `${mode}: no cards or icons split the content`);
  assert(body.getBoundingClientRect().top - heading.getBoundingClientRect().bottom <= 7, `${mode}: heading/body gap is at most 7px`);
  assert(Number(getComputedStyle(heading).fontWeight) >= 600, `${mode}: heading typography survives cascade`);
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
  click("Edit content"); await tick(); verify("Editor");
  const editor = document.querySelector<HTMLElement>(".slide-whole-editor")!;
  // Reproduce an already-saved slide whose subheadings are ordinary paragraphs.
  editor.innerHTML = `<h2 class="section-title">Cost estimation</h2>${shortLines.map(text=>`<p>${text}</p>`).join('')}<p>${title}</p><p>${paragraph}</p><p>${nextTitle}</p><p>${nextParagraph}</p>`;
  editor.dispatchEvent(new Event("input", { bubbles: true }));
  await tick(); click("Done editing"); await tick(); verify("Saved rich-text lesson");
  document.querySelector(".lesson-screen")?.scrollIntoView();
  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent = "PASS: unnumbered headings, short lines and table fragments remain plain text; numbered headings stay with their body in lessons, editing and saved rich text";
}
test().catch(error => { document.body.dataset.result = "failed"; document.getElementById("result")!.textContent = String(error); });
