import { useState } from "react";
import { activeCourse, courseStorageKey, saveCustomCourse, type CourseData } from "../data/courses";
import { flushKey } from "../lib/sync";
import { supabase } from "../lib/supabase";
import { InlineText } from "./InlineText";

export function useInlineCourse(allowed: boolean) {
  const [course, setCourse] = useState(activeCourse);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canEdit = allowed && course.id.startsWith("custom-");
  const change = (update: (draft: CourseData) => void) => setCourse(current => {
    const next = structuredClone(current); update(next); return next;
  });
  const text = (value: string | number, update: (draft: CourseData, value: string) => void, label: string) =>
    <InlineText value={String(value)} editable={canEdit && editing && !busy} placeholder={label} onSave={value => change(draft => update(draft, value))} />;
  async function save() {
    setBusy(true); setError("");
    try {
      if (!course.meta.title.trim() || course.modules.some(m => !m.name.trim() || m.units.some(u => !u.title.trim()))) throw new Error("Course, module and unit titles cannot be empty.");
      const units = course.modules.flatMap(m => m.units);
      if (units.some(u => !u.us.trim()) || new Set(units.map(u => u.us)).size !== units.length) throw new Error("Unit codes must be unique and non-empty.");
      if ([course.meta.nqfLevel, ...units.map(u => u.nqf)].some(n => !Number.isInteger(n) || n < 1 || n > 10)
        || [course.meta.credits, ...units.map(u => u.credits)].some(n => !Number.isInteger(n) || n < 0)) throw new Error("Enter valid NQF levels (1–10) and non-negative credits.");
      saveCustomCourse({ ...course, label: `${course.meta.title} (${course.meta.saqaId})` });
      await flushKey(courseStorageKey(course.id), !!supabase);
      location.reload();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save course."); setBusy(false); }
  }
  const controls = canEdit && <div className="unit-editor-actions">
    {editing ? <>
      <button className="btn ghost sm" disabled={busy} onClick={() => void save()}>{busy ? "Saving..." : "Save changes"}</button>
      <button className="btn ghost sm" disabled={busy} onClick={() => { setCourse(activeCourse()); setEditing(false); setError(""); }}>Cancel</button>
      <span className="muted">Click text on the page to edit it.</span>
    </> : <button className="btn ghost sm" onClick={() => setEditing(true)}>Edit inline</button>}
    {error && <p role="alert" className="auth-error">{error}</p>}
  </div>;
  return { course, editing, busy, text, change, controls };
}
