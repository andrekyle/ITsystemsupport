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
  CUSTOM_KIND,
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

const EXAMPLE_QUESTIONS = [
  "Which learners need extra support before the next session, and with what?",
  "How is the cohort performing on quizzes compared to attendance?",
  "Write a monthly progress update I can send to the employer.",
];

export function ReportsPage({ profile }: { profile: Profile }) {
  const registers = attendanceRegisterCount();
  const [cloud, setCloud] = useState<CloudLearnerData | null>(null);
  const [kindId, setKindId] = useState<string>(REPORT_KINDS[0].id);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState<"kind" | "ask" | null>(null);
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

  async function generate(k: ReportKind, q: string | undefined, source: "kind" | "ask") {
    if (busy) return;
    setBusy(source);
    setError(null);
    setDone(null);
    const result = await requestReport(k, buildReportData(k.id, rows, registers), q);
    setBusy(null);
    if (!result.ok) {
      setError(ERROR_TEXT[result.error] ?? `The AI could not write the report (${result.error}).`);
      return;
    }
    setDone(k.name);
    openReportDocument(k, result.report, rows, registers, profile, q);
  }

  const status = (
    <>
      {error && (
        <span className="reports-error">
          <Icon name="info" size={15} /> {error}
        </span>
      )}
      {done && !busy && !error && (
        <span className="reports-done">
          <Icon name="checkCircle" size={15} /> {done} opened in a new tab — print or save it as
          PDF.
        </span>
      )}
    </>
  );

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
      <p className="muted" style={{ marginTop: -6, marginBottom: 18, fontSize: 15.5 }}>
        The AI writes professional, print-ready reports from live platform data — {rows.length}{" "}
        learner{rows.length === 1 ? "" : "s"}, {registers} attendance register
        {registers === 1 ? "" : "s"} on record. Documents open in the onboarding-pack style with a
        data appendix.
      </p>

      {/* ——— ask your own question ——— */}
      <div className="card reports-ask">
        <div className="reports-ask-head">
          <span className="reports-ask-ico">
            <Icon name="chat" size={20} />
          </span>
          <div>
            <div className="reports-ask-title">Ask for any report</div>
            <div className="reports-ask-sub">
              Describe what you want to know — the AI answers with a full report grounded in the
              cohort's data.
            </div>
          </div>
        </div>
        <textarea
          className="reports-q"
          rows={3}
          value={question}
          placeholder={`e.g. ${EXAMPLE_QUESTIONS[0]}`}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <div className="reports-ask-foot">
          <div className="reports-examples">
            {EXAMPLE_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                className="reports-example"
                onClick={() => setQuestion(q)}
              >
                {q}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn solid"
            disabled={!!busy || rows.length === 0 || !question.trim()}
            onClick={() => generate(CUSTOM_KIND, question, "ask")}
          >
            {busy === "ask" ? "Writing report…" : "Ask the AI"}
          </button>
        </div>
      </div>

      {/* ——— ready-made reports ——— */}
      <div className="task-label reports-divider">Or pick a ready-made report</div>
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
              <span className="report-kind-ico">
                <Icon name={k.icon} size={20} />
              </span>
              {active && (
                <span className="report-kind-check">
                  <Icon name="checkCircle" size={18} />
                </span>
              )}
              <div className="t">{k.name}</div>
              <div className="d">{k.desc}</div>
            </button>
          );
        })}
      </div>

      <div className="reports-actions">
        <button
          type="button"
          className="btn solid"
          disabled={!!busy || rows.length === 0}
          onClick={() => generate(kind, undefined, "kind")}
        >
          {busy === "kind" ? "Writing report…" : `Generate ${kind.name.toLowerCase()}`}
        </button>
        {busy && (
          <span className="mini-note">The AI is analysing the data — this takes a few seconds.</span>
        )}
        {status}
      </div>
      <p className="mini-note" style={{ marginTop: 12 }}>
        Reports are written by the AI marking model chosen on the dashboard and use live figures —
        nothing is stored. If a pop-up blocker stops the tab, allow pop-ups for this site.
      </p>
    </>
  );
}
