import { useLayoutEffect, useRef } from "react";
import type { Exercise } from "../types";

export function ActivityQuestionEditor({ value, onChange }: { value: Exercise; onChange: (value: Exercise) => void }) {
  const instructionsRef = useRef<HTMLTextAreaElement>(null);
  const instructions = (value.scenario ?? []).join("\n");
  useLayoutEffect(() => {
    const textarea = instructionsRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const style = window.getComputedStyle(textarea);
    const borderHeight = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
    textarea.style.height = `${textarea.scrollHeight + borderHeight}px`;
  }, [instructions]);

  return <div className="activity-question-editor">
    <p className="activity-question-editor-intro">Add the learner-facing prompts. Model answers and answer boxes are generated when you save.</p>
    <div className="activity-editor-fields">
      <label className="field activity-editor-field">
        <span>Activity title</span>
        <input value={value.title} onChange={event => onChange({ ...value, title: event.target.value })} />
      </label>
      <label className="field activity-editor-field">
        <span>Instructions <em>(optional)</em></span>
        <textarea ref={instructionsRef} rows={1} value={instructions} onChange={event => onChange({ ...value, scenario: event.target.value.split("\n") })} placeholder="Give learners any context they need before answering." />
      </label>
    </div>
    <section className="activity-editor-questions" aria-labelledby="activity-editor-questions-title">
      <header className="activity-editor-questions-header">
        <h4 id="activity-editor-questions-title">Learner questions</h4>
        <span className="activity-editor-count">{value.steps.length} / 12</span>
      </header>
      <ol className="activity-editor-question-list">
        {value.steps.map((question, index) => <li className="activity-editor-question" key={index}>
          <div className="activity-editor-question-heading">
            <span className="activity-editor-question-number">{String(index + 1).padStart(2, "0")}</span>
            <label htmlFor={`activity-question-${index}`}>Question {index + 1}</label>
            <button type="button" className="btn ghost sm activity-question-remove" aria-label={`Remove question ${index + 1}`} disabled={value.steps.length === 1} onClick={() => onChange({ ...value, steps: value.steps.filter((_, questionIndex) => questionIndex !== index) })}>Remove</button>
          </div>
          <textarea id={`activity-question-${index}`} rows={2} value={question} onChange={event => onChange({ ...value, steps: value.steps.map((item, questionIndex) => questionIndex === index ? event.target.value : item) })} placeholder="Enter a question for learners." />
        </li>)}
      </ol>
      <button type="button" className="btn ghost sm activity-question-add" disabled={value.steps.length >= 12} onClick={() => onChange({ ...value, steps: [...value.steps, ""] })}>+ Add question</button>
    </section>
  </div>;
}
