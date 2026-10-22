import React from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { getDocument } from "pdfjs-dist";
import { unitPdfFromImport } from "../src/lib/unitPdfImport";
import { PDF_WASM_URL, extractFormDocument } from "../src/lib/formImport";
import { withHtmlAi } from "./test-unit-html-browser";
import { PracticalTask } from "../src/components/PracticalTask";
import { validateUnitContent, mergeUnitContentEnhancement } from "../src/lib/unitBuilder";
import { unitExportPages, makeUnitExports } from "../src/lib/unitExports";
import type { PracticalTaskDocument, Profile, UnitContent } from "../src/types";
import { UnitBuilder } from "../src/components/UnitBuilder";
import { builtUnitKey } from "../src/lib/builtUnits";
import { rememberUnitPack, forgetUnitPack } from "../src/lib/unitStorage";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

async function unchangedPages(file: File, model: PracticalTaskDocument) {
  const loading=getDocument({data:new Uint8Array(await file.arrayBuffer()),wasmUrl:PDF_WASM_URL,stopAtErrors:true});
  try {
    const pdf=await loading.promise;
    assert(pdf.numPages===model.replica!.pages.length,"Every original PDF page must be retained.");
    for(let index=0;index<pdf.numPages;index++){
    const original=await pdf.getPage(index+1);
    const page=model.replica!.pages[index];
    const base=original.getViewport({scale:1});
    const viewport=original.getViewport({scale:1654/Math.max(base.width,base.height)});
    const canvas=document.createElement("canvas");
    canvas.width=Math.ceil(viewport.width); canvas.height=Math.ceil(viewport.height);
    const context=canvas.getContext("2d",{alpha:true,willReadFrequently:true})!;
    await original.render({canvas,canvasContext:context,viewport,intent:"print",background:"#ffffff"}).promise;
    assert(page.src===canvas.toDataURL("image/png"),`Page ${index+1} must be the original rendered PDF, pixel for pixel, without a replacement layout.`);
    assert(!page.layer,"Do not substitute HTML fonts or rebuild page graphics.");
    }
  } finally { await loading.destroy(); }
}

async function legacyUnitPdf(file: File, title: string) {
  return unitPdfFromImport(await extractFormDocument(file,undefined,{preservePdf:true}),title);
}

async function syntheticPdf(count=31): Promise<File> {
  const {default:PDFDocument}=await import("pdfkit/js/pdfkit.standalone.js");
  const pdf=new PDFDocument({autoFirstPage:false,compress:false});
  const chunks:ArrayBuffer[]=[];
  const ready=new Promise<File>((resolve,reject)=>{
    pdf.on("data",(chunk:Uint8Array)=>chunks.push(new Uint8Array(chunk).buffer));
    pdf.on("end",()=>resolve(new File(chunks,"native-fields.pdf",{type:"application/pdf"})));
    pdf.on("error",reject);
  });
  pdf.initForm();
  for(let index=0;index<count;index++){
    pdf.addPage({size:"A4"});
    pdf.font("Helvetica").fontSize(12).text(`Original page ${index+1}`,40,40);
    pdf.formText(`name_${index+1}`,120,100,220,24,{});
  }
  pdf.end();
  return ready;
}

export async function testPdfFirstBuilderUi() {
  return withHtmlAi(async()=>{
    const unit={us:`pdf-ui-${crypto.randomUUID()}`,title:"PDF-first Build test",nqf:5,credits:4,dates:"",time:""};
    const key=builtUnitKey(unit.us);
    const oldSource="Keep this existing lesson source. ".repeat(10);
    rememberUnitPack(key,JSON.stringify({
      revision:"pdf-ui-test",createdAt:new Date().toISOString(),source:oldSource,
      content:{lesson:[],exercises:[],assignments:[],quiz:[]},files:{},aiUsed:true,
    }));
    const fixture=document.createElement("div");
    document.body.append(fixture);
    const root=createRoot(fixture);
    const file=await syntheticPdf(1);
    try {
      flushSync(()=>root.render(<UnitBuilder unit={unit} edits={{}} onSaved={()=>{}} onCancelInline={()=>{}} profileId="pdf-ui-test"/>));
      const mode=fixture.querySelector<HTMLInputElement>('input[role="switch"]')!;
      assert(mode&&!mode.checked,"PDF-only mode must be the default, even when an older build has lesson source.");
      assert(!fixture.querySelector('textarea'),"Optional generation inputs must not clutter the default PDF flow.");
      assert(fixture.querySelector(".unit-build-step h3")?.textContent==="Convert PDFs to editable HTML","HTML conversion must be the first Build step.");
      for(const label of ["Upload learner guide PDF","Upload practical task PDF","Upload learner workbook PDF"]){
        const input=fixture.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!;
        const transfer=new DataTransfer();
        transfer.items.add(file);
        input.files=transfer.files;
        flushSync(()=>input.dispatchEvent(new Event("change",{bubbles:true})));
        const until=Date.now()+30000;
        while(fixture.querySelector(".unit-workspace-spinner")&&Date.now()<until)await new Promise(resolve=>setTimeout(resolve,25));
        assert(!fixture.querySelector(".auth-error"),`${label} must convert to HTML using the signed-in AI flow.`);
      }
      const publish=fixture.querySelector<HTMLButtonElement>(".unit-build-action")!;
      assert(!publish.disabled&&publish.textContent==="Save editable HTML documents","All three HTML uploads must be publishable independently of lesson generation.");
      assert(fixture.textContent?.includes("Learner Guide: 1 pages (HTML")&&fixture.textContent?.includes("Practical Task: 1 pages (HTML")&&fixture.textContent?.includes("Learner Workbook: 1 pages (HTML"),"Each source PDF must use the HTML importer.");
      flushSync(()=>mode.click());
      assert(fixture.querySelector<HTMLTextAreaElement>('textarea')?.value===oldSource,"Opting into lesson generation must retain the existing separate source text.");
      flushSync(()=>mode.click());
      assert(!mode.checked&&!fixture.querySelector("textarea"),"Turning optional generation off must return to PDF-only publishing.");
    } finally {
      flushSync(()=>root.unmount());fixture.remove();forgetUnitPack(key);
    }
    return "Passed HTML Build UI: three code+AI document uploads, optional lessons off by default and independent HTML publishing.";
  });
}

export async function testUnitPdfReplicas() {
  const files=[
    ["SAQA-114046 -   Learner Workbook.pdf","Learner Workbook"],
    ["SAQA-114046   - Practical task.pdf","Practical Task"],
    ["SAQA -114046   - Learner Guide.pdf","Learner Guide"],
  ];
  const models:PracticalTaskDocument[]=[];
  for(const [name,title] of files){
    const response=await fetch(`/${encodeURIComponent(name)}`);
    assert(response.ok,`Reference PDF must be available: ${name}`);
    const file=new File([await response.blob()],name,{type:"application/pdf"});
    const model=await legacyUnitPdf(file,title);
    assert(model.replica?.display==="image","Uploaded documents must use unchanged original page images.");
    await unchangedPages(file,model);
    models.push(model);
  }
  assert(models[0].sourcePageCount===17,"The actual workbook must keep all 17 pages.");
  const native=await legacyUnitPdf(await syntheticPdf(),"Native field test");
  assert(native.replica!.pages.length===31,"Unit PDFs must not be truncated at the form builder's 30-page limit.");
  assert(native.replica!.sections[30].fields.some(field=>field.placement?.page===31),"Native fields after page 30 must stay on their actual page.");
  const unit={us:"114046",title:"Original PDF test",nqf:5,credits:4,dates:"",time:""};
  const content:UnitContent={lesson:[],exercises:[],assignments:[],quiz:[],learnerWorkbook:models[0],practicalTask:models[1],learnerGuide:models[2]};
  validateUnitContent(content);
  const merged=mergeUnitContentEnhancement(content,{},unit);
  assert(JSON.stringify(merged.learnerWorkbook)===JSON.stringify(models[0]),"Lesson enhancement must not rewrite PDF models.");
  assert(unitExportPages(unit,content).filter(page=>page.originalPage).length===models.reduce((sum,model)=>sum+model.sourcePageCount!,0),"Course-pack exports must keep every original page, not flatten it into text.");
  const invalid=structuredClone(content);
  invalid.learnerWorkbook!.replica!.pages.pop();
  let rejected=false;
  try{validateUnitContent(invalid);}catch{rejected=true;}
  assert(rejected,"A missing original PDF page must block publication.");

  const fixture=document.createElement("div");
  document.body.append(fixture);
  const root=createRoot(fixture);
  const profile={id:"pdf-test",name:"Test learner",role:"Learner"} as Profile;
  const saved:Record<string,string|boolean>={unrelated:"Keep existing progress"};
  const mount=(model:PracticalTaskDocument,prefix:string)=>flushSync(()=>root.render(<PracticalTask key={prefix} document={model} unitId="114046" profile={profile} storagePrefix={prefix} values={saved} onChange={(key,value)=>{saved[key]=value;}}/>));
  try{
    const prefixes=["learner-workbook.","","learner-guide.","editable-document.extra."];
    for(const prefix of prefixes){
      mount(models[0],prefix);
      assert(fixture.querySelectorAll(".replica-page").length===17,"Every source page must render once.");
      assert(!fixture.querySelector(".lw-cover,.source-document,.pt-cover,.rp-layer"),"Uploaded PDFs must bypass every redesigned and hard-coded layout.");
      const field=fixture.querySelector<HTMLInputElement>(".replica-field input:not([readonly])");
      assert(field,"The source's blank learner fields must be editable.");
      const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value")!.set!;
      flushSync(()=>{setter.call(field,`Saved ${prefix}`);field.dispatchEvent(new Event("input",{bubbles:true}));});
      assert(Object.entries(saved).some(([key,value])=>key.startsWith(prefix+"practical.replica.")&&String(value).includes(`Saved ${prefix}`)),"Answers must save in the document's isolated progress namespace.");
      flushSync(()=>root.render(null)); mount(models[0],prefix);
      assert(fixture.querySelector<HTMLInputElement>(".replica-field input:not([readonly])")?.value===`Saved ${prefix}`,"Saved answers must reload after remount.");
    }
    assert(saved.unrelated==="Keep existing progress","Do not overwrite old or unrelated answers.");
    mount(models[0],"cloud-pdf.");
    const cloudField=models[0].replica!.sections[0].fields.find(field=>field.type==="text")!;
    saved["cloud-pdf.practical.replica.answers"]=JSON.stringify({[cloudField.id]:"Cloud restored"});
    mount(models[0],"cloud-pdf.");
    const cloudDeadline=Date.now()+2000;
    while(fixture.querySelector<HTMLInputElement>(".replica-field input:not([readonly])")?.value!=="Cloud restored"&&Date.now()<cloudDeadline)await new Promise(resolve=>setTimeout(resolve,20));
    assert(fixture.querySelector<HTMLInputElement>(".replica-field input:not([readonly])")?.value==="Cloud restored","Answers arriving from cloud progress after mount must populate the fields.");
    mount(models[0],"editable-document.extra.");
    let download:Blob|undefined;
    const createUrl=URL.createObjectURL;
    const click=HTMLAnchorElement.prototype.click;
    try{
      URL.createObjectURL=blob=>{if(blob instanceof Blob)download=blob;return createUrl(blob);};
      HTMLAnchorElement.prototype.click=()=>{};
      fixture.querySelector<HTMLButtonElement>(".document-action-html")!.click();
    }finally{URL.createObjectURL=createUrl;HTMLAnchorElement.prototype.click=click;}
    assert(download,"Editable HTML must be downloadable.");
    const exported=new DOMParser().parseFromString(await download.text(),"text/html");
    assert(exported.querySelectorAll(".replica-page > img").length===17,"Downloaded HTML must retain every original page image.");
    assert(exported.querySelector("input")?.getAttribute("value")?.includes("Saved"),"Downloaded HTML must retain saved answers.");
    assert(!exported.querySelector(".fill-bar,.document-actions"),"Editing toolbars must stay out of exports.");
    const print=window.print;
    let printed=false;
    try{
      window.print=()=>{
        printed=true;
        assert(fixture.querySelectorAll(".replica-page > img").length===17,"Printing must retain the original PDF pages.");
        assert(fixture.querySelector(".replica-field .document-print-value")?.textContent?.includes("Saved"),"Printing must include saved answers in their original positions.");
        window.dispatchEvent(new Event("afterprint"));
      };
      fixture.querySelector<HTMLButtonElement>(".document-action-pdf")!.click();
    }finally{window.print=print;}
    assert(printed&&fixture.querySelector(".replica-field input"),"Print must restore editable controls afterward.");

    const small={...content,learnerWorkbook:{...models[0],sourcePageCount:1,replica:{...models[0].replica!,pages:models[0].replica!.pages.slice(0,1)}},learnerGuide:undefined,practicalTask:undefined};
    const exports=await makeUnitExports(unit,small);
    const loading=getDocument({data:new Uint8Array(await exports.pdf.arrayBuffer())});
    try{
      const pdf=await loading.promise;
      assert(pdf.numPages===2,"Learner-pack PDF must contain its summary and the original source page.");
      assert((await (await pdf.getPage(2)).getTextContent()).items.length===0,"Original PDF page must not be replaced by a rewritten text transcription.");
    }finally{await loading.destroy();}
  } finally {
    flushSync(()=>root.unmount());fixture.remove();
  }
  return {result:"Passed original-page pixel comparisons, all three real PDFs, 31-page native fields, PDF-only builds, isolated answer save/reload, editable HTML, print and source-preserving PDF export.",pages:models.map(model=>({title:model.title,pages:model.sourcePageCount,fields:model.replica!.sections.reduce((sum,section)=>sum+section.fields.length,0)}))};
}
