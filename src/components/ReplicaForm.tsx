import { useId, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type ReactElement, type ReactNode, type RefObject } from "react";
import { DateTimePicker } from "./DateTimePicker";
import { FitSheet } from "./FitSheet";
import { AnnotationLayer, annotationAt, FillSignBar, SignatureDialog, type FillSign } from "./FillSign";
import { CHOICE_FIELD_TYPES, type FormAnswer, type FormAnswers, type FormBox, type FormDefinition, type FormField, type PageLayer } from "../lib/formSchema";

/** Editing hooks for the form builder: move/resize boxes, draw a box for a
 *  field that has none yet. Absent for learners filling the form in. */
export interface ReplicaAdjust {
  /** optionIndex -1 = the field's own box, otherwise one option's tick box */
  onBox: (fieldId: string, optionIndex: number, box: FormBox) => void;
  /** field waiting for a box to be drawn on a page */
  armed: string | null;
  onDraw: (fieldId: string, page: number, box: FormBox) => void;
}

/** Builder editing of the rebuilt page's printed text ("" removes the run). */
export type LayerTextEdit = (page: number, index: number, text: string) => void;

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
export function ReplicaForm({ definition, answers, onChange, errors = {}, adjust, fill, onLayerText }: {
  definition: FormDefinition;
  answers: FormAnswers;
  onChange: (fieldId: string, value: FormAnswer) => void;
  errors?: Record<string, string>;
  adjust?: ReplicaAdjust;
  /** Acrobat-style marks anywhere on the page */
  fill?: FillSign;
  /** builder: printed text of the rebuilt page is editable in place */
  onLayerText?: LayerTextEdit;
}) {
  const prefix = useId();
  const fields = definition.sections.flatMap(section => section.fields);
  // a signature tool click waits for the signature dialog the first time
  const [pendingSignature, setPendingSignature] = useState<{ page: number; x: number; y: number; ratio: number } | null>(null);
  const place = (page: number, x: number, y: number, ratio: number) => {
    if (!fill?.tool) return;
    if (fill.tool === "signature" && !fill.signature) { setPendingSignature({ page, x, y, ratio }); return; }
    const mark = { ...annotationAt(fill.tool, x, y, ratio), page, ...(fill.tool === "signature" ? fill.signature : {}) };
    fill.onChange([...fill.annotations, mark]);
    fill.setSelected(mark.id);
    // symbols keep the tool for the next box; text and signatures are placed one at a time
    if (fill.tool === "text" || fill.tool === "signature") fill.setTool(null);
  };
  return (
    <div className={`srf-wrap paper-form-wrap replica-wrap${adjust ? " replica-adjust" : ""}${fill?.tool ? " replica-placing" : ""}${onLayerText ? " replica-editing-text" : ""}`}>
      {fill && <FillSignBar fill={fill} />}
      {definition.pages.map((page, index) => (
        <FitSheet width={PAGE_WIDTH} key={index}>
          <ReplicaPage
            page={index + 1}
            src={page.src}
            layer={definition.display === "digital" ? page.layer : undefined}
            ratio={page.width / page.height}
            title={definition.title}
            fields={fields.filter(field => isPlaced(field) && field.placement!.page === index + 1)}
            prefix={prefix}
            answers={answers}
            errors={errors}
            onChange={onChange}
            adjust={adjust}
            fill={fill}
            onPlace={place}
            onLayerText={onLayerText}
          />
        </FitSheet>
      ))}
      {pendingSignature && fill && (
        <SignatureDialog
          onCancel={() => { setPendingSignature(null); fill.setTool(null); }}
          onApply={signature => {
            fill.setSignature(signature);
            const { page, x, y, ratio } = pendingSignature;
            setPendingSignature(null);
            const mark = { ...annotationAt("signature", x, y, ratio), page, ...signature };
            fill.onChange([...fill.annotations, mark]);
            fill.setSelected(mark.id);
            fill.setTool(null);
          }}
        />
      )}
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

function ReplicaPage({ page, src, layer, ratio, title, fields, prefix, answers, errors, onChange, adjust, fill, onPlace, onLayerText }: {
  page: number;
  src: string;
  layer?: PageLayer;
  ratio: number;
  title: string;
  fields: FormField[];
  prefix: string;
  answers: FormAnswers;
  errors: Record<string, string>;
  onChange: (fieldId: string, value: FormAnswer) => void;
  adjust?: ReplicaAdjust;
  fill?: FillSign;
  onPlace: (page: number, x: number, y: number, ratio: number) => void;
  onLayerText?: LayerTextEdit;
}) {
  const pageRef = useRef<HTMLDivElement>(null);
  const drawing = useRef<{ fieldId: string; start: { x: number; y: number } } | null>(null);
  const onPaper = (target: EventTarget | null, current: HTMLElement) => target === current || (target as HTMLElement).tagName === "IMG" || (target as HTMLElement).classList?.contains("rp-layer");

  // a click on bare paper places the active mark, or drops the selection
  const clickPaper = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!fill || !pageRef.current || !onPaper(event.target, event.currentTarget)) return;
    if (fill.tool) {
      const point = pageFraction(pageRef.current, event.clientX, event.clientY);
      onPlace(page, point.x, point.y, ratio);
    } else {
      fill.setSelected(null);
    }
  };

  const startDraw = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!adjust?.armed || !pageRef.current || !onPaper(event.target, event.currentTarget)) return;
    event.preventDefault();
    drawing.current = { fieldId: adjust.armed, start: pageFraction(pageRef.current, event.clientX, event.clientY) };
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* pointer already gone */ }
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
      className={`replica-page${layer ? " digital" : ""}${adjust?.armed ? " replica-drawing" : ""}`}
      style={{ "--ratio": ratio, width: PAGE_WIDTH, height: Math.round(PAGE_WIDTH / ratio) } as CSSProperties}
      onPointerDown={adjust ? startDraw : undefined}
      onPointerUp={adjust ? endDraw : undefined}
      onClick={fill ? clickPaper : undefined}
    >
      {layer ? <DigitalPage layer={layer} ratio={ratio} onText={onLayerText ? (index, text) => onLayerText(page, index, text) : undefined} /> : <img src={src} alt={`${title || "Form"} - page ${page}`} draggable={false} />}
      {fields.map(field => (
        <ReplicaField key={field.id} field={field} ratio={ratio} pageRef={pageRef} prefix={prefix} value={answers[field.id]} error={errors[field.id]} onChange={value => onChange(field.id, value)} adjust={adjust} />
      ))}
      {fill && <AnnotationLayer page={page} ratio={ratio} pageRef={pageRef} fill={fill} />}
    </div>
  );
}

const FONT_STACKS: Record<string, string> = {
  arial: "Arial, 'Liberation Sans', Helvetica, sans-serif",
  "arial-narrow": "'Arial Narrow', 'Liberation Sans Narrow', Arial, sans-serif",
  calibri: "Calibri, Carlito, 'Segoe UI', Arial, sans-serif",
  cambria: "Cambria, Caladea, Georgia, serif",
  times: "'Times New Roman', Tinos, 'Liberation Serif', Times, serif",
  georgia: "Georgia, 'Times New Roman', serif",
  garamond: "Garamond, 'EB Garamond', Georgia, serif",
  verdana: "Verdana, Geneva, sans-serif",
  tahoma: "Tahoma, Geneva, sans-serif",
  segoe: "'Segoe UI', Tahoma, Arial, sans-serif",
  trebuchet: "'Trebuchet MS', Tahoma, sans-serif",
  mono: "'Courier New', Cousine, Courier, monospace",
  century: "'Century Schoolbook', 'Century Gothic', Georgia, serif",
  palatino: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
  comic: "'Comic Sans MS', 'Comic Neue', cursive",
  impact: "Impact, 'Arial Black', sans-serif",
  sans: "Arial, Helvetica, sans-serif",
};

/**
 * The page rebuilt from its own text and shapes: every run sits where it was
 * printed, in the printed face, size and ink, and is stretched or squeezed by
 * a hair so a substitute font still fills exactly the printed width.
 */
function DigitalPage({ layer, ratio, onText }: { layer: PageLayer; ratio: number; onText?: (index: number, text: string) => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let cancelled = false;
    const fit = () => {
      if (cancelled) return;
      const pageWidth = root.getBoundingClientRect().width;
      if (!pageWidth) return;
      root.querySelectorAll<HTMLElement>(".rp-text").forEach(span => {
        span.style.transform = "";
        const natural = span.getBoundingClientRect().width;
        const target = Number(span.dataset.w) * pageWidth;
        if (!natural || !target) return;
        const scale = Math.min(1.3, Math.max(0.6, target / natural));
        if (Math.abs(scale - 1) > 0.015) span.style.transform = `scaleX(${scale.toFixed(4)})`;
      });
    };
    fit();
    // substitute fonts may still be loading on first paint
    void document.fonts?.ready.then(fit);
    return () => { cancelled = true; };
  }, [layer]);
  const box = (shape: { x: number; y: number; w: number; h: number }): CSSProperties => ({ left: `${shape.x * 100}%`, top: `${shape.y * 100}%`, width: `${shape.w * 100}%`, height: `${shape.h * 100}%` });
  return (
    <div ref={rootRef} className={`rp-layer${onText ? " editable" : ""}`} aria-hidden={onText ? undefined : "true"}>
      {layer.fills.map((fill, index) => <div key={`f${index}`} className="rp-fill" style={{ ...box(fill), background: fill.c }} />)}
      {layer.pictures.map((picture, index) => <img key={`p${index}`} className="rp-picture" src={picture.src} alt="" draggable={false} style={box(picture)} />)}
      {layer.rules.map((rule, index) => {
        // hairlines keep at least one device pixel; dotted rules use a border instead of a fill
        const horizontal = rule.w >= rule.h * ratio;
        const style: CSSProperties = { ...box(rule), [horizontal ? "minHeight" : "minWidth"]: "1px" };
        if (rule.d) return <div key={`r${index}`} className="rp-rule dotted" style={{ ...style, borderTop: horizontal ? `max(1px, ${(rule.h * 100).toFixed(3)}cqh) dotted ${rule.c}` : undefined, borderLeft: horizontal ? undefined : `max(1px, ${(rule.w * 100).toFixed(3)}cqw) dotted ${rule.c}`, height: horizontal ? 0 : style.height, width: horizontal ? style.width : 0 }} />;
        return <div key={`r${index}`} className="rp-rule" style={{ ...style, background: rule.c }} />;
      })}
      {layer.frames.map((frame, index) => <div key={`b${index}`} className="rp-frame" style={{ ...box(frame), borderColor: frame.c, borderWidth: `max(1px, ${((frame.t ?? 0.001) * 100).toFixed(3)}cqw)` }} />)}
      {layer.combs.map((comb, index) => {
        const n = comb.n ?? 1;
        const stroke = `max(1px, ${((comb.t ?? 0.001) * 100).toFixed(3)}cqw)`;
        return (
          <div
            key={`c${index}`}
            className="rp-frame rp-comb"
            style={{
              ...box(comb),
              borderColor: comb.c,
              borderWidth: stroke,
              // one divider per character box
              backgroundImage: `repeating-linear-gradient(to right, transparent, transparent calc(100% / ${n} - ${stroke}), ${comb.c} calc(100% / ${n} - ${stroke}), ${comb.c} calc(100% / ${n}))`,
            }}
          />
        );
      })}
      {layer.text.map((run, index) => (
        <span
          key={`t${index}`}
          className="rp-text"
          data-w={run.w}
          contentEditable={onText ? true : undefined}
          suppressContentEditableWarning
          spellCheck={false}
          title={onText ? "Click to edit this text; clear it to remove it" : undefined}
          onBlur={onText ? event => { const next = (event.currentTarget.textContent ?? "").replace(/\s+/g, " ").trim(); if (next !== run.t) onText(index, next); } : undefined}
          onKeyDown={onText ? event => { if (event.key === "Enter") { event.preventDefault(); event.currentTarget.blur(); } } : undefined}
          style={{
            left: `${run.x * 100}%`,
            // the run box starts 0.8 em above the baseline; an Arial line box puts its baseline 0.847 em down
            top: `${(run.y - run.s * ratio * 0.047) * 100}%`,
            fontSize: `${(run.s * 100).toFixed(4)}cqw`,
            fontFamily: FONT_STACKS[run.f] ?? FONT_STACKS.sans,
            fontWeight: run.b ? 700 : 400,
            fontStyle: run.i ? "italic" : "normal",
            color: run.c,
          }}
        >
          {run.t}
        </span>
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
  } else if (placement.comb && placement.comb >= 2) {
    // a comb: each character is drawn centred in its own printed box, in the
    // page's face; the real input sits invisibly on top for typing
    const comb = placement.comb;
    const chars = [...text].slice(0, comb);
    control = (
      <div className={`replica-comb${errorClass}`} style={{ "--n": comb } as CSSProperties}>
        <div className="replica-comb-cells" aria-hidden="true">
          {Array.from({ length: comb }, (_, index) => (
            <span key={index} className={`replica-comb-cell${index === chars.length ? " caret" : ""}`}>{chars[index] ?? ""}</span>
          ))}
        </div>
        <input
          id={id}
          className="replica-input replica-comb-input"
          type="text"
          inputMode={field.type === "number" || field.type === "tel" ? "numeric" : undefined}
          value={text}
          maxLength={comb}
          autoComplete="off"
          aria-label={field.label}
          title={error || field.helpText || field.label}
          onChange={event => onChange([...event.target.value].slice(0, comb).join(""))}
        />
      </div>
    );
  } else {
    control = (
      <input
        id={id}
        className={`replica-input${field.type === "signature" ? " paper-signature" : ""}${errorClass}`}
        type={field.type === "signature" ? "text" : field.type}
        value={text}
        step={field.type === "number" ? "any" : undefined}
        maxLength={field.maxLength || (field.type === "number" ? undefined : 2000)}
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
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* pointer already gone */ }
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
