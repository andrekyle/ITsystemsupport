import { useId, useState, type ReactNode } from "react";
import { Icon } from "../icons";

export function EditableActivityText({
  text,
  original,
  label,
  editable,
  onSave,
  children,
}: {
  text: string;
  original: string;
  label: string;
  editable: boolean;
  onSave: (text: string) => void;
  children: ReactNode;
}) {
  const inputId = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState("");

  if (!editable) return <>{children}</>;

  const cancel = () => {
    setDraft(null);
    setError("");
  };
  const save = () => {
    if (draft === null || !draft.trim()) return;
    try {
      onSave(draft);
      cancel();
    } catch {
      setError("Your changes could not be saved. Please try again.");
    }
  };

  if (draft !== null) {
    return (
      <div style={{ minWidth: 0, margin: "8px 0 16px" }}>
        <div className="field">
          <label htmlFor={inputId}>{label}</label>
          <textarea
            id={inputId}
            autoFocus
            value={draft}
            rows={text.includes("\n") ? 12 : 5}
            style={{ resize: "vertical", overflowY: "auto", minHeight: 120, maxHeight: "65vh", color: "var(--ink)", lineHeight: 1.6 }}
            onChange={(event) => { setDraft(event.target.value); setError(""); }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                cancel();
              }
            }}
          />
        </div>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingRight: 48 }}>
          <button type="button" className="btn primary" style={{ minHeight: 44 }} onClick={save} disabled={!draft.trim()}>
            <Icon name="check" size={16} /> Save
          </button>
          <button type="button" className="btn ghost" style={{ minHeight: 44 }} onClick={cancel}>
            <Icon name="close" size={16} /> Cancel
          </button>
          <button type="button" className="btn ghost" style={{ minHeight: 44 }} onClick={() => { setDraft(original); setError(""); }} disabled={draft === original}>
            <Icon name="refresh" size={16} /> Restore original
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      <button
        type="button"
        className="btn ghost no-print"
        style={{ flexShrink: 0, width: 44, height: 44, padding: 0 }}
        aria-label={`Edit ${label.toLowerCase()}`}
        title={`Edit ${label.toLowerCase()}`}
        onClick={() => { setDraft(text); setError(""); }}
      >
        <Icon name="document" size={17} />
      </button>
    </div>
  );
}