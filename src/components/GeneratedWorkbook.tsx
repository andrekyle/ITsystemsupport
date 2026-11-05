import React, { Fragment, useEffect, useRef, useState } from "react";
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

function WorkbookContent114074({ values, onChange }: { values: Values; onChange: Save }) {
  const field = (id: string, label: string, type = "text") => <input aria-label={label} type={type} defaultValue={String(values[`built-workbook.source.${id}`] ?? "")} onBlur={event => onChange(`built-workbook.source.${id}`, event.target.value)} />;
  const area = (id: string, label: string) => <textarea aria-label={label} rows={5} defaultValue={String(values[`built-workbook.source.${id}`] ?? "")} onBlur={event => onChange(`built-workbook.source.${id}`, event.target.value)} />;
  return <>
    <section className="lw-page" data-page="2"><h2 className="lw-centre">Learner Information:</h2><table className="lw-table lw-details"><thead><tr><th>Details</th><th>Please Complete this Section</th></tr></thead><tbody>{[["name","Name & Surname"],["organisation","Organisation"],["unit-dept","Unit/Dept"],["facilitator","Facilitator Name"],["date-started","Date Started"],["date-completed","Date of Completion"]].map(([id,label])=><tr key={id}><th>{label}</th><td>{field(id,label,/date/i.test(label)?"date":"text")}</td></tr>)}</tbody></table><div className="lw-copy"><h3>Copyright</h3><p>All rights reserved. The copyright of this document, its previous editions and any annexures thereto, is protected and expressly reserved. No part of this document may be reproduced, stored in a retrievable system, or transmitted, in any form or by any means, electronic, mechanical, photocopying, recording or otherwise without the prior permission.</p></div></section>
    <section className="lw-page" data-page="3"><table className="lw-table lw-overview"><thead><tr><th colSpan={2}>OVERVIEW</th></tr></thead><tbody><tr><th>About the<br/>Learner<br/>Workbook</th><td>This Learner Exercise Workbook has been designed and developed to evaluate learners’ level of understanding. It forms part of a series of Learner Workbooks that have been developed for <b>NATIONAL CERTIFICATE: INFORMATION TECHNOLOGY: SYSTEMS SUPPORT: SAQA 48573 - LEVEL 5 - 147 CREDITS.</b></td></tr><tr><th>Purpose</th><td>The purpose of this Learner Exercise Workbook is to evaluate learners’ understanding on the specific outcomes and/or assessment criteria of the following SAQA Registered Unit Standards:</td></tr><tr><th colSpan={2} style={{padding:0}}><table className="lw-table lw-us-table"><thead><tr><th>US No</th><th>US Title</th><th>Level</th><th>Credits</th></tr></thead><tbody><tr><td>SAQA 114074</td><td><b>DEMONSTRATE AN UNDERSTANDING OF DIFFERENT COMPUTER NETWORK ARCHITECTURES AND STANDARDS</b></td><td>5</td><td>5</td></tr></tbody></table></th></tr><tr><th>Context</th><td>This assessment represents the Formative Assessment component of Function in a business environment, for the <b>Demonstrate an understanding of different computer network architectures and standards</b> unit standard and should be completed in the classroom/training room.</td></tr><tr><th>Resources</th><td>The following are resources needed for this assessment:<ol><li>Learner Guide; and</li><li>Assessment Preparation.</li></ol></td></tr><tr><th>Instructions to<br/>Facilitators</th><td>Facilitators will be required to:<ul><li>Explain the completion of the workbook to each learner; and</li><li>Interview the learner on similar questions, should he/she not be able to write.</li></ul></td></tr></tbody></table></section>
    <section className="lw-page" data-page="4"><table className="lw-table lw-instructions"><tbody><tr><th>Context</th><td>This assessment represents the Formative Assessment component of Function in a business environment and should be completed in the classroom/training room.</td></tr><tr><th>Resources</th><td>The following resources are needed:<ol><li>Learner Guide</li><li>Assessment Preparation</li></ol></td></tr><tr><th>Instructions to Facilitators</th><td>Explain completion of the workbook to each learner and interview the learner on similar questions should they not be able to write.</td></tr><tr><th>Instructions to Learners</th><td><ul><li>Complete the workbook as per the instructions.</li><li>Ensure all questions are completed.</li><li>Ensure the work is your own.</li><li>Attach and clearly reference all annexures.</li></ul></td></tr><tr><th>Assessment Time</th><td>Learners are required to complete this assessment within the allocated time frame of {field("assessment-time","Assessment time")} hours.</td></tr><tr><th>Total Mark</th><td>This formative assessment carries a total mark of {field("total-marks","Total marks")} points. Learners must achieve a minimum of 80%.</td></tr><tr><th>Equipment</th><td>Pen and pencil, ruler, and exam pad for additional paper.</td></tr></tbody></table></section>
    <section className="lw-page" data-page="5"><h3>GENERAL INFORMATION</h3><div className="lw-bar">LEARNER DETAILS</div><table className="lw-table lw-details"><tbody>{[["learner-full-names","Learner Full Names"],["learner-id","Learner ID No."],["organisation-2","Organisation"],["unit-dept-2","Unit/Dept"],["telephone","Telephone / Cell Numbers"],["email","Email Address"],["venue","Workshop Venue"],["facilitator-2","Facilitator Name"],["date-started-2","Date Started"],["date-completed-2","Date Completed"]].map(([id,label])=><tr key={id}><th>{label}</th><td>{field(id,label,/date/i.test(label)?"date":"text")}</td></tr>)}</tbody></table><div className="lw-bar">ASSESSMENT PREPARATION CHECKLIST</div><table className="lw-table lw-checklist"><thead><tr><th>DESCRIPTION</th><th>YES</th><th>NO</th><th>COMMENTS/CONTINGENCY</th></tr></thead><tbody>{[
      "This assessment is a formative assessment and it is based on the outlined unit standard/s for module.",
      "Your assessment evidence for module needs to be submitted on the agreed day, month and year at the agreed address/place.",
      "You will be assessed based on the outlined Unit Standards. The assessment activities are linked to specific outcomes/assessment criteria of the outlined Unit Standards.",
      "To determine your competence level, the following are the methods to be used for this assessment: 1. Written assessment; 2. Practical/portfolio evidence."
    ].map((text,index)=><tr key={text}><td>{text}</td><td><input type="checkbox" aria-label={`Checklist ${index + 1} yes`} /></td><td><input type="checkbox" aria-label={`Checklist ${index + 1} no`} /></td><td><input aria-label={`Checklist ${index + 1} comments`} /></td></tr>)}</tbody></table></section>
    <section className="lw-page" data-page="6"><div className="lw-bar">ASSESSMENT PREPARATION CHECKLIST</div><p>To be declared competent on module (formative assessment), you should have obtained at least 80% of the total mark of this assessment.</p><p>You will be provided with detailed feedback on your performance of this assessment as follows:</p><ol><li>Written Feedback</li><li>Verbal Feedback</li></ol><p>Should you be declared “not yet competent” on this assessment, you will be entitled to reassessment opportunity/ies. You will be required to re-submit evidence only for areas where you were declared not yet competent. A date for re-submission will be agreed with the assessor.</p><p>You will be entitled to lodge an appeal should you not be satisfied with the assessment decision of your assessment.</p><p>You will be required to provide the assessor feedback on assessment procedure – this is to assist in improving the assessment practices.</p><p>Your results of assessment and portfolio of evidence information will not be provided to any person without your written consent.</p><h3>Learner’s Declaration</h3><p>I, {field("declaration-learner","Learner name")}, herewith declare that I am ready for the assessment, that we have reviewed the assessment preparation and plan, I understand the assessment process and I am happy that the assessment will be conducted in a fair manner.</p><table className="lw-table lw-details"><tbody><tr><th>Learner Signature</th><td>{field("learner-signature","Learner signature")}</td></tr><tr><th>Date</th><td>{field("learner-declaration-date","Learner declaration date","date")}</td></tr><tr><th>Facilitator Signature</th><td>{field("facilitator-signature","Facilitator signature")}</td></tr><tr><th>Date</th><td>{field("facilitator-declaration-date","Facilitator declaration date","date")}</td></tr></tbody></table></section>
    <section className="lw-page" data-page="7"><div className="lw-bar">LEARNING UNIT 1</div><p><b>Unit standard number:</b> 114074<br/><b>Level on the NQF:</b> 5<br/><b>Credits:</b> 5<br/><b>Field:</b> Physical, Mathematical, Computer and Life Sciences<br/><b>Sub-field:</b> Information Technology and Computer Sciences</p><h3>PURPOSE</h3><p>This unit standard provides fundamental knowledge of data communications and networking for people entering the workplace and those wanting to understand the areas covered.</p><p>People credited with this unit standard are able to:</p><ul><li>Describe network types and standards.</li><li>Explain local and wide area network architectures.</li><li>Explain wide area network (WAN) architectures.</li></ul><h3>LEARNING ASSUMED TO BE IN PLACE</h3><p>Prior knowledge includes fundamental mathematics, PC competency skills and an understanding of data communications.</p></section>
  </>;
}

function FinalPages114074() {
  return <>
    <section className="lw-page lw-114074-final" data-page="17"><h3>ASSESSMENT FEEDBACK REPORT</h3><div className="lw-bar">FACILITATOR FEEDBACK &amp; REMARKS</div><div className="lw-final-box" /><div className="lw-bar">ASSESSMENT JUDGEMENT</div><table className="lw-table lw-judgement-grid"><tbody><tr><th>Learner’s Total Mark:</th><td><input aria-label="Learner total mark" /></td><th>Requirements met</th><td><input type="checkbox" aria-label="Requirements met" /></td><th>Requirements not met</th><td><input type="checkbox" aria-label="Requirements not met" /></td></tr><tr><th colSpan={2}>Action/s required:</th><td colSpan={4}><textarea aria-label="Actions required" rows={3} /></td></tr><tr><th colSpan={2}>By when:</th><td colSpan={4}><input type="date" aria-label="Actions due date" /></td></tr></tbody></table><div className="lw-bar">LEARNER FEEDBACK &amp; COMMENTS</div><div className="lw-final-box" /><div className="lw-bar">DECLARATION BY THE FACILITATOR</div><p>I, <input aria-label="Facilitator declaration name" />, hereby certify that I have examined the learner workbook and am satisfied with the evidence provided by the learner.</p></section>
    <section className="lw-page lw-114074-final" data-page="18"><div className="lw-bar">DECLARATION BY LEARNER</div><p>I, <input aria-label="Learner declaration name" />, declare that I am satisfied that the feedback given to me by the Facilitator was relevant, sufficient and done in a constructive manner. I accept the assessment judgment and have no further questions relating to this particular assessment event.</p><table className="lw-table lw-sign"><tbody><tr><th>Learner</th><th>Date</th><th>Facilitator</th><th>Date</th></tr><tr><td><input aria-label="Learner declaration signature" /></td><td><input type="date" aria-label="Learner declaration date" /></td><td><input aria-label="Facilitator declaration signature" /></td><td><input type="date" aria-label="Facilitator declaration date" /></td></tr></tbody></table><div className="lw-bar">DECLARATION BY THE ASSESSOR</div><p>I, <input aria-label="Assessor declaration name" />, hereby certify that I have examined the learner workbook and am satisfied with the Facilitator Judgment of this assessment.</p><table className="lw-table lw-sign"><tbody><tr><th>Assessor</th><th>Date</th><th>Moderator</th><th>Date</th></tr><tr><td><input aria-label="Assessor signature" /></td><td><input type="date" aria-label="Assessor date" /></td><td><input aria-label="Moderator signature" /></td><td><input type="date" aria-label="Moderator date" /></td></tr></tbody></table></section>
  </>;
}

function CopyrightPage114074() {
  return <section className="lw-page lw-114074-copyright" data-page="2"><div className="lw-copy"><h3>Copyright</h3><p>All rights reserved. The copyright of this document, its previous editions and any annexures thereto, is protected and expressly reserved. No part of this document may be reproduced, stored in a retrievable system, or transmitted, in any form or by any means, electronic, mechanical, photocopying, recording or otherwise without the prior permission.</p></div></section>;
}

function GeneralInfoPage114074() {
  const field = (id: string, label: string, type = "text") => <input aria-label={label} type={type} />;
  return <section className="lw-page lw-114074-general" data-page="5"><h3>GENERAL INFORMATION</h3><table className="lw-table lw-details"><tbody><tr><th colSpan={4} className="lw-grey">LEARNER DETAILS</th></tr><tr><th>Learner Full Names:</th><td colSpan={3}>{field("learner-full-names","Learner Full Names")}</td></tr><tr><th>Learner ID No.:</th><td colSpan={3}>{field("learner-id","Learner ID No.")}</td></tr><tr><th>Organisation:</th><td colSpan={3}>{field("organisation","Organisation")}</td></tr><tr><th>Unit/Dept:</th><td colSpan={3}>{field("unit-dept","Unit/Dept")}</td></tr><tr><th>Contact Details:</th><th>Telephone /Cell Numbers:</th><th colSpan={2}>Email Address:</th></tr><tr><td></td><td>{field("telephone","Telephone /Cell Numbers")}</td><td colSpan={2}>{field("email","Email Address")}</td></tr><tr><th colSpan={4} className="lw-grey">WORKSHOP DETAILS</th></tr><tr><th>Workshop Venue:</th><td colSpan={3}>{field("venue","Workshop Venue")}</td></tr><tr><th>Facilitator Name:</th><td colSpan={3}>{field("facilitator","Facilitator Name")}</td></tr><tr><th>Date Started:</th><td colSpan={3}>{field("date-started","Date Started","date")}</td></tr><tr><th>Date Completed:</th><td colSpan={3}>{field("date-completed","Date Completed","date")}</td></tr></tbody></table></section>;
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
      {String(unit.us).trim() === "114074" && <CopyrightPage114074 />}
      {String(unit.us).trim() === "114074" && <GeneralInfoPage114074 />}
      {String(unit.us).trim() === "114074" && <WorkbookContent114074 values={values} onChange={onChange} />}
      {displayedOutcomes.map((outcome, outcomeIndex) => {
        const result = resultFor(outcome.id);
        const sourcePageStart = outcomeIndex === 0 ? 8 : outcomeIndex === 1 ? 11 : 14;
        const continuationPages = outcomeIndex === 0 ? 2 : outcomeIndex === 1 ? 2 : 1;
        return <React.Fragment key={outcome.id}><section className="lw-page" data-page={String(unit.us).trim() === "114074" ? sourcePageStart : outcomeIndex + 2}>
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
        </section>{String(unit.us).trim() === "114074" && Array.from({ length: continuationPages }, (_, continuationIndex) => <section className="lw-page" data-page={sourcePageStart + continuationIndex + 1} key={`${outcome.id}-continuation-${continuationIndex}`}><div className="lw-outcome-head"><strong>ACTIVITY {outcome.questions[0]?.task}</strong><b>{outcome.questions[0]?.text}</b></div><div className="lw-lines"><textarea rows={18} aria-label={`Activity ${outcome.questions[0]?.task} continuation answer page ${continuationIndex + 1}`} /></div></section>)}</React.Fragment>;
      })}
      {false && String(unit.us).trim() === "114074" && <>
        <section className="lw-page" data-page="15"><div className="lw-bar">SELF-ASSESSMENT</div><p>The learner must use this self-evaluation checklist to rate mastery of the learning outcomes.</p><ol><li>Not able to comply</li><li>Reasonable compliance (not acceptable for final evaluation)</li><li>Able to comply fully</li></ol><table className="lw-table lw-self"><thead><tr><th>LEARNING OUTCOMES</th><th>1</th><th>2</th><th>3</th></tr></thead><tbody>{[1,2,3,4,5,6,7].map(item=><tr key={item}><td>{item}</td><td><input type="checkbox" aria-label={`Learning outcome ${item}, rating 1`} /></td><td><input type="checkbox" aria-label={`Learning outcome ${item}, rating 2`} /></td><td><input type="checkbox" aria-label={`Learning outcome ${item}, rating 3`} /></td></tr>)}</tbody></table><p>Learner Signature: <input aria-label="Learner signature" /> Date: <input type="date" aria-label="Learner self assessment date" /></p><p>Facilitator’s Signature: <input aria-label="Facilitator signature" /> Date: <input type="date" aria-label="Facilitator self assessment date" /></p></section>
        <section className="lw-page" data-page="16"><div className="lw-bar">ASSESSMENT FEEDBACK REPORT</div><h3>FACILITATOR FEEDBACK &amp; REMARKS</h3><textarea rows={8} aria-label="Facilitator feedback and remarks" /><div className="lw-bar">ASSESSMENT JUDGEMENT</div><table className="lw-table lw-details"><tbody><tr><th>Learner’s Total Mark</th><td><input aria-label="Learner total mark" /></td></tr><tr><th>Requirements met</th><td><input type="checkbox" aria-label="Requirements met" /></td></tr><tr><th>Requirements not met</th><td><input type="checkbox" aria-label="Requirements not met" /></td></tr><tr><th>Action/s required</th><td><textarea rows={3} aria-label="Actions required" /></td></tr><tr><th>By when</th><td><input type="date" aria-label="Actions due date" /></td></tr></tbody></table><div className="lw-bar">LEARNER FEEDBACK &amp; COMMENTS</div><textarea rows={7} aria-label="Learner feedback and comments" /></section>
        <section className="lw-page" data-page="17"><div className="lw-bar">DECLARATION BY THE FACILITATOR</div><p>I, <input aria-label="Facilitator declaration name" />, hereby certify that I have examined the learner workbook and am satisfied with the evidence provided by the learner.</p><div className="lw-bar">DECLARATION BY LEARNER</div><p>I, <input aria-label="Learner declaration name" />, declare that I am satisfied that the feedback given to me by the Facilitator was relevant, sufficient and constructive. I accept the assessment judgment and have no further questions relating to this assessment event.</p><table className="lw-table lw-sign"><tbody><tr><th>Learner</th><td><input aria-label="Learner declaration signature" /></td><th>Date</th><td><input type="date" aria-label="Learner declaration date" /></td><th>Facilitator</th><td><input aria-label="Facilitator declaration signature" /></td><th>Date</th><td><input type="date" aria-label="Facilitator declaration facilitator date" /></td></tr></tbody></table></section>
        <section className="lw-page" data-page="18"><div className="lw-bar">DECLARATION BY THE ASSESSOR</div><p>I, <input aria-label="Assessor declaration name" />, hereby certify that I have examined the learner workbook and am satisfied with the Facilitator Judgment of the learner workbook.</p><table className="lw-table lw-sign"><tbody><tr><th>Assessor</th><td><input aria-label="Assessor signature" /></td><th>Date</th><td><input type="date" aria-label="Assessor date" /></td><th>Moderator</th><td><input aria-label="Moderator signature" /></td><th>Date</th><td><input type="date" aria-label="Moderator date" /></td></tr></tbody></table></section>
      </>}
      {String(unit.us).trim() === "114074" && <FinalPages114074 />}
    </div>
  </section>;
}
