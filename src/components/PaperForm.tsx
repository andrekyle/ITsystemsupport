import { useId, type CSSProperties } from "react";
import { DateTimePicker } from "./DateTimePicker";
import { FitSheet } from "./FitSheet";
import { autoLayout, CHOICE_FIELD_TYPES, unplacedFields, type FormAnswer, type FormAnswers, type FormDefinition, type FormField, type FormLayoutCell, type FormLayoutRow, type FormSection } from "../lib/formSchema";

/**
 * Renders a generated form as a replica of the paper original: white sheet,
 * hairline table grid, bold captions beside write-in boxes and orange tick
 * cells — the same look as the hand-built Student Registration Form.
 */
export function PaperForm({ definition, answers, onChange, errors = {} }: {
  definition: FormDefinition;
  answers: FormAnswers;
  onChange: (fieldId: string, value: FormAnswer) => void;
  errors?: Record<string, string>;
}) {
  const prefix = useId();
  // the paper's own colours drive the title, tick highlights and banners
  const accent = definition.accentColor || "#ee7a15";
  return (
    // .srf-wrap also opts the page into the registration form's print layout
    <div className="srf-wrap paper-form-wrap">
      <FitSheet width={1000}>
        <div className="srf-page paper-form" style={{ "--paper-accent": accent } as CSSProperties}>
          {definition.masthead && (
            <div className="srf-masthead">
              <img className="paper-masthead" src={definition.masthead} alt="" />
            </div>
          )}
          {definition.title && <h2 className="srf-title" style={definition.titleColor ? { color: definition.titleColor } : undefined}>{definition.title}</h2>}
          {definition.description && <p className="paper-form-intro fb-preserve">{definition.description}</p>}
          {definition.sections.map(section => (
            <PaperSection key={section.id} section={section} prefix={prefix} answers={answers} errors={errors} onChange={onChange} />
          ))}
        </div>
      </FitSheet>
    </div>
  );
}

function PaperSection({ section, prefix, answers, errors, onChange }: {
  section: FormSection;
  prefix: string;
  answers: FormAnswers;
  errors: Record<string, string>;
  onChange: (fieldId: string, value: FormAnswer) => void;
}) {
  const byId = new Map(section.fields.map(field => [field.id, field]));
  const columns = Math.max(1, section.columns || 4);
  // the printed grid first, then anything the grid forgot laid out automatically
  const rows: FormLayoutRow[] = section.rows.length ? section.rows : autoLayout(section.fields);
  const leftovers = section.rows.length ? autoLayout(unplacedFields(section)) : [];
  const leftoverColumns = 4;
  const headingId = `${prefix}-${section.id}`;
  const hasHeading = !!(section.title || section.description);
  return (
    <>
      {section.pageBreak && <div className="srf-pagebreak" aria-hidden="true" />}
      <section className="paper-form-section" aria-labelledby={hasHeading ? headingId : undefined}>
        {hasHeading && (
          <div className="srf-section-title" id={headingId}>
            {section.title}
            {section.description && <em> {section.description}</em>}
          </div>
        )}
        {rows.length > 0 && (
          <PaperTable rows={rows} columns={columns} widths={section.widths} byId={byId} prefix={prefix} answers={answers} errors={errors} onChange={onChange} />
        )}
        {leftovers.length > 0 && (
          <PaperTable rows={leftovers} columns={leftoverColumns} widths={[]} byId={byId} prefix={prefix} answers={answers} errors={errors} onChange={onChange} />
        )}
        {section.banner && <div className="srf-orange-strip paper-banner fb-preserve">{section.banner}</div>}
      </section>
    </>
  );
}

function PaperTable({ rows, columns, widths, byId, prefix, answers, errors, onChange }: {
  rows: FormLayoutRow[];
  columns: number;
  widths: number[];
  byId: Map<string, FormField>;
  prefix: string;
  answers: FormAnswers;
  errors: Record<string, string>;
  onChange: (fieldId: string, value: FormAnswer) => void;
}) {
  const sized = widths.length === columns;
  return (
    <table className="srf-table srf-p2 paper-table">
      <colgroup>
        {Array.from({ length: columns }, (_, i) => <col key={i} style={{ width: `${sized ? widths[i] : 100 / columns}%` }} />)}
      </colgroup>
      <tbody>
        {rows.map((row, rowIndex) => {
          const used = row.cells.reduce((total, cell) => total + cell.span, 0);
          return (
            <tr key={rowIndex}>
              {row.cells.map((cell, cellIndex) => (
                <PaperCell key={cellIndex} cell={cell} field={byId.get(cell.fieldId)} prefix={prefix} answers={answers} errors={errors} onChange={onChange} />
              ))}
              {used < columns && <td className="srf-cell paper-blank" colSpan={columns - used} />}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function PaperCell({ cell, field, prefix, answers, errors, onChange }: {
  cell: FormLayoutCell;
  field: FormField | undefined;
  prefix: string;
  answers: FormAnswers;
  errors: Record<string, string>;
  onChange: (fieldId: string, value: FormAnswer) => void;
}) {
  const span = cell.span > 1 ? cell.span : undefined;
  if (cell.kind === "label") {
    return (
      <td className="srf-label" colSpan={span}>
        <label htmlFor={field && !CHOICE_FIELD_TYPES.includes(field.type) ? `${prefix}-${field.id}` : undefined}>
          {cell.text || field?.label}
          {field?.required && <span className="fb-required" aria-label="required"> *</span>}
        </label>
      </td>
    );
  }
  if (cell.kind === "option" && field) {
    const value = answers[field.id];
    const multiple = field.type === "checkboxes";
    const on = multiple ? Array.isArray(value) && value.includes(cell.text) : value === cell.text;
    return (
      <td
        className={`srf-tick-cell${on ? " on" : ""}${errors[field.id] ? " paper-error" : ""}`}
        colSpan={span}
        role={multiple ? "checkbox" : "radio"}
        aria-checked={on}
        aria-label={`${field.label}: ${cell.text}`}
        tabIndex={0}
        onClick={() => toggleOption(field, cell.text, value, onChange)}
        onKeyDown={event => { if (event.key === " " || event.key === "Enter") { event.preventDefault(); toggleOption(field, cell.text, value, onChange); } }}
      >
        <div className="srf-cell-label">{cell.text}</div>
      </td>
    );
  }
  if (cell.kind === "field" && field) {
    const input = <PaperInput field={field} id={`${prefix}-${field.id}`} value={answers[field.id]} onChange={value => onChange(field.id, value)} />;
    return (
      <td className={`srf-cell${errors[field.id] ? " paper-error" : ""}`} colSpan={span} title={errors[field.id] || undefined}>
        {cell.text ? (
          // a caption printed inside the box, e.g. "Other:"
          <div className="srf-inline-with-label">
            <span className="srf-inline-label">{cell.text}</span>
            {input}
          </div>
        ) : input}
      </td>
    );
  }
  if (cell.kind === "text" && cell.text) {
    return <td className="srf-cell paper-text fb-preserve" colSpan={span}>{cell.text}</td>;
  }
  return <td className="srf-cell paper-blank" colSpan={span} />;
}

function toggleOption(field: FormField, option: string, value: FormAnswer | undefined, onChange: (fieldId: string, value: FormAnswer) => void) {
  if (field.type === "checkboxes") {
    const current = Array.isArray(value) ? value : [];
    onChange(field.id, current.includes(option) ? current.filter(item => item !== option) : [...current, option]);
  } else {
    onChange(field.id, value === option ? "" : option);
  }
}

/** The write-in box for one field, in the paper form's own type. */
function PaperInput({ field, id, value, onChange }: {
  field: FormField;
  id: string;
  value: FormAnswer | undefined;
  onChange: (value: FormAnswer) => void;
}) {
  const text = typeof value === "string" ? value : "";
  if (field.type === "checkbox") {
    const on = value === true;
    return (
      <button type="button" className={`paper-check${on ? " on" : ""}`} aria-pressed={on} onClick={() => onChange(!on)}>
        <span className="paper-check-box" aria-hidden="true">{on ? "✓" : ""}</span>
        {field.label}
      </button>
    );
  }
  if (CHOICE_FIELD_TYPES.includes(field.type)) {
    // choices whose tick boxes were not laid out individually: ticks in a row
    const toggle = (option: string) => toggleOption(field, option, value, (_, next) => onChange(next));
    return (
      <div className="paper-ticks" role="group" aria-label={field.label}>
        {field.options.map(option => {
          const on = field.type === "checkboxes" ? Array.isArray(value) && value.includes(option) : text === option;
          return (
            <button key={option} type="button" className={`paper-tick${on ? " on" : ""}`} aria-pressed={on} onClick={() => toggle(option)}>
              {option}
            </button>
          );
        })}
      </div>
    );
  }
  if (field.type === "textarea") {
    return <textarea id={id} className="srf-input srf-textarea" value={text} rows={2} maxLength={10000} aria-label={field.label} onChange={event => onChange(event.target.value)} />;
  }
  if (field.type === "date") {
    return <DateTimePicker id={id} className="bare" withTime={false} value={text} onChange={onChange} placeholder="" ariaLabel={field.label} />;
  }
  return (
    <input
      id={id}
      className={`srf-input${field.type === "signature" ? " paper-signature" : ""}`}
      type={field.type === "signature" ? "text" : field.type}
      value={text}
      step={field.type === "number" ? "any" : undefined}
      maxLength={field.type === "number" ? undefined : 2000}
      autoComplete="off"
      aria-label={field.label}
      title={field.helpText || undefined}
      onChange={event => onChange(event.target.value)}
    />
  );
}
