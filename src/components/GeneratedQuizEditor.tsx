import { useId } from "react";
import { Icon } from "../icons";
import type { QuizQuestion } from "../types";
import { autoGrowTextarea } from "../lib/autoGrow";

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
      <button type="button" className="generated-quiz-remove" onClick={onRemove} aria-label={`Remove question ${number}`} title="Remove question">
        <Icon name="trash" size={15}/>
      </button>
    </div>
    <textarea id={`${id}-question`} className="generated-quiz-prompt" rows={1} value={question.q}
      ref={element=>autoGrowTextarea(element)} onChange={event=>onChange({...question,q:event.target.value})}/>
    <fieldset className="generated-quiz-choices">
      <legend>Options <span>· Select the correct answer</span></legend>
      <div className="generated-quiz-options">
        {question.options.map((option,index)=>{
          const letter=String.fromCharCode(65+index);
          return <div className={`generated-quiz-option${question.answer===index ? " is-correct" : ""}`} key={index}>
            <input type="radio" name={`${id}-answer`} checked={question.answer===index}
              aria-label={`Mark option ${letter} as correct`} onChange={()=>onChange({...question,answer:index})}/>
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
