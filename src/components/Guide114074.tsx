import { useEffect, useState } from "react";
import { DocumentActions } from "./DocumentActions";
import { WorkbookCover } from "./WorkbookCover";
import "./guide-114074.css";

type Page = { number: number; image: string; width: number; height: number; items: Array<{ text: string; x: number; y: number; width: number; height: number; bold: boolean }> };
type Values = Record<string, string | boolean>;

const COVER_FIELDS = [["name", "Name"], ["surname", "Surname"], ["id-number", "ID Number"], ["contact", "Contact"]] as const;

function IntroductionPage() {
  return <section className="lw-page guide-114074-page guide-114074-introduction" aria-label="Learner Guide introduction">
    <h2>Learner Guide Introduction</h2>
    <table><tbody>
      <tr className="guide-114074-intro-about"><th>About the Learner Guide…</th><td><p>This Learner Guide provides a comprehensive overview of the <strong>114074 Demonstrate an understanding of different computer network architectures and standards</strong> and forms part of a series of Learner Guides that have been developed. The series of Learner Guides are conceptualized in modular format and developed for <strong>NATIONAL CERTIFICATE: INFORMATION TECHNOLOGY: SYSTEMS SUPPORT: SAQA 48573 - LEVEL 5 - 147 CREDITS.</strong> They are designed to improve the skills and knowledge of learners, enabling them to effectively and efficiently complete specific tasks.</p><p>Learners are required to attend training workshops as a group or as specified by their organization. These workshops are presented in modules and conducted by a qualified facilitator.</p></td></tr>
      <tr><th>Purpose</th><td>114074 Demonstrate an understanding of different computer network architectures and standards</td></tr>
      <tr><th>Outcomes</th><td>• 114074 Demonstrate an understanding of different computer network architectures and standards</td></tr>
      <tr><th>Assessment Criteria</th><td><p>The only way to establish whether a learner is competent and has accomplished the specific outcomes is through an assessment process. Assessment involves collecting and interpreting evidence about the learner’s ability to perform a task.</p><p>This guide may include assessments in the form of activities, assignments, tasks or projects, as well as workplace practical tasks. Learners are required to perform tasks on the job to collect enough and appropriate evidence for their portfolio of evidence, proof signed by their supervisor that the tasks were performed successfully.</p></td></tr>
      <tr><th>To qualify</th><td>To qualify and receive credits towards the learning programme, a registered assessor will conduct an evaluation and assessment of the learner’s portfolio of evidence and competency.</td></tr>
      <tr><th>Range of Learning</th><td>This describes the situation and circumstance in which competence must be demonstrated and the parameters in which learners operate.</td></tr>
      <tr><th>Responsibility</th><td>The responsibility of learning rests with the learner, so:<ul><li>Be proactive and ask questions.</li><li>Seek assistance and help from your facilitators, if required.</li></ul></td></tr>
    </tbody></table>
  </section>;
}

function MacFramePage() {
  const fields = ["MAC Control", "DA", "SA", "LLC PDU", "CRC"];
  const rows = [
    ["MAC Control", "MAC Control", "Control information for MAC protocol. Variable in length and contents. Depending on specific LAN Standards."],
    ["DA", "Destination Address", "Destination physical attachment point on the LAN's transmission media."],
    ["SA", "Source Address", "Source physical attachment point on the LAN's transmission media. Each MAC address is unique and burned in at the factory."],
    ["LLC PDU", "LLC Protocol Data Unit", "Data from LLC sublayer."],
    ["CRC", "Cyclic Redundancy Check", "Same as FCS (Frame Check Sequence) field in HDLC. This is used for error checking. If an error is detected, the frame is simply discarded. MAC protocol does not recover erred frames."],
  ];
  return <section className="lw-page guide-114074-page guide-114074-mac-page" aria-label="Learner Guide MAC frame fields">
    <div className="guide-114074-mac-content">
      <div className="guide-114074-mac-frame" aria-label="MAC frame fields">{fields.map(field => <div key={field}>{field}</div>)}</div>
      <p>The meaning and functions of the frame fields are explained in the chart below.</p>
      <table className="guide-114074-mac-table"><tbody>{rows.map(([name, meaning, description]) => <tr key={name}><th scope="row">{name}</th><td>{meaning}</td><td>{description}</td></tr>)}</tbody></table>
    </div>
  </section>;
}

export function Guide114074({ values, onChange, onSave }: { values: Values; onChange: (key: string, value: string | boolean) => void; onSave: () => Promise<void> }) {
  const [pages, setPages] = useState<Page[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/learner-guide-114074/pages.json", { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error("The guide pages could not be loaded."); return response.json() as Promise<{ pages: Page[] }>; })
      .then(data => setPages(data.pages))
      .catch(reason => { if (reason?.name !== "AbortError") setError("The Unit 114074 Learner Guide could not be opened."); });
    return () => controller.abort();
  }, []);

  if (error) return <div className="callout" role="alert">{error}</div>;
  if (!pages.length) return <div className="learner-guide-loading">Opening the Unit 114074 Learner Guide…</div>;

  return <section className="guide-114074">
    <div className="guide-114074-actions no-print"><DocumentActions name="Unit 114074 Learner Guide" onSave={onSave} /><a href="/logos/SAQA%20-114074%20%20%20%20-%20Learner%20Guide.pdf" download>Download original PDF</a></div>
    <div className="guide-114074-document document-print-target">
      {pages.map(page => page.number === 1
        ? <WorkbookCover key={page.number} number={1} label="LEARNER GUIDE" title="DEMONSTRATE AN UNDERSTANDING OF DIFFERENT COMPUTER NETWORK ARCHITECTURES AND STANDARDS" metadata={["UNIT STANDARD 114074", "NQF LEVEL: 5", "CREDITS: 5", "NOTIONAL HOURS: 50"]}><table className="lw-table lw-cover-table"><thead><tr><th colSpan={2}>LEARNER INFORMATION</th></tr></thead><tbody>{COVER_FIELDS.map(([id, label]) => { const key = `learner-guide-114074.cover.${id}`; return <tr key={id}><th>{label}</th><td><input aria-label={`Learner Guide ${label}`} defaultValue={String(values[key] ?? "")} onBlur={event => onChange(key, event.target.value)} /></td></tr>; })}</tbody></table></WorkbookCover>
        : page.number === 5 ? <IntroductionPage key={page.number} />
        : page.number === 28 ? <MacFramePage key={page.number} />
        : <section className="lw-page guide-114074-page" key={page.number} aria-label={`Learner Guide page ${page.number}`}>
            <img className="guide-114074-art" src={`/learner-guide-114074/${page.image}`} alt="" loading={page.number > 2 ? "lazy" : "eager"} />
            <div className="guide-114074-text">{page.items.map((item, index) => <span key={index} className={item.bold ? "is-bold" : ""} style={{ left: `${item.x / page.width * 100}%`, top: `${item.y / page.height * 100}%`, fontSize: `${item.height / page.width * 100}cqw` }}>{item.text}</span>)}</div>
          </section>)}
    </div>
  </section>;
}
