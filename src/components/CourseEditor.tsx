import { useState } from "react";
import { activeCourse, courseStorageKey, saveCustomCourse, type CourseData } from "../data/courses";
import { UnitContentEditor } from "./UnitContentEditor";
import { fileToImageDataUrl } from "./Avatar";
import { flushKey } from "../lib/sync";
import { supabase } from "../lib/supabase";

export function CourseEditor({ onClose }: { onClose: () => void }) {
  const [draft, setDraft] = useState(() => structuredClone(activeCourse()));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save() {
    setBusy(true); setError("");
    try {
      if (!draft.meta.title.trim() || draft.modules.some(module => !module.name.trim())) throw new Error("Enter a course title and a name for every module.");
      const codes = draft.modules.flatMap(module => module.units.map(unit => unit.us.trim()));
      if (codes.some(code => !code) || new Set(codes).size !== codes.length) throw new Error("Each unit must have a unique, non-empty code.");
      if (draft.modules.some(module => module.units.some(unit => !unit.title.trim()))) throw new Error("Enter a title for every unit.");
      saveCustomCourse(draft);
      await flushKey(courseStorageKey(draft.id), !!supabase);
      location.reload();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save course."); setBusy(false); }
  }
  return <section className="card course-editor">
    <h2>Edit course and modules</h2>
    <p>Update course headings, programme content, module tiles and unit details. Open a unit to edit its learning content and tabs.</p>
    <fieldset disabled={busy} style={{ border: 0, padding: 0, minWidth: 0 }}>
      <details className="unit-editor-group"><summary>Module tile images</summary>
        {draft.modules.map((module, index) => <div key={module.id} className="field">
          <label>{module.name} — image</label>
          {module.image && <img src={module.image} alt={module.name} style={{ width: 160, height: 90, objectFit: "cover", borderRadius: 6 }} />}
          <input type="file" accept="image/png,image/jpeg,image/webp" aria-label={`Upload image for ${module.name}`} onChange={async event => {
            const file = event.target.files?.[0]; if (!file) return;
            setBusy(true); setError("");
            try {
              if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
              const image = await fileToImageDataUrl(file);
              setDraft(current => ({ ...current, modules: current.modules.map((item, i) => i === index ? { ...item, image } : item) }));
            } catch (e) { setError(String(e)); } finally { setBusy(false); }
          }} />
          <button className="btn ghost sm" onClick={() => setDraft(current => ({ ...current, modules: current.modules.map((item, i) => i === index ? { ...item, image: undefined } : item) }))}>Remove image</button>
        </div>)}
      </details>
      <UnitContentEditor name="Course content" value={draft as never} onChange={value => setDraft(value as unknown as CourseData)} defaultOpen />
    </fieldset>
    {error && <p role="alert" className="auth-error">{error}</p>}
    <div className="unit-editor-actions">
      <button className="btn ghost" disabled={busy} onClick={() => void save()}>{busy ? "Saving…" : "Save course"}</button>
      <button className="btn ghost" disabled={busy} onClick={onClose}>Cancel</button>
    </div>
  </section>;
}
