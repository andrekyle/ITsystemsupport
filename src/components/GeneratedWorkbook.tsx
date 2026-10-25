import { useEffect, useRef, useState } from "react";
import type { Profile, UnitStandard, WorkbookSpec } from "../types";
import type { WorkbookMemoItem } from "../store";
import { Icon } from "../icons";
import { DocumentActions } from "./DocumentActions";
import { WorkbookTaskAnswer } from "./WorkbookTaskAnswer";
import { workbookMarkFingerprint } from "../lib/workbookMarking";
import { WorkbookCover } from "./WorkbookCover";

type Values = Record<string, string | boolean>;
type Save = (key: string, value: string | boolean) => void;

function SourceField({ id, label, values, onChange, type = "text" }: { id: string; label: string; values: Values; onChange: Save; type?: string }) {
  const key = `built-workbook.source.${id}`;
  return <input aria-label={label} type={type} defaultValue={String(values[key] ?? "")} onBlur={event => onChange(key, event.target.value)} />;
}

function WorkbookTable114076({ values, onChange }: { values: Values; onChange: Save }) {
  const field = (id: string, label: string, type = "text") => <SourceField id={id} label={label} type={type} values={values} onChange={onChange} />;
  const rows = ["Exercise 1", "Exercise 2", "Exercise 3", "Exercise 4", "Exercise 5"];
  return <>
    <section className="lw-page" data-page="2"><h2 className="lw-centre">Learner Information</h2><table className="lw-table lw-details"><thead><tr><th>Details</th><th>Please Complete this Section</th></tr></thead><tbody>{[["name","Name & Surname"],["organisation","Organisation"],["unit-dept","Unit/Dept"],["facilitator","Facilitator Name"],["date-started","Date Started"],["date-completed","Date of Completion"]].map(([id,label])=><tr key={id}><th>{label}</th><td>{field(id,label,/date/i.test(label)?"date":"text")}</td></tr>)}</tbody></table><div className="lw-copy"><h3>Copyright</h3><p>All rights reserved. The copyright of this document, its previous editions and annexures is protected and expressly reserved.</p></div><table className="lw-table lw-us-table"><thead><tr><th>Specific Outcome</th><th>Assessment focus</th></tr></thead><tbody><tr><td>1</td><td>Plan the research of a computer topic.</td></tr><tr><td>2</td><td>Conduct research using computer technology.</td></tr><tr><td>3</td><td>Present the results of research using computer technology.</td></tr></tbody></table></section>
    <section className="lw-page" data-page="3"><table className="lw-table lw-instructions"><tbody><tr><th>Context</th><td>This assessment represents the formative assessment component and should be completed in the classroom or training room.</td></tr><tr><th>Resources</th><td>Learner Guide and Assessment Preparation.</td></tr><tr><th>Instructions to learners</th><td>Complete the workbook, answer all questions, ensure the work is your own, and attach and reference all annexures.</td></tr><tr><th>Assessment time</th><td>{field("assessment-time","Assessment time")}</td></tr><tr><th>Total marks</th><td>{field("total-marks","Total marks")} points. Pass mark: {field("pass-mark","Pass mark")}.</td></tr><tr><th>Equipment</th><td>Pen and pencil, ruler and exam pad or additional paper.</td></tr></tbody></table></section>
    <section className="lw-page" data-page="4"><div className="lw-bar">NOTIONAL HOURS BREAKDOWN</div><table className="lw-table lw-details"><thead><tr><th>Timeframe</th><th>Hours</th></tr></thead><tbody><tr><th>Total notional hours</th><td>30</td></tr><tr><th>Contact time</th><td>9</td></tr><tr><th>Non-contact self-study / assessment</th><td>21</td></tr></tbody></table><table className="lw-table lw-details"><tbody>{[["programme","Learning Programme Name"],["qualification","SAQA Qualification / Unit Standard Title"],["saqa-id","SAQA ID Number"],["nqf-level","NQF Level"],["credits","Credits"],["training-timeframe","Timeframe for training"]].map(([id,label])=><tr key={id}><th>{label}</th><td>{id==="nqf-level"?"4":id==="credits"?"3":field(id,label)}</td></tr>)}</tbody></table></section>
    <section className="lw-page" data-page="5"><div className="lw-bar">ASSESSOR, MODERATOR AND CANDIDATE DETAILS</div><table className="lw-table lw-details"><tbody>{[["standard-title","Standard Title"],["course","Course"],["assessor-name","Assessor Name"],["assessor-branch","Assessor Branch"],["assessor-registration","Registration No."],["moderator-name","Moderator Name"],["candidate-name","Candidate Name"],["candidate-id","Candidate ID No."],["candidate-job","Job"],["candidate-company","Company"],["candidate-department","Department"],["candidate-contact","Contact Details"],["candidate-email","Email"]].map(([id,label])=><tr key={id}><th>{label}</th><td>{field(id,label)}</td></tr>)}</tbody></table><table className="lw-table lw-sign"><tbody><tr><th>Overall Assessment Decision</th><td>{field("assessment-decision","Assessment decision")}</td><th>Candidate signature</th><td>{field("candidate-signature","Candidate signature")}</td><th>Date</th><td>{field("candidate-date","Candidate date","date")}</td></tr></tbody></table></section>
    <section className="lw-page" data-page="6"><div className="lw-bar">CONTROL SHEET</div><table className="lw-table lw-checklist"><thead><tr><th>Exercise No.</th><th>Date completed</th><th>Learner signature</th><th>Mentor signature</th><th>Moderator signature</th></tr></thead><tbody>{rows.map((row,index)=><tr key={row}><th>{index+1}</th><td>{field(`control-${index}-date`,`${row} date completed`,"date")}</td><td>{field(`control-${index}-learner`,`${row} learner signature`)}</td><td>{field(`control-${index}-mentor`,`${row} mentor signature`)}</td><td>{field(`control-${index}-moderator`,`${row} moderator signature`)}</td></tr>)}</tbody></table><table className="lw-table lw-checklist"><thead><tr><th>Self-check No.</th><th>Date completed</th><th>Learner signature</th><th>Mentor signature</th><th>Moderator signature</th></tr></thead><tbody>{rows.slice(0,3).map((row,index)=><tr key={row}><th>{index+1}</th><td>{field(`self-control-${index}-date`,`${row} self-check date`,"date")}</td><td>{field(`self-control-${index}-learner`,`${row} self-check learner`)}</td><td>{field(`self-control-${index}-mentor`,`${row} self-check mentor`)}</td><td>{field(`self-control-${index}-moderator`,`${row} self-check moderator`)}</td></tr>)}</tbody></table></section>
  </>;
}

interface MarkResult {
  awarded: number;
  maxMarks: number;
  feedback: string;
  answerHash?: string;
}

export function GeneratedWorkbook({ workbook, unit, profile, memoItems, values, onChange, onSave }: {
  workbook: WorkbookSpec;
  unit: UnitStandard;
  profile: Profile;
  memoItems: WorkbookMemoItem[];
  values: Values;
  onChange: Save;
  onSave: () => Promise<void>;
}) {
  const [editMode, setEditMode] = useState(false);
  const workbookRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = workbookRef.current;
    if (!root || !editMode) return;
    const handles: HTMLDivElement[] = [];
    root.querySelectorAll<HTMLTableElement>("table.lw-table").forEach(table => {
      table.style.tableLayout = "fixed";
      table.querySelectorAll<HTMLTableCellElement>("thead th").forEach((header, index) => {
        const handle = document.createElement("div");
        handle.className = "workbook-column-resize-handle";
        handle.setAttribute("aria-label", `Resize column ${index + 1}`);
        handle.addEventListener("pointerdown", event => {
          event.preventDefault(); event.stopPropagation();
          const startX = event.clientX;
          const startWidth = header.getBoundingClientRect().width;
          const cells = Array.from(table.rows).map(row => row.cells[index]).filter(Boolean);
          const move = (moveEvent: PointerEvent) => {
            const width = Math.max(28, startWidth + moveEvent.clientX - startX);
            cells.forEach(cell => { cell.style.width = `${width}px`; });
          };
          const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
          window.addEventListener("pointermove", move); window.addEventListener("pointerup", up, { once: true });
        });
        header.appendChild(handle); handles.push(handle);
      });
    });
    return () => handles.forEach(handle => handle.remove());
  }, [editMode]);
  const isResearchWorkbook = String(unit.us).trim() === "114076" || /use computer technology to research a computer topic/i.test(workbook.title);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState("");
  const registration = profile.registrationForm;
  const coverFields = [
    ["name", "Name", registration?.fullName || profile.name.split(/\s+/)[0] || ""],
    ["surname", "Surname", registration?.surname || profile.name.split(/\s+/).slice(1).join(" ")],
    ["id", "ID Number", registration?.nationalId || ""],
    ["contact", "Contact", registration?.contactNumber || ""],
  ] as const;
  const displayedOutcomes = workbook.outcomes.map(outcome => {
    const memo = memoItems.find(item => item.id === outcome.id);
    return memo?.tasks?.length
      ? { ...outcome, title: memo.question, questions: [...memo.tasks] }
      : outcome;
  }).sort((a, b) => Math.min(...a.questions.map(question => question.task)) - Math.min(...b.questions.map(question => question.task)));
  const resultFor = (id: string): MarkResult | undefined => {
    try {
      return JSON.parse(String(values[`built-workbook.mark.${id}`] ?? "")) as MarkResult;
    } catch {
      return undefined;
    }
  };
  const mark = async () => {
    if (marking || !memoItems.length) return;
    setMarking(true);
    setError("");
    try {
      const entries = displayedOutcomes.flatMap(outcome => outcome.questions.map(question => {
        const memoItem = memoItems.find(item => item.id === outcome.id);
        const memoTask = memoItem?.tasks?.find(task => task.id === question.id);
        const criteria = memoItem?.criteria.filter(criterion => criterion.taskId === question.id) ?? [];
        if (!memoItem || !memoTask || !criteria.length) throw new Error("Replace the memo PDF to enable marking for every question.");
        const item = { id: `${outcome.id}--${question.id}`, question: question.text, maxMarks: question.marks, tasks: [memoTask], criteria };
        const answer = String(values[`built-workbook.${outcome.id}.${question.id}`] ?? "").trim();
        const answerHash = workbookMarkFingerprint(answer, { task: memoTask, criteria });
        let cached: (MarkResult & { id?: string }) | undefined;
        try { cached = JSON.parse(String(values[`built-workbook.task-mark.${outcome.id}.${question.id}`] ?? "")); } catch { cached = undefined; }
        return { outcome, question, item, answer, answerHash, cached };
      }));
      const pending = entries.filter(entry => entry.cached?.answerHash !== entry.answerHash);
      let fresh: Array<MarkResult & { id: string; correctSegments?: string[]; incorrectSegments?: string[] }> = [];
      if (pending.length) {
        const response = await fetch("/api/workbook-memo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "mark", items: pending.map(entry => entry.item), answers: pending.map(entry => ({ id: entry.item.id, answer: entry.answer })) }),
        });
        const data = await response.json() as { results?: typeof fresh; error?: string };
        if (!response.ok || !data.results) throw new Error(data.error || "The workbook could not be marked.");
        fresh = data.results;
      }
      for (const outcome of displayedOutcomes) {
        const taskResults = outcome.questions.map(question => {
          const entry = entries.find(candidate => candidate.item.id === `${outcome.id}--${question.id}`)!;
          const result = fresh.find(candidate => candidate.id === entry.item.id) ?? entry.cached;
          return result ? { ...result, answerHash: entry.answerHash } : undefined;
        }).filter((result): result is NonNullable<typeof result> => !!result);
        if (taskResults.length !== outcome.questions.length) throw new Error(`Not every question in Specific Outcome ${outcome.specificOutcome} was marked.`);
        outcome.questions.forEach((question, index) => onChange(`built-workbook.task-mark.${outcome.id}.${question.id}`, JSON.stringify(taskResults[index])));
        const awarded = taskResults.reduce((total, result) => total + result.awarded, 0);
        const maxMarks = taskResults.reduce((total, result) => total + result.maxMarks, 0);
        onChange(`built-workbook.mark.${outcome.id}`, JSON.stringify({ awarded, maxMarks, feedback: `${taskResults.filter(result => result.awarded >= result.maxMarks).length} of ${taskResults.length} questions fully correct.` }));
      }
      onChange("built-workbook.marked-at", new Date().toISOString());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The workbook could not be marked.");
    } finally {
      setMarking(false);
    }
  };

  return <section className={`generated-workbook generated-workbook-${unit.us}`}>
    <div className="lw-workbook-actions no-print">
      <div className="lw-workbook-actions-copy"><strong>Workbook tools</strong><span>Answers save automatically. Save verifies the latest content on this device and in the cloud before you leave.</span></div>
      <div className="lw-workbook-actions-controls">
        <DocumentActions name={workbook.title} onSave={onSave} />
        {profile.role === "Super User" && <button type="button" className="btn ghost sm" aria-pressed={editMode} onClick={() => setEditMode(value => !value)}>{editMode ? "Done editing" : "Edit page"}</button>}
        <button type="button" className="btn lw-mark-workbook" disabled={marking || !memoItems.length} onClick={() => void mark()}>
          <Icon name="robot" size={17} />
          {marking ? "Marking answers…" : memoItems.length ? "Mark workbook" : "Upload memo to mark"}
        </button>
      </div>
      {error && <span className="auth-error" role="alert">{error}</span>}
    </div>
    <div ref={workbookRef} className={`lw-document document-print-target${editMode ? " workbook-editing" : ""}`} contentEditable={editMode} suppressContentEditableWarning>
      <WorkbookCover
        number={1}
        title={workbook.title.toUpperCase()}
        metadata={[`UNIT STANDARD ${unit.us}`, `NQF LEVEL: ${unit.nqf}`, `CREDITS: ${unit.credits}`, `NOTIONAL HOURS: ${unit.time}`]}
      >
        <table className="lw-table lw-cover-table">
          <thead><tr><th colSpan={2}>LEARNER INFORMATION</th></tr></thead>
          <tbody>{coverFields.map(([id, label, fallback]) => {
            const key = `built-workbook.cover.${id}`;
            return <tr key={id}><th>{label}</th><td><input aria-label={label} defaultValue={String(values[key] ?? fallback)} onBlur={event => onChange(key, event.target.value)} /></td></tr>;
          })}</tbody>
        </table>
      </WorkbookCover>
      {isResearchWorkbook && <WorkbookTable114076 values={values} onChange={onChange} />}
      {displayedOutcomes.map((outcome, outcomeIndex) => {
        const result = resultFor(outcome.id);
        return <section className="lw-page" data-page={outcomeIndex + 2} key={outcome.id}>
          <div className="lw-outcome-head">
            <strong>SPECIFIC OUTCOME {outcome.specificOutcome}.</strong>
            <b>{outcome.title}</b>
            <span>Learning Outcomes</span>
            <ol>{outcome.learningOutcomes.map(item => <li key={item}>{item}</li>)}</ol>
          </div>
          {result && <div className="lw-ai-result"><Icon name="checkCircle" size={15} /><strong>AI mark: {result.awarded}/{result.maxMarks}</strong><span>{result.feedback}</span></div>}
          {outcome.questions.map(question => <div className="lw-task-answer" key={question.id}>
            <table className="lw-table lw-question">
              <thead><tr><th>Task</th><th>Questions Description</th><th>SO</th><th>Mark</th></tr></thead>
              <tbody><tr><td>{question.task}</td><td>{question.text}</td><td>{outcome.specificOutcome}</td><td>{question.marks}</td></tr></tbody>
            </table>
            <WorkbookTaskAnswer
              outcomeId={outcome.id}
              task={question}
              memoItem={memoItems.find(item => item.id === outcome.id)}
              valueKey={`built-workbook.${outcome.id}.${question.id}`}
              markKey={`built-workbook.task-mark.${outcome.id}.${question.id}`}
              values={values}
              onChange={onChange}
            />
          </div>)}
        </section>;
      })}
    </div>
  </section>;
}
