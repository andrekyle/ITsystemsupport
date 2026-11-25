import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { Icon } from "../icons";
import { fileToSignature, REMOVED_SIGNATURE_REFERENCE, SAVED_SIGNATURE_REFERENCE } from "../lib/signature";
import { EditingTools } from "./EditingSidebar";
import { Modal } from "./Modal";

export function DocumentSignature({
  value,
  savedSignature,
  label,
  onChange,
  className = "",
  editable = true,
}: {
  value?: string;
  savedSignature?: string;
  label: string;
  onChange: (value: string) => void;
  className?: string;
  /** False keeps another role's signature visible but prevents replacing it. */
  editable?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [localValue, setLocalValue] = useState(value ?? "");
  const [drawOpen, setDrawOpen] = useState(false);
  const [hasDrawing, setHasDrawing] = useState(false);
  useEffect(() => setLocalValue(value ?? ""), [value]);
  useEffect(() => {
    if (!drawOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const frame = requestAnimationFrame(() => {
      const bounds = canvas.getBoundingClientRect();
      const scale = window.devicePixelRatio || 1;
      canvas.width = Math.round(bounds.width * scale);
      canvas.height = Math.round(bounds.height * scale);
      const context = canvas.getContext("2d");
      if (!context) {
        setError("Signature drawing is not supported in this browser.");
        return;
      }
      context.scale(scale, scale);
      context.strokeStyle = "#172b3a";
      context.lineWidth = 2.4;
      context.lineCap = "round";
      context.lineJoin = "round";
    });
    return () => cancelAnimationFrame(frame);
  }, [drawOpen]);
  const applyValue = (next: string) => {
    setLocalValue(next);
    setError("");
    try { onChange(next); }
    catch { setError("The signature change could not be saved. Please try again."); }
  };
  const removed = localValue === REMOVED_SIGNATURE_REFERENCE;
  const usesSavedSignature = localValue === SAVED_SIGNATURE_REFERENCE;
  const storedImage = localValue.startsWith("data:image/") ? localValue : "";
  // Do not insert the profile signature implicitly. The user deliberately
  // chooses either their saved signature or an image from this device.
  const image = storedImage || (usesSavedSignature ? savedSignature ?? "" : "");

  const chooseFile = () => inputRef.current?.click();
  const signWithSavedSignature = () => applyValue(SAVED_SIGNATURE_REFERENCE);
  const openDrawing = () => {
    setError("");
    setHasDrawing(false);
    setDrawOpen(true);
  };
  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  };
  const startDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const canvas = event.currentTarget;
    const context = canvas.getContext("2d");
    if (!context) {
      setError("Signature drawing is not supported in this browser.");
      return;
    }
    const position = point(event);
    canvas.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(position.x, position.y);
    context.lineTo(position.x + 0.1, position.y + 0.1);
    context.stroke();
    context.beginPath();
    context.moveTo(position.x, position.y);
    drawing.current = true;
    setHasDrawing(true);
  };
  const continueDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    const position = point(event);
    context.lineTo(position.x, position.y);
    context.stroke();
    context.beginPath();
    context.moveTo(position.x, position.y);
  };
  const stopDrawing = () => {
    drawing.current = false;
  };
  const clearDrawing = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (canvas && context) {
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.restore();
    }
    drawing.current = false;
    setHasDrawing(false);
  };
  const saveDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawing) return;
    try {
      const output = document.createElement("canvas");
      const scale = Math.min(1, 480 / canvas.width);
      output.width = Math.max(1, Math.round(canvas.width * scale));
      output.height = Math.max(1, Math.round(canvas.height * scale));
      const context = output.getContext("2d");
      if (!context) throw new Error("Could not prepare signature image.");
      context.fillStyle = "#fff";
      context.fillRect(0, 0, output.width, output.height);
      context.drawImage(canvas, 0, 0, output.width, output.height);
      applyValue(output.toDataURL("image/jpeg", 0.82));
      setDrawOpen(false);
      setHasDrawing(false);
    } catch (drawError) {
      setError(drawError instanceof Error ? drawError.message : "Could not save this signature.");
    }
  };
  const upload = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      applyValue(await fileToSignature(file));
    } catch {
      setError("Choose a clear photo of a signature on plain paper.");
    } finally {
      setBusy(false);
    }
  };
  const remove = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (inputRef.current) inputRef.current.value = "";
    setLocalValue(REMOVED_SIGNATURE_REFERENCE);
    setError("");
    try { onChange(REMOVED_SIGNATURE_REFERENCE); }
    catch { setError("The signature could not be removed. Please try again."); }
  };

  const active = editable && (busy || !!error);
  const tools = editable && <div className={active ? "unit-editor-actions" : "document-signature-actions"}>
        {savedSignature && savedSignature !== image && (
          <button type="button" className={active ? "btn ghost sm" : undefined} disabled={busy} onClick={(event) => { event.stopPropagation(); signWithSavedSignature(); }} title={`Use uploaded ${label.toLowerCase()}`} aria-label={`Use uploaded ${label.toLowerCase()}`}>
            <Icon name="checkCircle" size={12} />
          </button>
        )}
        <button type="button" className={active ? "btn ghost sm" : undefined} onClick={(event) => { event.stopPropagation(); openDrawing(); }} disabled={busy} title={`Draw ${label.toLowerCase()}`} aria-label={`Draw ${label.toLowerCase()}`}>
          <Icon name="pencil" size={12} />
        </button>
        <button type="button" className={active ? "btn ghost sm" : undefined} onClick={(event) => { event.stopPropagation(); chooseFile(); }} disabled={busy} title={image || (localValue && !removed) ? `Edit ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`} aria-label={image || (localValue && !removed) ? `Edit ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`}>
          <Icon name={image || (localValue && !removed) ? "pencil" : "upload"} size={12} />
        </button>
        {(image || (localValue && !removed)) && <button type="button" className={active ? "btn ghost sm" : undefined} disabled={busy} onPointerDown={event => event.stopPropagation()} onClick={remove} title={`Remove ${label.toLowerCase()}`} aria-label={`Remove ${label.toLowerCase()}`}><Icon name="close" size={12} /></button>}
        {busy && <span role="status">Saving signature...</span>}
        {error && <><p className="auth-error" role="alert">{error}</p><button type="button" className="btn ghost sm" onClick={() => setError("")}>Done</button></>}
      </div>;
  return (
    <div className={`document-signature ${className}`.trim()}>
      {image ? (
        <img src={image} alt={label} />
      ) : localValue && !removed ? (
        <span className="document-signature-text">{localValue}</span>
      ) : editable && savedSignature ? (
        <button type="button" className="document-signature-use-saved" disabled={busy} onClick={signWithSavedSignature}>
          Use saved signature
        </button>
      ) : editable ? (
        <button type="button" className="document-signature-use-saved" disabled={busy} onClick={openDrawing}>
          Draw signature
        </button>
      ) : (
        <span className="document-signature-empty">{removed ? "" : "Signature"}</span>
      )}
      {active ? <EditingTools active title={label}>{tools}</EditingTools> : tools}
      {editable && <input
        ref={inputRef}
        className="document-signature-file"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; void upload(file); }}
        aria-label={`Upload ${label.toLowerCase()}`}
      />}
      {drawOpen && <Modal
        className="signature-draw-modal"
        title={`Draw ${label}`}
        onClose={() => setDrawOpen(false)}
        actions={<>
          <button type="button" className="btn ghost" onClick={() => setDrawOpen(false)}>Cancel</button>
          <button type="button" className="btn primary" disabled={!hasDrawing || busy} onClick={saveDrawing}>Save signature</button>
        </>}
      >
        <p className="signature-draw-help">Draw with your mouse, finger, or stylus.</p>
        <canvas
          ref={canvasRef}
          className="signature-draw-canvas"
          aria-label={`Draw ${label}`}
          onPointerDown={startDrawing}
          onPointerMove={continueDrawing}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
        />
        <div className="signature-draw-footer">
          {error && <p role="alert" className="auth-error">{error}</p>}
          <button type="button" className="btn ghost" onClick={clearDrawing}>Clear</button>
        </div>
      </Modal>}
    </div>
  );
}
