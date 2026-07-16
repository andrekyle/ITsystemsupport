import { Icon } from "../icons";
import type { Profile } from "../types";
import { isStaff } from "../types";
import { Gloss } from "./Course";
import {
  ASSESSMENT_FRAMEWORK,
  DELIVERABLES,
  FACILITATION_DUTIES,
  MODULES,
  PROGRAMME_MILESTONES,
  RESOURCES,
} from "../data/course";

export function AssessmentsPage({ profile }: { profile: Profile }) {
  return (
    <>
      <div className="eyebrow">
        <Icon name="clipboard" size={15} />
        Assessments
      </div>
      <h1 className="page-title">Assessment framework</h1>
      <p className="page-sub">
        <Gloss text="Assessments are conducted in line with QCTO, SETA and institutional requirements, and are valid, reliable, fair and aligned with the OCD and ASD for SAQA ID 48573." />
      </p>

      <div className="two-col">
        {ASSESSMENT_FRAMEWORK.map((sec) => (
          <div className="card" key={sec.heading}>
            <h2 className="section-title mt-0" style={{ margin: "0 0 10px" }}>
              <span className="ico">
                <Icon name={sec.icon} size={20} />
              </span>
              {sec.heading}
            </h2>
            <ul className="duty-list">
              {sec.items.map((it) => (
                <li key={it}>
                  <span className="ico">
                    <Icon name="checkCircle" size={16} />
                  </span>
                  <span>
                    <Gloss text={it} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {isStaff(profile.role) && (
        <>
          <h2 className="section-title">
            <span className="ico">
              <Icon name="presenter" size={20} />
            </span>
            Facilitation responsibilities
          </h2>
          <div className="two-col">
            {FACILITATION_DUTIES.map((sec) => (
              <div className="card" key={sec.heading}>
                <h2 className="section-title mt-0" style={{ margin: "0 0 10px" }}>
                  <span className="ico">
                    <Icon name={sec.icon} size={20} />
                  </span>
                  {sec.heading}
                </h2>
                <ul className="duty-list">
                  {sec.items.map((it) => (
                    <li key={it}>
                      <span className="ico">
                        <Icon name="checkCircle" size={16} />
                      </span>
                      <span>
                        <Gloss text={it} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="callout">
        <span className="ico">
          <Icon name="shield" size={19} />
        </span>
        <span>
          Assessment documentation is safeguarded to ensure confidentiality and compliance.
          Assessment-related queries or appeals are addressed and rectified through the
          institutional appeals process.
        </span>
      </div>
    </>
  );
}

export function DeliverablesPage() {
  return (
    <>
      <div className="eyebrow">
        <Icon name="checklist" size={15} />
        Deliverables
      </div>
      <h1 className="page-title">Deliverables & due dates</h1>
      <p className="page-sub">
        Standards and submission timelines for programme deliverables across the training calendar.
      </p>

      <table className="data">
        <thead>
          <tr>
            <th>Deliverable</th>
            <th>Standard / Requirement</th>
            <th>Due date</th>
          </tr>
        </thead>
        <tbody>
          {DELIVERABLES.map((d) => (
            <tr key={d.deliverable}>
              <td>
                <span className="with-ico">
                  <span className="ico">
                    <Icon name={d.icon} size={18} />
                  </span>
                  <strong>{d.deliverable}</strong>
                </span>
              </td>
              <td>{d.standard}</td>
              <td>{d.due}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="callout">
        <span className="ico">
          <Icon name="info" size={19} />
        </span>
        <span>
          Lesson plans are submitted for approval at least <strong>3 working days</strong> before each
          session. Attendance registers are signed and submitted <strong>after each session</strong>.
        </span>
      </div>
    </>
  );
}

export function ResourcesPage() {
  return (
    <>
      <div className="eyebrow">
        <Icon name="globe" size={15} />
        Resources
      </div>
      <h1 className="page-title">Resources</h1>
      <p className="page-sub">System Support NQF Level 5 Learnership · Investec Group</p>

      {RESOURCES.map((r) => (
        <a
          className="res-card"
          key={r.title}
          href={r.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="t">
            {r.title} ↗
          </span>
          <span className="d">{r.desc}</span>
        </a>
      ))}
    </>
  );
}

export function CalendarPage() {
  return (
    <>
      <div className="eyebrow">
        <Icon name="calendar" size={15} />
        Training calendar
      </div>
      <h1 className="page-title">Training dates</h1>
      <p className="page-sub">
        All sessions run 09h00 – 14h00 as per the QCTO-approved training schedule (Jul 2026 – Jun 2027).
      </p>

      {MODULES.map((m, i) => (
        <div key={m.id}>
          <h2 className="section-title">
            <span className="ico">
              <Icon name={m.icon} size={20} />
            </span>
            Module {i + 1}: {m.name}
          </h2>
          <table className="data">
            <thead>
              <tr>
                <th style={{ width: 90 }}>US ID</th>
                <th>Unit standard title</th>
                <th style={{ width: 190 }}>Training dates</th>
                <th style={{ width: 130 }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {m.units.map((u) => (
                <tr key={u.us}>
                  <td>{u.us}</td>
                  <td>{u.title}</td>
                  <td>{u.dates}</td>
                  <td>{u.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <h2 className="section-title">
        <span className="ico">
          <Icon name="certificate" size={20} />
        </span>
        Programme milestones
      </h2>
      <table className="data">
        <thead>
          <tr>
            <th>Milestone</th>
            <th style={{ width: 190 }}>Dates</th>
            <th style={{ width: 130 }}>Time</th>
          </tr>
        </thead>
        <tbody>
          {PROGRAMME_MILESTONES.map((ms) => (
            <tr key={ms.name}>
              <td>
                <span className="with-ico">
                  <span className="ico">
                    <Icon name={ms.icon} size={18} />
                  </span>
                  <strong>
                    <Gloss text={ms.name} />
                  </strong>
                </span>
              </td>
              <td>{ms.dates}</td>
              <td>{ms.time}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
