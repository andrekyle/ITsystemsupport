import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import type { LogbookSpec, PoeDoc, UnitContent, UnitStandard } from "../types";
import type { LessonEdits } from "../store";
import { buildUnitContent, validateUnitContent, lessonPlanFromSource, MAX_SOURCE_LENGTH, MAX_LESSON_PLAN_LENGTH, mergeUnitContentEnhancement } from "../lib/unitBuilder";
import { logbookFromSource, logbookStats, MAX_LOGBOOK_SOURCE_LENGTH } from "../lib/logbookBuilder";
import { useBuiltUnit, useDeletedBuiltUnit, saveBuiltUnit, deleteBuiltUnit, restoreDeletedBuiltUnit } from "../lib/useBuiltUnit";
import { unitHistory, unitVersionArchive, MAX_UNIT_HISTORY, type BuiltUnitVersion, type UnitSourceDocuments } from "../lib/builtUnits";
import { importUnitSource } from "../lib/unitSourceImport";
import { importUnitPdf } from "../lib/unitPdfImport";
import { storeUnitReplicaPages } from "../lib/forms";
import { makeUnitExports } from "../lib/unitExports";
import { createAiPresentation, type AiPresentationSlide } from "../lib/aiPresentation";
import { plainSlideText } from "../lib/slideRichText";
import { downloadDoc, getFileUrl, uploadFile } from "../lib/files";
import { supabase } from "../lib/supabase";
import { loadContentModel, loadPresentationModel, recordTokenUsage } from "../lib/tokens";
import { UnitContentEditor, contentSections } from "./UnitContentEditor";
import { Select } from "./Select";
import { SlideViewer } from "./SlideViewer";
import { Icon } from "../icons";
import "./unit-builder.css";
import { courseScopedUnit } from "../lib/courseScope";
import { flushLessonEdits } from "../lib/lessonEditStore";
import { isStaleChunkError, recoverFromStaleChunk } from "../lib/chunkRecovery";
import { saveInlineDraft } from "../lib/inlineDraftStorage";
import { EditingTools } from "./EditingSidebar";

async function readApiJson(response: Response, service: string): Promise<any> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    if (!response.ok) throw new Error(`${service} is temporarily unavailable (HTTP ${response.status}). Please retry in a moment.`);
    throw new Error(`${service} returned an unreadable response. Please retry.`);
  }
}

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
    quizRetries:Object.prototype.hasOwnProperty.call(edits,"quizRetriesAll") ? (edits.quizRetriesAll ?? undefined) : edits.quizRetries && Object.prototype.hasOwnProperty.call(edits.quizRetries,si) ? (edits.quizRetries[si] ?? undefined) : s.quizRetries,
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

function unitBuilderError(error: unknown, fallback: string): string {
  if (isStaleChunkError(error)) {
    return recoverFromStaleChunk(error)
      ? "The app was updated while it was open. Reloading the latest version…"
      : "The latest app version is not loaded yet. Refresh this page and try again.";
  }
  return error instanceof Error ? error.message : fallback;
}

type BuilderView="content"|"build"|"files"|"versions"|"delete";
export function UnitBuilder({unit,content,edits,onSaved,inlineDraft,onCancelInline,profileId,inlineActionsTarget,open=true}:{unit:UnitStandard;content?:UnitContent;edits:LessonEdits;onSaved:()=>void;inlineDraft?:UnitContent;onCancelInline:()=>void;profileId:string;inlineActionsTarget?:HTMLElement|null;open?:boolean}) {
  const built=useBuiltUnit(unit.us);
  const deletedBackup=useDeletedBuiltUnit(unit.us);
  const [view,setView]=useState<BuilderView|null>(null);
  const [dirty,setDirty]=useState(false);
  const scrollRef=useRef<HTMLDivElement>(null);
  const [source,setSource]=useState(built?.source??"");
  const [generateLessons,setGenerateLessons]=useState(false);
  const [ai,setAi]=useState(true);
  const [minutes,setMinutes]=useState(300);
  const [activityBlocks,setActivityBlocks]=useState<{heading:string;text:string}[]>([{heading:"",text:""}]);
  const [selfAssessmentContent,setSelfAssessmentContent]=useState("");
  const [logbookContent,setLogbookContent]=useState("");
  const [logbookImageName,setLogbookImageName]=useState("");
  const [practicalTask,setPracticalTask]=useState<UnitContent["practicalTask"]>(content?.practicalTask);
  const [learnerWorkbook,setLearnerWorkbook]=useState<UnitContent["learnerWorkbook"]>(content?.learnerWorkbook);
  const [learnerGuide,setLearnerGuide]=useState<UnitContent["learnerGuide"]>(content?.learnerGuide);
  const [practicalTaskFileName,setPracticalTaskFileName]=useState("");
  const [sourceDocumentFiles,setSourceDocumentFiles]=useState<Partial<Record<keyof UnitSourceDocuments,File>>>({});
  const [editableDocuments,setEditableDocuments]=useState<NonNullable<UnitContent["editableDocuments"]>>(content?.editableDocuments ?? []);
  const hasPdfDocuments=!!(learnerGuide?.replica||learnerWorkbook?.replica||practicalTask?.replica||editableDocuments.some(item=>item.document.replica)||Object.values(built?.files.sourceDocuments??{}).some(Boolean));
  const [busy,setBusy]=useState("");
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const [draft,setDraft]=useState<UnitContent|null>(null);
  const [newTabKind, setNewTabKind] = useState("customTabs");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteName, setDeleteName] = useState("");
  const addTab = () => {
    if (!draft) return;
    setDirty(true);
    if (newTabKind === "customTabs") {
      setDraft({ ...draft, customTabs: [...(draft.customTabs ?? []), { id: `custom-${crypto.randomUUID()}`, title: "New tab", text: "Add your content here." }] });
      return;
    }
    const defaults = buildUnitContent(unit, "# New lesson\n\nAdd the learning objectives, teaching notes and practical examples for this unit. Explain each topic in detail and include instructions for the learners to follow.", { minutes: 300 });
    const key = newTabKind as keyof UnitContent;
    if (key === "practicalTask") {
      setDraft({ ...draft, practicalTask: draft.practicalTask ?? { title: "Practical Task", subtitle: unit.title, notice: "Complete each section and provide the required evidence.", sections: [{ id: "task-1", title: "Practical activity", items: [{ id: "response-1", text: "Describe and complete the practical activity.", responseLabel: "Learner response and evidence" }] }] } });
      return;
    }
    setDraft({ ...draft, [key]: draft[key] ?? defaults[key] ?? (key === "evaluation" ? { intro: "Evaluate this unit", questions: ["What did you learn?"] } : []) });
  };
  const [warning,setWarning]=useState("");
  const [fileName,setFileName]=useState("");
  const [confirmBuild,setConfirmBuild]=useState(false);
  const versions=unitHistory(built);
  const versionLabel=(version:BuiltUnitVersion)=>new Date(version.createdAt).toLocaleString("en-ZA",{dateStyle:"medium",timeStyle:"short"});
  const versionHint=(version:BuiltUnitVersion)=>`${version.content.lesson.length} lesson${version.content.lesson.length===1?"":"s"} · ${version.aiUsed?"AI build":"built-in build"}`;
  const [busyProgress,setBusyProgress]=useState(0);
  const inlineSaveError=(error:unknown)=>{
    if(!isStaleChunkError(error))return error instanceof Error?error.message:"The inline changes could not be saved. Your current content is unchanged.";
    if(!inlineDraft||!saveInlineDraft(profileId,unit.us,inlineDraft))return "The app was updated, but this browser could not preserve the inline draft for a reload. Keep this page open and copy your changes before refreshing.";
    return recoverFromStaleChunk(error)
      ? "The app was updated. Your inline draft is preserved and the latest version is loading…"
      : "Your inline draft is preserved. Refresh this page, then save it again.";
  };
  const finishBusy=(after?:()=>void)=>{
    setBusyProgress(100);
    window.setTimeout(()=>{setBusy("");after?.();},450);
  };
  useEffect(()=>{
    if(built)setSource(built.source);
    setPracticalTask(content?.practicalTask);
    setLearnerWorkbook(content?.learnerWorkbook);
    setLearnerGuide(content?.learnerGuide);
    setEditableDocuments(content?.editableDocuments??[]);
  },[built?.revision,unit.us]);
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
    next=structuredClone(next);
    setBusy("Saving original PDF pages and editable fields...");
    for(const document of [next.learnerGuide,next.learnerWorkbook,next.practicalTask,...(next.editableDocuments??[]).map(item=>item.document)]){
      if(document?.replica)document.replica.pages=await storeUnitReplicaPages(document.replica.pages);
    }
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
      await flushLessonEdits(key,edits);
    }
    const sourceDocuments={...(built?.files.sourceDocuments??{})};
    const sourceEntries=Object.entries(sourceDocumentFiles) as [keyof UnitSourceDocuments,File][];
    if(sourceEntries.length){
      setBusy("Uploading the original unit documentsâ€¦");
      const uploaded=await Promise.all(sourceEntries.map(async([kind,file])=>[kind,await uploadFile(`${prefix}/source-documents`,file)] as const));
      uploaded.forEach(([kind,document])=>{sourceDocuments[kind]=document;});
    }
    await saveBuiltUnit(unit.us,{revision,createdAt:new Date().toISOString(),source:sourceText,content:next,files:{pdf,pptx,answers,material:built?.files.material,materialEditable:built?.files.materialEditable,sourceDocuments:Object.keys(sourceDocuments).length?sourceDocuments:undefined},aiUsed,planSource:built?.planSource});
    setSourceDocumentFiles({});
    setSource(sourceText);setDraft(null);setDirty(false);setMessage("Unit saved. Uploaded PDFs keep their original layout, with editable fields. Tabs and download files are ready.");onSaved();
  };
  const readLogbookImages=async(files: FileList|null)=>{
    const selected=Array.from(files??[]).filter(file=>file.type.startsWith("image/"));
    if(!selected.length)return;
    if(selected.length>8){setError("Upload up to 8 logbook images at a time.");return;}
    setError("");setMessage("");setBusy(selected.length===1?"Reading logbook image�":"Reading logbook images�");
    try{
      const images=await Promise.all(selected.map(logbookImageDataUrl));
      const token=(await supabase?.auth.getSession())?.data.session?.access_token;
      const response=await fetch("/api/extract-logbook-image",{method:"POST",headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({images,model:loadContentModel()}),signal:AbortSignal.timeout(85_000)});
      const result=await readApiJson(response,"The logbook reading service");
      if(!response.ok)throw new Error(result.error??"The logbook image could not be read.");
      setLogbookContent(current=>[current.trim(),String(result.text??"").trim()].filter(Boolean).join("\n\n"));
      setLogbookImageName(selected.map(file=>file.name).join(", "));
      setMessage("Logbook image read. Check the extracted content before building.");
    }catch(e){setError(e instanceof Error?e.message:"The logbook image could not be read.");}
    finally{setBusy("");}
  };
  const build=async()=>{
    setError("");setMessage("");setWarning("");setBusy(!generateLessons?"Preparing original PDF pages and editable fields...":"Building lessons and preserving original PDF documents...");
    try {
      const recoverSourceDocument=async(kind:keyof UnitSourceDocuments)=>{
        const original=built?.files.sourceDocuments?.[kind];
        if(!original)return undefined;
        const url=await getFileUrl(original);
        if(!url)throw new Error(`The saved ${kind==="learnerWorkbook"?"learner workbook":"practical task"} source is unavailable. Upload its PDF again before rebuilding.`);
        const response=await fetch(url);
        if(!response.ok)throw new Error(`The saved source document could not be read (HTTP ${response.status}). Upload it again or retry.`);
        const title={learnerGuide:"Learner Guide",learnerWorkbook:"Learner Workbook",practicalTask:"Practical Task"}[kind];
        return importUnitPdf(new File([await response.blob()],original.name,{type:"application/pdf"}),title);
      };
      const workbook=learnerWorkbook?.replica?learnerWorkbook:await recoverSourceDocument("learnerWorkbook")??learnerWorkbook;
      const practical=practicalTask?.replica?practicalTask:await recoverSourceDocument("practicalTask")??practicalTask;
      const guide=learnerGuide?.replica?learnerGuide:await recoverSourceDocument("learnerGuide")??learnerGuide;
      const documentsOnly=!generateLessons;
      let next:UnitContent=documentsOnly
        ? structuredClone(content??{lesson:[],exercises:[],assignments:[],quiz:[]})
        : buildUnitContent(unit,source,{minutes});
      const preservedWorkbook=!workbook&&unit.us==="114074"&&content?.workbook?structuredClone(content.workbook):undefined;
      if(preservedWorkbook)next.workbook=preservedWorkbook;
      if(practical)next.practicalTask=practical;
      if(workbook){next.learnerWorkbook=workbook;next.workbook=undefined;}
      if(guide)next.learnerGuide=guide;
      next.editableDocuments=editableDocuments;
      // Pasted or photographed logbook content builds the logbook directly; AI output (when on) may refine it.
      const pastedLogbook=generateLessons&&logbookContent.trim()?logbookFromSource(unit,logbookContent):undefined;
      if(pastedLogbook)next.logbook=pastedLogbook;
      if(ai&&!documentsOnly){
        setBusy("Researching the unit standard and creating the tabs with OpenAI...");
        const token=(await supabase?.auth.getSession())?.data.session?.access_token;
        const response=await fetch("/api/enhance-unit-content",{method:"POST",headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({unit,source,minutes,model:loadContentModel(),presentationModel:loadPresentationModel(),lessonStructure:next.lesson.map(section=>({heading:section.heading,paragraphs:section.paragraphs})),activityContent:activityBlocks.map((block,index)=>`Activity ${index+1} heading:\n${block.heading.trim()||`Activity ${index+1}`}\n\nActivity ${index+1} content:\n${block.text.trim()}`).filter(text=>text.trim()).join("\n\n--- ACTIVITY SEPARATOR ---\n\n"),selfAssessmentContent,logbookContent}),signal:AbortSignal.timeout(85_000)});
        const result=await readApiJson(response,"The AI build service");
        if(!response.ok) throw new Error(result.error??"AI generation failed. Turn it off to build entirely with built-in code.");
        next=mergeUnitContentEnhancement(next,result.content,unit);setWarning("");
        if(preservedWorkbook)next.workbook=preservedWorkbook;
        if(result.usage) void recordTokenUsage({us:unit.us,model:result.model??"gpt-4.1-mini",promptTokens:result.usage.input_tokens??result.usage.prompt_tokens??0,completionTokens:result.usage.output_tokens??result.usage.completion_tokens??0,totalTokens:result.usage.total_tokens??0});
      }
      await publish(next,documentsOnly?(built?.source??""):source,documentsOnly?(built?.aiUsed??false):ai);
      doneBusy(()=>select("content"));
    }catch(e){setError(unitBuilderError(e,"The unit could not be built. Your current content is unchanged."));setBusy("");}
  };
  const sourceDocumentName=(kind:keyof UnitSourceDocuments)=>sourceDocumentFiles[kind]?.name??built?.files.sourceDocuments?.[kind]?.name??"PDF up to 20 MB";
  const chooseSourceDocument=async(kind:keyof UnitSourceDocuments,file?:File)=>{
    if(!file)return;
    setError("");setMessage("");
    try{
      setBusy("Keeping original PDF pages and adding editable fields...");
      const title={learnerGuide:"Learner Guide",learnerWorkbook:"Learner Workbook",practicalTask:"Practical Task"}[kind];
      const converted=await importUnitPdf(file,title);
      if(kind==="learnerGuide"){
        setLearnerGuide(converted);
      }else if(kind==="practicalTask"){
        setPracticalTask(converted);setPracticalTaskFileName(file.name);
      }else{
        setLearnerWorkbook(converted);
      }
      setSourceDocumentFiles(current=>({...current,[kind]:file}));
      setMessage(`${file.name}: all ${converted.sourcePageCount} original pages are ready with editable answer areas. The PDF layout has not been changed.`);
    }catch(err){setError(err instanceof Error?err.message:String(err));}
    finally{setBusy("");}
  };
  const createAiDeck=async()=>{
    if(!built||!content)return;
    setError("");setMessage("");setBusy("Creating AI PowerPoint slide content…");
    try{
      const current=effectiveBuiltContent(content,edits);
      const deckSource=current.lesson.map((section,index)=>[
        `Lesson ${index+1}: ${plainSlideText(section.heading)}`,
        ...section.paragraphs.map(plainSlideText),
        ...(section.bullets??[]).map(plainSlideText),
        ...(section.cards??[]).flatMap(card=>[plainSlideText(card.title),plainSlideText(card.text)]),
        ...(section.table?[section.table.headers.map(plainSlideText).join(" | "),...section.table.rows.map(row=>row.map(plainSlideText).join(" | "))]:[]),
        ...(section.example?[plainSlideText(section.example.title),...section.example.lines.map(plainSlideText)]:[]),
        ...(section.examples??[]).flatMap(example=>[plainSlideText(example.title),...example.lines.map(plainSlideText)]),
      ].filter(Boolean).join("\n")).join("\n\n");
      if(deckSource.length<100)throw new Error("Add lesson content before creating an AI PowerPoint.");
      if(deckSource.length>100_000)throw new Error("This unit has more than 100,000 characters of lesson content. Shorten the lesson content before creating an AI PowerPoint.");
      setBusy("Generating an AI PowerPoint from this unit’s lessons…");
      const token=(await supabase?.auth.getSession())?.data.session?.access_token;
      const response=await fetch("/api/generate-ai-presentation",{
        method:"POST",
        headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},
        body:JSON.stringify({us:unit.us,title:unit.title,source:deckSource,model:loadPresentationModel()}),
        signal:AbortSignal.timeout(75_000),
      });
      const result=await readApiJson(response,"The AI PowerPoint service");
      if(!response.ok)throw new Error(result.error??"The AI PowerPoint could not be generated. Please retry.");
      if(!Array.isArray(result.slides)||result.slides.length<4)throw new Error("The AI returned an incomplete presentation. Please retry.");
      const file=await createAiPresentation(unit,result.slides as AiPresentationSlide[]);
      const url=URL.createObjectURL(file);
      const link=document.createElement("a");
      link.href=url;
      link.download=file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(()=>URL.revokeObjectURL(url),1000);
      setMessage(`Downloaded ${file.name}${result.model?` · ${result.model}`:""}. The saved unit files were not changed.`);
    }catch(error){setError(unitBuilderError(error,"The AI PowerPoint could not be created. The current unit is unchanged."));}
    finally{setBusy("");}
  };
  const inlineActions = inlineDraft ? <>
        <button type="button" className="btn ghost" disabled={!!busy} onClick={async()=>{setError("");try{await publish(effectiveBuiltContent(inlineDraft,edits),built?.source??source,built?.aiUsed??false);}catch(e){setError(inlineSaveError(e));}finally{setBusy("");}}}>{busy || "Save inline changes and update files"}</button>
        <button type="button" className="btn ghost" disabled={!!busy} onClick={onCancelInline}>Cancel inline changes</button>
      {inlineActionsTarget && error && <p role="alert" className="auth-error">{error}</p>}
      </> : null;
  const activeView:BuilderView=view??(content?"content":"build");
  const select=(next:BuilderView)=>{setView(next);setError("");setMessage("");setConfirmBuild(false);setConfirmDelete(false);setDeleteName("");};
  const baseline=()=>effectiveBuiltContent(content??{lesson:[],exercises:[],assignments:[],quiz:[]},edits);
  // The structured draft is taken from the live unit each time the editor is shown, unless edits are pending.
  useEffect(()=>{
    if(!open||inlineDraft||activeView!=="content")return;
    if(!draft||!dirty){setDraft(baseline());setDirty(false);}
  },[open,inlineDraft,activeView,built?.revision]);
  const updateDraft=(next:UnitContent)=>{setDraft(next);setDirty(true);};
  const discardDraft=()=>{setDraft(baseline());setDirty(false);setError("");};
  const jumpTo=(key:string)=>scrollRef.current?.querySelector(`[data-unit-section="${key}"]`)?.scrollIntoView({block:"start",behavior:"smooth"});
  const sections=contentSections(draft);
  const restore=async(version:BuiltUnitVersion)=>{setError("");setMessage("");setBusy("Restoring saved version…");try{await saveBuiltUnit(unit.us,unitVersionArchive(version));onSaved();setMessage(`The version saved on ${versionLabel(version)} is now live. The version it replaced is still restorable.`);}catch(e){setError(String(e));}finally{setBusy("");}};
  const navItems:{id:BuilderView;label:string;icon:string;hint:string}[]=[
    {id:"content",label:"Content and structure",icon:"layers",hint:"Edit every tab of this unit"},
    {id:"build",label:built?"Rebuild documents":"Build documents",icon:"document",hint:"Original PDFs, editable fields"},
    ...(built?[
      {id:"files" as const,label:"Files and exports",icon:"download",hint:"PDF, PowerPoint and answer guide"},
      {id:"versions" as const,label:"Version history",icon:"clock",hint:versions.length?`${versions.length} restorable`:"No earlier versions"},
      ...(unit.us==="114046"?[]:[{id:"delete" as const,label:"Delete unit",icon:"trash",hint:"Remove this build"}]),
    ]:[]),
  ];
  const heading={content:"Content and structure",build:built?"Rebuild documents":"Build documents",files:"Files and exports",versions:"Version history",delete:"Delete unit"}[activeView];
  const intro={
    content:dirty?"You have unsaved changes. Saving updates every tab and rebuilds the download files.":"Expand a card to edit it. Saving updates every tab and rebuilds the download files.",
    build:"Upload your PDFs to keep the same documents and make their fields editable. Lesson generation is separate and optional.",
    files:"Regenerate the download files from the content that is live now.",
    versions:`The last ${MAX_UNIT_HISTORY} builds stay restorable.`,
    delete:"Remove this built unit. Learner work is retained.",
  }[activeView];
  const status=(busy||message||warning||error)?<div className={`unit-workspace-status${error?" is-error":""}`}>
    {busy&&<p role="status"><span className="unit-workspace-spinner" aria-hidden="true"/>{busy}</p>}
    {message&&<p role="status">{message}</p>}
    {warning&&<p role="status">{warning}</p>}
    {error&&<p role="alert" className="auth-error">{error}</p>}
    {!busy&&<button type="button" className="unit-editor-icon-btn" aria-label="Dismiss message" onClick={()=>{setMessage("");setWarning("");setError("");}}><Icon name="close" size={14}/></button>}
  </div>:null;
  return <section className="unit-builder">
    {inlineActionsTarget && createPortal(inlineActions, inlineActionsTarget)}
    <div className="unit-workspace">
      <nav className="unit-workspace-nav" aria-label="Unit editor sections">
        <div className="unit-workspace-nav-group">
          {navItems.map(item=><button key={item.id} type="button" className={`unit-workspace-nav-item${activeView===item.id?" is-active":""}${item.id==="delete"?" is-danger":""}`} aria-current={activeView===item.id?"page":undefined} disabled={!!inlineDraft||!!busy} onClick={()=>select(item.id)}>
            <Icon name={item.icon} size={17}/>
            <span className="unit-workspace-nav-copy"><span>{item.label}</span><small>{item.hint}</small></span>
          </button>)}
        </div>
        {activeView==="content"&&!inlineDraft&&sections.length>0&&<div className="unit-workspace-outline">
          <p className="unit-workspace-outline-title">On this page</p>
          {sections.map(section=><button key={section.key} type="button" className="unit-workspace-outline-item" onClick={()=>jumpTo(section.key)}>
            <span>{section.label}</span>{section.count!==null&&<span className="unit-editor-count">{section.count}</span>}
          </button>)}
        </div>}
      </nav>
      <div className="unit-workspace-main">
        <header className="unit-workspace-head">
          <div className="unit-workspace-title">
            <h2>{inlineDraft?"Inline slide changes":heading}</h2>
            <p>{inlineDraft?"Slide text edited on the lesson page is waiting to be saved.":intro}</p>
          </div>
          {activeView==="content"&&!inlineDraft&&draft&&<div className="unit-workspace-head-actions">
            <div className="unit-workspace-add-tab">
              <Select disabled={!!busy} ariaLabel="Tab to add" value={newTabKind} onChange={setNewTabKind} options={[
                { value: "customTabs", label: "Custom content tab" }, { value: "lessonPlan", label: "Lesson plan" },
                { value: "logbook", label: "Logbook" }, { value: "practicalTask", label: "Practical task" }, { value: "selfAssessment", label: "Self assessment" },
                { value: "evaluation", label: "Evaluation" }, { value: "quizzes", label: "Additional quizzes" },
              ]} />
              <button type="button" className="btn ghost" disabled={!!busy} onClick={addTab}><Icon name="plus" size={15}/>Add tab</button>
            </div>
            {dirty&&<button type="button" className="btn ghost" disabled={!!busy} onClick={discardDraft}>Discard changes</button>}
            <button type="button" className="btn unit-build-action unit-workspace-save" disabled={!!busy||!dirty} aria-busy={!!busy} style={{"--progress":`${busyProgress}%`} as CSSProperties} onClick={async()=>{setError("");try{await publish(draft,built?.source??source,built?.aiUsed??false);doneBusy();}catch(e){setError(unitBuilderError(e,"The unit changes could not be saved."));setBusy("");}}}><span>{busy?`Saving ${busyProgress}%`:dirty?"Save all changes and rebuild files":"All changes saved"}</span></button>
          </div>}
        </header>
        <div className="unit-workspace-scroll" ref={scrollRef}>
          {inlineDraft?<div className="unit-workspace-notice">
            <h3>Finish the inline slide changes first</h3>
            <p>Save the slide edits to update every tab and the download files, or cancel them to discard those edits. The structured editor unlocks afterwards.</p>
            {!inlineActionsTarget&&<div className="unit-workspace-notice-actions">{inlineActions}</div>}
          </div>
          :activeView==="content"?(draft?<UnitContentEditor disabled={!!busy} value={draft as never} onChange={v=>updateDraft(v as unknown as UnitContent)}/>:<p className="muted">Preparing the unit content…</p>)
          :activeView==="build"?<div className="unit-builder-panel unit-build-view">
            {!built&&deletedBackup&&<div className="unit-action-card unit-deleted-backup-card">
              <div className="unit-action-card-copy"><h3>Deleted build backup available</h3><p>Restore the saved lessons, learner activities, quizzes and files from the build deleted on {new Date(deletedBackup.createdAt).toLocaleString("en-ZA",{dateStyle:"medium",timeStyle:"short"})}.</p></div>
              <button type="button" className="btn" disabled={!!busy} onClick={()=>{setError("");setBusy("Restoring deleted build…");void restoreDeletedBuiltUnit(unit.us).then(()=>{setMessage("The deleted build has been restored.");onSaved();}).catch(e=>setError(e instanceof Error?e.message:"The deleted build could not be restored.")).finally(()=>setBusy(""));}}><Icon name="refresh" size={15}/>Restore deleted build</button>
            </div>}
            {built&&<p className="muted">Publishing PDFs keeps existing lesson content unless you explicitly enable lesson generation. The last {MAX_UNIT_HISTORY} versions stay restorable from Version history. Learner work is retained.</p>}
            <section className="unit-build-step">
              <header className="unit-build-step-head"><span className="unit-editor-index">1</span><div><h3>Original PDFs with editable fields</h3><p>Keep the same text, tables, branding and page layout. Only add editable answer fields. No redesign or AI rewriting.</p></div></header>
              <div className="unit-settings-card">
                <div className="unit-source-field"><span>Upload blank training documents, up to 20 MB and 250 pages per PDF. Fill &amp; sign lets learners complete additional answer areas.</span>
                  {([[
                    "learnerGuide","Learner Guide PDF","Upload learner guide PDF"
                  ],[
                    "practicalTask","Practical Task PDF","Upload practical task PDF"
                  ],[
                    "learnerWorkbook","Learner Workbook PDF","Upload learner workbook PDF"
                  ]] as [keyof UnitSourceDocuments,string,string][]).map(([kind,label,aria])=><div className="unit-settings-row" key={kind}><span className="unit-settings-copy"><strong>{label}</strong><span>{kind==="practicalTask"?(practicalTaskFileName||sourceDocumentName(kind)):sourceDocumentName(kind)}</span></span><label className="unit-import-button"><span>{built?.files.sourceDocuments?.[kind]||sourceDocumentFiles[kind]?"Replace PDF":"Choose PDF"}</span><input aria-label={aria} type="file" accept="application/pdf,.pdf" disabled={!!busy} onChange={e=>{const file=e.target.files?.[0];e.target.value="";void chooseSourceDocument(kind,file);}}/></label></div>)}
                  {learnerGuide?.replica&&<span className="muted">Learner Guide ready: {learnerGuide.sourcePageCount} original pages with editable fields.</span>}
                  {practicalTask?.replica&&<span className="muted">Practical Task ready: {practicalTask.sourcePageCount} original pages with editable fields.</span>}
                  {learnerWorkbook?.replica&&<span className="muted">Learner Workbook ready: {learnerWorkbook.sourcePageCount} original pages with editable fields. No replacement cover or generated questions.</span>}
                </div>
                <div className="unit-source-field"><strong>Additional editable PDF tabs</strong><span>Each PDF keeps its original pages and layout, with editable fields added in place.</span><div className="unit-settings-row"><span className="unit-settings-copy"><strong>Add another PDF</strong><span>PDF up to 20 MB and 250 pages · multiple documents supported</span></span><label className="unit-import-button"><span>Choose PDF</span><input aria-label="Upload an additional editable PDF" type="file" accept="application/pdf,.pdf" disabled={!!busy} onChange={async e=>{const file=e.target.files?.[0];e.target.value="";if(!file)return;setBusy("Keeping original PDF pages and adding editable fields...");setError("");try{const base=file.name.replace(/\.pdf$/i,"").replace(/^SAQA\s*-?\s*\d+\s*-?\s*/i,"").trim()||"Document";const title=/learner\s*workbook/i.test(base)?"Learner Workbook":/learner\s*guide/i.test(base)?"Learner Guide":/practical/i.test(base)?"Practical Task":base;const document=await importUnitPdf(file,title);const entry={id:crypto.randomUUID(),title,sourceName:file.name,document};setEditableDocuments(current=>[...current,entry]);setMessage(`Added ${file.name}: ${document.sourcePageCount} original pages with editable fields.`);}catch(err){setError(err instanceof Error?err.message:String(err));}finally{setBusy("");}}}/></label></div>{editableDocuments.map(item=><div className="unit-settings-row" key={item.id}><span className="unit-settings-copy"><strong>{item.title}</strong><span>{item.sourceName} · {item.document.sourcePageCount??item.document.sections.length} pages</span></span><button type="button" className="btn ghost sm" disabled={!!busy} onClick={()=>setEditableDocuments(current=>current.filter(document=>document.id!==item.id))}>Remove</button></div>)}</div>
              </div>
            </section>
            <section className="unit-build-step">
              <header className="unit-build-step-head"><span className="unit-editor-index">2</span><div><h3>Optional lesson generation</h3><p>Leave off to publish only the original PDFs above. This separate source text creates lesson slides; it does not change the uploaded unit documents.</p></div></header>
              <div className="unit-settings-card">
                <label className="unit-settings-row"><span className="unit-settings-copy"><strong>Also generate lesson tabs</strong><span>Off by default. Leave off to only add editable fields to your PDFs and keep existing lessons.</span></span><input className="unit-ai-switch" type="checkbox" role="switch" checked={generateLessons} disabled={!!busy} onChange={e=>setGenerateLessons(e.target.checked)}/></label>
                {generateLessons&&<>
                <div className="unit-settings-row"><div className="unit-settings-copy"><strong>Import content</strong><span>{fileName || "TXT, Markdown, PDF, DOCX or PPTX"}</span></div>
                  <label className="unit-import-button"><span>Choose file</span><input aria-label="Import teaching content" type="file" accept=".txt,.md,.pdf,.docx,.pptx" disabled={!!busy} onChange={async e=>{const file=e.target.files?.[0];e.target.value="";if(!file)return;setBusy("Reading source document…");setError("");try{setSource(await importUnitSource(file));setFileName(file.name);}catch(err){setError(String(err));}finally{setBusy("");}}}/></label>
                </div>
                <label className="unit-source-field"><strong>Source content</strong><span>Paste the teaching material for this unit.</span><textarea rows={7} value={source} maxLength={MAX_SOURCE_LENGTH} disabled={!!busy} onChange={e=>setSource(e.target.value)} placeholder={`Paste the content for US ${unit.us} here…`}/></label>
                </>}
              </div>
            </section>
            {generateLessons&&<section className="unit-build-step">
              <header className="unit-build-step-head"><span className="unit-editor-index">3</span><div><h3>Optional supporting content</h3><p>Activity, self-assessment and logbook text applies to lesson generation only.</p></div></header>
              <div className="unit-settings-card">
                <div className="unit-source-field"><strong>Activity and learner workbook content</strong><span>Add each activity in its own box. Include its specific outcome, exact question wording and marks. Every distinct marked question becomes its own learner-workbook answer box; questions under the same specific outcome stay grouped together.</span>
                  {activityBlocks.map((block,index)=><div className="unit-activity-block" key={index}>
                    <div className="unit-activity-block-head"><span className="unit-editor-index">{index+1}</span><strong>Activity {index+1}</strong>
                      <div className="unit-editor-item-actions" role="group" aria-label={`Activity ${index+1} actions`}>
                        <button type="button" className="unit-editor-icon-btn" title="Move up" aria-label={`Move activity ${index+1} up`} disabled={!!busy||index===0} onClick={()=>setActivityBlocks(blocks=>{const next=[...blocks];[next[index-1],next[index]]=[next[index],next[index-1]];return next;})}><Icon name="chevronUp" size={15}/></button>
                        <button type="button" className="unit-editor-icon-btn danger" title="Remove activity" aria-label={`Remove activity ${index+1}`} disabled={!!busy||activityBlocks.length===1} onClick={()=>setActivityBlocks(blocks=>blocks.filter((_,i)=>i!==index))}><Icon name="trash" size={15}/></button>
                      </div>
                    </div>
                    <label>Activity {index+1} heading<input type="text" value={block.heading} disabled={!!busy} onChange={e=>setActivityBlocks(blocks=>blocks.map((item,i)=>i===index?{...item,heading:e.target.value}:item))} placeholder="Example: Specific Outcome 1 — Network access"/></label>
                    <label>Activity {index+1} content<textarea rows={5} value={block.text} disabled={!!busy} onChange={e=>setActivityBlocks(blocks=>blocks.map((item,i)=>i===index?{...item,text:e.target.value}:item))} placeholder={"Example:\nTask 1: Identify physical components of LAN — 5 marks\nTask 2: Define Network Access Control — 5 marks"}/></label>
                  </div>)}
                  <button type="button" className="unit-editor-add" disabled={!!busy} onClick={()=>setActivityBlocks(blocks=>[...blocks,{heading:"",text:""}])}><Icon name="plus" size={14}/>Add another activity</button>
                </div>
                <label className="unit-source-field"><strong>Self-assessment content</strong><span>Paste or describe the competence checklist learners must tick after the lesson.</span><textarea rows={4} value={selfAssessmentContent} disabled={!!busy} onChange={e=>setSelfAssessmentContent(e.target.value)} placeholder="Example: I can prepare a time estimate..., I can explain cost components..., revisit areas needing more practice..."/></label>
                <div className="unit-source-field"><strong>Logbook content</strong><span>Paste the logbook content, or upload clear images of the logbook pages and check the extracted text.</span>
                  <div className="unit-settings-row unit-logbook-import"><span className="unit-settings-copy"><strong>Read logbook image</strong><span>{logbookImageName || "PNG, JPEG or WebP screenshots/photos"}</span></span><label className="unit-import-button"><span>Upload image</span><input aria-label="Upload logbook image" type="file" accept="image/png,image/jpeg,image/webp" multiple disabled={!!busy} onChange={async e=>{const files=e.target.files;e.target.value="";await readLogbookImages(files);}}/></label></div>
                  <label>Logbook text<textarea rows={7} value={logbookContent} disabled={!!busy} onChange={e=>setLogbookContent(e.target.value)} placeholder="Example: embedded knowledge questions with checklist ticks, practical activities, workplace activities, other activities, project evidence and project checklist..."/></label>
                </div>
              </div>
            </section>}
            {generateLessons&&<section className="unit-build-step">
              <header className="unit-build-step-head"><span className="unit-editor-index">4</span><div><h3>Lesson generation settings</h3><p>These settings apply only to separately supplied lesson source text. Uploaded PDFs are never redesigned or rewritten.</p></div></header>
              <div className="unit-settings-card">
                <label className="unit-settings-row"><span className="unit-settings-copy"><strong>Session duration</strong><span>Planned teaching time in minutes.</span></span><input aria-label="Session duration in minutes" className="unit-duration" type="number" min={60} max={2400} value={minutes} disabled={!!busy} onChange={e=>setMinutes(Math.min(2400,Math.max(60,Number(e.target.value))))}/></label>
                <label className="unit-settings-row"><span className="unit-settings-copy"><strong>Build with OpenAI web research</strong><span>Use OpenAI to structure professional lesson slides and build the supporting tabs.</span></span><input className="unit-ai-switch" type="checkbox" role="switch" checked={ai} disabled={!!busy} onChange={e=>setAi(e.target.checked)}/></label>
              </div>
            </section>}
            <div className="unit-build-footer">
              {confirmBuild&&!busy&&<p className="unit-confirm" role="alert">{!generateLessons?"Publish the selected PDFs without changing their layout or replacing existing lessons?":"Rebuild the lessons and supporting content while keeping uploaded PDFs unchanged?"} The current version stays restorable for the next {MAX_UNIT_HISTORY} builds.</p>}
              <div className="unit-build-footer-actions">
                <button type="button" className="btn unit-build-action" disabled={!!busy||(generateLessons?source.trim().length<100:!hasPdfDocuments)} aria-busy={!!busy} style={{"--progress":`${busyProgress}%`} as CSSProperties} onClick={()=>{if(built&&!confirmBuild){setConfirmBuild(true);setError("");setMessage("");return;}setConfirmBuild(false);void build();}}><span>{busy?`Creating ${busyProgress}%`:confirmBuild?"Yes, publish the updated unit":!generateLessons?"Save original PDFs with editable fields":!built?"Build complete unit standard":"Rebuild complete unit standard"}</span></button>
                {confirmBuild&&!busy&&<button type="button" className="btn ghost" onClick={()=>setConfirmBuild(false)}>Cancel</button>}
                {!busy&&<span className="muted">{generateLessons?"Add at least 100 characters of separate lesson source text. Uploaded PDFs remain unchanged.":"Upload PDFs to publish the same documents with editable fields. Lesson generation is off."}</span>}
              </div>
            </div>
          </div>
          :activeView==="files"?<div className="unit-workspace-cards">
            {built&&built.files.sourceDocuments&&Object.values(built.files.sourceDocuments).some(Boolean)&&<div className="unit-action-card">
              <div className="unit-action-card-copy"><h3>Original unit documents</h3><p>The source PDFs uploaded with this build. Replacements are uploaded from Rebuild documents.</p></div>
              <div className="unit-action-card-actions">
                {(["learnerGuide","practicalTask","learnerWorkbook"] as (keyof UnitSourceDocuments)[]).map(kind=>{
                  const document=built.files.sourceDocuments?.[kind];
                  if(!document)return null;
                  const label={learnerGuide:"Learner Guide PDF",practicalTask:"Practical Task PDF",learnerWorkbook:"Learner Workbook PDF"}[kind];
                  return <button type="button" className="btn ghost" key={kind} disabled={!!busy} onClick={()=>void downloadDoc(document).catch(()=>setError(`${label} could not be downloaded. Please retry.`))}><Icon name="download" size={15}/>{label}</button>;
                })}
              </div>
            </div>}
            {built&&<div className="unit-action-card">
              <div className="unit-action-card-copy"><h3>Download files</h3><p>Rebuild the PDF, editable PowerPoint and answer guide from the content that is live now.</p></div>
              <button type="button" className="btn ghost" disabled={!!busy} onClick={async()=>{setError("");try{await publish(effectiveBuiltContent(content??built.content,edits),built.source,built.aiUsed);}catch(e){setError(unitBuilderError(e,"The PDF and PowerPoint could not be updated."));}finally{setBusy("");}}}>Update PDF and PowerPoint</button>
            </div>}
            {built&&content&&<div className="unit-action-card">
              <div className="unit-action-card-copy"><h3>AI PowerPoint</h3><p>Generate a presentation deck from this unit's lessons with AI. It downloads immediately; the saved unit files are not changed.</p></div>
              <button type="button" className="btn ghost" disabled={!!busy} onClick={()=>void createAiDeck()}><Icon name="presenter" size={15}/>{busy?"Creating AI PowerPoint…":"Create AI PowerPoint"}</button>
            </div>}
          </div>
          :activeView==="versions"?(versions.length?<ul className="unit-version-list">{versions.map(version=><li key={version.revision} className="unit-action-card">
            <div className="unit-action-card-copy"><h3>{versionLabel(version)}</h3><p>{versionHint(version)}</p></div>
            <button type="button" className="btn ghost" disabled={!!busy} onClick={()=>void restore(version)}>Restore this version</button>
          </li>)}</ul>:<div className="unit-workspace-notice"><h3>No earlier versions yet</h3><p>Each save or rebuild keeps the previous build here so you can restore it.</p></div>)
          :<div className="unit-action-card is-danger">
            <div className="unit-action-card-copy"><h3>Delete this unit build</h3><p>A recoverable backup is created before the live build is removed. Learner progress and submissions are retained.</p></div>
            <div className="unit-action-card-actions">
              {!confirmDelete&&<button type="button" className="btn ghost danger-text" disabled={!!busy} onClick={()=>{setConfirmDelete(true);setDeleteName("");setError("");setMessage("");}}>Delete unit</button>}
              {confirmDelete&&!busy&&<div className="unit-delete-confirmation">
                <label>Type <strong>{`US ${unit.us}`}</strong> to confirm<input type="text" autoComplete="off" value={deleteName} onChange={event=>setDeleteName(event.target.value)} placeholder={`US ${unit.us}`}/></label>
                <button type="button" className="btn ghost danger-text" disabled={deleteName.trim()!==`US ${unit.us}`} onClick={()=>{setConfirmDelete(false);setBusy("Creating safety backup and deleting unit…");void deleteBuiltUnit(unit.us).then(()=>{setMessage("Unit deleted. A restorable backup is available here.");setDraft(null);setDirty(false);setView("build");onSaved();}).catch(e=>setError(e instanceof Error?e.message:"The unit could not be deleted.")).finally(()=>setBusy(""));}}>Create backup and delete</button>
                <button type="button" className="btn ghost" onClick={()=>{setConfirmDelete(false);setDeleteName("");}}>Cancel</button>
              </div>}
            </div>
          </div>}
        </div>
        {status}
      </div>
    </div>
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
  await saveBuiltUnit(unit.us,{revision:crypto.randomUUID(),createdAt:new Date().toISOString(),source:built.source,content:next,files:{pdf,pptx,answers,material:built.files.material,materialEditable:built.files.materialEditable,sourceDocuments:built.files.sourceDocuments},aiUsed:built.aiUsed,planSource:extra.planSource??built.planSource});
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
    }catch(e){setError(unitBuilderError(e,"The lesson plan could not be saved. The current plan is unchanged."));}
    finally{setBusy("");}
  };
  return <section className="unit-builder">
    {!open && <div className="unit-builder-bar">
      <button type="button" className="btn ghost" disabled={!!busy} onClick={()=>{setOpen(!open);setError("");setPreview(undefined);}}><Icon name="presenter" size={16}/>{open?"Close lesson plan builder":"Build lesson plan from notes"}</button>
    </div>}
    {open&&<div className="unit-builder-panel">
      <h2>Lesson plan · US {unit.us}</h2>
      <p>Paste the facilitator schedule for this unit. It replaces the plan below exactly as written — the rest of the unit is untouched.</p>
      <div className="unit-settings-card">
        <EditingTools active title="Import lesson plan">
        <div className="unit-settings-row"><div className="unit-settings-copy"><strong>Import lesson plan</strong><span>{fileName||"TXT, Markdown, PDF, DOCX or PPTX"}</span></div>
          <label className="unit-import-button"><span>Choose file</span><input aria-label="Import lesson plan" type="file" accept=".txt,.md,.pdf,.docx,.pptx" disabled={!!busy} onChange={async e=>{const file=e.target.files?.[0];e.target.value="";if(!file)return;setBusy("Reading lesson plan document…");setError("");try{setPlanSource(await importUnitSource(file));setFileName(file.name);setPreview(undefined);}catch(err){setError(String(err));}finally{setBusy("");}}}/></label>
        </div>
        </EditingTools>
        <label className="unit-source-field"><strong>Lesson plan content</strong><span>Import the Word (.docx) or PDF facilitator guide — the Time / Activity / Resources table is read row by row, including bulleted steps and resource cells such as “LM p4-6”. You can also paste straight from Word. Otherwise start each activity on a new line with its time (“20 min | Meet, Greet &amp; Seat” or “09:00 – 09:20 Meet, Greet &amp; Seat”), and use “# ” for a section heading.</span><textarea rows={12} value={planSource} maxLength={MAX_LESSON_PLAN_LENGTH} disabled={!!busy} onChange={e=>{setPlanSource(e.target.value);setPreview(undefined);}} placeholder={"Title: Facilitator Preparation\nDate: Friday, 17 July 2026\nVenue: Investec, Sandton\nFacilitator: Andre Snell\nPrep:\n- Study the notes in this lesson plan before class.\n\n# Unit Standard "+unit.us+"\n09:00 – 09:20 | Meet, Greet & Seat\nLearners sign the class register and settle.\nResources: Class Register, LM p1\n\n45 min | Introduction — Facilitator & Class\n- Read through the learner material and facilitate discussion.\nResources: LM p4\n\n10 min | Break"}/></label>
      </div>
      {preview&&<div className="unit-confirm">
        <strong>{preview.title}</strong> — {planStats(preview)}
        <ul className="plan-preview">{preview.sections.map((section,index)=><li key={index}>{section.heading??"Session set-up"}: {section.rows.map(row=>`${row.time?`${row.time} · `:""}${row.title}`).join(" • ")}</li>)}</ul>
      </div>}
      <EditingTools active title={`Lesson plan ${unit.us}`}>
      <button type="button" className="btn ghost" disabled={!!busy||!planSource.trim()} onClick={()=>{setError("");setMessage("");try{setPreview(parsePlan());}catch(e){setPreview(undefined);setError(e instanceof Error?e.message:String(e));}}}>Preview plan</button>
      <button type="button" className="btn unit-build-action" disabled={!!busy||!planSource.trim()} aria-busy={!!busy} onClick={()=>void save()}><span>{busy?"Saving…":"Save lesson plan"}</span></button>
      <button type="button" className="btn ghost" disabled={!!busy} onClick={()=>{setOpen(false);setPreview(undefined);}}>Close</button>
      {error&&<p role="alert" className="auth-error">{error}</p>}
      </EditingTools>
    </div>}
    {busy&&<p role="status">{busy}</p>}{message&&<p role="status">{message}</p>}{!open&&error&&<p role="alert" className="auth-error">{error}</p>}
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
      const response=await fetch("/api/extract-logbook-image",{method:"POST",headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({images,model:loadContentModel()})});
      const result=await readApiJson(response,"The logbook reading service");
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
    }catch(e){setError(unitBuilderError(e,"The logbook could not be saved. The current logbook is unchanged."));}
    finally{setBusy("");}
  };
  return <section className="unit-builder">
    {!open && <div className="unit-builder-bar">
      <button type="button" className="btn ghost" disabled={!!busy} onClick={()=>{setOpen(!open);setError("");setMessage("");setPreview(undefined);}}><Icon name="book" size={16}/>{open?"Close logbook builder":"Build logbook from notes"}</button>
    </div>}
    {open&&<div className="unit-builder-panel">
      <h2>Logbook · US {unit.us}</h2>
      <p>Import or paste the logbook form for this unit. It replaces the logbook structure below exactly as written — learners' saved entries and the rest of the unit are untouched.</p>
      <div className="unit-settings-card">
        <EditingTools active title="Import logbook">
        <div className="unit-settings-row"><div className="unit-settings-copy"><strong>Import logbook</strong><span>{fileName||"DOCX, PDF, PPTX, TXT — or photos/scans of the logbook pages"}</span></div>
          <label className="unit-import-button"><span>Choose file</span><input aria-label="Import logbook" type="file" accept=".txt,.md,.pdf,.docx,.pptx" disabled={!!busy} onChange={async e=>{const file=e.target.files?.[0];e.target.value="";if(!file)return;setBusy("Reading logbook document…");setError("");setMessage("");try{setSource(await importUnitSource(file));setFileName(file.name);setPreview(undefined);}catch(err){setError(String(err));}finally{setBusy("");}}}/></label>
          <label className="unit-import-button"><span>Read images</span><input aria-label="Read logbook images" type="file" accept="image/*" multiple disabled={!!busy} onChange={e=>{const files=e.target.files;void readImages(files).finally(()=>{e.target.value="";});}}/></label>
        </div>
        </EditingTools>
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
      <EditingTools active title={`Logbook ${unit.us}`}>
      <button type="button" className="btn ghost" disabled={!!busy||!source.trim()} onClick={()=>{setError("");setMessage("");try{setPreview(parse());}catch(e){setPreview(undefined);setError(e instanceof Error?e.message:String(e));}}}>Preview logbook</button>
      <button type="button" className="btn unit-build-action" disabled={!!busy||!source.trim()} aria-busy={!!busy} onClick={()=>void save()}><span>{busy?"Saving…":"Save logbook"}</span></button>
      <button type="button" className="btn ghost" disabled={!!busy} onClick={()=>{setOpen(false);setPreview(undefined);}}>Close</button>
      {error&&<p role="alert" className="auth-error">{error}</p>}
      </EditingTools>
    </div>}
    {busy&&<p role="status">{busy}</p>}{message&&<p role="status">{message}</p>}{!open&&error&&<p role="alert" className="auth-error">{error}</p>}
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
