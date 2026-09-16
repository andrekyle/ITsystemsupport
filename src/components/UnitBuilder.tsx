import { useState } from "react";
import type { UnitContent, UnitStandard } from "../types";
import type { LessonEdits } from "../store";
import { buildUnitContent, validateUnitContent, MAX_SOURCE_LENGTH } from "../lib/unitBuilder";
import { useBuiltUnit, saveBuiltUnit } from "../lib/useBuiltUnit";
import { importUnitSource } from "../lib/unitSourceImport";
import { downloadDoc, uploadFile } from "../lib/files";
import { supabase } from "../lib/supabase";
import { recordTokenUsage } from "../lib/tokens";
import { Select } from "./Select";
import { UnitContentEditor } from "./UnitContentEditor";
import { Icon } from "../icons";
import "./unit-builder.css";

export function effectiveBuiltContent(content:UnitContent, edits:LessonEdits):UnitContent {
  const next=structuredClone(content);
  next.lesson=next.lesson.map((s,si)=>({...s,heading:edits.headings?.[si]??s.heading,
    paragraphs:edits.sectionBody?.[si]?.paragraphs??s.paragraphs.map((p,pi)=>edits.paragraphs?.[`${si}:${pi}`]??p),
    bullets:edits.sectionBody?.[si]?.bullets??s.bullets?.map((p,pi)=>edits.bullets?.[`${si}:${pi}`]??p),
    slideQuiz:edits.generatedQuizzes?.[si]??s.slideQuiz,
    cards:s.cards?.map((c,ci)=>({...c,title:edits.cards?.[`${si}:${ci}:t`]??c.title,text:edits.cards?.[`${si}:${ci}:d`]??c.text})),
    table:s.table?{headers:s.table.headers.map((h,ci)=>edits.tableCells?.[`${si}:h:${ci}`]??h),rows:s.table.rows.map((r,ri)=>r.map((v,ci)=>edits.tableCells?.[`${si}:${ri}:${ci}`]??v))}:undefined,
  }));
  next.lesson=next.lesson.map((s,si)=>edits.sectionBody?.[si]?.richHtml!==undefined?{...s,bullets:undefined,table:undefined,cards:undefined,example:undefined,examples:undefined}:s);
  return next;
}

export function UnitBuilder({unit,content,edits,onSaved}:{unit:UnitStandard;content?:UnitContent;edits:LessonEdits;onSaved:()=>void}) {
  const built=useBuiltUnit(unit.us);
  const [open,setOpen]=useState(false);
  const [source,setSource]=useState(built?.source??"");
  const [ai,setAi]=useState(true);
  const [count,setCount]=useState("5");
  const [minutes,setMinutes]=useState(300);
  const [busy,setBusy]=useState("");
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const [draft,setDraft]=useState<UnitContent|null>(null);
  const [warning,setWarning]=useState("");
  const [fileName,setFileName]=useState("");

  const publish=async(next:UnitContent,sourceText:string,aiUsed:boolean)=>{
    validateUnitContent(next);
    setBusy("Creating PDF, PowerPoint and answer guide…");
    const {makeUnitExports}=await import("../lib/unitExports");
    const files=await makeUnitExports(unit,next);
    setBusy("Saving the unit and course materials…");
    const prefix=`shared/unitbuilder/${unit.us}`;
    const [pdf,pptx,answers]=await Promise.all([uploadFile(prefix,files.pdf),uploadFile(prefix,files.pptx),uploadFile(prefix,files.answers)]);
    await saveBuiltUnit(unit.us,{revision:crypto.randomUUID(),createdAt:new Date().toISOString(),source:sourceText,content:next,files:{pdf,pptx,answers},aiUsed});
    setSource(sourceText);setDraft(null);setOpen(false);setMessage("Unit built and saved. All learning tabs and download files are ready.");onSaved();
  };
  const build=async()=>{
    setError("");setMessage("");setWarning("");setBusy("Building lessons, activities and tab content…");
    try {
      const next=buildUnitContent(unit,source,{questions:Number(count),minutes});
      if(next.quiz.length<Number(count)) setWarning(`The source supports ${next.quiz.length} built-in questions. Add more content for ${count}.`);
      if(ai){
        setBusy("Improving the quiz with OpenAI…");
        const token=(await supabase?.auth.getSession())?.data.session?.access_token;
        const response=await fetch("/api/enhance-unit-quiz",{method:"POST",headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({source,count:Number(count)}),signal:AbortSignal.timeout(55_000)});
        const result=await response.json();
        if(!response.ok) throw new Error(result.error??"AI enhancement failed. Turn it off to build entirely with built-in code.");
        next.quiz=result.questions;setWarning("");
        if(result.usage) void recordTokenUsage({us:unit.us,model:result.model??"gpt-4.1-mini",promptTokens:result.usage.prompt_tokens??0,completionTokens:result.usage.completion_tokens??0,totalTokens:result.usage.total_tokens??0});
      }
      await publish(next,source,ai);
    }catch(e){setError(e instanceof Error?e.message:"The unit could not be built. Your current content is unchanged.");}finally{setBusy("");}
  };
  return <section className="unit-builder">
    <div className="unit-builder-bar">
      <button type="button" className="btn ghost" disabled={!!busy} onClick={()=>{setOpen(!open);setDraft(null);setError("");}}><Icon name="document" size={16}/>{built?"Rebuild unit standard":"Build unit standard"}</button>
      {built&&<>
        <button type="button" className="btn ghost" disabled={!!busy} onClick={()=>{setDraft(effectiveBuiltContent(content??built.content,edits));setOpen(true);setError("");}}>Edit all unit content</button>
        <button type="button" className="btn ghost" disabled={!!busy} onClick={async()=>{setError("");try{await publish(effectiveBuiltContent(content??built.content,edits),built.source,built.aiUsed);}catch(e){setError(String(e));}finally{setBusy("");}}}>Update PDF and PowerPoint</button>
        {built.previous&&<button type="button" className="btn ghost" disabled={!!busy} onClick={async()=>{setBusy("Restoring previous version…");try{await saveBuiltUnit(unit.us,built.previous!);onSaved();setMessage("Previous unit version restored.");}catch(e){setError(String(e));}finally{setBusy("");}}}>Restore previous version</button>}
      </>}
    </div>
    {open&&<div className="unit-builder-panel">
      <h2>{draft?"Edit complete unit":"Build"} · US {unit.us}</h2>
      {draft?<><p>Edit any tab below. Saving also rebuilds the PDF and editable PowerPoint.</p><UnitContentEditor value={draft as never} onChange={v=>setDraft(v as unknown as UnitContent)}/><button type="button" className="btn" disabled={!!busy} onClick={async()=>{setError("");try{await publish(draft,built?.source??source,built?.aiUsed??false);}catch(e){setError(String(e));}finally{setBusy("");}}}>Save all changes and rebuild files</button></>:<>
        <p>Paste your teaching material or import a document. Use headings such as “# Estimating effort” with a blank line before the supporting paragraphs.</p>
        {built&&<p className="muted">Building replaces this unit's learning content. The current version is kept for restoration. Learner work is retained.</p>}
        <div className="unit-settings-card">
          <div className="unit-settings-row"><div className="unit-settings-copy"><strong>Import content</strong><span>{fileName || "TXT, Markdown, PDF, DOCX or PPTX"}</span></div>
            <label className="unit-import-button"><span>Choose file</span><input aria-label="Import teaching content" type="file" accept=".txt,.md,.pdf,.docx,.pptx" disabled={!!busy} onChange={async e=>{const file=e.target.files?.[0];e.target.value="";if(!file)return;setBusy("Reading source document…");setError("");try{setSource(await importUnitSource(file));setFileName(file.name);}catch(err){setError(String(err));}finally{setBusy("");}}}/></label>
          </div>
          <label className="unit-source-field"><strong>Source content</strong><span>Paste the teaching material for this unit.</span><textarea rows={7} value={source} maxLength={MAX_SOURCE_LENGTH} disabled={!!busy} onChange={e=>setSource(e.target.value)} placeholder={`Paste the content for US ${unit.us} here…`}/></label>
        </div>
        <h3 className="unit-settings-heading">Build settings</h3>
        <div className="unit-settings-card">
          <div className="unit-settings-row"><div className="unit-settings-copy"><strong>Quiz questions</strong><span>Choose between 3 and 10 questions.</span></div><Select ariaLabel="Unit quiz question count" disabled={!!busy} value={count} onChange={setCount} options={Array.from({length:8},(_,i)=>({value:String(i+3),label:String(i+3)}))}/></div>
          <label className="unit-settings-row"><span className="unit-settings-copy"><strong>Session duration</strong><span>Planned teaching time in minutes.</span></span><input aria-label="Session duration in minutes" className="unit-duration" type="number" min={60} max={2400} value={minutes} disabled={!!busy} onChange={e=>setMinutes(Math.min(2400,Math.max(60,Number(e.target.value))))}/></label>
          <label className="unit-settings-row"><span className="unit-settings-copy"><strong>Improve questions with AI</strong><span>Use OpenAI to refine the quiz questions.</span></span><input className="unit-ai-switch" type="checkbox" role="switch" checked={ai} disabled={!!busy} onChange={e=>setAi(e.target.checked)}/></label>
        </div>
        <p className="muted">Lessons keep your source text. Activities, assignments, notes, logbook, self assessment, evaluation, lesson plan and exports are assembled by built-in code.</p>
        <button type="button" className="btn" disabled={!!busy||source.trim().length<100} onClick={()=>void build()}>Build complete unit standard</button>
      </>}
      <button type="button" className="btn ghost" disabled={!!busy} onClick={()=>{setOpen(false);setDraft(null);}}>Close</button>
    </div>}
    {busy&&<p role="status">{busy}</p>}{message&&<p role="status">{message}</p>}{warning&&<p role="status">{warning}</p>}{error&&<p role="alert" className="auth-error">{error}</p>}
  </section>;
}

export function BuiltUnitDownloads({us,staff}:{us:string;staff:boolean}){
  const built=useBuiltUnit(us);
  const [error,setError]=useState("");
  if(!built)return null;
  return <div className="unit-builder-downloads"><h3>Generated course materials</h3><p>PDF learner pack and editable PowerPoint generated from this unit's content.</p>
    <div className="unit-builder-bar">{[built.files.pdf,built.files.pptx,...(staff?[built.files.answers]:[])].map(file=><button type="button" className="btn ghost" key={file.name} onClick={()=>void downloadDoc(file).catch(()=>setError("The file could not be downloaded. Please retry."))}><Icon name="download" size={15}/>{file.name}</button>)}</div>{error&&<p role="alert">{error}</p>}
  </div>;
}
