import { useState } from "react";
import { Icon } from "../icons";
import type { Profile } from "../types";

/** Static report documents bundled with the app (served from /public/reports). */
const REPORTS = [
  {
    id: "learner-tracker-investec-aug-2026",
    title: "Learner Submission & Attendance Tracker — Investec, August 2026",
    description:
      "Unit standard submission statuses, attendance for the five facilitated contact days and per-learner comments. Data as at 13 August 2026.",
    href: "/reports/learner-tracker-investec-aug-2026.html",
  },
];

/** Reports library — Super User only. */
export function ReportsPage({ profile }: { profile: Profile }) {
  const [openId, setOpenId] = useState<string | null>(REPORTS[0]?.id ?? null);

  if (profile.role !== "Super User") {
    return (
      <div className="card">
        <p>Reports are only available to the Super User.</p>
      </div>
    );
  }

  const open = REPORTS.find((r) => r.id === openId) ?? null;

  return (
    <>
      <div className="eyebrow">
        <Icon name="chart" size={15} />
        Programme reporting
      </div>
      <h1 className="page-title">Reports</h1>
      <p className="page-sub">
        Formal programme reports. Open a report below — each one can be edited, printed or saved
        as PDF from its own toolbar.
      </p>

      <div className="reports-list">
        {REPORTS.map((r) => (
          <div key={r.id} className={`card report-card${openId === r.id ? " open" : ""}`}>
            <div className="report-card-row">
              <span className="report-ico">
                <Icon name="document" size={18} />
              </span>
              <div className="report-meta">
                <div className="report-title">{r.title}</div>
                <div className="report-desc">{r.description}</div>
              </div>
              <div className="report-actions">
                <button
                  className="btn ghost sm"
                  onClick={() => setOpenId(openId === r.id ? null : r.id)}
                >
                  <Icon name="eye" size={15} /> {openId === r.id ? "Hide" : "View"}
                </button>
                <a className="btn ghost sm" href={r.href} target="_blank" rel="noreferrer">
                  <Icon name="globe" size={15} /> Open in new tab
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="card report-frame-card">
          <iframe className="report-frame" src={open.href} title={open.title} />
        </div>
      )}
    </>
  );
}
