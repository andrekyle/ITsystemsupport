import { useState } from "react";
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

function SourceLines({ id, label, values, onChange }: { id: string; label: string; values: Values; onChange: Save }) {
  const key = `built-workbook.source.${id}`;
  return <textarea aria-label={label} rows={5} defaultValue={String(values[key] ?? "")} onBlur={event => onChange(key, event.target.value)} />;
}

function SourcePages114076({ values, onChange }: { values: Values; onChange: Save }) {
  return <>
    <section className="lw-page" data-page="2"><h2 className="lw-centre">Learner Information</h2><table className="lw-table lw-details"><thead><tr><th>Details</th><th>Please Complete this Section</th></tr></thead><tbody>{[["name","Name & Surname"],["organisation","Organisation"],["unit-dept","Unit/Dept"],["facilitator","Facilitator Name"],["date-started","Date Started"],["date-completed","Date of Completion"]].map(([id,label])=><tr key={id}><th>{label}</th><td><SourceField id={id} label={label} type={/date/i.test(label)?"date":"text"} values={values} onChange={onChange}/></td></tr>)}</tbody></table><div className="lw-copy"><h3>Copyright</h3><p>All rights reserved. The copyright of this document, its previous editions and annexures is protected and expressly reserved.</p></div><h3>Table of contents</h3><p>Specific Outcome 1: Plan the research of a computer topic.</p><p>Specific Outcome 2: Conduct research of a computer topic using computer technology.</p><p>Specific Outcome 3: Present the results of research of a computer topic using computer technology.</p></section>
    <section className="lw-page" data-page="3"><div className="lw-bar">WORKBOOK CONTENT</div><h3>Specific Outcome 1: Plan the research of a computer topic</h3><ul><li>The plan identifies the topic, objectives and scope of the research.</li><li>The plan identifies the time, research methods and sources of information.</li><li>The plan identifies the target audience, presentation methods and computer applications used for analysis and presentation.</li></ul><h3>Specific Outcome 2: Conduct research using computer technology</h3><ul><li>Research data is accumulated according to the research plan.</li><li>Research provides data analysis with conclusions.</li><li>Analysis methods allow validity to be assessed.</li><li>Progress is indicated at intervals by reports.</li><li>A computer application is used to analyse the research data.</li></ul><h3>Specific Outcome 3: Present research results</h3><ul><li>The identified computer application is used for the presentation.</li><li>The presentation communicates summarised research data and conclusions to the target audience.</li></ul></section>
    <section className="lw-page" data-page="4"><div className="lw-bar">NOTIONAL HOURS BREAKDOWN</div><p>This unit carries 3 credits. The recommended allocation is 30 notional hours: 9 hours contact time and 21 hours non-contact self-study and assessment.</p><table className="lw-table lw-details"><tbody><tr><th>Learning Programme Name</th><td>Use computer technology to research a computer topic</td></tr><tr><th>SAQA Unit Standard</th><td>114076</td></tr><tr><th>NQF Level</th><td>4</td></tr><tr><th>Credits</th><td>3</td></tr><tr><th>Training timeframe</th><td><SourceField id="training-timeframe" label="Training timeframe" values={values} onChange={onChange}/></td></tr></tbody></table><h3>Programme details</h3><p>Theory content may include role play, simulation, group work and pair work. Non-contact sessions include self-study, assignments, practice guided by a coach or mentor, formative assessment and summative assessment.</p></section>
    <section className="lw-page" data-page="5"><div className="lw-bar">ASSESSMENT AND CANDIDATE DETAILS</div><table className="lw-table lw-details"><tbody>{[["assessor-name","Assessor Name"],["assessor-branch","Assessor Branch"],["assessor-registration","Assessor Registration No."],["moderator-name","Moderator Name"],["candidate-job","Candidate Job"],["candidate-company","Candidate Company"],["candidate-department","Candidate Department"],["candidate-email","Candidate Email"]].map(([id,label])=><tr key={id}><th>{label}</th><td><SourceField id={id} label={label} values={values} onChange={onChange}/></td></tr>)}</tbody></table><p>I confirm that the purpose and criteria of the assessment, when and where it will take place, and how it will be conducted have been explained to me.</p><p>Overall assessment decision: Competent / Not yet competent</p></section>
    <section className="lw-page" data-page="6"><div className="lw-bar">CONTROL SHEET</div><p>Complete the control sheet for each exercise, self-check and reflection activity.</p><table className="lw-table lw-details"><thead><tr><th>Activity</th><th>Date completed</th><th>Learner signature</th><th>Mentor signature</th><th>Moderator signature</th></tr></thead><tbody>{["Exercise 1","Exercise 2","Exercise 3","Self-check","Reflection"].map((label,index)=><tr key={label}><th>{label}</th><td><SourceField id={`control-${index}-date`} label={`${label} date completed`} type="date" values={values} onChange={onChange}/></td><td><SourceField id={`control-${index}-learner`} label={`${label} learner signature`} values={values} onChange={onChange}/></td><td><SourceField id={`control-${index}-mentor`} label={`${label} mentor signature`} values={values} onChange={onChange}/></td><td><SourceField id={`control-${index}-moderator`} label={`${label} moderator signature`} values={values} onChange={onChange}/></td></tr>)}</tbody></table><p>Answer all questions in this guide.</p></section>
  </>;
}

function ClosingPages114076({ values, onChange }: { values: Values; onChange: Save }) {
  return <><section className="lw-page" data-page="10"><div className="lw-bar">SELF-ASSESSMENT</div><p>Rate yourself against the learning outcomes: 1 Not able to comply; 2 Reasonable compliance; 3 Able to comply fully.</p><table className="lw-table lw-self"><thead><tr><th>Learning outcome</th><th>Rating / comments</th></tr></thead><tbody>{["Plan the research","Conduct research","Present research results"].map((label,index)=><tr key={label}><th>{label}</th><td><SourceField id={`self-${index}`} label={`${label} self-assessment`} values={values} onChange={onChange}/></td></tr>)}</tbody></table><p>Learner signature: <SourceField id="self-learner-signature" label="Self-assessment learner signature" values={values} onChange={onChange}/> Date: <SourceField id="self-date" label="Self-assessment date" type="date" values={values} onChange={onChange}/></p></section><section className="lw-page" data-page="11"><div className="lw-bar">ASSESSMENT FEEDBACK REPORT</div><h3>Facilitator feedback &amp; remarks</h3><SourceLines id="facilitator-feedback" label="Facilitator feedback and remarks" values={values} onChange={onChange}/><h3>Assessment judgement</h3><p>Learner total mark: <SourceField id="total-mark" label="Learner total mark" values={values} onChange={onChange}/></p><p>Requirements met / Requirements not met</p><h3>Learner feedback &amp; comments</h3><SourceLines id="learner-feedback" label="Learner feedback and comments" values={values} onChange={onChange}/></section><section className="lw-page" data-page="12"><div className="lw-bar">DECLARATIONS</div><p>Facilitator declaration</p><SourceLines id="facilitator-declaration" label="Facilitator declaration" values={values} onChange={onChange}/><p>Learner declaration</p><SourceLines id="learner-declaration" label="Learner declaration" values={values} onChange={onChange}/><p>Assessor declaration</p><SourceLines id="assessor-declaration" label="Assessor declaration" values={values} onChange={onChange}/><table className="lw-table lw-sign"><tbody><tr><th>Learner date</th><td><SourceField id="final-learner-date" label="Final learner date" type="date" values={values} onChange={onChange}/></td><th>Facilitator date</th><td><SourceField id="final-facilitator-date" label="Final facilitator date" type="date" values={values} onChange={onChange}/></td><th>Assessor date</th><td><SourceField id="final-assessor-date" label="Final assessor date" type="date" values={values} onChange={onChange}/></td></tr></tbody></table></section></>;
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
        <button type="button" className="btn lw-mark-workbook" disabled={marking || !memoItems.length} onClick={() => void mark()}>
          <Icon name="robot" size={17} />
          {marking ? "Marking answers…" : memoItems.length ? "Mark workbook" : "Upload memo to mark"}
        </button>
      </div>
      {error && <span className="auth-error" role="alert">{error}</span>}
    </div>
    <div className="lw-document document-print-target">
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
      {unit.us === "114076" && <SourcePages114076 values={values} onChange={onChange} />}
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
      {unit.us === "114076" && <ClosingPages114076 values={values} onChange={onChange} />}
    </div>
  </section>;
}
