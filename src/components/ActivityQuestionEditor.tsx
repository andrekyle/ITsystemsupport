import type { Exercise } from "../types";

export function ActivityQuestionEditor({ value, onChange }: { value: Exercise; onChange: (value: Exercise) => void }) {
  return <div>
    <p>Enter your questions. Model answers and learner answer boxes are created automatically when you save.</p>
    <label className="field">Heading<input value={value.title} onChange={e => onChange({ ...value, title: e.target.value })} /></label>
    <label className="field">Instructions (optional)<textarea value={(value.scenario ?? []).join("\n")} onChange={e => onChange({ ...value, scenario: e.target.value.split("\n") })} /></label>
    {value.steps.map((question, i) => <div key={i}>
      <label className="field">Question {i + 1}<textarea rows={3} value={question} onChange={e => onChange({ ...value, steps: value.steps.map((q, j) => j === i ? e.target.value : q) })} /></label>
      <button type="button" className="btn ghost sm" disabled={value.steps.length === 1} onClick={() => onChange({ ...value, steps: value.steps.filter((_, j) => j !== i) })}>Remove question</button>
    </div>)}
    <button type="button" className="btn ghost sm" disabled={value.steps.length >= 12} onClick={() => onChange({ ...value, steps: [...value.steps, ""] })}>Add question</button>
  </div>;
}
