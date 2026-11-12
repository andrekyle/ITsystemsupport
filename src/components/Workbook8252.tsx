import { useState } from "react";
import type { Profile } from "../types";
import { isStaff } from "../types";
import type { WorkbookMemoItem } from "../store";
import { Icon } from "../icons";
import { learnerWorkbookFeedback, workbookMarkFingerprint } from "../lib/workbookMarking";
import { WorkbookCover } from "./WorkbookCover";
import { WorkbookTaskAnswer } from "./WorkbookTaskAnswer";
import { DocumentActions } from "./DocumentActions";
import { DocumentSignature } from "./DocumentSignature";
import { canSignDocumentField } from "../lib/documentSignatures";
import { WORKBOOK_8252 } from "../data/workbook8252";
// The 8252 scan uses the same Eruditio workbook shell as the 114074 replica,
// so its page styles are reused here.
import "./workbook-114074.css";

type Values = Record<string, string | boolean>;
type Save = (key: string, value: string | boolean) => void;

/** Assessment preparation checklist rows, as printed on pages 5-6 of the scan. */
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

const outcome = WORKBOOK_8252.outcomes[0];

/** Learner workbook for US 8252, recreated page-for-page from the source scan
 * (src/components/SAQA-8252-Learner Workbook.html) with AI marking per
 * activity against the unit's marking memo. */
export function Workbook8252({ values, onChange, onSave, profile, memoItems }: { values: Values; onChange: Save; onSave: () => Promise<void>; profile: Profile; memoItems: WorkbookMemoItem[] }) {
  const [marking, setMarking] = useState(false);
  const [markError, setMarkError] = useState("");
  const memoItem = memoItems.find(item => item.id === outcome.id);
  const readyToMark = outcome.questions.every(question => !!memoItem?.tasks?.some(task => task.id === question.id) && memoItem.criteria.some(criterion => criterion.taskId === question.id));
  const outcomeResult = (() => {
    try { return JSON.parse(String(values[`learner-workbook.mark.${outcome.id}`] ?? "")) as { awarded: number; maxMarks: number; feedback: string }; }
    catch { return undefined; }
  })();
  const saveTaskAnswer = (questionId: string, key: string, value: string | boolean) => {
    const answerKey = `learner-workbook.${outcome.id}.${questionId}.answer`;
    if (key === answerKey && String(values[answerKey] ?? "") !== String(value)) {
      onChange(`learner-workbook.task-mark.${questionId}`, "");
      onChange(`learner-workbook.mark.${outcome.id}`, "");
    }
    onChange(key, value);
  };
  const markWorkbook = async () => {
    if (marking || !readyToMark) return;
    setMarking(true); setMarkError("");
    try {
      const entries = outcome.questions.map(question => {
        const task = memoItem!.tasks!.find(item => item.id === question.id)!;
        const criteria = memoItem!.criteria.filter(item => item.taskId === question.id);
        const answer = String(values[`learner-workbook.${outcome.id}.${question.id}.answer`] ?? "").trim();
        const answerHash = workbookMarkFingerprint(answer, { task, criteria });
        const item = { id: `${outcome.id}--${question.id}`, question: question.text, maxMarks: question.marks, tasks: [task], criteria };
        let cached: { awarded: number; maxMarks: number; feedback: string; answerHash?: string } | undefined;
        try { cached = JSON.parse(String(values[`learner-workbook.task-mark.${question.id}`] ?? "")); } catch { cached = undefined; }
        return { question, item, answer, answerHash, cached };
      });
      const pending = entries.filter(entry => entry.cached?.answerHash !== entry.answerHash);
      let fresh: Array<{ id: string; awarded: number; maxMarks: number; feedback: string; correctSegments?: string[]; incorrectSegments?: string[] }> = [];
      if (pending.length) {
        const response = await fetch("/api/workbook-memo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "mark", unitId: "8252", qualificationContext: "National Diploma in Retail / Wholesale Management, NQF Level 5. Unit Standard 8252: Writing business reports in Retail/Wholesale practices. Purpose: write business reports that meet business information needs, use appropriate confidential information and procedures, meet format and deadline requirements, and verify and distribute information appropriately.", learningContext: outcome.learningOutcomes, items: pending.map(entry => entry.item), answers: pending.map(entry => ({ id: entry.item.id, answer: `Task ${entry.question.task}: ${entry.question.text}\n${entry.answer}` })) }) });
        const data = await response.json() as { results?: typeof fresh; error?: string };
        if (!response.ok || !data.results) throw new Error(data.error || "The workbook could not be marked.");
        fresh = data.results;
      }
      const results = entries.map(entry => {
        const result = fresh.find(candidate => candidate.id === entry.item.id) ?? entry.cached;
        if (!result) throw new Error(`Activity ${entry.question.task} was not marked.`);
        onChange(`learner-workbook.task-mark.${entry.question.id}`, JSON.stringify({ ...result, answerHash: entry.answerHash }));
        return result;
      });
      const awarded = results.reduce((sum, result) => sum + result.awarded, 0);
      const maxMarks = results.reduce((sum, result) => sum + result.maxMarks, 0);
      onChange(`learner-workbook.mark.${outcome.id}`, JSON.stringify({ awarded, maxMarks, feedback: `${results.filter(result => result.awarded >= result.maxMarks).length} of ${results.length} activities fully correct.` }));
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
  const answer = (id: string, label: string) => <textarea aria-label={label} value={String(values[`learner-workbook.${id}`] ?? "")} onChange={event => onChange(`learner-workbook.${id}`, event.target.value)} />;
  const tick = (id: string, label: string) => <input type="checkbox" aria-label={label} checked={values[`learner-workbook.${id}`] === true} onChange={event => onChange(`learner-workbook.${id}`, event.target.checked)} />;
  const checklistRows = (start: number, end: number) => checklist.slice(start, end).map((copy, offset) => {
    const index = start + offset + 1;
    return <tr key={index}><td>{copy}</td><td>{tick(`prep-${index}-yes`, `Preparation ${index}: yes`)}</td><td>{tick(`prep-${index}-no`, `Preparation ${index}: no`)}</td><td>{field(`prep-${index}-comment`, `Preparation ${index}: comments`)}</td></tr>;
  });
  const activityPage = (index: number, page: number) => {
    const question = outcome.questions[index];
    return <section className="lw-page workbook-114074-page workbook-114074-activity" data-page={page} key={question.id}>
      {index === 0 && <div className="lw-outcome-head"><strong>SPECIFIC OUTCOME {outcome.specificOutcome}.</strong><b>{outcome.title}</b><span>Learning Outcomes</span><ol>{outcome.learningOutcomes.map((item, i) => <li key={i}>{item}</li>)}</ol></div>}
      {index === 0 && outcomeResult && <div className="lw-ai-result"><Icon name="checkCircle" size={15}/><strong>AI mark: {outcomeResult.awarded}/{outcomeResult.maxMarks}</strong><span>{isStaff(profile.role) ? outcomeResult.feedback : learnerWorkbookFeedback(outcomeResult)}</span></div>}
      <div className="lw-task-answer">
        <table className="lw-table lw-question"><thead><tr><th>Activity</th><th>Questions Description</th><th>Mark</th></tr></thead><tbody><tr><td>{question.sourceLabel ?? question.task}</td><td>{question.text}</td><td>{question.marks}</td></tr></tbody></table>
        <WorkbookTaskAnswer profile={profile} outcomeId={outcome.id} task={question} memoItem={memoItem} valueKey={`learner-workbook.${outcome.id}.${question.id}.answer`} markKey={`learner-workbook.task-mark.${question.id}`} values={values} onChange={(key, value) => saveTaskAnswer(question.id, key, value)} />
      </div>
    </section>;
  };
  return <section className="generated-workbook workbook-114074 workbook-8252">
    <div className="lw-workbook-actions no-print"><div className="lw-workbook-actions-copy"><strong>Workbook tools</strong><span>Answers save automatically. AI marking uses the unit's marking memo.</span></div><div className="lw-workbook-actions-controls"><DocumentActions name="Learner Workbook" onSave={onSave} /><button type="button" className="btn lw-mark-workbook" disabled={marking || !readyToMark} onClick={() => void markWorkbook()}><Icon name="robot" size={17}/>{marking ? "Marking workbook…" : readyToMark ? "Mark workbook with AI" : "Upload memo to mark"}</button></div>{markError && <span className="auth-error" role="alert">{markError}</span>}</div>
    <div className="lw-document document-print-target">
      <WorkbookCover number={1} title={WORKBOOK_8252.title.toUpperCase()} metadata={["UNIT STANDARD 8252", "NQF LEVEL: 5", "CREDITS: 6", "NOTIONAL HOURS: 60"]}><table className="lw-table lw-cover-table"><thead><tr><th colSpan={2}>LEARNER INFORMATION</th></tr></thead><tbody>{[["cover-name", "Name"], ["cover-surname", "Surname"], ["cover-id", "ID Number"], ["cover-contact", "Contact"]].map(([id, label]) => <tr key={id}><th>{label}</th><td>{field(id, label)}</td></tr>)}</tbody></table></WorkbookCover>
      <section className="lw-page workbook-114074-page" data-page={2}><h2 className="lw-centre">Learner Information:</h2><table className="lw-table lw-details"><thead><tr><th>Details</th><th>Please Complete this Section</th></tr></thead><tbody>{[["full-name", "Name & Surname"], ["organisation", "Organisation"], ["unit-dept", "Unit/Dept"], ["facilitator", "Facilitator Name"], ["date-started", "Date Started"], ["date-completed", "Date of Completion"]].map(([id, label]) => <tr key={id}><th>{label}</th><td>{field(id, label)}</td></tr>)}</tbody></table><div className="lw-copy"><h3>Copyright</h3><p>All rights reserved. The copyright of this document, its previous editions and any annexures thereto, is protected and expressly reserved. No part of this document may be reproduced, stored in a retrievable system, or transmitted, in any form or by any means, electronic, mechanical, photocopying, recording or otherwise without the prior permission.</p></div></section>
      <section className="lw-page workbook-114074-page workbook-114074-overview" data-page={3}><table className="lw-table"><tbody><tr className="workbook-114074-overview-band"><th colSpan={4}>OVERVIEW</th></tr><tr><th>About the Learner Workbook</th><td colSpan={3}>This Learner Exercise Workbook has been designed and developed to evaluate learners’ level of understanding. It forms part of a series of Learner Workbooks that have been developed for <b>NATIONAL CERTIFICATE: INFORMATION TECHNOLOGY: SYSTEMS SUPPORT: SAQA 48573 - LEVEL 5 - 147 CREDITS.</b></td></tr><tr><th>Purpose</th><td colSpan={3}>The purpose of this Learner Exercise Workbook is to evaluate learners’ understanding on the specific outcomes and/or assessment criteria of the following SAQA Registered Unit Standards:</td></tr><tr className="workbook-114074-us-head"><th>US No</th><th>US Title</th><th>Level</th><th>Credits</th></tr><tr><td>Saqa 8252</td><td><b>{WORKBOOK_8252.title.toUpperCase()}</b></td><td>5</td><td>6</td></tr><tr><th>Context</th><td colSpan={3}>This assessment represents the Formative Assessment component of Function in a business environment, for the should be completed in the classroom/training room.</td></tr><tr><th>Resources</th><td colSpan={3}>The following are resources needed for this assessment:<ol><li>Learner Guide; and</li><li>Assessment Preparation.</li></ol></td></tr><tr><th>Instructions to Facilitators</th><td colSpan={3}>Facilitators will be required to:<ul><li>Explain the completion of the workbook to each learner; and</li><li>Interview the learner on similar questions, should he/she not be able to write.</li></ul></td></tr></tbody></table></section>
      <section className="lw-page workbook-114074-page workbook-114074-overview" data-page={4}><div className="workbook-114074-instructions"><table className="lw-table lw-instructions"><tbody><tr><th>Instructions to Learners</th><td>Learners will be required to:<ul><li>Complete the workbook as per the instructions;</li><li>Ensure that all questions are completed;</li><li>Ensure that the completion of the workbook is their own work;</li><li>Ensure that all annexure are attached to the workbook and clearly referred to;</li></ul></td></tr><tr><th>Assessment Time</th><td>Learners are required to complete this assessment within the allocated time frame of {field("assessment-time", "Assessment time")} hours.</td></tr><tr><th>Total Mark</th><td>This formative assessment carries a total mark of {field("total-marks", "Total mark")} points. In order to meet the pass mark, learners are required to achieve a minimum of 80% of the total marks.</td></tr><tr><th>Equipment</th><td>Learners are required to have the following equipment in order to complete this workbook:<ul><li>Pen and Pencil;</li><li>Ruler; and</li><li>Exam Pad – for additional paper.</li></ul></td></tr></tbody></table></div></section>
      <section className="lw-page workbook-114074-page workbook-114074-general" data-page={5}><h3>GENERAL INFORMATION</h3><table className="lw-table workbook-114074-info"><tbody><tr className="workbook-114074-band"><th colSpan={4}>LEARNER DETAILS</th></tr>{[["learner-full-names", "Learner Full Names"], ["learner-id", "Learner ID No."], ["organisation-2", "Organisation"], ["unit-dept-2", "Unit/Dept"]].map(([id, label]) => <tr key={id}><th>{label}:</th><td colSpan={3}>{field(id, label)}</td></tr>)}<tr><th rowSpan={2}>Contact Details:</th><th>Telephone /Cell Numbers:</th><th colSpan={2}>Email Address:</th></tr><tr><td>{field("telephone", "Telephone / Cell Numbers")}</td><td colSpan={2}>{field("email", "Email Address")}</td></tr><tr className="workbook-114074-band"><th colSpan={4}>WORKSHOP DETAILS</th></tr>{[["venue", "Workshop Venue"], ["facilitator-2", "Facilitator Name"], ["date-started-2", "Date Started"], ["date-completed-2", "Date Completed"]].map(([id, label]) => <tr key={id}><th>{label}:</th><td colSpan={3}>{field(id, label)}</td></tr>)}</tbody></table><div className="workbook-114074-check-title">ASSESSMENT PREPARATION CHECKLIST</div><table className="lw-table workbook-114074-checklist"><thead><tr><th>DESCRIPTION</th><th>YES</th><th>NO</th><th>COMMENTS/CONTINGENCY</th></tr></thead><tbody>{checklistRows(0, 4)}</tbody></table></section>
      <section className="lw-page workbook-114074-page workbook-114074-preparation" data-page={6}><table className="lw-table workbook-114074-checklist"><tbody>{checklistRows(4, checklist.length)}</tbody></table><h3>Learner’s Declaration</h3><p>I {field("declaration-learner", "Learner declaration name")} herewith declare that I am ready for the assessment, that we have reviewed the assessment preparation and plan, I understand the assessment process and I am happy that the assessment will be conducted in a fair manner.</p><table className="lw-table workbook-114074-signatures"><tbody><tr><th>Learner Signature:</th><td>{field("learner-signature", "Learner Signature")}</td><th>Date:</th><td>{field("learner-declaration-date", "Learner declaration date")}</td></tr><tr><th>Facilitator Signature:</th><td>{field("facilitator-signature", "Facilitator Signature")}</td><th>Date:</th><td>{field("facilitator-declaration-date", "Facilitator declaration date")}</td></tr></tbody></table></section>
      <section className="lw-page workbook-114074-page workbook-114074-unit" data-page={7}>
        <h2 className="workbook-114074-unit-title">Writing business reports in<br/>Retail/Wholesale practices</h2>
        <div className="workbook-114074-unit-heading"><span>Learning Unit</span><strong>1</strong></div>
        <dl className="workbook-114074-unit-details">
          <dt>UNIT STANDARD NUMBER</dt><dd><span>:</span>8252</dd>
          <dt>LEVEL ON THE NQF</dt><dd><span>:</span>5</dd>
          <dt>CREDITS</dt><dd><span>:</span>6</dd>
          <dt>FIELD</dt><dd><span>:</span>Physical, Mathematical, Computer and Life Sciences</dd>
          <dt>SUB FIELD</dt><dd><span>:</span>Information Technology and Computer Sciences</dd>
        </dl>
        <table className="lw-table workbook-114074-unit-purpose"><tbody><tr><th>PURPOSE:</th><td><ul><li>This unit standard is a fundamental standard towards the qualification National Diploma in Retail / Wholesale management at NQF 5.</li><li>It provides the fundamental competence to write business reports in preparation for the core and elective standards at this level.</li></ul></td></tr><tr className="workbook-114074-unit-assumed-heading"><th colSpan={2}>LEARNING ASSUMED TO BE IN PLACE:</th></tr><tr><td colSpan={2}><p>Communication at NQF Level 4.</p></td></tr></tbody></table>
      </section>
      {activityPage(0, 8)}
      {activityPage(1, 9)}
      {activityPage(2, 10)}
      {activityPage(3, 11)}
      <section className="lw-page workbook-114074-page workbook-114074-self" data-page={12}><div className="lw-bar">SELF-ASSESSMENT</div><p>The learner must make use of the following self-evaluation checklist to rate himself against the learning outcomes of this particular training module in establishing the level of mastery of the information.</p><ol><li>Not able to comply</li><li>Reasonable compliance (Not acceptable for final evaluation)</li><li>Able to comply fully</li></ol><table className="lw-table lw-self"><thead><tr><th>LEARNING OUTCOMES</th><th>1</th><th>2</th><th>3</th></tr></thead><tbody>{Array.from({ length: 7 }, (_, index) => <tr key={index}><td>{index + 1}</td>{[1, 2, 3].map(score => <td key={score}>{tick(`self-${index + 1}-${score}`, `Learning outcome ${index + 1}, rating ${score}`)}</td>)}</tr>)}</tbody></table><div className="workbook-114074-sign-row"><label>{field("self-learner-signature", "Learner Signature")}<span>Learner Signature</span></label><label>{field("self-learner-date", "Self-assessment learner date")}<span>Date</span></label><label>{field("self-facilitator-signature", "Facilitator Signature")}<span>Facilitators’ Signature</span></label><label>{field("self-facilitator-date", "Self-assessment facilitator date")}<span>Date</span></label></div></section>
      <section className="lw-page workbook-114074-page workbook-114074-final" data-page={13}><h3>ASSESSMENT FEEDBACK REPORT</h3><div className="lw-bar">FACILITATOR FEEDBACK &amp; REMARKS</div><div className="workbook-114074-box">{answer("facilitator-feedback", "Facilitator feedback and remarks")}</div><div className="lw-bar">ASSESSMENT JUDGEMENT</div><table className="lw-table workbook-114074-judgement"><tbody><tr><th>Learner’s Total Mark:</th><td>{field("total-mark", "Learner total mark")}</td><th>Requirements met</th><td>{tick("requirements-met", "Requirements met")}</td><th>Requirements not met</th><td>{tick("requirements-not-met", "Requirements not met")}</td></tr><tr><th colSpan={2}>Action/s required:</th><td colSpan={4}>{answer("actions-required", "Actions required")}</td></tr><tr><th colSpan={2}>By when:</th><td colSpan={4}>{field("actions-date", "Actions due date")}</td></tr></tbody></table><div className="lw-bar">LEARNER FEEDBACK &amp; COMMENTS</div><div className="workbook-114074-box">{answer("learner-feedback", "Learner feedback and comments")}</div><div className="lw-bar">DECLARATION BY THE FACILITATOR</div><p>I {field("facilitator-declaration-name", "Facilitator declaration name")} (Facilitator) hereby certify that I have examined the learner workbook and I am satisfied with the evidence provided by the learner.</p></section>
      <section className="lw-page workbook-114074-page workbook-114074-final" data-page={14}><div className="lw-bar">DECLARATION BY LEARNER</div><p>I, {field("learner-final-name", "Learner declaration name")} declare that I am satisfied that the feedback given to me by the Facilitator was relevant, sufficient and done in a constructive manner. I accept the assessment judgment and have no further questions relating to this particular assessment event.</p><table className="lw-table workbook-114074-signatures"><tbody><tr><th>Learner</th><td>{field("learner-final-signature", "Learner Signature")}</td><th>Date</th><td>{field("learner-final-date", "Learner final date")}</td></tr><tr><th>Facilitator</th><td>{field("facilitator-final-signature", "Facilitator Signature")}</td><th>Date</th><td>{field("facilitator-final-date", "Facilitator final date")}</td></tr></tbody></table><div className="lw-bar">DECLARATION BY THE ASSESSOR</div><p>I {field("assessor-declaration-name", "Assessor declaration name")} (Assessor) hereby certify that I have examined the learner workbook and I am satisfied with the Facilitator Judgment of this assessment.</p><table className="lw-table workbook-114074-signatures"><tbody><tr><th>Assessor</th><td>{field("assessor-final-signature", "Assessor Signature")}</td><th>Date</th><td>{field("assessor-final-date", "Assessor final date")}</td></tr><tr><th>Moderator</th><td>{field("moderator-final-signature", "Moderator Signature")}</td><th>Date</th><td>{field("moderator-final-date", "Moderator final date")}</td></tr></tbody></table></section>
    </div>
  </section>;
}
