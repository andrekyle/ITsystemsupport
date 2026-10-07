import { useRef, useState } from "react";
import { Icon } from "../icons";
import { fileToSignature } from "../lib/signature";

const REMOVED_SIGNATURE = "__signature_removed__";

export function DocumentSignature({
  value,
  savedSignature,
  label,
  onChange,
  className = "",
}: {
  value?: string;
  savedSignature?: string;
  label: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // A signature saved on the user's profile is the default for an empty
  // signature line, so it is visible in the document and its PDF immediately.
  const removed = value === REMOVED_SIGNATURE;
  const storedImage = value?.startsWith("data:image/") ? value : "";
  const image = storedImage || (!value && !removed ? savedSignature ?? "" : "");

  const chooseFile = () => inputRef.current?.click();
  const upload = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      onChange(await fileToSignature(file));
    } catch {
      setError("Choose a clear photo of a signature on plain paper.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`document-signature ${className}`.trim()}>
      {image ? (
        <img src={image} alt={label} />
      ) : value && !removed ? (
        <span className="document-signature-text">{value}</span>
      ) : (
        <span className="document-signature-empty">{removed ? "" : "Signature"}</span>
      )}
      <div className="document-signature-actions">
        {savedSignature && savedSignature !== image && (
          <button type="button" onClick={() => onChange(savedSignature)} title={`Use saved ${label.toLowerCase()}`} aria-label={`Use saved ${label.toLowerCase()}`}>
            <Icon name="checkCircle" size={12} />
          </button>
        )}
        <button type="button" onClick={chooseFile} disabled={busy} title={image || (value && !removed) ? `Edit ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`} aria-label={image || (value && !removed) ? `Edit ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`}>
          <Icon name={image || (value && !removed) ? "pencil" : "upload"} size={12} />
        </button>
        {(image || (value && !removed)) && <button type="button" onClick={() => onChange(REMOVED_SIGNATURE)} title={`Remove ${label.toLowerCase()}`} aria-label={`Remove ${label.toLowerCase()}`}><Icon name="close" size={12} /></button>}
      </div>
      <input
        ref={inputRef}
        className="document-signature-file"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; void upload(file); }}
        aria-label={`Upload ${label.toLowerCase()}`}
      />
      {error && <small role="alert">{error}</small>}
    </div>
  );
}
