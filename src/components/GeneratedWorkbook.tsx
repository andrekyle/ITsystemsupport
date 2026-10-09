import { useState } from "react";
import type { WorkbookSpec } from "../types";
import type { WorkbookMemoItem } from "../store";
import { Icon } from "../icons";
import { DocumentActions } from "./DocumentActions";
import { WorkbookTaskAnswer } from "./WorkbookTaskAnswer";
import { workbookMarkFingerprint } from "../lib/workbookMarking";

type Values = Record<string, string | boolean>;
type Save = (key: string, value: string | boolean) => void;

interface MarkResult {
  awarded: number;
  maxMarks: number;
  feedback: string;
  answerHash?: string;
}

export function GeneratedWorkbook({ workbook, memoItems, values, onChange, onSave }: {
  workbook: WorkbookSpec;
  memoItems: WorkbookMemoItem[];
  values: Values;
  onChange: Save;
  onSave: () => Promise<void>;
}) {
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState("");
  const displayedOutcomes = workbook.outcomes.map(outcome => {
    const memo = memoItems.find(item => item.id === outcome.id);
    return memo?.tasks?.length
      ? { ...outcome, title: memo.question, questions: [...memo.tasks] }
      : outcome;
  }).sort((a, b) => Math.min(...a.questions.map(question => question.task)) - Math.min(...b.questions.map(question => question.task)));
  const resultFor = (id: string): MarkResult | undefined => {
    try {
      return JSON.parse(String(values[`built-workbook.mark.${id}`] ?? "")) as MarkResult;
    } catch {
      return undefined;
    }
  };
  const mark = async () => {
    if (marking || !memoItems.length) return;
    setMarking(true);
    setError("");
    try {
      const entries = displayedOutcomes.flatMap(outcome => outcome.questions.map(question => {
        const memoItem = memoItems.find(item => item.id === outcome.id);
        const memoTask = memoItem?.tasks?.find(task => task.id === question.id);
        const criteria = memoItem?.criteria.filter(criterion => criterion.taskId === question.id) ?? [];
        if (!memoItem || !memoTask || !criteria.length) throw new Error("Replace the memo PDF to enable marking for every question.");
        const item = { id: `${outcome.id}--${question.id}`, question: question.text, maxMarks: question.marks, tasks: [memoTask], criteria };
        const answer = String(values[`built-workbook.${outcome.id}.${question.id}`] ?? "").trim();
        const answerHash = workbookMarkFingerprint(answer, { task: memoTask, criteria });
        let cached: (MarkResult & { id?: string }) | undefined;
        try { cached = JSON.parse(String(values[`built-workbook.task-mark.${outcome.id}.${question.id}`] ?? "")); } catch { cached = undefined; }
        return { outcome, question, item, answer, answerHash, cached };
      }));
      const pending = entries.filter(entry => entry.cached?.answerHash !== entry.answerHash);
      let fresh: Array<MarkResult & { id: string; correctSegments?: string[]; incorrectSegments?: string[] }> = [];
      if (pending.length) {
        const response = await fetch("/api/workbook-memo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "mark", items: pending.map(entry => entry.item), answers: pending.map(entry => ({ id: entry.item.id, answer: entry.answer })) }),
        });
        const data = await response.json() as { results?: typeof fresh; error?: string };
        if (!response.ok || !data.results) throw new Error(data.error || "The workbook could not be marked.");
        fresh = data.results;
      }
      for (const outcome of displayedOutcomes) {
        const taskResults = outcome.questions.map(question => {
          const entry = entries.find(candidate => candidate.item.id === `${outcome.id}--${question.id}`)!;
          const result = fresh.find(candidate => candidate.id === entry.item.id) ?? entry.cached;
          return result ? { ...result, answerHash: entry.answerHash } : undefined;
        }).filter((result): result is NonNullable<typeof result> => !!result);
        if (taskResults.length !== outcome.questions.length) throw new Error(`Not every question in Specific Outcome ${outcome.specificOutcome} was marked.`);
        outcome.questions.forEach((question, index) => onChange(`built-workbook.task-mark.${outcome.id}.${question.id}`, JSON.stringify(taskResults[index])));
        const awarded = taskResults.reduce((total, result) => total + result.awarded, 0);
        const maxMarks = taskResults.reduce((total, result) => total + result.maxMarks, 0);
        onChange(`built-workbook.mark.${outcome.id}`, JSON.stringify({ awarded, maxMarks, feedback: `${taskResults.filter(result => result.awarded >= result.maxMarks).length} of ${taskResults.length} questions fully correct.` }));
      }
      onChange("built-workbook.marked-at", new Date().toISOString());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The workbook could not be marked.");
    } finally {
      setMarking(false);
    }
  };

  return <section className="generated-workbook">
    <div className="lw-workbook-actions no-print">
      <div className="lw-workbook-actions-copy"><strong>Workbook tools</strong><span>Answers save automatically. Save verifies the latest content on this device and in the cloud before you leave.</span></div>
      <div className="lw-workbook-actions-controls">
        <DocumentActions name={workbook.title} onSave={onSave} />
        <button type="button" className="btn lw-mark-workbook" disabled={marking || !memoItems.length} onClick={() => void mark()}>
          <Icon name="robot" size={17} />
          {marking ? "Marking answers…" : memoItems.length ? "Mark workbook" : "Upload memo to mark"}
        </button>
      </div>
      {error && <span className="auth-error" role="alert">{error}</span>}
    </div>
    <div className="generated-workbook-document document-print-target">
      <header>
        <span>Learner Workbook</span>
        <h1>{workbook.title}</h1>
      </header>
      {displayedOutcomes.map(outcome => {
        const result = resultFor(outcome.id);
        return <article className="card generated-workbook-outcome" key={outcome.id}>
          <div className="lw-outcome-head">
            <strong>SPECIFIC OUTCOME {outcome.specificOutcome}.</strong>
            <b>{outcome.title}</b>
            <span>Learning Outcomes</span>
            <ol>{outcome.learningOutcomes.map(item => <li key={item}>{item}</li>)}</ol>
          </div>
          {result && <div className="lw-ai-result"><Icon name="checkCircle" size={15} /><strong>AI mark: {result.awarded}/{result.maxMarks}</strong><span>{result.feedback}</span></div>}
          {outcome.questions.map(question => <div className="lw-task-answer" key={question.id}>
            <table className="lw-table lw-question">
              <thead><tr><th>Task</th><th>Questions Description</th><th>SO</th><th>Mark</th></tr></thead>
              <tbody><tr><td>{question.task}</td><td>{question.text}</td><td>{outcome.specificOutcome}</td><td>{question.marks}</td></tr></tbody>
            </table>
            <WorkbookTaskAnswer
              outcomeId={outcome.id}
              task={question}
              memoItem={memoItems.find(item => item.id === outcome.id)}
              valueKey={`built-workbook.${outcome.id}.${question.id}`}
              markKey={`built-workbook.task-mark.${outcome.id}.${question.id}`}
              values={values}
              onChange={onChange}
            />
          </div>)}
        </article>;
      })}
    </div>
  </section>;
}
