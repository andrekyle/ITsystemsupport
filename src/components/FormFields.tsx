import { useId } from "react";
import { DateTimePicker } from "./DateTimePicker";
import { Select } from "./Select";
import type { FormAnswer, FormAnswers, FormDefinition } from "../lib/formSchema";

export function FormFields({ definition, answers, onChange, errors = {} }: {
  definition: FormDefinition;
  answers: FormAnswers;
  onChange: (fieldId: string, value: FormAnswer) => void;
  errors?: Record<string, string>;
}) {
  const prefix = useId();
  return (
    <div className="generated-form">
      <h2>{definition.title}</h2>
      {definition.description && <p className="fb-preserve">{definition.description}</p>}
      {definition.sections.map(section => (
        <section key={section.id} className="generated-form-section" aria-labelledby={`${prefix}-${section.id}`}>
          <h3 id={`${prefix}-${section.id}`}>{section.title}</h3>
          {section.description && <p className="fb-preserve">{section.description}</p>}
          <div className="generated-form-grid">
            {section.fields.map(field => {
              const inputId = `${prefix}-${field.id}`;
              const value = answers[field.id];
              const text = typeof value === "string" ? value : "";
              const helpId = field.helpText ? `${inputId}-help` : undefined;
              const errorId = errors[field.id] ? `${inputId}-error` : undefined;
              const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;
              const label = <>{field.label}{field.required && <span className="fb-required" aria-label="required"> *</span>}</>;
              return (
                <div key={field.id} className={`field generated-field${["textarea", "checkbox", "checkboxes", "radio", "signature"].includes(field.type) ? " wide" : ""}`}>
                  {field.type === "checkbox" ? (
                    <label className="fb-choice" htmlFor={inputId}>
                      <input id={inputId} type="checkbox" checked={value === true} onChange={event => onChange(field.id, event.target.checked)} aria-describedby={describedBy} aria-invalid={!!errorId} aria-required={field.required} />
                      <span>{label}</span>
                    </label>
                  ) : field.type === "radio" || field.type === "checkboxes" ? (
                    <fieldset className="fb-choice-group" aria-describedby={describedBy} aria-invalid={!!errorId}>
                      <legend>{label}</legend>
                      {field.options.map(option => (
                        <label key={option} className="fb-choice">
                          <input
                            type={field.type === "radio" ? "radio" : "checkbox"}
                            name={inputId}
                            value={option}
                            checked={field.type === "radio" ? text === option : Array.isArray(value) && value.includes(option)}
                            onChange={event => {
                              if (field.type === "radio") onChange(field.id, option);
                              else {
                                const current = Array.isArray(value) ? value : [];
                                onChange(field.id, event.target.checked ? [...current, option] : current.filter(item => item !== option));
                              }
                            }}
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </fieldset>
                  ) : (
                    <>
                      <label htmlFor={inputId}>{label}</label>
                      {field.type === "textarea" ? (
                        <textarea id={inputId} value={text} rows={4} onChange={event => onChange(field.id, event.target.value)} aria-describedby={describedBy} aria-invalid={!!errorId} aria-required={field.required} maxLength={10000} />
                      ) : field.type === "select" ? (
                        <Select value={text} options={[{ value: "", label: "Select an option" }, ...field.options.map(option => ({ value: option, label: option }))]} onChange={value => onChange(field.id, value)} ariaLabel={field.label} />
                      ) : field.type === "date" ? (
                        <DateTimePicker id={inputId} value={text} onChange={value => onChange(field.id, value)} withTime={false} ariaLabel={field.label} />
                      ) : (
                        <input id={inputId} type={field.type === "signature" ? "text" : field.type} value={text} step={field.type === "number" ? "any" : undefined} onChange={event => onChange(field.id, event.target.value)} aria-describedby={describedBy} aria-invalid={!!errorId} aria-required={field.required} maxLength={field.type === "number" ? undefined : 2000} autoComplete="off" className={field.type === "signature" ? "fb-signature" : undefined} />
                      )}
                    </>
                  )}
                  {field.helpText && <p className="fb-field-note fb-preserve" id={helpId}>{field.helpText}</p>}
                  {field.type === "signature" && <p className="fb-field-note">Typed signing name</p>}
                  {errors[field.id] && <p className="auth-error" id={errorId} role="alert">{errors[field.id]}</p>}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}