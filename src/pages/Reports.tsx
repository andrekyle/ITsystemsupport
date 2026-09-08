import { useEffect, useMemo, useState } from "react";
import { Icon } from "../icons";
import type { Profile } from "../types";
import { loadProfiles } from "../store";
import { attendanceRegisterCount } from "../lib/gamification";
import {
  fetchCloudLearnerData,
  mergeProfileWithCloud,
  remoteOnlyProfiles,
  type CloudLearnerData,
} from "../lib/directory";
import { analyse, type LearnerRow } from "./Analytics";
import {
  REPORT_KINDS,
  buildReportData,
  openReportDocument,
  requestReport,
  type ReportKind,
} from "../lib/reports";

const ERROR_TEXT: Record<string, string> = {
  not_configured: "The AI service is not configured on this deployment (missing API key).",
  network: "Could not reach the AI service — check your connection and try again.",
  timeout: "The AI took too long to answer. Try again in a moment.",
};

export function ReportsPage({ profile }: { profile: Profile }) {
  const registers = attendanceRegisterCount();
  const [cloud, setCloud] = useState<CloudLearnerData | null>(null);
  const [kindId, setKindId] = useState<string>(REPORT_KINDS[0].id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void fetchCloudLearnerData().then((d) => {
      if (alive && d) setCloud(d);
    });
    return () => {
      alive = false;
    };
  }, []);

  const rows: LearnerRow[] = useMemo(() => {
    const localList = loadProfiles();
    const localLearners = localList.filter((p) => p.role === "Learner");
    const remote = remoteOnlyProfiles(localList, cloud?.profiles ?? []).filter(
      (p) => p.role === "Learner"
    );
    const all = [...localLearners.map((p) => mergeProfileWithCloud(p, cloud)), ...remote];
    return all.map((p) => analyse(p, registers, cloud));
  }, [registers, cloud]);

  const kind: ReportKind = REPORT_KINDS.find((k) => k.id === kindId) ?? REPORT_KINDS[0];

  async function generate() {
    if (busy) return;
    setBusy(true);
    setError(null);
    setDone(null);
    const result = await requestReport(kind, buildReportData(kind.id, rows, registers));
    setBusy(false);
    if (!result.ok) {
      setError(ERROR_TEXT[result.error] ?? `The AI could not write the report (${result.error}).`);
      return;
    }
    setDone(kind.name);
    openReportDocument(kind, result.report, rows, registers, profile);
  }

  return (
    <>
      <h2 className="section-title">
        <span className="ico">
          <Icon name="document" size={20} />
        </span>
        AI Reports
        <span className="token-super-pill" title="Visible only to the super user">
          Super user
        </span>
      </h2>
      <p className="muted" style={{ marginTop: -6, marginBottom: 16, fontSize: 15.5 }}>
        Pick a report and the AI writes it from live platform data — {rows.length} learner
        {rows.length === 1 ? "" : "s"}, {registers} attendance register{registers === 1 ? "" : "s"}.
        The finished document opens print-ready in the onboarding-pack style.
      </p>

      <div className="card-grid reports-grid" role="radiogroup" aria-label="Report type">
        {REPORT_KINDS.map((k) => {
          const active = k.id === kindId;
          return (
            <button
              key={k.id}
              type="button"
              role="radio"
              aria-checked={active}
              className={`card clickable report-kind${active ? " selected" : ""}`}
              onClick={() => setKindId(k.id)}
            >
              <span className="ico">
                <Icon name={k.icon} size={22} />
              </span>
              <div className="t">{k.name}</div>
              <div className="d">{k.desc}</div>
            </button>
          );
        })}
      </div>

      <div className="reports-actions">
        <button type="button" className="btn primary" disabled={busy || rows.length === 0} onClick={generate}>
          {busy ? "Writing report…" : `Generate ${kind.name.toLowerCase()}`}
        </button>
        {busy && <span className="mini-note">The AI is analysing the data — this takes a few seconds.</span>}
        {error && <span className="reports-error">{error}</span>}
        {done && !busy && !error && (
          <span className="reports-done">
            <Icon name="checkCircle" size={15} /> {done} opened in a new tab — print or save it as PDF.
          </span>
        )}
      </div>
      <p className="mini-note" style={{ marginTop: 10 }}>
        Reports are written by the AI marking model chosen on the dashboard and use live figures —
        nothing is stored. If a pop-up blocker stops the tab, allow pop-ups for this site.
      </p>
    </>
  );
}
