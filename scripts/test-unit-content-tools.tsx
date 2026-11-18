import {createRoot} from "react-dom/client";
import {createCourse,saveCustomCourse} from "../src/data/courses";
import type {Profile} from "../src/types";
const tick=()=>new Promise(r=>setTimeout(r,40));
const until=async(f:()=>unknown)=>{for(let i=0;i<250;i++){if(f())return;await tick()}throw Error("Timed out: "+document.body.textContent)};
function assert(v:unknown,m:string):asserts v{if(!v)throw Error(m)}
function button(label:string){const e=[...document.querySelectorAll("button")].find(e=>e.textContent?.trim()===label || e.classList.contains("unit-workspace-nav-item") && e.textContent?.trim().startsWith(label));assert(e,"Missing "+label);return e}
async function test(){
 const course=createCourse({title:"Content tools",saqaId:"12345",nqfLevel:5,credits:10,description:"Course",unitCounts:[1],moduleNames:["Module"],unitCodes:[["12345"]]},[{name:"Module",description:"Summary",outcomes:["Apply learning"],units:[{us:"12345",title:"Content management",nqf:5,credits:10,description:"Unit summary",outcomes:["Apply learning"]}]}]);saveCustomCourse(course);localStorage.setItem("itss.activeCourse",course.id);
 const {UnitPage}=await import("../src/pages/Course");const {readBuiltUnit}=await import("../src/lib/builtUnits");
 const profile:Profile={id:"editor",name:"Editor",role:"Super User",createdAt:"2026-11-18"};
 const props={unitId:"12345",profile,progress:{units:{}},toggleActivity:()=>{},saveQuizResult:()=>{},setLogbookField:()=>{},setLogbookFields:()=>{},saveExerciseResult:()=>{},navigate:()=>{}};
 const root=createRoot(document.getElementById("fixture")!);root.render(<UnitPage {...props}/>);
 await until(()=>document.body.textContent?.includes("Generate, upload, edit and download"));button("Generate, upload, edit and download").click();await tick();
 const manager=document.getElementById("unit-content-manager")!;assert(!manager.hidden,"Content manager opens");
 const scroller=manager.querySelector<HTMLElement>('.unit-workspace-scroll')!;
 assert(scroller.scrollHeight>scroller.clientHeight+100,"Build documents content has a bounded, scrollable viewport");
 assert(scroller.clientHeight<window.innerHeight,"Builder content fits within the viewport");
 const nav=manager.querySelector<HTMLElement>('.unit-workspace-nav')!;
 const navTop=nav.getBoundingClientRect().top;
 scroller.scrollTop=scroller.scrollHeight;await tick();
 assert(scroller.scrollTop>100,"Can scroll down to the document build actions");
 assert(Math.abs(nav.getBoundingClientRect().top-navTop)<1,"Builder navigation stays in place while content scrolls");
 scroller.scrollTop=0;await tick();
 assert(scroller.scrollTop===0,"Can scroll back up to the PDF upload controls");
 assert(getComputedStyle(scroller).overscrollBehaviorY==='auto',"Inline builder allows scrolling back to the surrounding page at its edges");
 assert(scroller.tabIndex===0,"Keyboard users can focus and scroll the content pane");
 assert(manager.querySelector('input[aria-label="Import teaching content"]'),"Mixed document source upload available");
 const source=manager.querySelector<HTMLTextAreaElement>('textarea[placeholder^="Paste the content"]')!;assert(source,"Source content is available immediately for a new unit");
 Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value")!.set!.call(source,"# Plan team activities\n\nPlan the team workload using the supplied objectives. Assign clear responsibilities, agree deadlines and review each task with the team. Record decisions and monitor progress against the agreed plan.");source.dispatchEvent(new Event("input",{bubbles:true}));await tick();
 const ai=[...manager.querySelectorAll('label')].find(el=>el.textContent?.includes("Build with OpenAI web research"))?.querySelector<HTMLInputElement>('input');assert(ai,"AI generation option available");ai.click();await tick();
 button("Build complete unit standard").click();
 await until(()=>readBuiltUnit("12345")?.content.lesson.length);
 const saved=readBuiltUnit("12345")!.content;assert(saved.studyNotes?.length && saved.learnerGuide?.sections.length && saved.evaluation?.questions.length,"Supporting reading and evaluation tabs generated from supplied content");
 await until(()=>[...manager.querySelectorAll("button")].some(el=>el.textContent?.trim().startsWith("Files and exports") && !(el as HTMLButtonElement).disabled));
 button("Files and exports").click();await tick();
 assert(button("Lesson PDF")&&button("Editable PowerPoint")&&button("Answer guide"),"Saved downloads available");
 button("Content and structure").click();await tick();
 assert(manager.querySelector('[aria-label="Content commands"]'),"Structured editor accessible after generation");
 assert(button("Download editable content"),"Editable content export available");
 assert(manager.querySelector('[aria-label="Upload saved unit content"]'),"Editable content can be uploaded for review");
 root.render(<UnitPage {...props} profile={{...profile,role:"Learner"}}/>);await tick();
 assert(!document.querySelector('[aria-label="Unit content management"]'),"Learners cannot access authoring tools");
 document.body.dataset.result="passed";document.getElementById("result")!.textContent="PASS: builder scrolling in both directions, stable navigation, source import, generation, editing, downloads and learner restrictions.";
}
test().catch(e=>{document.body.dataset.result="failed";document.getElementById("result")!.textContent=String(e)});
