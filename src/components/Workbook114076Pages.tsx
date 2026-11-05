import type { ReactNode } from "react";
import type { WorkbookSpec } from "../types";

type Values = Record<string, string | boolean>;
type Props = {
  workbook: WorkbookSpec;
  field: (id: string, label: string) => ReactNode;
  values: Values;
  onChange: (key: string, value: string | boolean) => void;
};

const copyright = "All rights reserved. The copyright of this document, its previous editions and any annexures thereto, is protected and expressly reserved. No part of this document may be reproduced, stored in a retrievable system, or transmitted, in any form or by any means, electronic, mechanical, photocopying, recording or otherwise without the prior permission.";

export function Workbook114076IntroPages({ workbook, field, values, onChange }: Props) {
  const tick = (id: string, label: string) => <input type="checkbox" aria-label={label} checked={values[`learner-workbook.${id}`] === true} onChange={event => onChange(`learner-workbook.${id}`, event.target.checked)} />;
  const signatureColumns = ["Date completed", "Learner’s signature", "Mentor’s signature", "Moderator’s signature"];
  const control = (name: string) => <table className="lw-table lw-114076-control"><thead><tr><th>{name} No</th>{signatureColumns.map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{[1, 2, 3, 4, 5].map(number => <tr key={number}><th>{number}</th>{signatureColumns.map(label => <td key={label}>{field(`${name.toLowerCase()}-${number}-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`, `${name} ${number} ${label}`)}</td>)}</tr>)}</tbody></table>;
  return <>
    <section className="lw-page lw-114076-page" data-page="2">
      <h2 className="lw-centre">Learner Information:</h2>
      <table className="lw-table lw-details"><thead><tr><th>Details</th><th>Please Complete this Section</th></tr></thead><tbody>{[["full-name", "Name & Surname"], ["organisation", "Organisation"], ["unit-dept", "Unit/Dept"], ["facilitator", "Facilitator Name"], ["date-started", "Date Started"], ["date-completed", "Date of Completion"]].map(([id, label]) => <tr key={id}><th>{label}:</th><td>{field(id, label)}</td></tr>)}</tbody></table>
      <div className="lw-copy"><h3>Copyright</h3><p>{copyright}</p></div>
      <h3>Table of contents</h3>
      <h4>Specific Outcome 1: {workbook.outcomes[0].title}</h4>
      <ul>{workbook.outcomes[0].learningOutcomes.slice(0, 2).map(item => <li key={item}>{item}</li>)}</ul>
    </section>
    <section className="lw-page lw-114076-page" data-page="3">
      <ul><li>{workbook.outcomes[0].learningOutcomes[2]}</li></ul>
      {workbook.outcomes.slice(1).map(outcome => <div key={outcome.id}><h4>Specific Outcome {outcome.specificOutcome}: {outcome.title}</h4><ul>{outcome.learningOutcomes.map(item => <li key={item}>{item}</li>)}</ul></div>)}
      <h3>NOTIONAL HOURS BREAKDOWN</h3>
      <p>The candidate undertaking this unit standard is best advised to at least spend one hundred hours of study time on this learning programme. Below is a table which demonstrates how these one hundred hours could be spread:</p>
    </section>
    <section className="lw-page lw-114076-page" data-page="4">
      <h3>TIMEFRAME</h3>
      <table className="lw-table"><thead><tr><th>Total Notional Hours</th><th>Contact Time</th><th>Non-contact — Self-Study/Assessment</th></tr></thead><tbody><tr><td>Credits (3) × 10 = 30</td><td>9 HRS</td><td>21 HRS</td></tr></tbody></table>
      <table className="lw-table lw-114076-programme"><tbody>
        <tr><th>1. Learning Programme Name:</th><td>REFER TO COVER PAGE</td></tr>
        <tr><th>2. SAQA Qualification/Unit Standard Title:</th><td>REFER TO COVER PAGE</td></tr>
        <tr><th>3. Qualification / Unit Standard</th><td>{field("qualification", "Qualification or Unit Standard")}</td></tr>
        <tr><th>4. SAQA ID Number</th><td>{field("saqa-id", "SAQA ID Number")}</td></tr>
        <tr><th>5. NQF Level</th><td>4</td></tr><tr><th>6. Credits</th><td>3</td></tr>
        <tr><th>7. PURPOSE for offering this programme to your learners:</th><td>REFER TO NEXT PAGE</td></tr>
        <tr><th>8. TARGET AUDIENCE for this specific programme:</th><td>REFER TO NEXT PAGE</td></tr>
        <tr><th>9. Entry/Admission Requirements:</th><td>REFER TO NEXT PAGE</td></tr>
        <tr><th>10. Timeframe for Training:</th><td>Theory content — role play, simulation, group work, pair work = 9 hrs. Non-contact session — self-study, assignment, practise guided by coach or mentor, formative assessment and summative assessment = 21 hrs.</td></tr>
      </tbody></table>
    </section>
    <section className="lw-page lw-114076-page" data-page="5">
      <h2 className="lw-114076-contact-title">Contact Details</h2>
      <table className="lw-table lw-114076-contact-header"><colgroup><col style={{width:"17%"}}/><col/></colgroup><tbody>
        <tr><th>Standard<br/>Title:</th><td>{field("standard-title", "Standard title")}</td></tr>
        <tr><th>Course:</th><td>{field("course", "Course")}</td></tr>
      </tbody></table>
      <table className="lw-table lw-114076-contact-grid"><colgroup><col style={{width:"17%"}}/><col style={{width:"12%"}}/><col style={{width:"25%"}}/><col style={{width:"16%"}}/><col style={{width:"30%"}}/></colgroup><tbody>
        <tr className="lw-114076-section"><th colSpan={5}>Assessor Details</th></tr>
        <tr><th>Name</th><td colSpan={4}>{field("assessor-name", "Assessor Name")}</td></tr>
        <tr><th>Branch</th><td colSpan={2}>{field("assessor-branch", "Assessor Branch")}</td><th>Registration No:</th><td>{field("assessor-registration-no", "Assessor Registration No")}</td></tr>
        <tr><th rowSpan={2}>Contact Details</th><th>email:</th><td>{field("assessor-email", "Assessor email")}</td><th colSpan={2}>@primeserv.co.za</th></tr>
        <tr><th>Phone:</th><td>{field("assessor-phone", "Assessor Phone")}</td><th>Fax:</th><td>{field("assessor-fax", "Assessor Fax")}</td></tr>
        <tr className="lw-114076-section"><th colSpan={5}>Moderator Details</th></tr>
        <tr><th>Name</th><td colSpan={4}>{field("moderator-name", "Moderator Name")}</td></tr>
        <tr><th>Branch</th><td colSpan={4}>{field("moderator-branch", "Moderator Branch")}</td></tr>
        <tr><th rowSpan={2}>Contact Details</th><th>email:</th><td>{field("moderator-email", "Moderator email")}</td><th>Registration No:</th><td>{field("moderator-registration-no", "Moderator Registration No")}</td></tr>
        <tr><th>Phone:</th><td>{field("moderator-phone", "Moderator Phone")}</td><th>Fax:</th><td>{field("moderator-fax", "Moderator Fax")}</td></tr>
        <tr className="lw-114076-section"><th colSpan={5}>Candidate Details</th></tr>
        <tr><th>Name</th><td colSpan={2}>{field("candidate-name", "Candidate Name")}</td><th>ID No</th><td>{field("candidate-id-no", "Candidate ID No")}</td></tr>
        <tr><th>Job</th><td colSpan={2}>{field("candidate-job", "Candidate Job")}</td><th>Company</th><td>{field("candidate-company", "Candidate Company")}</td></tr>
        <tr><th>Department</th><td colSpan={4}>{field("candidate-department", "Candidate Department")}</td></tr>
        <tr><th rowSpan={2}>Contact Details</th><th>Email:</th><td colSpan={3}>{field("candidate-email", "Candidate Email")}</td></tr>
        <tr><th>Phone:</th><td>{field("candidate-phone", "Candidate Phone")}</td><th>Fax:</th><td>{field("candidate-fax", "Candidate Fax")}</td></tr>
        <tr><td colSpan={5} className="lw-114076-confirm-cell">I confirm that:
          {[
            "the purpose of the assessment has been clearly explained to me",
            "the criteria have been discussed with me, and I know I will be assessed against these criteria",
            "I know when and where I will be assessed, and I was given fair notice",
            "I know how the assessment will be done, and any other requirements related to the assessment",
          ].map((statement, index) => <label className="lw-114076-confirm" key={statement}>{tick(`confirm-${index + 1}`, statement)} {statement}</label>)}
          <div className="lw-114076-signed"><label>Signed: {field("candidate-signed", "Candidate signature")}</label><label>Date: {field("candidate-signed-date", "Candidate signed date")}</label></div>
        </td></tr>
      </tbody></table>
      <table className="lw-table lw-114076-decision"><colgroup><col style={{width:"26%"}}/><col style={{width:"32%"}}/><col style={{width:"10%"}}/><col style={{width:"32%"}}/></colgroup><tbody>
        <tr><th>Overall Assessment<br/>Decision</th><td><label>{tick("competent", "Competent")} Competent</label></td><td colSpan={2}><label>{tick("not-yet-competent", "Not yet competent")} Not yet competent</label></td></tr>
        {["Candidate", "Assessor", "Moderator"].map(role => <tr key={role}><th>{role}’s Signature</th><td>{field(`${role.toLowerCase()}-decision-signature`, `${role} signature`)}</td><th>Date</th><td>{field(`${role.toLowerCase()}-decision-date`, `${role} date`)}</td></tr>)}
      </tbody></table>
    </section>
    <section className="lw-page lw-114076-page" data-page="6">
      <h2>Control sheet</h2>
      {control("Exercise")}{control("Self-check")}
      <table className="lw-table lw-114076-control"><thead><tr><th>Reflection</th>{signatureColumns.map(label => <th key={label}>{label}</th>)}</tr></thead><tbody><tr><th>1</th>{signatureColumns.map(label => <td key={label}>{field(`reflection-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`, `Reflection ${label}`)}</td>)}</tr></tbody></table>
      <p>Answer all questions in this guide.</p>
      <h3>SPECIFIC OUTCOME 1:</h3>
    </section>
  </>;
}

export function Workbook114076FinalPages({ field, values, onChange }: Omit<Props, "workbook">) {
  const text = (id: string, label: string) => <textarea aria-label={label} value={String(values[`learner-workbook.${id}`] ?? "")} onChange={event => onChange(`learner-workbook.${id}`, event.target.value)} />;
  const tick = (id: string, label: string) => <input type="checkbox" aria-label={label} checked={values[`learner-workbook.${id}`] === true} onChange={event => onChange(`learner-workbook.${id}`, event.target.checked)} />;
  return <>
    <section className="lw-page lw-114076-page" data-page="10">
      <div className="lw-bar">SELF-ASSESSMENT</div>
      <p>The learner must make use of the following self-evaluation checklist to rate himself against the learning outcomes of this particular training module in establishing the level of mastery of the information.</p>
      <ol><li>Not able to comply</li><li>Reasonable compliance (Not acceptable for final evaluation)</li><li>Able to comply fully</li></ol>
      <table className="lw-table lw-114076-self"><thead><tr><th>LEARNING OUTCOMES</th><th>1</th><th>2</th><th>3</th></tr></thead><tbody>{[1,2,3,4,5,6].map(number => <tr key={number}><th>{number}</th>{[1,2,3].map(score => <td key={score}>{tick(`self-${number}-${score}`, `Learning outcome ${number} rating ${score}`)}</td>)}</tr>)}</tbody></table>
      <table className="lw-table lw-sign"><tbody><tr><th>Learner Signature</th><td>{field("self-learner-signature", "Learner signature")}</td><th>Date</th><td>{field("self-learner-date", "Learner date")}</td></tr><tr><th>Facilitators’ Signature</th><td>{field("self-facilitator-signature", "Facilitator signature")}</td><th>Date</th><td>{field("self-facilitator-date", "Facilitator date")}</td></tr></tbody></table>
    </section>
    <section className="lw-page lw-114076-page lw-final-page" data-page="11">
      <h2>ASSESSMENT FEEDBACK REPORT</h2>
      <div className="lw-bar">FACILITATOR FEEDBACK &amp; REMARKS</div>{text("facilitator-feedback", "Facilitator feedback and remarks")}
      <div className="lw-bar">ASSESSMENT JUDGEMENT</div>
      <table className="lw-table lw-114076-judgement"><tbody>
        <tr><th>Learner’s Total Mark:</th><td>{field("learner-total-mark", "Learner total mark")}</td><th>Requirements met</th><td>{tick("requirements-met", "Requirements met")}</td><th>Requirements not met</th><td>{tick("requirements-not-met", "Requirements not met")}</td></tr>
        <tr><th>Action/s required:</th><td colSpan={5}>{text("actions", "Actions required")}</td></tr>
        <tr><th>By when:</th><td colSpan={5}>{field("actions-due-date", "Actions due date")}</td></tr>
      </tbody></table>
      <div className="lw-bar">LEARNER FEEDBACK &amp; COMMENTS</div>{text("learner-feedback", "Learner feedback and comments")}
      <div className="lw-bar">DECLARATION BY THE FACILITATOR</div>
      <p>I {field("facilitator-declaration-name", "Facilitator name")} (Facilitator) hereby certify that I have examined the learner workbook and I am satisfied with the evidence provided by the learner.</p>
    </section>
    <section className="lw-page lw-114076-page lw-final-page" data-page="12">
      <div className="lw-bar">DECLARATION BY LEARNER</div>
      <p>I, {field("learner-declaration-name", "Learner name")} declare that I am satisfied that the feedback given to me by the Facilitator was relevant, sufficient and done in a constructive manner. I accept the assessment judgment and have no further questions relating to this particular assessment event.</p>
      <table className="lw-table lw-sign"><tbody><tr><th>Learner</th><td>{field("learner-final-signature", "Learner signature")}</td><th>Date</th><td>{field("learner-final-date", "Learner date")}</td><th>Facilitator</th><td>{field("facilitator-final-signature", "Facilitator signature")}</td><th>Date</th><td>{field("facilitator-final-date", "Facilitator date")}</td></tr></tbody></table>
      <div className="lw-bar">DECLARATION BY THE ASSESSOR</div>
      <p>I {field("assessor-declaration-name", "Assessor name")} (Assessor) hereby certify that I have examined the learner workbook and I am satisfied with the Facilitator Judgment of this assessment.</p>
      <table className="lw-table lw-sign"><tbody><tr><th>Assessor</th><td>{field("assessor-final-signature", "Assessor signature")}</td><th>Date</th><td>{field("assessor-final-date", "Assessor date")}</td><th>Moderator</th><td>{field("moderator-final-signature", "Moderator signature")}</td><th>Date</th><td>{field("moderator-final-date", "Moderator date")}</td></tr></tbody></table>
    </section>
  </>;
}
