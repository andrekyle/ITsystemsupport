import { Icon } from "../icons";
import type { Profile } from "../types";
import { useChecklist } from "../store";
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
