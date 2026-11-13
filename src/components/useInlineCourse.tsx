import { useCallback, useRef, useState } from "react";
import { activeCourse, courseStorageKey, saveCourseEdits, type CourseData } from "../data/courses";
import { flushKey } from "../lib/sync";
import { supabase } from "../lib/supabase";
import { InlineText } from "./InlineText";
import { usePhoneView } from "./usePhoneView";

export function useInlineCourse(allowed: boolean) {
  const phone = usePhoneView();
  const [course, setCourse] = useState(activeCourse);
  const original = useRef(structuredClone(course));
  const startEditing = () => {
    const latest = activeCourse();
    original.current = structuredClone(latest);
    setCourse(latest);
    setEditing(true);
  };
  const [editing, setEditing] = useState(false);
  const [saving, setBusy] = useState(false);
  const [pendingMetadata, setPendingMetadata] = useState(0);
  const metadataBusy = useCallback((active: boolean) => setPendingMetadata(count => Math.max(0, count + (active ? 1 : -1))), []);
  const busy = saving || pendingMetadata > 0;
  const [error, setError] = useState("");
  const canEdit = allowed && !phone;
  const change = (update: (draft: CourseData) => void) => setCourse(current => {
    const next = structuredClone(current); update(next); return next;
  });
  const text = (value: string | number, update: (draft: CourseData, value: string) => void, label: string, enabled = true) =>
    <InlineText value={String(value)} editable={enabled && canEdit && editing && !busy} placeholder={label} onSave={value => change(draft => update(draft, value))} />;
  async function save() {
    setBusy(true); setError("");
    try {
      if (!course.meta.title.trim() || course.modules.some(m => !m.name.trim() || m.units.some(u => !u.title.trim()))) throw new Error("Course, module and unit titles cannot be empty.");
      const units = course.modules.flatMap(m => m.units);
      if (units.some(u => !u.us.trim()) || new Set(units.map(u => u.us)).size !== units.length) throw new Error("Unit codes must be unique and non-empty.");
      if ([course.meta.nqfLevel, ...units.map(u => u.nqf)].some(n => !Number.isInteger(n) || n < 1 || n > 10)
        || [course.meta.credits, ...units.map(u => u.credits)].some(n => !Number.isInteger(n) || n < 0)) throw new Error("Enter valid NQF levels (1–10) and non-negative credits.");
      if (course.modules.some(m => !Number.isInteger(m.activities) || m.activities < 0)) throw new Error("Activities must be a non-negative whole number.");
      saveCourseEdits(original.current, course);
      await flushKey(courseStorageKey(course.id), !!supabase);
      location.reload();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save course."); setBusy(false); }
  }
  const controls = canEdit && <div className="unit-editor-actions">
    {editing ? <>
      <button className="btn ghost sm" disabled={busy} onClick={() => void save()}>{saving ? "Saving..." : pendingMetadata ? "Waiting for AI?" : "Save changes"}</button>
      <button className="btn ghost sm" disabled={busy} onClick={() => { setCourse(activeCourse()); setEditing(false); setError(""); }}>Cancel</button>
      <span className="muted">Click text on the page to edit it.</span>
      {error && <p role="alert" className="auth-error">{error}</p>}
    </> : <button className="btn ghost sm" onClick={startEditing}>Edit inline</button>}
  </div>;
  return { course, canEdit, startEditing, editing: canEdit && editing, busy, metadataBusy, text, change, controls };
}
