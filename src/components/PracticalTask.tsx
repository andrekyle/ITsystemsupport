import type { PracticalTaskDocument, PracticalTaskField, Profile, SourceDocumentBlock } from "../types";
import { Icon } from "../icons";
import { useRef } from "react";
import { DocumentSignature } from "./DocumentSignature";
import { DocumentActions } from "./DocumentActions";
import { canSignDocumentField } from "../lib/documentSignatures";
import { WorkbookCover } from "./WorkbookCover";
import { UploadedPdf } from "./UploadedPdf";
import "./source-document.css";

type SavedValues = Record<string, string | boolean>;
type SaveField = (key: string, value: string | boolean) => void;

function PdfInput({ id, values, onChange, area = false, type = "text", ariaLabel, profile }: { id: string; values: SavedValues; onChange: SaveField; area?: boolean; type?: string; ariaLabel: string; profile?: Profile }) {
  const key = `practical.pdf.${id}`;
  if (/signature/i.test(ariaLabel)) {
    const editable = !!profile && canSignDocumentField(profile.role, ariaLabel);
    return <DocumentSignature value={String(values[key] ?? "")} savedSignature={editable ? profile.signatureImage : undefined} label={ariaLabel} editable={editable} onChange={value => onChange(key, value)} />;
  }
  return area
    ? <textarea aria-label={ariaLabel} defaultValue={String(values[key] ?? "")} onBlur={event => onChange(key, event.target.value)} />
    : <input aria-label={ariaLabel} type={type} defaultValue={String(values[key] ?? "")} onBlur={event => onChange(key, event.target.value)} />;
}

function CheckCell({ id, label, values, onChange }: { id: string; label: string; values: SavedValues; onChange: SaveField }) {
  const key = `practical.pdf.${id}`;
  return <td className="pt-check"><label><span>{label}</span><input type="checkbox" aria-label={label} defaultChecked={values[key] === true} onChange={event => onChange(key, event.target.checked)} /></label></td>;
}

function LinedInputs({ id, lines, values, onChange, label }: { id: string; lines: number; values: SavedValues; onChange: SaveField; label: string }) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const key = `practical.pdf.${id}`;
  const combined = String(values[key] ?? "").split(/\r?\n/);
  return <div className="pt-lined-inputs">{Array.from({ length: lines }, (_, index) => {
    const lineKey = `${key}.line-${index + 1}`;
    return <input
      key={lineKey}
      ref={element => { inputs.current[index] = element; }}
      aria-label={`${label}, line ${index + 1}`}
      defaultValue={String(values[lineKey] ?? combined[index] ?? "")}
      onBlur={event => onChange(lineKey, event.target.value)}
      onKeyDown={event => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        inputs.current[index + 1]?.focus();
      }}
    />;
  })}</div>;
}

function AttemptHead({ prefix, number, values, onChange }: { prefix: string; number: number; values: SavedValues; onChange: SaveField }) {
  return <th colSpan={2}>Attempt {number}<br />Date:<span className="pt-date"><PdfInput id={`${prefix}.attempt-${number}-date`} type="date" ariaLabel={`Attempt ${number} date`} values={values} onChange={onChange} /></span></th>;
}

function ObservationTable({ prefix, task, rows, values, onChange }: { prefix: string; task: string; rows: number; values: SavedValues; onChange: SaveField }) {
  return <table className="pt-table pt-observation"><thead><tr><th rowSpan={2} className="pt-no"></th><th rowSpan={2}>OBSERVATIONAL CHECKLIST</th><AttemptHead prefix={prefix} number={1} values={values} onChange={onChange} /><AttemptHead prefix={prefix} number={2} values={values} onChange={onChange} /><AttemptHead prefix={prefix} number={3} values={values} onChange={onChange} /><th rowSpan={2}>Comments</th></tr><tr><th>C</th><th>NYC</th><th>C</th><th>NYC</th><th>C</th><th>NYC</th></tr></thead><tbody>
    {Array.from({ length: rows }, (_, index) => <tr key={index}><td>{index + 1}</td><td className="pt-task-copy">{index === 0 ? task : ""}</td><CheckCell id={`${prefix}.${index}.a1c`} label={`Row ${index + 1}, attempt 1 competent`} values={values} onChange={onChange} /><CheckCell id={`${prefix}.${index}.a1n`} label={`Row ${index + 1}, attempt 1 not yet competent`} values={values} onChange={onChange} /><CheckCell id={`${prefix}.${index}.a2c`} label={`Row ${index + 1}, attempt 2 competent`} values={values} onChange={onChange} /><CheckCell id={`${prefix}.${index}.a2n`} label={`Row ${index + 1}, attempt 2 not yet competent`} values={values} onChange={onChange} /><CheckCell id={`${prefix}.${index}.a3c`} label={`Row ${index + 1}, attempt 3 competent`} values={values} onChange={onChange} /><CheckCell id={`${prefix}.${index}.a3n`} label={`Row ${index + 1}, attempt 3 not yet competent`} values={values} onChange={onChange} /><td className="pt-comment-cell"><PdfInput id={index === 0 ? `${prefix}.comments` : `${prefix}.${index}.comments`} area ariaLabel={`Row ${index + 1} comments`} values={values} onChange={onChange} /></td></tr>)}
  </tbody></table>;
}

function TheoryTable({ id, values, onChange }: { id: string; values: SavedValues; onChange: SaveField }) {
  return <table className="pt-table pt-theory"><thead><tr><th colSpan={2}>Integrated theory</th></tr></thead><tbody><tr><td>Question:</td><td><LinedInputs id={id} lines={4} label="Integrated theory question and answer" values={values} onChange={onChange} /></td></tr></tbody></table>;
}

function PracticalTask114046({ values, onChange, profile }: { values: SavedValues; onChange: SaveField; profile: Profile }) {
  const cell = (id: string, label: string, type = "text") => <PdfInput id={id} ariaLabel={label} type={type} values={values} onChange={onChange} profile={profile} />;
  return <><DocumentActions name="Practical Task" /><div className="pt-pdf-document document-print-target">
    <section className="pt-page pt-cover">
      <div className="pt-cover-main"><img src="/logos/eruditio.svg" alt="Eruditio" /><div className="pt-cover-panel"><h1>DEMONSTRATE AN UNDERSTANDING OF ISSUES AFFECTING THE MANAGEMENT OF A LOCAL AREA COMPUTER NETWORK (LAN)</h1><div className="pt-cover-meta"><strong>UNIT STANDARD 114046</strong><strong>NQF LEVEL: 5</strong><strong>CREDITS: 4</strong><strong>NOTIONAL HOURS: 40</strong></div><table className="pt-table pt-cover-info"><thead><tr><th colSpan={2}>LEARNER INFORMATION</th></tr></thead><tbody>{[["name","Name"],["surname","Surname"],["id-number","ID Number"],["contact","Contact"]].map(([id,label])=><tr key={id}><th>{label}</th><td>{cell(id,label)}</td></tr>)}</tbody></table></div></div><aside>PRACTICAL TASK</aside>
    </section>

    <section className="pt-page pt-page-two"><h2>GENERAL INFORMATION</h2><table className="pt-table pt-form-table"><tbody>
      <tr className="pt-pink"><th colSpan={4}>LEARNER DETAILS</th></tr>
      {[["full-names","Learner Full Names"],["learner-no","Learner No."],["organisation","Organisation"],["unit-dept","Unit/Dept"]].map(([id,label])=><tr key={id}><th>{label}:</th><td colSpan={3}>{cell(id,label)}</td></tr>)}
      <tr><th rowSpan={2}>Contact Details:</th><th>Telephone /Cell Numbers:</th><th colSpan={2}>Email Address:</th></tr><tr><td>{cell("telephone","Telephone / cell numbers","tel")}</td><td colSpan={2}>{cell("email","Email address","email")}</td></tr>
      <tr className="pt-pink"><th colSpan={4}>WORKSHOP DETAILS</th></tr>
      {[["venue","Workshop Venue","text"],["facilitator","Facilitator Name","text"],["date-started","Date Started","date"],["date-completed","Date Completed","date"]].map(([id,label,type])=><tr key={id}><th>{label}:</th><td colSpan={3}>{cell(id,label,type)}</td></tr>)}
      <tr className="pt-pink"><th colSpan={4}>PRACTICAL WORPLACE DETAILS</th></tr>
      {[["workplace-name","Workplace Name"],["workplace-address","Workplace Address"],["mentor-name","Coach/Mentor Full Names"],["mentor-contact","Coach/Mentor Contact Details"],["mentor-position","Coach/Mentor Position"]].map(([id,label])=><tr key={id}><th>{label}:</th><td colSpan={3}>{cell(id,label)}</td></tr>)}
    </tbody></table>
      <table className="pt-table pt-form-table pt-submission"><tbody><tr><th>Submission Due Date:<em>(if late submission, provide reasons)</em></th><td>{cell("submission-date","Submission due date","date")}<PdfInput id="late-reason" ariaLabel="Late submission reasons" area values={values} onChange={onChange} /></td></tr>{[["received-by","Received by","text"],["received-on","Received on","date"],["signature","Signature","text"]].map(([id,label,type])=><tr key={id}><th>{label}:</th><td>{cell(id,label,type)}</td></tr>)}</tbody></table>
      <div className="pt-workplace-note"><strong>Workplace Tasks:</strong><p><b>NB: For you to be declared competent in this course you must conduct facilitation session”</b><br />The following task are building blocks that will assist you to conduct a facilitation session. Each task be done completely and submit evidence.</p></div>
    </section>

    <section className="pt-page pt-page-three"><h2>Practical Assessment</h2><h3>SO 1: Explain the management of access to a local area computer network.</h3><ObservationTable prefix="so1" task={"Access for different categories of people.\nUser, Operator, Administrator."} rows={4} values={values} onChange={onChange} /><TheoryTable id="so1.theory" values={values} onChange={onChange} /><h3>SO 2.Explain typical viruses on local area computer networks.</h3><ObservationTable prefix="so2" task="Virus types; Trojan Horses, Spoofing, Worms (at least 2)." rows={5} values={values} onChange={onChange} /><TheoryTable id="so2.theory" values={values} onChange={onChange} /></section>

    <section className="pt-page pt-page-four"><h1>WITNESS TESTIMONY</h1><h2>Workplace Testimonial Evidence</h2><h3>Instructions:</h3><p>The following section must be completed by the learner’s supervisor / manager in the workplace based on the learner’s workplace performance relevant to the Unit Standard completed.</p><p><em>Constructive comments and testimonial evidence may also be attached in a separate document and referenced in the section below.</em></p>
      <table className="pt-table pt-testimony"><tbody><tr className="pt-black"><th colSpan={4}>Testimonial Comments and Evidence of Workplace Performance</th></tr><tr><td colSpan={3}>Unit Standard Title {cell("testimony-unit-title","Unit standard title")}</td><td>SAQA ID: {cell("testimony-saqa","SAQA ID")}</td></tr><tr className="pt-grey"><td colSpan={4}>Supervisor / Manager Testimonial</td></tr><tr><td colSpan={4} className="pt-testimony-area"><LinedInputs id="testimonial" lines={8} label="Supervisor or manager testimonial" values={values} onChange={onChange} /></td></tr>
      <tr className="pt-grey pt-left"><th colSpan={4}>Supervisor Acknowledgement</th></tr><tr><td>Date:</td><td>{cell("supervisor-date","Supervisor date","date")}</td><td>Supervisor Signature</td><td>{cell("supervisor-signature","Supervisor signature")}</td></tr>
      <tr className="pt-grey pt-left"><th colSpan={4}>Assessor Acknowledgement</th></tr><tr><td>Date:</td><td>{cell("assessor-date","Assessor date","date")}</td><td>Assessor Signature</td><td>{cell("assessor-signature","Assessor signature")}</td></tr><tr className="pt-grey"><td colSpan={4}>Comments and Feedback</td></tr><tr><td colSpan={4}><LinedInputs id="assessor-feedback" lines={2} label="Assessor comments and feedback" values={values} onChange={onChange} /></td></tr>
      <tr className="pt-grey pt-left"><th colSpan={4}>Learner Acknowledgement</th></tr><tr><td>Date:</td><td>{cell("learner-date","Learner date","date")}</td><td>Learner Signature</td><td>{cell("learner-signature","Learner signature")}</td></tr><tr className="pt-grey"><td colSpan={4}>Comments and Feedback</td></tr><tr><td colSpan={4}><LinedInputs id="learner-feedback" lines={2} label="Learner comments and feedback" values={values} onChange={onChange} /></td></tr>
      <tr className="pt-grey pt-left"><th colSpan={4}>Moderator Acknowledgement</th></tr><tr><td>Date:</td><td>{cell("moderator-date","Moderator date","date")}</td><td>Moderator Signature</td><td>{cell("moderator-signature","Moderator signature")}</td></tr></tbody></table></section>

    <section className="pt-page pt-page-five"><TheoryTable id="witness.theory" values={values} onChange={onChange} /><table className="pt-table pt-outcome"><tbody><tr><td>Overall performance of the learner</td><td><label>Meet SOP<input type="checkbox" onChange={event=>onChange("practical.pdf.meet-sop",event.target.checked)} defaultChecked={values["practical.pdf.meet-sop"]===true}/></label></td><td colSpan={2}><label>Do not meet SOP<input type="checkbox" onChange={event=>onChange("practical.pdf.not-meet-sop",event.target.checked)} defaultChecked={values["practical.pdf.not-meet-sop"]===true}/></label></td></tr><tr><td>Overall outcomes of the integrated assessment (theory &amp; practical)</td><td><label>C<input type="checkbox" onChange={event=>onChange("practical.pdf.competent",event.target.checked)} defaultChecked={values["practical.pdf.competent"]===true}/></label></td><td colSpan={2}><label>NYC<input type="checkbox" onChange={event=>onChange("practical.pdf.nyc",event.target.checked)} defaultChecked={values["practical.pdf.nyc"]===true}/></label></td></tr><tr><th className="pt-grey">Assessor signature</th><td>{cell("final-assessor-signature","Assessor signature")}</td><th className="pt-grey">Learner signature</th><td>{cell("final-learner-signature","Learner signature")}</td></tr><tr><th className="pt-grey">Date:</th><td>{cell("final-assessor-date","Assessor date","date")}</td><th className="pt-grey">Date:</th><td>{cell("final-learner-date","Learner date","date")}</td></tr></tbody></table></section>
  </div></>;
}

type SourceEntry = { sectionId: string; block: SourceDocumentBlock };
type SourcePage = { number: number; entries: SourceEntry[] };

function documentPages(document: PracticalTaskDocument): SourcePage[] {
  const pages: SourcePage[] = [];
  for (const section of document.sections) for (const block of section.blocks ?? []) {
    if (block.kind === "page") pages.push({ number: block.number, entries: [] });
    else {
      if (!pages.length) pages.push({ number: 1, entries: [] });
      pages[pages.length - 1].entries.push({ sectionId: section.id, block });
    }
  }
  return pages;
}

function workbookCover(page: SourcePage) {
  const text = (entry: SourceEntry) => entry.block.kind === "item" ? entry.block.item.text : "";
  const label = page.entries[0] && text(page.entries[0]);
  if (!label || !/^learner\s+(?:exercise\s+)?workbook$/i.test(label)) return undefined;
  const unitIndex = page.entries.findIndex(entry => /^unit standard\s+\d+/i.test(text(entry)));
  const title = page.entries.slice(1, unitIndex);
  if (unitIndex < 2 || title.some(entry => entry.block.kind !== "item" || entry.block.item.responseLabel)) return undefined;
  let end = unitIndex;
  while (end < page.entries.length && /^(?:unit standard|nqf(?: level)?|credits|notional hours)\b/i.test(text(page.entries[end]))) end++;
  return { label, title: title.map(text).join(" "), metadata: page.entries.slice(unitIndex, end).map(text), entries: page.entries.slice(end) };
}

function SourceDocument({ document, unitId, profile, values, onChange, onSave, presentation }: PracticalTaskProps) {
  const workbook = presentation === "workbook";
  const field = (definition: PracticalTaskField, storageKey: string, sourceLabel: string) => {
    const current = String(values[storageKey] ?? "");
    if (/signature/i.test(definition.label)) {
      const editable = canSignDocumentField(profile.role, definition.label);
      return <DocumentSignature value={current} label={definition.label} editable={editable} savedSignature={editable ? profile.signatureImage : undefined} onChange={value => onChange(storageKey, value)} />;
    }
    return definition.type === "textarea"
      ? <textarea aria-label={sourceLabel} rows={4} defaultValue={current} onBlur={event => onChange(storageKey, event.target.value)} />
      : <input aria-label={sourceLabel} type={definition.type ?? "text"} defaultValue={current} onBlur={event => onChange(storageKey, event.target.value)} />;
  };
  const sourceField = ({ block }: SourceEntry): PracticalTaskField | undefined => {
    if (block.kind === "field") return block.field;
    if (workbook && block.kind === "item" && /^(?:name(?:\s*(?:&|and)\s*surname)?|surname|id number|contact|organisation|unit\/dept|facilitator name|date started|date of completion):?$/i.test(block.item.text)) {
      return { id: block.item.id, label: block.item.text, type: /^date/i.test(block.item.text) ? "date" : "text" };
    }
  };
  const entryKey = ({ sectionId, block }: SourceEntry) => `${sectionId}.${block.kind === "field" ? block.field.id : block.kind === "item" ? block.item.id : block.kind === "table" ? block.id : block.number}`;
  const renderBlock = (entry: SourceEntry) => {
          const { sectionId, block } = entry;
          const key = entryKey(entry);
          if (block.kind === "page") return <div key={key} className={`source-page-boundary${block.number > 1 ? " source-page-break" : ""}`} data-source-page={block.number}>Source page {block.number}</div>;
          if (block.kind === "field") {
            const definition = block.field;
            return <label className="source-document-field" key={key}><span>{definition.label}</span>{field(definition, `practical.${sectionId}.${definition.id}`, definition.label)}</label>;
          }
          if (block.kind === "table") return <div className="source-table-scroll" key={key}><table className={`data source-document-table${workbook ? " lw-table" : ""}`}>
            <thead><tr>{block.headers.map((header, column) => <th key={column} scope="col">{header}</th>)}</tr></thead>
            <tbody>{block.rows.map((row, r) => <tr key={r}>{row.map((cell, c) => <td key={c}>{cell}
              {(!cell.trim() || /^[_\u2026.\s]{3,}$/.test(cell)) && field({ id: `${block.id}.${r}.${c}`, label: block.headers[c] || `Row ${r + 1}, column ${c + 1}`, type: "textarea" }, `practical.${sectionId}.${block.id}.${r}.${c}`, `${block.headers[c] || `Column ${c + 1}`}, row ${r + 1}`)}
            </td>)}</tr>)}</tbody>
          </table></div>;
          const item = block.item;
          const text = block.format === "heading" ? <h3>{item.text}</h3>
            : block.format === "numbered" ? <ol className="source-document-list"><li>{item.text}</li></ol>
              : block.format === "bullet" ? <ul className="source-document-list"><li>{item.text}</li></ul>
                : <p>{item.text}</p>;
          return <div key={key}>{text}{item.responseLabel && <label className="source-document-field"><span>{item.responseLabel}</span><textarea rows={5} defaultValue={String(values[`practical.${sectionId}.${item.id}`] ?? "")} onBlur={event => onChange(`practical.${sectionId}.${item.id}`, event.target.value)} /></label>}</div>;
  };
  const renderWorkbookBlocks = (entries: SourceEntry[], cover = false) => {
    const content: React.ReactNode[] = [];
    const blankResponse = (entry: SourceEntry) => {
      const definition = sourceField(entry);
      return definition && /^[_\u2026.\s]{3,}$/.test(definition.label) ? definition : undefined;
    };
    for (let index = 0; index < entries.length;) {
      const entry = entries[index];
      if (blankResponse(entry)) {
        const lines: SourceEntry[] = [];
        while (index < entries.length && blankResponse(entries[index])) lines.push(entries[index++]);
        const keys = lines.map(line => `practical.${line.sectionId}.${blankResponse(line)!.id}`);
        const answer = keys.map(key => String(values[key] ?? "")).join("\n");
        content.push(<div className="source-workbook-answer" key={entryKey(entry)} data-source-response-lines={lines.length} style={{ minHeight: `${Math.max(3, lines.length) * 28}px` }}>
          <textarea aria-label={`Learner response ${entryKey(entry)}`} rows={Math.max(3, lines.length)} defaultValue={answer} onBlur={event => {
            const text = event.target.value.split("\n");
            keys.forEach((key, line) => onChange(key, line === keys.length - 1 ? text.slice(line).join("\n") : text[line] ?? ""));
          }} />
        </div>);
        continue;
      }
      const heading = entry.block.kind === "item" && /^learner information:?$/i.test(entry.block.item.text) && sourceField(entries[index + 1] ?? entry)
        ? entry.block.item.text : undefined;
      if (heading) index++;
      if (heading || sourceField(entry)) {
        const fields: SourceEntry[] = [];
        while (index < entries.length && sourceField(entries[index]) && !blankResponse(entries[index])) fields.push(entries[index++]);
        content.push(<table className={`lw-table source-workbook-fields${cover ? " lw-cover-table" : " lw-details"}`} key={entryKey(entry)}>
          {heading && <thead><tr><th colSpan={2}>{heading}</th></tr></thead>}
          <tbody>{fields.map(item => {
            const definition = sourceField(item)!;
            return <tr key={entryKey(item)}><th scope="row">{definition.label}</th><td>{field(definition, `practical.${item.sectionId}.${definition.id}`, definition.label)}</td></tr>;
          })}</tbody>
        </table>);
      } else {
        content.push(renderBlock(entry));
        index++;
      }
    }
    return content;
  };
  const pages = workbook ? documentPages(document) : [];
  const cover = pages[0] && workbookCover(pages[0]);
  return <>
    {workbook ? <div className="lw-workbook-actions source-workbook-actions no-print">
      <div className="lw-workbook-actions-copy"><strong>Workbook tools</strong><span>Uploaded workbook converted to editable HTML. Answers save automatically; Save verifies your latest changes.</span></div>
      <div className="lw-workbook-actions-controls"><DocumentActions name={document.title} onSave={onSave} /></div>
    </div> : <DocumentActions name={document.title} onSave={onSave} />}
    <article className={`source-document document-print-target${workbook ? " source-workbook lw-document" : ""}`}>
      {workbook ? <>
        {!cover && <WorkbookCover className="source-workbook-cover" title={document.subtitle || document.title} metadata={[`UNIT STANDARD ${unitId}`]} />}
        {pages.map((page, index) => index === 0 && cover
          ? <WorkbookCover key={page.number} className="source-workbook-page" number={page.number} sourcePage title={cover.title} metadata={cover.metadata} label={cover.label}>{renderWorkbookBlocks(cover.entries, true)}</WorkbookCover>
          : <section key={page.number} className="lw-page source-workbook-page" data-page={page.number} data-source-page={page.number}>{renderWorkbookBlocks(page.entries)}</section>)}
      </> : <>
        <header className="source-document-header"><p>Unit standard {unitId}</p><h2>{document.title}</h2><p>{document.sourceName}{document.sourcePageCount ? ` · ${document.sourcePageCount} source pages` : ""}</p></header>
        {document.notice && <p className="source-document-notice no-print">{document.notice}</p>}
        {document.sections.map(section => <section key={section.id} className="source-document-section">{section.blocks?.map(block => renderBlock({ sectionId: section.id, block }))}</section>)}
      </>}
    </article>
    {workbook && <details className="source-workbook-details no-print"><summary>Conversion details</summary><p>{document.sourceName} · {document.sourcePageCount ?? pages.length} source pages</p><p>{document.notice}</p></details>}
  </>;
}

type PracticalTaskProps = {
  document: PracticalTaskDocument;
  unitId: string;
  profile: Profile;
  values: Record<string, string | boolean>;
  onChange: (key: string, value: string | boolean) => void;
  onSave?: () => Promise<void>;
  storagePrefix?: string;
  presentation?: "workbook";
};

export function PracticalTask({ document, unitId, profile, values: storedValues, onChange: saveValue, onSave, storagePrefix = "", presentation }: PracticalTaskProps) {
  const values = storagePrefix ? Object.fromEntries(Object.entries(storedValues).filter(([key]) => key.startsWith(storagePrefix)).map(([key, value]) => [key.slice(storagePrefix.length), value])) : storedValues;
  const onChange: SaveField = (key, value) => saveValue(`${storagePrefix}${key}`, value);
  if (document.replica) return <UploadedPdf key={`${profile.id}.${storagePrefix}${unitId}.${document.sourceName}`} definition={document.replica} profile={profile} values={values} onChange={onChange} onSave={onSave} />;
  if (document.sourceText !== undefined) return <SourceDocument key={`${storagePrefix}${unitId}.${document.sourceName}`} document={document} unitId={unitId} profile={profile} values={values} onChange={onChange} onSave={onSave} presentation={presentation} />;
  if (unitId === "114046" && !storagePrefix) return <PracticalTask114046 values={values} onChange={onChange} profile={profile} />;
  const key = (section: string, field: string) => `practical.${section}.${field}`;
  const savedCount = document.sections.reduce((total, section) => total
    + (section.fields ?? []).filter(field => String(values[key(section.id, field.id)] ?? "").trim()).length
    + (section.items ?? []).filter(item => String(values[key(section.id, item.id)] ?? "").trim()).length, 0);
  const total = document.sections.reduce((sum, section) => sum + (section.fields?.length ?? 0) + (section.items?.length ?? 0), 0);

  return <><DocumentActions name="Practical Task" onSave={onSave} /><section className="practical-task document-print-target">
    <header className="practical-hero">
      <div className="practical-hero-icon"><Icon name="checklist" size={28} /></div>
      <div><span className="practical-kicker">Unit standard {unitId}</span><h2>{document.title}</h2><p>{document.subtitle}</p></div>
      <div className="practical-progress"><strong>{savedCount}/{total}</strong><span>fields completed</span></div>
    </header>
    {document.notice && <div className="callout practical-notice"><span className="ico"><Icon name="info" size={18} /></span><span>{document.notice}</span></div>}
    <p className="practical-save-note"><Icon name="checkCircle" size={15} /> Work saves to {profile.name || "the learner"}’s profile when each field loses focus.</p>
    <div className="practical-sections">
      {document.sections.map((section, sectionIndex) => <article className="card practical-section" key={section.id}>
        <div className="practical-section-head"><span>{String(sectionIndex + 1).padStart(2, "0")}</span><div><h3>{section.title}</h3>{section.description && <p>{section.description}</p>}</div></div>
        {!!section.fields?.length && <div className="practical-fields">
          {section.fields.map(field => {
            const storageKey = key(section.id, field.id);
            const current = values[storageKey];
            return <label className={`field practical-field${field.type === "textarea" ? " wide" : ""}`} key={field.id}><span>{field.label}</span>
              {/signature/i.test(`${field.id} ${field.label}`) ? <DocumentSignature value={String(current ?? "")} savedSignature={canSignDocumentField(profile.role, field.label) ? profile.signatureImage : undefined} label={field.label} editable={canSignDocumentField(profile.role, field.label)} onChange={value => onChange(storageKey, value)} />
                : field.type === "textarea" ? <textarea rows={4} defaultValue={String(current ?? "")} placeholder={field.placeholder} onBlur={event => onChange(storageKey, event.target.value)} />
                : field.type === "select" ? <select defaultValue={String(current ?? "")} onChange={event => onChange(storageKey, event.target.value)}>{(field.options ?? []).map(option => <option key={option} value={option}>{option || "Select an outcome"}</option>)}</select>
                : field.type === "checkbox" ? <input type="checkbox" defaultChecked={current === true} onChange={event => onChange(storageKey, event.target.checked)} />
                : <input type={field.type ?? "text"} defaultValue={String(current ?? "")} placeholder={field.placeholder} onBlur={event => onChange(storageKey, event.target.value)} />}
            </label>;
          })}
        </div>}
        {!!section.items?.length && <div className="practical-items">{section.items.map((item, itemIndex) => {
          const storageKey = key(section.id, item.id);
          return <div className="practical-item" key={item.id}><div className="practical-item-title"><span>{itemIndex + 1}</span><div><strong>{item.text}</strong>{item.guidance && <p>{item.guidance}</p>}</div></div><label className="field"><span>{item.responseLabel ?? "Learner response"}</span><textarea rows={7} defaultValue={String(values[storageKey] ?? "")} onBlur={event => onChange(storageKey, event.target.value)} /></label></div>;
        })}</div>}
      </article>)}
    </div>
  </section></>;
}
