import { useState } from "react";
import { Icon } from "../icons";

export function DocumentActions({ name }: { name: string }) {
  const [saved, setSaved] = useState(false);

  const save = () => {
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  };

  return (
    <div className="document-actions no-print" role="toolbar" aria-label={`${name} actions`}>
      <button type="button" className={saved ? "is-saved" : ""} onClick={save} title={saved ? "Saved" : `Save ${name}`} aria-label={`Save ${name}`}>
        <Icon name="checkCircle" size={18} />
      </button>
      <button type="button" onClick={() => window.print()} title={`Download ${name} as PDF`} aria-label={`Download ${name} as PDF`}>
        <Icon name="download" size={18} />
      </button>
      {saved && <span role="status">Saved</span>}
    </div>
  );
}
