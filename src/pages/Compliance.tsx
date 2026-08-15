import { useMemo, useState } from "react";
import { Icon } from "../icons";
import type { Profile, ProgressState, Route } from "../types";
import { isStaff } from "../types";
import { COURSE_META, MODULES, POE_TOTAL, PROGRAMME_MILESTONES } from "../data/course";
import {
  loadChecklistTicks,
  loadPoeDocs,
  loadPoeReviews,
  loadProfiles,
  loadProgress,
  overallStats,
  poeItemCount,
  unitCompletion,
  useOutcomes,
  useSharedSettings,
} from "../store";
import { auditCsv, downloadText, useAudit } from "../lib/audit";
import type { AuditEvent } from "../lib/audit";
import { attendanceRegisterCount, attendanceSignedCount } from "../lib/gamification";
import { downloadIcs, outlookEventLink, parseSessionDates } from "../lib/integrations";
import type { IcsEvent } from "../lib/integrations";
import { openCertificate, openStatementOfResults } from "../lib/certificates";
import { CHECKLIST_TOTAL } from "./Checklist";
import { Avatar } from "../components/Avatar";

/* ---------- deadline model ---------- */

type DeadlineStatus = "done" | "overdue" | "due-soon" | "upcoming" | "open";

interface Deadline {
  name: string;
  detail: string;
  date: Date | null;
  end: Date | null;
  status: DeadlineStatus;
  icon: string;
  us?: string;
}

const DUE_SOON_DAYS = 14;

function statusFor(end: Date | null, complete: boolean): DeadlineStatus {
  if (complete) return "done";
  if (!end) return "open";
  const now = Date.now();
  if (now > end.getTime()) return "overdue";
  if (end.getTime() - now < DUE_SOON_DAYS * 24 * 3600 * 1000) return "due-soon";
  return "upcoming";
}

function buildDeadlines(progress: ProgressState): Deadline[] {
  const out: Deadline[] = [];
  for (const m of MODULES) {
    for (const u of m.units) {
      const sessions = parseSessionDates(u.dates, u.time);
      const first = sessions[0]?.start ?? null;
      const last = sessions.length ? sessions[sessions.length - 1].end : null;
      out.push({
        name: `US ${u.us} — ${u.title}`,
        detail: `${u.dates} · ${u.time} · records due 5 working days after the last session`,
        date: first,
        end: last,
        status: statusFor(last, unitCompletion(progress, u.us) === 1),
        icon: "book",
        us: u.us,
      });
    }
  }
  for (const ms of PROGRAMME_MILESTONES) {
    const sessions = parseSessionDates(ms.dates, ms.time);
    const first = sessions[0]?.start ?? null;
    const last = sessions.length ? sessions[sessions.length - 1].end : null;
    out.push({
      name: ms.name,
      detail: `${ms.dates} · ${ms.time}`,
      date: first,
      end: last,
      status: statusFor(last, false),
      icon: ms.icon,
    });
  }
  return out.sort((a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0));
}

const STATUS_META: Record<DeadlineStatus, { label: string; cls: string }> = {
  done: { label: "Complete", cls: "ok" },
  overdue: { label: "Overdue", cls: "bad" },
  "due-soon": { label: "Due soon", cls: "warn" },
  upcoming: { label: "Upcoming", cls: "info" },
  open: { label: "Open", cls: "info" },
};

const fmtDate = (d: Date | null) =>
  d ? d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";

/* ---------- per-learner compliance record ---------- */

interface ComplianceRecord {
  profile: Profile;
  enrolmentSigned: boolean;
  signatureOnFile: boolean;
  checklistDone: number;
  poeDone: number;
  poeCompetent: number;
  poeNyc: number;
  attendanceSigned: number;
  overall: number;
  creditsEarned: number;
  unitsCompleted: number;
  outcomesC: number;
  outcomesNyc: number;
}

function complianceFor(
  p: Profile,
  outcomes: Record<string, Record<string, { status: string }>>,
  reviews: Record<string, Record<string, { status: string }>>
): ComplianceRecord {
  const progress = loadProgress(p.id);
  const s = overallStats(progress);
  const ticks = loadChecklistTicks(p.id);
  const myReviews = Object.values(reviews[p.id] ?? {});
  const myOutcomes = Object.values(outcomes[p.id] ?? {});
  return {
    profile: p,
    enrolmentSigned: !!p.enrolment?.signature && !!p.enrolment?.signedDate,
    signatureOnFile: !!p.signatureImage,
    checklistDone: Object.values(ticks).filter((t) => t === "yes").length,
    poeDone: poeItemCount(loadPoeDocs(p.id)),
    poeCompetent: myReviews.filter((r) => r.status === "competent").length,
    poeNyc: myReviews.filter((r) => r.status === "nyc").length,
    attendanceSigned: attendanceSignedCount(p.id),
    overall: s.overall,
    creditsEarned: s.creditsEarned,
    unitsCompleted: s.unitsCompleted,
    outcomesC: myOutcomes.filter((o) => o.status === "C").length,
    outcomesNyc: myOutcomes.filter((o) => o.status === "NYC").length,
  };
}

function recordCsv(records: ComplianceRecord[], registers: number): string {
  const header =
    "Learner,Enrolment signed,Signature on file,Appendix C docs,POE items,POE competent,POE NYC,Attendance,Overall %,Credits,Units completed,Outcomes C,Outcomes NYC";
  const cell = (s: string | number | boolean) => `"${String(s).replace(/"/g, '""')}"`;
  const rows = records.map((r) =>
    [
      cell(r.profile.name),
      cell(r.enrolmentSigned ? "Yes" : "No"),
      cell(r.signatureOnFile ? "Yes" : "No"),
      cell(`${r.checklistDone}/${CHECKLIST_TOTAL}`),
      cell(`${r.poeDone}/${POE_TOTAL}`),
      cell(r.poeCompetent),
      cell(r.poeNyc),
      cell(`${r.attendanceSigned}/${registers}`),
      cell(Math.round(r.overall * 100)),
      cell(r.creditsEarned),
      cell(r.unitsCompleted),
      cell(r.outcomesC),
      cell(r.outcomesNyc),
    ].join(",")
  );
  return [header, ...rows].join("\r\n");
}

/* ---------- page ---------- */

export function CompliancePage({
  profile,
  progress,
}: {
  profile: Profile;
  progress: ProgressState;
  navigate: (r: Route) => void;
}) {
  const staff = isStaff(profile.role);
  const { outcomes } = useOutcomes();
  const reviews = loadPoeReviews();
  const [settings] = useSharedSettings();
  const profiles = loadProfiles();
  const learners = profiles.filter((p) => p.role === "Learner");
  const registers = attendanceRegisterCount();

  // learners see their own record; staff see every learner
  const records = useMemo(
    () => (staff ? learners : [profile]).map((p) => complianceFor(p, outcomes, reviews)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [staff, profile.id, outcomes, profiles.length]
  );

  const deadlines = useMemo(() => buildDeadlines(progress), [progress]);
  const overdue = deadlines.filter((d) => d.status === "overdue").length;
  const dueSoon = deadlines.filter((d) => d.status === "due-soon").length;
  const [showAllDeadlines, setShowAllDeadlines] = useState(false);
  const visibleDeadlines = showAllDeadlines
    ? deadlines
    : deadlines.filter((d) => d.status !== "done").slice(0, 10);

  function exportDeadlinesIcs() {
    const events: IcsEvent[] = [];
    for (const m of MODULES)
      for (const u of m.units)
        for (const s of parseSessionDates(u.dates, u.time))
          events.push({
            title: `US ${u.us} — ${u.title}`,
            start: s.start,
            end: s.end,
            description: `${COURSE_META.title} training session`,
          });
    for (const ms of PROGRAMME_MILESTONES)
      for (const s of parseSessionDates(ms.dates, ms.time))
        events.push({ title: ms.name, start: s.start, end: s.end, description: COURSE_META.title });
    downloadIcs("ITSS-training-calendar", events, "ITSS Learn training calendar");
  }

  return (
    <>
      <div className="eyebrow">
        <Icon name="shield" size={15} />
        Compliance
      </div>
      <h1 className="page-title">Compliance &amp; certification</h1>
      <p className="page-sub">
        Deadlines, audit records and certification tracking · {COURSE_META.title} · SAQA ID{" "}
        {COURSE_META.saqaId}
      </p>

      <div className="card-grid">
        <div className="card stat-card">
          <span className="ico">
            <Icon name="clock" size={26} />
          </span>
          <div>
            <div className="num">{dueSoon}</div>
            <div className="lbl">Deadlines due in {DUE_SOON_DAYS} days</div>
          </div>
        </div>
        <div className="card stat-card">
          <span className="ico">
            <Icon name="bell" size={26} />
          </span>
          <div>
            <div className="num">{overdue}</div>
            <div className="lbl">Overdue items</div>
          </div>
        </div>
        <div className="card stat-card">
          <span className="ico">
            <Icon name="clipboard" size={26} />
          </span>
          <div>
            <div className="num">{registers}</div>
            <div className="lbl">Attendance registers held</div>
          </div>
        </div>
        {staff && (
          <div className="card stat-card">
            <span className="ico">
              <Icon name="people" size={26} />
            </span>
            <div>
              <div className="num">{learners.length}</div>
              <div className="lbl">Learners tracked</div>
            </div>
          </div>
        )}
      </div>

      <h2 className="section-title">
        <span className="ico">
          <Icon name="calendar" size={20} />
        </span>
        Deadlines &amp; key dates
        <span style={{ flex: 1 }} />
        <button className="btn ghost sm" onClick={exportDeadlinesIcs}>
          <Icon name="download" size={15} /> Calendar (.ics)
        </button>
      </h2>
      <div className="card">
        <table className="data deadline-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>First session</th>
              <th>Records due</th>
              <th>Status</th>
              <th aria-label="calendar" />
            </tr>
          </thead>
          <tbody>
            {visibleDeadlines.map((d) => (
              <tr key={d.name}>
                <td>
                  <strong>{d.name}</strong>
                  <div className="mini-note">{d.detail}</div>
                </td>
                <td>{fmtDate(d.date)}</td>
                <td>{fmtDate(d.end)}</td>
                <td>
                  <span className={`status-chip ${STATUS_META[d.status].cls}`}>
                    {STATUS_META[d.status].label}
                  </span>
                </td>
                <td>
                  {d.date && d.end && (
                    <a
                      className="table-icon-link"
                      href={outlookEventLink({ title: d.name, start: d.date, end: d.end })}
                      target="_blank"
                      rel="noreferrer"
                      title="Add to Outlook calendar"
                      aria-label={`Add “${d.name}” to Outlook calendar`}
                    >
                      <Icon name="calendar" size={18} />
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="btn ghost sm" onClick={() => setShowAllDeadlines((s) => !s)}>
          {showAllDeadlines ? "Show open items only" : `Show all ${deadlines.length} items`}
        </button>
      </div>

      <h2 className="section-title">
        <span className="ico">
          <Icon name="checklist" size={20} />
        </span>
        {staff ? "Learner compliance records" : "My compliance record"}
        <span style={{ flex: 1 }} />
        {staff && records.length > 0 && (
          <button
            className="btn ghost sm"
            onClick={() =>
              downloadText(
                `compliance-records-${new Date().toISOString().slice(0, 10)}.csv`,
                recordCsv(records, registers)
              )
            }
          >
            <Icon name="download" size={15} /> Export CSV
          </button>
        )}
      </h2>
      <div className="card" style={{ overflowX: "auto" }}>
        {records.length === 0 ? (
          <p className="mini-note">No learners enrolled yet.</p>
        ) : (
          <table className="data compliance-table">
            <thead>
              <tr>
                <th>Learner</th>
                <th>Enrolment</th>
                <th>Signature</th>
                <th>Appendix C</th>
                <th>POE</th>
                <th>POE reviews</th>
                <th>Attendance</th>
                <th>Completion</th>
                <th>Credits</th>
                <th>Outcomes</th>
                <th>Certification</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const certReady =
                  r.overall >= 1 && r.outcomesNyc === 0 && r.poeNyc === 0;
                return (
                  <tr key={r.profile.id}>
                    <td>
                      <span className="cell-person">
                        <Avatar profile={r.profile} size={26} />
                        {r.profile.name}
                      </span>
                    </td>
                    <td>
                      <span className={`status-chip ${r.enrolmentSigned ? "ok" : "warn"}`}>
                        {r.enrolmentSigned ? "Signed" : "Incomplete"}
                      </span>
                    </td>
                    <td>
                      <span className={`status-chip ${r.signatureOnFile ? "ok" : "warn"}`}>
                        {r.signatureOnFile ? "On file" : "Missing"}
                      </span>
                    </td>
                    <td>
                      {r.checklistDone}/{CHECKLIST_TOTAL}
                    </td>
                    <td>
                      {r.poeDone}/{POE_TOTAL}
                    </td>
                    <td>
                      <span className="status-chip ok">{r.poeCompetent} C</span>{" "}
                      {r.poeNyc > 0 && <span className="status-chip bad">{r.poeNyc} NYC</span>}
                    </td>
                    <td>
                      {r.attendanceSigned}/{registers}
                    </td>
                    <td>{Math.round(r.overall * 100)}%</td>
                    <td>
                      {r.creditsEarned}/{COURSE_META.credits}
                    </td>
                    <td>
                      <span className="status-chip ok">{r.outcomesC} C</span>{" "}
                      {r.outcomesNyc > 0 && (
                        <span className="status-chip bad">{r.outcomesNyc} NYC</span>
                      )}
                    </td>
                    <td>
                      <span className="cell-actions">
                        <button
                          className="btn ghost sm"
                          title="Statement of results (print / PDF)"
                          onClick={() =>
                            openStatementOfResults(r.profile, loadProgress(r.profile.id), outcomes)
                          }
                        >
                          <Icon name="document" size={14} /> Results
                        </button>
                        <button
                          className="btn ghost sm"
                          disabled={!certReady && !staff}
                          title={
                            certReady
                              ? "Certificate of completion (print / PDF)"
                              : staff
                                ? "Not yet earned — opens with a PREVIEW watermark until every unit is complete with no NYC outcomes"
                                : "Available once every unit is complete with no NYC outcomes"
                          }
                          onClick={() => openCertificate(r.profile, r.creditsEarned, !certReady)}
                        >
                          <Icon name="certificate" size={14} /> {certReady ? "Certificate" : staff ? "Preview certificate" : "Certificate"}
                        </button>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <p className="mini-note">
          Enrolment, signature, Appendix C, POE evidence and attendance make up the learner's
          compliance file. Assessment outcomes are recorded by the assessor
          {settings.supportEmail ? ` — queries: ${settings.supportEmail}` : ""}.
        </p>
      </div>

      {staff && <AuditTrail />}
    </>
  );
}

/* ---------- audit trail (staff only) ---------- */

const AUDIT_TYPE_LABELS: Record<string, string> = {
  "auth.signin": "Sign-in",
  "auth.signout": "Sign-out",
  "account.create": "Account created",
  "account.password": "Password changed",
  "account.role": "Role changed",
  "account.delete": "Account deleted",
  "enrolment.saved": "Enrolment saved",
  "quiz.submit": "Quiz submitted",
  "exercise.submit": "Exercise marked",
  "poe.upload": "POE upload",
  "poe.remove": "POE removed",
  "poe.review": "POE reviewed",
  "outcome.set": "Outcome recorded",
  "attendance.sign": "Attendance signed",
  "announce.post": "Announcement",
  "qa.post": "Q&A activity",
};

function AuditTrail() {
  const events = useAudit();
  const [typeFilter, setTypeFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(50);

  const types = useMemo(() => [...new Set(events.map((e) => e.type))], [events]);
  const filtered = events.filter((e: AuditEvent) => {
    if (typeFilter !== "all" && e.type !== typeFilter) return false;
    if (query) {
      const q = query.toLowerCase();
      return (
        e.actorName.toLowerCase().includes(q) ||
        e.detail.toLowerCase().includes(q) ||
        (e.targetName ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <>
      <h2 className="section-title">
        <span className="ico">
          <Icon name="eye" size={20} />
        </span>
        Audit trail
        <span style={{ flex: 1 }} />
        <button
          className="btn ghost sm"
          disabled={filtered.length === 0}
          onClick={() =>
            downloadText(
              `audit-trail-${new Date().toISOString().slice(0, 10)}.csv`,
              auditCsv(filtered)
            )
          }
        >
          <Icon name="download" size={15} /> Export CSV
        </button>
      </h2>
      <div className="card">
        <div className="audit-filters">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All events ({events.length})</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {AUDIT_TYPE_LABELS[t] ?? t}
              </option>
            ))}
          </select>
          <input
            placeholder="Search person or detail…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {filtered.length === 0 ? (
          <p className="mini-note">
            No audit events yet — sign-ins, uploads, marks and reviews will appear here.
          </p>
        ) : (
          <table className="data audit-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Who</th>
                <th>Event</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, limit).map((e) => (
                <tr key={e.id}>
                  <td className="nowrap">{new Date(e.at).toLocaleString()}</td>
                  <td>
                    {e.actorName} <span className="mini-note">({e.actorRole})</span>
                  </td>
                  <td>
                    <span className="status-chip info">{AUDIT_TYPE_LABELS[e.type] ?? e.type}</span>
                  </td>
                  <td>
                    {e.detail}
                    {e.targetName ? <span className="mini-note"> → {e.targetName}</span> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {filtered.length > limit && (
          <button className="btn ghost sm" onClick={() => setLimit((l) => l + 100)}>
            Show more ({filtered.length - limit} older events)
          </button>
        )}
      </div>
    </>
  );
}
