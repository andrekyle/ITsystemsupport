import { useMemo, useState } from "react";
import { Icon } from "../icons";
import type { QuizQuestion, QuizResult } from "../types";

/** A stable pseudo-random shuffle so re-renders don't move items around. */
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = arr.slice();
  let s = seed || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type ChoiceAns = { kind: "choice"; picks: number[] };
type OrderAns = { kind: "order"; order: number[] }; // current visible order as original indices
type MatchAns = { kind: "match"; picks: Record<number, number> }; // leftIdx -> rightOriginalIdx

type Ans = ChoiceAns | OrderAns | MatchAns;

export function Quiz({
  questions,
  previous,
  onSubmit,
  showAnswers = false,
}: {
  questions: QuizQuestion[];
  previous?: QuizResult;
  onSubmit: (score: number, total: number) => void;
  /** Staff-only: renders a "Reveal answer key" toggle above the questions. */
  showAnswers?: boolean;
}) {
  const [answers, setAnswers] = useState<Record<number, Ans>>({});
  const [submitted, setSubmitted] = useState(false);
  const [dragFrom, setDragFrom] = useState<{ qi: number; idx: number } | null>(null);
  const [matchSel, setMatchSel] = useState<{ qi: number; leftIdx: number } | null>(null);
  const [showKey, setShowKey] = useState(false);

  // Precompute the shuffled display orders (stable across renders using question index seeds).
  const shuffled = useMemo(() => {
    return questions.map((q, qi) => {
      const seed = qi * 1000 + 7;
      if (q.kind === "order" && q.items) {
        const idx = q.items.map((_, i) => i);
        let s = seededShuffle(idx, seed);
        // Avoid the (unlikely) case where the shuffle is already correct.
        if (s.every((v, i) => v === i)) s = seededShuffle(idx, seed + 13);
        return { orderStart: s };
      }
      if (q.kind === "match" && q.pairs) {
        const idx = q.pairs.map((_, i) => i);
        return { rightOrder: seededShuffle(idx, seed) };
      }
      return {};
    });
  }, [questions]);

  function ansOf(qi: number, q: QuizQuestion): Ans {
    const cur = answers[qi];
    if (cur) return cur;
    if (q.kind === "order" && q.items) {
      return { kind: "order", order: shuffled[qi].orderStart!.slice() };
    }
    if (q.kind === "match") return { kind: "match", picks: {} };
    return { kind: "choice", picks: [] };
  }

  function isAnswered(qi: number, q: QuizQuestion): boolean {
    const a = answers[qi];
    if (!a) return false;
    if (a.kind === "choice") return a.picks.length > 0;
    if (a.kind === "order") return true;
    if (a.kind === "match") return q.pairs ? Object.keys(a.picks).length === q.pairs.length : false;
    return false;
  }

  function isCorrect(qi: number, q: QuizQuestion): boolean {
    const a = answers[qi];
    if (!a) return false;
    if (a.kind === "choice") {
      const want = q.answers ?? [q.answer];
      return a.picks.length === want.length && want.every((x) => a.picks.includes(x));
    }
    if (a.kind === "order") {
      return a.order.every((v, i) => v === i);
    }
    if (a.kind === "match") {
      if (!q.pairs) return false;
      return q.pairs.every((_, i) => a.picks[i] === i);
    }
    return false;
  }

  const answered = questions.reduce((n, q, i) => n + (isAnswered(i, q) ? 1 : 0), 0);
  const score = questions.reduce((n, q, i) => n + (isCorrect(i, q) ? 1 : 0), 0);
  const pct = Math.round((score / questions.length) * 100);

  function submit() {
    setSubmitted(true);
    onSubmit(score, questions.length);
    document.querySelector(".content")?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function retake() {
    setAnswers({});
    setSubmitted(false);
    setDragFrom(null);
    setMatchSel(null);
  }

  // -- choice question handlers --
  function pickChoice(qi: number, q: QuizQuestion, oi: number) {
    setAnswers((prev) => {
      const cur = (prev[qi] as ChoiceAns | undefined) ?? { kind: "choice", picks: [] };
      const multi = !!q.answers;
      const picks = multi
        ? cur.picks.includes(oi)
          ? cur.picks.filter((x) => x !== oi)
          : [...cur.picks, oi]
        : [oi];
      return { ...prev, [qi]: { kind: "choice", picks } };
    });
  }

  // -- order question handlers --
  function orderCurrent(qi: number, q: QuizQuestion): number[] {
    const a = ansOf(qi, q);
    return a.kind === "order" ? a.order : shuffled[qi].orderStart!.slice();
  }

  function setOrder(qi: number, order: number[]) {
    setAnswers((prev) => ({ ...prev, [qi]: { kind: "order", order } }));
  }

  function moveOrder(qi: number, from: number, to: number, q: QuizQuestion) {
    const cur = orderCurrent(qi, q).slice();
    if (to < 0 || to >= cur.length || from === to) return;
    const [v] = cur.splice(from, 1);
    cur.splice(to, 0, v);
    setOrder(qi, cur);
  }

  // -- match question handlers --
  function pickMatch(qi: number, leftIdx: number, rightOriginalIdx: number) {
    setAnswers((prev) => {
      const cur = (prev[qi] as MatchAns | undefined) ?? { kind: "match", picks: {} };
      // Remove any previous left that had this right assigned (each right used at most once).
      const picks: Record<number, number> = {};
      for (const [k, v] of Object.entries(cur.picks)) {
        if (v !== rightOriginalIdx) picks[Number(k)] = v;
      }
      picks[leftIdx] = rightOriginalIdx;
      return { ...prev, [qi]: { kind: "match", picks } };
    });
  }

  function clearMatch(qi: number, leftIdx: number) {
    setAnswers((prev) => {
      const cur = (prev[qi] as MatchAns | undefined) ?? { kind: "match", picks: {} };
      const picks = { ...cur.picks };
      delete picks[leftIdx];
      return { ...prev, [qi]: { kind: "match", picks } };
    });
  }

  return (
    <div>
      {previous && !submitted && (
        <div className="callout" style={{ marginTop: 0 }}>
          <span className="ico">
            <Icon name="award" size={19} />
          </span>
          <span>
            Best score so far for this quiz:{" "}
            <strong>
              {previous.best} / {previous.total} questions
            </strong>{" "}
            ({Math.round((previous.best / previous.total) * 100)}%) after {previous.attempts}{" "}
            attempt{previous.attempts === 1 ? "" : "s"}. A score of 80% or more is considered
            competent for this knowledge check.
          </span>
        </div>
      )}

      {previous?.history && previous.history.length > 0 && !submitted && (
        <div className="card attempts-card">
          <div className="task-label" style={{ marginTop: 0 }}>
            Last {previous.history.length} attempt{previous.history.length === 1 ? "" : "s"}
          </div>
          {previous.history.map((a, i) => {
            const pct = Math.round((a.score / a.total) * 100);
            const when = new Date(a.date).toLocaleString(undefined, {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
            return (
              <div className="attempt-row" key={a.date + i}>
                <span className="col-left">
                  <Icon
                    name={pct >= 80 ? "checkCircle" : "clock"}
                    size={17}
                    color={pct >= 80 ? "var(--green)" : "var(--ink-3)"}
                  />
                  <span className="sc">
                    {a.score} / {a.total} questions
                  </span>
                  <span className={`chip ${pct >= 80 ? "done" : "none"}`}>{pct}%</span>
                  {i === 0 && <span className="chip progress">Latest</span>}
                </span>
                <span className="dt">{when}</span>
              </div>
            );
          })}
        </div>
      )}

      {submitted && (
        <div className={`quiz-result ${pct >= 80 ? "pass" : "fail"}`}>
          <Icon name={pct >= 80 ? "checkCircle" : "info"} size={26} />
          <div>
            <div className="score">
              {score} / {questions.length} questions ({pct}%)
            </div>
            <div className="verdict">
              {pct >= 80
                ? "Competent — well done. Review any incorrect answers below."
                : "Not yet competent — review the explanations below and retake the quiz."}
            </div>
          </div>
          <button className="btn ghost" onClick={retake} style={{ marginLeft: "auto" }}>
            <Icon name="wrench" size={15} />
            Retake quiz
          </button>
        </div>
      )}

      {showAnswers && !submitted && (
        <div className="answer-key-wrap">
          <button
            type="button"
            className="btn ghost"
            onClick={() => setShowKey((v) => !v)}
          >
            <Icon name={showKey ? "eyeOff" : "eye"} size={15} />
            {showKey ? "Hide answer key (staff)" : "Reveal answer key (staff)"}
          </button>
          {showKey && (
            <div className="answer-key">
              <div className="answer-key-hd">
                <Icon name="award" size={16} />
                Answer key — staff view only
              </div>
              <ol>
                {questions.map((q, qi) => {
                  const kind = q.kind ?? "choice";
                  if (kind === "order" && q.items) {
                    return (
                      <li key={qi}>
                        <strong>Correct order:</strong>
                        <ol className="ak-sub">
                          {q.items.map((it, i) => (
                            <li key={i}>{it}</li>
                          ))}
                        </ol>
                      </li>
                    );
                  }
                  if (kind === "match" && q.pairs) {
                    return (
                      <li key={qi}>
                        <strong>Correct pairs:</strong>
                        <ul className="ak-sub">
                          {q.pairs.map((p, i) => (
                            <li key={i}>
                              {p.left} <span className="ak-arr">→</span> {p.right}
                            </li>
                          ))}
                        </ul>
                      </li>
                    );
                  }
                  const want = q.answers ?? [q.answer];
                  return (
                    <li key={qi}>
                      <strong>Correct:</strong>{" "}
                      {want.map((oi) => q.options[oi]).join("  •  ")}
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </div>
      )}

      {questions.map((q, qi) => {
        const kind = q.kind ?? "choice";
        const ok = isCorrect(qi, q);
        return (
          <div className="quiz-q" key={qi}>
            <div className="qt">
              <span className="qn">{qi + 1}</span>
              {q.q}
              {kind === "choice" && q.answers && (
                <span className="multi-hint">Select all that apply</span>
              )}
              {kind === "order" && <span className="multi-hint">Drag to reorder</span>}
              {kind === "match" && (
                <span className="multi-hint">Click a left item, then its match on the right</span>
              )}
            </div>

            {q.imageSvg && (
              <div
                className="quiz-figure"
                aria-hidden="true"
                dangerouslySetInnerHTML={{ __html: q.imageSvg }}
              />
            )}

            {kind === "choice" &&
              q.options.map((opt, oi) => {
                const chosen = (answers[qi] as ChoiceAns | undefined)?.picks ?? [];
                const want = q.answers ?? [q.answer];
                let cls = "opt";
                if (!submitted && chosen.includes(oi)) cls += " selected";
                if (submitted) {
                  if (want.includes(oi)) cls += " correct";
                  else if (chosen.includes(oi)) cls += " wrong";
                }
                return (
                  <button
                    key={oi}
                    className={cls}
                    disabled={submitted}
                    onClick={() => pickChoice(qi, q, oi)}
                  >
                    <span className="mark">
                      {submitted && want.includes(oi) && <Icon name="checkCircle" size={17} />}
                      {submitted && !want.includes(oi) && chosen.includes(oi) && (
                        <Icon name="info" size={17} />
                      )}
                      {!submitted && (
                        <Icon name={chosen.includes(oi) ? "checkCircle" : "circle"} size={17} />
                      )}
                    </span>
                    {opt}
                  </button>
                );
              })}

            {kind === "order" && q.items && (
              <ol className="quiz-order-list">
                {orderCurrent(qi, q).map((origIdx, pos) => {
                  const correctHere = origIdx === pos;
                  let cls = "quiz-order-item";
                  if (!submitted && dragFrom?.qi === qi && dragFrom.idx === pos) cls += " dragging";
                  if (submitted) cls += correctHere ? " correct" : " wrong";
                  return (
                    <li
                      key={origIdx}
                      className={cls}
                      draggable={!submitted}
                      onDragStart={() => setDragFrom({ qi, idx: pos })}
                      onDragOver={(e) => {
                        if (!submitted && dragFrom?.qi === qi) e.preventDefault();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (submitted || !dragFrom || dragFrom.qi !== qi) return;
                        moveOrder(qi, dragFrom.idx, pos, q);
                        setDragFrom(null);
                      }}
                      onDragEnd={() => setDragFrom(null)}
                    >
                      <span className="pos">{pos + 1}</span>
                      <span className="grip" aria-hidden="true">
                        <Icon name="menu" size={16} />
                      </span>
                      <span className="txt">{q.items![origIdx]}</span>
                      {!submitted && (
                        <span className="order-btns">
                          <button
                            type="button"
                            className="btn ghost xs"
                            aria-label="Move up"
                            disabled={pos === 0}
                            onClick={() => moveOrder(qi, pos, pos - 1, q)}
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            className="btn ghost xs"
                            aria-label="Move down"
                            disabled={pos === q.items!.length - 1}
                            onClick={() => moveOrder(qi, pos, pos + 1, q)}
                          >
                            ▼
                          </button>
                        </span>
                      )}
                      {submitted && (
                        <span className="mark">
                          <Icon name={correctHere ? "checkCircle" : "info"} size={17} />
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}

            {kind === "match" && q.pairs && (
              <div className="quiz-match">
                <div className="quiz-match-col">
                  {q.pairs.map((p, li) => {
                    const cur = (answers[qi] as MatchAns | undefined)?.picks[li];
                    const selected = matchSel?.qi === qi && matchSel.leftIdx === li;
                    let cls = "quiz-match-item left";
                    if (!submitted && selected) cls += " selected";
                    if (!submitted && cur !== undefined) cls += " paired";
                    if (submitted) cls += cur === li ? " correct" : " wrong";
                    return (
                      <button
                        key={li}
                        className={cls}
                        type="button"
                        disabled={submitted}
                        onClick={() => setMatchSel({ qi, leftIdx: li })}
                      >
                        <span className="badge">{String.fromCharCode(65 + li)}</span>
                        <span className="txt">{p.left}</span>
                        {cur !== undefined && (
                          <span className="chosen">
                            → {String.fromCharCode(65 + cur)}
                            {!submitted && (
                              <span
                                className="clear"
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearMatch(qi, li);
                                }}
                              >
                                ×
                              </span>
                            )}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="quiz-match-col">
                  {shuffled[qi].rightOrder!.map((rOrig) => {
                    const p = q.pairs![rOrig];
                    const usedBy = Object.entries(
                      (answers[qi] as MatchAns | undefined)?.picks ?? {},
                    ).find(([, v]) => v === rOrig);
                    let cls = "quiz-match-item right";
                    if (!submitted && usedBy) cls += " paired";
                    if (submitted) {
                      // right is correct if the left that maps to it also maps to it in the key
                      const leftAssigned = usedBy ? Number(usedBy[0]) : -1;
                      if (leftAssigned === rOrig) cls += " correct";
                      else if (usedBy) cls += " wrong";
                    }
                    return (
                      <button
                        key={rOrig}
                        type="button"
                        className={cls}
                        disabled={submitted || !matchSel || matchSel.qi !== qi}
                        onClick={() => {
                          if (!matchSel || matchSel.qi !== qi) return;
                          pickMatch(qi, matchSel.leftIdx, rOrig);
                          setMatchSel(null);
                        }}
                      >
                        <span className="badge">{String.fromCharCode(65 + rOrig)}</span>
                        <span className="txt">{p.right}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {submitted && (
              <div className={`explain ${ok ? "ok" : "no"}`}>
                <Icon name="info" size={15} />
                {q.explain}
              </div>
            )}
          </div>
        );
      })}

      {!submitted && (
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 18 }}>
          <button className="btn" onClick={submit} disabled={answered < questions.length}>
            <Icon name="checkCircle" size={16} />
            Submit answers
          </button>
          <span className="muted">
            {answered} of {questions.length} answered
          </span>
        </div>
      )}
    </div>
  );
}
