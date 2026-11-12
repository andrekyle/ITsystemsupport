import { useRef, useState, type ReactNode } from "react";
import type { Profile } from "../types";
import { isStaff } from "../types";
import { learnerWorkbookFeedback } from "../lib/workbookMarking";
import type { WorkbookMemoItem } from "../store";
import { Icon } from "../icons";
import { DocumentActions } from "./DocumentActions";
import { WorkbookCover } from "./WorkbookCover";
import { WORKBOOK_114074 } from "../data/workbook114074";
import "./workbook-114074.css";

type Values = Record<string, string | boolean>;
type Save = (key: string, value: string | boolean) => void;
type Props = { values: Values; onChange: Save; onSave: () => Promise<void>; profile: Profile; memoItems: WorkbookMemoItem[] };

const checklist = [
  "This assessment is a formative assessment and it is based on the outlined unit standard/s for module.",
  "Your assessment evidence for module needs to be submitted on....... (day) of...............(month)...........(year) at the following address/place................................................................",
  "You will be assessed based on the outlined Unit Standards. The assessment activities are linked to specific outcomes/assessment criteria of the outlined Unit Standards.",
  "To determine your competence level, the following are the methods to be used for this assessment: 1. .....................................................",
  "2. .....................................................",
  "To be declared competent on module (formative assessment), you should have obtained at least 80% of the total mark of this assessment.",
  "You will be provided with detailed feedback on your performance of this assessment as follows: 1. Written Feedback 2. Verbal Feedback",
  "Should you be declared ‘not yet competent’ on this assessment, you will be entitled for re-assessment opportunity/ies.",
  "You will be required to re-submit evidence (only for areas) you were declared not yet competent. A date for re-submission will be agreed with the assessor.",
  "You will be entitled to lodge an appeal should you not be satisfied with the assessment decision of your assessment.",
  "You will be required to provide the assessor feedback on assessment procedure – this is to assist in improving the assessment practices.",
  "Your results of assessment and portfolio of evidence information will not be provided to any person without your written consent.",
];

const lessonAnswer114074Task1 = [
  "Types of network standards — There are two main types of network standards: de facto, which arise from tradition, and de jure, which are established through formal regulations.",
  "Network topologies — Network topology refers to the physical arrangement of devices in a network, including configurations like bus, star, ring, tree, and mesh topologies.",
  "Node addressing methods — Node addressing methods are techniques used to identify devices on a network, ensuring proper communication between them.",
  "Industry standards organizations — Organizations like ANSI, IEEE, ISO, and ITU-T are responsible for developing and maintaining network standards to ensure compatibility and efficiency.",
  "Importance of standards — Following network standards is crucial for ensuring reliability and efficiency in network design and operation.",
];

function Page({ number, children, className = "" }: { number: number; children: ReactNode; className?: string }) {
  return <section className={`lw-page workbook-114074-page ${className}`} data-page={number >= 5 ? number - 1 : number}>{children}</section>;
}

export function Workbook114074({ values, onChange, onSave, profile, memoItems }: Props) {
  const documentRef = useRef<HTMLDivElement>(null);
  const [marking, setMarking] = useState<number | "all" | null>(null);
  const [markError, setMarkError] = useState("");
  const [marks, setMarks] = useState<Record<number, { awarded: number; maxMarks: number; feedback: string }>>({});
  const [revealedAnswers, setRevealedAnswers] = useState<number[]>([]);
  const saveActivity = (number: number, key: string, value: string) => {
    if (String(values[key] ?? "") === value) return;
    onChange(key, value);
    const outcome = WORKBOOK_114074.outcomes[number - 1];
    onChange(`built-workbook.mark.${outcome.id}`, "");
    setMarks(current => { const next = { ...current }; delete next[number]; return next; });
  };
  const markActivities = async (numbers: number[]) => {
    if (marking) return;
    try {
      if (!memoItems.length) throw new Error("Upload the official marking memo in the Memo tab to enable AI marking.");
      const items = numbers.map(number => {
        const outcome = WORKBOOK_114074.outcomes[number - 1];
        const memoItem = memoItems.find(item => item.id === outcome.id);
        if (!memoItem?.criteria.length || !memoItem.tasks?.length) throw new Error(`The marking memo has no criteria for Activity ${number}.`);
        const mainKey = `built-workbook.${outcome.id}.${outcome.questions[0].id}`;
        const mainInput = documentRef.current?.querySelector<HTMLTextAreaElement>(`textarea[data-primary-activity="${number}"]`);
        const mainAnswer = (mainInput?.value ?? String(values[mainKey] ?? "")).trim();
        const continuationAnswers = Array.from(documentRef.current?.querySelectorAll<HTMLTextAreaElement>(`textarea[data-activity="${number}"]`) ?? []).filter(input => input !== mainInput).map(input => input.value.trim()).filter(Boolean);
        const parts = [mainAnswer, ...continuationAnswers].filter(Boolean);
        if (!parts.length) throw new Error(`Enter an answer for Activity ${number} before marking.`);
        return { memoItem, answer: `Task ${number}: ${outcome.questions[0].text}\n${parts.join("\n")}`, number };
      });
      setMarking(numbers.length === 3 ? "all" : numbers[0]);
      setMarkError("");
      const response = await fetch("/api/workbook-memo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "mark", items: items.map(item => item.memoItem), answers: items.map(item => ({ id: item.memoItem.id, answer: item.answer })) }) });
      const data = await response.json() as { results?: Array<{ id: string; awarded: number; maxMarks: number; feedback: string }>; error?: string };
      if (!response.ok || !data.results) throw new Error(data.error || "The workbook could not be marked.");
      for (const item of items) {
        const result = data.results.find(candidate => candidate.id === item.memoItem.id);
        if (!result) throw new Error(`AI did not return a mark for Activity ${item.number}.`);
        const outcome = WORKBOOK_114074.outcomes[item.number - 1];
        const mainKey = `built-workbook.${outcome.id}.${outcome.questions[0].id}`;
        const mainAnswer = documentRef.current?.querySelector<HTMLTextAreaElement>(`textarea[data-primary-activity="${item.number}"]`)?.value;
        if (mainAnswer !== undefined && String(values[mainKey] ?? "") !== mainAnswer) onChange(mainKey, mainAnswer);
        onChange(`built-workbook.mark.${item.memoItem.id}`, JSON.stringify(result));
        setMarks(current => ({ ...current, [item.number]: result }));
      }
      onChange("built-workbook.marked-at", new Date().toISOString());
    } catch (error) { setMarkError(error instanceof Error ? error.message : "The workbook could not be marked."); }
    finally { setMarking(null); }
  };
  const field = (id: string, label: string, type = "text") => {
    const key = `built-workbook.source.${id}`;
    const fallback = id === "name" ? profile.name : "";
    return <input key={`${key}:${String(values[key] ?? fallback)}`} type={type} aria-label={label} defaultValue={String(values[key] ?? fallback)} onBlur={event => onChange(key, event.target.value)} />;
  };
  const answer = (id: string, label: string, rows = 7) => {
    const key = `built-workbook.source.${id}`;
    return <textarea key={`${key}:${String(values[key] ?? "")}`} aria-label={label} rows={rows} defaultValue={String(values[key] ?? "")} onBlur={event => onChange(key, event.target.value)} />;
  };
  const tick = (id: string, label: string) => {
    const key = `built-workbook.source.${id}`;
    return <input key={`${key}:${String(values[key] === true)}`} type="checkbox" aria-label={label} defaultChecked={values[key] === true} onChange={event => onChange(key, event.target.checked)} />;
  };
  const checklistRows = (start: number, end: number) => checklist.slice(start, end).map((copy, offset) => {
    const index = start + offset + 1;
    return <tr key={index}><td>{copy}</td><td>{tick(`prep-${index}-yes`, `Preparation ${index}: yes`)}</td><td>{tick(`prep-${index}-no`, `Preparation ${index}: no`)}</td><td>{field(`prep-${index}-comment`, `Preparation ${index}: comments`)}</td></tr>;
  });
  const checklistHead = <thead><tr><th>DESCRIPTION</th><th>YES</th><th>NO</th><th>COMMENTS/CONTINGENCY</th></tr></thead>;
  const outcomePage = (outcomeIndex: number, page: number) => {
    const outcome = WORKBOOK_114074.outcomes[outcomeIndex];
    const task = outcome.questions[0];
    const key = `built-workbook.${outcome.id}.${task.id}`;
    let previousMark: { awarded: number; maxMarks: number; feedback: string } | undefined;
    try { previousMark = JSON.parse(String(values[`built-workbook.mark.${outcome.id}`] ?? "")); } catch { /* No mark yet. */ }
    const result = marks[task.task] ?? previousMark;
    const feedback = result ? (isStaff(profile.role) ? result.feedback : learnerWorkbookFeedback(result)) : "";
    const memoTask = memoItems.find(item => item.id === outcome.id)?.tasks?.find(item => item.id === task.id || item.task === task.task);
    const modelAnswer = memoTask?.modelAnswer?.trim() ?? "";
    const answerPoints = task.task === 1 ? lessonAnswer114074Task1 : modelAnswer.split(/\n+/).map(line => line.trim()).filter(Boolean);
    const answerShown = revealedAnswers.includes(task.task);
    return <Page number={page} className="workbook-114074-activity" key={page}>
      <div className="lw-outcome-head"><strong>SPECIFIC OUTCOME {outcome.specificOutcome}.</strong><b>{outcome.title}</b><span>Learning Outcomes</span><ol>{outcome.learningOutcomes.map(line => <li key={line}>{line}</li>)}</ol></div>
      {result && <div className="lw-ai-result"><Icon name="checkCircle" size={15}/><strong>AI mark: {result.awarded}/{result.maxMarks}</strong><span>{feedback}</span></div>}
      <div className="lw-task-answer"><table className="lw-table lw-question"><thead><tr><th>Task</th><th>Questions Description</th><th>SO</th><th>Mark</th></tr></thead><tbody><tr><td>{task.task}</td><td>{task.text}</td><td>{outcome.specificOutcome}</td><td>{task.marks}</td></tr></tbody></table>
        <div className="workbook-task-response">{result ? <div className="workbook-marked-answer">{String(values[key] ?? "")}</div> : <textarea data-activity={task.task} data-primary-activity={task.task} key={`${key}:${String(values[key] ?? "")}`} aria-label={`Task ${task.task}: ${task.text}`} placeholder="Type your answer here…" defaultValue={String(values[key] ?? "")} onBlur={event => saveActivity(task.task, key, event.target.value)} />}
          <div className="workbook-task-mark-row no-print"><button type="button" className="workbook-task-mark" disabled={!!marking} onClick={() => void markActivities([task.task])}><Icon name="robot" size={15}/>{marking === task.task ? "Marking…" : "Mark answer"}</button>{result && <button type="button" className="workbook-task-edit" onClick={() => { onChange(`built-workbook.mark.${outcome.id}`, ""); setMarks(current => { const next = { ...current }; delete next[task.task]; return next; }); }}>Edit answer</button>}{result && <span className="workbook-task-score">{result.awarded}/{result.maxMarks} — {feedback}</span>}{markError && <span className="workbook-task-notice" role="alert">{markError}</span>}</div>
        </div>
        {isStaff(profile.role) && <div className="workbook-114074-model no-print"><div className="workbook-114074-model-actions"><button type="button" className="workbook-114074-model-toggle" aria-expanded={answerShown} onClick={() => setRevealedAnswers(current => current.includes(task.task) ? current : [...current, task.task])}><Icon name="checkCircle" size={15}/>Check my answer</button>{answerShown && <button type="button" className="workbook-114074-model-toggle" onClick={() => setRevealedAnswers(current => current.filter(number => number !== task.task))}><Icon name="eyeOff" size={15}/>Hide answer</button>}</div>{answerShown && <div className="workbook-114074-model-panel"><h4><Icon name="book" size={14}/>Correct answer — from {task.task === 1 ? "the lesson" : "the marking memo"}</h4>{answerPoints.length ? <ul>{answerPoints.map((line, index) => <li key={index}><Icon name="checkCircle" size={16}/><span>{line}</span></li>)}</ul> : <p>No model answer is available in the current marking memo.</p>}</div>}</div>}
      </div>
    </Page>;
  };
  return <section className="generated-workbook workbook-114074">
    <div className="lw-workbook-actions no-print"><div className="lw-workbook-actions-copy"><strong>Workbook tools</strong><span>Answers save automatically when you leave a field.</span></div><div className="lw-workbook-actions-controls"><DocumentActions name="Learner Workbook" onSave={onSave} /><button type="button" className="btn lw-mark-workbook" disabled={!!marking} onClick={() => void markActivities([1,2,3])}><Icon name="robot" size={17}/>{marking === "all" ? "Marking workbook…" : "Mark workbook with AI"}</button></div>{markError && <span className="auth-error" role="alert">{markError}</span>}</div>
    <div ref={documentRef} className="lw-document document-print-target">
      <WorkbookCover number={1} title={WORKBOOK_114074.title} metadata={["UNIT STANDARD 114074", "NQF LEVEL: 5", "CREDITS: 5", "NOTIONAL HOURS: 50"]}><table className="lw-table lw-cover-table"><thead><tr><th colSpan={2}>LEARNER INFORMATION</th></tr></thead><tbody>{[["cover-name","Name"],["cover-surname","Surname"],["cover-id","ID Number"],["cover-contact","Contact"]].map(([id,label]) => <tr key={id}><th>{label}</th><td>{field(id,label)}</td></tr>)}</tbody></table></WorkbookCover>
      <Page number={2} className="workbook-114074-copyright"><div className="lw-copy"><h3>Copyright</h3><p>All rights reserved. The copyright of this document, its previous editions and any annexures thereto, is protected and expressly reserved. No part of this document may be reproduced, stored in a retrievable system, or transmitted, in any form or by any means, electronic, mechanical, photocopying, recording or otherwise without the prior permission.</p></div></Page>
      <Page number={3} className="workbook-114074-overview"><table className="lw-table"><tbody><tr className="workbook-114074-overview-band"><th colSpan={4}>OVERVIEW</th></tr><tr><th>About the Learner Workbook</th><td colSpan={3}>This Learner Exercise Workbook has been designed and developed to evaluate learners’ level of understanding. It forms part of a series of Learner Workbooks that have been developed for <b>NATIONAL CERTIFICATE: INFORMATION TECHNOLOGY: SYSTEMS SUPPORT: SAQA 48573 - LEVEL 5 - 147 CREDITS.</b></td></tr><tr><th>Purpose</th><td colSpan={3}>The purpose of this Learner Exercise Workbook is to evaluate learners’ understanding on the specific outcomes and/or assessment criteria of the following SAQA Registered Unit Standards:</td></tr><tr className="workbook-114074-us-head"><th>US No</th><th>US Title</th><th>Level</th><th>Credits</th></tr><tr><td>SAQA 114074</td><td><b>DEMONSTRATE AN UNDERSTANDING OF DIFFERENT COMPUTER NETWORK ARCHITECTURES AND STANDARDS</b></td><td>5</td><td>5</td></tr><tr><th>Context</th><td colSpan={3}>This assessment represents the Formative Assessment component of Function in a business environment, for the should be completed in the classroom/training room.</td></tr><tr><th>Resources</th><td colSpan={3}>The following are resources needed for this assessment:<ol><li>Learner Guide; and</li><li>Assessment Preparation.</li></ol></td></tr><tr><th>Instructions to Facilitators</th><td colSpan={3}>Facilitators will be required to:<ul><li>Explain the completion of the workbook to each learner; and</li><li>Interview the learner on similar questions, should he/she not be able to write.</li></ul></td></tr></tbody></table>
      <div className="workbook-114074-instructions"><table className="lw-table lw-instructions"><tbody><tr><th>Instructions to Learners</th><td>Learners will be required to:<ul><li>Complete the workbook as per the instructions;</li><li>Ensure that all questions are completed;</li><li>Ensure that the completion of the workbook is their own work;</li><li>Ensure that all annexure are attached to the workbook and clearly referred to;</li></ul></td></tr><tr><th>Assessment Time</th><td>Learners are required to complete this assessment within the allocated time frame of {field("assessment-time", "Assessment time")} hours.</td></tr><tr><th>Total Mark</th><td>This formative assessment carries a total mark of {field("total-marks", "Total mark")} points. In order to meet the pass mark, learners are required to achieve a minimum of 80% of the total marks.</td></tr><tr><th>Equipment</th><td>Learners are required to have the following equipment in order to complete this workbook:<ul><li>Pen and Pencil;</li><li>Ruler; and</li><li>Exam Pad – for additional paper.</li></ul></td></tr></tbody></table></div></Page>
      <Page number={5} className="workbook-114074-general"><h3>GENERAL INFORMATION</h3><table className="lw-table workbook-114074-info"><tbody><tr className="workbook-114074-band"><th colSpan={4}>LEARNER DETAILS</th></tr>{[["learner-full-names","Learner Full Names"],["learner-id","Learner ID No."],["organisation-2","Organisation"],["unit-dept-2","Unit/Dept"]].map(([id,label]) => <tr key={id}><th>{label}:</th><td colSpan={3}>{field(id,label)}</td></tr>)}<tr><th rowSpan={2}>Contact Details:</th><th>Telephone /Cell Numbers:</th><th colSpan={2}>Email Address:</th></tr><tr><td>{field("telephone","Telephone / Cell Numbers","tel")}</td><td colSpan={2}>{field("email","Email Address","email")}</td></tr><tr className="workbook-114074-band"><th colSpan={4}>WORKSHOP DETAILS</th></tr>{[["venue","Workshop Venue"],["facilitator-2","Facilitator Name"],["date-started-2","Date Started"],["date-completed-2","Date Completed"]].map(([id,label]) => <tr key={id}><th>{label}:</th><td colSpan={3}>{field(id,label,/Date/.test(label)?"date":"text")}</td></tr>)}</tbody></table><div className="workbook-114074-check-title">ASSESSMENT PREPARATION CHECKLIST</div><table className="lw-table workbook-114074-checklist">{checklistHead}<tbody>{checklistRows(0,4)}</tbody></table></Page>
      <Page number={6} className="workbook-114074-preparation"><table className="lw-table workbook-114074-checklist"><tbody>{checklistRows(4,checklist.length)}</tbody></table><h3>Learner’s Declaration</h3><p>I {field("declaration-learner","Learner declaration name")} herewith declare that I am ready for the assessment, that we have reviewed the assessment preparation and plan, I understand the assessment process and I am happy that the assessment will be conducted in a fair manner.</p><table className="lw-table workbook-114074-signatures"><tbody><tr><th>Learner Signature:</th><td>{field("learner-signature","Learner signature")}</td><th>Date:</th><td>{field("learner-declaration-date","Learner declaration date","date")}</td></tr><tr><th>Facilitator Signature:</th><td>{field("facilitator-signature","Facilitator signature")}</td><th>Date:</th><td>{field("facilitator-declaration-date","Facilitator declaration date","date")}</td></tr></tbody></table></Page>
      <Page number={7} className="workbook-114074-unit">
        <h2 className="workbook-114074-unit-title">Demonstrate an understanding of different<br/>computer network architectures and standards</h2>
        <div className="workbook-114074-unit-heading"><span>Learning Unit</span><strong>1</strong></div>
        <dl className="workbook-114074-unit-details">
          <dt>UNIT STANDARD NUMBER</dt><dd><span>:</span>114074</dd>
          <dt>LEVEL ON THE NQF</dt><dd><span>:</span>5</dd>
          <dt>CREDITS</dt><dd><span>:</span>5</dd>
          <dt>FIELD</dt><dd><span>:</span>Physical, Mathematical, Computer and Life Sciences</dd>
          <dt>SUB FIELD</dt><dd><span>:</span>Information Technology and Computer Sciences</dd>
        </dl>
        <table className="lw-table workbook-114074-unit-purpose"><tbody><tr><th>PURPOSE:</th><td><ul><li>This unit standard is intended:</li><li>To provide fundamental knowledge of the areas covered</li><li>For those entering the workplace in the area of Data Communications &amp; Networking.</li><li>As additional knowledge for those wanting to understand the areas covered</li><li>People credited with this unit standard are able to:</li><li>Describe network types and standards</li><li>Explain local and wide area network architectures</li><li>Explain wide area network (WAN) architectures</li><li>The performance of all elements is to a standard that allows for further learning in this area.</li></ul></td></tr><tr className="workbook-114074-unit-assumed-heading"><th colSpan={2}>LEARNING ASSUMED TO BE IN PLACE:</th></tr><tr><td colSpan={2}><p>The credit value of this unit is based on a person having prior knowledge and skills to:</p><p>Demonstrate an understanding of fundamental mathematics (at least NQF level 3).</p><p>Demonstrate PC competency skills (End-User Computing unit Standards, at least up to NQF level 3.).</p><p>Describe data communications.</p></td></tr></tbody></table>
      </Page>
      {outcomePage(0,8)}
      {outcomePage(1,9)}
      {outcomePage(2,10)}
      <Page number={11} className="workbook-114074-self"><div className="lw-bar">SELF-ASSESSMENT</div><p>The learner must make use of the following self-evaluation checklist to rate himself against the learning outcomes of this particular training module in establishing the level of mastery of the information.</p><ol><li>Not able to comply</li><li>Reasonable compliance (Not acceptable for final evaluation)</li><li>Able to comply fully</li></ol><table className="lw-table lw-self"><thead><tr><th>LEARNING OUTCOMES</th><th>1</th><th>2</th><th>3</th></tr></thead><tbody>{Array.from({length:7},(_,index)=><tr key={index}><td>{index+1}</td>{[1,2,3].map(score=><td key={score}>{tick(`self-${index+1}-${score}`,`Learning outcome ${index+1}, rating ${score}`)}</td>)}</tr>)}</tbody></table><div className="workbook-114074-sign-row"><label>{field("self-learner-signature","Self-assessment learner signature")}<span>Learner Signature</span></label><label>{field("self-learner-date","Self-assessment learner date","date")}<span>Date</span></label><label>{field("self-facilitator-signature","Self-assessment facilitator signature")}<span>Facilitators’ Signature</span></label><label>{field("self-facilitator-date","Self-assessment facilitator date","date")}<span>Date</span></label></div></Page>
      <Page number={12} className="workbook-114074-final"><h3>ASSESSMENT FEEDBACK REPORT</h3><div className="lw-bar">FACILITATOR FEEDBACK &amp; REMARKS</div><div className="workbook-114074-box">{answer("facilitator-feedback","Facilitator feedback and remarks",4)}</div><div className="lw-bar">ASSESSMENT JUDGEMENT</div><table className="lw-table workbook-114074-judgement"><tbody><tr><th>Learner’s Total Mark:</th><td>{field("total-mark","Learner total mark")}</td><th>Requirements met</th><td>{tick("requirements-met","Requirements met")}</td><th>Requirements not met</th><td>{tick("requirements-not-met","Requirements not met")}</td></tr><tr><th colSpan={2}>Action/s required:</th><td colSpan={4}>{answer("actions-required","Actions required",3)}</td></tr><tr><th colSpan={2}>By when:</th><td colSpan={4}>{field("actions-date","Actions due date","date")}</td></tr></tbody></table><div className="lw-bar">LEARNER FEEDBACK &amp; COMMENTS</div><div className="workbook-114074-box">{answer("learner-feedback","Learner feedback and comments",4)}</div><div className="lw-bar">DECLARATION BY THE FACILITATOR</div><p>I {field("facilitator-declaration-name","Facilitator declaration name")} (Facilitator) hereby certify that I have examined the learner workbook and I am satisfied with the evidence provided by the learner.</p></Page>
      <Page number={13} className="workbook-114074-final"><div className="lw-bar">DECLARATION BY LEARNER</div><p>I, {field("learner-final-name","Learner declaration name")} declare that I am satisfied that the feedback given to me by the Facilitator was relevant, sufficient and done in a constructive manner. I accept the assessment judgment and have no further questions relating to this particular assessment event.</p><table className="lw-table workbook-114074-signatures"><tbody><tr><th>Learner</th><th>Date</th><th>Facilitator</th><th>Date</th></tr><tr><td>{field("learner-final-signature","Learner final signature")}</td><td>{field("learner-final-date","Learner final date","date")}</td><td>{field("facilitator-final-signature","Facilitator final signature")}</td><td>{field("facilitator-final-date","Facilitator final date","date")}</td></tr></tbody></table><div className="lw-bar">DECLARATION BY THE ASSESSOR</div><p>I {field("assessor-name","Assessor name")} (Assessor) hereby certify that I have examined the learner workbook and I am satisfied with the Facilitator Judgment of this assessment.</p><table className="lw-table workbook-114074-signatures"><tbody><tr><th>Assessor</th><th>Date</th><th>Moderator</th><th>Date</th></tr><tr><td>{field("assessor-signature","Assessor signature")}</td><td>{field("assessor-date","Assessor date","date")}</td><td>{field("moderator-signature","Moderator signature")}</td><td>{field("moderator-date","Moderator date","date")}</td></tr></tbody></table></Page>
    </div>
  </section>;
}
