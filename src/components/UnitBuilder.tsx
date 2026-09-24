import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { LogbookSpec, PoeDoc, UnitContent, UnitStandard } from "../types";
import type { LessonEdits } from "../store";
import { buildUnitContent, validateUnitContent, lessonPlanFromSource, MAX_SOURCE_LENGTH, MAX_LESSON_PLAN_LENGTH, mergeUnitContentEnhancement } from "../lib/unitBuilder";
import { logbookFromSource, logbookStats, MAX_LOGBOOK_SOURCE_LENGTH } from "../lib/logbookBuilder";
import { useBuiltUnit, saveBuiltUnit, deleteBuiltUnit } from "../lib/useBuiltUnit";
import { unitHistory, unitVersionArchive, MAX_UNIT_HISTORY, type BuiltUnitVersion } from "../lib/builtUnits";
import { importUnitSource } from "../lib/unitSourceImport";
import { makeUnitExports } from "../lib/unitExports";
import { downloadDoc, getFileUrl, uploadFile } from "../lib/files";
import { supabase } from "../lib/supabase";
import { recordTokenUsage } from "../lib/tokens";
import { UnitContentEditor } from "./UnitContentEditor";
import { Select } from "./Select";
import { SlideViewer } from "./SlideViewer";
import { Icon } from "../icons";
import "./unit-builder.css";
import { courseScopedUnit } from "../lib/courseScope";
import { flushKey } from "../lib/sync";


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
    quizRetries:edits.quizRetries && Object.prototype.hasOwnProperty.call(edits.quizRetries,si) ? (edits.quizRetries[si] ?? undefined) : s.quizRetries,
    cards:s.cards?.map((c,ci)=>({...c,title:edits.cards?.[`${si}:${ci}:t`]??c.title,text:edits.cards?.[`${si}:${ci}:d`]??c.text})),
    example:s.example?{...s.example,title:edits.examples?.[`${si}:0:t`]??s.example.title,lines:s.example.lines.map((line,i)=>edits.examples?.[`${si}:0:${i}`]??line)}:undefined,
    examples:s.examples?.map((ex,xi)=>({...ex,title:edits.examples?.[`${si}:${xi+1}:t`]??ex.title,lines:ex.lines.map((line,i)=>edits.examples?.[`${si}:${xi+1}:${i}`]??line)})),
    figures:s.figures?.map(f=>({...f,caption:edits.captions?.[f.id]??f.caption})),
    table:s.table?{headers:s.table.headers.map((h,ci)=>edits.tableCells?.[`${si}:h:${ci}`]??h),rows:s.table.rows.map((r,ri)=>r.map((v,ci)=>edits.tableCells?.[`${si}:${ri}:${ci}`]??v))}:undefined,
  }));
  next.lesson=next.lesson.map((s,si)=>edits.sectionBody?.[si]?.richHtml!==undefined?{...s,bullets:undefined,table:undefined,cards:undefined,example:undefined,examples:undefined}:s);
  if(edits.lessonPlan) next.lessonPlan=structuredClone(edits.lessonPlan);
  if(edits.logbook) next.logbook=structuredClone(edits.logbook);
  return next;
}

export function UnitBuilder({unit,content,edits,onSaved,onEditInline,inlineDraft,onCancelInline}:{unit:UnitStandard;content?:UnitContent;edits:LessonEdits;onSaved:()=>void;onEditInline:()=>void;inlineDraft?:UnitContent;onCancelInline:()=>void}) {
  const built=useBuiltUnit(unit.us);
  const [open,setOpen]=useState(false);  const [source,setSource]=useState(built?.source??"");
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
  const [newTabKind, setNewTabKind] = useState("customTabs");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const addTab = () => {
    if (!draft) return;
    if (newTabKind === "customTabs") {
      setDraft({ ...draft, customTabs: [...(draft.customTabs ?? []), { id: `custom-${crypto.randomUUID()}`, title: "New tab", text: "Add your content here." }] });
      return;
    }
    const defaults = buildUnitContent(unit, "# New lesson\n\nAdd the learning objectives, teaching notes and practical examples for this unit. Explain each topic in detail and include instructions for the learners to follow.", { minutes: 300 });
    const key = newTabKind as keyof UnitContent;
    setDraft({ ...draft, [key]: draft[key] ?? defaults[key] ?? (key === "evaluation" ? { intro: "Evaluate this unit", questions: ["What did you learn?"] } : []) });
  };
  const [warning,setWarning]=useState("");
  const [fileName,setFileName]=useState("");
  const [confirmBuild,setConfirmBuild]=useState(false);
  const [restoreRevision,setRestoreRevision]=useState("");
  const versions=unitHistory(built);
  const selectedVersion=versions.find(version=>version.revision===restoreRevision)??versions[0];
  const versionLabel=(version:BuiltUnitVersion)=>new Date(version.createdAt).toLocaleString("en-ZA",{dateStyle:"medium",timeStyle:"short"});
  const versionHint=(version:BuiltUnitVersion)=>`${version.content.lesson.length} lesson${version.content.lesson.length===1?"":"s"} · ${version.aiUsed?"AI build":"built-in build"}`;
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
    validateUnitContent(next, !draft && !inlineDraft);
    setBusy("Creating PDF, PowerPoint and answer guide…");
    const files=await makeUnitExports(unit,next);
    setBusy("Saving the unit and course materials…");
    const prefix=`shared/unitbuilder/${courseScopedUnit(unit.us)}`;
    const [pdf,pptx,answers]=await Promise.all([uploadFile(prefix,files.pdf),uploadFile(prefix,files.pptx),uploadFile(prefix,files.answers)]);
    const revision=crypto.randomUUID();
    if(inlineDraft){
      // Keep rich text and figure layout attached to the new revision. The
      // old published revision remains untouched if either save fails.
      const key=`itss.lessonedits.${courseScopedUnit(`${unit.us}.built-${revision}`)}`;
      localStorage.setItem(key,JSON.stringify(edits));
      await flushKey(key,!!supabase);
    }
    await saveBuiltUnit(unit.us,{revision,createdAt:new Date().toISOString(),source:sourceText,content:next,files:{pdf,pptx,answers,material:built?.files.material,materialEditable:built?.files.materialEditable},aiUsed,planSource:built?.planSource});
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
      // Pasted or photographed logbook content builds the logbook directly; AI output (when on) may refine it.
      const pastedLogbook=logbookContent.trim()?logbookFromSource(unit,logbookContent):undefined;
      if(pastedLogbook)next.logbook=pastedLogbook;
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
      <button type="button" className="btn ghost" disabled={!!busy || !!inlineDraft} onClick={()=>{setOpen(!open);setDraft(null);setError("");setConfirmBuild(false);}}><Icon name="document" size={16}/>{built?"Rebuild unit standard":"Build unit standard"}</button>
      {inlineDraft ? <>
        <button type="button" className="btn ghost" disabled={!!busy} onClick={async()=>{setError("");try{await publish(effectiveBuiltContent(inlineDraft,edits),built?.source??source,built?.aiUsed??false);}catch(e){setError(String(e));}finally{setBusy("");}}}>{busy || "Save inline changes and update files"}</button>
        <button type="button" className="btn ghost" disabled={!!busy} onClick={onCancelInline}>Cancel inline changes</button>
      </> : <button type="button" className="btn ghost" disabled={!!busy} onClick={onEditInline}>Edit content inline</button>}
      {!inlineDraft && <button type="button" className="btn ghost" disabled={!!busy} onClick={()=>{setDraft(effectiveBuiltContent(content ?? { lesson: [], exercises: [], assignments: [], quiz: [] },edits));setOpen(true);setError("");}}>Manage tabs and structure</button>}
      {built&&!inlineDraft&&<>
        <button type="button" className="btn ghost" disabled={!!busy} onClick={async()=>{setError("");try{await publish(effectiveBuiltContent(content??built.content,edits),built.source,built.aiUsed);}catch(e){setError(String(e));}finally{setBusy("");}}}>Update PDF and PowerPoint</button>
        {selectedVersion&&<span className="unit-restore">
          <Select className="unit-version-select" ariaLabel="Saved unit versions" disabled={!!busy} value={selectedVersion.revision} onChange={setRestoreRevision} options={versions.map(version=>({value:version.revision,label:versionLabel(version),hint:versionHint(version)}))}/>
          <button type="button" className="btn ghost" disabled={!!busy} onClick={async()=>{setError("");setMessage("");setBusy("Restoring saved version…");try{await saveBuiltUnit(unit.us,unitVersionArchive(selectedVersion));setRestoreRevision("");onSaved();setMessage(`The version saved on ${versionLabel(selectedVersion)} is now live. The version it replaced is still restorable.`);}catch(e){setError(String(e));}finally{setBusy("");}}}>Restore version</button>
        </span>}
        <button type="button" className="btn ghost" disabled={!!busy} onClick={()=>{if(!confirmDelete){setConfirmDelete(true);setError("");setMessage("");return;}setConfirmDelete(false);setBusy("Deleting unit…");void deleteBuiltUnit(unit.us).then(()=>{setMessage("Unit deleted. You can rebuild it anytime.");onSaved();setBusy("");}).catch(e=>{setError(e instanceof Error?e.message:"The unit could not be deleted.");setBusy("");});}}>{confirmDelete?"Yes, delete unit":"Delete unit"}</button>
        {confirmDelete&&!busy&&<button type="button" className="btn ghost" onClick={()=>setConfirmDelete(false)}>Cancel</button>}
      </>}
    </div>
    {open&&<div className="unit-builder-panel">
      <h2>{draft?"Edit complete unit":"Build"} · US {unit.us}</h2>
      {draft && <div className="unit-editor-actions">
        <Select ariaLabel="Tab to add" value={newTabKind} onChange={setNewTabKind} options={[
          { value: "customTabs", label: "Custom content tab" }, { value: "lessonPlan", label: "Lesson plan" },
          { value: "logbook", label: "Logbook" }, { value: "selfAssessment", label: "Self assessment" },
          { value: "evaluation", label: "Evaluation" }, { value: "quizzes", label: "Additional quizzes" },
        ]} />
        <button type="button" className="btn ghost sm" disabled={!!busy} onClick={addTab}>Add tab</button>
      </div>}
      {draft?<><p>Edit any tab below. Saving also rebuilds the PDF and editable PowerPoint.</p><UnitContentEditor value={draft as never} onChange={v=>setDraft(v as unknown as UnitContent)}/><button type="button" className="btn unit-build-action" disabled={!!busy} aria-busy={!!busy} style={{"--progress":`${busyProgress}%`} as CSSProperties} onClick={async()=>{setError("");try{await publish(draft,built?.source??source,built?.aiUsed??false);doneBusy(()=>setOpen(false));}catch(e){setError(String(e));setBusy("");}}}><span>{busy?`Creating ${busyProgress}%`:"Save all changes and rebuild files"}</span></button></>:<>
        <p>Paste your teaching material or import a document. Use headings such as “# Estimating effort” with a blank line before the supporting paragraphs.</p>
        {built&&<p className="muted">Building replaces this unit's learning content. The last {MAX_UNIT_HISTORY} versions stay restorable from the version list above. Learner work is retained.</p>}
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
          <label className="unit-settings-row"><span className="unit-settings-copy"><strong>Build tabs with OpenAI web research</strong><span>Use OpenAI web research to build the logbook, evaluation and activities.</span></span><input className="unit-ai-switch" type="checkbox" role="switch" checked={ai} disabled={!!busy} onChange={e=>setAi(e.target.checked)}/></label>
        </div>
        <p className="muted">Lessons keep your source text. When AI is enabled, OpenAI researches the unit standard online and uses your activity, self-assessment and logbook content to create the matching tabs, evaluation and lesson plan. The lesson plan can be replaced with your own schedule on the Lesson plan tab.</p>
        {confirmBuild&&!busy&&<p className="unit-confirm" role="alert">Rebuilding replaces every tab of US {unit.us} with the content above. The current version stays restorable for the next {MAX_UNIT_HISTORY} builds.</p>}
        <button type="button" className="btn unit-build-action" disabled={!!busy||source.trim().length<100||(ai&&(!activityBlocks.some(block=>block.text.trim())||!selfAssessmentContent.trim()||!logbookContent.trim()))} aria-busy={!!busy} style={{"--progress":`${busyProgress}%`} as CSSProperties} onClick={()=>{if(built&&!confirmBuild){setConfirmBuild(true);setError("");setMessage("");return;}setConfirmBuild(false);void build();}}><span>{busy?`Creating ${busyProgress}%`:!built?"Build complete unit standard":confirmBuild?"Yes, replace the saved unit":"Rebuild complete unit standard"}</span></button>
        {confirmBuild&&!busy&&<button type="button" className="btn ghost" onClick={()=>setConfirmBuild(false)}>Cancel</button>}
      </>}
      <button type="button" className="btn ghost" disabled={!!busy} onClick={()=>{setOpen(false);setDraft(null);}}>Close</button>
    </div>}
    {busy&&<p role="status">{busy}</p>}{message&&<p role="status">{message}</p>}{warning&&<p role="status">{warning}</p>}{error&&<p role="alert" className="auth-error">{error}</p>}
  </section>;
}

/** Save one replaced part of a built unit (lesson plan, logbook), rebuilding the exported files. */
async function publishUnitPart(unit:UnitStandard,built:BuiltUnitVersion,next:UnitContent,setBusy:(text:string)=>void,extra:{planSource?:string}={}):Promise<void>{
  validateUnitContent(next);
  setBusy("Rebuilding the PDF, PowerPoint and answer guide…");
  const files=await makeUnitExports(unit,next);
  setBusy("Saving…");
  const prefix=`shared/unitbuilder/${courseScopedUnit(unit.us)}`;
  const [pdf,pptx,answers]=await Promise.all([uploadFile(prefix,files.pdf),uploadFile(prefix,files.pptx),uploadFile(prefix,files.answers)]);
  await saveBuiltUnit(unit.us,{revision:crypto.randomUUID(),createdAt:new Date().toISOString(),source:built.source,content:next,files:{pdf,pptx,answers,material:built.files.material,materialEditable:built.files.materialEditable},aiUsed:built.aiUsed,planSource:extra.planSource??built.planSource});
}

/** Replace only the lesson plan of a built unit from pasted facilitator notes. */
export function LessonPlanBuilder({unit,content}:{unit:UnitStandard;content?:UnitContent}) {
  const built=useBuiltUnit(unit.us);
  const [open,setOpen]=useState(false);
  const [planSource,setPlanSource]=useState("");
  const [loaded,setLoaded]=useState("");
  const [busy,setBusy]=useState("");
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const [fileName,setFileName]=useState("");
  const [preview,setPreview]=useState<UnitContent["lessonPlan"]>(undefined);
  useEffect(()=>{
    if(!built||loaded===built.revision)return;
    setPlanSource(built.planSource??"");
    setLoaded(built.revision);
  },[built?.revision,built?.planSource,loaded]);
  const base=content??built?.content;
  if(!built||!base)return null;
  const planStats=(plan:NonNullable<UnitContent["lessonPlan"]>)=>{
    const rows=plan.sections.flatMap(section=>section.rows);
    const minutes=rows.reduce((total,row)=>total+(parseInt(row.time??"",10)||0),0);
    return `${plan.sections.length} section${plan.sections.length===1?"":"s"} · ${rows.length} activities · ${Math.floor(minutes/60)} h ${minutes%60} min`;
  };
  const parsePlan=()=>{
    const text=planSource.trim();
    if(!text)throw new Error("Paste the lesson plan content first.");
    if(text.length>MAX_LESSON_PLAN_LENGTH)throw new Error("Shorten the lesson plan content (maximum 40,000 characters).");
    const plan=lessonPlanFromSource(unit,text);
    if(!plan)throw new Error('No lesson plan activities were found. Start each activity on its own line, for example "20 min | Meet, Greet & Seat".');
    return plan;
  };
  const save=async()=>{
    setError("");setMessage("");
    try{
      const plan=parsePlan();
      await publishUnitPart(unit,built,{...structuredClone(base),lessonPlan:plan},setBusy,{planSource:planSource.trim()});
      setPreview(undefined);setMessage(`Lesson plan saved — ${planStats(plan)}. The previous version stays restorable from the builder.`);setOpen(false);
    }catch(e){setError(e instanceof Error?e.message:"The lesson plan could not be saved. The current plan is unchanged.");}
    finally{setBusy("");}
  };
  return <section className="unit-builder">
    <div className="unit-builder-bar">
      <button type="button" className="btn ghost" disabled={!!busy} onClick={()=>{setOpen(!open);setError("");setPreview(undefined);}}><Icon name="presenter" size={16}/>{open?"Close lesson plan builder":"Build lesson plan from notes"}</button>
    </div>
    {open&&<div className="unit-builder-panel">
      <h2>Lesson plan · US {unit.us}</h2>
      <p>Paste the facilitator schedule for this unit. It replaces the plan below exactly as written — the rest of the unit is untouched.</p>
      <div className="unit-settings-card">
        <div className="unit-settings-row"><div className="unit-settings-copy"><strong>Import lesson plan</strong><span>{fileName||"TXT, Markdown, PDF, DOCX or PPTX"}</span></div>
          <label className="unit-import-button"><span>Choose file</span><input aria-label="Import lesson plan" type="file" accept=".txt,.md,.pdf,.docx,.pptx" disabled={!!busy} onChange={async e=>{const file=e.target.files?.[0];e.target.value="";if(!file)return;setBusy("Reading lesson plan document…");setError("");try{setPlanSource(await importUnitSource(file));setFileName(file.name);setPreview(undefined);}catch(err){setError(String(err));}finally{setBusy("");}}}/></label>
        </div>
        <label className="unit-source-field"><strong>Lesson plan content</strong><span>Import the Word (.docx) or PDF facilitator guide — the Time / Activity / Resources table is read row by row, including bulleted steps and resource cells such as “LM p4-6”. You can also paste straight from Word. Otherwise start each activity on a new line with its time (“20 min | Meet, Greet &amp; Seat” or “09:00 – 09:20 Meet, Greet &amp; Seat”), and use “# ” for a section heading.</span><textarea rows={12} value={planSource} maxLength={MAX_LESSON_PLAN_LENGTH} disabled={!!busy} onChange={e=>{setPlanSource(e.target.value);setPreview(undefined);}} placeholder={"Title: Facilitator Preparation\nDate: Friday, 17 July 2026\nVenue: Investec, Sandton\nFacilitator: Andre Snell\nPrep:\n- Study the notes in this lesson plan before class.\n\n# Unit Standard "+unit.us+"\n09:00 – 09:20 | Meet, Greet & Seat\nLearners sign the class register and settle.\nResources: Class Register, LM p1\n\n45 min | Introduction — Facilitator & Class\n- Read through the learner material and facilitate discussion.\nResources: LM p4\n\n10 min | Break"}/></label>
      </div>
      {preview&&<div className="unit-confirm">
        <strong>{preview.title}</strong> — {planStats(preview)}
        <ul className="plan-preview">{preview.sections.map((section,index)=><li key={index}>{section.heading??"Session set-up"}: {section.rows.map(row=>`${row.time?`${row.time} · `:""}${row.title}`).join(" • ")}</li>)}</ul>
      </div>}
      <button type="button" className="btn ghost" disabled={!!busy||!planSource.trim()} onClick={()=>{setError("");setMessage("");try{setPreview(parsePlan());}catch(e){setPreview(undefined);setError(e instanceof Error?e.message:String(e));}}}>Preview plan</button>
      <button type="button" className="btn unit-build-action" disabled={!!busy||!planSource.trim()} aria-busy={!!busy} onClick={()=>void save()}><span>{busy?"Saving…":"Save lesson plan"}</span></button>
      <button type="button" className="btn ghost" disabled={!!busy} onClick={()=>{setOpen(false);setPreview(undefined);}}>Close</button>
    </div>}
    {busy&&<p role="status">{busy}</p>}{message&&<p role="status">{message}</p>}{error&&<p role="alert" className="auth-error">{error}</p>}
  </section>;
}

/** Replace only the logbook of a built unit from a pasted, imported or photographed logbook form. */
export function LogbookBuilder({unit,content}:{unit:UnitStandard;content?:UnitContent}) {
  const built=useBuiltUnit(unit.us);
  const [open,setOpen]=useState(false);
  const [source,setSource]=useState("");
  const [busy,setBusy]=useState("");
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const [fileName,setFileName]=useState("");
  const [preview,setPreview]=useState<LogbookSpec|undefined>(undefined);
  const base=content??built?.content;
  if(!built||!base)return null;
  const parse=()=>{
    const text=source.trim();
    if(!text)throw new Error("Paste or import the logbook content first.");
    if(text.length>MAX_LOGBOOK_SOURCE_LENGTH)throw new Error("Shorten the logbook content (maximum 40,000 characters).");
    const spec=logbookFromSource(unit,text);
    if(!spec)throw new Error('No logbook checklist rows were found. Add an "Embedded knowledge questions" or "Practical activities" heading followed by one numbered row per line, for example "1. Explain the purpose of a cost/benefit analysis."');
    return spec;
  };
  const readImages=async(files:FileList|null)=>{
    const selected=Array.from(files??[]).filter(file=>file.type.startsWith("image/"));
    if(!selected.length)return;
    if(selected.length>8){setError("Upload up to 8 logbook images at a time.");return;}
    setError("");setMessage("");setBusy(selected.length===1?"Reading logbook image…":"Reading logbook images…");
    try{
      const images=await Promise.all(selected.map(logbookImageDataUrl));
      const token=(await supabase?.auth.getSession())?.data.session?.access_token;
      const response=await fetch("/api/extract-logbook-image",{method:"POST",headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({images})});
      const result=await response.json();
      if(!response.ok)throw new Error(result.error??"The logbook image could not be read.");
      setSource(current=>[current.trim(),String(result.text??"").trim()].filter(Boolean).join("\n\n"));
      setFileName(selected.map(file=>file.name).join(", "));setPreview(undefined);
      setMessage("Logbook image read. Check the extracted content, then preview or save.");
    }catch(e){setError(e instanceof Error?e.message:"The logbook image could not be read.");}
    finally{setBusy("");}
  };
  const save=async()=>{
    setError("");setMessage("");
    try{
      const spec=parse();
      await publishUnitPart(unit,built,{...structuredClone(base),logbook:spec},setBusy);
      setPreview(undefined);setMessage(`Logbook saved — ${logbookStats(spec)}. The previous version stays restorable from the builder.`);setOpen(false);
    }catch(e){setError(e instanceof Error?e.message:"The logbook could not be saved. The current logbook is unchanged.");}
    finally{setBusy("");}
  };
  return <section className="unit-builder">
    <div className="unit-builder-bar">
      <button type="button" className="btn ghost" disabled={!!busy} onClick={()=>{setOpen(!open);setError("");setMessage("");setPreview(undefined);}}><Icon name="book" size={16}/>{open?"Close logbook builder":"Build logbook from notes"}</button>
    </div>
    {open&&<div className="unit-builder-panel">
      <h2>Logbook · US {unit.us}</h2>
      <p>Import or paste the logbook form for this unit. It replaces the logbook structure below exactly as written — learners' saved entries and the rest of the unit are untouched.</p>
      <div className="unit-settings-card">
        <div className="unit-settings-row"><div className="unit-settings-copy"><strong>Import logbook</strong><span>{fileName||"DOCX, PDF, PPTX, TXT — or photos/scans of the logbook pages"}</span></div>
          <label className="unit-import-button"><span>Choose file</span><input aria-label="Import logbook" type="file" accept=".txt,.md,.pdf,.docx,.pptx" disabled={!!busy} onChange={async e=>{const file=e.target.files?.[0];e.target.value="";if(!file)return;setBusy("Reading logbook document…");setError("");setMessage("");try{setSource(await importUnitSource(file));setFileName(file.name);setPreview(undefined);}catch(err){setError(String(err));}finally{setBusy("");}}}/></label>
          <label className="unit-import-button"><span>Read images</span><input aria-label="Read logbook images" type="file" accept="image/*" multiple disabled={!!busy} onChange={e=>{const files=e.target.files;void readImages(files).finally(()=>{e.target.value="";});}}/></label>
        </div>
        <label className="unit-source-field"><strong>Logbook content</strong><span>Use the section headings “Learner details”, “Project”, “Embedded knowledge questions”, “Practical activities”, “Workplace activities”, “Other activities” and “Project checklist”. Word tables are read row by row — “No | Text | ✓ | | | ✓ | |” keeps the six evidence marks (Workplace: Learner Activity, Logbook Activity, Project · Assessor: Learner Manual, Logbook Activity, Project). Typed rows work too: “1. Explain the purpose of a cost/benefit analysis. ✓ - - ✓ - -”. Lines such as “Assignment: Assignment One”, “Programme: …” and “Unit standard: …” set the headings.</span><textarea rows={12} value={source} maxLength={MAX_LOGBOOK_SOURCE_LENGTH} disabled={!!busy} onChange={e=>{setSource(e.target.value);setPreview(undefined);}} placeholder={"Assignment: Assignment One\nProgramme: Information Technology - Systems Support\nUnit standard: "+unit.us+" - "+unit.title+"\n\nProject\nTime: 30 minutes\nWorkplace project\nApply the unit learning in the workplace and attach the evidence.\nResources: Logbook\n\nEmbedded knowledge questions\n1. Explain the purpose of a cost/benefit analysis. ✓ - - ✓ - -\n2. Describe how to prepare a time estimate.\n\nPractical activities\n3. Prepare a cost estimate for an element of work.\n\nWorkplace activities\n- Estimate a real unit of work at the workplace.\n\nOther activities\nWorkplace project — Attach the completed estimate.\n\nProject checklist\n1. "+unit.us}/></label>
      </div>
      {preview&&<div className="unit-confirm">
        <strong>{preview.assignmentTitle}</strong> — {logbookStats(preview)}
        <ul className="plan-preview">
          <li>Project: {preview.project.time?`${preview.project.time} · `:""}{preview.project.title}{preview.project.resource?` · ${preview.project.resource}`:""}</li>
          <li>Knowledge questions: {preview.knowledgeQuestions.map((row,index)=>`${index+1}. ${row.text}`).join(" • ")}</li>
          <li>Practical activities: {preview.practicalActivities.map((row,index)=>`${preview.knowledgeQuestions.length+index+1}. ${row.text}`).join(" • ")||"—"}</li>
          <li>Workplace activities: {preview.workplaceActivities.join(" • ")||"—"}</li>
          <li>Other activities: {preview.otherActivities.map(item=>item.activity).join(" • ")||"—"}</li>
          <li>Project checklist: {preview.projectChecklist.map(item=>`${item.no}. ${item.name}`).join(" • ")}</li>
        </ul>
      </div>}
      <button type="button" className="btn ghost" disabled={!!busy||!source.trim()} onClick={()=>{setError("");setMessage("");try{setPreview(parse());}catch(e){setPreview(undefined);setError(e instanceof Error?e.message:String(e));}}}>Preview logbook</button>
      <button type="button" className="btn unit-build-action" disabled={!!busy||!source.trim()} aria-busy={!!busy} onClick={()=>void save()}><span>{busy?"Saving…":"Save logbook"}</span></button>
      <button type="button" className="btn ghost" disabled={!!busy} onClick={()=>{setOpen(false);setPreview(undefined);}}>Close</button>
    </div>}
    {busy&&<p role="status">{busy}</p>}{message&&<p role="status">{message}</p>}{error&&<p role="alert" className="auth-error">{error}</p>}
  </section>;
}

export function BuiltUnitDownloads({us,staff}:{us:string;staff:boolean}){
  const built=useBuiltUnit(us);
  const pdfRef=useRef<HTMLInputElement|null>(null);
  const editableRef=useRef<HTMLInputElement|null>(null);
  const [error,setError]=useState("");
  const [busy,setBusy]=useState("");
  const [uploadPct,setUploadPct]=useState<number|null>(null);
  const [materialUrl,setMaterialUrl]=useState<string|null>(null);
  const isPdf=(doc?:PoeDoc)=>!!doc&&(/\.pdf$/i.test(doc.name)||doc.type.includes("pdf"));
  const isEditable=(doc?:PoeDoc)=>!!doc&&(/\.(ppt|pptx)$/i.test(doc.name)||doc.type.includes("presentation"));
  const displayMaterial=isPdf(built?.files.material)?built?.files.material:undefined;
  const editableMaterial=built?.files.materialEditable??(isEditable(built?.files.material)?built?.files.material:built?.files.pptx);
  useEffect(()=>{
    let cancelled=false;
    setMaterialUrl(null);
    if(displayMaterial) void getFileUrl(displayMaterial).then(url=>{ if(!cancelled) setMaterialUrl(url); });
    return()=>{cancelled=true;};
  },[displayMaterial?.path,displayMaterial?.data,displayMaterial?.uploadedAt]);
  if(!built)return null;
  const saveMaterial=async(next:{material?:PoeDoc;materialEditable?:PoeDoc})=>{
    await saveBuiltUnit(us,{revision:crypto.randomUUID(),createdAt:new Date().toISOString(),source:built.source,content:built.content,files:{...built.files,...next},aiUsed:built.aiUsed,planSource:built.planSource});
  };
  const onPdf=async(file:File|undefined)=>{
    if(!file)return;
    if(!/\.pdf$/i.test(file.name)&&!file.type.includes("pdf")){setError("Upload a PDF export for the displayed course material. Upload the editable PowerPoint separately.");return;}
    setError("");setBusy("Uploading course material...");setUploadPct(0);
    try{
      const doc=await uploadFile(`shared/unitbuilder/${courseScopedUnit(us)}/material`,file,setUploadPct);
      await saveMaterial({material:doc,materialEditable:editableMaterial});
    }catch(e){setError(e instanceof Error?e.message:"The course material could not be uploaded.");}
    finally{setBusy("");setUploadPct(null);}
  };
  const onEditable=async(file:File|undefined)=>{
    if(!file)return;
    if(!/\.(ppt|pptx)$/i.test(file.name)&&!file.type.includes("presentation")){setError("Upload the editable slides as a PowerPoint file (.ppt or .pptx).");return;}
    setError("");setBusy("Uploading editable slides...");setUploadPct(0);
    try{
      const doc=await uploadFile(`shared/unitbuilder/${courseScopedUnit(us)}/material`,file,setUploadPct);
      await saveMaterial({material:displayMaterial,materialEditable:doc});
    }catch(e){setError(e instanceof Error?e.message:"The editable slides could not be uploaded.");}
    finally{setBusy("");setUploadPct(null);}
  };
  return <div className="built-course-material">
    <h2 className="section-title"><span className="ico"><Icon name="play" size={20}/></span>Course material</h2>
    <p className="muted" style={{marginTop:-6,marginBottom:14}}>Course material for this unit standard — displayed exactly as designed, like a PowerPoint presentation. Use the full screen button for presentation mode.</p>
    <div className="deck-chips">
      <button type="button" className="deck-chip active"><Icon name="presenter" size={15}/><span>{displayMaterial?.name.replace(/\.pdf$/i,"")||editableMaterial?.name.replace(/\.(ppt|pptx)$/i,"")||`US ${us} course material`}</span></button>
    </div>
    <div className="unit-builder-bar built-material-actions">
      {displayMaterial&&<button type="button" className="btn ghost dl-sample plan-ppt" onClick={()=>void downloadDoc(displayMaterial).catch(()=>setError("The file could not be downloaded. Please retry."))}><Icon name="download" size={15}/>Download this file</button>}
      {editableMaterial&&<button type="button" className="btn ghost dl-sample plan-ppt" onClick={()=>void downloadDoc(editableMaterial).catch(()=>setError("The editable slides could not be downloaded. Please retry."))}><Icon name="download" size={15}/>Editable slides (.pptx)</button>}
      {staff&&<button type="button" className="btn ghost dl-sample plan-ppt" disabled={!!busy} onClick={()=>pdfRef.current?.click()}><Icon name="presenter" size={15}/>{displayMaterial?"Replace with my version (.pdf)":"Upload course material (.pdf)"}</button>}
      {staff&&<button type="button" className="btn ghost dl-sample plan-ppt" disabled={!!busy} onClick={()=>editableRef.current?.click()}><Icon name="download" size={15}/>{editableMaterial?"Replace editable slides (.pptx)":"Upload editable slides (.pptx)"}</button>}
      {staff&&(displayMaterial||editableMaterial)&&<button type="button" className="btn ghost dl-sample plan-ppt" disabled={!!busy} onClick={()=>void saveMaterial({material:undefined,materialEditable:undefined}).catch(e=>setError(e instanceof Error?e.message:"The course material could not be removed."))}><Icon name="close" size={14}/>Remove</button>}
    </div>
    <input ref={pdfRef} type="file" hidden accept=".pdf,application/pdf" onChange={e=>{const file=e.target.files?.[0];e.target.value="";void onPdf(file);}}/>
    <input ref={editableRef} type="file" hidden accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation" onChange={e=>{const file=e.target.files?.[0];e.target.value="";void onEditable(file);}}/>
    {uploadPct!==null&&<div className="upload-progress plan-upload-progress" role="progressbar" aria-valuenow={uploadPct}><div className="track"><div className="fill" style={{width:`${uploadPct}%`}}/></div><span className="pct">Uploading... {uploadPct}%</span></div>}
    {!displayMaterial&&<p className="muted built-material-empty">{staff?"Upload the PDF export of your slides to show the presentation here. You can also upload the editable PowerPoint source.":"No course material has been uploaded for this built unit yet."}</p>}
    {displayMaterial&&(materialUrl?<SlideViewer src={materialUrl} allowDownload={staff}/>:<p className="muted">Loading course material...</p>)}
    {busy&&<p role="status">{busy}</p>}{error&&<p role="alert" className="auth-error">{error}</p>}
  </div>;
}
