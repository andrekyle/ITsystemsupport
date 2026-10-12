import { useId } from "react";
import { Icon } from "../icons";
import type { QuizQuestion } from "../types";
import { autoGrowTextarea } from "../lib/autoGrow";
import { EditingTools } from "./EditingSidebar";
import { Select } from "./Select";

export function GeneratedQuizEditor({ question, number, onChange, onRemove }: {
  question: QuizQuestion;
  number: number;
  onChange: (question: QuizQuestion) => void;
  onRemove: () => void;
}) {
  const id = useId();
  return <div className="generated-quiz-edit" onClick={event=>event.stopPropagation()}>
    <div className="generated-quiz-heading">
      <label htmlFor={`${id}-question`}>Question {number}</label>
      <EditingTools active title={`Quiz question ${number}`} defaultOpen={false} headerAction={
        <button type="button" className="generated-quiz-remove"
          onClick={event => { event.preventDefault(); event.stopPropagation(); onRemove(); }}
          aria-label={`Remove question ${number}`} title="Remove question">
          <Icon name="trash" size={15}/>
        </button>
      }>
      <Select ariaLabel={`Correct answer for question ${number}`} value={String(question.answer)}
        options={question.options.map((_, index) => ({ value: String(index), label: `Option ${String.fromCharCode(65 + index)}` }))}
        onChange={value => onChange({ ...question, answer: Number(value) })} />
      </EditingTools>
    </div>
    <textarea id={`${id}-question`} className="generated-quiz-prompt" rows={1} value={question.q}
      ref={element=>autoGrowTextarea(element)} onChange={event=>onChange({...question,q:event.target.value})}/>
    <fieldset className="generated-quiz-choices">
      <legend>Options <span>· Set the correct answer in editing tools</span></legend>
      <div className="generated-quiz-options">
        {question.options.map((option,index)=>{
          const letter=String.fromCharCode(65+index);
          return <div className={`generated-quiz-option${question.answer===index ? " is-correct" : ""}`} key={index}>
            <label htmlFor={`${id}-option-${index}`}>{letter}</label>
            <textarea id={`${id}-option-${index}`} aria-label={`Option ${letter}`} rows={1} value={option}
              ref={element=>autoGrowTextarea(element)} onChange={event=>onChange({...question,options:question.options.map((text,i)=>i===index?event.target.value:text)})}/>
          </div>;
        })}
      </div>
    </fieldset>
    <details className="generated-quiz-explanation" onToggle={event=>autoGrowTextarea(event.currentTarget.querySelector("textarea"))}>
      <summary>Explanation <span>{question.explain || "Add an explanation"}</span></summary>
      <textarea aria-label={`Explanation for question ${number}`} rows={1} value={question.explain??""}
        ref={element=>autoGrowTextarea(element)} onChange={event=>onChange({...question,explain:event.target.value})}/>
    </details>
  </div>;
}
