import { useState } from "react";
import { Icon } from "../icons";
import type { QuizQuestion, QuizResult } from "../types";

export function Quiz({
  questions,
  previous,
  onSubmit,
}: {
  questions: QuizQuestion[];
  previous?: QuizResult;
  onSubmit: (score: number, total: number) => void;
}) {
  const [answers, setAnswers] = useState<Record<number, number[]>>({});
  const [submitted, setSubmitted] = useState(false);

  const correctSet = (q: QuizQuestion) => q.answers ?? [q.answer];
  const isCorrect = (q: QuizQuestion, sel: number[] | undefined) => {
    const want = correctSet(q);
    return !!sel && sel.length === want.length && want.every((x) => sel.includes(x));
  };

  const answered = questions.reduce((n, _q, i) => n + ((answers[i]?.length ?? 0) > 0 ? 1 : 0), 0);
  const score = questions.reduce((n, q, i) => n + (isCorrect(q, answers[i]) ? 1 : 0), 0);
  const pct = Math.round((score / questions.length) * 100);

  function submit() {
    setSubmitted(true);
    onSubmit(score, questions.length);
    document.querySelector(".content")?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function retake() {
    setAnswers({});
    setSubmitted(false);
  }

  return (
    <div>
      {previous && !submitted && (
        <div className="callout" style={{ marginTop: 0 }}>
          <span className="ico">
            <Icon name="award" size={19} />
          </span>
          <span>
            Best score so far: <strong>{previous.best} / {previous.total}</strong> (
            {Math.round((previous.best / previous.total) * 100)}%) after {previous.attempts}{" "}
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
                    {a.score} / {a.total}
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
              {score} / {questions.length} ({pct}%)
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

      {questions.map((q, qi) => {
        const multi = !!q.answers;
        const chosen = answers[qi] ?? [];
        const want = correctSet(q);
        const pick = (oi: number) =>
          setAnswers((a) => {
            const cur = a[qi] ?? [];
            if (!multi) return { ...a, [qi]: [oi] };
            return {
              ...a,
              [qi]: cur.includes(oi) ? cur.filter((x) => x !== oi) : [...cur, oi],
            };
          });
        return (
          <div className="quiz-q" key={qi}>
            <div className="qt">
              <span className="qn">{qi + 1}</span>
              {q.q}
              {multi && <span className="multi-hint">Select all that apply</span>}
            </div>
            {q.options.map((opt, oi) => {
              let cls = "opt";
              if (!submitted && chosen.includes(oi)) cls += " selected";
              if (submitted) {
                if (want.includes(oi)) cls += " correct";
                else if (chosen.includes(oi)) cls += " wrong";
              }
              return (
                <button key={oi} className={cls} disabled={submitted} onClick={() => pick(oi)}>
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
            {submitted && (
              <div className={`explain ${isCorrect(q, answers[qi]) ? "ok" : "no"}`}>
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
