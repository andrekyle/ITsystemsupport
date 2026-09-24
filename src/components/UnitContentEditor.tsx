import { useRef } from "react";
import { Select } from "./Select";
import { plainSlideText } from "../lib/slideRichText";

const names: Record<string,string> = {lesson:"Lesson sections",exercises:"Practical activities",questionSessions:"Knowledge activities",assignments:"Assignments",quiz:"Quiz questions",logbook:"Logbook",selfAssessment:"Self assessment",studyNotes:"Study notes",lessonPlan:"Lesson plan",evaluation:"Evaluation",q:"Question",answer:"Correct answer",explain:"Answer explanation",prep:"Preparation",steps:"Instructions",marks:"Evidence coverage",n:"Lesson number",sections:"Lesson plan sections",rows:"Lesson plan rows",items:"Self-assessment items",questions:"Evaluation questions",scenario:"Scenario paragraphs",requirements:"Requirements",evidence:"Evidence"};
function label(key:string) { return names[key] ?? key.replace(/([A-Z])/g," $1").replace(/^./,c=>c.toUpperCase()); }
type Value = string | number | boolean | null | Value[] | { [key:string]: Value };
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

/** Field editor for every generated tab; no code or JSON knowledge required. */
export function UnitContentEditor({value,onChange,name="Unit content",defaultOpen=false}:{value:Value;onChange:(value:Value)=>void;name?:string;defaultOpen?:boolean}) {
  const template=useRef<Value>(Array.isArray(value)&&value.length?value[value.length-1]:blankFor(name));
  if(Array.isArray(value)) template.current=value.length?value[value.length-1]:blankFor(name);
  if(Array.isArray(value)) return <div className="unit-editor-array">
    {value.map((entry,i)=><div className="unit-editor-item" key={i}>
      <UnitContentEditor name={`${label(name)} ${i+1}`} value={entry} onChange={next=>onChange(value.map((v,j)=>j===i?next:v))} />
      <div className="unit-editor-actions">
        <button type="button" className="btn ghost sm" disabled={i===0} onClick={()=>{const next=[...value];[next[i-1],next[i]]=[next[i],next[i-1]];onChange(next);}}>Move up</button>
        <button type="button" className="btn ghost sm" onClick={()=>onChange(value.filter((_,j)=>j!==i))}>Remove</button>
      </div>
    </div>)}
    <button type="button" className="btn ghost sm" onClick={()=>onChange([...value,addTemplate(name,template.current)])}>Add {label(name).toLowerCase()}</button>
  </div>;
  if(value && typeof value==="object") return <details className="unit-editor-group" open={defaultOpen || undefined}><summary>{label(name)}{typeof value.title==="string"?`: ${value.title}`:typeof value.heading==="string"?`: ${value.heading}`:""}</summary>
    {Object.entries(value).filter(([key,item])=>item!==undefined&&!["id","icon","flat","quizGate"].includes(key)).map(([key,item])=><div key={key}>
      {key==="answer" && Array.isArray(value.options) ? <div className="field"><label>Correct answer</label><Select ariaLabel="Correct answer" value={String(item)} options={value.options.map((o,i)=>({value:String(i),label:`${i+1}. ${o}`}))} onChange={v=>onChange({...value,answer:Number(v)})}/></div> : <UnitContentEditor name={key} value={item} onChange={next=>onChange({...value,[key]:next})}/>}
    </div>)}
  </details>;
  if(typeof value==="boolean") return <label className="unit-editor-check"><input type="checkbox" checked={value} onChange={e=>onChange(e.target.checked)}/>{label(name)}</label>;
  if(typeof value==="number") return <label className="field">{label(name)}<input type="number" value={value} onChange={e=>onChange(Number(e.target.value))}/></label>;
  return <label className="field">{label(name)}<textarea rows={Math.min(8,Math.max(2,Math.ceil(String(value??"").length/100)))} value={plainSlideText(String(value??""))} onChange={e=>onChange(e.target.value)}/></label>;
}
