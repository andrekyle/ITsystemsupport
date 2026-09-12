import { useId, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactElement, type ReactNode, type RefObject } from "react";
import { DateTimePicker } from "./DateTimePicker";
import { FitSheet } from "./FitSheet";
import { CHOICE_FIELD_TYPES, type FormAnswer, type FormAnswers, type FormBox, type FormDefinition, type FormField } from "../lib/formSchema";

/** Editing hooks for the form builder: move/resize boxes, draw a box for a
 *  field that has none yet. Absent for learners filling the form in. */
export interface ReplicaAdjust {
  /** optionIndex -1 = the field's own box, otherwise one option's tick box */
  onBox: (fieldId: string, optionIndex: number, box: FormBox) => void;
  /** field waiting for a box to be drawn on a page */
  armed: string | null;
  onDraw: (fieldId: string, page: number, box: FormBox) => void;
}

/** A field that appears somewhere on the page images. */
export function isPlaced(field: FormField): boolean {
  return !!field.placement && (!!field.placement.box || field.placement.options.some(Boolean));
}

/** A field whose every answer spot is on the pages: its box, or for a choice
 *  field a tick box per option (or a box to hold the loose ones). Anything
 *  less is also listed under the pages so no answer is lost. */
export function isFullyPlaced(field: FormField): boolean {
  if (!isPlaced(field)) return false;
  const placement = field.placement!;
  if (!CHOICE_FIELD_TYPES.includes(field.type) || placement.box) return true;
  return field.options.every((_, index) => placement.options[index]);
}

const PAGE_WIDTH = 1000;
const MIN_BOX = 0.006;

const boxStyle = (box: FormBox, extra?: CSSProperties): CSSProperties => ({
  left: `${box.x * 100}%`,
  top: `${box.y * 100}%`,
  width: `${box.w * 100}%`,
  height: `${box.h * 100}%`,
  // type sized to the box: 62% of its height, but never wider than the page allows
  fontSize: `min(2.1cqw, ${(box.h * 62).toFixed(2)}cqh)`,
  ...extra,
});

/**
 * The uploaded pages themselves, with the fields laid over the exact boxes
 * they were bound to — the digital form is the paper form.
 */
export function ReplicaForm({ definition, answers, onChange, errors = {}, adjust }: {
  definition: FormDefinition;
  answers: FormAnswers;
  onChange: (fieldId: string, value: FormAnswer) => void;
  errors?: Record<string, string>;
  adjust?: ReplicaAdjust;
}) {
  const prefix = useId();
  const fields = definition.sections.flatMap(section => section.fields);
  return (
    <div className={`srf-wrap paper-form-wrap replica-wrap${adjust ? " replica-adjust" : ""}`}>
      {definition.pages.map((page, index) => (
        <FitSheet width={PAGE_WIDTH} key={index}>
          <ReplicaPage
            page={index + 1}
            src={page.src}
            ratio={page.width / page.height}
            title={definition.title}
            fields={fields.filter(field => isPlaced(field) && field.placement!.page === index + 1)}
            prefix={prefix}
            answers={answers}
            errors={errors}
            onChange={onChange}
            adjust={adjust}
          />
        </FitSheet>
      ))}
    </div>
  );
}

/** Pointer deltas arrive in screen pixels; the sheet may be scaled down. */
function pageFraction(element: HTMLElement, clientX: number, clientY: number): { x: number; y: number } {
  const rect = element.getBoundingClientRect();
  return {
    x: Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
    y: Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)),
  };
}

const clampBox = (box: FormBox): FormBox => {
  const w = Math.min(Math.max(box.w, MIN_BOX), 1);
  const h = Math.min(Math.max(box.h, MIN_BOX), 1);
  const x = Math.min(Math.max(box.x, 0), 1 - w);
  const y = Math.min(Math.max(box.y, 0), 1 - h);
  const round = (v: number) => Math.round(v * 10000) / 10000;
  return { x: round(x), y: round(y), w: round(w), h: round(h) };
};

function ReplicaPage({ page, src, ratio, title, fields, prefix, answers, errors, onChange, adjust }: {
  page: number;
  src: string;
  ratio: number;
  title: string;
  fields: FormField[];
  prefix: string;
  answers: FormAnswers;
  errors: Record<string, string>;
  onChange: (fieldId: string, value: FormAnswer) => void;
  adjust?: ReplicaAdjust;
}) {
  const pageRef = useRef<HTMLDivElement>(null);
  const drawing = useRef<{ fieldId: string; start: { x: number; y: number } } | null>(null);

  const startDraw = (event: ReactPointerEvent<HTMLDivElement>) => {
    const onPaper = event.target === event.currentTarget || (event.target as HTMLElement).tagName === "IMG";
    if (!adjust?.armed || !pageRef.current || !onPaper) return;
    event.preventDefault();
    drawing.current = { fieldId: adjust.armed, start: pageFraction(pageRef.current, event.clientX, event.clientY) };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const endDraw = (event: ReactPointerEvent<HTMLDivElement>) => {
    const draw = drawing.current;
    if (!draw || !pageRef.current || !adjust) return;
    drawing.current = null;
    const end = pageFraction(pageRef.current, event.clientX, event.clientY);
    const box = clampBox({ x: Math.min(draw.start.x, end.x), y: Math.min(draw.start.y, end.y), w: Math.abs(end.x - draw.start.x), h: Math.abs(end.y - draw.start.y) });
    // a click without a drag gets a default-sized box at that spot
    if (box.w < 0.02 || box.h < 0.01) adjust.onDraw(draw.fieldId, page, clampBox({ x: draw.start.x, y: draw.start.y - 0.012, w: 0.2, h: 0.024 }));
    else adjust.onDraw(draw.fieldId, page, box);
  };

  return (
    <div
      ref={pageRef}
      className={`replica-page${adjust?.armed ? " replica-drawing" : ""}`}
      style={{ "--ratio": ratio, width: PAGE_WIDTH, height: Math.round(PAGE_WIDTH / ratio) } as CSSProperties}
      onPointerDown={adjust ? startDraw : undefined}
      onPointerUp={adjust ? endDraw : undefined}
    >
      <img src={src} alt={`${title || "Form"} - page ${page}`} draggable={false} />
      {fields.map(field => (
        <ReplicaField key={field.id} field={field} ratio={ratio} pageRef={pageRef} prefix={prefix} value={answers[field.id]} error={errors[field.id]} onChange={value => onChange(field.id, value)} adjust={adjust} />
      ))}
    </div>
  );
}

function ReplicaField({ field, ratio, pageRef, prefix, value, error, onChange, adjust }: {
  field: FormField;
  ratio: number;
  pageRef: RefObject<HTMLDivElement>;
  prefix: string;
  value: FormAnswer | undefined;
  error?: string;
  onChange: (value: FormAnswer) => void;
  adjust?: ReplicaAdjust;
}) {
  const placement = field.placement!;
  const id = `${prefix}-${field.id}`;
  const errorClass = error ? " replica-error" : "";
  const elements: ReactElement[] = [];
  // a cell with the choice printed in it gets a corner tick, a small square a centred one
  const tickClass = (box: FormBox) => `replica-tick${(box.w * ratio) / box.h > 1.6 ? " wide" : ""}`;

  // choice fields: one tick per option box; a dropdown on paper is a row of chips
  if (CHOICE_FIELD_TYPES.includes(field.type)) {
    const multiple = field.type === "checkboxes";
    const chosen = multiple ? (Array.isArray(value) ? value : []) : typeof value === "string" ? value : "";
    const toggle = (option: string) => {
      if (multiple) onChange((chosen as string[]).includes(option) ? (chosen as string[]).filter(item => item !== option) : [...(chosen as string[]), option]);
      else onChange(chosen === option ? "" : option);
    };
    field.options.forEach((option, index) => {
      const box = placement.options[index];
      if (!box) return;
      const on = multiple ? (chosen as string[]).includes(option) : chosen === option;
      elements.push(
        <AdjustableBox key={`${field.id}-${index}`} box={box} pageRef={pageRef} adjust={adjust} onBox={next => adjust?.onBox(field.id, index, next)}>
          <button
            type="button"
            className={`${tickClass(box)}${on ? " on" : ""}${errorClass}`}
            role={multiple ? "checkbox" : "radio"}
            aria-checked={on}
            aria-label={`${field.label}: ${option}`}
            title={`${field.label}: ${option}`}
            onClick={() => toggle(option)}
          />
        </AdjustableBox>
      );
    });
    // choices without their own tick box are offered as chips inside the field box
    const loose = field.options.filter((_, index) => !placement.options[index]);
    if (placement.box && loose.length) {
      elements.push(
        <AdjustableBox key={`${field.id}-box`} box={placement.box} pageRef={pageRef} adjust={adjust} onBox={next => adjust?.onBox(field.id, -1, next)}>
          <div className={`replica-chips${errorClass}`} role="group" aria-label={field.label}>
            {loose.map(option => {
              const on = multiple ? (chosen as string[]).includes(option) : chosen === option;
              return <button key={option} type="button" className={`paper-tick${on ? " on" : ""}`} aria-pressed={on} onClick={() => toggle(option)}>{option}</button>;
            })}
          </div>
        </AdjustableBox>
      );
    }
    return <>{elements}</>;
  }

  if (!placement.box) return null;
  const box = placement.box;
  const text = typeof value === "string" ? value : "";
  let control: ReactElement;
  if (field.type === "checkbox") {
    const on = value === true;
    control = <button type="button" className={`${tickClass(box)}${on ? " on" : ""}${errorClass}`} role="checkbox" aria-checked={on} aria-label={field.label} title={field.label} onClick={() => onChange(!on)} />;
  } else if (field.type === "textarea") {
    control = <textarea id={id} className={`replica-input replica-textarea${errorClass}`} value={text} maxLength={10000} aria-label={field.label} title={field.helpText || field.label} onChange={event => onChange(event.target.value)} />;
  } else if (field.type === "date") {
    control = <div className={`replica-date${errorClass}`}><DateTimePicker id={id} className="bare" withTime={false} value={text} onChange={onChange} placeholder="" ariaLabel={field.label} /></div>;
  } else {
    control = (
      <input
        id={id}
        className={`replica-input${field.type === "signature" ? " paper-signature" : ""}${errorClass}`}
        type={field.type === "signature" ? "text" : field.type}
        value={text}
        step={field.type === "number" ? "any" : undefined}
        maxLength={field.type === "number" ? undefined : 2000}
        autoComplete="off"
        aria-label={field.label}
        title={error || field.helpText || field.label}
        onChange={event => onChange(event.target.value)}
      />
    );
  }
  return (
    <AdjustableBox box={box} pageRef={pageRef} adjust={adjust} onBox={next => adjust?.onBox(field.id, -1, next)}>
      {control}
    </AdjustableBox>
  );
}

/** Positions its child on the page; in adjust mode the box can be dragged
 *  by its body and resized by the corner handle. */
function AdjustableBox({ box, pageRef, adjust, onBox, children }: {
  box: FormBox;
  pageRef: RefObject<HTMLDivElement>;
  adjust?: ReplicaAdjust;
  onBox: (box: FormBox) => void;
  children: ReactNode;
}) {
  const gesture = useRef<{ kind: "move" | "resize"; start: { x: number; y: number }; box: FormBox } | null>(null);
  const begin = (kind: "move" | "resize") => (event: ReactPointerEvent<HTMLElement>) => {
    if (!adjust || !pageRef.current || adjust.armed) return;
    event.preventDefault();
    event.stopPropagation();
    gesture.current = { kind, start: pageFraction(pageRef.current, event.clientX, event.clientY), box };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move = (event: ReactPointerEvent<HTMLElement>) => {
    const current = gesture.current;
    if (!current || !pageRef.current) return;
    const point = pageFraction(pageRef.current, event.clientX, event.clientY);
    const dx = point.x - current.start.x;
    const dy = point.y - current.start.y;
    onBox(clampBox(current.kind === "move"
      ? { ...current.box, x: current.box.x + dx, y: current.box.y + dy }
      : { ...current.box, w: current.box.w + dx, h: current.box.h + dy }));
  };
  const end = () => { gesture.current = null; };
  return (
    <div
      className="replica-field"
      style={boxStyle(box)}
      onPointerDown={adjust ? begin("move") : undefined}
      onPointerMove={adjust ? move : undefined}
      onPointerUp={adjust ? end : undefined}
      onPointerCancel={adjust ? end : undefined}
    >
      {children}
      {adjust && <span className="replica-handle" aria-hidden="true" onPointerDown={begin("resize")} />}
    </div>
  );
}
