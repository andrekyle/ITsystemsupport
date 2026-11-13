import { useState } from "react";
import type { CourseModule, UnitStandard } from "../types";
import { Icon } from "../icons";
import { supabase } from "../lib/supabase";
import { loadContentModel, recordTokenUsage } from "../lib/tokens";

/** Actions stay inside the existing unit card; its content is edited in place. */
export function UnitLiveActions({ module, index, editing, onEdit, disabled, onChange, onBusyChange }: {
  module: CourseModule; index: number; editing: boolean; onEdit: (active: boolean) => void;
  disabled: boolean; onBusyChange: (active: boolean) => void; onChange: (update: (module: CourseModule) => void) => void;
}) {
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const unit = module.units[index];
  async function populate(unit: UnitStandard) {
    setPending(unit.us); setMessage(""); onBusyChange(true);
    try {
      const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
      const response = await fetch("/api/unit-metadata", { method: "POST", headers: { "Content-Type": "application/json", ...(data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {}) }, body: JSON.stringify({ us: unit.us, model: loadContentModel() }), signal: AbortSignal.timeout(60_000) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not suggest unit metadata.");
      const metadata = result.metadata;
      if (!metadata || !(metadata.title === null || typeof metadata.title === "string") || !(metadata.nqf === null || Number.isInteger(metadata.nqf) && metadata.nqf >= 1 && metadata.nqf <= 10) || !(metadata.credits === null || Number.isInteger(metadata.credits) && metadata.credits >= 0)) throw new Error("The AI returned invalid metadata.");
      onChange(mod => {
        const target = mod.units.find(item => item.us === unit.us);
        if (!target) return;
        for (const key of ["title", "nqf", "credits"] as const) {
          // Leave any field changed while the request was running untouched.
          if (metadata[key] !== null && target[key] === unit[key]) Object.assign(target, { [key]: metadata[key] });
        }
      });
      if (result.usage) void recordTokenUsage({ us: unit.us, model: result.model, promptTokens: Number(result.usage.prompt_tokens ?? 0), completionTokens: Number(result.usage.completion_tokens ?? 0), totalTokens: Number(result.usage.total_tokens ?? 0) });
      setMessage("SAQA metadata populated. Review the title, NQF level and credits, then Save changes.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not load metadata."); }
    finally { setPending(null); onBusyChange(false); }
  }
  return <span className="unit-live-actions" onClick={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()}>
    <span className="module-live-actions">
      <button type="button" className="btn ghost sm" disabled={disabled || !!pending} aria-pressed={editing} onClick={() => onEdit(!editing)}><Icon name="pencil" size={14} />{editing ? "Done editing" : "Edit unit"}</button>
      {editing && <>
        {/^\d+$/.test(unit.us) && <a href={`https://allqs.saqa.org.za/showUnitStandard.php?id=${unit.us}`} target="_blank" rel="noopener noreferrer">SAQA record</a>}
        <button type="button" className="btn ghost sm" disabled={disabled || !!pending || !/^\d+$/.test(unit.us)} onClick={() => void populate(unit)}><Icon name="sparkles" size={14} />{pending ? "Reading SAQA metadata..." : "AI fill metadata"}</button>
        <button type="button" className="btn ghost sm danger-text" disabled={disabled || !!pending} onClick={() => { onChange(mod => { mod.units.splice(index, 1); }); onEdit(false); }}><Icon name="trash" size={14} />Delete unit</button>
      </>}
    </span>
    {message && <span role="status" className="mini-note">{message}</span>}
  </span>;
}
