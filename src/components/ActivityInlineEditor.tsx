import type { Exercise } from "../types";
import { InlineText } from "./InlineText";

/** Edit the activity in its displayed shape, without a separate form. */
export function ActivityInlineEditor({ value, onChange, disabled }: { value: Exercise; onChange: (value: Exercise) => void; disabled: boolean }) {
  return <div className="activity-inline-editor">
    <h3><InlineText value={value.title} editable={!disabled} placeholder="Activity title" onSave={title => onChange({ ...value, title })} /></h3>
    <p><InlineText value={value.task} editable={!disabled} placeholder="Activity instructions" onSave={task => onChange({ ...value, task })} /></p>
    <p><InlineText value={(value.scenario ?? []).join("\n")} editable={!disabled} multiline placeholder="Add background or instructions" onSave={text => onChange({ ...value, scenario: text.split("\n") })} /></p>
    <ol>{value.steps.map((question, index) => <li key={index}>
      <InlineText value={question} editable={!disabled} multiline placeholder="Type the learner question" onSave={text => onChange({ ...value, steps: value.steps.map((step, i) => i === index ? text : step) })} />
      <button type="button" className="btn ghost sm" disabled={disabled || value.steps.length === 1} onClick={() => onChange({ ...value, steps: value.steps.filter((_, i) => i !== index) })}>Remove question</button>
    </li>)}</ol>
    <button type="button" className="btn ghost sm" disabled={disabled || value.steps.length >= 12} onClick={() => onChange({ ...value, steps: [...value.steps, ""] })}>Add question</button>
  </div>;
}
