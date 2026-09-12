import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { Icon } from "../icons";
import { Modal } from "./Modal";
import type { FormAnnotation, FormAnnotationKind, FormBox } from "../lib/formSchema";

/** Acrobat-style Fill & Sign: place text, ticks, crosses, dots, lines and a
 *  signature anywhere on a replica page; move, resize and delete them. */
export type FillTool = FormAnnotationKind | null;

export interface FillSign {
  annotations: FormAnnotation[];
  onChange: (annotations: FormAnnotation[]) => void;
  tool: FillTool;
  setTool: (tool: FillTool) => void;
  selected: string | null;
  setSelected: (id: string | null) => void;
  /** a signature saved once, reused for every signature placed afterwards */
  signature: { text?: string; path?: string } | null;
  setSignature: (signature: { text?: string; path?: string } | null) => void;
}

const TOOLS: { kind: FormAnnotationKind; label: string; glyph: string; hint: string }[] = [
  { kind: "text", label: "Add text", glyph: "T", hint: "Click where the text should start, then type" },
  { kind: "tick", label: "Tick", glyph: "\u2713", hint: "Click a box to tick it" },
  { kind: "cross", label: "Cross", glyph: "\u2715", hint: "Click a box to cross it" },
  { kind: "dot", label: "Dot", glyph: "\u25CF", hint: "Click to place a dot" },
  { kind: "line", label: "Line", glyph: "\u2014", hint: "Click to place a line; drag its corner to stretch it" },
  { kind: "signature", label: "Sign", glyph: "\u270D", hint: "Click where the signature goes" },
];

export function FillSignBar({ fill }: { fill: FillSign }) {
  const active = TOOLS.find(tool => tool.kind === fill.tool);
  return (
    <div className="fill-bar no-print" role="toolbar" aria-label="Fill and sign">
      <span className="fill-bar-title">Fill &amp; sign</span>
      {TOOLS.map(tool => (
        <button
          key={tool.kind}
          type="button"
          className={`fill-tool${fill.tool === tool.kind ? " on" : ""}`}
          aria-pressed={fill.tool === tool.kind}
          title={tool.label}
          onClick={() => { fill.setTool(fill.tool === tool.kind ? null : tool.kind); fill.setSelected(null); }}
        >
          <span className={`fill-glyph fill-glyph-${tool.kind}`} aria-hidden="true">{tool.glyph}</span>
          <span>{tool.label}</span>
        </button>
      ))}
      {fill.signature && <button type="button" className="fill-tool" title="Forget the saved signature" onClick={() => fill.setSignature(null)}><Icon name="close" size={14} /> <span>Clear signature</span></button>}
      <span className="fill-hint" role="status">{active ? `${active.hint}. Esc to finish.` : fill.annotations.length ? "Click a mark to move, resize or delete it." : "Type in the boxes, or use a tool to write anywhere on the page."}</span>
    </div>
  );
}

const round = (v: number) => Math.round(v * 10000) / 10000;

/** Default box for a mark placed at a page point (fractions). */
export function annotationAt(kind: FormAnnotationKind, x: number, y: number, ratio: number): FormAnnotation {
  const id = `a_${Math.random().toString(36).slice(2, 10)}`;
  const square = (size: number) => ({ w: size, h: size * ratio });
  switch (kind) {
    case "text": {
      const size = 0.0135;
      return { id, kind, page: 1, x: round(x), y: round(y - size * ratio * 0.7), w: 0.2, h: round(size * ratio * 1.4), text: "", size };
    }
    case "tick":
    case "cross":
    case "dot": {
      const box = square(kind === "dot" ? 0.012 : 0.018);
      return { id, kind, page: 1, x: round(x - box.w / 2), y: round(y - box.h / 2), w: round(box.w), h: round(box.h) };
    }
    case "line":
      return { id, kind, page: 1, x: round(x), y: round(y - 0.001), w: 0.15, h: 0.002 };
    case "signature":
      return { id, kind, page: 1, x: round(x), y: round(y - 0.02), w: 0.22, h: round(0.045 * ratio) };
  }
}

function pageFraction(element: HTMLElement, clientX: number, clientY: number) {
  const rect = element.getBoundingClientRect();
  return { x: Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)), y: Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)) };
}

const clampBox = (box: FormBox, minW = 0.004, minH = 0.002): FormBox => {
  const w = Math.min(Math.max(box.w, minW), 1);
  const h = Math.min(Math.max(box.h, minH), 1);
  return { x: round(Math.min(Math.max(box.x, 0), 1 - w)), y: round(Math.min(Math.max(box.y, 0), 1 - h)), w: round(w), h: round(h) };
};

/** The marks on one page. */
export function AnnotationLayer({ page, ratio, pageRef, fill, print }: {
  page: number;
  ratio: number;
  pageRef: RefObject<HTMLDivElement>;
  fill: FillSign;
  /** read-only rendering (no handles) */
  print?: boolean;
}) {
  const update = (id: string, patch: Partial<FormAnnotation>) => fill.onChange(fill.annotations.map(item => item.id === id ? { ...item, ...patch } : item));
  const remove = (id: string) => { fill.onChange(fill.annotations.filter(item => item.id !== id)); fill.setSelected(null); };
  useEffect(() => {
    if (print) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { fill.setTool(null); fill.setSelected(null); return; }
      if ((event.key === "Delete" || event.key === "Backspace") && fill.selected) {
        const target = event.target as HTMLElement | null;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
        event.preventDefault();
        remove(fill.selected);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  return (
    <>
      {fill.annotations.filter(item => item.page === page).map(item => (
        <Mark key={item.id} item={item} ratio={ratio} pageRef={pageRef} selected={!print && fill.selected === item.id} onSelect={() => { fill.setSelected(item.id); fill.setTool(null); }} onChange={patch => update(item.id, patch)} onRemove={() => remove(item.id)} readOnly={!!print} />
      ))}
    </>
  );
}

function Mark({ item, ratio, pageRef, selected, onSelect, onChange, onRemove, readOnly }: {
  item: FormAnnotation;
  ratio: number;
  pageRef: RefObject<HTMLDivElement>;
  selected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<FormAnnotation>) => void;
  onRemove: () => void;
  readOnly: boolean;
}) {
  const gesture = useRef<{ kind: "move" | "resize"; start: { x: number; y: number }; box: FormBox } | null>(null);
  const begin = (kind: "move" | "resize") => (event: ReactPointerEvent<HTMLElement>) => {
    if (readOnly || !pageRef.current) return;
    event.stopPropagation();
    onSelect();
    gesture.current = { kind, start: pageFraction(pageRef.current, event.clientX, event.clientY), box: { x: item.x, y: item.y, w: item.w, h: item.h } };
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* pointer already gone */ }
  };
  const move = (event: ReactPointerEvent<HTMLElement>) => {
    const current = gesture.current;
    if (!current || !pageRef.current) return;
    const point = pageFraction(pageRef.current, event.clientX, event.clientY);
    const dx = point.x - current.start.x;
    const dy = point.y - current.start.y;
    if (current.kind === "move") onChange(clampBox({ ...current.box, x: current.box.x + dx, y: current.box.y + dy }));
    else {
      const next = clampBox({ ...current.box, w: current.box.w + dx, h: item.kind === "line" ? current.box.h : current.box.h + dy });
      // text grows with its box; symbols stay square
      if (item.kind === "text") onChange({ ...next, size: round(Math.max(0.006, Math.min(0.08, next.h / 1.4 / ratio))) });
      else if (item.kind === "tick" || item.kind === "cross" || item.kind === "dot") onChange({ ...next, h: round(next.w * ratio) });
      else onChange(next);
    }
  };
  const end = () => { gesture.current = null; };
  const style: CSSProperties = {
    left: `${item.x * 100}%`,
    top: `${item.y * 100}%`,
    width: `${item.w * 100}%`,
    height: `${item.h * 100}%`,
    fontSize: item.kind === "text" ? `${((item.size ?? 0.0135) * 100).toFixed(3)}cqw` : `${(item.h * 100 * 0.8).toFixed(3)}cqh`,
  };
  const dragProps = readOnly ? {} : { onPointerDown: begin("move"), onPointerMove: move, onPointerUp: end, onPointerCancel: end };
  return (
    <div className={`fill-mark fill-mark-${item.kind}${selected ? " selected" : ""}${readOnly ? " readonly" : ""}`} style={style} data-annotation={item.id}>
      {item.kind === "text" ? (
        <>
          {!readOnly && <span className="fill-grip" title="Drag to move" {...dragProps}>{"\u2807"}</span>}
          <input
            className="fill-text"
            value={item.text ?? ""}
            placeholder="Type here"
            aria-label="Added text"
            readOnly={readOnly}
            autoFocus={!readOnly && selected && !item.text}
            style={{ width: `calc(${Math.max(4, (item.text ?? "").length + 1)}ch + 0.6em)` }}
            onFocus={onSelect}
            onChange={event => onChange({ text: event.target.value })}
          />
        </>
      ) : item.kind === "signature" ? (
        <div className="fill-signature" {...dragProps}>
          {item.path ? (
            <svg viewBox="0 0 1 1" preserveAspectRatio="none" aria-label="Signature"><path d={item.path} fill="none" stroke="#1a237e" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" /></svg>
          ) : <span className="fill-signature-text">{item.text}</span>}
        </div>
      ) : (
        <div className={`fill-symbol fill-symbol-${item.kind}`} {...dragProps} aria-label={item.kind}>
          {item.kind === "tick" ? "\u2713" : item.kind === "cross" ? "\u2715" : item.kind === "dot" ? "\u25CF" : ""}
        </div>
      )}
      {selected && !readOnly && (
        <>
          <button type="button" className="fill-remove" title="Remove" aria-label="Remove mark" onPointerDown={event => event.stopPropagation()} onClick={onRemove}><Icon name="close" size={12} /></button>
          <span className="fill-handle" aria-hidden="true" onPointerDown={begin("resize")} onPointerMove={move} onPointerUp={end} onPointerCancel={end} />
        </>
      )}
    </div>
  );
}

/** Type a name or draw with the pointer; the result is reused for every signature placed. */
export function SignatureDialog({ onApply, onCancel }: { onApply: (signature: { text?: string; path?: string }) => void; onCancel: () => void }) {
  const [mode, setMode] = useState<"draw" | "type">("draw");
  const [name, setName] = useState("");
  const [strokes, setStrokes] = useState<{ x: number; y: number }[][]>([]);
  const drawing = useRef(false);
  const padRef = useRef<HTMLDivElement>(null);
  const point = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = padRef.current!.getBoundingClientRect();
    return { x: round((event.clientX - rect.left) / rect.width), y: round((event.clientY - rect.top) / rect.height) };
  };
  const path = strokes.map(stroke => stroke.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" ")).join(" ");
  const canApply = mode === "draw" ? strokes.some(stroke => stroke.length > 1) : name.trim().length > 0;
  return (
    <Modal
      title="Your signature"
      onClose={onCancel}
      actions={(
        <>
          <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
          {mode === "draw" && <button type="button" className="btn ghost" onClick={() => setStrokes([])} disabled={!strokes.length}>Clear</button>}
          <button type="button" className="btn primary" disabled={!canApply} onClick={() => onApply(mode === "draw" ? { path } : { text: name.trim() })}>Use signature</button>
        </>
      )}
    >
      <div className="fb-mode" role="tablist" aria-label="Signature type">
        <button type="button" role="tab" aria-selected={mode === "draw"} onClick={() => setMode("draw")}>Draw</button>
        <button type="button" role="tab" aria-selected={mode === "type"} onClick={() => setMode("type")}>Type</button>
      </div>
      {mode === "draw" ? (
        <div
          ref={padRef}
          className="fill-pad"
          role="img"
          aria-label="Signature drawing area"
          onPointerDown={event => { drawing.current = true; try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* pointer already gone */ } setStrokes(current => [...current, [point(event)]]); }}
          onPointerMove={event => { if (!drawing.current) return; const p = point(event); setStrokes(current => { const next = current.slice(); next[next.length - 1] = [...next[next.length - 1], p]; return next; }); }}
          onPointerUp={() => { drawing.current = false; }}
          onPointerCancel={() => { drawing.current = false; }}
        >
          <svg viewBox="0 0 1 1" preserveAspectRatio="none"><path d={path} fill="none" stroke="#1a237e" strokeWidth={2.5} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" /></svg>
          {!strokes.length && <span className="fill-pad-hint">Sign here with your mouse, pen or finger</span>}
        </div>
      ) : (
        <div className="field">
          <label htmlFor="fill-sign-name">Full name</label>
          <input id="fill-sign-name" value={name} maxLength={80} autoFocus onChange={event => setName(event.target.value)} />
          <div className="fill-signature-preview fill-signature-text" aria-hidden="true">{name || "Your name"}</div>
        </div>
      )}
    </Modal>
  );
}
