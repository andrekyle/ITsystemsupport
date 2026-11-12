import { useState } from "react";
import type { Profile, UnitStandard, WorkbookSpec } from "../types";
import { isStaff } from "../types";
import type { WorkbookMemoItem } from "../store";
import { Icon } from "../icons";
import { learnerWorkbookFeedback, workbookMarkFingerprint } from "../lib/workbookMarking";
import { WorkbookCover } from "./WorkbookCover";
import { WorkbookTaskAnswer } from "./WorkbookTaskAnswer";
import { DocumentActions } from "./DocumentActions";
import { DocumentSignature } from "./DocumentSignature";
import { canSignDocumentField } from "../lib/documentSignatures";
import { Workbook114076IntroPages, Workbook114076FinalPages } from "./Workbook114076Pages";

type Values = Record<string, string | boolean>;
type Save = (key: string, value: string | boolean) => void;

export function TemplateLearnerWorkbook({ workbook, unit, profile, memoItems, values, onChange, onSave, source114076 = false }: { workbook: WorkbookSpec; unit: UnitStandard; profile: Profile; memoItems: WorkbookMemoItem[]; values: Values; onChange: Save; onSave: () => Promise<void>; source114076?: boolean }) {
  const [marking, setMarking] = useState(false);
  const [markError, setMarkError] = useState("");
  const allTasks = workbook.outcomes.flatMap(outcome => outcome.questions.map(question => ({ outcome, question })));
  const readyToMark = allTasks.length > 0 && allTasks.every(({ outcome, question }) => {
    const memo = memoItems.find(item => item.id === outcome.id);
    return !!memo?.tasks?.some(task => task.id === question.id) && memo.criteria.some(criterion => criterion.taskId === question.id);
  });
  const outcomeResult = (id: string) => {
    try {
      const result = JSON.parse(String(values[`learner-workbook.mark.${id}`] ?? "")) as { awarded: number; maxMarks: number; feedback: string };
      return result && { ...result, feedback: isStaff(profile.role) ? result.feedback : learnerWorkbookFeedback(result) };
    }
    catch { return undefined; }
  };
  const saveTaskAnswer = (outcomeId: string, questionId: string, key: string, value: string | boolean) => {
    const answerKey = `learner-workbook.${outcomeId}.${questionId}.answer`;
    if (key === answerKey && String(values[answerKey] ?? "") !== String(value)) {
      onChange(`learner-workbook.task-mark.${questionId}`, "");
      onChange(`learner-workbook.mark.${outcomeId}`, "");
    }
    onChange(key, value);
  };
  const markWorkbook = async () => {
    if (marking || !readyToMark) return;
    setMarking(true); setMarkError("");
    try {
      const entries = allTasks.map(({ outcome, question }) => {
        const memo = memoItems.find(item => item.id === outcome.id)!;
        const task = memo.tasks?.find(item => item.id === question.id)!;
        const criteria = memo.criteria.filter(item => item.taskId === question.id);
        const answer = String(values[`learner-workbook.${outcome.id}.${question.id}.answer`] ?? "").trim();
        const answerHash = workbookMarkFingerprint(answer, { task, criteria });
        const item = { id: `${outcome.id}--${question.id}`, question: question.text, maxMarks: question.marks, tasks: [task], criteria };
        let cached: { id?: string; awarded: number; maxMarks: number; feedback: string; answerHash?: string } | undefined;
        try { cached = JSON.parse(String(values[`learner-workbook.task-mark.${question.id}`] ?? "")); } catch { cached = undefined; }
        return { outcome, question, item, answer, answerHash, cached };
      });
      const pending = entries.filter(entry => entry.cached?.answerHash !== entry.answerHash);
      let fresh: Array<{ id: string; awarded: number; maxMarks: number; feedback: string; correctSegments?: string[]; incorrectSegments?: string[] }> = [];
      if (pending.length) {
        const response = await fetch("/api/workbook-memo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "mark", unitId: unit.us, qualificationContext: `South African vocational qualification context for Unit Standard ${unit.us}: assess the learner against the selected unit's official memo and learning outcomes only.`, learningContext: workbook.outcomes.map(outcome => ({ outcome: outcome.title, learningOutcomes: outcome.learningOutcomes })), items: pending.map(entry => entry.item), answers: pending.map(entry => ({ id: entry.item.id, answer: entry.answer })) }) });
        const data = await response.json() as { results?: typeof fresh; error?: string };
        if (!response.ok || !data.results) throw new Error(data.error || "The workbook could not be marked.");
        fresh = data.results;
      }
      for (const outcome of workbook.outcomes) {
        const results = outcome.questions.map(question => {
          const entry = entries.find(candidate => candidate.outcome.id === outcome.id && candidate.question.id === question.id)!;
          const result = fresh.find(candidate => candidate.id === entry.item.id) ?? entry.cached;
          if (!result) throw new Error(`Task ${question.task} was not marked.`);
          onChange(`learner-workbook.task-mark.${question.id}`, JSON.stringify({ ...result, answerHash: entry.answerHash }));
          return result;
        });
        const awarded = results.reduce((sum, result) => sum + result.awarded, 0);
        const maxMarks = results.reduce((sum, result) => sum + result.maxMarks, 0);
        onChange(`learner-workbook.mark.${outcome.id}`, JSON.stringify({ awarded, maxMarks, feedback: `${results.filter(result => result.awarded >= result.maxMarks).length} of ${results.length} questions fully correct.` }));
      }
      onChange("learner-workbook.marked-at", new Date().toISOString());
    } catch (error) { setMarkError(error instanceof Error ? error.message : "The workbook could not be marked."); }
    finally { setMarking(false); }
  };
  const field = (id: string, label: string) => {
    const key = `learner-workbook.${id}`;
    if (/signature/i.test(label)) {
      const editable = canSignDocumentField(profile.role, label);
      return <DocumentSignature label={label} value={String(values[key] ?? "")} savedSignature={editable ? profile.signatureImage : undefined} editable={editable} onChange={value => onChange(key, value)} />;
    }
    return <input aria-label={label} type={/\bdate\b/i.test(label) ? "date" : "text"} value={String(values[key] ?? "")} onChange={event => onChange(key, event.target.value)} />;
  };
  let page = 1;
  return <><div className="lw-workbook-actions no-print"><div className="lw-workbook-actions-copy"><strong>Workbook tools</strong><span>Answers save automatically. AI marking uses the uploaded marking memo.</span></div><div className="lw-workbook-actions-controls"><DocumentActions name="Learner Workbook" onSave={onSave} /><button type="button" className="btn lw-mark-workbook" disabled={marking || !readyToMark} onClick={() => void markWorkbook()}><Icon name="robot" size={17}/>{marking ? "Marking answers…" : readyToMark ? "Mark workbook" : "Upload memo to mark"}</button></div>{markError && <span className="auth-error" role="alert">{markError}</span>}</div><div className={`lw-document document-print-target${source114076 ? " lw-template-114076" : ""}`}>
    <WorkbookCover number={page++} title={workbook.title.toUpperCase()} metadata={[`UNIT STANDARD ${unit.us}`, `NQF LEVEL: ${unit.nqf}`, `CREDITS: ${unit.credits}`, ...(source114076 ? ["NOTIONAL HOURS: 30"] : [])]}><table className="lw-table lw-cover-table"><thead><tr><th colSpan={2}>LEARNER INFORMATION</th></tr></thead><tbody>{[["name", "Name"], ["surname", "Surname"], ["id", "ID Number"], ["contact", "Contact"]].map(([id, label]) => <tr key={id}><th>{label}</th><td>{field(id, label)}</td></tr>)}</tbody></table></WorkbookCover>
    {!source114076 && <>
    <section className="lw-page" data-page={page++}><h2 className="lw-centre">Learner Information:</h2><table className="lw-table lw-details"><thead><tr><th>Details</th><th>Please Complete this Section</th></tr></thead><tbody>{[["full-name", "Name & Surname"], ["organisation", "Organisation"], ["unit-dept", "Unit/Dept"], ["facilitator", "Facilitator Name"], ["date-started", "Date Started"], ["date-completed", "Date of Completion"]].map(([id, label]) => <tr key={id}><th>{label}</th><td>{field(id, label)}</td></tr>)}</tbody></table><div className="lw-copy"><h3>Copyright</h3><p>All rights reserved. The copyright of this document, its previous editions and any annexures thereto, is protected and expressly reserved. No part of this document may be reproduced, stored in a retrievable system, or transmitted, in any form or by any means, electronic, mechanical, photocopying, recording or otherwise without prior permission.</p></div><table className="lw-table lw-us-table"><thead><tr><th>US No</th><th>US Title</th><th>Level</th><th>Credits</th></tr></thead><tbody><tr><td>{unit.us}</td><td>{workbook.title}</td><td>{unit.nqf}</td><td>{unit.credits}</td></tr></tbody></table></section>
    {source114076 && <>
      <section className="lw-page" data-page={page++}><h2>TABLE OF CONTENTS</h2><table className="lw-table lw-instructions"><tbody>{workbook.outcomes.map(outcome => <tr key={outcome.id}><th>Specific Outcome {outcome.specificOutcome}</th><td><strong>{outcome.title}</strong><ul>{outcome.learningOutcomes.map((item, index) => <li key={index}>{item}</li>)}</ul></td></tr>)}</tbody></table></section>
      <section className="lw-page" data-page={page++}><h2>NOTIONAL HOURS BREAKDOWN</h2><table className="lw-table lw-details"><thead><tr><th>Total Notional Hours</th><th>Contact Time</th><th>Non-contact: Self-Study/Assessment</th></tr></thead><tbody><tr><td>Credits (3) × 10 = 30</td><td>9 hours</td><td>21 hours</td></tr></tbody></table><table className="lw-table lw-instructions"><tbody>{[["Learning Programme Name", "Refer to cover page"], ["SAQA Qualification/Unit Standard Title", "Refer to cover page"], ["NQF Level", "4"], ["Credits", "3"], ["Timeframe for Training", "Theory content, role play, simulation, group and pair work: 9 hours. Non-contact self-study, assignment, practice and assessment: 21 hours."]].map(([label, text]) => <tr key={label}><th>{label}</th><td>{text}</td></tr>)}</tbody></table></section>
      <section className="lw-page" data-page={page++}><h2>ASSESSMENT INFORMATION</h2><table className="lw-table lw-details"><tbody>{[["assessor", "Assessor Name"], ["assessor-branch", "Assessor Branch"], ["assessor-registration", "Assessor Registration No."], ["moderator", "Moderator Name"], ["moderator-branch", "Moderator Branch"], ["candidate", "Candidate Name"], ["candidate-id", "Candidate ID No."], ["candidate-company", "Company"], ["candidate-department", "Department"]].map(([id, label]) => <tr key={id}><th>{label}</th><td>{field(id, label)}</td></tr>)}</tbody></table><h3>Candidate confirmation</h3><p>I confirm that the purpose and criteria of the assessment have been explained to me, that I know when and where I will be assessed, and that I understand how the assessment will be done.</p><table className="lw-table lw-sign"><tbody><tr><th>Candidate Signature</th><td>{field("candidate-signature", "Candidate Signature")}</td><th>Date</th><td>{field("candidate-sign-date", "Candidate Signature Date")}</td></tr><tr><th>Overall Assessment Decision</th><td colSpan={3}><label><input type="checkbox" checked={values["learner-workbook.competent"] === true} onChange={event => onChange("learner-workbook.competent", event.target.checked)} /> Competent</label> <label><input type="checkbox" checked={values["learner-workbook.not-yet-competent"] === true} onChange={event => onChange("learner-workbook.not-yet-competent", event.target.checked)} /> Not yet competent</label></td></tr></tbody></table></section>
      <section className="lw-page" data-page={page++}><h2>Control sheet</h2><table className="lw-table lw-details"><thead><tr><th>Exercise No</th><th>Date completed</th><th>Learner’s signature</th><th>Mentor’s signature</th><th>Moderator’s signature</th></tr></thead><tbody>{[1,2,3,4,5].map(number => <tr key={number}><th>{number}</th>{["date", "learner", "mentor", "moderator"].map(label => <td key={label}>{field(`exercise-${number}-${label}`,`Exercise ${number} ${label}`)}</td>)}</tr>)}</tbody></table><h3>Self-check</h3><table className="lw-table lw-details"><tbody>{[1,2,3,4,5].map(number => <tr key={number}><th>{number}</th><td>{field(`self-check-${number}-date`, `Self-check ${number} date`)}</td><td>{field(`self-check-${number}-learner`, `Self-check ${number} learner signature`)}</td><td>{field(`self-check-${number}-mentor`, `Self-check ${number} mentor signature`)}</td></tr>)}</tbody></table><h3>Reflection</h3>{field("reflection-date", "Reflection date")}</section>
    </>}
    </>}
    {source114076 && <Workbook114076IntroPages workbook={workbook} field={field} values={values} onChange={onChange} />}
    {workbook.outcomes.map(outcome => <section className="lw-page" data-page={source114076 ? outcome.specificOutcome + 6 : page++} key={outcome.id}><div className="lw-outcome-head"><strong>SPECIFIC OUTCOME {outcome.specificOutcome}.</strong><b>{outcome.title}</b><span>{source114076 ? "ASSESSMENT CRITERIA" : "Learning Outcomes"}</span><ol>{outcome.learningOutcomes.map((item, index) => <li key={index}>{item}</li>)}</ol></div>{outcomeResult(outcome.id) && <div className="lw-ai-result"><Icon name="checkCircle" size={15}/><strong>AI mark: {outcomeResult(outcome.id)!.awarded}/{outcomeResult(outcome.id)!.maxMarks}</strong><span>{outcomeResult(outcome.id)!.feedback}</span></div>}{outcome.questions.map(question => <div className="lw-task-answer" key={question.id}><table className="lw-table lw-question"><thead><tr><th>{source114076 ? "Activity" : "Task"}</th><th>{source114076 ? outcome.specificOutcome === 3 ? "Question" : "Practical" : "Questions Description"}</th><th>SO</th>{source114076 && <th>AC</th>}<th>Mark</th></tr></thead><tbody><tr><td>{question.sourceLabel ?? question.task}</td><td>{question.text}</td><td>{outcome.specificOutcome}</td>{source114076 && <td>{`1–${outcome.learningOutcomes.length}`}</td>}<td>{question.marks || "—"}</td></tr></tbody></table><WorkbookTaskAnswer profile={profile} outcomeId={outcome.id} task={question} memoItem={memoItems.find(item => item.id === outcome.id)} valueKey={`learner-workbook.${outcome.id}.${question.id}.answer`} markKey={`learner-workbook.task-mark.${question.id}`} values={values} onChange={(key, value) => saveTaskAnswer(outcome.id, question.id, key, value)} /></div>)}</section>)}
    {!source114076 && <>
    <section className="lw-page lw-final-page" data-page={page++}><div className="lw-bar">ASSESSMENT FEEDBACK REPORT</div><table className="lw-table lw-details"><tbody><tr><th>Facilitator feedback & remarks</th><td><textarea aria-label="Facilitator feedback" value={String(values["learner-workbook.facilitator-feedback"] ?? "")} onChange={event => onChange("learner-workbook.facilitator-feedback", event.target.value)} /></td></tr><tr><th>Assessment judgment</th><td><label>Requirements met <input type="checkbox" checked={values["learner-workbook.requirements-met"] === true} onChange={event => onChange("learner-workbook.requirements-met", event.target.checked)} /></label></td></tr><tr><th>Actions required</th><td><textarea aria-label="Actions required" value={String(values["learner-workbook.actions"] ?? "")} onChange={event => onChange("learner-workbook.actions", event.target.value)} /></td></tr><tr><th>Learner feedback & comments</th><td><textarea aria-label="Learner feedback" value={String(values["learner-workbook.learner-feedback"] ?? "")} onChange={event => onChange("learner-workbook.learner-feedback", event.target.value)} /></td></tr></tbody></table><div className="lw-bar">DECLARATION BY THE FACILITATOR</div><p>I, {field("facilitator-declaration-name","Facilitator name")}, hereby certify that I have examined the learner workbook and am satisfied with the evidence provided by the learner.</p></section>
    {source114076 && <section className="lw-page lw-final-page" data-page={page}><div className="lw-bar">DECLARATION BY LEARNER</div><p>I, {field("learner-declaration-name","Learner name")}, declare that I am satisfied that the feedback given to me by the Facilitator was relevant, sufficient and done in a constructive manner. I accept the assessment judgment and have no further questions relating to this assessment event.</p><table className="lw-table lw-sign"><tbody><tr><th>Learner</th><td>{field("learner-final-signature","Learner signature")}</td><th>Date</th><td>{field("learner-final-date","Learner date")}</td><th>Facilitator</th><td>{field("facilitator-final-signature","Facilitator signature")}</td><th>Date</th><td>{field("facilitator-final-date","Facilitator date")}</td></tr></tbody></table><div className="lw-bar">DECLARATION BY THE ASSESSOR</div><p>I, {field("assessor-declaration-name","Assessor name")}, hereby certify that I have examined the learner workbook and am satisfied with the Facilitator Judgment of this assessment.</p><table className="lw-table lw-sign"><tbody><tr><th>Assessor</th><td>{field("assessor-final-signature","Assessor signature")}</td><th>Date</th><td>{field("assessor-final-date","Assessor date")}</td><th>Moderator</th><td>{field("moderator-final-signature","Moderator signature")}</td><th>Date</th><td>{field("moderator-final-date","Moderator date")}</td></tr></tbody></table></section>}
    </>}
    {source114076 && <Workbook114076FinalPages field={field} values={values} onChange={onChange} />}
  </div></>;
}
