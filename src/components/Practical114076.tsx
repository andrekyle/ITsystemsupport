import type { Profile } from "../types";
import { useEffect } from "react";
import { DocumentActions } from "./DocumentActions";
import { DocumentSignature } from "./DocumentSignature";
import { canSignDocumentField } from "../lib/documentSignatures";
import { WorkbookCover } from "./WorkbookCover";
import "./practical-114076.css";

type Values = Record<string, string | boolean>;
type Props = { profile: Profile; values: Values; onChange: (key: string, value: string | boolean) => void; onSave?: () => Promise<void> };
const appealGrounds = [
  "The assessment did not follow the laid down procedure",
  "Not all evidence available was taken into account during the assessment",
  "The assessor was not a subject matter expert nor was a subject matter expert present during the assessment process",
  "The assessment was not according to the performance criteria and the range statement stipulated in the unit standard",
  "Not all the range items were available for the assessment",
];
const meetingItems = [
  <>Welcome the candidate and put them at ease</>,
  <>Explain the purpose of the meeting (why you are there and how long the meeting will take)</>,
  <>Explain the<ul><li>NQF</li><li>Credits</li><li>Certification process</li><li>Learning pathways</li></ul></>,
  <>Explain<ul><li>Who is involved in the assessment and their role (learners, coach, assessors, managers, moderators)</li><li>Principles of assessment (fairness, confidentiality, validity, sufficiency)</li></ul></>,
  <>Explain the assessment process:<ul><li>Check learner readiness for assessment (logbook / self assessment)</li><li>Assessment contract to be completed</li><li>Preparation of learner (this meeting)</li><li>The assessment (observation and knowledge questionnaire)</li><li>Judgement of the evidence</li><li>Outcome of assessment (competent, not yet competent, need further evidence)</li></ul></>,
  <>Give Learner copies of the following documentation and explain each document<ul><li>The Assessment Guide which includes the relevant unit standard(s), assessment contract, assessment plan, observation checklist and knowledge checklist</li></ul></>,
  <>Discuss the assessment plan (complete the assessment plan document)<ul><li>Allow the learner to participate in the decisions made</li><li>Agree on dates, time and venue for the assessment and feedback</li><li>Agree on evidence the learner can submit and explain the assessment methods</li><li>Identify special assessment needs and eliminate unfair barriers</li><li>Discuss and agree on witness requirements</li></ul></>,
  <>Tell the candidate his/her rights and responsibilities, the assessment procedures and policies<ul><li>How many times they may be assessed</li><li>Appeals process / procedure</li><li>Reassessment policy</li></ul></>,
  <>Ensure the assessment environment is appropriate or make special arrangements</>,
  <>Discuss moderation</>,
  <>Allow the learner opportunity to clarify any items discussed</>,
];
const planRows = [
  ["Training", "Classroom training registers", "Training Provider"],
  ["Self assessment", "Assessment contract signed & dated", "Learner file"],
  ["Assessment contract", "Assessment contract signed & dated", "Learner file"],
  ["Initial meeting", "Assessor briefing checklist", "Learner file"],
  ["Unit Standard No", "Assessment contract & assessment plan", "Learner file"],
  ["Observation Assessment", "Assessment instruments", "Learner file"],
  ["Knowledge Assessment", "Assessment instruments", "Learner file"],
  ["Other Evidence", "Research portfolio", "Learner file"],
  ["Feedback", "Feedback Report", "Learner file"],
  ["Moderation", "Moderators report", "Learner file"],
  ["Judgement", "Assessor Summary Report / Moderator report", "Learner file"],
  ["1st Reassessment", "Assessors summary report / instruments", "Learner file"],
  ["2nd Reassessment", "Assessors summary report / instruments", "Learner file"],
];
const practicalRows = [
  "Use computer technology to research a computer topic",
  "Plan the research of a computer topic.",
  "Conduct research of a computer topic using computer technology",
  "Present the results of research of a computer topic using computer technology",
];
const ratings = [
  "No evidence can be found",
  "The evidence found is weak and this is still a major development area for the learner",
  "The evidence found meets the average expectation for a learner on this level",
  "The evidence found is of a high quality and exceeds the average standard expected",
  "The evidence found is outstanding and the learner attitudes and traits are very well developed",
];
const ccfo = [
  ["Identifying", "The learner can identify problems and deficiencies correctly."],
  ["Working in a Team", "The learner is able to work well as member of a team."],
  ["Organising", "The learner works in an organised and systematic way whilst performing all tasks and tests."],
  ["Collecting", "The learner is able to collect the correct and appropriate information and samples as per the instructions and procedures that he or she was taught."],
  ["Communicating", "The learner is able to communicate his or her knowledge orally and in writing, in a way that shows what knowledge he or she has gained."],
  ["Science", "The learner bases tasks and answers on scientific knowledge learnt in the module."],
  ["Demonstrating", "The learner is able to show and perform the tasks required correctly."],
  ["Contributing", "The learner is able to link the knowledge, skills and attitudes acquired in this module to duties in the job or community."],
];
const decisionStatements = [
  "The learner has not submitted sufficient evidence and is therefore not yet competent",
  "The learner is required to submit additional evidence against the following:",
  "The learner is required to improve in the following:",
  "The learner is required to be reassessed:",
  "The learner is required to be assessed by another assessor:",
  "The learner has submitted evidence that is valid, relevant, current, sufficient and authentic against all the listed specific outcomes and covered all range statements and critical cross field outcomes",
  "The learner is competent against the listed unit standards",
  "The learner can be issued with a unit certificate",
  "The learner has completed a full qualification",
];
const review = [
  "Were the principles / criteria for good assessment achieved?",
  "Did the assessment relate to the registered standard?",
  "Was the assessment practical?",
  "Was it time efficient and cost-effective?",
  "The assessment did not interfere with my normal responsibilities?",
  "Was the assessment instrument fair, clear, and understandable?",
  "The assessment judgment was made against set requirements?",
  "Was the venue and equipment functional?",
  "Were special needs identified and the assessment plan adjusted?",
  "Was feedback and communication constructive?",
  "Was an opportunity to appeal given?",
  "Was all evidence recorded?",
  "Were the review / evaluation process apparent and user friendly?",
];

export function Practical114076({ profile, values, onChange, onSave }: Props) {
  useEffect(() => {
    const printStyle = document.createElement("style");
    printStyle.textContent = "@media print { @page { size: A4 portrait; margin: 0; } }";
    document.head.appendChild(printStyle);
    return () => printStyle.remove();
  }, []);
  const key = (id: string) => `practical.pdf.114076.${id}`;
  const input = (id: string, label: string, type = "text") => /signature|\bsign\b/i.test(label)
    ? <DocumentSignature label={label} value={String(values[key(id)] ?? "")} savedSignature={canSignDocumentField(profile.role, label) ? profile.signatureImage : undefined} editable={canSignDocumentField(profile.role, label)} onChange={value => onChange(key(id), value)} />
    : <input aria-label={label} type={type === "date" ? "text" : type} inputMode={type === "date" ? "numeric" : undefined} value={String(values[key(id)] ?? "")} onChange={event => onChange(key(id), event.target.value)} />;
  const area = (id: string, label: string) => <textarea aria-label={label} value={String(values[key(id)] ?? "")} onChange={event => onChange(key(id), event.target.value)} />;
  const tick = (id: string, label: string) => <input type="checkbox" aria-label={label} checked={values[key(id)] === true} onChange={event => onChange(key(id), event.target.checked)} />;
  const row = (id: string, label: string, type = "text") => <tr key={id}><th>{label}</th><td>{input(id, label, type)}</td></tr>;
  const signatures = (id: string) => <table className="p76-table p76-signatures"><tbody><tr>{["Learner", "Assessor", "Moderator"].map(role => <td key={role}>{input(`${id}-${role.toLowerCase()}-signature`, `${role} signature`)}<strong>{role} Name &amp; Signature</strong>{input(`${id}-${role.toLowerCase()}-date`, `${role} date`, "date")}<strong>Date</strong></td>)}</tr></tbody></table>;
  const decision = (id: string, title: string, statements: string[]) => <><div className="p76-bar">{title}</div><table className="p76-table p76-decision"><tbody>{statements.map((statement, index) => <tr key={statement}><td>{statement}{id === "initial-decision" && [1,2].includes(index) && area(`${id}-details-${index}`, `${title} details ${index}`)}</td><td>{tick(`${id}-${index}`, statement)}</td></tr>)}</tbody></table><table className="p76-table"><tbody><tr><td>Assessors full name &amp; signature {input(`${id}-assessor-signature`, `${title} assessor signature`)}</td><td>Date {input(`${id}-date`, `${title} date`, "date")}</td></tr></tbody></table><div className="p76-bar">Declaration by Learner</div><p>I, {input(`${id}-declaration-name`, `${title} learner name`)} declare that I am satisfied that the assessment conducted by the Assessor was relevant, sufficient, and constructive. I accept the assessment decisions and have no further questions relating to this particular assessment process.</p>{signatures(id)}</>;
  return <><DocumentActions name="Unit 114076 Practical Assessment" onSave={onSave} /><div className="lw-document p76-document document-print-target">
    <WorkbookCover number={1} title="USE COMPUTER TECHNOLOGY TO RESEARCH A COMPUTER TOPIC" label="PRACTICAL ASSESSMENT GUIDE" metadata={["UNIT STANDARD 114076", "NQF LEVEL: 4", "CREDITS: 3", "NOTIONAL HOURS: 30"]}><table className="lw-table lw-cover-table"><thead><tr><th colSpan={2}>LEARNER INFORMATION</th></tr></thead><tbody>{[["name","Name"],["surname","Surname"],["id-number","ID Number"],["contact","Contact"]].map(([id,label]) => row(`cover-${id}`,label))}</tbody></table></WorkbookCover>
    <section className="lw-page p76-page" data-page="2">
      <h2>Learner Information:</h2>
      <table className="p76-table p76-learner-info"><colgroup><col style={{width:"31%"}}/><col/></colgroup><thead><tr><th>Details</th><th>Please Complete this Section</th></tr></thead><tbody>{[["full-name","Name & Surname"],["organisation","Organisation"],["unit-dept","Unit/Dept"],["facilitator","Facilitator Name"],["date-started","Date Started"],["date-completed","Date of Completion"]].map(([id,label]) => row(id,label,/date/i.test(label)?"date":"text"))}</tbody></table>
      <h3>UNIT STANDARD INFORMATION:</h3><p>THIS MODULE DEALS WITH THE FOLLOWING NQF UNIT STANDARD:</p>
      <table className="p76-table p76-unit-standard"><colgroup><col style={{width:"14%"}}/><col style={{width:"66%"}}/><col style={{width:"10%"}}/><col style={{width:"10%"}}/></colgroup><thead><tr><th>UNIT CODE</th><th>UNIT TITLE</th><th>LEVEL</th><th>CREDITS</th></tr></thead><tbody><tr><td>114076</td><td><b>Use computer technology to research a computer topic</b></td><td>4</td><td>3</td></tr></tbody></table>
      <h3>THE PURPOSE OF THIS ASSESSMENT INSTRUMENT IS TO PROVIDE EVIDENCE THAT THE LEARNER CAN DO THE FOLLOWING:</h3>
      <h4>Instructions to the Assessor:</h4><div className="p76-assessor-steps">
        <p><b>Step1:</b> Ensure that the learner details are filled in correctly and completely in the Learner Detail section. For info: The original learner contract will remain in the learners main admin file until all assessments are completed.</p>
        <p><b>Step 2:</b> Ensure that the learner signs the Request for Assessment form before assessment takes place.</p>
        <p><b>Step 3:</b> Copies of unit standards are not required to be part of the assessment guide and instruments and can be found in the Unit Standards files found in the Project Managers office if necessary.</p>
        <p><b>Step 4:</b> Ensure that the Initial Briefing Checklist is completed and signed prior to starting the assessment.</p>
        <p><b>Step 5:</b> After assessment, give feedback to the learner using the “Feedback Burger” steps. Feedback must be recorded in feedback section at back of assessment instrument.</p>
        <p><b>Step 6:</b> Plan and then record next steps with learner.</p>
        <p><b>Step 7:</b> Both learner &amp; assessor to complete assessment evaluation/review report.</p>
        <p><b>Step 8:</b> Assessor to ensure that all summary report and documentation completed and in order for moderation.</p>
      </div>
      <div className="p76-bar">APPEALS PROCEDURE</div><p>1. A learner has the right to appeal under the following circumstances</p><ul><li>If the laid down assessment procedures were not followed during assessments</li><li>If not all evidence available was taken into account during the assessment</li></ul>
    </section>
    <section className="lw-page p76-page" data-page="3">
      <ul>{appealGrounds.slice(2).map(item => <li key={item}>{item}</li>)}</ul>
      <ol start={2}><li>A learner bringing an appeal against a decision of the assessment will lodge such an appeal with the assessor and the internal moderator within 2 days of the assessment feedback session.</li><li>A learner bringing an appeal should complete the “Learner’s Notice of Assessment Appeal” form before the Appeal Hearing. The form should be handed to the internal moderator or a representative of the SETA.</li><li>Should the internal moderator re-affirm the assessor’s decision, the learner may appeal to the external verifier within 2 days after the initial moderator’s feedback session. The external verifier’s decision will be final. Should the external verifier re-affirm the assessor’s decision, the cost for re-evaluation will be upon the learner. Should the verifier’s decision differ from the assessor’s decision, the cost for re-evaluation will be borne by the assessor.</li></ol>
    </section>
    <section className="lw-page p76-page" data-page="4"><h2>LEARNER’S NOTICE OF ASSESSMENT APPEAL</h2><div className="p76-box"><b>TO: The Internal Moderator</b><p>A meeting with the internal moderator is requested to discuss the outcome of my assessment</p></div><table className="p76-table p76-form"><tbody>{[["moderator-name","Internal moderator name"],["appeal-submission","Date of submission"],["employee-name","Name of employee assessed"],["appeal-assessor","Name of Assessor"],["feedback-date","Date of feedback session"]].map(([id,label]) => row(id,label,/date|submission/i.test(label)?"date":"text"))}</tbody></table><h3>Grounds for Appeal</h3><table className="p76-table"><thead><tr><th>No</th><th>Tick the applicable ground(s) for appeal</th><th>Tick</th></tr></thead><tbody>{appealGrounds.map((item,index)=><tr key={item}><td>{index+1}</td><td>{item}</td><td>{tick(`appeal-ground-${index+1}`,item)}</td></tr>)}</tbody></table><h3>Reasons for Appeal</h3><table className="p76-table"><thead><tr><th>No</th><th>Please give detailed reasons for the choice(s) above</th></tr></thead><tbody>{appealGrounds.map((_,index)=><tr key={index}><td>{index+1}</td><td>{area(`appeal-reason-${index+1}`,`Appeal reason ${index+1}`)}</td></tr>)}</tbody></table><div className="p76-two"><label>Learner’s signature {input("appeal-learner-signature","Learner signature")}</label><label>Date {input("appeal-learner-date","Learner date","date")}</label><label>Employee witness {input("appeal-witness-signature","Employee witness signature")}</label><label>Date {input("appeal-witness-date","Employee witness date","date")}</label></div></section>
    <section className="lw-page p76-page" data-page="5"><div className="p76-bar">INITIAL MEETING CHECKLIST (For the assessor's benefit)</div><p><b>Points Assessor must cover in the initial meeting with the learner - Please tick</b></p><table className="p76-table p76-checklist"><thead><tr><th>Item</th><th>Points to be covered</th><th>Tick</th></tr></thead><tbody>{meetingItems.map((item,index)=><tr key={index}><td>{index+1}</td><td>{item}</td><td>{tick(`meeting-${index+1}`,`Meeting item ${index+1}`)}</td></tr>)}</tbody></table><table className="p76-table"><tbody><tr><td colSpan={2}>Learner declaration of acceptance of assessment instruments and relevant documentation: Date: {input("meeting-date","Meeting date","date")}</td></tr><tr><td>Learners Name: {input("meeting-learner-name","Learner name")}</td><td>Signature {input("meeting-learner-signature","Learner signature")}</td></tr><tr><td>Assessors Name: {input("meeting-assessor-name","Assessor name")}</td><td>Signature {input("meeting-assessor-signature","Assessor signature")}</td></tr></tbody></table></section>
    <section className="lw-page p76-page" data-page="6"><div className="p76-bar">LEARNER ASSESSMENT PLAN</div><p><b><i>Please tick next to the unit standards you are being assessed against.</i></b></p><table className="p76-table"><thead><tr><th>Unit code</th><th>UNIT STANDARD TITLES</th><th>NQF level</th><th>Credits</th><th>✓</th></tr></thead><tbody><tr><td>114076</td><td>Use computer technology to research a computer topic</td><td>4</td><td>3</td><td>{tick("plan-unit","Unit standard 114076")}</td></tr></tbody></table><table className="p76-table p76-plan"><thead><tr><th>Activity</th><th>Evidence of activity will be found where</th><th>Place &amp; planned date of activity</th><th>Date Completed</th></tr></thead><tbody>{planRows.map(([activity,evidence,place],index)=><tr key={activity}><td>{activity}</td><td>{evidence}</td><td>{place}<br/>Date: {input(`plan-${index}-planned`,`Planned date for ${activity}`,"date")}</td><td>{input(`plan-${index}-completed`,`Completed date for ${activity}`,"date")}</td></tr>)}</tbody></table><h4>Special arrangements for assessment</h4><table className="p76-table"><tbody>{["Place","Language","Resources","Barriers"].map(label=>row(`special-${label.toLowerCase()}`,label))}</tbody></table><h4>People to be involved with assessment</h4><table className="p76-table"><tbody>{[["Learner","Manager"],["Trainer","Mentor / Coach"],["Assessor","Moderator"]].map(([left,right])=><tr key={left}><td>{left}: {input(`people-${left}`,left)}</td><td>{right}: {input(`people-${right}`,right)}</td></tr>)}</tbody></table><h4>Next steps for learning</h4>{area("next-steps","Next steps for learning")}</section>
    <section className="lw-page p76-page" data-page="7">
      <div className="p76-empty-rule" />
      <h3>Resources required for this assessment</h3>{area("resources","Resources required")}
      <h3>Guidelines to the learner:</h3>{area("learner-guidelines","Guidelines to the learner")}
      <div className="p76-plan-signatures">
        <label>Learners Name: {input("plan-learner-name","Learners Name")}</label><span />
        <label>Learner’s signature: {input("plan-learner-signature","Learner’s signature")}</label><label>Date: {input("plan-learner-date","Learner date","date")}</label>
        <label>Assessors Name: {input("plan-assessor-name","Assessors Name")}</label><span />
        <label>Assessor’s signature: {input("plan-assessor-signature","Assessor’s signature")}</label><label>Date: {input("plan-assessor-date","Assessor date","date")}</label>
      </div>
      <h2>Integrated Summative Assessment Tool</h2><p><b>Two assessment tools are provided in this step, being:<br/>1. Practical Assessment Tool<br/>2. Attitudes and Attributes Assessment Tool</b></p><h3>1. Practical Assessment Tool</h3><p>All the sections of this document must be completed and signed where appropriate by the learner and the assessor.</p>
    </section>
    <section className="lw-page p76-page" data-page="8"><ul>
      <li>The learner must be given appropriate feedback and told whether they were declared competent or not yet competent. The assessor must record the appropriate commentary and guide the learner with detailed action plans for areas where the learner is found not yet competent.</li>
      <li>In line with the policies and procedures, the assessor must offer learners an opportunity for feedback on the assessment as well as an opportunity to appeal against the declaration.</li>
      <li>Should learners be found not yet competent, a detailed action plan with specific commentary on development must be drafted together with the learner and the facilitator in order to develop the necessary competence. A date for re-assessment must be agreed upon with the learner.</li>
      <li>All the evidence must be signed and copied, if necessary, to be placed in the learner’s portfolio of evidence.</li>
      <li>Use this checklist to help collect evidence of practical competence as prescribed by the specific outcomes of the unit standards.</li>
      <li>Ask the questions as listed in order to test foundational and reflexive competence relevant to the specific task.</li>
      <li>Ensure that the exact same methodology is applied for each learner in order to ensure that VACS principles are adhered to.</li>
      <li>The benchmark for learner competence in this tool is 85% in EVERY task.</li>
      <li>This assessment tool can only be used for learner assessment by a suitably qualified and registered assessor who is ALSO a subject matter expert in this specific field.</li>
      <li>If no such a person can be found to assess the learner, then it is advised that a qualified assessor consults with the appropriate subject matter expert prior to the physical assessment in order to establish key points for observation. The subject matter expert should attend the assessment in order to judge competence of the learner.</li>
    </ul><div className="p76-page8-bottom"><b>The assessor to complete the following:</b><p>Remember to cover all range items! Assessor to write observations or make clear references to evidence attached in the spaces provided.</p><PracticalRows start={0} end={2} input={input} area={area} /></div></section>
    <section className="lw-page p76-page" data-page="9"><PracticalRows start={2} end={4} input={input} area={area} /><h4>FOR ASSESSOR</h4><p>File Checked: {tick("file-checked","File checked")}</p><table className="p76-table"><thead><tr><th>Date</th><th>Assessor Signature</th></tr></thead><tbody><tr><td>{input("file-checked-date","File checked date","date")}</td><td>{input("file-checked-signature","File checked assessor signature")}</td></tr></tbody></table><p>This is to verify that the learner has completed all the above and has achieved competence.</p><div className="p76-two"><label>Assessor Name {input("verify-assessor-name","Assessor Name")}</label><label>Assessor Reg. No. {input("verify-assessor-reg","Assessor registration number")}</label><label>Assessor Signature {input("verify-assessor-signature","Assessor Signature")}</label><label>Date {input("verify-assessor-date","Assessor Date","date")}</label></div><p>This is to verify that the assessor has observed me in the workplace.</p><div className="p76-two"><label>Learners Name {input("verify-learner-name","Learners Name")}</label><label>Learners Reg No. {input("verify-learner-reg","Learners registration number")}</label><label>Learners Signature {input("verify-learner-signature","Learners Signature")}</label><label>Date {input("verify-learner-date","Learners Date","date")}</label></div><div className="p76-bar">2. Attitudes and Attributes Assessment Tool</div><table className="p76-table"><tbody>{[["Unit standard Title","Use computer technology to research a computer topic"],["Learner’s Name", ""],["ID", ""],["NLRD No", ""],["Assessor’s Name", ""]].map(([label,content])=><tr key={label}><th>{label}</th><td>{content || input(`attributes-${label}`,label)}</td></tr>)}</tbody></table><ul><li>Use the rating scale to judge the learner’s CCFO competence according to the unit standard.</li><li>Consider the learner’s entire performance, all stages of learning and all gathered evidence.</li></ul></section>
    <section className="lw-page p76-page" data-page="10"><ul><li>Consult facilitators, mentors, coaches and supervisors to ensure an objective rating.</li><li>A rating between 1 and 5 should be given as follows:</li></ul><table className="p76-table"><thead><tr><th>Rating</th><th>Description</th></tr></thead><tbody>{ratings.map((description,index)=><tr key={description}><td>{index+1}</td><td>{description}</td></tr>)}</tbody></table><ul><li>Give constructive feedback on each rating.</li><li>Apply the same methodology for each learner to uphold VACS principles.</li><li>The benchmark for learner competence is 3:5 in EVERY CCFO.</li><li>Complete and sign the assessment feedback form with the learner and moderator where applicable.</li></ul><table className="p76-table p76-ccfo"><thead><tr><th colSpan={2}>Attitudes and Attributes Assessment Tool<br/>Use the following rating table ABOVE in this assessment:</th></tr><tr><th>CCFO Criteria</th><th>Rating</th></tr></thead><tbody>{ccfo.slice(0,4).map(([name,description],index)=><tr key={name}><td><b>{name}</b> – {description}</td><td>{input(`ccfo-${index}`,`${name} rating`,"number")}</td></tr>)}</tbody></table></section>
    <section className="lw-page p76-page" data-page="11"><table className="p76-table p76-ccfo"><tbody>{ccfo.slice(4).map(([name,description],index)=><tr key={name}><td><b>{name}</b> – {description}</td><td>{input(`ccfo-${index+4}`,`${name} rating`,"number")}</td></tr>)}</tbody></table></section>
    <section className="lw-page p76-page p76-blank-source" data-page="12" aria-label="Blank source page" />
    <section className="lw-page p76-page p76-framed" data-page="13"><div className="p76-bar">FEEDBACK SECTION</div><div className="p76-box">Comments from Learner: {area("learner-comments","Comments from Learner")}</div><div className="p76-bar">JUDGEMENT</div><table className="p76-table"><tbody><tr><td>{["Meet the requirements","Requires additional evidence","Can continue to the next assessment"].map((label,index)=><label className="p76-option" key={label}>{label}: {tick(`judgement-${index}`,label)}</label>)}</td><td>{["Do not meet the requirements","Requires another assessment","Requires another assessment by another assessor"].map((label,index)=><label className="p76-option" key={label}>{label}: {tick(`judgement-${index+3}`,label)}</label>)}</td></tr><tr><td>Action required: {area("action-required","Action required")}</td><td>By when: {input("action-due","Action due date","date")}</td></tr></tbody></table><div className="p76-bar">Assessor’s feedback remarks</div><div className="p76-box">{area("assessor-feedback","Assessor feedback remarks")}</div><div className="p76-bar">Declaration by Learner</div><p>I, {input("feedback-declaration-name","Learner name")} declare that I am satisfied that the feedback given to me by the Assessor was relevant, sufficient and done in a constructive manner. I accept the assessment judgment and have no further questions relating to this particular assessment instrument.</p>{signatures("feedback")}</section>
    <section className="lw-page p76-page p76-framed" data-page="14">{decision("initial-decision","ASSESSMENT DECISION",decisionStatements)}{decision("reassessment","Reassessment Decision",decisionStatements.slice(5))}<div className="p76-bar">EVALUATION OF ASSESSMENT</div><table className="p76-table"><tbody><tr><th>Learner Name</th><td>{input("evaluation-learner-name","Evaluation learner name")}</td><th>Assessor name</th><td>{input("evaluation-assessor-name","Evaluation assessor name")}</td></tr></tbody></table></section>
    <section className="lw-page p76-page p76-framed" data-page="15"><table className="p76-table p76-review"><colgroup><col style={{width:"37%"}}/><col style={{width:"9%"}}/><col style={{width:"9%"}}/><col style={{width:"9%"}}/><col style={{width:"9%"}}/><col style={{width:"27%"}}/></colgroup><thead><tr><th>Unit Stds {input("review-unit","Unit standards")}</th><th colSpan={4}>Date {input("review-date","Evaluation date","date")}</th><th>Action</th></tr><tr><th>Review dimension</th><th>Learner Yes</th><th>Learner No</th><th>Assessor Yes</th><th>Assessor No</th><th>Action</th></tr></thead><tbody>{review.map((question,index)=><tr key={question}><td>{question}</td>{["learner-yes","learner-no","assessor-yes","assessor-no"].map(option=><td key={option}>{tick(`review-${index}-${option}`,`${question} ${option}`)}</td>)}<td>{input(`review-${index}-action`,`${question} action`)}</td></tr>)}</tbody></table><div className="p76-bar">Learner Declaration of Understanding</div><p>I am aware of the moderation process and understand that the moderator could declare the assessment decision invalid.</p>{signatures("understanding")}</section>
  </div></>;
}

function PracticalRows({ start, end, input, area }: { start: number; end: number; input: (id: string, label: string, type?: string) => React.ReactNode; area: (id: string, label: string) => React.ReactNode }) {
  return <table className="p76-table p76-practical"><thead><tr><th>Practical Tasks</th><th>Task Type</th><th>Date Completed</th><th>Comments and initials of observer</th></tr></thead><tbody>{practicalRows.slice(start,end).map((task,index)=>{const number=start+index+1;return <tr key={task}><td>Task No. {number}</td><td>{task}</td><td>{input(`task-${number}-date`,`Task ${number} completed date`,"date")}</td><td>{area(`task-${number}-comments`,`Task ${number} observer comments`)}</td></tr>})}</tbody></table>;
}
