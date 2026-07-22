import { useEffect, useRef, useState } from "react";
import React from "react";
import { Icon } from "../icons";
import type { ExerciseCheck, PoeDoc, ProgressState, Profile, Role, Route, UnitActivity, UnitStandard } from "../types";
import { UNIT_ACTIVITIES, isStaff } from "../types";
import { COURSE_META, MODULES, MODULE_FLOW, PROGRAMME_ABOUT, PROGRAMME_PURPOSE, TOTAL_UNITS, WHAT_YOULL_LEARN, findModule, findUnit } from "../data/course";
import { GLOSSARY, getContent } from "../data/content";
import { moduleCompletion, unitCompletion, unitStatus, useNotes, usePlanSlides, useSharedSettings } from "../store";
import { Bar } from "../components/Ring";
import { Quiz } from "../components/Quiz";
import { Logbook } from "../components/Logbook";
import { SlideViewer } from "../components/SlideViewer";
import { fileToImageDataUrl } from "../components/Avatar";
import { downloadDoc, getFileUrl, uploadFile } from "../lib/files";

const GLOSS_RE = new RegExp(`\\b(${Object.keys(GLOSSARY).join("|")})\\b`, "gi");

/** Renders text with an explanatory bubble on any glossary term. */
export function Gloss({ text }: { text: string }) {
  const parts = text.split(GLOSS_RE);
  const place = (e: React.SyntheticEvent<HTMLSpanElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const half = 170; // half bubble width + margin
    const x = Math.min(Math.max(r.left + r.width / 2, half), window.innerWidth - half);
    const below = r.top < 300;
    el.dataset.pos = below ? "below" : "above";
    el.style.setProperty("--bx", `${x}px`);
    el.style.setProperty("--by", below ? `${r.bottom + 10}px` : `${r.top - 10}px`);
  };
  return (
    <>
      {parts.map((part, i) => {
        const entry = GLOSSARY[part.toLowerCase()];
        if (!entry) return part;
        return (
          <span
            className="term"
            tabIndex={0}
            key={i}
            onMouseEnter={place}
            onFocus={place}
          >
            {part}
            <span className="bubble" role="tooltip">
              <strong>{part}</strong>
              {entry.def}
              {entry.link && (
                <a
                  className="bubble-link"
                  href={entry.link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {entry.link.label} ↗
                </a>
              )}
            </span>
          </span>
        );
      })}
    </>
  );
}

/** Lesson bullet: bolds the lead-in term of "Term — description" bullets. */
function LessonBullet({ text }: { text: string }) {
  const m = text.match(/^(.{2,60}?) — (.*)$/s);
  if (!m) return <Gloss text={text} />;
  return (
    <>
      <strong>{m[1]}</strong> — <Gloss text={m[2]} />
    </>
  );
}

/** Model-answer bullet: bolds a short "Label:" lead-in when present. */
function AnswerBullet({ text }: { text: string }) {
  const m = text.match(/^([^:]{2,40}):\s(.*)$/s);
  if (!m) return <Gloss text={text} />;
  return (
    <>
      <strong>{m[1]}:</strong> <Gloss text={m[2]} />
    </>
  );
}

/** Table inside a model-answer block, with an optional caption line. */
function ModelAnswerTable({
  table,
}: {
  table: { headers: string[]; rows: string[][]; caption?: string };
}) {
  return (
    <>
      <table className="data card-table" style={{ marginTop: 10 }}>
        <thead>
          <tr>
            {table.headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {table.caption && (
        <p className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>
          {table.caption}
        </p>
      )}
    </>
  );
}

/**
 * Worked-example line. Lines shaped "LABEL — body" (model reports) render as a
 * Word-style document: centred title page, bold headings, plain indented lines
 * (no bullet markers in front of numbered points).
 */
const DOC_LINE_RE = /^((?:\d+\. )?[A-Z][A-Za-z0-9 &/'-]{2,}?) — (.*)$/s;

function titleCase(s: string) {
  return s.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

function ExampleLine({ text }: { text: string }) {
  const m = text.match(DOC_LINE_RE);
  if (!m)
    return (
      <p className="lesson-p">
        <AnswerBullet text={text} />
      </p>
    );
  const label = m[1];
  const rest = m[2];

  if (label.startsWith("TITLE PAGE")) {
    const parts = rest.split(" · ");
    const title = parts[0].replace(/^'/, "").replace(/'$/, "");
    return (
      <div className="ex-cover">
        <div className="ex-cover-title">{title}</div>
        <div className="ex-cover-meta">
          {parts.slice(1).map((p) => {
            const clean = p.replace(/\.$/, "");
            const mm = clean.match(/^([^:]+):\s*(.*)$/s) ?? clean.match(/^(Version)\s+(.*)$/);
            const k = mm ? mm[1] : "";
            const v = mm ? mm[2] : clean;
            return (
              <React.Fragment key={p}>
                <span className="k">{k}</span>
                <span className="c">:</span>
                <span className="v">{v}</span>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }

  if (label.startsWith("SIGNED")) {
    return <p className="ex-signed">Signed — {rest}</p>;
  }

  const subs = rest.split(/ (?=\d+\.\d+ )/);
  let items: string[] | null = rest.includes(" · ")
    ? rest.split(" · ")
    : subs.length > 1
      ? subs
      : null;
  if (!items) {
    const intro = rest.split(/ (?=(?:Purpose|Scope|Method): )/);
    if (intro.length > 1) items = intro;
  }
  return (
    <div className="ex-sec">
      <div className="ex-label">{titleCase(label)}</div>
      {items ? (
        items.map((it, i) => {
          const clean = it.replace(/\s*·\s*$/, "");
          const sm = clean.match(/^(\d+\.\d+)\s+(.*)$/s);
          return sm ? (
            <p key={i} className="ex-line hang">
              <span className="num">{sm[1]}</span>
              <span>
                <AnswerBullet text={sm[2]} />
              </span>
            </p>
          ) : (
            <p key={i} className="ex-line">
              <AnswerBullet text={clean} />
            </p>
          );
        })
      ) : (
        <p className="ex-line">
          <Gloss text={rest} />
        </p>
      )}
    </div>
  );
}

/** Exercise step: hangs wrapped text after the "Label:" colon. */
function StepText({ text }: { text: string }) {
  const m = text.match(/^([^:]{2,28}):\s(.*)$/s);
  if (!m) return <Gloss text={text} />;
  const items = m[2].split(" · ");
  return (
    <span className="step-flex">
      <span className="step-label">{m[1]}:</span>
      {items.length > 2 ? (
        <span className="step-stack">
          {items.map((it, i) => (
            <span key={i}>{it.replace(/\.$/, "")}</span>
          ))}
        </span>
      ) : (
        <span className="step-body">
          <Gloss text={m[2]} />
        </span>
      )}
    </span>
  );
}

/* ---------- typed exercise answers with semantic checking ---------- */

/** Tokenize free text into lowercase word stems so different word forms still match. */
function answerTokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[^a-z']+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      let x = w.replace(/'.*$/, "");
      x = x.replace(/ies$/, "y");
      if (x.length > 4) x = x.replace(/(ations|ation|ings|ing|ed|es|s|ly)$/, "");
      return x;
    });
}

/** Optimal-string-alignment edit distance, capped early — tolerates small typos. */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) d[i][0] = i;
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1); // transposition ("commuincate")
      }
    }
  }
  return d[a.length][b.length];
}

/** Two stems match when equal, one is a prefix of the other (≥4 chars),
 *  or they differ only by a small typo (≥6 chars: 1 edit; ≥9 chars: 2 edits). */
function tokenMatches(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a))) return true;
  const min = Math.min(a.length, b.length);
  if (min >= 6) {
    const maxD = min >= 9 ? 2 : 1;
    if (editDistance(a, b, maxD) <= maxD) return true;
  }
  return false;
}

/** A concept phrase matches when every word of the phrase appears in the answer. */
function phraseMatches(phrase: string, tokens: string[]): boolean {
  return answerTokens(phrase).every((pw) => tokens.some((t) => tokenMatches(t, pw)));
}

/** Score a learner's answer against the concept groups of the answer key.
 *  Each key idea (concept group) is worth 2 marks. */
function scoreAnswer(text: string, check: ExerciseCheck) {
  const tokens = answerTokens(text);
  const matched = check.concepts.filter((g) => g.some((p) => phraseMatches(p, tokens))).length;
  const need = check.min ?? Math.ceil(check.concepts.length / 2);
  const short = tokens.length < 8;
  return {
    ok: !short && matched >= need,
    matched,
    need,
    short,
    marks: matched * 2,
    maxMarks: check.concepts.length * 2,
  };
}

/* ---- marker feedback: explains WHY a key idea's marks were not awarded ---- */

const STOP_WORDS = new Set(
  "the a an and or but of to in on for with is are was were be been being it its this that these those you your yours we our ours they their them theirs he she his her him i me my mine as at by from not no nor do does did done don doesn didn have has had having will would shall should can could may might must when while if then than so too also there here where what which who whom whose why how all each every both few many more most other others some such any only own same very just like unto up down out off about into onto over under again further once".split(
    " "
  )
);

/** Salient (non-stopword) stems of a piece of text. */
function contentStems(s: string): Set<string> {
  return new Set(answerTokens(s).filter((t) => t.length > 2 && !STOP_WORDS.has(t)));
}

interface IdeaFeedback {
  /** short name of the key idea */
  label: string;
  awarded: boolean;
  /** the lesson line that carries this idea */
  lessonLine?: string;
  /** the learner's sentence that came closest to the idea (only when not awarded) */
  closest?: string;
  /** example phrases that would have earned the idea */
  examples: string[];
}

/** Explain, per key idea, whether its 2 marks were awarded — and if not, why:
 *  quotes the lesson's point, finds the learner's semantically closest sentence
 *  (stem-overlap similarity) and shows what was missing. Runs fully in the
 *  browser — no API or key needed. */
function explainCheck(text: string, check: ExerciseCheck): IdeaFeedback[] {
  const tokens = answerTokens(text);
  const sentences = (text.match(/[^.!?;\n]+[.!?;\n]*/g) ?? [text])
    .map((s) => s.trim())
    .filter(Boolean);
  // sentences that already earned ticks for other ideas are never quoted as "wrong"
  const creditedGroups = check.concepts.filter((g) => g.some((p) => phraseMatches(p, tokens)));
  const ticksPer = attributeTicks(sentences, creditedGroups);
  const candidates = sentences.filter((_, si) => ticksPer[si] === 0);
  return check.concepts.map((g, gi) => {
    const awarded = g.some((p) => phraseMatches(p, tokens));
    const label = check.labels?.[gi] ?? g[0];
    const lessonLine = check.answer.find((a) => {
      const at = answerTokens(a);
      return g.some((p) => phraseMatches(p, at));
    });
    let closest: string | undefined;
    if (!awarded && candidates.length) {
      const target = contentStems(`${lessonLine ?? ""} ${g.join(" ")}`);
      let best = 0;
      for (const s of candidates) {
        const st = contentStems(s);
        if (!st.size || !target.size) continue;
        let overlap = 0;
        st.forEach((t) => {
          for (const tt of target) {
            if (tokenMatches(t, tt)) {
              overlap++;
              break;
            }
          }
        });
        const sim = overlap / Math.min(st.size, target.size);
        if (sim > best) {
          best = sim;
          closest = s;
        }
      }
      if (best < 0.2) closest = undefined;
    }
    return { label, awarded, lessonLine, closest, examples: g.slice(0, 2) };
  });
}

/** Two green ticks — shown after a correct answer (each point is worth 2 marks). */
function DoubleTick() {
  return (
    <span className="exq-ticks" title="2 marks">
      <Icon name="check" size={15} />
      <Icon name="check" size={15} />
    </span>
  );
}

/** Attribute each credited concept group to the first segment that expresses it;
 *  returns, per segment, the indices of the groups it earned. */
function attributeGroups(segments: string[], credited: string[][]): number[][] {
  const used = new Set<number>();
  return segments.map((seg) => {
    const segTokens = answerTokens(seg);
    const earned: number[] = [];
    credited.forEach((g, gi) => {
      if (used.has(gi)) return;
      if (g.some((p) => phraseMatches(p, segTokens))) {
        used.add(gi);
        earned.push(gi);
      }
    });
    return earned;
  });
}

/** Number of 2-mark ticks earned by each sentence. */
function attributeTicks(sentences: string[], credited: string[][]): number[] {
  return attributeGroups(sentences, credited).map((g) => g.length);
}

/** The learner's own answer rendered with two green ticks inserted after each
 *  part of the text that earned a key idea's 2 marks. */
function MarkedAnswer({ text, check, ok }: { text: string; check: ExerciseCheck; ok: boolean }) {
  const fullTokens = answerTokens(text);
  // only concept groups the whole answer earned can be credited to a segment
  const credited = check.concepts.filter((g) => g.some((p) => phraseMatches(p, fullTokens)));
  const segments = (text.match(/[^.!?;\n]+[.!?;\n]*\s*/g) ?? [text]).filter((s) => s.trim());
  const perSeg = attributeGroups(segments, credited);
  const leftover = credited.length - perSeg.reduce((t, g) => t + g.length, 0);
  return (
    <div className={`exq-marked${ok ? " ok" : ""}`}>
      {segments.map((seg, i) => {
        const gis = perSeg[i];
        if (gis.length > 1) {
          // the sentence earned several ideas — place each pair after the clause that expressed it
          const clauses = (seg.match(/[^,]+,?\s*/g) ?? [seg]).filter((c) => c.trim());
          const groupsHere = gis.map((gi) => credited[gi]);
          const perClause = attributeGroups(clauses, groupsHere);
          const rest = groupsHere.length - perClause.reduce((t, g) => t + g.length, 0);
          return (
            <span key={i}>
              {clauses.map((c, ci) => (
                <span key={ci}>
                  {c}
                  {perClause[ci].map((_, t) => (
                    <DoubleTick key={t} />
                  ))}
                </span>
              ))}
              {Array.from({ length: rest }).map((_, t) => (
                <DoubleTick key={`r${t}`} />
              ))}
            </span>
          );
        }
        return (
          <span key={i}>
            {seg}
            {gis.map((_, t) => (
              <DoubleTick key={t} />
            ))}
            {gis.length === 0 && contentStems(seg).size > 0 && (
              <span className="exq-x" title="No marks for this sentence">
                ✗
              </span>
            )}
          </span>
        );
      })}
      {Array.from({ length: leftover }).map((_, t) => (
        <DoubleTick key={`l${t}`} />
      ))}
    </div>
  );
}

/** Typed answer block under an exercise question: the learner's answer is checked
 *  semantically against key ideas from the lesson; the correct answer is revealed
 *  only once the learner's own answer covers enough of those ideas. */
function ExerciseQuestion({
  check,
  saved,
  savedOk,
  onSave,
  canReveal,
}: {
  check: ExerciseCheck;
  saved: string;
  savedOk: boolean;
  onSave: (text: string, ok: boolean) => void;
  /** super user only — allows revealing the answer without a correct attempt */
  canReveal?: boolean;
}) {
  const [val, setVal] = useState(saved);
  const [result, setResult] = useState<ReturnType<typeof scoreAnswer> | null>(null);
  const [revealed, setRevealed] = useState(false);
  const ok = savedOk || (result?.ok ?? false);
  const feedback = ok || result ? explainCheck(val, check) : null;
  const missed = feedback?.filter((f) => !f.awarded) ?? [];

  return (
    <div className="exq">
      {ok || result ? (
        <MarkedAnswer text={val} check={check} ok={ok} />
      ) : (
        <textarea
          className="exq-input"
          rows={3}
          placeholder="Type your answer here, then check it…"
          value={val}
          onChange={(e) => {
            setVal(e.target.value);
            if (result) setResult(null);
          }}
          onBlur={() => {
            if (!ok) onSave(val, false);
          }}
        />
      )}
      {!ok && (
        <div className="exq-check">
          {result ? (
            <button className="btn ghost" onClick={() => setResult(null)}>
              <Icon name="design" size={15} />
              Edit my answer
            </button>
          ) : (
            <button
              className="btn"
              onClick={() => {
                const r = scoreAnswer(val, check);
                setResult(r);
                onSave(val, r.ok);
              }}
            >
              <Icon name="checkCircle" size={15} />
              Check my answer
            </button>
          )}
          {canReveal && (
            <button className="btn ghost" onClick={() => setRevealed((r) => !r)}>
              <Icon name={revealed ? "eyeOff" : "eye"} size={15} />
              {revealed ? "Hide answer" : "Show answer — super user"}
            </button>
          )}
          {result && !result.ok && (
            <span className="exq-status wrong">
              {result.short
                ? "Answer more fully, then check again."
                : `Not quite yet — your answer covers ${result.matched} of ${check.concepts.length} key ideas (${result.marks}/${result.maxMarks} marks, 2 marks per point). Revisit the lesson and try again.`}
            </span>
          )}
        </div>
      )}
      {ok && (
        <div className="exq-status ok">
          <Icon name="checkCircle" size={15} />
          Correct — {scoreAnswer(val, check).marks} of {scoreAnswer(val, check).maxMarks} marks (2
          marks per point).
          <DoubleTick />
        </div>
      )}
      {feedback && missed.length > 0 && (
        <div className="exq-feedback">
          <div className="exq-answer-title">
            <Icon name="info" size={14} />
            Marker's feedback — why marks were not awarded
          </div>
          {missed.map((f) => (
            <div className="exq-miss" key={f.label}>
              <div className="exq-miss-head">
                <span className="exq-cross">✗</span>
                {f.label} — 2 marks not awarded
              </div>
              <p className="exq-miss-p">
                {f.closest ? (
                  <>
                    Your sentence “{f.closest}” was not awarded these marks — it says something
                    different and does not express “{f.label.toLowerCase()}”.
                  </>
                ) : (
                  <>Nothing in your answer speaks to this point, so its 2 marks could not be awarded.</>
                )}
              </p>
            </div>
          ))}
        </div>
      )}
      {(ok || revealed) && (
        <div className="exq-answer">
          <div className="exq-answer-title">
            <Icon name="book" size={14} />
            Correct answer — from the lesson
          </div>
          <ul className="duty-list">
            {check.answer.map((a) => (
              <li key={a}>
                <span className="ico">
                  <Icon name="checkCircle" size={16} />
                </span>
                <span>
                  <AnswerBullet text={a} />
                  {ok && <DoubleTick />}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ---------- unit availability: learners see a unit only from its start day, 08:30 ---------- */

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/** First session date from a unit's dates string (e.g. "24, 31 Jul 2026"), at 08:30. */
export function unitUnlockTime(u: UnitStandard): Date | null {
  const day = u.dates.match(/\b(\d{1,2})\b/);
  const mon = u.dates.match(/jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i);
  const yr = u.dates.match(/\b(20\d{2})\b/);
  if (!day || !mon || !yr) return null;
  return new Date(Number(yr[1]), MONTHS[mon[0].toLowerCase()], Number(day[1]), 8, 30, 0, 0);
}

/** Learners may only open a unit from its first session day at 08:30; staff always can. */
function unitLocked(u: UnitStandard, role: Role): boolean {
  if (isStaff(role)) return false;
  const t = unitUnlockTime(u);
  return !!t && Date.now() < t.getTime();
}

function fmtUnlock(t: Date): string {
  return `${t.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}, 08:30`;
}

const ACTIVITY_INFO: Record<UnitActivity, { icon: string; desc: string }> = {
  "Lesson & Training Aids": {
    icon: "presenter",
    desc: "Facilitated session with lesson plan and training aids aligned to the QCTO-approved curriculum.",
  },
  "Formative Assessment": {
    icon: "clipboard",
    desc: "Formative assessment conducted to monitor progress. Records submitted within 5 working days.",
  },
  "Summative Assessment": {
    icon: "certificate",
    desc: "Summative assessment in line with the Assessment Specifications Document (ASD).",
  },
  "POE Evidence": {
    icon: "folder",
    desc: "Workplace evidence gathered and filed in the Portfolio of Evidence for competency demonstration.",
  },
};

export function CoursePage({
  progress,
  navigate,
}: {
  progress: ProgressState;
  navigate: (r: Route) => void;
}) {
  return (
    <>
      <div className="eyebrow">
        <Icon name="book" size={15} />
        Course
      </div>
      <h1 className="page-title">{COURSE_META.title}</h1>
      <p className="page-sub">
        A QCTO/SETA-aligned qualification covering business practice, client-server networking,
        network architecture, LAN design, server administration and database access.
      </p>
      <div className="meta-row">
        <a
          className="pill"
          href={`https://allqs.saqa.org.za/showQualification.php?id=${COURSE_META.saqaId}`}
          target="_blank"
          rel="noopener noreferrer"
          title="View the registered qualification on SAQA"
        >
          <span className="ico">
            <Icon name="certificate" size={15} />
          </span>
          SAQA ID {COURSE_META.saqaId}
        </a>
        <span className="pill">
          <span className="ico">
            <Icon name="trend" size={15} />
          </span>
          NQF Level {COURSE_META.nqfLevel}
        </span>
        <span className="pill">
          <span className="ico">
            <Icon name="award" size={15} />
          </span>
          {COURSE_META.credits} Credits
        </span>
        <span className="pill">
          <span className="ico">
            <Icon name="book" size={15} />
          </span>
          {MODULES.length} Modules · {TOTAL_UNITS} Unit Standards
        </span>
        <span className="pill">
          <span className="ico">
            <Icon name="clock" size={15} />
          </span>
          {COURSE_META.time}
        </span>
        <span className="pill">
          <span className="ico">
            <Icon name="shield" size={15} />
          </span>
          <Gloss text={COURSE_META.qualityAssurance} />
        </span>
      </div>

      <h2 className="section-title">
        <span className="ico">
          <Icon name="dashboard" size={20} />
        </span>
        Modules
      </h2>
      <div className="card-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
        {MODULES.map((m, i) => {
          const c = moduleCompletion(progress, m.id);
          const credits = m.units.reduce((n, u) => n + u.credits, 0);
          return (
            <button
              key={m.id}
              className="card clickable module-card"
              onClick={() => navigate({ page: "module", moduleId: m.id })}
            >
              <div className="head">
                <span className="ico">
                  <Icon name={m.icon} size={22} />
                </span>
                <div>
                  <h3>
                    Module {i + 1}: {m.name}
                  </h3>
                </div>
              </div>
              <span className="sub module-sub">
                {m.units.length} unit standards · {credits} credits · {m.activities} activities
              </span>
              <div className="bar-row">
                <Bar value={c} green={c === 1} />
                <span className="pct">{Math.round(c * 100)}%</span>
              </div>
            </button>
          );
        })}
      </div>

      <h2 className="section-title">
        <span className="ico">
          <Icon name="target" size={20} />
        </span>
        How each module works
      </h2>
      <div className="card about-card">
        <div className="flow-steps">
          {MODULE_FLOW.steps.map((s, i) => (
            <div className="flow-step" key={s.name}>
              <span className={`num${i === MODULE_FLOW.steps.length - 1 ? " last" : ""}`}>
                {i + 1}
              </span>
              <span className="nm">{s.name}</span>
              <span className="ds">
                <Gloss text={s.desc} />
              </span>
            </div>
          ))}
        </div>
        <div className="flow-after">
          <Icon name="award" size={22} />
          <span>
            After all six modules: <strong>Remedials</strong> (if needed) →{" "}
            <strong>
              <Gloss text="FISA" />
            </strong>{" "}
            → <strong>Logbook sign-off</strong> → Certification ({COURSE_META.credits} credits)
          </span>
        </div>
      </div>

      <h2 className="section-title">
        <span className="ico">
          <Icon name="info" size={20} />
        </span>
        About this programme
      </h2>
      <div className="card about-card">
        <p className="about-intro">{PROGRAMME_ABOUT.intro}</p>
        <p className="lesson-p">{PROGRAMME_ABOUT.lead}</p>
        <div className="about-grid">
          {PROGRAMME_ABOUT.outcomes.map((o) => (
            <div className="about-item" key={o.text}>
              <Icon name={o.icon} size={22} />
              <span>{o.text}</span>
            </div>
          ))}
        </div>
        <a
          className="about-link"
          href={PROGRAMME_ABOUT.saqaLink.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {PROGRAMME_ABOUT.saqaLink.label} ↗
        </a>
      </div>

      <h2 className="section-title">
        <span className="ico">
          <Icon name="certificate" size={20} />
        </span>
        Purpose and rationale of the qualification
      </h2>
      <div className="card about-card">
        <p className="about-intro">{PROGRAMME_PURPOSE.intro}</p>

        <div className="about-label">Your qualification pathway</div>
        <div className="path-row">
          {PROGRAMME_PURPOSE.pathway.map((p, i) => (
            <React.Fragment key={p.title}>
              {i > 0 && (
                <span className="path-arrow">
                  <Icon name="chevronRight" size={18} />
                </span>
              )}
              <div className={`path-card${p.current ? " current" : ""}`}>
                <Icon name={p.icon} size={26} />
                <div className="t">{p.title}</div>
                <div className="d">
                  <Gloss text={p.desc} />
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
        <p className="lesson-p">{PROGRAMME_PURPOSE.pathwayNote}</p>

        <div className="about-label">The qualification is designed to</div>
        <div className="about-grid four">
          {PROGRAMME_PURPOSE.designedTo.map((o) => (
            <div className="about-item" key={o.text}>
              <Icon name={o.icon} size={22} />
              <span>
                <Gloss text={o.text} />
              </span>
            </div>
          ))}
        </div>

        <div className="about-label">To qualify, you must demonstrate competence in 13 areas</div>
        <div className="about-grid">
          {PROGRAMME_PURPOSE.competencies.map((o) => (
            <div className="about-item" key={o.text}>
              <Icon name={o.icon} size={22} />
              <span>{o.text}</span>
            </div>
          ))}
        </div>
        <p className="lesson-p">
          <strong>NB:</strong> <Gloss text={PROGRAMME_PURPOSE.nb} />
        </p>

        <div className="about-label">Rationale</div>
        <p className="lesson-p" style={{ marginBottom: 2 }}>
          <span className="rationale-p">
            <Gloss text={PROGRAMME_PURPOSE.rationaleLead} />
          </span>{" "}
          <Gloss text={PROGRAMME_PURPOSE.rationale} />
        </p>
      </div>

      <h2 className="section-title">
        <span className="ico">
          <Icon name="book" size={20} />
        </span>
        What you'll learn
      </h2>
      <div className="about-grid four" style={{ maxWidth: 1200 }}>
        {WHAT_YOULL_LEARN.areas.map((a) => (
          <div className="about-item" key={a.text}>
            <Icon name={a.icon} size={22} />
            <span className="area-body">
              <span className="area-t">{a.text}</span>
              <span className="area-d">{a.desc}</span>
            </span>
          </div>
        ))}
      </div>
      <div className="fact-grid">
        {WHAT_YOULL_LEARN.facts.map((f) => (
          <div className="fact-card" key={f.label}>
            <Icon name={f.icon} size={28} />
            <div className="lbl">{f.label}</div>
            {f.value && <div className="val">{f.value}</div>}
            {f.detail && <div className="det">{f.detail}</div>}
            {f.pills && (
              <div className="fact-pills">
                {f.pills.map((p) => (
                  <span className="fact-pill" key={p}>
                    {p}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export function ModulePage({
  moduleId,
  profile,
  progress,
  navigate,
}: {
  moduleId: string;
  profile: Profile;
  progress: ProgressState;
  navigate: (r: Route) => void;
}) {
  const mod = findModule(moduleId);
  if (!mod) return <p>Module not found.</p>;
  const idx = MODULES.indexOf(mod);
  const credits = mod.units.reduce((n, u) => n + u.credits, 0);
  const c = moduleCompletion(progress, mod.id);

  return (
    <>
      <div className="crumbs">
        <button onClick={() => navigate({ page: "course" })}>My Course</button>
        <Icon name="chevronRight" size={13} />
        <span>Module {idx + 1}</span>
      </div>
      <div className="eyebrow">
        <Icon name={mod.icon} size={15} />
        Module {idx + 1} of {MODULES.length}
      </div>
      <h1 className="page-title">{mod.name}</h1>
      <div className="meta-row">
        <span className="pill">
          <span className="ico">
            <Icon name="book" size={15} />
          </span>
          {mod.units.length} unit standards
        </span>
        <span className="pill">
          <span className="ico">
            <Icon name="award" size={15} />
          </span>
          {credits} credits
        </span>
        <span className="pill">
          <span className="ico">
            <Icon name="exercise" size={15} />
          </span>
          {mod.activities} activities
        </span>
        <span className="pill">
          <span className="ico">
            <Icon name="target" size={15} />
          </span>
          {Math.round(c * 100)}% complete
        </span>
      </div>
      <div style={{ margin: "16px 0 26px", maxWidth: 560 }}>
        <Bar value={c} green={c === 1} />
      </div>

      {mod.units.map((u) => {
        const st = unitStatus(progress, u.us);
        const uc = unitCompletion(progress, u.us);
        const locked = unitLocked(u, profile.role);
        const unlockAt = unitUnlockTime(u);
        return (
          <button
            key={u.us}
            className={`unit-row${locked ? " locked" : ""}`}
            disabled={locked}
            onClick={() => !locked && navigate({ page: "unit", moduleId: mod.id, unitId: u.us })}
          >
            <span
              className={`status ${st === "completed" ? "done" : st === "in-progress" ? "progress" : "none"}`}
            >
              <Icon
                name={locked ? "lock" : st === "completed" ? "checkCircle" : st === "in-progress" ? "halfCircle" : "circle"}
                size={22}
              />
            </span>
            <span className="main">
              <span className="t">
                US {u.us} — {u.title}
              </span>
              <span className="m">
                <span>
                  <Icon name="trend" size={13} /> NQF {u.nqf}
                </span>
                <span>
                  <Icon name="award" size={13} /> {u.credits} credits
                </span>
                <span>
                  <Icon name="calendar" size={13} /> {u.dates}
                </span>
                <span>
                  <Icon name="clock" size={13} /> {u.time}
                </span>
                {locked && unlockAt && (
                  <span className="unlock-note">
                    <Icon name="lock" size={13} /> Available {fmtUnlock(unlockAt)}
                  </span>
                )}
                {uc > 0 && uc < 1 && (
                  <span>
                    <Icon name="target" size={13} /> {Math.round(uc * 100)}%
                  </span>
                )}
              </span>
            </span>
            <span className="chev">
              <Icon name={locked ? "lock" : "chevronRight"} size={17} />
            </span>
          </button>
        );
      })}
    </>
  );
}

const MAX_SLIDE_MB = 10;

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type UnitTab = "overview" | "lesson" | "material" | "notes" | "exercises" | "assignments" | "quiz" | "plan";

const UNIT_TAB_KEY = "itss.unittab";
const UNIT_TAB_US_KEY = "itss.unittab.us";
const UNIT_TABS: UnitTab[] = ["overview", "lesson", "material", "notes", "exercises", "assignments", "quiz", "plan"];

/** Restore the saved tab only for the same unit standard — opening another US always starts on Overview. */
function loadUnitTab(unitId: string): UnitTab {
  const savedFor = localStorage.getItem(UNIT_TAB_US_KEY);
  const saved = localStorage.getItem(UNIT_TAB_KEY) as UnitTab | null;
  return savedFor === unitId && saved && UNIT_TABS.includes(saved) ? saved : "overview";
}

export function UnitPage({
  unitId,
  profile,
  progress,
  toggleActivity,
  saveQuizResult,
  setLogbookField,
  saveExerciseResult,
  navigate,
}: {
  unitId: string;
  profile: Profile;
  progress: ProgressState;
  toggleActivity: (us: string, a: UnitActivity) => void;
  saveQuizResult: (us: string, score: number, total: number) => void;
  setLogbookField: (us: string, key: string, value: string | boolean) => void;
  saveExerciseResult: (us: string, exId: string, score: number, total: number) => void;
  navigate: (r: Route) => void;
}) {
  const [tab, setTab] = useState<UnitTab>(() => loadUnitTab(unitId));
  const [noteId, setNoteId] = useState<string | null>(null);
  /** bumped per exercise on "Try again" so the answer blocks remount empty */
  const [exReset, setExReset] = useState<Record<string, number>>({});

  // switching to a different unit standard always lands on its Overview tab
  useEffect(() => {
    setTab(loadUnitTab(unitId));
  }, [unitId]);

  useEffect(() => {
    localStorage.setItem(UNIT_TAB_KEY, tab);
    localStorage.setItem(UNIT_TAB_US_KEY, unitId);
  }, [tab, unitId]);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const dragIdRef = useRef<string | null>(null);
  const [editNoteId, setEditNoteId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const noteFileRef = useRef<HTMLInputElement>(null);
  const { notes: userNotes, sharedNotes, addNote, addSharedNote, removeNote, removeSharedNote, renameNote, renameSharedNote, order, setNoteOrder, titleOverrides, setTitleOverride } = useNotes(profile.id);
  const planFileRef = useRef<HTMLInputElement>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [planUploadPct, setPlanUploadPct] = useState<number | null>(null);
  const { slides: planSlides, addSlide: addPlanSlide, removeSlide: removePlanSlide } = usePlanSlides(unitId);
  const [deckId, setDeckId] = useState<string | null>(null);
  const found = findUnit(unitId);
  if (!found) return <p>Unit standard not found.</p>;
  const { module: mod, unit: u } = found;
  const idx = MODULES.indexOf(mod);
  const uc = unitCompletion(progress, u.us);
  const acts = progress.units[u.us]?.activities ?? {};
  const content = getContent(u.us);
  const quizResult = progress.units[u.us]?.quiz;
  const isPrivileged = isStaff(profile.role);
  const isSuperUser = profile.role === "Super User";
  const [sharedSettings, updateSharedSettings] = useSharedSettings();
  // shared/staff-uploaded content may only be downloaded by the super user,
  // unless the super user has explicitly allowed it for everyone
  const canDownloadShared = isSuperUser || sharedSettings.allowSharedDownloads;

  const decks = planSlides
    .filter((s) => /\.pdf$/i.test(s.name) || s.type.includes("pdf"))
    .map((s) => ({
      id: `upload-${s.uploadedAt}-${s.name}`,
      name: s.name.replace(/\.pdf$/i, ""),
      doc: s,
    }));
  const activeDeck = decks.find((d) => d.id === deckId) ?? decks[0];
  const [deckUrl, setDeckUrl] = useState<string | null>(null);
  const activeDeckId = activeDeck?.id;
  useEffect(() => {
    let cancelled = false;
    setDeckUrl(null);
    const doc = activeDeck?.doc;
    if (doc) {
      void getFileUrl(doc).then((url) => {
        if (!cancelled) setDeckUrl(url);
      });
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDeckId]);

  // learners may only open a unit from its start day at 08:30
  if (unitLocked(u, profile.role)) {
    const unlockAt = unitUnlockTime(u);
    return (
      <>
        <div className="crumbs">
          <button onClick={() => navigate({ page: "course" })}>My Course</button>
          <Icon name="chevronRight" size={13} />
          <button onClick={() => navigate({ page: "module", moduleId: mod.id })}>
            Module {idx + 1}: {mod.name}
          </button>
          <Icon name="chevronRight" size={13} />
          <span>US {u.us}</span>
        </div>
        <h1 className="page-title" style={{ marginTop: 14 }}>
          {u.title}
        </h1>
        <div className="unit-locked-card">
          <span className="ico">
            <Icon name="lock" size={28} />
          </span>
          <span>
            This unit standard opens on <strong>{unlockAt ? fmtUnlock(unlockAt) : "its session day at 08:30"}</strong>.
            Its lesson, exercises and materials become available then — see the Training Calendar
            for your full schedule.
          </span>
        </div>
      </>
    );
  }

  async function onPickPlanFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPlanError(null);
    if (!/\.pdf$/i.test(file.name) && !file.type.includes("pdf")) {
      setPlanError("Please upload a PDF — in PowerPoint use File › Save As › PDF, then upload that file. It will display exactly as designed.");
      return;
    }
    if (file.size > MAX_SLIDE_MB * 1024 * 1024) {
      setPlanError(`"${file.name}" is too large — files must be ${MAX_SLIDE_MB} MB or smaller.`);
      return;
    }
    setPlanUploadPct(0);
    try {
      const doc: PoeDoc = await uploadFile(`shared/planslides/${u.us}`, file, setPlanUploadPct);
      if (!addPlanSlide(doc)) {
        setPlanError("Storage is full — remove some uploaded files and try again.");
      }
    } catch {
      setPlanError("The file could not be uploaded — check your connection and try again.");
    }
    setPlanUploadPct(null);
  }

  const tabs: { id: UnitTab; label: string; icon: string; show: boolean }[] = [
    { id: "overview", label: "Overview", icon: "dashboard", show: true },
    { id: "lesson", label: "Lesson", icon: "book", show: !!content?.lesson.length },
    { id: "material", label: "Course material", icon: "play", show: decks.length > 0 },
    { id: "notes", label: "Notes", icon: "document", show: !!content?.notes?.length || Object.values(userNotes).some((n) => n.us === unitId) || !!content?.lesson.length },
    { id: "exercises", label: "Exercises", icon: "exercise", show: !!content?.exercises.length },
    { id: "assignments", label: "Assignments", icon: "folder", show: !!content?.assignments.length },
    { id: "quiz", label: "Quiz", icon: "clipboard", show: !!content?.quiz.length },
    { id: "plan", label: "Lesson plan", icon: "presenter", show: !!content?.lessonPlan && isPrivileged },
  ];

  return (
    <>
      <div className="crumbs">
        <button onClick={() => navigate({ page: "course" })}>My Course</button>
        <Icon name="chevronRight" size={13} />
        <button onClick={() => navigate({ page: "module", moduleId: mod.id })}>
          Module {idx + 1}: {mod.name}
        </button>
        <Icon name="chevronRight" size={13} />
        <span>US {u.us}</span>
      </div>

      <div className="eyebrow eyebrow-lg">
        <Icon name="document" size={22} />
        Unit standard {u.us}
      </div>
      <h1 className="page-title">{u.title}</h1>
      <div className="meta-row">
        <span className="pill">
          <span className="ico">
            <Icon name="trend" size={15} />
          </span>
          NQF Level {u.nqf}
        </span>
        <span className="pill">
          <span className="ico">
            <Icon name="award" size={15} />
          </span>
          {u.credits} credits
        </span>
        <span className="pill">
          <span className="ico">
            <Icon name="calendar" size={15} />
          </span>
          {u.dates}
        </span>
        <span className="pill">
          <span className="ico">
            <Icon name="clock" size={15} />
          </span>
          {u.time}
        </span>
      </div>

      <div style={{ margin: "16px 0 6px", maxWidth: 560 }}>
        <div className="bar-row">
          <Bar value={uc} green={uc === 1} />
          <span className="pct">{Math.round(uc * 100)}%</span>
        </div>
      </div>

      <div className="tabs" role="tablist">
        {tabs
          .filter((t) => t.show)
          .map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={`tab${tab === t.id ? " active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              <Icon name={t.icon} size={16} />
              {t.label}
              {t.id === "quiz" && quizResult && (
                <span className="tab-badge">
                  {Math.round((quizResult.best / quizResult.total) * 100)}%
                </span>
              )}
            </button>
          ))}
      </div>

      {tab === "overview" && (
        <>
          <h2 className="section-title">
            <span className="ico">
              <Icon name="checklist" size={20} />
            </span>
            Learning activities
          </h2>
          <p className="muted" style={{ marginTop: -6, marginBottom: 14 }}>
            Mark each stage as it is completed. Progress is saved to your profile.
          </p>
          {UNIT_ACTIVITIES.map((a) => {
            const done = !!acts[a];
            const info = ACTIVITY_INFO[a];
            return (
              <button
                key={a}
                className={`activity${done ? " done" : ""}`}
                onClick={() => toggleActivity(u.us, a)}
                aria-pressed={done}
              >
                <span className="box">
                  <Icon name={done ? "checkCircle" : "circle"} size={22} />
                </span>
                <span style={{ flex: 1 }}>
                  <span className="t">{a}</span>
                  <br />
                  <span className="d">
                    <Gloss text={info.desc} />
                  </span>
                </span>
                <Icon name={info.icon} size={20} color="var(--azure)" />
              </button>
            );
          })}

          {content && (
            <div className="callout">
              <span className="ico">
                <Icon name="book" size={19} />
              </span>
              <span>
                This unit standard has full learning material: a {content.lesson.length}-section
                lesson, {content.exercises.length} exercises, {content.assignments.length}{" "}
                assignments and a {content.quiz.length}-question knowledge check. Use the tabs above
                to work through it.
              </span>
            </div>
          )}

          {content?.saqa && (
            <>
              <h2 className="section-title">
                <span className="ico">
                  <Icon name="certificate" size={20} />
                </span>
                SAQA registered unit standard details
              </h2>
              <div className="callout" style={{ marginTop: 0 }}>
                <span className="ico">
                  <Icon name="info" size={19} />
                </span>
                <span>{content.saqa.notice}</span>
              </div>

              <details className="saqa-details">
                <summary>
                  <Icon name="document" size={17} />
                  Registration details
                  <span className="chev">
                    <Icon name="chevronDown" size={15} />
                  </span>
                </summary>
                <table className="data kv">
                  <tbody>
                    {content.saqa.registration.map((r) => (
                      <tr key={r.label}>
                        <td className="k">{r.label}</td>
                        <td>
                          <Gloss text={r.value} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>

              {content.saqa.sections.map((sec) => (
                <details className="saqa-details" key={sec.heading}>
                  <summary>
                    <Icon name={sec.icon} size={17} />
                    {sec.heading}
                    <span className="chev">
                      <Icon name="chevronDown" size={15} />
                    </span>
                  </summary>
                  <div className="saqa-body">
                    {sec.paragraphs?.map((p, i) => (
                      <p key={i} className="lesson-p">
                        {p}
                      </p>
                    ))}
                    {sec.bullets && (
                      <ul className="duty-list">
                        {sec.bullets.map((b) => (
                          <li key={b}>
                            <span className="ico">
                              <Icon name="chevronRight" size={14} />
                            </span>
                            <span>
                              <LessonBullet text={b} />
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {sec.table && (
                      <table className="data" style={{ marginTop: 10 }}>
                        <thead>
                          <tr>
                            {sec.table.headers.map((h) => (
                              <th key={h}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sec.table.rows.map((row, ri) => (
                            <tr key={ri}>
                              {row.map((cell, ci) => (
                                <td key={ci}>{ci <= 1 ? <strong>{cell}</strong> : cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </details>
              ))}
            </>
          )}

          <div className="callout">
            <span className="ico">
              <Icon name="info" size={19} />
            </span>
            <span>
              <Gloss text="Assessments for this unit standard are conducted in line with QCTO, SETA and institutional requirements, and must be valid, reliable, fair and aligned with the OCD and ASD for SAQA ID 48573. Constructive feedback is provided after each assessment." />
            </span>
          </div>
        </>
      )}

      {tab === "lesson" && content && (
        <>
          <div style={{ marginTop: 18 }} />
          {content.lesson.map((sec, si) => {
            const body = (
              <div className="saqa-body lesson-section">
                {sec.paragraphs.map((p, i) => (
                  <p key={i} className="lesson-p">
                    <Gloss text={p} />
                  </p>
                ))}
                {sec.bullets && (
                  <ul className="duty-list">
                    {sec.bullets.map((b) => (
                      <li key={b}>
                        <span className="ico">
                          <Icon name="chevronRight" size={14} />
                        </span>
                        <span>
                          <LessonBullet text={b} />
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {sec.table && (
                  <table className="data lesson-table" style={{ marginTop: 10 }}>
                    <thead>
                      <tr>
                        {sec.table.headers.map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sec.table.rows.map((row, ri) => {
                        const so = /^SO\b/.test(row[0]);
                        return (
                          <tr key={ri} className={so ? "so-row" : sec.table!.rows.some((r) => /^SO\b/.test(r[0])) ? "ac-row" : undefined}>
                            {row.map((cell, ci) => (
                              <td key={ci}>
                                {ci === 0 || so ? <strong>{cell}</strong> : <Gloss text={cell} />}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
                {sec.cards && (
                  <div className="card-grid lesson-cards">
                    {sec.cards.map((c) => (
                      <div className="card lesson-card" key={c.title}>
                        <span className="ico">
                          <Icon name={c.icon} size={22} />
                        </span>
                        <div className="t">{c.title}</div>
                        <div className="d">
                          <Gloss text={c.text} />
                        </div>
                        {c.table && (
                          <table className="data card-table">
                            <thead>
                              <tr>
                                {c.table.headers.map((h) => (
                                  <th key={h}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {c.table.rows.map((row, ri) => (
                                <tr key={ri}>
                                  {row.map((cell, ci) => (
                                    <td key={ci}>{cell}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {sec.example && (
                  <div className="lesson-example">
                    <div className="ex-title">
                      <Icon name="info" size={15} />
                      {sec.example.title}
                    </div>
                    {sec.example.lines.map((l, i) => (
                      <ExampleLine key={i} text={l} />
                    ))}
                  </div>
                )}
                {sec.modelAnswer && isPrivileged && (
                  <details className="saqa-details lesson-acc model-answer">
                    <summary>
                      <Icon name="shield" size={17} />
                      Model answers — staff only
                      <span className="chev">
                        <Icon name="chevronDown" size={15} />
                      </span>
                    </summary>
                    <div className="saqa-body ma-body">
                      {sec.modelAnswer.map((blk, bi) => (
                        <div className="ma-block" key={bi}>
                          {blk.heading && <div className="ma-heading">{blk.heading}</div>}
                          {blk.paragraphs?.map((p, pi) => (
                            <p
                              key={pi}
                              className={`lesson-p${p.startsWith("\"") ? " ma-quote" : ""}`}
                            >
                              {p}
                            </p>
                          ))}
                          {blk.table && <ModelAnswerTable table={blk.table} />}
                          {blk.bullets && (
                            <ul className="duty-list">
                              {blk.bullets.map((b) => (
                                <li key={b}>
                                  <span className="ico">
                                    <Icon name="checkCircle" size={16} />
                                  </span>
                                  <span>
                                    <AnswerBullet text={b} />
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            );
            if (sec.flat)
              return (
                <div key={sec.heading} className="lesson-flat">
                  <h2 className="section-title">
                    <span className="ico">
                      <Icon name={sec.icon} size={20} />
                    </span>
                    {sec.heading}
                  </h2>
                  {body}
                </div>
              );
            return (
              <details key={sec.heading} className="saqa-details lesson-acc">
                <summary>
                  <Icon name={sec.icon} size={17} />
                  {sec.heading}
                  <span className="chev">
                    <Icon name="chevronDown" size={15} />
                  </span>
                </summary>
                {body}
              </details>
            );
          })}
          <div className="callout">
            <span className="ico">
              <Icon name="checkCircle" size={19} />
            </span>
            <span>
              Finished the lesson? Mark <strong>Lesson & Training Aids</strong> as complete on the
              Overview tab, then work through the Exercises.
            </span>
          </div>
        </>
      )}

      {tab === "notes" && (
        <>
          <div style={{ marginTop: 18 }} />
          {(() => {
            const builtIn = content?.notes ?? [];
            const shared = Object.entries(sharedNotes)
              .filter(([, n]) => n.us === u.us)
              .sort((a, b) => a[1].uploadedAt.localeCompare(b[1].uploadedAt));
            const mine = Object.entries(userNotes)
              .filter(([, n]) => n.us === u.us)
              .sort((a, b) => a[1].uploadedAt.localeCompare(b[1].uploadedAt));
            const all = [
              ...builtIn.map((n) => ({ id: n.id, title: titleOverrides[n.id] ?? n.title, image: n.image, caption: n.caption, mine: false, shared: false, date: undefined as string | undefined })),
              ...shared.map(([id, n]) => ({ id, title: n.title, image: n.image, caption: undefined as string | undefined, mine: false, shared: true, date: n.uploadedAt })),
              ...mine.map(([id, n]) => ({ id, title: n.title, image: n.image, caption: undefined as string | undefined, mine: true, shared: false, date: n.uploadedAt })),
            ];
            // apply saved order; unknown ids keep insertion order at the end
            const savedOrder = order[u.us] ?? [];
            all.sort((a, b) => {
              const ia = savedOrder.indexOf(a.id);
              const ib = savedOrder.indexOf(b.id);
              if (ia === -1 && ib === -1) return 0;
              if (ia === -1) return 1;
              if (ib === -1) return -1;
              return ia - ib;
            });
            const active = all.find((n) => n.id === noteId) ?? all[0];
            const reorder = (targetId: string) => {
              const dragging = dragIdRef.current;
              if (!dragging || dragging === targetId) return;
              const ids = all.map((n) => n.id);
              const from = ids.indexOf(dragging);
              const to = ids.indexOf(targetId);
              if (from === -1 || to === -1) return;
              ids.splice(to, 0, ids.splice(from, 1)[0]);
              setNoteOrder(u.us, ids);
            };
            return (
              <div className="notes-layout">
                <div className="notes-list">
                  <button className="btn ghost notes-upload" onClick={() => noteFileRef.current?.click()}>
                    <Icon name="download" size={15} style={{ transform: "rotate(180deg)" }} />
                    Upload note
                  </button>
                  <input
                    ref={noteFileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (!file) return;
                      setNoteError(null);
                      try {
                        const image = await fileToImageDataUrl(file);
                        const id = `un_${Date.now().toString(36)}`;
                        const title = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
                        const note = {
                          us: u.us,
                          title,
                          image,
                          uploadedAt: new Date().toISOString(),
                        };
                        const ok = isPrivileged ? addSharedNote(id, note) : addNote(id, note);
                        if (ok) {
                          setNoteId(id);
                        } else {
                          setNoteError("Storage is full — remove some notes and try again.");
                        }
                      } catch {
                        setNoteError("That file could not be read as an image.");
                      }
                    }}
                  />
                  {noteError && <div className="notes-error">{noteError}</div>}
                  {all.length === 0 && (
                    <div className="muted" style={{ padding: "8px 4px" }}>
                      No notes yet — upload an image to get started.
                    </div>
                  )}
                  {all.map((n) => (
                    <div
                      key={n.id}
                      className={`notes-item${n.id === active?.id ? " active" : ""}${n.id === dragId ? " dragging" : ""}`}
                      draggable
                      onDragStart={(e) => {
                        dragIdRef.current = n.id;
                        setDragId(n.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        reorder(n.id);
                      }}
                      onDragEnd={() => {
                        dragIdRef.current = null;
                        setDragId(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        dragIdRef.current = null;
                        setDragId(null);
                      }}
                    >
                      <span className="notes-grip" title="Drag to reorder">
                        <Icon name="menu" size={13} />
                      </span>
                      {editNoteId === n.id ? (
                        <input
                          className="notes-rename"
                          value={editTitle}
                          autoFocus
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              if (editTitle.trim()) {
                                if (n.mine) renameNote(n.id, editTitle.trim());
                                else if (n.shared) renameSharedNote(n.id, editTitle.trim());
                                else setTitleOverride(n.id, editTitle.trim());
                              }
                              setEditNoteId(null);
                            }
                            if (e.key === "Escape") setEditNoteId(null);
                          }}
                          onBlur={() => {
                            if (editTitle.trim()) {
                              if (n.mine) renameNote(n.id, editTitle.trim());
                              else if (n.shared) renameSharedNote(n.id, editTitle.trim());
                              else setTitleOverride(n.id, editTitle.trim());
                            }
                            setEditNoteId(null);
                          }}
                        />
                      ) : (
                        <button className="notes-select" onClick={() => setNoteId(n.id)}>
                          <span className="nt">{n.title}</span>
                          {n.shared && (
                            <span className="nd">
                              Shared by facilitator
                              {n.date &&
                                ` · ${new Date(n.date).toLocaleDateString(undefined, {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}`}
                            </span>
                          )}
                          {!n.shared && n.date && (
                            <span className="nd">
                              Added{" "}
                              {new Date(n.date).toLocaleDateString(undefined, {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          )}
                          {!n.shared && !n.date && <span className="nd">Course material</span>}
                        </button>
                      )}
                      {editNoteId !== n.id && (n.mine || !n.shared || isPrivileged) && (
                        <span className="notes-actions">
                          {(n.mine || (n.shared ? isPrivileged : true)) && (
                            <button
                              className="notes-action"
                              title="Rename note"
                              onClick={() => {
                                setEditNoteId(n.id);
                                setEditTitle(n.title);
                              }}
                            >
                              <Icon name="design" size={14} />
                            </button>
                          )}
                          {(n.mine || (n.shared && isPrivileged)) && (
                            <button
                              className="notes-action danger"
                              title="Delete note"
                              onClick={() => {
                                if (n.shared) removeSharedNote(n.id);
                                else removeNote(n.id);
                                if (noteId === n.id) setNoteId(null);
                              }}
                            >
                              ✕
                            </button>
                          )}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                {active && (
                  <div className="notes-viewer card">
                    <img
                      src={active.image}
                      alt={active.title}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                        const next = e.currentTarget.nextElementSibling as HTMLElement | null;
                        if (next) next.style.display = "flex";
                      }}
                    />
                    <div className="notes-missing" style={{ display: "none" }}>
                      <Icon name="document" size={28} />
                      <span>
                        Image not found — place the file at <code>public{active.image}</code>
                      </span>
                    </div>
                    {active.caption && <p className="notes-caption">{active.caption}</p>}
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}

      {tab === "exercises" && content && (
        <>
          <p className="muted" style={{ marginTop: 14 }}>
            Formative classroom/self-study exercises. Keep your written answers — they form part of
            your workplace evidence.
          </p>
          {content.exercises.map((ex) => (
            <details key={ex.id} className="saqa-details lesson-acc">
              <summary>
                <Icon name="exercise" size={17} />
                {ex.title}
                <span className="chev">
                  <Icon name="chevronDown" size={15} />
                </span>
              </summary>
              <div className="saqa-body">
                <p className="lesson-p" style={{ marginTop: 10 }}>
                  <Gloss text={ex.task} />
                </p>
                <ol className="step-list">
                  {ex.steps.map((s, i) => {
                    const check = ex.checks?.[i];
                    const lb = progress.units[u.us]?.logbook ?? {};
                    return (
                      <li key={i}>
                        <StepText text={s} />
                        {check && (
                          <ExerciseQuestion
                            key={`${u.us}.${ex.id}.${i}.${exReset[ex.id] ?? 0}`}
                            check={check}
                            saved={String(lb[`exq.${ex.id}.${i}`] ?? "")}
                            savedOk={lb[`exq.${ex.id}.${i}.ok`] === true}
                            canReveal={isSuperUser}
                            onSave={(text, okNow) => {
                              setLogbookField(u.us, `exq.${ex.id}.${i}`, text);
                              setLogbookField(u.us, `exq.${ex.id}.${i}.ok`, okNow);
                            }}
                          />
                        )}
                      </li>
                    );
                  })}
                </ol>
                {ex.checks && ex.checks.length > 0 && (() => {
                  const checks = ex.checks;
                  const res = progress.units[u.us]?.exercises?.[ex.id];
                  const attempts = res?.attempts ?? 0;
                  const total = checks.reduce((t, c) => t + c.concepts.length * 2, 0);
                  const lb = progress.units[u.us]?.logbook ?? {};
                  return (
                    <div className="exq-submit">
                      {attempts < 2 && (
                        <button
                          className="btn"
                          onClick={() => {
                            const score = checks.reduce(
                              (t, c, i) =>
                                t + scoreAnswer(String(lb[`exq.${ex.id}.${i}`] ?? ""), c).marks,
                              0
                            );
                            saveExerciseResult(u.us, ex.id, score, total);
                          }}
                        >
                          <Icon name="clipboard" size={15} />
                          Submit answers for marking
                        </button>
                      )}
                      {res && attempts < 2 && (
                        <button
                          className="btn ghost"
                          onClick={() => {
                            checks.forEach((_, i) => {
                              setLogbookField(u.us, `exq.${ex.id}.${i}`, "");
                              setLogbookField(u.us, `exq.${ex.id}.${i}.ok`, false);
                            });
                            setExReset((m) => ({ ...m, [ex.id]: (m[ex.id] ?? 0) + 1 }));
                          }}
                        >
                          <Icon name="play" size={15} />
                          Try again
                        </button>
                      )}
                      {res && (
                        <span className="exq-score">
                          <Icon name="award" size={15} />
                          Last attempt: {res.last}/{res.total} · Best out of 2: {res.best}/
                          {res.total} · Attempt {res.attempts} of 2
                          {attempts >= 2 && " — no attempts remaining"}
                        </span>
                      )}
                      {!res && (
                        <span className="exq-score muted-score">
                          Each key idea is worth 2 marks — {total} marks available. Best of 2
                          attempts is recorded on your profile.
                        </span>
                      )}
                    </div>
                  );
                })()}
                {ex.download && (
                  <button
                    className="btn ghost dl-sample"
                    onClick={() => {
                      // \uFEFF BOM so Excel reads the file as UTF-8
                      const blob = new Blob(["\uFEFF" + ex.download!.content], {
                        type: `${ex.download!.mime ?? "text/plain"};charset=utf-8`,
                      });
                      const a = document.createElement("a");
                      a.href = URL.createObjectURL(blob);
                      a.download = ex.download!.filename;
                      a.click();
                      URL.revokeObjectURL(a.href);
                    }}
                  >
                    <Icon name="download" size={15} />
                    {ex.download.label}
                  </button>
                )}
              </div>
            </details>
          ))}

          {isPrivileged && content.exercises.some((ex) => ex.modelAnswer) && (
            <>
              <h2 className="section-title">
                <span className="ico">
                  <Icon name="shield" size={20} />
                </span>
                Model answers
              </h2>
              <p className="muted" style={{ marginTop: -6, marginBottom: 14 }}>
                Visible to facilitators, assessors, moderators and the super user only — do not distribute to learners before
                the exercises are assessed.
              </p>
              {content.exercises
                .filter((ex) => ex.modelAnswer)
                .map((ex) => (
                  <details key={`ma-${ex.id}`} className="saqa-details lesson-acc model-answer">
                    <summary>
                      <Icon name="shield" size={17} />
                      Model answer — {ex.title}
                      <span className="chev">
                        <Icon name="chevronDown" size={15} />
                      </span>
                    </summary>
                    <div className="saqa-body ma-body">
                      {ex.modelAnswer!.map((blk, bi) => (
                        <div className="ma-block" key={bi}>
                          {blk.heading && <div className="ma-heading">{blk.heading}</div>}
                          {blk.paragraphs?.map((p, pi) => (
                            <p
                              key={pi}
                              className={`lesson-p${p.startsWith("\"") ? " ma-quote" : ""}`}
                            >
                              {p}
                            </p>
                          ))}
                          {blk.table && <ModelAnswerTable table={blk.table} />}
                          {blk.bullets && (
                            <ul className="duty-list">
                              {blk.bullets.map((b) => (
                                <li key={b}>
                                  <span className="ico">
                                    <Icon name="checkCircle" size={16} />
                                  </span>
                                  <span>
                                    <AnswerBullet text={b} />
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
            </>
          )}
        </>
      )}

      {tab === "assignments" && content && (
        <>
          <p className="muted" style={{ marginTop: 14 }}>
            Assessed assignments. Submissions are assessed against the ASD for SAQA ID 48573 and
            filed in your Portfolio of Evidence.
          </p>
          {content.assignments.map((as) => (
            <details key={as.id} className="saqa-details lesson-acc">
              <summary>
                <Icon name="folder" size={17} />
                {as.title}
                <span className="chev">
                  <Icon name="chevronDown" size={15} />
                </span>
              </summary>
              <div className="saqa-body">
                <p className="lesson-p" style={{ marginTop: 10 }}>
                  <Gloss text={as.brief} />
                </p>
                <div className="task-label">Requirements</div>
                <ul className="duty-list">
                  {as.requirements.map((r) => (
                    <li key={r}>
                      <span className="ico">
                        <Icon name="checkCircle" size={16} />
                      </span>
                      <span>
                        <Gloss text={r} />
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="task-label">Evidence & submission</div>
                <p className="lesson-p" style={{ marginBottom: 10 }}>
                  <Gloss text={as.evidence} />
                </p>
              </div>
            </details>
          ))}

          {content.logbook && (
            <Logbook
              spec={content.logbook}
              values={progress.units[u.us]?.logbook ?? {}}
              onChange={(key, value) => setLogbookField(u.us, key, value)}
            />
          )}
        </>
      )}

      {tab === "quiz" && content && (
        <>
          <h2 className="section-title">
            <span className="ico">
              <Icon name="clipboard" size={20} />
            </span>
            Knowledge check — {content.quiz.length} questions
          </h2>
          <p className="muted" style={{ marginTop: -6, marginBottom: 16 }}>
            Answer all questions, then submit. Your best score is saved to your profile. 80%+ is
            considered competent.
          </p>
          <Quiz
            questions={content.quiz}
            previous={quizResult}
            onSubmit={(score, total) => saveQuizResult(u.us, score, total)}
          />
        </>
      )}

      {tab === "material" && decks.length > 0 && (
        <>
          <h2 className="section-title">
            <span className="ico">
              <Icon name="play" size={20} />
            </span>
            Course material
          </h2>
          <p className="muted" style={{ marginTop: -6, marginBottom: 14 }}>
            Course material for this unit standard — displayed exactly as designed, like a
            PowerPoint presentation. Use the full screen button for presentation mode.
          </p>
          <div className="deck-chips">
            {decks.map((d) => (
              <button
                key={d.id}
                className={`deck-chip${d.id === activeDeck?.id ? " active" : ""}`}
                onClick={() => setDeckId(d.id)}
              >
                <Icon name="presenter" size={15} />
                <span>{d.name}</span>
              </button>
            ))}
          </div>
          {activeDeck && (
            <>
              {canDownloadShared && (
                <button
                  className="btn ghost dl-sample plan-ppt"
                  onClick={() => void downloadDoc(activeDeck.doc)}
                >
                  <Icon name="download" size={15} />
                  Download this file
                </button>
              )}
              {deckUrl ? (
                <SlideViewer src={deckUrl} allowDownload={canDownloadShared} />
              ) : (
                <p className="muted">Loading course material…</p>
              )}
            </>
          )}
        </>
      )}

      {tab === "plan" && content?.lessonPlan && (
        <>
          <h2 className="section-title">
            <span className="ico">
              <Icon name="presenter" size={20} />
            </span>
            {content.lessonPlan.title}
          </h2>
          <p className="muted" style={{ marginTop: -6, marginBottom: 14 }}>
            Visible to facilitators, assessors, moderators and the super user only — session-by-session facilitation guide
            for this unit standard.
          </p>
          {canDownloadShared && u.us === "8252" && (
            <a
              className="btn ghost dl-sample plan-ppt"
              href="/downloads/US-8252-Compile-and-Produce-Reports-Training.pptx"
              download
            >
              <Icon name="download" size={15} />
              Download training slides (.pptx)
            </a>
          )}
          <button
            className="btn ghost dl-sample plan-ppt"
            style={{ marginLeft: canDownloadShared && u.us === "8252" ? 10 : 0 }}
            onClick={() => planFileRef.current?.click()}
          >
            <Icon name="presenter" size={15} />
            Upload course material (.pdf)
          </button>
          {isSuperUser && (
            <label className="share-dl-toggle">
              <input
                type="checkbox"
                checked={sharedSettings.allowSharedDownloads}
                onChange={(e) => updateSharedSettings({ allowSharedDownloads: e.target.checked })}
              />
              Allow everyone to download shared content
            </label>
          )}
          <input
            ref={planFileRef}
            type="file"
            accept=".pdf,application/pdf"
            style={{ display: "none" }}
            onChange={onPickPlanFile}
          />
          {planUploadPct !== null && (
            <div className="upload-progress plan-upload-progress" role="progressbar" aria-valuenow={planUploadPct}>
              <div className="track">
                <div className="fill" style={{ width: `${planUploadPct}%` }} />
              </div>
              <span className="pct">Uploading… {planUploadPct}%</span>
            </div>
          )}
          {planError && (
            <div className="callout poe-error">
              <span className="ico">
                <Icon name="info" size={19} />
              </span>
              <span>{planError}</span>
            </div>
          )}
          {planSlides.length > 0 && (
            <div className="plan-uploads">
              {planSlides.map((s, i) => (
                <div className="plan-upload-row" key={`${s.name}-${s.uploadedAt}`}>
                  <Icon name="presenter" size={17} />
                  <span className="fileinfo">
                    <span className="poe-file" title={s.name}>
                      {s.name}
                    </span>
                    <span className="meta">
                      {fmtSize(s.size)} ·{" "}
                      {new Date(s.uploadedAt).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </span>
                  {canDownloadShared && (
                    <button className="poe-dl" onClick={() => void downloadDoc(s)} title="Download">
                      <Icon name="download" size={17} />
                    </button>
                  )}
                  <button
                    className="poe-remove"
                    onClick={() => removePlanSlide(i)}
                    title="Remove file"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="card plan-card">
            {content.lessonPlan.details && (
              <div className="plan-meta">
                {content.lessonPlan.details.map((d) => (
                  <div className="plan-meta-item" key={d.label}>
                    <Icon name={d.icon} size={17} />
                    <div>
                      <div className="k">{d.label}</div>
                      <div className="v">{d.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <ul className="duty-list plan-prep">
              {content.lessonPlan.prep.map((p) => (
                <li key={p}>
                  <span className="ico">
                    <Icon name="checkCircle" size={16} />
                  </span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <table className="data plan-table">
              <thead>
                <tr>
                  <th className="plan-time">Time</th>
                  <th>Activity</th>
                  <th className="plan-res">Resources</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const lp = content.lessonPlan!;
                  const [sh, sm] = (lp.startTime ?? "09:00").split(":").map(Number);
                  let clock = sh * 60 + sm;
                  const fmt = (t: number) =>
                    `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
                  return lp.sections.map((sec, si) => {
                    if (sec.startTime) {
                      const [h, m] = sec.startTime.split(":").map(Number);
                      clock = h * 60 + m;
                    }
                    return (
                    <React.Fragment key={si}>
                      {sec.heading && (
                        <tr className="plan-sec">
                          <td colSpan={3}>{sec.heading}</td>
                        </tr>
                      )}
                      {sec.rows.map((r, ri) => {
                        const mins = parseInt(r.time ?? "", 10) || 0;
                        const range = mins ? `${fmt(clock)} – ${fmt(clock + mins)}` : "";
                        clock += mins;
                        const timeCell = (
                          <td className="plan-time">
                            {range && <div className="plan-clock">{range}</div>}
                            {r.time && <div className="plan-mins">{r.time}</div>}
                          </td>
                        );
                        if (r.break)
                          return (
                            <tr key={ri} className="plan-break">
                              {timeCell}
                              <td colSpan={2}>{r.title}</td>
                            </tr>
                          );
                        return (
                          <tr key={ri}>
                            {timeCell}
                            <td>
                              <div className="plan-title">{r.title}</div>
                              {r.text?.map((t, ti) => (
                                <p key={ti} className="plan-p">
                                  <Gloss text={t} />
                                </p>
                              ))}
                              {r.bullets && (
                                <ul className="plan-bullets">
                                  {r.bullets.map((b, bi) => (
                                    <li key={bi}>
                                      <Gloss text={b} />
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </td>
                            <td className="plan-res">
                              {r.resources?.map((x) => (
                                <div key={x}>{x}</div>
                              ))}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                    );
                  });
                })()}
              </tbody>
              <tfoot>
                {(() => {
                  const rows = content.lessonPlan!.sections.flatMap((s) => s.rows);
                  const days = content.lessonPlan!.sections.filter((s) => s.startTime).length || 1;
                  const mins = rows.reduce((sum, r) => sum + (parseInt(r.time ?? "", 10) || 0), 0);
                  const brk = rows
                    .filter((r) => r.break)
                    .reduce((sum, r) => sum + (parseInt(r.time ?? "", 10) || 0), 0);
                  const h = Math.floor(mins / 60);
                  const m = mins % 60;
                  return (
                    <tr className="plan-total">
                      <td className="plan-time">{mins} minutes</td>
                      <td colSpan={2}>
                        Total {days > 1 ? `facilitation time over ${days} days` : "session time"} — {h} h{m ? ` ${m} min` : ""}
                        {brk ? ` (incl. ${brk} min break)` : ""}
                      </td>
                    </tr>
                  );
                })()}
              </tfoot>
            </table>
          </div>
        </>
      )}
    </>
  );
}
