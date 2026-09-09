import { useEffect, useMemo, useState } from "react";
import { Icon } from "../icons";
import type { Profile } from "../types";
import { loadProfiles } from "../store";
import { attendanceFilledRegisterDates } from "../lib/gamification";
import { autoGrowTextarea } from "../lib/autoGrow";
import {
  dedupeProfiles,
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
  workedUnitCodes,
  type ReportKind,
  type ReportScope,
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

/** Overlay narration per report kind — spoken to the user by name. */
const GEN_PHASES: Record<string, (n: string) => string[]> = {
  progress: (n) => [
    `Pulling every learner's completion for you, ${n}…`,
    "Averaging quiz and exercise scores…",
    "Comparing units done across the cohort…",
    `Writing up the progress story, ${n}…`,
    `Almost there — formatting your progress report…`,
  ],
  attendance: (n) => [
    `Opening the attendance registers for you, ${n}…`,
    "Counting who signed on each session day…",
    "Working out each learner's attendance rate…",
    `Noting the patterns worth flagging, ${n}…`,
    `Almost there — formatting your attendance report…`,
  ],
  risk: (n) => [
    `Scanning the cohort for warning signs, ${n}…`,
    "Cross-checking completion, attendance and quiz scores…",
    "Listing who needs support — and why…",
    "Drafting practical interventions…",
    `Almost there, ${n} — formatting the at-risk report…`,
  ],
  outcomes: (n) => [
    `Fetching the assessor decisions for you, ${n}…`,
    "Tallying Competent and Not-yet-competent per unit…",
    "Checking progress towards certification…",
    `Writing the outcomes summary, ${n}…`,
    `Almost there — formatting your outcomes report…`,
  ],
  tracker: (n) => [
    `Building the tracker grid for you, ${n}…`,
    "Filling in each unit's submission status…",
    "Ticking off the attendance columns…",
    "Writing a comment for every learner…",
    `Almost there, ${n} — laying out your tracker…`,
  ],
  executive: (n) => [
    `Gathering the headline numbers for you, ${n}…`,
    "Picking out the wins and the risks…",
    "Summarising it for management…",
    `Almost there, ${n} — formatting your executive summary…`,
  ],
  custom: (n) => [
    `Reading your question, ${n}…`,
    "Pulling the data that answers it…",
    "Working out the answer…",
    `Writing your report around the answer, ${n}…`,
    `Almost there — formatting your document…`,
  ],
};

export function ReportsPage({ profile }: { profile: Profile }) {
  const firstName = profile.name.trim().split(/\s+/)[0] || profile.name;
  const registers = attendanceFilledRegisterDates().length;
  const [cloud, setCloud] = useState<CloudLearnerData | null>(null);
  const [question, setQuestion] = useState("");
  const [scope, setScope] = useState<ReportScope>("worked");
  const [busy, setBusy] = useState<"kind" | "ask" | null>(null);
  const [genKind, setGenKind] = useState<ReportKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [phase, setPhase] = useState(0);

  const phases = (GEN_PHASES[genKind?.id ?? ""] ?? GEN_PHASES.progress)(firstName);

  useEffect(() => {
    if (!busy) return;
    setPhase(0);
    const t = setInterval(() => setPhase((p) => (p + 1) % phases.length), 2000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy]);

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
    const all = dedupeProfiles([
      ...localLearners.map((p) => mergeProfileWithCloud(p, cloud)),
      ...remote,
    ]);
    return all.map((p) => analyse(p, cloud));
  }, [registers, cloud]);

  async function generate(k: ReportKind, q: string | undefined, source: "kind" | "ask") {
    if (busy) return;
    setGenKind(k);
    setBusy(source);
    setError(null);
    setDone(null);
    const result = await requestReport(k, buildReportData(k.id, rows, registers, scope), q);
    // hold the overlay a little longer so its narration can be read
    await new Promise((r) => setTimeout(r, 5000));
    setBusy(null);
    if (!result.ok) {
      setError(
        result.error === "offtopic"
          ? `That isn't a question about the programme, so no report was written.${result.answer ? ` Quick answer: ${result.answer}` : ""}`
          : ERROR_TEXT[result.error] ?? `The AI could not write the report (${result.error}).`
      );
      return;
    }
    setDone(k.name);
    openReportDocument(k, result.report, rows, registers, profile, q, scope);
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
      {busy && (
        <div className="reports-genwrap" role="status" aria-live="polite">
          <div className="reports-gen">
            <div className="reports-orb">
              <span className="lf-ring r1" />
              <span className="lf-ring r2" />
              <span className="lf-ring r3" />
              <span className="lf-orbit o1" />
              <span className="lf-orbit o2" />
              <span className="lf-orbit o3" />
              <span className="orb-core">
                <Icon name="document" size={36} />
              </span>
            </div>
            <div className="reports-gen-title">{`On it, ${firstName} — writing your ${(genKind ?? REPORT_KINDS[0]).name.toLowerCase()}`}</div>
            <div className="reports-gen-sub">{phases[phase % phases.length]}</div>
          </div>
        </div>
      )}
      <h2 className="section-title">
        <span className="ico">
          <Icon name="document" size={20} />
        </span>
        AI Reports
        <span className="token-super-pill" title="Visible only to the super user">
          Super user
        </span>
      </h2>

      <div className="reports-hero">
        <h1 className="reports-hero-title">What report do you need today?</h1>

        <div className="reports-gpt-pill">
          <span className="reports-gpt-plus" aria-hidden="true">
            <Icon name="document" size={20} />
          </span>
          <textarea
            rows={1}
            value={question}
            placeholder="Ask for any report"
            onChange={(e) => setQuestion(e.target.value)}
            onInput={(e) => autoGrowTextarea(e.currentTarget, 140)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (question.trim() && !busy && rows.length > 0)
                  void generate(CUSTOM_KIND, question, "ask");
              }
            }}
          />
          <button
            type="button"
            className="reports-gpt-send"
            disabled={!!busy || rows.length === 0 || !question.trim()}
            onClick={() => generate(CUSTOM_KIND, question, "ask")}
            title="Ask the AI"
            aria-label="Ask the AI"
          >
            <Icon name="arrowUp" size={21} strokeWidth={2.1} />
          </button>
        </div>

        <div className="reports-scope" role="radiogroup" aria-label="Report scope">
          <button
            type="button"
            role="radio"
            aria-checked={scope === "worked"}
            className={`reports-scope-btn${scope === "worked" ? " on" : ""}`}
            onClick={() => setScope("worked")}
          >
            Units we've worked on ({workedUnitCodes(rows).size})
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={scope === "all"}
            className={`reports-scope-btn${scope === "all" ? " on" : ""}`}
            onClick={() => setScope("all")}
          >
            Whole programme
          </button>
        </div>

        <div className="reports-suggestions">
          {REPORT_KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              className="reports-suggestion"
              disabled={!!busy || rows.length === 0}
              title={k.desc}
              onClick={() => generate(k, undefined, "kind")}
            >
              <Icon name={k.icon} size={16} />
              {k.name}
            </button>
          ))}
        </div>

        <div className="reports-hints">
          {EXAMPLE_QUESTIONS.map((q) => (
            <button key={q} type="button" className="reports-hint" onClick={() => setQuestion(q)}>
              {q}
            </button>
          ))}
        </div>

        {status}

        <p className="mini-note reports-hero-note">
          Written from live data — {rows.length} learner{rows.length === 1 ? "" : "s"},{" "}
          {registers} attendance register{registers === 1 ? "" : "s"} — by the AI model chosen on
          the dashboard. Reports open print-ready in a new tab; nothing is stored.
        </p>
      </div>
    </>
  );
}
