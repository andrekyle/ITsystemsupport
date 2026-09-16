import { useRef } from "react";
import { Select } from "./Select";
import { plainSlideText } from "../lib/slideRichText";

const names: Record<string,string> = {lesson:"Lesson sections",exercises:"Practical activities",questionSessions:"Knowledge activities",assignments:"Assignments",quiz:"Quiz questions",saqa:"Overview",logbook:"Logbook",selfAssessment:"Self assessment",studyNotes:"Study notes",lessonPlan:"Lesson plan",evaluation:"Evaluation",q:"Question",answer:"Correct answer",explain:"Answer explanation",prep:"Preparation",steps:"Instructions",marks:"Evidence coverage",n:"Lesson number"};
function label(key:string) { return names[key] ?? key.replace(/([A-Z])/g," $1").replace(/^./,c=>c.toUpperCase()); }
type Value = string | number | boolean | null | Value[] | { [key:string]: Value };
function duplicate(value:Value):Value {
  if(Array.isArray(value)) return value.map(duplicate);
  if(value && typeof value==="object") return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,k==="id"?`manual-${crypto.randomUUID()}`:duplicate(v)]));
  return value;
}

/** Field editor for every generated tab; no code or JSON knowledge required. */
export function UnitContentEditor({value,onChange,name="Unit content"}:{value:Value;onChange:(value:Value)=>void;name?:string}) {
  const template=useRef<Value>(Array.isArray(value)&&value.length?value[value.length-1]:"");
  if(Array.isArray(value)&&value.length) template.current=value[value.length-1];
  if(Array.isArray(value)) return <div className="unit-editor-array">
    {value.map((entry,i)=><div className="unit-editor-item" key={i}>
      <UnitContentEditor name={`${label(name)} ${i+1}`} value={entry} onChange={next=>onChange(value.map((v,j)=>j===i?next:v))} />
      <div className="unit-editor-actions">
        <button type="button" className="btn ghost sm" disabled={i===0} onClick={()=>{const next=[...value];[next[i-1],next[i]]=[next[i],next[i-1]];onChange(next);}}>Move up</button>
        <button type="button" className="btn ghost sm" onClick={()=>onChange(value.filter((_,j)=>j!==i))}>Remove</button>
      </div>
    </div>)}
    <button type="button" className="btn ghost sm" onClick={()=>onChange([...value,duplicate(template.current)])}>Add {label(name).toLowerCase()}</button>
  </div>;
  if(value && typeof value==="object") return <details className="unit-editor-group"><summary>{label(name)}{typeof value.title==="string"?`: ${value.title}`:typeof value.heading==="string"?`: ${value.heading}`:""}</summary>
    {Object.entries(value).filter(([key,item])=>item!==undefined&&!["id","icon","flat","quizGate"].includes(key)).map(([key,item])=><div key={key}>
      {key==="answer" && Array.isArray(value.options) ? <div className="field"><label>Correct answer</label><Select ariaLabel="Correct answer" value={String(item)} options={value.options.map((o,i)=>({value:String(i),label:`${i+1}. ${o}`}))} onChange={v=>onChange({...value,answer:Number(v)})}/></div> : <UnitContentEditor name={key} value={item} onChange={next=>onChange({...value,[key]:next})}/>}
    </div>)}
  </details>;
  if(typeof value==="boolean") return <label className="unit-editor-check"><input type="checkbox" checked={value} onChange={e=>onChange(e.target.checked)}/>{label(name)}</label>;
  if(typeof value==="number") return <label className="field">{label(name)}<input type="number" value={value} onChange={e=>onChange(Number(e.target.value))}/></label>;
  return <label className="field">{label(name)}<textarea rows={Math.min(8,Math.max(2,Math.ceil(String(value??"").length/100)))} value={plainSlideText(String(value??""))} onChange={e=>onChange(e.target.value)}/></label>;
}
