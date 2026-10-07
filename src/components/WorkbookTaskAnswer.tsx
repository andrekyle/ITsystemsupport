import { useState } from "react";
import type { WorkbookMemoItem, WorkbookMemoTask } from "../store";
import { Icon } from "../icons";

type Values = Record<string, string | boolean>;
type Save = (key: string, value: string | boolean) => void;

interface TaskMark {
  awarded: number;
  maxMarks: number;
  feedback: string;
  correctSegments?: string[];
  incorrectSegments?: string[];
}

function MarkedAnswer({ answer, correct, incorrect }: { answer: string; correct: string[]; incorrect: string[] }) {
  const ranges: Array<{ start: number; end: number; kind: "correct" | "incorrect" }> = [];
  for (const [kind, segments] of [["correct", correct], ["incorrect", incorrect]] as const) {
    for (const segment of segments) {
      let from = 0;
      while (segment && from < answer.length) {
        const start = answer.indexOf(segment, from);
        if (start < 0) break;
        const end = start + segment.length;
        if (!ranges.some(range => start < range.end && end > range.start)) ranges.push({ start, end, kind });
        from = end;
      }
    }
  }
  ranges.sort((a, b) => a.start - b.start);
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  for (const range of ranges) {
    if (range.start > cursor) nodes.push(answer.slice(cursor, range.start));
    nodes.push(<mark className={`is-${range.kind}`} key={`${range.start}-${range.end}`}>{answer.slice(range.start, range.end)}</mark>);
    cursor = range.end;
  }
  if (cursor < answer.length) nodes.push(answer.slice(cursor));
  return <div className="workbook-marked-answer" aria-label="Marked answer">{nodes}</div>;
}

export function WorkbookTaskAnswer({ outcomeId, task, memoItem, valueKey, markKey, values, onChange, legacyAnswer = "" }: {
  outcomeId: string;
  task: WorkbookMemoTask;
  memoItem?: WorkbookMemoItem;
  valueKey: string;
  markKey: string;
  values: Values;
  onChange: Save;
  legacyAnswer?: string;
}) {
  const [answer, setAnswer] = useState(String(values[valueKey] ?? legacyAnswer));
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState("");
  let result: TaskMark | undefined;
  try {
    result = JSON.parse(String(values[markKey] ?? "")) as TaskMark;
  } catch {
    result = undefined;
  }
  const criteria = memoItem?.criteria.filter(criterion => criterion.taskId === task.id) ?? [];
  const updateAnswer = (next: string) => {
    setAnswer(next);
    try {
      onChange(valueKey, next);
      if (error === "This answer could not be saved. Free some browser storage and try again.") setError("");
    } catch {
      setError("This answer could not be saved. Free some browser storage and try again.");
    }
  };
  const mark = async () => {
    if (marking) return;
    if (!answer.trim()) { setError("Enter an answer before marking."); return; }
    if (!memoItem || !criteria.length) return;
    setMarking(true);
    setError("");
    try {
      const response = await fetch("/api/workbook-memo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "mark",
          items: [{ id: outcomeId, question: task.text, maxMarks: task.marks, tasks: [task], criteria }],
          answers: [{ id: outcomeId, answer: `Task ${task.task}: ${task.text}\n${answer.trim()}` }],
        }),
      });
      const data = await response.json() as { results?: Array<TaskMark & { id: string }>; error?: string };
      const next = data.results?.[0];
      if (!response.ok || !next) throw new Error(data.error || "The answer could not be marked.");
      onChange(valueKey, answer);
      onChange(markKey, JSON.stringify(next));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The answer could not be marked.");
    } finally {
      setMarking(false);
    }
  };
  return <div className="workbook-task-response">
    {result
      ? <MarkedAnswer answer={answer} correct={result.correctSegments ?? []} incorrect={result.incorrectSegments ?? []} />
      : <textarea
          aria-label={`Task ${task.task}: ${task.text}`}
          value={answer}
          onChange={event => updateAnswer(event.target.value)}
          onBlur={() => updateAnswer(answer)}
        />}
    <div className="workbook-task-mark-row">
      <span
        className="workbook-task-mark-wrap no-print"
        data-tooltip={!criteria.length ? "Refresh the memo to enable individual marking" : "Mark this answer with AI"}
      >
        <button
          type="button"
          className="workbook-task-mark"
          disabled={marking || !criteria.length}
          aria-label={!criteria.length ? "Individual marking unavailable until the memo is refreshed" : "Mark this answer with AI"}
          onClick={() => void mark()}
        >
          <Icon name="robot" size={15} />
          {marking ? "Marking…" : "Mark answer"}
        </button>
      </span>
      {result && <button type="button" className="workbook-task-edit no-print" onClick={() => onChange(markKey, "")}>Edit answer</button>}
      {result && <span className="workbook-task-score">{result.awarded}/{result.maxMarks} — {result.feedback}</span>}
      {error && <span className="workbook-task-notice" role="alert">{error}</span>}
    </div>
  </div>;
}
