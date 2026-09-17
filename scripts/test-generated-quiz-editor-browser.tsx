import { createRoot } from "react-dom/client";
import { UnitPage } from "../src/pages/Course";
import { buildUnitContent } from "../src/lib/unitBuilder";
import { rememberUnitPack } from "../src/lib/unitStorage";
import type { QuizQuestion } from "../src/types";
import "../src/styles.css";

const quiz: QuizQuestion = {
  q:"What is a common mistake people make when estimating project time?",
  options:["Overestimating the time needed","Ignoring unexpected events and task complexity","Including time for project management","Listing all tasks in detail"],
  answer:1,
  explain:"People often underestimate time by forgetting to account for unexpected events, unscheduled high priority work, and the full complexity of the job.",
};
const storageKey="itss.lessonedits.114059.built-quiz-fixture";
const tick=()=>new Promise(resolve=>setTimeout(resolve,70));
const assert=(ok:unknown,message:string)=>{if(!ok)throw new Error(message);};
const click=(label:string)=>{const button=Array.from(document.querySelectorAll('button')).find(button=>button.textContent?.trim()===label);assert(button,`Missing ${label}`);button!.click();};
const stored=():QuizQuestion[]=>JSON.parse(localStorage.getItem(storageKey)!).generatedQuizzes[0];
async function browserInput(type:"enter"|"text",text="") {
  const testWindow=window as Window & {__testInput?:{type:string;text:string}|null};
  testWindow.__testInput={type,text};
  for(let i=0;i<100&&testWindow.__testInput;i++)await tick();
  assert(!testWindow.__testInput,"Browser input completed");
}
async function addLine(element:HTMLTextAreaElement,text:string) {
  const before=element.value;
  element.focus();element.setSelectionRange(before.length,before.length);
  await browserInput("enter");await browserInput("text",text);
  assert(document.activeElement===element&&element.value===`${before}\n${text}`,"Enter keeps the caret in the field and continues on a new line");
}
function setText(element:HTMLTextAreaElement,text:string) {
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value")!.set!.call(element,text);
  element.dispatchEvent(new Event("input",{bubbles:true}));
}
async function test() {
  const source="Estimating starts with understanding the scope and identifying the required deliverables. Break the work into smaller tasks before estimating the time required. Use previous experience and recorded performance to improve the accuracy of estimates.";
  const content=buildUnitContent({us:"114059",title:"Estimating project time",nqf:5,credits:5,dates:"",time:""},source,{questions:3,minutes:60});
  const file={name:"Fixture",type:"application/pdf",size:0,uploadedAt:"2026-09-16"};
  rememberUnitPack("itss.unitbuilder.114059.shared",JSON.stringify({revision:"quiz-fixture",source,files:{pdf:file,pptx:file,answers:file},content}));
  if(!localStorage.getItem(storageKey)) localStorage.setItem(storageKey,JSON.stringify({generatedQuizzes:{0:[{...quiz,q:"Temporary question"},quiz]}}));
  createRoot(document.getElementById("fixture")!).render(<UnitPage unitId="114059" profile={{id:"quiz-test",name:"Test",role:"Super User"} as any} progress={{units:{}}} toggleActivity={()=>{}} saveQuizResult={()=>{}} setLogbookField={()=>{}} saveExerciseResult={()=>{}} navigate={()=>{}}/>);
  for(let i=0;i<100&&!document.querySelector('[role="tab"]');i++)await tick();
  click("Lesson");await tick();click("Edit content");await tick();
  let editors=document.querySelectorAll<HTMLElement>('.generated-quiz-edit');
  assert(editors.length>0,"Generated question editor exists");
  if(!sessionStorage.getItem('quiz-editor-reload')) {
    const lessonEditor=document.querySelector<HTMLElement>('.slide-whole-editor')!;
    lessonEditor.focus();
    const caret=document.createRange();caret.selectNodeContents(lessonEditor.lastElementChild!);caret.collapse(false);
    window.getSelection()!.removeAllRanges();window.getSelection()!.addRange(caret);
    await browserInput("enter");await browserInput("text","Continue teaching on the next line.");
    assert(lessonEditor.innerText.includes("\nContinue teaching on the next line."),"Enter continues lesson text on a new line");
    assert(editors.length===2,"Two initial questions");
    setText(editors[0].querySelector('textarea')!,"Updated question");await tick();
    setText(editors[0].querySelectorAll('textarea')[1],"Updated first option");await tick();
    editors[0].querySelectorAll<HTMLInputElement>('input[type="radio"]')[2].click();await tick();
    assert(stored()[0].q==="Updated question"&&stored()[0].options[0]==="Updated first option"&&stored()[0].answer===2,"Text edits and answer selection all persist");
    editors[0].querySelector<HTMLButtonElement>('[aria-label="Remove question 1"]')!.click();await tick();
    editors=document.querySelectorAll<HTMLElement>('.generated-quiz-edit');
    assert(editors.length===1&&editors[0].querySelector('textarea')!.value===quiz.q,"Deleting first question shows correct remaining values");
    editors[0].querySelector('summary')!.click();await tick();
    await addLine(editors[0].querySelector('textarea')!,"Explain your choice.");
    await addLine(editors[0].querySelectorAll('textarea')[1],"Include a contingency.");
    const explanation=editors[0].querySelector<HTMLTextAreaElement>('.generated-quiz-explanation textarea')!;
    setText(explanation,quiz.explain+" Review your assumptions.");await tick();
    assert(stored()[0].explain?.endsWith("Review your assumptions."),"Explanation edits persist");
    await addLine(explanation,"Consider unexpected work.");
    editors[0].querySelector('summary')!.click();await tick();
    sessionStorage.setItem('quiz-editor-reload','1');location.reload();return;
  }
  const editor=editors[0];
  assert(editors.length===1&&editor.querySelector('textarea')!.value===quiz.q+"\nExplain your choice.","Multiline question and deletion survive full reload");
  assert(editor.querySelectorAll<HTMLInputElement>('input[type="radio"]')[1].checked,"Correct answer survives reload");
  assert(editor.querySelector<HTMLTextAreaElement>('.generated-quiz-explanation textarea')!.value.endsWith("\nConsider unexpected work."),"Multiline explanation survives reload");
  assert(!document.querySelector('.lesson-quiz-options,.lesson-quiz-actions'),"No duplicate learner quiz while editing");
  assert(!editor.querySelector('select'),"Correct answer selected beside options");
  assert(editor.getBoundingClientRect().height<(innerWidth>600?320:460),"Multiline editor grows with its content");
  assert(editor.getBoundingClientRect().right<=innerWidth,"Editor fits viewport");
  click("Done editing");await tick();
  assert(document.querySelector<HTMLElement>('.slide-whole-editor')!.innerText.includes("\nContinue teaching on the next line."),"Lesson line break survives reload and leaving edit mode");
  assert(document.querySelector<HTMLElement>('.quiz-q .qt')!.innerText.includes("\nExplain your choice."),"Question line break stays visible after editing");
  assert(Array.from(document.querySelectorAll<HTMLElement>('.lesson-quiz-options .opt')).some(option=>option.innerText.includes("\nInclude a contingency.")),"Option line break stays visible after editing");
  document.querySelector('.lesson-slide-quiz')!.scrollIntoView({block:"center"});
  document.body.dataset.result="passed";
  document.getElementById("result")!.textContent="PASS: real Enter key and continued typing in lesson, question, options and explanation; new lines persist after editing and reload";
}
test().catch(error=>{document.body.dataset.result="failed";document.getElementById("result")!.textContent=String(error);});
