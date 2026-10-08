import { useState } from "react";
import type { Profile } from "../types";
import type { WorkbookMemoItem } from "../store";
import { DocumentSignature } from "./DocumentSignature";
import { DocumentActions } from "./DocumentActions";
import { Icon } from "../icons";
import type { WorkbookMemoBlueprint } from "./WorkbookMemo";
import { WorkbookTaskAnswer } from "./WorkbookTaskAnswer";
import { canSignDocumentField } from "../lib/documentSignatures";

type Values = Record<string, string | boolean>;
type Save = (key: string, value: string | boolean) => void;

function Field({ id, label, values, onChange, type = "text", profile }: { id: string; label: string; values: Values; onChange: Save; type?: string; profile: Profile }) {
  const key = `learner-workbook.${id}`;
  if (/signature/i.test(label)) {
    const editable = canSignDocumentField(profile.role, label);
    return <DocumentSignature value={String(values[key] ?? "")} savedSignature={editable ? profile.signatureImage : undefined} label={label} editable={editable} onChange={value => onChange(key, value)} />;
  }
  return <input type={type} aria-label={label} defaultValue={String(values[key] ?? "")} onBlur={event => onChange(key, event.target.value)} />;
}

function MultilineField({ id, label, values, onChange }: { id: string; label: string; values: Values; onChange: Save }) {
  const key = `learner-workbook.${id}`;
  return <textarea rows={4} aria-label={label} defaultValue={String(values[key] ?? "")} onBlur={event => onChange(key, event.target.value)} />;
}

function Tick({ id, label, values, onChange }: { id: string; label: string; values: Values; onChange: Save }) {
  const key = `learner-workbook.${id}`;
  return <input type="checkbox" aria-label={label} defaultChecked={values[key] === true} onChange={event => onChange(key, event.target.checked)} />;
}

function Lines({ id, count, values, onChange, label, legacyId }: { id: string; count: number; values: Values; onChange: Save; label: string; legacyId?: string }) {
  const key = `learner-workbook.${id}.answer`;
  const previousId = legacyId ?? id;
  const previousLines = Array.from(
    { length: count },
    (_, index) => String(values[`learner-workbook.${previousId}.line-${index + 1}`] ?? "")
  ).filter(Boolean).join("\n");
  const previousAnswer = legacyId ? String(values[`learner-workbook.${legacyId}.answer`] ?? "") : "";
  const currentAnswer = String(values[key] ?? "");
  return <div className="lw-lines">
    <textarea
      aria-label={`${label} answer`}
      defaultValue={currentAnswer || previousAnswer || previousLines}
      onBlur={event => onChange(key, event.target.value)}
    />
  </div>;
}

function Page({ number, children, className = "" }: { number: number; children: React.ReactNode; className?: string }) {
  return <section className={`lw-page ${className}`} data-page={number}>{children}</section>;
}

const outcomes = [
  { no: 1, title: "Set up user access to a local area computer network.", points: ["The explanation identifies resources whose access can be managed.", "The explanation outlines the level of access for different categories of people.", "The explanation outlines methods of controlling access.", "The explanation outlines the purpose of an access audit trail."], questions: [
    { task: 1, id: "physical-components", text: "Identify physical components of LAN.", mark: 5 },
    { task: 2, id: "network-access-control", text: "Define Network Access Control (NAC).", mark: 5 },
    { task: 3, id: "audit-trails", text: "Define audit trails and outline their benefits and objectives.", mark: 5 },
  ] },
  { no: 2, title: "Explain local area computer network performance issues.", points: ["The explanation describes a range of factors that affects response times on a LAN.", "The explanation outlines the need to analyse data and identify problems.", "The explanation outlines how diagnostic tools are used to collect data.", "The explanation outlines and compares methods for improving performance."], questions: [
    { task: 4, id: "performance-issues", text: "Explain local area computer network performance issues.", mark: 5 },
  ] },
  { no: 3, title: "Explain local area computer network support issues.", points: ["The explanation distinguishes sources.", "The explanation outlines user expectations of a range of support options."], questions: [
    { task: 5, id: "support-issues", text: "Explain local area computer network support issues.", mark: 5 },
  ] },
  { no: 4, title: "Explain typical viruses on local area computer networks.", points: ["The explanation outlines the symptoms and transmission of viruses.", "The explanation allows the selection of a method for the prevention, detection, and eradication of viruses for a situation."], questions: [
    { task: 6, id: "viruses", text: "Explain typical viruses on local area computer networks.", mark: 5 },
  ] },
];

export const WORKBOOK_114046_BLUEPRINT: WorkbookMemoBlueprint[] = outcomes.map(outcome => ({
  id: `outcome-${outcome.no}`,
  question: outcome.title,
  maxMarks: outcome.questions.reduce((total, question) => total + question.mark, 0),
  tasks: outcome.questions.map(question => ({ task: question.task, text: question.text, marks: question.mark })),
}));

function OutcomeHeader({ outcome, result }: { outcome: typeof outcomes[number]; result?: { awarded: number; maxMarks: number; feedback: string } }) {
  return <><div className="lw-outcome-head"><strong>SPECIFIC OUTCOME {outcome.no}.</strong><b>{outcome.title}</b><span>Learning Outcomes</span><ol>{outcome.points.map(point => <li key={point}>{point}</li>)}</ol></div>{result && <div className="lw-ai-result"><Icon name="checkCircle" size={15}/><strong>AI mark: {result.awarded}/{result.maxMarks}</strong><span>{result.feedback}</span></div>}</>;
}

export function LearnerWorkbook({ values, onChange, profile, memoItems }: { values: Values; onChange: Save; profile: Profile; memoItems: WorkbookMemoItem[] }) {
  const [marking, setMarking] = useState(false);
  const [markError, setMarkError] = useState("");
  const displayedOutcomes = outcomes.map(outcome => {
    const memo = memoItems.find(item => item.id === `outcome-${outcome.no}`);
    return memo?.tasks?.length
      ? { ...outcome, title: memo.question, questions: [...memo.tasks].sort((a, b) => a.task - b.task).map(task => ({ ...task, mark: task.marks })) }
      : outcome;
  }).sort((a, b) => Math.min(...a.questions.map(question => question.task)) - Math.min(...b.questions.map(question => question.task)));
  const results = displayedOutcomes.map(outcome => {
    try { return JSON.parse(String(values[`learner-workbook.mark.outcome-${outcome.no}`] ?? "")) as { awarded:number; maxMarks:number; feedback:string }; } catch { return undefined; }
  });
  const questionAnswer = (outcomeNo: number, questionId: string, legacyId?: string) => {
    const answer = String(values[`learner-workbook.outcome-${outcomeNo}.${questionId}.answer`] ?? "").trim();
    if (answer || !legacyId) return answer;
    const legacyAnswer = String(values[`learner-workbook.${legacyId}.answer`] ?? "").trim();
    if (legacyAnswer) return legacyAnswer;
    return Array.from({ length: 24 }, (_, index) => String(values[`learner-workbook.${legacyId}.line-${index + 1}`] ?? "")).filter(Boolean).join("\n");
  };
  const markWorkbook = async () => {
    if (!memoItems.length || marking) return;
    setMarking(true); setMarkError("");
    try {
      const markingItems = displayedOutcomes.flatMap(outcome => outcome.questions.map(question => {
        const outcomeId = `outcome-${outcome.no}`;
        const memoItem = memoItems.find(item => item.id === outcomeId);
        const memoTask = memoItem?.tasks?.find(task => task.id === question.id);
        const criteria = memoItem?.criteria.filter(criterion => criterion.taskId === question.id) ?? [];
        if (!memoItem || !memoTask || !criteria.length) throw new Error("Replace the memo PDF to enable marking for every question.");
        return { id: `${outcomeId}--${question.id}`, question: question.text, maxMarks: question.mark, tasks: [memoTask], criteria };
      }));
      const answers = displayedOutcomes.flatMap(outcome => outcome.questions.map((question, questionIndex) => {
        const legacyId = questionIndex === 0 ? `outcome-${outcome.no}.page-1` : undefined;
        return { id: `outcome-${outcome.no}--${question.id}`, answer: `Task ${question.task}: ${question.text}\n${questionAnswer(outcome.no, question.id, legacyId)}` };
      }));
      const response = await fetch("/api/workbook-memo", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({mode:"mark",items:markingItems,answers}) });
      const data = await response.json() as { results?: Array<{id:string;awarded:number;maxMarks:number;feedback:string;matchedCriteria:string[];correctSegments?:string[];incorrectSegments?:string[]}>; error?:string };
      if (!response.ok || !data.results) throw new Error(data.error || "The workbook could not be marked.");
      for (const outcome of displayedOutcomes) {
        const taskResults = outcome.questions.map(question => data.results!.find(result => result.id === `outcome-${outcome.no}--${question.id}`)).filter((result): result is NonNullable<typeof result> => !!result);
        if (taskResults.length !== outcome.questions.length) throw new Error(`Not every question in Specific Outcome ${outcome.no} was marked.`);
        outcome.questions.forEach((question, index) => onChange(`learner-workbook.task-mark.${question.id}`, JSON.stringify(taskResults[index])));
        const awarded = taskResults.reduce((total, result) => total + result.awarded, 0);
        const maxMarks = taskResults.reduce((total, result) => total + result.maxMarks, 0);
        onChange(`learner-workbook.mark.outcome-${outcome.no}`, JSON.stringify({ awarded, maxMarks, feedback: `${taskResults.filter(result => result.awarded >= result.maxMarks).length} of ${taskResults.length} questions fully correct.` }));
      }
      onChange("learner-workbook.marked-at",new Date().toISOString());
    } catch (reason) { setMarkError(reason instanceof Error ? reason.message : "The workbook could not be marked."); }
    finally { setMarking(false); }
  };
  const field = (id: string, label: string, type?: string) => <Field id={id} label={label} type={type} values={values} onChange={onChange} profile={profile} />;
  const inlineField = (id: string, label: string, type?: string) => <span className="lw-inline-field">{field(id, label, type)}</span>;
  return <><div className="lw-workbook-actions no-print"><div className="lw-workbook-actions-copy"><strong>Workbook tools</strong><span>Save, export or mark the learner’s answers.</span></div><div className="lw-workbook-actions-controls"><DocumentActions name="Learner Workbook" labelled /><button type="button" className="btn lw-mark-workbook" disabled={marking || !memoItems.length} onClick={()=>void markWorkbook()}><Icon name="robot" size={17}/>{marking?"Marking answers…":memoItems.length?"Mark workbook":"Upload memo to mark"}</button></div>{markError&&<span className="auth-error" role="alert">{markError}</span>}</div><div className="lw-document document-print-target">
    <Page number={1} className="lw-cover"><div className="lw-cover-main"><img src="/logos/eruditio.svg" alt="Eruditio" /><div className="lw-cover-panel"><h1>DEMONSTRATE AN UNDERSTANDING OF ISSUES AFFECTING THE MANAGEMENT OF A LOCAL AREA COMPUTER NETWORK (LAN)</h1><div className="lw-cover-meta"><b>UNIT STANDARD 114046</b><b>NQF LEVEL: 5</b><b>CREDITS: 4</b><b>NOTIONAL HOURS: 40</b></div><table className="lw-table lw-cover-table"><thead><tr><th colSpan={2}>LEARNER INFORMATION</th></tr></thead><tbody>{[["cover-name","Name"],["cover-surname","Surname"],["cover-id","ID Number"],["cover-contact","Contact"]].map(([id,label])=><tr key={id}><th>{label}</th><td>{field(id,label)}</td></tr>)}</tbody></table></div></div><aside>LEARNER WORKBOOK</aside></Page>

    <Page number={2}><h2 className="lw-centre">Learner Information:</h2><table className="lw-table lw-details"><thead><tr><th>Details</th><th>Please Complete this Section</th></tr></thead><tbody>{[["name","Name & Surname"],["organisation","Organisation"],["unit-dept","Unit/Dept"],["facilitator","Facilitator Name"],["date-started","Date Started"],["date-completed","Date of Completion"]].map(([id,label])=><tr key={id}><th>{label}:</th><td>{field(id,label,/date/i.test(label)?"date":undefined)}</td></tr>)}</tbody></table><div className="lw-copy"><h3>Copyright</h3><p>All rights reserved. The copyright of this document, its previous editions and any annexures thereto, is protected and expressly reserved. No part of this document may be reproduced, stored in a retrievable system, or transmitted, in any form or by any means, electronic, mechanical, photocopying, recording or otherwise without the prior permission.</p></div><table className="lw-table lw-overview lw-overview-gap"><thead><tr><th colSpan={2}>OVERVIEW</th></tr></thead><tbody><tr><th>About the Learner Workbook</th><td>This Learner Exercise Workbook has been designed and developed to evaluate learners’ level of understanding. It forms part of a series of Learner Workbooks developed for the National Certificate: Information Technology: Systems Support, SAQA 48573, Level 5, 147 credits.</td></tr><tr><th>Purpose</th><td>The purpose of this Learner Exercise Workbook is to evaluate learners’ understanding of the specific outcomes and assessment criteria of the registered unit standard.</td></tr></tbody></table><table className="lw-table lw-us-table"><thead><tr><th>US No</th><th>US Title</th><th>Level</th><th>Credits</th></tr></thead><tbody><tr><td>SAQA 114046</td><td>Demonstrate an understanding of issues affecting the management of a local area computer network (LAN)</td><td>5</td><td>4</td></tr></tbody></table></Page>

    <Page number={3}><table className="lw-table lw-instructions"><tbody><tr><th>Context</th><td>This assessment represents the Formative Assessment component and should be completed in the classroom/training room.</td></tr><tr><th>Resources</th><td>The following resources are needed:<ol><li>Learner Guide</li><li>Assessment Preparation</li></ol></td></tr><tr><th>Instructions to Facilitators</th><td>Explain completion of the workbook to each learner and interview the learner on similar questions should they not be able to write.</td></tr><tr><th>Instructions to Learners</th><td><ul><li>Complete the workbook as per the instructions.</li><li>Ensure all questions are completed.</li><li>Ensure the work is your own.</li><li>Attach and clearly reference all annexures.</li></ul></td></tr><tr><th>Assessment Time</th><td>Learners are required to complete this assessment within the allocated time frame.</td></tr><tr><th>Total Marks</th><td>This formative assessment carries a total mark of <span className="lw-inline-group">{inlineField("total-marks","Total marks")} points.</span> To meet the pass mark, learners must achieve <span className="lw-inline-group">{inlineField("pass-mark","Pass mark")}.</span></td></tr><tr><th>Equipment</th><td>Learners are required to have a pen and pencil, ruler, and exam pad or additional paper.</td></tr></tbody></table></Page>

    <Page number={4} className="lw-workshop-page"><h3>GENERAL INFORMATION</h3><div className="lw-bar">LEARNER DETAILS</div><table className="lw-table lw-details"><tbody>{[["full-names","Learner Full Names"],["learner-number","Learner ID No."],["org-2","Organisation"],["dept-2","Unit/Dept"]].map(([id,label])=><tr key={id}><th>{label}:</th><td colSpan={3}>{field(id,label)}</td></tr>)}<tr><th>Contact Details:</th><th>Telephone /Cell Numbers:</th><th colSpan={2}>Email Address:</th></tr><tr><td></td><td>{field("telephone","Telephone","tel")}</td><td colSpan={2}>{field("email","Email","email")}</td></tr><tr className="lw-grey"><th colSpan={4}>WORKSHOP DETAILS</th></tr>{[["venue","Workshop Venue"],["facilitator-2","Facilitator Name"],["started-2","Date Started"],["completed-2","Date Completed"]].map(([id,label])=><tr key={id}><th>{label}:</th><td colSpan={3}>{field(id,label,/Date/.test(label)?"date":undefined)}</td></tr>)}</tbody></table><table className="lw-table lw-checklist"><thead><tr><th>ASSESSMENT PREPARATION CHECKLIST<br />DESCRIPTION</th><th>YES</th><th>NO</th><th>COMMENTS/CONTINGENCY</th></tr></thead><tbody>{["This assessment is a formative assessment based on the outlined unit standard.","Your assessment evidence needs to be submitted on the agreed date and at the agreed place.","You will be assessed based on the outlined Unit Standards and linked assessment criteria.","The assessment methods and competence requirements have been explained."].map((text,index)=><tr key={text}><td>{text}</td><td><Tick id={`prep.${index}.yes`} label={`${text} yes`} values={values} onChange={onChange}/></td><td><Tick id={`prep.${index}.no`} label={`${text} no`} values={values} onChange={onChange}/></td><td>{field(`prep.${index}.comment`,`${text} comment`)}</td></tr>)}{["To meet the formative assessment pass mark, you should obtain at least 80%.","Detailed written and verbal feedback will be provided.","If declared not yet competent, you will receive reassessment opportunities.","You may lodge an appeal if dissatisfied with the assessment decision.","Assessment results and portfolio information remain confidential."].map((text,index)=><tr key={text}><td>{text}</td><td><Tick id={`prep2.${index}.yes`} label={`${text} yes`} values={values} onChange={onChange}/></td><td><Tick id={`prep2.${index}.no`} label={`${text} no`} values={values} onChange={onChange}/></td><td>{field(`prep2.${index}.comment`,`${text} comment`)}</td></tr>)}</tbody></table></Page>

    <Page number={5} className="lw-declaration-page"><div className="lw-bar">Learner’s Declaration</div><p>I, {field("declaration-name","Learner declaration name")}, hereby declare that I am ready for the assessment, have reviewed the assessment preparation and plan, understand the assessment process, and am happy that it will be conducted fairly.</p><table className="lw-table lw-sign"><tbody><tr><th>Learner Signature</th><td>{field("declaration-signature","Learner signature")}</td><th>Date</th><td>{field("declaration-date","Declaration date","date")}</td><th>Facilitator Signature</th><td>{field("declaration-facilitator","Facilitator signature")}</td></tr></tbody></table><div className="lw-unit-title lw-unit-inline"><div><b>Demonstrate an understanding of issues affecting the management of a local area computer network (LAN)</b><h1>Learning Unit 1</h1><dl><dt>UNIT STANDARD NUMBER</dt><dd>114046</dd><dt>LEVEL ON THE NQF</dt><dd>5</dd><dt>CREDITS</dt><dd>4</dd><dt>FIELD</dt><dd>Physical, Mathematical, Computer and Life Sciences</dd><dt>SUB FIELD</dt><dd>Information Technology and Computer Sciences</dd></dl></div><div className="lw-purpose"><b>PURPOSE:</b><ul><li>This unit standard provides conceptual knowledge of the areas covered.</li><li>It is for those working in or entering Data Communications &amp; Networking.</li><li>Explain management of access to a LAN.</li><li>Explain LAN performance issues.</li><li>Explain LAN support issues.</li><li>Explain typical viruses on LANs.</li></ul><b>LEARNING ASSUMED TO BE IN PLACE:</b><p>The credit value assumes prior knowledge and skills in local area networks, computer network principles, and supporting users of a LAN.</p></div></div></Page>

    {displayedOutcomes.map((outcome, outcomeIndex) => <Page key={outcome.no} number={6 + outcomeIndex}><OutcomeHeader outcome={outcome} result={results[outcomeIndex]}/>{outcome.questions.map((question, questionIndex) => {
      const legacyId = questionIndex === 0 ? `outcome-${outcome.no}.page-1` : undefined;
      const task = { id: question.id, task: question.task, text: question.text, marks: question.mark };
      return <div className="lw-task-answer" key={question.id}><table className="lw-table lw-question"><thead><tr><th>Task</th><th>Questions Description</th><th>SO</th><th>Mark</th></tr></thead><tbody><tr><td>{question.task}</td><td>{question.text}</td><td>{outcome.no}</td><td>{question.mark}</td></tr></tbody></table><WorkbookTaskAnswer outcomeId={`outcome-${outcome.no}`} task={task} memoItem={memoItems.find(item => item.id === `outcome-${outcome.no}`)} valueKey={`learner-workbook.outcome-${outcome.no}.${question.id}.answer`} markKey={`learner-workbook.task-mark.${question.id}`} values={values} onChange={onChange} legacyAnswer={legacyId ? questionAnswer(outcome.no, question.id, legacyId) : ""}/></div>;
    })}</Page>)}

    <Page number={10}><div className="lw-bar">SELF-ASSESSMENT</div><p>The learner must use this self-evaluation checklist to rate their mastery of the learning outcomes.</p><ol><li>Not able to comply</li><li>Reasonable compliance</li><li>Able to comply fully</li></ol><table className="lw-table lw-self"><thead><tr><th>LEARNING OUTCOMES</th><th>1</th><th>2</th><th>3</th></tr></thead><tbody>{Array.from({length:7},(_,index)=><tr key={index}><td>{index+1}</td>{[1,2,3].map(score=><td key={score}><Tick id={`self.${index+1}.${score}`} label={`Learning outcome ${index+1}, rating ${score}`} values={values} onChange={onChange}/></td>)}</tr>)}</tbody></table><div className="lw-sign-lines"><label>Learner Signature {field("self-learner-signature","Learner signature")}</label><label>Date {field("self-learner-date","Learner date","date")}</label><label>Facilitator’s Signature {field("self-facilitator-signature","Facilitator signature")}</label><label>Date {field("self-facilitator-date","Facilitator date","date")}</label></div><div className="lw-bar">ASSESSMENT FEEDBACK REPORT</div><h3>FACILITATOR FEEDBACK &amp; REMARKS</h3><Lines id="facilitator-feedback" count={5} label="Facilitator feedback and remarks" values={values} onChange={onChange}/></Page>

    <Page number={11} className="lw-final-page"><div className="lw-bar">ASSESSMENT JUDGMENT</div><div className="lw-judgment"><div className="lw-j-grid"><span className="lw-j-label">Learner’s Total Mark:</span><span className="lw-j-control">{field("total-mark","Learner total mark")}</span><span className="lw-j-label">Requirements met</span><span className="lw-j-control lw-j-check"><Tick id="requirements-met" label="Requirements met" values={values} onChange={onChange}/></span><span className="lw-j-label">Requirements not met</span><span className="lw-j-control lw-j-check"><Tick id="requirements-not-met" label="Requirements not met" values={values} onChange={onChange}/></span><span className="lw-j-label">Action/s required:</span><span className="lw-j-control"><MultilineField id="actions-required" label="Actions required" values={values} onChange={onChange}/></span><span className="lw-j-label" /><span className="lw-j-control" /><span className="lw-j-label">By when:</span><span className="lw-j-control">{field("actions-date","Actions due date","date")}</span></div></div><div className="lw-bar">LEARNER FEEDBACK &amp; COMMENTS</div><Lines id="learner-feedback" count={4} label="Learner feedback and comments" values={values} onChange={onChange}/><div className="lw-bar">DECLARATION BY THE FACILITATOR</div><p>I, {field("facilitator-declaration-name","Facilitator name")}, hereby certify that I have examined the learner workbook and am satisfied with the evidence provided by the learner.</p><div className="lw-bar">DECLARATION BY LEARNER</div><p>I, {field("learner-final-name","Learner name")}, declare that I am satisfied that the feedback given to me was relevant, sufficient and constructive. I accept the assessment judgment and have no further questions relating to this assessment event.</p><table className="lw-table lw-sign"><tbody><tr><th>Learner</th><td>{field("learner-final-signature","Learner signature")}</td><th>Date</th><td>{field("learner-final-date","Learner date","date")}</td><th>Facilitator</th><td>{field("facilitator-final-signature","Facilitator signature")}</td><th>Date</th><td>{field("facilitator-final-date","Facilitator date","date")}</td></tr></tbody></table><div className="lw-bar">DECLARATION BY THE ASSESSOR</div><p>I, {field("assessor-name","Assessor name")}, hereby certify that I have examined the learner workbook and am satisfied with the Facilitator Judgment of this assessment.</p><table className="lw-table lw-sign"><tbody><tr><th>Assessor</th><td>{field("assessor-signature","Assessor signature")}</td><th>Date</th><td>{field("assessor-date","Assessor date","date")}</td><th>Moderator</th><td>{field("moderator-signature","Moderator signature")}</td><th>Date</th><td>{field("moderator-date","Moderator date","date")}</td></tr></tbody></table></Page>
  </div></>;
}
