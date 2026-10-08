import { useEffect, useRef, useState } from "react";
import { Icon } from "../icons";
import { fileToSignature, SAVED_SIGNATURE_REFERENCE } from "../lib/signature";

const REMOVED_SIGNATURE = "__signature_removed__";

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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [localValue, setLocalValue] = useState(value ?? "");
  useEffect(() => setLocalValue(value ?? ""), [value]);
  const applyValue = (next: string) => {
    setLocalValue(next);
    setError("");
    try { onChange(next); }
    catch { setError("The signature change could not be saved. Please try again."); }
  };
  const removed = localValue === REMOVED_SIGNATURE;
  const usesSavedSignature = localValue === SAVED_SIGNATURE_REFERENCE;
  const storedImage = localValue.startsWith("data:image/") ? localValue : "";
  // Do not insert the profile signature implicitly. The user deliberately
  // chooses either their saved signature or an image from this device.
  const image = storedImage || (usesSavedSignature ? savedSignature ?? "" : "");

  const chooseFile = () => inputRef.current?.click();
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
    setLocalValue(REMOVED_SIGNATURE);
    setError("");
    try { onChange(REMOVED_SIGNATURE); }
    catch { setError("The signature could not be removed. Please try again."); }
  };

  return (
    <div className={`document-signature ${className}`.trim()}>
      {image ? (
        <img src={image} alt={label} />
      ) : localValue && !removed ? (
        <span className="document-signature-text">{localValue}</span>
      ) : (
        <span className="document-signature-empty">{removed ? "" : "Signature"}</span>
      )}
      {editable && <div className="document-signature-actions">
        {savedSignature && savedSignature !== image && (
          <button type="button" onClick={(event) => { event.stopPropagation(); applyValue(savedSignature); }} title={`Use saved ${label.toLowerCase()}`} aria-label={`Use saved ${label.toLowerCase()}`}>
            <Icon name="checkCircle" size={12} />
          </button>
        )}
        <button type="button" onClick={(event) => { event.stopPropagation(); chooseFile(); }} disabled={busy} title={image || (localValue && !removed) ? `Edit ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`} aria-label={image || (localValue && !removed) ? `Edit ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`}>
          <Icon name={image || (localValue && !removed) ? "pencil" : "upload"} size={12} />
        </button>
        {(image || (localValue && !removed)) && <button type="button" onPointerDown={event => event.stopPropagation()} onClick={remove} title={`Remove ${label.toLowerCase()}`} aria-label={`Remove ${label.toLowerCase()}`}><Icon name="close" size={12} /></button>}
      </div>}
      {editable && <input
        ref={inputRef}
        className="document-signature-file"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; void upload(file); }}
        aria-label={`Upload ${label.toLowerCase()}`}
      />}
      {error && <small role="alert">{error}</small>}
    </div>
  );
}
