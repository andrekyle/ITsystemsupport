import { createRoot } from "react-dom/client";
import { createCourse, saveCustomCourse, activeCourse } from "../src/data/courses";
import type { Profile } from "../src/types";
const tick=()=>new Promise(r=>setTimeout(r,30));
const until=async(f:()=>unknown)=>{for(let i=0;i<180;i++){if(f())return;await tick()}throw Error("Timed out: "+document.body.textContent)};
function assert(v:unknown,m:string):asserts v{if(!v)throw Error(m)}
function button(label:string){const el=[...document.querySelectorAll("button")].find(el=>el.textContent?.trim()===label);assert(el,"Missing "+label);return el}
async function test(){
 const student:Profile={id:"old-student",name:"Previous qualification student",role:"Learner",createdAt:"2026-11-18",avatar:"data:image/png;base64,old"};
 localStorage.setItem("itss.profiles",JSON.stringify([student]));
 const oldPhotos=JSON.stringify([{id:"old-photo",image:"data:image/png;base64,old",by:"Original class",byId:student.id,uploadedAt:"2026-11-18"}]);
 localStorage.setItem("itss.memories.shared",oldPhotos);
 const course=createCourse({title:"New qualification",saqaId:"12345",nqfLevel:5,credits:10,description:"New course",unitCounts:[1],moduleNames:["Module"],unitCodes:[["123"]]},[{name:"Module",description:"Module summary",outcomes:["Apply learning"],units:[{us:"123",title:"Unit",nqf:5,credits:10,description:"Unit summary",outcomes:["Apply learning"]}]}]);
 saveCustomCourse(course);localStorage.setItem("itss.activeCourse",course.id);
 const {StudentsPage}=await import("../src/pages/People");
 const {MemoriesPage}=await import("../src/pages/Memories");
 const admin:Profile={id:"admin",name:"Admin",role:"Super User",createdAt:"2026-11-18"};
 const root=createRoot(document.getElementById("fixture")!);
 root.render(<StudentsPage profile={admin} route={{page:"students"}} navigate={()=>{}}/>);
 await until(()=>document.body.textContent?.includes("People directory"));
 assert(!document.body.textContent?.includes(student.name),"Old student does not appear in new qualification");
 assert(!document.querySelector('img[src="data:image/png;base64,old"]'),"Old student image is hidden");
 button("Enrol students").click();await tick();
 const checkbox=document.querySelector<HTMLInputElement>('[role="dialog"] input[type="checkbox"]');assert(checkbox,"Admin can explicitly select an existing learner");checkbox.click();await tick();button("Enrol selected students").click();
 await until(()=>!document.querySelector('[role="dialog"]'));
 assert(activeCourse().learnerIds?.includes(student.id),"Selected learner belongs to this qualification");
 assert(document.body.textContent?.includes(student.name),"Enrolled learner now appears");
 root.render(<MemoriesPage profile={admin}/>);await tick();
 assert(!document.querySelector('img[src="data:image/png;base64,old"]'),"Old class photos do not appear");
 assert(document.body.textContent?.includes("No pictures yet"),"New qualification gallery is empty");
 assert(localStorage.getItem("itss.memories.shared")===oldPhotos,"Original gallery remains intact");
 // Exercise real storage hooks using the same learner and unit code in two courses.
 const store=await import("../src/store");
 const packs=await import("../src/lib/unitStorage");
 const {courseScopedKey}=await import("../src/lib/courseScope");
 const legacyProgress=JSON.stringify({units:{"123":{activities:{"Formative Assessment":true},quizzes:{old:{best:9,total:10,attempts:2}},logbook:{answer:"Existing learner answer"}}}});
 packs.rememberUnitPack("itss.progress."+student.id,legacyProgress);
 await packs.persistUnitPack("itss.progress."+student.id,legacyProgress);
 const preserved=new Map<string,string>();
 for(const namespace of ["poe","checklist","sectiond","notes","noteorder","notetitles","lessonquiz"]){
   const key=`itss.${namespace}.${student.id}`;
   const value=JSON.stringify({original:"Existing learner data"});localStorage.setItem(key,value);preserved.set(key,value);
 }
 const settings=JSON.stringify({teamsUrl:"https://example.com/original-class",staffCode:"original-code"});
 localStorage.setItem("itss.settings.shared",settings);preserved.set("itss.settings.shared",settings);
 let hooks:any;
 function Harness(){const progress=store.useProgress(student.id);const notes=store.useNotes(student.id);const [settings,updateSettings]=store.useSharedSettings();hooks={progress,notes,settings,updateSettings};return <span>Storage isolation fixture</span>}
 root.render(<Harness/>);await until(()=>hooks?.progress.ready);
 assert(!Object.keys(hooks.progress.state.units).length,"Enrolment does not import existing learner progress");
 assert(!Object.keys(hooks.notes.notes).length,"Enrolment does not import private notes");
 assert(hooks.settings.teamsUrl==="","New qualification has independent class settings");
 hooks.progress.saveQuizResult("123",3,5,"new-quiz");
 hooks.notes.addNote("new-note",{us:"123",title:"New qualification note",image:"data:image/png;base64,new",uploadedAt:"2026-11-18"});
 hooks.updateSettings({teamsUrl:"https://example.com/new-class"});
 await until(()=>store.loadProgress(student.id).units["123"]?.quizzes?.["new-quiz"]);
 await packs.flushUnitPack(courseScopedKey(`itss.progress.${student.id}`));
 assert(packs.unitPackSnapshot("itss.progress."+student.id)===legacyProgress,"New quiz leaves original scores, answers and attempts byte-for-byte intact");
 for(const [key,value]of preserved)assert(localStorage.getItem(key)===value,"Original record unchanged: "+key);
 const customProgress=packs.unitPackSnapshot(courseScopedKey(`itss.progress.${student.id}`));
 root.unmount();localStorage.setItem("itss.activeCourse","custom-independent");
 assert(!Object.keys(store.loadProgress(student.id).units).length,"Another qualification starts with independent progress for the same learner and US code");
 localStorage.setItem("itss.activeCourse",course.id);
 assert(packs.unitPackSnapshot(courseScopedKey(`itss.progress.${student.id}`))===customProgress,"Switching qualifications retains the new qualification's work");
 localStorage.setItem("itss.activeCourse","itss");
 assert(store.loadProgress(student.id).units["123"].quizzes?.old.best===9,"Original learner history remains readable");
 document.body.dataset.result="passed";document.getElementById("result")!.textContent="PASS: new qualification hides old students/photos, supports explicit enrolment, and preserves original progress, answers, notes, evidence, settings and photos.";
}
test().catch(e=>{document.body.dataset.result="failed";document.getElementById("result")!.textContent=String(e)});
