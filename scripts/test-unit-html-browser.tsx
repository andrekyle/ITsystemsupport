import React from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { getDocument } from "pdfjs-dist";
import { supabase } from "../src/lib/supabase";
import { PDF_WASM_URL, convertPdfHtml } from "../src/lib/formImport";
import { importUnitPdf } from "../src/lib/unitPdfImport";
import { ReplicaForm } from "../src/components/ReplicaForm";
import { DocumentActions } from "../src/components/DocumentActions";
import { validateUnitContent } from "../src/lib/unitBuilder";
import type { FormAnswers } from "../src/lib/formSchema";

function assert(value: unknown, message: string): asserts value {
  if(!value)throw new Error(message);
}

/** Source extraction and HTML rendering are real; only auth and AI are mocked. */
export async function withHtmlAi<T>(run: (calls:()=>number)=>Promise<T>): Promise<T> {
  assert(supabase,"Test needs the configured client.");
  const originalSession=supabase.auth.getSession;
  const originalFetch=globalThis.fetch;
  let calls=0;
  supabase.auth.getSession=async()=>({data:{session:{
    access_token:"test-token",refresh_token:"test-refresh",expires_in:3600,token_type:"bearer",
    user:{id:"test-admin",app_metadata:{},user_metadata:{},aud:"authenticated",created_at:"2026-01-01"},
  }},error:null});
  globalThis.fetch=async(input,init)=>{
    if(String(input)!=="/api/generate-form")return originalFetch(input,init);
    calls++;
    const request=JSON.parse(String(init?.body));
    assert(request.html===true && request.pages.length===1 && request.images.length===1,"Every page must reach AI HTML conversion.");
    const box=request.pages[0].boxes.find((box:{text:boolean;kind:string})=>!box.text&&box.kind==="cell");
    return Response.json({definition:{title:"Source page",sections:box?[{id:"page",title:"",description:"",fields:[{
      id:"answer",label:"Answer",type:"textarea",required:false,helpText:"",options:[],
      placement:{page:1,box:{x:box.x,y:box.y,w:box.w,h:box.h},options:[]},
    }]}]:[]},artwork:{fills:[],pictures:[],issues:[]}});
  };
  try {
    return await run(()=>calls);
  } finally {
    supabase.auth.getSession=originalSession;
    globalThis.fetch=originalFetch;
  }
}

export async function testUnitHtml() {
  return withHtmlAi(async calls=>{
    const originalFetch=globalThis.fetch;
    const results=[];
    for(const name of ["SAQA-114046 -   Learner Workbook.pdf","SAQA-114046   - Practical task.pdf","SAQA -114046   - Learner Guide.pdf"]){
      const response=await originalFetch("/"+encodeURIComponent(name));
      assert(response.ok,"Source PDF missing.");
      const file=new File([await response.blob()],name,{type:"application/pdf"});
      const converted=await importUnitPdf(file,"Source document");
      const definition=converted.replica!;
      assert(definition.display==="digital","Must be actual HTML, not image mode.");
      const loading=getDocument({data:new Uint8Array(await file.arrayBuffer()),wasmUrl:PDF_WASM_URL});
      const pdf=await loading.promise;
      assert(pdf.numPages===definition.pages.length,"Every source page retained.");
      for(let index=0;index<pdf.numPages;index++){
        const source=await (await pdf.getPage(index+1)).getTextContent();
        const text=definition.pages[index].layer!.text.map(run=>run.t).join(" ").replace(/\s+/g," ");
        for(const item of source.items){
          if("str" in item && item.str.trim())assert(text.includes(item.str.trim().replace(/\s+/g," ")),`Missing source text on page ${index+1}: ${item.str}`);
        }
        assert(!definition.pages[index].layer!.pictures.length,"Mock must not introduce image substitutes.");
      }
      await loading.destroy();
      validateUnitContent({lesson:[],exercises:[],assignments:[],quiz:[],learnerWorkbook:converted});
      const saved=JSON.parse(JSON.stringify(definition));
      assert(saved.pages.length===pdf.numPages,"Persistence must not truncate guides at 30 pages.");
      const host=document.createElement("div");
      document.body.appendChild(host);
      const root=createRoot(host);
      let answers:FormAnswers={};
      const render=()=>flushSync(()=>root.render(<><DocumentActions name="HTML conversion test"/><div className="document-print-target"><ReplicaForm definition={saved} answers={answers} onChange={(id,value)=>{answers={...answers,[id]:value};render();}}/></div></>));
      try {
        render();
        assert(host.querySelectorAll(".replica-page").length===definition.pages.length,"All HTML pages rendered.");
        assert(host.querySelectorAll(".rp-text").length===definition.pages.reduce((n,page)=>n+page.layer!.text.length,0),"Every printed run must be real DOM text.");
        assert(!host.querySelector(".replica-page > img"),"No whole-page image fallback.");
        if(name.includes("Workbook")){
          const vertical=host.querySelector<HTMLElement>(".rp-text[data-rotation]");
          assert(vertical?.textContent?.includes("LEARNER WORKBOOK"),"The vertical source title must remain rotated HTML text, not an image.");
          await new Promise(resolve=>setTimeout(resolve,100));
          const text=vertical.getBoundingClientRect();
          const page=vertical.closest(".replica-page")!.getBoundingClientRect();
          assert(text.left>=page.left-2 && text.right<=page.right+2 && text.top>=page.top-2 && text.bottom<=page.bottom+2,"Rotated source text must stay inside its source page.");
        }
        const field=host.querySelector<HTMLTextAreaElement>("textarea");
        if(field){
          const setter=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value")!.set!;
          setter.call(field,"Saved HTML answer");
          field.dispatchEvent(new Event("input",{bubbles:true}));
          assert(Object.values(answers).includes("Saved HTML answer"),"HTML answer changes persist.");
        }
        let download:Blob|undefined;
        const createUrl=URL.createObjectURL;
        const click=HTMLAnchorElement.prototype.click;
        try {
          URL.createObjectURL=blob=>{if(blob instanceof Blob)download=blob;return createUrl(blob);};
          HTMLAnchorElement.prototype.click=()=>{};
          host.querySelector<HTMLButtonElement>(".document-action-html")!.click();
        } finally {URL.createObjectURL=createUrl;HTMLAnchorElement.prototype.click=click;}
        assert(download,"Converted HTML download must be available.");
        const exported=new DOMParser().parseFromString(await download.text(),"text/html");
        assert(exported.querySelectorAll(".rp-text").length===host.querySelectorAll(".rp-text").length,"HTML download must preserve every printed text run.");
        assert(!exported.querySelector(".replica-page > img"),"HTML download must not flatten pages into images.");
        if(field)assert(exported.querySelector("textarea")?.textContent==="Saved HTML answer","Standalone HTML must retain saved answers.");
        assert(!exported.querySelector(".no-print"),"Editing controls must not appear in document exports.");
        results.push({name,pages:definition.pages.length,textRuns:host.querySelectorAll(".rp-text").length,fields:definition.sections.flatMap(section=>section.fields).length});
      } finally {flushSync(()=>root.unmount());host.remove();}
    }
    assert(calls()===59,"AI must be called for all 59 source pages, without native-field shortcuts.");
    let rejected=false;
    try {
      await convertPdfHtml({name:"scan.pdf",text:"",images:[],pages:[{src:"data:image/png;base64,AA==",width:100,height:100,path:"",analysis:{page:1,width:100,height:100,text:[],boxes:[]}}]});
    } catch(error) {rejected=error instanceof Error && /OCR/.test(error.message);}
    assert(rejected && calls()===59,"Pages without text must fail before AI requests, not become image-only HTML.");
    return {results,aiCalls:calls()};
  });
}
