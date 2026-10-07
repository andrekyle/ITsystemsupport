import { useRef, useState } from "react";
import { Icon } from "../icons";
import { fileToSignature } from "../lib/signature";

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
  const storedImage = value?.startsWith("data:image/") ? value : "";
  const image = storedImage || (!value ? savedSignature ?? "" : "");

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
      ) : value ? (
        <span className="document-signature-text">{value}</span>
      ) : (
        <span className="document-signature-empty">Signature</span>
      )}
      <div className="document-signature-actions">
        {savedSignature && savedSignature !== image && (
          <button type="button" onClick={() => onChange(savedSignature)} title={`Add ${label.toLowerCase()}`}>
            <Icon name="checkCircle" size={13} /> Use my signature
          </button>
        )}
        <button type="button" onClick={chooseFile} disabled={busy}>
          <Icon name="upload" size={13} /> {busy ? "Reading…" : image || value ? "Replace" : "Upload"}
        </button>
        {value && <button type="button" onClick={() => onChange("")} aria-label={`Remove ${label.toLowerCase()}`}><Icon name="close" size={13} /></button>}
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
