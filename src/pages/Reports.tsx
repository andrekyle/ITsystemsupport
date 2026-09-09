import { useEffect, useMemo, useRef, useState } from "react";
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
  type ReportKind,
  type ReportScope,
} from "../lib/reports";

const ERROR_TEXT: Record<string, string> = {
  not_configured: "The AI service is not configured on this deployment (missing API key).",
  network: "Could not reach the AI service — check your connection and try again.",
  timeout: "The AI took too long to answer. Try again in a moment.",
};

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

/** Seamlessly looping neon signal waves — a miniature flowing-lines screen shown while thinking. */
export function NeonWaves() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;
    let raf = 0;

    // wave bundles — all time terms use integer multiples of θ so the loop is perfectly seamless
    const groups = [
      { y: 0.5,  amps: [0.17, 0.09], freq: [1.5, 3.1], spd: [2, -1], lines: 7, gap: 2.0, stops: ["#22d3ee", "#3b82f6", "#8b5cf6"], alpha: 0.9,  pulse: 2, ph: 0 },
      { y: 0.46, amps: [0.2, 0.08],  freq: [1.1, 2.4], spd: [-1, 2], lines: 6, gap: 2.2, stops: ["#f0abfc", "#ec4899", "#ff2d78"], alpha: 0.75, pulse: 1, ph: 2.1 },
      { y: 0.56, amps: [0.14, 0.07], freq: [2.0, 3.6], spd: [1, 1],  lines: 5, gap: 1.8, stops: ["#2dd4bf", "#22d3ee", "#60a5fa"], alpha: 0.65, pulse: 2, ph: 4.2 },
    ].map((g) => ({ ...g, grad: null as CanvasGradient | null }));

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas!.width = Math.round(W * dpr);
      canvas!.height = Math.round(H * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const g of groups) {
        const grad = ctx!.createLinearGradient(0, 0, W, 0);
        grad.addColorStop(0, g.stops[0]);
        grad.addColorStop(0.5, g.stops[1]);
        grad.addColorStop(1, g.stops[2]);
        g.grad = grad;
      }
    }
    resize();
    window.addEventListener("resize", resize);

    const TWO_PI = Math.PI * 2;
    const LOOP_MS = 5200;
    const start = performance.now();

    function draw(now: number) {
      const th = (((now - start) % LOOP_MS) / LOOP_MS) * TWO_PI;
      ctx!.clearRect(0, 0, W, H);
      ctx!.globalCompositeOperation = "lighter";
      ctx!.lineCap = "round";

      for (const g of groups) {
        const glow = 0.72 + 0.28 * Math.sin(g.pulse * th + g.ph); // soft neon pulse
        const mid = (g.lines - 1) / 2;
        ctx!.strokeStyle = g.grad!;
        for (let i = 0; i < g.lines; i++) {
          const edge = Math.abs(i - mid) / (mid || 1); // 0 centre → 1 outer line
          ctx!.globalAlpha = g.alpha * glow * (1 - 0.55 * edge);
          ctx!.lineWidth = i === Math.round(mid) ? 1 : 0.55;
          ctx!.beginPath();
          for (let x = -3; x <= W + 3; x += 3) {
            const u = (x / W) * TWO_PI;
            // bundle gently pinches and fans out along its length
            const spread = 0.55 + 0.45 * Math.sin(u * 1.3 + g.spd[0] * th + g.ph + 1);
            const y =
              g.y * H +
              (i - mid) * g.gap * spread +
              H * g.amps[0] * Math.sin(u * g.freq[0] + g.spd[0] * th + g.ph) +
              H * g.amps[1] * Math.sin(u * g.freq[1] + g.spd[1] * th + g.ph * 2);
            if (x <= 0) ctx!.moveTo(x, y);
            else ctx!.lineTo(x, y);
          }
          ctx!.stroke();
          // wide faint pass over the centre line makes the brightest strand bloom
          if (i === Math.round(mid)) {
            ctx!.globalAlpha = g.alpha * glow * 0.3;
            ctx!.lineWidth = 3;
            ctx!.stroke();
          }
        }
      }

      // tiny gold particles drifting and twinkling — positions derive from the index, motion from θ
      for (let i = 0; i < 6; i++) {
        const x0 = (((i * 97) % 101) / 101) * W;
        const y0 = (0.22 + ((i * 53) % 56) / 100) * H;
        const x = x0 + 6 * Math.sin(th + i * 1.9);
        const y = y0 + 3 * Math.sin(2 * th + i * 2.6);
        const tw = 0.5 + 0.5 * Math.sin(2 * th + i * 1.7);
        const r = 0.7 + ((i * 29) % 13) / 16;
        ctx!.globalAlpha = 0.1 + 0.5 * tw;
        ctx!.fillStyle = "#ffb85c";
        ctx!.beginPath();
        ctx!.arc(x, y, r * 2.4, 0, TWO_PI);
        ctx!.fill();
        ctx!.globalAlpha = 0.25 + 0.65 * tw;
        ctx!.fillStyle = "#ffd9a0";
        ctx!.beginPath();
        ctx!.arc(x, y, r, 0, TWO_PI);
        ctx!.fill();
      }

      ctx!.globalAlpha = 1;
      ctx!.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="ai-wavescreen" aria-hidden="true" />;
}

export function ReportsPage({ profile }: { profile: Profile }) {
  const firstName = profile.name.trim().split(/\s+/)[0] || profile.name;
  const registers = attendanceFilledRegisterDates().length;
  const [cloud, setCloud] = useState<CloudLearnerData | null>(null);
  const [question, setQuestion] = useState("");
  const [scope, setScope] = useState<ReportScope>("worked");
  const [wantReport, setWantReport] = useState(false);
  const [busy, setBusy] = useState<"kind" | "ask" | null>(null);
  const [msgs, setMsgs] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [genKind, setGenKind] = useState<ReportKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [phase, setPhase] = useState(0);
  const endRef = useRef<HTMLDivElement | null>(null);

  const phases = (GEN_PHASES[genKind?.id ?? ""] ?? GEN_PHASES.progress)(firstName);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, busy]);

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
    const makingReport = source === "kind" || wantReport;
    const history = msgs.slice(-12);
    if (source === "ask" && q) {
      setMsgs((m) => [...m, { role: "user", text: q }]);
      setQuestion("");
    }
    setGenKind(k);
    setBusy(source);
    setError(null);
    setDone(null);
    const result = await requestReport(
      k,
      buildReportData(k.id, rows, registers, scope),
      q,
      makingReport ? "report" : "answer",
      history
    );
    // hold the report overlay a little longer so its narration can be read
    if (makingReport) await new Promise((r) => setTimeout(r, 5000));
    setBusy(null);
    if (!result.ok) {
      if (result.error === "offtopic" || result.error === "direct") {
        setMsgs((m) => [
          ...m,
          {
            role: "assistant",
            text:
              result.answer ||
              "I can only answer questions about the programme and its learners — no report was written.",
          },
        ]);
      } else {
        setError(ERROR_TEXT[result.error] ?? `The AI could not write the report (${result.error}).`);
      }
      return;
    }
    if (source === "ask") {
      setMsgs((m) => [
        ...m,
        { role: "assistant", text: `Your ${k.name.toLowerCase()} has opened in a new tab — print or save it as PDF.` },
      ]);
    } else {
      setDone(k.name);
    }
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

  const composer = (
    <div className="reports-gpt-pill">
      <span className="reports-gpt-plus" aria-hidden="true">
        <Icon name="plus" size={21} />
      </span>
      <textarea
        rows={1}
        value={question}
        placeholder="Ask anything"
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
        role="switch"
        aria-checked={wantReport}
        className={`reports-inst${wantReport ? " on" : ""}`}
        onClick={() => setWantReport((v) => !v)}
        title="Answer: your question gets a short reply right here. Report: the AI writes a full print-ready report document."
      >
        {wantReport ? "Report" : "Answer"}
        <Icon name="chevronDown" size={15} />
      </button>
      <button
        type="button"
        className="reports-gpt-send"
        disabled={!!busy || rows.length === 0}
        onClick={() => {
          if (question.trim()) void generate(CUSTOM_KIND, question, "ask");
        }}
        title="Ask the AI"
        aria-label="Ask the AI"
      >
        <Icon name={question.trim() ? "arrowUp" : "wave"} size={21} strokeWidth={2.1} />
      </button>
    </div>
  );

  return (
    <>
      {busy && (busy === "kind" || wantReport) && (
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
          <Icon name="robot" size={20} />
        </span>
        AI Assistant
      </h2>

      {msgs.length > 0 ? (
        <div className="reports-chat">
          <div className="chat-scroll">
            {msgs.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="chat-user">
                  {m.text}
                </div>
              ) : (
                <p key={i} className="chat-answer" role="status">
                  {m.text}
                </p>
              )
            )}
            {busy === "ask" && !wantReport && <NeonWaves />}
            {status}
            <div ref={endRef} />
          </div>
          <div className="chat-composer">
            <p className="chat-note">
              The AI can make mistakes — it answers only from your live programme data.
            </p>
            {composer}
          </div>
        </div>
      ) : (
        <div className="reports-hero">
          <h1 className="reports-hero-title">{`How can I help, ${firstName}?`}</h1>

          {composer}

          {!question.trim() && (
            <div className="reports-list">
              {REPORT_KINDS.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  className="reports-list-btn"
                  disabled={!!busy || rows.length === 0}
                  title={k.desc}
                  onClick={() => generate(k, undefined, "kind")}
                >
                  <Icon name={k.icon} size={18} />
                  {k.name}
                </button>
              ))}
              <button
                type="button"
                className="reports-list-btn"
                role="switch"
                aria-checked={scope === "all"}
                title="Click to switch which units reports and answers cover"
                onClick={() => setScope((s) => (s === "worked" ? "all" : "worked"))}
              >
                <Icon name="target" size={18} />
                <span>Scope: {scope === "worked" ? "units we've worked on" : "whole programme"}</span>
              </button>
            </div>
          )}

          {status}

          {!question.trim() && (
            <p className="mini-note reports-hero-note">
              Written from live data — {rows.length} learner{rows.length === 1 ? "" : "s"},{" "}
              {registers} attendance register{registers === 1 ? "" : "s"} — by the AI model chosen
              on the dashboard. Reports open print-ready in a new tab; nothing is stored.
            </p>
          )}
        </div>
      )}
    </>
  );
}
