import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { PoeDoc, UnitContent, UnitStandard } from "../types";
import type { LessonEdits } from "../store";
import { buildUnitContent, validateUnitContent, MAX_SOURCE_LENGTH, mergeUnitContentEnhancement } from "../lib/unitBuilder";
import { useBuiltUnit, saveBuiltUnit } from "../lib/useBuiltUnit";
import { importUnitSource } from "../lib/unitSourceImport";
import { makeUnitExports } from "../lib/unitExports";
import { downloadDoc, uploadFile } from "../lib/files";
import { supabase } from "../lib/supabase";
import { recordTokenUsage } from "../lib/tokens";
import { UnitContentEditor } from "./UnitContentEditor";
import { Icon } from "../icons";
import "./unit-builder.css";


async function logbookImageDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Upload PNG, JPEG or WebP logbook images.");
  if (file.size > 12 * 1024 * 1024) throw new Error("Choose logbook images under 12 MB each.");
  const bitmap = await createImageBitmap(file);
  try {
    const max = 1200;
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not prepare that image for reading.");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.72);
  } finally {
    bitmap.close();
  }
}
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
  const [minutes,setMinutes]=useState(300);
  const [activityBlocks,setActivityBlocks]=useState<{heading:string;text:string}[]>([{heading:"",text:""}]);
  const [selfAssessmentContent,setSelfAssessmentContent]=useState("");
  const [logbookContent,setLogbookContent]=useState("");
  const [logbookImageName,setLogbookImageName]=useState("");
  const [busy,setBusy]=useState("");
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const [draft,setDraft]=useState<UnitContent|null>(null);
  const [warning,setWarning]=useState("");
  const [fileName,setFileName]=useState("");
  const [busyProgress,setBusyProgress]=useState(0);
  const finishBusy=(after?:()=>void)=>{
    setBusyProgress(100);
    window.setTimeout(()=>{setBusy("");after?.();},450);
  };
  useEffect(()=>{if(built)setSource(built.source);},[built?.revision]);
  useEffect(()=>{
    if(!busy){setBusyProgress(0);return;}
    setBusyProgress(1);
    const timer=window.setInterval(()=>setBusyProgress(value=>{
      if(value>=99)return 99;
      if(value>=85)return value+1;
      return Math.min(99,value+Math.max(2,Math.ceil((100-value)/14)));
    }),140);
    return()=>window.clearInterval(timer);
  },[busy]);
  const doneBusy=(after?:()=>void)=>setBusyProgress(value=>{
    const remaining=Math.max(1,100-value);
    for(let step=1;step<=remaining;step++) window.setTimeout(()=>setBusyProgress(Math.min(100,value+step)),step*18);
    window.setTimeout(()=>finishBusy(after),remaining*18+120);
    return value;
  });

  const publish=async(next:UnitContent,sourceText:string,aiUsed:boolean)=>{
    validateUnitContent(next);
    setBusy("Creating PDF, PowerPoint and answer guide…");
    const files=await makeUnitExports(unit,next);
    setBusy("Saving the unit and course materials…");
    const prefix=`shared/unitbuilder/${unit.us}`;
    const [pdf,pptx,answers]=await Promise.all([uploadFile(prefix,files.pdf),uploadFile(prefix,files.pptx),uploadFile(prefix,files.answers)]);
    await saveBuiltUnit(unit.us,{revision:crypto.randomUUID(),createdAt:new Date().toISOString(),source:sourceText,content:next,files:{pdf,pptx,answers},aiUsed});
    setSource(sourceText);setDraft(null);setMessage("Unit built and saved. All learning tabs and download files are ready.");onSaved();
  };
  const readLogbookImages=async(files: FileList|null)=>{
    const selected=Array.from(files??[]).filter(file=>file.type.startsWith("image/"));
    if(!selected.length)return;
    if(selected.length>8){setError("Upload up to 8 logbook images at a time.");return;}
    setError("");setMessage("");setBusy(selected.length===1?"Reading logbook image�":"Reading logbook images�");
    try{
      const images=await Promise.all(selected.map(logbookImageDataUrl));
      const token=(await supabase?.auth.getSession())?.data.session?.access_token;
      const response=await fetch("/api/extract-logbook-image",{method:"POST",headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({images}),signal:AbortSignal.timeout(85_000)});
      const result=await response.json();
      if(!response.ok)throw new Error(result.error??"The logbook image could not be read.");
      setLogbookContent(current=>[current.trim(),String(result.text??"").trim()].filter(Boolean).join("\n\n"));
      setLogbookImageName(selected.map(file=>file.name).join(", "));
      setMessage("Logbook image read. Check the extracted content before building.");
    }catch(e){setError(e instanceof Error?e.message:"The logbook image could not be read.");}
    finally{setBusy("");}
  };
  const build=async()=>{
    setError("");setMessage("");setWarning("");setBusy("Building lessons, activities and tab content…");
    try {
      let next=buildUnitContent(unit,source,{minutes});
      if(ai){
        setBusy("Researching the unit standard and creating the tabs with OpenAI...");
        const token=(await supabase?.auth.getSession())?.data.session?.access_token;
        const response=await fetch("/api/enhance-unit-content",{method:"POST",headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({unit,source,minutes,activityContent:activityBlocks.map((block,index)=>`Activity ${index+1} heading:\n${block.heading.trim()||`Activity ${index+1}`}\n\nActivity ${index+1} content:\n${block.text.trim()}`).filter(text=>text.trim()).join("\n\n--- ACTIVITY SEPARATOR ---\n\n"),selfAssessmentContent,logbookContent}),signal:AbortSignal.timeout(85_000)});
        const result=await response.json();
        if(!response.ok) throw new Error(result.error??"AI generation failed. Turn it off to build entirely with built-in code.");
        next=mergeUnitContentEnhancement(next,result.content,unit);setWarning("");
        if(result.usage) void recordTokenUsage({us:unit.us,model:result.model??"gpt-4.1-mini",promptTokens:result.usage.input_tokens??result.usage.prompt_tokens??0,completionTokens:result.usage.output_tokens??result.usage.completion_tokens??0,totalTokens:result.usage.total_tokens??0});
      }
      await publish(next,source,ai);
      doneBusy(()=>setOpen(false));
    }catch(e){setError(e instanceof Error?e.message:"The unit could not be built. Your current content is unchanged.");setBusy("");}
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
      {draft?<><p>Edit any tab below. Saving also rebuilds the PDF and editable PowerPoint.</p><UnitContentEditor value={draft as never} onChange={v=>setDraft(v as unknown as UnitContent)}/><button type="button" className="btn unit-build-action" disabled={!!busy} aria-busy={!!busy} style={{"--progress":`${busyProgress}%`} as CSSProperties} onClick={async()=>{setError("");try{await publish(draft,built?.source??source,built?.aiUsed??false);doneBusy(()=>setOpen(false));}catch(e){setError(String(e));setBusy("");}}}><span>{busy?`Creating ${busyProgress}%`:"Save all changes and rebuild files"}</span></button></>:<>
        <p>Paste your teaching material or import a document. Use headings such as “# Estimating effort” with a blank line before the supporting paragraphs.</p>
        {built&&<p className="muted">Building replaces this unit's learning content. The current version is kept for restoration. Learner work is retained.</p>}
        <div className="unit-settings-card">
          <div className="unit-settings-row"><div className="unit-settings-copy"><strong>Import content</strong><span>{fileName || "TXT, Markdown, PDF, DOCX or PPTX"}</span></div>
            <label className="unit-import-button"><span>Choose file</span><input aria-label="Import teaching content" type="file" accept=".txt,.md,.pdf,.docx,.pptx" disabled={!!busy} onChange={async e=>{const file=e.target.files?.[0];e.target.value="";if(!file)return;setBusy("Reading source document…");setError("");try{setSource(await importUnitSource(file));setFileName(file.name);}catch(err){setError(String(err));}finally{setBusy("");}}}/></label>
          </div>
          <label className="unit-source-field"><strong>Source content</strong><span>Paste the teaching material for this unit.</span><textarea rows={7} value={source} maxLength={MAX_SOURCE_LENGTH} disabled={!!busy} onChange={e=>setSource(e.target.value)} placeholder={`Paste the content for US ${unit.us} here…`}/></label>
        </div>
        <h3 className="unit-settings-heading">Activity, self-assessment and logbook content</h3>
        <div className="unit-settings-card">
          <div className="unit-source-field"><strong>Activity content</strong><span>Add each activity/question session in its own box. Use the separator by clicking Add another activity.</span>{activityBlocks.map((block,index)=><div className="unit-activity-block" key={index}><label>Activity {index+1} heading<input type="text" value={block.heading} disabled={!!busy} onChange={e=>setActivityBlocks(blocks=>blocks.map((item,i)=>i===index?{...item,heading:e.target.value}:item))} placeholder="Example: Question Session 1 -- Prepare a time estimate"/></label><label>Activity {index+1} content<textarea rows={5} value={block.text} disabled={!!busy} onChange={e=>setActivityBlocks(blocks=>blocks.map((item,i)=>i===index?{...item,text:e.target.value}:item))} placeholder="Example: Questioning task, time allowed, Activity: Self & Group, learner questions, required evidence, model answer guidance..."/></label><div className="unit-editor-actions"><button type="button" className="btn ghost sm" disabled={!!busy||index===0} onClick={()=>setActivityBlocks(blocks=>{const next=[...blocks];[next[index-1],next[index]]=[next[index],next[index-1]];return next;})}>Move up</button><button type="button" className="btn ghost sm" disabled={!!busy||activityBlocks.length===1} onClick={()=>setActivityBlocks(blocks=>blocks.filter((_,i)=>i!==index))}>Remove activity</button></div></div>)}<button type="button" className="btn ghost sm" disabled={!!busy} onClick={()=>setActivityBlocks(blocks=>[...blocks,{heading:"",text:""}])}>Add another activity</button></div>
          <label className="unit-source-field"><strong>Self-assessment content</strong><span>Paste or describe the competence checklist learners must tick after the lesson.</span><textarea rows={4} value={selfAssessmentContent} disabled={!!busy} onChange={e=>setSelfAssessmentContent(e.target.value)} placeholder="Example: I can prepare a time estimate..., I can explain cost components..., revisit areas needing more practice..."/></label>
          <label className="unit-source-field"><strong>Logbook content</strong><span>Paste the logbook content, or upload clear images of the logbook pages and check the extracted text.</span><div className="unit-settings-row unit-logbook-import"><span className="unit-settings-copy"><strong>Read logbook image</strong><span>{logbookImageName || "PNG, JPEG or WebP screenshots/photos"}</span></span><label className="unit-import-button"><span>Upload image</span><input aria-label="Upload logbook image" type="file" accept="image/png,image/jpeg,image/webp" multiple disabled={!!busy} onChange={async e=>{const files=e.target.files;e.target.value="";await readLogbookImages(files);}}/></label></div><textarea rows={7} value={logbookContent} disabled={!!busy} onChange={e=>setLogbookContent(e.target.value)} placeholder="Example: embedded knowledge questions with checklist ticks, practical activities, workplace activities, other activities, project evidence and project checklist..."/></label>
        </div>
        <h3 className="unit-settings-heading">Build settings</h3>
        <div className="unit-settings-card">
          <label className="unit-settings-row"><span className="unit-settings-copy"><strong>Session duration</strong><span>Planned teaching time in minutes.</span></span><input aria-label="Session duration in minutes" className="unit-duration" type="number" min={60} max={2400} value={minutes} disabled={!!busy} onChange={e=>setMinutes(Math.min(2400,Math.max(60,Number(e.target.value))))}/></label>
          <label className="unit-settings-row"><span className="unit-settings-copy"><strong>Build tabs with OpenAI web research</strong><span>Use OpenAI web research to build the overview, logbook, evaluation and activities.</span></span><input className="unit-ai-switch" type="checkbox" role="switch" checked={ai} disabled={!!busy} onChange={e=>setAi(e.target.checked)}/></label>
        </div>
        <p className="muted">Lessons keep your source text. When AI is enabled, OpenAI researches the unit standard online and uses your activity, self-assessment and logbook content to create the matching tabs, overview, evaluation and lesson plan.</p>
        <button type="button" className="btn unit-build-action" disabled={!!busy||source.trim().length<100||(ai&&(!activityBlocks.some(block=>block.text.trim())||!selfAssessmentContent.trim()||!logbookContent.trim()))} aria-busy={!!busy} style={{"--progress":`${busyProgress}%`} as CSSProperties} onClick={()=>void build()}><span>{busy?`Creating ${busyProgress}%`:"Build complete unit standard"}</span></button>
      </>}
      <button type="button" className="btn ghost" disabled={!!busy} onClick={()=>{setOpen(false);setDraft(null);}}>Close</button>
    </div>}
    {busy&&<p role="status">{busy}</p>}{message&&<p role="status">{message}</p>}{warning&&<p role="status">{warning}</p>}{error&&<p role="alert" className="auth-error">{error}</p>}
  </section>;
}

export function BuiltUnitDownloads({us,staff}:{us:string;staff:boolean}){
  const built=useBuiltUnit(us);
  const fileRef=useRef<HTMLInputElement|null>(null);
  const [error,setError]=useState("");
  const [busy,setBusy]=useState("");
  const [uploadPct,setUploadPct]=useState<number|null>(null);
  if(!built)return null;
  const material=built.files.material;
  const saveMaterial=async(doc?:PoeDoc)=>{
    await saveBuiltUnit(us,{revision:crypto.randomUUID(),createdAt:new Date().toISOString(),source:built.source,content:built.content,files:{...built.files,material:doc},aiUsed:built.aiUsed});
  };
  const onFile=async(file:File|undefined)=>{
    if(!file)return;
    setError("");setBusy("Uploading course material...");setUploadPct(0);
    try{
      const doc=await uploadFile(`shared/unitbuilder/${us}/material`,file,setUploadPct);
      await saveMaterial(doc);
    }catch(e){setError(e instanceof Error?e.message:"The course material could not be uploaded.");}
    finally{setBusy("");setUploadPct(null);}
  };
  return <div className="unit-builder-downloads"><h3>Course material</h3>
    {material?<p>Uploaded course material for this unit.</p>:<p className="muted">No course material has been uploaded for this built unit.</p>}
    <div className="unit-builder-bar">
      {material&&<button type="button" className="btn ghost" onClick={()=>void downloadDoc(material).catch(()=>setError("The file could not be downloaded. Please retry."))}><Icon name="download" size={15}/>{material.name}</button>}
      {staff&&<button type="button" className="btn ghost" disabled={!!busy} onClick={()=>fileRef.current?.click()}><Icon name="folder" size={15}/>{material?"Replace course material":"Upload course material"}</button>}
      {staff&&material&&<button type="button" className="btn ghost" disabled={!!busy} onClick={()=>void saveMaterial(undefined).catch(e=>setError(e instanceof Error?e.message:"The course material could not be removed."))}><Icon name="close" size={14}/>Remove</button>}
    </div>
    <input ref={fileRef} type="file" hidden accept=".pdf,.ppt,.pptx,.doc,.docx,.odt,.rtf,.txt,image/*,video/*" onChange={e=>{const file=e.target.files?.[0];e.target.value="";void onFile(file);}}/>
    {uploadPct!==null&&<div className="upload-progress plan-upload-progress" role="progressbar" aria-valuenow={uploadPct}><div className="track"><div className="fill" style={{width:`${uploadPct}%`}}/></div><span className="pct">Uploading... {uploadPct}%</span></div>}
    {busy&&<p role="status">{busy}</p>}{error&&<p role="alert" className="auth-error">{error}</p>}
  </div>;
}

