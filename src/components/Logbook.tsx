import React from "react";
import { Icon } from "../icons";
import type { LogbookChecklistRow, LogbookSpec } from "../types";

function ChecklistRows({
  rows,
  startNo,
  values,
  onChange,
}: {
  rows: LogbookChecklistRow[];
  startNo: number;
  values: Record<string, string | boolean>;
  onChange: (key: string, value: string | boolean) => void;
}) {
  return (
    <>
      {rows.map((row, i) => (
        <tr key={row.text}>
          <td className="lb-no">{startNo + i}</td>
          <td>{row.text}</td>
          {row.marks.map((def, ci) => {
            const key = `ec:${startNo + i}:${ci}`;
            const stored = values[key];
            const on = typeof stored === "boolean" ? stored : def;
            return (
              <td key={ci} className="lb-mark">
                <button
                  type="button"
                  className={`lb-markbtn${on ? " on" : ""}`}
                  onClick={() => onChange(key, !on)}
                  aria-pressed={on}
                  title={on ? "Remove mark" : "Mark"}
                >
                  <Icon name={on ? "checkCircle" : "circle"} size={15} />
                </button>
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}

const SIX_COLS_HEADERS = [
  "Learner Activity",
  "Logbook Activity",
  "Project",
  "Learner Manual",
  "Logbook Activity",
  "Project",
];

function HeaderRows({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <>
      <tr className="lb-headrow">
        <th colSpan={2} rowSpan={3} className="lb-title">
          {title}
          {subtitle && <span className="sub">{subtitle}</span>}
        </th>
        <th colSpan={6}>Evidence checklist</th>
      </tr>
      <tr className="lb-headrow">
        <th colSpan={3}>Workplace</th>
        <th colSpan={3}>Assessor</th>
      </tr>
      <tr className="lb-headrow">
        {SIX_COLS_HEADERS.map((h, i) => (
          <th key={i}>{h}</th>
        ))}
      </tr>
    </>
  );
}

export interface LogbookValues {
  [key: string]: string | boolean;
}

interface LogbookProps {
  spec: LogbookSpec;
  values: LogbookValues;
  onChange: (key: string, value: string | boolean) => void;
}

export function Logbook({ spec, values, onChange }: LogbookProps) {
  const field = (k: string, placeholder = "") => (
    <input
      className="lb-input"
      type="text"
      value={(values[k] as string) ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(k, e.target.value)}
    />
  );
  const area = (k: string, label: string) => (
    <div className="lb-feedback-box">
      <span className="muted">{label}</span>
      <textarea
        className="lb-textarea"
        value={(values[k] as string) ?? ""}
        onChange={(e) => onChange(k, e.target.value)}
      />
    </div>
  );
  const check = (k: string, label: string) => (
    <label className="lb-checkbox" key={k}>
      <input
        type="checkbox"
        checked={!!values[k]}
        onChange={(e) => onChange(k, e.target.checked)}
      />
      {label}
    </label>
  );
  const multiline = (k: string) => (
    <textarea
      className="lb-textarea lb-cellarea"
      rows={3}
      value={(values[k] as string) ?? ""}
      onChange={(e) => onChange(k, e.target.value)}
    />
  );
  const dateField = (k: string) => {
    const raw = (values[k] as string) ?? "";
    const label = raw
      ? new Date(`${raw}T00:00:00`).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "";
    return (
      <span className="lb-datewrap" title="Pick a date">
        <Icon name="calendar" size={15} />
        <span className={`lb-dateview${raw ? "" : " empty"}`}>{label || "Select date"}</span>
        <input
          className="lb-datehidden"
          type="date"
          value={raw}
          onChange={(e) => onChange(k, e.target.value)}
          onClick={(e) => {
            try {
              (e.currentTarget as HTMLInputElement).showPicker?.();
            } catch {
              /* picker requires user gesture; ignore */
            }
          }}
          aria-label="Pick date"
        />
      </span>
    );
  };

  return (
    <div className="logbook">
      <h2 className="section-title">
        <span className="ico">
          <Icon name="book" size={20} />
        </span>
        Learner Logbook — {spec.assignmentTitle}
      </h2>
      <p className="muted" style={{ marginTop: -6 }}>
        {spec.programme} · {spec.unitLabel} · All fields are editable and saved to your profile.
      </p>

      {/* Learner details */}
      <div className="card lb-card">
        <div className="task-label" style={{ marginTop: 0 }}>Learner details</div>
        <table className="data kv lb-details">
          <tbody>
            {spec.detailFields.map((f) => (
              <tr key={f}>
                <td className="k">{f}</td>
                <td className="lb-fill">
                  {f === "Start & Completion Date" ? (
                    <span className="lb-daterange">
                      {dateField("detail:Start Date")}
                      <span className="muted">to</span>
                      {dateField("detail:Completion Date")}
                    </span>
                  ) : (
                    field(`detail:${f}`)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Project task */}
      <div className="card lb-card">
        <div className="task-label" style={{ marginTop: 0 }}>Logbook project</div>
        <table className="data lb-table">
          <thead>
            <tr>
              <th style={{ width: 90 }}>Time</th>
              <th>Activity</th>
              <th style={{ width: 110 }}>Resources</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{spec.project.time}</td>
              <td>
                <strong>{spec.project.title}</strong>
                <br />
                {spec.project.text}
              </td>
              <td>{spec.project.resource}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Evidence checklist */}
      <div className="card lb-card">
        <div className="task-label" style={{ marginTop: 0 }}>
          Evidence checklist
        </div>
        <div className="lb-scroll">
          <table className="data lb-matrix">
            <tbody>
              <HeaderRows
                title="Specific outcome & assessment criteria"
                subtitle="Embedded knowledge questions"
              />
              <ChecklistRows
                rows={spec.knowledgeQuestions}
                startNo={1}
                values={values}
                onChange={onChange}
              />
              <HeaderRows title="Practical activities" />
              <ChecklistRows
                rows={spec.practicalActivities}
                startNo={spec.knowledgeQuestions.length + 1}
                values={values}
                onChange={onChange}
              />
            </tbody>
          </table>
        </div>
      </div>

      {/* Workplace activities */}
      <div className="card lb-card">
        <div className="task-label" style={{ marginTop: 0 }}>Workplace activities</div>
        <table className="data lb-table">
          <thead>
            <tr>
              <th style={{ width: "30%" }}>
                Activity
                <span className="sub">
                  These activities must be completed or complied to by the learner in the workplace.
                </span>
              </th>
              <th>
                Evidence
                <span className="sub">{spec.workplaceEvidenceNote}</span>
              </th>
              <th style={{ width: 100 }}>Workplace</th>
              <th style={{ width: 90 }}>Learner</th>
            </tr>
          </thead>
          <tbody>
            {spec.workplaceActivities.map((a, i) => (
              <tr key={a}>
                <td>{a}</td>
                <td className="lb-fill">{multiline(`wpa:${i}:evidence`)}</td>
                <td className="lb-fill">{field(`wpa:${i}:workplace`)}</td>
                <td className="lb-fill">{field(`wpa:${i}:learner`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Other activities */}
      <div className="card lb-card">
        <div className="task-label" style={{ marginTop: 0 }}>Other activities</div>
        <table className="data lb-table">
          <thead>
            <tr>
              <th style={{ width: "30%" }}>
                Activity
                <span className="sub">These activities have to be completed by the learner.</span>
              </th>
              <th>
                Evidence
                <span className="sub">{spec.otherEvidenceNote}</span>
              </th>
              <th style={{ width: 100 }}>Assessor</th>
              <th style={{ width: 90 }}>Learner</th>
            </tr>
          </thead>
          <tbody>
            {spec.otherActivities.map((a, i) => (
              <tr key={a.activity}>
                <td>
                  <strong>{a.activity}</strong>
                </td>
                <td>{a.evidence}</td>
                <td className="lb-fill">{field(`oa:${i}:assessor`)}</td>
                <td className="lb-fill">{field(`oa:${i}:learner`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* For assessor */}
      <div className="card lb-card">
        <div className="task-label" style={{ marginTop: 0 }}>For assessor — file checked</div>
        <table className="data lb-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Assessor signature</th>
              <th>Workplace</th>
            </tr>
          </thead>
          <tbody>
            {[0, 1].map((r) => (
              <tr key={r}>
                <td className="lb-fill">{dateField(`fc:${r}:date`)}</td>
                <td className="lb-fill">{field(`fc:${r}:sign`)}</td>
                <td className="lb-fill">{field(`fc:${r}:workplace`)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {[
          {
            who: "Workplace",
            note: "This is to verify that the learner has taken part in the activities in their workplace.",
            fields: [["Workplace (Sign)", "Designation"], ["Name", "Date"]],
          },
          {
            who: "Assessor",
            note: "This is to verify that the learner has completed all the above and has achieved competence.",
            fields: [["Assessor Name", "Assessor Reg. No"], ["Assessor Signature", "Date"]],
          },
          {
            who: "Learner",
            note: "This is to verify that the assessor has observed me in the workplace.",
            fields: [["Learner's Name", "Learner's Reg. No"], ["Learner's Signature", "Date"]],
          },
        ].map((blk) => (
          <div className="lb-signblock" key={blk.who}>
            <p className="lesson-p" style={{ marginBottom: 8 }}>
              <strong>{blk.who}</strong> — {blk.note}
            </p>
            {blk.fields.map((pair, i) => (
              <div className="lb-signrow" key={i}>
                {pair.map((f) => (
                  <span className="lb-signline" key={f}>
                    {f}: {f === "Date" ? dateField(`sign:${blk.who}:${f}`) : field(`sign:${blk.who}:${f}`)}
                  </span>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Feedback record */}
      <div className="card lb-card">
        <div className="task-label" style={{ marginTop: 0 }}>Feedback record</div>
        {area("fb:comments", "Comments from learner:")}
        <div className="task-label">Judgement</div>
        <div className="lb-judgement">
          {[
            "Meets the requirements",
            "Does not meet the requirements",
            "Requires additional evidence",
            "Requires another assessment",
            "Can continue to the next assessment",
            "Requires another assessment by another assessor",
          ].map((j) => check(`fb:j:${j}`, j))}
        </div>
        <div className="lb-signrow" style={{ marginTop: 12 }}>
          <span className="lb-signline">
            Action required: {field("fb:action")}
          </span>
          <span className="lb-signline">
            By when: {dateField("fb:bywhen")}
          </span>
        </div>
        <div style={{ marginTop: 12 }}>{area("fb:remarks", "Assessor's feedback remarks:")}</div>
      </div>

      {/* Declaration + project checklist */}
      <div className="card lb-card">
        <div className="task-label" style={{ marginTop: 0 }}>Declaration by learner</div>
        <p className="lesson-p">
          I, <span className="lb-inline-input">{field("decl:name", "full name")}</span>, declare
          that I am satisfied that the feedback given to me by the Assessor was relevant, sufficient
          and done in a constructive manner. I accept the assessment judgement and have no further
          questions relating to this particular assessment instrument.
        </p>
        {["Learner", "Assessor", "Moderator"].map((who) => (
          <div className="lb-signrow" key={who}>
            <span className="lb-signline">
              <span className="lbl">{who} Name:</span> {field(`decl:${who}:name`)}
            </span>
            <span className="lb-signline">
              <span className="lbl sm">Signature:</span> {field(`decl:${who}:signature`)}
            </span>
            <span className="lb-signline">
              <span className="lbl xs">Date:</span> {dateField(`decl:${who}:date`)}
            </span>
          </div>
        ))}

        <div className="task-label">Project checklist</div>
        <p className="muted" style={{ marginBottom: 8 }}>
          This serves to confirm that the undersigned parties have completed, checked and attached
          the following activities to this logbook.
        </p>
        <div className="lb-scroll">
          <table className="data lb-table lb-compact" style={{ minWidth: 980 }}>
            <thead>
              <tr>
                <th style={{ width: 40 }}>No</th>
                <th style={{ width: 70 }}>Project name</th>
                <th style={{ width: 190 }}>Learner</th>
                <th style={{ width: 104 }}>Date</th>
                <th style={{ width: 190 }}>Workplace</th>
                <th style={{ width: 104 }}>Date</th>
                <th style={{ width: 190 }}>Assessor</th>
                <th style={{ width: 104 }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {spec.projectChecklist.map((p) => (
                <React.Fragment key={p.no}>
                  <tr>
                    <td>{p.no}</td>
                    <td>{p.name}</td>
                    <td className="lb-fill">{field(`pc:${p.no}:learner`)}</td>
                    <td className="lb-fill">{dateField(`pc:${p.no}:ldate`)}</td>
                    <td className="lb-fill">{field(`pc:${p.no}:workplace`)}</td>
                    <td className="lb-fill">{dateField(`pc:${p.no}:wdate`)}</td>
                    <td className="lb-fill">{field(`pc:${p.no}:assessor`)}</td>
                    <td className="lb-fill">{dateField(`pc:${p.no}:adate`)}</td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="lb-comments-label">
                      Comments
                    </td>
                    <td colSpan={6} className="lb-fill">
                      {multiline(`pc:${p.no}:comments`)}
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
