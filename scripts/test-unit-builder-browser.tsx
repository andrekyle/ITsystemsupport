import { createRoot } from "react-dom/client";
import { UnitPage } from "../src/pages/Course";
import { readBuiltUnit } from "../src/lib/builtUnits";
import { saveBuiltUnit } from "../src/lib/useBuiltUnit";
import { receiveUnitPack } from "../src/lib/unitStorage";
import JSZip from "jszip";

const source=`# Estimating work

Estimating starts with understanding the scope and identifying the required deliverables. Break the work into smaller tasks before estimating the time required. Use previous experience and recorded performance to improve the accuracy of estimates.

# Resources and dependencies

Consider the availability of staff, equipment and materials when preparing an estimate. Dependencies affect the sequence of tasks and can delay the start of subsequent work. Record assumptions so that stakeholders understand the basis of the estimate.

# Late delivery

Late delivery can increase costs and disrupt dependent activities. Communicate delays early so stakeholders can adjust their plans. Review the impact of a delay and agree a revised delivery date with the affected stakeholders.`;
const tick=()=>new Promise(r=>setTimeout(r,40));
const assert=(ok:unknown,message:string)=>{if(!ok)throw new Error(message);};
async function waitFor(check:()=>boolean){for(let i=0;i<400;i++){if(check())return;await tick();}throw new Error(`Timed out: ${document.querySelector('[role="alert"]')?.textContent??document.body.textContent?.slice(-400)}`);}
const click=(label:string)=>{const btn=Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(b=>b.textContent?.trim()===label);assert(btn,`Missing button: ${label}`);btn!.click();};
const render=()=> <UnitPage unitId="114059" profile={{id:"builder-test",name:"Test administrator",role:"Super User"} as any} progress={{units:{}}} toggleActivity={()=>{}} saveQuizResult={()=>{}} setLogbookField={()=>{}} saveExerciseResult={()=>{}} navigate={()=>{}}/>;
async function test(){
  const container=document.getElementById("fixture")!;
  let root=createRoot(container);root.render(render());
  await waitFor(()=>!!document.querySelector(".unit-builder"));
  if(sessionStorage.getItem("unit-builder-reload")){
    await waitFor(()=>!!readBuiltUnit("114059"));await tick();
    assert(readBuiltUnit("114059")?.content.quiz[0].q==="Manually updated question", "Manual changes survive full reload");
    assert(document.querySelectorAll('[role="tab"]').length===10,"All ten tabs survive reload");
    const saved=readBuiltUnit("114059")!;
    const transaction=IDBDatabase.prototype.transaction;
    let rejected=false;
    IDBDatabase.prototype.transaction=function(){throw new DOMException("Full", "QuotaExceededError");};
    try { await saveBuiltUnit("114059",{...saved,revision:"must-not-save"}); }
    catch(error) { rejected=String(error).includes("previous unit is unchanged"); }
    finally { IDBDatabase.prototype.transaction=transaction; }
    assert(rejected,"Unavailable device storage reports a failed save");
    assert(readBuiltUnit("114059")?.revision===saved.revision,"Failed save preserves previous content");
    receiveUnitPack("itss.unitbuilder.cloud-test.shared",JSON.stringify(saved));
    assert(readBuiltUnit("cloud-test")?.revision===saved.revision,"Cloud hydration works with full localStorage");
    sessionStorage.removeItem("unit-builder-reload");
    document.body.dataset.result="passed";document.getElementById("result")!.textContent="PASS: full localStorage build, all ten tabs, PDF and PowerPoint, manual edits, version backup, reload, failed-save preservation and cloud hydration";return;
  }
  // Reproduce the reported failure: unrelated data already fills localStorage.
  localStorage.setItem("unrelated-user-data","Keep this data");
  for(const size of [100000,1000]) {
    for(let i=0;i<10000;i++){
      try{localStorage.setItem(`quota-fixture-${size}-${i}`,"x".repeat(size));}catch{break;}
    }
  }
  click("Build unit standard");await tick();
  const textarea=document.querySelector<HTMLTextAreaElement>(".unit-builder textarea")!;
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value")!.set!.call(textarea,source);
  textarea.dispatchEvent(new Event("input",{bubbles:true}));
  (document.querySelector('.unit-builder input[type="checkbox"]') as HTMLInputElement).click();await tick();
  click("Build complete unit standard");
  await waitFor(()=>!!readBuiltUnit("114059"));
  await tick();
  const built=readBuiltUnit("114059")!;
  assert(localStorage.getItem("unrelated-user-data")==="Keep this data","Unrelated data preserved");
  assert(localStorage.getItem("itss.unitbuilder.114059.shared")===null,"Large pack is not stored in localStorage");
  const labels=Array.from(document.querySelectorAll('[role="tab"]')).map(e=>e.textContent?.trim());
  for(const label of ["Overview","Lesson","Course material","Notes","Activity","Logbook","Quiz","Self assessment","Evaluation","Lesson plan"])assert(labels.includes(label),`Missing tab ${label}`);
  assert(labels.length===10,"One Activity tab includes all exercise types");
  const pdf=await (await fetch(built.files.pdf.data!)).arrayBuffer();
  assert(new TextDecoder().decode(pdf.slice(0,5))==="%PDF-","Real PDF generated");
  const zip=await JSZip.loadAsync(await (await fetch(built.files.pptx.data!)).arrayBuffer());
  const slides=Object.keys(zip.files).filter(p=>/^ppt\/slides\/slide\d+\.xml$/.test(p));
  assert(slides.length>=built.content.lesson.length,"PowerPoint contains slides");
  const xml=await Promise.all(slides.map(p=>zip.file(p)!.async("string")));
  assert(xml.some(s=>s.includes("Estimating starts")),"PowerPoint contains editable source text");
  click("Edit all unit content");await tick();
  document.querySelectorAll<HTMLDetailsElement>(".unit-builder details").forEach(d=>d.open=true);
  const question=Array.from(document.querySelectorAll<HTMLTextAreaElement>(".unit-builder textarea")).find(t=>t.closest("label")?.firstChild?.textContent?.trim()==="Question")!;
  assert(question,"Question is manually editable");
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value")!.set!.call(question,"Manually updated question");question.dispatchEvent(new Event("input",{bubbles:true}));await tick();
  click("Save all changes and rebuild files");
  await waitFor(()=>readBuiltUnit("114059")?.content.quiz[0].q==="Manually updated question");
  assert(readBuiltUnit("114059")?.previous?.revision===built.revision,"Previous version retained");
  sessionStorage.setItem("unit-builder-reload","true");location.reload();
}
test().catch(error=>{document.body.dataset.result="failed";document.getElementById("result")!.textContent=String(error);});
