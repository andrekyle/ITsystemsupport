import { useState, useRef } from "react";
import { Select } from "./Select";
import { plainSlideText } from "../lib/slideRichText";
import { EditingTools, useInlineEditing } from "./EditingSidebar";
import { Icon } from "../icons";

const names: Record<string,string> = {lesson:"Lesson sections",exercises:"Practical activities",questionSessions:"Knowledge activities",assignments:"Assignments",quiz:"Quiz questions",logbook:"Logbook",selfAssessment:"Self assessment",studyNotes:"Study notes",lessonPlan:"Lesson plan",evaluation:"Evaluation",q:"Question",answer:"Correct answer",explain:"Answer explanation",prep:"Preparation",steps:"Instructions",marks:"Evidence coverage",n:"Lesson number",sections:"Lesson plan sections",rows:"Lesson plan rows",items:"Self-assessment items",questions:"Evaluation questions",scenario:"Scenario paragraphs",requirements:"Requirements",evidence:"Evidence",customTabs:"Custom tabs",editableDocuments:"Editable documents",practicalTask:"Practical task",quizzes:"Additional quizzes",saqa:"SAQA details",workbook:"Learner workbook",notes:"Unit notes",paragraphs:"Paragraphs",bullets:"Bullets",options:"Answer options"};
/** Human-readable label for a content key, e.g. `questionSessions` → "Knowledge activities". */
export function fieldLabel(key:string) { return names[key] ?? key.replace(/([A-Z])/g," $1").replace(/^./,c=>c.toUpperCase()); }
const label = fieldLabel;
type Value = string | number | boolean | null | Value[] | { [key:string]: Value };
type Fields = { [key:string]: Value };
const HIDDEN_KEYS = ["id","icon","flat","quizGate"];
function visibleEntries(value:Fields):[string,Value][] { return Object.entries(value).filter(([key,item])=>item!==undefined&&!HIDDEN_KEYS.includes(key)); }
/** Top-level sections of a content object, used for outline navigation. */
export function contentSections(value:unknown):{key:string;label:string;count:number|null}[] {
  if(!value||typeof value!=="object"||Array.isArray(value)) return [];
  return visibleEntries(value as Fields).map(([key,item])=>({key,label:label(key),count:Array.isArray(item)?item.length:null}));
}
function duplicate(value:Value):Value {
  if(Array.isArray(value)) return value.map(duplicate);
  if(value && typeof value==="object") return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,k==="id"?`manual-${crypto.randomUUID()}`:duplicate(v)]));
  return value;
}


function blankFor(name: string): Value {
  const key = name.replace(/\s+\d+$/, "").toLowerCase();
  if (/^modules$/.test(key)) return { id: `module-${crypto.randomUUID()}`, name: "New module", icon: "book", activities: 0, units: [] };
  if (/^units$/.test(key)) return { us: `unit-${crypto.randomUUID().slice(0, 8)}`, title: "New unit", nqf: 5, credits: 0, dates: "", time: "09h00 - 14h00" };
  if (/customtabs/.test(key)) return { id: `custom-${crypto.randomUUID()}`, title: "New tab", text: "Add content here." };
  if (/^quizzes$/.test(key)) return { id: `quiz-${crypto.randomUUID()}`, title: "New quiz", questions: [blankFor("quiz")] };
  if (/^lesson$|lesson sections/.test(key)) return { heading: "New lesson", paragraphs: ["Add lesson content here."] };
  if (/practical activities|knowledge activities|exercises|questionsessions/.test(key)) return {
    id: `manual-${crypto.randomUUID()}`,
    title: "New activity",
    task: "Time: 45 minutes - Activity: Self & Group",
    scenario: ["Add the activity instructions here."],
    steps: ["Add the first question or instruction."],
    checks: [{ answer: ["Add the model answer."], concepts: [["keyword"]], labels: ["Key idea"], min: 1 }],
    modelAnswer: [{ heading: "Facilitator reference", paragraphs: ["Add the facilitator model answer."], bullets: [] }],
  };
  if (/assignments/.test(key)) return { id: `manual-${crypto.randomUUID()}`, title: "New assignment", brief: "Add the assignment brief.", requirements: ["Add a requirement."], evidence: "Describe the evidence learners must submit." };
  if (/quiz questions|quiz/.test(key)) return { q: "New question", options: ["Option 1", "Option 2", "Option 3", "Option 4"], answer: 0, explain: "Explain the correct answer." };
  if (/lesson plan sections|sections/.test(key)) return { heading: "New section", rows: [blankFor("rows")] };
  if (/lesson plan rows|rows/.test(key)) return { time: "10 min", title: "New lesson activity", text: ["Describe what the facilitator and learners do."], bullets: [], resources: [] };
  if (/details/.test(key)) return { icon: "info", label: "Detail", value: "Value" };
  if (/study notes/.test(key)) return { title: "New note", text: "Add study note text." };
  if (/registration/.test(key)) return { label: "Label", value: "Value" };
  if (/projectchecklist/.test(key)) return { no: "1", name: "Checklist item" };
  if (/knowledgequestions|practicalactivities/.test(key)) return { text: "New checklist item", marks: [true, false, false, true, false, false] };
  if (/otheractivities/.test(key)) return { activity: "New activity", evidence: "Evidence required" };
  if (/concepts/.test(key)) return ["keyword"];
  if (/marks/.test(key)) return false;
  return "New item";
}

function addTemplate(name: string, current: Value): Value {
  if (/^(modules|units|customTabs)$/i.test(name)) return blankFor(name);
  const blank = blankFor(name);
  if (current === "" || current === null || (Array.isArray(current) && current.length === 0)) return blank;
  return duplicate(current);
}

function clean(text:string) { return plainSlideText(text).replace(/\s+/g," ").trim(); }
const TITLE_KEYS = ["title","heading","q","name","label","text","activity","value"];
/** Short plain-text title for a list entry, taken from its most descriptive field. */
function itemTitle(entry:Value):string {
  if(!entry||typeof entry!=="object"||Array.isArray(entry)) return "";
  for(const key of TITLE_KEYS){
    const item=entry[key];
    if(typeof item!=="string") continue;
    const text=clean(item);
    if(text) return text.length>120?`${text.slice(0,117).trimEnd()}…`:text;
  }
  return "";
}
function singular(text:string) {
  const lower=text.toLowerCase();
  if(/ies$/.test(lower)) return lower.replace(/ies$/,"y");
  if(/[^s]s$/.test(lower)) return lower.replace(/s$/,"");
  return lower;
}
function textRows(text:string) { return Math.min(8,Math.max(2,Math.ceil(text.length/100))); }

type EditorProps = {value:Value;onChange:(value:Value)=>void;name?:string;defaultOpen?:boolean;active?:boolean;disabled?:boolean};

/** Field editor for every generated tab; no code or JSON knowledge required. */
export function UnitContentEditor(props:EditorProps) {
  const inline=useInlineEditing();
  return inline?<InlineEditor {...props}/>:<SidebarEditor {...props}/>;
}

/* ---------- Inline mode: full-screen editor with sections, cards and row actions ---------- */

function InlineEditor({value,onChange,name="Unit content",disabled=false}:EditorProps) {
  if(Array.isArray(value)) return <div className="unit-editor-root"><InlineList name={name} value={value} disabled={disabled} onChange={onChange}/></div>;
  if(value&&typeof value==="object") return <div className="unit-editor-root">
    {visibleEntries(value).map(([key,item])=><section className="unit-editor-section" data-unit-section={key} key={key}>
      <header className="unit-editor-section-head">
        <h3>{label(key)}</h3>
        {Array.isArray(item)&&<span className="unit-editor-count">{item.length}</span>}
      </header>
      <InlineValue name={key} value={item} disabled={disabled} bare onChange={next=>onChange({...value,[key]:next})}/>
    </section>)}
  </div>;
  return <div className="unit-editor-root"><InlineField name={name} value={value} disabled={disabled} onChange={onChange}/></div>;
}

function InlineValue({name,value,disabled,onChange,bare=false}:{name:string;value:Value;disabled:boolean;onChange:(value:Value)=>void;bare?:boolean}) {
  if(Array.isArray(value)) return bare?<InlineList name={name} value={value} disabled={disabled} onChange={onChange}/>:<div className="unit-editor-subsection">
    <div className="unit-editor-subsection-head"><span className="unit-editor-field-label">{label(name)}</span><span className="unit-editor-count">{value.length}</span></div>
    <InlineList name={name} value={value} disabled={disabled} onChange={onChange}/>
  </div>;
  if(value&&typeof value==="object") return bare?<InlineFields name={name} value={value} disabled={disabled} onChange={onChange}/>:<InlineGroup name={name} value={value} disabled={disabled} onChange={onChange}/>;
  return <InlineField name={name} value={value} caption={bare?null:undefined} disabled={disabled} onChange={onChange}/>;
}

function InlineFields({name,value,disabled,onChange}:{name:string;value:Fields;disabled:boolean;onChange:(value:Value)=>void}) {
  return <div className="unit-editor-fields">
    {visibleEntries(value).map(([key,item])=>key==="answer"&&Array.isArray(value.options)
      ? <div className="unit-editor-field" key={key}>
          <span className="unit-editor-field-label">Correct answer</span>
          <Select disabled={disabled} ariaLabel={`Correct answer for ${name}`} value={String(item)} options={value.options.map((option,i)=>({value:String(i),label:`${i+1}. ${clean(String(option??""))}`}))} onChange={v=>onChange({...value,answer:Number(v)})}/>
        </div>
      : <InlineValue key={key} name={key} value={item} disabled={disabled} onChange={next=>onChange({...value,[key]:next})}/>)}
  </div>;
}

function InlineGroup({name,value,disabled,onChange}:{name:string;value:Fields;disabled:boolean;onChange:(value:Value)=>void}) {
  const [open,setOpen]=useState(false);
  const title=itemTitle(value);
  return <details className="unit-editor-group" open={open} onToggle={event=>setOpen(event.currentTarget.open)}>
    <summary><Icon name="chevronRight" size={14}/><span>{label(name)}{title?`: ${title}`:""}</span></summary>
    {open&&<div className="unit-editor-group-body"><InlineFields name={name} value={value} disabled={disabled} onChange={onChange}/></div>}
  </details>;
}

function InlineList({name,value,disabled,onChange}:{name:string;value:Value[];disabled:boolean;onChange:(value:Value)=>void}) {
  const [open,setOpen]=useState<Set<number>>(()=>new Set());
  const [confirm,setConfirm]=useState<number|null>(null);
  const cards=value.some(entry=>entry!==null&&typeof entry==="object");
  const one=singular(label(name));
  const oneTitle=one.charAt(0).toUpperCase()+one.slice(1);
  const template=value.length?value[value.length-1]:blankFor(name);
  const remap=(map:(index:number)=>number|null,add?:number)=>setOpen(current=>{
    const next=new Set([...current].map(map).filter((index):index is number=>index!==null));
    if(add!==undefined) next.add(add);
    return next;
  });
  const toggle=(i:number)=>setOpen(current=>{const next=new Set(current);if(next.has(i))next.delete(i);else next.add(i);return next;});
  const move=(i:number,j:number)=>{const next=[...value];[next[i],next[j]]=[next[j],next[i]];onChange(next);remap(k=>k===i?j:k===j?i:k);setConfirm(null);};
  const remove=(i:number)=>{onChange(value.filter((_,j)=>j!==i));remap(k=>k===i?null:k>i?k-1:k);setConfirm(null);};
  const insert=(i:number,entry:Value)=>{onChange([...value.slice(0,i),entry,...value.slice(i)]);remap(k=>k>=i?k+1:k,i);setConfirm(null);};
  const actions=(i:number,itemName:string)=>confirm===i
    ? <div className="unit-editor-item-actions unit-editor-item-confirm" role="group" aria-label={`Remove ${itemName}`}>
        <span>Remove this {one}?</span>
        <button type="button" className="unit-editor-text-btn danger" onClick={()=>remove(i)}>Remove</button>
        <button type="button" className="unit-editor-text-btn" onClick={()=>setConfirm(null)}>Keep</button>
      </div>
    : <div className="unit-editor-item-actions" role="group" aria-label={`${itemName} actions`}>
        <button type="button" className="unit-editor-icon-btn" title="Move up" aria-label={`Move ${itemName} up`} disabled={disabled||i===0} onClick={()=>move(i,i-1)}><Icon name="chevronUp" size={15}/></button>
        <button type="button" className="unit-editor-icon-btn" title="Move down" aria-label={`Move ${itemName} down`} disabled={disabled||i===value.length-1} onClick={()=>move(i,i+1)}><Icon name="chevronDown" size={15}/></button>
        {cards&&<button type="button" className="unit-editor-icon-btn" title="Duplicate" aria-label={`Duplicate ${itemName}`} disabled={disabled} onClick={()=>insert(i+1,duplicate(value[i]))}><Icon name="copy" size={15}/></button>}
        <button type="button" className="unit-editor-icon-btn danger" title="Remove" aria-label={`Remove ${itemName}`} disabled={disabled} onClick={()=>setConfirm(i)}><Icon name="trash" size={15}/></button>
      </div>;
  return <div className="unit-editor-list">
    {cards&&value.length>1&&<div className="unit-editor-list-tools">
      <button type="button" className="unit-editor-text-btn" onClick={()=>setOpen(new Set(value.map((_,i)=>i)))}>Expand all</button>
      <button type="button" className="unit-editor-text-btn" onClick={()=>setOpen(new Set())}>Collapse all</button>
    </div>}
    {value.length===0&&<p className="unit-editor-empty">No {label(name).toLowerCase()} yet.</p>}
    {value.map((entry,i)=>{
      const itemName=`${oneTitle} ${i+1}`;
      if(entry!==null&&typeof entry==="object"){
        const expanded=open.has(i);
        const title=itemTitle(entry);
        return <article key={i} className={`unit-editor-card${expanded?" is-open":""}`}>
          <div className="unit-editor-card-head">
            <button type="button" className="unit-editor-card-toggle" aria-expanded={expanded} onClick={()=>toggle(i)}>
              <Icon name="chevronRight" size={14}/>
              <span className="unit-editor-index">{i+1}</span>
              <span className="unit-editor-card-title">{title||itemName}</span>
            </button>
            {actions(i,itemName)}
          </div>
          {expanded&&<div className="unit-editor-card-body">
            {Array.isArray(entry)
              ? <InlineList name={`${itemName} entries`} value={entry} disabled={disabled} onChange={next=>onChange(value.map((v,j)=>j===i?next:v))}/>
              : <InlineFields name={itemName} value={entry} disabled={disabled} onChange={next=>onChange(value.map((v,j)=>j===i?next:v))}/>}
          </div>}
        </article>;
      }
      return <div key={i} className="unit-editor-line">
        <span className="unit-editor-index">{i+1}</span>
        <InlineField name={itemName} value={entry} caption={typeof entry==="boolean"?undefined:null} disabled={disabled} onChange={next=>onChange(value.map((v,j)=>j===i?next:v))}/>
        {actions(i,itemName)}
      </div>;
    })}
    <button type="button" className="unit-editor-add" disabled={disabled} onClick={()=>insert(value.length,addTemplate(name,template))}><Icon name="plus" size={14}/>Add {one}</button>
  </div>;
}

function InlineField({name,value,caption,disabled,onChange}:{name:string;value:Value;caption?:string|null;disabled:boolean;onChange:(value:Value)=>void}) {
  const text=caption===undefined?label(name):caption;
  if(typeof value==="boolean") return <label className="unit-editor-check"><input type="checkbox" disabled={disabled} checked={value} onChange={e=>onChange(e.target.checked)}/><span>{text??label(name)}</span></label>;
  if(typeof value==="number") return <label className="unit-editor-field unit-editor-field-number">
    {text&&<span className="unit-editor-field-label">{text}</span>}
    <input type="number" className="unit-editor-input" aria-label={text?undefined:label(name)} disabled={disabled} value={value} onChange={e=>onChange(Number(e.target.value))}/>
  </label>;
  const plain=plainSlideText(String(value??""));
  return <label className="unit-editor-field unit-content-field">
    {text&&<span className="unit-editor-field-label">{text}</span>}
    <textarea className="unit-editor-textarea" aria-label={text?undefined:label(name)} disabled={disabled} rows={textRows(plain)} value={plain} onChange={e=>onChange(e.target.value)}/>
  </label>;
}

/* ---------- Sidebar mode: fields on the page, list actions in the editing sidebar ---------- */

function SidebarEditor({value,onChange,name="Unit content",defaultOpen=false,active=true,disabled=false}:EditorProps) {
  const template=useRef<Value>(Array.isArray(value)&&value.length?value[value.length-1]:blankFor(name));
  const [expanded, setExpanded] = useState(defaultOpen);
  if(Array.isArray(value)) template.current=value.length?value[value.length-1]:blankFor(name);
  if(Array.isArray(value)) return <div className="unit-editor-array">
    {value.map((entry,i)=><div className="unit-editor-item" key={i}>
      <SidebarEditor name={`${label(name)} ${i+1}`} value={entry} active={active} disabled={disabled} onChange={next=>onChange(value.map((v,j)=>j===i?next:v))} />
      <EditingTools active={active} title={`${label(name)} ${i + 1}`}><div className="unit-editor-actions">
        <button type="button" className="btn ghost sm" disabled={disabled || i===0} onClick={()=>{const next=[...value];[next[i-1],next[i]]=[next[i],next[i-1]];onChange(next);}}>Move up</button>
        <button type="button" className="btn ghost sm" disabled={disabled} onClick={()=>onChange(value.filter((_,j)=>j!==i))}>Remove</button>
      </div>
      </EditingTools>
    </div>)}
    <EditingTools active={active} title={label(name)}>
    <button type="button" className="btn ghost sm" disabled={disabled} onClick={()=>onChange([...value,addTemplate(name,template.current)])}>Add {label(name).toLowerCase()}</button>
    </EditingTools>
  </div>;
  if(value && typeof value==="object") return <details className="unit-editor-group" open={expanded} onToggle={event => setExpanded(event.currentTarget.open)}><summary>{label(name)}{typeof value.title==="string"?`: ${plainSlideText(value.title).replace(/\s+/g, " ").trim()}`:typeof value.heading==="string"?`: ${plainSlideText(value.heading).replace(/\s+/g, " ").trim()}`:""}</summary>
    {Object.entries(value).filter(([key,item])=>item!==undefined&&!["id","icon","flat","quizGate"].includes(key)).map(([key,item])=><div key={key}>
      {key==="answer" && Array.isArray(value.options) ? <EditingTools active={active && expanded} title={`${label(name)} answer`}><div className="field"><label>Correct answer</label><Select disabled={disabled} ariaLabel="Correct answer" value={String(item)} options={value.options.map((o,i)=>({value:String(i),label:`${i+1}. ${o}`}))} onChange={v=>onChange({...value,answer:Number(v)})}/></div></EditingTools> : <SidebarEditor name={key} value={item} active={active && expanded} disabled={disabled} onChange={next=>onChange({...value,[key]:next})}/>}
    </div>)}
  </details>;
  if(typeof value==="boolean") return <label className="unit-editor-check"><input type="checkbox" disabled={disabled} checked={value} onChange={e=>onChange(e.target.checked)}/>{label(name)}</label>;
  if(typeof value==="number") return <label className="field">{label(name)}<input type="number" disabled={disabled} value={value} onChange={e=>onChange(Number(e.target.value))}/></label>;
  return <label className="field unit-content-field">{label(name)}<textarea disabled={disabled} rows={Math.min(8,Math.max(2,Math.ceil(plainSlideText(String(value??"")).length/100)))} value={plainSlideText(String(value??""))} onChange={e=>onChange(e.target.value)}/></label>;
}
