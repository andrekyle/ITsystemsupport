import { Icon } from "../icons";
import type { Profile } from "../types";
import { useChecklist, useSectionD } from "../store";
import type { ChecklistTick } from "../store";

interface Row {
  id: string;
  no?: string;
  label: string;
  sub?: boolean;
}

const ROWS: Row[] = [
  { id: "id", no: "1", label: "Certified Copy of Identity Book (ID)" },
  { id: "matric", no: "2", label: "Certified Copy of Matric / Senior Certificate" },
  { id: "certs", no: "3", label: "Certified Copies of other Certificates (if applicable)" },
  { id: "cv", no: "4", label: "CV" },
  { id: "poe", no: "5", label: "Portfolio of Evidence" },
  { id: "formative", no: "6", label: "Formative Assessment" },
  { id: "form-kq", label: "Knowledge Questionnaire", sub: true },
  { id: "form-wb", label: "Classroom Workbook", sub: true },
  { id: "summative", no: "7", label: "Summative Assessment" },
  { id: "sum-kq", label: "Knowledge Questionnaire", sub: true },
  { id: "sum-wa", label: "Workplace Assignments", sub: true },
  { id: "sum-pa", label: "Practical Assessment", sub: true },
  { id: "sum-pn", label: "Personal Narrative", sub: true },
  { id: "sum-wt", label: "Witness Testimonial", sub: true },
  { id: "sum-log", label: "Logbook", sub: true },
];

export function ChecklistPage({ profile }: { profile: Profile }) {
  const { ticks, setTick } = useChecklist(profile.id);
  const done = ROWS.filter((r) => ticks[r.id] === "yes").length;

  const toggle = (id: string, value: ChecklistTick) => {
    setTick(id, ticks[id] === value ? null : value);
  };

  return (
    <>
      <div className="eyebrow">
        <Icon name="checklist" size={15} />
        Appendix C
      </div>
      <h1 className="page-title">Appendix C: Checklist</h1>
      <p className="page-sub">
        Tick off each attachment as it is included in your Portfolio of Evidence submission —{" "}
        {done} of {ROWS.length} marked as included.
      </p>

      <table className="data checklist-table">
        <thead>
          <tr>
            <th className="no">No</th>
            <th>Attachments Included</th>
            <th className="tick">Yes (Tick)</th>
            <th className="tick">No (Tick)</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.id}>
              <td className="no">{r.no ?? ""}</td>
              <td className={r.sub ? "sub" : ""}>{r.label}</td>
              <td className="tick">
                <input
                  type="checkbox"
                  checked={ticks[r.id] === "yes"}
                  onChange={() => toggle(r.id, "yes")}
                  aria-label={`${r.label} — yes`}
                />
              </td>
              <td className="tick">
                <input
                  type="checkbox"
                  checked={ticks[r.id] === "no"}
                  onChange={() => toggle(r.id, "no")}
                  aria-label={`${r.label} — no`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="callout">
        <span className="ico">
          <Icon name="info" size={19} />
        </span>
        <span>
          Your ticks are saved to your profile automatically. Certified copies must be no older
          than three months when your Portfolio of Evidence is submitted for assessment.
        </span>
      </div>
    </>
  );
}

/* ---------- Section D: Required Evidence and Declaration ---------- */

const SECTION_D_ROWS: Row[] = [
  { id: "id", no: "1", label: "Certified Copy of Identity Book (ID)" },
  { id: "matric", no: "2", label: "Certified Copy of Matric / Senior Certificate" },
  { id: "certs", no: "3", label: "Certified Copies of other Certificates (if applicable)" },
  { id: "cv", no: "4", label: "CV" },
  { id: "formative", no: "5", label: "Formative Assessments" },
  { id: "summative", no: "6", label: "Summative Assessments" },
  { id: "poe", no: "7", label: "Portfolios of Evidence" },
];

const SIGNATORIES = [
  { id: "learner", label: "Learner Name & Signature" },
  { id: "assessor", label: "Assessor Name & Signature" },
  { id: "moderator", label: "Moderator Name & Signature" },
];

export function SectionDPage({ profile }: { profile: Profile }) {
  const { fields, setField } = useSectionD(profile.id);

  const tick = (id: string) => fields[`tick.${id}`];
  const toggle = (id: string, value: ChecklistTick) => {
    setField(`tick.${id}`, tick(id) === value ? null : value);
  };

  return (
    <>
      <div className="eyebrow">
        <Icon name="document" size={15} />
        Section D
      </div>
      <h1 className="page-title">Section D: Required Evidence and Declaration</h1>
      <p className="page-sub">
        Check to ensure that the following assessments, evidence and assignments are completed in
        full, which forms part of your Portfolio of Evidence.
      </p>

      <ol className="sd-list">
        <li>All Formative Assessment Instrument</li>
        <li>All Summative Assessment Instrument</li>
        <li>All Portfolio of Evidence</li>
      </ol>

      <h2 className="section-title">
        <span className="ico">
          <Icon name="folder" size={20} />
        </span>
        Additional Evidence and Attachments
      </h2>
      <p className="muted" style={{ marginTop: -6 }}>
        The following documents should be attached and included in your final Portfolio submission
        except if requested from you before by your assessor or facilitator. (See Appendix C —
        Checklist for the comprehensive list.)
      </p>

      <table className="data checklist-table">
        <thead>
          <tr>
            <th className="no">No</th>
            <th>Attachments Included</th>
            <th className="tick">Yes (Tick)</th>
            <th className="tick">No (Tick)</th>
          </tr>
        </thead>
        <tbody>
          {SECTION_D_ROWS.map((r) => (
            <tr key={r.id}>
              <td className="no">{r.no}</td>
              <td>{r.label}</td>
              <td className="tick">
                <input
                  type="checkbox"
                  checked={tick(r.id) === "yes"}
                  onChange={() => toggle(r.id, "yes")}
                  aria-label={`${r.label} — yes`}
                />
              </td>
              <td className="tick">
                <input
                  type="checkbox"
                  checked={tick(r.id) === "no"}
                  onChange={() => toggle(r.id, "no")}
                  aria-label={`${r.label} — no`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="card declaration">
        <div className="decl-head">DECLARATION OF AUTHENTICITY BY LEARNER AND ASSESSOR</div>
        <p className="decl-text">
          I,{" "}
          <input
            className="decl-name"
            value={fields["decl.name"] ?? ""}
            onChange={(e) => setField("decl.name", e.target.value)}
            placeholder="full name"
            aria-label="Declarant full name"
          />{" "}
          declare that all the information, tasks and evidence submitted in my Portfolio of
          Evidence is all my own work and completed by myself. I understand and accept that the
          assessment judgment will be affected should it be proven that the work / evidence
          submitted is not my own.
        </p>
        <div className="decl-signs">
          {SIGNATORIES.map((s) => (
            <div className="decl-sign" key={s.id}>
              <input
                value={fields[`sign.${s.id}`] ?? ""}
                onChange={(e) => setField(`sign.${s.id}`, e.target.value)}
                placeholder="Name & signature"
                aria-label={s.label}
              />
              <input
                type="date"
                value={fields[`date.${s.id}`] ?? ""}
                onChange={(e) => setField(`date.${s.id}`, e.target.value)}
                aria-label={`${s.label} date`}
              />
              <div className="lbl">
                {s.label}
                <br />
                Date
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="callout">
        <span className="ico">
          <Icon name="info" size={19} />
        </span>
        <span>
          Your entries are saved to your profile automatically. The assessor and moderator sign
          during assessment and moderation of your Portfolio of Evidence.
        </span>
      </div>
    </>
  );
}
